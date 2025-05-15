import SwiftUI

// 경기 통계용 TeamStatistics를 사용
import Foundation

struct AttackingStatsView: View {
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
                // 점유율
                if let homePossession = homeStats["Ball Possession"],
                   let awayPossession = awayStats["Ball Possession"] {
                    StatisticItem(
                        title: "점유율",
                        leftValue: homePossession.displayValue,
                        rightValue: awayPossession.displayValue,
                        showProgressBar: true,
                        showPercentage: false // 이미 % 포함되어 있음
                    )
                }
                
                // 예상 득점
                if let homeXG = homeStats["expected_goals"],
                   let awayXG = awayStats["expected_goals"] {
                    StatisticItem(
                        title: "예상 득점 (xG)",
                        leftValue: homeXG.displayValue,
                        rightValue: awayXG.displayValue,
                        showProgressBar: true,
                        showPercentage: false
                    )
                }
                
                // 선방
                if let homeSaves = homeStats["Goalkeeper Saves"],
                   let awaySaves = awayStats["Goalkeeper Saves"] {
                    StatisticItem(
                        title: "선방",
                        leftValue: homeSaves.displayValue,
                        rightValue: awaySaves.displayValue,
                        showProgressBar: true,
                        showPercentage: false
                    )
                }
                
                // 코너킥
                if let homeCorners = homeStats["Corner Kicks"],
                   let awayCorners = awayStats["Corner Kicks"] {
                    StatisticItem(
                        title: "코너킥",
                        leftValue: homeCorners.displayValue,
                        rightValue: awayCorners.displayValue,
                        showProgressBar: true,
                        showPercentage: false
                    )
                }
                
                Divider()
                    .padding(.horizontal)
                
                // 슈팅
                VStack(spacing: 16) {
                    Text("슈팅")
                        .font(.system(.headline, design: .rounded))
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    // 총 슈팅
                    if let homeTotalShots = homeStats["Total Shots"],
                       let awayTotalShots = awayStats["Total Shots"] {
                        StatisticItem(
                            title: "총 슈팅",
                            leftValue: homeTotalShots.displayValue,
                            rightValue: awayTotalShots.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                    
                    // 유효 슈팅
                    if let homeShotsOnGoal = homeStats["Shots on Goal"],
                       let awayShotsOnGoal = awayStats["Shots on Goal"] {
                        StatisticItem(
                            title: "유효 슈팅",
                            leftValue: homeShotsOnGoal.displayValue,
                            rightValue: awayShotsOnGoal.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                    
                    // 빗나간 슈팅
                    if let homeShotsOffGoal = homeStats["Shots off Goal"],
                       let awayShotsOffGoal = awayStats["Shots off Goal"] {
                        StatisticItem(
                            title: "빗나간 슈팅",
                            leftValue: homeShotsOffGoal.displayValue,
                            rightValue: awayShotsOffGoal.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                    
                    // 막힌 슈팅
                    if let homeBlockedShots = homeStats["Blocked Shots"],
                       let awayBlockedShots = awayStats["Blocked Shots"] {
                        StatisticItem(
                            title: "막힌 슈팅",
                            leftValue: homeBlockedShots.displayValue,
                            rightValue: awayBlockedShots.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                    
                    // 박스 안 슈팅
                    if let homeShotsInside = homeStats["Shots insidebox"],
                       let awayShotsInside = awayStats["Shots insidebox"] {
                        StatisticItem(
                            title: "박스 안",
                            leftValue: homeShotsInside.displayValue,
                            rightValue: awayShotsInside.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                    
                    // 박스 밖 슈팅
                    if let homeShotsOutside = homeStats["Shots outsidebox"],
                       let awayShotsOutside = awayStats["Shots outsidebox"] {
                        StatisticItem(
                            title: "박스 밖",
                            leftValue: homeShotsOutside.displayValue,
                            rightValue: awayShotsOutside.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                }
                
                Divider()
                    .padding(.horizontal)
                
                // 패스
                VStack(spacing: 16) {
                    Text("패스")
                        .font(.system(.headline, design: .rounded))
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    // 총 패스
                    if let homeTotalPasses = Int(homeStats["Total passes"]?.displayValue ?? "0"),
                       let awayTotalPasses = Int(awayStats["Total passes"]?.displayValue ?? "0") {
                        StatisticItem(
                            title: "총 패스",
                            leftValue: "\(homeTotalPasses)",
                            rightValue: "\(awayTotalPasses)",
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                    
                    // 패스 정확도
                    if let homePassAccuracy = homeStats["Passes %"]?.displayValue,
                       let awayPassAccuracy = awayStats["Passes %"]?.displayValue {
                        StatisticItem(
                            title: "패스 정확도",
                            leftValue: homePassAccuracy,
                            rightValue: awayPassAccuracy,
                            showProgressBar: true,
                            showPercentage: false // 이미 % 포함되어 있음
                        )
                    }
                    
                    // 크로스
                    if let homeCrosses = homeStats["Crosses total"],
                       let awayCrosses = awayStats["Crosses total"] {
                        StatisticItem(
                            title: "크로스",
                            leftValue: homeCrosses.displayValue,
                            rightValue: awayCrosses.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
                    }
                    
                    // 긴 패스
                    if let homeLongBalls = homeStats["Long Balls Accurate"],
                       let awayLongBalls = awayStats["Long Balls Accurate"] {
                        StatisticItem(
                            title: "긴 패스",
                            leftValue: homeLongBalls.displayValue,
                            rightValue: awayLongBalls.displayValue,
                            showProgressBar: true,
                            showPercentage: false
                        )
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
