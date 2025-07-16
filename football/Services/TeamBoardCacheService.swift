import Foundation
import Combine
import UIKit

/// 팀게시판 전용 고성능 캐싱 서비스
@MainActor
class TeamBoardCacheService: ObservableObject {
    static let shared = TeamBoardCacheService()
    
    // MARK: - Cache Models
    
    struct TeamBoardData: Codable {
        let teamStanding: TeamStanding?
        let upcomingFixtures: [Fixture]
        let recentTransfers: [Transfer]
        let cachedAt: Date
        
        var isExpired: Bool {
            let now = Date()
            // 순위: 1시간, 경기: 30분, 이적: 24시간
            let maxAge: TimeInterval = 3600 // 1시간
            return now.timeIntervalSince(cachedAt) > maxAge
        }
        
        var shouldRefreshFixtures: Bool {
            let now = Date()
            return now.timeIntervalSince(cachedAt) > 1800 // 30분
        }
        
        var shouldRefreshTransfers: Bool {
            let now = Date()
            return now.timeIntervalSince(cachedAt) > 86400 // 24시간
        }
    }
    
    // MARK: - Properties
    
    private var teamCache: [Int: TeamBoardData] = [:]
    private let cacheQueue = DispatchQueue(label: "com.futinfo.teamboard.cache", qos: .utility)
    private let maxCacheSize = 50 // 최대 50개 팀 캐시
    
    // 공용 서비스들
    private let supabaseService = SupabaseFootballAPIService.shared
    private let fallbackService = FootballAPIService.shared
    
    private init() {
        setupMemoryWarning()
    }
    
    // MARK: - Public Methods
    
    /// 팀게시판 데이터 로드 (캐시 우선)
    func loadTeamBoardData(teamId: Int) async throws -> TeamBoardData {
        // 1. 캐시 확인
        if let cached = teamCache[teamId], !cached.isExpired {
            print("✅ 팀 \(teamId) 캐시 데이터 사용")
            return cached
        }
        
        print("🔄 팀 \(teamId) 데이터 새로 로드")
        
        // 2. 병렬로 데이터 로드
        async let standingTask = loadTeamStanding(teamId: teamId)
        async let fixturesTask = loadUpcomingFixtures(teamId: teamId)
        async let transfersTask = loadRecentTransfers(teamId: teamId)
        
        let (standing, fixtures, transfers) = try await (standingTask, fixturesTask, transfersTask)
        
        // 3. 캐시 저장
        let boardData = TeamBoardData(
            teamStanding: standing,
            upcomingFixtures: fixtures,
            recentTransfers: transfers,
            cachedAt: Date()
        )
        
        await cacheQueue.run {
            self.teamCache[teamId] = boardData
            self.trimCacheIfNeeded()
        }
        
        print("✅ 팀 \(teamId) 데이터 로드 및 캐시 완료")
        return boardData
    }
    
    /// 특정 데이터만 강제 새로고침
    func refreshTeamData(teamId: Int, refreshStanding: Bool = true, refreshFixtures: Bool = true, refreshTransfers: Bool = false) async throws -> TeamBoardData {
        
        let existingData = teamCache[teamId]
        
        // 기존 데이터를 기본값으로 사용
        var standing = existingData?.teamStanding
        var fixtures = existingData?.upcomingFixtures ?? []
        var transfers = existingData?.recentTransfers ?? []
        
        // 선택적 새로고침
        if refreshStanding {
            standing = try await loadTeamStanding(teamId: teamId)
        }
        
        if refreshFixtures {
            fixtures = try await loadUpcomingFixtures(teamId: teamId)
        }
        
        if refreshTransfers {
            transfers = try await loadRecentTransfers(teamId: teamId)
        }
        
        // 캐시 업데이트
        let boardData = TeamBoardData(
            teamStanding: standing,
            upcomingFixtures: fixtures,
            recentTransfers: transfers,
            cachedAt: Date()
        )
        
        await cacheQueue.run {
            self.teamCache[teamId] = boardData
        }
        
        return boardData
    }
    
    /// 캐시된 데이터 즉시 반환 (없으면 nil)
    func getCachedData(teamId: Int) -> TeamBoardData? {
        return teamCache[teamId]
    }
    
    /// 캐시 클리어
    func clearCache(teamId: Int? = nil) {
        if let teamId = teamId {
            teamCache.removeValue(forKey: teamId)
        } else {
            teamCache.removeAll()
        }
    }
    
