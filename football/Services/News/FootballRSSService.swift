import Foundation
import SwiftUI

/// 공신력 있는 축구 뉴스 RSS 피드 서비스
final class FootballRSSService: ObservableObject {
    
    static let shared = FootballRSSService()
    
    private init() {}
    
    // MARK: - 공신력 있는 축구 RSS 피드 소스들
    
    /// 주요 축구 뉴스 RSS 피드 목록
    enum RSSSource: String, CaseIterable {
        case bbcSport = "https://feeds.bbci.co.uk/sport/football/rss.xml"
        case skySports = "https://www.skysports.com/rss/12040" // Football
        case espnFC = "https://www.espn.com/espn/rss/soccer/news"
        case guardianFootball = "https://www.theguardian.com/football/rss"
        case reuters = "https://www.reuters.com/rss/sportsNews"
        case apNews = "https://feeds.apnews.com/soccer"
        case goal = "https://www.goal.com/feeds/en/news"
        case transfermarkt = "https://www.transfermarkt.com/rss/news"
        
        var displayName: String {
            switch self {
            case .bbcSport: return "BBC Sport"
            case .skySports: return "Sky Sports"
            case .espnFC: return "ESPN FC"
            case .guardianFootball: return "The Guardian"
            case .reuters: return "Reuters"
            case .apNews: return "AP News"
            case .goal: return "Goal.com"
            case .transfermarkt: return "Transfermarkt"
            }
        }
        
        var category: FootballNewsCategory {
            switch self {
            case .bbcSport, .skySports, .espnFC, .guardianFootball, .reuters, .apNews:
                return .general
            case .goal:
                return .general
            case .transfermarkt:
                return .transfer
            }
        }
        
        var reliability: Int {
            switch self {
            case .bbcSport, .guardianFootball, .reuters, .apNews:
                return 95 // 매우 높은 신뢰도
            case .skySports, .espnFC:
                return 90 // 높은 신뢰도
            case .goal:
                return 85 // 좋은 신뢰도
            case .transfermarkt:
                return 88 // 이적 정보 특화
            }
        }
    }
    
    /// 축구 뉴스 카테고리
    enum FootballNewsCategory: String, CaseIterable {
        case all = "all"
        case general = "general"
        case transfer = "transfer"
        case premierLeague = "premier_league"
        case championsLeague = "champions_league"
        case worldCup = "world_cup"
        case international = "international"
        
        var displayName: String {
            switch self {
            case .all: return "All News"
            case .general: return "General"
            case .transfer: return "Transfers"
            case .premierLeague: return "Premier League"
            case .championsLeague: return "Champions League"
            case .worldCup: return "World Cup"
            case .international: return "International"
            }
        }
        
        var icon: String {
            switch self {
            case .all: return "newspaper"
            case .general: return "doc.text"
            case .transfer: return "arrow.left.arrow.right"
            case .premierLeague: return "crown"
            case .championsLeague: return "trophy"
            case .worldCup: return "globe"
            case .international: return "flag"
            }
        }
    }
    
    // MARK: - RSS 뉴스 모델
    
    struct RSSNewsItem: Identifiable {
        let id = UUID()
        let title: String
        let description: String?
        let link: String
        let pubDate: Date
        let source: String
        let category: FootballNewsCategory
        let reliability: Int
        
        var timeAgo: String {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .abbreviated
            return formatter.localizedString(for: pubDate, relativeTo: Date())
        }
    }
    
    // MARK: - Public Methods
    
