import Foundation
import SwiftUI
import UIKit

// MARK: - 부상 선수 모델
struct PlayerInjury: Identifiable {
    let id = UUID()
    let player: InjuredPlayer
    let team: Team
    let injury: Injury

    struct InjuredPlayer {
        let id: Int
        let name: String
        let photo: String
        let position: String?
    }

    struct Injury {
        let type: String
        let reason: String?
        let date: String?
    }
}


// MARK: - Computed Properties for League Info
extension FixtureDetailViewModel {
    var leagueIdValue: Int? {
        currentFixture?.league.id
    }

    var leagueNameValue: String? {
        currentFixture?.league.name
    }
}

// MARK: - 통계 카테고리
enum StatisticCategory: String, CaseIterable {
    case shooting = "슈팅"
    case passing = "패스"
    case defense = "수비"
    case attacking = "공격"
    case other = "기타"
}

// MARK: - 차트 데이터 모델 확장
extension FixtureChartData {
    // 기존 FixtureChartData 모델 확장
    var homePercentage: Double {
        let total = homeValue + awayValue
        return total > 0 ? (homeValue / total) * 100 : 50
    }

    var awayPercentage: Double {
        let total = homeValue + awayValue
        return total > 0 ? (awayValue / total) * 100 : 50
    }

    // 카테고리 정보 추가
    var category: StatisticCategory {
        switch label {
        case "Shots on Goal", "Total Shots", "Blocked Shots", "Shots insidebox", "Shots outsidebox":
            return .shooting
        case "Passes accurate", "Passes %", "Total passes", "Crosses", "Corners":
            return .passing
        case "Saves", "Tackles", "Blocks", "Interceptions", "Goalkeeper saves":
            return .defense
        case "Dribbles", "Dribbles attempts", "Dribbles success", "Dribbles past":
            return .attacking
        default:
            return .other
        }
    }

    // 한글 타이틀
    var koreanTitle: String {
        switch label {
        case "Shots on Goal": return "유효슈팅"
        case "Total Shots": return "총 슈팅"
        case "Blocked Shots": return "블록된 슈팅"
        case "Shots insidebox": return "박스 안 슈팅"
        case "Shots outsidebox": return "박스 밖 슈팅"
        case "Passes accurate": return "정확한 패스"
        case "Passes %": return "패스 성공률"
        case "Total passes": return "총 패스"
        case "Crosses": return "크로스"
        case "Corners": return "코너킥"
        case "Possession": return "점유율"
        case "Fouls": return "파울"
        case "Yellow Cards": return "옐로카드"
        case "Red Cards": return "레드카드"
        case "Offsides": return "오프사이드"
        case "Ball Possession": return "점유율"
        case "Saves": return "세이브"
        case "Tackles": return "태클"
        case "Blocks": return "블록"
        case "Interceptions": return "인터셉트"
        case "Duels won": return "듀얼 승리"
        case "Dribbles": return "드리블"
        case "Dribbles attempts": return "드리블 시도"
        case "Dribbles success": return "드리블 성공"
        case "Dribbles past": return "드리블 통과"
        case "Goalkeeper saves": return "골키퍼 세이브"
        default: return label
        }
    }
}

@MainActor
class FixtureDetailViewModel: ObservableObject {
    // MARK: - Published 속성
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
    @Published var manOfTheMatch: FixturePlayerStats?

    @Published var isLoadingForm = false
    @Published var isLoadingEvents = false
    @Published var isLoadingStats = false
    @Published var isLoadingLineups = false
    @Published var isLoadingPlayers = false
    @Published var isLoadingMatchStats = false
    @Published var isLoadingHeadToHead = false
    @Published var isLoadingStandings = false

    @Published var selectedStatisticType: StatisticType?
    @Published var selectedTeamId: Int?
    @Published var selectedPlayerId: Int?
    @Published var selectedLeagueId: Int?
    @Published var showTeamProfile = false

    @Published var errorMessage: String?
    @Published var standings: [Standing] = []

    // 합산 스코어 결과 저장
    @Published var aggregateScoreResult: (home: Int, away: Int)?

    // 부상 선수 정보
    @Published var homeTeamInjuries: [PlayerInjury] = []
    @Published var awayTeamInjuries: [PlayerInjury] = []
    @Published var isLoadingInjuries = false

    // MARK: - 프라이빗 속성
    private let service = FootballAPIService.shared
    private let fixtureId: Int
    private let season: Int
    public var currentFixture: Fixture?

    // 캐싱을 위한 프로퍼티
    private var firstLegMatchCache: [Int: Fixture] = [:]

    // 팀 폼 로드 요청 상태 추적을 위한 프로퍼티
    private var isLoadingTeamForm: [Int: Bool] = [:]
    private var teamFormLoadAttempts: [Int: Int] = [:]
    private let maxTeamFormLoadAttempts = 2
    
