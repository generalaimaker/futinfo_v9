import Foundation
import Combine

/// 팀게시판 배치 데이터 로드 서비스
@MainActor
class TeamBoardBatchService: ObservableObject {
    static let shared = TeamBoardBatchService()
    
    // MARK: - Batch Models
    
    struct BatchRequest {
        let teamIds: [Int]
        let includeStandings: Bool
        let includeFixtures: Bool
        let includeTransfers: Bool
        
        init(teamIds: [Int], includeStandings: Bool = true, includeFixtures: Bool = true, includeTransfers: Bool = false) {
            self.teamIds = teamIds
            self.includeStandings = includeStandings
            self.includeFixtures = includeFixtures
            self.includeTransfers = includeTransfers
        }
    }
    
    struct BatchResult {
        let standings: [Int: TeamStanding]
        let fixtures: [Int: [Fixture]]
        let transfers: [Int: [Transfer]]
        let errors: [Int: Error]
        let loadTime: TimeInterval
    }
    
    // MARK: - Properties
    
    private let cacheService = TeamBoardCacheService.shared
    private let supabaseService = SupabaseFootballAPIService.shared
    private let fallbackService = FootballAPIService.shared
    
    // Rate limiting
    private var lastBatchTime: Date?
    private let minimumBatchInterval: TimeInterval = 2.0 // 2초 간격
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// 여러 팀의 데이터를 효율적으로 배치 로드
    func loadTeamsBatch(_ request: BatchRequest) async throws -> BatchResult {
        let startTime = Date()
        
        // Rate limiting 체크
        if let lastTime = lastBatchTime,
           Date().timeIntervalSince(lastTime) < minimumBatchInterval {
            let waitTime = minimumBatchInterval - Date().timeIntervalSince(lastTime)
            try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
        }
        
        lastBatchTime = Date()
        
        print("🚀 배치 로드 시작: \(request.teamIds.count)개 팀")
        
        var standings: [Int: TeamStanding] = [:]
        var fixtures: [Int: [Fixture]] = [:]
        var transfers: [Int: [Transfer]] = [:]
        var errors: [Int: Error] = [:]
        
        // 1. 캐시에서 최대한 활용
        let (cachedTeams, uncachedTeams) = categorizeTeams(request.teamIds)
        
        for teamId in cachedTeams {
            if let cached = cacheService.getCachedData(teamId: teamId) {
                if request.includeStandings, let standing = cached.teamStanding {
                    standings[teamId] = standing
                }
                if request.includeFixtures {
                    fixtures[teamId] = cached.upcomingFixtures
                }
                if request.includeTransfers {
                    transfers[teamId] = cached.recentTransfers
                }
            }
        }
        
        print("✅ 캐시에서 \(cachedTeams.count)개 팀 데이터 활용")
        
        // 2. 리그별로 그룹화하여 배치 처리
        if !uncachedTeams.isEmpty {
            let leagueGroups = groupTeamsByLeague(uncachedTeams)
            
            for (leagueId, teamIds) in leagueGroups {
                await loadLeagueBatch(
                    leagueId: leagueId,
                    teamIds: teamIds,
                    request: request,
                    standings: &standings,
                    fixtures: &fixtures,
                    transfers: &transfers,
                    errors: &errors
                )
                
                // 리그 간 간격 (Rate Limit 방지)
                if leagueGroups.count > 1 {
                    try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
                }
            }
        }
        
        let loadTime = Date().timeIntervalSince(startTime)
        print("✅ 배치 로드 완료: \(String(format: "%.2f", loadTime))초")
        
        return BatchResult(
            standings: standings,
            fixtures: fixtures,
            transfers: transfers,
            errors: errors,
            loadTime: loadTime
        )
    }
    
    /// 인기 팀들을 미리 로드 (프리페칭)
    func prefetchPopularTeams() async {
        let popularTeams = [33, 40, 42, 47, 49, 50, 541, 529, 530, 157, 165, 168] // 인기 팀 12개
        
        let request = BatchRequest(
            teamIds: popularTeams,
            includeStandings: true,
            includeFixtures: true,
            includeTransfers: false // 이적은 무거우므로 제외
        )
        
        do {
            _ = try await loadTeamsBatch(request)
            print("🔮 인기 팀 프리페칭 완료")
        } catch {
            print("⚠️ 프리페칭 실패: \(error)")
        }
    }
    
    // MARK: - Private Methods
    
    private func categorizeTeams(_ teamIds: [Int]) -> (cached: [Int], uncached: [Int]) {
        var cached: [Int] = []
        var uncached: [Int] = []
        
        for teamId in teamIds {
            if let cachedData = cacheService.getCachedData(teamId: teamId),
               !cachedData.isExpired {
                cached.append(teamId)
            } else {
                uncached.append(teamId)
            }
        }
        
        return (cached, uncached)
    }
    
