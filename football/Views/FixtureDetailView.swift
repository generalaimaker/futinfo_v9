import SwiftUI

struct FixtureDetailView: View {
    let fixture: Fixture
    @StateObject private var viewModel: FixtureDetailViewModel
    @State private var selectedTab = 0 // 0: 이벤트, 1: 통계, 2: 라인업, 3: 선수 통계, 4: 상대전적
    
    init(fixture: Fixture) {
        self.fixture = fixture
        self._viewModel = StateObject(wrappedValue: FixtureDetailViewModel(fixture: fixture))
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 경기 기본 정보
                MatchHeaderView(fixture: fixture)
                
                // 탭 컨트롤
                VStack(spacing: 0) {
                    // 메인 탭
                    HStack(spacing: 0) {
                        ForEach(["이벤트", "통계", "라인업", "선수 통계", "상대전적"].indices, id: \.self) { index in
                            Button(action: {
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    selectedTab = index
                                }
                            }) {
                                VStack(spacing: 8) {
                                    Text(["이벤트", "통계", "라인업", "선수 통계", "상대전적"][index])
                                        .font(.system(.subheadline, design: .rounded))
                                        .fontWeight(selectedTab == index ? .semibold : .regular)
                                        .foregroundColor(selectedTab == index ? .blue : .gray)
                                        .frame(maxWidth: .infinity)
                                    
                                    // 선택 인디케이터
                                    Rectangle()
                                        .fill(selectedTab == index ? Color.blue : Color.clear)
                                        .frame(height: 3)
                                        .cornerRadius(1.5)
                                }
                            }
                            .buttonStyle(PlainButtonStyle())
                            .frame(height: 44)
                        }
                    }
                    .padding(.horizontal)
                    
                    Divider()
                        .padding(.horizontal)
                }
                .background(Color(.systemBackground))
                
