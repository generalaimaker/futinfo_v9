import SwiftUI

struct FixtureDetailView: View {
    let fixture: Fixture
    @StateObject private var viewModel: FixtureDetailViewModel
    @State private var selectedTab = 0 // 0: 이벤트, 1: 통계, 2: 라인업
    
    init(fixture: Fixture) {
        self.fixture = fixture
        self._viewModel = StateObject(wrappedValue: FixtureDetailViewModel(
            fixtureId: fixture.fixture.id,
            season: fixture.league.season
        ))
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 경기 기본 정보
                MatchHeaderView(fixture: fixture)
                
                // 탭 선택
                Picker("상세 정보", selection: $selectedTab) {
                    Text("이벤트").tag(0)
                    Text("통계").tag(1)
                    Text("라인업").tag(2)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                
                // 선택된 탭에 따른 컨텐츠
                switch selectedTab {
                case 0:
                    if viewModel.isLoadingEvents {
                        ProgressView()
                    } else {
                        EventsView(events: viewModel.events)
                    }
                case 1:
                    if viewModel.isLoadingStats {
                        ProgressView()
                    } else {
                        StatisticsView(statistics: viewModel.statistics)
                    }
                case 2:
                    if viewModel.isLoadingLineups {
                        ProgressView()
                    } else {
                        LineupsView(
                            lineups: viewModel.lineups,
                            topPlayers: viewModel.topPlayers
                        )
                    }
                default:
                    EmptyView()
                }
            }
            .padding(.vertical)
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadAllData()
        }
    }
}

// MARK: - Match Header View
struct MatchHeaderView: View {
    let fixture: Fixture
    
