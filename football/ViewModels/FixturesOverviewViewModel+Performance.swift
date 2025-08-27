import Foundation
import SwiftUI

// MARK: - Performance Optimized Extension
extension FixturesOverviewViewModel {
    
    /// 성능 최적화된 날짜 선택 메서드
    @MainActor
    func selectDateOptimized(_ date: Date) async {
        // 이전 작업 취소
        dateSelectionTask?.cancel()
        
        // 동일 날짜 재선택시 스킵
        if calendar.isDate(selectedDate, inSameDayAs: date) && fixtures[date]?.isEmpty == false {
            print("✅ 동일 날짜 재선택 - 스킵")
            return
        }
        
        selectedDate = date
        
        dateSelectionTask = Task { @MainActor in
            let dateString = formatDateForAPI(date)
            
            // 1. 메모리 캐시 확인 - 즉시 표시
            if let cached = getCachedFixtures(for: dateString) {
                fixtures[date] = cached
                print("✅ 캐시 즉시 로드: \(dateString) (\(cached.count)개)")
                
                // 라이브 경기가 있거나 오늘인 경우만 백그라운드 갱신
                if shouldRefreshInBackground(date: date, fixtures: cached) {
                    Task.detached(priority: .background) {
                        await self.refreshFixturesInBackground(for: date)
                    }
                }
                return
            }
            
            // 2. 로딩 표시 최소화
            if fixtures[date] == nil {
                isShowingSkeleton = true
            }
            
            // 3. 최적화된 데이터 로드
            await loadFixturesWithPerformance(for: date)
            isShowingSkeleton = false
        }
    }
    
    /// 성능 최적화된 데이터 로드
    @MainActor
    private func loadFixturesWithPerformance(for date: Date) async {
        let dateString = formatDateForAPI(date)
        let key = "perf_\(dateString)"
        
        // 중복 요청 방지
        if let existing = activeTasks[key] {
            _ = await existing.value
            return
        }
        
        let task = Task { @MainActor in
            do {
                // 필수 리그만 요청 (5개로 제한)
                let essentialLeagues = getEssentialLeagues()
                
                print("⚡ 최적화 요청: \(essentialLeagues.count)개 리그")
                
                // Supabase Edge Function으로 캐시된 데이터 요청
                let fixtures = try await fetchFromSupabase(
                    date: dateString,
                    leagueIds: essentialLeagues
                )
                
                // UI 업데이트
                self.fixtures[date] = fixtures
                
                // 캐시 저장
                updateCache(dateString: dateString, fixtures: fixtures)
                
            } catch {
                print("❌ 데이터 로드 실패: \(error)")
                // 실패시 빈 배열 설정
                fixtures[date] = []
            }
            
            activeTasks.removeValue(forKey: key)
        }
        
        activeTasks[key] = task
        _ = await task.value
    }
    
    /// 필수 리그만 반환 (성능 최적화)
    private func getEssentialLeagues() -> [Int] {
        var leagues: [Int] = []
        
        // 사용자 팔로우 리그 (최대 3개)
        let followedLeagues = leagueFollowService.followedLeagues
            .prefix(3)
            .map { $0.id }
        leagues.append(contentsOf: followedLeagues)
        
        // 주요 리그 추가 (전체 5개가 되도록)
        let majorLeagues = [39, 140] // 프리미어리그, 라리가만
        for league in majorLeagues {
            if leagues.count < 5 && !leagues.contains(league) {
                leagues.append(league)
            }
        }
        
        return leagues
    }
    
    /// Supabase에서 캐시된 데이터 가져오기
    private func fetchFromSupabase(date: String, leagueIds: [Int]) async throws -> [Fixture] {
        // Supabase Edge Function 사용
        if AppConfiguration.shared.useSupabaseEdgeFunctions {
            return try await service.fetchFixturesBatchFromSupabase(
                date: date,
                leagueIds: leagueIds
            )
        }
        
        // 직접 API 호출 (폴백)
        let response = try await service.fetchFixturesBatchOptimized(
            date: date,
            leagueIds: leagueIds,
            season: nil
        )
        return sortFixturesByPriority(response.response)
    }
    
    /// 백그라운드 갱신 필요 여부 체크
    private func shouldRefreshInBackground(date: Date, fixtures: [Fixture]) -> Bool {
        // 오늘 날짜인 경우
        if calendar.isDateInToday(date) {
            return true
        }
        
        // 라이브 경기가 있는 경우
        let hasLive = fixtures.contains { fixture in
            liveStatuses.contains(fixture.fixture.status.short)
        }
        
        return hasLive
    }
    
