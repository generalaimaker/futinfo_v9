import Foundation

/// 간단하고 안정적인 뉴스 서비스
final class SimpleNewsService: ObservableObject {
    
    static let shared = SimpleNewsService()
    
    private let preloadedService = PreloadedNewsService.shared
    private var lastFetchTime: Date?
    private var cachedNews: [NewsCategory: [NewsArticle]] = [:]
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// 뉴스 가져오기 - 프리로드 데이터로 즉시 반환
    func fetchNews(category: NewsCategory = .all) async -> [NewsArticle] {
        // 1. 즉시 프리로드된 뉴스 반환
        let preloadedNews = preloadedService.getPreloadedNews(for: category)
        
        // 2. 캐시된 뉴스가 있으면 반환
        if let cached = cachedNews[category], !cached.isEmpty {
            return cached
        }
        
        // 3. 백그라운드에서 실제 뉴스 가져오기 시도
        Task {
            await fetchRealNewsInBackground(category: category)
        }
        
        // 4. 일단 프리로드된 뉴스 반환 (즉시 표시)
        return preloadedNews
    }
    
    /// 강제 새로고침
    func refreshNews(category: NewsCategory = .all) async -> [NewsArticle] {
        // 실제 뉴스 가져오기 시도
        if let realNews = await fetchRealNews(category: category), !realNews.isEmpty {
            cachedNews[category] = realNews
            return realNews
        }
        
        // 실패하면 프리로드 뉴스 반환
        return preloadedService.getPreloadedNews(for: category)
    }
    
    // MARK: - Private Methods
    
    private func fetchRealNewsInBackground(category: NewsCategory) async {
        // 너무 자주 호출하지 않도록 제한
        if let lastFetch = lastFetchTime,
           Date().timeIntervalSince(lastFetch) < 60 { // 1분 제한
            return
        }
        
        if let realNews = await fetchRealNews(category: category), !realNews.isEmpty {
            await MainActor.run {
                self.cachedNews[category] = realNews
                self.lastFetchTime = Date()
            }
        }
    }
    
    private func fetchRealNews(category: NewsCategory) async -> [NewsArticle]? {
        // 간단한 RSS 소스 몇 개만 사용
        let simpleSources = getSimpleSources(for: category)
        var allNews: [NewsArticle] = []
        
        for source in simpleSources {
            if let news = await fetchFromSingleSource(source) {
                allNews.append(contentsOf: news)
            }
        }
        
        // 중복 제거 및 정렬
        let uniqueNews = removeDuplicates(from: allNews)
        return uniqueNews.sorted { $0.publishedAt > $1.publishedAt }
    }
    
    private func fetchFromSingleSource(_ source: RSSSource) async -> [NewsArticle]? {
        guard let url = URL(string: source.url) else { return nil }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            return parseRSS(data: data, source: source)
        } catch {
            print("❌ Error fetching from \(source.name): \(error.localizedDescription)")
            return nil
        }
    }
    
    private func parseRSS(data: Data, source: RSSSource) -> [NewsArticle]? {
        // 간단한 정규식 기반 파싱 (XML 파서 대신)
        guard let xmlString = String(data: data, encoding: .utf8) else { return nil }
        
        var articles: [NewsArticle] = []
        
        // <item> 태그 찾기
        let itemPattern = "<item>(.*?)</item>"
        let itemRegex = try? NSRegularExpression(pattern: itemPattern, options: [.dotMatchesLineSeparators])
        let itemMatches = itemRegex?.matches(in: xmlString, options: [], range: NSRange(xmlString.startIndex..., in: xmlString)) ?? []
        
        for match in itemMatches.prefix(10) { // 최대 10개만
            if let itemRange = Range(match.range(at: 1), in: xmlString) {
                let itemContent = String(xmlString[itemRange])
                
                // 제목 추출
                let title = extractTag("title", from: itemContent)
                // 링크 추출
                let link = extractTag("link", from: itemContent)
                // 설명 추출
                let description = extractTag("description", from: itemContent)
                // 날짜 추출
                let pubDate = extractTag("pubDate", from: itemContent)
                
                if let title = title, let link = link {
                    let article = NewsArticle(
                        title: cleanText(title),
                        summary: cleanText(description ?? ""),
                        source: "\(source.name) \(source.tier)",
                        url: link,
                        publishedAt: parseDate(pubDate ?? "") ?? Date(),
                        category: source.category,
                        imageUrl: nil
                    )
                    articles.append(article)
                }
            }
        }
        
        return articles
    }
    
    private func extractTag(_ tag: String, from content: String) -> String? {
        let pattern = "<\(tag)><!\\[CDATA\\[(.*?)\\]\\]></\(tag)>|<\(tag)>(.*?)</\(tag)>"
        let regex = try? NSRegularExpression(pattern: pattern, options: [.dotMatchesLineSeparators])
        
        if let match = regex?.firstMatch(in: content, options: [], range: NSRange(content.startIndex..., in: content)) {
            // CDATA 내용
            if let cdataRange = Range(match.range(at: 1), in: content), !content[cdataRange].isEmpty {
                return String(content[cdataRange])
            }
            // 일반 내용
            if let normalRange = Range(match.range(at: 2), in: content) {
                return String(content[normalRange])
            }
        }
        return nil
    }
    
    private func cleanText(_ text: String) -> String {
        return text
            .replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
            .replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&lt;", with: "<")
            .replacingOccurrences(of: "&gt;", with: ">")
            .replacingOccurrences(of: "&quot;", with: "\"")
            .replacingOccurrences(of: "&#39;", with: "'")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func parseDate(_ dateString: String) -> Date? {
        let formatters = [
            "E, d MMM yyyy HH:mm:ss Z",
            "E, d MMM yyyy HH:mm:ss zzz",
            "yyyy-MM-dd'T'HH:mm:ssZ"
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
    
    private func removeDuplicates(from articles: [NewsArticle]) -> [NewsArticle] {
        var seen = Set<String>()
        return articles.filter { article in
            let key = String(article.title.prefix(50)).lowercased()
            return seen.insert(key).inserted
        }
    }
    
    private func getSimpleSources(for category: NewsCategory) -> [RSSSource] {
        switch category {
        case .all, .general:
            return [
                RSSSource(url: "https://www.skysports.com/rss/12040", name: "Sky Sports", tier: "[Tier 1]", category: .general),
                RSSSource(url: "https://feeds.bbci.co.uk/sport/football/rss.xml", name: "BBC Sport", tier: "✓", category: .general)
            ]
        case .transfer:
            return [
                RSSSource(url: "https://www.skysports.com/rss/11095", name: "Sky Transfer Centre", tier: "[Tier 1]", category: .transfer),
                RSSSource(url: "https://www.goal.com/feeds/en/news", name: "Goal.com", tier: "[Reliable]", category: .transfer)
            ]
        case .injury:
            return [
                RSSSource(url: "https://www.skysports.com/rss/12040", name: "Sky Sports", tier: "[Tier 1]", category: .injury)
            ]
        case .match:
            return getSimpleSources(for: .general)
        }
    }
}

// MARK: - Helper Types

private struct RSSSource {
    let url: String
    let name: String
    let tier: String
    let category: NewsCategory
}