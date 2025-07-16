import Foundation

// MARK: - Team Response Types

struct TeamResponse: Codable {
    let response: [TeamData]
}

struct TeamData: Codable {
    let team: Team
    let venue: Venue?
}

struct TeamStatisticsResponse: Codable {
    let response: TeamSeasonStatistics
}

struct SupabaseTeamSquadResponse: Codable {
    let response: [SupabaseTeamSquadData]
}

struct SupabaseTeamSquadData: Codable {
    let team: Team
    let players: [SupabaseSquadPlayer]?
}

struct SupabaseSquadPlayer: Codable {
    let id: Int
    let name: String
    let firstname: String?
    let lastname: String?
    let age: Int?
    let birth: Birth?
    let nationality: String?
    let height: String?
    let weight: String?
    let injured: Bool?
    let photo: String?
}

struct HeadToHeadResponse: Codable {
    let response: [Fixture]
}

// MARK: - Player Response Types

struct SupabasePlayerResponse: Codable {
    let response: [PlayerData]
}

struct PlayerData: Codable {
    let player: Player
    let statistics: [PlayerSeasonStats]?
}

// MARK: - Search Response Types

struct SupabaseSearchResponse: Codable {
    let teams: [TeamData]
    let players: [PlayerData]
    let leagues: [LeagueData]
}

struct LeagueData: Codable {
    let league: LeagueInfo
    let country: Country?
    let seasons: [Season]?
}