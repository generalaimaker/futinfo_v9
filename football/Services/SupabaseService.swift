import Foundation
import Supabase

// Helper structure for cache response
struct CacheResponse: Codable {
    let data: [String: Any]?
    let expires_at: String
    
    enum CodingKeys: String, CodingKey {
        case data, expires_at
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        expires_at = try container.decode(String.self, forKey: .expires_at)
        
        if let dataString = try? container.decode(String.self, forKey: .data),
           let jsonData = dataString.data(using: .utf8),
           let dict = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
            data = dict
        } else {
            data = nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(expires_at, forKey: .expires_at)
        
        if let data = data,
           let jsonData = try? JSONSerialization.data(withJSONObject: data),
           let dataString = String(data: jsonData, encoding: .utf8) {
            try container.encode(dataString, forKey: .data)
        }
    }
}

class SupabaseService {
    static let shared = SupabaseService()
    
    let client: SupabaseClient
    
    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: "https://uutmymaxkkytibuiiaax.supabase.co")!,
            supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        )
    }
    
    // MARK: - Authentication
    
    func signUp(email: String, password: String, nickname: String) async throws -> User {
        let response = try await client.auth.signUp(
            email: email,
            password: password,
            data: ["nickname": .string(nickname)]
        )
        
        return response.user
    }
    
    func signIn(email: String, password: String) async throws -> User {
        let response = try await client.auth.signIn(
            email: email,
            password: password
        )
        
        return response.user
    }
    
    func signOut() async throws {
        try await client.auth.signOut()
    }
    
    func getCurrentUser() async throws -> User? {
        return try await client.auth.session.user
    }
    
    // MARK: - Profile Management
    
    func getProfile(userId: String) async throws -> Profile? {
        do {
            let profile: Profile = try await client
                .from("profiles")
                .select()
                .eq("user_id", value: userId)
                .single()
                .execute()
                .value
            
            // auth 정보에서 email과 provider 정보 추가
            if let mutableProfile = profile as Profile? {
                if let user = try await getCurrentUser() {
                    // provider 정보를 안전하게 추출
                    // appMetadata["provider"]는 이미 String 타입일 가능성이 높음
                    let provider = user.appMetadata["provider"].flatMap { "\($0)" } ?? "email"
                    
                    // email은 user 객체에서 가져옴
                    let profileWithAuth = Profile(
                        id: mutableProfile.id,
                        userId: mutableProfile.userId,
                        nickname: mutableProfile.nickname,
                        avatarUrl: mutableProfile.avatarUrl,
                        favoriteTeamId: mutableProfile.favoriteTeamId,
                        favoriteTeamName: mutableProfile.favoriteTeamName,
                        language: mutableProfile.language,
                        createdAt: mutableProfile.createdAt,
                        updatedAt: mutableProfile.updatedAt,
                        email: user.email,
                        authProvider: provider
                    )
                    return profileWithAuth
                }
            }
            
            return profile
        } catch {
            // 프로필이 없는 경우 nil 반환
            return nil
        }
    }
    
    func updateProfile(userId: String, updates: ProfileUpdate) async throws {
        try await client
            .from("profiles")
            .update(updates)
            .eq("user_id", value: userId)
            .execute()
    }
    
    // MARK: - Fixtures Caching
    
    func getCachedFixtures(date: String, leagueId: Int? = nil) async throws -> FixturesResponse? {
        var query = client
            .from("fixtures_cache")
            .select("data, expires_at")
            .eq("date", value: date)
        
        if let leagueId = leagueId {
            query = query.eq("league_id", value: String(leagueId))
        }
        
        let response = try await query.single().execute()
        
        // Decode the response data to a dictionary
        guard response.data.count > 0 else {
            return nil
        }
        
        let jsonObject = try JSONSerialization.jsonObject(with: response.data, options: [])
        guard let cacheData = jsonObject as? [String: Any] else {
            return nil
        }
        
        if let expiresAtString = cacheData["expires_at"] as? String,
           let expiresAt = ISO8601DateFormatter().date(from: expiresAtString),
           expiresAt > Date() {
            
            if let data = cacheData["data"] as? [String: Any] {
                let jsonData = try JSONSerialization.data(withJSONObject: data)
                return try JSONDecoder().decode(FixturesResponse.self, from: jsonData)
            }
        }
        
        return nil
    }
    
    func cacheFixtures(date: String, leagueId: Int? = nil, data: FixturesResponse, ttlHours: Double) async throws {
        let expiresAt = Date().addingTimeInterval(ttlHours * 3600)
        let jsonData = try JSONEncoder().encode(data)
        let dataDict = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] ?? [:]
        _ = dataDict // Suppress unused warning
        
        struct CacheInsert: Encodable {
            let date: String
            let league_id: Int
            let data: [String: Any]
            let expires_at: String
            
            enum CodingKeys: String, CodingKey {
                case date, league_id, data, expires_at
            }
            
            func encode(to encoder: Encoder) throws {
                var container = encoder.container(keyedBy: CodingKeys.self)
                try container.encode(date, forKey: .date)
                try container.encode(league_id, forKey: .league_id)
                try container.encode(expires_at, forKey: .expires_at)
                
                // Encode data as JSON
                let jsonData = try JSONSerialization.data(withJSONObject: data)
                let jsonObject = try JSONSerialization.jsonObject(with: jsonData)
                try container.encode(JSONValue(jsonObject), forKey: .data)
            }
        }
        
        let cacheData = CacheInsert(
            date: date,
            league_id: leagueId ?? 0,
            data: dataDict,
            expires_at: ISO8601DateFormatter().string(from: expiresAt)
        )
        
        try await client
            .from("fixtures_cache")
            .upsert(cacheData)
            .execute()
    }
    
    // MARK: - Team Fan Verification
    
    func verifyTeamFan(boardId: String) async throws -> BoardPermission {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        let response = try await client
            .rpc("verify_team_fan", params: [
                "board_id_param": boardId,
                "user_id_param": userId.uuidString
            ])
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        struct VerificationResponse: Codable {
            let success: Bool
            let canRead: Bool
            let canWrite: Bool
            let isFan: Bool?
            let boardType: String?
            let message: String?
            let error: String?
        }
        
        let result = try decoder.decode(VerificationResponse.self, from: response.data)
        
        if !result.success {
            throw SupabaseError.generalError(result.error ?? "Verification failed")
        }
        
        return BoardPermission(
            canRead: result.canRead,
            canWrite: result.canWrite,
            canComment: result.canWrite,
            reason: result.message
        )
    }
    
    func getUserBadges(userId: String) async throws -> [UserBadge] {
        let response = try await client
            .rpc("get_user_badges", params: ["user_id_param": userId])
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode([UserBadge].self, from: response.data)
    }
    
    // MARK: - Community Functions
    
    func getPosts(boardId: String? = nil, limit: Int = 20, offset: Int = 0) async throws -> [CommunityPost] {
        var query = client
            .from("posts")
            .select("id, board_id, author_id, title, content, image_urls, view_count, like_count, comment_count, is_pinned, is_notice, is_deleted, created_at, updated_at, author:profiles!author_id(*)")
            .eq("is_deleted", value: false)
        
        if let boardId = boardId {
            query = query.eq("board_id", value: boardId)
        }
        
        let posts: [CommunityPost] = try await query
            .order("created_at", ascending: false)
            .limit(limit)
            .range(from: offset, to: offset + limit - 1)
            .execute()
            .value
        
        return posts
    }
    
    func createPost(boardId: String, title: String, content: String, category: String = "general", tags: [String] = [], imageUrls: [String] = []) async throws -> CommunityPost {
        // Get current user
        guard let user = try await getCurrentUser() else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile to get author ID
        guard let profile = try await getProfile(userId: user.id.uuidString) else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        // Create post directly using Supabase client
        struct PostInsert: Encodable {
            let board_id: String
            let author_id: String
            let title: String
            let content: String
            let category: String
            let tags: [String]
            let image_urls: [String]
            let is_pinned: Bool
            let is_notice: Bool
        }
        
        let postData = PostInsert(
            board_id: boardId,
            author_id: profile.id,
            title: title,
            content: content,
            category: category,
            tags: tags,
            image_urls: imageUrls,
            is_pinned: false,
            is_notice: false
        )
        
        // Insert post first
        let insertResponse = try await client
            .from("posts")
            .insert(postData)
            .select()
            .single()
            .execute()
        
        // Parse the inserted post to get its ID
        struct InsertedPost: Decodable {
            let id: String
        }
        
        let insertedPost = try JSONDecoder().decode(InsertedPost.self, from: insertResponse.data)
        
        // Now fetch the complete post with author info
        let response = try await client
            .from("posts")
            .select("*, author:profiles!author_id(*)")
            .eq("id", value: insertedPost.id)
            .single()
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        
        // Debug log
        print("📝 게시글 생성 응답:")
        print("   데이터: \(String(data: response.data, encoding: .utf8) ?? "없음")")
        
        // Create minimal post if full parsing fails
        do {
            let post = try decoder.decode(CommunityPost.self, from: response.data)
            
            // Update post count for the board - commented out due to RLS policy
            // try? await client
            //     .rpc("increment_post_count", params: ["board_id_param": boardId])
            //     .execute()
            
            return post
        } catch {
            print("❌ 전체 파싱 실패, 최소 정보로 생성")
            
            // Create a minimal post object
            let minimalPost = CommunityPost(
                id: insertedPost.id,
                boardId: boardId,
                authorId: profile.id,
                author: UserProfile(
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
                    postCount: 0,
                    commentCount: 0,
                    level: 1
                ),
                title: title,
                content: content,
                category: category,
                tags: tags,
                imageUrls: imageUrls,
                createdAt: Date(),
                updatedAt: Date(),
                viewCount: 0,
                likeCount: 0,
                commentCount: 0,
                isPinned: false,
                isNotice: false
            )
            
            // Update post count for the board - commented out due to RLS policy
            // try? await client
            //     .rpc("increment_post_count", params: ["board_id_param": boardId])
            //     .execute()
            
            return minimalPost
        }
    }
    
    func updatePost(postId: String, title: String? = nil, content: String? = nil, tags: [String]? = nil) async throws -> CommunityPost {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile to verify ownership
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        // Build update data
        struct PostUpdate: Encodable {
            let updated_at: String
            let title: String?
            let content: String?
            let tags: [String]?
        }
        
        let updateData = PostUpdate(
            updated_at: ISO8601DateFormatter().string(from: Date()),
            title: title,
            content: content,
            tags: tags
        )
        
        // Update post with ownership check
        let response = try await client
            .from("posts")
            .update(updateData)
            .eq("id", value: postId)
            .eq("author_id", value: profileId) // Ensure user owns the post
            .select("*, author:profiles!author_id(*)")
            .single()
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(CommunityPost.self, from: response.data)
    }
    
    func deletePost(postId: String) async throws {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile to verify ownership
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        // Soft delete by setting is_deleted to true
        struct DeleteUpdate: Encodable {
            let is_deleted: Bool
        }
        
        try await client
            .from("posts")
            .update(DeleteUpdate(is_deleted: true))
            .eq("id", value: postId)
            .eq("author_id", value: profileId) // Ensure user owns the post
            .execute()
    }
    
    func toggleLike(targetType: String, targetId: String) async throws -> Bool {
        let token = try await client.auth.session.accessToken
        
        let url = URL(string: "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/community-api/toggle-like")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "targetType": targetType,
            "targetId": targetId
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(LikeResponse.self, from: data)
        return response.liked
    }
    
    // MARK: - Image Upload
    
    func uploadImage(imageData: Data, fileName: String) async throws -> String {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Create unique file path
        let timestamp = Int(Date().timeIntervalSince1970)
        let fileExtension = (fileName as NSString).pathExtension
        let uniqueFileName = "\(timestamp)_\(UUID().uuidString).\(fileExtension)"
        let filePath = "\(userId)/\(uniqueFileName)"
        
        // Upload to Supabase Storage
        try await client.storage
            .from("community-images")
            .upload(
                filePath,
                data: imageData,
                options: FileOptions(contentType: "image/\(fileExtension)")
            )
        
        // Get public URL
        let publicUrl = try client.storage
            .from("community-images")
            .getPublicURL(path: filePath)
        
        return publicUrl.absoluteString
    }
    
    func deleteImage(imageUrl: String) async throws {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Extract file path from URL
        guard let url = URL(string: imageUrl),
              let pathComponents = url.pathComponents.dropFirst(url.pathComponents.count - 2).joined(separator: "/").removingPercentEncoding else {
            throw SupabaseError.generalError("Invalid image URL")
        }
        
        // Verify the image belongs to the user
        if !pathComponents.hasPrefix(userId.uuidString) {
            throw SupabaseError.authError("Unauthorized to delete this image")
        }
        
        // Delete from storage
        try await client.storage
            .from("community-images")
            .remove(paths: [pathComponents])
    }
    
    // MARK: - Follow Management
    
    func followTeam(teamId: Int, teamName: String, teamImageUrl: String?) async throws {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile ID
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        struct FollowInsert: Encodable {
            let user_id: String
            let follow_type: String
            let follow_id: Int
            let follow_name: String
            let follow_image_url: String
        }
        
        let followData = FollowInsert(
            user_id: profileId,
            follow_type: "team",
            follow_id: teamId,
            follow_name: teamName,
            follow_image_url: teamImageUrl ?? ""
        )
        
        try await client
            .from("follows")
            .insert(followData)
            .execute()
    }
    
    func unfollowTeam(teamId: Int) async throws {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile ID
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        _ = try await client
            .from("follows")
            .delete()
            .eq("user_id", value: profileId)
            .eq("follow_type", value: "team")
            .eq("follow_id", value: teamId)
            .execute()
    }
    
    func getFollowedTeams() async throws -> [Follow] {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile ID
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        let response = try await client
            .from("follows")
            .select()
            .eq("user_id", value: profileId)
            .eq("follow_type", value: "team")
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        
        let follows = try decoder.decode([Follow].self, from: response.data)
        return follows
    }
    
    func followPlayer(playerId: Int, playerName: String, playerImageUrl: String?) async throws {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile ID
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        struct FollowInsert: Encodable {
            let user_id: String
            let follow_type: String
            let follow_id: Int
            let follow_name: String
            let follow_image_url: String
        }
        
        let followData = FollowInsert(
            user_id: profileId,
            follow_type: "player",
            follow_id: playerId,
            follow_name: playerName,
            follow_image_url: playerImageUrl ?? ""
        )
        
        try await client
            .from("follows")
            .insert(followData)
            .execute()
    }
    
    func unfollowPlayer(playerId: Int) async throws {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile ID
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        _ = try await client
            .from("follows")
            .delete()
            .eq("user_id", value: profileId)
            .eq("follow_type", value: "player")
            .eq("follow_id", value: playerId)
            .execute()
    }
    
    func getFollowedPlayers() async throws -> [Follow] {
        guard let userId = try await getCurrentUser()?.id else {
            throw SupabaseError.authError("Not authenticated")
        }
        
        // Get profile ID
        let profile = try await getProfile(userId: userId.uuidString)
        guard let profileId = profile?.id else {
            throw SupabaseError.profileError("Profile not found")
        }
        
        let response = try await client
            .from("follows")
            .select()
            .eq("user_id", value: profileId)
            .eq("follow_type", value: "player")
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        
        let follows = try decoder.decode([Follow].self, from: response.data)
        return follows
    }
    
    // MARK: - League Teams Management
    
    func updateLeagueTeams(leagueId: Int, teams: [(id: Int, name: String, logo: String)]) async throws {
        // Delete existing teams for this league
        try await client
            .from("league_teams")
            .delete()
            .eq("league_id", value: leagueId)
            .execute()
        
        // Insert new teams
        struct LeagueTeamInsert: Encodable {
            let league_id: Int
            let team_id: Int
            let team_name: String
            let team_logo: String
            let display_order: Int
        }
        
        let teamInserts = teams.enumerated().map { index, team in
            LeagueTeamInsert(
                league_id: leagueId,
                team_id: team.id,
                team_name: team.name,
                team_logo: team.logo,
                display_order: index
            )
        }
        
        try await client
            .from("league_teams")
            .insert(teamInserts)
            .execute()
    }
    
    func getLeagueTeams(leagueId: Int) async throws -> [(id: Int, name: String, logo: String)] {
        struct LeagueTeam: Decodable {
            let team_id: Int
            let team_name: String
            let team_logo: String
            let display_order: Int
        }
        
        let response = try await client
            .from("league_teams")
            .select()
            .eq("league_id", value: leagueId)
            .order("display_order", ascending: true)
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let leagueTeams = try decoder.decode([LeagueTeam].self, from: response.data)
        
        return leagueTeams.map { (id: $0.team_id, name: $0.team_name, logo: $0.team_logo) }
    }
}

