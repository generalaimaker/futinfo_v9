import SwiftUI
import Kingfisher

struct VerifyTeamLogosView: View {
    @State private var isVerifying = false
    @State private var verificationResults: [VerificationResult] = []
    @State private var errorMessage: String?
    
    struct VerificationResult: Identifiable {
        let id = UUID()
        let boardId: String
        let teamId: Int
        let teamName: String
        let expectedLogo: String
        let actualLogo: String?
        let isCorrect: Bool
    }
    
    let teamLogos: [Int: String] = [
        // 프리미어리그
        33: "https://media.api-sports.io/football/teams/33.png",   // Manchester United
        34: "https://media.api-sports.io/football/teams/34.png",   // Newcastle
        35: "https://media.api-sports.io/football/teams/35.png",   // Bournemouth
        39: "https://media.api-sports.io/football/teams/39.png",   // Wolves
        40: "https://media.api-sports.io/football/teams/40.png",   // Liverpool
        42: "https://media.api-sports.io/football/teams/42.png",   // Arsenal
        44: "https://media.api-sports.io/football/teams/44.png",   // Burnley
        45: "https://media.api-sports.io/football/teams/45.png",   // Everton
        46: "https://media.api-sports.io/football/teams/46.png",   // Leicester
        47: "https://media.api-sports.io/football/teams/47.png",   // Tottenham
        48: "https://media.api-sports.io/football/teams/48.png",   // West Ham
        49: "https://media.api-sports.io/football/teams/49.png",   // Chelsea
        50: "https://media.api-sports.io/football/teams/50.png",   // Manchester City
        51: "https://media.api-sports.io/football/teams/51.png",   // Brighton
        52: "https://media.api-sports.io/football/teams/52.png",   // Crystal Palace
        55: "https://media.api-sports.io/football/teams/55.png",   // Brentford
        62: "https://media.api-sports.io/football/teams/62.png",   // Sheffield Utd
        65: "https://media.api-sports.io/football/teams/65.png",   // Southampton
        66: "https://media.api-sports.io/football/teams/66.png",   // Aston Villa
        71: "https://media.api-sports.io/football/teams/71.png",   // Nottingham Forest
        
        // 라리가
        529: "https://media.api-sports.io/football/teams/529.png", // Barcelona
        530: "https://media.api-sports.io/football/teams/530.png", // Atletico Madrid
        531: "https://media.api-sports.io/football/teams/531.png", // Athletic Club
        532: "https://media.api-sports.io/football/teams/532.png", // Valencia
        533: "https://media.api-sports.io/football/teams/533.png", // Villarreal
        536: "https://media.api-sports.io/football/teams/536.png", // Sevilla
        541: "https://media.api-sports.io/football/teams/541.png", // Real Madrid
        
        // 분데스리가
        157: "https://media.api-sports.io/football/teams/157.png", // Bayern Munich
        165: "https://media.api-sports.io/football/teams/165.png", // Borussia Dortmund
        168: "https://media.api-sports.io/football/teams/168.png", // Bayer Leverkusen
        
        // 세리에 A
        489: "https://media.api-sports.io/football/teams/489.png", // AC Milan
        492: "https://media.api-sports.io/football/teams/492.png", // Napoli
        496: "https://media.api-sports.io/football/teams/496.png", // Juventus
        497: "https://media.api-sports.io/football/teams/497.png", // AS Roma
        505: "https://media.api-sports.io/football/teams/505.png", // Inter
        
        // 리그 1
        85: "https://media.api-sports.io/football/teams/85.png",   // PSG
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Button("게시판 로고 확인") {
                    Task {
                        await verifyBoards()
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isVerifying)
                
                if isVerifying {
                    ProgressView("확인 중...")
                }
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .padding()
                }
                
                if !verificationResults.isEmpty {
                    VStack(alignment: .leading, spacing: 15) {
                        Text("검증 결과")
                            .font(.headline)
                        
                        ForEach(verificationResults.filter { !$0.isCorrect }) { result in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text(result.teamName)
                                        .font(.headline)
                                    
                                    Text("(ID: \(result.teamId))")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    
                                    Spacer()
                                    
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.orange)
                                }
                                
                                HStack(spacing: 20) {
                                    VStack {
                                        Text("현재 로고")
                                            .font(.caption)
                                        
                                        if let actualLogo = result.actualLogo {
                                            KFImage(URL(string: actualLogo))
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
                                    }
                                    
                                    Image(systemName: "arrow.right")
                                        .foregroundColor(.red)
                                    
                                    VStack {
                                        Text("올바른 로고")
                                            .font(.caption)
                                        
                                        KFImage(URL(string: result.expectedLogo))
                                            .placeholder {
                                                ProgressView()
                                            }
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 50, height: 50)
                                    }
                                }
                                
                                Text("Board ID: \(result.boardId)")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                            .background(Color.orange.opacity(0.1))
                            .cornerRadius(10)
                        }
                        
                        if verificationResults.filter({ !$0.isCorrect }).isEmpty {
                            Text("모든 팀 로고가 올바르게 설정되어 있습니다!")
                                .foregroundColor(.green)
                                .padding()
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("팀 로고 확인")
    }
    
    private func verifyBoards() async {
        isVerifying = true
        verificationResults.removeAll()
        errorMessage = nil
        
        // Load boards
        await SupabaseCommunityService.shared.loadBoards()
        let boards = SupabaseCommunityService.shared.boards.filter { $0.type == .team }
        
        await MainActor.run {
            for board in boards {
                if let teamId = board.teamId,
                   let expectedLogo = teamLogos[teamId] {
                    let isCorrect = board.iconUrl == expectedLogo
                    
                    verificationResults.append(VerificationResult(
                        boardId: board.id,
                        teamId: teamId,
                        teamName: board.name,
                        expectedLogo: expectedLogo,
                        actualLogo: board.iconUrl,
                        isCorrect: isCorrect
                    ))
                }
            }
            
            isVerifying = false
        }
    }
}