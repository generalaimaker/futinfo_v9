import SwiftUI
import Kingfisher

// 간단한 Transfer 모델 정의
struct Transfer: Codable {
    let id: UUID
    let playerName: String
    let fromClub: String
    let toClub: String
    let transferFee: String
    let date: Date
    let type: TransferType
    let isRumour: Bool  // 루머 여부
    let probability: String?  // 루머 확률 (Transfermarkt)
    
    enum TransferType: Codable {
        case incoming  // 영입
        case outgoing  // 방출
    }
    
    // 기본 이니셜라이저 (확정 이적용)
    init(playerName: String, fromClub: String, toClub: String, transferFee: String, date: Date, type: TransferType) {
        self.id = UUID()
        self.playerName = playerName
        self.fromClub = fromClub
        self.toClub = toClub
        self.transferFee = transferFee
        self.date = date
        self.type = type
        self.isRumour = false
        self.probability = nil
    }
    
    // 루머용 이니셜라이저
    init(playerName: String, fromClub: String, toClub: String, transferFee: String, date: Date, type: TransferType, isRumour: Bool, probability: String? = nil) {
        self.id = UUID()
        self.playerName = playerName
        self.fromClub = fromClub
        self.toClub = toClub
        self.transferFee = transferFee
        self.date = date
        self.type = type
        self.isRumour = isRumour
        self.probability = probability
    }
}

// 팀별 게시판 내부 뷰 (팬 감성 극대화)
public struct TeamBoardView: View {
    let boardId: String
    let boardName: String
    let teamId: Int?
    
    @StateObject private var viewModel: PostListViewModel
    
    init(boardId: String, boardName: String, teamId: Int?) {
        self.boardId = boardId
        self.boardName = boardName
        self.teamId = teamId
        self._viewModel = StateObject(wrappedValue: PostListViewModel(boardId: boardId))
    }
    
    @State private var showingCreatePost = false
    @State private var selectedCategory = "all"
    @State private var showTeamAnthem = false
    @State private var pulseAnimation = false
    @State private var teamStanding: TeamStanding?
    @State private var upcomingFixtures: [Fixture] = []
    @State private var recentTransfers: [Transfer] = []
    @State private var isLoadingTeamInfo = false
    
    var emotionalData: TeamEmotionalData? {
        guard let teamId = teamId else { return nil }
        return TeamEmotionalDataService.shared.getEmotionalData(for: teamId)
    }
    
    var legendData: TeamLegendData? {
        guard let teamId = teamId else { return nil }
        return TeamLegendDataService.shared.getLegendData(for: teamId)
    }
    
    // 카테고리별로 필터링된 게시글
    var filteredPosts: [CommunityPost] {
        switch selectedCategory {
        case "match":
            // 경기 카테고리 게시글
            return viewModel.posts.filter { $0.category == "match" }
        case "transfer":
            // 이적 카테고리 게시글
            return viewModel.posts.filter { $0.category == "transfer" }
        case "news":
            // 뉴스 카테고리 게시글
            return viewModel.posts.filter { $0.category == "news" }
        case "talk":
            // 잡담 카테고리 게시글
            return viewModel.posts.filter { $0.category == "talk" }
        case "media":
            // 미디어 카테고리 게시글
            return viewModel.posts.filter { $0.category == "media" }
        default: // "all"
            return viewModel.posts
        }
    }
    
    // MARK: - View Components
    
    private var backgroundView: some View {
        Group {
            if let emotionalData = emotionalData {
                LinearGradient(
                    colors: [
                        emotionalData.primaryColor.opacity(0.05),
                        Color(.systemBackground)
                    ],
                    startPoint: .top,
                    endPoint: .center
                )
                .ignoresSafeArea()
            }
        }
    }
    
    private var headerSection: some View {
        Group {
            if let teamId = teamId {
                TeamBoardHeaderView(
                    teamId: teamId,
                    emotionalData: emotionalData,
                    legendData: legendData,
                    showAnthem: $showTeamAnthem
                )
            }
        }
    }
    
