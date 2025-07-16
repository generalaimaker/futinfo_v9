import Foundation

/// 최적화된 뉴스 서비스 - 안정성과 성능 개선
final class OptimizedNewsService: ObservableObject {
    
    static let shared = OptimizedNewsService()
    
    // MARK: - Properties
    
    private let preloadedService = PreloadedNewsService.shared
    private let deduplicationService = NewsDeduplicationService.shared
    private let cacheManager = EnhancedNewsCacheManager.shared
    
    // 캐시 시간 연장 (30분)
    private let cacheExpiry: TimeInterval = 1800
    
    // 네트워크 타임아웃 설정
    private let networkTimeout: TimeInterval = 10.0
    
    // 우선순위 RSS 소스 (신뢰도 85점 이상만)
    private let priorityRSSSources: [(url: String, name: String, tier: String, score: Int)] = [
        // 공식 소스
        ("https://www.premierleague.com/rss/news", "Premier League", "[OFFICIAL]", 100),
        ("https://www.uefa.com/rssfeed/news/rss.xml", "UEFA", "[OFFICIAL]", 100),
        
        // Tier 1 언론사 (축구 전용)
        ("https://www.skysports.com/rss/12040", "Sky Sports Football", "[Tier 1]", 95),
        ("https://www.theguardian.com/football/rss", "The Guardian Football", "[Tier 1]", 95),
        ("https://www.espn.com/espn/rss/soccer/news", "ESPN Football", "[Tier 1]", 90),
        
        // 이적 전문 (이적 카테고리만)
        ("https://www.skysports.com/rss/11095", "Sky Transfer Centre", "[Tier 1]", 95),
        ("https://www.transfermarkt.com/rss/news", "Transfermarkt", "[Transfer Expert]", 85)
    ]
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// 모든 캐시 삭제 및 새로고침
    func clearAllCacheAndRefresh() async {
        cacheManager.clearAllCache()
        print("🗑️ 모든 뉴스 캐시가 삭제되었습니다")
    }
    
    /// 최적화된 뉴스 가져오기
    func fetchNews(category: NewsCategory = .all, forceRefresh: Bool = false) async -> [NewsArticle] {
        // 1. 즉시 프리로드 뉴스 반환
        let preloadedNews = preloadedService.getPreloadedNews(for: category)
        
        // 2. 캐시 확인 (30분 유효) - 카테고리별 캐시
        if !forceRefresh, let cachedNews = getCachedNews(for: category), !cachedNews.isEmpty {
            // 카테고리별 필터링
            let filteredNews = cachedNews.filter { article in
                if category == .all || category == .general {
                    return true
                }
                return article.category == category
            }
            if !filteredNews.isEmpty {
                print("📱 캐시에서 \(filteredNews.count)개 \(category.displayName) 뉴스 반환")
                return filteredNews
            }
        }
        
        // 3. 우선순위 소스에서만 뉴스 가져오기
        let sources = getSourcesForCategory(category)
        let realNews = await fetchFromPrioritySources(sources, category: category)
        
        // 4. 중복 제거
        let deduplicatedNews = deduplicationService.deduplicateNews(realNews)
        
        // 5. 카테고리별 필터링 (요청된 카테고리와 일치하는 뉴스만)
        let categoryFilteredNews = deduplicatedNews.filter { article in
            if category == .all || category == .general {
                return true
            }
            // 엄격한 카테고리 매칭
            return article.category == category
        }
        
        // 디버깅을 위한 로그
        print("📊 카테고리 \(category.displayName): 총 \(realNews.count)개 → 필터링 후 \(categoryFilteredNews.count)개")
        
        // 6. 캐싱
        if !categoryFilteredNews.isEmpty {
            cacheNews(categoryFilteredNews, for: category)
        }
        
        // 7. 실제 뉴스가 없으면 프리로드 뉴스 반환
        return categoryFilteredNews.isEmpty ? preloadedNews : categoryFilteredNews
    }
    
    // MARK: - Private Methods
    
