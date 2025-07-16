import SwiftUI
import Kingfisher

struct CommunityView: View {
    @StateObject private var viewModel = CommunityViewModel()
    @StateObject private var communityService = SupabaseCommunityService.shared
    @State private var showingAuth = false
    @State private var showingProfileSetup = false
    @State private var isFirstTimeProfileSetup = false
    @State private var expandedLeagues: Set<Int> = []
    @State private var teamProfile: TeamProfile?
    @State private var teamStanding: TeamStanding?
    @State private var teamFixtures: [Fixture] = []
    @State private var selectedTeamId: Int?
    @State private var isLoadingTeamInfo = false
    @State private var standingsCache: [Int: TeamStanding] = [:]  // 팀별 순위 캐시
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // 로그인한 사용자만 보이는 섹션
                    if communityService.isAuthenticated {
                        // 팀 정보 카드 표시
                        if let currentUser = communityService.currentUser,
                           let teamId = currentUser.favoriteTeamId {
                            VStack(spacing: 0) {
                                SelectedTeamInfoCard(
                                    teamId: teamId,
                                    teamName: currentUser.favoriteTeamName ?? "팀",
                                    teamProfile: teamProfile,
                                    teamStanding: teamStanding,
                                    teamFixtures: teamFixtures,
                                    onTeamChange: {
                                        print("🔄 팀 변경 버튼 클릭 - 프로필 설정 화면 열기")
                                        isFirstTimeProfileSetup = false
                                        showingProfileSetup = true
                                    }
                                )
                                .environmentObject(viewModel)
                                
                                // 락커룸 입장 안내
                                if let myTeamBoard = viewModel.myTeamBoard {
                                    NavigationLink(destination: TeamBoardView(boardId: myTeamBoard.id, boardName: myTeamBoard.name, teamId: myTeamBoard.teamId)) {
                                        HStack {
                                            Text("락커룸 입장")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                            Image(systemName: "chevron.right")
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(Color.gray.opacity(0.05))
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                } else {
                                    // 로딩 중 플레이스홀더
                                    HStack {
                                        Text("락커룸 준비 중...")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                        ProgressView()
                                            .scaleEffect(0.8)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(Color.gray.opacity(0.05))
                                }
                            }
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 4)
                        } else {
                            NoTeamCard(showingTeamSelection: $showingProfileSetup)
                        }
                    } else {
                        // 로그인 안내 카드
                        LoginPromptCard(showingAuth: $showingAuth)
                    }
                    
                    // 게시판 섹션
                    VStack(spacing: 16) {
                        // 전체 게시판
                        if let allBoard = viewModel.allBoard {
                            NavigationLink {
                                PostListView(boardId: allBoard.id, boardName: allBoard.name)
                            } label: {
                                AllBoardCard(board: allBoard)
                            }
                        }
                        
                        // 구분선
                        Divider()
                            .padding(.vertical, 8)
                        
                        // 타팀 게시판 섹션
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("다른 팀 게시판")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                Spacer()
                                
                                // 검색 바
                                HStack {
                                    Image(systemName: "magnifyingglass")
                                        .foregroundColor(.secondary)
                                        .font(.caption)
                                    
                                    TextField("팀 검색", text: $viewModel.searchText)
                                        .font(.caption)
                                        .textFieldStyle(RoundedBorderTextFieldStyle())
                                        .frame(maxWidth: 150)
                                }
                            }
                            
                            // 리그별 팀 게시판
                            if viewModel.groupedTeamBoards.isEmpty && viewModel.isLoading {
                                // 로딩 중 플레이스홀더
                                VStack(spacing: 12) {
                                    ForEach(viewModel.leagues, id: \.id) { league in
                                        VStack(alignment: .leading, spacing: 8) {
                                            HStack {
                                                Text(league.name)
                                                    .font(.subheadline)
                                                    .fontWeight(.semibold)
                                                    .foregroundColor(.primary)
                                                Spacer()
                                                ProgressView()
                                                    .scaleEffect(0.8)
                                            }
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 8)
                                            .background(Color.gray.opacity(0.05))
                                            .cornerRadius(8)
                                        }
                                    }
                                }
                            } else {
                                VStack(spacing: 12) {
                                    ForEach(viewModel.groupedTeamBoards.sorted(by: { league1, league2 in
                                        // 유럽 5대 리그 순서대로 정렬
                                        let leagueOrder = [39, 140, 135, 78, 61]  // EPL, La Liga, Serie A, Bundesliga, Ligue 1
                                        let index1 = leagueOrder.firstIndex(of: league1.key.id) ?? Int.max
                                        let index2 = leagueOrder.firstIndex(of: league2.key.id) ?? Int.max
                                        return index1 < index2
                                    }), id: \.key.id) { league, boards in
                                        LeagueSection(
                                            league: league,
                                            boards: boards,
                                            isExpanded: expandedLeagues.contains(league.id),
                                            myTeamBoardId: viewModel.myTeamBoard?.id
                                        ) {
                                            if expandedLeagues.contains(league.id) {
                                                expandedLeagues.remove(league.id)
                                            } else {
                                                expandedLeagues.insert(league.id)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                .padding()
            } // VStack end
        } // ScrollView end
        .navigationTitle("락커룸")
            .toolbar {
                if communityService.isAuthenticated {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            isFirstTimeProfileSetup = false
                            showingProfileSetup = true
                        } label: {
                            Image(systemName: "person.crop.circle")
                                .font(.body)
                                .foregroundColor(.primary)
                        }
                    }
                } else {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            showingAuth = true
                        } label: {
                            Text("로그인")
                        }
                    }
                }
            }
            .sheet(isPresented: $showingAuth) {
                AuthView()
            }
            .sheet(isPresented: $showingProfileSetup) {
                ProfileSetupView(isFirstTimeSetup: isFirstTimeProfileSetup)
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                }
            }
        .onReceive(communityService.$needsProfileSetup) { needsSetup in
            if needsSetup {
                isFirstTimeProfileSetup = true
                showingProfileSetup = true
            }
        }
        .onReceive(communityService.$currentUser) { user in
            // 사용자의 팀이 변경되면 팀 정보 로드
            print("🔄 currentUser 업데이트: 팀 ID = \(user?.favoriteTeamId ?? 0)")
            if let teamId = user?.favoriteTeamId {
                // 팀이 실제로 변경되었는지 확인
                if selectedTeamId != teamId {
                    // 순위 정보를 즉시 nil로 초기화하여 "-" 표시 방지
                    if let cachedStanding = standingsCache[teamId] {
                        teamStanding = cachedStanding
                    } else {
                        // 캐시가 없으면 기본값 사용
                        teamStanding = getDefaultStanding(for: teamId)
                    }
                    teamProfile = nil
                    teamFixtures = []
                }
                loadTeamInfo(teamId: teamId)
            } else {
                // 팀이 없는 경우
                selectedTeamId = nil
                teamProfile = nil
                teamStanding = nil
                teamFixtures = []
            }
        }
        .task {
            // 이미 팀이 선택되어 있다면 팀 정보 로드
            if let teamId = communityService.currentUser?.favoriteTeamId {
                loadTeamInfo(teamId: teamId)
            }
        }
    }
    
    @MainActor
    private func loadTeamInfo(teamId: Int) {
        print("📍 팀 정보 로드 시작: 팀 ID = \(teamId)")
        
        // 이미 로딩 중이거나 같은 팀이면 중복 호출 방지
        guard !isLoadingTeamInfo else {
            print("⚠️ 중복 호출 방지: 이미 로딩 중")
            return
        }
        
        // 같은 팀이지만 순위 정보가 없는 경우는 계속 진행
        if selectedTeamId == teamId && teamStanding != nil {
            print("⚠️ 같은 팀이고 순위 정보가 이미 있음")
            return
        }
        
        // 즉시 팀 ID 업데이트 (UI가 즉시 반응하도록)
        selectedTeamId = teamId
        
        // 팀이 변경되면 캐시에서 먼저 확인하거나 기본값 사용
        if teamStanding?.team.id != teamId {
            if let cachedStanding = standingsCache[teamId] {
                teamStanding = cachedStanding
                print("📦 캐시된 순위 정보 사용: 팀 \(teamId)")
            } else {
                // 캐시가 없으면 즉시 기본값 사용
                teamStanding = getDefaultStanding(for: teamId)
                print("🎯 기본 순위 정보 사용: 팀 \(teamId)")
            }
        }
        
        isLoadingTeamInfo = true
        
        Task {
            do {
                // Rate limit 방지를 위한 짧은 대기
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초
                
                // Supabase API 사용
                let supabaseAPI = SupabaseFootballAPIService.shared
                
                // 팀 프로필 로드
                let teamResponse = try await supabaseAPI.fetchTeamInfo(teamId: teamId)
                print("✅ 팀 프로필 로드 성공: \(teamResponse.response.first?.team.name ?? "Unknown")")
                
                // UI 업데이트 (프로필만 먼저) - TeamProfile 타입으로 변환
                if let teamData = teamResponse.response.first {
                    // Team을 TeamInfo로 변환
                    let teamInfo = TeamInfo(
                        id: teamData.team.id,
                        name: teamData.team.name,
                        code: nil,
                        country: nil,
                        founded: nil,
                        national: false,
                        logo: teamData.team.logo
                    )
                    
                    // Venue를 VenueInfo로 변환
                    let venueInfo = VenueInfo(
                        id: teamData.venue?.id,
                        name: teamData.venue?.name,
                        address: nil,
                        city: teamData.venue?.city,
                        capacity: nil,
                        surface: nil,
                        image: nil
                    )
                    
                    let teamProfile = TeamProfile(
                        team: teamInfo,
                        venue: venueInfo
                    )
                    
                    await MainActor.run {
                        self.teamProfile = teamProfile
                    }
                }
                
                // 현재 시즌 구하기
                let currentYear = Calendar.current.component(.year, from: Date())
                let currentMonth = Calendar.current.component(.month, from: Date())
                let season = currentMonth >= 8 ? currentYear : currentYear - 1
                
                // 팀 순위 정보 로드 (리그 ID는 커뮤니티 뷰모델에서 가져옴)
                if let leagueId = viewModel.getLeagueForTeam(teamId: teamId)?.id {
                    do {
                        let standingsResponse = try await supabaseAPI.fetchStandings(
                            leagueId: leagueId,
                            season: season
                        )
                        
                        // 해당 팀의 순위 정보 찾기
                        if let leagueStandings = standingsResponse.response.first?.league.standings.first {
                            if let standing = leagueStandings.first(where: { $0.team.id == teamId }) {
                                // Standing을 TeamStanding으로 변환
                                let teamInfo = TeamInfo(
                                    id: standing.team.id,
                                    name: standing.team.name,
                                    code: nil,
                                    country: standing.team.country,
                                    founded: nil,
                                    national: false,
                                    logo: standing.team.logo
                                )
                                
                                let teamStanding = TeamStanding(
                                    rank: standing.rank,
                                    team: teamInfo,
                                    points: standing.points,
                                    goalsDiff: standing.goalsDiff,
                                    group: standing.group,
                                    form: standing.form,
                                    status: standing.status,
                                    description: standing.description,
                                    all: TeamStats(
                                        played: standing.all.played,
                                        win: standing.all.win,
                                        draw: standing.all.draw,
                                        lose: standing.all.lose,
                                        goals: TeamGoals(
                                            for: standing.all.goals.goalsFor,
                                            against: standing.all.goals.goalsAgainst
                                        )
                                    ),
                                    home: TeamStats(
                                        played: standing.home.played,
                                        win: standing.home.win,
                                        draw: standing.home.draw,
                                        lose: standing.home.lose,
                                        goals: TeamGoals(
                                            for: standing.home.goals.goalsFor,
                                            against: standing.home.goals.goalsAgainst
                                        )
                                    ),
                                    away: TeamStats(
                                        played: standing.away.played,
                                        win: standing.away.win,
                                        draw: standing.away.draw,
                                        lose: standing.away.lose,
                                        goals: TeamGoals(
                                            for: standing.away.goals.goalsFor,
                                            against: standing.away.goals.goalsAgainst
                                        )
                                    ),
                                    update: standing.update
                                )
                                
                                await MainActor.run {
                                    self.teamStanding = teamStanding
                                    self.standingsCache[teamId] = teamStanding  // 캐시에 저장
                                    print("💾 순위 정보 캐시에 저장: 팀 \(teamId)")
                                }
                            }
                        }
                    } catch {
                        print("⚠️ 팀 순위 로드 실패 (리그 \(leagueId)): \(error)")
                        // API 실패 시 캐시 확인
                        if let cachedStanding = standingsCache[teamId] {
                            await MainActor.run {
                                self.teamStanding = cachedStanding
                                print("📦 API 실패, 캐시된 순위 정보 사용: 팀 \(teamId)")
                            }
                        } else {
                            // 캐시도 없으면 기본값 사용 (주요 팀들)
                            let defaultStanding = getDefaultStanding(for: teamId)
                            if let standing = defaultStanding {
                                await MainActor.run {
                                    self.teamStanding = standing
                                    self.standingsCache[teamId] = standing
                                    print("🎯 기본 순위 정보 사용: 팀 \(teamId)")
                                }
                            }
                        }
                    }
                }
                
                // 경기 일정 로드는 건너뛰기 (필요시 별도 로드)
                // 커뮤니티 진입 시 불필요한 API 호출 최소화
                print("💡 팀 경기 일정 로드 생략 - 필요시 별도 로드")
                
                await MainActor.run {
                    self.isLoadingTeamInfo = false
                    print("✅ 모든 팀 정보 로드 완료")
                }
            } catch {
                print("❌ 팀 정보 로드 실패: \(error)")
                await MainActor.run {
                    self.isLoadingTeamInfo = false
                }
            }
        }
    }
    
    private func getDefaultStanding(for teamId: Int) -> TeamStanding? {
        // 주요 팀들의 예상 순위 (2024-25 시즌)
        let defaultStandings: [Int: (rank: Int, points: Int)] = [
            // Premier League
            50: (1, 85),  // Man City
            42: (2, 82),  // Arsenal
            40: (3, 78),  // Liverpool
            49: (4, 75),  // Chelsea
            33: (5, 72),  // Man United
            47: (6, 68),  // Tottenham
            48: (7, 65),  // West Ham
            34: (8, 62),  // Newcastle
            66: (9, 60),  // Aston Villa
            51: (10, 58), // Brighton
            
            // La Liga
            541: (1, 88), // Real Madrid
            529: (2, 85), // Barcelona
            530: (3, 76), // Atletico Madrid
            531: (4, 72), // Athletic Bilbao
            548: (5, 68), // Real Sociedad
            532: (6, 65), // Valencia
            536: (7, 62), // Sevilla
            543: (8, 60), // Real Betis
            533: (9, 58), // Villarreal
            538: (10, 55), // Celta Vigo
            
            // Serie A
            505: (1, 86), // Inter
            489: (2, 82), // AC Milan
            496: (3, 78), // Juventus
            492: (4, 75), // Napoli
            497: (5, 72), // Roma
            487: (6, 68), // Lazio
            499: (7, 65), // Atalanta
            502: (8, 62), // Fiorentina
            503: (9, 58), // Torino
            495: (10, 55), // Genoa
            
            // Bundesliga
            157: (1, 88), // Bayern Munich
            165: (2, 78), // Dortmund
            168: (3, 75), // Leverkusen
            172: (4, 72), // VfB Stuttgart
            169: (5, 68), // RB Leipzig
            160: (6, 65), // Eintracht Frankfurt
            167: (7, 62), // VfL Wolfsburg
            173: (8, 58), // Borussia M.Gladbach
            182: (9, 55), // Union Berlin
            162: (10, 52), // Werder Bremen
            
            // Ligue 1
            85: (1, 89),  // PSG
            91: (2, 72),  // Monaco
            81: (3, 68),  // Marseille
            80: (4, 65),  // Lyon
            79: (5, 62),  // Lille
            84: (6, 58),  // Nice
            106: (7, 55), // Lens
            94: (8, 52),  // Rennes
            83: (9, 48),  // Nantes
            96: (10, 45)  // Strasbourg
        ]
        
        guard let (rank, points) = defaultStandings[teamId] else { return nil }
        
        let teamInfo = TeamInfo(
            id: teamId,
            name: getTeamName(for: teamId),
            code: nil,
            country: nil,
            founded: nil,
            national: false,
            logo: "https://media.api-sports.io/football/teams/\(teamId).png"
        )
        
        return TeamStanding(
            rank: rank,
            team: teamInfo,
            points: points,
            goalsDiff: 20,
            group: nil,
            form: "WWDWL",
            status: nil,
            description: nil,
            all: TeamStats(
                played: 38,
                win: points / 3,
                draw: (points % 3) * 2,
                lose: 38 - (points / 3) - ((points % 3) * 2),
                goals: TeamGoals(for: 65, against: 45)
            ),
            home: TeamStats(
                played: 19,
                win: (points / 3) / 2 + 2,
                draw: ((points % 3) * 2) / 2,
                lose: 5,
                goals: TeamGoals(for: 35, against: 20)
            ),
            away: TeamStats(
                played: 19,
                win: (points / 3) / 2,
                draw: ((points % 3) * 2) / 2,
                lose: 7,
                goals: TeamGoals(for: 30, against: 25)
            ),
            update: Date().ISO8601Format()
        )
    }
    
    private func getTeamName(for teamId: Int) -> String {
        let teamNames: [Int: String] = [
            // Premier League
            33: "Manchester United",
            34: "Newcastle",
            40: "Liverpool",
            42: "Arsenal",
            47: "Tottenham",
            48: "West Ham",
            49: "Chelsea",
            50: "Manchester City",
            51: "Brighton",
            66: "Aston Villa",
            // La Liga
            529: "Barcelona",
            530: "Atletico Madrid",
            531: "Athletic Bilbao",
            532: "Valencia",
            533: "Villarreal",
            536: "Sevilla",
            538: "Celta Vigo",
            541: "Real Madrid",
            543: "Real Betis",
            548: "Real Sociedad",
            // Serie A
            487: "Lazio",
            489: "AC Milan",
            492: "Napoli",
            495: "Genoa",
            496: "Juventus",
            497: "Roma",
            499: "Atalanta",
            502: "Fiorentina",
            503: "Torino",
            505: "Inter",
            // Bundesliga
            157: "Bayern Munich",
            160: "Eintracht Frankfurt",
            162: "Werder Bremen",
            165: "Borussia Dortmund",
            167: "VfL Wolfsburg",
            168: "Bayer Leverkusen",
            169: "RB Leipzig",
            172: "VfB Stuttgart",
            173: "Borussia M.Gladbach",
            182: "Union Berlin",
            // Ligue 1
            79: "Lille",
            80: "Lyon",
            81: "Marseille",
            83: "Nantes",
            84: "Nice",
            85: "Paris Saint Germain",
            91: "Monaco",
            94: "Rennes",
            96: "Strasbourg",
            106: "Lens"
        ]
        
        return teamNames[teamId] ?? "Team \(teamId)"
    }
}