    /// 모든 RSS 피드에서 뉴스 가져오기
    func fetchAllFootballNews() async throws -> [RSSNewsItem] {
        var allNews: [RSSNewsItem] = []
        
        // 모든 RSS 소스를 병렬로 처리
        await withTaskGroup(of: [RSSNewsItem].self) { group in
            for source in RSSSource.allCases {
                group.addTask {
                    do {
                        return try await self.fetchNewsFromRSS(source: source)
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
        
        // 날짜순으로 정렬 (최신순)
        return allNews.sorted { $0.pubDate > $1.pubDate }
    }
    
    /// 특정 카테고리 뉴스 가져오기
    func fetchNews(category: FootballNewsCategory) async throws -> [RSSNewsItem] {
        let allNews = try await fetchAllFootballNews()
        
        if category == .all {
            return allNews
        }
        
        return allNews.filter { news in
            news.category == category || containsCategoryKeywords(news, category: category)
        }
    }
    
    /// 최고 신뢰도 뉴스만 가져오기
    func fetchTopQualityNews(limit: Int = 20) async throws -> [RSSNewsItem] {
        let allNews = try await fetchAllFootballNews()
        
        return allNews
            .filter { $0.reliability >= 90 } // 신뢰도 90 이상만
            .prefix(limit)
            .map { $0 }
    }
    
    // MARK: - Private Methods
    
    /// 개별 RSS 피드에서 뉴스 파싱
    private func fetchNewsFromRSS(source: RSSSource) async throws -> [RSSNewsItem] {
        guard let url = URL(string: source.rawValue) else {
            throw RSSError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        let parser = RSSParser()
        let items = try parser.parseRSS(data: data)
        
        return items.map { item in
            RSSNewsItem(
                title: item.title,
                description: item.description,
                link: item.link,
                pubDate: item.pubDate,
                source: source.displayName,
                category: source.category,
                reliability: source.reliability
            )
        }
    }
    
    /// 뉴스 내용에서 카테고리 키워드 검사
    private func containsCategoryKeywords(_ news: RSSNewsItem, category: FootballNewsCategory) -> Bool {
        let content = "\(news.title) \(news.description ?? "")".lowercased()
        
        switch category {
        case .transfer:
            let transferKeywords = ["transfer", "signing", "deal", "move", "contract", "loan", "buy", "sell", "acquisition"]
            return transferKeywords.contains { content.contains($0) }
            
        case .premierLeague:
            let plKeywords = ["premier league", "manchester", "liverpool", "chelsea", "arsenal", "tottenham", "manchester city", "manchester united"]
            return plKeywords.contains { content.contains($0) }
            
        case .championsLeague:
            let clKeywords = ["champions league", "ucl", "european cup"]
            return clKeywords.contains { content.contains($0) }
            
        case .worldCup:
            let wcKeywords = ["world cup", "fifa", "qatar", "russia"]
            return wcKeywords.contains { content.contains($0) }
            
        case .international:
            let intKeywords = ["national team", "euro", "copa america", "nations league", "qualifiers"]
            return intKeywords.contains { content.contains($0) }
            
        default:
            return false
        }
    }
}

// MARK: - RSS Parser

private class RSSParser: NSObject, XMLParserDelegate {
    
    struct RSSItem {
        let title: String
        let description: String?
        let link: String
        let pubDate: Date
    }
    
    private var items: [RSSItem] = []
    private var currentItem: [String: String] = [:]
    private var currentElement = ""
    
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
    
    // MARK: - XMLParserDelegate
    
    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String : String] = [:]) {
        currentElement = elementName
        
        if elementName == "item" {
            currentItem.removeAll()
        }
    }
    
    func parser(_ parser: XMLParser, foundCharacters string: String) {
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty {
            currentItem[currentElement] = (currentItem[currentElement] ?? "") + trimmed
        }
    }
    
    func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
        if elementName == "item" {
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
                pubDate: pubDate
            )
            
            items.append(item)
        }
    }
    
    private func parseDate(_ dateString: String) -> Date? {
        let formatters = [
            "E, d MMM yyyy HH:mm:ss Z",
            "yyyy-MM-dd'T'HH:mm:ssZ",
            "yyyy-MM-dd HH:mm:ss"
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

// MARK: - Errors
// RSSError is defined in TrustedFootballRSSService.swift

// MARK: - News Category Extension

extension NewsCategory {
    init(from footballCategory: FootballRSSService.FootballNewsCategory) {
        switch footballCategory {
        case .transfer:
            self = .transfer
        case .general, .premierLeague, .championsLeague, .worldCup, .international, .all:
            self = .general
        }
    }
}