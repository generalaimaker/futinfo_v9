import Foundation

@MainActor
class FixtureDetailViewModel: ObservableObject {
    @Published var events: [FixtureEvent] = []
    @Published var statistics: [TeamStatistics] = []
    @Published var lineups: [TeamLineup] = []
    @Published var topPlayers: [PlayerStats] = []
    
    @Published var isLoadingEvents = false
    @Published var isLoadingStats = false
    @Published var isLoadingLineups = false
    @Published var isLoadingPlayers = false
    
    @Published var errorMessage: String?
    
    private let service = FootballAPIService.shared
    private let fixtureId: Int
    private let season: Int
    
    init(fixtureId: Int, season: Int) {
        self.fixtureId = fixtureId
        self.season = season
    }
    
    func loadAllData() {
        Task {
            await withTaskGroup(of: Void.self) { group in
                group.addTask { await self.loadEvents() }
                group.addTask { await self.loadStatistics() }
                group.addTask { await self.loadLineups() }
            }
        }
    }
    
    func loadEvents() async {
        isLoadingEvents = true
        errorMessage = nil
        
        do {
            events = try await service.getFixtureEvents(fixtureId: fixtureId)
        } catch {
            errorMessage = "이벤트 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Events Error: \(error)")
        }
        
        isLoadingEvents = false
    }
    
    func loadStatistics() async {
        isLoadingStats = true
        errorMessage = nil
        
        do {
            statistics = try await service.getFixtureStatistics(fixtureId: fixtureId)
        } catch {
            errorMessage = "통계 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Statistics Error: \(error)")
        }
        
        isLoadingStats = false
    }
    
    func loadLineups() async {
        isLoadingLineups = true
        errorMessage = nil
        
        do {
            lineups = try await service.getFixtureLineups(fixtureId: fixtureId)
            
            // 선발 선수들의 통계 정보 로드
            if !lineups.isEmpty {
                await loadTopPlayersStats()
            }
        } catch {
            errorMessage = "라인업 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Lineups Error: \(error)")
        }
        
        isLoadingLineups = false
    }
    
    private func loadTopPlayersStats() async {
        isLoadingPlayers = true
        
        // 양 팀의 선발 선수들 중에서 통계 정보를 가져올 선수들 선택
        let selectedPlayers = lineups.flatMap { lineup in
            lineup.startXI.prefix(5)
        }
        
        var playerStats: [PlayerStats] = []
        
        for player in selectedPlayers {
            do {
                let stats = try await service.getPlayerStatistics(playerId: player.id, season: season)
                playerStats.append(contentsOf: stats)
                
                // API 요청 제한을 고려한 딜레이
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
            } catch {
                print("Failed to load stats for player \(player.id): \(error)")
            }
        }
        
        // 평점 기준으로 정렬
        topPlayers = playerStats.sorted { player1, player2 in
            let rating1 = Double(player1.statistics.first?.games.rating ?? "0") ?? 0
            let rating2 = Double(player2.statistics.first?.games.rating ?? "0") ?? 0
            return rating1 > rating2
        }
        
        isLoadingPlayers = false
    }
    
    // MARK: - Helper Methods
    
}