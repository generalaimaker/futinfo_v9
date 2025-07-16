import Foundation
import SwiftUI

/// 확장된 축구 뉴스 RSS 서비스 - 더 많은 고품질 소스
final class ExpandedFootballRSSService {
    
    static let shared = ExpandedFootballRSSService()
    
    private init() {}
    
    // MARK: - 확장된 RSS 소스 목록
    
    enum ExpandedRSSSource: String, CaseIterable {
        // === 공식 소스 ===
        case premierLeague = "https://www.premierleague.com/rss/news"
        case uefa = "https://www.uefa.com/rssfeed/news/rss.xml"
        case fifa = "https://www.fifa.com/rss/index.xml"
        case bundesliga = "https://www.bundesliga.com/en/news/rss"
        case laLiga = "https://www.laliga.com/en-GB/rss"
        case serieA = "https://www.legaseriea.it/en/news/rss"
        case ligue1 = "https://www.ligue1.com/rss"
        
        // === Tier 1 언론사 (최고 신뢰도) ===
        case bbcSport = "https://feeds.bbci.co.uk/sport/football/rss.xml"
        case skySports = "https://www.skysports.com/rss/12040"
        case skyTransfers = "https://www.skysports.com/rss/11095" // Sky Sports Transfer Centre
        case guardian = "https://www.theguardian.com/football/rss"
        case guardianTransfers = "https://www.theguardian.com/football/transfers/rss"
        case athletic = "https://theathletic.com/soccer/rss/"
        case telegraph = "https://www.telegraph.co.uk/football/rss"
        case times = "https://www.thetimes.co.uk/sport/football/rss"
        case independent = "https://www.independent.co.uk/sport/football/rss"
        
        // === 국제 언론사 ===
        case marca = "https://e00-marca.uecdn.es/rss/en/football.xml"
        case asEn = "https://en.as.com/rss/soccer/portada.xml"
        case mundoDeportivo = "https://www.mundodeportivo.com/feed/rss/en/football"
        case lequipe = "https://www.lequipe.fr/rss/actu_rss_Football.xml"
        case gazzetta = "https://www.gazzetta.it/rss/calcio.xml"
        case bild = "https://www.bild.de/rss-feeds/rss-sport-fussball-16798960.bild.xml"
        case kicker = "https://rss.kicker.de/news/fussball"
        case footballItalia = "https://www.football-italia.net/rss.xml"
        
        // === 전문 축구 매체 ===
        case fourFourTwo = "https://www.fourfourtwo.com/rss"
        case theScore = "https://www.thescore.com/rss/soccer.rss"
        case bleacherReport = "https://bleacherreport.com/articles/feed?tag_id=11"
        case soccerNews = "https://www.soccernews.com/feed"
        case worldSoccer = "https://www.worldsoccer.com/feed"
        case onefootball = "https://onefootball.com/en/rss"
        case footballLondon = "https://www.football.london/rss.xml"
        case ninetyfiveMin = "https://ninetyfivemin.com/rss"
        
        // === 이적 전문 ===
        case transfermarkt = "https://www.transfermarkt.com/rss/news"
        case fabrizioRomano = "https://feeds.feedburner.com/fabrizio-romano" // 있다면
        case goal = "https://www.goal.com/feeds/en/news"
        case goalTransfers = "https://www.goal.com/feeds/en/transfer-news"
        case espnFC = "https://www.espn.com/espn/rss/soccer/news"
        case footballTransfers = "https://www.footballtransfers.com/en/feed"
        case transferTavern = "https://www.transfertavern.com/feed/"
        case caughtOffside = "https://www.caughtoffside.com/feed/"
        
        // === 분석 및 통계 ===
        case whoscored = "https://www.whoscored.com/rss/livescores"
        case optaSports = "https://www.optasports.com/feed/"
        case statsPerform = "https://www.statsperform.com/feed/"
        
        // === 팟캐스트 & 비디오 ===
        case skyPodcast = "https://www.skysports.com/rss/12087" // Transfer Talk podcast
        case guardianPodcast = "https://www.theguardian.com/football/series/footballweekly/rss"
        case bbcPodcast = "https://podcasts.files.bbci.co.uk/p02nq0lx.rss"
        
