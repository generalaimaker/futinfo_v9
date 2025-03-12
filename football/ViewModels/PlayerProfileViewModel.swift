import Foundation

@MainActor
final class PlayerProfileViewModel: ObservableObject {
    @Published private(set) var playerProfile: PlayerProfileData?
    @Published private(set) var careerStats: [PlayerCareerStats] = []
    @Published private(set) var isLoading = false
    @Published private(set) var error: Error?
    
    private let apiService: FootballAPIService
    private let playerId: Int
    
    init(playerId: Int, apiService: FootballAPIService = .shared) {
        self.playerId = playerId
        self.apiService = apiService
    }
    
    func loadPlayerProfile() {
        Task {
            isLoading = true
            error = nil
            
            do {
                // 기본 프로필 정보와 시즌 통계 로드
                let profile = try await apiService.getPlayerProfile(playerId: playerId)
                self.playerProfile = profile
                
                // 커리어 통계 로드
                let career = try await apiService.getPlayerCareerStats(playerId: playerId)
                self.careerStats = career
                
                print("✅ Player profile loaded successfully")
                print("📊 Career stats loaded: \(career.count) teams")
                
            } catch {
                self.error = error
                print("❌ Error loading player profile: \(error.localizedDescription)")
            }
            
            isLoading = false
        }
    }
    
    // MARK: - Helper Methods
    
    private func formatStat(_ value: Int?) -> String {
        guard let value = value else { return "-" }
        return "\(value)"
    }
    
    private func formatPercentage(_ value: String?) -> String {
        guard let value = value else { return "-" }
        return "\(value)%"
    }
    
    // MARK: - Computed Properties
    
    var displayName: String {
        playerProfile?.player.name ?? "선수 정보 없음"
    }
    
    var age: String {
        if let age = playerProfile?.player.age {
            return "\(age)세"
        }
        return "나이 정보 없음"
    }
    
    var nationality: String {
        playerProfile?.player.nationality ?? "국적 정보 없음"
    }
    
    var currentTeamName: String {
        if let statistics = playerProfile?.statistics,
           let firstStat = statistics.first {
            return firstStat.team?.name ?? "소속팀 정보 없음"
        }
        return "소속팀 정보 없음"
    }
    
    var physicalInfo: String {
        var info = [String]()
        if let height = playerProfile?.player.height {
            info.append("\(height)")
        }
        if let weight = playerProfile?.player.weight {
            info.append("\(weight)")
        }
        return info.isEmpty ? "신체 정보 없음" : info.joined(separator: " / ")
    }
    
    var photoURL: String? {
        playerProfile?.player.photo
    }
    
    var seasonalStatsFormatted: [(String, String)] {
        guard let statistics = playerProfile?.statistics,
              let stats = statistics.first else { return [] }
        
        var formattedStats = [(String, String)]()
        
        // 포지션
        if let games = stats.games,
           let position = games.position {
            formattedStats.append(("포지션", position))
        }
        
        // 경기 출전
        if let games = stats.games {
            formattedStats.append(("출전", "\(games.appearences ?? 0)경기"))
            if let minutes = games.minutes {
                formattedStats.append(("출전 시간", "\(minutes)분"))
            }
            if let lineups = games.lineups {
                formattedStats.append(("선발", "\(lineups)회"))
            }
            if let rating = games.rating {
                formattedStats.append(("평점", rating))
            }
        }
        
        // 골키퍼 스탯
        if let games = stats.games,
           games.position == "Goalkeeper" {
            if let saves = stats.goals?.saves {
                formattedStats.append(("선방", "\(saves)회"))
            }
            if let conceded = stats.goals?.conceded {
                formattedStats.append(("실점", "\(conceded)골"))
            }
            if let cleanSheets = stats.goals?.total {
                formattedStats.append(("클린시트", "\(cleanSheets)회"))
            }
            if let penaltySaved = stats.penalty?.saved {
                formattedStats.append(("페널티 선방", "\(penaltySaved)회"))
            }
        } else {
            // 필드 플레이어 스탯
            if let goals = stats.goals?.total {
                formattedStats.append(("득점", "\(goals)골"))
            }
            if let assists = stats.goals?.assists {
                formattedStats.append(("도움", "\(assists)개"))
            }
            
            // 패스
            if let passes = stats.passes?.total {
                formattedStats.append(("패스 시도", "\(passes)회"))
            }
            if let keyPasses = stats.passes?.key {
                formattedStats.append(("키패스", "\(keyPasses)회"))
            }
            if let accuracy = stats.passes?.accuracy {
                formattedStats.append(("패스 성공률", accuracy.displayValue))
            }
            
            // 수비
            if let tackles = stats.tackles?.total {
                formattedStats.append(("태클", "\(tackles)회"))
            }
            if let interceptions = stats.tackles?.interceptions {
                formattedStats.append(("인터셉트", "\(interceptions)회"))
            }
            
            // 드리블
            if let dribbles = stats.dribbles {
                if let attempts = dribbles.attempts, let success = dribbles.success {
                    formattedStats.append(("드리블 성공률", "\(success)/\(attempts)"))
                }
            }
        }
        
        // 카드
        if let yellow = stats.cards?.yellow {
            formattedStats.append(("옐로카드", "\(yellow)장"))
        }
        if let red = stats.cards?.red {
            formattedStats.append(("레드카드", "\(red)장"))
        }
        
        return formattedStats
    }
    
    var careerHistory: [(String, String, String)] {
        careerStats.map { stat in
            let period = stat.seasons.isEmpty ? "현재" : {
                let sorted = stat.seasons.sorted()
                return sorted.count == 1 ? "\(sorted[0])" : "\(sorted.first!)-\(sorted.last!)"
            }()
            return (
                stat.team.name,
                period,
                "\(stat.seasons.count)시즌"
            )
        }.sorted { first, second in
            // 가장 최근 시즌을 상단에 표시
            let firstYear = Int(first.1.split(separator: "-").last ?? "") ?? 0
            let secondYear = Int(second.1.split(separator: "-").last ?? "") ?? 0
            return firstYear > secondYear
        }
    }
    
    // 현재 시즌 정보
    var currentSeason: String {
        // 선수 통계에서 시즌 정보 가져오기
        if let statistics = playerProfile?.statistics,
           let firstStat = statistics.first,
           let season = firstStat.league?.season {
            // 시즌 형식: 2024-25
            let nextYear = (season + 1) % 100
            return "\(season)-\(nextYear) 시즌"
        }
        
        // 기본값: 현재 시즌 (2024-25)
        return "2024-25 시즌"
    }
}
