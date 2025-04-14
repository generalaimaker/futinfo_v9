import Foundation

public struct TeamStatisticsParameters: Codable {
    public let team: String
    public let league: String
    public let season: String
    
    public init(team: String, league: String, season: String) {
        self.team = team
        self.league = league
        self.season = season
    }
}

// MARK: - Coach Models

// 감독 정보 모델
public struct CoachInfo: Codable, Identifiable, Hashable {
    public let id: Int
    public let name: String
    public let firstname: String?
    public let lastname: String?
    public let age: Int?
    public let birth: CoachBirth?
    public let nationality: String?
    public let height: String?
    public let weight: String?
    public let photo: String
    public let team: Team? // 현재 팀 정보 (옵셔널)
    public let career: [CoachCareer]? // 경력 정보 (옵셔널)

    // Hashable 준수
    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    // Equatable 준수
    public static func == (lhs: CoachInfo, rhs: CoachInfo) -> Bool {
        lhs.id == rhs.id
    }
}

// 감독 생년월일 정보
public struct CoachBirth: Codable {
    public let date: String?
    public let place: String?
    public let country: String?
}

// 감독 경력 정보
public struct CoachCareer: Codable {
    public let team: Team
    public let start: String?
    public let end: String?
}

// 감독 검색 API 응답 모델
public struct CoachResponse: Codable, APIErrorCheckable {
    public let get: String
    public let parameters: CoachParameters
    public let errors: Any // APIErrorCheckable 준수 (타입 수정)
    public let results: Int
    public let paging: APIPaging
    public let response: [CoachInfo]
    
    // 사용자 정의 디코더 추가
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(CoachParameters.self, forKey: .parameters)
        
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
        response = try container.decode([CoachInfo].self, forKey: .response)
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

// 감독 검색 API 파라미터 모델
public struct CoachParameters: Codable {
    public let search: String?
    public let id: String?
    public let team: String?
}

public struct SquadParameters: Codable {
    public let team: String
    
    public init(team: String) {
        self.team = team
    }
}

public struct PlayerStatisticsParameters: Codable {
    public let id: String
    public let season: String?
    
    public init(id: String, season: String?) {
        self.id = id
        self.season = season
    }
}