    /// 백그라운드에서 데이터 갱신
    @MainActor
    private func refreshFixturesInBackground(for date: Date) async {
        let dateString = formatDateForAPI(date)
        
        do {
            let freshFixtures = try await fetchFromSupabase(
                date: dateString,
                leagueIds: getEssentialLeagues()
            )
            
            // UI 업데이트 (메인 스레드)
            await MainActor.run {
                if !freshFixtures.isEmpty {
                    fixtures[date] = freshFixtures
                    updateCache(dateString: dateString, fixtures: freshFixtures)
                }
            }
        } catch {
            print("⚠️ 백그라운드 갱신 실패: \(error)")
        }
    }
    
    /// 캐시 가져오기 (유효성 체크 포함)
    private func getCachedFixtures(for dateString: String) -> [Fixture]? {
        guard let cached = cachedFixtures[dateString],
              !cached.isEmpty else { return nil }
        
        // 캐시 유효시간 체크 (더 길게 설정)
        guard let cacheDate = cacheDates[dateString] else { return cached }
        
        let cacheAge = Date().timeIntervalSince(cacheDate)
        let maxAge: TimeInterval = calendar.isDateInToday(parseDateFromAPI(dateString) ?? Date()) ? 300 : 3600 // 오늘: 5분, 다른날: 1시간
        
        if cacheAge < maxAge {
            return cached
        }
        
        return nil
    }
    
    /// 캐시 업데이트
    private func updateCache(dateString: String, fixtures: [Fixture]) {
        cachedFixtures[dateString] = fixtures
        cacheDates[dateString] = Date()
        
        // CoreData 저장 (백그라운드)
        Task.detached(priority: .background) {
            await self.saveCachedFixtures(for: dateString)
        }
    }
    
    /// 메모리 정리 (더 효율적으로)
    func cleanupMemoryEfficient() {
        let now = Date()
        guard let cutoffDate = calendar.date(byAdding: .day, value: -3, to: now) else { return }
        
        // 3일 이상 된 데이터만 제거
        cachedFixtures = cachedFixtures.filter { dateString, _ in
            guard let date = parseDateFromAPI(dateString) else { return false }
            return date >= cutoffDate
        }
        
        // 취소된 작업 제거
        activeTasks = activeTasks.filter { _, task in
            !task.isCancelled
        }
        
        print("🧹 메모리 정리: \(cachedFixtures.count)개 캐시 유지")
    }
}

// MARK: - Scroll Performance
extension FixturesOverviewViewModel {
    
    /// 스크롤 성능 최적화를 위한 프리페치
    @MainActor
    func prefetchForScroll(dates: [Date]) async {
        // 보이는 날짜 중 캐시가 없는 것만 선택
        let datesToPrefetch = dates.filter { date in
            let dateString = formatDateForAPI(date)
            return cachedFixtures[dateString] == nil
        }.prefix(2) // 최대 2개만 프리페치
        
        for date in datesToPrefetch {
            // 낮은 우선순위로 백그라운드 로드
            Task.detached(priority: .background) {
                await self.loadFixturesWithPerformance(for: date)
            }
        }
    }
    
    /// 날짜 범위 확장 (더 효율적으로)
    func expandDateRangeEfficiently() {
        guard visibleDateRange.count < 30 else { return } // 최대 30일로 제한
        
        // 앞뒤로 3일씩만 추가
        if let firstDate = visibleDateRange.first,
           let _ = calendar.date(byAdding: .day, value: -3, to: firstDate) {
            let newDates = (1...3).compactMap {
                calendar.date(byAdding: .day, value: -$0, to: firstDate)
            }.reversed()
            visibleDateRange.insert(contentsOf: newDates, at: 0)
        }
        
        if let lastDate = visibleDateRange.last,
           let _ = calendar.date(byAdding: .day, value: 3, to: lastDate) {
            let newDates = (1...3).compactMap {
                calendar.date(byAdding: .day, value: $0, to: lastDate)
            }
            visibleDateRange.append(contentsOf: newDates)
        }
    }
}

// MARK: - Scene Phase Handling
extension FixturesOverviewViewModel {
    
    /// ScenePhase 변경 처리 (성능 최적화)
    func handleScenePhaseChangeOptimized(newPhase: ScenePhase, oldPhase: ScenePhase) {
        switch newPhase {
        case .active:
            if oldPhase == .background {
                // 백그라운드에서 돌아올 때 현재 날짜만 갱신
                Task { @MainActor in
                    if calendar.isDateInToday(selectedDate) {
                        await refreshFixturesInBackground(for: selectedDate)
                    }
                }
            }
            
        case .background:
            // 백그라운드 진입시 불필요한 작업 취소
            cancelNonEssentialTasks()
            
        case .inactive:
            break
            
        @unknown default:
            break
        }
    }
    
    /// 필수적이지 않은 작업 취소
    private func cancelNonEssentialTasks() {
        // 프리페치 작업 취소
        prefetchTask?.cancel()
        
        // 활성 작업 중 오늘이 아닌 날짜의 작업 취소
        for (key, task) in activeTasks {
            if !key.contains(formatDateForAPI(Date())) {
                task.cancel()
            }
        }
        
        // 메모리 정리
        cleanupMemoryEfficient()
    }
}