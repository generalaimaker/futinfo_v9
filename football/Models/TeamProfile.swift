import Foundation

// MARK: - Team Profile Response
struct TeamProfileResponse: Codable, APIErrorCheckable { // APIErrorCheckable 추가
    let get: String
    let parameters: TeamParameters
    let errors: Any
    let results: Int
    let paging: APIPaging
    let response: [TeamProfile]
    
    // 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
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
        response = try container.decode([TeamProfile].self, forKey: .response)
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

// MARK: - Team Profile
struct TeamProfile: Codable, Identifiable {
    let team: TeamInfo
    let venue: VenueInfo
    
    var id: Int { team.id }
}

// MARK: - Team Info
struct TeamInfo: Codable {
    let id: Int
    let name: String
    let code: String?
    let country: String?
    let founded: Int?
    let national: Bool?
    let logo: String
}

// MARK: - Venue Info
struct VenueInfo: Codable {
    let id: Int?
    let name: String?
    let address: String?
    let city: String?
    let capacity: Int?
    let surface: String?
    let image: String?
}

// MARK: - Team Statistics Response
struct TeamStatisticsResponse: Codable, APIErrorCheckable { // APIErrorCheckable 추가
    let get: String
    let parameters: TeamStatisticsParameters
    let errors: Any
    let results: Int
    let paging: APIPaging
    let response: TeamSeasonStatistics
    
    // 디코딩 오류 디버깅을 위한 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(TeamStatisticsParameters.self, forKey: .parameters)
        
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
        
        // response 필드 디코딩 시도
        do {
            // 원본 JSON 데이터 확인
            if let jsonData = try? JSONSerialization.data(withJSONObject: decoder.userInfo[.originalJSON] ?? [:]),
               let jsonString = String(data: jsonData, encoding: .utf8) {
                print("📝 TeamStatisticsResponse 원본 JSON: \(jsonString.prefix(100))...")
            }
            
            // 먼저 객체로 디코딩 시도
            do {
                response = try container.decode(TeamSeasonStatistics.self, forKey: .response)
                print("✅ TeamStatisticsResponse: 단일 객체로 디코딩 성공")
                return
            } catch {
                print("⚠️ 단일 객체 디코딩 실패: \(error)")
                
                // 배열로 디코딩 시도
                if let responseArray = try? container.decode([TeamSeasonStatistics].self, forKey: .response),
                   let firstItem = responseArray.first {
                    response = firstItem
                    print("✅ TeamStatisticsResponse: 배열에서 첫 번째 항목 사용")
                    return
                }
                
                // 빈 배열인 경우 처리
                if let responseArray = try? container.decode([String].self, forKey: .response), responseArray.isEmpty {
                    print("⚠️ TeamStatisticsResponse: 빈 배열 감지")
                    throw error
                }
                
                // 원시 JSON 데이터 확인
                if let responseValue = try? container.decodeIfPresent(AnyDecodable.self, forKey: .response) {
                    print("📊 Response 값 타입: \(type(of: responseValue.value))")
                    if let dict = responseValue.value as? [String: Any] {
                        print("📊 Response 키: \(dict.keys.joined(separator: ", "))")
                    }
                }
                
                throw error
            }
        } catch {
            print("❌ TeamStatisticsResponse 디코딩 오류: \(error)")
            
            // 빈 객체 생성
            response = TeamSeasonStatistics(
                league: TeamLeagueInfo(id: 0, name: "Unknown", country: nil, logo: "", flag: nil, season: 0),
                team: TeamStatisticsInfo(id: 0, name: "Unknown", logo: ""),
                form: nil,
                fixtures: nil,
                goals: nil,
                biggest: nil,
                clean_sheets: nil,
                failed_to_score: nil,
                penalty: nil,
                lineups: nil,
                cards: nil
            )
        }
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

// 원시 JSON 데이터 처리를 위한 유틸리티
struct AnyDecodable: Decodable {
    let value: Any
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if container.decodeNil() {
            self.value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyDecodable].self) {
            self.value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyDecodable].self) {
            self.value = dict.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode value")
        }
    }
}

// 디코더 사용자 정보 키
extension CodingUserInfoKey {
    static let originalJSON = CodingUserInfoKey(rawValue: "originalJSON")!
}

// MARK: - Team League Info
struct TeamLeagueInfo: Codable {
    let id: Int
    let name: String
    let country: String?
    let logo: String
    let flag: String?
    let season: Int
}

// MARK: - Team Statistics Info
struct TeamStatisticsInfo: Codable {
    let id: Int
    let name: String
    let logo: String
}

// MARK: - Team Season Statistics
struct TeamSeasonStatistics: Codable {
    let league: TeamLeagueInfo
    let team: TeamStatisticsInfo
    let form: String? // 최근 경기 결과 (예: WWDLL)
    let fixtures: FixturesStats?
    let goals: GoalsStats?
    let biggest: BiggestStats?
    let clean_sheets: CleanSheets?
    let failed_to_score: FailedToScore?
    let penalty: PenaltyStats?
    let lineups: [LineupStats]?
    let cards: CardsStats?
}