        // === 클럽 공식 (주요 클럽들) ===
        case manUtd = "https://www.manutd.com/en/rss/NewsAndFeatures"
        case chelsea = "https://www.chelseafc.com/en/rss"
        case arsenal = "https://www.arsenal.com/rss"
        case liverpool = "https://www.liverpoolfc.com/rss"
        case manCity = "https://www.mancity.com/rss"
        case tottenham = "https://www.tottenhamhotspur.com/feeds/football-news/rss/"
        case realMadrid = "https://www.realmadrid.com/en/rss"
        case barcelona = "https://www.fcbarcelona.com/en/rss"
        case bayern = "https://fcbayern.com/en/rss"
        case juventus = "https://www.juventus.com/en/rss"
        case psg = "https://en.psg.fr/rss"
        
        var displayName: String {
            switch self {
            // 공식 소스
            case .premierLeague: return "Premier League"
            case .uefa: return "UEFA"
            case .fifa: return "FIFA"
            case .bundesliga: return "Bundesliga"
            case .laLiga: return "La Liga"
            case .serieA: return "Serie A"
            case .ligue1: return "Ligue 1"
            
            // Tier 1 언론사
            case .bbcSport: return "BBC Sport"
            case .skySports: return "Sky Sports"
            case .skyTransfers: return "Sky Transfer Centre"
            case .guardian: return "The Guardian"
            case .guardianTransfers: return "Guardian Transfers"
            case .athletic: return "The Athletic"
            case .telegraph: return "The Telegraph"
            case .times: return "The Times"
            case .independent: return "The Independent"
            
            // 국제 언론사
            case .marca: return "Marca"
            case .asEn: return "AS English"
            case .mundoDeportivo: return "Mundo Deportivo"
            case .lequipe: return "L'Équipe"
            case .gazzetta: return "Gazzetta dello Sport"
            case .bild: return "Bild"
            case .kicker: return "Kicker"
            case .footballItalia: return "Football Italia"
            
            // 전문 매체
            case .fourFourTwo: return "FourFourTwo"
            case .theScore: return "theScore"
            case .bleacherReport: return "Bleacher Report"
            case .soccerNews: return "Soccer News"
            case .worldSoccer: return "World Soccer"
            case .onefootball: return "OneFootball"
            case .footballLondon: return "Football London"
            case .ninetyfiveMin: return "90min"
            
            // 이적 전문
            case .transfermarkt: return "Transfermarkt"
            case .fabrizioRomano: return "Fabrizio Romano"
            case .goal: return "Goal.com"
            case .goalTransfers: return "Goal Transfers"
            case .espnFC: return "ESPN FC"
            case .footballTransfers: return "Football Transfers"
            case .transferTavern: return "Transfer Tavern"
            case .caughtOffside: return "Caught Offside"
            
            // 분석
            case .whoscored: return "WhoScored"
            case .optaSports: return "Opta Sports"
            case .statsPerform: return "Stats Perform"
            
            // 팟캐스트
            case .skyPodcast: return "Sky Transfer Talk"
            case .guardianPodcast: return "Football Weekly"
            case .bbcPodcast: return "BBC Football Daily"
            
            // 클럽
            case .manUtd: return "Manchester United"
            case .chelsea: return "Chelsea FC"
            case .arsenal: return "Arsenal FC"
            case .liverpool: return "Liverpool FC"
            case .manCity: return "Manchester City"
            case .tottenham: return "Tottenham Hotspur"
            case .realMadrid: return "Real Madrid"
            case .barcelona: return "FC Barcelona"
            case .bayern: return "Bayern Munich"
            case .juventus: return "Juventus"
            case .psg: return "Paris Saint-Germain"
            }
        }
        
        var category: NewsSourceCategory {
            switch self {
            case .premierLeague, .uefa, .fifa, .bundesliga, .laLiga, .serieA, .ligue1:
                return .official
                
            case .bbcSport, .skySports, .skyTransfers, .guardian, .guardianTransfers,
                 .athletic, .telegraph, .times, .independent:
                return .tier1Media
                
            case .marca, .asEn, .mundoDeportivo, .lequipe, .gazzetta, .bild, .kicker, .footballItalia:
                return .internationalMedia
                
            case .fourFourTwo, .theScore, .bleacherReport, .soccerNews, .worldSoccer,
                 .onefootball, .footballLondon, .ninetyfiveMin:
                return .specializedMedia
                
            case .transfermarkt, .fabrizioRomano, .goal, .goalTransfers, .espnFC,
                 .footballTransfers, .transferTavern, .caughtOffside:
                return .transferSpecialist
                
            case .whoscored, .optaSports, .statsPerform:
                return .analytics
                
            case .skyPodcast, .guardianPodcast, .bbcPodcast:
                return .podcast
                
            case .manUtd, .chelsea, .arsenal, .liverpool, .manCity, .tottenham,
                 .realMadrid, .barcelona, .bayern, .juventus, .psg:
                return .clubOfficial
            }
        }
        
