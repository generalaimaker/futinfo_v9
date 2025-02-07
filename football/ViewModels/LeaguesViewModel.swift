import Foundation

@MainActor
class LeaguesViewModel: ObservableObject {
    @Published var leagues: [LeagueDetails] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let service = FootballAPIService.shared
    
    func loadLeagues() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                print("Loading leagues...")
                var fetchedLeagues = try await service.getCurrentLeagues()
                
                // 리그별 이름과 국가 정보 수정
                fetchedLeagues = fetchedLeagues.map { league in
                    if league.league.id == 39 {
                        // Premier League - 잉글랜드 국기 적용
                        return LeagueDetails(
                            league: league.league,
                            country: Country(name: "England", code: "GB-ENG", flag: nil),
                            seasons: league.seasons
                        )
                    } else if league.league.id == 2 {
                        // Champions League 수정
                        let modifiedLeagueInfo = LeagueInfo(
                            id: league.league.id,
                            name: "Champions League",
                            type: league.league.type,
                            logo: league.league.logo
                        )
                        
                        return LeagueDetails(
                            league: modifiedLeagueInfo,
                            country: Country(name: "UEFA", code: "EU", flag: nil),
                            seasons: league.seasons
                        )
                    } else if league.league.id == 3 {
                        // Europa League 수정
                        let modifiedLeagueInfo = LeagueInfo(
                            id: league.league.id,
                            name: "Europa League",
                            type: league.league.type,
                            logo: league.league.logo
                        )
                        
                        return LeagueDetails(
                            league: modifiedLeagueInfo,
                            country: Country(name: "UEFA", code: "EU", flag: nil),
                            seasons: league.seasons
                        )
                    }
                    return league
                }
                
                leagues = fetchedLeagues
                
                if leagues.isEmpty {
                    errorMessage = "표시할 리그가 없습니다."
                }
            } catch {
                errorMessage = "리그 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
                print("Load Leagues Error: \(error)")
            }
            isLoading = false
        }
    }
    
    func formatSeason(_ year: Int) -> String {
        let nextYear = (year + 1) % 100
        return "\(year % 100)-\(nextYear)"
    }
}