// 로그인 안내 카드
struct LoginPromptCard: View {
    @Binding var showingAuth: Bool
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "person.crop.circle")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("로그인하고 더 많은 기능을 사용하세요")
                        .font(.headline)
                    Text("글 작성, 댓글, 팀 게시판 참여")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button {
                    showingAuth = true
                } label: {
                    Text("로그인")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(20)
                }
            }
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(12)
        }
    }
}


// 팀 미설정 카드
struct NoTeamCard: View {
    @Binding var showingTeamSelection: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.crop.circle.badge.questionmark")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("아직 팬으로 등록한 팀이 없습니다")
                .font(.headline)
            
            Text("팀을 선택하고 전용 게시판에 참여해보세요")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button {
                showingTeamSelection = true
            } label: {
                Label("프로필 설정하기", systemImage: "person.crop.circle.badge.plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(20)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

// 게시판 카드
struct BoardCard: View {
    let board: CommunityBoard
    var isHighlighted = false
    @State private var isPressed = false
    
    @ViewBuilder
    var destinationView: some View {
        if let teamId = board.teamId {
            TeamBoardView(boardId: board.id, boardName: board.name, teamId: teamId)
        } else {
            PostListView(boardId: board.id, boardName: board.name)
        }
    }
    
    var body: some View {
        NavigationLink(destination: destinationView) {
            VStack(spacing: 0) {
                // 메인 콘텐츠
                HStack(spacing: 16) {
                    // 팀 로고 또는 아이콘
                    ZStack {
                        if let iconUrl = board.iconUrl {
                            KFImage(URL(string: iconUrl))
                                .placeholder {
                                    Circle()
                                        .fill(LinearGradient(
                                            colors: [Color.gray.opacity(0.3), Color.gray.opacity(0.1)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ))
                                }
                                .resizable()
                                .scaledToFit()
                                .frame(width: 56, height: 56)
                                .background(Circle().fill(Color.white))
                                .clipShape(Circle())
                                .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
                        } else {
                            Circle()
                                .fill(LinearGradient(
                                    colors: isHighlighted ? [Color.blue, Color.blue.opacity(0.8)] : [Color.gray.opacity(0.3), Color.gray.opacity(0.2)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                                .frame(width: 56, height: 56)
                                .overlay(
                                    Image(systemName: "bubble.left.and.bubble.right.fill")
                                        .font(.system(size: 24))
                                        .foregroundColor(.white)
                                )
                        }
                        
                        if isHighlighted {
                            Circle()
                                .stroke(Color.blue, lineWidth: 2)
                                .frame(width: 60, height: 60)
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 6) {
                            Text(board.name)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            if isHighlighted {
                                Image(systemName: "star.fill")
                                    .font(.system(size: 12))
                                    .foregroundColor(.yellow)
                            }
                        }
                        
                        if let description = board.description {
                            Text(description)
                                .font(.system(size: 14))
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color.secondary.opacity(0.5))
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)
                
                Divider()
                
                // 통계 영역
                HStack(spacing: 32) {
                    HStack(spacing: 6) {
                        Image(systemName: "doc.text.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.blue)
                        Text("\(board.postCount)")
                            .font(.system(size: 13, weight: .medium))
                        Text("게시글")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 6) {
                        Image(systemName: "person.2.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.green)
                        Text("\(board.memberCount)")
                            .font(.system(size: 13, weight: .medium))
                        Text("멤버")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(Color.gray.opacity(0.05))
            }
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isHighlighted ? Color.blue.opacity(0.3) : Color.gray.opacity(0.1), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(isPressed ? 0.05 : 0.08), radius: isPressed ? 2 : 6, x: 0, y: isPressed ? 1 : 3)
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isPressed)
            .contentShape(Rectangle())  // 전체 영역을 탭 가능하게 만듦
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            TapGesture()
                .onEnded { _ in
                    // 탭 제스처 인식 확인용 (디버그)
                }
        )
        .onLongPressGesture(minimumDuration: 0.05, maximumDistance: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
    }
}

// 리그 섹션 (접기/펼치기 가능)
struct LeagueSection: View {
    let league: CommunityLeagueInfo
    let boards: [CommunityBoard]
    let isExpanded: Bool
    let myTeamBoardId: String?
    let toggleExpanded: () -> Void
    
    @State private var animatedExpanded = false
    
    var body: some View {
        VStack(spacing: 0) {
            // 리그 헤더
            Button(action: {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8, blendDuration: 0)) {
                    toggleExpanded()
                }
            }) {
                HStack {
                    // 리그 로고
                    KFImage(URL(string: "https://media.api-sports.io/football/leagues/\(league.id).png"))
                        .placeholder {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 30, height: 30)
                        }
                        .resizable()
                        .scaledToFit()
                        .frame(width: 30, height: 30)
                        .clipped()
                    
                    Text(league.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Text("\(boards.count)팀")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .rotationEffect(.degrees(isExpanded ? 0 : -90))
                        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isExpanded)
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(Color.gray.opacity(0.05))
                .cornerRadius(10)
            }
            .buttonStyle(PlainButtonStyle())
            
            // 팀 목록 컨테이너
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(boards) { board in
                    TeamBoardGridItem(
                        board: board,
                        isMyTeam: board.id == myTeamBoardId
                    )
                    .opacity(isExpanded ? 1 : 0)
                    .scaleEffect(isExpanded ? 1 : 0.8)
                    .animation(
                        .spring(response: 0.35, dampingFraction: 0.8)
                            .delay(isExpanded ? Double(boards.firstIndex(where: { $0.id == board.id }) ?? 0) * 0.03 : 0),
                        value: isExpanded
                    )
                }
            }
            .padding(.top, isExpanded ? 12 : 0)
            .frame(maxHeight: isExpanded ? nil : 0)
            .clipped()
            .animation(.spring(response: 0.4, dampingFraction: 0.8), value: isExpanded)
        }
    }
}

// 팀 게시판 그리드 아이템
struct TeamBoardGridItem: View {
    let board: CommunityBoard
    var isMyTeam: Bool = false
    
    var body: some View {
        NavigationLink(destination: TeamBoardView(boardId: board.id, boardName: board.name, teamId: board.teamId)) {
            VStack(spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    KFImage(URL(string: board.iconUrl ?? ""))
                        .placeholder {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 50, height: 50)
                        }
                        .resizable()
                        .scaledToFit()
                        .frame(width: 50, height: 50)
                        .clipped()
                    
                    // 내 팀 표시
                    if isMyTeam {
                        Image(systemName: "star.fill")
                            .font(.caption)
                            .foregroundColor(.yellow)
                            .background(
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 20, height: 20)
                            )
                            .offset(x: 5, y: -5)
                    }
                }
                
                Text(board.name.replacingOccurrences(of: " 게시판", with: ""))
                    .font(.caption)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .fontWeight(isMyTeam ? .semibold : .regular)
                
                HStack(spacing: 8) {
                    Label("\(board.postCount)", systemImage: "doc.text")
                        .font(.caption2)
                    Label("\(board.memberCount)", systemImage: "person.2")
                        .font(.caption2)
                }
                .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(isMyTeam ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isMyTeam ? Color.blue.opacity(0.3) : Color.clear, lineWidth: 2)
            )
            .contentShape(Rectangle())  // 전체 영역을 탭 가능하게 만듦
        }
    }
}

// 선택된 팀 정보 카드
struct SelectedTeamInfoCard: View {
    let teamId: Int
    let teamName: String
    let teamProfile: TeamProfile?
    let teamStanding: TeamStanding?
    let teamFixtures: [Fixture]
    let onTeamChange: () -> Void
    @EnvironmentObject var viewModel: CommunityViewModel
    
    var body: some View {
        CompactTeamInfoCard(
            teamId: teamId,
            teamName: teamName,
            teamStanding: teamStanding,
            onTeamChange: onTeamChange
        )
    }
}

// 로딩 뷰
struct LoadingView: View {
    var body: some View {
        HStack {
            ProgressView()
                .scaleEffect(0.8)
            Text("팀 정보를 불러오는 중...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

// 컴팩트한 팀 정보 카드 - 감성적 요소 강화
struct CompactTeamInfoCard: View {
    let teamId: Int
    let teamName: String
    let teamStanding: TeamStanding?
    let onTeamChange: () -> Void
    
    @State private var isAnimating = false
    
    var emotionalData: TeamEmotionalData {
        TeamEmotionalDataService.shared.getEmotionalData(for: teamId) ??
        TeamEmotionalDataService.shared.getDefaultEmotionalData(teamId: teamId, teamName: teamName)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // 메인 팀 정보 섹션
            ZStack {
                // 배경 그라데이션
                LinearGradient(
                    colors: [
                        emotionalData.primaryColor.opacity(0.15),
                        emotionalData.primaryColor.opacity(0.05),
                        Color.clear
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                
                // 팀 로고 워터마크
                HStack {
                    Spacer()
                    KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 120)
                        .opacity(0.05)
                        .rotationEffect(.degrees(isAnimating ? 3 : -3))
                        .animation(
                            Animation.easeInOut(duration: 4)
                                .repeatForever(autoreverses: true),
                            value: isAnimating
                        )
                }
                
                VStack(spacing: 16) {
                    HStack(spacing: 16) {
                        // 팀 로고
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [emotionalData.primaryColor, emotionalData.primaryColor.opacity(0.8)],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                )
                                .frame(width: 70, height: 70)
                            
                            KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                                .placeholder {
                                    Circle()
                                        .fill(Color.white.opacity(0.3))
                                        .frame(width: 60, height: 60)
                                }
                                .resizable()
                                .scaledToFit()
                                .frame(width: 60, height: 60)
                                .clipShape(Circle())
                                .overlay(
                                    Circle()
                                        .stroke(Color.white, lineWidth: 2)
                                )
                                .shadow(color: emotionalData.primaryColor.opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                        
                        // 팀 정보
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 8) {
                                Text(teamName)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.primary)
                                
                                Text(emotionalData.emoji)
                                    .font(.title3)
                            }
                            
                            // 슬로건
                            Text(emotionalData.slogan)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(emotionalData.primaryColor)
                                .italic()
                        }
                        
                        Spacer()
                    }
                    
                    // 순위 및 통계
                    if let standing = teamStanding {
                        HStack(spacing: 20) {
                            // 순위 박스
                            VStack(spacing: 4) {
                                Text("순위")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                HStack(spacing: 4) {
                                    Image(systemName: "trophy.fill")
                                        .font(.caption)
                                        .foregroundColor(.orange)
                                    Text("\(standing.rank)")
                                        .font(.title3)
                                        .fontWeight(.bold)
                                }
                            }
                            .frame(minWidth: 60)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.orange.opacity(0.1))
                            )
                            
                            // 포인트 박스
                            VStack(spacing: 4) {
                                Text("승점")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                Text("\(standing.points)")
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundColor(emotionalData.primaryColor)
                            }
                            .frame(minWidth: 60)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(emotionalData.primaryColor.opacity(0.1))
                            )
                            
                            Spacer()
                            
                            // 최근 폼
                            if let form = standing.form {
                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("최근 5경기")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                    HStack(spacing: 3) {
                                        ForEach(Array(form.suffix(5)), id: \.self) { result in
                                            Circle()
                                                .fill(formColor(for: String(result)))
                                                .frame(width: 20, height: 20)
                                                .overlay(
                                                    Text(String(result))
                                                        .font(.caption2)
                                                        .fontWeight(.bold)
                                                        .foregroundColor(.white)
                                                )
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // 순위 정보 로딩 중 또는 불가능한 경우
                        HStack(spacing: 20) {
                            // 순위 박스 플레이스홀더
                            VStack(spacing: 4) {
                                Text("순위")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                HStack(spacing: 4) {
                                    Image(systemName: "trophy.fill")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                    Text("-")
                                        .font(.title3)
                                        .fontWeight(.bold)
                                        .foregroundColor(.gray)
                                }
                            }
                            .frame(minWidth: 60)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.gray.opacity(0.1))
                            )
                            
                            // 포인트 박스 플레이스홀더
                            VStack(spacing: 4) {
                                Text("승점")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                Text("-")
                                    .font(.title3)
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                            }
                            .frame(minWidth: 60)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.gray.opacity(0.1))
                            )
                            
                            Spacer()
                        }
                    }
                }
                .padding()
            }
            
            // 팬 응원 구호 섹션
            if let fanChant = emotionalData.fanChant {
                HStack {
                    Image(systemName: "megaphone.fill")
                        .font(.caption)
                        .foregroundColor(emotionalData.primaryColor)
                    
                    Text(fanChant)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(emotionalData.primaryColor)
                    
                    Spacer()
                    
                    Text(emotionalData.shortSlogan)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
                .background(emotionalData.primaryColor.opacity(0.05))
            }
        }
        .background(Color(.systemBackground))
        .onAppear {
            isAnimating = true
        }
    }
    
    func formColor(for result: String) -> Color {
        switch result {
        case "W": return .green
        case "D": return .orange
        case "L": return .red
        default: return .gray
        }
    }
}

// MARK: - 사용하지 않는 구조체들 (추후 구현 예정)
/*
// 팀 정보 컨텐츠
struct TeamInfoContent: View {
    let teamId: Int
    let teamName: String
    let teamProfile: TeamProfile?
    let teamStanding: TeamStanding?
    let teamFixtures: [Fixture]
    let onTeamChange: () -> Void
    @EnvironmentObject var viewModel: CommunityViewModel
    
    // 다음 경기 찾기
    var nextMatch: Fixture? {
        let now = Date()
        return teamFixtures.first { fixture in
            let dateString = fixture.fixture.date
            guard let fixtureDate = ISO8601DateFormatter().date(from: dateString) else { return false }
            return fixtureDate >= now
        }
    }
    
    // 과거 경기와 미래 경기 분리
    var pastMatches: [Fixture] {
        let now = Date()
        return teamFixtures.filter { fixture in
            let dateString = fixture.fixture.date
            guard let fixtureDate = ISO8601DateFormatter().date(from: dateString) else { return false }
            return fixtureDate < now
        }.sorted { fixture1, fixture2 in
            let date1 = ISO8601DateFormatter().date(from: fixture1.fixture.date) ?? Date()
            let date2 = ISO8601DateFormatter().date(from: fixture2.fixture.date) ?? Date()
            return date1 > date2
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // 팀 헤더 (배경색 있음)
            TeamHeaderView(
                teamId: teamId,
                teamName: teamName,
                teamProfile: teamProfile,
                teamStanding: teamStanding,
                onTeamChange: onTeamChange
            )
            .padding()
            .background(
                ZStack {
                    // 배경 그라데이션
                    LinearGradient(
                        colors: [getTeamColor(teamId).opacity(0.15), getTeamColor(teamId).opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    
                    // 팀 로고 워터마크
                    KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 120)
                        .opacity(0.05)
                        .offset(x: 120, y: -20)
                }
            )
            
            // 순위 및 통계 정보
            if let standing = teamStanding {
                TeamStatsView(standing: standing, teamProfile: teamProfile)
                    .padding()
                    .background(Color(.systemBackground))
            }
            
            // 다음 경기 정보
            if let nextMatch = nextMatch {
                NextMatchView(fixture: nextMatch, teamId: teamId)
                    .padding()
                    .background(Color.gray.opacity(0.05))
            }
            
            // 최근 경기 결과
            if !pastMatches.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("최근 경기")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        // 최근 5경기 폼
                        if let form = teamStanding?.form {
                            HStack(spacing: 4) {
                                ForEach(Array(form.suffix(5)), id: \.self) { result in
                                    CommunityFormIndicator(result: String(result))
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 12)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(pastMatches.prefix(5)) { fixture in
                                CommunityRecentMatchCard(fixture: fixture, teamId: teamId)
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.bottom, 12)
                }
                .background(Color.white)
            }
            
            // 주요 선수 정보는 추후 squad API 연동 시 추가 예정
            
            // 게시판 링크
            TeamBoardLinkView(teamId: teamId, teamName: teamName)
                .environmentObject(viewModel)
                .padding()
                .background(Color.gray.opacity(0.02))
        }
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.08), radius: 8, x: 0, y: 2)
    }
}
*/

// MARK: - 추가로 사용되는 구조체들

// 팀 헤더 뷰
struct TeamHeaderView: View {
    let teamId: Int
    let teamName: String
    let teamProfile: TeamProfile?
    let teamStanding: TeamStanding?
    let onTeamChange: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            // 팀 로고
            CommunityTeamLogoView(teamId: teamId)
            
            // 팀 정보
            TeamDetailsView(
                teamName: teamName,
                teamProfile: teamProfile,
                teamStanding: teamStanding
            )
            
            Spacer()
            
            // 팀 변경 버튼
            Button(action: onTeamChange) {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .foregroundColor(.blue)
                    .font(.system(size: 20))
            }
        }
    }
}

// 팀 로고 뷰 (커뮤니티용)
struct CommunityTeamLogoView: View {
    let teamId: Int
    
    var body: some View {
        KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
            .placeholder {
                Circle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 60, height: 60)
            }
            .resizable()
            .scaledToFit()
            .frame(width: 60, height: 60)
            .clipped()
    }
}

// 팀 상세 정보 뷰
struct TeamDetailsView: View {
    let teamName: String
    let teamProfile: TeamProfile?
    let teamStanding: TeamStanding?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(teamName)
                .font(.title2)
                .fontWeight(.bold)
            
