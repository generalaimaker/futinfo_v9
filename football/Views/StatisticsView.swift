import SwiftUI

struct StatisticsView: View {
    @ObservedObject var viewModel: FixtureDetailViewModel
    let statistics: [TeamStatistics]
    let halfStatistics: [HalfTeamStatistics]
    let chartData: [ChartData]
    let selectedType: StatisticType?
    let onTypeFilter: (StatisticType?) -> Void
    @State private var selectedTab = 0 // 0: 전체, 1: 전/후반
    @State private var selectedChartCategory = 0 // 0: 공격, 1: 패스, 2: 수비, 3: 기타
    
    private var mainStats: [StatisticType] {
        [
            .ballPossession,
            .shotsOnGoal,
            .totalShots,
            .expectedGoals
        ]
    }
    
    private var secondaryStats: [StatisticType] {
        [
            .totalPasses,
            .passesAccurate,
            .passesPercentage,
            .saves,
            .cornerKicks,
            .fouls,
            .yellowCards,
            .offsides
        ]
    }
    
    private let chartCategories = ["공격", "패스", "수비", "기타"]
    
    private var filteredChartData: [ChartData] {
        guard !chartData.isEmpty else { return [] }
        
        let itemsPerCategory = 3
        let start = selectedChartCategory * itemsPerCategory
        
        guard start < chartData.count else { return [] }
        
        let end = min(start + itemsPerCategory, chartData.count)
        return Array(chartData[start..<end])
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundColor(.gray)
                        .padding()
                } else if statistics.count >= 2 {
                    // 탭 선택
                    Picker("통계 보기", selection: $selectedTab) {
                        Text("전체").tag(0)
                        Text("전/후반").tag(1)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .padding(.horizontal)
                    
                    if selectedTab == 0 {
                        // 차트 뷰
                        VStack(spacing: 16) {
                            Text("통계 차트")
                                .font(.headline)
                            
                            // 차트 카테고리 선택
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(chartCategories.indices, id: \.self) { index in
                                        Button(action: {
                                            withAnimation {
                                                selectedChartCategory = index
                                            }
                                        }) {
                                            Text(chartCategories[index])
                                                .font(.subheadline)
                                                .padding(.horizontal, 16)
                                                .padding(.vertical, 8)
                                                .background(selectedChartCategory == index ? Color.blue : Color(.systemGray6))
                                                .foregroundColor(selectedChartCategory == index ? .white : .primary)
                                                .cornerRadius(20)
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                            
                            // 차트 그리기
                            ForEach(filteredChartData, id: \.label) { data in
                                StatisticChartRow(
                                    label: data.label,
                                    homeValue: data.homeValue,
                                    awayValue: data.awayValue,
                                    maxValue: data.maxValue,
                                    homeTeam: statistics[0].team,
                                    awayTeam: statistics[1].team
                                )
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                        
                        // 주요 통계
                        VStack(spacing: 16) {
                            Text("주요 통계")
                                .font(.headline)
                            
                            ForEach(mainStats, id: \.rawValue) { type in
                                let homeValue = statistics[0].getValue(for: type)
                                let awayValue = statistics[1].getValue(for: type)
                                MainStatisticRow(
                                    type: type.rawValue,
                                    homeValue: homeValue,
                                    awayValue: awayValue,
                                    homeTeam: statistics[0].team,
                                    awayTeam: statistics[1].team
                                )
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                        
                        // 상세 통계
                        VStack(spacing: 16) {
                            Text("상세 통계")
                                .font(.headline)
                            
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 16) {
                                ForEach(secondaryStats, id: \.rawValue) { type in
                                    let homeValue = statistics[0].getValue(for: type)
                                    let awayValue = statistics[1].getValue(for: type)
                                    StatisticCard(
                                        type: type.rawValue,
                                        homeValue: homeValue,
                                        awayValue: awayValue,
                                        homeTeam: statistics[0].team,
                                        awayTeam: statistics[1].team
                                    )
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                    } else {
                        // 전/후반 통계
                        HalfStatisticsView(viewModel: viewModel, statistics: viewModel.halfStatistics)
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

struct StatisticChartRow: View {
    let label: String
    let homeValue: Double
    let awayValue: Double
    let maxValue: Double
    let homeTeam: Team
    let awayTeam: Team
    
    var body: some View {
        VStack(spacing: 12) {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.gray)
            
            HStack(spacing: 16) {
                // 홈팀
                HStack(spacing: 8) {
                    AsyncImage(url: URL(string: homeTeam.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    
                    Text(String(format: "%.1f", homeValue))
                        .font(.system(.body, design: .rounded))
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                }
                
                // 차트
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        // 배경
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.gray.opacity(0.1))
                            .frame(height: 12)
                        
                        // 홈팀 바
                        RoundedRectangle(cornerRadius: 6)
                            .fill(LinearGradient(
                                gradient: Gradient(colors: [.blue.opacity(0.8), .blue.opacity(0.4)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                            .frame(width: max(geometry.size.width * CGFloat(homeValue / maxValue), 0), height: 12)
                    }
                }
                .frame(height: 12)
                
                // 원정팀
                HStack(spacing: 8) {
                    Text(String(format: "%.1f", awayValue))
                        .font(.system(.body, design: .rounded))
                        .fontWeight(.medium)
                        .foregroundColor(.red)
                    
                    AsyncImage(url: URL(string: awayTeam.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct MainStatisticRow: View {
    let type: String
    let homeValue: StatisticValue
    let awayValue: StatisticValue
    let homeTeam: Team
    let awayTeam: Team
    
    private func formatValue(_ value: StatisticValue) -> String {
        switch value {
        case .string(let str): return str
        case .int(let num): return "\(num)"
        case .double(let num): return String(format: "%.1f", num)
        case .null: return "0"
        }
    }
    
    private func calculatePercentages() -> (home: CGFloat, away: CGFloat) {
        let home = getValue(homeValue)
        let away = getValue(awayValue)
        let total = home + away
        
        if total == 0 { return (0.5, 0.5) }
        return (CGFloat(home) / CGFloat(total), CGFloat(away) / CGFloat(total))
    }
    
    private func getValue(_ value: StatisticValue) -> Double {
        switch value {
        case .string(let str):
            if str.hasSuffix("%") {
                return Double(str.replacingOccurrences(of: "%", with: "")) ?? 0
            }
            return Double(str) ?? 0
        case .int(let num): return Double(num)
        case .double(let num): return num
        case .null: return 0
        }
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // 통계 이름
            Text(type)
                .font(.subheadline)
                .foregroundColor(.gray)
            
            // 팀 로고와 수치
            HStack {
                // 홈팀
                HStack(spacing: 8) {
                    AsyncImage(url: URL(string: homeTeam.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    
                    Text(formatValue(homeValue))
                        .font(.system(.title3, design: .rounded))
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }
                
                Spacer()
                
                // 원정팀
                HStack(spacing: 8) {
                    Text(formatValue(awayValue))
                        .font(.system(.title3, design: .rounded))
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                    
                    AsyncImage(url: URL(string: awayTeam.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                }
            }
            
            // 프로그레스 바
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // 배경
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.gray.opacity(0.1))
                        .frame(height: 12)
                    
                    // 홈팀 프로그레스
                    let percentages = calculatePercentages()
                    RoundedRectangle(cornerRadius: 6)
                        .fill(LinearGradient(
                            gradient: Gradient(colors: [.blue.opacity(0.8), .blue.opacity(0.4)]),
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(width: max(geometry.size.width * percentages.home, 0), height: 12)
                }
            }
            .frame(height: 12)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct StatisticCard: View {
    let type: String
    let homeValue: StatisticValue
    let awayValue: StatisticValue
    let homeTeam: Team
    let awayTeam: Team
    
    private func formatValue(_ value: StatisticValue) -> String {
        switch value {
        case .string(let str): return str
        case .int(let num): return "\(num)"
        case .double(let num): return String(format: "%.1f", num)
        case .null: return "0"
        }
    }
    
    var body: some View {
        VStack(spacing: 8) {
            Text(type)
                .font(.caption)
                .foregroundColor(.gray)
            
            HStack(spacing: 16) {
                // 홈팀
                VStack(spacing: 4) {
                    AsyncImage(url: URL(string: homeTeam.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 20, height: 20)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    
                    Text(formatValue(homeValue))
                        .font(.system(.body, design: .rounded))
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                }
                
                Text("vs")
                    .font(.caption2)
                    .foregroundColor(.gray)
                
                // 원정팀
                VStack(spacing: 4) {
                    AsyncImage(url: URL(string: awayTeam.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 20, height: 20)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    
                    Text(formatValue(awayValue))
                        .font(.system(.body, design: .rounded))
                        .fontWeight(.medium)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct HalfStatisticsView: View {
    @ObservedObject var viewModel: FixtureDetailViewModel
    let statistics: [HalfTeamStatistics]
    
    var body: some View {
        VStack(spacing: 24) {
            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundColor(.gray)
                    .padding()
            } else if statistics.count >= 2 {
                ForEach(statistics) { teamStats in
                    VStack(spacing: 16) {
                        // 팀 정보
                        HStack {
                            AsyncImage(url: URL(string: teamStats.team.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 30, height: 30)
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .foregroundColor(.gray)
                            }
                            
                            Text(teamStats.team.name)
                                .font(.headline)
                            
                            Spacer()
                        }
                        
                        // 전/후반 통계 비교
                        VStack(spacing: 12) {
                            let firstHalf = teamStats.statistics
                            ForEach(firstHalf, id: \.type) { stat in
                                HalfStatisticRow(
                                    type: stat.type,
                                    firstHalf: stat.value,
                                    secondHalf: stat.value
                                )
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                }
            }
        }
    }
}

struct HalfStatisticRow: View {
    let type: String
    let firstHalf: StatisticValue
    let secondHalf: StatisticValue
    
    var body: some View {
        VStack(spacing: 8) {
            Text(type)
                .font(.subheadline)
                .foregroundColor(.gray)
            
            HStack(spacing: 20) {
                // 전반
                VStack(spacing: 4) {
                    Text("전반")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(firstHalf.displayValue)
                        .font(.system(.body, design: .rounded))
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                }
                
                Divider()
                    .frame(height: 30)
                
                // 후반
                VStack(spacing: 4) {
                    Text("후반")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(secondHalf.displayValue)
                        .font(.system(.body, design: .rounded))
                        .fontWeight(.medium)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
