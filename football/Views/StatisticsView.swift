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
                VStack(spacing: 24) {
                    // 공격 통계
                    VStack(spacing: 8) {
                        Text("공격 통계")
                            .font(.headline)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 20)
                        
                        AttackingStatsView(statistics: statistics)
                    }
                    
                    // 슈팅 차트
                    VStack(spacing: 8) {
                        Text("슈팅 분석")
                            .font(.headline)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 20)
                        
                        ShootingChartView(statistics: statistics)
                    }
                    
                    // 기타 통계
                    VStack(spacing: 8) {
                        Text("기타 통계")
                            .font(.headline)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 20)
                        
                        VStack(spacing: 16) {
                            // 공 점유율
                            if let homePossession = statistics[0].statistics.first(where: { $0.type == "Ball Possession" })?.value,
                               let awayPossession = statistics[1].statistics.first(where: { $0.type == "Ball Possession" })?.value {
                                StatisticItem(
                                    title: "공 점유율",
                                    leftValue: homePossession.displayValue,
                                    rightValue: awayPossession.displayValue
                                )
                            }
                            
                            // 큰 기회
                            if let homeBigChances = statistics[0].statistics.first(where: { $0.type == "Big Chances" })?.value,
                               let awayBigChances = statistics[1].statistics.first(where: { $0.type == "Big Chances" })?.value {
                                StatisticItem(
                                    title: "큰 기회",
                                    leftValue: homeBigChances.displayValue,
                                    rightValue: awayBigChances.displayValue
                                )
                            }
                            
                            // 큰 기회 놓침
                            if let homeBigChancesMissed = statistics[0].statistics.first(where: { $0.type == "Big Chances Missed" })?.value,
                               let awayBigChancesMissed = statistics[1].statistics.first(where: { $0.type == "Big Chances Missed" })?.value {
                                StatisticItem(
                                    title: "큰 기회 놓침",
                                    leftValue: homeBigChancesMissed.displayValue,
                                    rightValue: awayBigChancesMissed.displayValue
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
                            
                            // 반칙
                            if let homeFouls = statistics[0].statistics.first(where: { $0.type == "Fouls" })?.value,
                               let awayFouls = statistics[1].statistics.first(where: { $0.type == "Fouls" })?.value {
                                StatisticItem(
                                    title: "반칙",
                                    leftValue: homeFouls.displayValue,
                                    rightValue: awayFouls.displayValue
                                )
                            }
                            
                            // 오프사이드
                            if let homeOffsides = statistics[0].statistics.first(where: { $0.type == "Offsides" })?.value,
                               let awayOffsides = statistics[1].statistics.first(where: { $0.type == "Offsides" })?.value {
                                StatisticItem(
                                    title: "오프사이드",
                                    leftValue: homeOffsides.displayValue,
                                    rightValue: awayOffsides.displayValue
                                )
                            }
                            
                            // 코너킥
                            if let homeCorners = statistics[0].statistics.first(where: { $0.type == "Corner Kicks" })?.value,
                               let awayCorners = statistics[1].statistics.first(where: { $0.type == "Corner Kicks" })?.value {
                                StatisticItem(
                                    title: "코너킥",
                                    leftValue: homeCorners.displayValue,
                                    rightValue: awayCorners.displayValue
                                )
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
                    }
                }
                .padding(.vertical)
            }
        }
    }
}
