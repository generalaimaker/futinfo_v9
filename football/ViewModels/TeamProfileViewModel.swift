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
        
        async let statisticsTask = service.getTeamStatistics(
            teamId: teamId,
            leagueId: leagueId,
            season: selectedSeason
        )
        
        async let standingTask = service.getTeamStanding(
            teamId: teamId,
            leagueId: leagueId,
            season: selectedSeason
        )
        
        do {
            let (statistics, standing) = try await (statisticsTask, standingTask)
            teamStatistics = statistics
            teamStanding = standing
            
            // 차트 데이터 생성
            if let stats = teamStatistics {
                chartData = [
                    TeamSeasonChartData(type: "승률", stats: stats),
                    TeamSeasonChartData(type: "경기당 득점", stats: stats),
                    TeamSeasonChartData(type: "클린시트", stats: stats)
                ]
            }
        } catch {
            errorMessage = "팀 데이터를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Team Data Error: \(error)")
            chartData = []
        }
        
        isLoadingStats = false
    }
    
    func loadTeamSquad(teamId: Int) async {
        isLoadingSquad = true
        errorMessage = nil
        
        do {
            teamSquad = try await service.getTeamSquad(teamId: teamId)
        } catch {
            errorMessage = "선수단 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Team Squad Error: \(error)")
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
        
        var history: [TeamHistory] = []
        for season in seasons.prefix(5) {
            do {
                async let statisticsTask = service.getTeamStatistics(
                    teamId: teamId,
                    leagueId: leagueId,
                    season: season
                )
                async let standingTask = service.getTeamStanding(
                    teamId: teamId,
                    leagueId: leagueId,
                    season: season
                )
                
                let (statistics, standing) = try await (statisticsTask, standingTask)
                
                let seasonHistory = TeamHistory(
                    season: season,
                    leagueId: leagueId,
                    statistics: statistics,
                    standing: standing
                )
                history.append(seasonHistory)
            } catch {
                print("Failed to load history for season \(season): \(error)")
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
            seasons = try await service.getTeamSeasons(teamId: teamId)
            if let firstSeason = seasons.first {
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