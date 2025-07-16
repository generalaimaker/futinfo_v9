import SwiftUI
import PhotosUI

struct CreatePostView: View {
    let boardId: String
    let onComplete: (CommunityPost?) -> Void
    
    @StateObject private var viewModel: CreatePostViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var showingImagePicker = false
    
    init(boardId: String, onComplete: @escaping (CommunityPost?) -> Void) {
        self.boardId = boardId
        self.onComplete = onComplete
        self._viewModel = StateObject(wrappedValue: CreatePostViewModel(boardId: boardId))
    }
    
    var isValid: Bool {
        !viewModel.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !viewModel.content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // 카테고리 선택 (팀 게시판인 경우에만 표시)
                    if boardId.hasPrefix("team_") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("카테고리")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    PostCategoryChip(title: "일반", value: "general", selectedCategory: $viewModel.selectedCategory)
                                    PostCategoryChip(title: "경기", value: "match", selectedCategory: $viewModel.selectedCategory)
                                    PostCategoryChip(title: "이적", value: "transfer", selectedCategory: $viewModel.selectedCategory)
                                    PostCategoryChip(title: "뉴스", value: "news", selectedCategory: $viewModel.selectedCategory)
                                    PostCategoryChip(title: "잡담", value: "talk", selectedCategory: $viewModel.selectedCategory)
                                    PostCategoryChip(title: "미디어", value: "media", selectedCategory: $viewModel.selectedCategory)
                                }
                                .padding(.horizontal, 2)
                            }
                        }
                    }
                    
                    // 제목 입력
                    VStack(alignment: .leading, spacing: 8) {
                        Text("제목")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        TextField("제목을 입력하세요", text: $viewModel.title)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .font(.title3)
                    }
                    
                    // 내용 입력
                    VStack(alignment: .leading, spacing: 8) {
                        Text("내용")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        TextEditor(text: $viewModel.content)
                            .frame(minHeight: 200)
                            .padding(8)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                    }
                    
                    // 이미지 추가
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("사진 첨부")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            PhotosPicker(
                                selection: $selectedPhotos,
                                maxSelectionCount: 5,
                                matching: .images
                            ) {
                                Label("사진 추가", systemImage: "photo.badge.plus")
                                    .font(.caption)
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        if !viewModel.selectedImages.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(Array(viewModel.selectedImages.enumerated()), id: \.offset) { index, image in
                                        ZStack(alignment: .topTrailing) {
                                            Image(uiImage: image)
                                                .resizable()
                                                .scaledToFill()
                                                .frame(width: 100, height: 100)
                                                .clipped()
                                                .cornerRadius(8)
                                            
                                            Button {
                                                viewModel.selectedImages.remove(at: index)
                                            } label: {
                                                Image(systemName: "xmark.circle.fill")
                                                    .font(.body)
                                                    .foregroundColor(.white)
                                                    .background(Circle().fill(Color.black.opacity(0.6)))
                                            }
                                            .padding(4)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // 작성 팁
                    VStack(alignment: .leading, spacing: 8) {
                        Label("작성 팁", systemImage: "lightbulb")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Text("• 욕설, 비방, 허위사실 유포는 제재 대상입니다\n• 스포일러가 포함된 경우 제목에 [스포] 태그를 달아주세요\n• 출처가 있는 정보는 링크를 함께 첨부해주세요")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.leading, 24)
                    }
                    .padding()
                    .background(Color.blue.opacity(0.05))
                    .cornerRadius(8)
                }
                .padding()
            }
            .navigationTitle("게시글 작성")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("완료") {
                        submitPost()
                    }
                    .fontWeight(.semibold)
                    .disabled(!isValid || viewModel.isLoading)
                }
            }
            .onChange(of: selectedPhotos) { oldItems, newItems in
                Task {
                    viewModel.selectedImages.removeAll()
                    
                    for item in newItems {
                        if let data = try? await item.loadTransferable(type: Data.self),
                           let image = UIImage(data: data) {
                            viewModel.selectedImages.append(image)
                        }
                    }
                }
            }
            .alert("오류", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("확인") {
                    viewModel.errorMessage = nil
                }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
            .overlay {
                if viewModel.isLoading {
                    Color.black.opacity(0.3)
                        .ignoresSafeArea()
                        .overlay {
                            ProgressView("게시글 업로드 중...")
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                        }
                }
            }
        }
    }
    
    private func submitPost() {
        viewModel.createPost { post in
            if post != nil {
                dismiss()
                onComplete(post)
            }
        }
    }
}

// 카테고리 선택 칩
struct PostCategoryChip: View {
    let title: String
    let value: String
    @Binding var selectedCategory: String
    
    var isSelected: Bool {
        selectedCategory == value
    }
    
    var body: some View {
        Text(title)
            .font(.caption)
            .fontWeight(isSelected ? .semibold : .regular)
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? Color.blue : Color.gray.opacity(0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isSelected ? Color.clear : Color.gray.opacity(0.3), lineWidth: 1)
            )
            .onTapGesture {
                selectedCategory = value
            }
    }
}