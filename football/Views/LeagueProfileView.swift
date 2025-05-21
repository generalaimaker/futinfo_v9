import SwiftUI

struct LeagueProfileView: View {
    @StateObject private var viewModel: LeagueProfileViewModel
    @State private var selectedTab = 0 // 0: 순위, 1: 경기, 2: 토너먼트, 3: 선수통계, 4: 팀통계
    @State private var selectedSeason: Int = 2024
    
    let seasons = [2024, 2023, 2022, 2021, 2020]
    let leagueId: Int
    
    init(leagueId: Int) {
        self.leagueId = leagueId
        self._viewModel = StateObject(wrappedValue: LeagueProfileViewModel(leagueId: leagueId))
    }
    
    // 표시할 탭 목록 (순위 탭과 토너먼트 탭 포함 여부에 따라 달라짐)
    private var tabs: [String] {
        let allTabs = ["순위", "경기", "토너먼트", "선수 통계", "팀 통계"]
        var filteredTabs = allTabs
        
        // 토너먼트 탭 필터링
        if !viewModel.shouldShowTournamentTab {
            filteredTabs = filteredTabs.filter { $0 != "토너먼트" }
        }
        
        // 순위 탭 필터링
        if !viewModel.shouldShowStandingsTab {
            filteredTabs = filteredTabs.filter { $0 != "순위" }
        }
        
        return filteredTabs
    }
    
    // 실제 탭 인덱스를 가져오는 함수 (순위 탭과 토너먼트 탭이 없는 경우 처리)
    private func actualTabIndex(for displayIndex: Int) -> Int {
        var actualIndex = displayIndex
        
        // 순위 탭이 없는 경우 인덱스 조정
        if !viewModel.shouldShowStandingsTab && displayIndex >= 0 {
            actualIndex += 1
        }
        
        // 토너먼트 탭이 없는 경우 인덱스 조정
        if !viewModel.shouldShowTournamentTab {
            // 순위 탭이 있는 경우
            if viewModel.shouldShowStandingsTab {
                if actualIndex >= 2 {
                    actualIndex += 1
                }
            }
            // 순위 탭이 없는 경우
            else {
                if actualIndex >= 1 {
                    actualIndex += 1
                }
            }
        }
        
        return actualIndex
    }
    
    // 토너먼트 탭의 tag 값을 계산하는 함수
    private func getTagForTournamentTab() -> Int {
        if viewModel.shouldShowStandingsTab {
            return 2 // 순위 탭이 있으면 토너먼트 탭은 2번
        } else {
            return 1 // 순위 탭이 없으면 토너먼트 탭은 1번
        }
    }
    
    // 선수 통계 탭의 tag 값을 계산하는 함수
    private func getTagForPlayerStatsTab() -> Int {
        var tag = 2 // 기본값
        
        if viewModel.shouldShowStandingsTab {
            tag = 2 // 순위 탭이 있으면 시작 인덱스는 2
        } else {
            tag = 1 // 순위 탭이 없으면 시작 인덱스는 1
        }
        
        if viewModel.shouldShowTournamentTab {
            tag += 1 // 토너먼트 탭이 있으면 인덱스 +1
        }
        
        return tag
    }
    
