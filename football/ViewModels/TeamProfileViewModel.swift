import Foundation

@MainActor
class TeamProfileViewModel: ObservableObject {
    @Published var teamProfile: TeamProfile?
    @Published var teamStatistics: TeamSeasonStatistics?
    @Published var teamStanding: TeamStanding?
    @Published var teamSquad: [PlayerResponse] = []
    @Published var seasons: [Int] = []
    @Published var selectedSeason: Int = 2024 // 현재 시즌
    @Published var selectedLeagueId: Int?
    @Published var chartData: [TeamSeasonChartData] = []
    
    @Published var isLoadingProfile = false
    @Published var isLoadingStats = false
    @Published var isLoadingSeasons = false
    @Published var isLoadingSquad = false
    
    @Published var errorMessage: String?
    
    private let service = FootballAPIService.shared
    
    private var teamId: Int = 0
    
    init(teamId: Int, leagueId: Int? = nil) {
        self.teamId = teamId
        self.selectedLeagueId = leagueId
        
        // 현재 시즌을 기본값으로 설정 (2024)
        self.selectedSeason = 2024
        
        Task {
            await loadTeamProfile(teamId: teamId)
            await loadTeamSeasons(teamId: teamId)
            await loadTeamSquad(teamId: teamId)
            if let leagueId = leagueId {
                await loadTeamData(teamId: teamId, leagueId: leagueId)
                await loadTeamHistory()
            }
        }
    }
    
    func loadTeamProfile(teamId: Int) async {
        isLoadingProfile = true
        errorMessage = nil
        
        do {
            teamProfile = try await service.getTeamProfile(teamId: teamId)
        } catch {
            errorMessage = "팀 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Team Profile Error: \(error)")
        }
        
        isLoadingProfile = false
    }
    
    func loadTeamData(teamId: Int, leagueId: Int) async {
        isLoadingStats = true
        errorMessage = nil
        
        do {
            // 통계 데이터 로드
            let statistics = try await service.getTeamStatistics(
                teamId: teamId,
                leagueId: leagueId,
                season: selectedSeason
            )
            teamStatistics = statistics
            
            // 순위 데이터 로드 (실패해도 계속 진행)
            do {
                teamStanding = try await service.getTeamStanding(
                    teamId: teamId,
                    leagueId: leagueId,
                    season: selectedSeason
                )
            } catch {
                print("Standing data load failed: \(error)")
                // 순위 데이터가 없어도 계속 진행
                teamStanding = nil
            }
            
            // 차트 데이터 생성
            chartData = [
                TeamSeasonChartData(type: "승률", stats: statistics),
                TeamSeasonChartData(type: "경기당 득점", stats: statistics),
                TeamSeasonChartData(type: "클린시트", stats: statistics)
            ]
            
            // 에러 메시지 초기화
            errorMessage = nil
            
        } catch DecodingError.valueNotFound(let type, let context) {
            // 리그 ID가 null인 경우 처리
            print("Load Team Data Error: valueNotFound(\(type), \(context.debugDescription))")
            errorMessage = "이 팀의 리그 데이터를 찾을 수 없습니다."
            chartData = []
        } catch {
            print("Load Team Data Error: \(error)")
            errorMessage = "팀 데이터를 불러오는데 실패했습니다: \(error.localizedDescription)"
            chartData = []
        }
        
        isLoadingStats = false
    }
    
    func loadTeamSquad(teamId: Int) async {
        isLoadingSquad = true
        errorMessage = nil
        
        do {
            teamSquad = try await service.getTeamSquad(teamId: teamId)
        } catch DecodingError.keyNotFound(let key, let context) {
            // "player" 키를 찾을 수 없는 경우 - API 응답 구조가 다를 수 있음
            print("Load Team Squad Error: keyNotFound(\(key), \(context.debugDescription))")
            // 에러 메시지를 표시하지 않고 빈 배열로 설정 - UI에 영향을 주지 않음
            teamSquad = []
        } catch {
            print("Load Team Squad Error: \(error)")
            // 다른 에러의 경우 사용자에게 알림
            errorMessage = "선수단 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
        }
        
        isLoadingSquad = false
    }
    
    // MARK: - Helper Methods
    
    var squadByPosition: [SquadGroup] {
        SquadGroup.groupPlayers(teamSquad)
    }
    
    var currentStanding: String {
        teamStanding?.rank.description ?? "N/A"
    }
    
    @Published private(set) var teamHistory: [TeamHistory] = []
    
    func loadTeamHistory() async {
        guard let leagueId = selectedLeagueId else { return }
        
        let currentYear = Calendar.current.component(.year, from: Date())
        var history: [TeamHistory] = []
        
        // 최근 5개 시즌만 로드 (미래 시즌 제외)
        for season in seasons.prefix(5).filter({ $0 <= currentYear }) {
            // 각 API 호출을 개별적으로 처리하여 하나가 실패해도 다른 하나는 계속 진행
            var statistics: TeamSeasonStatistics?
            var standing: TeamStanding?
            
            do {
                statistics = try await service.getTeamStatistics(
                    teamId: teamId,
                    leagueId: leagueId,
                    season: season
                )
            } catch {
                print("Failed to load statistics for season \(season): \(error)")
                continue // 통계 로드 실패 시 이 시즌은 건너뜀
            }
            
            do {
                standing = try await service.getTeamStanding(
                    teamId: teamId,
                    leagueId: leagueId,
                    season: season
                )
            } catch {
                print("Failed to load standing for season \(season): \(error)")
                // 순위 로드 실패해도 계속 진행
            }
            
            // 통계 데이터가 있는 경우에만 히스토리에 추가
            if let stats = statistics {
                let seasonHistory = TeamHistory(
                    season: season,
                    leagueId: leagueId,
                    statistics: stats,
                    standing: standing
                )
                history.append(seasonHistory)
            }
        }
        
        await MainActor.run {
            self.teamHistory = history.sorted { $0.season > $1.season }
        }
    }
    
    func loadTeamSeasons(teamId: Int) async {
        isLoadingSeasons = true
        errorMessage = nil
        
        do {
            // 시즌 목록 가져오기
            var allSeasons = try await service.getTeamSeasons(teamId: teamId)
            
            // 현재 연도 이하의 시즌만 필터링 (미래 시즌 제외)
            let currentYear = Calendar.current.component(.year, from: Date())
            allSeasons = allSeasons.filter { $0 <= currentYear }
            
            // 시즌 목록 업데이트
            seasons = allSeasons
            
            // 현재 시즌(2024)을 기본값으로 설정
            if seasons.contains(2024) {
                selectedSeason = 2024
            } else if let firstSeason = seasons.first {
                // 현재 시즌이 없으면 가장 최근 시즌 선택
                selectedSeason = firstSeason
            }
        } catch {
            errorMessage = "시즌 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Team Seasons Error: \(error)")
        }
        
        isLoadingSeasons = false
    }
    
    // MARK: - Helper Methods
    
    func getFormattedSeason(_ season: Int) -> String {
        let nextYear = (season + 1) % 100
        return "\(season % 100)-\(nextYear)"
    }
    
    func getMostUsedFormation() -> String {
        guard let lineups = teamStatistics?.lineups else { return "N/A" }
        return lineups.max(by: { $0.played < $1.played })?.formation ?? "N/A"
    }
    
    func getRecentForm() -> String {
        return teamStatistics?.form ?? "N/A"
    }
}