// MARK: - Fixtures Stats
struct FixturesStats: Codable {
    let played: TeamSeasonStatistic
    let wins: TeamSeasonStatistic
    let draws: TeamSeasonStatistic
    let loses: TeamSeasonStatistic
}

// MARK: - Goals Stats
struct GoalsStats: Codable {
    let `for`: TeamGoalsFor
    let against: TeamGoalsAgainst
}

// MARK: - Goals For/Against
struct TeamGoalsFor: Codable {
    let total: TeamSeasonStatistic
    let average: AverageStats
    let minute: GoalsByMinute
    let under_over: [String: UnderOver]?
}

struct TeamGoalsAgainst: Codable {
    let total: TeamSeasonStatistic
    let average: AverageStats
    let minute: GoalsByMinute
    let under_over: [String: UnderOver]?
}

struct AverageStats: Codable {
    let home: String
    let away: String
    let total: String
}

struct UnderOver: Codable {
    let under: Int?
    let over: Int?
}

// MARK: - Team Season Statistic
struct TeamSeasonStatistic: Codable {
    let home: Int
    let away: Int
    let total: Int
}

// MARK: - Team Season Chart Data
struct TeamSeasonChartData {
    let label: String
    let value: Double
    let maxValue: Double
    
    init(type: String, stats: TeamSeasonStatistics) {
        self.label = type
        
        switch type {
        case "승률":
            if let fixtures = stats.fixtures {
                let totalGames = fixtures.played.total
                let wins = fixtures.wins.total
                self.value = totalGames > 0 ? Double(wins) / Double(totalGames) * 100 : 0
            } else {
                self.value = 0
            }
            self.maxValue = 100
            
        case "경기당 득점":
            if let fixtures = stats.fixtures, let goals = stats.goals {
                let totalGames = fixtures.played.total
                let totalGoals = goals.for.total.total
                self.value = totalGames > 0 ? Double(totalGoals) / Double(totalGames) : 0
            } else {
                self.value = 0
            }
            self.maxValue = 5 // 적절한 최대값 설정
            
        case "클린시트":
            if let fixtures = stats.fixtures, let cleanSheets = stats.clean_sheets {
                let totalGames = fixtures.played.total
                let total = cleanSheets.total
                self.value = totalGames > 0 ? Double(total) / Double(totalGames) * 100 : 0
            } else {
                self.value = 0
            }
            self.maxValue = 100
            
        default:
            self.value = 0
            self.maxValue = 0
        }
    }
}

// MARK: - Goals By Minute
typealias GoalsByMinute = [String: MinuteStats]

// MARK: - Minute Stats
struct MinuteStats: Codable {
    let total: Int?
    let percentage: String?
}

// MARK: - Biggest Stats
struct BiggestStats: Codable {
    let streak: Streak
    let wins: GameScore
    let loses: GameScore
    let goals: BiggestGoals
}

// MARK: - Streak
struct Streak: Codable {
    let wins: Int
    let draws: Int
    let loses: Int
}

// MARK: - Game Score
struct GameScore: Codable {
    let home: String?
    let away: String?
}

// MARK: - Biggest Goals
struct BiggestGoals: Codable {
    let `for`: GoalsScore
    let against: GoalsScore
}

// MARK: - Goals Score
struct GoalsScore: Codable {
    let home: Int
    let away: Int
}

// MARK: - Clean Sheets
struct CleanSheets: Codable {
    let home: Int
    let away: Int
    let total: Int
}

// MARK: - Failed To Score
struct FailedToScore: Codable {
    let home: Int
    let away: Int
    let total: Int
}

// MARK: - Penalty Stats
struct PenaltyStats: Codable {
    let scored: PenaltyDetail
    let missed: PenaltyDetail
    let total: Int
}

// MARK: - Penalty Detail
struct PenaltyDetail: Codable {
    let total: Int
    let percentage: String
}

// MARK: - Lineup Stats
struct LineupStats: Codable {
    let formation: String
    let played: Int
}

// MARK: - Cards Stats
struct CardsStats: Codable {
    let yellow: CardsByMinute
    let red: CardsByMinute
}

// MARK: - Cards By Minute
struct CardsByMinute: Codable {
    let zero_fifteen: MinuteStats
    let sixteen_thirty: MinuteStats
    let thirty_one_fortyfive: MinuteStats
    let fortysix_sixty: MinuteStats
    let sixtyone_seventyfive: MinuteStats
    let seventysix_ninety: MinuteStats
    let ninety_one_hundred_five: MinuteStats?
    let hundred_six_one_twenty: MinuteStats?
    
    enum CodingKeys: String, CodingKey {
        case zero_fifteen = "0-15"
        case sixteen_thirty = "16-30"
        case thirty_one_fortyfive = "31-45"
        case fortysix_sixty = "46-60"
        case sixtyone_seventyfive = "61-75"
        case seventysix_ninety = "76-90"
        case ninety_one_hundred_five = "91-105"
        case hundred_six_one_twenty = "106-120"
    }
}

// MARK: - Statistic
struct Statistic: Codable {
    let home: Int
    let away: Int
    let total: Int
}
