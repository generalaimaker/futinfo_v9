import Foundation
import Combine
import Supabase
import Realtime

// MARK: - Realtime Connection Status

enum RealtimeConnectionStatus {
    case disconnected
    case connecting
    case connected
    case reconnecting
    case error(String)
    
    var displayText: String {
        switch self {
        case .disconnected:
            return "연결 안됨"
        case .connecting:
            return "연결 중..."
        case .connected:
            return "실시간 연결됨"
        case .reconnecting:
            return "재연결 중..."
        case .error(let message):
            return "오류: \(message)"
        }
    }
    
    var isConnected: Bool {
        switch self {
        case .connected:
            return true
        default:
            return false
        }
    }
}

// MARK: - Realtime Health Info

struct RealtimeHealthInfo {
    let hasActiveChannel: Bool
    let hasCurrentBoard: Bool
    let isConnected: Bool
    let connectionStatus: RealtimeConnectionStatus
    let currentBoardId: String?
    let retryCount: Int
    
    var isHealthy: Bool {
        return hasActiveChannel && hasCurrentBoard && isConnected
    }
    
    var diagnosticMessage: String {
        if isHealthy {
            return "실시간 연결이 정상적으로 작동 중입니다."
        }
        
        var issues: [String] = []
        
        if !hasActiveChannel {
            issues.append("활성 채널 없음")
        }
        
        if !hasCurrentBoard {
            issues.append("현재 게시판 없음")
        }
        
        if !isConnected {
            issues.append("연결 끊김")
        }
        
        if retryCount > 0 {
            issues.append("재시도 횟수: \(retryCount)")
        }
        
        return "문제: \(issues.joined(separator: ", "))"
    }
}

@MainActor
class SupabaseCommunityService: ObservableObject {
    static let shared = SupabaseCommunityService()
    
    @Published var currentUser: Profile?
    @Published var boards: [CommunityBoard] = []
    @Published var favoriteBoards: [CommunityBoard] = []
    // @Published var posts: [CommunityPost] = []  // Removed - each PostListViewModel manages its own posts
    @Published var isAuthenticated = false
    @Published var needsProfileSetup = false
    @Published var realtimeConnectionStatus: RealtimeConnectionStatus = .disconnected
    
    private let supabaseService = SupabaseService.shared
    private var cancellables = Set<AnyCancellable>()
    private var realtimeChannel: RealtimeChannelV2?
    private var currentBoardId: String?
    
    private init() {
        Task {
            await checkAuthentication()
            await loadBoards()
        }
    }
    
    // MARK: - Bundesliga Teams Update
    
    func rebuildBundesligaTeams() async {
        print("🔨 분데스리가 팀 완전 재구축 시작")
        
        // 분데스리가 정확한 10개 팀 정보
        let bundesligaTeams: [(id: Int, name: String)] = [
            (168, "Bayer Leverkusen"),
            (172, "VfB Stuttgart"),
            (157, "Bayern Munich"),
            (165, "Borussia Dortmund"),
            (160, "Eintracht Frankfurt"),
            (167, "VfL Wolfsburg"),
            (173, "Borussia M.Gladbach"),
            (182, "Union Berlin"),
            (162, "Werder Bremen"),
            (169, "RB Leipzig")
        ]
        
        do {
            // 1. 모든 분데스리가 관련 게시판 완전 삭제
            print("🗑️ STEP 1: 모든 분데스리가 게시판 완전 삭제")
            
            // 분데스리가 팀 ID 범위에 해당하는 모든 게시판 삭제
            let allBundesligaTeamIds = [157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182]
            
            for teamId in allBundesligaTeamIds {
                try await supabaseService.client
                    .from("boards")
                    .delete()
                    .eq("team_id", value: String(teamId))
                    .execute()
            }
            
            // league_id가 78인 게시판도 삭제
            try await supabaseService.client
                .from("boards")
                .delete()
                .eq("league_id", value: "78")
                .execute()
                
            print("✅ 분데스리가 게시판 완전 삭제 완료")
            
            // 2. 잠시 대기 (데이터베이스 반영)
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1초 대기
            
            // 3. 새로운 10개 팀 게시판 생성
            print("🏭 STEP 2: 새로운 10개 팀 게시판 생성")
            
            struct BoardInsert: Encodable {
                let id: String
                let name: String
                let description: String
                let type: String
                let team_id: String
                let league_id: String
                let icon_url: String
                let member_count: Int
                let created_at: String
                let post_count: Int
            }
            
            for (index, team) in bundesligaTeams.enumerated() {
                let boardData = BoardInsert(
                    id: "team_\(team.id)",
                    name: "\(team.name) 게시판",
                    description: "\(team.name) 팬들을 위한 게시판",
                    type: "team",
                    team_id: String(team.id),
                    league_id: "78",
                    icon_url: "https://media.api-sports.io/football/teams/\(team.id).png",
                    member_count: 0,
                    created_at: ISO8601DateFormatter().string(from: Date()),
                    post_count: 0
                )
                
                try await supabaseService.client
                    .from("boards")
                    .insert(boardData)
                    .execute()
                    
                print("✅ \(index + 1)/10: \(team.name) 게시판 생성 완료")
                
                // 각 팀 생성 후 짧은 대기
                try await Task.sleep(nanoseconds: 100_000_000) // 0.1초
            }
            
            // 4. 잠시 대기 후 게시판 목록 다시 로드
            print("🔄 STEP 3: 게시판 목록 다시 로드")
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1초 대기
            
            await loadBoards()
            
            // 5. 결과 확인
            let newBundesligaBoards = boards.filter { board in
                guard let teamId = board.teamId else { return false }
                return bundesligaTeams.contains { $0.id == teamId }
            }
            
            print("🎉 분데스리가 재구축 완료!")
            print("📊 최종 분데스리가 팀 수: \(newBundesligaBoards.count)")
            for board in newBundesligaBoards {
                print("  ✅ \(board.name)")
            }
            
        } catch {
            print("❌ 분데스리가 팀 재구축 실패: \(error)")
        }
    }
    