// MARK: - Helper Types

struct JSONValue: Encodable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        if let dict = value as? [String: Any] {
            try container.encode(dict.mapValues { JSONValue($0) })
        } else if let array = value as? [Any] {
            try container.encode(array.map { JSONValue($0) })
        } else if let string = value as? String {
            try container.encode(string)
        } else if let bool = value as? Bool {
            try container.encode(bool)
        } else if let int = value as? Int {
            try container.encode(int)
        } else if let double = value as? Double {
            try container.encode(double)
        } else if value is NSNull {
            try container.encodeNil()
        } else {
            throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: encoder.codingPath, debugDescription: "Unsupported type"))
        }
    }
}

struct ProfileUpdate: Encodable {
    let nickname: String?
    let avatarUrl: String?
    let favoriteTeamId: Int?
    let favoriteTeamName: String?
    let language: String?
    
    enum CodingKeys: String, CodingKey {
        case nickname
        case avatarUrl = "avatar_url"
        case favoriteTeamId = "favorite_team_id"
        case favoriteTeamName = "favorite_team_name"
        case language
    }
}

// MARK: - Models

struct Profile: Codable {
    let id: String
    let userId: String
    let nickname: String
    let avatarUrl: String?
    let favoriteTeamId: Int?
    let favoriteTeamName: String?
    let language: String
    let createdAt: Date
    let updatedAt: Date
    let email: String?
    let authProvider: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case nickname
        case avatarUrl = "avatar_url"
        case favoriteTeamId = "favorite_team_id"
        case favoriteTeamName = "favorite_team_name"
        case language
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case email
        case authProvider = "auth_provider"
    }
}