    // 팀 통계 탭의 tag 값을 계산하는 함수
    private func getTagForTeamStatsTab() -> Int {
        var tag = 3 // 기본값
        
        if viewModel.shouldShowStandingsTab {
            tag = 3 // 순위 탭이 있으면 시작 인덱스는 3
        } else {
            tag = 2 // 순위 탭이 없으면 시작 인덱스는 2
        }
        
        if viewModel.shouldShowTournamentTab {
            tag += 1 // 토너먼트 탭이 있으면 인덱스 +1
        }
        
        return tag
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // 리그 정보 헤더
            if let leagueDetails = viewModel.leagueDetails {
                LeagueHeaderView(leagueDetails: leagueDetails, selectedSeason: $selectedSeason, seasons: seasons)
            } else {
                // 로딩 중이거나 데이터가 없는 경우 플레이스홀더
                LeagueHeaderPlaceholder()
            }
            
            // 상단 탭 바
            CustomTabBar(selectedTab: $selectedTab, tabs: tabs)
            
            // 탭 선택
            TabView(selection: $selectedTab) {
                // 순위 탭 (조건부 표시)
                if viewModel.shouldShowStandingsTab {
                    StandingsTabView(standings: viewModel.standings, leagueId: leagueId)
                        .tag(0)
                }
                
                // 경기 탭
                LeagueFixturesTabView(
                    upcomingFixtures: viewModel.upcomingFixtures,
                    pastFixtures: viewModel.pastFixtures,
                    todayFixtures: viewModel.todayFixtures,
                    formatDate: viewModel.formatDate,
                    getMatchStatus: viewModel.getMatchStatus
                )
                .tag(viewModel.shouldShowStandingsTab ? 1 : 0)
                
                // 토너먼트 탭 (조건부 표시)
                if viewModel.shouldShowTournamentTab {
                    TournamentTabView(
                        leagueId: leagueId,
                        rounds: viewModel.tournamentRounds,
                        fixtures: viewModel.tournamentFixtures,
                        formatDate: viewModel.formatDate
                    )
                    .tag(getTagForTournamentTab())
                }
                
                // 선수 통계 탭
                PlayerStatsTabView(
                    topScorers: viewModel.topScorers,
                    topAssists: viewModel.topAssists,
                    topAttackPoints: viewModel.topAttackPoints,
                    topDribblers: viewModel.topDribblers,
                    topTacklers: viewModel.topTacklers
                )
                .tag(getTagForPlayerStatsTab())
                
                // 팀 통계 탭
                TeamStatsTabView(
                    topScoringTeams: viewModel.topScoringTeams,
                    leastConcededTeams: viewModel.leastConcededTeams,
                    topPossessionTeams: viewModel.topPossessionTeams,
                    topCleanSheetTeams: viewModel.topCleanSheetTeams
                )
                .tag(getTagForTeamStatsTab())
            }
            .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        }
        .overlay {
            if viewModel.isLoading {
                LeagueLoadingView()
            }
        }
        .onChange(of: selectedSeason) { oldValue, newValue in
            viewModel.selectedSeason = newValue
            Task {
                await viewModel.loadAllData()
            }
        }
        .onChange(of: selectedTab) { oldValue, newValue in
            Task {
                // 선택된 탭에 따라 적절한 데이터 로드
                switch newValue {
                    // 순위 탭
                    case 0 where viewModel.shouldShowStandingsTab:
                        await viewModel.loadDataForTab(0)
                    
                    // 경기 탭
                    case _ where (viewModel.shouldShowStandingsTab && newValue == 1) || (!viewModel.shouldShowStandingsTab && newValue == 0):
                        await viewModel.loadDataForTab(1)
                        
                        // 경기 탭으로 변경된 경우 최근 경기로 스크롤하기 위해 약간의 지연 추가
                        if !viewModel.pastFixtures.isEmpty {
                            // 데이터가 로드된 후 0.5초 후에 스크롤 위치 조정 (뷰가 완전히 로드된 후)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                // 이 시점에서는 FixturesTabView의 onAppear가 호출되어 스크롤 위치가 조정됨
                                // 추가적인 조치는 필요하지 않음
                            }
                        }
                    
                    // 토너먼트 탭
                    case _ where newValue == getTagForTournamentTab():
                        await viewModel.loadDataForTab(2)
                    
                    // 선수 통계 탭
                    case _ where newValue == getTagForPlayerStatsTab():
                        await viewModel.loadDataForTab(3)
                    
                    // 팀 통계 탭
                    case _ where newValue == getTagForTeamStatsTab():
                        await viewModel.loadDataForTab(4)
                    
                    default:
                        break
                }
            }
        }
        .onAppear {
            Task {
                // 초기에는 필수 데이터만 로드
                await viewModel.loadLeagueDetails()
                
                // 순위 탭이 있으면 순위 데이터 로드, 없으면 경기 데이터 로드
                if viewModel.shouldShowStandingsTab {
                    await viewModel.loadStandings()
                } else {
                    // 순위 탭이 없으면 경기 탭이 첫 번째 탭이 됨
                    await viewModel.loadFixtures()
                    // 첫 번째 탭으로 설정
                    selectedTab = 0
                }
            }
        }
    }
}

