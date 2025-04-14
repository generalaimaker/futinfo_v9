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
            print("Loading leagues...")
            
            // API 호출 대신 하드코딩된 리그 목록 사용
            var hardcodedLeagues: [LeagueDetails] = []
            
            // Premier League
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 39,
                    name: "Premier League",
                    type: "League",
                    logo: "https://media.api-sports.io/football/leagues/39.png"
                ),
                country: Country(name: "England", code: "GB-ENG", flag: nil),
                seasons: nil
            ))
            
            // La Liga
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 140,
                    name: "La Liga",
                    type: "League",
                    logo: "https://media.api-sports.io/football/leagues/140.png"
                ),
                country: Country(name: "Spain", code: "ES", flag: nil),
                seasons: nil
            ))
            
            // Serie A
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 135,
                    name: "Serie A",
                    type: "League",
                    logo: "https://media.api-sports.io/football/leagues/135.png"
                ),
                country: Country(name: "Italy", code: "IT", flag: nil),
                seasons: nil
            ))
            
            // Bundesliga
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 78,
                    name: "Bundesliga",
                    type: "League",
                    logo: "https://media.api-sports.io/football/leagues/78.png"
                ),
                country: Country(name: "Germany", code: "DE", flag: nil),
                seasons: nil
            ))
            
            // Ligue 1
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 61,
                    name: "Ligue 1",
                    type: "League",
                    logo: "https://media.api-sports.io/football/leagues/61.png"
                ),
                country: Country(name: "France", code: "FR", flag: nil),
                seasons: nil
            ))
            
            // Champions League
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 2,
                    name: "Champions League",
                    type: "Cup",
                    logo: "https://media.api-sports.io/football/leagues/2.png"
                ),
                country: Country(name: "UEFA", code: "EU", flag: nil),
                seasons: nil
            ))
            
            // Europa League
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 3,
                    name: "Europa League",
                    type: "Cup",
                    logo: "https://media.api-sports.io/football/leagues/3.png"
                ),
                country: Country(name: "UEFA", code: "EU", flag: nil),
                seasons: nil
            ))
            
            // FA Cup
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 45,
                    name: "FA Cup",
                    type: "Cup",
                    logo: "https://media.api-sports.io/football/leagues/45.png"
                ),
                country: Country(name: "England", code: "GB-ENG", flag: nil),
                seasons: nil
            ))
            
            // Copa del Rey
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 143,
                    name: "Copa del Rey",
                    type: "Cup",
                    logo: "https://media.api-sports.io/football/leagues/143.png"
                ),
                country: Country(name: "Spain", code: "ES", flag: nil),
                seasons: nil
            ))
            
            // Coppa Italia
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 137,
                    name: "Coppa Italia",
                    type: "Cup",
                    logo: "https://media.api-sports.io/football/leagues/137.png"
                ),
                country: Country(name: "Italy", code: "IT", flag: nil),
                seasons: nil
            ))
            
            // Coupe de France
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 66,
                    name: "Coupe de France",
                    type: "Cup",
                    logo: "https://media.api-sports.io/football/leagues/66.png"
                ),
                country: Country(name: "France", code: "FR", flag: nil),
                seasons: nil
            ))
            
            // DFB Pokal
            hardcodedLeagues.append(LeagueDetails(
                league: LeagueInfo(
                    id: 81,
                    name: "DFB Pokal",
                    type: "Cup",
                    logo: "https://media.api-sports.io/football/leagues/81.png"
                ),
                country: Country(name: "Germany", code: "DE", flag: nil),
                seasons: nil
            ))
            
            leagues = hardcodedLeagues
            
            if leagues.isEmpty {
                errorMessage = "표시할 리그가 없습니다."
            }
            
            isLoading = false
        }
    }
    
    func formatSeason(_ year: Int) -> String {
        let nextYear = (year + 1) % 100
        return "\(year % 100)-\(nextYear)"
    }
}