    // MARK: - Authentication
    
    @MainActor
    func checkAuthentication() async {
        do {
            if let user = try await supabaseService.getCurrentUser() {
                // Load user profile
                if let profile = try await supabaseService.getProfile(userId: user.id.uuidString) {
                    self.currentUser = profile
                    self.isAuthenticated = true
                    
                    // Check if profile needs setup (no nickname)
                    if profile.nickname.isEmpty || profile.nickname == user.email?.components(separatedBy: "@").first {
                        self.needsProfileSetup = true
                    } else {
                        self.needsProfileSetup = false
                        // Load favorite boards only if profile is complete
                        await loadFavoriteBoards()
                    }
                    
                    // 인증 상태 변경 알림 발송
                    NotificationCenter.default.post(name: Notification.Name("AuthStateChanged"), object: nil)
                } else {
                    // User exists but no profile, needs setup
                    self.currentUser = nil
                    self.isAuthenticated = true
                    self.needsProfileSetup = true
                    
                    // 인증 상태 변경 알림 발송
                    NotificationCenter.default.post(name: Notification.Name("AuthStateChanged"), object: nil)
                }
            } else {
                self.currentUser = nil
                self.isAuthenticated = false
                self.favoriteBoards = []
                self.needsProfileSetup = false
                
                // 인증 상태 변경 알림 발송
                NotificationCenter.default.post(name: Notification.Name("AuthStateChanged"), object: nil)
            }
        } catch {
            print("Error checking authentication: \(error)")
            self.isAuthenticated = false
            
            // 인증 상태 변경 알림 발송
            NotificationCenter.default.post(name: Notification.Name("AuthStateChanged"), object: nil)
            self.needsProfileSetup = false
        }
    }
    
    func signIn(email: String, password: String) async throws {
        _ = try await supabaseService.signIn(email: email, password: password)
        await checkAuthentication()
    }
    
    func signUp(email: String, password: String, nickname: String) async throws {
        _ = try await supabaseService.signUp(email: email, password: password, nickname: nickname)
        await checkAuthentication()
    }
    
    func signOut() async throws {
        try await supabaseService.signOut()
        self.currentUser = nil
        self.isAuthenticated = false
        self.favoriteBoards = []
        
        // Clear local favorites but keep them in UserDefaults for next anonymous session
        // The FavoriteService will handle this through the authentication observer
    }
    
    // MARK: - Boards
    
    func loadBoards() async {
        do {
            let response = try await supabaseService.client
                .from("boards")
                .select()
                .order("post_count", ascending: false)
                .execute()
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            self.boards = try decoder.decode([CommunityBoard].self, from: response.data)
        } catch {
            print("Error loading boards: \(error)")
        }
    }
    
    func loadFavoriteBoards() async {
        guard currentUser?.id != nil else { return }
        
        do {
            // Get followed teams
            let follows = try await supabaseService.getFollowedTeams()
            
            // Load boards for followed teams
            let teamIds = follows.map { "team_\($0.followId)" }
            
            if !teamIds.isEmpty {
                let response = try await supabaseService.client
                    .from("boards")
                    .select()
                    .in("id", values: teamIds)
                    .execute()
                
                let decoder = JSONDecoder()
                decoder.keyDecodingStrategy = .convertFromSnakeCase
                self.favoriteBoards = try decoder.decode([CommunityBoard].self, from: response.data)
            }
        } catch {
            print("Error loading favorite boards: \(error)")
        }
    }
    
    // MARK: - Posts
    
