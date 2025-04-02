import SwiftUI

struct MatchHeaderView: View {
    let fixture: Fixture
    let viewModel: FixtureDetailViewModel
    let service = FootballAPIService.shared
    // 경기 목록에서 사용하는 ViewModel 추가
    let fixturesViewModel = FixturesOverviewViewModel()
    
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
                HStack(spacing: 8) {
                    CachedImageView(
                        url: URL(string: fixture.league.logo),
                        placeholder: Image(systemName: "trophy.fill"),
                        failureImage: Image(systemName: "trophy.fill"),
                        contentMode: .fit
                    )
                    .frame(width: 24, height: 24)
                    
                    // 리그 이름과 라운드 정보 표시
                    if viewModel.isTournamentMatch(fixture.league.round) {
                        // 토너먼트 경기인 경우 라운드 정보만 표시
                        Text(fixture.league.name)
                            .font(.system(.subheadline, design: .rounded))
                            .fontWeight(.medium)
                    } else {
                        // 일반 리그 경기인 경우 리그 이름과 라운드 정보 함께 표시
                        HStack(spacing: 4) {
                            Text(fixture.league.name)
                                .font(.system(.subheadline, design: .rounded))
                                .fontWeight(.medium)
                            
                            Text("-")
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundColor(.secondary)
                            
                            Text("\(fixture.league.round)")
                                .font(.system(.subheadline, design: .rounded))
                                .foregroundColor(.secondary)
                        }
                    }
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
                TeamInfoView(team: fixture.teams.home, isWinner: fixture.teams.home.winner == true, fixture: fixture, viewModel: viewModel)
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
                            VStack(spacing: 4) {
                                // 정규 시간 스코어
                                HStack(spacing: 8) {
                                    Text("\(fixture.goals?.home ?? 0)")
                                        .frame(width: 28, alignment: .trailing)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.8)
                                    Text("-")
                                    Text("\(fixture.goals?.away ?? 0)")
                                        .frame(width: 28, alignment: .leading)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.8)
                                }
                                .font(.system(size: 44, weight: .bold, design: .rounded))
                                
                                // 합산 스코어 및 승부차기 결과 표시
                                VStack(spacing: 4) {
                                    // 합산 스코어 표시 개선 - 경기 목록에서 사용하는 방식 그대로 사용
                                    Group {
                                        if let fixture = viewModel.currentFixture, [2, 3].contains(fixture.league.id) {
                                            HStack(spacing: 8) {
                                                Text("합산")
                                                    .font(.system(.caption, design: .rounded))
                                                    .foregroundColor(.gray)
                                                
                                                // 경기 목록에서 사용하는 ViewModel 사용
                                                AggregateScoreView(fixture: fixture, fixturesViewModel: fixturesViewModel)
                                            }
                                            .padding(.vertical, 4)
                                        }
                                    }
                                    
                                    // 승부차기 결과 (있는 경우)
                                    if fixture.fixture.status.short == "PEN" {
                                        HStack(spacing: 8) {
                                            Text("승부차기")
                                                .font(.system(.caption, design: .rounded))
                                                .foregroundColor(.gray)
                                            
                                            // 임시 데이터 (실제로는 API에서 가져와야 함)
                                            let penaltyHome = 5
                                            let penaltyAway = 4
                                            
                                            Text("\(penaltyHome) - \(penaltyAway)")
                                                .font(.system(.caption, design: .rounded))
                                                .fontWeight(.bold)
                                                .foregroundColor(.red)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 2)
                                                .background(Color.red.opacity(0.1))
                                                .cornerRadius(4)
                                        }
                                    }
                                }
                            }
                            
                            // 경기 상태 표시 개선
                            if ["AET", "PEN"].contains(fixture.fixture.status.short) {
                                // 연장 종료 또는 승부차기 종료 표시
                                Text(fixture.fixture.status.short == "AET" ? "연장 종료" : "승부차기 종료")
                                    .font(.system(.callout, design: .rounded))
                                    .fontWeight(.medium)
                                    .foregroundColor(fixture.fixture.status.short == "AET" ? .orange : .red)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(
                                        (fixture.fixture.status.short == "AET" ? Color.orange : Color.red)
                                            .opacity(0.1)
                                    )
                                    .clipShape(Capsule())
                            }
                            
                            // 득점자 정보는 각 팀 영역에 표시하므로 여기서는 표시하지 않음
                        }
                        .frame(width: 120)
                        .padding(.vertical, 12)
                    }
                }
                .background(Color(.systemBackground))
                
                // 원정팀
                TeamInfoView(team: fixture.teams.away, isWinner: fixture.teams.away.winner == true, fixture: fixture, viewModel: viewModel)
                    .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 20)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 8, y: 2)
            
            // 경기 정보 섹션 제거
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }
}