    private func getSourcesForCategory(_ category: NewsCategory) -> [(url: String, name: String, tier: String, score: Int)] {
        switch category {
        case .transfer:
            // 이적 관련 소스만
            return priorityRSSSources.filter { source in
                source.name.contains("Transfer") || 
                source.name.contains("Sky Sports Football") || 
                source.name == "Transfermarkt"
            }
        case .injury:
            // 부상/건강 뉴스는 모든 주요 소스에서
            return priorityRSSSources.filter { source in
                !source.name.contains("Transfer")
            }
        case .match:
            // 경기 관련 소스
            return priorityRSSSources.filter { source in
                !source.name.contains("Transfer")
            }
        default:
            // 전체 우선순위 소스
            return Array(priorityRSSSources.prefix(5))
        }
    }
    
    private func fetchFromPrioritySources(_ sources: [(url: String, name: String, tier: String, score: Int)], category: NewsCategory) async -> [NewsArticle] {
        var allNews: [NewsArticle] = []
        
        // 병렬 처리 with TaskGroup
        await withTaskGroup(of: [NewsArticle]?.self) { group in
            for source in sources {
                group.addTask {
                    return await self.fetchFromSourceWithRetry(source, category: category)
                }
            }
            
            // 타임아웃 처리
            let deadline = Date().addingTimeInterval(networkTimeout)
            
            for await result in group {
                if Date() > deadline {
                    print("⏱️ 네트워크 타임아웃 도달")
                    break
                }
                
                if let articles = result {
                    allNews.append(contentsOf: articles)
                }
            }
        }
        
        return allNews
    }
    
    private func fetchFromSourceWithRetry(_ source: (url: String, name: String, tier: String, score: Int), category: NewsCategory, retries: Int = 2) async -> [NewsArticle]? {
        for attempt in 0..<retries {
            do {
                guard let url = URL(string: source.url) else { return nil }
                
                // URLSession with timeout
                let config = URLSessionConfiguration.default
                config.timeoutIntervalForRequest = 5.0
                let session = URLSession(configuration: config)
                
                let (data, _) = try await session.data(from: url)
                
                if let articles = parseRSSData(data, source: source, category: category) {
                    print("✅ \(source.name)에서 \(articles.count)개 뉴스 로드")
                    return articles
                }
                
            } catch {
                if attempt < retries - 1 {
                    print("⚠️ \(source.name) 재시도 \(attempt + 1)/\(retries)")
                    try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
                } else {
                    print("❌ \(source.name) 최종 실패: \(error.localizedDescription)")
                }
            }
        }
        
        return nil
    }
    
    private func parseRSSData(_ data: Data, source: (url: String, name: String, tier: String, score: Int), category: NewsCategory) -> [NewsArticle]? {
        // RobustRSSParser 사용 (SimpleNewsService의 안정적인 파서)
        guard let xmlString = String(data: data, encoding: .utf8) else { return nil }
        
        var articles: [NewsArticle] = []
        
        // 안전한 정규식 파싱
        let itemPattern = "<item[^>]*>(.*?)</item>"
        guard let itemRegex = try? NSRegularExpression(pattern: itemPattern, options: [.dotMatchesLineSeparators]) else { return nil }
        
        let itemMatches = itemRegex.matches(in: xmlString, options: [], range: NSRange(xmlString.startIndex..., in: xmlString))
        
        for match in itemMatches.prefix(10) { // 소스당 최대 10개
            if let itemRange = Range(match.range(at: 1), in: xmlString) {
                let itemContent = String(xmlString[itemRange])
                
                if let article = parseItem(itemContent, source: source, category: category) {
                    // 축구 관련 뉴스인지 확인
                    if isFootballRelated(article) {
                        articles.append(article)
                    } else {
                        print("🚫 필터링됨: \(article.title)")
                    }
                }
            }
        }
        
        return articles.isEmpty ? nil : articles
    }
    