    private var categoryFilterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(teamBoardCategories, id: \.id) { category in
                    TeamBoardCategoryChip(
                        category: category,
                        isSelected: selectedCategory == category.id,
                        teamColor: emotionalData?.primaryColor ?? .blue
                    ) {
                        selectedCategory = category.id
                    }
                }
            }
            .padding(.horizontal)
        }
    }
    
    private var specialMatchesSection: some View {
        Group {
            if let rivals = legendData?.rivals, !rivals.isEmpty {
                SpecialMatchSection(
                    teamId: teamId ?? 0,
                    rivals: rivals,
                    teamColor: emotionalData?.primaryColor ?? .blue
                )
            }
        }
    }
    
    private var teamInfoSection: some View {
        VStack(spacing: 16) {
            // 팀 순위 & 다음 경기
            HStack(spacing: 12) {
                // 팀 순위 카드
                TeamRankingCard(
                    teamStanding: teamStanding,
                    teamColor: emotionalData?.primaryColor ?? .blue
                )
                
                // 다음 경기 카드 - 클릭 시 경기 상세 페이지로 이동
                if let nextFixture = upcomingFixtures.first {
                    NavigationLink(destination: FixtureDetailView(fixture: nextFixture)) {
                        NextMatchCard(
                            fixture: nextFixture,
                            teamId: teamId ?? 0,
                            teamColor: emotionalData?.primaryColor ?? .blue
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                } else {
                    NextMatchCard(
                        fixture: nil,
                        teamId: teamId ?? 0,
                        teamColor: emotionalData?.primaryColor ?? .blue
                    )
                }
            }
            .padding(.horizontal)
            
            // 최근 이적 섹션
            if !recentTransfers.isEmpty {
                RecentTransfersSection(
                    transfers: recentTransfers,
                    teamId: teamId ?? 0,
                    teamName: boardName.replacingOccurrences(of: " 게시판", with: ""),
                    teamColor: emotionalData?.primaryColor ?? .blue
                )
            } else if isLoadingTeamInfo {
                // 로딩 중 표시
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("이적 정보 로드 중...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(12)
                .padding(.horizontal)
            } else {
                // 이적 정보가 없을 때
                VStack(spacing: 8) {
                    Image(systemName: "arrow.left.arrow.right.circle")
                        .font(.system(size: 40))
                        .foregroundColor(.gray.opacity(0.3))
                    Text("최근 이적 정보가 없습니다")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(12)
                .padding(.horizontal)
            }
        }
    }
    
    private var postsSection: some View {
        VStack {
            if filteredPosts.isEmpty {
                // 필터링된 게시글이 없을 때
                VStack(spacing: 16) {
                    Image(systemName: categoryEmptyIcon)
                        .font(.system(size: 60))
                        .foregroundColor(.gray.opacity(0.3))
                    
                    Text(categoryEmptyMessage)
                        .font(.headline)
                        .foregroundColor(.secondary)
                    
                    Text(categoryEmptyDescription)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.vertical, 60)
                .frame(maxWidth: .infinity)
            } else {
                LazyVStack(spacing: 12) {
                    ForEach(filteredPosts) { post in
                        NavigationLink(destination: PostDetailView(postId: post.id)) {
                            EnhancedPostCard(
                                post: post,
                                teamColor: emotionalData?.primaryColor ?? .blue,
                                isTeamBoard: true
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal)
            }
        }
    }
    
    // 카테고리별 빈 상태 아이콘
    private var categoryEmptyIcon: String {
        switch selectedCategory {
        case "match": return "sportscourt"
        case "transfer": return "arrow.left.arrow.right.circle"
        case "news": return "newspaper"
        case "talk": return "bubble.left.and.bubble.right"
        case "media": return "photo.on.rectangle"
        default: return "doc.text"
        }
    }
    
    // 카테고리별 빈 상태 메시지
    private var categoryEmptyMessage: String {
        switch selectedCategory {
        case "match": return "경기 관련 게시글이 없습니다"
        case "transfer": return "이적 관련 게시글이 없습니다"
        case "news": return "뉴스 게시글이 없습니다"
        case "talk": return "잡담 게시글이 없습니다"
        case "media": return "미디어 게시글이 없습니다"
        default: return "게시글이 없습니다"
        }
    }
    
    // 카테고리별 빈 상태 설명
    private var categoryEmptyDescription: String {
        switch selectedCategory {
        case "match": return "경기 결과나 분석을 공유해보세요"
        case "transfer": return "이적 소식을 공유해보세요"
        case "news": return "팀 관련 뉴스를 공유해보세요"
        case "talk": return "자유롭게 대화를 나눠보세요"
        case "media": return "사진이나 영상을 공유해보세요"
        default: return "첫 번째 게시글을 작성해보세요"
        }
    }
    
    private var floatingActionButton: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                
                Button {
                    showingCreatePost = true
                } label: {
                    ZStack {
                        Circle()
                            .fill(emotionalData?.primaryColor ?? .blue)
                            .frame(width: 60, height: 60)
                            .shadow(color: (emotionalData?.primaryColor ?? .blue).opacity(0.5), radius: 10, x: 0, y: 5)
                        
                        Image(systemName: "pencil")
                            .font(.title2)
                            .foregroundColor(.white)
                    }
                }
                .scaleEffect(pulseAnimation ? 1.1 : 1.0)
                .animation(
                    Animation.easeInOut(duration: 1.0)
                        .repeatForever(autoreverses: true),
                    value: pulseAnimation
                )
                .padding()
            }
        }
    }
    
    public var body: some View {
        ZStack {
            backgroundView
            
            ScrollView {
                VStack(spacing: 20) {
                    headerSection
                    
                    // 팀 정보 섹션 추가
                    if teamId != nil {
                        teamInfoSection
                    }
                    
                    categoryFilterSection
                    specialMatchesSection
                    postsSection
                }
            }
            
            floatingActionButton
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                HStack(spacing: 8) {
                    if let teamId = teamId {
                        KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                            .resizable()
                            .scaledToFit()
                            .frame(width: 30, height: 30)
                    }
                    Text(boardName)
                        .font(.headline)
                        .foregroundColor(emotionalData?.primaryColor ?? .primary)
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showTeamAnthem.toggle()
                } label: {
                    Image(systemName: "music.note")
                        .foregroundColor(emotionalData?.primaryColor ?? .blue)
                }
            }
        }
        .sheet(isPresented: $showingCreatePost) {
            CreatePostView(boardId: boardId) { _ in
                // 게시글 작성 후 목록 새로고침
                viewModel.loadPosts()
            }
        }
        .sheet(isPresented: $showTeamAnthem) {
            if let emotionalData = emotionalData, let legendData = legendData {
                TeamAnthemView(
                    teamName: boardName.replacingOccurrences(of: " 게시판", with: ""),
                    emotionalData: emotionalData,
                    legendData: legendData
                )
            }
        }
        .onAppear {
            pulseAnimation = true
            viewModel.loadPosts()
            if let teamId = teamId {
                Task {
                    // 최적화된 로딩 사용
                    await loadTeamInfoOptimized(teamId: teamId)
                }
            }
        }
    }
    
    @MainActor
    private func loadTeamInfoOptimized(teamId: Int) async {
        isLoadingTeamInfo = true
        
        do {
            print("🚀 최적화된 팀 정보 로드 시작 - teamId: \(teamId)")
            
            // 새로운 캐시 서비스 사용
            let teamData = try await TeamBoardCacheService.shared.loadTeamBoardData(teamId: teamId)
            
            // UI 업데이트
            await MainActor.run {
                self.teamStanding = teamData.teamStanding
                self.upcomingFixtures = teamData.upcomingFixtures
                self.recentTransfers = teamData.recentTransfers
                
                print("✅ 팀 \(teamId) 정보 로드 완료")
                if let standing = teamData.teamStanding {
                    print("  - 순위: \(standing.rank)위")
                }
                print("  - 다음 경기: \(teamData.upcomingFixtures.count)개")
                print("  - 최근 이적: \(teamData.recentTransfers.count)개")
            }
            
        } catch {
            print("❌ 최적화된 팀 정보 로드 실패: \(error)")
            
            // 기존 방식으로 폴백 (간소화)
            await loadTeamInfoFallback(teamId: teamId)
        }
        
        self.isLoadingTeamInfo = false
    }
    
    @MainActor
    private func loadTeamInfoFallback(teamId: Int) async {
        print("🔄 폴백 모드로 팀 정보 로드")
        
        // 기본적인 오류 복구 로직만 유지
        do {
            if let leagueId = getLeagueId(for: teamId) {
                let season = getCurrentSeasonForTeamBoard()
                let standings = try await SupabaseFootballAPIService.shared.getStandings(leagueId: leagueId, season: season)
                
                if let standing = standings.first(where: { $0.team.id == teamId }) {
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
                            goals: TeamGoals(for: standing.all.goals.goalsFor, against: standing.all.goals.goalsAgainst)
                        ),
                        home: TeamStats(
                            played: standing.home.played,
                            win: standing.home.win,
                            draw: standing.home.draw,
                            lose: standing.home.lose,
                            goals: TeamGoals(for: standing.home.goals.goalsFor, against: standing.home.goals.goalsAgainst)
                        ),
                        away: TeamStats(
                            played: standing.away.played,
                            win: standing.away.win,
                            draw: standing.away.draw,
                            lose: standing.away.lose,
                            goals: TeamGoals(for: standing.away.goals.goalsFor, against: standing.away.goals.goalsAgainst)
                        ),
                        update: standing.update
                    )
                    
                    self.teamStanding = teamStanding
                    print("✅ 폴백: 팀 순위 정보 설정 완료")
                }
            }
        } catch {
            print("❌ 폴백 모드도 실패: \(error)")
        }
    }
    
    // 하이브리드 이적 데이터 로드 (API-Football + Transfermarkt)
    private func loadHybridTransferData(for teamId: Int) async {
        var allTransfers: [Transfer] = []
        
        // 2024 시즌 이적만 표시 (2023년 7월부터)
        let seasonStart = ISO8601DateFormatter().date(from: "2023-07-01T00:00:00Z") ?? Date()
        
        print("💰 이적 데이터 로드 시작 - teamId: \(teamId)")
        
        // 캐시 확인
        let cacheKey = "transfers_\(teamId)_2024"
        if let cachedData = UserDefaults.standard.data(forKey: cacheKey),
           let cachedTransfers = try? JSONDecoder().decode([Transfer].self, from: cachedData) {
            // 캐시가 48시간 이내면 사용
            if let cacheDate = UserDefaults.standard.object(forKey: "\(cacheKey)_date") as? Date,
               Date().timeIntervalSince(cacheDate) < 48 * 60 * 60 {
                await MainActor.run {
                    self.recentTransfers = Array(cachedTransfers.prefix(5))
                    print("✅ 캐시된 이적 데이터 사용: \(self.recentTransfers.count)개")
                }
                return
            }
        }
        
        // 1. FootballAPIService를 먼저 사용 (Supabase 경유)
        do {
            print("🔄 FootballAPIService로 이적 데이터 조회 시작 - 팀ID: \(teamId)")
            let apiTransfers = try await FootballAPIService.shared.getTeamTransfers(teamId: teamId)
            
            for apiTransfer in apiTransfers {
                guard let playerName = apiTransfer.playerName,
                      let dateString = apiTransfer.date,
                      let date = ISO8601DateFormatter().date(from: dateString) else { continue }
                
                guard date > seasonStart else { continue }
                
                let isIncoming = apiTransfer.teams.in.id == teamId
                let fromClub = isIncoming ? apiTransfer.teams.out.name : apiTransfer.teams.in.name
                let toClub = isIncoming ? apiTransfer.teams.in.name : apiTransfer.teams.out.name
                let fee = formatTransferFee(apiTransfer.type)
                
                let transfer = Transfer(
                    playerName: playerName,
                    fromClub: fromClub,
                    toClub: toClub,
                    transferFee: fee,
                    date: date,
                    type: isIncoming ? .incoming : .outgoing
                )
                allTransfers.append(transfer)
            }
            print("✅ FootballAPIService 이적 데이터: \(allTransfers.count)개")
        } catch {
            print("⚠️ FootballAPIService 실패: \(error)")
            
            // 실패 시 직접 API 호출
            do {
                var urlComponents = URLComponents(string: "https://api-football-v1.p.rapidapi.com/v3/transfers")!
            urlComponents.queryItems = [
                URLQueryItem(name: "team", value: String(teamId)),
                URLQueryItem(name: "season", value: String(Date().getCurrentSeason()))
            ]
            
            var request = URLRequest(url: urlComponents.url!)
            // 다른 API 키 시도
            request.setValue("bb6e5ca6dcmsh723075a972b7313p16b9c8jsn1a3f8a7c3a97", forHTTPHeaderField: "x-rapidapi-key")
            request.setValue("api-football-v1.p.rapidapi.com", forHTTPHeaderField: "x-rapidapi-host")
            request.timeoutInterval = 30
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FootballAPIError.invalidResponse
            }
            
            if httpResponse.statusCode == 200 {
                // API 응답 구조체 정의 (FootballAPIService와 동일)
                struct APIResponse: Codable {
                    let response: [TransferData]
                }
                
                struct TransferData: Codable {
                    let player: TransferPlayer
                    let update: String
                    let transfers: [APITransfer]
                }
                
                struct TransferPlayer: Codable {
                    let id: Int
                    let name: String
                }
                
                let decoder = JSONDecoder()
                let transfersResponse = try decoder.decode(APIResponse.self, from: data)
                
                print("✅ Direct API 응답: \(transfersResponse.response.count)개 선수의 이적 데이터")
                
                // TransferData를 Transfer로 변환 (각 선수의 모든 이적 기록 포함)
                for transferData in transfersResponse.response {
                    let playerName = transferData.player.name
                    
                    for apiTransfer in transferData.transfers {
                        guard let dateString = apiTransfer.date,
                              let date = ISO8601DateFormatter().date(from: dateString) else { continue }
                    
                        // 시즌 이전 이적은 제외
                        guard date > seasonStart else {
                            print("⏩ 시즌 이전 이적 제외: \(playerName) - \(dateString)")
                            continue
                        }
                        
                        let isIncoming = apiTransfer.teams.in.id == teamId
                        let fromClub = isIncoming ? apiTransfer.teams.out.name : apiTransfer.teams.in.name
                        let toClub = isIncoming ? apiTransfer.teams.in.name : apiTransfer.teams.out.name
                        
                        // 이적료 포맷팅
                        let fee = formatTransferFee(apiTransfer.type)
                        
                        let transfer = Transfer(
                            playerName: playerName,
                            fromClub: fromClub,
                            toClub: toClub,
                            transferFee: fee,
                            date: date,
                            type: isIncoming ? .incoming : .outgoing
                        )
                        
                        allTransfers.append(transfer)
                    }
                }
                
                print("✅ API-Football 최근 확정 이적: \(allTransfers.count)개")
            } else if httpResponse.statusCode == 403 {
                print("❌ Direct API 403 에러 - API 키 문제 또는 Rate Limit")
                // 403 에러 시 기존 FootballAPIService 사용
                do {
                    let apiTransfers = try await FootballAPIService.shared.getTeamTransfers(teamId: teamId)
                    for apiTransfer in apiTransfers {
                        guard let playerName = apiTransfer.playerName,
                              let dateString = apiTransfer.date,
                              let date = ISO8601DateFormatter().date(from: dateString) else { continue }
                        
                        guard date > seasonStart else { continue }
                        
                        let isIncoming = apiTransfer.teams.in.id == teamId
                        let fromClub = isIncoming ? apiTransfer.teams.out.name : apiTransfer.teams.in.name
                        let toClub = isIncoming ? apiTransfer.teams.in.name : apiTransfer.teams.out.name
                        let fee = formatTransferFee(apiTransfer.type)
                        
                        let transfer = Transfer(
                            playerName: playerName,
                            fromClub: fromClub,
                            toClub: toClub,
                            transferFee: fee,
                            date: date,
                            type: isIncoming ? .incoming : .outgoing
                        )
                        allTransfers.append(transfer)
                    }
                    print("✅ FootballAPIService로 대체 로드: \(allTransfers.count)개")
                } catch {
                    print("⚠️ FootballAPIService도 실패: \(error)")
                }
            } else {
                print("❌ Direct API 오류: HTTP \(httpResponse.statusCode)")
            }
        } catch {
            print("⚠️ Direct API 이적 데이터 로드 실패: \(error)")
            // 실패 시 FootballAPIService 사용
            do {
                let apiTransfers = try await FootballAPIService.shared.getTeamTransfers(teamId: teamId)
                for apiTransfer in apiTransfers {
                    guard let playerName = apiTransfer.playerName,
                          let dateString = apiTransfer.date,
                          let date = ISO8601DateFormatter().date(from: dateString) else { continue }
                    
                    guard date > seasonStart else { continue }
                    
                    let isIncoming = apiTransfer.teams.in.id == teamId
                    let fromClub = isIncoming ? apiTransfer.teams.out.name : apiTransfer.teams.in.name
                    let toClub = isIncoming ? apiTransfer.teams.in.name : apiTransfer.teams.out.name
                    let fee = formatTransferFee(apiTransfer.type)
                    
                    let transfer = Transfer(
                        playerName: playerName,
                        fromClub: fromClub,
                        toClub: toClub,
                        transferFee: fee,
                        date: date,
                        type: isIncoming ? .incoming : .outgoing
                    )
                    allTransfers.append(transfer)
                }
                print("✅ FootballAPIService로 대체 로드: \(allTransfers.count)개")
            } catch {
                print("⚠️ FootballAPIService도 실패: \(error)")
            }
        }
        
        // 2. Transfermarkt에서 루머 추가 (무료 구독 활용)
        if allTransfers.count < 5 {
            // 2초 대기 후 호출하여 Rate Limit 회피
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            
            do {
                let rumours = try await TransfermarktAPIService.shared.getTransferRumours(for: teamId)
                let transferRumours = rumours.compactMap { rumour -> Transfer? in
                    // 루머 데이터를 Transfer 객체로 변환
                    guard let playerName = rumour.playerName ?? rumour.player_name,
                          let dateString = rumour.date,
                          let date = ISO8601DateFormatter().date(from: dateString) ?? 
                                   parseTransfermarktDate(dateString),
                          date > seasonStart else { return nil }
                    
                    let fromClub = rumour.fromClubName ?? rumour.from_club_name ?? "Unknown"
                    let toClub = rumour.toClubName ?? rumour.to_club_name ?? "Unknown"
                    
                    // 이 팀과 관련된 루머인지 확인
                    let isIncoming = rumour.toClubID == String(teamId) || 
                                   toClub.lowercased().contains(getTeamName(for: teamId).lowercased())
                    let isOutgoing = rumour.fromClubID == String(teamId) || 
                                   fromClub.lowercased().contains(getTeamName(for: teamId).lowercased())
                    
                    guard isIncoming || isOutgoing else { return nil }
                    
                    let transferFee = rumour.transferSum ?? rumour.transfer_sum ?? rumour.transfer_fee ?? "루머"
                    
                    return Transfer(
                        playerName: playerName,
                        fromClub: fromClub,
                        toClub: toClub,
                        transferFee: transferFee,
                        date: date,
                        type: isIncoming ? .incoming : .outgoing,
                        isRumour: true
                    )
                }.filter { rumour in
                    // 중복 제거
                    !allTransfers.contains { $0.playerName == rumour.playerName }
                }
                
                allTransfers.append(contentsOf: transferRumours)
                print("✅ Transfermarkt 이적 루머 추가: \(transferRumours.count)개")
                
            } catch {
                // 에러 발생 시 조용히 실패 (사용자 경험 저해 방지)
                print("⚠️ Transfermarkt API 호출 실패 (무시됨): \(error)")
            }
        }
        
        // 3. 날짜순 정렬 후 최대 5개만 표시
        let sortedTransfers = allTransfers.sorted { $0.date > $1.date }
        
        await MainActor.run {
            if sortedTransfers.isEmpty {
                // 최근 이적이 없을 경우 빈 배열 유지
                self.recentTransfers = []
                print("ℹ️ 팀ID \(teamId): 이번 시즌 이적 정보가 없습니다.")
            } else {
                self.recentTransfers = Array(sortedTransfers.prefix(5))
                print("📊 팀ID \(teamId) 최종 이적 데이터: \(self.recentTransfers.count)개")
                for transfer in self.recentTransfers {
                    print("  - \(transfer.playerName): \(transfer.fromClub) → \(transfer.toClub) (\(transfer.transferFee))")
                }
                
                // 캐시 저장
                if let encoded = try? JSONEncoder().encode(sortedTransfers) {
                    UserDefaults.standard.set(encoded, forKey: cacheKey)
                    UserDefaults.standard.set(Date(), forKey: "\(cacheKey)_date")
                    print("💾 이적 데이터 캐시 저장 완료")
                }
            }
        }
    }
    }
    
    // Transfermarkt 날짜 파싱 헬퍼 함수
    private func parseTransfermarktDate(_ dateString: String) -> Date? {
        let dateFormatters = [
            "yyyy-MM-dd",
            "dd/MM/yyyy",
            "dd.MM.yyyy",
            "MMM dd, yyyy",
            "dd MMM yyyy"
        ]
        
        for format in dateFormatters {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            formatter.locale = Locale(identifier: "en_US_POSIX")
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        return nil
    }
    
    // 이적료 포맷팅 헬퍼 함수
    private func formatTransferFee(_ type: String?) -> String {
        guard let type = type else { return "비공개" }
        
        if type == "N/A" || type.isEmpty {
            return "자유이적"
        } else if type.contains("€") {
            return type
        } else if type.contains("loan") || type.lowercased().contains("loan") {
            return "임대"
        } else {
            return type
        }
    }
    
    private func getRivalTeamId(for teamId: Int) -> Int {
        switch teamId {
        case 47: return 42  // Tottenham vs Arsenal
        case 42: return 47  // Arsenal vs Tottenham
        case 49: return 50  // Chelsea vs Man City
        case 50: return 33  // Man City vs Man United
        case 33: return 40  // Man United vs Liverpool
        case 40: return 51  // Liverpool vs Brighton
        default: return 50  // Default to Man City
        }
    }
    
    private func getStadiumName(for teamId: Int) -> String {
        switch teamId {
        case 47: return "Tottenham Hotspur Stadium"
        case 49: return "Stamford Bridge"
        case 50: return "Etihad Stadium"
        case 42: return "Emirates Stadium"
        case 40: return "Anfield"
        case 33: return "Old Trafford"
        default: return "Stadium"
        }
    }
    
    private func getCity(for teamId: Int) -> String {
        switch teamId {
        case 47, 49, 42: return "London"
        case 50, 33: return "Manchester"
        case 40: return "Liverpool"
        default: return "City"
        }
    }
    
    private func getLeagueName(for teamId: Int) -> String {
        switch teamId {
        case 33, 40, 42, 47, 49, 50, 34, 48, 51, 66: return "Premier League"
        case 541, 529, 530: return "La Liga"
        case 157, 165, 168: return "Bundesliga"
        case 85, 91, 81: return "Ligue 1"
        case 496, 505, 489: return "Serie A"
        default: return "League"
        }
    }
    
    private func getCountry(for teamId: Int) -> String {
        switch teamId {
        case 33, 40, 42, 47, 49, 50, 34, 48, 51, 66: return "England"
        case 541, 529, 530: return "Spain"
        case 157, 165, 168: return "Germany"
        case 85, 91, 81: return "France"
        case 496, 505, 489: return "Italy"
        default: return "Country"
        }
    }
    
    private func getLeagueId(for teamId: Int) -> Int? {
        let teamLeagueMapping: [Int: Int] = [
            // Premier League
            33: 39, 40: 39, 42: 39, 47: 39, 49: 39, 50: 39,
            34: 39, 48: 39, 51: 39, 66: 39, // More PL teams
            // La Liga
            529: 140, 530: 140, 541: 140,
            // Serie A
            489: 135, 496: 135, 505: 135,
            // Bundesliga
            157: 78, 165: 78, 168: 78,
            // Ligue 1
            85: 61, 91: 61, 81: 61
        ]
        return teamLeagueMapping[teamId]
    }
    
    private func getTeamName(for teamId: Int) -> String {
        let teamNames: [Int: String] = [
            33: "Manchester United",
            40: "Liverpool",
            42: "Arsenal",
            47: "Tottenham",
            49: "Chelsea",
            50: "Manchester City",
            529: "Barcelona",
            530: "Atletico Madrid",
            541: "Real Madrid",
            489: "AC Milan",
            496: "Juventus",
            505: "Inter",
            157: "Bayern Munich",
            165: "Borussia Dortmund",
            85: "Paris Saint Germain"
        ]
        return teamNames[teamId] ?? "Team"
    }
    
    private func getCurrentSeasonForTeamBoard() -> Int {
        let calendar = Calendar.current
        let now = Date()
        let month = calendar.component(.month, from: now)
        let year = calendar.component(.year, from: now)
        
        return month >= 7 ? year : year - 1
    }
}

