import SwiftUI
import Kingfisher

struct PostListView: View {
    let boardId: String
    let boardName: String
    @StateObject private var viewModel: PostListViewModel
    @State private var showingCreatePost = false
    @State private var showingAuth = false
    
    init(boardId: String, boardName: String) {
        self.boardId = boardId
        self.boardName = boardName
        self._viewModel = StateObject(wrappedValue: PostListViewModel(boardId: boardId))
    }
    
    // Removed - using SupabaseCommunityService instead
    private let supabaseCommunityService = SupabaseCommunityService.shared
    
    var canWrite: Bool {
        supabaseCommunityService.checkBoardPermission(boardId: boardId).canWrite
    }
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.posts) { post in
                    NavigationLink(destination: PostDetailView(postId: post.id)) {
                        PostRowView(post: post)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            
                // 더 불러오기
                if viewModel.hasMorePages && !viewModel.posts.isEmpty {
                    HStack {
                        Spacer()
                        if viewModel.isLoadingMore {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                        } else {
                            Button {
                                viewModel.loadMorePosts()
                            } label: {
                                HStack(spacing: 6) {
                                    Text("더 보기")
                                    Image(systemName: "arrow.down.circle")
                                }
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(.blue)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(Color.blue.opacity(0.1))
                                .cornerRadius(20)
                            }
                        }
                        Spacer()
                    }
                    .padding(.vertical, 20)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(boardName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if canWrite {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCreatePost = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "square.and.pencil")
                                .font(.system(size: 16))
                            Text("글쓰기")
                                .font(.system(size: 14, weight: .medium))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue)
                        .cornerRadius(16)
                    }
                }
            } else if !supabaseCommunityService.isAuthenticated {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAuth = true
                    } label: {
                        Text("로그인")
                            .font(.caption)
                    }
                }
            }
        }
        .refreshable {
            viewModel.loadPosts()
        }
        .onAppear {
            print("🔵 PostListView.onAppear - boardId: \(boardId), boardName: \(boardName)")
            print("🔵 Current posts count: \(viewModel.posts.count)")
            if viewModel.posts.isEmpty {
                print("🔵 Posts empty, loading posts...")
                viewModel.loadPosts()
            }
        }
        .onDisappear {
            // Clean up realtime subscription
            SupabaseCommunityService.shared.unsubscribeFromBoard()
        }
        .task {
            // Delay subscription to ensure view is fully loaded
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
            
            // Start realtime subscription when view loads
            SupabaseCommunityService.shared.subscribeToBoard(boardId: boardId)
        }
        .sheet(isPresented: $showingCreatePost) {
            CreatePostView(boardId: boardId) { newPost in
                if newPost != nil {
                    // Refresh the posts list to show the new post
                    viewModel.loadPosts()
                }
            }
        }
        .sheet(isPresented: $showingAuth) {
            AuthView()
        }
        .overlay {
            if viewModel.isLoading && viewModel.posts.isEmpty {
                ProgressView()
            } else if viewModel.posts.isEmpty && !viewModel.isLoading {
                ContentUnavailableView(
                    "아직 게시글이 없습니다",
                    systemImage: "doc.text",
                    description: Text(canWrite ? "첫 번째 게시글을 작성해보세요!" : "")
                )
            }
        }
    }
}

// 게시글 행 뷰
struct PostRowView: View {
    let post: CommunityPost
    @State private var showImagePreview = false
    @State private var isPressed = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // 상단 헤더 (작성자 정보)
            PostAuthorHeaderView(post: post)
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 12)
            
            // 메인 콘텐츠 (제목, 내용, 이미지)
            VStack(alignment: .leading, spacing: 12) {
                // 제목
                Text(post.title)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.primary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                
                // 내용
                if !post.content.isEmpty {
                    Text(post.content)
                        .font(.system(size: 15))
                        .foregroundColor(.primary.opacity(0.8))
                        .lineLimit(4)
                        .fixedSize(horizontal: false, vertical: true)
                }
                
                // 이미지
                if let imageUrls = post.imageUrls, !imageUrls.isEmpty {
                    PostImageGalleryPreview(imageUrls: imageUrls)
                        .padding(.top, 4)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
            
            // 하단 인터랙션 바
            PostInteractionBar(post: post)
                .padding(.horizontal, 12)
                .padding(.vertical, 12)
                .background(Color.gray.opacity(0.03))
        }
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.gray.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(isPressed ? 0.02 : 0.04), radius: isPressed ? 2 : 6, x: 0, y: isPressed ? 1 : 2)
        .scaleEffect(isPressed ? 0.98 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isPressed)
        .onLongPressGesture(minimumDuration: 0.05, maximumDistance: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
    }
}

