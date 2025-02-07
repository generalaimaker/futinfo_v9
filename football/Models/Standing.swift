import Foundation

// MARK: - Standings Response
struct StandingsResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [StandingData]
}

// MARK: - Standing Data
struct StandingData: Codable {
    let league: StandingLeagueInfo
}

// MARK: - Standing League Info
struct StandingLeagueInfo: Codable {
    let id: Int
    let name: String
    let country: String
    let logo: String
    let flag: String?
    let season: Int
    let standings: [[Standing]]
}

// MARK: - Standing
struct Standing: Codable, Identifiable {
    let rank: Int
    let team: StandingTeam
    let points: Int
    let goalsDiff: Int
    let group: String?
    let form: String?
    let status: String?
    let description: String?
    let all: Games
    let home: Games
    let away: Games
    let update: String
    
    var id: Int { rank }
}

// MARK: - Standing Team
struct StandingTeam: Codable {
    let id: Int
    let name: String
    let logo: String
}

// MARK: - Games
struct Games: Codable {
    let played: Int
    let win: Int
    let draw: Int
    let lose: Int
    let goals: GameGoals
}

// MARK: - Game Goals
struct GameGoals: Codable {
    let goalsFor: Int
    let goalsAgainst: Int
    
    enum CodingKeys: String, CodingKey {
        case goalsFor = "for"
        case goalsAgainst = "against"
    }
}