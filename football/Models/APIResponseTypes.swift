import Foundation

// MARK: - API 응답 공통 모델

// API 응답의 파라미터 모델 (FixtureDetail.swift에서 사용)
public struct ResponseParameters: Codable {
    public let fixture: String?
    public let league: String?
    public let season: String?
    public let team: String?
    public let date: String?
    
    public init(fixture: String? = nil, league: String? = nil, season: String? = nil, team: String? = nil, date: String? = nil) {
        self.fixture = fixture
        self.league = league
        self.season = season
        self.team = team
        self.date = date
    }
}

// --- 추가 타입 정의 ---

// Team 관련 API에서 사용하는 파라미터 구조체
public struct TeamParameters: Codable {
    public let id: String?
    public let team: String?
    public let league: String?
    public let season: String?
    public let player: String?

    public init(id: String? = nil, team: String? = nil, league: String? = nil, season: String? = nil, player: String? = nil) {
        self.id = id
        self.team = team
        self.league = league
        self.season = season
        self.player = player
    }
}

// APIPaging 구조체 (ResponsePaging과 동일할 수 있으나, 명시적으로 정의)
public struct APIPaging: Codable {
    public let current: Int
    public let total: Int

    public init(current: Int, total: Int) {
        self.current = current
        self.total = total
    }
}


// TeamSeasonsResponse 타입 정의
public struct TeamSeasonsResponse: Codable, APIErrorCheckable {
    public let get: String
    public let parameters: TeamParameters // 위에서 정의한 TeamParameters 사용
    public let errors: Any
    public let results: Int
    public let paging: APIPaging // 위에서 정의한 APIPaging 사용
    public let response: [Int]

    public init(get: String, parameters: TeamParameters, errors: Any, results: Int, paging: APIPaging, response: [Int]) {
        self.get = get
        self.parameters = parameters
        self.errors = errors
        self.results = results
        self.paging = paging
        self.response = response
    }
    
    // 사용자 정의 디코더 추가
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(TeamParameters.self, forKey: .parameters)
        
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
        response = try container.decode([Int].self, forKey: .response)
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
}

// Player Profile 관련 파라미터
public struct PlayerProfileParameters: Codable {
    public let id: String?
    public let season: String?

    public init(id: String? = nil, season: String? = nil) {
        self.id = id
        self.season = season
    }
}

// Player Career 관련 파라미터
public struct PlayerParameters: Codable {
    public let player: String?

    public init(player: String? = nil) {
        self.player = player
    }
}
// --- 추가 타입 정의 끝 ---