// 게시글 헤더 (배지와 제목)
struct PostHeaderView: View {
    let post: CommunityPost
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 8) {
                // 공지/고정 배지
                if post.isNotice {
                    NoticeBadge()
                }
                
                if post.isPinned && !post.isNotice {
                    PinnedBadge()
                }
                
                // 카테고리 배지 (팀 게시판에서만 표시)
                if let category = post.category, category != "general", post.boardId.hasPrefix("team_") {
                    CategoryBadge(category: category)
                }
                
                Spacer()
            }
            
            // 제목
            Text(post.title)
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(.primary)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// 공지 배지
struct NoticeBadge: View {
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "megaphone.fill")
                .font(.system(size: 10))
            Text("공지")
                .font(.system(size: 11, weight: .bold))
        }
        .foregroundColor(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            LinearGradient(colors: [Color.red, Color.red.opacity(0.8)], 
                         startPoint: .topLeading, 
                         endPoint: .bottomTrailing)
        )
        .cornerRadius(6)
    }
}

// 고정 배지
struct PinnedBadge: View {
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "pin.fill")
                .font(.system(size: 10))
            Text("고정")
                .font(.system(size: 11, weight: .bold))
        }
        .foregroundColor(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            LinearGradient(colors: [Color.orange, Color.orange.opacity(0.8)], 
                         startPoint: .topLeading, 
                         endPoint: .bottomTrailing)
        )
        .cornerRadius(6)
    }
}

// 카테고리 배지
struct CategoryBadge: View {
    let category: String
    
    var categoryInfo: (name: String, color: Color, icon: String) {
        switch category {
        case "match":
            return ("경기", Color.green, "sportscourt.fill")
        case "transfer":
            return ("이적", Color.blue, "arrow.left.arrow.right")
        case "news":
            return ("뉴스", Color.purple, "newspaper.fill")
        case "talk":
            return ("잡담", Color.gray, "bubble.left.and.bubble.right.fill")
        case "media":
            return ("미디어", Color.pink, "photo.fill")
        default:
            return ("일반", Color.gray, "square.grid.2x2")
        }
    }
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: categoryInfo.icon)
                .font(.system(size: 10))
            Text(categoryInfo.name)
                .font(.system(size: 11, weight: .semibold))
        }
        .foregroundColor(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(categoryInfo.color)
        .cornerRadius(6)
    }
}

// 게시글 내용 프리뷰
struct PostContentPreview: View {
    let post: CommunityPost
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 내용 미리보기
            if !post.content.isEmpty {
                Text(post.content)
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            // 이미지 썸네일
            if let imageUrls = post.imageUrls, !imageUrls.isEmpty {
                PostImagePreview(imageUrls: imageUrls)
            }
        }
    }
}

// 이미지 프리뷰
struct PostImagePreview: View {
    let imageUrls: [String]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(imageUrls.prefix(3), id: \.self) { imageUrl in
                    KFImage(URL(string: imageUrl))
                        .placeholder {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 80, height: 80)
                                .overlay(
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .gray))
                                )
                        }
                        .resizable()
                        .scaledToFill()
                        .frame(width: 80, height: 80)
                        .clipped()
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                }
                
                // 더 많은 이미지가 있을 경우
                if imageUrls.count > 3 {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.black.opacity(0.6))
                            .frame(width: 80, height: 80)
                        
                        Text("+\(imageUrls.count - 3)")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
            }
        }
    }
}

// 게시글 메타 정보
struct PostMetaView: View {
    let post: CommunityPost
    
    var body: some View {
        HStack(alignment: .center) {
            // 작성자 정보
            PostAuthorView(post: post)
            
            Spacer()
            
            // 상호작용 버튼들
            PostStatsView(post: post)
        }
        .padding(.top, 4)
    }
}

// 작성자 정보
struct PostAuthorView: View {
    let post: CommunityPost
    