// MARK: - 리그 헤더 뷰
struct LeagueHeaderView: View {
    let leagueDetails: LeagueDetails
    @Binding var selectedSeason: Int
    let seasons: [Int]
    
    private func formatSeason(_ year: Int) -> String {
        let nextYear = (year + 1) % 100
        return "\(year)/\(nextYear)"
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // 리그 로고 및 이름
            HStack(spacing: 16) {
                // Kingfisher 캐싱을 사용하여 리그 로고 이미지 빠르게 로드
                LeagueLogoView(logoUrl: leagueDetails.league.logo, size: 60)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(leagueDetails.league.name)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    if let country = leagueDetails.country {
                        HStack {
                            if let code = country.code {
                                switch code.lowercased() {
                                case "gb", "gb-eng":
                                    Text("🏴󠁧󠁢󠁥󠁮󠁧󠁿")
                                case "es":
                                    Text("🇪🇸")
                                case "it":
                                    Text("🇮🇹")
                                case "de":
                                    Text("🇩🇪")
                                case "fr":
                                    Text("🇫🇷")
                                default:
                                    // 국가 이름이 "France"인 경우 프랑스 국기 표시
                                    if country.name.lowercased() == "france" {
                                        Text("🇫🇷")
                                    } else {
                                        Text("🇪🇺")
                                    }
                                }
                            } else {
                                // 국가 코드가 없지만 국가 이름이 "France"인 경우 프랑스 국기 표시
                                if country.name.lowercased() == "france" {
                                    Text("🇫🇷")
                                } else {
                                    Text("🇪🇺")
                                }
                            }
                            
                            Text(country.name)
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                    }
                }
                
                Spacer()
                
                // 시즌 선택
                Menu {
                    ForEach(seasons, id: \.self) { season in
                        Button(formatSeason(season)) {
                            selectedSeason = season
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(formatSeason(selectedSeason))
                        Image(systemName: "chevron.down")
                    }
                    .font(.system(size: 15))
                    .foregroundColor(.primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
            }
            .padding(.horizontal)
            .padding(.top, 16)
            
            Divider()
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - 리그 헤더 플레이스홀더
struct LeagueHeaderPlaceholder: View {
    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 60, height: 60)
                
                VStack(alignment: .leading, spacing: 4) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 20)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 16)
                        .frame(width: 100)
                }
                
                Spacer()
                
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 80, height: 30)
            }
            .padding(.horizontal)
            .padding(.top, 16)
            
            Divider()
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - 커스텀 탭 바
struct CustomTabBar: View {
    @Binding var selectedTab: Int
    @Namespace private var animation
    
    // 기본 탭 목록
    private let allTabs = ["순위", "경기", "토너먼트", "선수 통계", "팀 통계"]
    
    // 표시할 탭 목록 (토너먼트 탭 포함 여부에 따라 달라짐)
    var tabs: [String]
    
    // 탭 인덱스를 실제 탭 인덱스로 변환 (토너먼트 탭이 없는 경우 처리)
    func actualTabIndex(for index: Int) -> Int {
        if !tabs.contains("토너먼트") && index >= 2 {
            return index + 1 // 토너먼트 탭이 없으면 인덱스 조정
        }
        return index
    }
    
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 0) {
                ForEach(0..<tabs.count, id: \.self) { index in
                    TabBarButton(
                        title: tabs[index],
                        isSelected: selectedTab == index,
                        animation: animation
                    ) {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedTab = index
                        }
                    }
                }
            }
            .padding(.top, 8)
            .padding(.bottom, 4)
            
            Divider()
        }
        .background(Color(.systemBackground))
    }
}

// MARK: - 탭 바 버튼
struct TabBarButton: View {
    let title: String
    let isSelected: Bool
    var animation: Namespace.ID
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(title)
                    .font(.system(size: 15, weight: isSelected ? .semibold : .medium))
                    .foregroundColor(isSelected ? .blue : .gray)
                