    // MARK: - Private Methods
    
    private func loadTeamStanding(teamId: Int) async throws -> TeamStanding? {
        guard let leagueId = getLeagueId(for: teamId) else { return nil }
        
        let season = getCurrentSeasonForCache()
        
        // Supabase 우선 시도
        do {
            let standings = try await supabaseService.getStandings(leagueId: leagueId, season: season)
            if let standing = standings.first(where: { $0.team.id == teamId }) {
                return convertToTeamStanding(standing)
            }
        } catch {
            print("⚠️ Supabase 순위 로드 실패, 백업 API 사용: \(error)")
        }
        
        // 백업 API 시도
        do {
            let standings = try await fallbackService.getStandings(leagueId: leagueId, season: season)
            if let standing = standings.first(where: { $0.team.id == teamId }) {
                return convertToTeamStanding(standing)
            }
        } catch {
            print("❌ 백업 API도 실패: \(error)")
        }
        
        return nil
    }
    
    private func loadUpcomingFixtures(teamId: Int) async throws -> [Fixture] {
        let season = getCurrentSeasonForCache()
        
        do {
            let fixtures = try await supabaseService.getTeamFixtures(teamId: teamId, season: season)
            return filterUpcomingFixtures(fixtures)
        } catch {
            print("⚠️ Supabase 경기 로드 실패, 백업 API 사용: \(error)")
            let fixtures = try await fallbackService.getTeamFixtures(teamId: teamId, season: season, forceRefresh: false)
            return filterUpcomingFixtures(fixtures)
        }
    }
    
    private func loadRecentTransfers(teamId: Int) async throws -> [Transfer] {
        // 이적 정보는 캐시가 중요하므로 더 보수적으로 처리
        do {
            let apiTransfers = try await fallbackService.getTeamTransfers(teamId: teamId)
            return convertToTransfers(apiTransfers, teamId: teamId)
        } catch {
            print("⚠️ 이적 정보 로드 실패: \(error)")
            return []
        }
    }
    
    // MARK: - Helper Methods
    
    private func convertToTeamStanding(_ standing: Standing) -> TeamStanding {
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
    
    private func filterUpcomingFixtures(_ fixtures: [Fixture]) -> [Fixture] {
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
    
    private func convertToTransfers(_ apiTransfers: [APITransfer], teamId: Int) -> [Transfer] {
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
    
    private func formatTransferFee(_ type: String?) -> String {
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
    
    private func getLeagueId(for teamId: Int) -> Int? {
        let teamLeagueMapping: [Int: Int] = [
            // Premier League
            33: 39, 40: 39, 42: 39, 47: 39, 49: 39, 50: 39,
            34: 39, 48: 39, 51: 39, 66: 39,
            // La Liga
            529: 140, 530: 140, 541: 140,
            // Serie A
            489: 135, 496: 135, 505: 135,
            // Bundesliga
            157: 78, 165: 78, 168: 78,
            // Ligue 1
            85: 61, 91: 61, 81: 61
        ]
        return teamLeagueMapping[teamId]
    }
    
    private func trimCacheIfNeeded() {
        if teamCache.count > maxCacheSize {
            // 가장 오래된 캐시부터 제거
            let sortedByDate = teamCache.sorted { $0.value.cachedAt < $1.value.cachedAt }
            let toRemove = sortedByDate.prefix(teamCache.count - maxCacheSize)
            
            for (teamId, _) in toRemove {
                teamCache.removeValue(forKey: teamId)
            }
            
            print("🧹 캐시 정리: \(toRemove.count)개 항목 제거")
        }
    }
    
    private func setupMemoryWarning() {
        NotificationCenter.default.addObserver(
            forName: UIApplication.didReceiveMemoryWarningNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.clearCache()
                print("⚠️ 메모리 경고로 인한 팀게시판 캐시 클리어")
            }
        }
    }
}

// MARK: - Helper Functions

private func getCurrentSeasonForCache() -> Int {
    let calendar = Calendar.current
    let now = Date()
    let month = calendar.component(.month, from: now)
    let year = calendar.component(.year, from: now)
    
    // 7월 이후면 새 시즌, 6월 이전이면 이전 시즌
    return month >= 7 ? year : year - 1
}

// MARK: - Extensions

private extension DispatchQueue {
    func run<T>(_ block: @escaping () -> T) async -> T {
        return await withCheckedContinuation { continuation in
            self.async {
                let result = block()
                continuation.resume(returning: result)
            }
        }
    }
}