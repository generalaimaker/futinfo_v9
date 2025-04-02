import Foundation

// MARK: - Fixture Response
public struct FixturesResponse: Codable {
    public let get: String
    public let parameters: ResponseParameters
    public let errors: [String]  // 원래 타입으로 되돌림
    public let results: Int
    public let paging: ResponsePaging
    public let response: [Fixture]
    
    // 에러 필드를 딕셔너리로 변환하는 계산 속성 추가
    public var errorsDict: [String: String] {
        var dict: [String: String] = [:]
        for error in errors {
            // 에러 메시지에서 키-값 쌍 추출 시도
            if let colonIndex = error.firstIndex(of: ":") {
                let key = String(error[..<colonIndex]).trimmingCharacters(in: .whitespacesAndNewlines)
                let value = String(error[error.index(after: colonIndex)...]).trimmingCharacters(in: .whitespacesAndNewlines)
                dict[key] = value
            } else {
                // 콜론이 없으면 인덱스를 키로 사용
                dict["\(dict.count)"] = error
            }
        }
        return dict
    }
}

// 기존 타입과의 호환성을 위한 타입 별칭
public typealias FixtureParameters = ResponseParameters
public typealias FixturePaging = ResponsePaging

// MARK: - Fixture
public struct Fixture: Codable, Identifiable, Hashable {
    public let fixture: FixtureDetails
    public let league: LeagueFixtureInfo
    public let teams: Teams
    public let goals: Goals?
    
    public var id: Int { fixture.id }
    public var date: String { fixture.date }
    public var status: FixtureStatus { fixture.status }
    public var venue: Venue { fixture.venue }
    
    // Hashable 구현
    public func hash(into hasher: inout Hasher) {
        hasher.combine(fixture.id)
    }
    
    // Equatable 구현 (Hashable이 Equatable을 상속함)
    public static func == (lhs: Fixture, rhs: Fixture) -> Bool {
        lhs.fixture.id == rhs.fixture.id
    }
}

// MARK: - League Fixture Info
public struct LeagueFixtureInfo: Codable, Hashable {
    public let id: Int
    public let name: String
    public let country: String
    public let logo: String
    public let flag: String?
    public let season: Int
    public let round: String
    public let standings: Bool?
}

// MARK: - Fixture Details
public struct FixtureDetails: Codable, Hashable {
    public let id: Int
    public let date: String
    public let status: FixtureStatus
    public let venue: Venue
    public let timezone: String
    public let referee: String?
}

// MARK: - Status
public struct FixtureStatus: Codable, Hashable {
    public let long: String
    public let short: String
    public let elapsed: Int?
}

// MARK: - Venue
public struct Venue: Codable, Hashable {
    public let id: Int?
    public let name: String?
    public let city: String?
}

// MARK: - Teams
public struct Teams: Codable, Hashable {
    public let home: Team
    public let away: Team
}


// MARK: - Goals
public struct Goals: Codable, Hashable {
    public let home: Int?
    public let away: Int?
}
