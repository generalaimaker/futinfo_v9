import Foundation
import SwiftUI
import Combine

// 리그 정보
struct CommunityLeagueInfo: Hashable {
    let id: Int
    let name: String
}

// 메인 커뮤니티 뷰모델
@MainActor
class CommunityViewModel: ObservableObject {
    @Published var boards: [CommunityBoard] = []
    @Published var allBoard: CommunityBoard?
    @Published var teamBoards: [CommunityBoard] = []
    @Published var myTeamBoard: CommunityBoard?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var searchText = ""
    
    private let communityService = SupabaseCommunityService.shared
    private var cancellables = Set<AnyCancellable>()
    
    // 리그 정보 (유럽 5대 리그 순서)
    let leagues: [CommunityLeagueInfo] = [
        CommunityLeagueInfo(id: 39, name: "프리미어리그"),    // 잉글랜드
        CommunityLeagueInfo(id: 140, name: "라리가"),        // 스페인
        CommunityLeagueInfo(id: 135, name: "세리에 A"),      // 이탈리아
        CommunityLeagueInfo(id: 78, name: "분데스리가"),     // 독일
        CommunityLeagueInfo(id: 61, name: "리그 1")          // 프랑스
    ]
    
    var currentUserFanTeamId: Int? {
        communityService.currentUser?.favoriteTeamId
    }
    
