import SwiftUI

struct FixtureDetailView: View {
    let fixture: Fixture
    @StateObject private var viewModel: FixtureDetailViewModel
    @State private var selectedTab = 0 // 0: 경기요약, 1: 통계, 2: 라인업, 3: 상대전적
    
    init(fixture: Fixture) {
        self.fixture = fixture
        self._viewModel = StateObject(wrappedValue: FixtureDetailViewModel(fixture: fixture))
    }
    
    // 토너먼트 경기인지 확인하는 함수
    private func isTournamentMatch(_ round: String) -> Bool {
        // 예: "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등
        let tournamentRounds = ["16", "8", "quarter", "semi", "final", "1st leg", "2nd leg"]
        return tournamentRounds.contains { round.lowercased().contains($0.lowercased()) }
    }
    
    // 1차전 경기인지 확인하는 함수
    private func isFirstLegMatch(_ round: String) -> Bool {
        // 예: "Round of 16 - 1st Leg", "Quarter-finals - 1st Leg" 등
        return round.lowercased().contains("1st leg") ||
               round.lowercased().contains("first leg")
    }
    
    // 2차전 경기인지 확인하는 함수
    private func isSecondLegMatch(_ round: String) -> Bool {
        // 예: "Round of 16 - 2nd Leg", "Quarter-finals - 2nd Leg" 등
        return round.lowercased().contains("2nd leg") ||
               round.lowercased().contains("second leg") ||
               round.lowercased().contains("return leg")
    }
    
    // 1차전 경기 스코어를 가져오는 함수 (실제로는 API에서 가져와야 함)
    private func getFirstLegScore(fixture: Fixture, isHome: Bool) -> Int {
        // 팀 ID와 라운드 정보를 기반으로 가상의 1차전 스코어 생성
        let teamId = isHome ? fixture.teams.home.id : fixture.teams.away.id
        let roundInfo = fixture.league.round
        
        // 라운드 정보에서 숫자 추출 (예: "Round of 16" -> 16)
        let roundNumber = extractRoundNumber(from: roundInfo)
        
        // 팀 ID와 라운드 번호를 조합하여 가상의 스코어 생성
        let baseScore = (teamId % 3) + (roundNumber % 4)
        
        return baseScore
    }
    
