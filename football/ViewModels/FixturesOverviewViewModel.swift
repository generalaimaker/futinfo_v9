import Foundation
import Combine
import SwiftUI
import CoreData

// 같은 모듈 내의 파일들은 별도의 import 없이 사용 가능합니다.
// 필요한 경우 특정 파일을 import할 수 있습니다.

@MainActor
class FixturesOverviewViewModel: ObservableObject {
    // 날짜별 경기 일정
    @Published var fixtures: [Date: [Fixture]] = [:]
    @Published var selectedDate: Date = Date()
    @Published var isLoading: Bool = false
    @Published var loadingDates: Set<Date> = []
    @Published var errorMessage: String?
    
    // 빈 응답 처리를 위한 상태 변수
    @Published var emptyDates: [Date: String] = [:] // 날짜별 빈 응답 메시지
    
    // 라이브 경기 관련 변수
    @Published var liveMatches: [Fixture] = []
    @Published var lastLiveUpdateTime: String = "업데이트 정보 없음"
    
    // 날짜 탭 관련 변수
    @Published public var visibleDateRange: [Date] = []
    @Published public var allDateRange: [Date] = []
    private let initialVisibleCount = 10 // 초기에 표시할 날짜 수 (오늘 기준 좌우 5일씩)
    private let additionalLoadCount = 10 // 추가로 로드할 날짜 수 (5에서 10으로 증가)
    private let calendar = Calendar.current
    
    // API 요청 제한 관련 변수
    private var isRateLimited: Bool = false
    private var rateLimitTimer: Timer?
    
    // 캐싱 관련 변수
    internal var cachedFixtures: [String: [Fixture]] = [:] // 날짜 문자열을 키로 사용
    internal var cacheDates: [String: Date] = [:] // 캐시 저장 시간 기록
    private let cacheExpirationMinutes: Double = 15 // 기본 캐시 만료 시간 (5분에서 15분으로 증가)
    
    // 빈 응답 캐싱을 위한 변수
    private var emptyResponseCache: [String: Date] = [:] // 빈 응답을 받은 날짜+리그 조합과 시간
    private let emptyResponseCacheHours: Double = 0.25 // 빈 응답 캐시 만료 시간 (15분으로 단축)
    
    // 프리페칭을 위한 변수
    private var prefetchingDates: Set<Date> = []
    private var prefetchTask: Task<Void, Never>?
    private var dateSelectionTask: Task<Void, Never>?
    private var activeTasks: [String: Task<Void, Never>] = [:] // 활성 작업 추적
    
    // 경기 상태별 캐시 만료 시간 (분 단위)
    private let liveMatchCacheMinutes: Double = 1 // 진행 중인 경기는 1분 유지
    private let upcomingMatchCacheMinutes: Double = 15 // 예정된 경기는 15분으로 증가
    private let finishedMatchCacheMinutes: Double = 120 // 종료된 경기는 2시간으로 증가
    private let pastDayCacheMinutes: Double = 360 // 과거 날짜는 6시간으로 설정 (새로 추가)
    
    // 자동 새로고침 타이머
    private var refreshTimer: Timer?
    private let autoRefreshInterval: TimeInterval = 60 // 60초마다 자동 새로고침 (30초에서 60초로 변경)
    
    // 배치 요청을 위한 로딩 작업 추적
    internal var loadingTasks: [String: Task<Void, Never>] = [:]
    
    // 로딩 스켈레톤을 위한 변수
    @Published var isShowingSkeleton: Bool = false
    
    // 개발 모드에서 백그라운드 로드 활성화 여부
    #if DEBUG
    private let enableBackgroundLoad = false // 개발 중에는 백그라운드 로드 비활성화
    #else
    private let enableBackgroundLoad = true // 배포 버전에서는 활성화
    #endif
    
    // 즐겨찾기 서비스
    private let favoriteService = FavoriteService.shared
    
    // 리그 팔로우 서비스
    internal let leagueFollowService = LeagueFollowService.shared
    
    internal let service = SupabaseFootballAPIService.shared
    private let requestManager = APIRequestManager.shared
    private let liveMatchService = LiveMatchService.shared
    internal let coreDataManager = CoreDataManager.shared
    private let dateFormatter = DateFormatter()
    
    // 라이브 경기 상태 목록
    private let liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"]
    
    // 날짜 탭 데이터 - 동적으로 생성
    var dateTabs: [(date: Date, label: String)] {
        return visibleDateRange.map { date in
            (date: date, label: getLabelForDate(date))
        }
    }
    
    // API 요청을 위한 날짜 포맷 (yyyy-MM-dd)
    public func formatDateForAPI(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current // 사용자의 현재 시간대 사용
        return formatter.string(from: date)
    }
    
    // 날짜 선택 최적화 메서드
    @MainActor
    public func selectDate(_ date: Date) async {
        // 이전 작업 취소
        dateSelectionTask?.cancel()
        
        // 선택된 날짜 설정
        selectedDate = date
        
        // 날짜 범위 확인 및 자동 확장
        let needsExtension = !allDateRange.contains(where: { calendar.isDate($0, inSameDayAs: date) })
        if needsExtension {
            await expandDateRangeToInclude(date)
        }
        
        dateSelectionTask = Task {
            // 1. 메모리 캐시 확인
            let dateString = formatDateForAPI(date)
            
            // 메모리 캐시가 있고 유효하면 즉시 표시
            if let cached = cachedFixtures[dateString], !cached.isEmpty, !isCacheExpired(for: dateString) {
                fixtures[date] = cached
                print("✅ 메모리 캐시에서 즉시 로드: \(dateString) (\(cached.count)개)")
                
                // 캐시가 유효해도 오늘 날짜나 라이브 경기가 있으면 백그라운드에서 업데이트
                let isToday = calendar.isDate(date, inSameDayAs: calendar.startOfDay(for: Date()))
                let hasLiveMatches = cached.contains { liveStatuses.contains($0.fixture.status.short) }
                
                if isToday || hasLiveMatches {
                    Task {
                        await loadFixturesOptimized(for: date, forceRefresh: true)
                    }
                }
                return
            }
            
            // 스켈레톤 표시 (캐시가 없는 경우만)
            if fixtures[date]?.isEmpty != false {
                isShowingSkeleton = true
                fixtures[date] = []
            }
            
            // 2. 데이터 로드 (중복 제거와 배치 요청 사용)
            await withTaskCancellationHandler {
                await deduplicatedLoad(for: date)
                isShowingSkeleton = false
            } onCancel: {
                print("⚠️ 날짜 선택 작업 취소: \(dateString)")
                Task { @MainActor in
                    isShowingSkeleton = false
                }
            }
            
            // 3. 스마트 프리페칭 (±2일만)
            if !Task.isCancelled {
                await smartPrefetch(around: date)
            }
        }
    }
    
    // 날짜 범위를 확장하여 특정 날짜 포함
    @MainActor
    private func expandDateRangeToInclude(_ targetDate: Date) async {
        let today = calendar.startOfDay(for: Date())
        
        // 최대 날짜 범위 제한 확인
        let maxDaysFromToday = 365
        let daysFromToday = abs(calendar.dateComponents([.day], from: today, to: targetDate).day ?? 0)
        
        if daysFromToday > maxDaysFromToday {
            print("⚠️ 요청한 날짜가 최대 범위를 초과: \(formatDateForAPI(targetDate))")
            return
        }
        
        // 현재 범위와 목표 날짜를 포함하는 새로운 범위 계산
        let currentStart = allDateRange.first ?? today
        let currentEnd = allDateRange.last ?? today
        let newStart = min(targetDate, currentStart)
        let newEnd = max(targetDate, currentEnd)
        
        var newDates: [Date] = []
        var currentDate = newStart
        
        while currentDate <= newEnd {
            newDates.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        // 날짜 범위 업데이트
        allDateRange = newDates
        visibleDateRange = newDates
        
        print("📅 날짜 범위 확장 완료: \(formatDateForAPI(newStart)) ~ \(formatDateForAPI(newEnd))")
    }
    
    // 인접 날짜 프리페칭
    @MainActor
    private func prefetchNearbyDates(for date: Date) async {
        // 이전 프리페칭 작업 취소
        prefetchTask?.cancel()
        
        prefetchTask = Task {
            // ±7일 범위 프리페칭 (가까운 날짜부터 우선순위)
            let daysToFetch = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7]
            
            var fetchedCount = 0
            let maxFetchPerBatch = 6 // 한 번에 최대 6개까지만 (API 제한 고려)
            
            for dayOffset in daysToFetch {
                guard !Task.isCancelled else { break }
                
                if let targetDate = calendar.date(byAdding: .day, value: dayOffset, to: date) {
                    let dateString = formatDateForAPI(targetDate)
                    
                    // 이미 활성 작업이 있거나 프리페칭 중이면 건너뛰기
                    if activeTasks[dateString] != nil || prefetchingDates.contains(targetDate) {
                        continue
                    }
                    
                    // 이미 캐시되어 있고 유효하면 건너뛰기
                    if let cached = cachedFixtures[dateString], !cached.isEmpty && !isCacheExpired(for: dateString) {
                        print("🔍 프리페칭 스킵 (캐시 유효): \(dateString)")
                        continue
                    }
                    
                    // 모든 팔로우한 리그에 대해 빈 응답 캐시가 있는지 확인
                    let followedLeagues = leagueFollowService.getActiveLeagueIds(for: targetDate)
                    let allHaveEmptyCache = !followedLeagues.isEmpty && followedLeagues.allSatisfy { leagueId in
                        !isEmptyResponseCacheExpired(for: dateString, leagueId: leagueId)
                    }
                    
                    if allHaveEmptyCache {
                        print("🔍 프리페칭 스킵 (모든 리그 빈 응답 캐시): \(dateString)")
                        continue
                    }
                    
                    // 프리페칭 시작
                    prefetchingDates.insert(targetDate)
                    fetchedCount += 1
                    
                    print("🔄 프리페칭 시작: \(dateString) (offset: \(dayOffset))")
                    
                    let task = Task {
                        await loadFixturesForDate(targetDate, forceRefresh: false)
                        prefetchingDates.remove(targetDate)
                        activeTasks.removeValue(forKey: dateString)
                        print("✅ 프리페칭 완료: \(dateString)")
                    }
                    
                    activeTasks[dateString] = task
                    
                    // API 요청 제한 방지 (점진적으로 증가, 429 에러 방지를 위해 기본 지연 시간 증가)
                    let delay = UInt64(500_000_000 * (fetchedCount / 3 + 1)) // 0.5초, 1초, 1.5초...
                    try? await Task.sleep(nanoseconds: delay)
                    
                    // 배치 제한에 도달하면 잠시 대기
                    if fetchedCount >= maxFetchPerBatch {
                        print("⏸️ 프리페칭 일시 중지: \(fetchedCount)개 완료")
                        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2초 대기
                        fetchedCount = 0
                    }
                }
            }
            
            print("📱 프리페칭 작업 완료: ±7일 범위")
            
            // 메모리 관리: 14일 범위를 벗어난 오래된 캐시 정리
            await cleanupOldCache(centerDate: date)
        }
    }
    
    // 오래된 캐시 정리
    @MainActor
    private func cleanupOldCache(centerDate: Date) async {
        let maxDaysToKeep = 10 // ±10일 범위만 유지 (여유분 포함)
        
        for (dateString, _) in cachedFixtures {
            // 날짜 문자열을 Date로 변환
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            
            if let cachedDate = formatter.date(from: dateString) {
                let daysDifference = abs(calendar.dateComponents([.day], from: centerDate, to: cachedDate).day ?? 0)
                
                if daysDifference > maxDaysToKeep {
                    cachedFixtures.removeValue(forKey: dateString)
                    cacheDates.removeValue(forKey: dateString)
                    print("🗑️ 오래된 캐시 제거: \(dateString) (현재 날짜로부터 \(daysDifference)일)")
                }
            }
        }
    }
    
