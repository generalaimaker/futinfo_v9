import SwiftUI

struct AdminToolsView: View {
    @State private var isUpdating = false
    @State private var updateMessage = ""
    @State private var showAlert = false
    @State private var selectedLeague = 78 // Bundesliga by default
    
    let leagues = [
        (id: 39, name: "Premier League"),
        (id: 140, name: "La Liga"),
        (id: 135, name: "Serie A"),
        (id: 78, name: "Bundesliga"),
        (id: 61, name: "Ligue 1")
    ]
    
    var body: some View {
        NavigationStack {
            List {
                Section("리그 팀 관리") {
                    Picker("리그 선택", selection: $selectedLeague) {
                        ForEach(leagues, id: \.id) { league in
                            Text(league.name).tag(league.id)
                        }
                    }
                    
                    Button(action: updateLeagueTeams) {
                        HStack {
                            if isUpdating {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "arrow.clockwise.circle.fill")
                            }
                            Text("선택한 리그 팀 업데이트")
                        }
                    }
                    .disabled(isUpdating)
                    
                    if selectedLeague == 78 {
                        NavigationLink(destination: UpdateBundesligaTeamsView()) {
                            HStack {
                                Image(systemName: "flag.fill")
                                Text("분데스리가 팀 상세 설정")
                            }
                        }
                    }
                }
                
                Section("캐시 관리") {
                    Button(action: clearAllCache) {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                            Text("모든 캐시 삭제")
                        }
                    }
                    
                    Button(action: clearFixturesCache) {
                        HStack {
                            Image(systemName: "calendar.badge.minus")
                                .foregroundColor(.orange)
                            Text("경기 일정 캐시 삭제")
                        }
                    }
                }
                
                if !updateMessage.isEmpty {
                    Section("상태") {
                        Text(updateMessage)
                            .foregroundColor(updateMessage.contains("완료") ? .green : .red)
                    }
                }
            }
            .navigationTitle("관리자 도구")
            .alert("업데이트 완료", isPresented: $showAlert) {
                Button("확인", role: .cancel) { }
            } message: {
                Text(updateMessage)
            }
        }
    }
    
    private func updateLeagueTeams() {
        isUpdating = true
        updateMessage = ""
        
        Task {
            do {
                // 각 리그별 팀 데이터 (실제로는 API에서 가져와야 함)
                let teams: [(id: Int, name: String, logo: String)]
                
                switch selectedLeague {
                case 78: // Bundesliga
                    teams = [
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
                default:
                    teams = []
                    updateMessage = "선택한 리그의 팀 데이터가 없습니다."
                    isUpdating = false
                    return
                }
                
                try await SupabaseService.shared.updateLeagueTeams(leagueId: selectedLeague, teams: teams)
                
                await MainActor.run {
                    updateMessage = "✅ 리그 팀 업데이트 완료!"
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
    
    private func clearAllCache() {
        NotificationCenter.default.post(
            name: NSNotification.Name("ClearAllCache"),
            object: nil
        )
        updateMessage = "모든 캐시가 삭제되었습니다."
    }
    
    private func clearFixturesCache() {
        NotificationCenter.default.post(
            name: NSNotification.Name("ClearFixturesCache"),
            object: nil
        )
        updateMessage = "경기 일정 캐시가 삭제되었습니다."
    }
}

struct AdminToolsView_Previews: PreviewProvider {
    static var previews: some View {
        AdminToolsView()
    }
}