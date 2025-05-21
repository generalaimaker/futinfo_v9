import Foundation
import SwiftUI

// MARK: - Injuries
struct InjuriesResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    let get: String
    let parameters: ResponseParameters // APIResponseTypes.swift에 정의됨
    let errors: Any
    let results: Int
    let paging: APIPaging // ResponsePaging -> APIPaging 수정
    let response: [InjuryData]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(ResponseParameters.self, forKey: .parameters)
        
        // errors 필드 디코딩 (Any 타입으로 변경)
        if let errorArray = try? container.decode([String].self, forKey: .errors) {
            errors = errorArray
        } else if let errorDict = try? container.decode([String: String].self, forKey: .errors) {
            errors = errorDict
        } else {
            errors = []
        }
        
        results = try container.decode(Int.self, forKey: .results)
        paging = try container.decode(APIPaging.self, forKey: .paging)
        response = try container.decode([InjuryData].self, forKey: .response)
    }
    
    // 사용자 정의 인코더 추가
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(get, forKey: .get)
        try container.encode(parameters, forKey: .parameters)
        
        // errors 필드 인코딩
        if let errorArray = errors as? [String] {
            try container.encode(errorArray, forKey: .errors)
        } else if let errorDict = errors as? [String: String] {
            try container.encode(errorDict, forKey: .errors)
        } else {
            try container.encode([] as [String], forKey: .errors)
        }
        
        try container.encode(results, forKey: .results)
        try container.encode(paging, forKey: .paging)
        try container.encode(response, forKey: .response)
    }
    
    // CodingKeys 열거형 추가
    private enum CodingKeys: String, CodingKey {
        case get, parameters, errors, results, paging, response
    }
}

struct InjuryData: Codable {
    let player: InjuryPlayer
    let team: Team
    let fixture: InjuryFixture?
    let league: InjuryLeague?
}

struct InjuryPlayer: Codable {
    let id: Int
    let name: String
    let photo: String?
    let type: String
    let reason: String?
    let position: String?
}

struct InjuryFixture: Codable {
    let id: Int?
    let date: String?
}

struct InjuryLeague: Codable {
    let id: Int?
    let name: String?
    let season: Int?
}

struct InjuryInfo: Codable {
    let type: String
    let reason: String?
    let date: String?
}



