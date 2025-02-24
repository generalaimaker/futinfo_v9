import Foundation
import SwiftUI

@MainActor
class FixtureDetailViewModel: ObservableObject {
    @Published var events: [FixtureEvent] = []
    @Published var statistics: [TeamStatistics] = []
    @Published var halfStatistics: [HalfTeamStatistics] = []
    @Published var chartData: [FixtureChartData] = []
    @Published var lineups: [TeamLineup] = []
    @Published var topPlayers: [PlayerProfileData] = []
    @Published var matchPlayerStats: [TeamPlayersStatistics] = []
    @Published var headToHeadFixtures: [Fixture] = []
    @Published var team1Stats: HeadToHeadStats?
    @Published var team2Stats: HeadToHeadStats?
    @Published var homeTeamForm: TeamForm?
    @Published var awayTeamForm: TeamForm?
    
    @Published var isLoadingForm = false
    
    @Published var selectedStatisticType: StatisticType?
    @Published var selectedTeamId: Int?
    @Published var selectedPlayerId: Int?
    
    @Published var isLoadingEvents = false
    @Published var isLoadingStats = false
    @Published var isLoadingLineups = false
    @Published var isLoadingPlayers = false
    @Published var isLoadingMatchStats = false
    @Published var isLoadingHeadToHead = false
    @Published var isLoadingStandings = false
    
    @Published var errorMessage: String?
    @Published var standings: [Standing] = []
    
    private let service = FootballAPIService.shared
    private let fixtureId: Int
    private let season: Int
    private var currentFixture: Fixture?
    
    init(fixture: Fixture) {
        self.fixtureId = fixture.fixture.id
        self.season = fixture.league.season
        self.currentFixture = fixture
    }
    
