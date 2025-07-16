import Foundation
import SwiftUI

// MARK: - Optimized Loading Methods
extension FixturesOverviewViewModel {
    
    /// 최적화된 배치 요청을 사용한 경기 일정 로드
    @MainActor
    func loadFixturesOptimized(for date: Date, forceRefresh: Bool = false) async {
        // 이미 로딩 중이면 중복 요청 방지
        let dateString = formatDateForAPI(date)
        let loadingKey = "batch_\(dateString)"
        
        // 중복 요청 방지 - 강제 새로고침이 아닌 경우에만
        if !forceRefresh && loadingTasks[loadingKey] != nil {
            print("⚠️ 이미 로딩 중: \(dateString)")
            return
        }
        
        // 진행 중인 작업이 있으면 취소
        loadingTasks[loadingKey]?.cancel()
        loadingTasks.removeValue(forKey: loadingKey)
        
        // 캐시된 데이터가 있으면 즉시 UI에 표시
        if let cachedData = cachedFixtures[dateString], !cachedData.isEmpty {
            fixtures[date] = cachedData
            print("✅ 캐시 데이터 즉시 표시: \(dateString) (\(cachedData.count)개)")
            
            // 캐시가 1시간 이내면 API 호출 스킵
            if !forceRefresh, let cacheDate = cacheDates[dateString], 
               Date().timeIntervalSince(cacheDate) < 3600 {
                print("⏩ 캐시가 유효하여 API 호출 스킵")
                return
            }
        }
        
        // 로딩 상태 설정 (캐시가 없을 때만)
        if fixtures[date]?.isEmpty ?? true {
            isLoading = true
        }
        errorMessage = nil
        
        // 로딩 작업 생성
        let task = Task {
            defer {
                isLoading = false
                loadingTasks.removeValue(forKey: loadingKey)
            }
            
            do {
                // 우선순위별 리그 그룹 정의
                let primaryLeagues = getPreferredLeagues() // 사용자 선호 리그
                let secondaryLeagues = [39, 140, 135, 78, 61] // 5대 리그
                let tertiaryLeagues = [94, 88, 203, 144, 179] // 기타 주요 리그
                let koreanLeagues = [292, 293] // K리그
                let internationalLeagues = [2, 3, 848, 537] // 챔스, 유로파 등
                
                // 7월에는 여름 리그 추가
                let calendar = Calendar.current
                let month = calendar.component(.month, from: date)
                var summerLeagues: [Int] = []
                if month == 7 {
                    summerLeagues = [253, 71, 307, 15] // MLS, 브라질, 사우디, 클럽월드컵
                    print("🌞 7월 - 여름 리그 추가: MLS(253), 브라질(71), 사우디(307), 클럽월드컵(15)")
                }
                
                // 모든 리그 ID 수집 (중복 제거)
                var allLeagues = Set<Int>()
                allLeagues.formUnion(primaryLeagues)
                allLeagues.formUnion(secondaryLeagues)
                allLeagues.formUnion(tertiaryLeagues)
                allLeagues.formUnion(koreanLeagues)
                allLeagues.formUnion(internationalLeagues)
                allLeagues.formUnion(summerLeagues)
                
                let leagueIds = Array(allLeagues)
                
                print("🚀 배치 요청 시작: \(leagueIds.count)개 리그")
                
                // 배치 API 요청 (최적화된 버전 사용)
                let startTime = Date()
                
                // 최적화된 병렬 처리 배치 요청 사용
                let fixturesResponse = try await service.fetchFixturesBatchOptimized(
                    date: dateString,
                    leagueIds: leagueIds,
                    season: nil // 각 리그별로 자동 계산
                )
                
                let elapsed = Date().timeIntervalSince(startTime)
                print("✅ 배치 요청 완료: \(String(format: "%.2f", elapsed))초에 \(fixturesResponse.response.count)개 경기 로드")
                
                // 결과 정렬 및 캐시 저장
                let sortedFixtures = sortFixturesByPriority(fixturesResponse.response)
                
                // UI 업데이트
                fixtures[date] = sortedFixtures
                
                // 캐시 저장
                cachedFixtures[dateString] = sortedFixtures
                cacheDates[dateString] = Date()
                saveCachedFixtures(for: dateString)
                
                // 라이브 경기 추적 업데이트
                updateLiveMatchTracking(fixtures: sortedFixtures)
                
                // 스마트 프리페치 (백그라운드에서 실행)
                Task {
                    await smartPrefetch(around: date)
                }
                
            } catch {
                print("❌ 배치 요청 실패: \(error)")
                errorMessage = error.localizedDescription
                
                // 오류 시 캐시된 데이터 표시
                if let cached = cachedFixtures[dateString] {
                    fixtures[date] = cached
                }
            }
        }
        
        loadingTasks[loadingKey] = task
    }
    