    var body: some View {
        HStack(spacing: 8) {
            // 팀 뱃지와 작성자
            HStack(spacing: 6) {
                if let fanTeam = post.author?.fanTeam {
                    ZStack(alignment: .bottomTrailing) {
                        KFImage(URL(string: fanTeam.teamLogo))
                            .placeholder {
                                Circle()
                                    .fill(Color.gray.opacity(0.2))
                            }
                            .resizable()
                            .scaledToFit()
                            .frame(width: 20, height: 20)
                            .clipShape(Circle())
                            .overlay(
                                Circle()
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                        
                        if fanTeam.isVerified {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 8))
                                .foregroundColor(.blue)
                                .background(Circle().fill(Color.white).frame(width: 10, height: 10))
                                .offset(x: 2, y: 2)
                        }
                    }
                } else {
                    Circle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 20, height: 20)
                        .overlay(
                            Image(systemName: "person.fill")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                        )
                }
                
                Text(post.author?.nickname ?? "익명")
                    .font(.system(size: 14, weight: post.author?.fanTeam != nil ? .medium : .regular))
                    .foregroundColor(.primary.opacity(0.8))
            }
            
            Text("·")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
            
            Text(timeAgoString(from: post.createdAt))
                .font(.system(size: 13))
                .foregroundColor(.secondary)
        }
    }
    
    private func timeAgoString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// 통계 정보
struct PostStatsView: View {
    let post: CommunityPost
    
    var body: some View {
        HStack(spacing: 16) {
            // 조회수
            HStack(spacing: 4) {
                Image(systemName: "eye")
                    .font(.system(size: 14))
                Text(formatCount(post.viewCount))
                    .font(.system(size: 13, weight: .medium))
            }
            .foregroundColor(.secondary)
            
            // 좋아요
            Button(action: {}) {
                HStack(spacing: 4) {
                    Image(systemName: post.isLiked ? "heart.fill" : "heart")
                        .font(.system(size: 14))
                        .foregroundColor(post.isLiked ? .red : .secondary)
                    Text(formatCount(post.likeCount))
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(post.isLiked ? .red : .secondary)
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            // 댓글
            HStack(spacing: 4) {
                Image(systemName: "bubble.right")
                    .font(.system(size: 14))
                Text(formatCount(post.commentCount))
                    .font(.system(size: 13, weight: .medium))
            }
            .foregroundColor(.secondary)
        }
    }
    
    private func formatCount(_ count: Int) -> String {
        if count >= 1000 {
            return String(format: "%.1fK", Double(count) / 1000.0)
        }
        return "\(count)"
    }
}

// 새로운 작성자 헤더 뷰
struct PostAuthorHeaderView: View {
    let post: CommunityPost
    @State private var showMenu = false
    
    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            // 프로필 이미지
            ZStack(alignment: .bottomTrailing) {
                if let avatarUrl = post.author?.avatarUrl, !avatarUrl.isEmpty {
                    KFImage(URL(string: avatarUrl))
                        .placeholder {
                            Circle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 40, height: 40)
                        }
                        .resizable()
                        .scaledToFill()
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                } else if let fanTeam = post.author?.fanTeam {
                    KFImage(URL(string: fanTeam.teamLogo))
                        .placeholder {
                            Circle()
                                .fill(Color.gray.opacity(0.2))
                        }
                        .resizable()
                        .scaledToFit()
                        .frame(width: 40, height: 40)
                        .background(Circle().fill(Color.gray.opacity(0.1)))
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Image(systemName: "person.fill")
                                .font(.system(size: 20))
                                .foregroundColor(.gray)
                        )
                }
                
                // 팀 뱃지
                if let fanTeam = post.author?.fanTeam {
                    KFImage(URL(string: fanTeam.teamLogo))
                        .placeholder {
                            Circle()
                                .fill(Color.white)
                                .frame(width: 16, height: 16)
                        }
                        .resizable()
                        .scaledToFit()
                        .frame(width: 16, height: 16)
                        .background(Circle().fill(Color.white))
                        .clipShape(Circle())
                        .overlay(
                            Circle()
                                .stroke(Color.white, lineWidth: 2)
                        )
                        .offset(x: 4, y: 4)
                }
            }
            
            // 닉네임과 시간
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Text(post.author?.nickname ?? "익명")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    if post.author?.fanTeam?.isVerified == true {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 12))
                            .foregroundColor(.blue)
                    }
                    
                    // 배지들
                    if post.isNotice {
                        Text("공지")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .cornerRadius(4)
                    }
                    
                    if post.isPinned && !post.isNotice {
                        Image(systemName: "pin.fill")
                            .font(.system(size: 10))
                            .foregroundColor(.orange)
                    }
                }
                
                Text(timeAgoString(from: post.createdAt))
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // 더보기 메뉴
            Menu {
                Button {
                    // 팔로우 액션
                } label: {
                    Label("팔로우", systemImage: "person.badge.plus")
                }
                
                Button {
                    // 공유 액션
                } label: {
                    Label("공유", systemImage: "square.and.arrow.up")
                }
                
                Button(role: .destructive) {
                    // 신고 액션
                } label: {
                    Label("신고", systemImage: "exclamationmark.triangle")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16))
                    .foregroundColor(.secondary)
                    .padding(8)
                    .contentShape(Rectangle())
            }
        }
    }
    
    private func timeAgoString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// 이미지 갤러리 프리뷰
