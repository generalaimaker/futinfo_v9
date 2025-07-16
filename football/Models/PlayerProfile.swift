import Foundation

// MARK: - Player Profile Data
struct PlayerProfileData: Codable, Identifiable, Hashable {
    let player: PlayerInfo      // 기존 PlayerInfo 모델 재사용
    var statistics: [PlayerSeasonStats]?  // API 응답의 statistics 배열과 일치 (옵셔널)
    
    var id: Int {
        return player.id ?? 0
    }
    
    // Hashable 구현
    func hash(into hasher: inout Hasher) {
        hasher.combine(player.id)
    }
    
    // Equatable 구현 (Hashable은 Equatable을 상속함)
    static func == (lhs: PlayerProfileData, rhs: PlayerProfileData) -> Bool {
        return lhs.player.id == rhs.player.id
    }
}

// MARK: - Player Career Stats
struct PlayerCareerStats: Codable, Identifiable {
    let team: Team
    let seasons: [Int]
    
    var id: Int { team.id }
    
    var period: String {
        if seasons.isEmpty {
            return "현재"
        }
        let sortedSeasons = seasons.sorted()
        if sortedSeasons.count == 1 {
            return "\(sortedSeasons[0])"
        }
        return "\(sortedSeasons.first!)-\(sortedSeasons.last!)"
    }
    
    var appearances: String {
        "\(seasons.count)시즌"
    }
}

// MARK: - API Response Models
struct PlayerProfileResponse: Codable, APIErrorCheckable { // APIErrorCheckable 확인 및 추가
    let get: String
    let parameters: PlayerProfileParameters
    let errors: Any
    let results: Int
    let paging: APIPaging
    let response: [PlayerProfileData]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(PlayerProfileParameters.self, forKey: .parameters)
        
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
        response = try container.decode([PlayerProfileData].self, forKey: .response)
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

struct PlayerCareerResponse: Codable, APIErrorCheckable { // APIErrorCheckable 확인 및 추가
    let get: String
    let parameters: PlayerParameters
    let errors: Any
    let results: Int
    let paging: APIPaging
    let response: [CareerTeamResponse]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(PlayerParameters.self, forKey: .parameters)
        
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
        response = try container.decode([CareerTeamResponse].self, forKey: .response)
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

struct CareerTeamResponse: Codable {
    let team: Team
    let seasons: [Int]
}

struct PlayerSeasonalStatsResponse: Codable, APIErrorCheckable { // APIErrorCheckable 확인 및 추가
    let get: String
    let parameters: PlayerProfileParameters
    let errors: Any
    let results: Int
    let paging: APIPaging
    let response: [PlayerSeasonStats]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(PlayerProfileParameters.self, forKey: .parameters)
        
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
        response = try container.decode([PlayerSeasonStats].self, forKey: .response)
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

// PlayerInfo, Team, PlayerSeasonStats 구조체가 Codable을 준수하는지 확인 필요
// 만약 준수하지 않는다면, 해당 파일에서 Codable 프로토콜을 채택해야 함
