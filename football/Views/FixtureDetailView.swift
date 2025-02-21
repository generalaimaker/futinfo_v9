import SwiftUI

struct FixtureDetailView: View {
    let fixture: Fixture
    @StateObject private var viewModel: FixtureDetailViewModel
    @State private var selectedTab = 0 // 0: 경기요약, 1: 통계, 2: 라인업, 3: 상대전적
    
    init(fixture: Fixture) {
        self.fixture = fixture
        self._viewModel = StateObject(wrappedValue: FixtureDetailViewModel(fixture: fixture))
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
                        // 홈팀
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
                            
                            if let elapsed = fixture.fixture.status.elapsed {
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
                        
                        // 원정팀
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
