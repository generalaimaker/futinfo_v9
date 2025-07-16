import SwiftUI

struct PostDetailView: View {
    let postId: String
    @StateObject private var viewModel: PostDetailViewModel
    @State private var showingReplyTo: CommunityComment? = nil
    @State private var showingAuth = false
    @FocusState private var isCommentFocused: Bool
    
    init(postId: String) {
        self.postId = postId
        self._viewModel = StateObject(wrappedValue: PostDetailViewModel(postId: postId))
    }
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    if let post = viewModel.post {
                        // 게시글 내용
                        PostContentView(post: post, viewModel: viewModel)
                            .padding()
                        
                        Divider()
                        
                        // 댓글 섹션
                        CommentSectionView(
                            comments: viewModel.comments,
                            isLoading: viewModel.isLoadingComments,
                            showingReplyTo: $showingReplyTo
                        )
                        .id("comments")
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                // 댓글 입력 창
                if SupabaseCommunityService.shared.isAuthenticated {
                    CommentInputView(
                        text: $viewModel.newCommentText,
                        isCommentFocused: _isCommentFocused,
                        showingReplyTo: $showingReplyTo,
                        onSubmit: {
                            viewModel.submitComment()
                            withAnimation {
                                proxy.scrollTo("comments", anchor: .bottom)
                            }
                        }
                    )
                } else {
                    // 로그인 안내
                    Button {
                        showingAuth = true
                    } label: {
                        HStack {
                            Image(systemName: "bubble.left")
                            Text("댓글을 작성하려면 로그인하세요")
                            Spacer()
                            Text("로그인")
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadPost()
        }
        .sheet(isPresented: $showingAuth) {
            AuthView()
        }
        .overlay {
            if viewModel.isLoading && viewModel.post == nil {
                ProgressView()
            }
        }
    }
}

// 게시글 내용 뷰
struct PostContentView: View {
    let post: CommunityPost
    @ObservedObject var viewModel: PostDetailViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // 제목
            Text(post.title)
                .font(.title2)
                .fontWeight(.bold)
            
            // 작성자 정보
            HStack {
                // 팀 뱃지
                if let fanTeam = post.author?.fanTeam {
                    AsyncImage(url: URL(string: fanTeam.teamLogo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Circle()
                            .fill(Color.gray.opacity(0.3))
                    }
                    .frame(width: 24, height: 24)
                    
                    if fanTeam.isVerified {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(post.author?.nickname ?? "익명")
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    Text(formattedDate(post.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // 더보기 메뉴
                Menu {
                    Button {
                        // 공유 기능
                    } label: {
                        Label("공유", systemImage: "square.and.arrow.up")
                    }
                    
                    Button {
                        // 신고 기능
                    } label: {
                        Label("신고", systemImage: "exclamationmark.triangle")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .frame(width: 30, height: 30)
                }
            }
            
            // 본문
            Text(post.content)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
            
            // 이미지
            if let imageUrls = post.imageUrls, !imageUrls.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(imageUrls, id: \.self) { imageUrl in
                            AsyncImage(url: URL(string: imageUrl)) { image in
                                image
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 200, height: 200)
                                    .clipped()
                                    .cornerRadius(12)
                            } placeholder: {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 200, height: 200)
                                    .overlay {
                                        ProgressView()
                                    }
                            }
                        }
                    }
                }
                .padding(.vertical, 8)
            }
            
            // 통계 및 액션 버튼
            HStack(spacing: 20) {
                HStack(spacing: 4) {
                    Image(systemName: "eye")
                    Text("\(post.viewCount)")
                }
                .font(.caption)
                .foregroundColor(.secondary)
                
                Button {
                    viewModel.toggleLike()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: post.isLiked ? "heart.fill" : "heart")
                            .foregroundColor(post.isLiked ? .red : .secondary)
                        Text("\(post.likeCount)")
                    }
                }
                .font(.caption)
                
                HStack(spacing: 4) {
                    Image(systemName: "bubble.right")
                    Text("\(post.commentCount)")
                }
                .font(.caption)
                .foregroundColor(.secondary)
                
                Spacer()
                
                Button {
                    // 북마크 기능
                } label: {
                    Image(systemName: post.isBookmarked ? "bookmark.fill" : "bookmark")
                        .foregroundColor(post.isBookmarked ? .yellow : .secondary)
                }
            }
            .padding(.top, 8)
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy.MM.dd HH:mm"
        return formatter.string(from: date)
    }
}