// 득점자 정보를 표시하는 별도의 뷰
struct GoalScorersView: View {
    let sortedGoals: [FixtureEvent]
    let team: Team
    let fixture: Fixture
    
    var body: some View {
        goalScorersContent
    }
    
    // 조건부 로직을 별도의 계산 속성으로 분리
    @ViewBuilder
    private var goalScorersContent: some View {
        if !sortedGoals.isEmpty {
            // 실제 득점자 데이터가 있는 경우
            ForEach(sortedGoals.prefix(3), id: \.id) { event in
                goalEventRow(for: event)
            }
        } else if (team.id == fixture.teams.home.id && (fixture.goals?.home ?? 0) > 0) ||
                  (team.id == fixture.teams.away.id && (fixture.goals?.away ?? 0) > 0) {
            // 득점은 있지만 이벤트 데이터가 없는 경우에는 "득점자 정보 없음" 메시지 표시
            Text("득점자 정보 로드 중...")
                .font(.system(.caption2, design: .rounded))
                .foregroundColor(.secondary)
        } else {
            // 득점이 없는 경우 빈 뷰 반환
            EmptyView()
        }
    }
    
    // 각 골 이벤트에 대한 행을 생성하는 함수
    @ViewBuilder
    private func goalEventRow(for event: FixtureEvent) -> some View {
        HStack(spacing: 4) {
            // 자책골인 경우 다른 아이콘 사용
            if event.detail.lowercased().contains("own") {
                Text("🔄⚽️")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(event.time.elapsed)' (자책골)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else if event.detail.lowercased().contains("penalty") {
                Text("🎯")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(event.time.elapsed)' (페널티)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else {
                Text("⚽️")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(event.time.elapsed)'")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            }
        }
        .transition(.opacity.combined(with: .scale))
    }
}

// 더미 득점자 정보를 표시하는 별도의 뷰
struct DummyGoalScorersView: View {
    let team: Team
    let fixture: Fixture
    
    var body: some View {
        dummyGoalScorersContent
    }
    
    // 조건부 로직을 별도의 계산 속성으로 분리
    @ViewBuilder
    private var dummyGoalScorersContent: some View {
        // 득점이 있는 경우에만 더미 데이터 표시
        if let goals = generateDummyGoals(), !goals.isEmpty {
            ForEach(goals, id: \.id) { goal in
                goalRow(for: goal)
            }
        } else {
            // 득점이 없는 경우 빈 뷰 반환
            EmptyView()
        }
    }
    
    // 각 골에 대한 행을 생성하는 함수
    @ViewBuilder
    private func goalRow(for goal: FixtureEvent) -> some View {
        HStack(spacing: 4) {
            Text("⚽️")
                .font(.caption2)
            Text("\(goal.player.name ?? "알 수 없음") \(goal.time.elapsed)'")
                .font(.system(.caption2, design: .rounded))
                .foregroundColor(.secondary)
        }
        .transition(.opacity.combined(with: .scale))
    }
    
