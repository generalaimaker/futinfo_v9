import Foundation

@MainActor
class FixtureDetailViewModel: ObservableObject {
    @Published var events: [FixtureEvent] = []
    @Published var statistics: [TeamStatistics] = []
    @Published var lineups: [TeamLineup] = []
    @Published var topPlayers: [PlayerStats] = []
    @Published var matchPlayerStats: [TeamPlayersStatistics] = []
    
    @Published var selectedStatisticType: StatisticType?
    @Published var selectedTeamId: Int?
    @Published var selectedPlayerId: Int?
    
    @Published var isLoadingEvents = false
    @Published var isLoadingStats = false
    @Published var isLoadingLineups = false
    @Published var isLoadingPlayers = false
    @Published var isLoadingMatchStats = false
    
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
                group.addTask { await self.loadMatchPlayerStats() }
            }
        }
    }
    
    // MARK: - Events
    
    func loadEvents() async {
        isLoadingEvents = true
        errorMessage = nil
        
        do {
            var allEvents = try await service.getFixtureEvents(
                fixtureId: fixtureId,
                teamId: selectedTeamId,
                playerId: selectedPlayerId
            )
            
            // 이벤트 정렬 및 필터링
            allEvents.sort { event1, event2 in
                if event1.time.elapsed == event2.time.elapsed {
                    // 같은 시간대의 이벤트는 중요도 순으로 정렬
                    return getEventPriority(event1) > getEventPriority(event2)
                }
                return event1.time.elapsed < event2.time.elapsed
            }
            
            events = allEvents
        } catch {
            errorMessage = "이벤트 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Events Error: \(error)")
        }
        
        isLoadingEvents = false
    }
    
    private func getEventPriority(_ event: FixtureEvent) -> Int {
        switch event.eventCategory {
        case .goal: return 5
        case .var: return 4
        case .card: return 3
        case .substitution: return 2
        case .other: return 1
        }
    }
    
    // MARK: - Statistics
    
    func loadStatistics() async {
        isLoadingStats = true
        errorMessage = nil
        
        do {
            var fetchedStats = try await service.getFixtureStatistics(
                fixtureId: fixtureId,
                teamId: selectedTeamId,
                type: selectedStatisticType
            )
            
            // 통계 데이터 정렬 및 필터링
            if !fetchedStats.isEmpty {
                fetchedStats = fetchedStats.map { teamStats in
                    var stats = teamStats
                    let sortedStatistics = stats.statistics.sorted { stat1, stat2 in
                        getStatisticPriority(stat1.type) > getStatisticPriority(stat2.type)
                    }
                    stats.statistics = sortedStatistics
                    return stats
                }
            }
            
            statistics = fetchedStats
        } catch {
            errorMessage = "통계 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Statistics Error: \(error)")
        }
        
        isLoadingStats = false
    }
    
    private func getStatisticPriority(_ type: String) -> Int {
        switch type {
        case StatisticType.ballPossession.rawValue: return 10
        case StatisticType.shotsOnGoal.rawValue: return 9
        case StatisticType.totalShots.rawValue: return 8
        case StatisticType.saves.rawValue: return 7
        case StatisticType.cornerKicks.rawValue: return 6
        case StatisticType.fouls.rawValue: return 5
        case StatisticType.yellowCards.rawValue, StatisticType.redCards.rawValue: return 4
        case StatisticType.offsides.rawValue: return 3
        case StatisticType.passesAccurate.rawValue: return 2
        default: return 1
        }
    }
    
    // MARK: - Match Player Statistics
    
    func loadMatchPlayerStats() async {
        isLoadingMatchStats = true
        errorMessage = nil
        
        do {
            matchPlayerStats = try await service.getFixturePlayersStatistics(fixtureId: fixtureId)
        } catch {
            errorMessage = "선수 통계 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("Load Match Player Stats Error: \(error)")
        }
        
        isLoadingMatchStats = false
    }
    
    // MARK: - Lineups
    
    func loadLineups() async {
        isLoadingLineups = true
        errorMessage = nil
        
        do {
            lineups = try await service.getFixtureLineups(
                fixtureId: fixtureId,
                teamId: selectedTeamId
            )
            
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
        let playerGroups = selectedPlayers.chunked(into: 2) // API 요청 제한을 고려하여 2명씩 그룹화
        
        for group in playerGroups {
            let stats = await withTaskGroup(of: [PlayerStats].self) { taskGroup in
                for player in group {
                    taskGroup.addTask {
                        do {
                            return try await self.service.getPlayerStatistics(playerId: player.id, season: self.season)
                        } catch {
                            print("Failed to load stats for player \(player.id): \(error)")
                            return []
                        }
                    }
                }
                
                var groupResults: [PlayerStats] = []
                for await result in taskGroup {
                    groupResults.append(contentsOf: result)
                }
                return groupResults
            }
            
            playerStats.append(contentsOf: stats)
            
            // API 요청 제한을 고려한 딜레이
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
        }
        
        // 평점 기준으로 정렬
        topPlayers = playerStats.sorted { player1, player2 in
            let rating1 = Double(player1.statistics.first?.games.rating ?? "0") ?? 0
            let rating2 = Double(player2.statistics.first?.games.rating ?? "0") ?? 0
            return rating1 > rating2
        }
        
        isLoadingPlayers = false
    }
    
    // MARK: - Filter Methods
    
    func filterByTeam(_ teamId: Int?) {
        selectedTeamId = teamId
        Task {
            await loadEvents()
            await loadStatistics()
            if teamId != nil {
                await loadLineups()
            }
        }
    }
    
    func filterByPlayer(_ playerId: Int?) {
        selectedPlayerId = playerId
        Task {
            await loadEvents()
        }
    }
    
    func filterByStatisticType(_ type: StatisticType?) {
        selectedStatisticType = type
        Task {
            await loadStatistics()
        }
    }
}

// MARK: - Helpers
extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0 ..< Swift.min($0 + size, count)])
        }
    }
}