// 팀 게시판 헤더
struct TeamBoardHeaderView: View {
    let teamId: Int
    let emotionalData: TeamEmotionalData?
    let legendData: TeamLegendData?
    @Binding var showAnthem: Bool
    
    @State private var animateHeader = false
    
    var body: some View {
        VStack(spacing: 16) {
            // 경기장 배경 이미지 (플레이스홀더)
            ZStack {
                // 그라데이션 배경
                LinearGradient(
                    colors: [
                        emotionalData?.primaryColor ?? .blue,
                        (emotionalData?.primaryColor ?? .blue).opacity(0.7)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(height: 200)
                
                // 경기장 패턴
                if let pattern = legendData?.specialPattern {
                    TeamPatternBackground(pattern: pattern)
                        .opacity(0.3)
                }
                
                // 팀 정보
                VStack(spacing: 12) {
                    // 팀 로고
                    KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                        .resizable()
                        .scaledToFit()
                        .frame(width: 80, height: 80)
                        .background(
                            Circle()
                                .fill(Color.white)
                                .frame(width: 90, height: 90)
                        )
                        .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
                        .scaleEffect(animateHeader ? 1.1 : 1.0)
                        .animation(
                            Animation.easeInOut(duration: 2)
                                .repeatForever(autoreverses: true),
                            value: animateHeader
                        )
                    
                    // 슬로건
                    if let slogan = emotionalData?.slogan {
                        Text(slogan)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 1)
                    }
                    
                    // 경기장 정보
                    if let stadium = legendData?.stadiumName {
                        Label(stadium, systemImage: "sportscourt.fill")
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.9))
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .padding(.horizontal)
            
            // 빠른 통계
            if let legendData = legendData {
                HStack(spacing: 20) {
                    QuickStat(
                        title: "Since",
                        value: "\(legendData.founded)",
                        icon: "calendar",
                        color: emotionalData?.primaryColor ?? .blue
                    )
                    
                    QuickStat(
                        title: "Trophies",
                        value: "\(legendData.trophyEmojis.count/2)",
                        icon: "trophy.fill",
                        color: .yellow
                    )
                    
                    QuickStat(
                        title: "Legends",
                        value: "\(legendData.legendaryPlayers.count)",
                        icon: "star.fill",
                        color: .orange
                    )
                    
                    Button {
                        showAnthem.toggle()
                    } label: {
                        QuickStat(
                            title: "Anthem",
                            value: "🎵",
                            icon: "music.note",
                            color: emotionalData?.primaryColor ?? .blue
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
        .onAppear {
            animateHeader = true
        }
    }
}

// 빠른 통계 아이템
struct QuickStat: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(color)
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(color.opacity(0.1))
        )
    }
}

// 특별 매치 섹션 (더비/라이벌전)
struct SpecialMatchSection: View {
    let teamId: Int
    let rivals: [(teamId: Int, rivalryName: String)]
    let teamColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Special Matches", systemImage: "flame.fill")
                    .font(.headline)
                    .foregroundColor(teamColor)
                Spacer()
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(rivals, id: \.teamId) { rival in
                        RivalryCard(
                            teamId: teamId,
                            rivalTeamId: rival.teamId,
                            rivalryName: rival.rivalryName,
                            teamColor: teamColor
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// 라이벌전 카드
struct RivalryCard: View {
    let teamId: Int
    let rivalTeamId: Int
    let rivalryName: String
    let teamColor: Color
    
    @State private var showFlame = false
    
    var body: some View {
        HStack(spacing: 12) {
            // 우리팀
            KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                .resizable()
                .scaledToFit()
                .frame(width: 40, height: 40)
            
            // VS
            VStack(spacing: 2) {
                if showFlame {
                    Text("🔥")
                        .font(.caption)
                        .transition(.scale)
                }
                Text("VS")
                    .font(.caption)
                    .fontWeight(.black)
                    .foregroundColor(teamColor)
            }
            
            // 라이벌팀
            KFImage(URL(string: "https://media.api-sports.io/football/teams/\(rivalTeamId).png"))
                .resizable()
                .scaledToFit()
                .frame(width: 40, height: 40)
            
            // 라이벌전 이름
            VStack(alignment: .leading, spacing: 2) {
                Text(rivalryName)
                    .font(.caption)
                    .fontWeight(.bold)
                Text("Derby")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(
                    LinearGradient(
                        colors: [teamColor.opacity(0.2), teamColor.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(teamColor.opacity(0.3), lineWidth: 1)
                )
        )
        .onAppear {
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
                showFlame = true
            }
        }
    }
}

// 강화된 게시글 카드
struct EnhancedPostCard: View {
    let post: CommunityPost
    let teamColor: Color
    let isTeamBoard: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 작성자 정보
            HStack {
                // 프로필 이미지
                if let avatarUrl = post.author?.avatarUrl {
                    KFImage(URL(string: avatarUrl))
                        .resizable()
                        .scaledToFill()
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(teamColor.opacity(0.2))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Text(post.author?.nickname.prefix(1).uppercased() ?? "?")
                                .fontWeight(.bold)
                                .foregroundColor(teamColor)
                        )
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(post.author?.nickname ?? "익명")
                            .fontWeight(.semibold)
                        
                        // 팀 뱃지 (팀 게시판인 경우)
                        if isTeamBoard, let fanTeam = post.author?.fanTeam, fanTeam.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.caption)
                                .foregroundColor(teamColor)
                        }
                    }
                    
                    Text(post.createdAt, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // 카테고리 태그
                if let category = post.category {
                    Text(category)
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(teamColor.opacity(0.1))
                        .foregroundColor(teamColor)
                        .clipShape(Capsule())
                }
            }
            
            // 제목
            Text(post.title)
                .font(.headline)
                .lineLimit(2)
            
            // 내용 미리보기
            if !post.content.isEmpty {
                Text(post.content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
            
            // 이미지 미리보기
            if let imageUrls = post.imageUrls, !imageUrls.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(imageUrls.prefix(3), id: \.self) { url in
                            KFImage(URL(string: url))
                                .resizable()
                                .scaledToFill()
                                .frame(width: 80, height: 80)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        
                        if imageUrls.count > 3 {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.black.opacity(0.6))
                                    .frame(width: 80, height: 80)
                                Text("+\(imageUrls.count - 3)")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            }
                        }
                    }
                }
            }
            
            // 상호작용 통계
            HStack(spacing: 16) {
                Label("\(post.likeCount)", systemImage: post.isLiked ? "heart.fill" : "heart")
                    .font(.caption)
                    .foregroundColor(post.isLiked ? .red : .secondary)
                
                Label("\(post.commentCount)", systemImage: "bubble.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Label("\(post.viewCount)", systemImage: "eye")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if post.isPinned {
                    Label("고정", systemImage: "pin.fill")
                        .font(.caption)
                        .foregroundColor(teamColor)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// 팀 응원가 뷰
struct TeamAnthemView: View {
    let teamName: String
    let emotionalData: TeamEmotionalData
    let legendData: TeamLegendData
    
    @Environment(\.dismiss) private var dismiss
    @State private var animateAnthem = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // 배경
                LinearGradient(
                    colors: [
                        emotionalData.primaryColor,
                        emotionalData.primaryColor.opacity(0.7),
                        emotionalData.secondaryColor
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    // 팀 로고
                    KFImage(URL(string: "https://media.api-sports.io/football/teams/\(emotionalData.teamId).png"))
                        .resizable()
                        .scaledToFit()
                        .frame(width: 150, height: 150)
                        .background(
                            Circle()
                                .fill(Color.white)
                                .frame(width: 170, height: 170)
                        )
                        .shadow(color: .black.opacity(0.3), radius: 15, x: 0, y: 10)
                        .scaleEffect(animateAnthem ? 1.2 : 1.0)
                        .animation(
                            Animation.easeInOut(duration: 2)
                                .repeatForever(autoreverses: true),
                            value: animateAnthem
                        )
                    
                    // 팀명
                    Text(teamName)
                        .font(.largeTitle)
                        .fontWeight(.black)
                        .foregroundColor(.white)
                    
                    // 메인 슬로건
                    Text(emotionalData.slogan)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // 응원 구호
                    if let fanChant = emotionalData.fanChant {
                        VStack(spacing: 10) {
                            Text("🎤 팬 응원구호")
                                .font(.headline)
                                .foregroundColor(.white.opacity(0.8))
                            
                            Text(fanChant)
                                .font(.title)
                                .fontWeight(.black)
                                .foregroundColor(.white)
                                .scaleEffect(animateAnthem ? 1.3 : 1.0)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 15)
                                .fill(Color.white.opacity(0.2))
                        )
                    }
                    
                    // 역사적 순간들
                    VStack(spacing: 12) {
                        Text("⚡ 영광의 순간들")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.8))
                        
                        ForEach(legendData.historicMoments, id: \.self) { moment in
                            Text("• \(moment)")
                                .font(.subheadline)
                                .foregroundColor(.white)
                        }
                    }
                    
                    Spacer()
                    
                    // 트로피 컬렉션
                    ScrollView(.horizontal, showsIndicators: false) {
                        Text(legendData.trophyEmojis)
                            .font(.largeTitle)
                            .padding()
                    }
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("닫기") {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
            .onAppear {
                animateAnthem = true
            }
        }
    }
}

// 카테고리 칩
struct TeamBoardCategoryChip: View {
    let category: BoardCategory
    let isSelected: Bool
    let teamColor: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: category.icon)
                    .font(.caption)
                Text(category.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? teamColor : Color.gray.opacity(0.1))
            )
            .foregroundColor(isSelected ? .white : .primary)
        }
    }
}

// 카테고리 데이터
struct BoardCategory {
    let id: String
    let name: String
    let icon: String
}

let teamBoardCategories = [
    BoardCategory(id: "all", name: "전체", icon: "square.grid.2x2"),
    BoardCategory(id: "match", name: "경기", icon: "sportscourt"),
    BoardCategory(id: "transfer", name: "이적", icon: "arrow.left.arrow.right"),
    BoardCategory(id: "news", name: "뉴스", icon: "newspaper"),
    BoardCategory(id: "talk", name: "잡담", icon: "bubble.left.and.bubble.right"),
    BoardCategory(id: "media", name: "미디어", icon: "photo.on.rectangle")
]

// MARK: - 팀 정보 컴포넌트들

// 팀 순위 카드
struct TeamRankingCard: View {
    let teamStanding: TeamStanding?
    let teamColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "trophy.fill")
                    .font(.caption)
                    .foregroundColor(teamColor)
                Text("리그 순위")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
            }
            
