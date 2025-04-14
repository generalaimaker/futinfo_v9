import Foundation

struct HeadToHeadResponse: Codable, APIErrorCheckable { // APIErrorCheckable 채택
    let get: String
    let parameters: ResponseParameters // APIResponseTypes.swift에 정의됨
    let errors: Any
    let results: Int
    let paging: APIPaging // ResponsePaging -> APIPaging 수정
    let response: [Fixture]
    
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
        response = try container.decode([Fixture].self, forKey: .response)
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

struct HeadToHeadStats {
    let totalMatches: Int
    let wins: Int
    let draws: Int
    let losses: Int
    let goalsFor: Int
    let goalsAgainst: Int
    
    init(fixtures: [Fixture], teamId: Int) {
        self.totalMatches = fixtures.count
        
        var wins = 0
        var draws = 0
        var losses = 0
        var goalsFor = 0
        var goalsAgainst = 0
        
        for fixture in fixtures {
            let isHome = fixture.teams.home.id == teamId
            let homeGoals = fixture.goals?.home ?? 0
            let awayGoals = fixture.goals?.away ?? 0
            
            if isHome {
                goalsFor += homeGoals
                goalsAgainst += awayGoals
                
                if homeGoals > awayGoals {
                    wins += 1
                } else if homeGoals < awayGoals {
                    losses += 1
                } else {
                    draws += 1
                }
            } else {
                goalsFor += awayGoals
                goalsAgainst += homeGoals
                
                if awayGoals > homeGoals {
                    wins += 1
                } else if awayGoals < homeGoals {
                    losses += 1
                } else {
                    draws += 1
                }
            }
        }
        
        self.wins = wins
        self.draws = draws
        self.losses = losses
        self.goalsFor = goalsFor
        self.goalsAgainst = goalsAgainst
    }
    
    var winRate: Double {
        guard totalMatches > 0 else { return 0 }
        return Double(wins) / Double(totalMatches) * 100
    }
    
    var goalDifference: Int {
        goalsFor - goalsAgainst
    }
}
