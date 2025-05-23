import Foundation
import SwiftUI

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
    @Published var isLoadingStandings = false
    
    @Published var recentFixtures: [Fixture]? = []
    @Published var leagueStandings: [Standing]? = []
    
    @Published var errorMessage: String?
    
    let service = FootballAPIService.shared
    
    // teamId를 public으로 변경하여 외부에서 접근 가능하게 함
    public let teamId: Int
    
    init(teamId: Int, leagueId: Int? = nil) {
        self.teamId = teamId
        self.selectedLeagueId = leagueId
        
        // 현재 시즌을 기본값으로 설정 (2024)
        self.selectedSeason = 2024
        
        // 초기화 시 자동 로딩 제거 - TeamProfileView에서 task 수정자를 통해 로드하도록 함
        print("📱 TeamProfileViewModel 초기화: 팀 ID \(teamId), 리그 ID \(leagueId ?? 0)")
    }
    
    // 모든 데이터를 한 번에 로드하는 메서드 추가 (TeamProfileView에서 호출)
    func loadAllData() async {
        print("🔄 loadAllData: 모든 데이터 로드 시작")
        
        // 1. 기본 팀 정보 로드
        await loadTeamProfile(teamId: teamId)
        await loadTeamSeasons(teamId: teamId)
        await loadTeamSquad(teamId: teamId)
        await loadTeamFixtures(teamId: teamId)
        await loadTeamTrophies(teamId: teamId)
        
        // 2. 리그 ID가 있는 경우 (리그 탭에서 접근한 경우)
        if let leagueId = selectedLeagueId {
            print("🔄 loadAllData: 리그 ID \(leagueId)로 데이터 로드")
            
            // 순서 중요: 먼저 리그 순위 로드
            await loadLeagueStandings(leagueId: leagueId, season: selectedSeason)
            
            // 그 다음 팀 데이터 로드
            await loadTeamData(teamId: teamId, leagueId: leagueId)
            
            // 마지막으로 팀 히스토리 로드
            await loadTeamHistory()
        }
        
        print("✅ loadAllData: 모든 데이터 로드 완료")
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
    
    // 빈 응답 카운터 추가
    private var emptyResponseCounter = 0
    private let maxEmptyResponses = 5 // 최대 빈 응답 허용 횟수
    
    func loadTeamData(teamId: Int, leagueId: Int) async {
        isLoadingStats = true
        errorMessage = nil
        
        // 과거 시즌인지 확인
        let currentYear = Calendar.current.component(.year, from: Date())
        let isPastSeason = selectedSeason < currentYear
        
        if isPastSeason {
            print("🔍 과거 시즌 데이터 로드 시도: \(selectedSeason) (현재: \(currentYear))")
        }
        
        do {
            // 통계 데이터 로드
            let statistics = try await service.getTeamStatistics(
                teamId: teamId,
                leagueId: leagueId,
                season: selectedSeason
            )
            
            // 통계 데이터가 비어 있는지 확인
            let isEmptyStats = statistics.fixtures?.played.total == 0 &&
                               statistics.goals?.against.total == nil &&
                               statistics.goals?.for.total == nil
            
            if isEmptyStats {
                emptyResponseCounter += 1
                print("⚠️ 빈 통계 데이터 감지 (카운터: \(emptyResponseCounter)/\(maxEmptyResponses))")
                
                // 최대 빈 응답 횟수를 초과한 경우
                if emptyResponseCounter >= maxEmptyResponses {
                    print("❌ 최대 빈 응답 횟수 초과: 로딩 중단")
                    
                    // 과거 시즌인 경우 특별 메시지 표시
                    if isPastSeason {
                        errorMessage = "선택한 시즌(\(selectedSeason))의 통계 데이터를 불러올 수 없습니다."
                    } else {
                        errorMessage = "팀 통계 데이터를 불러오는데 실패했습니다."
                    }
                    
                    // 차트 데이터 초기화
                    chartData = []
                    
                    // 로딩 상태 해제
                    isLoadingStats = false
                    return
                }
            } else {
                // 유효한 데이터를 받으면 카운터 초기화
                emptyResponseCounter = 0
                print("✅ 유효한 통계 데이터 수신: 카운터 초기화")
            }
            
            // 통계 데이터 설정
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
            
            // 과거 시즌인 경우 특별 메시지 표시
            if isPastSeason {
                errorMessage = "선택한 시즌(\(selectedSeason))의 리그 데이터를 찾을 수 없습니다."
            } else {
                errorMessage = "이 팀의 리그 데이터를 찾을 수 없습니다."
            }
            
            chartData = []
        } catch {
            print("Load Team Data Error: \(error)")
            
            // 과거 시즌인 경우 특별 메시지 표시
            if isPastSeason {
                errorMessage = "선택한 시즌(\(selectedSeason))의 데이터를 불러오는데 실패했습니다."
            } else {
                errorMessage = "팀 데이터를 불러오는데 실패했습니다: \(error.localizedDescription)"
            }
            
            chartData = []
        }
        
        isLoadingStats = false
    }
    
    func loadTeamSquad(teamId: Int) async {
        isLoadingSquad = true
        errorMessage = nil
        
        do {
            teamSquad = try await service.getTeamSquad(teamId: teamId)
            
            // 선수단 로드 후 팀 경기 정보도 로드
            await loadTeamFixtures(teamId: teamId)
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
        
        // 실패한 시즌 카운터
        var failedSeasonCount = 0
        let maxFailedSeasons = 3 // 최대 실패 허용 시즌 수
        
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
                
                // 통계 데이터가 비어 있는지 확인
                let isEmptyStats = statistics?.fixtures?.played.total == 0 &&
                                   statistics?.goals?.against.total == nil &&
                                   statistics?.goals?.for.total == nil
                
                if isEmptyStats {
                    print("⚠️ 시즌 \(season) 빈 통계 데이터 감지")
                    failedSeasonCount += 1
                    
                    // 최대 실패 시즌 수를 초과한 경우 중단
                    if failedSeasonCount >= maxFailedSeasons {
                        print("❌ 최대 실패 시즌 수 초과: 히스토리 로드 중단")
                        break
                    }
                    
                    continue // 빈 데이터인 경우 이 시즌은 건너뜀
                }
            } catch {
                print("Failed to load statistics for season \(season): \(error)")
                failedSeasonCount += 1
                
                // 최대 실패 시즌 수를 초과한 경우 중단
                if failedSeasonCount >= maxFailedSeasons {
                    print("❌ 최대 실패 시즌 수 초과: 히스토리 로드 중단")
                    break
                }
                
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
                print("✅ 시즌 \(season) 히스토리 추가 성공")
            }
        }
        
        await MainActor.run {
            self.teamHistory = history.sorted { $0.season > $1.season }
            
            // 히스토리가 비어 있는 경우 메시지 표시
            if self.teamHistory.isEmpty && failedSeasonCount > 0 {
                print("⚠️ 팀 히스토리 데이터 없음")
                // 에러 메시지는 표시하지 않음 (UI에 영향을 주지 않기 위해)
            }
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
            
            // 시즌 선택 시 빈 응답 카운터 초기화
            emptyResponseCounter = 0
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
    
    // 팀의 최근 경기 로드
    func loadTeamFixtures(teamId: Int) async {
        do {
            let fixtures = try await service.getTeamFixtures(
                teamId: teamId,
                season: selectedSeason,
                forceRefresh: false
            )
            
            // 최근 경기 정보 업데이트
            await MainActor.run {
                self.recentFixtures = fixtures.sorted(by: {
                    $0.fixture.date > $1.fixture.date
                }).prefix(10).map { $0 }
            }
        } catch {
            print("Failed to load team fixtures: \(error)")
        }
    }
    
    // 리그 순위 로드 (개선된 버전)
    func loadLeagueStandings(leagueId: Int, season: Int) async {
        // 메인 액터에서 상태 업데이트
        await MainActor.run {
            isLoadingStandings = true
            print("🔄 리그 순위 로드 시작: 리그 ID \(leagueId), 시즌 \(season)")
        }
        
        // 최대 3번 재시도
        let maxRetries = 3
        var retryCount = 0
        var lastError: Error? = nil
        
        while retryCount < maxRetries {
            do {
                // 리그 순위 가져오기 (forceRefresh 매개변수 추가)
                let standings = try await service.getStandings(
                    leagueId: leagueId,
                    season: season
                )
                
                // 메인 액터에서 상태 업데이트
                await MainActor.run {
                    self.leagueStandings = standings
                    self.isLoadingStandings = false
                    print("✅ 리그 순위 로드 성공: \(standings.count)개 팀")
                }
                
                // 성공하면 반복문 종료
                return
            } catch {
                retryCount += 1
                lastError = error
                print("⚠️ 리그 순위 로드 실패 (시도 \(retryCount)/\(maxRetries)): \(error.localizedDescription)")
                
                // 재시도 전 잠시 대기 (지수 백오프)
                let delay = Double(retryCount * 500) * 1_000_000 // 0.5초, 1초, 1.5초
                try? await Task.sleep(nanoseconds: UInt64(delay))
            }
        }
        
        // 모든 재시도 실패 후 상태 업데이트
        print("❌ 리그 순위 로드 최종 실패: \(lastError?.localizedDescription ?? "알 수 없는 오류")")
        await MainActor.run {
            // 빈 배열로 설정하여 UI가 깨지지 않도록 함
            self.leagueStandings = []
            self.isLoadingStandings = false
        }
    }
    
    // 팀 주변 순위 가져오기 (현재 팀 포함 3개) - 개선된 버전
    func getNearbyTeams() -> [Standing] {
        guard let standings = leagueStandings, !standings.isEmpty else {
            print("⚠️ getNearbyTeams: 순위 데이터가 없습니다.")
            return []
        }
        
        print("🔍 getNearbyTeams: 총 \(standings.count)개 팀 중 팀 ID \(teamId)의 순위 찾기")
        
        // 현재 팀의 순위 찾기
        if let currentTeamIndex = standings.firstIndex(where: { $0.team.id == teamId }) {
            print("✅ getNearbyTeams: 팀 ID \(teamId)의 순위 찾음 - 인덱스 \(currentTeamIndex)")
            
            // 항상 3개의 팀을 표시하도록 로직 수정
            if standings.count < 3 {
                // 순위 목록에 3개 미만의 팀이 있는 경우 전체 반환
                print("📊 getNearbyTeams: 전체 팀 수가 3개 미만이므로 전체 반환 (\(standings.count)개)")
                return standings
            } else if currentTeamIndex == 0 {
                // 1위 팀인 경우 상위 3개 팀 반환 (1, 2, 3위)
                print("📊 getNearbyTeams: 1위 팀이므로 상위 3개 팀 반환 (1-3위)")
                return Array(standings.prefix(3))
            } else if currentTeamIndex >= standings.count - 2 {
                // 맨 하위 또는 하위 두 번째 팀인 경우 하위 3개 팀 반환
                print("📊 getNearbyTeams: 하위 팀이므로 하위 3개 팀 반환 (\(standings.count-2)-\(standings.count)위)")
                return Array(standings.suffix(3))
            } else {
                // 그 외의 경우 현재 팀 기준 앞뒤로 1개씩 포함하여 3개 팀 반환
                print("📊 getNearbyTeams: 중간 순위 팀이므로 현재 팀 기준 앞뒤로 1개씩 포함 (\(currentTeamIndex)위 주변)")
                return Array(standings[(currentTeamIndex-1)...(currentTeamIndex+1)])
            }
        } else {
            print("⚠️ getNearbyTeams: 팀 ID \(teamId)를 순위에서 찾을 수 없음")
            
            // 팀을 찾지 못한 경우 상위 3개 팀 반환
            let result = Array(standings.prefix(min(3, standings.count)))
            print("📊 getNearbyTeams: 팀을 찾지 못해 상위 \(result.count)개 팀 반환")
            return result
        }
    }
    
    // 더미 트로피 데이터 생성 함수 (확장 및 개선)
    private func createDummyTrophies(teamId: Int) -> [TeamTrophy] {
        // 주요 팀 ID에 따라 다른 트로피 데이터 생성
        var trophies: [TeamTrophy] = []
        
        switch teamId {
        case 33: // 맨체스터 유나이티드
            trophies = [
                TeamTrophy(league: "Premier League", country: "England", season: "2012-2013", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2010-2011", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2008-2009", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2007-2008", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2006-2007", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "2003-2004", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "1998-1999", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2007-2008", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1998-1999", place: "Winner"),
                TeamTrophy(league: "UEFA Europa League", country: "Europe", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2016-2017", place: "Winner")
            ]
        case 40: // 리버풀
            trophies = [
                TeamTrophy(league: "Premier League", country: "England", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2004-2005", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1983-1984", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1980-1981", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1977-1978", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "2005-2006", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2011-2012", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2019", place: "Winner")
            ]
        case 50: // 맨체스터 시티
            trophies = [
                TeamTrophy(league: "Premier League", country: "England", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2022-2023", place: "Winner")
            ]
        case 541: // 레알 마드리드
            trophies = [
                TeamTrophy(league: "La Liga", country: "Spain", season: "2023-2024", place: "Winner"),
                TeamTrophy(league: "La Liga", country: "Spain", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "La Liga", country: "Spain", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "La Liga", country: "Spain", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2013-2014", place: "Winner"),
                TeamTrophy(league: "Copa del Rey", country: "Spain", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "Copa del Rey", country: "Spain", season: "2013-2014", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2022", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2018", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2017", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2016", place: "Winner")
            ]
        case 529: // 바르셀로나
            trophies = [
                TeamTrophy(league: "La Liga", country: "Spain", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "La Liga", country: "Spain", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "La Liga", country: "Spain", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "La Liga", country: "Spain", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "La Liga", country: "Spain", season: "2014-2015", place: "Winner"),
                TeamTrophy(league: "Copa del Rey", country: "Spain", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "Copa del Rey", country: "Spain", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "Copa del Rey", country: "Spain", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "Copa del Rey", country: "Spain", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2014-2015", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2010-2011", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2008-2009", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2015", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2011", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2009", place: "Winner")
            ]
        case 157: // 바이에른 뮌헨
            trophies = [
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2014-2015", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2013-2014", place: "Winner"),
                TeamTrophy(league: "DFB Pokal", country: "Germany", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "DFB Pokal", country: "Germany", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2012-2013", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2020", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2013", place: "Winner")
            ]
        case 165: // 도르트문트
            trophies = [
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2011-2012", place: "Winner"),
                TeamTrophy(league: "Bundesliga", country: "Germany", season: "2010-2011", place: "Winner"),
                TeamTrophy(league: "DFB Pokal", country: "Germany", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "DFB Pokal", country: "Germany", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1996-1997", place: "Winner")
            ]
        case 85: // PSG
            trophies = [
                TeamTrophy(league: "Ligue 1", country: "France", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "Ligue 1", country: "France", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "Ligue 1", country: "France", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "Ligue 1", country: "France", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "Ligue 1", country: "France", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "Ligue 1", country: "France", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "Coupe de France", country: "France", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "Coupe de France", country: "France", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "Coupe de France", country: "France", season: "2017-2018", place: "Winner")
            ]
        case 489: // AC 밀란
            trophies = [
                TeamTrophy(league: "Serie A", country: "Italy", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2010-2011", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2003-2004", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2006-2007", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2002-2003", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1993-1994", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1989-1990", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2007", place: "Winner")
            ]
        case 505: // 인터 밀란
            trophies = [
                TeamTrophy(league: "Serie A", country: "Italy", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2009-2010", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2008-2009", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2007-2008", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2006-2007", place: "Winner"),
                TeamTrophy(league: "Coppa Italia", country: "Italy", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "Coppa Italia", country: "Italy", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "2009-2010", place: "Winner"),
                TeamTrophy(league: "FIFA Club World Cup", country: "World", season: "2010", place: "Winner")
            ]
        case 496: // 유벤투스
            trophies = [
                TeamTrophy(league: "Serie A", country: "Italy", season: "2019-2020", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2018-2019", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2014-2015", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2013-2014", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2012-2013", place: "Winner"),
                TeamTrophy(league: "Serie A", country: "Italy", season: "2011-2012", place: "Winner"),
                TeamTrophy(league: "Coppa Italia", country: "Italy", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "Coppa Italia", country: "Italy", season: "2017-2018", place: "Winner"),
                TeamTrophy(league: "Coppa Italia", country: "Italy", season: "2016-2017", place: "Winner"),
                TeamTrophy(league: "Coppa Italia", country: "Italy", season: "2015-2016", place: "Winner"),
                TeamTrophy(league: "UEFA Champions League", country: "Europe", season: "1995-1996", place: "Winner")
            ]
        case 47: // 토트넘 핫스퍼
            trophies = [
                TeamTrophy(league: "Premier League", country: "England", season: "1960-1961", place: "Winner"),
                TeamTrophy(league: "Premier League", country: "England", season: "1950-1951", place: "Winner"),
                TeamTrophy(league: "UEFA Europa League", country: "Europe", season: "2024-2025", place: "Winner"),
                TeamTrophy(league: "UEFA Europa League", country: "Europe", season: "1983-1984", place: "Winner"),
                TeamTrophy(league: "UEFA Europa League", country: "Europe", season: "1971-1972", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "1990-1991", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "1981-1982", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "1980-1981", place: "Winner"),
                TeamTrophy(league: "FA Cup", country: "England", season: "1961-1962", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "2007-2008", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "1998-1999", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "1971-1972", place: "Winner"),
                TeamTrophy(league: "EFL Cup", country: "England", season: "1970-1971", place: "Winner")
            ]
        default:
            // 기본 트로피 데이터 (모든 팀에 적용)
            trophies = [
                TeamTrophy(league: "League Title", country: "Country", season: "2022-2023", place: "Winner"),
                TeamTrophy(league: "League Title", country: "Country", season: "2020-2021", place: "Winner"),
                TeamTrophy(league: "Cup", country: "Country", season: "2021-2022", place: "Winner"),
                TeamTrophy(league: "Cup", country: "Country", season: "2019-2020", place: "Runner-up")
            ]
        }
        
        return trophies
    }
    
    // 트로피 정보 로드
    @Published var trophies: [TeamTrophy]?
    @Published var isLoadingTrophies = false
    
    // 비동기 함수로 변경하여 다른 비동기 함수들과 함께 사용할 수 있도록 함
    func loadTeamTrophies(teamId: Int) async {
        // 메인 액터에서 상태 업데이트
        await MainActor.run {
            isLoadingTrophies = true
            print("🔄 트로피 데이터 로드 시작: 팀 ID \(teamId)")
        }
        
        do {
            // TeamTrophiesLibrary에서 팀 ID에 해당하는 트로피 데이터 가져오기
            let trophyItems = TeamTrophiesLibrary.getTrophiesForTeam(teamId: teamId)
            
            // 트로피 데이터가 없는 경우 더미 데이터 사용
            let finalTrophies = trophyItems.isEmpty ? createDummyTrophies(teamId: teamId) : trophyItems.toTeamTrophies()
            
            // 리그 이름 수정 (EPL -> Premier League)
            let correctedTrophies = finalTrophies.map { trophy -> TeamTrophy in
                // EPL을 Premier League로 변경
                if trophy.league == "EPL" || trophy.league == "EPL Title" {
                    return TeamTrophy(
                        league: "Premier League",
                        country: trophy.country,
                        season: trophy.season,
                        place: trophy.place,
                        totalCount: trophy.totalCount
                    )
                }
                
                // LaLiga를 La Liga로 변경
                if trophy.league == "LaLiga" || trophy.league == "LaLiga Title" {
                    return TeamTrophy(
                        league: "La Liga",
                        country: trophy.country,
                        season: trophy.season,
                        place: trophy.place,
                        totalCount: trophy.totalCount
                    )
                }
                
                return trophy
            }
            
            // 약간의 지연을 추가하여 로딩 상태를 시뮬레이션
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5초 지연
            
            // 메인 액터에서 상태 업데이트
            await MainActor.run {
                self.trophies = correctedTrophies
                self.isLoadingTrophies = false
                print("✅ 트로피 데이터 로드 완료: \(correctedTrophies.count)개")
                
                // 팀 이름 로깅 (디버깅용)
                if let teamName = TeamTrophiesLibrary.getTeamName(for: teamId) {
                    print("✅ 트로피 데이터 소스: \(trophyItems.isEmpty ? "더미 데이터" : "\(teamName)의 실제 트로피 데이터")")
                    
                    // 트로피 요약 정보 로깅 (디버깅용)
                    if !trophyItems.isEmpty {
                        let summary = TeamTrophiesLibrary.getTrophySummary(forTeam: teamName)
                        print("📊 트로피 요약:")
                        for (competition, count) in summary {
                            print("   - \(competition): \(count)회")
                        }
                    }
                } else {
                    print("✅ 트로피 데이터 소스: \(trophyItems.isEmpty ? "더미 데이터" : "TeamTrophiesLibrary")")
                }
            }
        } catch {
            // 에러 처리
            print("❌ 트로피 데이터 로드 실패: \(error.localizedDescription)")
            
            // 에러 발생 시에도 상태 업데이트
            await MainActor.run {
                self.isLoadingTrophies = false
                // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
                if self.trophies == nil {
                    self.trophies = []
                }
            }
        }
    }
}
