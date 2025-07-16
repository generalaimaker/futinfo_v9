import Foundation
import SwiftUI

/// 공신력 있는 축구 뉴스 RSS 서비스 - 정확도 최우선
final class TrustedFootballRSSService: ObservableObject {
    
    static let shared = TrustedFootballRSSService()
    
    private init() {}
    
    // MARK: - Tier 1 공신력 있는 RSS 소스만
    
    enum TrustedRSSSource: String, CaseIterable {
        // 공식 소스
        case premierLeague = "https://www.premierleague.com/rss/news"
        case uefa = "https://www.uefa.com/rssfeed/news/rss.xml"
        case fifa = "https://www.fifa.com/rss/index.xml"
        
        // Tier 1 언론사 (가장 신뢰할 수 있는 소스)
        case bbcSport = "https://feeds.bbci.co.uk/sport/football/rss.xml"
        case skySports = "https://www.skysports.com/rss/12040"
        case guardian = "https://www.theguardian.com/football/rss"
        case athletic = "https://theathletic.com/soccer/rss/" // 구독 필요하지만 매우 정확
        case telegraph = "https://www.telegraph.co.uk/football/rss"
        case times = "https://www.thetimes.co.uk/sport/football/rss"
        
        // 이적 전문 소스 (루머 포함)
        case transfermarkt = "https://www.transfermarkt.com/rss/news"
        case goal = "https://www.goal.com/feeds/en/news"
        case espnFC = "https://www.espn.com/espn/rss/soccer/news"
        case footballTransfers = "https://www.footballtransfers.com/en/feed"
        case mirror = "https://www.mirror.co.uk/sport/football/transfer-news/rss"
        case metro = "https://metro.co.uk/sport/football/feed/"
        case talksport = "https://talksport.com/feed/"
        
        case officialClubSites = "club_official" // 각 클럽 공식 사이트
        
        var displayName: String {
            switch self {
            case .premierLeague: return "Premier League Official"
            case .uefa: return "UEFA Official"
            case .fifa: return "FIFA Official"
            case .bbcSport: return "BBC Sport"
            case .skySports: return "Sky Sports"
            case .guardian: return "The Guardian"
            case .athletic: return "The Athletic"
            case .telegraph: return "The Telegraph"
            case .times: return "The Times"
            case .transfermarkt: return "Transfermarkt"
            case .goal: return "Goal.com"
            case .espnFC: return "ESPN FC"
            case .footballTransfers: return "Football Transfers"
            case .mirror: return "Mirror Football"
            case .metro: return "Metro Sport"
            case .talksport: return "talkSPORT"
            case .officialClubSites: return "Official Club"
            }
        }
        
        var trustScore: Int {
            switch self {
            // 공식 소스는 100% 신뢰
            case .premierLeague, .uefa, .fifa, .officialClubSites:
                return 100
                
            // Tier 1 언론사
            case .bbcSport, .guardian:
                return 95
                
            case .skySports, .athletic, .telegraph, .times:
                return 90
                
            // 이적 전문
            case .transfermarkt:
                return 85
            
            // 이적 루머 소스들
            case .goal, .espnFC:
                return 75
                
            case .footballTransfers:
                return 70
                
            case .mirror, .metro, .talksport:
                return 60 // 루머가 많지만 이적시장 정보원으로 유용
            }
        }
        
        var isTransferSpecialist: Bool {
            switch self {
            case .transfermarkt, .skySports, .athletic, .goal, .espnFC, 
                 .footballTransfers, .mirror, .metro, .talksport:
                return true
            default:
                return false
            }
        }
    }
    
    // MARK: - 신뢰할 수 있는 이적 뉴스 기자들
    
    enum TrustedTransferJournalist: String, CaseIterable {
        case fabrizioRomano = "Fabrizio Romano"
        case davidOrnstein = "David Ornstein"
        case simonStone = "Simon Stone"
        case jamesOlley = "James Olley"
        case mattLaw = "Matt Law"
        case samLee = "Sam Lee"
        case paulJoyce = "Paul Joyce"
        
        var trustLevel: TransferReliabilityTier {
            switch self {
            case .fabrizioRomano, .davidOrnstein:
                return .official
            case .simonStone, .jamesOlley, .mattLaw:
                return .tierOne
            case .samLee, .paulJoyce:
                return .tierOne
            }
        }
        
        var specialization: String {
            switch self {
            case .fabrizioRomano: return "Global Transfers"
            case .davidOrnstein: return "Premier League"
            case .simonStone: return "Manchester Clubs"
            case .jamesOlley: return "London Clubs"
            case .mattLaw: return "Chelsea"
            case .samLee: return "Manchester City"
            case .paulJoyce: return "Liverpool & Everton"
            }
        }
    }
    
    // MARK: - 뉴스 정확도 검증
    
    struct NewsAccuracyValidator {
        
