import SwiftUI

struct TestTeamChangeView: View {
    @StateObject private var communityService = SupabaseCommunityService.shared
    @State private var selectedTeamId: Int?
    @State private var isChanging = false
    @State private var message = ""
    
    let testTeams = [
        (id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png"),
        (id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png"),
        (id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png"),
        (id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png"),
        (id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png"),
        (id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png")
    ]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Current team
                if let currentUser = communityService.currentUser,
                   let teamId = currentUser.favoriteTeamId {
                    VStack {
                        Text("현재 팀")
                            .font(.headline)
                        AsyncImage(url: URL(string: "https://media.api-sports.io/football/teams/\(teamId).png")) { image in
                            image.resizable().scaledToFit()
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(width: 80, height: 80)
                        Text(currentUser.favoriteTeamName ?? "Team \(teamId)")
                            .font(.subheadline)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                }
                
                Divider()
                
                // Team selection
                Text("새 팀 선택")
                    .font(.headline)
                
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]) {
                    ForEach(testTeams, id: \.id) { team in
                        Button {
                            changeTeam(to: team)
                        } label: {
                            VStack {
                                AsyncImage(url: URL(string: team.logo)) { image in
                                    image.resizable().scaledToFit()
                                } placeholder: {
                                    ProgressView()
                                }
                                .frame(width: 60, height: 60)
                                Text(team.name)
                                    .font(.caption)
                                    .lineLimit(2)
                                    .multilineTextAlignment(.center)
                            }
                            .padding()
                            .background(
                                selectedTeamId == team.id ? Color.blue.opacity(0.2) : Color.gray.opacity(0.1)
                            )
                            .cornerRadius(10)
                        }
                        .disabled(isChanging)
                    }
                }
                .padding()
                
                if !message.isEmpty {
                    Text(message)
                        .foregroundColor(message.contains("실패") ? .red : .green)
                        .padding()
                }
                
                if isChanging {
                    ProgressView("팀 변경 중...")
                        .padding()
                }
                
                Spacer()
            }
            .navigationTitle("팀 변경 테스트")
            .padding()
        }
    }
    
    private func changeTeam(to team: (id: Int, name: String, logo: String)) {
        isChanging = true
        selectedTeamId = team.id
        message = ""
        
        Task {
            do {
                print("🔄 팀 변경 시작: \(team.name) (ID: \(team.id))")
                try await communityService.selectFavoriteTeam(
                    teamId: team.id,
                    teamName: team.name,
                    teamImageUrl: team.logo
                )
                await MainActor.run {
                    message = "✅ 팀 변경 성공: \(team.name)"
                    isChanging = false
                }
            } catch {
                await MainActor.run {
                    message = "❌ 팀 변경 실패: \(error.localizedDescription)"
                    isChanging = false
                    selectedTeamId = nil
                }
            }
        }
    }
}

#Preview {
    TestTeamChangeView()
}