                // 선택된 탭 아래에 인디케이터 표시
                if isSelected {
                    Rectangle()
                        .fill(Color.blue)
                        .frame(height: 2)
                        .matchedGeometryEffect(id: "underline", in: animation)
                } else {
                    Rectangle()
                        .fill(Color.clear)
                        .frame(height: 2)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - 리그 로딩 뷰
struct LeagueLoadingView: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
            
            VStack(spacing: 16) {
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)
                
                Text("데이터를 불러오는 중...")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.black.opacity(0.6))
            )
        }
    }
}

// MARK: - 순위 탭 뷰
struct StandingsTabView: View {
    let standings: [Standing]
    let leagueId: Int
    
    init(standings: [Standing], leagueId: Int = 0) {
        self.standings = standings
        self.leagueId = leagueId
    }
    
    // 리그별 진출권 정보
    private func getQualificationInfo(for rank: Int) -> QualificationInfo {
        switch leagueId {
        case 2: // 챔피언스리그
            if rank <= 8 {
                return .knockout16Direct // 1위~8위: 16강 직행
            } else if rank <= 24 {
                return .knockout16Playoff // 9위~24위: 16강 플레이오프
            }
            
        case 3: // 유로파리그
            if rank <= 8 {
                return .knockout16Direct // 1위~8위: 16강 직행
            } else if rank <= 24 {
                return .knockout16Playoff // 9위~24위: 16강 플레이오프
            }
            
        case 39: // 프리미어 리그
            if rank <= 5 {
                return .championsLeague
            } else if rank == 6 {
                return .europaLeague
            } else if rank == 7 {
                return .conferenceLeague
            } else if rank >= standings.count - 2 {
                return .relegation
            }
            
        case 140: // 라리가
            if rank <= 5 {
                return .championsLeague
            } else if rank == 6 || rank == 7 {
                return .europaLeague
            } else if rank == 8 {
                return .conferenceLeague
            } else if rank >= standings.count - 2 {
                return .relegation
            }
            
        case 78, 135: // 분데스리가, 세리에 A
            if rank <= 4 {
                return .championsLeague
            } else if rank == 5 {
                return .europaLeague
            } else if rank == 6 {
                return .conferenceLeague
            } else if rank >= standings.count - 2 {
                return .relegation
            }
            
        case 61: // 리그앙
            if rank <= 3 {
                return .championsLeague
            } else if rank == 4 {
                return .championsLeagueQualification
            } else if rank == 5 {
                return .europaLeague
            } else if rank == 6 {
                return .conferenceLeague
            } else if rank >= standings.count - 2 {
                return .relegation
            }
            
        default:
            if rank <= 4 {
                return .championsLeague
            } else if rank == 5 || rank == 6 {
                return .europaLeague
            } else if rank >= standings.count - 2 {
                return .relegation
            }
        }
        return .none
    }
    
    // 진출권 정보에 따른 색상
    private func getQualificationColor(for info: QualificationInfo) -> Color {
        switch info {
        case .championsLeague, .championsLeagueQualification:
            return Color.blue
        case .europaLeague:
            return Color.orange
        case .conferenceLeague:
            return Color.green
        case .relegation:
            return Color.red
        case .knockout16Direct:
            return Color.green  // 16강 직행은 녹색
        case .knockout16Playoff:
            return Color.orange // 16강 플레이오프는 주황색
        case .none:
            return Color.clear
        }
    }
    
