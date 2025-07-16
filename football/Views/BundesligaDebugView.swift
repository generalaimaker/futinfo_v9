import SwiftUI

struct BundesligaDebugView: View {
    @StateObject private var viewModel = CommunityViewModel()
    @State private var isUpdating = false
    @State private var message = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Text("분데스리가 팀 디버그")
                .font(.title2)
                .fontWeight(.bold)
            
            // 현재 분데스리가 팀 목록
            VStack(alignment: .leading, spacing: 10) {
                Text("현재 앱에 표시되는 분데스리가 팀:")
                    .font(.headline)
                
                let bundesligaBoards = viewModel.teamBoards.filter { board in
                    guard let teamId = board.teamId else { return false }
                    // 분데스리가 팀 ID 범위 확인 (대략적으로 157-182)
                    return teamId >= 157 && teamId <= 182
                }
                
                if bundesligaBoards.isEmpty {
                    Text("분데스리가 팀이 없습니다.")
                        .foregroundColor(.red)
                } else {
                    ForEach(Array(bundesligaBoards.enumerated()), id: \.element.id) { index, board in
                        HStack {
                            Text("\(index + 1).")
                            Text(board.name)
                            Spacer()
                            Text("ID: \(board.teamId ?? 0)")
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal)
                    }
                    
                    Text("총 \(bundesligaBoards.count)개 팀")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.top, 5)
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(10)
            
            // 업데이트 버튼
            Button {
                Task {
                    await forceUpdateBundesligaTeams()
                }
            } label: {
                HStack {
                    if isUpdating {
                        ProgressView()
                            .scaleEffect(0.8)
                    }
                    Text("분데스리가 10개 팀으로 강제 업데이트")
                }
                .foregroundColor(.white)
                .padding()
                .background(Color.red)
                .cornerRadius(10)
            }
            .disabled(isUpdating)
            
            if !message.isEmpty {
                Text(message)
                    .foregroundColor(.green)
                    .padding()
            }
            
            Spacer()
        }
        .padding()
        .navigationTitle("분데스리가 디버그")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func forceUpdateBundesligaTeams() async {
        isUpdating = true
        message = ""
        
        message = "업데이트 중..."
        
        await SupabaseCommunityService.shared.rebuildBundesligaTeams()
        
        // 잠시 대기 후 다시 로드
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        viewModel.loadBoards()
        
        isUpdating = false
        message = "업데이트 완료! 앱을 다시 시작하면 10개 팀이 표시됩니다."
    }
}