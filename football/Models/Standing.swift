import Foundation

// MARK: - Standings Response
struct StandingsResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    let get: String
    let parameters: ResponseParameters // FixtureParameters -> ResponseParameters 수정
    let errors: Any
    let results: Int
    let paging: APIPaging // FixturePaging -> APIPaging 수정
    let response: [StandingData]
    
    // 에러 필드를 딕셔너리로 변환하는 계산 속성 추가
    var errorsDict: [String: String] {
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
        response = try container.decode([StandingData].self, forKey: .response)
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

// MARK: - Standing Data
struct StandingData: Codable {
    let league: StandingLeagueInfo
}

// MARK: - Standing League Info
struct StandingLeagueInfo: Codable {
    let id: Int
    let name: String
    let country: String?
    let logo: String
    let flag: String?
    let season: Int
    let standings: [[Standing]]
}

// MARK: - Standing
struct Standing: Codable, Identifiable {
    let rank: Int
    let team: StandingTeam
    let points: Int
    let goalsDiff: Int
    let group: String?
    let form: String?
    let status: String?
    let description: String?
    let all: Games
    let home: Games
    let away: Games
    let update: String
    
    var id: Int { rank }
}

// MARK: - Standing Team
struct StandingTeam: Codable {
    let id: Int
    let name: String
    let logo: String
    let country: String?
}

// MARK: - Games
struct Games: Codable {
    let played: Int
    let win: Int
    let draw: Int
    let lose: Int
    let goals: GameGoals
}

// MARK: - Game Goals
struct GameGoals: Codable {
    let goalsFor: Int
    let goalsAgainst: Int
    
    enum CodingKeys: String, CodingKey {
        case goalsFor = "for"
        case goalsAgainst = "against"
    }
}
