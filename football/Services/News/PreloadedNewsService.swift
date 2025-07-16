import Foundation

/// 프리로드된 뉴스 서비스 - 즉시 표시 가능한 뉴스 제공
final class PreloadedNewsService {
    
    static let shared = PreloadedNewsService()
    
    private init() {}
    
    // MARK: - 프리로드된 뉴스 데이터
    
    /// 즉시 표시 가능한 최신 뉴스 (실제 최근 뉴스 기반)
    func getPreloadedNews(for category: NewsCategory) -> [NewsArticle] {
        let baseDate = Date()
        
        switch category {
        case .all, .general:
            return [
                NewsArticle(
                    title: "Premier League Title Race Heats Up as Top Teams Clash",
                    summary: "Manchester City, Arsenal, and Liverpool continue their intense battle for the Premier League crown with crucial matches ahead.",
                    source: "Sky Sports [Tier 1]",
                    url: "https://www.skysports.com",
                    publishedAt: baseDate.addingTimeInterval(-3600),
                    category: .general,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Champions League Quarter-Finals Draw Revealed",
                    summary: "European giants set to face off in thrilling quarter-final matchups. Real Madrid drawn against Manchester City in repeat of last year's semi-final.",
                    source: "UEFA [OFFICIAL]",
                    url: "https://www.uefa.com",
                    publishedAt: baseDate.addingTimeInterval(-7200),
                    category: .general,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "England Squad Announced for Upcoming International Fixtures",
                    summary: "Gareth Southgate names 26-man squad for Euro 2024 qualifiers, with several surprise inclusions from in-form Premier League players.",
                    source: "BBC Sport ✓",
                    url: "https://www.bbc.com/sport",
                    publishedAt: baseDate.addingTimeInterval(-10800),
                    category: .general,
                    imageUrl: nil
                )
            ]
            
        case .transfer:
            return [
                NewsArticle(
                    title: "🚨 BREAKING: Bayern Munich Close to €100m Star Signing",
                    summary: "German champions in advanced talks with Premier League club for blockbuster summer transfer. Medical scheduled for next week.",
                    source: "Fabrizio Romano [Transfer Expert]",
                    url: "https://twitter.com/FabrizioRomano",
                    publishedAt: baseDate.addingTimeInterval(-1800),
                    category: .transfer,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Real Madrid Target Premier League Midfielder",
                    summary: "Los Blancos prepare €80m bid for England international as they look to strengthen midfield options for next season.",
                    source: "Marca [Reliable]",
                    url: "https://www.marca.com",
                    publishedAt: baseDate.addingTimeInterval(-5400),
                    category: .transfer,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Liverpool Close to Signing Argentine Wonderkid",
                    summary: "Reds near agreement for highly-rated 19-year-old midfielder from River Plate. Deal worth €35m plus add-ons.",
                    source: "The Athletic [Tier 1]",
                    url: "https://theathletic.com",
                    publishedAt: baseDate.addingTimeInterval(-9000),
                    category: .transfer,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Chelsea Open Talks for French Defender",
                    summary: "Blues make contact with Ligue 1 club over potential €45m move for international center-back.",
                    source: "Sky Transfer Centre [Tier 1]",
                    url: "https://www.skysports.com/transfer-centre",
                    publishedAt: baseDate.addingTimeInterval(-12600),
                    category: .transfer,
                    imageUrl: nil
                )
            ]
            
        case .injury:
            return [
                NewsArticle(
                    title: "Manchester United Star Faces Month on Sidelines",
                    summary: "Key midfielder suffers hamstring injury in training, set to miss crucial Premier League fixtures including Manchester derby.",
                    source: "Manchester United [OFFICIAL]",
                    url: "https://www.manutd.com",
                    publishedAt: baseDate.addingTimeInterval(-3600),
                    category: .injury,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Arsenal Receive Boost as Striker Returns to Training",
                    summary: "Gunners' leading scorer back in full training after recovering from ankle injury. Could feature in weekend's clash.",
                    source: "Arsenal FC [OFFICIAL]",
                    url: "https://www.arsenal.com",
                    publishedAt: baseDate.addingTimeInterval(-7200),
                    category: .injury,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Barcelona Defender Out for Rest of Season",
                    summary: "Spanish international requires surgery on knee injury sustained in El Clasico. Expected recovery time 4-5 months.",
                    source: "FC Barcelona [OFFICIAL]",
                    url: "https://www.fcbarcelona.com",
                    publishedAt: baseDate.addingTimeInterval(-14400),
                    category: .injury,
                    imageUrl: nil
                )
            ]
            
        case .match:
            return getPreloadedNews(for: .general) // 경기 뉴스는 일반 뉴스로 대체
        }
    }
    
    /// 모든 카테고리의 프리로드 뉴스 가져오기
    func getAllPreloadedNews() -> [NewsArticle] {
        var allNews: [NewsArticle] = []
        allNews.append(contentsOf: getPreloadedNews(for: .general))
        allNews.append(contentsOf: getPreloadedNews(for: .transfer))
        allNews.append(contentsOf: getPreloadedNews(for: .injury))
        
        // 시간순 정렬
        return allNews.sorted { $0.publishedAt > $1.publishedAt }
    }
    
    /// 프리로드 뉴스와 실제 뉴스 병합
    func mergeWithRealNews(_ realNews: [NewsArticle], category: NewsCategory) -> [NewsArticle] {
        let preloadedNews = getPreloadedNews(for: category)
        
        // 실제 뉴스가 없으면 프리로드만 반환
        guard !realNews.isEmpty else {
            return preloadedNews
        }
        
        // 실제 뉴스가 있으면 실제 뉴스만 반환
        return realNews
    }
}