    func loadPosts(boardId: String? = nil, category: String? = nil, limit: Int = 20, offset: Int = 0) async -> [CommunityPost] {
        do {
            print("🔍 SupabaseCommunityService.loadPosts - boardId: \(boardId ?? "nil")")
            
            var query = supabaseService.client
                .from("posts")
                .select("*, author:profiles!author_id(*)")
                .eq("is_deleted", value: false)
            
            if let boardId = boardId {
                print("✅ Filtering posts by board_id: \(boardId)")
                query = query.eq("board_id", value: boardId)
            } else {
                print("⚠️ No boardId provided, loading ALL posts")
            }
            
            if let category = category, category != "all" {
                query = query.eq("category", value: category)
            }
            
            let response = try await query
                .order("created_at", ascending: false)
                .limit(limit)
                .range(from: offset, to: offset + limit - 1)
                .execute()
            
            print("📡 Response data size: \(response.data.count) bytes")
            
            // 첫 1000자만 출력하여 응답 구조 확인
            if let jsonString = String(data: response.data, encoding: .utf8) {
                let preview = String(jsonString.prefix(1000))
                print("📡 Response preview: \(preview)...")
                
                // JSON 파싱 테스트
                do {
                    if let jsonArray = try JSONSerialization.jsonObject(with: response.data) as? [[String: Any]] {
                        print("📡 Posts count in response: \(jsonArray.count)")
                        if let firstPost = jsonArray.first {
                            print("📡 First post keys: \(firstPost.keys.sorted())")
                            if let author = firstPost["author"] as? [String: Any] {
                                print("📡 Author keys: \(author.keys.sorted())")
                            }
                        }
                    }
                } catch {
                    print("❌ JSON parsing test failed: \(error)")
                }
            }
            
            // 먼저 간단한 구조로 파싱 테스트
            struct SimplifiedPost: Codable {
                let id: UUID
                let boardId: String
                let title: String
                let content: String
                // CodingKeys 제거 - decoder의 keyDecodingStrategy가 처리함
            }
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            
            // Custom date decoding strategy for Supabase timestamps
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ"
            dateFormatter.locale = Locale(identifier: "en_US_POSIX")
            dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
            
            decoder.dateDecodingStrategy = .custom { decoder in
                let container = try decoder.singleValueContainer()
                let dateString = try container.decode(String.self)
                
                // Try multiple date formats
                let formats = [
                    "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ",     // With microseconds and timezone
                    "yyyy-MM-dd'T'HH:mm:ss.SSSSSS",      // With microseconds, no timezone
                    "yyyy-MM-dd'T'HH:mm:ssZ",            // No microseconds, with timezone
                    "yyyy-MM-dd'T'HH:mm:ss",             // Basic ISO8601
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",      // With milliseconds and Z
                    "yyyy-MM-dd'T'HH:mm:ss'Z'"           // With Z suffix
                ]
                
                for format in formats {
                    dateFormatter.dateFormat = format
                    if let date = dateFormatter.date(from: dateString) {
                        return date
                    }
                }
                
                // If all formats fail, try ISO8601DateFormatter as fallback
                let isoFormatter = ISO8601DateFormatter()
                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                if let date = isoFormatter.date(from: dateString) {
                    return date
                }
                
                // Last resort: basic ISO8601
                isoFormatter.formatOptions = [.withInternetDateTime]
                if let date = isoFormatter.date(from: dateString) {
                    return date
                }
                
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
            }
            
            // 디버깅: 원본 JSON 키 확인
            if let jsonData = try? JSONSerialization.jsonObject(with: response.data) as? [[String: Any]],
               let firstPost = jsonData.first {
                print("🔍 첫 번째 게시글의 원본 JSON 키들:")
                for (key, value) in firstPost {
                    print("  - \(key): \(type(of: value))")
                }
            }
            
            // 간단한 구조로 먼저 시도
            do {
                let simplePosts = try decoder.decode([SimplifiedPost].self, from: response.data)
                print("✅ Simplified parsing success: \(simplePosts.count) posts")
                if let firstPost = simplePosts.first {
                    print("  - First post: \(firstPost.title) (boardId: \(firstPost.boardId))")
                }
            } catch {
                print("❌ Even simplified parsing failed: \(error)")
                if let decodingError = error as? DecodingError {
                    switch decodingError {
                    case .keyNotFound(let key, let context):
                        print("  - Missing key: \(key.stringValue)")
                        print("  - Context: \(context.debugDescription)")
                        print("  - CodingPath: \(context.codingPath.map { $0.stringValue }.joined(separator: " -> "))")
                    case .typeMismatch(let type, let context):
                        print("  - Type mismatch: expected \(type)")
                        print("  - Context: \(context.debugDescription)")
                    case .dataCorrupted(let context):
                        print("  - Data corrupted: \(context.debugDescription)")
                    case .valueNotFound(let type, let context):
                        print("  - Value not found: \(type)")
                        print("  - Context: \(context.debugDescription)")
                    @unknown default:
                        print("  - Unknown decoding error")
                    }
                }
            }
            
            // 먼저 중간 구조체로 파싱
            print("📊 PostWithProfile 파싱 시도...")
            let postsWithProfile = try decoder.decode([PostWithProfile].self, from: response.data)
            print("✅ PostWithProfile parsing success: \(postsWithProfile.count) posts")
            
            // Profile을 UserProfile로 변환하여 CommunityPost 생성
            let newPosts = postsWithProfile.map { post in
                CommunityPost(
                    id: post.id.uuidString,
                    boardId: post.boardId,
                    authorId: post.authorId.uuidString,
                    author: post.author.map { profile in
                        UserProfile(
                            id: profile.id,
                            userId: profile.userId,
                            nickname: profile.nickname,
                            avatarUrl: profile.avatarUrl,
                            favoriteTeamId: profile.favoriteTeamId,
                            favoriteTeamName: profile.favoriteTeamName,
                            fanTeam: nil,
                            language: profile.language,
                            createdAt: profile.createdAt,
                            updatedAt: profile.updatedAt,
                            joinedAt: profile.createdAt,
                            postCount: nil,
                            commentCount: nil,
                            level: nil
                        )
                    },
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    tags: post.tags,
                    imageUrls: post.imageUrls,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                    viewCount: post.viewCount,
                    likeCount: post.likeCount,
                    commentCount: post.commentCount,
                    isPinned: post.isPinned,
                    isNotice: post.isNotice
                )
            }
            
            print("📊 Loaded \(newPosts.count) posts for boardId: \(boardId ?? "nil")")
            for post in newPosts {
                print("  - Post: \(post.title) (board: \(post.boardId), author: \(post.author?.nickname ?? "unknown"))")
            }
            
            return newPosts
        } catch {
            print("❌ Error loading posts: \(error)")
            print("❌ Error details: \(error.localizedDescription)")
            if let decodingError = error as? DecodingError {
                switch decodingError {
                case .dataCorrupted(let context):
                    print("❌ Data corrupted: \(context)")
                case .keyNotFound(let key, let context):
                    print("❌ Key not found: \(key), context: \(context)")
                case .typeMismatch(let type, let context):
                    print("❌ Type mismatch: \(type), context: \(context)")
                case .valueNotFound(let type, let context):
                    print("❌ Value not found: \(type), context: \(context)")
                @unknown default:
                    print("❌ Unknown decoding error")
                }
            }
            return []
        }
    }
    