    private func groupTeamsByLeague(_ teamIds: [Int]) -> [Int: [Int]] {
        let teamLeagueMapping: [Int: Int] = [
            // Premier League
            33: 39, 40: 39, 42: 39, 47: 39, 49: 39, 50: 39,
            34: 39, 48: 39, 51: 39, 66: 39,
            // La Liga
            529: 140, 530: 140, 541: 140, 531: 140, 548: 140,
            // Serie A
            489: 135, 496: 135, 505: 135, 497: 135, 502: 135,
            // Bundesliga
            157: 78, 165: 78, 168: 78, 172: 78, 160: 78,
            // Ligue 1
            85: 61, 91: 61, 81: 61, 80: 61, 96: 61
        ]
        
        var leagueGroups: [Int: [Int]] = [:]
        
        for teamId in teamIds {
            if let leagueId = teamLeagueMapping[teamId] {
                if leagueGroups[leagueId] == nil {
                    leagueGroups[leagueId] = []
                }
                leagueGroups[leagueId]?.append(teamId)
            }
        }
        
        return leagueGroups
    }
    
    private func loadLeagueBatch(
        leagueId: Int,
        teamIds: [Int],
        request: BatchRequest,
        standings: inout [Int: TeamStanding],
        fixtures: inout [Int: [Fixture]],
        transfers: inout [Int: [Transfer]],
        errors: inout [Int: Error]
    ) async {
        
        print("🏆 리그 \(leagueId) 배치 처리: \(teamIds.count)개 팀")
        
        // 순위 정보 (리그 전체 한 번에 로드)
        if request.includeStandings {
            await loadLeagueStandings(
                leagueId: leagueId,
                teamIds: teamIds,
                standings: &standings,
                errors: &errors
            )
        }
        
        // 경기 정보 (병렬 처리)
        if request.includeFixtures {
            await loadTeamsFixtures(
                teamIds: teamIds,
                fixtures: &fixtures,
                errors: &errors
            )
        }
        
        // 이적 정보 (선택적, 병렬 처리)
        if request.includeTransfers {
            await loadTeamsTransfers(
                teamIds: teamIds,
                transfers: &transfers,
                errors: &errors
            )
        }
    }
    
    private func loadLeagueStandings(
        leagueId: Int,
        teamIds: [Int],
        standings: inout [Int: TeamStanding],
        errors: inout [Int: Error]
    ) async {
        
        do {
            let season = getCurrentSeasonForTeamBoard()
            let allStandings = try await supabaseService.getStandings(leagueId: leagueId, season: season)
            
            for teamId in teamIds {
                if let standing = allStandings.first(where: { $0.team.id == teamId }) {
                    standings[teamId] = convertToTeamStanding(standing)
                }
            }
            
            print("✅ 리그 \(leagueId) 순위 로드: \(teamIds.count)개 팀")
            
        } catch {
            print("⚠️ 리그 \(leagueId) 순위 로드 실패: \(error)")
            // 개별 팀별로 에러 기록
            for teamId in teamIds {
                errors[teamId] = error
            }
        }
    }
    
    private func loadTeamsFixtures(
        teamIds: [Int],
        fixtures: inout [Int: [Fixture]],
        errors: inout [Int: Error]
    ) async {
        
        // 3개씩 병렬 처리
        let batches = teamIds.teamBoardChunked(into: 3)
        
        for batch in batches {
            await withTaskGroup(of: (Int, Result<[Fixture], Error>).self) { group in
                for teamId in batch {
                    group.addTask {
                        do {
                            let season = getCurrentSeasonForTeamBoard()
                            let teamFixtures = try await self.supabaseService.getTeamFixtures(
                                teamId: teamId,
                                season: season
                            )
                            let upcoming = self.filterUpcomingFixtures(teamFixtures)
                            return (teamId, .success(upcoming))
                        } catch {
                            return (teamId, .failure(error))
                        }
                    }
                }
                
                for await (teamId, result) in group {
                    switch result {
                    case .success(let teamFixtures):
                        fixtures[teamId] = teamFixtures
                    case .failure(let error):
                        errors[teamId] = error
                    }
                }
            }
            
            // 배치 간 간격
            if batches.count > 1 {
                try? await Task.sleep(nanoseconds: 300_000_000) // 0.3초
            }
        }
        
        print("✅ 경기 정보 로드: \(teamIds.count)개 팀")
    }
    
