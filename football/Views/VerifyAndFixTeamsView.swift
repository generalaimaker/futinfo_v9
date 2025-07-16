import SwiftUI
import Kingfisher

struct VerifyAndFixTeamsView: View {
    @State private var isVerifying = false
    @State private var isFixing = false
    @State private var verificationResults: [TeamVerification] = []
    @State private var errorMessage: String?
    @State private var successMessage: String?
    
    struct TeamVerification: Identifiable {
        let id = UUID()
        let boardId: String
        let storedTeamId: Int
        let storedName: String
        let storedLogo: String?
        let actualTeamId: Int
        let actualName: String
        let actualLogo: String
        let leagueId: Int
        let isCorrect: Bool
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("주요 팀 정보 검증 및 수정")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("각 리그별 상위 10개 팀만 검증")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 20) {
                    Button("팀 정보 검증") {
                        Task {
                            await verifyAllTeams()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isVerifying || isFixing)
                    
                    if !verificationResults.isEmpty && verificationResults.contains(where: { !$0.isCorrect }) {
                        Button("모든 오류 수정") {
                            Task {
                                await fixAllErrors()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.red)
                        .disabled(isVerifying || isFixing)
                    }
                }
                
                if isVerifying {
                    ProgressView("팀 정보를 검증하는 중...")
                        .padding()
                }
                
                if isFixing {
                    ProgressView("오류를 수정하는 중...")
                        .padding()
                }
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                }
                
                if let success = successMessage {
                    Text(success)
                        .foregroundColor(.green)
                        .padding()
                }
                
                if !verificationResults.isEmpty {
                    VStack(alignment: .leading, spacing: 15) {
                        let incorrectTeams = verificationResults.filter { !$0.isCorrect }
                        
                        if incorrectTeams.isEmpty {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                Text("모든 팀 정보가 올바르게 설정되어 있습니다!")
                                    .fontWeight(.medium)
                            }
                            .padding()
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(10)
                        } else {
                            Text("오류 발견: \(incorrectTeams.count)개 팀")
                                .font(.headline)
                                .foregroundColor(.red)
                            
                            ForEach(incorrectTeams) { result in
                                TeamErrorCard(verification: result)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("팀 정보 검증")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    private func verifyAllTeams() async {
        isVerifying = true
        verificationResults.removeAll()
        errorMessage = nil
        successMessage = nil
        
        do {
            // 1. Supabase에서 모든 팀 게시판 가져오기
            await SupabaseCommunityService.shared.loadBoards()
            let boards = SupabaseCommunityService.shared.boards.filter { $0.type == .team }
            
            // 2. 주요 리그별 상위 10개 팀만 검증
            let topTeamsMapping: [Int: [(id: Int, name: String)]] = [
                // 프리미어리그 상위 10팀
                39: [
                    (33, "Man United"), (50, "Man City"), (40, "Liverpool"), (49, "Chelsea"),
                    (42, "Arsenal"), (47, "Tottenham"), (48, "West Ham"), (34, "Newcastle"),
                    (66, "Aston Villa"), (51, "Brighton")
                ],
                // 라리가 상위 10팀
                140: [
                    (541, "Real Madrid"), (529, "Barcelona"), (530, "Atletico Madrid"), (531, "Athletic Bilbao"),
                    (548, "Real Sociedad"), (532, "Valencia"), (536, "Sevilla"), (543, "Real Betis"),
                    (533, "Villarreal"), (538, "Celta Vigo")
                ],
                // 분데스리가 상위 10팀
                78: [
                    (168, "Bayer Leverkusen"), (172, "VfB Stuttgart"), (157, "Bayern Munich"), (165, "Borussia Dortmund"),
                    (160, "Eintracht Frankfurt"), (167, "VfL Wolfsburg"), (173, "Borussia M.Gladbach"), (182, "Union Berlin"),
                    (162, "Werder Bremen"), (169, "RB Leipzig")
                ],
                // 세리에 A 상위 10팀
                135: [
                    (497, "Juventus"), (489, "AC Milan"), (496, "Inter"), (505, "Roma"),
                    (502, "Napoli"), (499, "Lazio"), (487, "Fiorentina"), (503, "Torino"),
                    (492, "Atalanta"), (495, "Genoa")
                ],
                // 리그 1 상위 10팀
                61: [
                    (85, "PSG"), (106, "Monaco"), (81, "Marseille"), (80, "Lyon"),
                    (96, "Saint-Etienne"), (83, "Nantes"), (78, "Bordeaux"), (91, "Lille"),
                    (84, "Nice"), (93, "Strasbourg")
                ]
            ]
            
            var apiTeams: [Int: (name: String, logo: String, leagueId: Int)] = [:]
            
            // 각 리그의 상위 팀들만 처리
            for (leagueId, teams) in topTeamsMapping {
                for team in teams {
                    apiTeams[team.id] = (
                        name: team.name,
                        logo: "https://media.api-sports.io/football/teams/\(team.id).png",
                        leagueId: leagueId
                    )
                }
            }
            
            // 3. 검증 - 상위 8개 팀만 확인
            await MainActor.run {
                for board in boards {
                    if let teamId = board.teamId {
                        if let apiTeam = apiTeams[teamId] {
                            // 상위 8개 팀에 포함된 경우만 검증
                            let isNameCorrect = board.name == "\(apiTeam.name) 게시판"
                            let isLogoCorrect = board.iconUrl == "https://media.api-sports.io/football/teams/\(teamId).png"
                            
                            verificationResults.append(TeamVerification(
                                boardId: board.id,
                                storedTeamId: teamId,
                                storedName: board.name,
                                storedLogo: board.iconUrl,
                                actualTeamId: teamId,
                                actualName: "\(apiTeam.name) 게시판",
                                actualLogo: apiTeam.logo,
                                leagueId: apiTeam.leagueId,
                                isCorrect: isNameCorrect && isLogoCorrect
                            ))
                        }
                        // 상위 8개 팀에 포함되지 않은 팀은 무시
                    }
                }
                
                isVerifying = false
            }
        }
    }
    
    private func fixAllErrors() async {
        isFixing = true
        errorMessage = nil
        
        let incorrectTeams = verificationResults.filter { !$0.isCorrect }
        var fixedCount = 0
        
        for team in incorrectTeams {
            do {
                // 팀 정보 수정 (상위 8개 팀만 수정)
                try await SupabaseService.shared.client
                    .from("boards")
                    .update([
                        "name": team.actualName,
                        "icon_url": team.actualLogo,
                        "league_id": String(team.leagueId)
                    ])
                    .eq("id", value: team.boardId)
                    .execute()
                
                fixedCount += 1
            } catch {
                print("Error fixing team \(team.boardId): \(error)")
            }
        }
        
        await MainActor.run {
            isFixing = false
            successMessage = "\(fixedCount)개 팀 정보가 수정되었습니다."
            
            // 다시 검증
            Task {
                await verifyAllTeams()
            }
        }
    }
}

struct TeamErrorCard: View {
    let verification: VerifyAndFixTeamsView.TeamVerification
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Board ID: \(verification.boardId)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("Team ID: \(verification.storedTeamId)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack(spacing: 20) {
                // 현재 정보
                VStack(alignment: .center, spacing: 5) {
                    Text("현재")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                    
                    if let logo = verification.storedLogo {
                        KFImage(URL(string: logo))
                            .placeholder {
                                ProgressView()
                            }
                            .resizable()
                            .scaledToFit()
                            .frame(width: 50, height: 50)
                    } else {
                        Image(systemName: "photo")
                            .frame(width: 50, height: 50)
                            .foregroundColor(.gray)
                    }
                    
                    Text(verification.storedName)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                
                Image(systemName: "arrow.right")
                    .foregroundColor(.orange)
                
                // 올바른 정보
                VStack(alignment: .center, spacing: 5) {
                    Text("올바른 정보")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                    
                    if verification.actualName != "알 수 없는 팀" {
                        KFImage(URL(string: verification.actualLogo))
                            .placeholder {
                                ProgressView()
                            }
                            .resizable()
                            .scaledToFit()
                            .frame(width: 50, height: 50)
                        
                        Text(verification.actualName)
                            .font(.caption)
                            .multilineTextAlignment(.center)
                    } else {
                        Image(systemName: "xmark.circle")
                            .frame(width: 50, height: 50)
                            .foregroundColor(.red)
                        
                        Text("삭제 예정")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(10)
    }
}