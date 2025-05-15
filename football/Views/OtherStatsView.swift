import SwiftUI

struct OtherStatsView: View {
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
        VStack(spacing: 16) {
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
            
            VStack(spacing: 24) {
                // 옐로카드
                if let homeYellowCards = homeStats["Yellow Cards"],
                   let awayYellowCards = awayStats["Yellow Cards"] {
                    StatisticItem(
                        title: "옐로카드",
                        leftValue: homeYellowCards.displayValue,
                        rightValue: awayYellowCards.displayValue,
                        showProgressBar: true,
                        showPercentage: false
                    )
                }
                
                // 레드카드
                if let homeRedCards = homeStats["Red Cards"],
                   let awayRedCards = awayStats["Red Cards"] {
                    StatisticItem(
                        title: "레드카드",
                        leftValue: homeRedCards.displayValue,
                        rightValue: awayRedCards.displayValue,
                        showProgressBar: true,
                        showPercentage: false
                    )
                }
                
                // 반칙
                if let homeFouls = homeStats["Fouls"],
                   let awayFouls = awayStats["Fouls"] {
                    StatisticItem(
                        title: "반칙",
                        leftValue: homeFouls.displayValue,
                        rightValue: awayFouls.displayValue,
                        showProgressBar: true,
                        showPercentage: false
                    )
                }
                
                // 오프사이드
                if let homeOffsides = homeStats["Offsides"],
                   let awayOffsides = awayStats["Offsides"] {
                    StatisticItem(
                        title: "오프사이드",
                        leftValue: homeOffsides.displayValue,
                        rightValue: awayOffsides.displayValue,
                        showProgressBar: true,
                        showPercentage: false
                    )
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
    }
}