    // 특정 날짜의 캐시 초기화
    public func clearCacheForDate(_ date: Date) {
        let dateString = formatDateForAPI(date)
        
        // 메모리 캐시 제거
        fixtures[date] = nil
        cachedFixtures[dateString] = nil
        
        // API 캐시 제거
        for leagueId in leagueFollowService.getActiveLeagueIds(for: date) {
            let parameters: [String: String] = [
                "from": dateString,
                "to": dateString,
                "league": String(leagueId),
                "season": String(getCurrentSeason())
            ]
            APICacheManager.shared.removeCache(for: "/fixtures", parameters: parameters)
        }
        
        // CoreData 캐시 제거
        CoreDataManager.shared.deleteFixtures(for: dateString)
        
        print("🗜️ 날짜 \(dateString)의 모든 캐시 제거")
    }
    
    // 모든 캐시 초기화 (더미 데이터 제거용)
    public func clearAllCaches() {
        print("🗑️ 모든 캐시 초기화 시작...")
        
        // 메모리 캐시 초기화
        fixtures.removeAll()
        cachedFixtures.removeAll()
        emptyDates.removeAll()
        loadingDates.removeAll()
        emptyResponseCache.removeAll()
        cacheDates.removeAll()
        
        // UserDefaults 모든 키 삭제
        let userDefaults = UserDefaults.standard
        userDefaults.removeObject(forKey: "cachedFixtures")
        userDefaults.removeObject(forKey: "cacheDates")
        userDefaults.removeObject(forKey: "emptyResponseCache")
        
        // UserDefaults에서 fixtures 관련 모든 키 삭제
        let keys = userDefaults.dictionaryRepresentation().keys
        for key in keys {
            if key.contains("fixtures") || key.contains("cache") || key.contains("empty") || key.contains("Fixture") {
                userDefaults.removeObject(forKey: key)
                print("🗑️ UserDefaults 키 삭제: \(key)")
            }
        }
        userDefaults.synchronize()
        
        // API 캐시 전체 삭제
        APICacheManager.shared.clearAllCache()
        
        // CoreData 캐시 전체 삭제
        CoreDataManager.shared.deleteAllFixtures()
        CoreDataManager.shared.clearAllData()
        
        // 요청 취소
        requestManager.cancelAllRequests()
        
        // init에서 로드되는 캐시 방지를 위한 플래그
        print("✅ 모든 캐시가 완전히 제거되었습니다.")
        print("🔄 이제 실제 API 데이터만 사용합니다.")
        print("⚠️ 앱을 재시작하거나 화면을 새로고침하세요.")
    }
    