    // 더미 득점자 데이터 생성 함수
    private func generateDummyGoals() -> [FixtureEvent]? {
        // 팀의 득점 수 확인
        let goalCount = team.id == fixture.teams.home.id ? fixture.goals?.home ?? 0 : fixture.goals?.away ?? 0
        
        // 득점이 없으면 nil 반환
        if goalCount <= 0 {
            return nil
        }
        
        var goals: [FixtureEvent] = []
        
        // 득점자 이름 목록 (실제 선수 이름 사용)
        let scorerNames: [String] = team.id == fixture.teams.home.id ? 
            ["손흥민", "해리 케인", "김민재", "이강인"] : 
            ["메시", "음바페", "호날두", "네이마르"]
        
        // 득점 시간 (실제 경기 시간 내에서 분배)
        let totalMinutes = 90
        let minutesPerGoal = totalMinutes / max(1, goalCount)
        
        // 각 골에 대한 더미 이벤트 생성
        for i in 0..<goalCount {
            // 득점 시간 계산 (균등하게 분배)
            let baseTime = (i + 1) * minutesPerGoal
            // 약간의 랜덤성 추가 (-5분 ~ +5분)
            let randomOffset = Int.random(in: -5...5)
            let goalTime = min(90, max(1, baseTime + randomOffset))
            
            // 득점자 선택 (랜덤)
            let scorerIndex = i % scorerNames.count
            let scorerName = scorerNames[scorerIndex]
            
            // 더미 이벤트 생성 (id는 계산 속성으로 자동 생성됨)
            let event = FixtureEvent(
                time: EventTime(elapsed: goalTime, extra: nil),
                team: team,
                player: EventPlayer(id: 1000 + i, name: scorerName),
                assist: EventPlayer(id: 2000 + i, name: nil),
                type: "Goal",
                detail: "Normal Goal",
                comments: nil
            )
            
            goals.append(event)
        }
        
        // 득점 시간 순으로 정렬
        return goals.sorted { $0.time.elapsed < $1.time.elapsed }
    }
}
// 합산 스코어 표시를 위한 뷰
struct AggregateScoreView: View {
    let fixture: Fixture
    let fixturesViewModel: FixturesOverviewViewModel
    @State private var aggregateScore: (home: Int, away: Int)? = nil
    
    var body: some View {
        aggregateScoreContent
            .onAppear {
                loadAggregateScore()
            }
    }
    
    // 조건부 로직을 별도의 계산 속성으로 분리
    @ViewBuilder
    private var aggregateScoreContent: some View {
        if let score = aggregateScore {
            Text("\(score.home) - \(score.away)")
                .font(.system(.subheadline, design: .rounded))
                .fontWeight(.bold)
                .foregroundColor(.blue)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(4)
        } else {
            Text("계산 중...")
                .font(.system(.caption, design: .rounded))
                .foregroundColor(.gray)
        }
    }
    
    private func loadAggregateScore() {
        Task {
            if let score = await fixturesViewModel.calculateAggregateScore(fixture: fixture) {
                await MainActor.run {
                    self.aggregateScore = score
                    print("🏆 AggregateScoreView - 합산 결과 계산 완료: \(score.home)-\(score.away)")
                }
            }
        }
    }
}

struct TeamInfoView: View {
    let team: Team
    let isWinner: Bool
    let fixture: Fixture
    let viewModel: FixtureDetailViewModel
    
    var body: some View {
        NavigationLink(destination: TeamProfileView(teamId: team.id, leagueId: fixture.league.id)) {
            VStack(spacing: 12) {
                // 팀 로고
                teamLogoView
                
                // 팀 이름 및 승리 표시
                teamNameView
                
                // 득점자 정보 표시
                goalScorersContainerView
                    .padding(.top, 4)
                    .animation(.easeInOut(duration: 0.3), value: viewModel.events.count)
                    .animation(.easeInOut(duration: 0.3), value: viewModel.isLoadingEvents)
                    .onAppear {
                        Task {
                            await loadEventData()
                        }
                    }
                    .onChange(of: viewModel.isLoadingEvents) { oldValue, newValue in
                        print("🔄 isLoadingEvents 변경 감지: \(newValue)")
                    }
                    .onChange(of: viewModel.events.count) { oldValue, newValue in
                        print("🔄 events 변경 감지: \(newValue)개")
                    }
            }
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle()) // 기본 버튼 스타일 제거
    }
    
    // 팀 로고 뷰
    private var teamLogoView: some View {
        ZStack {
            // 승리 표시 (로고 상단에 배치)
            if isWinner {
                VStack(spacing: 2) {
                    Label("승리", systemImage: "checkmark.circle.fill")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.blue)
                        .imageScale(.small)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(10)
                        .offset(y: -20)
                    
                    Spacer()
                }
                .frame(height: 100)
                .frame(maxWidth: .infinity, alignment: .center)
                .zIndex(2)
            }
            
            // 팀 로고
            Circle()
                .fill(Color(.systemBackground))
                .frame(width: 80, height: 80)
                .shadow(color: isWinner ? Color.blue.opacity(0.2) : Color.black.opacity(0.05),
                       radius: isWinner ? 12 : 8)
                .zIndex(0)
            
            CachedImageView(
                url: URL(string: team.logo),
                placeholder: Image(systemName: "sportscourt.fill"),
                failureImage: Image(systemName: "sportscourt.fill"),
                contentMode: .fit
            )
            .saturation(isWinner ? 1.0 : 0.8)
            .frame(width: 60, height: 60)
            .zIndex(1)
            
            if isWinner {
                Circle()
                    .strokeBorder(Color.blue.opacity(0.3), lineWidth: 3)
                    .frame(width: 80, height: 80)
                    .zIndex(1)
            }
        }
    }
    
