import SwiftUI

struct StatisticsView: View {
    let viewModel: FixtureDetailViewModel
    let statistics: [TeamStatistics]
    let halfStatistics: [HalfTeamStatistics]
    let chartData: [ChartData]
    let selectedType: StatisticType?
    let onTypeFilter: (StatisticType?) -> Void
    
    var body: some View {
        ScrollView {
            if statistics.isEmpty {
                Text("통계 정보가 없습니다")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                VStack(spacing: 32) {
                    // 경기 통계
                    VStack(spacing: 16) {
                        Text("경기 통계")
                            .font(.system(.headline, design: .rounded))
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 20)
                        
                        AttackingStatsView(statistics: statistics)
                    }
                    
                    Divider()
                        .padding(.horizontal, 20)
                    
                    // 기타 통계
                    VStack(spacing: 16) {
                        Text("기타 통계")
                            .font(.system(.headline, design: .rounded))
                            .fontWeight(.bold)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 20)
                        
                        OtherStatsView(statistics: statistics)
                    }
                }
                .padding(.vertical)
            }
        }
    }
}