    var filteredTeamBoards: [CommunityBoard] {
        if searchText.isEmpty {
            return teamBoards
        }
        return teamBoards.filter { board in
            board.name.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    // 리그별로 그룹화된 팀 게시판
    var groupedTeamBoards: [CommunityLeagueInfo: [CommunityBoard]] {
        let filtered = filteredTeamBoards.filter { $0.id != myTeamBoard?.id }
        var grouped: [CommunityLeagueInfo: [CommunityBoard]] = [:]
        
        for board in filtered {
            if let teamId = board.teamId,
               let league = getLeagueForTeam(teamId: teamId) {
                if grouped[league] == nil {
                    grouped[league] = []
                }
                grouped[league]?.append(board)
            }
        }
        
        // 각 리그의 팀들을 정의된 순서대로 정렬
        let leagueTeamMapping: [Int: [Int]] = [
            39: [33, 50, 40, 49, 42, 47, 48, 34, 66, 51],
            140: [541, 529, 530, 531, 548, 532, 536, 543, 533, 538],
            78: [168, 172, 157, 165, 160, 167, 173, 182, 162, 169],
            135: [497, 489, 496, 505, 502, 499, 487, 503, 492, 495],
            61: [85, 106, 81, 80, 96, 83, 78, 91, 84, 93]
        ]
        
        // 정렬된 결과를 저장할 새로운 딕셔너리
        var sortedGrouped: [CommunityLeagueInfo: [CommunityBoard]] = [:]
        
        for (league, boards) in grouped {
            if let teamOrder = leagueTeamMapping[league.id] {
                // 정의된 순서대로 정렬
                let sortedBoards = boards.sorted { board1, board2 in
                    guard let teamId1 = board1.teamId,
                          let teamId2 = board2.teamId,
                          let index1 = teamOrder.firstIndex(of: teamId1),
                          let index2 = teamOrder.firstIndex(of: teamId2) else {
                        return false
                    }
                    return index1 < index2
                }
                
                // 세리에 A 디버깅 - 주석 처리
                // if league.id == 135 {
                //     print("🇮🇹 세리에 A 정렬 전: \(boards.compactMap { $0.teamId })")
                //     print("🇮🇹 세리에 A 정렬 후: \(sortedBoards.compactMap { $0.teamId })")
                //     print("🇮🇹 세리에 A 원하는 순서: \(teamOrder)")
                // }
                
                sortedGrouped[league] = sortedBoards
            } else {
                sortedGrouped[league] = boards
            }
        }
        
        return sortedGrouped
    }
    
    // 팀 ID로 리그 찾기
    func getLeagueForTeam(teamId: Int) -> CommunityLeagueInfo? {
        // 유럽 5대 리그 전통적인 강팀들만 (상위 10개팀)
        let leagueTeamMapping: [Int: [Int]] = [
            // 프리미어리그 상위 10팀
            39: [33, 50, 40, 49, 42, 47, 48, 34, 66, 51],  // Man United, Man City, Liverpool, Chelsea, Arsenal, Tottenham, West Ham, Newcastle, Aston Villa, Brighton
            
            // 라리가 상위 10팀  
            140: [541, 529, 530, 531, 548, 532, 536, 543, 533, 538],  // Real Madrid, Barcelona, Atletico Madrid, Athletic Bilbao, Real Sociedad, Valencia, Sevilla, Real Betis, Villarreal, Celta Vigo
            
            // 분데스리가 상위 10팀
            78: [168, 172, 157, 165, 160, 167, 173, 182, 162, 169],  // Bayer Leverkusen, VfB Stuttgart, Bayern Munich, Borussia Dortmund, Eintracht Frankfurt, VfL Wolfsburg, Borussia M.Gladbach, Union Berlin, Werder Bremen, RB Leipzig
            
            // 세리에 A 상위 10팀
            135: [497, 489, 496, 505, 502, 499, 487, 503, 492, 495],  // Juventus, AC Milan, Inter, Roma, Napoli, Lazio, Fiorentina, Torino, Atalanta, Genoa
            
            // 리그 1 상위 10팀
            61: [85, 106, 81, 80, 96, 83, 78, 91, 84, 93]  // PSG, Monaco, Marseille, Lyon, Saint-Etienne, Nantes, Bordeaux, Lille, Nice, Strasbourg
        ]
        
        for (leagueId, teams) in leagueTeamMapping {
            if teams.contains(teamId) {
                return leagues.first { $0.id == leagueId }
            }
        }
        
        return nil
    }
    
    init() {
        setupBindings()
        setupRealtimeBindings()
        loadBoards()
        
        // 리그 팀 확인은 필요할 때만 수행 (주석 처리)
        // Task {
        //     await checkAndFixLeagueTeams()
        // }
    }
    
    private func setupBindings() {
        communityService.$boards
            .receive(on: DispatchQueue.main)
            .sink { [weak self] boards in
                self?.processBoards(boards)
            }
            .store(in: &cancellables)
        
        communityService.$currentUser
            .receive(on: DispatchQueue.main)
            .sink { [weak self] user in
                self?.updateMyTeamBoard(user: user)
            }
            .store(in: &cancellables)
    }
    
    private func setupRealtimeBindings() {
        // Listen for authentication state changes to manage realtime subscriptions
        NotificationCenter.default.publisher(for: Notification.Name("AuthStateChanged"))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.handleAuthStateChanged()
            }
            .store(in: &cancellables)
    }
    
    private func handleAuthStateChanged() {
        // Optionally restart realtime subscriptions when auth state changes
        // This ensures that user-specific realtime features work correctly
        print("🔄 Authentication state changed - may need to restart realtime subscriptions")
    }
    
    private func processBoards(_ boards: [CommunityBoard]) {
        self.boards = boards
        self.allBoard = boards.first { $0.type == .all }
        self.teamBoards = boards.filter { $0.type == .team }
        updateMyTeamBoard(user: communityService.currentUser)
    }
    
    private func updateMyTeamBoard(user: Profile?) {
        guard let favoriteTeamId = user?.favoriteTeamId else {
            myTeamBoard = nil
            return
        }
        myTeamBoard = teamBoards.first { $0.teamId == favoriteTeamId }
    }
    
    func loadBoards() {
        isLoading = true
        Task {
            await communityService.loadBoards()
            await MainActor.run {
                isLoading = false
            }
        }
    }
    
    // 모든 리그 팀 확인 및 수정
    private func checkAndFixLeagueTeams() async {
        // 잠시 대기 (게시판 로드 완료 대기)
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        
        // 각 리그별 팀 수 확인
        let leagueTeamCounts = [
            ("프리미어리그", 39, getTeamCountForLeague(39)),
            ("라리가", 140, getTeamCountForLeague(140)),
            ("분데스리가", 78, getTeamCountForLeague(78)),
            ("세리에 A", 135, getTeamCountForLeague(135)),
            ("리그 1", 61, getTeamCountForLeague(61))
        ]
        
        var needsFix = false
        for (leagueName, _, count) in leagueTeamCounts {
            if count != 10 {
                print("⚠️ \(leagueName): \(count)개 팀 (정상: 10개)")
                needsFix = true
            }
        }
        
        // 하나라도 10개가 아니면 전체 초기화
        if needsFix {
            print("🔄 리그 팀 초기화 시작...")
            
            do {
                // 분데스리가와 리그 1만 수정 (다른 리그는 이미 10개)
                try await LeagueTeamsInitializer.shared.initializeBundesligaAndLigue1()
                
                // 잠시 대기 후 다시 로드
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await communityService.loadBoards()
                
                print("✅ 리그 팀 초기화 완료")
            } catch {
                print("❌ 리그 팀 초기화 실패: \(error)")
            }
        } else {
            print("✅ 모든 리그가 정확히 10개 팀을 가지고 있습니다.")
        }
    }
    
    // 특정 리그의 팀 수 계산
    private func getTeamCountForLeague(_ leagueId: Int) -> Int {
        return teamBoards.filter { board in
            guard let teamId = board.teamId else { return false }
            return getLeagueForTeam(teamId: teamId)?.id == leagueId
        }.count
    }
    
    func setFanTeam(teamId: Int) {
        Task {
            await setFanTeamAsync(teamId: teamId)
        }
    }
    
    // 비동기 팀 선택 메서드 (UI에서 대기 가능)
    @MainActor
    func setFanTeamAsync(teamId: Int) async {
        do {
            // 선택한 팀의 정보 가져오기
            let team = teamBoards.first { $0.teamId == teamId }
            let teamName = team?.name.replacingOccurrences(of: " 게시판", with: "") ?? "팀"
            let teamImageUrl = team?.iconUrl
            
            print("🏟️ 팀 선택 시작: \(teamName) (ID: \(teamId))")
            
            // 팀 선택
            try await communityService.selectFavoriteTeam(
                teamId: teamId,
                teamName: teamName,
                teamImageUrl: teamImageUrl
            )
            
            print("✅ selectFavoriteTeam 완료")
            
            // 게시판 다시 로드
            await communityService.loadBoards()
            
            print("✅ loadBoards 완료")
            
            // checkAuthentication을 호출하여 currentUser 업데이트
            _ = await communityService.checkAuthentication()
            
            print("✅ 팀 선택 완료: \(teamName) (ID: \(teamId))")
            
        } catch {
            errorMessage = "팀 선택 실패: \(error.localizedDescription)"
            print("❌ 팀 선택 실패: \(error)")
        }
    }
}

// 게시글 목록 뷰모델
@MainActor
class PostListViewModel: ObservableObject {
    @Published var posts: [CommunityPost] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var errorMessage: String?
    @Published var hasMorePages = true
    
