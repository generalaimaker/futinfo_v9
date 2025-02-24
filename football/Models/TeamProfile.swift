import Foundation

// MARK: - Team Profile Response
struct TeamProfileResponse: Codable {
    let get: String
    let parameters: TeamParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: [TeamProfile]
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
struct TeamStatisticsResponse: Codable {
    let get: String
    let parameters: TeamStatisticsParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: TeamSeasonStatistics
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