    // 디버그: 현재 로드된 경기 데이터 확인
    public func debugPrintLoadedFixtures() {
        print("\n🔍 현재 로드된 경기 데이터:")
        
        for (date, fixtureList) in fixtures.sorted(by: { $0.key < $1.key }) {
            let dateString = formatDateForAPI(date)
            print("\n📅 날짜: \(dateString) - 총 \(fixtureList.count)개 경기")
            
            // 각 날짜별 처음 3개 경기만 출력
            for (index, fixture) in fixtureList.prefix(3).enumerated() {
                print("  \(index + 1). \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                print("     - 실제 경기 날짜: \(fixture.fixture.date)")
                print("     - 경기 ID: \(fixture.fixture.id)")
            }
            
            if fixtureList.count > 3 {
                print("  ... 그 외 \(fixtureList.count - 3)개 경기")
            }
        }
        
        print("\n📊 캐시 상태:")
        print("  - 메모리 캐시: \(cachedFixtures.count)개 날짜")
        print("  - 빈 날짜: \(emptyDates.count)개")
        print("  - 로딩 중: \(loadingDates.count)개")
        print("\n")
    }
    
    // 클럽 월드컵 디버그 테스트
    private func testClubWorldCup() async {
        print("\n🏆 ===== 클럽 월드컵 및 기타 리그 테스트 시작 =====")
        
        // API 키 검증 테스트
        print("\n🔐 API 키 검증 테스트:")
        do {
            let statusParams = ["league": "39", "season": "2024"]
            let statusResponse: LeaguesResponse = try await service.performRequest(
                endpoint: "/leagues",
                parameters: statusParams,
                cachePolicy: .never,
                forceRefresh: true
            )
            
            if let league = statusResponse.response.first {
                print("✅ API 키 유효: \(league.league.name)")
                print("  - 국가: \(league.country?.name ?? "N/A")")
                print("  - 시즌 수: \(league.seasons?.count ?? 0)")
            } else {
                print("❌ API 키 문제: 응답 없음")
            }
        } catch {
            print("❌ API 키 검증 실패: \(error)")
            if let apiError = error as? FootballAPIError {
                switch apiError {
                case .invalidAPIKey:
                    print("  ⚠️ 잘못된 API 키입니다")
                case .rateLimitExceeded:
                    print("  ⚠️ API 요청 한도 초과")
                case .serverError(let code):
                    print("  ⚠️ 서버 오류: \(code)")
                default:
                    print("  ⚠️ 기타 오류: \(apiError)")
                }
            }
            return // API 키 문제가 있으면 나머지 테스트 중단
        }
        
        // 여러 날짜와 시즌 조합 테스트
        let testCases = [
            ("2024-12-11", 2024),  // 기존 포맷
            ("2025-01-05", 2024),  // 기존 포맷
            ("2025-06-15", 2024),  // 새로운 포맷
            ("2025-06-15", 2025),  // 다른 시즌도 테스트
            ("2025-07-01", 2024),  // 새로운 포맷
            ("2025-07-01", 2025)   // 다른 시즌도 테스트
        ]
        
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "UTC")
        
        for (index, (dateStr, season)) in testCases.enumerated() {
            // 첫 번째 테스트가 아니면 지연 추가
            if index > 0 {
                try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
            }
            
            if df.date(from: dateStr) != nil {
                print("\n📅 테스트: 날짜=\(dateStr), 시즌=\(season)")
                
                do {
                    // 직접 API 호출 (강제 새로고침으로 캐시 우회)
                    let parameters = [
                        "league": "15",
                        "season": String(season),
                        "from": dateStr,
                        "to": dateStr
                    ]
                    
                    let response: FixturesResponse = try await service.performRequest(
                        endpoint: "/fixtures",
                        parameters: parameters,
                        cachePolicy: .never,
                        forceRefresh: true
                    )
                    
                    let fixtures = response.response
                    
                    if fixtures.isEmpty {
                        print("  ⚠️ 빈 응답 (경기 없음)")
                    } else {
                        print("  ✅ \(fixtures.count)개 경기 발견:")
                        for fixture in fixtures.prefix(3) {
                            print("    - \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                        }
                    }
                } catch {
                    print("  ❌ API 오류: \(error)")
                }
            }
        }
        
        print("\n🏆 ===== 클럽 월드컵 테스트 종료 =====\n")
        
        // 전체 시즌 조회도 테스트
        print("\n📊 전체 시즌 조회 테스트:")
        
        // 다른 시즌들도 테스트
        let seasons = [2024, 2023, 2022, 2021]
        for testSeason in seasons {
            print("\n🗓️ \(testSeason) 시즌 테스트:")
            do {
                let allParameters = [
                    "league": "15",
                    "season": String(testSeason)
                ]
                
                let allResponse: FixturesResponse = try await service.performRequest(
                    endpoint: "/fixtures",
                    parameters: allParameters,
                    cachePolicy: .never,
                    forceRefresh: true
                )
                
                if allResponse.response.isEmpty {
                    print("  ⚠️ \(testSeason) 시즌: 데이터 없음")
                } else {
                    print("  ✅ \(testSeason) 시즌: \(allResponse.response.count)개 경기")
                    if let first = allResponse.response.first {
                        print("    첫 경기: \(first.fixture.date)")
                    }
                    if let last = allResponse.response.last {
                        print("    마지막 경기: \(last.fixture.date)")
                    }
                }
                
                // API 제한 방지를 위한 지연
                try? await Task.sleep(nanoseconds: 300_000_000) // 0.3초
            } catch {
                print("  ❌ \(testSeason) 시즌 오류: \(error)")
            }
        }
        
        // API 직접 테스트
        print("\n🔑 API 직접 테스트:")
        print("- Supabase Edge Functions 사용 여부: \(AppConfiguration.shared.useSupabaseEdgeFunctions)")
        print("- Service: SupabaseFootballAPIService")
        
        // 간단한 리그 정보 조회로 API 연결 테스트
        do {
            let endpoint = "/leagues"
            let parameters = ["id": "15"]
            let response: LeaguesResponse = try await service.performRequest(
                endpoint: endpoint,
                parameters: parameters,
                cachePolicy: .never,
                forceRefresh: true
            )
            
            if let league = response.response.first {
                print("✅ API 연결 성공: \(league.league.name)")
                print("  - 타입: \(league.league.type)")
                print("  - 시즌 수: \(league.seasons?.count ?? 0)")
                if let seasons = league.seasons {
                    print("  - 사용 가능한 시즌: \(seasons.map { $0.year }.sorted())")
                }
            }
        } catch {
            print("❌ API 직접 테스트 실패: \(error)")
        }
        
        // 프리미어리그 테스트 (비교용)
        print("\n⚽ 프리미어리그 테스트:")
        do {
            let plParameters = [
                "league": "39",
                "season": "2024",
                "from": "2025-01-06",
                "to": "2025-01-06"
            ]
            
            let plResponse: FixturesResponse = try await service.performRequest(
                endpoint: "/fixtures",
                parameters: plParameters,
                cachePolicy: .never,
                forceRefresh: true
            )
            
            if plResponse.response.isEmpty {
                print("  ⚠️ 프리미어리그도 빈 응답")
            } else {
                print("  ✅ 프리미어리그: \(plResponse.response.count)개 경기")
                for fixture in plResponse.response.prefix(2) {
                    print("    - \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                }
            }
        } catch {
            print("  ❌ 프리미어리그 API 오류: \(error)")
        }
    }
    
    // 날짜에 따른 레이블 생성
    public func getLabelForDate(_ date: Date) -> String {
        let today = calendar.startOfDay(for: Date())
        
        if calendar.isDate(date,inSameDayAs: today) {
            return "오늘"
        }
        
        if calendar.isDate(date, inSameDayAs: calendar.date(byAdding: .day, value: -1, to: today)!) {
            return "어제"
        }
        
        if calendar.isDate(date, inSameDayAs: calendar.date(byAdding: .day, value: 1, to: today)!) {
            return "내일"
        }
        
        return formatDateForTab(date)
    }
    
    // 탭에 표시할 날짜 포맷 (예: "3.06(목)")
    private func formatDateForTab(_ date: Date) -> String {
        let calendar = Calendar.current
        let day = calendar.component(.day, from: date)
        let month = calendar.component(.month, from: date)
        
        // 일자가 10보다 작으면 앞에 0 추가 (예: 3.06)
        let dayString = day < 10 ? "0\(day)" : "\(day)"
        
        dateFormatter.dateFormat = "E"
        let weekday = dateFormatter.string(from: date)
        
        // 사용자 요구사항에 따라 "3.06(목)" 형식으로 변경
        return "\(month).\(dayString)(\(weekday))"
    }
    
    init() {
        dateFormatter.locale = Locale(identifier: "ko_KR")
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        
        // 날짜 범위 초기화
        initializeDateRanges()
        
        // 클럽 월드컵 테스트 - 비활성화 (필요시에만 활성화)
        // Task {
        //     try? await Task.sleep(nanoseconds: 2_000_000_000) // 2초 대기
        //     await testClubWorldCup()
        // }
        
        // 캐시된 데이터 로드 (가장 먼저 실행)
        loadCachedFixtures()
        
        // 빈 응답 캐시 로드
        loadEmptyResponseCache()
        
        // 라이브 경기 업데이트 구독
        setupLiveMatchesSubscription()
        
        // 캐시 초기화 알림 구독
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("ClearFixturesCache"),
            object: nil,
            queue: .main
        ) { _ in
            Task { @MainActor in
                self.clearAllCaches()
            }
        }
        
        // 리그 팔로우 업데이트 알림 구독
        setupLeagueFollowObserver()
        
        // 오늘 날짜 확인 (시간대 고려)
        let now = Date()
        let today = calendar.startOfDay(for: now)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        
        print("📱 앱 시작 시 현재 시간: \(now)")
        print("📱 앱 시작 시 오늘 날짜: \(dateFormatter.string(from: today))")
        
        // 캐시된 데이터가 있으면 즉시 UI에 표시
        let todayString = formatDateForAPI(today)
        if let cachedTodayData = cachedFixtures[todayString], !cachedTodayData.isEmpty {
            fixtures[today] = cachedTodayData
            print("✅ 앱 시작 시 캐시된 오늘 데이터 즉시 표시: \(cachedTodayData.count)개")
        } else {
            // 캐시가 없는 경우 CoreData에서 확인
            if let coreDataFixtures = CoreDataManager.shared.loadFixtures(for: todayString), !coreDataFixtures.isEmpty {
                fixtures[today] = coreDataFixtures
                cachedFixtures[todayString] = coreDataFixtures
                print("✅ 앱 시작 시 CoreData에서 데이터 로드: \(coreDataFixtures.count)개")
            } else {
                // 데이터가 없는 경우 빈 배열 설정
                fixtures[today] = []
                print("📱 앱 시작 시 데이터 없음")
            }
        }
        
        // 앱 시작 시 경기 일정 미리 로드 (프리로딩)
        Task {
            // 로딩 상태 설정
            isLoading = true
            
            // 오늘 날짜에 대한 경기 일정 로드 (강제 새로고침 적용)
            print("📱 앱 시작 시 오늘 날짜 데이터 프리로딩 시작 (강제 새로고침)")
            print("🔍 디버그: 오늘 날짜 = \(formatDateForAPI(today)), 현재 시간 = \(Date())")
            
            // 오늘 날짜 데이터 로드 (우선순위 높음)
            do {
                print("🚀 오늘 날짜 데이터 직접 로드 시작 (높은 우선순위)")
                let todayFixtures = try await fetchFixturesForDate(today, forceRefresh: true)
                
                // UI 즉시 업데이트
                fixtures[today] = todayFixtures
                
                // 캐시 업데이트
                let todayString = formatDateForAPI(today)
                cachedFixtures[todayString] = todayFixtures
                saveCachedFixtures(for: todayString)
                
                print("✅ 오늘 날짜 데이터 로드 완료: \(todayFixtures.count)개 경기")
                
                // 알림 발송 (UI 업데이트를 위해)
                NotificationCenter.default.post(
                    name: NSNotification.Name("FixturesLoadingCompleted"),
                    object: nil,
                    userInfo: ["date": today, "forceUpdate": true]
                )
            } catch {
                print("❌ 오늘 날짜 데이터 로드 실패: \(error.localizedDescription)")
                
                // 캐시된 데이터가 있으면 사용
                let todayString = formatDateForAPI(today)
                if let cachedData = cachedFixtures[todayString], !cachedData.isEmpty {
                    fixtures[today] = cachedData
                    print("⚠️ 오늘 날짜 데이터 로드 실패, 캐시 사용: \(cachedData.count)개 경기")
                }
            }
            
            // 팔로우한 리그 데이터 미리 로드 (점진적 로딩)
            await preloadFollowedLeaguesData(for: today)
            
            // 확장된 날짜 범위 프리로딩 (±2일로 축소)
            print("📱 확장된 날짜 범위 프리로딩 시작 (±2일)")
            
            // 미래 날짜 프리로딩 (1~2일만)
            for i in 1...2 {
                let futureDate = calendar.date(byAdding: .day, value: i, to: today)!
                print("🔍 디버그: 미래 날짜 \(i)일 후 = \(formatDateForAPI(futureDate))")
                await preloadFixturesWithFallback(for: futureDate, forceRefresh: false)
                
                // API 요청 제한 방지를 위한 지연 (429 에러 방지를 위해 증가)
                try? await Task.sleep(nanoseconds: 300_000_000) // 0.3초 지연
            }
            
            // 과거 날짜 프리로딩 (1~2일만)
            for i in 1...2 {
                let pastDate = calendar.date(byAdding: .day, value: -i, to: today)!
                print("🔍 디버그: 과거 날짜 \(i)일 전 = \(formatDateForAPI(pastDate))")
                await preloadFixturesWithFallback(for: pastDate, forceRefresh: false)
                
                // API 요청 제한 방지를 위한 지연 (429 에러 방지를 위해 증가)
                try? await Task.sleep(nanoseconds: 300_000_000) // 0.3초 지연
            }
            
            isLoading = false
            
            // 자동 새로고침 시작
            startAutoRefresh()
            
            // 백그라운드 로딩은 사용자 요청 시에만 수행하도록 제거
            // 필요한 날짜는 사용자가 스크롤할 때 로드되도록 함
        }
        
        // 앱 생명주기 이벤트 관찰 설정
        setupAppLifecycleObservers()
    }
    
    // 최근 본 리그 저장 함수
    public func saveViewedLeague(_ leagueId: Int) {
        var recent = UserDefaults.standard.array(forKey: "recentLeagues") as? [Int] ?? []
        recent.removeAll { $0 == leagueId }
        recent.insert(leagueId, at: 0)
        UserDefaults.standard.set(Array(recent.prefix(10)), forKey: "recentLeagues")
        print("📝 최근 본 리그 저장: \(leagueId)")
    }
    
    // 사용자 선호 리그 가져오기
    private func getUserPreferredLeagues() -> [Int] {
        // 최근 본 리그
        let recentLeagues = UserDefaults.standard.array(forKey: "recentLeagues") as? [Int] ?? []
        
        // 즐겨찾기한 팀의 리그
        let favoriteTeams = FavoriteService.shared.getFavorites(type: .team)
        
        // 팀 ID로 리그 ID를 조회하는 로직 (간단한 구현)
        // 실제로는 팀 정보를 기반으로 리그 ID를 조회해야 함
        var favoriteTeamLeagues: [Int] = []
        for favorite in favoriteTeams {
            // 주요 리그 ID 중 하나를 임의로 할당 (실제로는 팀-리그 매핑 필요)
            let teamId = favorite.entityId
            let leagueId = teamIdToLeagueId(teamId)
            if leagueId > 0 {
                favoriteTeamLeagues.append(leagueId)
            }
        }
        
        return Array(Set(recentLeagues + favoriteTeamLeagues)) // 중복 제거
    }
    
    // 팀 ID를 리그 ID로 변환하는 간단한 함수 (실제로는 더 정확한 매핑 필요)
    private func teamIdToLeagueId(_ teamId: Int) -> Int {
        // 주요 팀들의 리그 ID 매핑 (간단한 예시)
        switch teamId {
        case 33, 40, 42, 47, 49, 50: // 맨유, 리버풀, 아스날, 토트넘, 첼시, 맨시티
            return 39 // 프리미어 리그
        case 529, 530, 541, 532, 536, 543: // 바르셀로나, 아틀레티코, 레알 마드리드, 발렌시아, 세비야, 베티스
            return 140 // 라리가
        case 487, 489, 492, 496, 497, 505: // 라치오, 밀란, 나폴리, 유벤투스, 로마, 인터
            return 135 // 세리에 A
        case 157, 160, 165, 168, 169, 173: // 바이에른, 프라이부르크, 도르트문트, 레버쿠젠, 프랑크푸르트, 라이프치히
            return 78 // 분데스리가
        case 79, 80, 85, 91, 94, 95: // 릴, 마르세유, PSG, 모나코, 렌, 리옹
            return 61 // 리그 1
        case 1595, 1596, 1598, 1599, 1600, 1601, 1602, 1604, 1605, 1607, 1609, 1610, 1611, 1612, 1613, 1614, 1615, 1616, 1617, 1619, 1625, 15617, 15618, 15620, 15621, 15622, 15623, 15624, 18406, 18569: 
            // LA Galaxy, Inter Miami, LA FC, Atlanta United, New York City FC, Portland Timbers, Seattle Sounders, Toronto FC, 
            // DC United, New York Red Bulls, Philadelphia Union, Columbus Crew, Chicago Fire, FC Cincinnati, Minnesota United,
            // Nashville SC, Orlando City, Real Salt Lake, San Jose Earthquakes, Montreal Impact, Austin FC, Charlotte FC,
            // St. Louis City, Vancouver Whitecaps, Colorado Rapids, Houston Dynamo, New England Revolution, FC Dallas, Sporting Kansas City
            return 253 // MLS
        default:
            return -1 // 알 수 없는 팀
        }
    }
    
    // 팔로우한 리그 데이터 미리 로드 (점진적 로딩)
    @MainActor
    private func preloadFollowedLeaguesData(for date: Date) async {
        print("📱 팔로우한 리그 데이터 미리 로드 시작")
        
        // 팔로우한 리그 중 활성화된 리그만
        let followedLeagues = leagueFollowService.getActiveLeagueIds(for: date)
        
        // 우선순위 기반 리그 로딩 (5대 리그 + MLS 우선)
        let priorityLeagues = followedLeagues.filter { [39, 140].contains($0) }         // EPL, 라리가
        let secondaryLeagues = followedLeagues.filter { [135, 78, 61, 253].contains($0) }    // 세리에 A, 분데스리가, 리그1, MLS
        let tertiaryLeagues = followedLeagues.filter { ![39, 140, 135, 78, 61, 253].contains($0) }  // 기타 리그
        
        // 사용자 선호 리그 가져오기
        let userPreferredLeagues = getUserPreferredLeagues()
        print("📊 사용자 선호 리그: \(userPreferredLeagues)")
        
        // 로딩 우선순위 설정 (사용자 선호 > 우선순위 > 2차 > 3차)
        var loadingOrder = userPreferredLeagues
        
        // 중복 없이 우선순위 리그 추가
        for league in priorityLeagues {
            if !loadingOrder.contains(league) {
                loadingOrder.append(league)
            }
        }
        
        // 중복 없이 2차 우선순위 리그 추가
        for league in secondaryLeagues {
            if !loadingOrder.contains(league) {
                loadingOrder.append(league)
            }
        }
        
        // 중복 없이 3차 우선순위 리그 추가
        for league in tertiaryLeagues {
            if !loadingOrder.contains(league) {
                loadingOrder.append(league)
            }
        }
        
        print("📊 로딩 우선순위: \(loadingOrder)")
        
        // 현재 시즌
        _ = getCurrentSeason()
        
        // 날짜 문자열
        let dateString = formatDateForAPI(date)
        
        
        // 각 리그별로 데이터 로드 (우선순위 순서대로)
        for (index, leagueId) in loadingOrder.enumerated() {
            do {
                print("📡 리그 데이터 로드: 리그 ID \(leagueId) (우선순위: \(index + 1))")
                
                // 요청 간 지연 추가 (API 요청 제한 방지)
                if index > 0 {
                    // 우선순위에 따라 지연 시간 조정 (429 에러 방지를 위해 충분히 증가)
                    let delayTime = index < 3 ? 1_000_000_000 : 2_000_000_000 // 1초 또는 2초
                    try await Task.sleep(nanoseconds: UInt64(delayTime))
                }
                
                // 리그별 시즌 설정 (날짜 기준)
                let seasonForRequest = service.getSeasonForLeagueAndDate(leagueId, date: date)
                
                // 리그별 시즌 로깅
                if leagueId == 15 {
                    print("⚽ FIFA 클럽 월드컵 시즌: \(seasonForRequest) (새로운 포맷)")
                } else if leagueId == 292 || leagueId == 293 {
                    print("⚽ K리그 시즌: \(seasonForRequest) (3월-11월)")
                } else if leagueId == 253 {
                    print("⚽ MLS 시즌: \(seasonForRequest) (3월-11월)")
                } else {
                    print("⚽ 리그 \(leagueId) 시즌: \(seasonForRequest)")
                }
                
                // Supabase Edge Functions를 통한 서버 캐시 API 호출
                let fixturesForLeague = try await service.getFixturesWithServerCache(
                    date: dateString,
                    leagueId: leagueId,
                    seasonYear: seasonForRequest,
                    forceRefresh: false
                )
                
                // 기존 캐시된 데이터 가져오기
                var existingFixtures = cachedFixtures[dateString] ?? []
                
                // 새로운 데이터 추가 (중복 제거)
                let existingIds = Set(existingFixtures.map { $0.fixture.id })
                let newFixtures = fixturesForLeague.filter { !existingIds.contains($0.fixture.id) }
                existingFixtures.append(contentsOf: newFixtures)
                
                // 캐시 업데이트
                cachedFixtures[dateString] = existingFixtures
                saveCachedFixtures(for: dateString)
                
                // UI 업데이트 - 전체 데이터를 다시 설정
                fixtures[date] = sortFixturesByPriority(existingFixtures)
                
                print("✅ 리그 \(leagueId) 데이터 로드 완료: \(fixturesForLeague.count)개")
                
            } catch {
                print("❌ 리그 \(leagueId) 데이터 로드 실패: \(error.localizedDescription)")
            }
        }
        
        print("📱 주요 리그 데이터 미리 로드 완료")
    }
    
    // 캐시 우선 로딩 + 나중에 새로고침 전략을 사용한 프리로딩 메서드
    @MainActor
    private func preloadFixturesWithFallback(for date: Date, forceRefresh: Bool = false) async {
        var shouldForceRefresh = forceRefresh
        let dateString = formatDateForAPI(date)
        
        print("🔍 디버그: preloadFixturesWithFallback 시작 - 날짜: \(dateString), 강제 새로고침: \(forceRefresh)")
        
        // 오늘 날짜인지 확인
        let isToday = calendar.isDate(date, inSameDayAs: calendar.startOfDay(for: Date()))
        
        // 1. 먼저 캐시된 데이터가 있으면 즉시 표시 (UI 빠르게 업데이트)
        if let cachedData = cachedFixtures[dateString] {
            if !cachedData.isEmpty {
                fixtures[date] = cachedData
                print("✅ 캐시 데이터로 빠르게 UI 업데이트: \(dateString) (\(cachedData.count)개)")
                
                // 캐시된 데이터의 경기 상태 로깅
                let liveCount = cachedData.filter { liveStatuses.contains($0.fixture.status.short) }.count
                let finishedCount = cachedData.filter { $0.fixture.status.short == "FT" }.count
                let upcomingCount = cachedData.filter { $0.fixture.status.short == "NS" }.count
                print("🔍 디버그: 캐시 데이터 상태 - 라이브: \(liveCount), 종료: \(finishedCount), 예정: \(upcomingCount)")
            } else {
                print("⚠️ 빈 캐시 감지: \(dateString) - 강제로 새로운 데이터 로드 필요")
                // 빈 캐시는 무시하고 새로 로드
                shouldForceRefresh = true
            }
        } else {
            // 캐시된 데이터가 없으면 빈 배열 설정 (스켈레톤 UI 표시 가능)
            fixtures[date] = []
            print("🔍 디버그: 캐시 데이터 없음, 빈 배열 설정")
            
            // 로딩 상태 명확히 표시
            loadingDates.insert(date)
            if isToday {
                isLoading = true
                print("⏳ 오늘 날짜 로딩 상태 설정: \(dateString)")
            }
        }
        
        // 2. 캐시 만료 여부 확인
        let isCacheExpired = isCacheExpired(for: dateString)
        print("🔍 디버그: 캐시 만료 여부: \(isCacheExpired)")
        
        // 3. 캐시가 만료되었거나 데이터가 없는 경우 또는 강제 새로고침인 경우 API 호출
        if isCacheExpired || fixtures[date]?.isEmpty == true || shouldForceRefresh {
            print("🔍 디버그: API 호출 조건 충족 - 캐시 만료: \(isCacheExpired), 데이터 없음: \(fixtures[date]?.isEmpty == true), 강제 새로고침: \(shouldForceRefresh)")
            
            do {
                // API에서 최신 데이터 가져오기
                print("🔍 디버그: fetchFixturesForDate 호출 시작 - 날짜: \(dateString), 강제 새로고침: \(shouldForceRefresh)")
                let fixturesForDate = try await fetchFixturesForDate(date, forceRefresh: shouldForceRefresh)
                
                // 가져온 데이터 상태 로깅
                let liveCount = fixturesForDate.filter { liveStatuses.contains($0.fixture.status.short) }.count
                let finishedCount = fixturesForDate.filter { $0.fixture.status.short == "FT" }.count
                let upcomingCount = fixturesForDate.filter { $0.fixture.status.short == "NS" }.count
                print("🔍 디버그: API 응답 데이터 상태 - 라이브: \(liveCount), 종료: \(finishedCount), 예정: \(upcomingCount)")
                
                // UI 업데이트
                fixtures[date] = sortFixturesByPriority(fixturesForDate)
                
                // 캐시 업데이트
                cachedFixtures[dateString] = fixturesForDate
                saveCachedFixtures(for: dateString)
                
                // 로딩 상태 업데이트
                loadingDates.remove(date)
                if isToday {
                    isLoading = loadingDates.isEmpty
                }
                
                print("✅ API에서 최신 데이터로 업데이트: \(dateString) (\(fixturesForDate.count)개)")
                
                // 빈 응답인 경우 메시지 설정
                if fixturesForDate.isEmpty {
                    emptyDates[date] = "해당일에 예정된 경기가 없습니다."
                } else {
                    emptyDates[date] = nil
                }
            } catch {
                print("❌ 최신 데이터 업데이트 실패: \(error.localizedDescription)")
                print("🔍 디버그: 오류 타입: \(type(of: error))")
                
                if let apiError = error as? FootballAPIError {
                    print("🔍 디버그: FootballAPIError 세부 정보: \(apiError)")
                }
                
                // 에러 발생 시 빈 응답 메시지 설정
                if fixtures[date]?.isEmpty == true {
                    emptyDates[date] = "경기 일정을 불러오는데 실패했습니다."
                }
                
                // 로딩 상태 업데이트
                loadingDates.remove(date)
                if isToday {
                    isLoading = loadingDates.isEmpty
                }
                
                // 오류 시 로딩 상태만 업데이트
                // 로딩 상태 업데이트
                loadingDates.remove(date)
                if isToday {
                    isLoading = loadingDates.isEmpty
                }
            }
        } else {
            print("✅ 캐시가 유효하므로 API 호출 생략: \(dateString)")
            
            // 캐시가 유효하고 API 호출을 생략했지만 로딩 상태가 남아있다면 해제
            if loadingDates.contains(date) {
                loadingDates.remove(date)
                if isToday {
                    isLoading = loadingDates.isEmpty
                }
                print("🔍 디버그: 캐시 사용으로 로딩 상태 해제: \(dateString)")
            }
        }
    }
    
    // 라이브 경기 업데이트 구독 설정
    private func setupLiveMatchesSubscription() {
        // NotificationCenter를 사용하여 CoreData 변경 감지 (Swift 6 호환성을 위해 publisher 대신 addObserver 사용)
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleCoreDataChanges),
            name: .NSManagedObjectContextObjectsDidChange,
            object: nil
        )
        
        // 초기 라이브 경기 로드
        Task {
            await updateLiveMatches()
        }
    }
    
    // CoreData 변경 처리 메서드
    @objc private func handleCoreDataChanges() {
        Task { @MainActor in
            await updateLiveMatches()
        }
    }
    
    // 라이브 경기 목록 업데이트
    @MainActor
    private func updateLiveMatches() async {
        // LiveMatchService에서 라이브 경기 목록 가져오기
        self.liveMatches = liveMatchService.liveMatches
        self.lastLiveUpdateTime = liveMatchService.getLastUpdateTimeString()
        
        // 현재 선택된 날짜에 라이브 경기가 있는지 확인하고 업데이트
        if let currentDateFixtures = fixtures[selectedDate] {
            // 현재 날짜의 경기 ID 목록
            let currentFixtureIds = Set(currentDateFixtures.map { $0.fixture.id })
            
            // 라이브 경기 중 현재 날짜에 해당하는 경기만 필터링
            let updatedLiveFixtures = liveMatches.filter { currentFixtureIds.contains($0.fixture.id) }
            
            if !updatedLiveFixtures.isEmpty {
                // 라이브 경기가 있으면 현재 날짜의 경기 목록 업데이트
                var updatedFixtures = currentDateFixtures
                
                // 라이브 경기 정보로 업데이트
                for liveFixture in updatedLiveFixtures {
                    if let index = updatedFixtures.firstIndex(where: { $0.fixture.id == liveFixture.fixture.id }) {
                        updatedFixtures[index] = liveFixture
                    }
                }
                
                // 경기 목록 업데이트
                fixtures[selectedDate] = updatedFixtures
                print("✅ 현재 날짜의 라이브 경기 업데이트 완료: \(updatedLiveFixtures.count)개")
            }
        }
    }
    
    // 앱 생명주기 이벤트 관찰 설정 (SwiftUI 방식으로 변경)
    private func setupAppLifecycleObservers() {
        // SwiftUI 앱에서는 ScenePhase를 통해 생명주기 이벤트를 관찰합니다.
        // 이 메서드는 더 이상 직접 사용되지 않으며, SwiftUI의 .onChange(of: scenePhase)를 사용합니다.
        // 이 코드는 footballApp.swift에서 구현해야 합니다.
        
        print("📱 앱 생명주기 관찰은 SwiftUI의 ScenePhase를 통해 처리됩니다.")
    }
    
    // SwiftUI 앱에서 사용할 생명주기 메서드
    public func handleScenePhaseChange(newPhase: ScenePhase, oldPhase: ScenePhase) {
        if oldPhase == .background && newPhase == .active {
            // 백그라운드에서 포그라운드로 전환
            print("📱 앱이 포그라운드로 돌아옴 (ScenePhase)")
            appWillEnterForeground()
        } else if oldPhase == .active && newPhase == .background {
            // 포그라운드에서 백그라운드로 전환
            print("📱 앱이 백그라운드로 이동 (ScenePhase)")
            appDidEnterBackground()
        }
    }
    
    // 앱이 포그라운드로 돌아올 때 호출
    private func appWillEnterForeground() {
        print("📱 앱이 포그라운드로 돌아옴")
        
        // 현재 선택된 날짜의 데이터 새로고침
        Task {
            // do-catch 블록 제거
            await self.loadFixturesForDate(selectedDate, forceRefresh: true)
            
            // 오늘 날짜의 데이터도 새로고침 (선택된 날짜가 오늘이 아닌 경우)
            let today = calendar.startOfDay(for: Date())
            if !calendar.isDate(selectedDate, inSameDayAs: today) {
                await self.loadFixturesForDate(today, forceRefresh: true)
            }
            
            // 자동 새로고침 재시작
            startAutoRefresh()
            
            // 라이브 경기 폴링 재시작
            liveMatchService.startLivePolling()
            
            // 라이브 경기 업데이트
            await updateLiveMatches()
        }
    }
    
    // 앱이 백그라운드로 갈 때 호출
    private func appDidEnterBackground() {
        print("📱 앱이 백그라운드로 이동")
        
        // 자동 새로고침 중지
        stopAutoRefresh()
        
        // 라이브 경기 폴링 중지
        liveMatchService.stopLivePolling()
        
        // 진행 중인 작업 취소
        Task {
            // do-catch 블록 제거
            // 로딩 중인 날짜에 대한 작업 취소
            for date in loadingDates {
                print("⚠️ 백그라운드 전환으로 작업 취소: \(self.formatDateForAPI(date))")
                // 로딩 중인 날짜 목록에서 제거
                self.loadingDates.remove(date)
            }
        }
    }
    
    // 자동 새로고침 시작
    private func startAutoRefresh() {
        // 이미 타이머가 실행 중이면 중지
        stopAutoRefresh()
        
        print("⏱️ 자동 새로고침 타이머 시작 (간격: \(autoRefreshInterval)초)")
        
        // 새 타이머 생성
        refreshTimer = Timer.scheduledTimer(withTimeInterval: autoRefreshInterval, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            // MainActor에서 실행되도록 보장
            Task { @MainActor in
                // 자동 새로고침 로직을 별도의 메서드로 분리
                self.performAutoRefresh()
            }
        }
    }
    
    
    // 자동 새로고침 중지
    private func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
    
    // 자동 새로고침 실행 (별도의 메서드로 분리)
    @MainActor
    private func performAutoRefresh() {
        print("⏱️ 자동 새로고침 실행")
        
        // 현재 선택된 날짜가 오늘이거나 미래 날짜인 경우에만 새로고침
        let today = self.calendar.startOfDay(for: Date())
        
        // 날짜 비교 결과를 변수에 저장
        let dateCompareResult = self.calendar.compare(self.selectedDate, to: today, toGranularity: .day)
        if dateCompareResult != .orderedAscending {
            // 선택된 날짜 데이터 로드
            refreshSelectedDateData()
        }
        
        // 오늘 날짜의 데이터도 새로고침 (선택된 날짜가 오늘이 아닌 경우)
        let isSameDay = self.calendar.isDate(self.selectedDate, inSameDayAs: today)
        if !isSameDay {
            // 오늘 날짜 데이터 로드
            refreshTodayData()
        }
    }
    
    // 선택된 날짜 데이터 새로고침
    private func refreshSelectedDateData() {
        Task {
            await self.loadFixturesForDate(self.selectedDate, forceRefresh: true)
        }
    }
    
    // 오늘 날짜 데이터 새로고침
    private func refreshTodayData() {
        let today = self.calendar.startOfDay(for: Date())
        Task {
            await self.loadFixturesForDate(today, forceRefresh: true)
        }
    }
    
    // 제한된 날짜 범위에 대한 경기 일정 로드 (리소스 사용 최적화)
    @MainActor
    private func loadLimitedFixtures() async {
        // 오늘 날짜 기준으로 가까운 날짜만 로드 (±2일)
        let today = calendar.startOfDay(for: Date())
        let startDate = calendar.date(byAdding: .day, value: -2, to: today)!
        let endDate = calendar.date(byAdding: .day, value: 2, to: today)!
        
        var currentDate = startDate
        var limitedDates: [Date] = []
        
        // 제한된 날짜 범위 생성
        while currentDate <= endDate {
            if !calendar.isDate(currentDate, inSameDayAs: today) { // 오늘은 이미 로드했으므로 제외
                limitedDates.append(currentDate)
            }
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        print("📱 제한된 날짜 범위 로드 시작: \(limitedDates.count)일")
        
        // 각 날짜에 대해 캐시 만료 여부 확인 후 로드
        for date in limitedDates {
            let dateString = formatDateForAPI(date)
            let isCacheExpired = isCacheExpired(for: dateString)
            
            // 이미 데이터가 있고 캐시가 만료되지 않은 경우 스킵
            if let existingFixtures = fixtures[date], !existingFixtures.isEmpty, !isCacheExpired {
                print("✅ 이미 데이터가 있습니다: \(dateString) (\(existingFixtures.count)개)")
                continue
            }
            
            // 이미 로딩 중인 날짜인지 확인
            if loadingDates.contains(date) {
                print("⚠️ 이미 로딩 중인 날짜입니다: \(dateString)")
                continue
            }
            
            // 각 날짜에 대한 경기 일정 로드 (캐시 만료 시에만 새로고침)
            await loadFixturesForDate(date, forceRefresh: isCacheExpired)
            
            // API 요청 제한 방지를 위한 지연
            try? await Task.sleep(nanoseconds: 300_000_000) // 0.3초 지연
        }
    }
    
    // 캐시 만료 여부 확인 (경기 상태별 캐시 정책 적용)
    private func isCacheExpired(for dateKey: String) -> Bool {
        guard let cacheDate = cacheDates[dateKey] else {
            return true // 캐시 날짜가 없으면 만료된 것으로 간주
        }
        
        let now = Date()
        
        // 날짜 문자열에서 Date 객체 생성
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        guard let keyDate = dateFormatter.date(from: dateKey) else {
            return true // 날짜 변환 실패 시 만료된 것으로 간주
        }
        
        // 오늘 날짜 확인
        let today = calendar.startOfDay(for: now)
        let isToday = calendar.isDate(keyDate, inSameDayAs: today)
        
        // 과거/현재/미래 날짜 여부 확인
        let isPastDay = keyDate < today
        let isFutureDay = keyDate > today
        
        // 해당 날짜의 경기 목록 가져오기
        if let fixturesForDate = cachedFixtures[dateKey] {
            // 경기가 있는 경우 경기 상태에 따라 다른 캐시 만료 시간 적용
            if !fixturesForDate.isEmpty {
                // 진행 중인 경기가 있는지 확인
                let hasLiveMatches = fixturesForDate.contains { fixture in
                    liveStatuses.contains(fixture.fixture.status.short)
                }
                
                // 예정된 경기가 있는지 확인
                let hasUpcomingMatches = fixturesForDate.contains { fixture in
                    fixture.fixture.status.short == "NS"
                }
                
                // 경기 상태에 따른 캐시 만료 시간 결정
                var expirationMinutes: Double
                
                if hasLiveMatches || (isToday && hasUpcomingMatches) {
                    // 진행 중인 경기가 있거나 오늘 예정된 경기가 있으면 짧은 캐시 시간
                    expirationMinutes = liveMatchCacheMinutes
                } else if hasUpcomingMatches && !isPastDay {
                    // 미래의 예정된 경기는 중간 캐시 시간
                    expirationMinutes = upcomingMatchCacheMinutes
                } else if isPastDay {
                    // 과거 날짜는 긴 캐시 시간
                    expirationMinutes = pastDayCacheMinutes
                } else {
                    // 오늘/미래 날짜의 종료된 경기는 중간 캐시 시간
                    expirationMinutes = finishedMatchCacheMinutes
                }
                
                // 캐시 만료 여부 확인
                let expirationInterval = expirationMinutes * 60 // 초 단위로 변환
                let isExpired = now.timeIntervalSince(cacheDate) > expirationInterval
                
                return isExpired
            }
        }
        
        // 날짜에 따른 기본 캐시 만료 시간 적용
        var defaultExpirationMinutes = cacheExpirationMinutes
        
        if isPastDay {
            // 과거 날짜는 더 긴 캐시 시간 적용
            defaultExpirationMinutes = pastDayCacheMinutes
        } else if isFutureDay {
            // 미래 날짜는 중간 캐시 시간 적용
            defaultExpirationMinutes = upcomingMatchCacheMinutes
        } else if isToday {
            // 오늘 날짜는 짧은 캐시 시간
            defaultExpirationMinutes = liveMatchCacheMinutes
        }
        
        let expirationInterval = defaultExpirationMinutes * 60 // 초 단위로 변환
        let isExpired = now.timeIntervalSince(cacheDate) > expirationInterval
        
        return isExpired
    }
    
    // 캐시 초기화 함수 (필요한 경우에만 호출)
    private func clearCache() {
        UserDefaults.standard.removeObject(forKey: "cachedFixtures")
        UserDefaults.standard.removeObject(forKey: "cacheDates")
        cachedFixtures = [:]
        cacheDates = [:]
        print("🧹 캐시 초기화 완료")
    }
    
    
    // 현재 날짜에 따라 시즌 결정
    private func getCurrentSeason() -> Int {
        let calendar = Calendar.current
        let now = Date()
        let year = calendar.component(.year, from: now)
        let month = calendar.component(.month, from: now)
        
        // 축구 시즌은 일반적으로 8월에 시작하고 다음해 5월에 끝남
        // 8월-12월: 현재 연도가 시즌
        // 1월-7월: 이전 연도가 시즌
        // 예: 2025년 7월이면 2024-25 시즌(2024)
        return month < 8 ? year - 1 : year
    }
    
    // 날짜 범위 초기화
    private func initializeDateRanges() {
        // 현재 시간을 기준으로 날짜 범위 설정
        let calendar = Calendar.current
        
        // 현재 날짜 가져오기
        let now = Date()
        let today = calendar.startOfDay(for: now)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        print("📅 현재 시간: \(now)")
        print("📅 오늘 날짜 설정: \(dateFormatter.string(from: today))")
        
        // 초기 날짜 범위 생성 (오늘 날짜로부터 -60일 ~ +30일로 확대)
        // 2025년 7월은 대부분 리그가 오프시즌이므로 과거 날짜를 더 많이 포함
        let startDate = calendar.date(byAdding: .day, value: -60, to: today)!
        let endDate = calendar.date(byAdding: .day, value: 30, to: today)!
        
        var currentDate = startDate
        var dates: [Date] = []
        
        while currentDate <= endDate {
            dates.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        allDateRange = dates
        visibleDateRange = dates
        
        print("📅 초기 날짜 범위: \(dateFormatter.string(from: startDate)) ~ \(dateFormatter.string(from: endDate))")
        print("📅 총 날짜 수: \(dates.count)일")
        
        // 오늘 날짜를 선택
        selectedDate = today
        
        // 오늘 날짜의 인덱스 찾기
        if let todayIndex = dates.firstIndex(where: { calendar.isDate($0, inSameDayAs: today) }) {
            print("📅 오늘 날짜 인덱스: \(todayIndex)")
            print("📅 오늘 날짜: \(dateFormatter.string(from: dates[todayIndex]))")
        } else {
            print("⚠️ 오늘 날짜를 날짜 범위에서 찾을 수 없습니다")
        }
    }
    
    // 날짜 범위 확장 (앞쪽 또는 뒤쪽)
    // 날짜 범위 확장 중인지 확인하는 플래그
    private var isExtendingDateRange = false
    
    /// 표시 가능한 날짜 범위의 캐시된 데이터를 미리 적용
    @MainActor
    public func prePopulateCachedFixtures() {
        for date in visibleDateRange {
            let dateString = formatDateForAPI(date)
            if let cachedData = cachedFixtures[dateString], !cachedData.isEmpty {
                if fixtures[date]?.isEmpty ?? true {
                    fixtures[date] = cachedData
                    print("✅ 캐시 데이터 미리 적용: \(dateString) (\(cachedData.count)개)")
                }
            }
        }
    }
    
    @MainActor
    public func extendDateRange(forward: Bool) {
        // 이미 확장 중이면 중복 호출 방지
        if isExtendingDateRange {
            print("⚠️ 날짜 범위 확장 중복 호출 방지")
            return
        }
        
        // 최대 날짜 범위 제한 (±365일)
        let maxDaysFromToday = 365
        let today = calendar.startOfDay(for: Date())
        
        // 확장 시작
        isExtendingDateRange = true
        
        if forward {
            // 미래 날짜 추가
            if let lastDate = allDateRange.last {
                // 오늘로부터 최대 날짜 확인
                let daysFromToday = calendar.dateComponents([.day], from: today, to: lastDate).day ?? 0
                
                if daysFromToday >= maxDaysFromToday {
                    print("⚠️ 최대 미래 날짜 도달: \(formatDateForAPI(lastDate))")
                    isExtendingDateRange = false
                    return
                }
                
                print("📅 미래 날짜 확장 시작 - 마지막 날짜: \(formatDateForAPI(lastDate))")
                
                let maxAllowedDate = calendar.date(byAdding: .day, value: maxDaysFromToday, to: today)!
                let targetEndDate = calendar.date(byAdding: .day, value: additionalLoadCount, to: lastDate)!
                let newEndDate = min(targetEndDate, maxAllowedDate)
                
                var currentDate = calendar.date(byAdding: .day, value: 1, to: lastDate)!
                var newDates: [Date] = []
                
                while currentDate <= newEndDate {
                    newDates.append(currentDate)
                    currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
                }
                
                if newDates.isEmpty {
                    print("⚠️ 추가할 미래 날짜 없음")
                    isExtendingDateRange = false
                    return
                }
                
                print("📅 미래 날짜 \(newDates.count)개 추가")
                
                allDateRange.append(contentsOf: newDates)
                visibleDateRange.append(contentsOf: newDates)
                
                // 새로 추가된 날짜에 대한 경기 일정 로드 (최대 3일만)
                Task {
                    defer {
                        // 작업 완료 후 항상 플래그 해제
                        Task { @MainActor in
                            self.isExtendingDateRange = false
                        }
                    }
                    
                    // 새로 추가된 날짜 중 앞쪽 3일에 대해서만 경기 일정 로드
                    for date in newDates.prefix(3) {
                        await self.loadFixturesForDate(date, forceRefresh: false)
                    }
                }
            } else {
                isExtendingDateRange = false
            }
        } else {
            // 과거 날짜 추가
            if let firstDate = allDateRange.first {
                // 오늘로부터 최대 날짜 확인
                let daysFromToday = calendar.dateComponents([.day], from: firstDate, to: today).day ?? 0
                
                if daysFromToday >= maxDaysFromToday {
                    print("⚠️ 최대 과거 날짜 도달: \(formatDateForAPI(firstDate))")
                    isExtendingDateRange = false
                    return
                }
                
                print("📅 과거 날짜 확장 시작 - 첫 날짜: \(formatDateForAPI(firstDate))")
                
                let minAllowedDate = calendar.date(byAdding: .day, value: -maxDaysFromToday, to: today)!
                let targetStartDate = calendar.date(byAdding: .day, value: -additionalLoadCount, to: firstDate)!
                let newStartDate = max(targetStartDate, minAllowedDate)
                
                var newDates: [Date] = []
                var currentDate = newStartDate
                
                while currentDate < firstDate {
                    newDates.append(currentDate)
                    currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
                }
                
                if newDates.isEmpty {
                    print("⚠️ 추가할 과거 날짜 없음")
                    isExtendingDateRange = false
                    return
                }
                
                print("📅 과거 날짜 \(newDates.count)개 추가")
                
                // 날짜 순서 확인 로그
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                print("📅 첫 번째 새 날짜: \(dateFormatter.string(from: newDates.first!))")
                print("📅 마지막 새 날짜: \(dateFormatter.string(from: newDates.last!))")
                print("📅 기존 첫 날짜: \(dateFormatter.string(from: firstDate))")
                
                // 현재 선택된 날짜 저장
                let currentSelectedDate = selectedDate
                
                // 날짜 배열 업데이트 (새 날짜 + 기존 날짜)
                allDateRange = newDates + allDateRange
                visibleDateRange = newDates + visibleDateRange
                
                // 선택된 날짜의 새 인덱스 찾기
                if let newSelectedIndex = visibleDateRange.firstIndex(where: { calendar.isDate($0, inSameDayAs: currentSelectedDate) }) {
                    print("📅 선택된 날짜의 새 인덱스: \(newSelectedIndex) (과거 날짜 추가 후)")
                    
                    // NotificationCenter를 통해 인덱스 업데이트 알림
                    NotificationCenter.default.post(
                        name: NSNotification.Name("DateRangeExtended"),
                        object: nil,
                        userInfo: ["newSelectedIndex": newSelectedIndex]
                    )
                }
                
                // 새로 추가된 날짜에 대한 경기 일정 로드 (최대 3일만)
                Task {
                    defer {
                        // 작업 완료 후 항상 플래그 해제
                        Task { @MainActor in
                            self.isExtendingDateRange = false
                        }
                    }
                    
                    // 새로 추가된 날짜 중 뒤쪽 3일에 대해서만 경기 일정 로드
                    for date in newDates.suffix(3) {
                        await self.loadFixturesForDate(date, forceRefresh: false)
                    }
                }
            } else {
                isExtendingDateRange = false
            }
        }
    }
    
    // 캐시된 경기 일정 로드 (CoreData만 사용)
    private func loadCachedFixtures() {
        // CoreData에서만 로드 (UserDefaults는 JSON 인코딩 문제로 제거)
        loadCachedFixturesFromCoreData()
        
        // 캐시 날짜 정보만 UserDefaults에서 로드
        let today = Date()
        let calendar = Calendar.current
        
        for dayOffset in -30...30 {
            guard let date = calendar.date(byAdding: .day, value: dayOffset, to: today) else { continue }
            let dateKey = formatDateForAPI(date)
            
            // 캐시 날짜 정보 로드
            if let cacheDate = UserDefaults.standard.object(forKey: "cacheDate_\(dateKey)") as? Date {
                cacheDates[dateKey] = cacheDate
            }
        }
        
        print("✅ 캐시 데이터 로드 완료: \(cachedFixtures.count) 날짜")
    }
    
    // CoreData에서 캐시된 경기 일정 로드
    private func loadCachedFixturesFromCoreData() {
        // CoreData에서 모든 FixtureEntity 가져오기
        let fetchRequest: NSFetchRequest<FixtureEntity> = FixtureEntity.fetchRequest()
        
        do {
            let results = try CoreDataManager.shared.context.fetch(fetchRequest)
            
            if !results.isEmpty {
                // 결과가 있으면 캐시 데이터 초기화
                self.cachedFixtures = [:]
                self.cacheDates = [:]
                
                // 각 엔티티에서 데이터 추출
                for entity in results {
                    let decoder = JSONDecoder()
                    if let data = entity.fixtureData, let fixtureData = try? decoder.decode([Fixture].self, from: data) {
                        if let dateKey = entity.dateKey {
                            self.cachedFixtures[dateKey] = fixtureData
                            self.cacheDates[dateKey] = entity.timestamp
                        }
                    }
                }
                
                print("✅ CoreData에서 캐시된 경기 일정 로드 성공: \(self.cachedFixtures.count) 날짜")
            } else {
                print("ℹ️ CoreData에 저장된 경기 일정 없음")
            }
        } catch {
            print("❌ CoreData에서 경기 일정 로드 실패: \(error.localizedDescription)")
        }
    }
    
    // 캐시된 경기 일정 저장 (특정 날짜에 대해서만)
    internal func saveCachedFixtures(for dateKey: String) {
        // 캐시 저장 시간 기록
        cacheDates[dateKey] = Date()
        
        // CoreData에만 저장 (UserDefaults는 JSON 인코딩 문제로 제거)
        if let fixtures = cachedFixtures[dateKey] {
            // CoreData에 저장
            CoreDataManager.shared.saveFixtures(fixtures, for: dateKey)
            print("✅ CoreData에 경기 일정 저장 성공: \(dateKey) (\(fixtures.count)개)")
            
            // 캐시 날짜만 UserDefaults에 저장
            UserDefaults.standard.set(Date(), forKey: "cacheDate_\(dateKey)")
        }
    }
    
    public func getFormattedDateLabel(_ date: Date) -> String {
        dateFormatter.dateFormat = "M.d(E)"
        return dateFormatter.string(from: date)
    }
    
    public func formatTime(_ dateString: String) -> String {
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        guard let date = dateFormatter.date(from: dateString) else { return dateString }
        
        dateFormatter.dateFormat = "HH:mm"
        return dateFormatter.string(from: date)
    }
    
    public func getMatchStatus(_ status: FixtureStatus) -> String {
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
    
    // 빈 응답 캐시 만료 여부 확인
    private func isEmptyResponseCacheExpired(for dateString: String, leagueId: Int) -> Bool {
        let cacheKey = "\(dateString)_\(leagueId)"
        guard let cacheDate = emptyResponseCache[cacheKey] else {
            print("ℹ️ 빈 응답 캐시 없음: \(cacheKey)")
            return true // 캐시 날짜가 없으면 만료된 것으로 간주
        }
        
        let now = Date()
        let expirationInterval = emptyResponseCacheHours * 3600 // 초 단위로 변환
        let isExpired = now.timeIntervalSince(cacheDate) > expirationInterval
        
        if isExpired {
            print("⏰ 빈 응답 캐시 만료됨: \(cacheKey) (저장 시간: \(cacheDate), 현재: \(now), 만료 시간: \(emptyResponseCacheHours)시간)")
            
            // 만료된 캐시 항목 제거
            emptyResponseCache.removeValue(forKey: cacheKey)
            saveEmptyResponseCacheToUserDefaults()
        } else {
            print("✅ 빈 응답 캐시 유효함: \(cacheKey) (저장 시간: \(cacheDate), 현재: \(now), 남은 시간: \(String(format: "%.1f", (expirationInterval - now.timeIntervalSince(cacheDate)) / 3600))시간)")
        }
        
        return isExpired
    }
    
    // 빈 응답 캐시 저장
    private func saveEmptyResponseCache(for dateString: String, leagueId: Int) {
        let cacheKey = "\(dateString)_\(leagueId)"
        emptyResponseCache[cacheKey] = Date()
        print("📝 빈 응답 캐시 저장: \(cacheKey)")
        
        // UserDefaults에 빈 응답 캐시 저장
        saveEmptyResponseCacheToUserDefaults()
    }
    
    // 빈 응답 캐시를 UserDefaults에 저장
    private func saveEmptyResponseCacheToUserDefaults() {
        // 저장 전에 캐시 정리
        cleanupEmptyResponseCache()
        
        let encoder = JSONEncoder()
        
        // 캐시 데이터를 직렬화 가능한 형태로 변환
        var cacheData: [String: Double] = [:]
        for (key, date) in emptyResponseCache {
            cacheData[key] = date.timeIntervalSince1970
        }
        
        if let encodedCache = try? encoder.encode(cacheData) {
            UserDefaults.standard.set(encodedCache, forKey: "emptyResponseCache")
            print("✅ 빈 응답 캐시 UserDefaults에 저장 성공: \(cacheData.count)개 항목")
        } else {
            print("❌ 빈 응답 캐시 UserDefaults 저장 실패")
        }
    }
    
    // UserDefaults에서 빈 응답 캐시 로드
    private func loadEmptyResponseCache() {
        if let cachedData = UserDefaults.standard.data(forKey: "emptyResponseCache") {
            let decoder = JSONDecoder()
            if let decodedCache = try? decoder.decode([String: Double].self, from: cachedData) {
                // 타임스탬프를 Date 객체로 변환
                var loadedCache: [String: Date] = [:]
                for (key, timestamp) in decodedCache {
                    loadedCache[key] = Date(timeIntervalSince1970: timestamp)
                }
                
                self.emptyResponseCache = loadedCache
                print("✅ 빈 응답 캐시 로드 성공: \(loadedCache.count)개 항목")
            } else {
                print("❌ 빈 응답 캐시 로드 실패")
                self.emptyResponseCache = [:]
            }
        } else {
            print("ℹ️ 저장된 빈 응답 캐시 없음")
            self.emptyResponseCache = [:]
        }
    }
    
    // 특정 날짜에 대한 경기 일정 가져오기 (개선된 버전)
    public func fetchFixturesForDate(_ date: Date, forceRefresh: Bool = false) async throws -> [Fixture] {
        let dateString = formatDateForAPI(date)
        
        print("🔍 디버그: fetchFixturesForDate 시작 - 날짜: \(dateString), 강제 새로고침: \(forceRefresh)")
        
        // 1. 먼저 CoreData에서 데이터 확인
        if !forceRefresh {
            if let coreDataFixtures = CoreDataManager.shared.loadFixtures(for: dateString) {
                print("✅ CoreData에서 데이터 로드 성공: \(dateString) (\(coreDataFixtures.count)개)")
                return coreDataFixtures
            } else {
                print("ℹ️ CoreData에 데이터 없음: \(dateString)")
            }
        }
        
        // 2. CoreData에 없으면 캐시된 데이터 확인 (API 호출 전)
        let cachedData = self.cachedFixtures[dateString]
        
        // 캐시 만료 확인
        let isCacheExpired = isCacheExpired(for: dateString)
        print("🔍 디버그: 캐시 만료 여부: \(isCacheExpired), 캐시 데이터 있음: \(cachedData != nil), 캐시 데이터 비어있음: \(cachedData?.isEmpty ?? true)")
        
        // 캐시가 있고, 만료되지 않았으며, 강제 새로고침이 아닌 경우 캐시 사용
        if !forceRefresh && !isCacheExpired, let cachedData = cachedData, !cachedData.isEmpty {
            print("✅ 캐시된 데이터 사용 (API 호출 전): \(dateString) (\(cachedData.count)개)")
            
            // CoreData에도 저장 (백업)
            CoreDataManager.shared.saveFixtures(cachedData, for: dateString)
            
            return cachedData
        }
        
        // 캐시 만료 또는 강제 새로고침 로그
        if isCacheExpired {
            print("⏰ 캐시 만료됨: \(dateString)")
        }
        
        print("📡 경기 일정 로드 시작: \(dateString) \(forceRefresh ? "(강제 새로고침)" : "")")
        
        // 팔로우한 리그만 가져오기 (시즌별 활성화된 리그만)
        let mainLeagues = leagueFollowService.getActiveLeagueIds(for: date)
        
        if mainLeagues.isEmpty {
            print("⚠️ 팔로우한 리그가 없습니다")
            return []
        }
        
        print("📅 팔로우한 활성 리그: \(mainLeagues)")
        
        // 리그별 빈 응답 캐시 확인을 위한 필터링된 리그 목록
        let filteredLeagues = mainLeagues.filter { leagueId in
            // 빈 응답 캐시가 만료되었거나 강제 새로고침인 경우에만 포함
            let shouldInclude = forceRefresh || isEmptyResponseCacheExpired(for: dateString, leagueId: leagueId)
            
            if !shouldInclude {
                print("🔍 디버그: 빈 응답 캐시가 유효하여 리그 \(leagueId) 요청 생략")
            }
            
            return shouldInclude
        }
        
        if filteredLeagues.count < mainLeagues.count {
            print("🔍 디버그: 빈 응답 캐시로 인해 \(mainLeagues.count - filteredLeagues.count)개 리그 요청 생략")
        }
        
        // 요청하는 날짜에 따른 시즌 설정 (현재 날짜가 아닌 요청 날짜 기준)
        // 기본 시즌은 유럽 리그 기준으로 설정
        let requestCalendar = Calendar.current
        let requestYear = requestCalendar.component(.year, from: date)
        let requestMonth = requestCalendar.component(.month, from: date)
        let defaultSeason = requestMonth < 8 ? requestYear - 1 : requestYear
        print("📅 요청 날짜(\(dateString)) 기준 기본 시즌 설정: \(defaultSeason)")
        
        
        var allFixtures: [Fixture] = []
        var successfulLeagues: [Int] = []
        var failedLeagues: [Int] = []
        var emptyResponseLeagues: [Int] = []
        
        // 1. 주요 리그 데이터 가져오기
        for leagueId in filteredLeagues {
            do {
                // 이미 진행 중인 요청이 있는지 확인 (중복 요청 방지)
                // 리그별 시즌 설정 (날짜 기준)
                let seasonForRequest = service.getSeasonForLeagueAndDate(leagueId, date: date)
                
                let requestKey = "getFixtures_\(dateString)_\(leagueId)_\(seasonForRequest)"
                if requestManager.isRequestInProgress(requestKey) {
                    print("⚠️ 이미 진행 중인 요청입니다: \(requestKey)")
                    
                    // 이미 캐시된 데이터가 있으면 사용
                    if let cachedData = cachedFixtures[dateString], !cachedData.isEmpty {
                        print("✅ 중복 요청 감지, 캐시된 데이터 사용: \(dateString) (\(cachedData.count)개)")
                        continue
                    } else {
                        // 캐시된 데이터가 없으면 다음 리그로 넘어감
                        failedLeagues.append(leagueId)
                        continue
                    }
                }
                
                // 리그별 시즌 로깅
                if leagueId == 15 {
                    print("⚽ FIFA 클럽 월드컵 시즌: \(seasonForRequest) (새로운 포맷)")
                } else if leagueId == 292 || leagueId == 293 {
                    print("⚽ K리그 시즌: \(seasonForRequest) (3월-11월)")
                } else if leagueId == 253 {
                    print("⚽ MLS 시즌: \(seasonForRequest) (3월-11월)")
                } else {
                    print("⚽ 리그 \(leagueId) 시즌: \(seasonForRequest)")
                }
                
                print("📡 경기 일정 로드 시도: 날짜: \(dateString), 리그: \(leagueId), 시즌: \(seasonForRequest)")
                
                // 요청 간 지연 추가 (API 요청 제한 방지)
                if leagueId != filteredLeagues.first {
                    // Rate Limit 방지를 위해 충분한 지연 시간
                    try await Task.sleep(nanoseconds: 500_000_000) // 0.5초로 조정
                }
                
                // Supabase Edge Functions를 통한 서버 캐시 API 호출
                print("📡 API 요청 시작: 리그 \(leagueId), 날짜 \(dateString), 시즌 \(seasonForRequest)")
                
                var fixturesForLeague: [Fixture] = []
                do {
                    fixturesForLeague = try await service.getFixturesWithServerCache(
                        date: dateString,
                        leagueId: leagueId,
                        seasonYear: seasonForRequest,
                        forceRefresh: forceRefresh
                    )
                } catch FootballAPIError.edgeFunctionError(_) {
                    print("⚠️ Edge Function 실패, 직접 API로 시도")
                    // 날짜 문자열을 Date 객체로 변환
                    let dateFormatter = DateFormatter()
                    dateFormatter.dateFormat = "yyyy-MM-dd"
                    dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
                    
                    if let dateObj = dateFormatter.date(from: dateString) {
                        fixturesForLeague = try await FootballAPIService.shared.getFixtures(
                            leagueId: leagueId,
                            season: seasonForRequest,
                            from: dateObj,
                            to: dateObj
                        )
                    } else {
                        throw FootballAPIError.invalidDateFormat
                    }
                }
                
                // 서버에서 이미 날짜별로 필터링된 데이터를 반환하므로
                // 추가 필터링 없이 모든 경기 추가
                allFixtures.append(contentsOf: fixturesForLeague)
                
                print("✅ 리그 \(leagueId): \(fixturesForLeague.count)개 경기 로드")
                successfulLeagues.append(leagueId)
                print("📊 누적 경기 수: \(allFixtures.count)개 (리그 \(leagueId) 추가 후)")
                
                // 빈 응답인 경우 캐시에 저장하고 UI에 표시
                if fixturesForLeague.isEmpty {
                    saveEmptyResponseCache(for: dateString, leagueId: leagueId)
                    emptyResponseLeagues.append(leagueId)
                    print("📝 리그 \(leagueId)에 대한 빈 응답 캐시 저장")
                    
                    // 빈 응답 캐시 상태 로깅
                    print("📊 현재 빈 응답 캐시 항목 수: \(emptyResponseCache.count)")
                }
                
            } catch let error {
                print("❌ 리그 \(leagueId) API 요청 오류: \(error.localizedDescription)")
                failedLeagues.append(leagueId)
                
                // 404 에러인 경우 해당 날짜에 경기가 없음을 의미
                if let apiError = error as? FootballAPIError,
                   case .serverError(let statusCode) = apiError,
                   statusCode == 404 {
                    print("ℹ️ 리그 \(leagueId): 해당 날짜에 경기 없음 (404)")
                    // 빈 응답으로 처리
                    saveEmptyResponseCache(for: dateString, leagueId: leagueId)
                    emptyResponseLeagues.append(leagueId)
                }
                
                // 다음 리그로 넘어감
                continue
            }
        }
        
        // 모든 리그에서 실패한 경우 빈 배열 반환 (캐시된 데이터 사용하지 않음)
        if successfulLeagues.isEmpty && failedLeagues.count == filteredLeagues.count {
            print("⚠️ 모든 리그에서 데이터 로드 실패")
            print("  - 시도한 리그: \(filteredLeagues)")
            print("  - 실패한 리그: \(failedLeagues)")
            
            // 캐시된 데이터를 사용하지 않고 빈 배열 반환
            // 이렇게 하면 각 날짜별로 올바른 데이터만 표시됨
            print("⚠️ API 요청 실패, 빈 배열 반환 (캐시 사용하지 않음)")
            let emptyFixtures: [Fixture] = []
            
            // 실패한 날짜를 기록하여 나중에 재시도할 수 있도록 함
            print("❌ 실패한 날짜 기록: \(dateString)")
            
            return emptyFixtures
        }
        
        // 리그 우선순위 정의
        let leaguePriority: [Int: Int] = [
            39: 1,   // 프리미어 리그
            140: 2,  // 라리가
            135: 3,  // 세리에 A
            78: 4,   // 분데스리가
            61: 5,   // 리그 1
            2: 6,    // 챔피언스 리그
            3: 7,    // 유로파 리그
            4: 8,    // 컨퍼런스 리그
            292: 9,  // K리그1
            293: 10, // K리그2
            253: 11, // MLS
            71: 12,  // 브라질 세리에 A
            5: 13,   // 네이션스 리그
            1: 14,   // FIFA 월드컵
            32: 15,  // 월드컵 예선 - 유럽
            34: 16,  // 월드컵 예선 - 남미
            29: 17,  // 월드컵 예선 - 아시아
            15: 18,  // FIFA 클럽 월드컵
            45: 19,  // FA컵
            143: 20, // 코파 델 레이
            137: 21, // 코파 이탈리아
            81: 22,  // DFB 포칼
            66: 23   // 쿠프 드 프랑스
        ]
        
        // 라이브 경기, 팔로잉 팀, 리그 우선순위를 고려한 정렬
        allFixtures.sort { fixture1, fixture2 in
            // 첫 번째 경기가 라이브인지 확인
            let isFixture1Live = liveStatuses.contains(fixture1.fixture.status.short)
            
            // 두 번째 경기가 라이브인지 확인
            let isFixture2Live = liveStatuses.contains(fixture2.fixture.status.short)
            
            // 라이브 경기가 먼저 오도록 정렬
            if isFixture1Live != isFixture2Live {
                return isFixture1Live && !isFixture2Live
            }
            
            // 첫 번째 경기에 팔로잉하는 팀이 있는지 확인
            let isTeam1Following = favoriteService.isFavorite(type: .team, entityId: fixture1.teams.home.id) ||
                                   favoriteService.isFavorite(type: .team, entityId: fixture1.teams.away.id)
            
            // 두 번째 경기에 팔로잉하는 팀이 있는지 확인
            let isTeam2Following = favoriteService.isFavorite(type: .team, entityId: fixture2.teams.home.id) ||
                                   favoriteService.isFavorite(type: .team, entityId: fixture2.teams.away.id)
            
            // 팔로잉하는 팀이 있는 경기가 먼저 오도록 정렬
            if isTeam1Following != isTeam2Following {
                return isTeam1Following && !isTeam2Following
            }
            
            // 리그 우선순위 가져오기 (없으면 낮은 우선순위)
            let priority1 = leaguePriority[fixture1.league.id] ?? 999
            let priority2 = leaguePriority[fixture2.league.id] ?? 999
            
            // 리그 우선순위로 정렬
            if priority1 != priority2 {
                return priority1 < priority2
            }
            
            // 같은 리그인 경우 날짜순으로 정렬
            return fixture1.fixture.date < fixture2.fixture.date
        }
        
        // 결과 캐싱 (빈 배열이라도 캐싱하여 불필요한 API 호출 방지)
        self.cachedFixtures[dateString] = allFixtures
        self.saveCachedFixtures(for: dateString)
        
        print("📊 최종 경기 수: \(allFixtures.count)개 (모든 리그 합산)")
        return allFixtures
    }
    
    // 모든 날짜에 대한 경기 일정 로드
    @MainActor
    public func fetchFixtures() async {
        // 로딩 상태 설정
        isLoading = true
        
        // 오늘 날짜 기준으로 가까운 날짜만 로드 (±3일)
        let today = calendar.startOfDay(for: Date())
        let startDate = calendar.date(byAdding: .day, value: -3, to: today)!
        let endDate = calendar.date(byAdding: .day, value: 3, to: today)!
        
        var currentDate = startDate
        var dates: [Date] = []
        
        // 날짜 범위 생성
        while currentDate <= endDate {
            dates.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        print("📱 fetchFixtures - 날짜 범위 로드 시작: \(dates.count)일")
        
        // 각 날짜에 대해 경기 일정 로드
        for date in dates {
            // 이미 로딩 중인 날짜인지 확인
            if loadingDates.contains(date) {
                continue
            }
            
            // 각 날짜에 대한 경기 일정 로드
            await loadFixturesForDate(date, forceRefresh: true)
            
            // API 요청 제한 방지를 위한 지연
            try? await Task.sleep(nanoseconds: 300_000_000) // 0.3초 지연
        }
        
        // 로딩 상태 해제
        isLoading = false
    }
    
    /* // FixtureDetailViewModel과 FixtureCell.ScoreView에서 처리하므로 주석 처리
    // 합산 스코어 계산 (챔피언스리그, 유로파리그 등의 2차전 경기에서 사용)
    public func calculateAggregateScore(fixture: Fixture) async -> (home: Int, away: Int)? {
        // 챔피언스리그(2)나 유로파리그(3)의 경기인 경우에만 합산 스코어 계산
        guard [2, 3].contains(fixture.league.id) else {
            print("🏆 합산 스코어 계산 - 대상 리그가 아님: \(fixture.league.id)")
            return nil
        }
        
        // 라운드 정보 확인
        let round = fixture.league.round
        
        // 2차전 경기인지 확인
        let isSecondLeg = round.lowercased().contains("2nd leg") ||
                         round.lowercased().contains("second leg") ||
                         round.lowercased().contains("return leg")
        
        guard isSecondLeg else {
            print("🏆 합산 스코어 계산 - 2차전 경기가 아님: \(round)")
            return nil
        }
        
        // 홈팀과 원정팀 ID
        let homeTeamId = fixture.teams.home.id
        let awayTeamId = fixture.teams.away.id
        
        // 현재 경기 스코어
        let currentHomeScore = fixture.goals?.home ?? 0
        let currentAwayScore = fixture.goals?.away ?? 0
        
        // 1차전 경기 스코어 (가상 데이터 - 실제로는 API에서 가져와야 함)
        // 여기서는 간단한 예시로 홈팀과 원정팀의 ID를 기반으로 가상의 스코어 생성
        let firstLegHomeScore = (awayTeamId % 5) // 1차전 홈팀 스코어 (현재 2차전의 원정팀)
        let firstLegAwayScore = (homeTeamId % 4) // 1차전 원정팀 스코어 (현재 2차전의 홈팀)
        
        // 합산 스코어 계산
        let aggregateHomeScore = currentHomeScore + firstLegAwayScore
        let aggregateAwayScore = currentAwayScore + firstLegHomeScore
        
        print("🏆 합산 스코어 계산 - 1차전: \(firstLegHomeScore)-\(firstLegAwayScore), 2차전: \(currentHomeScore)-\(currentAwayScore)")
        print("🏆 합산 스코어 계산 - 최종 합산: \(aggregateHomeScore)-\(aggregateAwayScore)")
        
//        return (home: aggregateHomeScore, away: aggregateAwayScore)
    }
    */
    
    // 특정 날짜에 대한 경기 일정 로드 (UI 업데이트 포함)
    @MainActor
    public func loadFixturesForDate(_ date: Date, forceRefresh: Bool = false) async {
        let dateString = formatDateForAPI(date)
        
        // 이미 로딩 중이면 스킵
        if loadingDates.contains(date) {
            print("⚠️ 이미 로딩 중: \(dateString)")
            return
        }
        
        // 캐시된 데이터가 있으면 즉시 UI에 표시
        if let cachedData = cachedFixtures[dateString], !cachedData.isEmpty {
            fixtures[date] = cachedData
            print("✅ 캐시 데이터 즉시 표시: \(dateString) (\(cachedData.count)개)")
        }
        
        // 최적화된 배치 요청 사용
        await loadFixturesOptimized(for: date, forceRefresh: forceRefresh)
    }
    
    // MARK: - Helper Methods
    
    /// 사용자가 선호하는 리그 반환
    func getPreferredLeagues() -> [Int] {
        let followedLeagues = leagueFollowService.followedLeagueIds
        
        if !followedLeagues.isEmpty {
            return followedLeagues
        }
        
        // 기본 선호 리그 (5대 리그 + K리그)
        return [39, 140, 135, 78, 61, 292, 293]
    }
    
    // MARK: - 빈 응답 캐시 정리
    private func cleanupEmptyResponseCache() {
        let now = Date()
        let expirationTime = emptyResponseCacheHours * 3600 // 시간을 초로 변환
        
        // 만료된 항목 제거
        for (key, cacheDate) in emptyResponseCache {
            if now.timeIntervalSince(cacheDate) > expirationTime {
                emptyResponseCache.removeValue(forKey: key)
            }
        }
        
        print("🧹 빈 응답 캐시 정리 완료: \(emptyResponseCache.count)개 항목 남음")
    }
    
    // 경기 정렬 함수 (리그 우선순위 기반)
    internal func sortFixturesByPriority(_ fixtures: [Fixture]) -> [Fixture] {
        // 리그 우선순위 정의
        let leaguePriority: [Int: Int] = [
            39: 1,   // 프리미어 리그
            140: 2,  // 라리가
            135: 3,  // 세리에 A
            78: 4,   // 분데스리가
            61: 5,   // 리그 1
            2: 6,    // 챔피언스 리그
            3: 7,    // 유로파 리그
            4: 8,    // 컨퍼런스 리그
            292: 9,  // K리그1
            293: 10, // K리그2
            253: 11, // MLS
            71: 12,  // 브라질 세리에 A
            5: 13,   // 네이션스 리그
            1: 14,   // FIFA 월드컵
            32: 15,  // 월드컵 예선 - 유럽
            34: 16,  // 월드컵 예선 - 남미
            29: 17,  // 월드컵 예선 - 아시아
            15: 18,  // FIFA 클럽 월드컵
            45: 19,  // FA컵
            143: 20, // 코파 델 레이
            137: 21, // 코파 이탈리아
            81: 22,  // DFB 포칼
            66: 23   // 쿠프 드 프랑스
        ]
        
        return fixtures.sorted { fixture1, fixture2 in
            // 첫 번째 경기가 라이브인지 확인
            let isFixture1Live = liveStatuses.contains(fixture1.fixture.status.short)
            
            // 두 번째 경기가 라이브인지 확인
            let isFixture2Live = liveStatuses.contains(fixture2.fixture.status.short)
            
            // 라이브 경기가 먼저 오도록 정렬
            if isFixture1Live != isFixture2Live {
                return isFixture1Live && !isFixture2Live
            }
            
            // 첫 번째 경기에 팔로잉하는 팀이 있는지 확인
            let isTeam1Following = favoriteService.isFavorite(type: .team, entityId: fixture1.teams.home.id) ||
                                   favoriteService.isFavorite(type: .team, entityId: fixture1.teams.away.id)
            
            // 두 번째 경기에 팔로잉하는 팀이 있는지 확인
            let isTeam2Following = favoriteService.isFavorite(type: .team, entityId: fixture2.teams.home.id) ||
                                   favoriteService.isFavorite(type: .team, entityId: fixture2.teams.away.id)
            
            // 팔로잉하는 팀이 있는 경기가 먼저 오도록 정렬
            if isTeam1Following != isTeam2Following {
                return isTeam1Following && !isTeam2Following
            }
            
            // 리그 우선순위 가져오기 (없으면 낮은 우선순위)
            let priority1 = leaguePriority[fixture1.league.id] ?? 999
            let priority2 = leaguePriority[fixture2.league.id] ?? 999
            
            // 리그 우선순위로 정렬
            if priority1 != priority2 {
                return priority1 < priority2
            }
            
            // 같은 리그인 경우 날짜순으로 정렬
            return fixture1.fixture.date < fixture2.fixture.date
        }
    }
    
    /// 라이브 경기 추적 정보 업데이트
    @MainActor
    func updateLiveMatchTracking(fixtures: [Fixture]) {
        let currentLiveMatches = fixtures.filter { liveStatuses.contains($0.fixture.status.short) }
        
        if !currentLiveMatches.isEmpty {
            liveMatches = currentLiveMatches
            let formatter = DateFormatter()
            formatter.dateFormat = "HH:mm:ss"
            lastLiveUpdateTime = formatter.string(from: Date())
            
            print("⚽ 라이브 경기 \(currentLiveMatches.count)개 추적 중")
        }
    }
}