    func createPost(boardId: String, title: String, content: String, category: String = "general", tags: [String] = [], imageDatas: [Data] = []) async throws -> CommunityPost {
        // Upload images first
        var uploadedImageUrls: [String] = []
        
        for (index, imageData) in imageDatas.enumerated() {
            do {
                let fileName = "post_image_\(index).jpg"
                let imageUrl = try await supabaseService.uploadImage(imageData: imageData, fileName: fileName)
                uploadedImageUrls.append(imageUrl)
            } catch {
                // If any upload fails, delete already uploaded images
                for url in uploadedImageUrls {
                    try? await supabaseService.deleteImage(imageUrl: url)
                }
                throw error
            }
        }
        
        // Create post with uploaded image URLs
        let newPost = try await supabaseService.createPost(
            boardId: boardId,
            title: title,
            content: content,
            category: category,
            tags: tags,
            imageUrls: uploadedImageUrls
        )
        
        return newPost
    }
    
    func updatePost(postId: String, title: String? = nil, content: String? = nil, tags: [String]? = nil) async throws {
        _ = try await supabaseService.updatePost(
            postId: postId,
            title: title,
            content: content,
            tags: tags
        )
    }
    
    func deletePost(postId: String) async throws {
        try await supabaseService.deletePost(postId: postId)
    }
    
    func toggleLike(post: CommunityPost) async throws {
        _ = try await supabaseService.toggleLike(targetType: "post", targetId: post.id)
    }
    