    private func parseItem(_ content: String, source: (url: String, name: String, tier: String, score: Int), category: NewsCategory) -> NewsArticle? {
        // 태그 추출 헬퍼
        func extractTag(_ tag: String) -> String? {
            let patterns = [
                "<\(tag)><!\\[CDATA\\[(.*?)\\]\\]></\(tag)>",
                "<\(tag)>(.*?)</\(tag)>"
            ]
            
            for pattern in patterns {
                if let regex = try? NSRegularExpression(pattern: pattern, options: [.dotMatchesLineSeparators]),
                   let match = regex.firstMatch(in: content, options: [], range: NSRange(content.startIndex..., in: content)) {
                    for i in 1..<match.numberOfRanges {
                        if let range = Range(match.range(at: i), in: content) {
                            let extracted = String(content[range])
                            if !extracted.isEmpty {
                                return extracted
                            }
                        }
                    }
                }
            }
            return nil
        }
        
        guard let title = extractTag("title"),
              let link = extractTag("link") else { return nil }
        
        let description = extractTag("description") ?? ""
        let pubDate = extractTag("pubDate") ?? ""
        
        // 카테고리 자동 분류
        let detectedCategory = detectCategory(title: title, description: description, defaultCategory: category)
        
        // 엄격한 카테고리 필터링
        if category == .transfer {
            // 이적 탭에서는 이적 뉴스만
            if detectedCategory != .transfer {
                return nil
            }
        } else if category == .injury {
            // 부상 탭에서는 부상 뉴스만
            if detectedCategory != .injury {
                return nil
            }
        } else if category == .match {
            // 경기 탭에서는 경기 뉴스만
            if detectedCategory != .match {
                return nil
            }
        }
        
        return NewsArticle(
            title: cleanText(title),
            summary: cleanText(description).prefix(300).description,
            source: "\(source.name) \(source.tier)",
            url: link,
            publishedAt: parseDate(pubDate) ?? Date(),
            category: detectedCategory,
            imageUrl: nil
        )
    }
    
    private func detectCategory(title: String, description: String, defaultCategory: NewsCategory) -> NewsCategory {
        let text = "\(title) \(description)".lowercased()
        
        // 더 엄격한 카테고리별 키워드 매칭
        let transferKeywords = [
            "transfer", "signing", "sign", "signed", "deal", "agreement",
            "bid", "move", "join", "joining", "target", "targeting",
            "interest", "interested", "loan", "permanent", "contract",
            "fee", "clause", "negotiate", "negotiation",
            "approach", "enquiry", "offer", "reject", "accept", "wages"
        ]
        
        let injuryKeywords = [
            "injury", "injured", "fitness", "return", "returns", "returning",
            "setback", "sidelined", "recovery", "recovering", "surgery",
            "scan", "assessment", "blow", "boost", "doubt", "doubtful",
            "miss", "missing", "absence", "absent", "ruled out", "comeback",
            "rehabilitation", "rehab", "treatment", "physio", "health",
            "illness", "ill", "sick", "hospital", "medical", "diagnosis",
            "cancer", "condition", "fit", "unfit", "available", "unavailable"
        ]
        
        let matchKeywords = [
            "match", " vs ", "versus", "score", "scored", "goal", "goals",
            "win", "won", "defeat", "defeated", "draw", "drew", "victory",
            "result", "highlights", "lineup", "starting", "bench", "substitute"
        ]
        
        // 카테고리 감지 - 키워드가 2개 이상 매칭되어야 함
        let transferCount = transferKeywords.filter { text.contains($0) }.count
        let injuryCount = injuryKeywords.filter { text.contains($0) }.count
        let matchCount = matchKeywords.filter { text.contains($0) }.count
        
        // 가장 많이 매칭된 카테고리 선택
        if transferCount >= 2 && transferCount > injuryCount && transferCount > matchCount {
            return .transfer
        } else if injuryCount >= 1 && injuryCount >= transferCount && injuryCount >= matchCount {
            // 부상 카테고리는 1개 키워드만으로도 분류 (health, cancer 등 포함)
            return .injury
        } else if matchCount >= 2 && matchCount > transferCount && matchCount > injuryCount {
            return .match
        }
        
        // 단일 키워드로도 명확한 경우
        if transferCount >= 1 && injuryCount == 0 && matchCount == 0 {
            return .transfer
        } else if injuryCount >= 1 {
            // 부상 관련 키워드가 하나라도 있으면 부상 카테고리
            return .injury
        } else if matchCount >= 1 && transferCount == 0 && injuryCount == 0 {
            return .match
        }
        
        // 특정 카테고리를 요청했는데 키워드가 없으면 해당 뉴스 제외
        if defaultCategory == .transfer || defaultCategory == .injury {
            return .general // 이 경우 parseItem에서 nil 반환됨
        }
        
        return .general
    }
    