    func loadAllData() {
        Task {
            // 1. 독립적인 데이터를 병렬로 로드
            await withTaskGroup(of: Void.self) { group in
                group.addTask { await self.loadEvents() }
                group.addTask { await self.loadStatistics() }
                group.addTask { await self.loadTeamForms() }
            }
            
            // 2. 매치 플레이어 통계 로드
            await loadMatchPlayerStats()
            
            // 3. 매치 플레이어 통계가 있는 경우에만 의존적인 데이터 로드
            if !matchPlayerStats.isEmpty {
                // 라인업과 상대전적을 병렬로 로드
                await withTaskGroup(of: Void.self) { group in
                    group.addTask { await self.loadLineups() }
                    group.addTask { await self.loadHeadToHead() }
                }
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
        
        print("\n📊 Loading statistics for fixture \(fixtureId)...")
        
        do {
            // 1. 전체 통계 로드
            var fetchedStats = try await service.getFixtureStatistics(
                fixtureId: fixtureId,
                teamId: selectedTeamId,
                type: selectedStatisticType
            )
            
            print("📊 Loaded general statistics: \(fetchedStats.count) teams")
            if !fetchedStats.isEmpty {
                print("📊 Teams:")
                for stats in fetchedStats {
                    print("   - \(stats.team.name): \(stats.statistics.count) statistics")
                }
            }
            
            // 2. 전/후반 통계 로드
            let halfStats = try await service.getFixtureHalfStatistics(fixtureId: fixtureId)
            
            print("📊 Loaded half statistics: \(halfStats.count) teams")
            if !halfStats.isEmpty {
                print("📊 Half statistics teams:")
                for stats in halfStats {
                    print("   - \(stats.team.name)")
                }
            }
            
            print("\n📊 Processing statistics data...")
            print("📊 Fetched stats count: \(fetchedStats.count)")
            
            // 통계 데이터 정렬 및 필터링
            fetchedStats = fetchedStats.map { teamStats in
                var stats = teamStats
                let sortedStatistics = stats.statistics.sorted { stat1, stat2 in
                    getStatisticPriority(stat1.type) > getStatisticPriority(stat2.type)
                }
                stats.statistics = sortedStatistics
                return stats
            }
            
            // 통계 데이터 검증
            if fetchedStats.isEmpty {
                print("⚠️ No statistics data available")
                errorMessage = "통계 정보가 없습니다"
                statistics = []
                halfStatistics = []
                chartData = []
                return
            }
            
            if fetchedStats.count < 2 {
                print("⚠️ Insufficient statistics data: only \(fetchedStats.count) team(s)")
                errorMessage = "통계 정보가 부족합니다"
                statistics = fetchedStats
                halfStatistics = []
                chartData = []
                return
            }
            
            // 통계 데이터 출력
            for teamStats in fetchedStats {
                print("\n📊 Team: \(teamStats.team.name)")
                print("   - Total statistics: \(teamStats.statistics.count)")
                for stat in teamStats.statistics {
                    print("   - \(stat.type): \(stat.value.displayValue)")
                }
            }
            
            // 차트 데이터 생성
            let homeStats = fetchedStats[0]
            let awayStats = fetchedStats[1]
            
            print("\n📊 Creating chart data for teams: \(homeStats.team.name) vs \(awayStats.team.name)")
            
            var newChartData: [FixtureChartData] = []
            
            // 차트 데이터 생성 함수
            func addChartData(type: StatisticType) {
                let chart = FixtureChartData(type: type, homeStats: homeStats, awayStats: awayStats)
                if chart.maxValue > 0 {
                    newChartData.append(chart)
                    print("   ✓ Added \(type.rawValue) chart")
                    print("     - Home: \(chart.homeValue)")
                    print("     - Away: \(chart.awayValue)")
                } else {
                    print("   ⚠️ Skipped \(type.rawValue) chart (no data)")
                }
            }
            
            // 공격 관련 차트
            print("\n📊 Adding attack charts...")
            addChartData(type: .shotsOnGoal)
            addChartData(type: .totalShots)
            addChartData(type: .expectedGoals)
            
            // 패스 관련 차트
            print("\n📊 Adding passing charts...")
            addChartData(type: .totalPasses)
            addChartData(type: .passesAccurate)
            addChartData(type: .passesPercentage)
            
            // 수비 관련 차트
            print("\n📊 Adding defense charts...")
            addChartData(type: .saves)
            addChartData(type: .blockedShots)
            addChartData(type: .fouls)
            
            // 기타 차트
            print("\n📊 Adding other charts...")
            addChartData(type: .ballPossession)
            addChartData(type: .cornerKicks)
            addChartData(type: .offsides)
            
            print("\n📊 Chart data summary:")
            print("   Total valid charts: \(newChartData.count)")
            
            chartData = newChartData
            print("✅ Statistics processing completed")
            
            statistics = fetchedStats
            halfStatistics = halfStats
            
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
        
        print("📊 Loading match player stats for fixture: \(fixtureId)")
        
        do {
            let stats = try await service.getFixturePlayersStatistics(fixtureId: fixtureId)
            print("📊 Loaded match player stats: \(stats.count) teams")
            
            if stats.isEmpty {
                errorMessage = "선수 통계 정보가 없습니다."
                print("⚠️ No match player stats found")
            } else if stats.count < 2 {
                errorMessage = "양 팀의 선수 통계 정보가 필요합니다."
                print("⚠️ Insufficient team stats: only \(stats.count) team(s)")
            } else {
                print("✅ Team 1: \(stats[0].team.name), Team 2: \(stats[1].team.name)")
            }
            
            matchPlayerStats = stats
            
        } catch {
            errorMessage = "선수 통계 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("❌ Load Match Player Stats Error: \(error)")
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
    
    // MARK: - Head to Head
    
    // MARK: - Standings
    
    func loadStandings() async {
        isLoadingStandings = true
        errorMessage = nil
        
        guard let fixture = currentFixture else {
            print("❌ No fixture data available")
            isLoadingStandings = false
            return
        }
        
        print("📊 Loading standings for league: \(fixture.league.id), season: \(fixture.league.season)")
        
        do {
            let leagueStandings = try await service.getStandings(
                leagueId: fixture.league.id,
                season: fixture.league.season
            )
            
            standings = leagueStandings
            print("✅ Standings loaded successfully: \(standings.count) teams")
            
        } catch {
            errorMessage = "순위 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("❌ Load Standings Error: \(error)")
        }
        
        isLoadingStandings = false
    }
    
    func loadHeadToHead() async {
        isLoadingHeadToHead = true
        errorMessage = nil
        
        print("🔄 Loading head to head stats...")
        
        
        // 팀 정보 확인
        guard matchPlayerStats.count >= 2 else {
            errorMessage = "양 팀의 선수 통계가 필요합니다."
            print("❌ Insufficient team stats: only \(matchPlayerStats.count) team(s)")
            isLoadingHeadToHead = false
            return
        }
        
        let team1Id = matchPlayerStats[0].team.id
        let team2Id = matchPlayerStats[1].team.id
        
        print("🆚 Loading head to head for teams: \(team1Id)(\(matchPlayerStats[0].team.name)) vs \(team2Id)(\(matchPlayerStats[1].team.name))")
        
        do {
            // 두 팀의 과거 상대 전적 가져오기
            headToHeadFixtures = try await service.getHeadToHead(team1Id: team1Id, team2Id: team2Id)
            
            if headToHeadFixtures.isEmpty {
                errorMessage = "상대전적 정보가 없습니다."
                print("⚠️ No head to head fixtures found")
                isLoadingHeadToHead = false
                return
            }
            
            print("📊 Loaded \(headToHeadFixtures.count) head to head fixtures")
            
            // 각 팀의 상대 전적 통계 계산
            team1Stats = HeadToHeadStats(fixtures: headToHeadFixtures, teamId: team1Id)
            team2Stats = HeadToHeadStats(fixtures: headToHeadFixtures, teamId: team2Id)
            
            print("✅ Head to head stats calculated successfully")
            
            // 순위 정보 로드
            await loadStandings()
            
        } catch {
            errorMessage = "상대 전적을 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("❌ Load Head to Head Error: \(error)")
        }
        
        isLoadingHeadToHead = false
    }
    
    // MARK: - Team Forms
    
    func loadTeamForms() async {
        isLoadingForm = true
        errorMessage = nil
        
        guard let fixture = currentFixture else {
            print("❌ No fixture data available")
            isLoadingForm = false
            return
        }
        
        let homeTeamId = fixture.teams.home.id
        let awayTeamId = fixture.teams.away.id
        
        print("🔄 Loading recent form for teams: \(homeTeamId) and \(awayTeamId)")
        
        do {
            // 홈팀 최근 5경기 결과
            let homeFixtures = try await service.getTeamFixtures(
                teamId: homeTeamId,
                season: season,
                last: 5
            )
            
            // 원정팀 최근 5경기 결과
            let awayFixtures = try await service.getTeamFixtures(
                teamId: awayTeamId,
                season: season,
                last: 5
            )
            
            // 홈팀 폼 계산
            let homeResults = homeFixtures.map { fixture -> TeamForm.MatchResult in
                let teamScore = fixture.teams.home.id == homeTeamId ? fixture.goals?.home : fixture.goals?.away
                let opponentScore = fixture.teams.home.id == homeTeamId ? fixture.goals?.away : fixture.goals?.home
                
                guard let team = teamScore, let opponent = opponentScore else {
                    return .draw
                }
                
                if team > opponent {
                    return .win
                } else if team < opponent {
                    return .loss
                } else {
                    return .draw
                }
            }
            
            // 원정팀 폼 계산
            let awayResults = awayFixtures.map { fixture -> TeamForm.MatchResult in
                let teamScore = fixture.teams.home.id == awayTeamId ? fixture.goals?.home : fixture.goals?.away
                let opponentScore = fixture.teams.home.id == awayTeamId ? fixture.goals?.away : fixture.goals?.home
                
                guard let team = teamScore, let opponent = opponentScore else {
                    return .draw
                }
                
                if team > opponent {
                    return .win
                } else if team < opponent {
                    return .loss
                } else {
                    return .draw
                }
            }
            
            homeTeamForm = TeamForm(teamId: homeTeamId, results: homeResults)
            awayTeamForm = TeamForm(teamId: awayTeamId, results: awayResults)
            
            print("✅ Team forms loaded successfully")
            
        } catch {
            errorMessage = "팀 폼 정보를 불러오는데 실패했습니다: \(error.localizedDescription)"
            print("❌ Load Team Forms Error: \(error)")
        }
        
        isLoadingForm = false
    }

    private func loadTopPlayersStats() async {
        isLoadingPlayers = true
        errorMessage = nil
        
        // 선발 선수 ID 목록
        let starterIds = Set(lineups.flatMap { lineup in
            lineup.startXI.map { $0.id }
        })
        
        print("📊 Processing match stats for \(starterIds.count) starters")
        
        // 모든 선수의 통계를 처리
        var processedStats: [PlayerProfileData] = []
        
        for teamStats in matchPlayerStats {
            for player in teamStats.players {
                // 선수가 경기에 참여했는지 확인
                guard let matchStat = player.statistics.first,
                      let games = matchStat.games,
                      let _ = games.position else {
                    continue
                }
                
                // PlayerMatchStats를 PlayerSeasonStats로 변환
                let seasonStats = [PlayerSeasonStats(
                    team: teamStats.team,
                    league: PlayerLeagueInfo(
                        id: 0,
                        name: "Current Match",
                        country: nil,
                        logo: "",
                        season: self.season,
                        flag: nil
                    ),
                    games: games,
                    substitutes: matchStat.substitutes ?? PlayerSubstitutes(in: nil, out: nil, bench: nil),
                    shots: matchStat.shots,
                    goals: matchStat.goals,
                    passes: matchStat.passes,
                    tackles: matchStat.tackles,
                    duels: matchStat.duels,
                    dribbles: matchStat.dribbles,
                    fouls: matchStat.fouls,
                    cards: matchStat.cards,
                    penalty: matchStat.penalty
                )]
                
                let profileData = PlayerProfileData(
                    player: player.player,
                    statistics: seasonStats
                )
                processedStats.append(profileData)
                print("✅ Processed stats for \(player.player.name ?? "Unknown Player")")
            }
        }
        
        // 평점 기준으로 정렬
        topPlayers = processedStats.sorted { player1, player2 in
            let rating1 = Double(player1.statistics?.first?.games?.rating ?? "0") ?? 0
            let rating2 = Double(player2.statistics?.first?.games?.rating ?? "0") ?? 0
            return rating1 > rating2
        }
        
        print("📊 Total players processed: \(topPlayers.count)")
        
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