    private func loadTeamsTransfers(
        teamIds: [Int],
        transfers: inout [Int: [Transfer]],
        errors: inout [Int: Error]
    ) async {
        
        // 이적 정보는 Rate Limit이 더 엄격하므로 순차 처리
        for teamId in teamIds {
            do {
                let apiTransfers = try await fallbackService.getTeamTransfers(teamId: teamId)
                let teamTransfers = convertToTransfers(apiTransfers, teamId: teamId)
                transfers[teamId] = teamTransfers
                
                // 각 요청 간 간격
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
                
            } catch {
                errors[teamId] = error
                print("⚠️ 팀 \(teamId) 이적 정보 로드 실패: \(error)")
            }
        }
        
        print("✅ 이적 정보 로드: \(teamIds.count)개 팀")
    }
    
    // MARK: - Helper Methods (기존 코드 재사용)
    
    nonisolated private func convertToTeamStanding(_ standing: Standing) -> TeamStanding {
        let teamInfo = TeamInfo(
            id: standing.team.id,
            name: standing.team.name,
            code: nil,
            country: standing.team.country,
            founded: nil,
            national: false,
            logo: standing.team.logo
        )
        
        return TeamStanding(
            rank: standing.rank,
            team: teamInfo,
            points: standing.points,
            goalsDiff: standing.goalsDiff,
            group: standing.group,
            form: standing.form,
            status: standing.status,
            description: standing.description,
            all: TeamStats(
                played: standing.all.played,
                win: standing.all.win,
                draw: standing.all.draw,
                lose: standing.all.lose,
                goals: TeamGoals(for: standing.all.goals.goalsFor, against: standing.all.goals.goalsAgainst)
            ),
            home: TeamStats(
                played: standing.home.played,
                win: standing.home.win,
                draw: standing.home.draw,
                lose: standing.home.lose,
                goals: TeamGoals(for: standing.home.goals.goalsFor, against: standing.home.goals.goalsAgainst)
            ),
            away: TeamStats(
                played: standing.away.played,
                win: standing.away.win,
                draw: standing.away.draw,
                lose: standing.away.lose,
                goals: TeamGoals(for: standing.away.goals.goalsFor, against: standing.away.goals.goalsAgainst)
            ),
            update: standing.update
        )
    }
    
    nonisolated private func filterUpcomingFixtures(_ fixtures: [Fixture]) -> [Fixture] {
        let now = Date()
        return fixtures
            .filter { fixture in
                if let date = ISO8601DateFormatter().date(from: fixture.fixture.date) {
                    return date > now
                }
                return false
            }
            .sorted { fixture1, fixture2 in
                let date1 = ISO8601DateFormatter().date(from: fixture1.fixture.date) ?? Date()
                let date2 = ISO8601DateFormatter().date(from: fixture2.fixture.date) ?? Date()
                return date1 < date2
            }
            .prefix(3)
            .map { $0 }
    }
    
    nonisolated private func convertToTransfers(_ apiTransfers: [APITransfer], teamId: Int) -> [Transfer] {
        let seasonStart = ISO8601DateFormatter().date(from: "2023-07-01T00:00:00Z") ?? Date()
        
        return apiTransfers.compactMap { apiTransfer in
            guard let playerName = apiTransfer.playerName,
                  let dateString = apiTransfer.date,
                  let date = ISO8601DateFormatter().date(from: dateString),
                  date > seasonStart else { return nil }
            
            let isIncoming = apiTransfer.teams.in.id == teamId
            let fromClub = isIncoming ? apiTransfer.teams.out.name : apiTransfer.teams.in.name
            let toClub = isIncoming ? apiTransfer.teams.in.name : apiTransfer.teams.out.name
            let fee = formatTransferFee(apiTransfer.type)
            
            return Transfer(
                playerName: playerName,
                fromClub: fromClub,
                toClub: toClub,
                transferFee: fee,
                date: date,
                type: isIncoming ? .incoming : .outgoing
            )
        }
        .sorted { $0.date > $1.date }
        .prefix(5)
        .map { $0 }
    }
    
    nonisolated private func formatTransferFee(_ type: String?) -> String {
        guard let type = type else { return "비공개" }
        
        if type == "N/A" || type.isEmpty {
            return "자유이적"
        } else if type.contains("€") {
            return type
        } else if type.contains("loan") || type.lowercased().contains("loan") {
            return "임대"
        } else {
            return type
        }
    }
}

// MARK: - Helper Functions

private func getCurrentSeasonForTeamBoard() -> Int {
    let calendar = Calendar.current
    let now = Date()
    let month = calendar.component(.month, from: now)
    let year = calendar.component(.year, from: now)
    
    return month >= 7 ? year : year - 1
}

// MARK: - Extensions

private extension Array {
    func teamBoardChunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}