import SwiftUI

struct FixturesView: View {
    @State private var selectedLeagueId: Int
    @State private var selectedTab = 0 // 0: 결과, 1: 예정
    @StateObject private var viewModel: FixturesViewModel
    @State private var navigateToTeamProfile: Bool = false
    @State private var selectedTeamId: Int = 0
    @State private var selectedTeamLeagueId: Int = 0
    
    init(leagueId: Int, leagueName: String) {
        self._selectedLeagueId = State(initialValue: leagueId)
        self._viewModel = StateObject(wrappedValue: FixturesViewModel(leagueId: leagueId))
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemGroupedBackground)
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // 리그 선택
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 16) {
                            ForEach(SupportedLeagues.allLeagues, id: \.self) { leagueId in
                                LeagueTabItem(
                                    leagueId: leagueId,
                                    isSelected: selectedLeagueId == leagueId
                                )
                                .onTapGesture {
                                    selectedLeagueId = leagueId
                                    viewModel.loadFixtures()
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.vertical, 8)
                    .background(Color(.systemBackground))
                    
                    // 시즌 선택
                    HStack {
                        Text("시즌")
                            .foregroundColor(.gray)
                        Picker("시즌", selection: $viewModel.selectedSeason) {
                            ForEach(viewModel.seasons, id: \.self) { season in
                                Text(viewModel.getSeasonDisplay(season))
                                    .tag(season)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        
                        Spacer()
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    
                    // 결과/예정 선택
                    Picker("경기 보기", selection: $selectedTab) {
                        Text("결과")
                            .tag(0)
                        Text("예정")
                            .tag(1)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .padding()
                    
                    // 경기 목록
                    if viewModel.isLoading {
                        // 스켈레톤 UI 표시 (로딩 중에 더 나은 사용자 경험 제공)
                        FixtureSkeletonView()
                            .padding(.horizontal)
                            .frame(maxWidth: .infinity)
                    } else if let errorMessage = viewModel.errorMessage {
                        VStack(spacing: 16) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 50))
                                .foregroundColor(.orange)
                            
                            Text(errorMessage)
                                .multilineTextAlignment(.center)
                                .padding()
                            
                            Button(action: {
                                viewModel.loadFixtures()
                            }) {
                                Label("다시 시도", systemImage: "arrow.clockwise")
                                    .padding()
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 16) {
                                let fixtures = selectedTab == 0 ? 
                                    viewModel.fixtures.filter { $0.fixture.status.short == "FT" }.sorted(by: { $0.fixture.date > $1.fixture.date }) : // 결과는 최신순
                                    viewModel.fixtures.filter { $0.fixture.status.short == "NS" }.sorted(by: { $0.fixture.date < $1.fixture.date }) // 예정은 날짜순
                                
                                if fixtures.isEmpty {
                                    VStack(spacing: 12) {
                                        Image(systemName: selectedTab == 0 ? "flag.checkered" : "calendar.badge.exclamationmark")
                                            .font(.system(size: 40))
                                            .foregroundColor(.secondary)
                                        Text(selectedTab == 0 ? "표시할 경기 결과가 없습니다" : "해당일에 예정된 경기가 없습니다")
                                            .foregroundColor(.secondary)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 40)
                                } else {
                                    ForEach(fixtures) { fixture in
                                        FixtureCell(
                                            fixture: fixture,
                                            formattedDate: viewModel.formatDate(fixture.fixture.date)
                                        )
                                        .padding(.horizontal)
                                    }
                                }
                            }
                            .padding(.vertical)
                        }
                        .refreshable {
                            viewModel.loadFixtures()
                        }
                    }
                }
            }
            .navigationTitle("경기 일정")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        // 검색 버튼
                        NavigationLink(destination: SearchView()) {
                            Image(systemName: "magnifyingglass")
                        }
                        
                        // 새로고침 버튼
                        Button(action: {
                            viewModel.loadFixtures()
                        }) {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(viewModel.isLoading)
                    }
                }
            }
        }
        .onChange(of: selectedLeagueId) { oldValue, newValue in
            viewModel.leagueId = newValue
            viewModel.loadFixtures()
        }
        .onChange(of: viewModel.selectedSeason) { oldValue, newValue in
            viewModel.loadFixtures()
        }
        .onAppear {
            // 로딩 상태 표시
            viewModel.isLoading = true
            
            // 경기 일정 로드
            viewModel.loadFixtures()
            
            // NotificationCenter 관찰자 등록
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ShowTeamProfile"), object: nil, queue: .main) { notification in
                if let userInfo = notification.userInfo,
                   let teamId = userInfo["teamId"] as? Int,
                   let leagueId = userInfo["leagueId"] as? Int {
                    print("📣 FixturesView - 팀 프로필 알림 수신: 팀 ID \(teamId), 리그 ID \(leagueId)")
                    selectedTeamId = teamId
                    selectedTeamLeagueId = leagueId
                    navigateToTeamProfile = true
                }
            }
            
            // 경기 일정 로딩 완료 알림 관찰자 등록
            NotificationCenter.default.addObserver(forName: NSNotification.Name("FixturesLoadingCompleted"), object: nil, queue: .main) { notification in
                if let userInfo = notification.userInfo {
                    print("📣 FixturesView - 경기 일정 로딩 완료 알림 수신")
                    
                    // 강제 업데이트 플래그 확인
                    let forceUpdate = userInfo["forceUpdate"] as? Bool ?? false
                    let hasError = userInfo["error"] as? Bool ?? false
                    
                    print("📣 알림 세부 정보 - 강제 업데이트: \(forceUpdate), 오류: \(hasError)")
                    
                    // 로딩 상태 업데이트
                    DispatchQueue.main.async {
                        viewModel.isLoading = false
                        
                        // 강제 업데이트인 경우 UI 새로고침 트리거
                        if forceUpdate && !hasError {
                            print("🔄 FixturesView - 강제 UI 업데이트 트리거")
                            // 약간의 지연 후 UI 업데이트 (데이터 바인딩 안정화)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                // 임시 변수를 사용하여 강제 UI 업데이트
                                let tempLeagueId = viewModel.leagueId
                                viewModel.leagueId = -1 // 임시 값으로 변경
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                    viewModel.leagueId = tempLeagueId // 원래 값으로 복원
                                }
                            }
                        }
                    }
                }
            }
        }
        .onDisappear {
            // NotificationCenter 관찰자 제거
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("ShowTeamProfile"), object: nil)
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("FixturesLoadingCompleted"), object: nil)
        }
        .navigationDestination(isPresented: $navigateToTeamProfile) {
            TeamProfileView(teamId: selectedTeamId, leagueId: selectedTeamLeagueId)
        }
    }
}