    // 자동 새로고침 관련 프로퍼티
    private var refreshTimer: Timer?
    private let liveMatchRefreshInterval: TimeInterval = 30 // 진행 중인 경기는 30초마다 새로고침 (실시간 이벤트 업데이트를 위해)
    private let upcomingMatchRefreshInterval: TimeInterval = 300 // 예정된 경기는 5분마다 새로고침
    private var isAutoRefreshEnabled = true

    // MARK: - 초기화
    init(fixture: Fixture) {
        self.fixtureId = fixture.fixture.id
        self.season = fixture.league.season
        self.currentFixture = fixture
        
        // 앱 생명주기 이벤트 관찰 설정
        setupAppLifecycleObservers()
        
        // 자동 새로고침 시작
        startAutoRefresh()
    }
    
    deinit {
        // 타이머 정리 - deinit에서는 동기적으로 처리
        refreshTimer?.invalidate()
        refreshTimer = nil
        
        // 앱 생명주기 관찰자 제거
        #if os(iOS)
        NotificationCenter.default.removeObserver(self)
        #endif
    }
    
    // 앱 생명주기 이벤트 관찰 설정
    private func setupAppLifecycleObservers() {
        #if os(iOS)
        // iOS에서는 NotificationCenter를 통해 앱 생명주기 이벤트 관찰
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        #endif
    }
    
    // 앱이 포그라운드로 돌아올 때 호출
    @objc private func appWillEnterForeground() {
        print("📱 앱이 포그라운드로 돌아옴 (FixtureDetailViewModel)")
        
        // 데이터 새로고침 - Task를 사용하여 비동기 작업 실행
        Task {
            await refreshData()
        }
        
        // 자동 새로고침 재시작 - 동기 메서드이므로 직접 호출
        startAutoRefresh()
    }
    
    // 앱이 백그라운드로 갈 때 호출
    @objc private func appDidEnterBackground() {
        print("📱 앱이 백그라운드로 이동 (FixtureDetailViewModel)")
        
        // 자동 새로고침 중지 - 동기 메서드이므로 직접 호출
        stopAutoRefresh()
    }
    
    // 자동 새로고침 시작
    private func startAutoRefresh() {
        // 자동 새로고침이 비활성화된 경우 종료
        guard isAutoRefreshEnabled else {
            print("⚠️ 자동 새로고침이 비활성화되어 있습니다.")
            return
        }
        
        // 이미 타이머가 실행 중이면 중지
        stopAutoRefresh()
        
        // 경기 상태에 따라 새로고침 간격 결정
        var refreshInterval: TimeInterval
        
        if let fixture = currentFixture {
            // 경기 상태에 따른 새로고침 간격 설정
            switch fixture.fixture.status.short {
            case "1H", "2H", "HT", "ET", "P", "BT": // 진행 중인 경기
                refreshInterval = liveMatchRefreshInterval
                print("⏱️ 진행 중인 경기 자동 새로고침 타이머 시작 (간격: \(liveMatchRefreshInterval)초)")
            case "NS": // 예정된 경기
                refreshInterval = upcomingMatchRefreshInterval
                print("⏱️ 예정된 경기 자동 새로고침 타이머 시작 (간격: \(upcomingMatchRefreshInterval)초)")
            default: // 종료된 경기 등
                // 종료된 경기는 자동 새로고침 불필요
                print("⏱️ 종료된 경기는 자동 새로고침이 필요하지 않습니다.")
                return
            }
        } else {
            // 경기 정보가 없는 경우 기본값 사용
            refreshInterval = upcomingMatchRefreshInterval
            print("⏱️ 경기 정보 없음, 기본 자동 새로고침 타이머 시작 (간격: \(upcomingMatchRefreshInterval)초)")
        }
        
        // 새 타이머 생성
        refreshTimer = Timer.scheduledTimer(withTimeInterval: refreshInterval, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            print("⏱️ 자동 새로고침 실행")
            // MainActor에서 실행하도록 수정
            Task { @MainActor in
                await self.refreshData()
            }
        }
    }
    
    // 자동 새로고침 중지
    private func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
    
    // 데이터 새로고침
    private func refreshData() async {
        // 현재 경기 상태 확인
        if let fixture = currentFixture {
            // 경기 상태에 따라 다른 데이터 새로고침
            if isLiveMatch() { // 진행 중인 경기
                // 이벤트, 통계, 라인업 새로고침
                print("🔄 진행 중인 경기 데이터 새로고침 시작")
                // 비동기 작업이 있는 메서드 호출
                await self.loadEvents()
                await self.loadStatistics()
                await self.loadLineups() // 라인업 데이터도 새로고침
                await self.loadMatchPlayerStats() // 선수 통계도 새로고침
            } else if fixture.fixture.status.short == "NS" { // 예정된 경기
                // 부상 정보, 팀 폼 새로고침
                print("🔄 예정된 경기 데이터 새로고침 시작")
                await self.loadInjuries()
                await self.loadTeamForms()
            } else if ["FT", "AET", "PEN"].contains(fixture.fixture.status.short) { // 종료된 경기
                // 종료된 경기는 새로고침 불필요
                print("🔄 종료된 경기는 데이터 새로고침이 필요하지 않습니다.")
            } else {
                // 기타 상태는 모든 데이터 새로고침
                print("🔄 기타 상태 경기 데이터 새로고침 시작")
                await self.loadAllData()
            }
        } else {
            // 경기 정보가 없는 경우 모든 데이터 새로고침
            print("🔄 경기 정보 없음, 모든 데이터 새로고침 시작")
            await self.loadAllData()
        }
    }