    private func cleanText(_ text: String) -> String {
        return text
            .replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
            .replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&lt;", with: "<")
            .replacingOccurrences(of: "&gt;", with: ">")
            .replacingOccurrences(of: "&quot;", with: "\"")
            .replacingOccurrences(of: "&#39;", with: "'")
            .replacingOccurrences(of: "&nbsp;", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func parseDate(_ dateString: String) -> Date? {
        let formatters = [
            "E, d MMM yyyy HH:mm:ss Z",
            "E, d MMM yyyy HH:mm:ss zzz",
            "yyyy-MM-dd'T'HH:mm:ssZ",
            "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        ]
        
        for format in formatters {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = TimeZone(abbreviation: "UTC")
            
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        
        return nil
    }
    
    // MARK: - Football Filter
    
    private func isFootballRelated(_ article: NewsArticle) -> Bool {
        let text = "\(article.title) \(article.summary)".lowercased()
        
        // 축구 외 스포츠 키워드 제외
        let excludedSports = [
            "cricket", "rugby", "tennis", "golf", "basketball", "baseball",
            "hockey", "boxing", "racing", "formula 1", "f1", "nascar",
            "cycling", "swimming", "athletics", "olympics", "horse racing",
            "equestrian", "darts", "snooker", "netball", "nfl", "nba",
            "horse race", "horses", "jockey", "racecourse", "gallop",
            "women's football", "women football", "womens football", "ladies football",
            "wsl", "women's super league", "nwsl", "women's world cup"
        ]
        
        for sport in excludedSports {
            if text.contains(sport) {
                return false
            }
        }
        
        // 축구 관련 키워드 확인
        let footballKeywords = [
            "football", "soccer", "premier league", "champions league",
            "europa league", "transfer", "goal", "match", "fixture",
            "manager", "player", "striker", "midfielder", "defender",
            "goalkeeper", "penalty", "offside", "var", "referee",
            "stadium", "fans", "squad", "tactics", "formation",
            "la liga", "serie a", "bundesliga", "ligue 1", "eredivisie",
            "championship", "fa cup", "carabao cup", "world cup", "euro"
        ]
        
        // 주요 축구 클럽 (남자 축구만)
        let majorClubs = [
            "manchester united", "manchester city", "liverpool", "chelsea", "arsenal", "tottenham",
            "real madrid", "barcelona", "atletico madrid", "bayern munich", "dortmund",
            "juventus", "milan", "inter", "napoli", "psg", "marseille", "lyon",
            "ajax", "psv", "benfica", "porto", "sporting"
        ]
        
        // 축구 키워드 또는 주요 클럽 이름이 있는지 확인
        let hasFootballKeyword = footballKeywords.contains { text.contains($0) }
        let hasMajorClub = majorClubs.contains { text.contains($0) }
        
        // 최소한 축구 키워드나 클럽 이름이 하나라도 있어야 함
        if !hasFootballKeyword && !hasMajorClub {
            return false
        }
        
        // 제목에 축구 관련 내용이 없으면 제외
        let titleLower = article.title.lowercased()
        let titleHasFootball = footballKeywords.contains { titleLower.contains($0) } || 
                              majorClubs.contains { titleLower.contains($0) }
        
        if !titleHasFootball {
            return false
        }
        
        return true
    }
    
    // MARK: - Cache Management
    
    private func getCachedNews(for category: NewsCategory) -> [NewsArticle]? {
        // EnhancedNewsCacheManager 사용 (이미 구현되어 있음)
        return cacheManager.getCachedNews(for: category)
    }
    
    private func cacheNews(_ articles: [NewsArticle], for category: NewsCategory) {
        // EnhancedNewsCacheManager 사용
        cacheManager.cacheNews(articles, for: category)
    }
}