    let boardId: String
    private var currentPage = 1
    private let pageSize = 20
    private let communityService = SupabaseCommunityService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init(boardId: String) {
        self.boardId = boardId
        setupRealtimeBindings()
    }
    
    private func setupRealtimeBindings() {
        // Listen for new posts
        NotificationCenter.default.publisher(for: Notification.Name("NewPostReceived"))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self = self,
                      let userInfo = notification.userInfo,
                      let post = userInfo["post"] as? CommunityPost,
                      let boardId = userInfo["boardId"] as? String,
                      boardId == self.boardId else { return }
                
                // Add new post to the beginning of the list
                self.posts.insert(post, at: 0)
                print("✅ New post added to UI: \(post.title)")
            }
            .store(in: &cancellables)
        
        // Listen for post updates
        NotificationCenter.default.publisher(for: Notification.Name("PostUpdated"))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self = self,
                      let userInfo = notification.userInfo,
                      let postId = userInfo["postId"] as? String,
                      let boardId = userInfo["boardId"] as? String,
                      let updates = userInfo["updates"] as? [String: Any],
                      boardId == self.boardId else { return }
                
                // Find and update the post
                if let index = self.posts.firstIndex(where: { $0.id == postId }) {
                    var updatedPost = self.posts[index]
                    
                    if let likeCount = updates["likeCount"] as? Int {
                        updatedPost.likeCount = likeCount
                    }
                    if let commentCount = updates["commentCount"] as? Int {
                        updatedPost.commentCount = commentCount
                    }
                    if let viewCount = updates["viewCount"] as? Int {
                        updatedPost.viewCount = viewCount
                    }
                    
                    self.posts[index] = updatedPost
                    print("✅ Post updated in UI: \(postId)")
                }
            }
            .store(in: &cancellables)
        
