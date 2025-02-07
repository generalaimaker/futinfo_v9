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
        "\(time.elapsed)\(team.id)\(player.id ?? 0)\(type)\(detail)"
    }
    
    // 이벤트 타입 분류
    var eventCategory: EventCategory {
        switch type.lowercased() {
        case "goal":
            switch detail.lowercased() {
            case let d where d.contains("normal goal"): return .goal(.normal)
            case let d where d.contains("penalty"): return .goal(.penalty)
            case let d where d.contains("own goal"): return .goal(.own)
            default: return .goal(.normal)
            }
        case "card":
            switch detail.lowercased() {
            case let d where d.contains("yellow"): return .card(.yellow)
            case let d where d.contains("red"): return .card(.red)
            default: return .card(.yellow)
            }
        case "subst": return .substitution
        case "var":
            switch detail.lowercased() {
            case let d where d.contains("goal"): return .var(.goal)
            case let d where d.contains("penalty"): return .var(.penalty)
            case let d where d.contains("card"): return .var(.card)
            default: return .var(.other)
            }
        default: return .other
        }
    }
    
    // 이벤트 아이콘
    var icon: String {
        switch eventCategory {
        case .goal(let type):
            switch type {
            case .normal: return "⚽️"
            case .penalty: return "🎯"
            case .own: return "🔄⚽️"
            }
        case .card(let type):
            switch type {
            case .yellow: return "🟨"
            case .red: return "🟥"
            }
        case .substitution: return "🔄"
        case .var(let type):
            switch type {
            case .goal: return "🎥⚽️"
            case .penalty: return "🎥🎯"
            case .card: return "🎥🟨"
            case .other: return "🎥"
            }
        case .other: return "📝"
        }
    }
}

// 이벤트 카테고리 열거형
enum EventCategory {
    enum GoalType {
        case normal, penalty, own
    }
    
    enum CardType {
        case yellow, red
    }
    
    enum VarType {
        case goal, penalty, card, other
    }
    
    case goal(GoalType)
    case card(CardType)
    case substitution
    case `var`(VarType)
    case other
}

struct EventTime: Codable {
    let elapsed: Int
    let extra: Int?
    
    var displayTime: String {
        if let extra = extra {
            return "\(elapsed)+\(extra)'"
        }
        return "\(elapsed)'"
    }
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
    var statistics: [Statistic]
    
    // 특정 타입의 통계 값 가져오기
    func getValue(for type: StatisticType) -> StatisticValue {
        statistics.first { $0.type == type.rawValue }?.value ?? .null
    }
}

// 통계 타입 열거형
enum StatisticType: String {
    case shotsOnGoal = "Shots on Goal"
    case shotsOffGoal = "Shots off Goal"
    case totalShots = "Total Shots"
    case blockedShots = "Blocked Shots"
    case shotsInsideBox = "Shots insidebox"
    case shotsOutsideBox = "Shots outsidebox"
    case fouls = "Fouls"
    case cornerKicks = "Corner Kicks"
    case offsides = "Offsides"
    case ballPossession = "Ball Possession"
    case yellowCards = "Yellow Cards"
    case redCards = "Red Cards"
    case saves = "Goalkeeper Saves"
    case totalPasses = "Total passes"
    case passesAccurate = "Passes accurate"
    case passesPercentage = "Passes %"
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

// MARK: - Fixture Players Statistics
struct FixturePlayersResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [TeamPlayersStatistics]
}

struct TeamPlayersStatistics: Codable {
    let team: Team
    let players: [FixturePlayerStats]
}

struct FixturePlayerStats: Codable, Identifiable {
    let player: PlayerInfo
    let statistics: [PlayerMatchStats]
    
    var id: Int { player.id }
}

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

struct PlayerGameStats: Codable {
    let minutes: Int?
    let number: Int?
    let position: String?
    let rating: String?
    let captain: Bool?
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
    
    // 포메이션 배열로 변환 (예: "4-4-2" -> [4,4,2])
    var formationArray: [Int] {
        formation.split(separator: "-").compactMap { Int($0) }
    }
    
    // 포지션별 선수 그룹화
    var playersByPosition: [String: [LineupPlayer]] {
        Dictionary(grouping: startXI) { player in
            player.pos ?? "Unknown"
        }
    }
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
    
    // 그리드 위치 계산 (예: "1:4" -> x:1, y:4)
    var gridPosition: (x: Int, y: Int)? {
        guard let grid = grid else { return nil }
        let components = grid.split(separator: ":").compactMap { Int($0) }
        guard components.count == 2 else { return nil }
        return (x: components[0], y: components[1])
    }
}

struct Coach: Codable {
    let id: Int
    let name: String
    let photo: String
}