    /// 스마트 프리페칭 - ±2일만 미리 로드
    @MainActor
    func smartPrefetch(around date: Date) async {
        print("🧠 스마트 프리페치 시작")
        
        // 주말이면 3일, 평일이면 2일 프리페치
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: date)
        let isWeekend = weekday == 1 || weekday == 7
        let prefetchDays = isWeekend ? 3 : 2
        
        // 프리페치 범위 설정
        let range = -prefetchDays...prefetchDays
        
        // 동시 실행을 위한 태스크 그룹 사용
        await withTaskGroup(of: Void.self) { group in
            for dayOffset in range where dayOffset != 0 { // 오늘은 제외
                let targetDate = calendar.date(byAdding: .day, value: dayOffset, to: date)!
                let dateString = formatDateForAPI(targetDate)
                
                // 이미 캐시가 있고 1시간 이내면 스킵
                if let cacheDate = cacheDates[dateString],
                   Date().timeIntervalSince(cacheDate) < 3600 {
                    continue
                }
                
                group.addTask { [weak self] in
                    await self?.loadFixturesOptimized(for: targetDate)
                }
            }
        }
        
        print("✅ 스마트 프리페치 완료")
        
        // 프리페치 후 메모리 정리
        cleanupMemory()
    }
    
    /// 메모리 최적화 - 오래된 데이터 정리
    func cleanupMemory() {
        let now = Date()
        let calendar = Calendar.current
        
        // 7일 이상 된 데이터 제거
        cachedFixtures = cachedFixtures.filter { dateString, _ in
            guard let date = parseDateFromAPI(dateString) else { return false }
            let days = calendar.dateComponents([.day], from: date, to: now).day ?? 0
            return abs(days) <= 7
        }
        
        // 캐시 날짜 정보도 정리
        cacheDates = cacheDates.filter { dateString, _ in
            cachedFixtures[dateString] != nil
        }
        
        // CoreData 정리 - 향후 구현 예정
        // Task {
        //     await coreDataManager.clearOldFixtures(olderThan: 7 * 24) // 7일
        // }
        
        print("🧹 메모리 정리 완료: \(cachedFixtures.count)개 날짜 캐시 유지")
    }
    
    /// 날짜 문자열을 Date로 변환
    private func parseDateFromAPI(_ dateString: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        return formatter.date(from: dateString)
    }
}

// MARK: - Request Deduplication
extension FixturesOverviewViewModel {
    
    /// 진행 중인 요청이 있으면 기다리고, 없으면 새로 시작
    @MainActor
    func deduplicatedLoad(for date: Date) async {
        let key = formatDateForAPI(date)
        
        // 이미 진행 중인 요청이 있으면 기다림
        if let existingTask = loadingTasks[key] {
            print("♻️ 기존 요청 재사용: \(key)")
            await existingTask.value
            return
        }
        
        // 새 요청 시작
        await loadFixturesOptimized(for: date)
    }
}