// MARK: - Events
struct FixtureEventResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    let get: String
    let parameters: ResponseParameters // APIResponseTypes.swift에 정의됨
    let errors: Any
    let results: Int
    let paging: APIPaging // ResponsePaging -> APIPaging 수정
    let response: [FixtureEvent]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(ResponseParameters.self, forKey: .parameters)
        
        // errors 필드 디코딩 (Any 타입으로 변경)
        if let errorArray = try? container.decode([String].self, forKey: .errors) {
            errors = errorArray
        } else if let errorDict = try? container.decode([String: String].self, forKey: .errors) {
            errors = errorDict
        } else {
            errors = []
        }
        
        results = try container.decode(Int.self, forKey: .results)
        paging = try container.decode(APIPaging.self, forKey: .paging)
        response = try container.decode([FixtureEvent].self, forKey: .response)
    }
    
    // 사용자 정의 인코더 추가
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(get, forKey: .get)
        try container.encode(parameters, forKey: .parameters)
        
        // errors 필드 인코딩
        if let errorArray = errors as? [String] {
            try container.encode(errorArray, forKey: .errors)
        } else if let errorDict = errors as? [String: String] {
            try container.encode(errorDict, forKey: .errors)
        } else {
            try container.encode([] as [String], forKey: .errors)
        }
        
        try container.encode(results, forKey: .results)
        try container.encode(paging, forKey: .paging)
        try container.encode(response, forKey: .response)
    }
    
    // CodingKeys 열거형 추가
    private enum CodingKeys: String, CodingKey {
        case get, parameters, errors, results, paging, response
    }
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
    
    // 연장전 여부를 확인하는 계산 속성
    var isExtraTime: Bool {
        return time.elapsed > 90
    }
    
    // 실제 득점된 골인지 확인하는 계산 속성
    var isActualGoal: Bool {
        // 타입이 "Goal"이 아니면 득점이 아님
        guard type.lowercased() == "goal" else { return false }
        
        // 페널티 획득만 한 경우 제외
        if detail.lowercased().contains("won") {
            return false
        }
        
        // 페널티 놓친 경우 제외
        if detail.lowercased().contains("missed") {
            return false
        }
        
        return true
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
            case .own: return "💢⚽️"
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
    
    // 골 이벤트인지 확인하는 속성
    var isGoal: Bool {
        switch self {
        case .goal(_): return true
        case .var(.goal): return true
        default: return false
        }
    }
    
    // 자책골인지 확인하는 속성
    var isOwnGoal: Bool {
        switch self {
        case .goal(.own): return true
        default: return false
        }
    }
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
struct FixtureStatisticsResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    let get: String
    let parameters: ResponseParameters // APIResponseTypes.swift에 정의됨
    let errors: Any
    let results: Int
    let paging: APIPaging // ResponsePaging -> APIPaging 수정
    let response: [TeamStatistics]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(ResponseParameters.self, forKey: .parameters)
        
        // errors 필드 디코딩 (Any 타입으로 변경)
        if let errorArray = try? container.decode([String].self, forKey: .errors) {
            errors = errorArray
        } else if let errorDict = try? container.decode([String: String].self, forKey: .errors) {
            errors = errorDict
        } else {
            errors = []
        }
        
        results = try container.decode(Int.self, forKey: .results)
        paging = try container.decode(APIPaging.self, forKey: .paging)
        response = try container.decode([TeamStatistics].self, forKey: .response)
    }
    
    // 사용자 정의 인코더 추가
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(get, forKey: .get)
        try container.encode(parameters, forKey: .parameters)
        
        // errors 필드 인코딩
        if let errorArray = errors as? [String] {
            try container.encode(errorArray, forKey: .errors)
        } else if let errorDict = errors as? [String: String] {
            try container.encode(errorDict, forKey: .errors)
        } else {
            try container.encode([] as [String], forKey: .errors)
        }
        
        try container.encode(results, forKey: .results)
        try container.encode(paging, forKey: .paging)
        try container.encode(response, forKey: .response)
    }
    
    // CodingKeys 열거형 추가
    private enum CodingKeys: String, CodingKey {
        case get, parameters, errors, results, paging, response
    }
}

public struct TeamStatistics: Codable {
    public let team: Team
    public var statistics: [FixtureStatistic]
    
    public init(team: Team, statistics: [FixtureStatistic]) {
        self.team = team
        self.statistics = statistics
    }
    
    // 특정 타입의 통계 값 가져오기
    public func getValue(for type: StatisticType) -> StatisticValue {
        statistics.first { $0.type == type.rawValue }?.value ?? .null
    }
}

public struct FixtureStatistic: Codable {
    public let type: String
    public let value: StatisticValue
    
    public init(type: String, value: StatisticValue) {
        self.type = type
        self.value = value
    }
}

public enum StatisticValue: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case null
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        // null 체크를 먼저
        if container.decodeNil() {
            self = .null
            return
        }
        
        // 문자열로 먼저 디코딩 시도
        if let stringValue = try? container.decode(String.self) {
            // 숫자 형태의 문자열인 경우 숫자로 변환 시도
            if let intValue = Int(stringValue) {
                self = .int(intValue)
            } else if let doubleValue = Double(stringValue) {
                self = .double(doubleValue)
            } else {
                self = .string(stringValue)
            }
            return
        }
        
        // 정수 시도
        if let intValue = try? container.decode(Int.self) {
            self = .int(intValue)
            return
        }
        
        // 실수 시도
        if let doubleValue = try? container.decode(Double.self) {
            self = .double(doubleValue)
            return
        }
        
        throw DecodingError.typeMismatch(
            StatisticValue.self,
            DecodingError.Context(
                codingPath: decoder.codingPath,
                debugDescription: "Expected String, Int, Double, or null"
            )
        )
    }
    
    public func encode(to encoder: Encoder) throws {
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
    
    public var displayValue: String {
        switch self {
        case .string(let value): return value
        case .int(let value): return String(value)
        case .double(let value): return String(format: "%.1f", value)
        case .null: return "-"
        }
    }
}