struct SupabasePost: Codable, Identifiable {
    let id: String
    let boardId: String
    let authorId: String
    let title: String
    let content: String
    let category: String
    let tags: [String]
    let imageUrls: [String]
    let viewCount: Int
    let likeCount: Int
    let commentCount: Int
    let isPinned: Bool
    let isNotice: Bool
    let createdAt: Date
    let updatedAt: Date
    let author: Profile?
    let board: SupabaseBoard?
    
    enum CodingKeys: String, CodingKey {
        case id
        case boardId = "board_id"
        case authorId = "author_id"
        case title
        case content
        case category
        case tags
        case imageUrls = "image_urls"
        case viewCount = "view_count"
        case likeCount = "like_count"
        case commentCount = "comment_count"
        case isPinned = "is_pinned"
        case isNotice = "is_notice"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case author
        case board
    }
}

struct SupabaseBoard: Codable {
    let id: String
    let type: String
    let name: String
    let description: String?
    let teamId: Int?
    let leagueId: Int?
    let iconUrl: String?
    let postCount: Int
    let memberCount: Int
    
    enum CodingKeys: String, CodingKey {
        case id
        case type
        case name
        case description
        case teamId = "team_id"
        case leagueId = "league_id"
        case iconUrl = "icon_url"
        case postCount = "post_count"
        case memberCount = "member_count"
    }
}

struct Follow: Codable, Identifiable {
    let id: String
    let userId: String
    let followType: String
    let followId: Int
    let followName: String
    let followImageUrl: String?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case followType = "follow_type"
        case followId = "follow_id"
        case followName = "follow_name"
        case followImageUrl = "follow_image_url"
        case createdAt = "created_at"
    }
}

// Response models
struct CreatePostResponse: Codable {
    let data: CommunityPost
}

struct LikeResponse: Codable {
    let liked: Bool
}

// Custom Errors
enum SupabaseError: LocalizedError {
    case authError(String)
    case profileError(String)
    case networkError(String)
    case generalError(String)
    case apiError(String)
    
    var errorDescription: String? {
        switch self {
        case .authError(let message):
            return "Authentication error: \(message)"
        case .profileError(let message):
            return "Profile error: \(message)"
        case .networkError(let message):
            return "Network error: \(message)"
        case .generalError(let message):
            return "Error: \(message)"
        case .apiError(let message):
            return "API error: \(message)"
        }
    }
}