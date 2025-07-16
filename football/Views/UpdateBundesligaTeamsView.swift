import SwiftUI

struct UpdateBundesligaTeamsView: View {
    @State private var isUpdating = false
    @State private var updateMessage = ""
    @State private var showAlert = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("분데스리가 팀 업데이트")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("이 버튼을 누르면 분데스리가의 올바른 10개 팀이 설정됩니다.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            Button(action: updateBundesligaTeams) {
                HStack {
                    if isUpdating {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: "arrow.clockwise.circle.fill")
                    }
                    Text("팀 업데이트")
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(isUpdating)
            
            if !updateMessage.isEmpty {
                Text(updateMessage)
                    .foregroundColor(updateMessage.contains("완료") ? .green : .red)
                    .multilineTextAlignment(.center)
            }
        }
        .padding()
        .alert("업데이트 완료", isPresented: $showAlert) {
            Button("확인", role: .cancel) { }
        } message: {
            Text("분데스리가 팀이 성공적으로 업데이트되었습니다.")
        }
    }
    
    private func updateBundesligaTeams() {
        isUpdating = true
        updateMessage = ""
        
        Task {
            do {
                // 분데스리가 ID: 78
                let bundesligaTeams: [(id: Int, name: String, logo: String)] = [
                    (168, "Bayer Leverkusen", "https://media.api-sports.io/football/teams/168.png"),
                    (172, "VfB Stuttgart", "https://media.api-sports.io/football/teams/172.png"),
                    (157, "Bayern Munich", "https://media.api-sports.io/football/teams/157.png"),
                    (165, "Borussia Dortmund", "https://media.api-sports.io/football/teams/165.png"),
                    (160, "Eintracht Frankfurt", "https://media.api-sports.io/football/teams/160.png"),
                    (167, "VfL Wolfsburg", "https://media.api-sports.io/football/teams/167.png"),
                    (163, "Borussia M.Gladbach", "https://media.api-sports.io/football/teams/163.png"),
                    (182, "Union Berlin", "https://media.api-sports.io/football/teams/182.png"),
                    (162, "Werder Bremen", "https://media.api-sports.io/football/teams/162.png"),
                    (169, "RB Leipzig", "https://media.api-sports.io/football/teams/169.png")
                ]
                
                try await SupabaseService.shared.updateLeagueTeams(leagueId: 78, teams: bundesligaTeams)
                
                await MainActor.run {
                    updateMessage = "✅ 분데스리가 팀 업데이트 완료!"
                    showAlert = true
                    isUpdating = false
                }
            } catch {
                await MainActor.run {
                    updateMessage = "❌ 업데이트 실패: \(error.localizedDescription)"
                    isUpdating = false
                }
            }
        }
    }
}

struct UpdateBundesligaTeamsView_Previews: PreviewProvider {
    static var previews: some View {
        UpdateBundesligaTeamsView()
    }
}