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
    @Published var visibleDateRange: [Date] = []
    @Published var allDateRange: [Date] = []
    private let initialVisibleCount = 10 // 초기에 표시할 날짜 수 (오늘 기준 좌우 5일씩)
    private let additionalLoadCount = 5 // 추가로 로드할 날짜 수
    private let calendar = Calendar.current
    
    // API 요청 제한 관련 변수
    private var isRateLimited: Bool = false
    private var rateLimitTimer: Timer?
    
    // 캐싱 관련 변수
    private var cachedFixtures: [String: [Fixture]] = [:] // 날짜 문자열을 키로 사용
    private var cacheDates: [String: Date] = [:] // 캐시 저장 시간 기록
    private let cacheExpirationMinutes: Double = 15 // 기본 캐시 만료 시간 (5분에서 15분으로 증가)
    
    // 빈 응답 캐싱을 위한 변수
    private var emptyResponseCache: [String: Date] = [:] // 빈 응답을 받은 날짜+리그 조합과 시간
    private let emptyResponseCacheHours: Double = 6 // 빈 응답 캐시 만료 시간 (6시간)
    
    // 경기 상태별 캐시 만료 시간 (분 단위)
    private let liveMatchCacheMinutes: Double = 1 // 진행 중인 경기는 1분 유지
    private let upcomingMatchCacheMinutes: Double = 15 // 예정된 경기는 15분으로 증가
    private let finishedMatchCacheMinutes: Double = 120 // 종료된 경기는 2시간으로 증가
    private let pastDayCacheMinutes: Double = 360 // 과거 날짜는 6시간으로 설정 (새로 추가)
    
    // 자동 새로고침 타이머
    private var refreshTimer: Timer?
    private let autoRefreshInterval: TimeInterval = 60 // 60초마다 자동 새로고침 (30초에서 60초로 변경)
    
    // 개발 모드에서 백그라운드 로드 활성화 여부
    #if DEBUG
    private let enableBackgroundLoad = false // 개발 중에는 백그라운드 로드 비활성화
    #else
    private let enableBackgroundLoad = true // 배포 버전에서는 활성화
    #endif
    
    // 즐겨찾기 서비스
    private let favoriteService = FavoriteService.shared
    
    private let service = FootballAPIService.shared
    private let requestManager = APIRequestManager.shared
    private let liveMatchService = LiveMatchService.shared
    private let coreDataManager = CoreDataManager.shared
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
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter.string(from: date)
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
        
        // 캐시된 데이터 로드
        loadCachedFixtures()
        
        // 빈 응답 캐시 로드
        loadEmptyResponseCache()
        
        // 라이브 경기 업데이트 구독
        setupLiveMatchesSubscription()
        
        // 오늘 날짜 확인 (시간대 고려)
        let now = Date()
        let today = calendar.startOfDay(for: now)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        
        print("📱 앱 시작 시 현재 시간: \(now)")
        print("📱 앱 시작 시 오늘 날짜: \(dateFormatter.string(from: today))")
        
        // 캐시된 데이터가 있는지 확인
        let dateString = formatDateForAPI(today)
        if let cachedData = cachedFixtures[dateString], !cachedData.isEmpty {
            // 캐시된 데이터가 있으면 사용
            fixtures[today] = cachedData
            print("📱 앱 시작 시 캐시된 데이터 사용: \(cachedData.count)개")
        } else {
            // 캐시된 데이터가 없으면 빈 배열 설정
            fixtures[today] = []
            print("📱 앱 시작 시 데이터 없음: 경기 일정을 불러오는 중...")
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
            
            // 주요 리그 데이터 미리 로드 (점진적 로딩)
            await preloadMainLeaguesData(for: today)
            
            // 확장된 날짜 범위 프리로딩 (±3일 우선, 나머지는 백그라운드에서)
            print("📱 확장된 날짜 범위 프리로딩 시작 (±3일 우선)")
            
            // 미래 날짜 프리로딩 (1~3일 우선)
            for i in 1...3 {
                let futureDate = calendar.date(byAdding: .day, value: i, to: today)!
                print("🔍 디버그: 미래 날짜 \(i)일 후 = \(formatDateForAPI(futureDate))")
                await preloadFixturesWithFallback(for: futureDate, forceRefresh: false)
                
                // API 요청 제한 방지를 위한 지연
                try? await Task.sleep(nanoseconds: 100_000_000) // 0.1초 지연
            }
            
            // 과거 날짜 프리로딩 (1~3일 우선)
            for i in 1...3 {
                let pastDate = calendar.date(byAdding: .day, value: -i, to: today)!
                print("🔍 디버그: 과거 날짜 \(i)일 전 = \(formatDateForAPI(pastDate))")
                await preloadFixturesWithFallback(for: pastDate, forceRefresh: false)
                
                // API 요청 제한 방지를 위한 지연
                try? await Task.sleep(nanoseconds: 100_000_000) // 0.1초 지연
            }
            
            isLoading = false
            
            // 자동 새로고침 시작
            startAutoRefresh()
            
            // 백그라운드에서 나머지 날짜 로드
            Task.detached(priority: .background) {
                // 미래 날짜 프리로딩 (4~7일)
                for i in 4...7 {
                    let futureDate = self.calendar.date(byAdding: .day, value: i, to: today)!
                    print("🔍 디버그: 백그라운드 미래 날짜 \(i)일 후 = \(await self.formatDateForAPI(futureDate))")
                    try? await Task.sleep(nanoseconds: 1_000_000) // 0.001초 지연
                    await self.preloadFixturesWithFallback(for: futureDate, forceRefresh: false)
                    
                    // API 요청 제한 방지를 위한 지연
                    try? await Task.sleep(nanoseconds: 200_000_000) // 0.2초 지연
                }
                
                // 과거 날짜 프리로딩 (4~7일)
                for i in 4...7 {
                    let pastDate = self.calendar.date(byAdding: .day, value: -i, to: today)!
                    print("🔍 디버그: 백그라운드 과거 날짜 \(i)일 전 = \(await self.formatDateForAPI(pastDate))")
                    try? await Task.sleep(nanoseconds: 1_000_000) // 0.001초 지연
                    await self.preloadFixturesWithFallback(for: pastDate, forceRefresh: false)
                    
                    // API 요청 제한 방지를 위한 지연
                    try? await Task.sleep(nanoseconds: 200_000_000) // 0.2초 지연
                }
                
                // 백그라운드 로드가 활성화된 경우에만 추가 데이터 로드
                if self.enableBackgroundLoad {
                    // 제한된 날짜 범위에 대한 경기 일정 로드 (리소스 사용 최적화)
                    await self.loadLimitedFixtures()
                } else {
                    print("📱 백그라운드 로드 비활성화됨 (개발 모드)")
                }
            }
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
        default:
            return -1 // 알 수 없는 팀
        }
    }
    
    // 주요 리그 데이터 미리 로드 (점진적 로딩)
    @MainActor
    private func preloadMainLeaguesData(for date: Date) async {
        print("📱 주요 리그 데이터 미리 로드 시작")
        
        // 우선순위 기반 리그 로딩
        let priorityLeagues = [39, 140]         // EPL, 라리가
        let secondaryLeagues = [135, 78, 61]    // 세리에 A, 분데스리가, 리그1
        let tertiaryLeagues = [2, 3]            // 챔피언스 리그, 유로파 리그
        
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
        let currentSeason = getCurrentSeason()
        
        // 날짜 문자열
        let dateString = formatDateForAPI(date)
        
        // 각 리그별로 데이터 로드 (우선순위 순서대로)
        for (index, leagueId) in loadingOrder.enumerated() {
            do {
                print("📡 리그 데이터 로드: 리그 ID \(leagueId) (우선순위: \(index + 1))")
                
                // 요청 간 지연 추가 (API 요청 제한 방지)
                if index > 0 {
                    // 우선순위에 따라 지연 시간 조정
                    let delayTime = index < 3 ? 200_000_000 : 300_000_000 // 0.2초 또는 0.3초
                    try await Task.sleep(nanoseconds: UInt64(delayTime))
                }
                
                // FootballAPIService를 통한 직접 API 호출
                let fixturesForLeague = try await service.getFixtures(
                    leagueId: leagueId,
                    season: currentSeason,
                    from: date,
                    to: date
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
                
                // UI 업데이트
                if let existingDateFixtures = fixtures[date] {
                    // 기존 데이터에 새 데이터 추가 (중복 제거)
                    let existingUIIds = Set(existingDateFixtures.map { $0.fixture.id })
                    let newUIFixtures = fixturesForLeague.filter { !existingUIIds.contains($0.fixture.id) }
                    fixtures[date] = existingDateFixtures + newUIFixtures
                } else {
                    fixtures[date] = fixturesForLeague
                }
                
                // 알림 발송 (UI 업데이트를 위해)
                NotificationCenter.default.post(
                    name: NSNotification.Name("FixturesLoadingCompleted"),
                    object: nil,
                    userInfo: ["date": date]
                )
                
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
        let dateString = formatDateForAPI(date)
        
        print("🔍 디버그: preloadFixturesWithFallback 시작 - 날짜: \(dateString), 강제 새로고침: \(forceRefresh)")
        
        // 오늘 날짜인지 확인
        let isToday = calendar.isDate(date, inSameDayAs: calendar.startOfDay(for: Date()))
        
        // 1. 먼저 캐시된 데이터가 있으면 즉시 표시 (UI 빠르게 업데이트)
        if let cachedData = cachedFixtures[dateString], !cachedData.isEmpty {
            fixtures[date] = cachedData
            print("✅ 캐시 데이터로 빠르게 UI 업데이트: \(dateString) (\(cachedData.count)개)")
            
            // 캐시된 데이터의 경기 상태 로깅
            let liveCount = cachedData.filter { liveStatuses.contains($0.fixture.status.short) }.count
            let finishedCount = cachedData.filter { $0.fixture.status.short == "FT" }.count
            let upcomingCount = cachedData.filter { $0.fixture.status.short == "NS" }.count
            print("🔍 디버그: 캐시 데이터 상태 - 라이브: \(liveCount), 종료: \(finishedCount), 예정: \(upcomingCount)")
            
            // 알림 발송 (UI 업데이트를 위해)
            NotificationCenter.default.post(
                name: NSNotification.Name("FixturesLoadingCompleted"),
                object: nil,
                userInfo: ["date": date]
            )
        } else {
            // 캐시된 데이터가 없으면 빈 배열 설정 (스켈레톤 UI 표시 가능)
            fixtures[date] = []
            print("🔍 디버그: 캐시 데이터 없음, 빈 배열 설정")
            
            // 오늘 날짜인 경우 로딩 상태 명확히 표시
            if isToday {
                loadingDates.insert(date)
                isLoading = true
                print("⏳ 오늘 날짜 로딩 상태 설정: \(dateString)")
            }
        }
        
        // 2. 캐시 만료 여부 확인
        let isCacheExpired = isCacheExpired(for: dateString)
        print("🔍 디버그: 캐시 만료 여부: \(isCacheExpired)")
        
        // 3. 캐시가 만료되었거나 데이터가 없는 경우 또는 강제 새로고침인 경우 API 호출
        if isCacheExpired || fixtures[date]?.isEmpty == true || forceRefresh {
            print("🔍 디버그: API 호출 조건 충족 - 캐시 만료: \(isCacheExpired), 데이터 없음: \(fixtures[date]?.isEmpty == true), 강제 새로고침: \(forceRefresh)")
            
            do {
                // API에서 최신 데이터 가져오기
                print("🔍 디버그: fetchFixturesForDate 호출 시작 - 날짜: \(dateString), 강제 새로고침: \(forceRefresh)")
                let fixturesForDate = try await fetchFixturesForDate(date, forceRefresh: forceRefresh)
                
                // 가져온 데이터 상태 로깅
                let liveCount = fixturesForDate.filter { liveStatuses.contains($0.fixture.status.short) }.count
                let finishedCount = fixturesForDate.filter { $0.fixture.status.short == "FT" }.count
                let upcomingCount = fixturesForDate.filter { $0.fixture.status.short == "NS" }.count
                print("🔍 디버그: API 응답 데이터 상태 - 라이브: \(liveCount), 종료: \(finishedCount), 예정: \(upcomingCount)")
                
                // UI 업데이트
                fixtures[date] = fixturesForDate
                
                // 캐시 업데이트
                cachedFixtures[dateString] = fixturesForDate
                saveCachedFixtures(for: dateString)
                
                // 로딩 상태 업데이트
                if isToday {
                    loadingDates.remove(date)
                    isLoading = loadingDates.isEmpty
                }
                
                print("✅ API에서 최신 데이터로 업데이트: \(dateString) (\(fixturesForDate.count)개)")
                
                // 알림 발송 (UI 업데이트를 위해)
                NotificationCenter.default.post(
                    name: NSNotification.Name("FixturesLoadingCompleted"),
                    object: nil,
                    userInfo: ["date": date, "forceUpdate": true]
                )
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
                if isToday {
                    loadingDates.remove(date)
                    isLoading = loadingDates.isEmpty
                }
                
                // 오류 발생 시에도 알림 발송 (UI 업데이트를 위해)
                NotificationCenter.default.post(
                    name: NSNotification.Name("FixturesLoadingCompleted"),
                    object: nil,
                    userInfo: ["date": date, "error": true]
                )
            }
        } else {
            print("✅ 캐시가 유효하므로 API 호출 생략: \(dateString)")
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
        
        // 과거/현재/미래 날짜 여부 확인
        let isPastDay = keyDate < today
        let isFutureDay = keyDate > today
        
        // 해당 날짜의 경기 목록 가져오기
        if let fixturesForDate = cachedFixtures[dateKey] {
            // 경기가 있는 경우 경기 상태에 따라 다른 캐시 만료 시간 적용
            if !fixturesForDate.isEmpty {
                // 진행 중인 경기가 있는지 확인
                let hasLiveMatches = fixturesForDate.contains { fixture in
                    ["1H", "2H", "HT", "ET", "P"].contains(fixture.fixture.status.short)
                }
                
                // 예정된 경기가 있는지 확인
                let hasUpcomingMatches = fixturesForDate.contains { fixture in
                    fixture.fixture.status.short == "NS"
                }
                
                // 경기 상태에 따른 캐시 만료 시간 결정
                var expirationMinutes: Double
                
                if hasLiveMatches {
                    // 진행 중인 경기가 있으면 짧은 캐시 시간 적용
                    expirationMinutes = liveMatchCacheMinutes
                    print("⏱️ 진행 중인 경기가 있어 짧은 캐시 시간 적용: \(liveMatchCacheMinutes)분")
                } else if hasUpcomingMatches {
                    // 예정된 경기가 있으면 중간 캐시 시간 적용
                    expirationMinutes = upcomingMatchCacheMinutes
                    print("⏱️ 예정된 경기가 있어 중간 캐시 시간 적용: \(upcomingMatchCacheMinutes)분")
                } else if isPastDay {
                    // 과거 날짜의 종료된 경기는 긴 캐시 시간 적용
                    expirationMinutes = pastDayCacheMinutes
                    print("⏱️ 과거 날짜의 종료된 경기는 긴 캐시 시간 적용: \(pastDayCacheMinutes)분")
                } else {
                    // 오늘/미래 날짜의 종료된 경기는 중간 캐시 시간 적용
                    expirationMinutes = finishedMatchCacheMinutes
                    print("⏱️ 오늘/미래 날짜의 종료된 경기는 중간 캐시 시간 적용: \(finishedMatchCacheMinutes)분")
                }
                
                // 캐시 만료 여부 확인
                let expirationInterval = expirationMinutes * 60 // 초 단위로 변환
                let isExpired = now.timeIntervalSince(cacheDate) > expirationInterval
                
                if isExpired {
                    print("⏰ 캐시 만료됨: \(dateKey) (저장 시간: \(cacheDate), 현재: \(now), 만료 시간: \(expirationMinutes)분)")
                }
                
                return isExpired
            }
        }
        
        // 날짜에 따른 기본 캐시 만료 시간 적용
        var defaultExpirationMinutes = cacheExpirationMinutes
        
        if isPastDay {
            // 과거 날짜는 더 긴 캐시 시간 적용
            defaultExpirationMinutes = pastDayCacheMinutes
            print("⏱️ 과거 날짜는 더 긴 캐시 시간 적용: \(pastDayCacheMinutes)분")
        } else if isFutureDay {
            // 미래 날짜는 중간 캐시 시간 적용
            defaultExpirationMinutes = upcomingMatchCacheMinutes
            print("⏱️ 미래 날짜는 중간 캐시 시간 적용: \(upcomingMatchCacheMinutes)분")
        }
        
        let expirationInterval = defaultExpirationMinutes * 60 // 초 단위로 변환
        let isExpired = now.timeIntervalSince(cacheDate) > expirationInterval
        
        if isExpired {
            print("⏰ 캐시 만료됨: \(dateKey) (저장 시간: \(cacheDate), 현재: \(now), 기본 만료 시간: \(defaultExpirationMinutes)분)")
        }
        
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
    
    // 모든 캐시 정리 함수 (API 캐시 포함)
    public func clearAllCaches() {
        // UserDefaults 캐시 정리
        clearCache()
        
        // 빈 응답 캐시 정리
        emptyResponseCache = [:]
        UserDefaults.standard.removeObject(forKey: "emptyResponseCache")
        
        // API 캐시 정리
        APICacheManager.shared.clearAllCache()
        
        // 요청 관리자 캐시 정리
        requestManager.cancelAllRequests()
        
        print("🧹 모든 캐시 정리 완료")
        
        // 현재 선택된 날짜의 데이터 다시 로드
        Task {
            await self.loadFixturesForDate(selectedDate, forceRefresh: true)
        }
    }
    
    // 현재 날짜에 따라 시즌 결정
    private func getCurrentSeason() -> Int {
        let calendar = Calendar.current
        let now = Date()
        let year = calendar.component(.year, from: now)
        let month = calendar.component(.month, from: now)
        
        // 7월 이전이면 이전 시즌, 7월 이후면 현재 시즌
        // 예: 2025년 3월이면 2024-25 시즌(2024), 2025년 8월이면 2025-26 시즌(2025)
        return month < 7 ? year - 1 : year
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
        
        // 초기 날짜 범위 생성 (오늘 날짜로부터 -5일 ~ +5일)
        let startDate = calendar.date(byAdding: .day, value: -5, to: today)!
        let endDate = calendar.date(byAdding: .day, value: 5, to: today)!
        
        var currentDate = startDate
        var dates: [Date] = []
        
        while currentDate <= endDate {
            dates.append(currentDate)
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
        
        allDateRange = dates
        visibleDateRange = dates
        
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
    
    @MainActor
    public func extendDateRange(forward: Bool) {
        // 이미 확장 중이면 중복 호출 방지
        if isExtendingDateRange {
            print("⚠️ 날짜 범위 확장 중복 호출 방지")
            return
        }
        
        // 확장 시작
        isExtendingDateRange = true
        
        if forward {
            // 미래 날짜 추가
            if let lastDate = allDateRange.last {
                print("📅 미래 날짜 확장 시작 - 마지막 날짜: \(formatDateForAPI(lastDate))")
                
                let newEndDate = calendar.date(byAdding: .day, value: additionalLoadCount, to: lastDate)!
                var currentDate = calendar.date(byAdding: .day, value: 1, to: lastDate)!
                var newDates: [Date] = []
                
                while currentDate <= newEndDate {
                    newDates.append(currentDate)
                    currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
                }
                
                print("📅 미래 날짜 \(newDates.count)개 추가")
                
                allDateRange.append(contentsOf: newDates)
                visibleDateRange.append(contentsOf: newDates)
                
                // 새로 추가된 날짜에 대한 경기 일정 로드 (최대 3일만)
                Task {
                    // 새로 추가된 날짜 중 앞쪽 3일에 대해서만 경기 일정 로드
                    for date in newDates.prefix(3) {
                        await self.loadFixturesForDate(date, forceRefresh: false)
                    }
                    
                    // 확장 완료
                    await MainActor.run {
                        self.isExtendingDateRange = false
                    }
                }
            } else {
                isExtendingDateRange = false
            }
        } else {
            // 과거 날짜 추가
            if let firstDate = allDateRange.first {
                print("📅 과거 날짜 확장 시작 - 첫 날짜: \(formatDateForAPI(firstDate))")
                
                // 정확히 additionalLoadCount일 전 날짜 계산
                let newStartDate = calendar.date(byAdding: .day, value: -additionalLoadCount, to: firstDate)!
                print("📅 새 시작 날짜: \(formatDateForAPI(newStartDate))")
                
                var newDates: [Date] = []
                
                // 날짜 범위 생성 (newStartDate부터 firstDate 전까지)
                for i in 0..<additionalLoadCount {
                    let date = calendar.date(byAdding: .day, value: i, to: newStartDate)!
                    newDates.append(date)
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
                    // 새로 추가된 날짜 중 뒤쪽 3일에 대해서만 경기 일정 로드
                    for date in newDates.suffix(3) {
                        await self.loadFixturesForDate(date, forceRefresh: false)
                    }
                    
                    // 확장 완료
                    await MainActor.run {
                        self.isExtendingDateRange = false
                    }
                }
            } else {
                isExtendingDateRange = false
            }
        }
    }
    
    // 캐시된 경기 일정 로드 (CoreData 및 UserDefaults 모두 사용)
    private func loadCachedFixtures() {
        // 1. 먼저 CoreData에서 로드 시도
        loadCachedFixturesFromCoreData()
        
        // 2. CoreData에서 로드 실패 시 UserDefaults에서 로드 (기존 코드)
        if cachedFixtures.isEmpty {
            // 경기 일정 캐시 로드
            if let cachedData = UserDefaults.standard.data(forKey: "cachedFixtures") {
                // try? 사용하여 에러 처리 (catch 블록 제거)
                if let decodedCache = try? JSONDecoder().decode([String: [Fixture]].self, from: cachedData) {
                    self.cachedFixtures = decodedCache
                    print("✅ UserDefaults에서 캐시된 경기 일정 로드 성공: \(decodedCache.count) 날짜")
                } else {
                    print("❌ 캐시된 경기 일정 로드 실패")
                    // 캐시 로드 실패 시 캐시 초기화
                    self.cachedFixtures = [:]
                    UserDefaults.standard.removeObject(forKey: "cachedFixtures")
                }
            }
            
            // 캐시 날짜 로드
            if let cachedDatesData = UserDefaults.standard.data(forKey: "cacheDates") {
                // try? 사용하여 에러 처리 (catch 블록 제거)
                if let decodedDates = try? JSONDecoder().decode([String: Date].self, from: cachedDatesData) {
                    self.cacheDates = decodedDates
                    print("✅ 캐시 날짜 로드 성공: \(decodedDates.count) 항목")
                } else {
                    print("❌ 캐시 날짜 로드 실패")
                    // 캐시 로드 실패 시 캐시 초기화
                    self.cacheDates = [:]
                    UserDefaults.standard.removeObject(forKey: "cacheDates")
                }
            }
        }
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
    private func saveCachedFixtures(for dateKey: String) {
        // 캐시 저장 시간 기록
        cacheDates[dateKey] = Date()
        
        // 1. CoreData에 저장
        if let fixtures = cachedFixtures[dateKey] {
            // CoreData에 저장
            CoreDataManager.shared.saveFixtures(fixtures, for: dateKey)
            print("✅ CoreData에 경기 일정 저장 성공: \(dateKey) (\(fixtures.count)개)")
        }
        
        // 2. UserDefaults에도 백업으로 저장 (기존 코드)
        let encoder = JSONEncoder()
        
        // 경기 일정 캐시 저장
        if let encodedCache = try? encoder.encode(cachedFixtures) {
            UserDefaults.standard.set(encodedCache, forKey: "cachedFixtures")
            
            // 캐시 날짜 저장
            if let encodedDates = try? encoder.encode(cacheDates) {
                UserDefaults.standard.set(encodedDates, forKey: "cacheDates")
                print("✅ UserDefaults에 캐시된 경기 일정 저장 성공: \(dateKey)")
            } else {
                print("❌ UserDefaults 캐시 날짜 저장 실패")
            }
        } else {
            print("❌ UserDefaults 캐시된 경기 일정 저장 실패")
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
        
        // 주요 리그만 가져오기 (API 요청 제한 방지)
        let mainLeagues = [39, 140, 135, 78, 61, 2, 3] // 프리미어 리그, 라리가, 세리에 A, 분데스리가, 리그 1, 챔피언스 리그, 유로파 리그
        
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
        
        // 현재 날짜에 따른 시즌 설정
        let currentSeason = getCurrentSeason()
        print("📅 현재 시즌 설정: \(currentSeason)")
        
        var allFixtures: [Fixture] = []
        var successfulLeagues: [Int] = []
        var failedLeagues: [Int] = []
        var emptyResponseLeagues: [Int] = []
        
        // 1. 주요 리그 데이터 가져오기
        for leagueId in filteredLeagues {
            do {
                // 이미 진행 중인 요청이 있는지 확인 (중복 요청 방지)
                let requestKey = "getFixtures_\(dateString)_\(leagueId)_\(currentSeason)"
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
                
                print("📡 경기 일정 로드 시도: 날짜: \(dateString), 리그: \(leagueId), 시즌: \(currentSeason)")
                
                // 요청 간 지연 추가 (API 요청 제한 방지)
                if leagueId != mainLeagues.first {
                    try await Task.sleep(nanoseconds: 300_000_000) // 0.3초 지연
                }
                
                // FootballAPIService를 통한 직접 API 호출
                let fixturesForLeague = try await service.getFixtures(
                    leagueId: leagueId,
                    season: currentSeason,
                    from: date,
                    to: date
                )
                
                // 이 리그의 경기를 전체 목록에 추가
                allFixtures.append(contentsOf: fixturesForLeague)
                successfulLeagues.append(leagueId)
                print("📊 리그 \(leagueId) 받은 경기 수: \(fixturesForLeague.count)")
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
                
                // 다음 리그로 넘어감
                continue
            }
        }
        
        // 모든 리그에서 실패한 경우 캐시된 데이터 사용 또는 더미 데이터 생성
        if successfulLeagues.isEmpty && failedLeagues.count == mainLeagues.count {
            print("⚠️ 모든 리그에서 데이터 로드 실패")
            
            // 캐시된 데이터가 있으면 사용
            if let cachedData = cachedData, !cachedData.isEmpty {
                print("✅ 모든 리그 실패로 캐시된 데이터 사용: \(dateString) (\(cachedData.count)개)")
                return cachedData
            }
            
            // 캐시된 데이터가 없으면 더미 데이터 생성
            print("⚠️ 캐시된 데이터 없음, 더미 데이터 생성")
            let dummyFixtures = createDummyFixtures(for: date)
            
            // 더미 데이터 캐싱
            self.cachedFixtures[dateString] = dummyFixtures
            self.saveCachedFixtures(for: dateString)
            
            print("✅ 더미 데이터 생성 완료: \(dummyFixtures.count)개")
            return dummyFixtures
        }
        
        // 라이브 경기와 팔로잉하는 팀의 경기가 최상단에 오도록 정렬
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
            
            // 둘 다 팔로잉하는 팀이거나 둘 다 아닌 경우 날짜순으로 정렬
            if isTeam1Following == isTeam2Following {
                return fixture1.fixture.date < fixture2.fixture.date
            }
            
            // 팔로잉하는 팀이 있는 경기가 먼저 오도록 정렬
            return isTeam1Following && !isTeam2Following
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

    // 특정 리그에 대한 더미 경기 일정 생성 함수
    private func createDummyFixturesForLeague(leagueId: Int, date: String, season: Int) -> [Fixture] {
        print("🔄 리그 \(leagueId)에 대한 더미 경기 일정 생성 시작")
        
        // 날짜 정보
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        guard dateFormatter.date(from: date) != nil else {
            print("❌ 날짜 파싱 실패: \(date)")
            return []
        }
        
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")
        
        // 리그 정보 설정
        var leagueName = "Unknown League"
        var leagueCountry = "Unknown"
        var leagueLogo = ""
        
        // 리그 ID에 따라 정보 설정
        switch leagueId {
        case 39:
            leagueName = "Premier League"
            leagueCountry = "England"
            leagueLogo = "https://media.api-sports.io/football/leagues/39.png"
        case 140:
            leagueName = "La Liga"
            leagueCountry = "Spain"
            leagueLogo = "https://media.api-sports.io/football/leagues/140.png"
        case 135:
            leagueName = "Serie A"
            leagueCountry = "Italy"
            leagueLogo = "https://media.api-sports.io/football/leagues/135.png"
        case 78:
            leagueName = "Bundesliga"
            leagueCountry = "Germany"
            leagueLogo = "https://media.api-sports.io/football/leagues/78.png"
        case 61:
            leagueName = "Ligue 1"
            leagueCountry = "France"
            leagueLogo = "https://media.api-sports.io/football/leagues/61.png"
        case 2:
            leagueName = "UEFA Champions League"
            leagueCountry = "UEFA"
            leagueLogo = "https://media.api-sports.io/football/leagues/2.png"
        case 3:
            leagueName = "UEFA Europa League"
            leagueCountry = "UEFA"
            leagueLogo = "https://media.api-sports.io/football/leagues/3.png"
        default:
            leagueName = "League \(leagueId)"
            leagueCountry = "Unknown"
            leagueLogo = "https://media.api-sports.io/football/leagues/\(leagueId).png"
        }
        
        // 팀 정보 (리그별로 다른 팀 사용)
        var teams: [(id: Int, name: String, logo: String)] = []
        
        // 리그 ID에 따라 팀 설정
        switch leagueId {
        case 39: // 프리미어 리그
            teams = [
                (id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png"),
                (id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png"),
                (id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png"),
                (id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png")
            ]
        case 140: // 라리가
            teams = [
                (id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png"),
                (id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png"),
                (id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png"),
                (id: 532, name: "Valencia", logo: "https://media.api-sports.io/football/teams/532.png")
            ]
        case 135: // 세리에 A
            teams = [
                (id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png"),
                (id: 505, name: "Inter", logo: "https://media.api-sports.io/football/teams/505.png"),
                (id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png"),
                (id: 497, name: "AS Roma", logo: "https://media.api-sports.io/football/teams/497.png")
            ]
        case 78: // 분데스리가
            teams = [
                (id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png"),
                (id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png"),
                (id: 160, name: "SC Freiburg", logo: "https://media.api-sports.io/football/teams/160.png"),
                (id: 173, name: "RB Leipzig", logo: "https://media.api-sports.io/football/teams/173.png")
            ]
        case 61: // 리그 1
            teams = [
                (id: 85, name: "Paris Saint Germain", logo: "https://media.api-sports.io/football/teams/85.png"),
                (id: 91, name: "Monaco", logo: "https://media.api-sports.io/football/teams/91.png"),
                (id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png"),
                (id: 80, name: "Marseille", logo: "https://media.api-sports.io/football/teams/80.png")
            ]
        case 2: // 챔피언스 리그
            teams = [
                (id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png"),
                (id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png"),
                (id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png"),
                (id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png")
            ]
        case 3: // 유로파 리그
            teams = [
                (id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png"),
                (id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png"),
                (id: 497, name: "AS Roma", logo: "https://media.api-sports.io/football/teams/497.png"),
                (id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png")
            ]
        default:
            teams = [
                (id: 1000 + leagueId, name: "Team A", logo: "https://media.api-sports.io/football/teams/33.png"),
                (id: 2000 + leagueId, name: "Team B", logo: "https://media.api-sports.io/football/teams/40.png")
            ]
        }
        
        // 경기 시간 생성 (12:00 ~ 22:00)
        var fixtures: [Fixture] = []
        let matchTimes = [
            "12:00", "14:30", "17:00", "19:30", "22:00"
        ]
        
        // 경기 수 결정 (1-2개)
        let matchCount = min(2, teams.count / 2)
        
        // 경기 생성
        for i in 0..<matchCount {
            // 팀 선택
            let homeTeamIndex = i * 2
            let awayTeamIndex = i * 2 + 1
            
            // 인덱스 범위 확인
            guard homeTeamIndex < teams.count && awayTeamIndex < teams.count else {
                continue
            }
            
            let homeTeam = teams[homeTeamIndex]
            let awayTeam = teams[awayTeamIndex]
            
            // 경기 시간 선택
            let timeIndex = i % matchTimes.count
            let matchTime = matchTimes[timeIndex]
            
            // 날짜 문자열 생성
            let matchDateString = "\(date)T\(matchTime):00+00:00"
            
            // 경기 ID 생성 (고유한 ID 생성)
            let fixtureId = Int.random(in: 1000000..<9999999)
            
            // 경기 생성
            let fixture = Fixture(
                fixture: FixtureDetails(
                    id: fixtureId,
                    date: matchDateString,
                    status: FixtureStatus(
                        long: "Not Started",
                        short: "NS",
                        elapsed: nil
                    ),
                    venue: Venue(
                        id: 1000 + i,
                        name: "\(homeTeam.name) Stadium",
                        city: leagueCountry
                    ),
                    timezone: "UTC",
                    referee: generateRefereeNameForLeague(leagueId)
                ),
                league: LeagueFixtureInfo(
                    id: leagueId,
                    name: leagueName,
                    country: leagueCountry,
                    logo: leagueLogo,
                    flag: nil,
                    season: season,
                    round: "Regular Season - \(Int.random(in: 1...38))",
                    standings: true
                ),
                teams: Teams(
                    home: Team(
                        id: homeTeam.id,
                        name: homeTeam.name,
                        logo: homeTeam.logo,
                        winner: nil
                    ),
                    away: Team(
                        id: awayTeam.id,
                        name: awayTeam.name,
                        logo: awayTeam.logo,
                        winner: nil
                    )
                ),
                goals: Goals(
                    home: nil,
                    away: nil
                )
            )
            
            fixtures.append(fixture)
        }
        
        print("✅ 리그 \(leagueId)에 대한 더미 경기 일정 생성 완료: \(fixtures.count)개")
        return fixtures
    }
    
    // 더미 경기 일정 생성 함수 (날짜 기준)
    private func createDummyFixtures(for date: Date) -> [Fixture] {
        print("🔄 더미 경기 일정 생성 시작: \(formatDateForAPI(date))")
        
        // 날짜 정보
        let dateString = formatDateForAPI(date)
        
        // 주요 리그에 대한 더미 데이터 생성
        let mainLeagues = [39, 140, 135, 78, 61, 2, 3]
        var allFixtures: [Fixture] = []
        
        for leagueId in mainLeagues {
            let leagueFixtures = createDummyFixturesForLeague(leagueId: leagueId, date: dateString, season: getCurrentSeason())
            allFixtures.append(contentsOf: leagueFixtures)
        }
        
        print("✅ 더미 경기 일정 생성 완료: \(allFixtures.count)개")
        return allFixtures
    }
    
    // 팀 정보를 포함한 더미 경기 일정 생성 함수
    private func createDummyFixturesWithTeams(for date: Date) -> [Fixture] {
        print("🔄 팀 정보를 포함한 더미 경기 일정 생성 시작: \(formatDateForAPI(date))")
        
        // 날짜 정보
        let dateString = formatDateForAPI(date)
        
        // 리그 정보 정의
        let leagues = [
            LeagueFixtureInfo(id: 39, name: "Premier League", country: "England", logo: "https://media.api-sports.io/football/leagues/39.png", flag: nil, season: getCurrentSeason(), round: "Regular Season", standings: true),
            LeagueFixtureInfo(id: 140, name: "La Liga", country: "Spain", logo: "https://media.api-sports.io/football/leagues/140.png", flag: nil, season: getCurrentSeason(), round: "Regular Season", standings: true),
            LeagueFixtureInfo(id: 135, name: "Serie A", country: "Italy", logo: "https://media.api-sports.io/football/leagues/135.png", flag: nil, season: getCurrentSeason(), round: "Regular Season", standings: true),
            LeagueFixtureInfo(id: 78, name: "Bundesliga", country: "Germany", logo: "https://media.api-sports.io/football/leagues/78.png", flag: nil, season: getCurrentSeason(), round: "Regular Season", standings: true),
            LeagueFixtureInfo(id: 61, name: "Ligue 1", country: "France", logo: "https://media.api-sports.io/football/leagues/61.png", flag: nil, season: getCurrentSeason(), round: "Regular Season", standings: true),
            LeagueFixtureInfo(id: 2, name: "UEFA Champions League", country: "UEFA", logo: "https://media.api-sports.io/football/leagues/2.png", flag: nil, season: getCurrentSeason(), round: "Group Stage", standings: true),
            LeagueFixtureInfo(id: 3, name: "UEFA Europa League", country: "UEFA", logo: "https://media.api-sports.io/football/leagues/3.png", flag: nil, season: getCurrentSeason(), round: "Group Stage", standings: true)
        ]
        
        // 팀 정보 정의
        let teams = [
            // 프리미어 리그 팀
            [(id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png"),
             (id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png"),
             (id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png"),
             (id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png"),
             (id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png"),
             (id: 49, name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png")],
            
            // 라리가 팀
            [(id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png"),
             (id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png"),
             (id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png"),
             (id: 532, name: "Valencia", logo: "https://media.api-sports.io/football/teams/532.png"),
             (id: 536, name: "Sevilla", logo: "https://media.api-sports.io/football/teams/536.png"),
             (id: 543, name: "Real Betis", logo: "https://media.api-sports.io/football/teams/543.png")],
            
            // 세리에 A 팀
            [(id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png"),
             (id: 505, name: "Inter", logo: "https://media.api-sports.io/football/teams/505.png"),
             (id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png"),
             (id: 497, name: "AS Roma", logo: "https://media.api-sports.io/football/teams/497.png"),
             (id: 492, name: "Napoli", logo: "https://media.api-sports.io/football/teams/492.png"),
             (id: 487, name: "Lazio", logo: "https://media.api-sports.io/football/teams/487.png")],
            
            // 분데스리가 팀
            [(id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png"),
             (id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png"),
             (id: 173, name: "RB Leipzig", logo: "https://media.api-sports.io/football/teams/173.png"),
             (id: 169, name: "Eintracht Frankfurt", logo: "https://media.api-sports.io/football/teams/169.png"),
             (id: 160, name: "SC Freiburg", logo: "https://media.api-sports.io/football/teams/160.png"),
             (id: 168, name: "Bayer Leverkusen", logo: "https://media.api-sports.io/football/teams/168.png")],
            
            // 리그 1 팀
            [(id: 85, name: "Paris Saint Germain", logo: "https://media.api-sports.io/football/teams/85.png"),
             (id: 91, name: "Monaco", logo: "https://media.api-sports.io/football/teams/91.png"),
             (id: 80, name: "Marseille", logo: "https://media.api-sports.io/football/teams/80.png"),
             (id: 94, name: "Rennes", logo: "https://media.api-sports.io/football/teams/94.png"),
             (id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png"),
             (id: 95, name: "Lyon", logo: "https://media.api-sports.io/football/teams/95.png")],
             
            // 챔피언스 리그 팀
            [(id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png"),
             (id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png"),
             (id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png"),
             (id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png")],
             
            // 유로파 리그 팀
            [(id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png"),
             (id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png"),
             (id: 497, name: "AS Roma", logo: "https://media.api-sports.io/football/teams/497.png"),
             (id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png")]
        ]
        
        // 경기 시간 정의
        let matchTimes = ["12:00", "14:30", "17:00", "19:30", "22:00"]
        
        // 각 리그별로 2-3개의 경기 생성
        var fixturesList: [Fixture] = []
        
        for (leagueIndex, league) in leagues.enumerated() {
            // 이 리그의 팀 목록
            let leagueTeams = teams[leagueIndex]
            
            // 경기 수 결정 (2-3개)
            let matchCount = Int.random(in: 2...3)
            
            for i in 0..<matchCount {
                // 홈팀과 원정팀 선택 (중복 방지)
                let homeIndex = i * 2 % leagueTeams.count
                let awayIndex = (i * 2 + 1) % leagueTeams.count
                
                let homeTeam = leagueTeams[homeIndex]
                let awayTeam = leagueTeams[awayIndex]
                
                // 경기 시간 설정
                let timeIndex = (leagueIndex + i) % matchTimes.count
                let matchTime = matchTimes[timeIndex]
                let matchDateString = "\(dateString)T\(matchTime):00+00:00"
                
                // 경기 상태 설정 (예정된 경기)
                let fixtureStatus = FixtureStatus(
                    long: "Not Started",
                    short: "NS",
                    elapsed: nil
                )
                
                // 경기 정보 생성
                let fixture = Fixture(
                    fixture: FixtureDetails(
                        id: Int.random(in: 1000000...9999999),
                        date: matchDateString,
                        status: fixtureStatus,
                        venue: Venue(id: nil, name: nil, city: nil),
                        timezone: "UTC",
                        referee: generateRefereeNameForLeague(league.id)
                    ),
                    league: LeagueFixtureInfo(
                        id: league.id,
                        name: league.name,
                        country: league.country,
                        logo: league.logo,
                        flag: nil,
                        season: getCurrentSeason(),
                        round: "Regular Season - \(Int.random(in: 1...38))",
                        standings: false
                    ),
                    teams: Teams(
                        home: Team(
                            id: homeTeam.id,
                            name: homeTeam.name,
                            logo: homeTeam.logo,
                            winner: nil
                        ),
                        away: Team(
                            id: awayTeam.id,
                            name: awayTeam.name,
                            logo: awayTeam.logo,
                            winner: nil
                        )
                    ),
                    goals: Goals(
                        home: nil,
                        away: nil
                    )
                )
                
                fixturesList.append(fixture)
            }
        }
        
        print("✅ 더미 경기 일정 생성 완료: \(fixturesList.count)개")
        return fixturesList
    }
    
    // 리그별 심판 이름 생성 함수
    private func generateRefereeNameForLeague(_ leagueId: Int) -> String? {
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
            return nil
        }
    }
    
    // 특정 날짜에 대한 경기 일정 로드 (UI 업데이트 포함)
    @MainActor
    public func loadFixturesForDate(_ date: Date, forceRefresh: Bool = false) async {
        print("🔍 디버그: loadFixturesForDate 시작 - 날짜: \(formatDateForAPI(date)), 강제 새로고침: \(forceRefresh)")
        
        // 이미 로딩 중인 날짜인지 확인
        if loadingDates.contains(date) {
            print("⚠️ 이미 로딩 중인 날짜입니다: \(formatDateForAPI(date))")
            return
        }
        
        // 먼 미래 날짜 처리 (현재로부터 3개월 이상 미래인 경우)
        let today = calendar.startOfDay(for: Date())
        let threeMonthsLater = calendar.date(byAdding: .month, value: 3, to: today)!
        
        if date > threeMonthsLater {
            print("⚠️ 먼 미래 날짜입니다. 빈 데이터로 처리합니다: \(formatDateForAPI(date))")
            // 빈 데이터로 처리 (더미 데이터 대신)
            fixtures[date] = []
            emptyDates[date] = "해당 날짜의 경기 일정은 아직 확정되지 않았습니다."
            
            // 알림 발송 (UI 업데이트를 위해)
            NotificationCenter.default.post(
                name: NSNotification.Name("FixturesLoadingCompleted"),
                object: nil,
                userInfo: ["date": date, "empty": true]
            )
            return
        }
        
        // 날짜 문자열 생성
        let dateString = formatDateForAPI(date)
        
        // 1. 먼저 CoreData에서 데이터 확인
        if !forceRefresh {
            if let coreDataFixtures = CoreDataManager.shared.loadFixtures(for: dateString) {
                print("✅ CoreData에서 데이터 로드 성공: \(dateString) (\(coreDataFixtures.count)개)")
                fixtures[date] = coreDataFixtures
                
                // 빈 응답인 경우 UI에 표시
                if coreDataFixtures.isEmpty {
                    emptyDates[date] = "해당일에 예정된 경기가 없습니다."
                    print("ℹ️ CoreData에서 빈 응답 데이터 로드: \(dateString)")
                } else {
                    emptyDates[date] = nil
                }
                
                // 알림 발송 (UI 업데이트를 위해)
                NotificationCenter.default.post(
                    name: NSNotification.Name("FixturesLoadingCompleted"),
                    object: nil,
                    userInfo: ["date": date, "source": "coredata"]
                )
                
                // 백그라운드에서 최신 데이터 확인 (오늘 날짜이거나 라이브 경기가 있는 경우)
                let isToday = calendar.isDate(date, inSameDayAs: today)
                let hasLiveMatches = coreDataFixtures.contains { fixture in
                    liveStatuses.contains(fixture.fixture.status.short)
                }
                
                if isToday || hasLiveMatches {
                    Task {
                        await loadFixturesFromAPI(date: date, dateString: dateString, forceRefresh: true)
                    }
                }
                
                return
            } else {
                print("ℹ️ CoreData에 데이터 없음: \(dateString)")
            }
        }
        
        // 오늘 날짜인지 확인
        let isToday = calendar.isDate(date, inSameDayAs: today)
        print("🔍 디버그: 오늘 날짜 여부: \(isToday)")
        
        // 오늘 날짜이거나 라이브 경기가 있는 경우 강제 새로고침
        var shouldForceRefresh = forceRefresh
        
        // 라이브 경기가 있는지 확인
        let hasLiveMatches = fixtures[date]?.contains { fixture in
            liveStatuses.contains(fixture.fixture.status.short)
        } ?? false
        print("🔍 디버그: 라이브 경기 있음: \(hasLiveMatches)")
        
        // 오늘 날짜이거나 라이브 경기가 있으면 강제 새로고침
        if isToday || hasLiveMatches {
            shouldForceRefresh = true
            print("🔄 오늘 날짜 또는 라이브 경기가 있어 강제 새로고침: \(formatDateForAPI(date))")
        }
        
        // 로딩 중인 날짜 목록에 추가
        loadingDates.insert(date)
        
        // 빈 응답 상태 초기화
        emptyDates[date] = nil
        
        // 캐시된 데이터 가져오기
        let cachedData = self.cachedFixtures[dateString]
        
        // 데이터가 없는 경우 빈 배열 설정 (더미 데이터 대신)
        if fixtures[date] == nil {
            print("🔄 데이터가 없어 빈 배열 설정: \(dateString)")
            fixtures[date] = []
        }
        
        // API에서 데이터 로드
        await loadFixturesFromAPI(date: date, dateString: dateString, forceRefresh: shouldForceRefresh)
    }
    
    // API에서 경기 일정 로드 (분리된 메서드)
    @MainActor
    private func loadFixturesFromAPI(date: Date, dateString: String, forceRefresh: Bool) async {
        // 캐시된 데이터 가져오기
        let cachedData = self.cachedFixtures[dateString]
        
        // 타임아웃 처리를 위한 Task 생성
        let task = Task {
            do {
                // 경기 일정 가져오기
                let fixturesForDate = try await fetchFixturesForDate(date, forceRefresh: forceRefresh)
                
                // 작업이 취소되었는지 확인
                if Task.isCancelled {
                    print("⚠️ 작업이 취소되었습니다: \(dateString)")
                    // 작업이 취소되어도 로딩 상태 제거
                    await MainActor.run {
                        loadingDates.remove(date)
                    }
                    return
                }
                
                // UI 업데이트
                await MainActor.run {
                    // 경기 일정 업데이트 (API에서 가져온 실제 데이터로 교체)
                    fixtures[date] = fixturesForDate
                    
                    // 빈 응답인 경우 UI에 표시
                    if fixturesForDate.isEmpty {
                        emptyDates[date] = "해당일에 예정된 경기가 없습니다."
                        print("ℹ️ API에서 빈 응답 데이터 로드: \(dateString)")
                    } else {
                        emptyDates[date] = nil
                    }
                    
                    // 로딩 중인 날짜 목록에서 제거
                    loadingDates.remove(date)
                    
                    // 로그 출력
                    print("✅ 경기 일정 로드 완료: \(dateString) (\(fixturesForDate.count)개)")
                    
                    // 알림 발송 (UI 업데이트를 위해)
                    NotificationCenter.default.post(
                        name: NSNotification.Name("FixturesLoadingCompleted"),
                        object: nil,
                        userInfo: ["date": date, "source": "api"]
                    )
                }
            } catch let error as FootballAPIError {
                // 작업이 취소되었는지 확인
                if Task.isCancelled {
                    print("⚠️ 작업이 취소되었습니다: \(dateString)")
                    // 작업이 취소되어도 로딩 상태 제거
                    await MainActor.run {
                        loadingDates.remove(date)
                    }
                    return
                }
                
                // 중복 요청 에러 처리
                if case .requestInProgress = error {
                    await MainActor.run {
                        print("⚠️ 중복 요청 에러 감지: \(dateString)")
                        
                        // 캐시된 데이터가 있으면 사용
                        if let cachedData = cachedData, !cachedData.isEmpty {
                            fixtures[date] = cachedData
                            print("✅ 중복 요청 에러, 캐시된 데이터 사용: \(dateString) (\(cachedData.count)개)")
                        }
                        
                        // 로딩 중인 날짜 목록에서 제거
                        loadingDates.remove(date)
                        
                        // 알림 발송 (UI 업데이트를 위해)
                        NotificationCenter.default.post(
                            name: NSNotification.Name("FixturesLoadingCompleted"),
                            object: nil,
                            userInfo: ["date": date, "error": true]
                        )
                    }
                    return
                }
                
                // 에러 처리
                await MainActor.run {
                    // 빈 응답 에러 처리
                    if case .emptyResponse(_) = error {
                        // 빈 응답 메시지 설정
                        emptyDates[date] = "해당일에 예정된 경기가 없습니다."
                        
                        // 빈 배열 설정 (더미 데이터 대신)
                        fixtures[date] = []
                        
                        print("ℹ️ 해당 날짜에 경기 일정이 없습니다: \(dateString)")
                        
                        errorMessage = nil // 일반 에러 메시지 초기화
                    } else {
                        // 일반 에러 메시지 설정
                        errorMessage = "경기 일정을 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                        print("❌ 경기 일정 로드 실패: \(dateString) - \(error.localizedDescription)")
                        
                        // 빈 배열 설정 (더미 데이터 대신)
                        fixtures[date] = []
                    }
                    
                    // 로딩 중인 날짜 목록에서 제거
                    loadingDates.remove(date)
                    
                    // 알림 발송 (UI 업데이트를 위해)
                    NotificationCenter.default.post(
                        name: NSNotification.Name("FixturesLoadingCompleted"),
                        object: nil,
                        userInfo: ["date": date, "empty": fixtures[date]?.isEmpty ?? true]
                    )
                }
            } catch let error {
                // 작업이 취소되었는지 확인
                if Task.isCancelled {
                    print("⚠️ 작업이 취소되었습니다: \(dateString)")
                    // 작업이 취소되어도 로딩 상태 제거
                    await MainActor.run {
                        loadingDates.remove(date)
                    }
                    return
                }
                
                // 기타 에러 처리
                await MainActor.run {
                    // 에러 메시지 설정
                    errorMessage = "경기 일정을 불러오는 중 오류가 발생했습니다: \(error.localizedDescription)"
                    print("❌ 경기 일정 로드 실패: \(dateString) - \(error.localizedDescription)")
                    
                    // 빈 배열 설정 (더미 데이터 대신)
                    fixtures[date] = []
                    
                    // 로딩 중인 날짜 목록에서 제거
                    loadingDates.remove(date)
                    
                    // 알림 발송 (UI 업데이트를 위해)
                    NotificationCenter.default.post(
                        name: NSNotification.Name("FixturesLoadingCompleted"),
                        object: nil,
                        userInfo: ["date": date, "error": true]
                    )
                }
            }
        }
        
        // 타임아웃 처리 (개선된 버전)
        Task {
            // 5초 타임아웃으로 단축 (10초에서 5초로 변경)
            try? await Task.sleep(nanoseconds: 5_000_000_000) // 5초
            
            // 작업이 아직 완료되지 않았다면 취소
            if loadingDates.contains(date) {
                task.cancel()
                
                // UI 업데이트
                await MainActor.run {
                    print("⏱️ 타임아웃: \(dateString)")
                    
                    // 1. 먼저 CoreData에서 데이터 확인
                    if let coreDataFixtures = CoreDataManager.shared.loadFixtures(for: dateString) {
                        fixtures[date] = coreDataFixtures
                        print("✅ 타임아웃 발생, CoreData 데이터 사용: \(dateString) (\(coreDataFixtures.count)개)")
                        
                        // 빈 응답인 경우 UI에 표시
                        if coreDataFixtures.isEmpty {
                            emptyDates[date] = "해당일에 예정된 경기가 없습니다."
                        } else {
                            emptyDates[date] = nil
                        }
                    }
                    // 2. CoreData에 없으면 캐시된 데이터 확인
                    else if let cachedData = cachedData, !cachedData.isEmpty {
                        fixtures[date] = cachedData
                        print("✅ 타임아웃 발생, 캐시된 데이터 사용: \(dateString) (\(cachedData.count)개)")
                        
                        // CoreData에도 저장 (백업)
                        CoreDataManager.shared.saveFixtures(cachedData, for: dateString)
                        
                        // 빈 응답인 경우 UI에 표시
                        if cachedData.isEmpty {
                            emptyDates[date] = "해당일에 예정된 경기가 없습니다."
                        } else {
                            emptyDates[date] = nil
                        }
                    }
                    // 3. 빈 응답으로 처리
                    else {
                        // 빈 배열 설정
                        fixtures[date] = []
                        emptyDates[date] = "경기 일정을 불러오는데 실패했습니다. 다시 시도해주세요."
                        print("⚠️ 타임아웃 발생, 빈 응답으로 처리: \(dateString)")
                    }
                    
                    // 로딩 중인 날짜 목록에서 제거
                    loadingDates.remove(date)
                    
                    // 알림 발송 (UI 업데이트를 위해)
                    NotificationCenter.default.post(
                        name: NSNotification.Name("FixturesLoadingCompleted"),
                        object: nil,
                        userInfo: ["date": date, "timeout": true, "empty": fixtures[date]?.isEmpty ?? true]
                    )
                }
            }
        }
    }
}