struct PostImageGalleryPreview: View {
    let imageUrls: [String]
    
    var body: some View {
        if imageUrls.count == 1 {
            // 단일 이미지 - 전체 너비
            KFImage(URL(string: imageUrls[0]))
                .placeholder {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 200)
                        .overlay(
                            ProgressView()
                        )
                }
                .resizable()
                .scaledToFill()
                .frame(maxHeight: 300)
                .clipped()
                .cornerRadius(12)
        } else if imageUrls.count == 2 {
            // 2개 이미지 - 나란히
            HStack(spacing: 2) {
                ForEach(0..<2, id: \.self) { index in
                    KFImage(URL(string: imageUrls[index]))
                        .placeholder {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.2))
                        }
                        .resizable()
                        .scaledToFill()
                        .frame(maxWidth: .infinity)
                        .frame(height: 150)
                        .clipped()
                        .cornerRadius(8)
                }
            }
        } else {
            // 3개 이상 - 그리드
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 2) {
                ForEach(Array(imageUrls.prefix(6).enumerated()), id: \.offset) { index, imageUrl in
                    if index < 5 {
                        KFImage(URL(string: imageUrl))
                            .placeholder {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(Color.gray.opacity(0.2))
                            }
                            .resizable()
                            .scaledToFill()
                            .frame(height: 100)
                            .clipped()
                            .cornerRadius(6)
                    } else if imageUrls.count > 6 {
                        // 더 많은 이미지 표시
                        ZStack {
                            KFImage(URL(string: imageUrl))
                                .placeholder {
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(Color.gray.opacity(0.2))
                                }
                                .resizable()
                                .scaledToFill()
                                .frame(height: 100)
                                .clipped()
                                .cornerRadius(6)
                                .overlay(
                                    Color.black.opacity(0.6)
                                        .cornerRadius(6)
                                )
                            
                            Text("+\(imageUrls.count - 5)")
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundColor(.white)
                        }
                    } else {
                        KFImage(URL(string: imageUrl))
                            .placeholder {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(Color.gray.opacity(0.2))
                            }
                            .resizable()
                            .scaledToFill()
                            .frame(height: 100)
                            .clipped()
                            .cornerRadius(6)
                    }
                }
            }
        }
    }
}

// 인터랙션 바
struct PostInteractionBar: View {
    let post: CommunityPost
    @State private var isLiked = false
    @State private var likeCount = 0
    
    var body: some View {
        HStack(spacing: 0) {
            // 좋아요 섹션
            HStack(spacing: 16) {
                // 좋아요 버튼
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        isLiked.toggle()
                        likeCount += isLiked ? 1 : -1
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: isLiked ? "heart.fill" : "heart")
                            .font(.system(size: 18))
                            .foregroundColor(isLiked ? .red : .secondary)
                            .scaleEffect(isLiked ? 1.1 : 1.0)
                            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isLiked)
                        
                        if likeCount > 0 {
                            Text("\(likeCount)")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(isLiked ? .red : .secondary)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(isLiked ? Color.red.opacity(0.1) : Color.clear)
                    .cornerRadius(20)
                }
                .buttonStyle(PlainButtonStyle())
                
                // 댓글 버튼
                HStack(spacing: 6) {
                    Image(systemName: "bubble.right")
                        .font(.system(size: 18))
                        .foregroundColor(.secondary)
                    
                    if post.commentCount > 0 {
                        Text("\(post.commentCount)")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            // 우측 액션들
            HStack(spacing: 20) {
                // 공유 버튼
                Button {
                    // 공유 액션
                } label: {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 18))
                        .foregroundColor(.secondary)
                }
                
                // 북마크 버튼
                Button {
                    // 북마크 액션
                } label: {
                    Image(systemName: "bookmark")
                        .font(.system(size: 18))
                        .foregroundColor(.secondary)
                }
            }
        }
        .onAppear {
            isLiked = post.isLiked
            likeCount = post.likeCount
        }
    }
}