    // 팀 이름 표시 뷰
    private var teamNameView: some View {
        VStack(spacing: 6) {
            // 팀 이름
            Text(team.name)
                .font(.system(.callout, design: .rounded))
                .fontWeight(isWinner ? .semibold : .medium)
                .foregroundColor(isWinner ? .primary : .secondary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(maxWidth: 130)
        }
    }
    
    // 득점자 정보 컨테이너 뷰
    @ViewBuilder
    private var goalScorersContainerView: some View {
        VStack(alignment: .center, spacing: 4) {
            if hasGoals {
                goalScorersContentView
            }
        }
    }
    
    // 득점이 있는지 확인하는 계산 속성
    private var hasGoals: Bool {
        return (team.id == fixture.teams.home.id && (fixture.goals?.home ?? 0) > 0) ||
               (team.id == fixture.teams.away.id && (fixture.goals?.away ?? 0) > 0)
    }
    
    // 득점자 정보 내용 뷰
    @ViewBuilder
    private var goalScorersContentView: some View {
        if viewModel.isLoadingEvents {
            loadingView
        } else if !filteredTeamGoals.isEmpty {
            // 득점자 정보가 있는 경우
            goalScorersView
        } else if hasGoals {
            // 득점은 있지만 이벤트 데이터가 없는 경우 로딩 시도
            VStack {
                Text("득점자 정보 로드 중...")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
                    .onAppear {
                        // 득점자 정보 다시 로드 시도
                        Task {
                            await loadEventData()
                        }
                    }
            }
        } else {
            // 득점이 없는 경우 빈 뷰
            EmptyView()
        }
    }
    
    // 로딩 뷰
    private var loadingView: some View {
        HStack(spacing: 4) {
            ProgressView()
                .scaleEffect(0.7)
            Text("득점자 정보 로딩 중...")
                .font(.system(.caption2, design: .rounded))
                .foregroundColor(.secondary)
        }
        .transition(.opacity.combined(with: .scale))
    }
    
    // 득점자 정보 뷰
    private var goalScorersView: some View {
        // 득점 시간 순으로 정렬
        let sortedGoals = filteredTeamGoals.sorted { $0.time.elapsed < $1.time.elapsed }
        
        print("🔍 \(team.name)의 정렬된 골 이벤트 수: \(sortedGoals.count)")
        
        // 득점자 정보 직접 표시
        return VStack(spacing: 4) {
            if !sortedGoals.isEmpty {
                // 실제 득점자 데이터가 있는 경우
                ForEach(sortedGoals.prefix(3), id: \.id) { event in
                    goalEventRow(for: event)
                }
            } else if hasGoals {
                // 득점은 있지만 이벤트 데이터가 없는 경우
                Text("득점자 정보 로드 중...")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            }
        }
        .onAppear {
            // 디버그 로그 추가 - 득점자 정보 확인
            logGoalEvents(filteredTeamGoals)
        }
    }
    
    // 각 골 이벤트에 대한 행을 생성하는 함수
    @ViewBuilder
    private func goalEventRow(for event: FixtureEvent) -> some View {
        HStack(spacing: 4) {
            // 자책골인 경우 다른 아이콘 사용
            if event.detail.lowercased().contains("own") {
                Text("🔄⚽️")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(event.time.elapsed)' (자책골)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else if event.detail.lowercased().contains("penalty") {
                Text("🎯")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(event.time.elapsed)' (페널티)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else {
                Text("⚽️")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(event.time.elapsed)'")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            }
        }
        .transition(.opacity.combined(with: .scale))
    }
    
    // 팀의 득점 이벤트 필터링
    private var filteredTeamGoals: [FixtureEvent] {
        // 이벤트 데이터가 비어있는지 확인
        if viewModel.events.isEmpty {
            print("⚠️ 이벤트 데이터가 비어있습니다.")
            return []
        }
        
        // 골 이벤트만 필터링
        let goalEvents = viewModel.events.filter { $0.type.lowercased() == "goal" }
        print("⚽️ 전체 골 이벤트 수: \(goalEvents.count)")
        
        // 현재 팀의 골 이벤트 필터링
        let teamGoals = goalEvents.filter { event in
            // 일반 골: 현재 팀이 득점한 경우
            let isNormalGoal = event.team.id == team.id && !event.detail.lowercased().contains("own")
            
            // 자책골: 상대 팀이 자책골을 넣은 경우
            let isOwnGoal = event.team.id != team.id && event.detail.lowercased().contains("own")
            
            return isNormalGoal || isOwnGoal
        }
        
        print("⚽️ 팀 \(team.name)의 골 이벤트 수: \(teamGoals.count)")
        for goal in teamGoals {
            print("  - 득점자: \(goal.player.name ?? "알 수 없음"), 시간: \(goal.time.elapsed)분, 상세: \(goal.detail)")
        }
        
        return teamGoals
    }
    
    // 골 이벤트 생성 헬퍼 함수
    private func createGoalEvent(name: String, minute: Int, detail: String = "Normal Goal") -> FixtureEvent {
        return FixtureEvent(
            time: EventTime(elapsed: minute, extra: nil),
            team: team,
            player: EventPlayer(id: Int.random(in: 1000...9999), name: name),
            assist: nil,
            type: "Goal",
            detail: detail,
            comments: nil
        )
    }
    
    // 득점자 정보 로깅
    private func logGoalEvents(_ teamGoals: [FixtureEvent]) {
        print("⚽️ 팀 \(team.name)의 골 이벤트 수: \(teamGoals.count)")
        for goal in teamGoals {
            print("  - 득점자: \(goal.player.name ?? "알 수 없음"), 시간: \(goal.time.elapsed)분, 상세: \(goal.detail)")
        }
    }
    
    // 이벤트 데이터 로드
    private func loadEventData() async {
        print("🔄 MatchHeaderView - 이벤트 데이터 로드 시작 - 팀: \(team.name)")
        
        // 항상 이벤트 데이터를 새로 로드하여 최신 데이터 사용
        await viewModel.loadEvents()
        
        // 골 이벤트 로깅
        let goalEvents = viewModel.events.filter { $0.type.lowercased() == "goal" }
        print("⚽️ 전체 골 이벤트 수: \(goalEvents.count)")
        
        // 팀별 골 이벤트 로깅
        let homeGoals = goalEvents.filter { $0.team.id == fixture.teams.home.id }
        let awayGoals = goalEvents.filter { $0.team.id == fixture.teams.away.id }
        print("⚽️ 홈팀(\(fixture.teams.home.name)) 골 이벤트 수: \(homeGoals.count)")
        print("⚽️ 원정팀(\(fixture.teams.away.name)) 골 이벤트 수: \(awayGoals.count)")
        
        // 현재 팀의 골 이벤트 필터링
        let teamGoals = goalEvents.filter { event in
            // 일반 골: 현재 팀이 득점한 경우
            let isNormalGoal = event.team.id == team.id && !event.detail.lowercased().contains("own")
            
            // 자책골: 상대 팀이 자책골을 넣은 경우
            let isOwnGoal = event.team.id != team.id && event.detail.lowercased().contains("own")
            
            return isNormalGoal || isOwnGoal
        }
        
        print("🔍 \(team.name)의 골 이벤트 수: \(teamGoals.count)")
        for goal in teamGoals {
            print("  - 득점자: \(goal.player.name ?? "알 수 없음"), 시간: \(goal.time.elapsed)분, 상세: \(goal.detail)")
        }
        
        // 이벤트 데이터 로드 후 UI 업데이트 강제
        await MainActor.run {
            print("🔄 UI 업데이트 강제 - 팀: \(team.name), 이벤트 수: \(viewModel.events.count)")
            viewModel.objectWillChange.send()
            
            // 추가 UI 업데이트 강제 (SwiftUI 뷰 갱신 보장)
            Task {
                try? await Task.sleep(nanoseconds: 100_000_000) // 0.1초 대기
                viewModel.objectWillChange.send()
            }
        }
    }
}
