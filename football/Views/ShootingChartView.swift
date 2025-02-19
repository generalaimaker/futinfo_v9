import SwiftUI

struct ShootingChartView: View {
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
            // 슈팅 분포 차트
            VStack(spacing: 8) {
                Text("슈팅 분포")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                HStack(spacing: 20) {
                    // 홈팀 슈팅 분포
                    VStack(spacing: 12) {
                        AsyncImage(url: URL(string: statistics[0].team.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                                .frame(width: 32, height: 32)
                        } placeholder: {
                            Image(systemName: "sportscourt")
                                .font(.system(size: 24))
                                .foregroundColor(.gray)
                        }
                        
                        ShootingDistributionChart(
                            total: Int(homeStats["Total Shots"]?.displayValue ?? "0") ?? 0,
                            onTarget: Int(homeStats["Shots on Goal"]?.displayValue ?? "0") ?? 0,
                            blocked: Int(homeStats["Blocked Shots"]?.displayValue ?? "0") ?? 0,
                            offTarget: Int(homeStats["Shots off Goal"]?.displayValue ?? "0") ?? 0,
                            teamColor: .blue
                        )
                    }
                    
                    // 원정팀 슈팅 분포
                    VStack(spacing: 12) {
                        AsyncImage(url: URL(string: statistics[1].team.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                                .frame(width: 32, height: 32)
                        } placeholder: {
                            Image(systemName: "sportscourt")
                                .font(.system(size: 24))
                                .foregroundColor(.gray)
                        }
                        
                        ShootingDistributionChart(
                            total: Int(awayStats["Total Shots"]?.displayValue ?? "0") ?? 0,
                            onTarget: Int(awayStats["Shots on Goal"]?.displayValue ?? "0") ?? 0,
                            blocked: Int(awayStats["Blocked Shots"]?.displayValue ?? "0") ?? 0,
                            offTarget: Int(awayStats["Shots off Goal"]?.displayValue ?? "0") ?? 0,
                            teamColor: .red
                        )
                    }
                }
            }
            
            // 박스 안/밖 슈팅 비교
            VStack(spacing: 8) {
                Text("박스 안/밖 슈팅")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                VStack(spacing: 16) {
                    StatisticItem(
                        title: "박스 안",
                        leftValue: homeStats["Shots insidebox"]?.displayValue ?? "0",
                        rightValue: awayStats["Shots insidebox"]?.displayValue ?? "0"
                    )
                    
                    StatisticItem(
                        title: "박스 밖",
                        leftValue: homeStats["Shots outsidebox"]?.displayValue ?? "0",
                        rightValue: awayStats["Shots outsidebox"]?.displayValue ?? "0"
                    )
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
    }
}

struct ShootingDistributionChart: View {
    let total: Int
    let onTarget: Int
    let blocked: Int
    let offTarget: Int
    let teamColor: Color
    
    var barHeight: CGFloat = 24
    var maxWidth: CGFloat = 150
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // 유효 슈팅
            VStack(alignment: .leading, spacing: 4) {
                Text("유효 슈팅")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                GeometryReader { geometry in
                    let width = total > 0 ? CGFloat(onTarget) / CGFloat(total) * maxWidth : 0
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(teamColor)
                        .frame(width: width, height: barHeight)
                }
                .frame(width: maxWidth, height: barHeight)
            }
            
            // 막힌 슈팅
            VStack(alignment: .leading, spacing: 4) {
                Text("막힌 슈팅")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                GeometryReader { geometry in
                    let width = total > 0 ? CGFloat(blocked) / CGFloat(total) * maxWidth : 0
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(teamColor.opacity(0.6))
                        .frame(width: width, height: barHeight)
                }
                .frame(width: maxWidth, height: barHeight)
            }
            
            // 빗나간 슈팅
            VStack(alignment: .leading, spacing: 4) {
                Text("빗나간 슈팅")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                GeometryReader { geometry in
                    let width = total > 0 ? CGFloat(offTarget) / CGFloat(total) * maxWidth : 0
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(teamColor.opacity(0.3))
                        .frame(width: width, height: barHeight)
                }
                .frame(width: maxWidth, height: barHeight)
            }
        }
    }
}