                // 선택된 탭에 따른 컨텐츠
                switch selectedTab {
                case 0:
                    if viewModel.isLoadingEvents {
                        ProgressView()
                    } else {
                        EventsView(
                            events: viewModel.events,
                            fixture: fixture,
                            selectedTeamId: viewModel.selectedTeamId,
                            selectedPlayerId: viewModel.selectedPlayerId,
                            onTeamFilter: viewModel.filterByTeam,
                            onPlayerFilter: viewModel.filterByPlayer
                        )
                    }
                case 1:
                    if viewModel.isLoadingStats {
                        ProgressView()
                    } else {
                        StatisticsView(
                            statistics: viewModel.statistics,
                            selectedType: viewModel.selectedStatisticType,
                            onTypeFilter: viewModel.filterByStatisticType
                        )
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
                case 3:
                    if viewModel.isLoadingMatchStats {
                        ProgressView()
                    } else if !viewModel.matchPlayerStats.isEmpty {
                        MatchPlayerStatsView(teamStats: viewModel.matchPlayerStats)
                    } else {
                        Text(viewModel.errorMessage ?? "선수 통계 정보를 불러올 수 없습니다")
                            .foregroundColor(.gray)
                            .padding()
                    }
                case 4:
                    if viewModel.isLoadingHeadToHead {
                        ProgressView()
                    } else if let team1Stats = viewModel.team1Stats,
                              let team2Stats = viewModel.team2Stats {
                        HeadToHeadView(
                            fixtures: viewModel.headToHeadFixtures,
                            team1Stats: team1Stats,
                            team2Stats: team2Stats,
                            team1: fixture.teams.home,
                            team2: fixture.teams.away
                        )
                    } else {
                        Text(viewModel.errorMessage ?? "상대전적 정보를 불러올 수 없습니다")
                            .foregroundColor(.gray)
                            .padding()
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
    
    private var isLive: Bool {
        ["1H", "2H", "HT", "ET", "P"].contains(fixture.fixture.status.short)
    }
    
    private var statusColor: Color {
        if isLive {
            return .red
        } else if fixture.fixture.status.short == "NS" {
            return .blue
        } else {
            return .gray
        }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // 리그 및 경기 상태
            VStack(spacing: 8) {
                HStack {
                    AsyncImage(url: URL(string: fixture.league.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "trophy.fill")
                            .foregroundColor(.gray)
                    }
                    
                    Text(fixture.league.name)
                        .font(.system(.subheadline, design: .rounded))
                        .fontWeight(.medium)
                }
                
                // 경기 상태
                HStack(spacing: 6) {
                    if isLive {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                    }
                    
                    Text(fixture.fixture.status.long)
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundColor(statusColor)
                        .fontWeight(.medium)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // 팀 정보와 스코어
            HStack(alignment: .center, spacing: 0) {
                // 홈팀
                TeamInfoView(team: fixture.teams.home, isWinner: fixture.teams.home.winner == true)
                    .frame(maxWidth: .infinity)
                
                // 스코어
                VStack(spacing: 8) {
                    if fixture.fixture.status.short == "NS" {
                        Text("VS")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(.blue)
                            .frame(width: 120)
                            .padding(.vertical, 12)
                    } else {
                        VStack(spacing: 6) {
                            HStack(spacing: 20) {
                                Text("\(fixture.goals?.home ?? 0)")
                                Text("-")
                                Text("\(fixture.goals?.away ?? 0)")
                            }
                            .font(.system(size: 44, weight: .bold, design: .rounded))
                            
                            if let elapsed = fixture.fixture.status.elapsed {
                                Text("\(elapsed)'")
                                    .font(.system(.callout, design: .rounded))
                                    .fontWeight(.medium)
                                    .foregroundColor(statusColor)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(statusColor.opacity(0.1))
                                    .clipShape(Capsule())
                            }
                        }
                        .frame(width: 120)
                        .padding(.vertical, 12)
                    }
                }
                .background(Color(.systemBackground))
                
                // 원정팀
                TeamInfoView(team: fixture.teams.away, isWinner: fixture.teams.away.winner == true)
                    .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 20)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 8, y: 2)
            
            // 경기 정보
            HStack(spacing: 24) {
                if let venue = fixture.fixture.venue.name {
                    Label {
                        Text(venue)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.gray)
                    } icon: {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(.gray)
                    }
                }
                
                if let referee = fixture.fixture.referee {
                    Label {
                        Text(referee)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.gray)
                    } icon: {
                        Image(systemName: "whistle.fill")
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }
}

// MARK: - Team Info View
struct TeamInfoView: View {
    let team: Team
    let isWinner: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // 팀 로고
            ZStack {
                Circle()
                    .fill(Color(.systemBackground))
                    .frame(width: 80, height: 80)
                    .shadow(color: isWinner ? Color.blue.opacity(0.2) : Color.black.opacity(0.05),
                           radius: isWinner ? 12 : 8)
                
                AsyncImage(url: URL(string: team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .saturation(isWinner ? 1.0 : 0.8)
                } placeholder: {
                    Image(systemName: "sportscourt.fill")
                        .font(.system(size: 30))
                        .foregroundColor(.gray)
                }
                .frame(width: 60, height: 60)
                
                if isWinner {
                    Circle()
                        .strokeBorder(Color.blue.opacity(0.3), lineWidth: 3)
                        .frame(width: 80, height: 80)
                }
            }
            
            VStack(spacing: 6) {
                // 팀 이름
                Text(team.name)
                    .font(.system(.callout, design: .rounded))
                    .fontWeight(isWinner ? .semibold : .medium)
                    .foregroundColor(isWinner ? .primary : .secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(maxWidth: 130)
                
                // 승리 표시
                if isWinner {
                    Label("승리", systemImage: "checkmark.circle.fill")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.blue)
                        .imageScale(.small)
                }
            }
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

// MARK: - Events View
struct EventsView: View {
    let events: [FixtureEvent]
    let fixture: Fixture
    let selectedTeamId: Int?
    let selectedPlayerId: Int?
    let onTeamFilter: (Int?) -> Void
    let onPlayerFilter: (Int?) -> Void
    
    private var sortedEvents: [(Int, [FixtureEvent])] {
        Dictionary(grouping: events) { $0.time.elapsed }
            .sorted { $0.key < $1.key }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // 필터 옵션
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    // 팀 필터
                    FilterButton(
                        title: "전체 팀",
                        isSelected: selectedTeamId == nil,
                        action: { onTeamFilter(nil) }
                    )
                    
                    FilterButton(
                        title: fixture.teams.home.name,
                        isSelected: selectedTeamId == fixture.teams.home.id,
                        action: { onTeamFilter(fixture.teams.home.id) }
                    )
                    
                    FilterButton(
                        title: fixture.teams.away.name,
                        isSelected: selectedTeamId == fixture.teams.away.id,
                        action: { onTeamFilter(fixture.teams.away.id) }
                    )
                }
                .padding(.horizontal)
            }
            
            if events.isEmpty {
                Text("이벤트 정보가 없습니다")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                // 타임라인 뷰
                ScrollView {
                    VStack(spacing: 0) {
                        ForEach(sortedEvents, id: \.0) { elapsed, timeEvents in
                            TimelineSection(
                                elapsed: elapsed,
                                events: timeEvents,
                                fixture: fixture,
                                selectedPlayerId: selectedPlayerId,
                                onPlayerTap: onPlayerFilter
                            )
                        }
                    }
                    .padding(.vertical)
                }
            }
        }
        .padding(.horizontal)
    }
}

struct TimelineSection: View {
    let elapsed: Int
    let events: [FixtureEvent]
    let fixture: Fixture
    let selectedPlayerId: Int?
    let onPlayerTap: (Int?) -> Void
    
    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            // 시간 표시
            Text("\(elapsed)'")
                .font(.system(.caption, design: .rounded))
                .fontWeight(.medium)
                .foregroundColor(.gray)
                .frame(width: 40)
            
            // 타임라인 라인
            TimelineLine()
                .frame(width: 2)
                .padding(.horizontal, 8)
            
            // 이벤트 카드들
            VStack(spacing: 8) {
                ForEach(events) { event in
                    TimelineEventCard(
                        event: event,
                        isHome: event.team.id == fixture.teams.home.id,
                        isSelected: event.player.id == selectedPlayerId,
                        onTap: { onPlayerTap(event.player.id) }
                    )
                }
            }
            .padding(.trailing)
        }
        .padding(.vertical, 8)
    }
}

struct TimelineLine: View {
    var body: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.2))
    }
}

