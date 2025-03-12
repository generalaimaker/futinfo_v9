import Foundation

// MARK: - Common Models
public struct Parameters: Codable {
    public let league: String?
    public let season: String?
    public let current: String?
    public let live: String?
    public let next: String?
    public let from: String?
    public let to: String?
}

public struct Paging: Codable {
    public let current: Int
    public let total: Int
}

// MARK: - League Response
public struct LeaguesResponse: Codable {
    public let get: String
    public let parameters: Parameters
    public let errors: [String]
    public let results: Int
    public let paging: Paging
    public let response: [LeagueDetails]
}

// MARK: - League Details
public struct LeagueDetails: Codable {
    public let league: LeagueInfo
    public let country: Country?
    public let seasons: [Season]?
}

// MARK: - League Info
public struct LeagueInfo: Codable {
    public let id: Int
    public let name: String
    public let type: String
    public let logo: String
}

// MARK: - Country
public struct Country: Codable {
    public let name: String
    public let code: String?
    public let flag: String?
}

// MARK: - Season
public struct Season: Codable {
    public let year: Int
    public let start: String
    public let end: String
    public let current: Bool
    public let coverage: Coverage?
}

// MARK: - Coverage
public struct Coverage: Codable {
    public let fixtures: FixtureCoverage?
    public let standings: Bool?
    public let players: Bool?
    public let topScorers: Bool?
    public let topAssists: Bool?
    public let topCards: Bool?
    public let injuries: Bool?
    public let predictions: Bool?
    public let odds: Bool?
    
    public enum CodingKeys: String, CodingKey {
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
public struct FixtureCoverage: Codable {
    public let events: Bool?
    public let lineups: Bool?
    public let statisticsFixtures: Bool?
    public let statisticsPlayers: Bool?
    
    public enum CodingKeys: String, CodingKey {
        case events
        case lineups
        case statisticsFixtures = "statistics_fixtures"
        case statisticsPlayers = "statistics_players"
    }
}

// MARK: - Supported Leagues
public enum SupportedLeagues {
    public static let allLeagues = [39, 140, 135, 78, 2, 3] // Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
    
    public static func getName(_ id: Int) -> String {
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
    
    public static func getCountryCode(_ id: Int) -> String {
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
    
    public static func getCountryName(_ id: Int) -> String {
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