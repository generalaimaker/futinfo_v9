import Foundation

// MARK: - Events
struct FixtureEventResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [FixtureEvent]
}

struct FixtureEvent: Codable, Identifiable {
    let time: EventTime
    let team: Team
    let player: EventPlayer
    let assist: EventPlayer?
    let type: String
    let detail: String
    let comments: String?
    
    var id: String {
        "\(time.elapsed)\(team.id)\(player.id)\(type)\(detail)"
    }
}

struct EventTime: Codable {
    let elapsed: Int
    let extra: Int?
}

struct EventPlayer: Codable {
    let id: Int?
    let name: String?
}

// MARK: - Statistics
struct FixtureStatisticsResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [TeamStatistics]
}

struct TeamStatistics: Codable {
    let team: Team
    let statistics: [Statistic]
}

struct Statistic: Codable {
    let type: String
    let value: StatisticValue
}

enum StatisticValue: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case null
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let stringValue = try? container.decode(String.self) {
            self = .string(stringValue)
        } else if let intValue = try? container.decode(Int.self) {
            self = .int(intValue)
        } else if let doubleValue = try? container.decode(Double.self) {
            self = .double(doubleValue)
        } else if container.decodeNil() {
            self = .null
        } else {
            throw DecodingError.typeMismatch(StatisticValue.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Wrong type for StatisticValue"))
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .int(let value):
            try container.encode(value)
        case .double(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }
    
    var displayValue: String {
        switch self {
        case .string(let value): return value
        case .int(let value): return String(value)
        case .double(let value): return String(format: "%.1f", value)
        case .null: return "-"
        }
    }
}

// MARK: - Lineups
struct FixtureLineupResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [TeamLineup]
}

struct TeamLineup: Codable {
    let team: Team
    let formation: String
    let startXI: [LineupPlayer]
    let substitutes: [LineupPlayer]
    let coach: Coach
}

struct LineupPlayer: Codable, Identifiable {
    struct PlayerInfo: Codable {
        let id: Int
        let name: String
        let number: Int
        let pos: String?
        let grid: String?
    }
    
    let player: PlayerInfo
    
    var id: Int { player.id }
    var name: String { player.name }
    var number: Int { player.number }
    var pos: String? { player.pos }
    var grid: String? { player.grid }
}

struct Coach: Codable {
    let id: Int
    let name: String
    let photo: String
}