            if let standing = teamStanding {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("\(standing.rank)")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(teamColor)
                        Text("위")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        VStack(alignment: .trailing) {
                            Text("\(standing.points)점")
                                .font(.headline)
                                .fontWeight(.semibold)
                            Text("\(standing.all.win)승 \(standing.all.draw)무 \(standing.all.lose)패")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // 최근 폼
                    if let form = standing.form {
                        HStack(spacing: 4) {
                            Text("최근:")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            HStack(spacing: 2) {
                                ForEach(Array(form.suffix(5)), id: \.self) { result in
                                    Circle()
                                        .fill(formColor(for: String(result)))
                                        .frame(width: 16, height: 16)
                                        .overlay(
                                            Text(String(result))
                                                .font(.system(size: 10, weight: .bold))
                                                .foregroundColor(.white)
                                        )
                                }
                            }
                        }
                    }
                }
            } else {
                // 로딩 상태
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("-")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.gray)
                        Text("위")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                    Text("순위 정보 로딩 중...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: teamColor.opacity(0.1), radius: 8, x: 0, y: 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(teamColor.opacity(0.2), lineWidth: 1)
        )
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

// 다음 경기 카드
struct NextMatchCard: View {
    let fixture: Fixture?
    let teamId: Int
    let teamColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sportscourt.fill")
                    .font(.caption)
                    .foregroundColor(teamColor)
                Text("다음 경기")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
            }
            
