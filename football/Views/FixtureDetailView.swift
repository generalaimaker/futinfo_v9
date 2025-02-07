import SwiftUI

struct FixtureDetailView: View {
    let fixture: Fixture
    @StateObject private var viewModel: FixtureDetailViewModel
    @State private var selectedTab = 0 // 0: 이벤트, 1: 통계, 2: 라인업, 3: 선수 통계
    
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
                    Text("선수 통계").tag(3)
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                
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
                    } else {
                        MatchPlayerStatsView(teamStats: viewModel.matchPlayerStats)
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
    let fixture: Fixture
    let selectedTeamId: Int?
    let selectedPlayerId: Int?
    let onTeamFilter: (Int?) -> Void
    let onPlayerFilter: (Int?) -> Void
    
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
                LazyVStack(spacing: 16) {
                    ForEach(events) { event in
                        EventRow(
                            event: event,
                            isSelected: event.player.id == selectedPlayerId,
                            onTap: { onPlayerFilter(event.player.id) }
                        )
                    }
                }
            }
        }
        .padding(.horizontal)
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
    
    var body: some View {
        VStack(spacing: 16) {
            // 통계 타입 필터
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    FilterButton(
                        title: "전체",
                        isSelected: selectedType == nil,
                        action: { onTypeFilter(nil) }
                    )
                    
                    ForEach([
                        StatisticType.ballPossession,
                        .shotsOnGoal,
                        .totalShots,
                        .saves,
                        .cornerKicks,
                        .fouls
                    ], id: \.rawValue) { type in
                        FilterButton(
                            title: type.rawValue,
                            isSelected: selectedType == type,
                            action: { onTypeFilter(type) }
                        )
                    }
                }
                .padding(.horizontal)
            }
            
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
                            if let stats = player.statistics.first {
                                PlayerStatRow(player: player.player, stats: stats)
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
    
    private func filterPlayers(_ players: [FixturePlayerStats]) -> [FixturePlayerStats] {
        guard let position = selectedPosition else { return players }
        return players.filter { player in
            player.statistics.first?.games.position?.starts(with: position) ?? false
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
                    AsyncImage(url: URL(string: player.photo)) { image in
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
                        
                        if let position = stats.games.position {
                            Text(position)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    Spacer()
                    
                    if let rating = stats.games.rating {
                        Text(rating)
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
                            StatItem(title: "성공률", value: "\(passes.accuracy ?? 0)%")
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