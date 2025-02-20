import Foundation
import SwiftUI

// MARK: - Common Types

// MARK: - Player Info
struct Birth: Codable {
    let date: String?
    let place: String?
    let country: String?
}

struct PlayerInfo: Codable {
    let id: Int
    let name: String
    let firstname: String?
    let lastname: String?
    let age: Int?
    let nationality: String?
    let height: String?
    let weight: String?
    let photo: String?
}

// MARK: - Player Game Stats
struct PlayerGameStats: Codable {
    let minutes: Int?
    let number: Int?
    let position: String?
    let rating: String?
    let captain: Bool?
    let substitute: Bool?
    let appearences: Int?
    let lineups: Int?
}

// MARK: - Player Statistics
struct PlayerShots: Codable {
    let total: Int?
    let on: Int?
}

struct PlayerGoals: Codable {
    let total: Int?
    let conceded: Int?
    let assists: Int?
    let saves: Int?
}

struct PlayerPasses: Codable {
    let total: Int?
    let key: Int?
    let accuracy: String?
}

struct PlayerTackles: Codable {
    let total: Int?
    let blocks: Int?
    let interceptions: Int?
}

struct PlayerDuels: Codable {
    let total: Int?
    let won: Int?
}

struct PlayerDribbles: Codable {
    let attempts: Int?
    let success: Int?
    let past: Int?
}

struct PlayerFouls: Codable {
    let drawn: Int?
    let committed: Int?
}

struct PlayerCards: Codable {
    let yellow: Int?
    let yellowred: Int?
    let red: Int?
}

struct PlayerPenalty: Codable {
    let won: Int?
    let committed: Int?
    let scored: Int?
    let missed: Int?
    let saved: Int?
}

// MARK: - Match Statistics
struct PlayerMatchStats: Codable {
    let games: PlayerGameStats
    let offsides: Int?
    let shots: PlayerShots?
    let goals: PlayerGoals?
    let passes: PlayerPasses?
    let tackles: PlayerTackles?
    let duels: PlayerDuels?
    let dribbles: PlayerDribbles?
    let fouls: PlayerFouls?
    let cards: PlayerCards?
}

// MARK: - Season Statistics
struct PlayerSeasonStats: Codable {
    let team: Team
    let league: PlayerLeagueInfo
    let games: PlayerGameStats
    let shots: PlayerShots?
    let goals: PlayerGoals?
    let passes: PlayerPasses?
    let tackles: PlayerTackles?
    let duels: PlayerDuels?
    let dribbles: PlayerDribbles?
    let fouls: PlayerFouls?
    let cards: PlayerCards?
    let penalty: PlayerPenalty?
}

struct PlayerLeagueInfo: Codable {
    let id: Int
    let name: String
    let country: String?
    let logo: String
    let season: Int
}