    // 진출권 정보에 따른 설명
    private func getQualificationDescription(for info: QualificationInfo) -> String {
        switch info {
        case .championsLeague:
            return "챔피언스리그"
        case .championsLeagueQualification:
            return "챔피언스리그 예선"
        case .europaLeague:
            return "유로파리그"
        case .conferenceLeague:
            return "컨퍼런스리그"
        case .relegation:
            return "강등권"
        case .knockout16Direct:
            return "16강 직행"
        case .knockout16Playoff:
            return "16강 플레이오프"
        case .none:
            return ""
        }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // 헤더
                HStack(spacing: 0) {
                    Text("#")
                        .frame(width: 30, alignment: .center)
                    Text("팀")
                        .frame(width: 175, alignment: .leading)
                    Text("경기")
                        .frame(width: 35, alignment: .center)
                    Text("승")
                        .frame(width: 25, alignment: .center)
                    Text("무")
                        .frame(width: 25, alignment: .center)
                    Text("패")
                        .frame(width: 25, alignment: .center)
                    Text("+/-")
                        .frame(width: 35, alignment: .center)
                    Text("승점")
                        .frame(width: 35, alignment: .center)
                }
                .font(.system(size: 12))
                .foregroundColor(.gray)
                .padding(.vertical, 10)
                .padding(.horizontal, 8)
                
                Divider()
                
                // 순위 목록
                ForEach(standings) { standing in
                    let qualificationInfo = getQualificationInfo(for: standing.rank)
                    let qualificationColor = getQualificationColor(for: qualificationInfo)
                    
                    VStack(spacing: 0) {
                        Button(action: {
                            // 알림을 통해 TeamProfileView로 이동
                            NotificationCenter.default.post(
                                name: NSNotification.Name("ShowTeamProfile"),
                                object: nil,
                                userInfo: ["teamId": standing.team.id, "leagueId": leagueId]
                            )
                        }) {
                            HStack(spacing: 0) {
                                // 순위 및 진출권 표시
                                HStack(spacing: 0) {
                                    // 진출권 색상 띠
                                    Rectangle()
                                        .fill(qualificationColor)
                                        .frame(width: 3)
                                    
                                    Text("\(standing.rank)")
                                        .frame(width: 27, alignment: .center)
                                        .foregroundColor(qualificationInfo != .none ? qualificationColor : .primary)
                                }
                                .frame(width: 30)
                                
                                HStack(spacing: 8) {
                                    // Kingfisher 캐싱을 사용하여 팀 로고 이미지 빠르게 로드
                                    TeamLogoView(logoUrl: standing.team.logo, size: 20)
                                    
                                    Text(standing.team.name)
                                        .lineLimit(1)
                                        .font(.system(size: 13))
                                }
                                .frame(width: 175, alignment: .leading)
                                
                                Text("\(standing.all.played)")
                                    .frame(width: 35, alignment: .center)
                                Text("\(standing.all.win)")
                                    .frame(width: 25, alignment: .center)
                                Text("\(standing.all.draw)")
                                    .frame(width: 25, alignment: .center)
                                Text("\(standing.all.lose)")
                                    .frame(width: 25, alignment: .center)
                                
                                Text(standing.goalsDiff > 0 ? "+\(standing.goalsDiff)" : "\(standing.goalsDiff)")
                                    .frame(width: 35, alignment: .center)
                                    .foregroundColor(standing.goalsDiff > 0 ? .green : (standing.goalsDiff < 0 ? .red : .primary))
                                
                                Text("\(standing.points)")
                                    .frame(width: 35, alignment: .center)
                                    .bold()
                            }
                            .foregroundColor(.primary)
                            .font(.system(size: 13))
                            .padding(.vertical, 10)
                            .padding(.horizontal, 8)
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        Divider()
                    }
                }
                
                if standings.isEmpty {
                    EmptyDataView(message: "순위 정보가 없습니다")
                } else {
                    // 진출권 범례
                    VStack(alignment: .leading, spacing: 8) {
                        Text("진출권 정보")
                            .font(.headline)
                            .padding(.bottom, 4)
                        
                        // 챔피언스리그와 유로파리그는 다른 범례 표시
                        if leagueId == 2 || leagueId == 3 {
                            // 유럽 대항전 범례
                            ForEach([QualificationInfo.knockout16Direct, .knockout16Playoff], id: \.self) { info in
                                HStack(spacing: 8) {
                                    Rectangle()
                                        .fill(getQualificationColor(for: info))
                                        .frame(width: 12, height: 12)
                                    
                                    Text(getQualificationDescription(for: info))
                                        .font(.caption)
                                        .foregroundColor(.primary)
                                }
                            }
                        } else {
                            // 일반 리그 범례
                            ForEach([QualificationInfo.championsLeague, .championsLeagueQualification, .europaLeague, .conferenceLeague, .relegation], id: \.self) { info in
                                if getQualificationDescription(for: info) != "" {
                                    HStack(spacing: 8) {
                                        Rectangle()
                                            .fill(getQualificationColor(for: info))
                                            .frame(width: 12, height: 12)
                                        
                                        Text(getQualificationDescription(for: info))
                                            .font(.caption)
                                            .foregroundColor(.primary)
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    .padding()
                }
            }
        }
    }
    
    // 진출권 정보 열거형
    enum QualificationInfo: Int, CaseIterable {
        case championsLeague
        case championsLeagueQualification
        case europaLeague
        case conferenceLeague
        case relegation
        case none
        case knockout16Direct      // 16강 직행 (챔피언스리그, 유로파리그)
        case knockout16Playoff     // 16강 플레이오프 (챔피언스리그, 유로파리그)
    }
}

// MARK: - 리그 경기 탭 뷰
struct LeagueFixturesTabView: View {
    let upcomingFixtures: [Fixture]
    let pastFixtures: [Fixture]
    let todayFixtures: [Fixture]
    let formatDate: (String) -> String
    let getMatchStatus: (FixtureStatus) -> String
    
    // 컵대회 ID 목록 (챔피언스리그, 유로파리그, 주요 컵대회)
    private let cupCompetitionIds = [2, 3, 45, 143, 137, 66, 81]
    
    var body: some View {
        ScrollViewReader { scrollProxy in
            ScrollView {
                VStack(spacing: 16) {

                    // ───────── 1) 예정된 경기 ─────────
                    if !upcomingFixtures.isEmpty {
                        SectionHeader(title: "예정된 경기")
                            .id("upcoming")

                        ForEach(upcomingFixtures) { fixture in
                            FixtureCell(
                                fixture: fixture,
                                formattedDate: formatDate(fixture.fixture.date)
                            )
                            .padding(.horizontal)
                        }
                    }

                    // ───────── 2) 오늘 경기 ─────────
                    if !todayFixtures.isEmpty {
                        SectionHeader(title: "오늘 경기")
                            .id("today")

                        ForEach(todayFixtures) { fixture in
                            FixtureCell(
                                fixture: fixture,
                                formattedDate: formatDate(fixture.fixture.date)
                            )
                            .padding(.horizontal)
                        }
                    }

                    // ───────── 3) 지난 경기 ─────────
                    if !pastFixtures.isEmpty {
                        SectionHeader(title: "지난 경기")
                            .id("past")

                        ForEach(pastFixtures) { fixture in
                            FixtureCell(
                                fixture: fixture,
                                formattedDate: formatDate(fixture.fixture.date)
                            )
                            .padding(.horizontal)
                            // 가장 최근 경기에 id 부여 → 스크롤용
                            .id(fixture.id == pastFixtures.first?.id ? "recentMatch" : nil)
                        }
                    }

                    if upcomingFixtures.isEmpty && todayFixtures.isEmpty && pastFixtures.isEmpty {
                        EmptyDataView(message: "경기 정보가 없습니다")
                    }
                }
                .padding(.vertical)
            }
            .onAppear {
                // 뷰가 나타날 때 스크롤 위치 조정
                scrollToRecentMatch(scrollProxy)
            }
            .onChange(of: pastFixtures.count) { _, _ in
                // 데이터가 로드되면 스크롤 위치 조정
                scrollToRecentMatch(scrollProxy)
            }
        }
    }
    
    
    // 최근 경기로 스크롤하는 함수
    private func scrollToRecentMatch(_ scrollProxy: ScrollViewProxy) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            if !todayFixtures.isEmpty {
                // 오늘 경기가 있으면 "오늘 경기" 섹션으로 스크롤
                withAnimation { scrollProxy.scrollTo("today", anchor: .top) }
                print("📜 스크롤: 오늘 경기로 이동")
            } else if !pastFixtures.isEmpty {
                // 오늘 경기가 없고 지난 경기가 있으면 가장 최근 지난 경기로 스크롤
                withAnimation { scrollProxy.scrollTo("past", anchor: .top) }
                print("📜 스크롤: 지난 경기로 이동")
            } else if !upcomingFixtures.isEmpty {
                // 오늘 경기와 지난 경기가 모두 없으면 예정된 경기로 스크롤
                withAnimation { scrollProxy.scrollTo("upcoming", anchor: .top) }
                print("📜 스크롤: 예정된 경기로 이동")
            }
        }
    }
}

// MARK: - 선수 통계 탭 뷰
struct PlayerStatsTabView: View {
    let topScorers: [PlayerProfileData]
    let topAssists: [PlayerProfileData]
    let topAttackPoints: [PlayerProfileData]
    let topDribblers: [PlayerProfileData]
    let topTacklers: [PlayerProfileData]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // 득점 순위
                StatsSectionView(
                    title: "득점 순위",
                    players: topScorers,
                    statType: .goals
                )
                
                // 어시스트 순위
                StatsSectionView(
                    title: "어시스트 순위",
                    players: topAssists,
                    statType: .assists
                )
                
                // 공격포인트 순위
                StatsSectionView(
                    title: "공격포인트 순위",
                    players: topAttackPoints,
                    statType: .attackPoints
                )
                
                // 드리블 성공률 순위
                StatsSectionView(
                    title: "드리블 성공률 순위",
                    players: topDribblers,
                    statType: .dribbles
                )
                
                // 태클 순위
                StatsSectionView(
                    title: "태클 순위",
                    players: topTacklers,
                    statType: .tackles
                )
                
                if topScorers.isEmpty && topAssists.isEmpty && topAttackPoints.isEmpty && topDribblers.isEmpty && topTacklers.isEmpty {
                    EmptyDataView(message: "선수 통계 정보가 없습니다")
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - 팀 통계 탭 뷰
struct TeamStatsTabView: View {
    let topScoringTeams: [TeamSeasonStatistics]
    let leastConcededTeams: [TeamSeasonStatistics]
    let topPossessionTeams: [TeamSeasonStatistics]
    let topCleanSheetTeams: [TeamSeasonStatistics]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // 경기당 득점 상위 팀
                TeamStatsSectionView(
                    title: "경기당 득점 상위 팀",
                    teams: topScoringTeams,
                    statType: .goalsFor
                )
                
                // 경기당 실점 하위 팀
                TeamStatsSectionView(
                    title: "경기당 실점 하위 팀",
                    teams: leastConcededTeams,
                    statType: .goalsAgainst
                )
                
                // 평균 점유율 상위 팀
                TeamStatsSectionView(
                    title: "평균 점유율 상위 팀",
                    teams: topPossessionTeams,
                    statType: .possession
                )
                
                // 클린시트 경기 수 상위 팀
                TeamStatsSectionView(
                    title: "클린시트 경기 수 상위 팀",
                    teams: topCleanSheetTeams,
                    statType: .cleanSheets
                )
                
                if topScoringTeams.isEmpty && leastConcededTeams.isEmpty && topPossessionTeams.isEmpty && topCleanSheetTeams.isEmpty {
                    EmptyDataView(message: "팀 통계 정보가 없습니다")
                }
            }
            .padding(.vertical)
        }
    }
}

// MARK: - 섹션 헤더
struct SectionHeader: View {
    let title: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 8)
    }
}