    var body: some View {
        VStack(spacing: 16) {
            // 팀 정보와 스코어
            HStack(spacing: 20) {
                // 홈팀
                TeamInfoView(team: fixture.teams.home)
                
                // 스코어
                VStack(spacing: 4) {
                    if fixture.fixture.status.short == "NS" {
                        Text("VS")
                            .font(.title2.bold())
                    } else {
                        HStack(spacing: 8) {
                            Text("\(fixture.goals?.home ?? 0)")
                            Text("-")
                            Text("\(fixture.goals?.away ?? 0)")
                        }
                        .font(.title.bold())
                    }
                    
                    // 경기 상태
                    Text(fixture.fixture.status.long)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .frame(width: 80)
                
                // 원정팀
                TeamInfoView(team: fixture.teams.away)
            }
            
            // 경기장 정보
            if let venue = fixture.fixture.venue.name {
                Text(venue)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
}

// MARK: - Team Info View
struct TeamInfoView: View {
    let team: Team
    
    var body: some View {
        VStack(spacing: 8) {
            AsyncImage(url: URL(string: team.logo)) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt")
                    .foregroundColor(.gray)
            }
            .frame(width: 60, height: 60)
            
            Text(team.name)
                .font(.callout)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(width: 100)
        }
    }
}

// MARK: - Events View
struct EventsView: View {
    let events: [FixtureEvent]
    
    var body: some View {
        VStack(spacing: 16) {
            if events.isEmpty {
                Text("이벤트 정보가 없습니다")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                ForEach(events) { event in
                    EventRow(event: event)
                }
            }
        }
        .padding(.horizontal)
    }
}
struct EventRow: View {
    let event: FixtureEvent
    
    private func getEventIcon(_ type: String, detail: String) -> String {
        switch type {
        case "Goal":
            if detail.contains("Normal Goal") {
                return "⚽️"
            } else if detail.contains("Penalty") {
                return "🎯"
            } else if detail.contains("Own Goal") {
                return "🔄"
            } else {
                return "⚽️"
            }
        case "Card":
            if detail.contains("Yellow") {
                return "🟨"
            } else {
                return "🟥"
            }
        case "subst":
            return "🔄"
        default:
            return "📝"
        }
    }
    
    var body: some View {
        HStack {
            // 시간
            Text("\(event.time.elapsed)'")
                .font(.callout)
                .frame(width: 40)
            
            // 이벤트 아이콘
            Text(getEventIcon(event.type, detail: event.detail))
                .font(.title3)
                .frame(width: 30)
            
            // 이벤트 정보
            VStack(alignment: .leading, spacing: 4) {
                if let playerName = event.player.name {
                    Text(playerName)
                        .font(.callout)
                }
                
                if let assist = event.assist, let assistName = assist.name {
                    Text("어시스트: \(assistName)")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            // 팀 로고
            AsyncImage(url: URL(string: event.team.logo)) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt")
                    .foregroundColor(.gray)
            }
            .frame(width: 25, height: 25)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Statistics View
struct StatisticsView: View {
    let statistics: [TeamStatistics]
    
    var body: some View {
        VStack(spacing: 16) {
            if statistics.isEmpty {
                Text("통계 정보가 없습니다")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                ForEach(statistics[0].statistics.indices, id: \.self) { index in
                    if index < statistics[1].statistics.count {
                        StatisticRow(
                            type: statistics[0].statistics[index].type,
                            homeValue: statistics[0].statistics[index].value,
                            awayValue: statistics[1].statistics[index].value
                        )
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

struct StatisticRow: View {
    let type: String
    let homeValue: StatisticValue
    let awayValue: StatisticValue
    
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
        VStack(spacing: 8) {
            // 통계 이름
            Text(type)
                .font(.caption)
                .foregroundColor(.gray)
            
            // 통계 바
            GeometryReader { geometry in
                HStack(spacing: 0) {
                    let percentages = calculatePercentages()
                    
                    // 홈팀 통계
                    Rectangle()
                        .fill(Color.blue)
                        .frame(width: max(geometry.size.width * percentages.home, 0))
                    
                    // 원정팀 통계
                    Rectangle()
                        .fill(Color.red)
                        .frame(width: max(geometry.size.width * percentages.away, 0))
                }
            }
            .frame(height: 8)
            .cornerRadius(4)
            
            // 수치
            HStack {
                Text(formatValue(homeValue))
                Spacer()
                Text(formatValue(awayValue))
            }
            .font(.caption2)
        }
    }
}

// MARK: - Lineups View
struct LineupsView: View {
    let lineups: [TeamLineup]
    let topPlayers: [PlayerStats]
    
    var body: some View {
        VStack(spacing: 24) {
            if lineups.isEmpty {
                Text("라인업 정보가 없습니다")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                // 선발 라인업
                ForEach(lineups, id: \.team.id) { lineup in
                    VStack(spacing: 16) {
                        // 팀 정보
                        HStack {
                            AsyncImage(url: URL(string: lineup.team.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 30, height: 30)
                            
                            Text(lineup.team.name)
                                .font(.headline)
                            
                            Spacer()
                            
                            Text("포메이션: \(lineup.formation)")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        
                        // 선발 선수
                        VStack(alignment: .leading, spacing: 8) {
                            Text("선발")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            ForEach(lineup.startXI) { player in
                                HStack {
                                    Text("\(player.number)")
                                        .font(.caption)
                                        .frame(width: 20)
                                    
                                    Text(player.name)
                                        .font(.callout)
                                    
                                    Spacer()
                                    
                                    if let position = player.pos {
                                        Text(position)
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                        }
                        
                        // 교체 선수
                        VStack(alignment: .leading, spacing: 8) {
                            Text("교체")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            ForEach(lineup.substitutes) { player in
                                HStack {
                                    Text("\(player.number)")
                                        .font(.caption)
                                        .frame(width: 20)
                                    
                                    Text(player.name)
                                        .font(.callout)
                                    
                                    Spacer()
                                    
                                    if let position = player.pos {
                                        Text(position)
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                }
                
                // 최고 평점 선수
                if !topPlayers.isEmpty {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("최고 평점 선수")
                            .font(.headline)
                        
                        ForEach(topPlayers.prefix(5), id: \.player.id) { playerStat in
                            if let stats = playerStat.statistics.first,
                               let rating = stats.games.rating {
                                HStack {
                                    AsyncImage(url: URL(string: playerStat.player.photo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                    } placeholder: {
                                        Image(systemName: "person.circle")
                                            .foregroundColor(.gray)
                                    }
                                    .frame(width: 40, height: 40)
                                    .clipShape(Circle())
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(playerStat.player.name)
                                            .font(.callout)
                                        
                                        Text(stats.team.name)
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Spacer()
                                    
                                    Text(rating)
                                        .font(.headline)
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                }
            }
        }
        .padding(.horizontal)
    }
}