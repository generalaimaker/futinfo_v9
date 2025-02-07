import Foundation

// MARK: - Common Models
struct Parameters: Codable {
    let league: String?
    let season: String?
    let current: String?
    let live: String?
    let next: String?
    let from: String?
    let to: String?
}

struct Paging: Codable {
    let current: Int
    let total: Int
}

// MARK: - League Response
struct LeaguesResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [LeagueDetails]
}

// MARK: - League Details
struct LeagueDetails: Codable {
    let league: LeagueInfo
    let country: Country?
    let seasons: [Season]?
}

// MARK: - League Info
struct LeagueInfo: Codable {
    let id: Int
    let name: String
    let type: String
    let logo: String
}

// MARK: - Country
struct Country: Codable {
    let name: String
    let code: String?
    let flag: String?
}

// MARK: - Season
struct Season: Codable {
    let year: Int
    let start: String
    let end: String
    let current: Bool
    let coverage: Coverage?
}

// MARK: - Coverage
struct Coverage: Codable {
    let fixtures: FixtureCoverage?
    let standings: Bool?
    let players: Bool?
    let topScorers: Bool?
    let topAssists: Bool?
    let topCards: Bool?
    let injuries: Bool?
    let predictions: Bool?
    let odds: Bool?
    
    enum CodingKeys: String, CodingKey {
        case fixtures
        case standings
        case players
        case topScorers = "top_scorers"
        case topAssists = "top_assists"
        case topCards = "top_cards"
        case injuries
        case predictions
        case odds
    }
}

// MARK: - Fixture Coverage
struct FixtureCoverage: Codable {
    let events: Bool?
    let lineups: Bool?
    let statisticsFixtures: Bool?
    let statisticsPlayers: Bool?
    
    enum CodingKeys: String, CodingKey {
        case events
        case lineups
        case statisticsFixtures = "statistics_fixtures"
        case statisticsPlayers = "statistics_players"
    }
}

// MARK: - Supported Leagues
enum SupportedLeagues {
    static let allLeagues = [39, 140, 135, 78, 2, 3] // Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
    
    static func getName(_ id: Int) -> String {
        switch id {
        case 39:
            return "Premier League"
        case 140:
            return "La Liga"
        case 135:
            return "Serie A"
        case 78:
            return "Bundesliga"
        case 2:
            return "Champions League"
        case 3:
            return "Europa League"
        default:
            return "알 수 없는 리그"
        }
    }
    
    static func getCountryCode(_ id: Int) -> String {
        switch id {
        case 39:
            return "GB" // 잉글랜드
        case 140:
            return "ES" // 스페인
        case 135:
            return "IT" // 이탈리아
        case 78:
            return "DE" // 독일
        case 2, 3:
            return "EU" // UEFA
        default:
            return ""
        }
    }
    
    static func getCountryName(_ id: Int) -> String {
        switch id {
        case 39:
            return "England"
        case 140:
            return "Spain"
        case 135:
            return "Italy"
        case 78:
            return "Germany"
        case 2, 3:
            return "UEFA"
        default:
            return ""
        }
    }
}