    func incrementViewCount(postId: String) async {
        // Call Edge Function to increment view count
        guard let url = URL(string: "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/community-api/increment-view") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["postId": postId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        Task {
            do {
                let (_, _) = try await URLSession.shared.data(for: request)
            } catch {
                print("Error incrementing view count: \(error)")
            }
        }
    }
    
    // MARK: - Team Selection
    
    func selectFavoriteTeam(teamId: Int, teamName: String, teamImageUrl: String?) async throws {
        guard let userId = currentUser?.userId else { return }
        
        // 기존 팀 팔로우 해제 (있다면)
        if let currentTeamId = currentUser?.favoriteTeamId, currentTeamId != teamId {
            print("🔄 기존 팀 팔로우 해제: \(currentTeamId)")
            do {
                // 기존 팀 언팔로우
                try await supabaseService.client
                    .from("follows")
                    .delete()
                    .eq("user_id", value: userId)
                    .eq("follow_type", value: "team")
                    .eq("follow_id", value: String(currentTeamId))
                    .execute()
                print("✅ 기존 팀 팔로우 해제 완료")
            } catch {
                print("⚠️ 기존 팀 팔로우 해제 실패: \(error)")
                // 실패해도 계속 진행
            }
        }
        
        // Update profile
        let profileUpdate = ProfileUpdate(
            nickname: nil,
            avatarUrl: nil,
            favoriteTeamId: teamId,
            favoriteTeamName: teamName,
            language: nil
        )
        try await supabaseService.updateProfile(userId: userId, updates: profileUpdate)
        
        // Follow the new team (더 간단한 접근: 실패하면 이미 팔로우 중인 것으로 간주)
        do {
            print("🏆 새 팀 팔로우 시도: \(teamId) - \(teamName)")
            try await supabaseService.followTeam(teamId: teamId, teamName: teamName, teamImageUrl: teamImageUrl)
            print("✅ 새 팀 팔로우 완료")
        } catch {
            // duplicate key 에러는 이미 팔로우 중인 경우
            if error.localizedDescription.contains("duplicate") || error.localizedDescription.contains("unique") {
                print("ℹ️ 이미 팔로우 중인 팀: \(teamId)")
            } else {
                print("⚠️ 팀 팔로우 처리 중 오류: \(error)")
            }
            // 팔로우 실패해도 프로필은 업데이트되었으므로 성공으로 처리
        }
        
        // Reload user data
        await checkAuthentication()
    }
    
    // MARK: - Comments
    
    func loadComments(postId: String) async throws -> [CommunityComment] {
        let response = try await supabaseService.client
            .from("comments")
            .select("*, author:profiles(*)")
            .eq("post_id", value: postId)
            .eq("is_deleted", value: false)
            .order("created_at", ascending: true)
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        // Custom date decoding strategy for Supabase timestamps
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ"
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try multiple date formats
            let formats = [
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ",     // With microseconds and timezone
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSS",      // With microseconds, no timezone
                "yyyy-MM-dd'T'HH:mm:ssZ",            // No microseconds, with timezone
                "yyyy-MM-dd'T'HH:mm:ss",             // Basic ISO8601
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",      // With milliseconds and Z
                "yyyy-MM-dd'T'HH:mm:ss'Z'"           // With Z suffix
            ]
            
            for format in formats {
                dateFormatter.dateFormat = format
                if let date = dateFormatter.date(from: dateString) {
                    return date
                }
            }
            
            // If all formats fail, try ISO8601DateFormatter as fallback
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            // Last resort: basic ISO8601
            isoFormatter.formatOptions = [.withInternetDateTime]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
        }
        return try decoder.decode([CommunityComment].self, from: response.data)
    }
    
