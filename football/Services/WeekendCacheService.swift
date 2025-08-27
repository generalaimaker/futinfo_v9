import Foundation
import SwiftUI

@MainActor
class WeekendCacheService {
    static let shared = WeekendCacheService()
    
    private let apiService = SupabaseFootballAPIService.shared
    private let coreDataManager = CoreDataManager.shared
    private let calendar = Calendar.current
    
    private init() {}
    
    // MARK: - 주말 날짜 계산
    
    /// 이번 주 금,토,일 날짜 반환
    func getThisWeekendDates() -> [Date] {
        let today = Date()
        let weekday = calendar.component(.weekday, from: today)
        
        // 금요일(6), 토요일(7), 일요일(1) 계산
        var weekendDates: [Date] = []
        
        // 이번 주 금요일
        let daysUntilFriday = (6 - weekday + 7) % 7
        let friday = calendar.date(byAdding: .day, value: daysUntilFriday == 0 && weekday != 6 ? 7 : daysUntilFriday, to: today)!
        
        // 금,토,일 추가
        for dayOffset in 0...2 {
            if let date = calendar.date(byAdding: .day, value: dayOffset, to: friday) {
                weekendDates.append(calendar.startOfDay(for: date))
            }
        }
        
        return weekendDates
    }
    
    /// 다음 주 금,토,일 날짜 반환
    func getNextWeekendDates() -> [Date] {
        let thisWeekend = getThisWeekendDates()
        return thisWeekend.compactMap { date in
            calendar.date(byAdding: .weekOfYear, value: 1, to: date)
        }
    }
    
    // MARK: - 주말 경기 사전 캐싱
    
    /// 주말 경기 데이터 사전 로드
    @MainActor
    func preloadWeekendFixtures() async {
        print("🏆 주말 경기 사전 로드 시작")
        
        // 이번 주말 + 다음 주말 날짜
        let weekendDates = getThisWeekendDates() + getNextWeekendDates()
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        // 주요 리그
        let majorLeagues = [39, 140, 135, 78, 61, 2, 3]
        
        for date in weekendDates {
            let dateString = dateFormatter.string(from: date)
            
            // 이미 캐시되어 있고 유효하면 건너뛰기
            if isCacheValid(for: dateString) {
                print("✅ 이미 캐시됨: \(dateString)")
                continue
            }
            
            print("📅 주말 경기 로드: \(dateString)")
            
            do {
                // 배치 요청으로 모든 리그 한번에
                let response = try await apiService.fetchFixturesBatch(
                    date: dateString,
                    leagueIds: majorLeagues
                )
                
                let fixtures = response.response
                
                if !fixtures.isEmpty {
                    // CoreData에 저장
                    coreDataManager.saveFixtures(fixtures, for: dateString)
                    
                    // 메모리 캐시도 업데이트
                    saveToMemoryCache(fixtures, for: dateString)
                    
                    print("✅ \(dateString): \(fixtures.count)개 경기 캐싱 완료")
                } else {
                    print("ℹ️ \(dateString): 경기 없음")
                }
                
                // API 제한 방지를 위한 지연
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초
                
            } catch {
                print("❌ \(dateString) 로드 실패: \(error)")
            }
        }
        
        print("🏆 주말 경기 사전 로드 완료")
    }
    
    /// 백그라운드에서 주말 경기 새로고침
    func refreshWeekendInBackground() {
        Task {
            await preloadWeekendFixtures()
        }
    }
    
    // MARK: - 캐시 관리
    
    private func isCacheValid(for dateString: String) -> Bool {
        // CoreData에서 캐시 확인
        guard let fixtures = coreDataManager.loadFixtures(for: dateString) else {
            return false
        }
        
        // 캐시가 있고 비어있지 않으면 유효
        return !fixtures.isEmpty
    }
    
    private func saveToMemoryCache(_ fixtures: [Fixture], for dateString: String) {
        // FixturesOverviewViewModel의 캐시와 동기화
        NotificationCenter.default.post(
            name: NSNotification.Name("WeekendFixturesCached"),
            object: nil,
            userInfo: [
                "dateString": dateString,
                "fixtures": fixtures
            ]
        )
    }
    
    // MARK: - 자동 실행 설정
    
    /// 앱 시작 시 자동 실행 설정
    func setupAutomaticPreloading() {
        // 1. 앱 시작 시 즉시 실행
        Task {
            await preloadWeekendFixtures()
        }
        
        // 2. 매일 새벽 3시에 실행
        scheduleDailyPreload()
        
        // 3. 앱이 포그라운드로 돌아올 때 실행
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }
    
    private func scheduleDailyPreload() {
        // 다음 새벽 3시 계산
        var dateComponents = DateComponents()
        dateComponents.hour = 3
        dateComponents.minute = 0
        
        let nextRunTime = calendar.nextDate(
            after: Date(),
            matching: dateComponents,
            matchingPolicy: .nextTime
        )
        
        guard let runTime = nextRunTime else { return }
        
        let timeInterval = runTime.timeIntervalSinceNow
        
        // Timer 설정
        Timer.scheduledTimer(withTimeInterval: timeInterval, repeats: false) { _ in
            Task { @MainActor in
                WeekendCacheService.shared.refreshWeekendInBackground()
                
                // 다음 날 다시 스케줄
                WeekendCacheService.shared.scheduleDailyPreload()
            }
        }
        
        print("📅 다음 주말 캐싱 예약: \(runTime)")
    }
    
    @objc private func appWillEnterForeground() {
        // 마지막 새로고침으로부터 1시간 이상 지났으면 새로고침
        let lastRefreshKey = "lastWeekendCacheRefresh"
        let lastRefresh = UserDefaults.standard.object(forKey: lastRefreshKey) as? Date ?? Date.distantPast
        
        if Date().timeIntervalSince(lastRefresh) > 3600 { // 1시간
            refreshWeekendInBackground()
            UserDefaults.standard.set(Date(), forKey: lastRefreshKey)
        }
    }
    
    // MARK: - 빠른 접근 메서드
    
    /// 특정 날짜가 주말인지 확인
    func isWeekend(_ date: Date) -> Bool {
        let weekday = calendar.component(.weekday, from: date)
        return weekday == 1 || weekday == 6 || weekday == 7 // 일, 금, 토
    }
    
    /// 주말 경기 빠르게 가져오기
    func getWeekendFixtures(for date: Date) -> [Fixture]? {
        guard isWeekend(date) else { return nil }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: date)
        
        // CoreData에서 먼저 확인
        return coreDataManager.loadFixtures(for: dateString)
    }
}