        // Listen for new comments
        NotificationCenter.default.publisher(for: Notification.Name("NewCommentReceived"))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self = self,
                      let userInfo = notification.userInfo,
                      let postId = userInfo["postId"] as? String,
                      let boardId = userInfo["boardId"] as? String,
                      boardId == self.boardId else { return }
                
                // Find and increment comment count
                if let index = self.posts.firstIndex(where: { $0.id == postId }) {
                    var updatedPost = self.posts[index]
                    updatedPost.commentCount += 1
                    self.posts[index] = updatedPost
                    print("✅ Comment count updated in UI for post: \(postId)")
                }
            }
            .store(in: &cancellables)
    }
    
    func loadPosts() {
        guard !isLoading else { return }
        
        isLoading = true
        currentPage = 1
        
        print("📋 Loading posts for board: \(boardId)")
        
        Task {
            let newPosts = await communityService.loadPosts(boardId: boardId, limit: pageSize, offset: 0)
            
            await MainActor.run {
                self.posts = newPosts
                self.hasMorePages = newPosts.count >= pageSize
                self.isLoading = false
                print("✅ PostListViewModel: Loaded \(newPosts.count) posts for board \(boardId)")
                if newPosts.isEmpty {
                    print("⚠️ No posts found for board \(boardId)")
                } else {
                    for (index, post) in newPosts.enumerated() {
                        print("  Post \(index + 1): \(post.title) (id: \(post.id))")
                    }
                }
            }
        }
    }
    
    func loadMorePosts() {
        guard !isLoadingMore && hasMorePages else { return }
        
        isLoadingMore = true
        currentPage += 1
        
        Task {
            let offset = (currentPage - 1) * pageSize
            let newPosts = await communityService.loadPosts(boardId: boardId, limit: pageSize, offset: offset)
            
            await MainActor.run {
                self.posts.append(contentsOf: newPosts)
                self.hasMorePages = newPosts.count >= pageSize
                self.isLoadingMore = false
                print("✅ PostListViewModel: Loaded \(newPosts.count) more posts for board \(boardId)")
            }
        }
    }
    
    func startRealtimeSubscription() {
        print("🔄 Starting realtime subscription for board: \(boardId)")
        communityService.subscribeToBoard(boardId: boardId)
    }
    
    func stopRealtimeSubscription() {
        print("⏹️ Stopping realtime subscription for board: \(boardId)")
        communityService.unsubscribeFromBoard()
    }
    
    deinit {
        print("🗑️ PostListViewModel deinit - cleaning up subscriptions")
        stopRealtimeSubscription()
        cancellables.removeAll()
    }
}

// 게시글 상세 뷰모델
@MainActor
class PostDetailViewModel: ObservableObject {
    @Published var post: CommunityPost?
    @Published var comments: [CommunityComment] = []
    @Published var isLoading = false
    @Published var isLoadingComments = false
    @Published var errorMessage: String?
    @Published var newCommentText = ""
    
    let postId: String
    private let communityService = SupabaseCommunityService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init(postId: String) {
        self.postId = postId
        setupRealtimeBindings()
    }
    
    private func setupRealtimeBindings() {
        // Listen for new comments on this post
        NotificationCenter.default.publisher(for: Notification.Name("NewCommentReceived"))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self = self,
                      let userInfo = notification.userInfo,
                      let postId = userInfo["postId"] as? String,
                      postId == self.postId else { return }
                
                // Reload comments when a new comment is received
                Task {
                    await self.loadComments()
                }
                
                // Update post comment count
                if var post = self.post {
                    post.commentCount += 1
                    self.post = post
                }
                
                print("✅ New comment notification received for post: \(postId)")
            }
            .store(in: &cancellables)
        
