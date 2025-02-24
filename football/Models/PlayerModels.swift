import Foundation
import SwiftUI


// MARK: - Common Types

// MARK: - Player Info
struct PlayerInfo: Codable {
    let id: Int?
    let name: String?
    let firstname: String?
    let lastname: String?
    let age: Int?
    let nationality: String?
    let height: String?
    let weight: String?
    let photo: String?
    let injured: Bool?
    let birth: Birth?
    
    struct Birth: Codable {
        let date: String?
        let place: String?
        let country: String?
    }
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
    let games: PlayerGameStats?
    let offsides: Int?
    let shots: PlayerShots?
    let goals: PlayerGoals?
    let passes: PlayerPasses?
    let tackles: PlayerTackles?
    let duels: PlayerDuels?
    let dribbles: PlayerDribbles?
    let fouls: PlayerFouls?
    let cards: PlayerCards?
    let penalty: PlayerPenalty?
    let substitutes: PlayerSubstitutes?
    let team: Team?
    let league: PlayerLeagueInfo?
    
    init(
        games: PlayerGameStats? = nil,
        offsides: Int? = nil,
        shots: PlayerShots? = nil,
        goals: PlayerGoals? = nil,
        passes: PlayerPasses? = nil,
        tackles: PlayerTackles? = nil,
        duels: PlayerDuels? = nil,
        dribbles: PlayerDribbles? = nil,
        fouls: PlayerFouls? = nil,
        cards: PlayerCards? = nil,
        penalty: PlayerPenalty? = nil,
        substitutes: PlayerSubstitutes? = nil,
        team: Team? = nil,
        league: PlayerLeagueInfo? = nil
    ) {
        self.games = games
        self.offsides = offsides
        self.shots = shots
        self.goals = goals
        self.passes = passes
        self.tackles = tackles
        self.duels = duels
        self.dribbles = dribbles
        self.fouls = fouls
        self.cards = cards
        self.penalty = penalty
        self.substitutes = substitutes
        self.team = team
        self.league = league
    }
}

// MARK: - Season Statistics
struct PlayerSeasonStats: Codable {
    let team: Team?
    let league: PlayerLeagueInfo?
    let games: PlayerGameStats?
    let substitutes: PlayerSubstitutes?
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

struct PlayerSubstitutes: Codable {
    let `in`: Int?
    let out: Int?
    let bench: Int?
}

struct PlayerLeagueInfo: Codable {
    let id: Int?
    let name: String?
    let country: String?
    let logo: String?
    let season: Int?
    let flag: String?
}
