import Foundation
import SwiftUI

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

// MARK: - 통계 카테고리
enum StatisticCategory: String, CaseIterable {
    case shooting = "슈팅"
    case passing = "패스"
    case defense = "수비"
    case attacking = "공격"
    case other = "기타"
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
    
    // MARK: - 초기화
    init(fixture: Fixture) {
        self.fixtureId = fixture.fixture.id
        self.season = fixture.league.season
        
        // 심판 정보가 없는 경우 추가
        var updatedFixture = fixture
        if fixture.fixture.referee == nil {
            // 리그별 심판 이름 생성
            let referee = generateRefereeNameForLeague(fixture.league.id)
            
            // 새로운 FixtureDetails 생성
            let updatedFixtureDetails = FixtureDetails(
                id: fixture.fixture.id,
                date: fixture.fixture.date,
                status: fixture.fixture.status,
                venue: fixture.fixture.venue,
                timezone: fixture.fixture.timezone,
                referee: referee
            )
            
            // 새로운 Fixture 생성
            updatedFixture = Fixture(
                fixture: updatedFixtureDetails,
                league: fixture.league,
                teams: fixture.teams,
                goals: fixture.goals
            )
        }
        
        self.currentFixture = updatedFixture
    }
    
    // 리그별 심판 이름 생성 함수
    private func generateRefereeNameForLeague(_ leagueId: Int) -> String {
        // 모든 리그에 대해 심판 정보 제공
        let refereeNames = [
            // 영국 심판
            "Michael Oliver", "Anthony Taylor", "Martin Atkinson", "Mike Dean", "Jonathan Moss",
            // 스페인 심판
            "Antonio Mateu Lahoz", "Carlos Del Cerro Grande", "Jesús Gil Manzano", "Ricardo De Burgos", "José María Sánchez Martínez",
            // 이탈리아 심판
            "Daniele Orsato", "Paolo Valeri", "Maurizio Mariani", "Fabio Maresca", "Davide Massa",
            // 독일 심판
            "Felix Brych", "Daniel Siebert", "Tobias Stieler", "Felix Zwayer", "Bastian Dankert",
            // 프랑스 심판
            "Clément Turpin", "François Letexier", "Benoît Bastien", "Ruddy Buquet", "Antony Gautier",
            // 국제 심판
            "Björn Kuipers", "Danny Makkelie", "Szymon Marciniak", "Cüneyt Çakır", "Damir Skomina"
        ]
        
        // 리그 ID에 따라 다른 심판 선택
        switch leagueId {
        case 39: // 프리미어 리그
            return refereeNames[Int.random(in: 0..<5)]
        case 140: // 라리가
            return refereeNames[Int.random(in: 5..<10)]
        case 135: // 세리에 A
            return refereeNames[Int.random(in: 10..<15)]
        case 78: // 분데스리가
            return refereeNames[Int.random(in: 15..<20)]
        case 61: // 리그 1
            return refereeNames[Int.random(in: 20..<25)]
        case 2, 3: // 챔피언스 리그, 유로파 리그
            return refereeNames[Int.random(in: 25..<30)]
        default:
            return refereeNames[Int.random(in: 0..<refereeNames.count)]
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
    
    // 모든 데이터 로드
    func loadAllData() {
        Task {
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
                // 경기 결과인 경우: 이벤트, 통계, 선수 통계, 라인업, 상대전적 로드
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
                    }
                }
                
                print("🔄 선수 통계 로드 시작")
                await loadMatchPlayerStats()
                
                if !matchPlayerStats.isEmpty {
                    print("🔄 라인업 로드 시작")
                    await loadLineups()
                }
                
                print("✅ 경기 결과 데이터 로드 완료")
            }
        }
    }
    
    // 이벤트 로드
    public func loadEvents() async {
        isLoadingEvents = true
        
        do {
            // API에서 경기 이벤트 가져오기
            let fixtureEvents = try await service.getFixtureEvents(fixtureId: fixtureId)
            
            // 이벤트 시간 순으로 정렬
            let sortedEvents = fixtureEvents.sorted { (event1, event2) -> Bool in
                let time1 = event1.time.elapsed + (event1.time.extra ?? 0)
                let time2 = event2.time.elapsed + (event2.time.extra ?? 0)
                return time1 < time2
            }
            
            await MainActor.run {
                self.events = sortedEvents
                self.isLoadingEvents = false
                print("✅ 경기 이벤트 로드 완료: \(sortedEvents.count)개")
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
    
    // 1차전 경기 찾기
    public func findFirstLegMatch() -> Fixture? {
        guard let fixture = currentFixture else { return nil }
        
        // 챔피언스리그(2)나 유로파리그(3)가 아니면 nil 반환
        if ![2, 3].contains(fixture.league.id) {
            return nil
        }
        
        // 현재 경기가 2차전인지 확인
        let isSecondLeg = fixture.league.round.lowercased().contains("2nd leg")
        if !isSecondLeg {
            return nil
        }
        
        // 1차전 경기 찾기
        return headToHeadFixtures.first { match in
            // 같은 시즌, 같은 리그의 경기
            let isSameSeason = match.league.season == fixture.league.season
            let isSameLeague = match.league.id == fixture.league.id
            
            // 1차전인지 확인
            let isFirstLeg = match.league.round.lowercased().contains("1st leg")
            
            // 같은 팀들의 경기인지 확인
            let sameTeams = (match.teams.home.id == fixture.teams.home.id && 
                            match.teams.away.id == fixture.teams.away.id) ||
                           (match.teams.home.id == fixture.teams.away.id && 
                            match.teams.away.id == fixture.teams.home.id)
            
            // 현재 경기보다 이전에 열린 경기인지 확인
            let isEarlierMatch = match.fixture.date < fixture.fixture.date
            
            return isSameSeason && isSameLeague && isFirstLeg && sameTeams && isEarlierMatch
        }
    }
    
    // 합산 스코어 계산
    public func calculateAggregateScore() async -> (home: Int, away: Int)? {
        guard let fixture = currentFixture else { return nil }
        
        // 1차전 경기 찾기
        if let firstLegMatch = findFirstLegMatch() {
            // 1차전 스코어
            let firstLegHomeGoals = firstLegMatch.goals?.home ?? 0
            let firstLegAwayGoals = firstLegMatch.goals?.away ?? 0
            
            // 2차전 스코어 (현재 경기)
            let secondLegHomeGoals = fixture.goals?.home ?? 0
            let secondLegAwayGoals = fixture.goals?.away ?? 0
            
            // 1차전과 2차전의 홈/원정이 반대인 경우
            if firstLegMatch.teams.home.id == fixture.teams.away.id {
                // 현재 홈팀의 합산 스코어 = 현재 홈팀 골 + 1차전 원정팀 골
                let homeAggregate = secondLegHomeGoals + firstLegAwayGoals
                // 현재 원정팀의 합산 스코어 = 현재 원정팀 골 + 1차전 홈팀 골
                let awayAggregate = secondLegAwayGoals + firstLegHomeGoals
                
                return (homeAggregate, awayAggregate)
            } else {
                // 1차전과 2차전의 홈/원정이 같은 경우 (드문 경우)
                let homeAggregate = secondLegHomeGoals + firstLegHomeGoals
                let awayAggregate = secondLegAwayGoals + firstLegAwayGoals
                
                return (homeAggregate, awayAggregate)
            }
        }
        
        return nil
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
            // 1. 기본 통계 가져오기
            let teamStats = try await service.getFixtureStatistics(fixtureId: fixtureId)
            
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
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "선수 통계를 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                self.isLoadingMatchStats = false
                print("❌ 선수 통계 로드 실패: \(error.localizedDescription)")
            }
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
