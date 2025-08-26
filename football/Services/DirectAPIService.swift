import Foundation

// Edge Functions를 우회하는 직접 API 서비스
class DirectAPIService {
    static let shared = DirectAPIService()
    
    // API 키는 Supabase Edge Functions에서 관리 (FOOTBALL_API_KEY)
    // 직접 호출 시에는 Edge Functions를 통해 프록시
    private let apiKey = "" // Edge Functions 사용 시 불필요
    private let apiHost = "api-football-v1.p.rapidapi.com"
    private let baseURL = "https://api-football-v1.p.rapidapi.com/v3"
    
    private init() {}
    
    // Supabase Edge Functions를 통한 날짜별 경기 조회
    func fetchFixturesByDate(date: String, leagueId: Int? = nil) async throws -> FixturesResponse {
        // Rate Limit 체크
        await RateLimitManager.shared.waitForSlot()
        
        // Supabase Edge Function 호출
        let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co"
        let urlString = "\(supabaseURL)/functions/v1/football-api"
        
        // 요청 바디 구성
        var params: [String: Any] = ["endpoint": "fixtures", "date": date]
        if let leagueId = leagueId {
            params["league"] = leagueId
        }
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Supabase anon key
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = 30
        
        // 요청 바디 추가
        let jsonData = try JSONSerialization.data(withJSONObject: params)
        request.httpBody = jsonData
        
        print("🌐 Edge Function 호출 (날짜별): \(urlString)")
        
        // Rate Limit 기록
        await MainActor.run {
            RateLimitManager.shared.recordRequest(endpoint: "fixtures")
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FootballAPIError.invalidResponse
            }
            
            print("📡 API 응답 상태: \(httpResponse.statusCode)")
            
            if httpResponse.statusCode == 429 {
                // Rate Limit 에러 처리
                await MainActor.run {
                    RateLimitManager.shared.handleRateLimitError()
                }
                throw FootballAPIError.rateLimitExceeded
            }
            
            // 403 에러 처리 (API 키 문제)
            if httpResponse.statusCode == 403 {
                print("⚠️ 403 에러 - API 키 문제 가능성. 빈 응답 반환")
                // 403 에러 시 빈 응답 반환 (앱 크래시 방지)
                return FixturesResponse(
                    get: "fixtures",
                    parameters: ResponseParameters(date: date),
                    errors: [],
                    results: 0,
                    paging: APIPaging(current: 1, total: 1),
                    response: []
                )
            }
            
            guard httpResponse.statusCode == 200 else {
                throw FootballAPIError.serverError(httpResponse.statusCode)
            }
            
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
            
            print("✅ 직접 API 응답: \(fixturesResponse.response.count)개 경기")
            
            return fixturesResponse
        } catch {
            // 429 에러인 경우 RateLimitManager에 알림
            if case FootballAPIError.rateLimitExceeded = error {
                await MainActor.run {
                    RateLimitManager.shared.handleRateLimitError()
                }
            }
            throw error
        }
    }
    
    func fetchFixturesDirect(league: Int, season: Int, from: String? = nil, to: String? = nil) async throws -> FixturesResponse {
        var urlComponents = URLComponents(string: "\(baseURL)/fixtures")!
        var queryItems = [
            URLQueryItem(name: "league", value: String(league)),
            URLQueryItem(name: "season", value: String(season))
        ]
        
        if let from = from {
            queryItems.append(URLQueryItem(name: "from", value: from))
        }
        
        if let to = to {
            queryItems.append(URLQueryItem(name: "to", value: to))
        }
        
        urlComponents.queryItems = queryItems
        
        var request = URLRequest(url: urlComponents.url!)
        request.setValue(apiKey, forHTTPHeaderField: "x-rapidapi-key")
        request.setValue(apiHost, forHTTPHeaderField: "x-rapidapi-host")
        request.timeoutInterval = 30
        
        print("🚀 직접 API 호출: \(urlComponents.url!)")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        print("📡 API 응답 상태: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode == 429 {
            throw FootballAPIError.rateLimitExceeded
        }
        
        guard httpResponse.statusCode == 200 else {
            throw FootballAPIError.serverError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
        
        print("✅ 직접 API 응답: \(fixturesResponse.response.count)개 경기")
        
        return fixturesResponse
    }
    
    func testClubWorldCup() async throws -> String {
        var result = "=== FIFA 클럽 월드컵 직접 API 테스트 ===\n\n"
        
        // 1. 2024 시즌 전체 경기
        result += "1️⃣ 2024 시즌 전체:\n"
        do {
            let response = try await fetchFixturesDirect(league: 15, season: 2024)
            result += "✅ \(response.response.count)개 경기 발견\n"
            
            if response.response.isEmpty {
                result += "⚠️ 빈 응답\n"
            } else {
                // 날짜별로 그룹핑
                var dateGroups: [String: Int] = [:]
                for fixture in response.response {
                    let dateString = String(fixture.fixture.date.prefix(10))
                    dateGroups[dateString, default: 0] += 1
                }
                
                for (date, count) in dateGroups.sorted(by: { $0.key < $1.key }) {
                    result += "  - \(date): \(count)경기\n"
                }
            }
        } catch {
            result += "❌ 오류: \(error)\n"
        }
        
        result += "\n"
        
        // 2. 2024년 12월 경기
        result += "2️⃣ 2024년 12월:\n"
        do {
            let response = try await fetchFixturesDirect(
                league: 15,
                season: 2024,
                from: "2024-12-01",
                to: "2024-12-31"
            )
            result += "✅ \(response.response.count)개 경기\n"
            
            for fixture in response.response.prefix(3) {
                result += "  - \(fixture.fixture.date): \(fixture.teams.home.name) vs \(fixture.teams.away.name)\n"
            }
        } catch {
            result += "❌ 오류: \(error)\n"
        }
        
        result += "\n"
        
        // 3. 프리미어리그 테스트 (비교용)
        result += "3️⃣ 프리미어리그 2024 시즌 (비교):\n"
        do {
            let response = try await fetchFixturesDirect(league: 39, season: 2024)
            result += "✅ \(response.response.count)개 경기 발견\n"
        } catch {
            result += "❌ 오류: \(error)\n"
        }
        
        return result
    }
}