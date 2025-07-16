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
    @Published var selectedSeason: Int = Date().getCurrentSeason()
    
    private let service = SupabaseFootballAPIService.shared
    private let leagueId: Int
    
    // 레귤러 리그 ID 목록 (토너먼트 탭을 표시하지 않을 리그)
    private let regularLeagueIds = [39, 140, 78, 135, 61] // 프리미어 리그, 라리가, 분데스리가, 세리에 A, 리그 1
    
    // 컵대회 ID 목록 (순위 탭을 표시하지 않을 리그)
    private let cupCompetitionIds = [45, 143, 137, 66, 81, 15] // FA컵, 코파델레이, 코파 이탈리아, 프랑스컵, 독일 포칼컵, FIFA 클럽 월드컵
    
    // 순위가 있는 유럽 대항전 ID 목록
    private let europeanCompetitionIds = [2, 3] // 챔피언스리그, 유로파리그
    
    // 토너먼트 탭을 표시할지 여부를 결정하는 계산 속성
    var shouldShowTournamentTab: Bool {
        // 레귤러 리그가 아니거나 리그 타입이 "cup"인 경우에만 토너먼트 탭 표시
        return !regularLeagueIds.contains(leagueId) || (leagueDetails?.league.type.lowercased() == "cup")
    }
    
    // 순위 탭을 표시할지 여부를 결정하는 계산 속성
    var shouldShowStandingsTab: Bool {
        // 레귤러 리그이거나 챔피언스리그/유로파리그인 경우에만 순위 탭 표시
        if regularLeagueIds.contains(leagueId) || europeanCompetitionIds.contains(leagueId) {
            return true
        }
        
        // 그 외 컵대회는 순위 탭 표시하지 않음
        return !cupCompetitionIds.contains(leagueId) && leagueDetails?.league.type.lowercased() != "cup"
    }
    
    init(leagueId: Int) {
        self.leagueId = leagueId
    }
    
    // MARK: - 토너먼트 데이터
    @Published var tournamentFixtures: [Fixture] = []
    @Published var tournamentRounds: [String] = []
    
    // MARK: - 데이터 로드 메서드
    
    func loadLeagueDetails() async {
        isLoading = true
        error = nil
        
        // 하드코딩된 리그 목록에서 리그 정보 찾기
        let hardcodedLeagues = LeaguesViewModel().leagues
        
        // 리그 ID로 리그 정보 찾기
        if let league = hardcodedLeagues.first(where: { $0.league.id == leagueId }) {
            leagueDetails = league
            print("✅ 하드코딩된 리그 정보 사용: \(league.league.name)")
        } else {
            // 하드코딩된 리그 정보가 없으면 API 호출
            print("⚠️ 하드코딩된 리그 정보 없음, API 호출 시도")
            // getLeagueDetails 메서드가 없으므로 하드코딩된 데이터 사용
            leagueDetails = nil
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
            let actualLeagueId = leagueDetails?.league.id ?? leagueId
            
            // FIFA 클럽 월드컵 특별 시즌 처리
            let seasonForRequest: Int
            if actualLeagueId == 15 {
                let now = Date()
                let calendar = Calendar.current
                let month = calendar.component(.month, from: now)
                let year = calendar.component(.year, from: now)
                
                if month >= 6 && month <= 7 && year == 2025 {
                    seasonForRequest = 2024
                    print("⚽ FIFA 클럽 월드컵 특별 시즌 처리: 2025년 6-7월 → 2024 시즌 사용")
                } else {
                    seasonForRequest = selectedSeason
                }
            } else {
                seasonForRequest = selectedSeason
            }

            // ❶ 최근 50 경기
            async let past50 = service.getFixtures(
                leagueId: actualLeagueId,
                season: seasonForRequest,
                last: 50
            )
            // ❷ 향후 50 경기
            async let next50 = service.getFixtures(
                leagueId: actualLeagueId,
                season: seasonForRequest,
                next: 50
            )

            // 두 요청을 병렬로 실행하고 중복을 제거
            var combined = try await past50 + next50
            combined = Array(Set(combined.map { $0.fixture.id })).compactMap { id in
                combined.first { $0.fixture.id == id }
            }

            // 날짜별로 분류·정렬
            splitAndSortFixtures(combined)

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
            // Supabase Edge Function 호출
            let urlString = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/players-api/topscorers?league=\(leagueId)&season=\(selectedSeason)"
            
            guard let url = URL(string: urlString) else {
                throw FootballAPIError.invalidRequest
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            // Add auth token if available
            if let token = try? await SupabaseService.shared.client.auth.session.accessToken {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FootballAPIError.invalidResponse
            }
            
            if httpResponse.statusCode != 200 {
                throw FootballAPIError.httpError(httpResponse.statusCode)
            }
            
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
            // Supabase Edge Function 호출
            let urlString = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/players-api/topassists?league=\(leagueId)&season=\(selectedSeason)"
            
            guard let url = URL(string: urlString) else {
                throw FootballAPIError.invalidRequest
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            // Add auth token if available
            if let token = try? await SupabaseService.shared.client.auth.session.accessToken {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FootballAPIError.invalidResponse
            }
            
            if httpResponse.statusCode != 200 {
                throw FootballAPIError.httpError(httpResponse.statusCode)
            }
            
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
                    let teamStatResponse = try await service.fetchTeamStatistics(teamId: teamId, season: selectedSeason, leagueId: leagueId)
                    let teamStat = teamStatResponse.response
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
            group.addTask { await self.loadTournamentData() }
        }
        
        // 나머지 데이터는 백그라운드에서 로드
        Task {
            await loadPlayerStats()
            await loadTeamStats()
        }
    }
    
    // 토너먼트 데이터 로드
    func loadTournamentData() async {
        isLoading = true
        error = nil
        if leagueDetails == nil {
            await loadLeagueDetails()
        }
        do {
            // 현재 리그가 컵대회인지 확인 (API type == "Cup")
            let isCupCompetition = leagueDetails?.league.type.lowercased() == "cup"

            if isCupCompetition {
                // 시즌 시작·종료 날짜 가져오기 (API에서 제공된 coverage seasons)
                let seasonData = leagueDetails?.seasons?.first(where: { $0.year == selectedSeason })
                let fromDate = seasonData?.start
                let toDate   = seasonData?.end
                // 문자열 시작/종료일을 Date?로 파싱
                let apiDateFormatter = DateFormatter()
                apiDateFormatter.dateFormat = "yyyy-MM-dd"
                let fromDateObj = fromDate.flatMap { apiDateFormatter.date(from: $0) }
                let toDateObj   = toDate.flatMap   { apiDateFormatter.date(from: $0) }
                
                // 모든 경기 가져오기
                let actualLeagueId = leagueDetails?.league.id ?? leagueId
                
                // FIFA 클럽 월드컵 특별 시즌 처리
                let seasonForTournament: Int
                if actualLeagueId == 15 {
                    let now = Date()
                    let calendar = Calendar.current
                    let month = calendar.component(.month, from: now)
                    let year = calendar.component(.year, from: now)
                    
                    if month >= 6 && month <= 7 && year == 2025 {
                        seasonForTournament = 2024
                        print("⚽ FIFA 클럽 월드컵 특별 시즌 처리: 2025년 6-7월 → 2024 시즌 사용")
                    } else {
                        seasonForTournament = selectedSeason
                    }
                } else {
                    seasonForTournament = selectedSeason
                }
                
                // 챔피언스리그(ID: 2)인 경우 특별 처리
                let isChampionsLeague = actualLeagueId == 2
                if isChampionsLeague {
                    print("🏆 챔피언스리그 특별 처리 적용")
                }
                
                let allFixtures = try await service.getFixtures(
                    leagueId: actualLeagueId,
                    season: seasonForTournament,
                    from: fromDateObj,
                    to: toDateObj
                )
                
                // 현재 리그에 속하는 경기만 필터링
                let filteredFixtures = allFixtures.filter { fixture in
                    return fixture.league.id == actualLeagueId
                }
                
                print("🔍 경기 필터링: 전체 \(allFixtures.count)개 중 \(filteredFixtures.count)개가 리그 ID \(actualLeagueId)에 속함")
                
                // 날짜 기준으로 경기 분류 (경기 탭과 동일한 방식)
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
                
                let now = Date()
                let calendar = Calendar.current
                let today = calendar.startOfDay(for: now)
                guard let tomorrow = calendar.date(byAdding: .day, value: 1, to: today) else {
                    print("❌ 날짜 계산 오류: 내일 날짜를 계산할 수 없습니다.")
                    return
                }
                
                // 오늘 경기
                let todayTournamentFixtures = filteredFixtures.filter { fixture in
                    if let date = dateFormatter.date(from: fixture.fixture.date) {
                        return calendar.isDate(date, inSameDayAs: now)
                    }
                    return false
                }.sorted { $0.fixture.date < $1.fixture.date }
                
                // 예정된 경기
                let upcomingTournamentFixtures = filteredFixtures.filter { fixture in
                    if let date = dateFormatter.date(from: fixture.fixture.date) {
                        return date > tomorrow
                    }
                    return false
                }.sorted { $0.fixture.date < $1.fixture.date }
                
                // 지난 경기
                let pastTournamentFixtures = filteredFixtures.filter { fixture in
                    if let date = dateFormatter.date(from: fixture.fixture.date) {
                        return date < today
                    }
                    return false
                }.sorted { $0.fixture.date > $1.fixture.date } // 최신 경기가 먼저 오도록
                
                // 경기 탭과 같은 순서로 정렬: 예정된 경기 -> 오늘 경기 -> 지난 경기
                let sortedFixtures = upcomingTournamentFixtures + todayTournamentFixtures + pastTournamentFixtures
                
                print("📊 경기 분류: 예정된 경기 \(upcomingTournamentFixtures.count)개, 오늘 경기 \(todayTournamentFixtures.count)개, 지난 경기 \(pastTournamentFixtures.count)개")

                // 라운드 정보 추출 및 정렬
                var rounds = Set<String>()
                for fixture in filteredFixtures {
                    // fixture.league.round는 옵셔널이 아니므로 바로 사용
                    rounds.insert(fixture.league.round)
                }

                // 라운드 정렬 로직
                let sortedRounds = Array(rounds).sorted { round1, round2 in
                    // 결승전은 항상 마지막에
                    if round1.contains("Final") && !round2.contains("Final") {
                        return false
                    }
                    if !round1.contains("Final") && round2.contains("Final") {
                        return true
                    }

                    // 준결승은 결승 바로 전에
                    if round1.contains("Semi") && !round2.contains("Semi") && !round2.contains("Final") {
                        return false
                    }
                    if !round1.contains("Semi") && round2.contains("Semi") {
                        return true
                    }

                    // 8강은 준결승 바로 전에
                    if round1.contains("Quarter") && !round2.contains("Quarter") && !round2.contains("Semi") && !round2.contains("Final") {
                        return false
                    }
                    if !round1.contains("Quarter") && round2.contains("Quarter") {
                        return true
                    }

                    // 16강, 32강, 64강 순서로 정렬
                    if round1.contains("Round of") && round2.contains("Round of") {
                        // 숫자 부분만 추출
                        if let range1 = round1.range(of: "Round of (\\d+)", options: .regularExpression),
                           let range2 = round2.range(of: "Round of (\\d+)", options: .regularExpression) {

                            let numberStr1 = round1[range1].replacingOccurrences(of: "Round of ", with: "")
                            let numberStr2 = round2[range2].replacingOccurrences(of: "Round of ", with: "")

                            if let number1 = Int(numberStr1), let number2 = Int(numberStr2) {
                                return number1 < number2
                            }
                        }
                    }

                    // 조별리그는 항상 먼저
                    if round1.contains("Group") && !round2.contains("Group") {
                        return true
                    }
                    if !round1.contains("Group") && round2.contains("Group") {
                        return false
                    }

                    // 기본 알파벳 순서
                    return round1 < round2
                }

                tournamentRounds = sortedRounds
                tournamentFixtures = sortedFixtures // 정렬된 경기 사용

                print("✅ 토너먼트 데이터 로드 완료: \(tournamentRounds.count) 라운드, \(tournamentFixtures.count) 경기")
            } else {
                // 컵대회가 아닌 경우 빈 데이터 설정
                tournamentRounds = []
                tournamentFixtures = []
                print("ℹ️ 컵대회가 아니므로 토너먼트 데이터 없음")
            }
        } catch {
            self.error = error
            print("Error loading tournament data: \(error)")
        }

        isLoading = false
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
        case 2: // 토너먼트 탭
            if tournamentRounds.isEmpty && tournamentFixtures.isEmpty {
                await loadTournamentData()
            }
        case 3: // 선수 통계 탭
            if topScorers.isEmpty && topAssists.isEmpty {
                await loadPlayerStats()
            }
        case 4: // 팀 통계 탭
            if teamStats.isEmpty {
                await loadTeamStats()
            }
        default:
            break
        }
    }
    /// todayFixtures · upcomingFixtures · pastFixtures 로 분류하고 정렬
    private func splitAndSortFixtures(_ fixtures: [Fixture]) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"

        let now      = Date()
        let calendar = Calendar.current
        let today    = calendar.startOfDay(for: now)
        guard let tomorrow = calendar.date(byAdding: .day, value: 1, to: today) else {
            print("❌ 날짜 계산 오류: 내일 날짜를 계산할 수 없습니다.")
            return
        }

        // 오늘 경기
        todayFixtures = fixtures.filter {
            if let d = formatter.date(from: $0.fixture.date) {
                return calendar.isDate(d, inSameDayAs: now)
            }
            return false
        }.sorted { $0.fixture.date < $1.fixture.date }

        // 예정 경기
        upcomingFixtures = fixtures.filter {
            if let d = formatter.date(from: $0.fixture.date) {
                return d > tomorrow || $0.fixture.status.short == "NS"
            }
            return $0.fixture.status.short == "NS"
        }.sorted { $0.fixture.date < $1.fixture.date }

        // 지난 경기
        pastFixtures = fixtures.filter {
            if let d = formatter.date(from: $0.fixture.date) {
                return d < today && $0.fixture.status.short != "NS"
            }
            return $0.fixture.status.short != "NS" && $0.fixture.status.short != "TBD"
        }.sorted { $0.fixture.date > $1.fixture.date }
    }
}