    // 라운드 정보에서 숫자 추출하는 함수
    private func extractRoundNumber(from round: String) -> Int {
        // "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등에서 숫자 추출
        if round.contains("16") {
            return 16
        } else if round.contains("8") || round.lowercased().contains("quarter") {
            return 8
        } else if round.lowercased().contains("semi") {
            return 4
        } else if round.lowercased().contains("final") {
            return 2
        }
        return 1
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 경기 기본 정보 (경기장과 심판 정보 제외)
                VStack(spacing: 8) {
                    Text("Match Finished")
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundColor(.gray)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(Color(.systemGray6))
                    
                    HStack(spacing: 0) {
                        // 홈팀 - 경기 상세 페이지에서는 팀 프로필로 이동 가능
                        VStack {
                            NavigationLink(destination: TeamProfileView(teamId: fixture.teams.home.id, leagueId: fixture.league.id)) {
                                VStack {
                                    AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 60, height: 60)
                                    } placeholder: {
                                        Image(systemName: "sportscourt")
                                            .font(.system(size: 40))
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Text(fixture.teams.home.name)
                                        .font(.system(.headline, design: .rounded))
                                        .multilineTextAlignment(.center)
                                        .lineLimit(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .foregroundColor(.primary) // 네비게이션 링크 내부의 텍스트 색상 설정
                                }
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        .frame(maxWidth: .infinity)
                        
                        // 스코어
                        VStack(spacing: 8) {
                            HStack(spacing: 20) {
                                Text("\(fixture.goals?.home ?? 0)")
                                Text("-")
                                Text("\(fixture.goals?.away ?? 0)")
                            }
                            .font(.system(size: 44, weight: .bold, design: .rounded))
                            
                            // 경기 상태 표시
                            if ["AET", "PEN"].contains(fixture.fixture.status.short) {
                                VStack(spacing: 4) {
                                    // 연장 종료 또는 승부차기 종료 표시
                                    HStack(spacing: 8) {
                                        if fixture.fixture.status.short == "AET" {
                                            Text("연장 종료")
                                                .font(.system(.callout, design: .rounded))
                                                .fontWeight(.medium)
                                                .foregroundColor(.gray)
                                        } else {
                                            // 승부차기 종료 + 스코어
                                            Text("승부차기 종료")
                                                .font(.system(.callout, design: .rounded))
                                                .fontWeight(.medium)
                                                .foregroundColor(.gray)
                                            
                                            // 승부차기 스코어 표시 (임시 데이터)
                                            Text("(5:4)")
                                                .font(.system(.callout, design: .rounded))
                                                .fontWeight(.medium)
                                                .foregroundColor(.gray)
                                        }
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(Color(.systemGray6))
                                    .clipShape(Capsule())
                                    
                                    // 합산 스코어 표시 (임시 데이터)
                                    if [2, 3].contains(fixture.league.id) && isTournamentMatch(fixture.league.round) {
                                        // 1차전 경기인 경우
                                        if isFirstLegMatch(fixture.league.round) {
                                            // 1차전 경기는 합산 스코어를 표시하지 않음
                                        }
                                        // 2차전 경기인 경우
                                        else if isSecondLegMatch(fixture.league.round) {
                                            // 현재 경기 스코어
                                            let currentHomeScore = fixture.goals?.home ?? 0
                                            let currentAwayScore = fixture.goals?.away ?? 0
                                            
                                            // 1차전 경기 스코어 (실제로는 API에서 가져와야 함)
                                            // 여기서는 라운드 정보와 팀 ID를 기반으로 가상의 1차전 스코어를 생성
                                            let firstLegHomeScore = getFirstLegScore(fixture: fixture, isHome: true)
                                            let firstLegAwayScore = getFirstLegScore(fixture: fixture, isHome: false)
                                            
                                            // 합산 스코어 계산
                                            let homeAggregate = currentHomeScore + firstLegAwayScore // 홈팀의 현재 스코어 + 1차전 원정 스코어
                                            let awayAggregate = currentAwayScore + firstLegHomeScore // 원정팀의 현재 스코어 + 1차전 홈 스코어
                                            
                                            Text("(\(homeAggregate):\(awayAggregate))")
                                                .font(.system(.caption, design: .rounded))
                                                .foregroundColor(.gray)
                                                .padding(.top, 4)
                                        }
                                        // 다른 토너먼트 경기 (예: 결승전)
                                    }
                                }
                            } else if let elapsed = fixture.fixture.status.elapsed {
                                Text("\(elapsed)'")
                                    .font(.system(.callout, design: .rounded))
                                    .fontWeight(.medium)
                                    .foregroundColor(.gray)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(Color(.systemGray6))
                                    .clipShape(Capsule())
                            }
                        }
                        .frame(width: 120)
                        .padding(.vertical, 12)
                        
                        // 원정팀 - 경기 상세 페이지에서는 팀 프로필로 이동 가능
                        VStack {
                            NavigationLink(destination: TeamProfileView(teamId: fixture.teams.away.id, leagueId: fixture.league.id)) {
                                VStack {
                                    AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 60, height: 60)
                                    } placeholder: {
                                        Image(systemName: "sportscourt")
                                            .font(.system(size: 40))
                                            .foregroundColor(.gray)
                                    }
                                    
                                    Text(fixture.teams.away.name)
                                        .font(.system(.headline, design: .rounded))
                                        .multilineTextAlignment(.center)
                                        .lineLimit(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                        .foregroundColor(.primary) // 네비게이션 링크 내부의 텍스트 색상 설정
                                }
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(.vertical, 20)
                }
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
                
                // 탭 컨트롤
                VStack(spacing: 0) {
                    // 메인 탭
                    HStack(spacing: 0) {
                        ForEach(["경기요약", "통계", "라인업", "상대전적"].indices, id: \.self) { index in
                            Button(action: {
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    selectedTab = index
                                }
                            }) {
                                VStack(spacing: 8) {
                                    Text(["경기요약", "통계", "라인업", "상대전적"][index])
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
                    if viewModel.isLoadingEvents || viewModel.isLoadingStats {
                        ProgressView()
                    } else {
                        MatchSummaryView(
                            fixture: fixture,
                            events: viewModel.events,
                            statistics: viewModel.statistics,
                            viewModel: viewModel
                        )
                    }
                case 1:
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
                case 2:
                    if viewModel.isLoadingLineups || viewModel.isLoadingMatchStats {
                        ProgressView()
                    } else if viewModel.matchPlayerStats.isEmpty {
                        Text("선수 통계 정보를 불러오는 중입니다")
                            .foregroundColor(.gray)
                            .padding()
                    } else {
                        LineupsView(
                            lineups: viewModel.lineups,
                            topPlayers: viewModel.topPlayers,
                            teamStats: viewModel.matchPlayerStats
                        )
                    }
                case 3:
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
            .padding(.vertical)
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadAllData()
        }
    }
}

// 기존의 다른 View 구조체들은 그대로 유지...
