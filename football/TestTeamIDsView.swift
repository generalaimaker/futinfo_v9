import SwiftUI

struct TestTeamIDsView: View {
    @State private var isLoading = false
    @State private var leagueTeams: [Int: [(id: Int, name: String, logo: String)]] = [:]
    @State private var errorMessage: String?
    
    let leagues = [
        (id: 39, name: "프리미어리그"),
        (id: 140, name: "라리가"),
        (id: 78, name: "분데스리가"),
        (id: 135, name: "세리에 A"),
        (id: 61, name: "리그 1")
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Button("팀 ID 확인하기") {
                    Task {
                        await fetchAllTeams()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading)
                
                if isLoading {
                    ProgressView("팀 정보를 가져오는 중...")
                        .padding()
                }
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                }
                
                ForEach(leagues, id: \.id) { league in
                    if let teams = leagueTeams[league.id] {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(league.name)
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 15) {
                                    ForEach(teams, id: \.id) { team in
                                        VStack(spacing: 5) {
                                            AsyncImage(url: URL(string: team.logo)) { image in
                                                image
                                                    .resizable()
                                                    .scaledToFit()
                                            } placeholder: {
                                                Circle()
                                                    .fill(Color.gray.opacity(0.3))
                                            }
                                            .frame(width: 50, height: 50)
                                            
                                            Text(team.name)
                                                .font(.caption)
                                                .lineLimit(2)
                                                .multilineTextAlignment(.center)
                                                .frame(width: 80)
                                            
                                            Text("ID: \(team.id)")
                                                .font(.caption2)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                            
                            // 팀 ID 리스트 표시
                            Text("팀 IDs: \(teams.map { String($0.id) }.joined(separator: ", "))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(.horizontal)
                        }
                        .padding(.vertical)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("팀 ID 확인")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func fetchAllTeams() async {
        isLoading = true
        errorMessage = nil
        leagueTeams.removeAll()
        
        do {
            for league in leagues {
                let standings = try await FootballAPIService.shared.getStandings(leagueId: league.id, season: 2025)
                
                let teams = standings.map { standing in
                    (id: standing.team.id, name: standing.team.name, logo: standing.team.logo)
                }.sorted { $0.name < $1.name }
                
                await MainActor.run {
                    leagueTeams[league.id] = teams
                }
                
                // 콘솔에 출력
                print("\n=== \(league.name) (ID: \(league.id)) ===")
                print("팀 개수: \(teams.count)")
                print("팀 IDs: [\(teams.map { String($0.id) }.joined(separator: ", "))]")
                print("\n팀 상세:")
                for team in teams {
                    print("  \(team.name): \(team.id)")
                }
                
                // API 호출 간격 두기
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초
            }
            
            // 전체 매핑 출력
            print("\n\n=== 전체 팀 ID 매핑 (복사용) ===")
            print("let leagueTeamMapping: [Int: [Int]] = [")
            for league in leagues {
                if let teams = leagueTeams[league.id] {
                    let ids = teams.map { String($0.id) }.joined(separator: ", ")
                    print("    \(league.id): [\(ids)],  // \(league.name)")
                }
            }
            print("]")
            
        } catch {
            await MainActor.run {
                errorMessage = "Error: \(error.localizedDescription)"
            }
        }
        
        await MainActor.run {
            isLoading = false
        }
    }
}