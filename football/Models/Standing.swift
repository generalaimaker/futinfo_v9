import Foundation

// MARK: - Standings Response
struct StandingsResponse: Codable {
    let get: String
    let parameters: FixtureParameters
    let errors: [String]
    let results: Int
    let paging: FixturePaging
    let response: [StandingData]
    
    // 에러 필드를 딕셔너리로 변환하는 계산 속성 추가
    var errorsDict: [String: String] {
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