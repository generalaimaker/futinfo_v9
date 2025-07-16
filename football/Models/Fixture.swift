import Foundation

// MARK: - Fixture Response
public struct FixturesResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    public let get: String
    public let parameters: ResponseParameters // APIResponseTypes.swift에 정의됨
    public let errors: Any
    public let results: Int
    public let paging: APIPaging // ResponsePaging -> APIPaging 수정
    public let response: [Fixture]
    
    // 에러 필드를 딕셔너리로 변환하는 계산 속성 추가
    public var errorsDict: [String: String] {
        // errors가 이미 딕셔너리인 경우
        if let errorDict = errors as? [String: String] {
            return errorDict
        }
        
        // errors가 배열인 경우
        if let errorArray = errors as? [String] {
            var dict: [String: String] = [:]
            for error in errorArray {
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
        
        // 기타 타입인 경우 빈 딕셔너리 반환
        return [:]
    }
    
    // 사용자 정의 디코더 추가
    public init(from decoder: Decoder) throws {
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
        response = try container.decode([Fixture].self, forKey: .response)
    }
    
    // 사용자 정의 인코더 추가
    public func encode(to encoder: Encoder) throws {
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
    
    // 직접 생성자 추가 (JSON 직렬화 오류 방지용)
    public init(get: String, parameters: ResponseParameters, errors: Any, results: Int, paging: APIPaging, response: [Fixture]) {
        self.get = get
        self.parameters = parameters
        self.errors = errors
        self.results = results
        self.paging = paging
        self.response = response
    }
}

// 기존 타입과의 호환성을 위한 타입 별칭 제거
// public typealias FixtureParameters = ResponseParameters // 제거
// public typealias FixturePaging = ResponsePaging // 제거

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
