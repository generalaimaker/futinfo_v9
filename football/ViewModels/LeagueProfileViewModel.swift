import Foundation
import SwiftUI

@MainActor
class LeagueProfileViewModel: ObservableObject {
    // 리그 정보
    @Published var leagueDetails: LeagueDetails?
    @Published var standings: [Standing] = []
    
    // 경기 일정
    @Published var upcomingFixtures: [Fixture] = []
    @Published var pastFixtures: [Fixture] = []
    @Published var todayFixtures: [Fixture] = []
    
    // 선수 통계
    @Published var topScorers: [PlayerProfileData] = []
    @Published var topAssists: [PlayerProfileData] = []
    @Published var topAttackPoints: [PlayerProfileData] = []
    @Published var topDribblers: [PlayerProfileData] = []
    @Published var topTacklers: [PlayerProfileData] = []
    
    // 팀 통계
    @Published var teamStats: [TeamSeasonStatistics] = []
    
    // 상태 관리
    @Published var isLoading: Bool = false
    @Published var error: Error?
    @Published var selectedSeason: Int = 2024
    
    private let service = FootballAPIService.shared
    private let leagueId: Int
    
    init(leagueId: Int) {
        self.leagueId = leagueId
    }
    
    // MARK: - 데이터 로드 메서드
    
    func loadLeagueDetails() async {
        isLoading = true
        error = nil
        
        do {
            leagueDetails = try await service.getLeagueDetails(leagueId: leagueId, season: selectedSeason)
        } catch {
            self.error = error
            print("Error loading league details: \(error)")
        }
        
        isLoading = false
    }
    
    func loadStandings() async {
        isLoading = true
        error = nil
        
        do {
            standings = try await service.getStandings(leagueId: leagueId, season: selectedSeason)
        } catch {
            self.error = error
            print("Error loading standings: \(error)")
        }
        
        isLoading = false
    }
    
    func loadFixtures() async {
        isLoading = true
        error = nil
        
        do {
            let allFixtures = try await service.getFixtures(leagueId: leagueId, season: selectedSeason)
            
            // 날짜 기준으로 경기 분류
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
            
            let now = Date()
            let calendar = Calendar.current
            let today = calendar.startOfDay(for: now)
            let tomorrow = calendar.date(byAdding: .day, value: 1, to: today)!
            
            // 오늘 경기
            todayFixtures = allFixtures.filter { fixture in
                if let date = dateFormatter.date(from: fixture.fixture.date) {
                    return calendar.isDate(date, inSameDayAs: now)
                }
                return false
            }.sorted { $0.fixture.date < $1.fixture.date }
            
            // 예정된 경기
            upcomingFixtures = allFixtures.filter { fixture in
                if let date = dateFormatter.date(from: fixture.fixture.date) {
                    return date > tomorrow
                }
                return false
            }.sorted { $0.fixture.date < $1.fixture.date }
            
            // 지난 경기
            pastFixtures = allFixtures.filter { fixture in
                if let date = dateFormatter.date(from: fixture.fixture.date) {
                    return date < today
                }
                return false
            }.sorted { $0.fixture.date > $1.fixture.date } // 최신 경기가 먼저 오도록
            
        } catch {
            self.error = error
            print("Error loading fixtures: \(error)")
        }
        
        isLoading = false
    }
    
