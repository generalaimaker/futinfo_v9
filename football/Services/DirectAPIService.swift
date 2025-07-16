import Foundation

// Edge Functions를 우회하는 직접 API 서비스
class DirectAPIService {
    static let shared = DirectAPIService()
    
    private let apiKey = "5d0b9c4c0dmsh2e0ca7b67e9dcb8p1fb45fjsn529c0055b34d"
    private let apiHost = "api-football-v1.p.rapidapi.com"
    private let baseURL = "https://api-football-v1.p.rapidapi.com/v3"
    
    private init() {}
    
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