// MARK: - Fixture Players Statistics
struct FixturePlayersResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    let get: String
    let parameters: ResponseParameters // APIResponseTypes.swift에 정의됨
    let errors: Any
    let results: Int
    let paging: APIPaging // ResponsePaging -> APIPaging 수정
    let response: [TeamPlayersStatistics]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(ResponseParameters.self, forKey: .parameters)
        
        // errors 필드 디코딩 (Any 타입으로 변경)
        if let errorArray = try? container.decode([String].self, forKey: .errors) {
            errors = errorArray
        } else if let errorDict = try? container.decode([String: String].self, forKey: .errors) {
            errors = errorDict
        } else {
            errors = []
        }
        
        results = try container.decode(Int.self, forKey: .results)
        paging = try container.decode(APIPaging.self, forKey: .paging)
        response = try container.decode([TeamPlayersStatistics].self, forKey: .response)
    }
    
    // 사용자 정의 인코더 추가
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(get, forKey: .get)
        try container.encode(parameters, forKey: .parameters)
        
        // errors 필드 인코딩
        if let errorArray = errors as? [String] {
            try container.encode(errorArray, forKey: .errors)
        } else if let errorDict = errors as? [String: String] {
            try container.encode(errorDict, forKey: .errors)
        } else {
            try container.encode([] as [String], forKey: .errors)
        }
        
        try container.encode(results, forKey: .results)
        try container.encode(paging, forKey: .paging)
        try container.encode(response, forKey: .response)
    }
    
    // CodingKeys 열거형 추가
    private enum CodingKeys: String, CodingKey {
        case get, parameters, errors, results, paging, response
    }
}

struct TeamPlayersStatistics: Codable {
    let team: Team
    let players: [FixturePlayerStats]
}

struct FixturePlayerStats: Codable, Identifiable {
    let player: PlayerInfo
    let statistics: [PlayerMatchStats]
    
    var id: Int { player.id ?? 0 }
    
    var team: Team? {
        statistics.first?.team
    }
}


// MARK: - Lineups
struct FixtureLineupResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    let get: String
    let parameters: ResponseParameters // APIResponseTypes.swift에 정의됨
    let errors: Any
    let results: Int
    let paging: APIPaging // ResponsePaging -> APIPaging 수정
    let response: [TeamLineup]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(ResponseParameters.self, forKey: .parameters)
        
        // errors 필드 디코딩 (Any 타입으로 변경)
        if let errorArray = try? container.decode([String].self, forKey: .errors) {
            errors = errorArray
        } else if let errorDict = try? container.decode([String: String].self, forKey: .errors) {
            errors = errorDict
        } else {
            errors = []
        }
        
        results = try container.decode(Int.self, forKey: .results)
        paging = try container.decode(APIPaging.self, forKey: .paging)
        response = try container.decode([TeamLineup].self, forKey: .response)
    }
    
    // 사용자 정의 인코더 추가
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(get, forKey: .get)
        try container.encode(parameters, forKey: .parameters)
        
        // errors 필드 인코딩
        if let errorArray = errors as? [String] {
            try container.encode(errorArray, forKey: .errors)
        } else if let errorDict = errors as? [String: String] {
            try container.encode(errorDict, forKey: .errors)
        } else {
            try container.encode([] as [String], forKey: .errors)
        }
        
        try container.encode(results, forKey: .results)
        try container.encode(paging, forKey: .paging)
        try container.encode(response, forKey: .response)
    }
    
    // CodingKeys 열거형 추가
    private enum CodingKeys: String, CodingKey {
        case get, parameters, errors, results, paging, response
    }
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
    
    // 추가: 팀 통계 정보 (Codable 프로토콜에서 제외)
    var teamStats: [TeamPlayersStatistics]?
    
    // CodingKeys를 추가하여 teamStats를 인코딩/디코딩에서 제외
    private enum CodingKeys: String, CodingKey {
        case team, formation, startXI, substitutes, coach
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
    let id: Int?
    let name: String?
    let photo: String?
}
