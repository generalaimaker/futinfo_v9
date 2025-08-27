import Foundation

// MARK: - Supabase Edge Functions 캐싱 최적화
extension SupabaseFootballAPIService {
    
    /// Supabase Edge Function을 통한 캐시된 데이터 가져오기
    func fetchFixturesBatchFromSupabase(
        date: String,
        leagueIds: [Int]
    ) async throws -> [Fixture] {
        
        // Edge Function URL
        let baseURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1"
        let endpoint = "/fixtures-api"
        
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw FootballAPIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        
        // 요청 바디
        let body: [String: Any] = [
            "date": date,
            "leagueIds": leagueIds,
            "timezone": TimeZone.current.identifier
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        // 타임아웃 설정
        request.timeoutInterval = 15
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FootballAPIError.invalidResponse
            }
            
            // 응답 상태 체크
            switch httpResponse.statusCode {
            case 200:
                // 성공 - 캐시된 데이터 또는 새 데이터
                let fixturesResponse = try JSONDecoder().decode(FixturesResponse.self, from: data)
                return fixturesResponse.response
                
            case 429:
                // Rate limit - 로컬 캐시 사용
                print("⚠️ Supabase rate limit - 로컬 캐시 사용")
                return []
                
            case 404:
                // 데이터 없음
                return []
                
            default:
                print("❌ Supabase 응답 오류: \(httpResponse.statusCode)")
                throw FootballAPIError.serverError(httpResponse.statusCode)
            }
            
        } catch {
            print("❌ Supabase Edge Function 오류: \(error)")
            // 폴백으로 직접 API 호출
            throw error
        }
    }
    
    /// 캐시 프리웜 - 주말 경기 미리 캐싱
    func prewarmWeekendCache() async {
        let calendar = Calendar.current
        let today = Date()
        
        // 이번 주말 날짜 계산
        let weekday = calendar.component(.weekday, from: today)
        let daysUntilSaturday = (7 - weekday + 7) % 7
        let daysUntilSunday = daysUntilSaturday + 1
        
        guard let saturday = calendar.date(byAdding: .day, value: daysUntilSaturday, to: today),
              let sunday = calendar.date(byAdding: .day, value: daysUntilSunday, to: today) else {
            return
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        let dates = [
            formatter.string(from: saturday),
            formatter.string(from: sunday)
        ]
        
        // 주요 리그만 프리웜
        let majorLeagues = [39, 140, 135, 78, 61, 292] // 5대리그 + K리그
        
        for date in dates {
            do {
                _ = try await fetchFixturesBatchFromSupabase(
                    date: date,
                    leagueIds: majorLeagues
                )
                print("✅ 캐시 프리웜 완료: \(date)")
            } catch {
                print("⚠️ 캐시 프리웜 실패: \(date)")
            }
        }
    }
    
    /// 라이브 경기 빠른 업데이트
    func fetchLiveFixturesQuick() async throws -> [Fixture] {
        let baseURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1"
        let endpoint = "/live-matches-updater"
        
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw FootballAPIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 10
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw FootballAPIError.invalidResponse
        }
        
        struct LiveResponse: Codable {
            let fixtures: [Fixture]
            let lastUpdate: String
        }
        
        let liveResponse = try JSONDecoder().decode(LiveResponse.self, from: data)
        return liveResponse.fixtures
    }
}

// MARK: - 스마트 캐싱 전략
extension SupabaseFootballAPIService {
    
    /// 캐시 TTL 계산 (경기 상태별)
    func calculateCacheTTL(for fixtures: [Fixture]) -> TimeInterval {
        let hasLive = fixtures.contains { fixture in
            ["1H", "2H", "HT", "ET", "P", "LIVE"].contains(fixture.fixture.status.short)
        }
        
        if hasLive {
            return 60 // 1분
        }
        
        let hasUpcoming = fixtures.contains { fixture in
            fixture.fixture.status.short == "NS"
        }
        
        if hasUpcoming {
            return 1800 // 30분
        }
        
        // 모두 종료된 경기
        return 14400 // 4시간
    }
    
    /// 효율적인 배치 요청 (병렬 처리 최적화)
    func fetchFixturesBatchOptimizedV2(
        date: String,
        leagueIds: [Int],
        season: Int?
    ) async throws -> FixturesResponse {
        
        // Supabase Edge Function 우선 시도
        if AppConfiguration.shared.useSupabaseEdgeFunctions {
            do {
                let fixtures = try await fetchFixturesBatchFromSupabase(
                    date: date,
                    leagueIds: leagueIds
                )
                return FixturesResponse(
                    get: "",
                    parameters: ResponseParameters(
                        fixture: nil,
                        league: leagueIds.first.map { String($0) },
                        season: season.map { String($0) },
                        team: nil,
                        date: date
                    ),
                    errors: [],
                    results: fixtures.count,
                    paging: APIPaging(current: 1, total: 1),
                    response: fixtures
                )
            } catch {
                print("⚠️ Supabase 실패, 직접 API 호출로 폴백")
            }
        }
        
        // 직접 API 호출 (폴백)
        return try await fetchFixturesBatchOptimized(
            date: date,
            leagueIds: leagueIds,
            season: season
        )
    }
}