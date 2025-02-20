import Foundation

// MARK: - Team Standing Response
struct TeamStandingResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [StandingResponse]
}

struct StandingResponse: Codable {
    let league: StandingLeague
}

struct StandingLeague: Codable {
    let id: Int
    let name: String
    let country: String
    let logo: String
    let flag: String?
    let season: Int
    let standings: [[TeamStanding]]
}

struct TeamStanding: Codable, Identifiable {
    let rank: Int
    let team: TeamInfo
    let points: Int
    let goalsDiff: Int
    let group: String?
    let form: String?
    let status: String?
    let description: String?
    let all: TeamStats
    let home: TeamStats
    let away: TeamStats
    let update: String
    
    var id: Int { team.id }
}

struct TeamStats: Codable {
    let played: Int
    let win: Int
    let draw: Int
    let lose: Int
    let goals: TeamGoals
}

struct TeamGoals: Codable {
    let `for`: Int
    let against: Int
}