        var trustScore: Int {
            switch category {
            case .official, .clubOfficial:
                return 100
            case .tier1Media:
                return 95
            case .analytics:
                return 90
            case .internationalMedia:
                return 85
            case .specializedMedia:
                return 80
            case .transferSpecialist:
                return self == .transfermarkt || self == .fabrizioRomano ? 85 : 70
            case .podcast:
                return 90
            }
        }
        
        var language: Language {
            switch self {
            case .marca, .asEn, .mundoDeportivo:
                return .spanish
            case .lequipe:
                return .french
            case .gazzetta:
                return .italian
            case .bild, .kicker:
                return .german
            default:
                return .english
            }
        }
    }
    
    // MARK: - Supporting Types
    
    enum NewsSourceCategory {
        case official
        case tier1Media
        case internationalMedia
        case specializedMedia
        case transferSpecialist
        case analytics
        case podcast
        case clubOfficial
        
        var displayName: String {
            switch self {
            case .official: return "공식 기구"
            case .tier1Media: return "주요 언론"
            case .internationalMedia: return "국제 언론"
            case .specializedMedia: return "축구 전문"
            case .transferSpecialist: return "이적 전문"
            case .analytics: return "분석/통계"
            case .podcast: return "팟캐스트"
            case .clubOfficial: return "클럽 공식"
            }
        }
    }
    
    enum Language {
        case english
        case spanish
        case french
        case italian
        case german
        
        var code: String {
            switch self {
            case .english: return "en"
            case .spanish: return "es"
            case .french: return "fr"
            case .italian: return "it"
            case .german: return "de"
            }
        }
    }
    
    // MARK: - Best Sources by Category
    
    static func getBestSources(for category: NewsCategory, limit: Int = 10) -> [ExpandedRSSSource] {
        switch category {
        case .transfer:
            return [
                .skyTransfers,
                .guardianTransfers,
                .transfermarkt,
                .fabrizioRomano,
                .goalTransfers,
                .footballTransfers,
                .bbcSport,
                .athletic,
                .marca,
                .goal
            ].prefix(limit).map { $0 }
            
        case .match:
            return [
                .bbcSport,
                .skySports,
                .guardian,
                .espnFC,
                .whoscored,
                .premierLeague,
                .uefa,
                .fourFourTwo,
                .theScore,
                .onefootball
            ].prefix(limit).map { $0 }
            
        case .injury:
            return [
                .bbcSport,
                .skySports,
                .athletic,
                .guardian,
                .telegraph,
                .transfermarkt,
                .espnFC,
                .goal,
                .fourFourTwo,
                .bleacherReport
            ].prefix(limit).map { $0 }
            
        default:
            return [
                .bbcSport,
                .skySports,
                .guardian,
                .athletic,
                .espnFC,
                .fourFourTwo,
                .goal,
                .theScore,
                .onefootball,
                .marca
            ].prefix(limit).map { $0 }
        }
    }
    
    // MARK: - Premium Sources (Highest Quality)
    
    static var premiumSources: [ExpandedRSSSource] {
        [
            // 공식 기구
            .premierLeague,
            .uefa,
            .fifa,
            
            // 최고 신뢰도 언론
            .bbcSport,
            .guardian,
            .athletic,
            .skySports,
            
            // 최고 이적 전문가
            .transfermarkt,
            .fabrizioRomano,
            
            // 최고 분석
            .whoscored,
            .optaSports
        ]
    }
    
    // MARK: - Sources by League
    
    static func getSourcesForLeague(_ league: String) -> [ExpandedRSSSource] {
        switch league.lowercased() {
        case "premier league", "epl":
            return [.premierLeague, .bbcSport, .skySports, .guardian, .athletic, .footballLondon]
            
        case "la liga":
            return [.laLiga, .marca, .asEn, .mundoDeportivo, .realMadrid, .barcelona]
            
        case "serie a":
            return [.serieA, .gazzetta, .footballItalia, .juventus]
            
        case "bundesliga":
            return [.bundesliga, .bild, .kicker, .bayern]
            
        case "ligue 1":
            return [.ligue1, .lequipe, .psg]
            
        default:
            return premiumSources
        }
    }
}