    func loadPlayerStats() async {
        isLoading = true
        error = nil
        
        do {
            // 선수 통계 가져오기 - API 엔드포인트 수정
            // 리그 ID를 명시적으로 path parameter로 전달
            let endpoint = "/players/topscorers?league=\(leagueId)&season=\(selectedSeason)"
            let request = service.createRequest(endpoint)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            try service.handleResponse(response)
            
            // 디버깅을 위한 JSON 출력
            if let jsonString = String(data: data, encoding: .utf8) {
                print("Player stats API response: \(jsonString.prefix(500))...")
            }
            
            let decoder = JSONDecoder()
            let playerStatsResponse = try decoder.decode(PlayerStatisticsResponse.self, from: data)
            
            if !playerStatsResponse.errors.isEmpty {
                throw FootballAPIError.apiError(playerStatsResponse.errors)
            }
            
            let allPlayers = playerStatsResponse.response
            
            // 득점 순위 - 이미 API에서 정렬된 상태로 받아옴
            topScorers = Array(allPlayers.prefix(3))
            
            // 다른 통계 데이터 로드
            await loadAssists()
            await loadDribblers()
            await loadTacklers()
            
            // 공격포인트(득점+어시스트) 순위 - 로컬에서 계산
            let combinedPlayers = Set(topScorers + topAssists)
            topAttackPoints = Array(combinedPlayers).sorted { player1, player2 in
                let goals1 = player1.statistics?.first?.goals?.total ?? 0
                let assists1 = player1.statistics?.first?.goals?.assists ?? 0
                let points1 = goals1 + assists1
                
                let goals2 = player2.statistics?.first?.goals?.total ?? 0
                let assists2 = player2.statistics?.first?.goals?.assists ?? 0
                let points2 = goals2 + assists2
                
                return points1 > points2
            }.prefix(3).map { $0 }
            
        } catch {
            self.error = error
            print("Error loading player stats: \(error)")
        }
        
        isLoading = false
    }
    
    // 어시스트 순위 별도 로드
    private func loadAssists() async {
        do {
            let endpoint = "/players/topassists?league=\(leagueId)&season=\(selectedSeason)"
            let request = service.createRequest(endpoint)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            try service.handleResponse(response)
            
            let decoder = JSONDecoder()
            let playerStatsResponse = try decoder.decode(PlayerStatisticsResponse.self, from: data)
            
            if !playerStatsResponse.errors.isEmpty {
                throw FootballAPIError.apiError(playerStatsResponse.errors)
            }
            
            // 어시스트 순위 - 이미 API에서 정렬된 상태로 받아옴
            topAssists = Array(playerStatsResponse.response.prefix(3))
            
        } catch {
            print("Error loading assists stats: \(error)")
            // 에러가 발생해도 앱이 중단되지 않도록 빈 배열 할당
            topAssists = []
        }
    }
    
    // 드리블 성공률 순위 별도 로드
    private func loadDribblers() async {
        // 드리블러 API가 없는 경우 득점 순위 데이터 재활용
        topDribblers = topScorers.sorted { player1, player2 in
            let attempts1 = player1.statistics?.first?.dribbles?.attempts ?? 0
            let success1 = player1.statistics?.first?.dribbles?.success ?? 0
            let rate1 = attempts1 > 0 ? Double(success1) / Double(attempts1) : 0
            
            let attempts2 = player2.statistics?.first?.dribbles?.attempts ?? 0
            let success2 = player2.statistics?.first?.dribbles?.success ?? 0
            let rate2 = attempts2 > 0 ? Double(success2) / Double(attempts2) : 0
            
            return rate1 > rate2
        }.prefix(3).map { $0 }
    }
    
    // 태클 순위 별도 로드
    private func loadTacklers() async {
        // 태클러 API가 없는 경우 득점 순위 데이터 재활용
        topTacklers = topScorers.sorted { player1, player2 in
            let tackles1 = player1.statistics?.first?.tackles?.total ?? 0
            let tackles2 = player2.statistics?.first?.tackles?.total ?? 0
            return tackles1 > tackles2
        }.prefix(3).map { $0 }
    }
    