    // MARK: - 공개 메서드

    // 통계 타입 필터링
    func filterByStatisticType(_ type: StatisticType?) {
        selectedStatisticType = type
    }

    // 현재 경기가 토너먼트 경기인지 확인하는 함수
    public func isTournamentMatch(_ round: String) -> Bool {
        // 예: "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등
        let tournamentRounds = ["16", "8", "quarter", "semi", "final", "1st leg", "2nd leg"]
        return tournamentRounds.contains { round.lowercased().contains($0.lowercased()) }
    }
    
    // 현재 경기가 라이브 경기인지 확인하는 함수
    public func isLiveMatch() -> Bool {
        guard let fixture = currentFixture else { return false }
        return ["1H", "2H", "HT", "ET", "P", "BT"].contains(fixture.fixture.status.short)
    }

    // 모든 데이터 로드
    func loadAllData() async {
        print("🔄 모든 데이터 로드 시작")

        // 경기 예정인 경우와 경기 결과인 경우에 따라 다른 데이터 로드
        if let fixture = currentFixture, fixture.fixture.status.short == "NS" {
            // 경기 예정인 경우: 팀 폼, 상대전적, 부상, 순위 정보 로드
            await withTaskGroup(of: Void.self) { group in
                group.addTask {
                    print("🔄 팀 폼 로드 시작")
                    await self.loadTeamForms()
                }
                group.addTask {
                    print("🔄 상대전적 로드 시작")
                    await self.loadHeadToHead()
                }
                group.addTask {
                    print("🔄 부상 정보 로드 시작")
                    await self.loadInjuries()
                }
                group.addTask {
                    print("🔄 순위 정보 로드 시작")
                    await self.loadStandings()
                }
            }
            print("✅ 경기 예정 데이터 로드 완료")
        } else {
            // 경기 결과인 경우: 맨 오브 더 매치 데이터를 먼저 로드
            print("🔄 맨 오브 더 매치 데이터 로드 시작")
            await loadMatchPlayerStats()

            // 이벤트, 통계, 라인업, 상대전적 로드
            await withTaskGroup(of: Void.self) { group in
                group.addTask {
                    print("🔄 경기 이벤트 로드 시작")
                    await self.loadEvents()
                }
                group.addTask {
                    print("🔄 경기 통계 로드 시작")
                    await self.loadStatistics()
                }
                group.addTask {
                    print("🔄 팀 폼 로드 시작")
                    await self.loadTeamForms()
                }
                group.addTask {
                    print("🔄 상대전적 로드 시작")
                    await self.loadHeadToHead()
                    // loadHeadToHead 완료 후 합산 스코어 계산 호출 보장
                    print("✅ 상대전적 로드 완료, 합산 스코어 계산 시작")
                    _ = await self.calculateAggregateScore() // loadHeadToHead 다음에 호출
                }
            }
            // TaskGroup이 완료될 때까지 기다림
            // await group.waitForAll() // TaskGroup은 자동으로 기다림

            // 라인업 로드는 맨 오브 더 매치 데이터 로드 후에 진행
            if !matchPlayerStats.isEmpty {
                print("🔄 라인업 로드 시작")
                await loadLineups()
            }

            print("✅ 경기 결과 데이터 로드 완료")
        }
    }