        // Listen for post updates (like count changes)
        NotificationCenter.default.publisher(for: Notification.Name("PostUpdated"))
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self = self,
                      let userInfo = notification.userInfo,
                      let postId = userInfo["postId"] as? String,
                      let updates = userInfo["updates"] as? [String: Any],
                      postId == self.postId else { return }
                
                // Update post counts
                if var post = self.post {
                    if let likeCount = updates["likeCount"] as? Int {
                        post.likeCount = likeCount
                    }
                    if let commentCount = updates["commentCount"] as? Int {
                        post.commentCount = commentCount
                    }
                    if let viewCount = updates["viewCount"] as? Int {
                        post.viewCount = viewCount
                    }
                    
                    self.post = post
                    print("✅ Post detail updated via realtime: \(postId)")
                }
            }
            .store(in: &cancellables)
    }
    
    func loadPost() {
        isLoading = true
        
        Task {
            do {
                let fetchedPost = try await communityService.fetchPost(postId: postId)
                await MainActor.run {
                    self.post = fetchedPost
                    self.isLoading = false
                }
                
                // 댓글도 함께 로드
                await loadComments()
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
    
    func loadComments() async {
        await MainActor.run {
            isLoadingComments = true
        }
        
        do {
            let fetchedComments = try await communityService.loadComments(postId: postId)
            await MainActor.run {
                self.comments = fetchedComments
                self.isLoadingComments = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoadingComments = false
            }
        }
    }
    
    func submitComment() {
        guard !newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        Task {
            do {
                try await communityService.createComment(postId: postId, content: newCommentText)
                
                // Reload comments
                await loadComments()
                
                await MainActor.run {
                    self.newCommentText = ""
                    if var post = self.post {
                        post.commentCount += 1
                        self.post = post
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    func toggleLike() {
        guard let post = post else { return }
        
        Task {
            do {
                try await communityService.toggleLike(post: post)
                
                // Update local state
                await MainActor.run {
                    if var updatedPost = self.post {
                        updatedPost.isLiked = !updatedPost.isLiked
                        updatedPost.likeCount += updatedPost.isLiked ? 1 : -1
                        self.post = updatedPost
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
    
    deinit {
        print("🗑️ PostDetailViewModel deinit - cleaning up subscriptions")
        cancellables.removeAll()
    }
}

// 게시글 작성 뷰모델
@MainActor
class CreatePostViewModel: ObservableObject {
    @Published var title = ""
    @Published var content = ""
    @Published var selectedCategory = "general" // 기본값
    @Published var selectedImages: [UIImage] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    let boardId: String
    private let communityService = SupabaseCommunityService.shared
    
    init(boardId: String) {
        self.boardId = boardId
    }
    
    func createPost(completion: @escaping (CommunityPost?) -> Void) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Validate inputs
                let validatedTitle = try CommunityValidator.validatePostTitle(title)
                let validatedContent = try CommunityValidator.validatePostContent(content)
                
                // Convert images to data
                var imageDatas: [Data] = []
                for image in selectedImages {
                    if let imageData = image.jpegData(compressionQuality: 0.8) {
                        imageDatas.append(imageData)
                    }
                }
                
                // Validate images
                try CommunityValidator.validateImages(imageDatas)
                
                // Create post
                print("📝 게시글 작성 시작: boardId=\(boardId), title=\(validatedTitle)")
                
                let newPost = try await SupabaseCommunityService.shared.createPost(
                    boardId: boardId,
                    title: validatedTitle,
                    content: validatedContent,
                    category: selectedCategory,
                    tags: [],
                    imageDatas: imageDatas
                )
                
                print("✅ 게시글 작성 성공: \(newPost.id)")
                
                await MainActor.run {
                    self.isLoading = false
                    completion(newPost)
                }
            } catch {
                print("❌ 게시글 작성 실패: \(error)")
                await MainActor.run {
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                    completion(nil)
                }
            }
        }
    }
}