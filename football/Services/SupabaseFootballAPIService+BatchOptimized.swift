import Foundation

// MARK: - Optimized Batch Request with Parallel Processing
extension SupabaseFootballAPIService {
    
    /// 병렬 처리로 최적화된 배치 요청 - 직접 API 사용
    func fetchFixturesBatchOptimized(date: String, leagueIds: [Int], season: Int? = nil) async throws -> FixturesResponse {
        print("🚀 직접 API 배치 요청 시작: \(leagueIds.count)개 리그")
        
        let startTime = Date()
        var allFixtures: [Fixture] = []
        var errors: [String] = []
        
        // 오프시즌 체크 - 7월은 대부분 리그가 오프시즌
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        if let targetDate = dateFormatter.date(from: date) {
            let month = Calendar.current.component(.month, from: targetDate)
            if month == 7 {
                // 7월에 활동하는 리그만 필터링
                let activeInJuly = [253, 71, 307, 15, 292, 293, 667] // MLS, 브라질, 사우디, 클럽월드컵, K리그, 클럽친선경기
                let filteredLeagues = leagueIds.filter { activeInJuly.contains($0) }
                
                if filteredLeagues.count < leagueIds.count {
                    print("🌞 7월 오프시즌 - \(leagueIds.count)개 중 \(filteredLeagues.count)개 리그만 활성")
                    
                    // 활성 리그가 없으면 빈 응답 즉시 반환
                    if filteredLeagues.isEmpty {
                        return FixturesResponse(
                            get: "fixtures",
                            parameters: ResponseParameters(date: date),
                            errors: [],
                            results: 0,
                            paging: APIPaging(current: 1, total: 1),
                            response: []
                        )
                    }
                    
                    // 활성 리그만으로 진행
                    return try await fetchFixturesBatchOptimized(date: date, leagueIds: filteredLeagues, season: season)
                }
            }
        }
        
        // 순차 처리로 변경 (Rate Limit 방지)
        for (index, leagueId) in leagueIds.enumerated() {
            // Rate Limit 체크
            await RateLimitManager.shared.waitForSlot()
            
            // 각 요청 사이에 충분한 대기
            if index > 0 {
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
            }
            
            do {
                // 각 리그별 경기 직접 조회
                let directService = DirectAPIService.shared
                let response = try await directService.fetchFixturesByDate(date: date, leagueId: leagueId)
                
                allFixtures.append(contentsOf: response.response)
                if !response.response.isEmpty {
                    print("✅ 리그 \(leagueId): \(response.response.count)개 경기")
                }
                
                // Rate Limit 기록
                RateLimitManager.shared.recordRequest(endpoint: "fixtures")
                
                // 5개마다 추가 대기
                if (index + 1) % 5 == 0 {
                    print("⏳ 5개 요청 완료 - 2초 대기")
                    try await Task.sleep(nanoseconds: 2_000_000_000) // 2초
                }
            } catch {
                errors.append("리그 \(leagueId): \(error.localizedDescription)")
                print("❌ 리그 \(leagueId) 실패: \(error)")
                
                // Rate Limit 에러면 대기
                if case FootballAPIError.rateLimitExceeded = error {
                    print("⏳ Rate Limit 초과 - 65초 대기")
                    RateLimitManager.shared.handleRateLimitError()
                    try await Task.sleep(nanoseconds: 65_000_000_000) // 65초 대기
                    break // 루프 종료
                }
            }
        }
        
        let elapsed = Date().timeIntervalSince(startTime)
        print("✅ 직접 API 배치 완료: \(String(format: "%.2f", elapsed))초에 \(allFixtures.count)개 경기 로드")
        
        // 중복 제거
        let uniqueFixtures = Array(Set(allFixtures))
        
        return FixturesResponse(
            get: "fixtures",
            parameters: ResponseParameters(date: date),
            errors: [],
            results: uniqueFixtures.count,
            paging: APIPaging(current: 1, total: 1),
            response: uniqueFixtures
        )
    }
}