    func loadTeamStats() async {
        isLoading = true
        error = nil
        
        do {
            // 먼저 리그의 모든 팀 ID 가져오기
            let teamIds = standings.map { $0.team.id }
            
            // 각 팀의 통계 가져오기
            var allTeamStats: [TeamSeasonStatistics] = []
            
            for teamId in teamIds {
                do {
                    let teamStat = try await service.getTeamStatistics(teamId: teamId, leagueId: leagueId, season: selectedSeason)
                    allTeamStats.append(teamStat)
                } catch {
                    print("Error loading stats for team \(teamId): \(error)")
                    continue
                }
                
                // API 요청 제한을 고려한 딜레이
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
            }
            
            teamStats = allTeamStats
            
        } catch {
            self.error = error
            print("Error loading team stats: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - 헬퍼 메서드
    
    // 시즌 표시 형식
    func formatSeason(_ year: Int) -> String {
        let nextYear = (year + 1) % 100
        return "\(year)-\(nextYear)"
    }
    
    // 날짜 포맷팅
    func formatDate(_ dateString: String) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        dateFormatter.locale = Locale(identifier: "ko_KR")
        
        guard let date = dateFormatter.date(from: dateString) else { return dateString }
        
        dateFormatter.dateFormat = "M월 d일 (E) HH:mm"
        return dateFormatter.string(from: date)
    }
    
    // 경기 상태 표시
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
    
    // 팀 통계 정렬 및 필터링
    
    // 경기당 득점 상위 팀
    var topScoringTeams: [TeamSeasonStatistics] {
        return teamStats.sorted { team1, team2 in
            let games1 = team1.fixtures?.played.total ?? 0
            let goals1 = team1.goals?.for.total.total ?? 0
            let avg1 = games1 > 0 ? Double(goals1) / Double(games1) : 0
            
            let games2 = team2.fixtures?.played.total ?? 0
            let goals2 = team2.goals?.for.total.total ?? 0
            let avg2 = games2 > 0 ? Double(goals2) / Double(games2) : 0
            
            return avg1 > avg2
        }.prefix(3).map { $0 }
    }
    
    // 경기당 실점 하위 팀
    var leastConcededTeams: [TeamSeasonStatistics] {
        return teamStats.sorted { team1, team2 in
            let games1 = team1.fixtures?.played.total ?? 0
            let goals1 = team1.goals?.against.total.total ?? 0
            let avg1 = games1 > 0 ? Double(goals1) / Double(games1) : 0
            
            let games2 = team2.fixtures?.played.total ?? 0
            let goals2 = team2.goals?.against.total.total ?? 0
            let avg2 = games2 > 0 ? Double(goals2) / Double(games2) : 0
            
            return avg1 < avg2
        }.prefix(3).map { $0 }
    }
    
    // 평균 점유율 상위 팀
    var topPossessionTeams: [TeamSeasonStatistics] {
        return teamStats.sorted { team1, team2 in
            // 점유율 정보가 없을 수 있으므로 기본값 사용
            let possession1 = 50.0
            let possession2 = 50.0
            return possession1 > possession2
        }.prefix(3).map { $0 }
    }
    
    // 클린시트 경기 수 상위 팀
    var topCleanSheetTeams: [TeamSeasonStatistics] {
        return teamStats.sorted { team1, team2 in
            let cleanSheets1 = team1.clean_sheets?.total ?? 0
            let cleanSheets2 = team2.clean_sheets?.total ?? 0
            return cleanSheets1 > cleanSheets2
        }.prefix(3).map { $0 }
    }
    
    // 모든 데이터 로드
    func loadAllData() async {
        // 필수 데이터 병렬 로드
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadLeagueDetails() }
            group.addTask { await self.loadStandings() }
            group.addTask { await self.loadFixtures() }
        }
        
        // 나머지 데이터는 백그라운드에서 로드
        Task {
            await loadPlayerStats()
            await loadTeamStats()
        }
    }
    
    // 선택된 탭에 따라 필요한 데이터만 로드
    func loadDataForTab(_ tab: Int) async {
        switch tab {
        case 0: // 순위 탭
            if standings.isEmpty {
                await loadStandings()
            }
        case 1: // 경기 탭
            if upcomingFixtures.isEmpty && pastFixtures.isEmpty && todayFixtures.isEmpty {
                await loadFixtures()
            }
        case 2: // 선수 통계 탭
            if topScorers.isEmpty && topAssists.isEmpty {
                await loadPlayerStats()
            }
        case 3: // 팀 통계 탭
            if teamStats.isEmpty {
                await loadTeamStats()
            }
        default:
            break
        }
    }
}
