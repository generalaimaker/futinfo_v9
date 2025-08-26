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
            
            // 캐시가 30분 이내면 API 호출 스킵 (1시간에서 30분으로 단축)
            if !forceRefresh, let cacheDate = cacheDates[dateString], 
               Date().timeIntervalSince(cacheDate) < 1800 {
                print("⏩ 캐시가 유효하여 API 호출 스킵 (30분 이내)")
                return
            }
        }
        
        // 로딩 상태 설정 (캐시가 없을 때만 로딩 표시)
        if fixtures[date]?.isEmpty ?? true {
            isLoading = true
        } else {
            // 캐시가 있으면 로딩 표시 안함 (백그라운드 갱신)
            isLoading = false
        }
        errorMessage = nil
        
        // 로딩 작업 생성
        let task = Task {
            defer {
                isLoading = false
                loadingTasks.removeValue(forKey: loadingKey)
            }
            
            do {
                // 우선순위별 리그 그룹 정의 - 필수 리그만 선택
                let primaryLeagues = getPreferredLeagues().prefix(3) // 사용자 선호 리그 중 상위 3개만
                let mainLeagues = [39, 140, 135, 78, 61] // 5대 리그
                let koreanLeagues = [292] // K리그1만
                
                // 중요 리그만 선택 (최대 10개)
                var selectedLeagues = Array(primaryLeagues)
                selectedLeagues.append(contentsOf: mainLeagues)
                selectedLeagues.append(contentsOf: koreanLeagues)
                
                // 중복 제거 및 최대 10개로 제한
                let limitedLeagues = Array(Set(selectedLeagues)).prefix(10)
                
                // 7월에는 여름 리그 추가
                let calendar = Calendar.current
                let month = calendar.component(.month, from: date)
                
                var finalLeagues = Array(limitedLeagues)
                if month == 7 || month == 8 {
                    // 여름 시즌 리그 추가 (MLS만)
                    finalLeagues.append(253) // MLS
                    print("🌞 여름 시즌 - MLS(253) 추가")
                }
                
                // 최종 리그 리스트 (최대 12개)
                let leagueIds = Array(Set(finalLeagues)).prefix(12).map { Int($0) }
                
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
                
                // 빈 응답도 정상 처리 (경기가 없는 날일 수 있음)
                let sortedFixtures = fixturesResponse.response.isEmpty ? [] : sortFixturesByPriority(fixturesResponse.response)
                
                // UI 업데이트 - 캐시가 있으면 병합, 없으면 새 데이터 사용
                if sortedFixtures.isEmpty && cachedFixtures[dateString] != nil {
                    // 새 데이터가 비어있고 캐시가 있으면 캐시 유지
                    print("⚠️ 빈 응답 받음 - 기존 캐시 유지")
                    fixtures[date] = cachedFixtures[dateString]!
                } else {
                    // 정상 데이터 업데이트
                    fixtures[date] = sortedFixtures
                    
                    // 캐시 저장 (빈 데이터도 저장하여 불필요한 재요청 방지)
                    cachedFixtures[dateString] = sortedFixtures
                    cacheDates[dateString] = Date()
                    saveCachedFixtures(for: dateString)
                }
                
                // 라이브 경기 추적 업데이트
                if !sortedFixtures.isEmpty {
                    updateLiveMatchTracking(fixtures: sortedFixtures)
                }
                
                // 스마트 프리페치 (백그라운드에서 실행) - 오류가 없을 때만
                if !forceRefresh {
                    Task {
                        await smartPrefetch(around: date)
                    }
                }
                
            } catch {
                print("❌ 배치 요청 실패: \(error)")
                
                // 오류 시 캐시된 데이터가 있으면 유지, 없으면 빈 배열
                if let cached = cachedFixtures[dateString], !cached.isEmpty {
                    print("✅ 오류 발생 - 캐시 데이터 사용: \(cached.count)개")
                    fixtures[date] = cached
                    errorMessage = nil // 캐시가 있으면 에러 메시지 표시 안함
                } else {
                    // 캐시도 없으면 빈 배열 설정
                    fixtures[date] = []
                    errorMessage = "경기 정보를 불러올 수 없습니다"
                }
            }
        }
        
        loadingTasks[loadingKey] = task
    }
    
    /// 스마트 프리페칭 - ±1일만 미리 로드 (API 제한 고려)
    @MainActor
    func smartPrefetch(around date: Date) async {
        print("🧠 스마트 프리페치 시작 (±1일)")
        
        // API 제한을 고려하여 ±1일만 프리페치
        let calendar = Calendar.current
        let prefetchDays = 1
        
        // 프리페치 범위 설정
        let range = [-prefetchDays, prefetchDays] // -1일, +1일만
        
        // 순차 실행으로 변경 (API 제한 방지)
        for dayOffset in range {
            let targetDate = calendar.date(byAdding: .day, value: dayOffset, to: date)!
            let dateString = formatDateForAPI(targetDate)
            
            // 이미 캐시가 있고 30분 이내면 스킵
            if let cacheDate = cacheDates[dateString],
               Date().timeIntervalSince(cacheDate) < 1800 {
                print("⏩ 프리페치 스킵 (캐시 유효): \(dateString)")
                continue
            }
            
            // 이미 데이터가 있으면 스킵
            if let existing = fixtures[targetDate], !existing.isEmpty {
                print("⏩ 프리페치 스킵 (데이터 있음): \(dateString)")
                continue
            }
            
            print("📥 프리페치 중: \(dateString)")
            await loadFixturesOptimized(for: targetDate)
            
            // API 제한 방지를 위한 대기
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1초 대기
        }
        
        print("✅ 스마트 프리페치 완료")
        
        // 프리페치 후 메모리 정리 (더 보수적으로)
        // cleanupMemory() // 일시적으로 비활성화
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