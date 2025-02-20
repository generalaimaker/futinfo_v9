import SwiftUI

public struct ShootingChartView: View {
    public let statistics: [TeamStatistics]
    
    public init(statistics: [TeamStatistics]) {
        self.statistics = statistics
    }
    
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
    
    public var body: some View {
        VStack(spacing: 24) {
            // 슈팅 분포 차트
            VStack(spacing: 16) {
                Text("슈팅 분포")
                    .font(.system(.headline, design: .rounded))
                    .fontWeight(.bold)
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
                        
                        VStack(spacing: 12) {
                            let total = Int(homeStats["Total Shots"]?.displayValue ?? "0") ?? 0
                            let onTarget = Int(homeStats["Shots on Goal"]?.displayValue ?? "0") ?? 0
                            let blocked = Int(homeStats["Blocked Shots"]?.displayValue ?? "0") ?? 0
                            let offTarget = Int(homeStats["Shots off Goal"]?.displayValue ?? "0") ?? 0
                            
                            Text("\(total)")
                                .font(.system(.title, design: .rounded))
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                            
                            ShootingDistributionChart(
                                total: total,
                                onTarget: onTarget,
                                blocked: blocked,
                                offTarget: offTarget,
                                teamColor: .blue
                            )
                        }
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
                        
                        VStack(spacing: 12) {
                            let total = Int(awayStats["Total Shots"]?.displayValue ?? "0") ?? 0
                            let onTarget = Int(awayStats["Shots on Goal"]?.displayValue ?? "0") ?? 0
                            let blocked = Int(awayStats["Blocked Shots"]?.displayValue ?? "0") ?? 0
                            let offTarget = Int(awayStats["Shots off Goal"]?.displayValue ?? "0") ?? 0
                            
                            Text("\(total)")
                                .font(.system(.title, design: .rounded))
                                .fontWeight(.bold)
                                .foregroundColor(.red)
                            
                            ShootingDistributionChart(
                                total: total,
                                onTarget: onTarget,
                                blocked: blocked,
                                offTarget: offTarget,
                                teamColor: .red
                            )
                        }
                    }
                }
            }
            
            Divider()
                .padding(.horizontal)
            
            // 박스 안/밖 슈팅 비교
            VStack(spacing: 16) {
                Text("슈팅 위치")
                    .font(.system(.headline, design: .rounded))
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                VStack(spacing: 16) {
                    StatisticItem(
                        title: "박스 안",
                        leftValue: homeStats["Shots insidebox"]?.displayValue ?? "0",
                        rightValue: awayStats["Shots insidebox"]?.displayValue ?? "0",
                        showProgressBar: true,
                        showPercentage: true
                    )
                    
                    StatisticItem(
                        title: "박스 밖",
                        leftValue: homeStats["Shots outsidebox"]?.displayValue ?? "0",
                        rightValue: awayStats["Shots outsidebox"]?.displayValue ?? "0",
                        showProgressBar: true,
                        showPercentage: true
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

public struct ShootingDistributionChart: View {
    public let total: Int
    public let onTarget: Int
    public let blocked: Int
    public let offTarget: Int
    public let teamColor: Color
    
    private var maxWidth: CGFloat = 150
    private var barHeight: CGFloat = 24
    
    public init(total: Int, onTarget: Int, blocked: Int, offTarget: Int, teamColor: Color) {
        self.total = total
        self.onTarget = onTarget
        self.blocked = blocked
        self.offTarget = offTarget
        self.teamColor = teamColor
    }
    
    private var onTargetPercentage: String {
        total > 0 ? String(format: "%.0f%%", Double(onTarget) / Double(total) * 100) : "0%"
    }
    
    private var blockedPercentage: String {
        total > 0 ? String(format: "%.0f%%", Double(blocked) / Double(total) * 100) : "0%"
    }
    
    private var offTargetPercentage: String {
        total > 0 ? String(format: "%.0f%%", Double(offTarget) / Double(total) * 100) : "0%"
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 유효 슈팅
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("유효 슈팅")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(onTarget) (\(onTargetPercentage))")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(teamColor)
                }
                
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.systemGray6))
                        .frame(width: maxWidth, height: barHeight)
                    
                    RoundedRectangle(cornerRadius: 6)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    teamColor.opacity(0.8),
                                    teamColor
                                ]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: total > 0 ? maxWidth * CGFloat(onTarget) / CGFloat(total) : 0, height: barHeight)
                }
            }
            
            // 막힌 슈팅
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("막힌 슈팅")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(blocked) (\(blockedPercentage))")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(teamColor.opacity(0.6))
                }
                
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.systemGray6))
                        .frame(width: maxWidth, height: barHeight)
                    
                    RoundedRectangle(cornerRadius: 6)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    teamColor.opacity(0.5),
                                    teamColor.opacity(0.6)
                                ]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: total > 0 ? maxWidth * CGFloat(blocked) / CGFloat(total) : 0, height: barHeight)
                }
            }
            
            // 빗나간 슈팅
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("빗나간 슈팅")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(offTarget) (\(offTargetPercentage))")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(teamColor.opacity(0.3))
                }
                
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(.systemGray6))
                        .frame(width: maxWidth, height: barHeight)
                    
                    RoundedRectangle(cornerRadius: 6)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    teamColor.opacity(0.2),
                                    teamColor.opacity(0.3)
                                ]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: total > 0 ? maxWidth * CGFloat(offTarget) / CGFloat(total) : 0, height: barHeight)
                }
            }
        }
    }
}
