import Foundation

@MainActor
class StandingsViewModel: ObservableObject {
    @Published var standings: [Standing] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let service = SupabaseFootballAPIService.shared
    
    func loadStandings(leagueId: Int, season: Int = 2024) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                print("Loading standings...")
                standings = try await service.getStandings(leagueId: leagueId, season: season)
                
                if standings.isEmpty {
                    errorMessage = "표시할 순위가 없습니다."
                }
            } catch {
                errorMessage = "순위 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
                print("Load Standings Error: \(error)")
            }
            isLoading = false
        }
    }
    
    // 승점이 같을 경우 골득실 차이로 정렬
    func getSortedStandings() -> [Standing] {
        standings.sorted { s1, s2 in
            if s1.points == s2.points {
                return s1.goalsDiff > s2.goalsDiff
            }
            return s1.points > s2.points
        }
    }
    
    // 승률 계산 (승점/최대가능승점 * 100)
    func getWinRate(_ standing: Standing) -> Double {
        let maxPoints = standing.all.played * 3
        guard maxPoints > 0 else { return 0 }
        return Double(standing.points) / Double(maxPoints) * 100
    }
    
    // 최근 5경기 결과를 이모지로 변환
    func getFormEmojis(_ form: String?) -> String {
        guard let form = form else { return "" }
        return form.map { result -> String in
            switch result {
            case "W": return "✅" // 승
            case "D": return "⚪️" // 무
            case "L": return "❌" // 패
            default: return ""
            }
        }.joined()
    }
}