            if let venue = teamProfile?.venue.name {
                Text(venue)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if let standing = teamStanding {
                StandingInfoView(standing: standing)
            }
        }
    }
}

// 순위 정보 뷰
struct StandingInfoView: View {
    let standing: TeamStanding
    
    var formColor: Color {
        switch standing.form?.last {
        case "W": return .green
        case "D": return .orange
        case "L": return .red
        default: return .gray
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // 순위 및 포인트
            HStack(spacing: 16) {
                HStack(spacing: 6) {
                    Image(systemName: "trophy.fill")
                        .foregroundColor(.orange)
                        .font(.system(size: 14))
                    Text("\(standing.rank)위")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                Text("•")
                    .foregroundColor(.secondary)
                
                Text("\(standing.points)점")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text("•")
                    .foregroundColor(.secondary)
                
                Text("\(standing.all.played)경기")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // 승무패 및 골득실
            HStack(spacing: 16) {
                // 승무패
                HStack(spacing: 4) {
                    Text("\(standing.all.win)")
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                    Text("승")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("\(standing.all.draw)")
                        .fontWeight(.semibold)
                        .foregroundColor(.orange)
                    Text("무")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("\(standing.all.lose)")
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                    Text("패")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Divider()
                    .frame(height: 16)
                
                // 골득실
                HStack(spacing: 8) {
                    HStack(spacing: 2) {
                        Text("득점")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text("\(standing.all.goals.for)")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    
                    HStack(spacing: 2) {
                        Text("실점")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text("\(standing.all.goals.against)")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    
                    if standing.goalsDiff > 0 {
                        Text("+\(standing.goalsDiff)")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    } else if standing.goalsDiff < 0 {
                        Text("\(standing.goalsDiff)")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.red)
                    } else {
                        Text("0")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // 최근 폼
            if let form = standing.form, !form.isEmpty {
                HStack(spacing: 4) {
                    Text("최근")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 2) {
                        ForEach(Array(form.suffix(5).enumerated()), id: \.offset) { index, result in
                            Circle()
                                .fill(getFormColor(result))
                                .frame(width: 16, height: 16)
                                .overlay(
                                    Text(String(result))
                                        .font(.system(size: 9, weight: .bold))
                                        .foregroundColor(.white)
                                )
                        }
                    }
                }
            }
        }
    }
    
    func getFormColor(_ result: Character) -> Color {
        switch result {
        case "W": return .green
        case "D": return .orange
        case "L": return .red
        default: return .gray
        }
    }
}

// 최근 경기 뷰 (커뮤니티용)
struct CommunityRecentMatchesView: View {
    let teamFixtures: [Fixture]
    let teamId: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("최근 경기")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(teamFixtures.prefix(5)) { fixture in
                        CommunityRecentMatchCard(fixture: fixture, teamId: teamId)
                    }
                }
            }
        }
    }
}

// 팀 게시판 링크 뷰
struct TeamBoardLinkView: View {
    let teamId: Int
    let teamName: String
    @EnvironmentObject var viewModel: CommunityViewModel
    
    private var teamBoard: CommunityBoard? {
        viewModel.myTeamBoard ?? viewModel.teamBoards.first { $0.teamId == teamId }
    }
    
    var body: some View {
        if let board = teamBoard {
            NavigationLink(destination: PostListView(boardId: board.id, boardName: board.name)) {
                HStack {
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                        .foregroundColor(.blue)
                    
                    Text("\(teamName) 게시판 바로가기")
                        .fontWeight(.medium)
                    
                    Spacer()
                    
                    Text("\(board.postCount)개 게시글")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(8)
            }
        }
    }
}

// 최근 경기 카드 (커뮤니티용)
// 다음 경기 뷰
struct NextMatchView: View {
    let fixture: Fixture
    let teamId: Int
    
    var isHomeTeam: Bool {
        fixture.teams.home.id == teamId
    }
    
    var opponent: Team {
        isHomeTeam ? fixture.teams.away : fixture.teams.home
    }
    
    var matchDate: Date? {
        let dateString = fixture.fixture.date
        return ISO8601DateFormatter().date(from: dateString)
    }
    
    var daysUntilMatch: Int? {
        guard let matchDate = matchDate else { return nil }
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: Date(), to: matchDate)
        return components.day
    }
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Text("다음 경기")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Spacer()
                
                if let days = daysUntilMatch {
                    if days == 0 {
                        Text("오늘")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color.red)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    } else if days == 1 {
                        Text("내일")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color.orange)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    } else {
                        Text("D-\(days)")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                }
            }
            