    func createComment(postId: String, content: String, parentId: String? = nil) async throws {
        let session = try await supabaseService.client.auth.session
        let token = session.accessToken
        
        let url = URL(string: "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/community-api/create-comment")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "postId": postId,
            "content": content,
            "parentId": parentId
        ] as [String : Any?]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        _ = try JSONDecoder().decode(CreateCommentResponse.self, from: data)
    }
    
    func updateComment(commentId: String, content: String) async throws {
        guard let userId = currentUser?.userId else { throw SupabaseError.authError("Not authenticated") }
        
        // Get profile ID
        let profile = try await supabaseService.getProfile(userId: userId)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        // Update comment with ownership check
        try await supabaseService.client
            .from("comments")
            .update(["content": content, "updated_at": ISO8601DateFormatter().string(from: Date())])
            .eq("id", value: commentId)
            .eq("author_id", value: profileId)
            .execute()
    }
    
    func deleteComment(commentId: String, postId: String) async throws {
        guard let userId = currentUser?.userId else { throw SupabaseError.authError("Not authenticated") }
        
        // Get profile ID
        let profile = try await supabaseService.getProfile(userId: userId)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        // Soft delete comment
        try await supabaseService.client
            .from("comments")
            .update(["is_deleted": true])
            .eq("id", value: commentId)
            .eq("author_id", value: profileId)
            .execute()
    }
    
    // MARK: - Realtime Subscriptions
    
    private var subscriptionRetryCount = 0
    private let maxRetryAttempts = 3
    private var reconnectionTimer: Timer?
    
    func subscribeToBoard(boardId: String) {
        Task {
            await subscribeToBoard(boardId: boardId, retryCount: 0)
        }
    }
    
    @MainActor
    private func subscribeToBoard(boardId: String, retryCount: Int) async {
        // Clean up previous subscription and wait for it to complete
        await unsubscribeFromBoardAsync()
        
        currentBoardId = boardId
        
        // Update connection status
        if retryCount > 0 {
            realtimeConnectionStatus = .reconnecting
        } else {
            realtimeConnectionStatus = .connecting
        }
        
        do {
            // Create a new channel with unique name to avoid conflicts
            let channelName = "board-\(boardId)-\(UUID().uuidString.prefix(8))"
            let channel = supabaseService.client.realtimeV2.channel(channelName)
            
            // Configure all postgres changes BEFORE storing the channel reference
            let insertToken = channel.onPostgresChange(
                InsertAction.self,
                schema: "public",
                table: "posts",
                filter: "board_id=eq.\(boardId)"
            ) { [weak self] action in
                Task { @MainActor in
                    guard let self = self else { return }
                    
                    // Fetch the new post with relations
                    if let postId = action.record["id"]?.stringValue {
                        do {
                            let response = try await self.supabaseService.client
                                .from("posts")
                                .select("*, author:profiles!author_id(*)")
                                .eq("id", value: postId)
                                .single()
                                .execute()
                            
                            let decoder = JSONDecoder()
                            decoder.keyDecodingStrategy = .convertFromSnakeCase
                            decoder.dateDecodingStrategy = self.createDateDecodingStrategy()
                            
                            let postWithProfile = try decoder.decode(PostWithProfile.self, from: response.data)
                            
                            // Convert to CommunityPost
                            let newPost = CommunityPost(
                                id: postWithProfile.id.uuidString,
                                boardId: postWithProfile.boardId,
                                authorId: postWithProfile.authorId.uuidString,
                                author: postWithProfile.author.map { self.convertToUserProfile($0) },
                                title: postWithProfile.title,
                                content: postWithProfile.content,
                                category: postWithProfile.category,
                                tags: postWithProfile.tags,
                                imageUrls: postWithProfile.imageUrls,
                                createdAt: postWithProfile.createdAt,
                                updatedAt: postWithProfile.updatedAt,
                                viewCount: postWithProfile.viewCount,
                                likeCount: postWithProfile.likeCount,
                                commentCount: postWithProfile.commentCount,
                                isPinned: postWithProfile.isPinned,
                                isNotice: postWithProfile.isNotice
                            )
                            
                            // Notify about new post via NotificationCenter
                            NotificationCenter.default.post(
                                name: Notification.Name("NewPostReceived"),
                                object: nil,
                                userInfo: ["post": newPost, "boardId": boardId]
                            )
                            
                            print("✅ New post received via realtime: \(newPost.title)")
                            
                        } catch {
                            print("❌ Error loading new post: \(error)")
                        }
                    }
                }
            }
            
            let updateToken = channel.onPostgresChange(
                UpdateAction.self,
                schema: "public",
                table: "posts",
                filter: "board_id=eq.\(boardId)"
            ) { [weak self] action in
                Task { @MainActor in
                    guard let self = self else { return }
                    
                    if let postId = action.record["id"]?.stringValue {
                        let updateInfo: [String: Any] = [
                            "postId": postId,
                            "boardId": boardId,
                            "updates": [
                                "likeCount": action.record["like_count"]?.intValue,
                                "commentCount": action.record["comment_count"]?.intValue,
                                "viewCount": action.record["view_count"]?.intValue
                            ].compactMapValues { $0 }
                        ]
                        
                        // Notify about post update via NotificationCenter
                        NotificationCenter.default.post(
                            name: Notification.Name("PostUpdated"),
                            object: nil,
                            userInfo: updateInfo
                        )
                        
                        print("✅ Post updated via realtime: \(postId)")
                    }
                }
            }
            
            // Configure comment changes
            let commentInsertToken = channel.onPostgresChange(
                InsertAction.self,
                schema: "public",
                table: "comments",
                filter: "post_id=in.(select id from posts where board_id=eq.\(boardId))"
            ) { [weak self] action in
                Task { @MainActor in
                    guard let self = self else { return }
                    
                    if let postId = action.record["post_id"]?.stringValue {
                        // Notify about new comment
                        NotificationCenter.default.post(
                            name: Notification.Name("NewCommentReceived"),
                            object: nil,
                            userInfo: ["postId": postId, "boardId": boardId]
                        )
                        
                        print("✅ New comment received via realtime for post: \(postId)")
                    }
                }
            }
            
            // Store tokens to prevent them from being deallocated
            _ = insertToken
            _ = updateToken
            _ = commentInsertToken
            
            // Store the channel reference
            self.realtimeChannel = channel
            
            // Subscribe to the channel after all configurations
            await channel.subscribe()
            
            // Reset retry count on successful subscription
            self.subscriptionRetryCount = 0
            
            // Update connection status to connected
            realtimeConnectionStatus = .connected
            
            print("✅ Realtime channel subscribed successfully for board: \(boardId)")
            
        } catch {
            print("❌ Error subscribing to realtime: \(error)")
            
            // Update connection status to error
            realtimeConnectionStatus = .error(error.localizedDescription)
            
            // Implement retry logic
            if retryCount < maxRetryAttempts {
                let delay = pow(2.0, Double(retryCount)) // Exponential backoff
                print("🔄 Retrying realtime subscription in \(delay)s (attempt \(retryCount + 1)/\(maxRetryAttempts))")
                
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                await subscribeToBoard(boardId: boardId, retryCount: retryCount + 1)
            } else {
                print("❌ Max retry attempts reached for realtime subscription")
                
                // Schedule a reconnection timer for later retry
                scheduleReconnectionTimer(boardId: boardId)
            }
        }
    }
    
    private func scheduleReconnectionTimer(boardId: String) {
        reconnectionTimer?.invalidate()
        reconnectionTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: false) { [weak self] _ in
            Task { @MainActor in
                guard let self = self else { return }
                print("⏰ Attempting to reconnect realtime subscription")
                await self.subscribeToBoard(boardId: boardId, retryCount: 0)
            }
        }
    }
    
    private func createDateDecodingStrategy() -> JSONDecoder.DateDecodingStrategy {
        return .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try multiple date formats
            let formats = [
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ",     // With microseconds and timezone
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSS",      // With microseconds, no timezone
                "yyyy-MM-dd'T'HH:mm:ssZ",            // No microseconds, with timezone
                "yyyy-MM-dd'T'HH:mm:ss",             // Basic ISO8601
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",      // With milliseconds and Z
                "yyyy-MM-dd'T'HH:mm:ss'Z'"           // With Z suffix
            ]
            
            let dateFormatter = DateFormatter()
            dateFormatter.locale = Locale(identifier: "en_US_POSIX")
            dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
            
            for format in formats {
                dateFormatter.dateFormat = format
                if let date = dateFormatter.date(from: dateString) {
                    return date
                }
            }
            
            // If all formats fail, try ISO8601DateFormatter as fallback
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            // Last resort: basic ISO8601
            isoFormatter.formatOptions = [.withInternetDateTime]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
        }
    }
    
    private func convertToUserProfile(_ profile: ProfileWithoutCodingKeys) -> UserProfile {
        return UserProfile(
            id: profile.id,
            userId: profile.userId,
            nickname: profile.nickname,
            avatarUrl: profile.avatarUrl,
            favoriteTeamId: profile.favoriteTeamId,
            favoriteTeamName: profile.favoriteTeamName,
            fanTeam: nil,
            language: profile.language,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
            joinedAt: profile.createdAt,
            postCount: nil,
            commentCount: nil,
            level: nil
        )
    }
    
    func unsubscribeFromBoard() {
        Task {
            await unsubscribeFromBoardAsync()
        }
    }
    
    @MainActor
    private func unsubscribeFromBoardAsync() async {
        // Cancel any pending reconnection timer
        reconnectionTimer?.invalidate()
        reconnectionTimer = nil
        
        if let channel = realtimeChannel {
            do {
                print("🔄 Unsubscribing from realtime channel: \(channel.topic)")
                await channel.unsubscribe()
                await supabaseService.client.realtimeV2.removeChannel(channel)
                print("✅ Successfully unsubscribed from realtime channel")
            } catch {
                print("⚠️ Error during unsubscription: \(error)")
            }
        }
        
        realtimeChannel = nil
        currentBoardId = nil
        subscriptionRetryCount = 0
        
        // Update connection status to disconnected
        realtimeConnectionStatus = .disconnected
    }
    
    // MARK: - Application Lifecycle Management
    
    func handleApplicationDidEnterBackground() {
        print("📱 Application entered background - pausing realtime subscriptions")
        Task {
            await unsubscribeFromBoardAsync()
        }
    }
    
    func handleApplicationWillEnterForeground() {
        print("📱 Application entering foreground - resuming realtime subscriptions")
        if let boardId = currentBoardId {
            Task {
                // Wait a bit for the app to fully become active
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await subscribeToBoard(boardId: boardId, retryCount: 0)
            }
        }
    }
    
    func handleApplicationWillTerminate() {
        print("📱 Application will terminate - cleaning up realtime subscriptions")
        Task {
            await unsubscribeFromBoardAsync()
        }
    }
    
    // MARK: - Post Detail
    
    func fetchPost(postId: String) async throws -> CommunityPost {
        let response = try await supabaseService.client
            .from("posts")
            .select("*, author:profiles!author_id(*)")
            .eq("id", value: postId)
            .single()
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        // Custom date decoding strategy for Supabase timestamps
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ"
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try multiple date formats
            let formats = [
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ",     // With microseconds and timezone
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSS",      // With microseconds, no timezone
                "yyyy-MM-dd'T'HH:mm:ssZ",            // No microseconds, with timezone
                "yyyy-MM-dd'T'HH:mm:ss",             // Basic ISO8601
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",      // With milliseconds and Z
                "yyyy-MM-dd'T'HH:mm:ss'Z'"           // With Z suffix
            ]
            
            for format in formats {
                dateFormatter.dateFormat = format
                if let date = dateFormatter.date(from: dateString) {
                    return date
                }
            }
            
            // If all formats fail, try ISO8601DateFormatter as fallback
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            // Last resort: basic ISO8601
            isoFormatter.formatOptions = [.withInternetDateTime]
            if let date = isoFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date string \(dateString)")
        }
        
        // 클래스 수준에서 정의된 PostWithProfile 구조체 사용
        let postWithProfile = try decoder.decode(PostWithProfile.self, from: response.data)
        
        // Profile을 UserProfile로 변환하여 CommunityPost 생성
        return CommunityPost(
            id: postWithProfile.id.uuidString,
            boardId: postWithProfile.boardId,
            authorId: postWithProfile.authorId.uuidString,
            author: postWithProfile.author.map { profile in
                UserProfile(
                    id: profile.id,
                    userId: profile.userId,
                    nickname: profile.nickname,
                    avatarUrl: profile.avatarUrl,
                    favoriteTeamId: profile.favoriteTeamId,
                    favoriteTeamName: profile.favoriteTeamName,
                    fanTeam: nil,
                    language: profile.language,
                    createdAt: profile.createdAt,
                    updatedAt: profile.updatedAt,
                    joinedAt: profile.createdAt,
                    postCount: nil,
                    commentCount: nil,
                    level: nil
                )
            },
            title: postWithProfile.title,
            content: postWithProfile.content,
            category: postWithProfile.category,
            tags: postWithProfile.tags,
            imageUrls: postWithProfile.imageUrls,
            createdAt: postWithProfile.createdAt,
            updatedAt: postWithProfile.updatedAt,
            viewCount: postWithProfile.viewCount,
            likeCount: postWithProfile.likeCount,
            commentCount: postWithProfile.commentCount,
            isPinned: postWithProfile.isPinned,
            isNotice: postWithProfile.isNotice
        )
    }
    
    // MARK: - Permission Check
    
    func checkBoardPermission(boardId: String) -> BoardPermission {
        // Find the board
        guard let board = boards.first(where: { $0.id == boardId }) else {
            return BoardPermission(canRead: false, canWrite: false, canComment: false, reason: "게시판을 찾을 수 없습니다")
        }
        
        switch board.type {
        case .all:
            // 전체 게시판은 읽기는 모두 가능, 쓰기는 로그인 필요
            return BoardPermission(
                canRead: true,
                canWrite: isAuthenticated,
                canComment: isAuthenticated,
                reason: isAuthenticated ? nil : "로그인이 필요합니다"
            )
            
        case .team:
            // 팀 게시판은 읽기는 모두 가능, 쓰기는 해당 팀 팬만 가능
            if !isAuthenticated {
                return BoardPermission(
                    canRead: true,
                    canWrite: false,
                    canComment: false,
                    reason: "로그인이 필요합니다"
                )
            }
            
            let isFan = currentUser?.favoriteTeamId == board.teamId
            
            if !isFan {
                return BoardPermission(
                    canRead: true,
                    canWrite: false,
                    canComment: false,
                    reason: "\(board.name) 팬만 게시글을 작성할 수 있습니다"
                )
            }
            
            return BoardPermission(
                canRead: true,
                canWrite: true,
                canComment: true,
                reason: nil
            )
        }
    }
    
    // MARK: - Health Check and Diagnostics
    
    func checkRealtimeHealth() -> RealtimeHealthInfo {
        let hasActiveChannel = realtimeChannel != nil
        let hasCurrentBoard = currentBoardId != nil
        let isConnected = realtimeConnectionStatus.isConnected
        
        return RealtimeHealthInfo(
            hasActiveChannel: hasActiveChannel,
            hasCurrentBoard: hasCurrentBoard,
            isConnected: isConnected,
            connectionStatus: realtimeConnectionStatus,
            currentBoardId: currentBoardId,
            retryCount: subscriptionRetryCount
        )
    }
    
    func forceReconnect() {
        guard let boardId = currentBoardId else {
            print("⚠️ No current board to reconnect to")
            return
        }
        
        Task {
            print("🔄 Force reconnecting to board: \(boardId)")
            await subscribeToBoard(boardId: boardId, retryCount: 0)
        }
    }
    
    deinit {
        print("🗑️ SupabaseCommunityService deinit - cleaning up resources")
        
        // Cancel any pending reconnection timer
        reconnectionTimer?.invalidate()
        reconnectionTimer = nil
        
        // Cancel all Combine subscriptions
        cancellables.removeAll()
        
        // Note: Cannot call async methods in deinit
        // The unsubscribeFromBoardAsync should be called before deallocation
        // This is handled by the application lifecycle methods
    }
}

