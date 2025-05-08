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
                                    // 경기 상태가 NS일 경우 "-" 표시, 아닐 경우 스코어 표시 (nil이면 0)
                                    Text(fixture.fixture.status.short == "NS" ? "-" : "\(fixture.goals?.home ?? 0)")
                                        .frame(width: 28, alignment: .trailing)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.8)
                                    Text(":") // 구분자를 "-"에서 ":"로 변경
                                    Text(fixture.fixture.status.short == "NS" ? "-" : "\(fixture.goals?.away ?? 0)")
                                        .frame(width: 28, alignment: .leading)
                                        .lineLimit(1)
                                        .minimumScaleFactor(0.8)
                                }
                                .font(.system(size: 44, weight: .bold, design: .rounded))
                                
                                // 합산 스코어 및 승부차기 결과 표시
                                VStack(spacing: 4) {
                                    // 합산 스코어 표시 개선 - ViewModel의 aggregateScoreResult 사용
                                    Group {
                                        // ViewModel의 aggregateScoreResult 값이 있으면 표시
                                        if let aggregate = viewModel.aggregateScoreResult {
                                            HStack(spacing: 4) { // 간격 조정
                                                Text("합산")
                                                    .font(.system(.caption, design: .rounded))
                                                    .foregroundColor(.gray)
                                                Text("\(aggregate.home) - \(aggregate.away)") // 형식 변경
                                                    .font(.system(.caption, design: .rounded)) // 폰트 크기 조정
                                                    .fontWeight(.bold)
                                                    .foregroundColor(.blue)
                                                    .padding(.horizontal, 6) // 패딩 조정
                                                    .padding(.vertical, 3) // 패딩 조정
                                                    .background(Color.blue.opacity(0.1))
                                                    .cornerRadius(4)
                                            }
                                        }
                                        // aggregateScoreResult가 nil이고, 경기가 종료되었으며, 대상 리그인 경우 현재 스코어를 '합산'으로 표시
                                        else if let fixture = viewModel.currentFixture,
                                                ["FT", "AET", "PEN"].contains(fixture.fixture.status.short), // 경기 종료 확인
                                                [2, 3].contains(fixture.league.id) // 대상 리그 확인
                                        {
                                            HStack(spacing: 4) { // 간격 조정
                                                Text("합산")
                                                    .font(.system(.caption, design: .rounded))
                                                    .foregroundColor(.gray)
                                                // 현재 경기 스코어 표시
                                                Text("\(fixture.goals?.home ?? 0) - \(fixture.goals?.away ?? 0)")
                                                    .font(.system(.caption, design: .rounded)) // 폰트 크기 조정
                                                    .fontWeight(.bold)
                                                    .foregroundColor(.blue) // 스타일 통일
                                                    .padding(.horizontal, 6) // 패딩 조정
                                                    .padding(.vertical, 3) // 패딩 조정
                                                    .background(Color.blue.opacity(0.1)) // 스타일 통일
                                                    .cornerRadius(4)
                                            }
                                        }
                                        // 그 외의 경우 (예: 경기 전, 대상 리그 아님)는 아무것도 표시하지 않음
                                    }
                                    // .onAppear 제거: ViewModel에서 계산된 결과를 사용하므로 중복 호출 불필요

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
} // MatchHeaderView 닫는 중괄호 추가

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
            // 실제 득점자 데이터가 있는 경우 - 모든 득점자 표시 (prefix 제한 제거)
            ForEach(sortedGoals, id: \.id) { event in
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
            // 연장전 여부 확인
            let timeText = event.isExtraTime ? "\(event.time.elapsed)' (연장)" : "\(event.time.elapsed)'"
            
            // 자책골인 경우 다른 아이콘 사용
            if event.detail.lowercased().contains("own") {
                Text("🔄⚽️")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(timeText) (자책골)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else if event.detail.lowercased().contains("penalty") && !event.detail.lowercased().contains("won") && !event.detail.lowercased().contains("missed") {
                // 페널티로 득점한 경우 (페널티 획득만 한 경우와 놓친 경우 제외)
                Text("🎯")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(timeText) (페널티)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else {
                // 일반 골 (연장전 여부에 따라 다른 아이콘 사용)
                if event.isExtraTime {
                    Text("⚽️🕒")
                        .font(.caption2)
                } else {
                    Text("⚽️")
                        .font(.caption2)
                }
                Text("\(event.player.name ?? "알 수 없음") \(timeText)")
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

struct TeamInfoView: View {
    let team: Team
    let isWinner: Bool
    let fixture: Fixture
    let viewModel: FixtureDetailViewModel
    @State private var isPressed = false
    @State private var forceUpdate = false // 강제 업데이트를 위한 상태 변수
    
    var body: some View {
        VStack(spacing: 12) {
            VStack(spacing: 12) {
                // 팀 로고 - 직접 탭 제스처 추가
                teamLogoView
                    .overlay(
                        Text("팀 프로필")
                            .font(.system(.caption2, design: .rounded))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.8))
                            .cornerRadius(8)
                            .opacity(isPressed ? 1.0 : 0.0)
                    )
                    .scaleEffect(isPressed ? 1.05 : 1.0)
                    .onTapGesture {
                        withAnimation(.easeInOut(duration: 0.15)) {
                            isPressed = true
                        }
                        
                        // 0.15초 후 원래 상태로 복귀하고 팀 프로필로 이동
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                            withAnimation(.easeInOut(duration: 0.15)) {
                                isPressed = false
                            }
                            
                            // 팀 프로필로 이동 (NotificationCenter 사용)
                            print("🔄 TeamInfoView - 팀 프로필로 이동 요청: 팀 ID \(team.id), 리그 ID \(fixture.league.id)")
                            NotificationCenter.default.post(
                                name: NSNotification.Name("ShowTeamProfile"),
                                object: nil,
                                userInfo: ["teamId": team.id, "leagueId": fixture.league.id]
                            )
                            
                            // UI 업데이트 강제 (득점자 정보 표시를 위해)
                            viewModel.objectWillChange.send()
                        }
                    }
                
                // 팀 이름 및 승리 표시
                teamNameView
                    .onTapGesture {
                        // 팀 프로필로 이동 (NotificationCenter 사용)
                        print("🔄 TeamInfoView - 팀 이름 탭: 팀 ID \(team.id), 리그 ID \(fixture.league.id)")
                        NotificationCenter.default.post(
                            name: NSNotification.Name("ShowTeamProfile"),
                            object: nil,
                            userInfo: ["teamId": team.id, "leagueId": fixture.league.id]
                        )
                    }
            }
            
            // 득점자 정보 표시 - 별도의 VStack으로 분리
            goalScorersContainerView
                .padding(.top, 4)
                .animation(.easeInOut(duration: 0.3), value: viewModel.events.count)
                .animation(.easeInOut(duration: 0.3), value: viewModel.isLoadingEvents)
                .animation(.easeInOut(duration: 0.3), value: forceUpdate) // 강제 업데이트 애니메이션
                .onAppear {
                    // 이벤트 로드 완료 알림 관찰 설정
                    NotificationCenter.default.addObserver(forName: NSNotification.Name("EventsDidLoad"), object: nil, queue: .main) { _ in
                        print("📣 TeamInfoView - 이벤트 로드 완료 알림 수신")
                        // 강제 업데이트 트리거
                        forceUpdate.toggle()
                    }
                    
                    // 즉시 이벤트 데이터 로드 시도
                    Task {
                        print("🔄 TeamInfoView - 이벤트 데이터 로드 시도 시작")
                        await loadEventData()
                        
                        // 약간의 지연 후 다시 한번 UI 업데이트 시도
                        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
                        await MainActor.run {
                            viewModel.objectWillChange.send()
                            forceUpdate.toggle() // 강제 업데이트 트리거
                        }
                        
                        // 추가 지연 후 한 번 더 시도
                        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1초
                        await MainActor.run {
                            viewModel.objectWillChange.send()
                            forceUpdate.toggle() // 강제 업데이트 트리거
                        }
                        
                        // 최종 지연 후 한 번 더 시도
                        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2초
                        await MainActor.run {
                            viewModel.objectWillChange.send()
                            forceUpdate.toggle() // 강제 업데이트 트리거
                            print("✅ TeamInfoView - 최종 UI 업데이트 완료")
                        }
                    }
                }
                .onDisappear {
                    // 관찰자 제거
                    NotificationCenter.default.removeObserver(self, name: NSNotification.Name("EventsDidLoad"), object: nil)
                }
                .onChange(of: viewModel.isLoadingEvents) { oldValue, newValue in
                    print("🔄 isLoadingEvents 변경 감지: \(newValue)")
                    if !newValue && viewModel.events.count > 0 {
                        // 로딩이 완료되고 이벤트가 있으면 UI 업데이트 강제
                        viewModel.objectWillChange.send()
                    }
                }
                .onChange(of: viewModel.events.count) { oldValue, newValue in
                    print("🔄 events 변경 감지: \(newValue)개")
                    // UI 업데이트 강제
                    if newValue > 0 {
                        viewModel.objectWillChange.send()
                    }
                }
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
        // NavigationLink 제거 (NotificationCenter로 대체)
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
            
            // 탭 가능함을 나타내는 시각적 힌트
            Circle()
                .strokeBorder(Color.blue.opacity(isPressed ? 0.5 : 0.2), lineWidth: isPressed ? 3 : 1)
                .frame(width: 80, height: 80)
                .zIndex(1)
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
    
    // 득점이 있는지 확인하는 계산 속성
    private var hasGoals: Bool {
        return (team.id == fixture.teams.home.id && (fixture.goals?.home ?? 0) > 0) ||
        (team.id == fixture.teams.away.id && (fixture.goals?.away ?? 0) > 0)
    }
    
    // 팀의 득점 이벤트 필터링 (개선된 버전)
    private var filteredTeamGoals: [FixtureEvent] {
        // 이벤트 데이터가 비어있는지 확인
        if viewModel.events.isEmpty {
            return []
        }
        
        // 실제 득점된 골 이벤트만 필터링
        let goalEvents = viewModel.events.filter { event in
            // isActualGoal 속성 사용
            return event.isActualGoal
        }
        
        print("⚽️ 전체 골 이벤트 수: \(goalEvents.count)개")
        
        // 현재 팀의 골 이벤트 필터링 (자책골 로직 포함)
        let teamGoals = goalEvents.filter { event in
            // 일반 골: 현재 팀(self.team)이 득점한 경우
            let isNormalGoal = event.team.id == self.team.id && !event.detail.lowercased().contains("own")
            
            // 자책골: 상대 팀(event.team.id != self.team.id)이 자책골을 넣어서 현재 팀(self.team)이 득점한 경우
            let isOwnGoalForThisTeam = event.team.id != self.team.id && event.detail.lowercased().contains("own")
            
            return isNormalGoal || isOwnGoalForThisTeam
        }
        
        // 득점자 정보 로깅
        print("⚽️ 팀 \(team.name)의 골 이벤트 \(teamGoals.count)개")
        for (index, goal) in teamGoals.enumerated() {
            let timeInfo = goal.time.elapsed > 90 ? "\(goal.time.elapsed)' (연장)" : "\(goal.time.elapsed)'"
            print("  [\(index+1)] \(goal.player.name ?? "알 수 없음") - \(timeInfo) - \(goal.detail)")
        }
        
        // 연장전 득점자 확인 및 로깅
        let extraTimeGoals = teamGoals.filter { $0.isExtraTime }
        if !extraTimeGoals.isEmpty {
            print("⚽️🕒 팀 \(team.name)의 연장전 득점 이벤트 \(extraTimeGoals.count)개")
            for (index, goal) in extraTimeGoals.enumerated() {
                print("  [\(index+1)] \(goal.player.name ?? "알 수 없음") (\(goal.time.elapsed)' 연장) - \(goal.detail)")
            }
        }
        
        return teamGoals
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
        
        // 득점자 정보 직접 표시
        return VStack(spacing: 4) {
            if !sortedGoals.isEmpty {
                // 실제 득점자 데이터가 있는 경우 - 모든 득점자 표시 (prefix 제한 제거)
                ForEach(sortedGoals, id: \.id) { event in
                    goalEventRow(for: event)
                }
            } else if hasGoals {
                // 득점은 있지만 이벤트 데이터가 없는 경우
                Text("득점자 정보 로드 중...")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            }
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
    
    // 각 골 이벤트에 대한 행을 생성하는 함수 (개선된 버전)
    @ViewBuilder
    private func goalEventRow(for event: FixtureEvent) -> some View {
        HStack(spacing: 4) {
            // 연장전 여부 확인 (isExtraTime 속성 사용)
            let timeText = event.isExtraTime ? "\(event.time.elapsed)' (연장)" : "\(event.time.elapsed)'"
            
            // 자책골인 경우 다른 아이콘 사용
            if event.detail.lowercased().contains("own") {
                Text("🔄⚽️")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(timeText) (자책골)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else if event.detail.lowercased().contains("penalty") && !event.detail.lowercased().contains("won") && !event.detail.lowercased().contains("missed") {
                // 페널티로 득점한 경우 (페널티 획득만 한 경우와 놓친 경우 제외)
                Text("🎯")
                    .font(.caption2)
                Text("\(event.player.name ?? "알 수 없음") \(timeText) (페널티)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            } else {
                // 일반 골 (연장전 여부에 따라 다른 아이콘 사용)
                if event.isExtraTime {
                    Text("⚽️🕒")
                        .font(.caption2)
                } else {
                    Text("⚽️")
                        .font(.caption2)
                }
                Text("\(event.player.name ?? "알 수 없음") \(timeText)")
                    .font(.system(.caption2, design: .rounded))
                    .foregroundColor(.secondary)
            }
        }
        .transition(.opacity.combined(with: .scale))
    }
    
    // 득점자 정보 로깅
    private func logGoalEvents(_ teamGoals: [FixtureEvent]) {
        print("⚽️ 팀 \(team.name)의 골 이벤트 수: \(teamGoals.count)")
        for goal in teamGoals {
            print("  - 득점자: \(goal.player.name ?? "알 수 없음"), 시간: \(goal.time.elapsed)분, 상세: \(goal.detail)")
        }
    }
    
    // 이벤트 데이터 로드 (강화된 버전)
    private func loadEventData() async {
        print("🔄 TeamInfoView - loadEventData 호출됨 (팀: \(team.name))")
        
        // 이벤트 데이터가 이미 로드되어 있는지 확인
        if viewModel.events.isEmpty {
            print("🔄 TeamInfoView - 이벤트 데이터가 비어있어 로드 시작")
            
            // 이벤트 데이터가 없으면 로드 (3번 시도)
            for i in 1...3 {
                print("🔄 TeamInfoView - 이벤트 데이터 로드 시도 #\(i)")
                
                // 이벤트 데이터 로드
                await viewModel.loadEvents()
                
                // 이벤트 데이터 로드 후 UI 업데이트 강제
                await MainActor.run {
                    viewModel.objectWillChange.send()
                    forceUpdate.toggle() // 강제 업데이트 트리거
                }
                
                // 이벤트가 로드되었는지 확인
                if !viewModel.events.isEmpty {
                    print("✅ TeamInfoView - 이벤트 데이터 로드 성공 (시도 #\(i))")
                    
                    // 골 이벤트 필터링 및 로깅
                    let goalEvents = viewModel.events.filter { $0.isActualGoal }
                    print("⚽️ TeamInfoView - 골 이벤트 \(goalEvents.count)개 발견")
                    
                    // 현재 팀의 골 이벤트 필터링
                    let teamGoals = goalEvents.filter { event in
                        // 일반 골: 현재 팀이 득점한 경우
                        let isNormalGoal = event.team.id == self.team.id && !event.detail.lowercased().contains("own")
                        
                        // 자책골: 상대 팀이 자책골을 넣어서 현재 팀이 득점한 경우
                        let isOwnGoalForThisTeam = event.team.id != self.team.id && event.detail.lowercased().contains("own")
                        
                        return isNormalGoal || isOwnGoalForThisTeam
                    }
                    
                    print("⚽️ TeamInfoView - 팀 \(team.name)의 골 이벤트 \(teamGoals.count)개")
                    
                    // 연장전 득점자 확인 및 로깅
                    let extraTimeGoals = teamGoals.filter { $0.isExtraTime }
                    if !extraTimeGoals.isEmpty {
                        print("⚽️🕒 TeamInfoView - 팀 \(team.name)의 연장전 득점 이벤트 \(extraTimeGoals.count)개")
                        for (index, goal) in extraTimeGoals.enumerated() {
                            print("  [\(index+1)] \(goal.player.name ?? "알 수 없음") (\(goal.time.elapsed)' 연장) - \(goal.detail)")
                        }
                        
                        // 연장전 득점자가 있는 경우 추가 UI 업데이트 강제
                        await MainActor.run {
                            print("🔄 TeamInfoView - 연장전 득점자 발견으로 추가 UI 업데이트 강제")
                            viewModel.objectWillChange.send()
                            forceUpdate.toggle() // 강제 업데이트 트리거
                        }
                    }
                    
                    break
                }
                
                // 약간의 지연 후 다시 시도
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
            }
        } else {
            print("✅ TeamInfoView - 이벤트 데이터가 이미 로드되어 있음 (\(viewModel.events.count)개)")
            
            // 이미 이벤트 데이터가 있는 경우에도 UI 업데이트 강제
            await MainActor.run {
                viewModel.objectWillChange.send()
                forceUpdate.toggle() // 강제 업데이트 트리거
            }
            
            // 골 이벤트 필터링 및 로깅
            let goalEvents = viewModel.events.filter { $0.isActualGoal }
            print("⚽️ TeamInfoView - 골 이벤트 \(goalEvents.count)개 발견 (이미 로드됨)")
            
            // 현재 팀의 골 이벤트 필터링
            let teamGoals = goalEvents.filter { event in
                // 일반 골: 현재 팀이 득점한 경우
                let isNormalGoal = event.team.id == self.team.id && !event.detail.lowercased().contains("own")
                
                // 자책골: 상대 팀이 자책골을 넣어서 현재 팀이 득점한 경우
                let isOwnGoalForThisTeam = event.team.id != self.team.id && event.detail.lowercased().contains("own")
                
                return isNormalGoal || isOwnGoalForThisTeam
            }
            
            // 연장전 득점자 확인 및 로깅
            let extraTimeGoals = teamGoals.filter { $0.isExtraTime }
            if !extraTimeGoals.isEmpty {
                print("⚽️🕒 TeamInfoView - 팀 \(team.name)의 연장전 득점 이벤트 \(extraTimeGoals.count)개 (이미 로드됨)")
                for (index, goal) in extraTimeGoals.enumerated() {
                    print("  [\(index+1)] \(goal.player.name ?? "알 수 없음") (\(goal.time.elapsed)' 연장) - \(goal.detail)")
                }
                
                // 연장전 득점자가 있는 경우 추가 UI 업데이트 강제
                await MainActor.run {
                    print("🔄 TeamInfoView - 연장전 득점자 발견으로 추가 UI 업데이트 강제")
                    viewModel.objectWillChange.send()
                    forceUpdate.toggle() // 강제 업데이트 트리거
                }
            }
        }
        
        // 최종 UI 업데이트 강제 (모든 경우에 실행)
        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1초 대기
        await MainActor.run {
            print("🔄 TeamInfoView - 최종 UI 업데이트 강제")
            viewModel.objectWillChange.send()
            forceUpdate.toggle() // 강제 업데이트 트리거
        }
    }
}
