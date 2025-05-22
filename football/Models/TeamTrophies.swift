import Foundation

// MARK: - Team Trophy Response
struct TeamTrophyResponse: Codable, APIErrorCheckable {
    let get: String
    let parameters: ResponseParameters // ResponseParameters는 APIResponseTypes.swift에 정의됨
    let errors: Any
    let results: Int
    let paging: APIPaging // ResponsePaging -> APIPaging 수정
    let response: [TeamTrophy]
    
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
        response = try container.decode([TeamTrophy].self, forKey: .response)
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

struct TeamTrophy: Codable, Identifiable {
    let league: String
    let country: String
    let season: String
    let place: String
    var totalCount: Int = 1 // 총 우승 횟수 추가 (기본값 1로 설정)
    
    var id: String { "\(league)-\(season)-\(place)" }
}

// TeamTrophyItem을 TeamTrophy로 변환하는 확장
extension TeamTrophyItem {
    func toTeamTrophy() -> TeamTrophy {
        return TeamTrophy(
            league: self.league,
            country: self.country,
            season: self.season,
            place: self.place,
            totalCount: self.totalCount
        )
    }
}

// [TeamTrophyItem]을 [TeamTrophy]로 변환하는 확장
extension Array where Element == TeamTrophyItem {
    func toTeamTrophies() -> [TeamTrophy] {
        return self.map { $0.toTeamTrophy() }
    }
}

// MARK: - Team History
struct TeamHistory {
    let season: Int
    let leagueId: Int
    let statistics: TeamSeasonStatistics
    let standing: TeamStanding?
    
    var seasonDisplay: String {
        "\(season)-\((season + 1) % 100)"
    }
    
    var leaguePosition: String {
        standing?.rank.description ?? "N/A"
    }
    
    var winRate: Double {
        guard let fixtures = statistics.fixtures else { return 0 }
        let totalGames = fixtures.played.total
        return totalGames > 0 ? Double(fixtures.wins.total) / Double(totalGames) * 100 : 0
    }
    
    var goalsPerGame: Double {
        guard let goals = statistics.goals else { return 0 }
        let totalGames = statistics.fixtures?.played.total ?? 0
        return totalGames > 0 ? Double(goals.for.total.total) / Double(totalGames) : 0
    }
    
    var cleanSheetRate: Double {
        guard let cleanSheets = statistics.clean_sheets,
              let totalGames = statistics.fixtures?.played.total,
              totalGames > 0
        else { return 0 }
        return Double(cleanSheets.total) / Double(totalGames) * 100
    }
}