// MARK: - Intermediate Models for Parsing

// 중간 파싱용 구조체 - posts 테이블과 author(profiles) 조인 응답 처리
struct PostWithProfile: Codable {
    let id: UUID
    let boardId: String
    let authorId: UUID
    let title: String
    let content: String
    let category: String?
    let tags: [String]?
    let imageUrls: [String]?
    let createdAt: Date
    let updatedAt: Date?
    let viewCount: Int
    let likeCount: Int
    let commentCount: Int
    let isPinned: Bool
    let isNotice: Bool
    let author: ProfileWithoutCodingKeys?
    // CodingKeys 제거 - decoder의 keyDecodingStrategy가 처리함
}

// Profile의 snake_case 필드를 처리하기 위한 임시 구조체
struct ProfileWithoutCodingKeys: Codable {
    let id: String
    let userId: String
    let nickname: String
    let avatarUrl: String?
    let favoriteTeamId: Int?
    let favoriteTeamName: String?
    let language: String
    let createdAt: Date
    let updatedAt: Date
    
    // CodingKeys를 명시적으로 제거하여 keyDecodingStrategy가 작동하도록 함
}

// MARK: - Response Models

struct CreateCommentResponse: Codable {
    let data: CommunityComment
}

struct SupabaseComment: Codable, Identifiable {
    let id: UUID
    let postId: UUID
    let authorId: UUID
    let parentId: UUID?
    let content: String
    let likeCount: Int
    let createdAt: Date
    let updatedAt: Date
    let author: Profile?
    // CodingKeys 제거 - decoder의 keyDecodingStrategy가 처리함
}