    // 이벤트 로드 (강화된 버전)
    public func loadEvents() async {
        isLoadingEvents = true
        print("🔄 FixtureDetailViewModel - 경기 이벤트 로드 시작 (fixtureId: \(fixtureId))")

        do {
            // 라이브 경기인 경우 LiveMatchService 사용, 아닌 경우 일반 API 사용
            let fixtureEvents: [FixtureEvent]
            if isLiveMatch() {
                print("🔴 라이브 경기 이벤트 로드 (LiveMatchService 사용)")
                fixtureEvents = try await LiveMatchService.shared.getLiveMatchEvents(fixtureId: fixtureId)
            } else {
                print("🔄 일반 경기 이벤트 로드 (FootballAPIService 사용)")
                fixtureEvents = try await service.getFixtureEvents(fixtureId: fixtureId)
            }
            print("📊 FixtureDetailViewModel - API에서 이벤트 \(fixtureEvents.count)개 수신")

            // 이벤트 시간 순으로 정렬
            let sortedEvents = fixtureEvents.sorted { (event1, event2) -> Bool in
                let time1 = event1.time.elapsed + (event1.time.extra ?? 0)
                let time2 = event2.time.elapsed + (event2.time.extra ?? 0)
                return time1 < time2
            }

            // 실제 득점된 골 이벤트만 필터링 (isActualGoal 속성 사용)
            let goalEvents = sortedEvents.filter { event in
                return event.isActualGoal
            }
            
            print("⚽️ FixtureDetailViewModel - 실제 득점된 골 이벤트 \(goalEvents.count)개 발견")
            
            // 골 이벤트 상세 로깅 (연장전 표시 포함)
            for (index, goal) in goalEvents.enumerated() {
                let timeInfo = goal.time.elapsed > 90 ? "\(goal.time.elapsed)' (연장)" : "\(goal.time.elapsed)'"
                print("  [\(index+1)] \(goal.team.name) - \(goal.player.name ?? "알 수 없음") (\(timeInfo)) - \(goal.detail)")
            }

            // 메인 스레드에서 데이터 업데이트
            await MainActor.run {
                self.events = sortedEvents
                self.isLoadingEvents = false
                print("✅ FixtureDetailViewModel - 경기 이벤트 로드 완료: \(sortedEvents.count)개")
                
                // 연장전 득점자 확인 및 로깅
                let extraTimeGoals = sortedEvents.filter { $0.isActualGoal && $0.isExtraTime }
                if !extraTimeGoals.isEmpty {
                    print("⚽️ FixtureDetailViewModel - 연장전 득점 이벤트 \(extraTimeGoals.count)개 발견")
                    for (index, goal) in extraTimeGoals.enumerated() {
                        print("  [\(index+1)] \(goal.team.name) - \(goal.player.name ?? "알 수 없음") (\(goal.time.elapsed)' 연장) - \(goal.detail)")
                    }
                }
                
                // 이벤트 로드 완료 후 UI 업데이트 트리거 (즉시)
                self.objectWillChange.send()
                
                // 모든 관찰자에게 변경 알림
                NotificationCenter.default.post(name: NSNotification.Name("EventsDidLoad"), object: nil)
            }
            
            // 불필요한 여러 번의 UI 업데이트를 하나로 통합
            // 약간의 지연 후 한 번만 UI 업데이트 트리거 (UI 갱신 보장)
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
            await MainActor.run {
                self.objectWillChange.send()
                print("✅ FixtureDetailViewModel - UI 업데이트 완료")
                
                // 모든 관찰자에게 변경 알림
                NotificationCenter.default.post(name: NSNotification.Name("EventsDidLoad"), object: nil)
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "경기 이벤트를 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingEvents = false
                print("❌ 경기 이벤트 로드 실패: \(error.localizedDescription)")
            }
        }
    }

    // 부상 선수 정보 로드
    public func loadInjuries() async {
        isLoadingInjuries = true

        guard let fixture = currentFixture else {
            isLoadingInjuries = false
            return
        }

        // 홈팀과 원정팀 ID
        let homeTeamId = fixture.teams.home.id
        let awayTeamId = fixture.teams.away.id
        let fixtureId = fixture.fixture.id
        let season = fixture.league.season

        do {
            // 1. 경기 ID로 부상 정보 조회
            var injuryData = try await service.getInjuries(fixtureId: fixtureId)

            // 2. 경기 ID로 조회한 결과가 없으면 팀 ID와 시즌으로 조회
            if injuryData.isEmpty {
                // 홈팀 부상 정보 조회
                let homeTeamInjuries = try await service.getInjuries(teamId: homeTeamId, season: season)

                // 원정팀 부상 정보 조회
                let awayTeamInjuries = try await service.getInjuries(teamId: awayTeamId, season: season)

                // 두 팀의 부상 정보 합치기
                injuryData = homeTeamInjuries + awayTeamInjuries
            }

            // 부상 정보를 홈팀과 원정팀으로 분류
            var homeInjuries: [PlayerInjury] = []
            var awayInjuries: [PlayerInjury] = []

            for injury in injuryData {
                // PlayerInjury 객체 생성
                let playerInjury = PlayerInjury(
                    player: PlayerInjury.InjuredPlayer(
                        id: injury.player.id,
                        name: injury.player.name,
                        photo: injury.player.photo ?? "https://media.api-sports.io/football/players/\(injury.player.id).png",
                        position: injury.player.position
                    ),
                    team: injury.team,
                    injury: PlayerInjury.Injury(
                        type: injury.player.type,
                        reason: injury.player.reason,
                        date: nil // API에서 복귀 예정일을 제공하지 않으므로 nil로 설정
                    )
                )

                // 홈팀과 원정팀으로 분류
                if injury.team.id == homeTeamId {
                    homeInjuries.append(playerInjury)
                } else if injury.team.id == awayTeamId {
                    awayInjuries.append(playerInjury)
                }
            }

            await MainActor.run {
                self.homeTeamInjuries = homeInjuries
                self.awayTeamInjuries = awayInjuries
                self.isLoadingInjuries = false
                print("✅ 부상 정보 로드 완료: 홈팀 \(homeInjuries.count)명, 원정팀 \(awayInjuries.count)명")
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "부상 정보를 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingInjuries = false
                print("❌ 부상 정보 로드 실패: \(error.localizedDescription)")

                // 오류 발생 시 빈 배열로 설정
                self.homeTeamInjuries = []
                self.awayTeamInjuries = []
            }
        }
    }