// MARK: - 빈 데이터 뷰
struct EmptyDataView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundColor(.gray)
            
            Text(message)
                .font(.headline)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

// MARK: - 선수 통계 섹션 뷰
struct StatsSectionView: View {
    let title: String
    let players: [PlayerProfileData]
    let statType: PlayerStatType
    
    enum PlayerStatType {
        case goals
        case assists
        case attackPoints
        case dribbles
        case tackles
    }
    
    var body: some View {
        VStack(spacing: 12) {
            SectionHeader(title: title)
            
            ForEach(Array(players.prefix(3).enumerated()), id: \.element.player.id) { index, player in
                Button(action: {
                    // 알림을 통해 PlayerProfileView로 이동
                    NotificationCenter.default.post(
                        name: NSNotification.Name("ShowPlayerProfile"),
                        object: nil,
                        userInfo: ["playerId": player.player.id ?? 0]
                    )
                }) {
                    LeaguePlayerStatRow(
                        rank: index + 1,
                        player: player,
                        statType: statType
                    )
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(.horizontal)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - 선수 통계 행
struct LeaguePlayerStatRow: View {
    let rank: Int
    let player: PlayerProfileData
    let statType: StatsSectionView.PlayerStatType
    
    var statValue: String {
        guard let stats = player.statistics?.first else { return "0" }
        
        switch statType {
        case .goals:
            return "\(stats.goals?.total ?? 0)"
        case .assists:
            return "\(stats.goals?.assists ?? 0)"
        case .attackPoints:
            let goals = stats.goals?.total ?? 0
            let assists = stats.goals?.assists ?? 0
            return "\(goals + assists)"
        case .dribbles:
            let attempts = stats.dribbles?.attempts ?? 0
            let success = stats.dribbles?.success ?? 0
            let rate = attempts > 0 ? Double(success) / Double(attempts) * 100 : 0
            return String(format: "%.1f%%", rate)
        case .tackles:
            return "\(stats.tackles?.total ?? 0)"
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // 순위
            Text("\(rank)")
                .font(.headline)
                .foregroundColor(rank <= 3 ? .blue : .primary)
                .frame(width: 30)
            
            // 선수 사진 (Kingfisher 캐싱 사용)
            CachedImageView(
                url: URL(string: player.player.photo ?? ""),
                placeholder: Image(systemName: "person.circle"),
                failureImage: Image(systemName: "person.circle"),
                contentMode: .fit
            )
            .frame(width: 40, height: 40)
            .clipShape(Circle())
            
            // 선수 정보
            VStack(alignment: .leading, spacing: 4) {
                Text(player.player.name ?? "")
                    .font(.subheadline)
                    .foregroundColor(.primary)
                
                if let team = player.statistics?.first?.team {
                    Text(team.name)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            // 통계 값
            Text(statValue)
                .font(.headline)
                .foregroundColor(.blue)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// MARK: - 팀 통계 섹션 뷰
struct TeamStatsSectionView: View {
    let title: String
    let teams: [TeamSeasonStatistics]
    let statType: TeamStatType
    
    enum TeamStatType {
        case goalsFor
        case goalsAgainst
        case possession
        case cleanSheets
    }
    
    var body: some View {
        VStack(spacing: 12) {
            SectionHeader(title: title)
            
            ForEach(Array(teams.prefix(3).enumerated()), id: \.element.team.id) { index, team in
                TeamStatRow(
                    rank: index + 1,
                    team: team,
                    statType: statType
                )
            }
        }
        .padding(.horizontal)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - 팀 통계 행
struct TeamStatRow: View {
    let rank: Int
    let team: TeamSeasonStatistics
    let statType: TeamStatsSectionView.TeamStatType
    
    var statValue: String {
        switch statType {
        case .goalsFor:
            let games = team.fixtures?.played.total ?? 0
            let goals = team.goals?.for.total.total ?? 0
            let avg = games > 0 ? Double(goals) / Double(games) : 0
            return String(format: "%.1f", avg)
        case .goalsAgainst:
            let games = team.fixtures?.played.total ?? 0
            let goals = team.goals?.against.total.total ?? 0
            let avg = games > 0 ? Double(goals) / Double(games) : 0
            return String(format: "%.1f", avg)
        case .possession:
            return "50.0%" // 점유율 정보가 없을 수 있으므로 기본값 사용
        case .cleanSheets:
            return "\(team.clean_sheets?.total ?? 0)"
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // 순위
            Text("\(rank)")
                .font(.headline)
                .foregroundColor(rank <= 3 ? .blue : .primary)
                .frame(width: 30)
            
            // 팀 로고 (Kingfisher 캐싱 사용)
            TeamLogoView(logoUrl: team.team.logo, size: 40)
            
            // 팀 이름
            Text(team.team.name)
                .font(.subheadline)
                .foregroundColor(.primary)
            
            Spacer()
            
            // 통계 값
            Text(statValue)
                .font(.headline)
                .foregroundColor(.blue)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}
