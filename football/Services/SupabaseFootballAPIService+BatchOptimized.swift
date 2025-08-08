import Foundation

// MARK: - Optimized Batch Request with Parallel Processing
extension SupabaseFootballAPIService {
    
    /// 병렬 처리로 최적화된 배치 요청
    func fetchFixturesBatchOptimized(date: String, leagueIds: [Int], season: Int? = nil) async throws -> FixturesResponse {
        print("🚀 최적화된 배치 요청 시작: \(leagueIds.count)개 리그")
        
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
        
        // 배치 크기 설정 (동시 2개씩 처리 - 안정성 향상)
        let batchSize = 2
        let batches = leagueIds.chunked(into: batchSize)
        
        for (index, batch) in batches.enumerated() {
            print("📦 배치 \(index + 1)/\(batches.count) 처리 중: \(batch)")
            
            // 배치 내에서 병렬 처리
            await withTaskGroup(of: (Int, Result<[Fixture], Error>).self) { group in
                for leagueId in batch {
                    group.addTask {
                        do {
                            // 리그별로 올바른 시즌 계산
                            let targetDate = dateFormatter.date(from: date) ?? Date()
                            let leagueSeason: Int
                            if let season = season {
                                leagueSeason = season
                            } else {
                                leagueSeason = await self.getSeasonForLeagueAndDate(leagueId, date: targetDate)
                            }
                            
                            let response = try await self.fetchFixtures(date: date, leagueId: leagueId, season: leagueSeason)
                            return (leagueId, .success(response.response))
                        } catch {
                            return (leagueId, .failure(error))
                        }
                    }
                }
                
                // 결과 수집
                for await (leagueId, result) in group {
                    switch result {
                    case .success(let fixtures):
                        allFixtures.append(contentsOf: fixtures)
                        if !fixtures.isEmpty {
                            print("✅ 리그 \(leagueId): \(fixtures.count)개 경기")
                        }
                    case .failure(let error):
                        errors.append("리그 \(leagueId): \(error.localizedDescription)")
                        print("❌ 리그 \(leagueId) 실패: \(error)")
                    }
                }
            }
            
            // 다음 배치 전 대기 (Rate Limit 방지 및 안정성 향상)
            if index < batches.count - 1 {
                print("⏳ Rate Limit 대기: 0.5초")
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초
            }
        }
        
        let elapsed = Date().timeIntervalSince(startTime)
        print("✅ 최적화된 배치 완료: \(String(format: "%.2f", elapsed))초에 \(allFixtures.count)개 경기 로드")
        
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