            if let fixture = fixture {
                VStack(spacing: 8) {
                    // 상대팀
                    let isHome = fixture.teams.home.id == teamId
                    let opponent = isHome ? fixture.teams.away : fixture.teams.home
                    
                    HStack {
                        KFImage(URL(string: opponent.logo))
                            .resizable()
                            .scaledToFit()
                            .frame(width: 40, height: 40)
                        
                        VStack(alignment: .leading) {
                            Text(isHome ? "vs" : "@")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Text(opponent.name)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .lineLimit(1)
                        }
                        
                        Spacer()
                    }
                    
                    // 경기 시간
                    HStack {
                        Image(systemName: "calendar")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(formatDate(fixture.date))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            } else {
                // 로딩 상태
                VStack(alignment: .leading, spacing: 8) {
                    Text("경기 일정 없음")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text("다음 경기 정보가 없습니다")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: teamColor.opacity(0.1), radius: 8, x: 0, y: 4)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(teamColor.opacity(0.2), lineWidth: 1)
        )
    }
    
    func formatDate(_ dateString: String) -> String {
        // ISO8601 형식의 날짜 문자열을 Date로 변환
        let isoFormatter = ISO8601DateFormatter()
        guard let date = isoFormatter.date(from: dateString) else {
            return dateString
        }
        
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "M월 d일 HH:mm"
        return formatter.string(from: date)
    }
}

// 최근 이적 섹션
struct RecentTransfersSection: View {
    let transfers: [Transfer]
    let teamId: Int
    let teamName: String
    let teamColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "arrow.left.arrow.right.circle.fill")
                    .font(.caption)
                    .foregroundColor(teamColor)
                Text("최근 이적")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                NavigationLink(destination: TransferFullListView(teamId: teamId, teamName: teamName, teamColor: teamColor)) {
                    Text("전체보기")
                        .font(.caption)
                        .foregroundColor(teamColor)
                }
            }
            .padding(.horizontal)
            
            if transfers.isEmpty {
                // 이적 정보가 없을 때
                VStack(spacing: 8) {
                    Image(systemName: "arrow.left.arrow.right.slash.arrow.left.arrow.right")
                        .font(.title2)
                        .foregroundColor(.gray.opacity(0.5))
                    
                    Text("최근 이적 정보가 없습니다")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("3개월 이내 확정된 이적이나 루머가 없습니다")
                        .font(.caption2)
                        .foregroundColor(.secondary.opacity(0.8))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
                .padding(.horizontal)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(transfers, id: \.id) { transfer in
                            TeamTransferCard(transfer: transfer, teamColor: teamColor)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }
}

// 이적 카드
struct TeamTransferCard: View {
    let transfer: Transfer
    let teamColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: transfer.type == .incoming ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                    .font(.caption)
                    .foregroundColor(transfer.type == .incoming ? .green : .red)
                Text(transfer.type == .incoming ? "영입" : "방출")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(transfer.type == .incoming ? .green : .red)
                
                Spacer()
                
                // 루머 표시
                if transfer.isRumour {
                    HStack(spacing: 2) {
                        Image(systemName: "questionmark.circle.fill")
                            .font(.caption2)
                        Text("루머")
                            .font(.caption2)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(.orange)
                } else {
                    HStack(spacing: 2) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption2)
                        Text("확정")
                            .font(.caption2)
                            .fontWeight(.medium)
                    }
                    .foregroundColor(.blue)
                }
            }
            
            Text(transfer.playerName)
                .font(.subheadline)
                .fontWeight(.semibold)
            
            Text(transfer.type == .incoming ? transfer.fromClub : transfer.toClub)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(transfer.transferFee)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(teamColor)
                
                // 루머 확률 표시
                if let probability = transfer.probability, transfer.isRumour {
                    HStack(spacing: 4) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.caption2)
                        Text("가능성: \(probability)")
                            .font(.caption2)
                    }
                    .foregroundColor(.orange.opacity(0.8))
                }
            }
            
            // 날짜 표시
            Text(formatTransferDate(transfer.date))
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(width: 160)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(transfer.isRumour ? Color(.systemBackground) : Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(transfer.isRumour ? Color.orange.opacity(0.3) : Color.gray.opacity(0.1), lineWidth: 1)
        )
    }
    
    func formatTransferDate(_ date: Date) -> String {
        let calendar = Calendar.current
        let now = Date()
        let components = calendar.dateComponents([.day], from: date, to: now)
        
        if let days = components.day {
            if days == 0 {
                return "오늘"
            } else if days == 1 {
                return "어제"
            } else if days < 7 {
                return "\(days)일 전"
            } else if days < 30 {
                let weeks = days / 7
                return "\(weeks)주 전"
            } else if days < 365 {
                let months = days / 30
                return "\(months)개월 전"
            } else {
                let years = days / 365
                return "\(years)년 전"
            }
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy.MM.dd"
        return formatter.string(from: date)
    }
}