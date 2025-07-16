import Foundation

/// 향상된 뉴스 서비스 - 60+ RSS 소스 통합
class EnhancedNewsService: ObservableObject {
    
    static let shared = EnhancedNewsService()
    
    private let expandedRSSService = ExpandedFootballRSSService.shared
    private let cacheManager = EnhancedNewsCacheManager.shared
    private let deduplicationService = NewsDeduplicationService.shared
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// 확장된 RSS 소스에서 뉴스 가져오기
    func fetchExpandedNews(category: NewsCategory = .all, forceRefresh: Bool = false, sourceLimit: Int = 20) async throws -> [NewsArticle] {
        // 강제 새로고침이 아니고 캐시가 유효하면 캐시 반환
        if !forceRefresh, let cachedNews = cacheManager.getCachedNews(for: category) {
            print("📱 Returning cached news immediately")
            return cachedNews
        }
        
        // 카테고리에 따라 최적의 소스 선택
        let bestSources = ExpandedFootballRSSService.getBestSources(for: category, limit: sourceLimit)
        var allNews: [NewsArticle] = []
        
        // 병렬로 여러 소스에서 뉴스 가져오기
        await withTaskGroup(of: [NewsArticle].self) { group in
            for source in bestSources {
                group.addTask {
                    do {
                        return try await self.fetchFromExpandedSource(source, category: category)
                    } catch {
                        print("❌ Failed to fetch from \(source.displayName): \(error)")
                        return []
                    }
                }
            }
            
            for await newsItems in group {
                allNews.append(contentsOf: newsItems)
            }
        }
        
        // 고급 중복 제거 알고리즘 사용
        let deduplicatedNews = deduplicationService.deduplicateNews(allNews)
        
        print("🔍 Reduced from \(allNews.count) to \(deduplicatedNews.count) articles after deduplication")
        
        print("✅ Fetched \(deduplicatedNews.count) unique articles from \(bestSources.count) sources")
        
        // 캐시에 저장
        if !deduplicatedNews.isEmpty {
            cacheManager.cacheNews(deduplicatedNews, for: category)
        } else if let cachedNews = cacheManager.getCachedNews(for: category) {
            // 새 뉴스가 없으면 캐시 반환
            print("📋 Returning \(cachedNews.count) cached news articles")
            return cachedNews
        } else {
            // 캐시도 없으면 샘플 데이터 반환
            print("📋 Returning sample news as fallback")
            return EnhancedNewsCacheManager.getSampleNews(for: category)
        }
        
        return deduplicatedNews
    }
    
    /// 프리미엄 소스에서만 뉴스 가져오기
    func fetchPremiumNews(forceRefresh: Bool = false) async throws -> [NewsArticle] {
        if !forceRefresh, let cachedNews = cacheManager.getCachedNews(for: .all) {
            let premiumNews = cachedNews.filter { article in
                article.source.contains("[OFFICIAL]") || 
                article.source.contains("BBC") || 
                article.source.contains("Athletic") ||
                article.source.contains("Guardian")
            }
            if !premiumNews.isEmpty {
                return premiumNews
            }
        }
        
        var allNews: [NewsArticle] = []
        
        // 프리미엄 소스에서만 가져오기
        await withTaskGroup(of: [NewsArticle].self) { group in
            for source in ExpandedFootballRSSService.premiumSources {
                group.addTask {
                    do {
                        return try await self.fetchFromExpandedSource(source, category: .all)
                    } catch {
                        return []
                    }
                }
            }
            
            for await newsItems in group {
                allNews.append(contentsOf: newsItems)
            }
        }
        
        // 고급 중복 제거 알고리즘 사용
        let deduplicatedNews = deduplicationService.deduplicateNews(allNews)
        return deduplicatedNews
    }
    