        /// 이적 뉴스의 신뢰도 평가
        static func evaluateTransferNews(title: String, source: String, content: String?) -> (tier: TransferReliabilityTier, confidence: Int) {
            var confidence = 50 // 기본 신뢰도
            var tier = TransferReliabilityTier.unreliable
            
            // 1. 소스 체크
            if let trustedSource = TrustedRSSSource.allCases.first(where: { $0.displayName == source }) {
                confidence = trustedSource.trustScore
                
                if confidence >= 95 {
                    tier = .tierOne
                } else if confidence >= 90 {
                    tier = .verified
                }
            }
            
            // 2. 기자 체크
            let fullText = "\(title) \(content ?? "")"
            for journalist in TrustedTransferJournalist.allCases {
                if fullText.contains(journalist.rawValue) {
                    tier = journalist.trustLevel
                    confidence = max(confidence, 85)
                    break
                }
            }
            
            // 3. 키워드 분석
            let officialKeywords = [
                "official", "confirmed", "announcement", "unveiled",
                "signs", "completed", "done deal", "medical passed"
            ]
            
            let reliableKeywords = [
                "agreement reached", "terms agreed", "medical scheduled",
                "advanced talks", "close to signing", "fee agreed"
            ]
            
            let unreliableKeywords = [
                "rumour", "speculation", "could", "might", "interested",
                "monitoring", "considering", "eyeing", "linked"
            ]
            
            let lowerText = fullText.lowercased()
            
            // 공식 발표 키워드
            if officialKeywords.contains(where: lowerText.contains) {
                tier = .official
                confidence = min(100, confidence + 20)
            }
            // 신뢰할 수 있는 키워드
            else if reliableKeywords.contains(where: lowerText.contains) {
                if tier == .unreliable {
                    tier = .reliable
                }
                confidence = min(95, confidence + 10)
            }
            // 루머 키워드
            else if unreliableKeywords.contains(where: lowerText.contains) {
                tier = .unreliable
                confidence = max(30, confidence - 20)
            }
            
            // 4. "Here we go!" 체크 (Fabrizio Romano의 시그니처)
            if lowerText.contains("here we go") {
                tier = .official
                confidence = 95
            }
            
            return (tier, confidence)
        }
        
        /// 일반 뉴스의 신뢰도 평가
        static func evaluateGeneralNews(source: String) -> Int {
            if let trustedSource = TrustedRSSSource.allCases.first(where: { $0.displayName == source }) {
                return trustedSource.trustScore
            }
            return 50 // 알 수 없는 소스
        }
    }
    
    // MARK: - RSS 뉴스 모델
    
    struct TrustedRSSNewsItem: Identifiable {
        let id = UUID()
        let title: String
        let description: String?
        let link: String
        let pubDate: Date
        let source: String
        let category: FootballNewsCategory
        let trustScore: Int
        let transferTier: TransferReliabilityTier?
        let journalist: String?
        
        var isHighlyTrusted: Bool {
            trustScore >= 85
        }
        
        var timeAgo: String {
            let formatter = RelativeDateTimeFormatter()
            formatter.unitsStyle = .abbreviated
            return formatter.localizedString(for: pubDate, relativeTo: Date())
        }
    }
    
    enum FootballNewsCategory: String, CaseIterable {
        case official = "official"
        case transfer = "transfer"
        case match = "match"
        case injury = "injury"
        case general = "general"
    }
    
    // MARK: - Public Methods
    
    /// 신뢰할 수 있는 뉴스만 가져오기
    func fetchTrustedNews(category: FootballNewsCategory = .general, minimumTrustScore: Int = 80) async throws -> [TrustedRSSNewsItem] {
        var allNews: [TrustedRSSNewsItem] = []
        
        // 병렬로 모든 신뢰할 수 있는 소스에서 가져오기
        await withTaskGroup(of: [TrustedRSSNewsItem].self) { group in
            for source in TrustedRSSSource.allCases {
                // 카테고리에 맞는 소스만 선택
                if shouldFetchFromSource(source, for: category) {
                    group.addTask {
                        do {
                            return try await self.fetchFromTrustedSource(source)
                        } catch {
                            print("❌ Failed to fetch from \(source.displayName): \(error)")
                            return []
                        }
                    }
                }
            }
            
            for await newsItems in group {
                allNews.append(contentsOf: newsItems)
            }
        }
        
        // 신뢰도 점수로 필터링
        let trustedNews = allNews.filter { $0.trustScore >= minimumTrustScore }
        
        // 날짜순 정렬 (최신순)
        return trustedNews.sorted { $0.pubDate > $1.pubDate }
    }
    
    /// 이적 뉴스만 가져오기 (Tier 1 소스만)
    func fetchTier1TransferNews() async throws -> [TrustedRSSNewsItem] {
        let allNews = try await fetchTrustedNews(category: .transfer, minimumTrustScore: 85)
        
        // Tier 1 이상만 필터링
        return allNews.compactMap { news in
            guard let tier = news.transferTier,
                  tier.rawValue >= TransferReliabilityTier.tierOne.rawValue else {
                return nil
            }
            return news
        }
    }
    
