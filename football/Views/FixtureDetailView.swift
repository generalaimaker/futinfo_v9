import SwiftUI

struct FixtureDetailView: View {
    let fixture: Fixture
    @StateObject private var viewModel: FixtureDetailViewModel
    @State private var selectedTab = 0
    @State private var navigateToTeamProfile: Bool = false
    @State private var selectedTeamId: Int = 0
    @State private var selectedTeamLeagueId: Int = 0
    
    // 경기 상태에 따라 다른 탭 표시
    private var isUpcoming: Bool {
        return fixture.fixture.status.short == "NS" // Not Started
    }
    
    // 탭 이름 배열
    private var tabNames: [String] {
        return isUpcoming ?
            ["정보", "부상", "순위", "상대전적"] : // 경기 예정
            ["경기요약", "통계", "라인업", "순위", "상대전적"] // 경기 결과
    }
    
    init(fixture: Fixture) {
        self.fixture = fixture
        self._viewModel = StateObject(wrappedValue: FixtureDetailViewModel(fixture: fixture))
    }
    
    // 합산 스코어 계산 로직은 FixtureDetailViewModel로 이동했습니다.
    
    var body: some View {
        NavigationStack {
            ScrollView {
            VStack(spacing: 20) {
                // MatchHeaderView를 사용하여 경기 상단 정보 표시
                MatchHeaderView(fixture: fixture, viewModel: viewModel)
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
                    .onAppear {
                        // 합산 결과 계산 시도
                        if [2, 3].contains(fixture.league.id) { // 챔피언스리그(2)나 유로파리그(3)
                            Task {
                                if let aggregateScore = await viewModel.calculateAggregateScore() {
                                    print("🏆 FixtureDetailView - 합산 스코어 계산 결과: \(aggregateScore)")
                                }
                            }
                        }
                        
                        // 경기 이벤트 데이터 자동 로드 (강제 새로고침)
                        Task {
                            print("🔄 MatchHeaderView - 경기 이벤트 데이터 강제 로드 시작")
                            // 이벤트 데이터 강제 로드
                            await viewModel.loadEvents()
                            print("✅ MatchHeaderView - 경기 이벤트 데이터 로드 완료")
                        }
                    }
                
                // 탭 컨트롤
                VStack(spacing: 0) {
                    // 메인 탭
                    HStack(spacing: 0) {
                        ForEach(tabNames.indices, id: \.self) { index in
                            Button(action: {
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    selectedTab = index
                                    
                                    // 탭 변경 시 필요한 데이터 로드
                                    if isUpcoming {
                                        switch index {
                                        case 0: // 정보 탭
                                            Task {
                                                // 팀 폼 데이터 로드
                                                await viewModel.loadTeamForms()
                                                // 순위 정보 로드
                                                await viewModel.loadStandings()
                                            }
                                        case 1: // 부상 탭
                                            Task {
                                                await viewModel.loadInjuries()
                                            }
                                        case 2: // 순위 탭
                                            Task {
                                                await viewModel.loadStandings()
                                            }
                                        case 3: // 상대전적 탭
                                            Task {
                                                await viewModel.loadHeadToHead()
                                            }
                                        default:
                                            break
                                        }
                                    } else {
                                        // 경기 결과 페이지 탭 변경 시 데이터 로드
                                        switch index {
                                        case 3: // 순위 탭
                                            Task {
                                                await viewModel.loadStandings()
                                            }
                                        case 4: // 상대전적 탭
                                            Task {
                                                await viewModel.loadHeadToHead()
                                            }
                                        default:
                                            break
                                        }
                                    }
                                }
                            }) {
                                VStack(spacing: 8) {
                                    Text(tabNames[index])
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
                if isUpcoming {
                    // 경기 예정 페이지
                    switch selectedTab {
                    case 0: // 정보 탭
                        MatchInfoView(fixture: fixture, viewModel: viewModel)
                    case 1: // 부상 탭
                        InjuriesView(fixture: fixture, viewModel: viewModel)
                    case 2: // 순위 탭
                        StandingsDetailView(fixture: fixture, viewModel: viewModel)
                    case 3: // 상대전적 탭
                        if viewModel.isLoadingHeadToHead {
                            ProgressView()
                        } else if let team1Stats = viewModel.team1Stats,
                                  let team2Stats = viewModel.team2Stats {
                            HeadToHeadView(
                                viewModel: viewModel,
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
                } else {
                    // 경기 결과 페이지
                    switch selectedTab {
                    case 0: // 경기요약 탭
                        if viewModel.isLoadingEvents || viewModel.isLoadingStats {
                            ProgressView()
                                .onAppear {
                                    // 맨 오브 더 매치 데이터 로드 시도
                                    if viewModel.matchPlayerStats.isEmpty {
                                        Task {
                                            print("🔄 FixtureDetailView - 맨 오브 더 매치 데이터 로드 시작")
                                            await viewModel.loadMatchPlayerStats()
                                        }
                                    }
                                }
                        } else {
                            MatchSummaryView(
                                fixture: fixture,
                                events: viewModel.events,
                                statistics: viewModel.statistics,
                                viewModel: viewModel
                            )
                            .onAppear {
                                // 맨 오브 더 매치 데이터 로드 시도
                                if viewModel.manOfTheMatch == nil {
                                    Task {
                                        print("🔄 FixtureDetailView - 맨 오브 더 매치 데이터 로드 시작")
                                        await viewModel.loadMatchPlayerStats()
                                    }
                                }
                            }
                        }
                    case 1: // 통계 탭
                        if viewModel.isLoadingStats {
                            ProgressView()
                        } else {
                            StatisticsView(
                                viewModel: viewModel,
                                statistics: viewModel.statistics,
                                halfStatistics: viewModel.halfStatistics,
                                chartData: viewModel.chartData,
                                selectedType: viewModel.selectedStatisticType,
                                onTypeFilter: viewModel.filterByStatisticType
                            )
                        }
                    case 2: // 라인업 탭
                        if viewModel.isLoadingLineups || viewModel.isLoadingMatchStats {
                            ProgressView()
                        } else if viewModel.matchPlayerStats.isEmpty {
                            Text("선수 통계 정보를 불러오는 중입니다")
                                .foregroundColor(.gray)
                                .padding()
                        } else {
                            LineupsView(lineups: viewModel.lineups)
                        }
                    case 3: // 순위 탭
                        StandingsDetailView(fixture: fixture, viewModel: viewModel)
                            .onAppear {
                                Task {
                                    await viewModel.loadStandings()
                                }
                            }
                    case 4: // 상대전적 탭
                        if viewModel.isLoadingHeadToHead {
                            ProgressView()
                        } else if let team1Stats = viewModel.team1Stats,
                                  let team2Stats = viewModel.team2Stats {
                            HeadToHeadView(
                                viewModel: viewModel,
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
            }
            .padding(.vertical)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $navigateToTeamProfile) {
            TeamProfileView(teamId: selectedTeamId, leagueId: selectedTeamLeagueId)
        }
        .onAppear {
            // NotificationCenter 관찰자 등록
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ShowTeamProfile"), object: nil, queue: .main) { notification in
                if let userInfo = notification.userInfo,
                   let teamId = userInfo["teamId"] as? Int,
                   let leagueId = userInfo["leagueId"] as? Int {
                    print("📣 FixtureDetailView - 팀 프로필 알림 수신: 팀 ID \(teamId), 리그 ID \(leagueId)")
                    selectedTeamId = teamId
                    selectedTeamLeagueId = leagueId
                    navigateToTeamProfile = true
                }
            }
            // 기본 데이터 로드
            Task {
                // 경기 이벤트 데이터 먼저 명시적으로 로드 (최우선)
                if !isUpcoming {
                    print("🔄 FixtureDetailView - 경기 이벤트 데이터 최우선 로드 시작")
                    
                    // 이벤트 데이터 강제 로드 (최대 2번 시도로 줄임)
                    for i in 1...2 {
                        print("🔄 FixtureDetailView - 이벤트 데이터 로드 시도 #\(i)")
                        await viewModel.loadEvents()
                        
                        // 이벤트가 로드되었는지 확인
                        if !viewModel.events.isEmpty {
                            print("✅ FixtureDetailView - 이벤트 데이터 로드 성공 (시도 #\(i))")
                            break
                        }
                        
                        // 첫 번째 시도 후 잠시 대기
                        if i == 1 {
                            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
                        }
                    }
                }
                
                // 그 다음 모든 데이터 로드
                await viewModel.loadAllData()
                
                // 모든 데이터 로드 후 UI 업데이트 강제 (한 번만 수행)
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
                viewModel.objectWillChange.send()
                print("✅ FixtureDetailView - 모든 데이터 로드 및 UI 업데이트 완료")
            }
            
            // 초기 선택된 탭에 필요한 데이터 명시적으로 로드
            if isUpcoming {
                // 정보 탭이 기본 선택되어 있으므로 즉시 데이터 로드 시작
                if selectedTab == 0 {
                    loadInfoTabData()
                }
                
                // 지연된 데이터 로드 시도 예약
                scheduleDelayedDataLoad(delay: 1)
                scheduleDelayedDataLoad(delay: 2)
            }
        }
        .onDisappear {
            // NotificationCenter 관찰자 제거
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("ShowTeamProfile"), object: nil)
        }
    }
    
    // 정보 탭 데이터 로드 함수
    private func loadInfoTabData() {
        Task {
            print("🔄 FixtureDetailView - 정보 탭 데이터 로드 시작")
            // 팀 폼 데이터 로드 (강제 로드)
            await viewModel.loadTeamForms()
            // 순위 정보 로드 (강제 로드)
            await viewModel.loadStandings()
            print("✅ FixtureDetailView - 정보 탭 데이터 로드 완료")
        }
    }
    
    // 지연된 데이터 로드 예약 함수
    private func scheduleDelayedDataLoad(delay: Double) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            if selectedTab == 0 && (viewModel.homeTeamForm == nil || viewModel.awayTeamForm == nil || viewModel.standings.isEmpty) {
                print("⏱️ FixtureDetailView - \(delay)초 후 정보 탭 데이터 재로드")
                loadInfoTabData()
            }
        }
    }
}

// 기존의 다른 View 구조체들은 그대로 유지...