    /// 특정 리그의 뉴스 가져오기
    func fetchLeagueNews(league: String, forceRefresh: Bool = false) async throws -> [NewsArticle] {
        let leagueSources = ExpandedFootballRSSService.getSourcesForLeague(league)
        var allNews: [NewsArticle] = []
        
        await withTaskGroup(of: [NewsArticle].self) { group in
            for source in leagueSources {
                group.addTask {
                    do {
                        return try await self.fetchFromExpandedSource(source, category: .all)
                    } catch {
                        return []
                    }
                }
            }
            
            for await newsItems in group {
                allNews.append(contentsOf: newsItems)
            }
        }
        
        // 고급 중복 제거 알고리즘 사용
        let deduplicatedNews = deduplicationService.deduplicateNews(allNews)
        return deduplicatedNews
    }
    
    // MARK: - Private Methods
    
    private func fetchFromExpandedSource(_ source: ExpandedFootballRSSService.ExpandedRSSSource, category: NewsCategory) async throws -> [NewsArticle] {
        guard let url = URL(string: source.rawValue) else {
            throw RSSError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        let parser = ExpandedRSSParser()
        let items = try parser.parseRSS(data: data)
        
        return items.compactMap { item in
            // 카테고리 자동 분류
            let detectedCategory = categorizeNews(item.title, item.description ?? "")
            
            // 요청된 카테고리와 일치하지 않으면 스킵
            if category != .all && detectedCategory != category {
                return nil
            }
            
            // 신뢰도 및 티어 평가
            let (trustTier, trustScore) = evaluateNewsTrust(item, source: source)
            
            return NewsArticle(
                title: formatTitle(item.title, source: source),
                summary: item.description ?? "No description available",
                source: formatExpandedSource(source, trustScore: trustScore, tier: trustTier),
                url: item.link,
                publishedAt: item.pubDate,
                category: detectedCategory,
                imageUrl: item.imageUrl
            )
        }
    }
    
    private func categorizeNews(_ title: String, _ description: String) -> NewsCategory {
        let fullText = "\(title) \(description)".lowercased()
        
        // 이적 관련 키워드
        if fullText.contains("transfer") || fullText.contains("signing") || 
           fullText.contains("deal") || fullText.contains("agreement") ||
           fullText.contains("medical") || fullText.contains("here we go") {
            return .transfer
        }
        
        // 부상 관련 키워드
        if fullText.contains("injury") || fullText.contains("injured") || 
           fullText.contains("fitness") || fullText.contains("return") ||
           fullText.contains("surgery") || fullText.contains("recovery") {
            return .injury
        }
        
        // 경기 관련 키워드
        if fullText.contains("match") || fullText.contains("vs") || 
           fullText.contains("victory") || fullText.contains("defeat") ||
           fullText.contains("goal") || fullText.contains("score") {
            return .match
        }
        
        return .general
    }
    
    private func evaluateNewsTrust(_ item: ExpandedRSSParser.RSSItem, source: ExpandedFootballRSSService.ExpandedRSSSource) -> (TransferReliabilityTier?, Int) {
        let baseScore = source.trustScore
        var tier: TransferReliabilityTier? = nil
        var adjustedScore = baseScore
        
        let fullText = "\(item.title) \(item.description ?? "")".lowercased()
        
        // 공식 발표 키워드
        if fullText.contains("official") || fullText.contains("confirmed") || 
           fullText.contains("announced") || fullText.contains("unveiled") {
            tier = .official
            adjustedScore = min(100, adjustedScore + 20)
        }
        // Here we go! (Fabrizio Romano)
        else if fullText.contains("here we go") {
            tier = .official
            adjustedScore = 95
        }
        // 신뢰할 수 있는 키워드
        else if fullText.contains("agreement reached") || fullText.contains("medical scheduled") ||
                fullText.contains("terms agreed") || fullText.contains("close to") {
            tier = .tierOne
            adjustedScore = min(90, adjustedScore + 10)
        }
        // 루머 키워드
        else if fullText.contains("rumour") || fullText.contains("speculation") ||
                fullText.contains("interested") || fullText.contains("monitoring") {
            tier = .unreliable
            adjustedScore = max(50, adjustedScore - 20)
        }
        
        return (tier, adjustedScore)
    }
    
    private func formatExpandedSource(_ source: ExpandedFootballRSSService.ExpandedRSSSource, trustScore: Int, tier: TransferReliabilityTier?) -> String {
        var formatted = source.displayName
        
        // 신뢰도 점수에 따른 표시
        if trustScore >= 95 {
            formatted += " ✓"
        } else if trustScore >= 90 {
            formatted += " ⭐"
        }
        
        // 카테고리 표시
        switch source.category {
        case .official, .clubOfficial:
            formatted += " [OFFICIAL]"
        case .tier1Media:
            formatted += " [Tier 1]"
        case .analytics:
            formatted += " [Analytics]"
        case .transferSpecialist:
            if source == .transfermarkt || source == .fabrizioRomano {
                formatted += " [Transfer Expert]"
            }
        default:
            break
        }
        
        // 이적 티어 표시
        if let tier = tier {
            switch tier {
            case .official:
                formatted += " [CONFIRMED]"
            case .tierOne:
                formatted += " [Reliable]"
            case .verified:
                formatted += " [Verified]"
            case .unreliable:
                formatted += " [Rumour]"
            default:
                break
            }
        }
        
        return formatted
    }
    
    private func formatTitle(_ title: String, source: ExpandedFootballRSSService.ExpandedRSSSource) -> String {
        var formatted = title
        
        // Here we go! 표시
        if title.lowercased().contains("here we go") {
            formatted = "🚨 " + formatted
        }
        // 공식 발표
        else if source.category == .official || source.category == .clubOfficial {
            formatted = "✅ " + formatted
        }
        // 속보
        else if title.lowercased().contains("breaking") {
            formatted = "⚡ " + formatted
        }
        
        return formatted
    }
    
    // removeDuplicates 메서드는 이제 NewsDeduplicationService를 사용하므로 제거
}

// MARK: - Enhanced RSS Parser

private class ExpandedRSSParser: NSObject, XMLParserDelegate {
    
