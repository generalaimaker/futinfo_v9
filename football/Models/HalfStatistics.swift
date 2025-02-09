import Foundation

struct HalfStatisticsResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [HalfTeamStatistics]
}

struct HalfTeamStatistics: Codable, Identifiable {
    var id: Int { team.id }
    let team: Team
    let statistics: [Statistic]
    
    private enum CodingKeys: String, CodingKey {
        case team
        case statistics
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        team = try container.decode(Team.self, forKey: .team)
        statistics = try container.decode([Statistic].self, forKey: .statistics)
    }
    
    var halfStats: HalfStatistics {
        let firstHalf = statistics.filter { $0.type.contains("First Half") }
        let secondHalf = statistics.filter { $0.type.contains("Second Half") }
        return HalfStatistics(firstHalf: firstHalf, secondHalf: secondHalf)
    }
}

struct HalfStatistics {
    let firstHalf: [Statistic]
    let secondHalf: [Statistic]
    
    init(firstHalf: [Statistic], secondHalf: [Statistic]) {
        self.firstHalf = firstHalf
        self.secondHalf = secondHalf
    }
}


// 차트 데이터 모델
struct ChartData {
    let label: String
    let homeValue: Double
    let awayValue: Double
    let maxValue: Double
    
    init(type: StatisticType, homeStats: TeamStatistics, awayStats: TeamStatistics) {
        self.label = type.rawValue
        
        let homeStatistic = homeStats.getValue(for: type)
        let awayStatistic = awayStats.getValue(for: type)
        
        switch (homeStatistic, awayStatistic) {
        case (.int(let home), .int(let away)):
            self.homeValue = Double(home)
            self.awayValue = Double(away)
            self.maxValue = Double(max(home, away))
        case (.double(let home), .double(let away)):
            self.homeValue = home
            self.awayValue = away
            self.maxValue = max(home, away)
        case (.string(let home), .string(let away)):
            // 퍼센트 문자열 처리
            let homeNum = Double(home.replacingOccurrences(of: "%", with: "")) ?? 0
            let awayNum = Double(away.replacingOccurrences(of: "%", with: "")) ?? 0
            self.homeValue = homeNum
            self.awayValue = awayNum
            self.maxValue = max(homeNum, awayNum)
        default:
            self.homeValue = 0
            self.awayValue = 0
            self.maxValue = 0
        }
    }
}