    // MARK: - Private Methods
    
    private func shouldFetchFromSource(_ source: TrustedRSSSource, for category: FootballNewsCategory) -> Bool {
        switch category {
        case .transfer:
            return source.isTransferSpecialist || source == .bbcSport || source == .skySports
        case .official:
            return [.premierLeague, .uefa, .fifa, .officialClubSites].contains(source)
        default:
            return true
        }
    }
    
    private func fetchFromTrustedSource(_ source: TrustedRSSSource) async throws -> [TrustedRSSNewsItem] {
        // 클럽 공식 사이트는 별도 처리
        if source == .officialClubSites {
            return await fetchOfficialClubNews()
        }
        
        guard let url = URL(string: source.rawValue) else {
            throw RSSError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        let parser = RSSParser()
        let items = try parser.parseRSS(data: data)
        
        return items.map { item in
            let (category, tier, journalist) = categorizeAndEvaluate(item, source: source)
            let trustScore = source.trustScore
            
            return TrustedRSSNewsItem(
                title: item.title,
                description: item.description,
                link: item.link,
                pubDate: item.pubDate,
                source: source.displayName,
                category: category,
                trustScore: trustScore,
                transferTier: category == .transfer ? tier : nil,
                journalist: journalist
            )
        }
    }
    
    private func categorizeAndEvaluate(_ item: RSSParser.RSSItem, source: TrustedRSSSource) -> (FootballNewsCategory, TransferReliabilityTier?, String?) {
        let fullText = "\(item.title) \(item.description ?? "")".lowercased()
        
        // 이적 뉴스 체크
        if fullText.contains("transfer") || fullText.contains("signing") || fullText.contains("deal") {
            let (tier, _) = NewsAccuracyValidator.evaluateTransferNews(
                title: item.title,
                source: source.displayName,
                content: item.description
            )
            
            // 기자 확인
            let journalist = TrustedTransferJournalist.allCases.first { journalist in
                fullText.contains(journalist.rawValue.lowercased())
            }?.rawValue
            
            return (.transfer, tier, journalist)
        }
        
        // 공식 발표
        if fullText.contains("official") || fullText.contains("confirmed") {
            return (.official, nil, nil)
        }
        
        // 경기
        if fullText.contains("match") || fullText.contains("vs") || fullText.contains("victory") || fullText.contains("defeat") {
            return (.match, nil, nil)
        }
        
        // 부상
        if fullText.contains("injury") || fullText.contains("injured") || fullText.contains("fitness") {
            return (.injury, nil, nil)
        }
        
        return (.general, nil, nil)
    }
    
    /// 주요 클럽들의 공식 RSS 피드
    private func fetchOfficialClubNews() async -> [TrustedRSSNewsItem] {
        let officialClubFeeds = [
            "https://www.manutd.com/en/rss/NewsAndFeatures",
            "https://www.chelseafc.com/en/rss",
            "https://www.arsenal.com/rss",
            "https://www.liverpoolfc.com/rss",
            "https://www.mancity.com/rss",
            "https://www.realmadrid.com/en/rss",
            "https://www.fcbarcelona.com/en/rss"
        ]
        
        var clubNews: [TrustedRSSNewsItem] = []
        
        for feedUrl in officialClubFeeds {
            if let url = URL(string: feedUrl) {
                do {
                    let (data, _) = try await URLSession.shared.data(from: url)
                    let parser = RSSParser()
                    let items = try parser.parseRSS(data: data)
                    
                    let news = items.map { item in
                        TrustedRSSNewsItem(
                            title: item.title,
                            description: item.description,
                            link: item.link,
                            pubDate: item.pubDate,
                            source: "Official Club",
                            category: .official,
                            trustScore: 100, // 공식 소스는 100% 신뢰
                            transferTier: .official,
                            journalist: nil
                        )
                    }
                    
                    clubNews.append(contentsOf: news)
                } catch {
                    // 개별 클럽 피드 실패는 무시
                    continue
                }
            }
        }
        
        return clubNews
    }
}

// MARK: - RSS Parser (재사용)

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
    
    // XMLParserDelegate methods...
    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String : String] = [:]) {
        currentElement = elementName
        
        if elementName == "item" {
            isInsideItem = true
            currentItem.removeAll()
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
                pubDate: pubDate
            )
            
            items.append(item)
        }
    }
    
    private func parseDate(_ dateString: String) -> Date? {
        let formatters = [
            "E, d MMM yyyy HH:mm:ss Z",
            "E, d MMM yyyy HH:mm:ss zzz",
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

enum RSSError: Error {
    case invalidURL
    case parseError
    case networkError
}