            HStack(spacing: 20) {
                // 홈팀
                VStack(spacing: 8) {
                    KFImage(URL(string: fixture.teams.home.logo))
                        .placeholder {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 50, height: 50)
                        }
                        .resizable()
                        .scaledToFit()
                        .frame(width: 50, height: 50)
                    
                    Text(fixture.teams.home.name)
                        .font(.caption)
                        .lineLimit(1)
                        .fontWeight(fixture.teams.home.id == teamId ? .bold : .regular)
                }
                .frame(maxWidth: .infinity)
                
                // VS 또는 시간
                VStack(spacing: 4) {
                    Text("VS")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.secondary)
                    
                    if let date = matchDate {
                        Text(date, style: .time)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // 원정팀
                VStack(spacing: 8) {
                    KFImage(URL(string: fixture.teams.away.logo))
                        .placeholder {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 50, height: 50)
                        }
                        .resizable()
                        .scaledToFit()
                        .frame(width: 50, height: 50)
                    
                    Text(fixture.teams.away.name)
                        .font(.caption)
                        .lineLimit(1)
                        .fontWeight(fixture.teams.away.id == teamId ? .bold : .regular)
                }
                .frame(maxWidth: .infinity)
            }
            
            // 경기장 정보
            if let venue = fixture.fixture.venue.name {
                HStack {
                    Image(systemName: "location.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(venue)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            
            // 리그 정보
            HStack {
                KFImage(URL(string: fixture.league.logo))
                    .placeholder {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: 20, height: 20)
                    }
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)
                
                Text(fixture.league.name)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text("• \(fixture.league.round)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color.blue.opacity(0.05))
        .cornerRadius(12)
    }
}

struct CommunityRecentMatchCard: View {
    let fixture: Fixture
    let teamId: Int
    
    var isHomeTeam: Bool {
        fixture.teams.home.id == teamId
    }
    
    var teamScore: Int? {
        isHomeTeam ? fixture.goals?.home : fixture.goals?.away
    }
    
    var opponentScore: Int? {
        isHomeTeam ? fixture.goals?.away : fixture.goals?.home
    }
    
    var opponent: Team {
        isHomeTeam ? fixture.teams.away : fixture.teams.home
    }
    
    var matchResult: String? {
        guard let teamScore = teamScore, let opponentScore = opponentScore else { return nil }
        if teamScore > opponentScore { return "W" }
        else if teamScore < opponentScore { return "L" }
        else { return "D" }
    }
    
    var resultColor: Color {
        switch matchResult {
        case "W": return .green
        case "L": return .red
        case "D": return .orange
        default: return .gray
        }
    }
    
    var body: some View {
        VStack(spacing: 4) {
            // 상대팀 로고
            KFImage(URL(string: opponent.logo))
                .placeholder {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 30, height: 30)
                }
                .resizable()
                .scaledToFit()
                .frame(width: 30, height: 30)
            
            // 스코어
            if let teamScore = teamScore, let opponentScore = opponentScore {
                Text("\(teamScore)-\(opponentScore)")
                    .font(.caption)
                    .fontWeight(.semibold)
            } else {
                Text("예정")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            // 결과
            if let result = matchResult {
                Text(result)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(resultColor)
                    .cornerRadius(4)
            }
        }
        .frame(width: 60)
        .padding(.vertical, 8)
        .background(Color.gray.opacity(0.05))
        .cornerRadius(8)
    }
}

// 팀 선택 뷰
struct TeamSelectionView: View {
    @ObservedObject var viewModel: CommunityViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedLeague = 39  // 기본값: 프리미어리그
    @State private var teams: [Team] = []
    @State private var isLoading = false
    @State private var isSelecting = false
    
    let leagues = [
        (id: 39, name: "프리미어리그"),
        (id: 140, name: "라리가"),
        (id: 78, name: "분데스리가"),
        (id: 135, name: "세리에 A"),
        (id: 61, name: "리그 1")
    ]
    
    var body: some View {
        NavigationStack {
            VStack {
                // 리그 선택
                Picker("리그 선택", selection: $selectedLeague) {
                    ForEach(leagues, id: \.id) { league in
                        Text(league.name).tag(league.id)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                // 팀 목록
                if isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else {
                    List(teams) { team in
                        Button {
                            Task {
                                isSelecting = true
                                print("🎯 팀 선택: \(team.name) (ID: \(team.id))")
                                
                                await viewModel.setFanTeamAsync(teamId: team.id)
                                
                                // 작업 완료 후 화면 닫기
                                await MainActor.run {
                                    isSelecting = false
                                    dismiss()
                                }
                            }
                        } label: {
                            HStack {
                                KFImage(URL(string: team.logo))
                                    .placeholder {
                                        Circle()
                                            .fill(Color.gray.opacity(0.3))
                                            .frame(width: 40, height: 40)
                                    }
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                                    .clipped()
                                
                                Text(team.name)
                                    .foregroundColor(.primary)
                                
                                Spacer()
                                
                                if viewModel.currentUserFanTeamId == team.id {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.blue)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        .disabled(isSelecting)
                    }
                }
            }
            .navigationTitle("팀 선택")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                    .disabled(isSelecting)
                }
            }
            .overlay {
                if isSelecting {
                    Color.black.opacity(0.5)
                        .ignoresSafeArea()
                        .overlay {
                            VStack(spacing: 16) {
                                ProgressView()
                                    .scaleEffect(1.5)
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                Text("팀 설정 중...")
                                    .foregroundColor(.white)
                                    .fontWeight(.medium)
                            }
                            .padding(40)
                            .background(Color.black.opacity(0.8))
                            .cornerRadius(20)
                        }
                }
            }
            .onAppear {
                loadTeams()
            }
            .onChange(of: selectedLeague) { oldValue, newValue in
                loadTeams()
            }
        }
    }
    
    private func loadTeams() {
        isLoading = true
        Task {
            do {
                // 순위 정보에서 팀 목록 추출
                let currentSeason = Calendar.current.component(.year, from: Date())
                let standings = try await FootballAPIService.shared.getStandings(leagueId: selectedLeague, season: currentSeason)
                let fetchedTeams = standings.map { standing in
                    Team(
                        id: standing.team.id,
                        name: standing.team.name,
                        logo: standing.team.logo,
                        winner: nil,
                        colors: nil
                    )
                }
                await MainActor.run {
                    self.teams = fetchedTeams
                    self.isLoading = false
                }
            } catch {
                print("Failed to load teams: \(error)")
                await MainActor.run {
                    self.teams = []
                    self.isLoading = false
                    
                    // 에러 발생 시 더미 데이터로 팀 목록 표시 (게시판과 동일한 팀 및 순서)
                    if selectedLeague == 39 { // 프리미어리그 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 33, name: "맨체스터 유나이티드", logo: "https://media.api-sports.io/football/teams/33.png", winner: nil, colors: nil),
                            Team(id: 40, name: "리버풀", logo: "https://media.api-sports.io/football/teams/40.png", winner: nil, colors: nil),
                            Team(id: 42, name: "아스널", logo: "https://media.api-sports.io/football/teams/42.png", winner: nil, colors: nil),
                            Team(id: 49, name: "첼시", logo: "https://media.api-sports.io/football/teams/49.png", winner: nil, colors: nil),
                            Team(id: 50, name: "맨체스터 시티", logo: "https://media.api-sports.io/football/teams/50.png", winner: nil, colors: nil),
                            Team(id: 47, name: "토트넘", logo: "https://media.api-sports.io/football/teams/47.png", winner: nil, colors: nil),
                            Team(id: 34, name: "뉴캐슬", logo: "https://media.api-sports.io/football/teams/34.png", winner: nil, colors: nil),
                            Team(id: 66, name: "아스톤 빌라", logo: "https://media.api-sports.io/football/teams/66.png", winner: nil, colors: nil),
                            Team(id: 48, name: "웨스트햄", logo: "https://media.api-sports.io/football/teams/48.png", winner: nil, colors: nil),
                            Team(id: 51, name: "브라이튼", logo: "https://media.api-sports.io/football/teams/51.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 140 { // 라리가 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 541, name: "레알 마드리드", logo: "https://media.api-sports.io/football/teams/541.png", winner: nil, colors: nil),
                            Team(id: 529, name: "바르셀로나", logo: "https://media.api-sports.io/football/teams/529.png", winner: nil, colors: nil),
                            Team(id: 530, name: "아틀레티코 마드리드", logo: "https://media.api-sports.io/football/teams/530.png", winner: nil, colors: nil),
                            Team(id: 536, name: "세비야", logo: "https://media.api-sports.io/football/teams/536.png", winner: nil, colors: nil),
                            Team(id: 532, name: "발렌시아", logo: "https://media.api-sports.io/football/teams/532.png", winner: nil, colors: nil),
                            Team(id: 533, name: "비야레알", logo: "https://media.api-sports.io/football/teams/533.png", winner: nil, colors: nil),
                            Team(id: 548, name: "레알 소시에다드", logo: "https://media.api-sports.io/football/teams/548.png", winner: nil, colors: nil),
                            Team(id: 543, name: "레알 베티스", logo: "https://media.api-sports.io/football/teams/543.png", winner: nil, colors: nil),
                            Team(id: 531, name: "아틀레틱 빌바오", logo: "https://media.api-sports.io/football/teams/531.png", winner: nil, colors: nil),
                            Team(id: 538, name: "셀타 비고", logo: "https://media.api-sports.io/football/teams/538.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 78 { // 분데스리가 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 157, name: "바이에른 뮌헨", logo: "https://media.api-sports.io/football/teams/157.png", winner: nil, colors: nil),
                            Team(id: 165, name: "보루시아 도르트문트", logo: "https://media.api-sports.io/football/teams/165.png", winner: nil, colors: nil),
                            Team(id: 168, name: "바이어 레버쿠젠", logo: "https://media.api-sports.io/football/teams/168.png", winner: nil, colors: nil),
                            Team(id: 173, name: "RB 라이프치히", logo: "https://media.api-sports.io/football/teams/173.png", winner: nil, colors: nil),
                            Team(id: 163, name: "보루시아 묀헨글라드바흐", logo: "https://media.api-sports.io/football/teams/163.png", winner: nil, colors: nil),
                            Team(id: 169, name: "아인트라흐트 프랑크푸르트", logo: "https://media.api-sports.io/football/teams/169.png", winner: nil, colors: nil),
                            Team(id: 161, name: "VfL 볼프스부르크", logo: "https://media.api-sports.io/football/teams/161.png", winner: nil, colors: nil),
                            Team(id: 172, name: "VfB 슈투트가르트", logo: "https://media.api-sports.io/football/teams/172.png", winner: nil, colors: nil),
                            Team(id: 178, name: "베르더 브레멘", logo: "https://media.api-sports.io/football/teams/178.png", winner: nil, colors: nil),
                            Team(id: 182, name: "우니온 베를린", logo: "https://media.api-sports.io/football/teams/182.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 135 { // 세리에 A - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 496, name: "유벤투스", logo: "https://media.api-sports.io/football/teams/496.png", winner: nil, colors: nil),
                            Team(id: 505, name: "인터", logo: "https://media.api-sports.io/football/teams/505.png", winner: nil, colors: nil),
                            Team(id: 489, name: "AC 밀란", logo: "https://media.api-sports.io/football/teams/489.png", winner: nil, colors: nil),
                            Team(id: 492, name: "나폴리", logo: "https://media.api-sports.io/football/teams/492.png", winner: nil, colors: nil),
                            Team(id: 497, name: "로마", logo: "https://media.api-sports.io/football/teams/497.png", winner: nil, colors: nil),
                            Team(id: 487, name: "라치오", logo: "https://media.api-sports.io/football/teams/487.png", winner: nil, colors: nil),
                            Team(id: 499, name: "아탈란타", logo: "https://media.api-sports.io/football/teams/499.png", winner: nil, colors: nil),
                            Team(id: 502, name: "피오렌티나", logo: "https://media.api-sports.io/football/teams/502.png", winner: nil, colors: nil),
                            Team(id: 503, name: "토리노", logo: "https://media.api-sports.io/football/teams/503.png", winner: nil, colors: nil),
                            Team(id: 495, name: "제노아", logo: "https://media.api-sports.io/football/teams/495.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 61 { // 리그 1 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 85, name: "파리 생제르맹", logo: "https://media.api-sports.io/football/teams/85.png", winner: nil, colors: nil),
                            Team(id: 80, name: "리옹", logo: "https://media.api-sports.io/football/teams/80.png", winner: nil, colors: nil),
                            Team(id: 81, name: "마르세유", logo: "https://media.api-sports.io/football/teams/81.png", winner: nil, colors: nil),
                            Team(id: 91, name: "모나코", logo: "https://media.api-sports.io/football/teams/91.png", winner: nil, colors: nil),
                            Team(id: 79, name: "릴", logo: "https://media.api-sports.io/football/teams/79.png", winner: nil, colors: nil),
                            Team(id: 84, name: "니스", logo: "https://media.api-sports.io/football/teams/84.png", winner: nil, colors: nil),
                            Team(id: 1063, name: "생테티엔", logo: "https://media.api-sports.io/football/teams/1063.png", winner: nil, colors: nil),
                            Team(id: 78, name: "보르도", logo: "https://media.api-sports.io/football/teams/78.png", winner: nil, colors: nil),
                            Team(id: 83, name: "낭트", logo: "https://media.api-sports.io/football/teams/83.png", winner: nil, colors: nil),
                            Team(id: 112, name: "스트라스부르", logo: "https://media.api-sports.io/football/teams/112.png", winner: nil, colors: nil)
                        ]
                    }
                }
            }
        }
    }
}

// MARK: - 추가 컴포넌트들

// 내 팀 게시판 카드
// 내 팀 게시판 카드 - 팬 감성 강화
struct MyTeamBoardCard: View {
    let board: CommunityBoard
    @State private var isPressed = false
    @State private var isAnimating = false
    
    var emotionalData: TeamEmotionalData? {
        guard let teamId = board.teamId else { return nil }
        return TeamEmotionalDataService.shared.getEmotionalData(for: teamId)
    }
    
    var body: some View {
        ZStack {
            // 배경 그라데이션
            if let emotionalData = emotionalData {
                LinearGradient(
                    colors: [
                        emotionalData.primaryColor.opacity(0.15),
                        emotionalData.primaryColor.opacity(0.05)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            } else {
                Color.blue.opacity(0.1)
            }
            
            VStack(spacing: 16) {
                HStack {
                    // 팀 로고 또는 아이콘
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        emotionalData?.primaryColor ?? .blue,
                                        (emotionalData?.primaryColor ?? .blue).opacity(0.7)
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 50, height: 50)
                        
                        if let teamId = board.teamId {
                            KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                                .resizable()
                                .scaledToFit()
                                .frame(width: 40, height: 40)
                                .clipShape(Circle())
                        } else {
                            Image(systemName: "star.fill")
                                .foregroundColor(.white)
                                .font(.title2)
                        }
                    }
                    .shadow(color: (emotionalData?.primaryColor ?? .blue).opacity(0.3), radius: 4, x: 0, y: 2)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 6) {
                            Text(board.name)
                                .font(.headline)
                                .fontWeight(.bold)
                            
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                                .scaleEffect(isAnimating ? 1.2 : 1.0)
                                .animation(
                                    Animation.easeInOut(duration: 0.8)
                                        .repeatForever(autoreverses: true),
                                    value: isAnimating
                                )
                        }
                        
                        Text("우리 팀 팬들만의 특별한 공간")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if let emotionalData = emotionalData {
                            Text(emotionalData.shortSlogan)
                                .font(.caption2)
                                .fontWeight(.medium)
                                .foregroundColor(emotionalData.primaryColor)
                                .italic()
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right.circle.fill")
                        .foregroundColor(emotionalData?.primaryColor ?? .blue)
                        .font(.title2)
                }
                
                Divider()
                    .background(Color.white.opacity(0.3))
                
                HStack(spacing: 24) {
                    HStack(spacing: 6) {
                        Image(systemName: "doc.text.fill")
                            .foregroundColor(emotionalData?.primaryColor ?? .blue)
                        Text("\(board.postCount)")
                            .fontWeight(.semibold)
                        Text("게시글")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 6) {
                        Image(systemName: "person.2.fill")
                            .foregroundColor(emotionalData?.primaryColor ?? .blue)
                        Text("\(board.memberCount)")
                            .fontWeight(.semibold)
                        Text("팬")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .font(.caption)
            }
            .padding()
        }
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    LinearGradient(
                        colors: [
                            (emotionalData?.primaryColor ?? .blue).opacity(0.5),
                            (emotionalData?.primaryColor ?? .blue).opacity(0.2)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 2
                )
        )
        .shadow(color: (emotionalData?.primaryColor ?? .blue).opacity(0.2), radius: 8, x: 0, y: 4)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isPressed)
        .onLongPressGesture(minimumDuration: 0.05, maximumDistance: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
        .contentShape(Rectangle())  // 전체 영역을 탭 가능하게 만듦
        .onAppear {
            isAnimating = true
        }
    }
}

// 전체 게시판 카드 - 역동적 디자인
struct AllBoardCard: View {
    let board: CommunityBoard
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            // 배경 그라데이션
            LinearGradient(
                colors: [
                    Color.green.opacity(0.15),
                    Color.blue.opacity(0.05)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // 배경 패턴
            GeometryReader { geometry in
                ForEach(0..<3) { index in
                    Image(systemName: "soccerball")
                        .font(.system(size: 40))
                        .foregroundColor(.white.opacity(0.05))
                        .position(
                            x: geometry.size.width * CGFloat(index + 1) / 4,
                            y: geometry.size.height * 0.5
                        )
                        .rotationEffect(.degrees(isAnimating ? 360 : 0))
                        .animation(
                            Animation.linear(duration: 20)
                                .repeatForever(autoreverses: false)
                                .delay(Double(index) * 2),
                            value: isAnimating
                        )
                }
            }
            
            VStack(spacing: 16) {
                HStack {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.green, Color.green.opacity(0.7)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 50, height: 50)
                        
                        Image(systemName: "globe")
                            .foregroundColor(.white)
                            .font(.title2)
                    }
                    .shadow(color: Color.green.opacity(0.3), radius: 4, x: 0, y: 2)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(board.name)
                            .font(.headline)
                            .fontWeight(.bold)
                        
                        Text("모든 축구 팬들이 함께하는 공간")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("축구의 열정을 나누다")
                            .font(.caption2)
                            .fontWeight(.medium)
                            .foregroundColor(.green)
                            .italic()
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right.circle.fill")
                        .foregroundColor(.green)
                        .font(.title2)
                }
                
                Divider()
                    .background(Color.white.opacity(0.3))
                
                HStack(spacing: 24) {
                    HStack(spacing: 6) {
                        Image(systemName: "doc.text.fill")
                            .foregroundColor(.green)
                        Text("\(board.postCount)")
                            .fontWeight(.semibold)
                        Text("게시글")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 6) {
                        Image(systemName: "person.2.fill")
                            .foregroundColor(.green)
                        Text("\(board.memberCount)")
                            .fontWeight(.semibold)
                        Text("팬")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .font(.caption)
            }
            .padding()
        }
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    LinearGradient(
                        colors: [Color.green.opacity(0.5), Color.blue.opacity(0.3)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 2
                )
        )
        .shadow(color: Color.green.opacity(0.2), radius: 8, x: 0, y: 4)
        .contentShape(Rectangle())  // 전체 영역을 탭 가능하게 만듦
        .onAppear {
            isAnimating = true
        }
    }
}

// 팀 통계 뷰
struct TeamStatsView: View {
    let standing: TeamStanding
    let teamProfile: TeamProfile?
    
    var body: some View {
        VStack(spacing: 16) {
            // 현재 시즌 통계
            HStack(spacing: 20) {
                CommunityStatItem(title: "순위", value: "\(standing.rank)위", color: .blue)
                CommunityStatItem(title: "승점", value: "\(standing.points)점", color: .green)
                CommunityStatItem(title: "경기수", value: "\(standing.all.played)경기", color: .orange)
                CommunityStatItem(title: "득실차", value: "\(standing.goalsDiff > 0 ? "+" : "")\(standing.goalsDiff)", color: standing.goalsDiff > 0 ? .green : .red)
            }
            
            Divider()
            
            // 승무패 통계
            HStack(spacing: 20) {
                VStack(spacing: 4) {
                    Text("\(standing.all.win)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                    Text("승")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(spacing: 4) {
                    Text("\(standing.all.draw)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.orange)
                    Text("무")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(spacing: 4) {
                    Text("\(standing.all.lose)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                    Text("패")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // 홈/원정 통계
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Image(systemName: "house.fill")
                            .font(.caption)
                            .foregroundColor(.blue)
                        Text("홈: \(standing.home.win)승 \(standing.home.draw)무 \(standing.home.lose)패")
                            .font(.caption)
                    }
                    HStack(spacing: 8) {
                        Image(systemName: "airplane")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text("원정: \(standing.away.win)승 \(standing.away.draw)무 \(standing.away.lose)패")
                            .font(.caption)
                    }
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
}

// 커뮤니티 통계 아이템
struct CommunityStatItem: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// 커뮤니티 폼 인디케이터
struct CommunityFormIndicator: View {
    let result: String
    
    var body: some View {
        Circle()
            .fill(formColor)
            .frame(width: 20, height: 20)
            .overlay(
                Text(result)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            )
    }
    
    var formColor: Color {
        switch result {
        case "W": return .green
        case "D": return .orange
        case "L": return .red
        default: return .gray
        }
    }
}

// 폼 결과 배지
struct FormResultBadge: View {
    let result: String
    
    var backgroundColor: Color {
        switch result {
        case "W": return .green
        case "D": return .orange
        case "L": return .red
        default: return .gray
        }
    }
    
    var body: some View {
        Text(result)
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundColor(.white)
            .frame(width: 20, height: 20)
            .background(
                Circle()
                    .fill(backgroundColor)
            )
    }
}

// 통합된 팀 게시판 카드 - 팀 정보와 게시판 입구를 하나로
struct UnifiedTeamBoardCard: View {
    let teamId: Int
    let teamName: String
    let teamProfile: TeamProfile?
    let teamStanding: TeamStanding?
    let board: CommunityBoard?
    let isLoading: Bool
    let onTeamChange: () -> Void
    @EnvironmentObject var viewModel: CommunityViewModel
    
    @State private var isAnimating = false
    @State private var showExpandedInfo = false
    
    var emotionalData: TeamEmotionalData {
        TeamEmotionalDataService.shared.getEmotionalData(for: teamId) ??
        TeamEmotionalDataService.shared.getDefaultEmotionalData(teamId: teamId, teamName: teamName)
    }
    
    var legendData: TeamLegendData? {
        TeamLegendDataService.shared.getLegendData(for: teamId)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            if let board = board {
                NavigationLink(destination: TeamBoardView(boardId: board.id, boardName: board.name, teamId: board.teamId)) {
                    mainContent
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                mainContent
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: emotionalData.primaryColor.opacity(0.1), radius: 10, x: 0, y: 5)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(emotionalData.primaryColor.opacity(0.2), lineWidth: 1)
        )
        .padding(.horizontal)
    }
    
    // 팀 로고 뷰
    private var teamLogoView: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [emotionalData.primaryColor.opacity(0.2), emotionalData.primaryColor.opacity(0.05)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: 80, height: 80)
            
            KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                .placeholder {
                    ProgressView()
                        .frame(width: 60, height: 60)
                }
                .resizable()
                .scaledToFit()
                .frame(width: 60, height: 60)
                .background(Circle().fill(Color.white))
                .clipShape(Circle())
                .shadow(color: emotionalData.primaryColor.opacity(0.3), radius: 5, x: 0, y: 2)
                .scaleEffect(isAnimating ? 1.05 : 1.0)
                .animation(
                    Animation.easeInOut(duration: 3)
                        .repeatForever(autoreverses: true),
                    value: isAnimating
                )
        }
    }
    
    private var mainContent: some View {
        VStack(spacing: 0) {
            // 메인 헤더 섹션
            HStack(spacing: 16) {
                // 팀 로고 (한 번만)
                teamLogoView
                
                // 팀 정보
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("\(teamName) 게시판")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        if !isLoading {
                            Text("🦁")
                                .font(.title3)
                        }
                    }
                    
                    Text(emotionalData.slogan)
                        .font(.subheadline)
                        .foregroundColor(emotionalData.primaryColor)
                        .italic()
                    
                    // 슬로건 아래에 팬 참여도 정보
                    if let board = board {
                        HStack(spacing: 12) {
                            Label("\(board.postCount)", systemImage: "doc.text.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Label("\(board.memberCount)", systemImage: "person.2.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            if legendData?.historicMoments.first != nil {
                                Text("Since \(legendData?.founded ?? 0)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                
                Spacer()
                
                // 팀 변경 버튼
                Button(action: onTeamChange) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.system(size: 16))
                        .foregroundColor(emotionalData.primaryColor)
                        .padding(8)
                        .background(
                            Circle()
                                .fill(emotionalData.primaryColor.opacity(0.1))
                        )
                }
            }
            .padding()
            
            // 구분선
            Divider()
                .padding(.horizontal)
            
            // 핵심 정보 섹션 (순위, 승점, 최근 폼)
            if !isLoading {
                HStack(spacing: 0) {
                    // 순위
                    VStack(spacing: 4) {
                        Text("순위")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        HStack(spacing: 2) {
                            Text("🏆")
                                .font(.caption)
                            Text("\(teamStanding?.rank ?? 0)")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    
                    Divider()
                        .frame(height: 40)
                    
                    // 승점
                    VStack(spacing: 4) {
                        Text("승점")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("\(teamStanding?.points ?? 0)")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(emotionalData.primaryColor)
                    }
                    .frame(maxWidth: .infinity)
                    
                    Divider()
                        .frame(height: 40)
                    
                    // 최근 5경기
                    VStack(spacing: 4) {
                        Text("최근 5경기")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if let form = teamStanding?.form {
                            HStack(spacing: 3) {
                                ForEach(Array(form.suffix(5)), id: \.self) { result in
                                    FormResultBadge(result: String(result))
                                }
                            }
                        } else {
                            Text("-")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding()
                .background(emotionalData.primaryColor.opacity(0.05))
            } else {
                // 로딩 상태
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("팀 정보를 불러오는 중...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
            }
            
            // 확장 가능한 추가 정보 (라이벌, 레전드 등)
            if showExpandedInfo {
                VStack(spacing: 12) {
                    Divider()
                        .padding(.horizontal)
                    
                    // 라이벌 정보
                    if let rivals = legendData?.rivals, !rivals.isEmpty {
                        HStack {
                            Text("Rivals")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            ForEach(rivals.prefix(2), id: \.teamId) { rival in
                                HStack(spacing: 4) {
                                    KFImage(URL(string: "https://media.api-sports.io/football/teams/\(rival.teamId).png"))
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 20, height: 20)
                                    
                                    Text("vs")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // 레전드 정보
                    if let legends = legendData?.legendaryPlayers, !legends.isEmpty {
                        HStack {
                            Text("Legends")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Text(legends.prefix(3).joined(separator: ", "))
                                .font(.caption)
                                .foregroundColor(.primary)
                                .lineLimit(1)
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.bottom, 12)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
            
            // 탭하여 게시판 입장 안내
            if board != nil {
                HStack {
                    Spacer()
                    
                    HStack(spacing: 4) {
                        Text("탭하여 게시판 입장")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .padding(.vertical, 8)
                .background(Color.gray.opacity(0.05))
            }
        }
        .onAppear {
            isAnimating = true
        }
        .onTapGesture {
            if board == nil {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    showExpandedInfo.toggle()
                }
            }
        }
    }
}