struct TimelineEventCard: View {
    let event: FixtureEvent
    let isHome: Bool
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                if !isHome {
                    Spacer()
                }
                
                HStack {
                    if isHome {
                        eventContent
                        Spacer()
                        eventIcon
                    } else {
                        eventIcon
                        Spacer()
                        eventContent
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(backgroundColor)
                .cornerRadius(12)
                .frame(width: UIScreen.main.bounds.width * 0.6)
                
                if isHome {
                    Spacer()
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var eventContent: some View {
        VStack(alignment: isHome ? .leading : .trailing, spacing: 4) {
            if let playerName = event.player.name {
                Text(playerName)
                    .font(.callout)
                    .fontWeight(.medium)
            }
            
            if let assist = event.assist, let assistName = assist.name {
                Text("어시스트: \(assistName)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            if let comments = event.comments {
                Text(comments)
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
    }
    
    private var eventIcon: some View {
        Text(event.icon)
            .font(.title3)
    }
    
    private var backgroundColor: Color {
        if isSelected {
            return Color.blue.opacity(0.2)
        }
        
        switch event.eventCategory {
        case .goal:
            return Color.green.opacity(0.1)
        case .card:
            return Color.red.opacity(0.1)
        case .var:
            return Color.blue.opacity(0.1)
        default:
            return Color(.systemGray6)
        }
    }
}

struct FilterButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color.gray.opacity(0.2))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(12)
        }
    }
}

struct EventRow: View {
    let event: FixtureEvent
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                // 시간
                Text(event.time.displayTime)
                    .font(.callout)
                    .frame(width: 50)
                
                // 이벤트 아이콘
                Text(event.icon)
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
                    
                    // VAR 결정이나 추가 설명이 있는 경우
                    if let comments = event.comments {
                        Text(comments)
                            .font(.caption)
                            .foregroundColor(.gray)
                            .padding(.top, 2)
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
            .padding(.horizontal, 12)
            .background(backgroundColor)
            .cornerRadius(8)
        }
    }
    
    // 이벤트 종류와 선택 상태에 따른 배경색
    private var backgroundColor: Color {
        if isSelected {
            return Color.blue.opacity(0.2)
        }
        
        switch event.eventCategory {
        case .goal:
            return Color.green.opacity(0.1)
        case .card:
            return Color.red.opacity(0.1)
        case .var:
            return Color.blue.opacity(0.1)
        default:
            return Color.clear
        }
    }
}

// MARK: - Statistics View
struct StatisticsView: View {
    let statistics: [TeamStatistics]
    let selectedType: StatisticType?
    let onTypeFilter: (StatisticType?) -> Void
    