// 댓글 섹션 뷰
struct CommentSectionView: View {
    let comments: [CommunityComment]
    let isLoading: Bool
    @Binding var showingReplyTo: CommunityComment?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // 댓글 헤더
            HStack {
                Text("댓글 \(comments.count)")
                    .font(.headline)
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                
                Spacer()
            }
            .background(Color.gray.opacity(0.05))
            
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else if comments.isEmpty {
                Text("첫 번째 댓글을 작성해보세요!")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(40)
            } else {
                ForEach(comments) { comment in
                    CommentRowView(
                        comment: comment,
                        onReply: { showingReplyTo = comment }
                    )
                    
                    Divider()
                        .padding(.leading, comment.parentCommentId != nil ? 56 : 0)
                }
            }
        }
    }
}

// 댓글 행 뷰
struct CommentRowView: View {
    let comment: CommunityComment
    let onReply: () -> Void
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if comment.parentCommentId != nil {
                Image(systemName: "arrow.turn.down.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.leading, 16)
            }
            
            // 작성자 프로필
            if let fanTeam = comment.author.fanTeam {
                AsyncImage(url: URL(string: fanTeam.teamLogo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                }
                .frame(width: 32, height: 32)
                .clipShape(Circle())
            } else {
                Circle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 32, height: 32)
                    .overlay {
                        Text(comment.author.nickname.prefix(1))
                            .font(.caption)
                            .foregroundColor(.white)
                    }
            }
            
            VStack(alignment: .leading, spacing: 6) {
                // 작성자 정보
                HStack(spacing: 6) {
                    Text(comment.author.nickname)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    
                    if let fanTeam = comment.author.fanTeam, fanTeam.isVerified {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    }
                    
                    Text("·")
                        .foregroundColor(.secondary)
                    
                    Text(timeAgoString(from: comment.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
                
                // 댓글 내용
                Text(comment.content)
                    .font(.body)
                    .fixedSize(horizontal: false, vertical: true)
                
                // 액션 버튼
                HStack(spacing: 16) {
                    Button {
                        // 좋아요 기능
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: comment.isLiked ? "heart.fill" : "heart")
                                .font(.caption)
                            Text("\(comment.likeCount)")
                                .font(.caption)
                        }
                        .foregroundColor(comment.isLiked ? .red : .secondary)
                    }
                    
                    if comment.parentCommentId == nil {
                        Button {
                            onReply()
                        } label: {
                            Text("답글")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(.top, 4)
            }
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }
    
    private func timeAgoString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// 댓글 입력 뷰
struct CommentInputView: View {
    @Binding var text: String
    @FocusState var isCommentFocused: Bool
    @Binding var showingReplyTo: CommunityComment?
    let onSubmit: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            if let replyTo = showingReplyTo {
                HStack {
                    Text("@\(replyTo.author.nickname)님에게 답글")
                        .font(.caption)
                        .foregroundColor(.blue)
                    
                    Spacer()
                    
                    Button {
                        showingReplyTo = nil
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal)
                .padding(.top, 8)
            }
            
            HStack(spacing: 12) {
                TextField("댓글을 입력하세요", text: $text, axis: .vertical)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .lineLimit(1...5)
                    .focused($isCommentFocused)
                
                Button {
                    onSubmit()
                    isCommentFocused = false
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(text.isEmpty ? .gray : .blue)
                }
                .disabled(text.isEmpty)
            }
            .padding()
        }
        .background(Color(UIColor.systemBackground))
        .overlay(alignment: .top) {
            Divider()
        }
    }
}