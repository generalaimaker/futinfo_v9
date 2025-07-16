import SwiftUI
import Kingfisher

struct BundesligaForceUpdateView: View {
    @State private var currentTeams: [(id: Int, name: String, logo: String)] = []
    @State private var isLoading = false
    @State private var message = ""
    @State private var successCount = 0
    
    // 정확한 분데스리가 10개 팀
    let correctBundesligaTeams = [
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
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("분데스리가 강제 업데이트")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                // 현재 상태
                VStack(alignment: .leading, spacing: 10) {
                    Text("현재 데이터베이스 상태:")
                        .font(.headline)
                    
                    if currentTeams.isEmpty {
                        Text("팀 정보를 불러오는 중...")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(Array(currentTeams.enumerated()), id: \.element.id) { index, team in
                            HStack {
                                Text("\(index + 1).")
                                KFImage(URL(string: team.logo))
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 30, height: 30)
                                Text(team.name)
                                Spacer()
                                Text("ID: \(team.id)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Text("\n현재 \(currentTeams.count)개 팀")
                            .foregroundColor(currentTeams.count == 10 ? .green : .red)
                            .fontWeight(.bold)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                
                // 목표 상태
                VStack(alignment: .leading, spacing: 10) {
                    Text("목표: 정확한 10개 팀")
                        .font(.headline)
                        .foregroundColor(.green)
                    
                    ForEach(Array(correctBundesligaTeams.enumerated()), id: \.element.0) { index, team in
                        HStack {
                            Text("\(index + 1).")
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text(team.1)
                            Spacer()
                            Text("ID: \(team.0)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(10)
                
                // 액션 버튼들
                VStack(spacing: 15) {
                    Button {
                        Task {
                            await loadCurrentTeams()
                        }
                    } label: {
                        Label("현재 상태 확인", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                    
                    Button {
                        Task {
                            await forceUpdateBundesliga()
                        }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            }
                            Label("분데스리가 강제 10팀 설정", systemImage: "hammer.fill")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(isLoading)
                }
                
                if !message.isEmpty {
                    Text(message)
                        .padding()
                        .background(successCount == 10 ? Color.green.opacity(0.2) : Color.orange.opacity(0.2))
                        .cornerRadius(10)
                        .multilineTextAlignment(.center)
                }
            }
            .padding()
        }
        .navigationTitle("분데스리가 강제 설정")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            Task {
                await loadCurrentTeams()
            }
        }
    }
    
    private func loadCurrentTeams() async {
        let service = SupabaseCommunityService.shared
        await service.loadBoards()
        
        let bundesligaBoards = service.boards.filter { board in
            guard let teamId = board.teamId else { return false }
            // 분데스리가 팀 ID 범위
            return teamId >= 157 && teamId <= 182
        }
        
        currentTeams = bundesligaBoards.compactMap { board in
            guard let teamId = board.teamId else { return nil }
            return (teamId, board.name.replacingOccurrences(of: " 게시판", with: ""), board.iconUrl ?? "")
        }.sorted { $0.id < $1.id }
    }
    
    private func forceUpdateBundesliga() async {
        isLoading = true
        message = "업데이트 시작..."
        successCount = 0
        
        do {
            let service = SupabaseService.shared
            
            // 1. 먼저 모든 분데스리가 관련 게시판 삭제
            message = "기존 분데스리가 게시판 삭제 중..."
            
            // 넓은 범위의 팀 ID로 삭제
            for teamId in 150...190 {
                do {
                    try await service.client
                        .from("boards")
                        .delete()
                        .eq("team_id", value: String(teamId))
                        .execute()
                } catch {
                    // 삭제 실패는 무시 (없는 팀일 수 있음)
                }
            }
            
            // league_id로도 삭제
            try await service.client
                .from("boards")
                .delete()
                .eq("league_id", value: "78")
                .execute()
            
            message = "기존 게시판 삭제 완료. 새 게시판 생성 중..."
            
            // 2. 잠시 대기
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2초
            
            // 3. 정확히 10개 팀 생성
            for (index, team) in correctBundesligaTeams.enumerated() {
                message = "생성 중: \(team.1) (\(index + 1)/10)"
                
                let boardDict: [String: Any] = [
                    "id": "team_\(team.0)",
                    "name": "\(team.1) 게시판",
                    "description": "\(team.1) 팬들을 위한 게시판",
                    "type": "team",
                    "team_id": String(team.0),
                    "league_id": "78",
                    "icon_url": "https://media.api-sports.io/football/teams/\(team.0).png",
                    "member_count": 0,
                    "post_count": 0,
                    "is_active": true,
                    "created_at": ISO8601DateFormatter().string(from: Date())
                ]
                
                // JSON 변환
                let jsonData = try JSONSerialization.data(withJSONObject: boardDict)
                let boardData = try JSONDecoder().decode([String: String].self, from: jsonData)
                
                try await service.client
                    .from("boards")
                    .insert(boardData)
                    .execute()
                
                successCount += 1
                
                // 각 팀 생성 후 짧은 대기
                try await Task.sleep(nanoseconds: 200_000_000) // 0.2초
            }
            
            message = "✅ 분데스리가 10개 팀 설정 완료!\n앱을 다시 시작하거나 락커룸을 새로고침하세요."
            
            // 4. 결과 다시 로드
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1초
            await loadCurrentTeams()
            
        } catch {
            message = "❌ 오류 발생: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
}