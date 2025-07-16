import Foundation

// 게시판 타입
enum BoardType: String, CaseIterable, Codable {
    case all = "all"              // 전체 게시판
    case team = "team"            // 팀별 게시판
    
    var displayName: String {
        switch self {
        case .all:
            return "전체 게시판"
        case .team:
            return "팀 게시판"
        }
    }
}

// 게시판 정보
struct CommunityBoard: Identifiable, Codable {
    let id: String
    let type: BoardType
    let name: String
    let teamId: Int?          // 팀 게시판인 경우 팀 ID
    let description: String?
    let iconUrl: String?
    let postCount: Int
    let memberCount: Int
    
    // 전체 게시판용 초기화
    static let allBoard = CommunityBoard(
        id: "all",
        type: .all,
        name: "전체 게시판",
        teamId: nil,
        description: "모든 축구 팬들이 자유롭게 소통하는 공간",
        iconUrl: nil,
        postCount: 0,
        memberCount: 0
    )
}

// 게시글
struct CommunityPost: Identifiable, Codable {
    let id: String
    let boardId: String
    let authorId: String
    let author: UserProfile?
    let title: String
    let content: String
    let category: String?
    let tags: [String]?
    let imageUrls: [String]?
    let createdAt: Date
    let updatedAt: Date?
    var viewCount: Int = 0
    var likeCount: Int = 0
    var commentCount: Int = 0
    let isPinned: Bool
    let isNotice: Bool
    
    // 현재 사용자의 상호작용 상태
    var isLiked: Bool = false
    var isBookmarked: Bool = false
    
    // CodingKeys 제거 - JSONDecoder의 keyDecodingStrategy가 자동으로 처리
}

// 댓글
struct CommunityComment: Identifiable, Codable {
    let id: String
    let postId: String
    let authorId: String
    let author: UserProfile
    let content: String
    let createdAt: Date
    let updatedAt: Date
    let likeCount: Int
    let parentCommentId: String?  // 대댓글인 경우
    
    // 현재 사용자의 상호작용 상태
    var isLiked: Bool = false
    
    // CodingKeys 제거 - JSONDecoder의 keyDecodingStrategy가 자동으로 처리
}

// 사용자 프로필
struct UserProfile: Codable {
    let id: String
    let userId: String?           // auth user ID
    let nickname: String
    let avatarUrl: String?        // profileImageUrl에서 avatarUrl로 변경 (서버 필드명과 일치)
    var favoriteTeamId: Int?      // fanTeamId에서 favoriteTeamId로 변경 (서버 필드명과 일치)
    var favoriteTeamName: String? // fanTeamName에서 favoriteTeamName으로 변경 (서버 필드명과 일치)
    var fanTeam: TeamBadgeInfo?   // 팀 뱃지 정보
    let language: String?
    let createdAt: Date?
    let updatedAt: Date?
    let joinedAt: Date?
    let postCount: Int?
    let commentCount: Int?
    let level: Int?
    
    // CodingKeys 제거 - JSONDecoder의 keyDecodingStrategy가 자동으로 처리
}

// 팀 뱃지 정보
struct TeamBadgeInfo: Codable {
    let teamId: Int
    let teamName: String
    let teamLogo: String
    let isVerified: Bool          // 인증된 팬인지
    let verifiedAt: Date?
    
    // CodingKeys 제거 - JSONDecoder의 keyDecodingStrategy가 자동으로 처리
}

// 게시글 작성/수정 요청
struct PostRequest: Codable {
    let boardId: String
    let title: String
    let content: String
    let imageUrls: [String]?
}

// 댓글 작성 요청
struct CommentRequest: Codable {
    let postId: String
    let content: String
    let parentCommentId: String?
}

// 페이지네이션 응답
struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let page: Int
    let pageSize: Int
    let totalItems: Int
    let totalPages: Int
    let hasNextPage: Bool
}

// 게시판 권한
struct BoardPermission: Codable {
    let canRead: Bool
    let canWrite: Bool
    let canComment: Bool
    let reason: String?  // 권한이 없는 경우 이유
}

// 알림 타입
enum NotificationType: String, Codable {
    case newComment = "new_comment"
    case postLike = "post_like"
    case commentLike = "comment_like"
    case mention = "mention"
}

// 커뮤니티 알림
struct CommunityNotification: Identifiable, Codable {
    let id: String
    let type: NotificationType
    let recipientId: String
    let actorId: String
    let actor: UserProfile
    let postId: String?
    let post: CommunityPost?
    let commentId: String?
    let comment: CommunityComment?
    let message: String
    let createdAt: Date
    let isRead: Bool
}

// 사용자 뱃지
struct UserBadge: Codable, Identifiable {
    let type: String
    let name: String
    let icon: String
    let color: String
    
    var id: String { type }
}