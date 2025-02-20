import SwiftUI

struct ShootingStatsView: View {
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
                // 총 슈팅
                if let homeTotalShots = Int(homeStats["Total Shots"]?.displayValue ?? "0"),
                   let awayTotalShots = Int(awayStats["Total Shots"]?.displayValue ?? "0") {
                    StatisticItem(
                        title: "총 슈팅",
                        leftValue: "\(homeTotalShots)",
                        rightValue: "\(awayTotalShots)",
                        showProgressBar: true,
                        showPercentage: true
                    )
                }
                
                // 유효 슈팅
                if let homeShotsOnGoal = Int(homeStats["Shots on Goal"]?.displayValue ?? "0"),
                   let awayShotsOnGoal = Int(awayStats["Shots on Goal"]?.displayValue ?? "0") {
                    StatisticItem(
                        title: "유효 슈팅",
                        leftValue: "\(homeShotsOnGoal)",
                        rightValue: "\(awayShotsOnGoal)",
                        showProgressBar: true,
                        showPercentage: true
                    )
                }
                
                // 빗나간 슈팅
                if let homeShotsOffGoal = Int(homeStats["Shots off Goal"]?.displayValue ?? "0"),
                   let awayShotsOffGoal = Int(awayStats["Shots off Goal"]?.displayValue ?? "0") {
                    StatisticItem(
                        title: "빗나간 슈팅",
                        leftValue: "\(homeShotsOffGoal)",
                        rightValue: "\(awayShotsOffGoal)",
                        showProgressBar: true,
                        showPercentage: true
                    )
                }
                
                // 막힌 슈팅
                if let homeBlockedShots = Int(homeStats["Blocked Shots"]?.displayValue ?? "0"),
                   let awayBlockedShots = Int(awayStats["Blocked Shots"]?.displayValue ?? "0") {
                    StatisticItem(
                        title: "막힌 슈팅",
                        leftValue: "\(homeBlockedShots)",
                        rightValue: "\(awayBlockedShots)",
                        showProgressBar: true,
                        showPercentage: true
                    )
                }
                
                Divider()
                    .padding(.horizontal)
                
                // 슈팅 위치
                VStack(spacing: 16) {
                    Text("슈팅 위치")
                        .font(.system(.headline, design: .rounded))
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    VStack(spacing: 16) {
                        // 박스 안 슈팅
                        if let homeShotsInside = Int(homeStats["Shots insidebox"]?.displayValue ?? "0"),
                           let awayShotsInside = Int(awayStats["Shots insidebox"]?.displayValue ?? "0") {
                            StatisticItem(
                                title: "박스 안",
                                leftValue: "\(homeShotsInside)",
                                rightValue: "\(awayShotsInside)",
                                showProgressBar: true,
                                showPercentage: true
                            )
                        }
                        
                        // 박스 밖 슈팅
                        if let homeShotsOutside = Int(homeStats["Shots outsidebox"]?.displayValue ?? "0"),
                           let awayShotsOutside = Int(awayStats["Shots outsidebox"]?.displayValue ?? "0") {
                            StatisticItem(
                                title: "박스 밖",
                                leftValue: "\(homeShotsOutside)",
                                rightValue: "\(awayShotsOutside)",
                                showProgressBar: true,
                                showPercentage: true
                            )
                        }
                    }
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