    struct RSSItem {
        let title: String
        let description: String?
        let link: String
        let pubDate: Date
        let imageUrl: String?
    }
    
    private var items: [RSSItem] = []
    private var currentItem: [String: String] = [:]
    private var currentElement = ""
    private var isInsideItem = false
    
    func parseRSS(data: Data) throws -> [RSSItem] {
        items.removeAll()
        currentItem.removeAll()
        
        let parser = XMLParser(data: data)
        parser.delegate = self
        
        guard parser.parse() else {
            throw RSSError.parseError
        }
        
        return items
    }
    
    // XMLParserDelegate methods
    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String : String] = [:]) {
        currentElement = elementName
        
        if elementName == "item" {
            isInsideItem = true
            currentItem.removeAll()
        }
        
        // 이미지 URL 추출
        if isInsideItem && (elementName == "media:content" || elementName == "enclosure") {
            if let url = attributeDict["url"] {
                currentItem["imageUrl"] = url
            }
        }
    }
    
    func parser(_ parser: XMLParser, foundCharacters string: String) {
        if isInsideItem {
            let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                currentItem[currentElement] = (currentItem[currentElement] ?? "") + trimmed
            }
        }
    }
    
    func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
        if elementName == "item" {
            isInsideItem = false
            
            guard let title = currentItem["title"],
                  let link = currentItem["link"],
                  let pubDateString = currentItem["pubDate"] else {
                return
            }
            
            let pubDate = parseDate(pubDateString) ?? Date()
            
            let item = RSSItem(
                title: title,
                description: currentItem["description"],
                link: link,
                pubDate: pubDate,
                imageUrl: currentItem["imageUrl"]
            )
            
            items.append(item)
        }
    }
    
    private func parseDate(_ dateString: String) -> Date? {
        let formatters = [
            "E, d MMM yyyy HH:mm:ss Z",
            "E, d MMM yyyy HH:mm:ss zzz",
            "yyyy-MM-dd'T'HH:mm:ssZ",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        ]
        
        for format in formatters {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            formatter.locale = Locale(identifier: "en_US_POSIX")
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        return nil
    }
}