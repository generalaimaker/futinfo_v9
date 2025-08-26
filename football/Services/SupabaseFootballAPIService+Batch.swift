import Foundation

// MARK: - Batch Request Support
extension SupabaseFootballAPIService {
    
    /// 날짜에 따른 일반적인 시즌 반환 (대부분의 유럽 리그 기준)
    func getSeasonForDate(_ date: Date) -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: date)
        let year = components.year ?? Date().getCurrentSeason()
        let month = components.month ?? 1
        
        // 대부분의 리그는 8월-7월 시즌
        // 8월 이후는 현재 연도, 7월 이전은 전년도 시즌
        return month >= 8 ? year : year - 1
    }
    
    /// 여러 리그의 경기 일정을 병렬 요청으로 수집 (성능 최적화)
    func fetchFixturesBatch(date: String, leagueIds: [Int], season: Int? = nil) async throws -> FixturesResponse {
        print("🚀 배치 요청 시작 (병렬 처리): \(leagueIds.count)개 리그")
        
        let startTime = Date()
        var allFixtures: [Fixture] = []
        var errors: [String] = []
        var firstSuccessfulResponse: FixturesResponse?
        
        // 순차 처리로 변경 - Rate Limit 방지
        for leagueId in leagueIds {
            do {
                // Rate Limit 방지를 위한 지연
                if leagueIds.firstIndex(of: leagueId) != 0 {
                    try await Task.sleep(nanoseconds: 200_000_000) // 0.2초 지연
                }
                
                // 리그별로 올바른 시즌 계산
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                let targetDate = dateFormatter.date(from: date) ?? Date()
                let leagueSeason: Int
                if let season = season {
                    leagueSeason = season
                } else {
                    leagueSeason = await self.getSeasonForLeagueAndDate(leagueId, date: targetDate)
                }
                
                // 디버그 로그 추가
                if [253, 292, 293, 71].contains(leagueId) {
                    print("🔍 리그 \(leagueId) - 날짜: \(date), 계산된 시즌: \(leagueSeason)")
                }
                
                let response = try await self.fetchFixtures(date: date, leagueId: leagueId, season: leagueSeason)
                if firstSuccessfulResponse == nil {
                    firstSuccessfulResponse = response
                }
                allFixtures.append(contentsOf: response.response)
                if !response.response.isEmpty {
                    print("✅ 리그 \(leagueId): \(response.response.count)개 경기")
                }
            } catch {
                // CancellationError는 무시하고 계속 진행
                if error is CancellationError {
                    print("⚠️ 리그 \(leagueId) 요청 취소됨")
                    continue
                }
                
                let errorMessage = "리그 \(leagueId) 오류: \(error.localizedDescription)"
                errors.append(errorMessage)
                print("❌ \(errorMessage)")
                
                // Rate Limit 에러면 더 긴 대기
                if let apiError = error as? FootballAPIError,
                   case .rateLimitExceeded = apiError {
                    print("⏳ Rate Limit 감지 - 2초 대기")
                    try? await Task.sleep(nanoseconds: 2_000_000_000)
                }
            }
        }
        
        let elapsed = Date().timeIntervalSince(startTime)
        print("✅ 배치 요청 완료: \(String(format: "%.2f", elapsed))초에 \(allFixtures.count)개 경기 로드")
        
        // 에러 처리 개선 - 부분 실패도 사용자에게 알림
        if !errors.isEmpty {
            let successCount = leagueIds.count - errors.count
            print("⚠️ 부분 실패: \(successCount)/\(leagueIds.count) 리그 성공")
            
            // 모든 요청이 실패한 경우에만 에러 던지기
            // 단, 성공했지만 데이터가 없는 경우는 정상 상황
            if allFixtures.isEmpty && errors.count == leagueIds.count {
                throw FootballAPIError.apiError(errors)
            }
            
            // 부분 실패 시 알림 발송 (UI에서 처리) - 안전한 타입만 전송
            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: NSNotification.Name("PartialFixturesLoadFailure"),
                    object: nil,
                    userInfo: [
                        "successCount": NSNumber(value: successCount),
                        "totalCount": NSNumber(value: leagueIds.count),
                        "errorCount": NSNumber(value: errors.count)
                    ]
                )
            }
        }
        
        // 중복 제거 (같은 경기가 여러 리그에서 나올 수 있음)
        let uniqueFixtures = Array(Set(allFixtures))
        
        // 안전한 방식으로 응답 생성 - JSON 직렬화 오류 방지
        if let baseResponse = firstSuccessfulResponse {
            // 직접 FixturesResponse 객체 생성 (JSON 직렬화 우회)
            return FixturesResponse(
                get: baseResponse.get,
                parameters: baseResponse.parameters,
                errors: baseResponse.errors,
                results: uniqueFixtures.count,
                paging: baseResponse.paging,
                response: uniqueFixtures
            )
        } else {
            throw FootballAPIError.apiError(["모든 리그 요청 실패"])
        }
    }
    
    /// 날짜별로 미리 정의된 주요 리그들의 경기를 한번에 가져오기
    func fetchFixturesForMainLeagues(date: Date) async throws -> [Fixture] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: date)
        
        // 주요 리그 ID들
        let mainLeagues = [
            39,   // 프리미어리그
            140,  // 라리가
            135,  // 세리에A
            78,   // 분데스리가
            61,   // 리그1
            94,   // 포르투갈
            88,   // 에레디비지
            292,  // K리그1
            293,  // K리그2
            2,    // 챔피언스리그
            3     // 유로파리그
        ]
        
        // 날짜에 따른 시즌 결정
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: date)
        let year = components.year ?? Date().getCurrentSeason()
        let month = components.month ?? 1
        
        // 대부분의 리그는 현재 시즌 사용
        var season = year
        if month < 7 { // 1-6월은 전년도 시즌
            season = year - 1
        }
        
        return try await fetchFixturesBatch(
            date: dateString,
            leagueIds: mainLeagues,
            season: season
        ).response
    }
}