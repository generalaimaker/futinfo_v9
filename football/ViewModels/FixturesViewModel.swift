import Foundation

@MainActor
class FixturesViewModel: ObservableObject {
    @Published var fixtures: [Fixture] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    @Published var selectedSeason: Int = 2024 // 기본값: 2023-24 시즌
    
    let seasons = [2024, 2023, 2022, 2021, 2020] // 가능한 시즌 목록
    var leagueId: Int
    
    private let service = SupabaseFootballAPIService.shared
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        return formatter
    }()
    
    init(leagueId: Int) {
        self.leagueId = leagueId
    }
    
    func formatDate(_ dateString: String) -> String {
        // API 날짜 포맷 (UTC)
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        guard let date = dateFormatter.date(from: dateString) else { return dateString }
        
        // 출력 포맷 (한국어)
        dateFormatter.dateFormat = "M월 d일 (E) HH:mm"
        return dateFormatter.string(from: date)
    }
    
    func getMatchStatus(_ status: FixtureStatus) -> String {
        switch status.short {
        case "1H":
            return "전반전 \(status.elapsed ?? 0)'"
        case "2H":
            return "후반전 \(status.elapsed ?? 0)'"
        case "HT":
            return "하프타임"
        case "ET":
            return "연장전"
        case "P":
            return "승부차기"
        case "FT":
            return "경기 종료"
        case "NS":
            return "경기 예정"
        default:
            return status.long
        }
    }
    
    func loadFixtures() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                print("Loading fixtures...")
                // For now, get fixtures for current date
                fixtures = try await service.getFixturesForLeague(leagueId: leagueId, date: Date())
                
                if fixtures.isEmpty {
                    errorMessage = "표시할 경기가 없습니다."
                }
            } catch {
                errorMessage = "경기 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
                print("Load Fixtures Error: \(error)")
            }
            isLoading = false
        }
    }
    
    func getSeasonDisplay(_ season: Int) -> String {
        let nextYear = (season + 1) % 100
        return "\(season % 100)-\(nextYear)"
    }
}
