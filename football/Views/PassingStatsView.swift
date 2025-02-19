import SwiftUI

struct PassingStatsView: View {
    let statistics: [TeamStatistics]
    
    private var homeStats: [String: StatisticValue] {
        guard !statistics.isEmpty else { return [:] }
        let stats = statistics[0].statistics
        return Dictionary(uniqueKeysWithValues: stats.map { ($0.type, $0.value) })
    }
    
    private var awayStats: [String: StatisticValue] {
        guard statistics.count > 1 else { return [:] }
        let stats = statistics[1].statistics
        return Dictionary(uniqueKeysWithValues: stats.map { ($0.type, $0.value) })
    }
    
    var body: some View {
        VStack(spacing: 24) {
            // 팀 로고
            HStack {
                AsyncImage(url: URL(string: statistics[0].team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(width: 40, height: 40)
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .font(.system(size: 30))
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Text("vs")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                
                Spacer()
                
                AsyncImage(url: URL(string: statistics[1].team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(width: 40, height: 40)
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .font(.system(size: 30))
                        .foregroundColor(.gray)
                }
            }
            .padding(.horizontal, 40)
            
            // 패스 통계
            VStack(spacing: 16) {
                // 총 패스
                if let homeTotalPasses = statistics[0].statistics.first(where: { $0.type == "Total passes" })?.value,
                   let awayTotalPasses = statistics[1].statistics.first(where: { $0.type == "Total passes" })?.value {
                    StatisticItem(
                        title: "총 패스",
                        leftValue: homeTotalPasses.displayValue,
                        rightValue: awayTotalPasses.displayValue
                    )
                }
                
                // 정확한 패스
                if let homeAccuratePasses = statistics[0].statistics.first(where: { $0.type == "Passes accurate" })?.value,
                   let awayAccuratePasses = statistics[1].statistics.first(where: { $0.type == "Passes accurate" })?.value {
                    StatisticItem(
                        title: "정확한 패스",
                        leftValue: homeAccuratePasses.displayValue,
                        rightValue: awayAccuratePasses.displayValue
                    )
                }
                
                // 정확한 긴패스
                if let homeLongBalls = statistics[0].statistics.first(where: { $0.type == "Long Balls accurate" })?.value,
                   let awayLongBalls = statistics[1].statistics.first(where: { $0.type == "Long Balls accurate" })?.value {
                    StatisticItem(
                        title: "정확한 긴패스",
                        leftValue: homeLongBalls.displayValue,
                        rightValue: awayLongBalls.displayValue
                    )
                }
                
                // 크로스
                if let homeCrosses = statistics[0].statistics.first(where: { $0.type == "Crosses total" })?.value,
                   let awayCrosses = statistics[1].statistics.first(where: { $0.type == "Crosses total" })?.value {
                    StatisticItem(
                        title: "크로스",
                        leftValue: homeCrosses.displayValue,
                        rightValue: awayCrosses.displayValue
                    )
                }
                
                // 스로인
                if let homeThrowIns = statistics[0].statistics.first(where: { $0.type == "Throw In" })?.value,
                   let awayThrowIns = statistics[1].statistics.first(where: { $0.type == "Throw In" })?.value {
                    StatisticItem(
                        title: "스로인",
                        leftValue: homeThrowIns.displayValue,
                        rightValue: awayThrowIns.displayValue
                    )
                }
                
                // 상대편 박스내 터치
                if let homeTouchesBox = statistics[0].statistics.first(where: { $0.type == "Touches in opponent box" })?.value,
                   let awayTouchesBox = statistics[1].statistics.first(where: { $0.type == "Touches in opponent box" })?.value {
                    StatisticItem(
                        title: "상대편 박스내 터치",
                        leftValue: homeTouchesBox.displayValue,
                        rightValue: awayTouchesBox.displayValue
                    )
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
    }
}