    // 팀 폼 데이터 로드
    public func loadTeamForms() async {
        guard !isLoadingForm else { return }

        isLoadingForm = true
        errorMessage = nil

        guard let fixture = currentFixture else {
            isLoadingForm = false
            return
        }

        let homeTeamId = fixture.teams.home.id
        let awayTeamId = fixture.teams.away.id

        // 이미 데이터가 있어도 강제로 다시 로드
        // if homeTeamForm != nil && awayTeamForm != nil {
        //     isLoadingForm = false
        //     return
        // }

        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.loadTeamForm(teamId: homeTeamId, isHome: true) }
            group.addTask { await self.loadTeamForm(teamId: awayTeamId, isHome: false) }
        }

        // 데이터 로드 후 UI 업데이트를 위해 약간의 지연 추가
        try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기

        isLoadingForm = false

        // 데이터가 없으면 다시 시도
        if homeTeamForm == nil || awayTeamForm == nil {
            print("⚠️ 팀 폼 데이터 누락, 다시 시도")
            await retryLoadTeamForms(homeTeamId: homeTeamId, awayTeamId: awayTeamId)
        }
    }

    // 합산 스코어 계산 (재수정: findFirstLegMatch 결과에만 의존, 라운드 이름 검사 제거)
    public func calculateAggregateScore() async -> (home: Int, away: Int)? {
        guard let fixture = currentFixture else {
            print("🏆 FixtureDetailViewModel - 합산 스코어 계산: 현재 경기 정보 없음")
            return nil
        }

        // 챔피언스리그(2) 또는 유로파리그(3)인지 확인
        guard [2, 3].contains(fixture.league.id) else {
            // print("🏆 FixtureDetailViewModel - 합산 스코어 계산: 대상 리그 아님 (ID: \(fixture.league.id))")
            await MainActor.run { self.aggregateScoreResult = nil } // 대상 리그 아니면 nil 설정
            return nil
        }

        print("🏆 FixtureDetailViewModel - 합산 스코어 계산 시도 (fixture: \(fixture.fixture.id))")
        do {
            // FootballAPIService를 직접 호출하여 1차전 찾기
            print("  -> Calling service.findFirstLegMatch...")
            if let firstLegMatch = try await service.findFirstLegMatch(fixture: fixture) {
                // 1차전을 찾았다는 것은 현재 경기가 2차전임을 의미 (findFirstLegMatch 로직에 따라)
                print("  -> 1차전 찾음: \(firstLegMatch.fixture.id). 현재 경기는 2차전으로 간주하여 합산 진행.")
                let firstLegHomeGoals = firstLegMatch.goals?.home ?? 0
                let firstLegAwayGoals = firstLegMatch.goals?.away ?? 0
                let secondLegHomeGoals = fixture.goals?.home ?? 0
                let secondLegAwayGoals = fixture.goals?.away ?? 0

                var homeAggregate: Int
                var awayAggregate: Int

                // 홈/원정 팀 순서 확인
                if firstLegMatch.teams.home.id == fixture.teams.away.id {
                    homeAggregate = secondLegHomeGoals + firstLegAwayGoals
                    awayAggregate = secondLegAwayGoals + firstLegHomeGoals
                    print("  -> 합산 완료 (홈/원정 반대): \(homeAggregate) - \(awayAggregate)")
                } else {
                    homeAggregate = secondLegHomeGoals + firstLegHomeGoals
                    awayAggregate = secondLegAwayGoals + firstLegAwayGoals
                    print("  -> 합산 완료 (홈/원정 동일): \(homeAggregate) - \(awayAggregate)")
                }
                let result = (home: homeAggregate, away: awayAggregate)
                await MainActor.run {
                    print("🔄 aggregateScoreResult 업데이트 (2차전 합산): \(result)")
                    self.aggregateScoreResult = result
                }
                return result
            } else {
                // findFirstLegMatch가 nil을 반환: 1차전을 못 찾았거나, 현재 경기가 1차전/단판 등 합산 대상 아님
                print("  -> 1차전 경기를 찾지 못함 (API 결과 또는 합산 대상 아님)")
                await MainActor.run {
                    print("🔄 aggregateScoreResult 업데이트 (1차전 못찾음/해당없음): nil")
                    self.aggregateScoreResult = nil
                }
                return nil
            }
        } catch {
            print("❌ FixtureDetailViewModel - 1차전 찾기 중 에러: \(error.localizedDescription)")
             await MainActor.run {
                 print("🔄 aggregateScoreResult 업데이트 (에러): nil")
                 self.aggregateScoreResult = nil // 에러 시 합산 불가
             }
            return nil
        }
    }

    // 순위 정보 로드
    public func loadStandings() async {
        isLoadingStandings = true
        errorMessage = nil

        guard let fixture = currentFixture else {
            isLoadingStandings = false
            return
        }

        let leagueId = fixture.league.id
        let season = fixture.league.season

        do {
            // API에서 순위 정보 가져오기
            let standingsData = try await service.getStandings(leagueId: leagueId, season: season)

            // 데이터 로드 후 UI 업데이트를 위해 약간의 지연 추가
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기

            await MainActor.run {
                self.standings = standingsData
                self.isLoadingStandings = false
                print("✅ 순위 정보 로드 완료: \(standingsData.count)개")

                // 데이터가 비어있으면 다시 시도
                if self.standings.isEmpty {
                    print("⚠️ 순위 정보 데이터 누락, 다시 시도")
                    Task {
                        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1초 대기
                        await self.loadStandings()
                    }
                }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "순위 정보를 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingStandings = false
                print("❌ 순위 정보 로드 실패: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - 프라이빗 메서드

    // 통계 로드
    public func loadStatistics() async {
        isLoadingStats = true

        do {
            // 1. 기본 통계 가져오기 (라이브 경기인 경우 LiveMatchService 사용)
            let teamStats: [TeamStatistics]
            if isLiveMatch() {
                print("🔴 라이브 경기 통계 로드 (LiveMatchService 사용)")
                teamStats = try await LiveMatchService.shared.getLiveMatchStatistics(fixtureId: fixtureId)
            } else {
                print("🔄 일반 경기 통계 로드 (FootballAPIService 사용)")
                teamStats = try await service.getFixtureStatistics(fixtureId: fixtureId)
            }

            // 2. 하프 통계 가져오기
            let halfStats = try await service.getFixtureHalfStatistics(fixtureId: fixtureId)

            // 3. 차트 데이터 생성
            let chartData = createChartData(from: teamStats)

            await MainActor.run {
                self.statistics = teamStats
                self.halfStatistics = halfStats
                self.chartData = chartData
                self.isLoadingStats = false
                print("✅ 경기 통계 로드 완료")
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "경기 통계를 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingStats = false
                print("❌ 경기 통계 로드 실패: \(error.localizedDescription)")
            }
        }
    }

    // 차트 데이터 생성
    private func createChartData(from statistics: [TeamStatistics]) -> [FixtureChartData] {
        guard statistics.count >= 2 else { return [] }

        let homeTeam = statistics[0]
        let awayTeam = statistics[1]

        var chartDataArray: [FixtureChartData] = []

        // 통계 타입 매핑
        let statisticTypes: [StatisticType] = [
            .shotsOnGoal,
            .totalShots,
            .blockedShots,
            .shotsInsideBox,
            .shotsOutsideBox,
            .passesAccurate,
            .passesPercentage,
            .totalPasses,
            .cornerKicks,
            .ballPossession,
            .fouls,
            .yellowCards,
            .redCards,
            .offsides,
            .saves
        ]

        // 각 통계 타입에 대해 차트 데이터 생성
        for type in statisticTypes {
            // 차트 데이터 생성
            let chartData = FixtureChartData(type: type, homeStats: homeTeam, awayStats: awayTeam)
            chartDataArray.append(chartData)
        }

        return chartDataArray
    }

    // 통계 값을 숫자로 변환
    private func getNumericValue(from value: StatisticValue) -> Double {
        switch value {
        case .int(let intValue):
            return Double(intValue)
        case .string(let stringValue):
            // 백분율 문자열에서 숫자 추출 (예: "58%" -> 58.0)
            if stringValue.hasSuffix("%") {
                if let percentValue = Double(stringValue.dropLast()) {
                    return percentValue
                }
            }
            return 0.0
        case .null:
            return 0.0
        case .double(let doubleValue):
            return doubleValue
        }
    }

    // 라인업 로드
    public func loadLineups() async {
        isLoadingLineups = true

        do {
            // API에서 라인업 정보 가져오기
            let lineupData = try await service.getFixtureLineups(fixtureId: fixtureId)

            await MainActor.run {
                self.lineups = lineupData
                self.isLoadingLineups = false
                print("✅ 라인업 정보 로드 완료: \(lineupData.count)팀")

                // 탑 플레이어 추출
                self.extractTopPlayers()
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "라인업 정보를 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingLineups = false
                print("❌ 라인업 정보 로드 실패: \(error.localizedDescription)")
            }
        }
    }

    // 탑 플레이어 추출
    private func extractTopPlayers() {
        var topPlayersList: [PlayerProfileData] = []

        // 각 팀의 라인업에서 주요 선수 추출
        for lineup in lineups {
            // 스타팅 멤버에서 주요 선수 추출
            for player in lineup.startXI {
                if isKeyPlayer(player: player, in: lineup.team) {
                    // PlayerProfileData 생성
                    let playerProfile = createPlayerProfile(from: player)

                    topPlayersList.append(playerProfile)

                    // 최대 6명까지만 추출
                    if topPlayersList.count >= 6 {
                        break
                    }
                }
            }
        }

        self.topPlayers = topPlayersList
    }

    // PlayerProfileData 생성
    private func createPlayerProfile(from player: LineupPlayer) -> PlayerProfileData {
        return PlayerProfileData(
            player: PlayerInfo(
                id: player.player.id,
                name: player.player.name,
                firstname: player.player.name.components(separatedBy: " ").first ?? "",
                lastname: player.player.name.components(separatedBy: " ").last ?? "",
                age: 0,
                nationality: "",
                height: nil,
                weight: nil,
                photo: "https://media.api-sports.io/football/players/\(player.player.id).png",
                injured: false,
                birth: nil
            ),
            statistics: []
        )
    }

    // 주요 선수 판별
    private func isKeyPlayer(player: LineupPlayer, in team: Team) -> Bool {
        // 여기서는 간단히 구현 (실제로는 더 복잡한 로직이 필요할 수 있음)
        // 예: 캡틴, 스타 플레이어 등을 판별
        return true
    }

    // 선수 통계 로드
    public func loadMatchPlayerStats() async {
        isLoadingMatchStats = true

        do {
            // API에서 선수 통계 가져오기
            let playerStats = try await service.getFixturePlayersStatistics(fixtureId: fixtureId)

            await MainActor.run {
                self.matchPlayerStats = playerStats
                self.isLoadingMatchStats = false
                print("✅ 선수 통계 로드 완료: \(playerStats.count)팀")

                // 맨 오브 더 매치 선정
                self.selectManOfTheMatch()
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "선수 통계를 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingMatchStats = false
                print("❌ 선수 통계 로드 실패: \(error.localizedDescription)")
            }
        }
    }

    // 맨 오브 더 매치 선정 함수
    private func selectManOfTheMatch() {
        guard !matchPlayerStats.isEmpty else { return }

        // 모든 선수 통계 수집
        var allPlayers: [FixturePlayerStats] = []

        for teamStats in matchPlayerStats {
            // 선수 통계 추가
            allPlayers.append(contentsOf: teamStats.players)
        }

        // 선수가 없으면 종료
        guard !allPlayers.isEmpty else { return }

        // 승리한 팀 ID 찾기
        var winningTeamId: Int? = nil
        if let fixture = currentFixture,
           let homeGoals = fixture.goals?.home,
           let awayGoals = fixture.goals?.away {
            if homeGoals > awayGoals {
                winningTeamId = fixture.teams.home.id
            } else if homeGoals < awayGoals {
                winningTeamId = fixture.teams.away.id
            }
        }

        // 승리한 팀의 선수만 필터링 (승리한 팀이 있는 경우)
        var candidatePlayers = allPlayers
        if let winningTeamId = winningTeamId {
            let winningTeamPlayers = allPlayers.filter { player in
                return player.team?.id == winningTeamId
            }

            // 승리한 팀에 선수가 있으면 해당 선수들만 사용
            if !winningTeamPlayers.isEmpty {
                candidatePlayers = winningTeamPlayers
            }
        }

        // 평점 기준으로 정렬
        let sortedPlayers = candidatePlayers.sorted { player1, player2 in
            // 평점 비교
            let rating1 = Double(player1.statistics.first?.games?.rating ?? "0") ?? 0
            let rating2 = Double(player2.statistics.first?.games?.rating ?? "0") ?? 0

            if rating1 != rating2 {
                return rating1 > rating2
            }

            // 평점이 같으면 득점 비교
            let goals1 = player1.statistics.first?.goals?.total ?? 0
            let goals2 = player2.statistics.first?.goals?.total ?? 0

            if goals1 != goals2 {
                return goals1 > goals2
            }

            // 득점도 같으면 어시스트 비교
            let assists1 = player1.statistics.first?.goals?.assists ?? 0
            let assists2 = player2.statistics.first?.goals?.assists ?? 0

            return assists1 > assists2
        }

        // 가장 높은 평점의 선수를 맨 오브 더 매치로 선정
        if let bestPlayer = sortedPlayers.first {
            self.manOfTheMatch = bestPlayer
            print("✅ 맨 오브 더 매치 선정: \(bestPlayer.player.name ?? "Unknown")")
        } else {
            // 선수가 없는 경우 첫 번째 선수를 선택
            self.manOfTheMatch = allPlayers.first
            print("⚠️ 최적의 선수를 찾을 수 없어 첫 번째 선수를 맨 오브 더 매치로 선정: \(allPlayers.first?.player.name ?? "Unknown")")
        }
    }

    // 상대전적 로드
    public func loadHeadToHead() async {
        isLoadingHeadToHead = true

        guard let fixture = currentFixture else {
            isLoadingHeadToHead = false
            return
        }

        let team1Id = fixture.teams.home.id
        let team2Id = fixture.teams.away.id

        do {
            // API에서 상대전적 가져오기
            let h2hFixtures = try await service.getHeadToHead(team1Id: team1Id, team2Id: team2Id, last: 10)

            // 상대전적 통계 계산
            let team1Stats = HeadToHeadStats(fixtures: h2hFixtures, teamId: team1Id)
            let team2Stats = HeadToHeadStats(fixtures: h2hFixtures, teamId: team2Id)

            await MainActor.run {
                self.headToHeadFixtures = h2hFixtures
                self.team1Stats = team1Stats
                self.team2Stats = team2Stats
                self.isLoadingHeadToHead = false
                print("✅ 상대전적 로드 완료: \(h2hFixtures.count)경기")
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "상대전적을 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingHeadToHead = false
                print("❌ 상대전적 로드 실패: \(error.localizedDescription)")
            }
        }
    }

    // 개별 팀 폼 로드
    private func loadTeamForm(teamId: Int, isHome: Bool) async {
        // 이미 로드 중인지 확인
        if isLoadingTeamForm[teamId] == true {
            return
        }

        // 로드 중 상태로 설정
        isLoadingTeamForm[teamId] = true

        // 로드 시도 횟수 증가
        teamFormLoadAttempts[teamId] = (teamFormLoadAttempts[teamId] ?? 0) + 1

        do {
            // API에서 팀 경기 일정 가져오기 (최근 5경기)
            let fixtures = try await service.getTeamFixtures(teamId: teamId, season: season, last: 5)

            // 팀 폼 생성
            let teamForm = createTeamForm(from: fixtures, teamId: teamId)

            await MainActor.run {
                // 홈/원정 팀에 따라 설정
                if isHome {
                    self.homeTeamForm = teamForm
                } else {
                    self.awayTeamForm = teamForm
                }

                // 로드 완료
                self.isLoadingTeamForm[teamId] = false
                print("✅ 팀 폼 로드 완료: 팀 ID \(teamId)")
            }
        } catch {
            await MainActor.run {
                // 로드 실패
                self.isLoadingTeamForm[teamId] = false
                print("❌ 팀 폼 로드 실패: 팀 ID \(teamId) - \(error.localizedDescription)")

                // 최대 시도 횟수 이내인 경우 재시도
                if let attempts = self.teamFormLoadAttempts[teamId], attempts < self.maxTeamFormLoadAttempts {
                    print("🔄 팀 폼 로드 재시도: 팀 ID \(teamId) - 시도 \(attempts)/\(self.maxTeamFormLoadAttempts)")
                    Task {
                        try? await Task.sleep(nanoseconds: 1_000_000_000) // 1초 대기
                        await self.loadTeamForm(teamId: teamId, isHome: isHome)
                    }
                }
            }
        }
    }

    // 팀 폼 생성
    private func createTeamForm(from fixtures: [Fixture], teamId: Int) -> TeamForm {
        var results: [TeamForm.MatchResult] = []

        // 최근 5경기 결과 추출
        for fixture in fixtures.prefix(5) {
            // 경기가 완료된 경우에만 계산
            guard fixture.fixture.status.short == "FT" ||
                  fixture.fixture.status.short == "AET" ||
                  fixture.fixture.status.short == "PEN" else {
                continue
            }

            // 골 정보가 있는지 확인
            guard let homeGoals = fixture.goals?.home,
                  let awayGoals = fixture.goals?.away else {
                continue
            }

            // 팀 ID에 따라 결과 계산
            var result: TeamForm.MatchResult

            if fixture.teams.home.id == teamId {
                if homeGoals > awayGoals {
                    result = .win
                } else if homeGoals < awayGoals {
                    result = .loss
                } else {
                    result = .draw
                }
            } else {
                if awayGoals > homeGoals {
                    result = .win
                } else if awayGoals < homeGoals {
                    result = .loss
                } else {
                    result = .draw
                }
            }

            // 폼 결과 추가
            results.append(result)
        }

        // 팀 폼 생성
        return TeamForm(
            teamId: teamId,
            results: results
        )
    }

    // 팀 폼 데이터 로드 재시도
    private func retryLoadTeamForms(homeTeamId: Int, awayTeamId: Int) async {
        // 홈팀 폼 로드 재시도
        if homeTeamForm == nil {
            await loadTeamForm(teamId: homeTeamId, isHome: true)
        }

        // 원정팀 폼 로드 재시도
        if awayTeamForm == nil {
            await loadTeamForm(teamId: awayTeamId, isHome: false)
        }
    }
}