    private let mainStats = [
        StatisticType.ballPossession,
        .shotsOnGoal,
        .totalShots
    ]
    
    private let secondaryStats = [
        StatisticType.saves,
        .cornerKicks,
        .fouls,
        .offsides,
        .passesAccurate
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if statistics.isEmpty {
                    Text("통계 정보가 없습니다")
                        .foregroundColor(.gray)
                        .padding()
                } else {
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
                }
            }
            .padding(.horizontal)
        }
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

// MARK: - Match Player Stats View
struct MatchPlayerStatsView: View {
    let teamStats: [TeamPlayersStatistics]
    @State private var selectedPosition: String?
    
    private let positions = ["G", "D", "M", "F"]
    
    var body: some View {
        VStack(spacing: 24) {
            if teamStats.isEmpty {
                Text("선수 통계 정보가 없습니다")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                // 포지션 필터
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        FilterButton(
                            title: "전체",
                            isSelected: selectedPosition == nil,
                            action: { selectedPosition = nil }
                        )
                        
                        ForEach(positions, id: \.self) { position in
                            FilterButton(
                                title: getPositionName(position),
                                isSelected: selectedPosition == position,
                                action: { selectedPosition = position }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                
                ForEach(teamStats, id: \.team.id) { teamStat in
                    VStack(spacing: 16) {
                        // 팀 정보
                        HStack {
                            AsyncImage(url: URL(string: teamStat.team.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 30, height: 30)
                            
                            Text(teamStat.team.name)
                                .font(.headline)
                            
                            Spacer()
                        }
                        
                        // 선수 통계
                        let filteredPlayers = filterPlayers(teamStat.players)
                        ForEach(filteredPlayers) { player in
                            PlayerStatRow(
                                player: player.player,
                                stats: player.statistics.first ?? PlayerMatchStats(
                                    games: PlayerGameStats(
                                        minutes: 0,
                                        number: nil,
                                        position: nil,
                                        rating: "0.0",
                                        captain: false,
                                        substitute: true
                                    ),
                                    offsides: nil,
                                    shots: nil,
                                    goals: nil,
                                    passes: nil,
                                    tackles: nil,
                                    duels: nil,
                                    dribbles: nil,
                                    fouls: nil,
                                    cards: nil
                                )
                            )
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
    
    private func filterPlayers(_ players: [FixturePlayerStats]) -> [FixturePlayerStats] {
        // 유효한 통계가 있는 선수만 필터링
        let validPlayers = players.filter { player in
            // 선수의 첫 번째 통계 데이터 사용
            guard let stats = player.statistics.first else { return false }
            
            // 포지션이 있고 선수 번호가 있는 경우 표시
            guard let position = stats.games.position,
                  stats.games.number != nil else {
                return false
            }
            
            // 포지션 필터가 선택된 경우
            if let selectedPos = selectedPosition {
                return position.starts(with: selectedPos)
            }
            
            return true
        }
        
        // 선발/교체 여부와 선수 번호로 정렬
        return validPlayers.sorted { player1, player2 in
            let stats1 = player1.statistics.first!
            let stats2 = player2.statistics.first!
            
            // 선발 선수를 먼저 표시
            if (stats1.games.substitute ?? true) != (stats2.games.substitute ?? true) {
                return !(stats1.games.substitute ?? true)
            }
            
            // 같은 그룹 내에서는 선수 번호로 정렬
            return (stats1.games.number ?? 99) < (stats2.games.number ?? 99)
        }
    }
    
    private func getPositionName(_ position: String) -> String {
        switch position {
        case "G": return "골키퍼"
        case "D": return "수비수"
        case "M": return "미드필더"
        case "F": return "공격수"
        default: return position
        }
    }
}

struct PlayerStatRow: View {
    let player: PlayerInfo
    let stats: PlayerMatchStats
    @State private var isExpanded = false
    
    var body: some View {
        VStack(spacing: 8) {
            Button(action: { isExpanded.toggle() }) {
                HStack {
                    AsyncImage(url: URL(string: player.photo ?? "")) { image in
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
                        Text(player.name)
                            .font(.callout)
                        
                        HStack(spacing: 4) {
                            if let position = stats.games.position {
                                Text(position)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            if stats.games.substitute ?? false {
                                Text("(교체)")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // 평점이 있는 경우에만 표시
                    if let rating = stats.games.rating,
                       let ratingValue = Double(rating),
                       ratingValue > 0 {
                        Text(String(format: "%.1f", ratingValue))
                            .font(.headline)
                            .foregroundColor(.blue)
                    }
                    
                    Image(systemName: "chevron.right")
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                        .foregroundColor(.gray)
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            if isExpanded {
                VStack(spacing: 12) {
                    // 기본 정보
                    HStack(spacing: 20) {
                        StatItem(title: "출전 시간", value: "\(stats.games.minutes ?? 0)'")
                        if let number = stats.games.number {
                            StatItem(title: "등번호", value: "\(number)")
                        }
                        if stats.games.captain == true {
                            StatItem(title: "주장", value: "○")
                        }
                    }
                    
                    // 공격 지표
                    if let shots = stats.shots, let goals = stats.goals {
                        HStack(spacing: 20) {
                            StatItem(title: "슈팅", value: "\(shots.total ?? 0)")
                            StatItem(title: "유효슈팅", value: "\(shots.on ?? 0)")
                            StatItem(title: "득점", value: "\(goals.total ?? 0)")
                            if let assists = goals.assists {
                                StatItem(title: "도움", value: "\(assists)")
                            }
                        }
                    }
                    
                    // 패스
                    if let passes = stats.passes {
                        HStack(spacing: 20) {
                            StatItem(title: "패스 시도", value: "\(passes.total ?? 0)")
                            StatItem(title: "성공률", value: "\(passes.accuracy ?? "0")%")
                            StatItem(title: "키패스", value: "\(passes.key ?? 0)")
                        }
                    }
                    
                    // 수비 지표
                    if let tackles = stats.tackles {
                        HStack(spacing: 20) {
                            StatItem(title: "태클", value: "\(tackles.total ?? 0)")
                            StatItem(title: "차단", value: "\(tackles.blocks ?? 0)")
                            StatItem(title: "인터셉트", value: "\(tackles.interceptions ?? 0)")
                        }
                    }
                    
                    // 기타 지표
                    HStack(spacing: 20) {
                        if let duels = stats.duels {
                            StatItem(title: "듀얼 성공", value: "\(duels.won ?? 0)/\(duels.total ?? 0)")
                        }
                        if let dribbles = stats.dribbles {
                            StatItem(title: "드리블 성공", value: "\(dribbles.success ?? 0)/\(dribbles.attempts ?? 0)")
                        }
                        if let fouls = stats.fouls {
                            StatItem(title: "파울", value: "\(fouls.committed ?? 0)")
                            StatItem(title: "피파울", value: "\(fouls.drawn ?? 0)")
                        }
                    }
                }
                .font(.caption)
                .padding(.top, 8)
            }
        }
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .animation(.easeInOut, value: isExpanded)
    }
}

struct StatItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .foregroundColor(.gray)
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Lineups View
struct LineupsView: View {
    let lineups: [TeamLineup]
    let topPlayers: [PlayerStats]
    @State private var selectedTeamIndex = 0
    @State private var showingFormation = true
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if lineups.isEmpty {
                    Text("라인업 정보가 없습니다")
                        .foregroundColor(.gray)
                        .padding()
                } else {
                    // 팀 선택 슬라이더
                    HStack(spacing: 0) {
                        ForEach(lineups.indices, id: \.self) { index in
                            Button(action: {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    selectedTeamIndex = index
                                }
                            }) {
                                HStack(spacing: 12) {
                                    AsyncImage(url: URL(string: lineups[index].team.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .saturation(selectedTeamIndex == index ? 1.0 : 0.7)
                                    } placeholder: {
                                        Image(systemName: "sportscourt.fill")
                                            .foregroundColor(.gray)
                                    }
                                    .frame(width: 32, height: 32)
                                    
                                    Text(lineups[index].team.name)
                                        .font(.system(.callout, design: .rounded))
                                        .fontWeight(selectedTeamIndex == index ? .semibold : .regular)
                                        .foregroundColor(selectedTeamIndex == index ? .primary : .secondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(selectedTeamIndex == index ? Color.blue.opacity(0.1) : Color.clear)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(selectedTeamIndex == index ? Color.blue.opacity(0.3) : Color.clear, lineWidth: 1)
                                )
                            }
                            .buttonStyle(PlainButtonStyle())
                            
                            if index == 0 {
                                Divider()
                                    .padding(.vertical, 8)
                            }
                        }
                    }
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    .padding(.horizontal)
                    
                    let lineup = lineups[selectedTeamIndex]
                    
                    // 포메이션 정보
                    VStack(spacing: 12) {
                        HStack {
                            Text("포메이션")
                                .font(.headline)
                            
                            Text(lineup.formation)
                                .font(.title2.bold())
                                .foregroundColor(.blue)
                            
                            Spacer()
                            
                            Button(action: { showingFormation.toggle() }) {
                                Image(systemName: "arrow.left.and.right.square")
                                    .imageScale(.large)
                                    .foregroundColor(.blue)
                                    .rotationEffect(.degrees(showingFormation ? 180 : 0))
                            }
                        }
                        .padding(.horizontal)
                        
                        if showingFormation {
                            FormationView(lineup: lineup)
                                .frame(height: 400)
                                .padding(.vertical)
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                    
                    // 선발 선수
                    VStack(alignment: .leading, spacing: 16) {
                        Text("선발 라인업")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(spacing: 12) {
                                ForEach(lineup.startXI) { player in
                                    PlayerCard(
                                        number: player.number,
                                        name: player.name,
                                        position: player.pos ?? "",
                                        isStarter: true
                                    )
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                    
                    // 교체 선수
                    VStack(alignment: .leading, spacing: 16) {
                        Text("교체 선수")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(spacing: 12) {
                                ForEach(lineup.substitutes) { player in
                                    PlayerCard(
                                        number: player.number,
                                        name: player.name,
                                        position: player.pos ?? "",
                                        isStarter: false
                                    )
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                    
                    // 최고 평점 선수
                    if !topPlayers.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("최고 평점 선수")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                LazyHStack(spacing: 12) {
                                    ForEach(topPlayers.prefix(5), id: \.player.id) { playerStat in
                                        if let stats = playerStat.statistics.first,
                                           let rating = stats.games.rating {
                                            TopPlayerCard(
                                                player: playerStat.player,
                                                team: stats.team,
                                                rating: rating
                                            )
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                    }
                }
            }
            .padding(.vertical)
        }
    }
}

struct FormationView: View {
    let lineup: TeamLineup
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 축구장 배경
                Color(.systemGray6)
                    .overlay(
                        VStack(spacing: 0) {
                            // 필드 라인
                            Rectangle()
                                .stroke(Color.white, lineWidth: 1)
                                .overlay(
                                    VStack(spacing: 0) {
                                        // 센터 서클
                                        Circle()
                                            .stroke(Color.white, lineWidth: 1)
                                            .frame(width: 80)
                                            .position(x: geometry.size.width/2, y: geometry.size.height/2)
                                        
                                        // 페널티 에어리어
                                        ForEach([0.2, 0.8], id: \.self) { y in
                                            Rectangle()
                                                .stroke(Color.white, lineWidth: 1)
                                                .frame(width: geometry.size.width * 0.4, height: geometry.size.height * 0.2)
                                                .position(x: geometry.size.width/2, y: geometry.size.height * y)
                                        }
                                    }
                                )
                        }
                    )
                
                // 포메이션 라인
                ForEach(0..<lineup.formationArray.count, id: \.self) { row in
                    let yPosition = CGFloat(row + 1) * geometry.size.height / CGFloat(lineup.formationArray.count + 1)
                    HStack(spacing: 0) {
                        ForEach(0..<lineup.formationArray[row], id: \.self) { _ in
                            Rectangle()
                                .stroke(Color.white.opacity(0.3), lineWidth: 1)
                                .frame(width: geometry.size.width / CGFloat(lineup.formationArray[row] + 1),
                                       height: geometry.size.height / CGFloat(lineup.formationArray.count + 1))
                        }
                    }
                    .position(x: geometry.size.width / 2, y: yPosition)
                }
                
                // 선수 배치
                ForEach(lineup.startXI) { player in
                    if let gridPosition = player.gridPosition {
                        PlayerDot(
                            number: player.number,
                            name: player.name,
                            position: player.pos ?? "",
                            stats: lineup.playersByPosition[player.pos ?? ""]?.count ?? 0
                        )
                        .position(
                            x: CGFloat(gridPosition.x) * geometry.size.width / 5,
                            y: CGFloat(gridPosition.y) * geometry.size.height / 6
                        )
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .padding()
    }
}

struct PlayerDot: View {
    let number: Int
    let name: String
    let position: String
    let stats: Int
    @State private var isShowingDetails = false
    @State private var isPressed = false
    
    var body: some View {
        Button(action: { withAnimation(.spring()) { isShowingDetails.toggle() } }) {
            ZStack {
                // 배경 서클
                Circle()
                    .fill(Color.white)
                    .frame(width: 36, height: 36)
                    .shadow(color: Color.black.opacity(0.1), radius: isPressed ? 2 : 4,
                           x: 0, y: isPressed ? 1 : 2)
                
                // 내부 서클
                Circle()
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [.blue.opacity(0.3), .blue.opacity(0.1)]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 34, height: 34)
                
                // 선수 번호
                Text("\(number)")
                    .font(.system(.callout, design: .rounded).weight(.bold))
                    .foregroundColor(.blue)
            }
            .scaleEffect(isPressed ? 0.95 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
        .overlay {
            if isShowingDetails {
                VStack(spacing: 4) {
                    Text(name)
                        .font(.system(.callout, design: .rounded).weight(.semibold))
                    
                    HStack(spacing: 8) {
                        Text(position)
                            .font(.system(.caption, design: .rounded))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(4)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 8)
                .offset(y: -50)
                .transition(.scale.combined(with: .opacity))
            }
        }
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - Player Cards
struct PlayerCard: View {
    let number: Int
    let name: String
    let position: String
    let isStarter: Bool
    @State private var isPressed = false
    
    var body: some View {
        VStack(spacing: 16) {
            // 선수 번호
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                isStarter ? Color.blue.opacity(0.15) : Color.gray.opacity(0.15),
                                isStarter ? Color.blue.opacity(0.05) : Color.gray.opacity(0.05)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 60, height: 60)
                    .shadow(
                        color: isStarter ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1),
                        radius: isPressed ? 4 : 8,
                        y: isPressed ? 1 : 2
                    )
                
                Text("\(number)")
                    .font(.system(.title2, design: .rounded).weight(.bold))
                    .foregroundColor(isStarter ? .blue : .gray)
            }
            
            VStack(spacing: 6) {
                // 선수 이름
                Text(name)
                    .font(.system(.callout, design: .rounded))
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(height: 40)
                
                // 포지션
                Text(position)
                    .font(.system(.caption, design: .rounded))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        isStarter ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1)
                    )
                    .cornerRadius(8)
            }
        }
        .frame(width: 120)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(
            color: Color.black.opacity(0.05),
            radius: isPressed ? 4 : 8,
            y: isPressed ? 1 : 2
        )
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct TopPlayerCard: View {
    let player: PlayerInfo
    let team: Team
    let rating: String
    @State private var isPressed = false
    
    var body: some View {
        VStack(spacing: 12) {
            // 선수 사진
            AsyncImage(url: URL(string: player.photo ?? "")) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "person.circle")
                    .foregroundColor(.gray)
            }
            .frame(width: 60, height: 60)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(Color.blue, lineWidth: 2)
            )
            .shadow(
                color: Color.blue.opacity(0.1),
                radius: isPressed ? 4 : 8,
                y: isPressed ? 1 : 2
            )
            
            VStack(spacing: 6) {
                // 선수 이름
                Text(player.name)
                    .font(.system(.callout, design: .rounded))
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                
                // 팀 로고
                AsyncImage(url: URL(string: team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(width: 24, height: 24)
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .foregroundColor(.gray)
                }
                
                // 평점
                Text(rating)
                    .font(.system(.title3, design: .rounded).weight(.bold))
                    .foregroundColor(.blue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
            }
        }
        .frame(width: 120)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(
            color: Color.black.opacity(0.05),
            radius: isPressed ? 4 : 8,
            y: isPressed ? 1 : 2
        )
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}