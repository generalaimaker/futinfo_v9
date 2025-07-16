import Foundation
import Combine

// APIResponse 타입 정의
struct APIResponse<T: Codable>: Codable {
    let get: String?
    let parameters: [String: Any]?
    let errors: [String]?
    let results: Int
    let paging: Paging?
    let response: [T]
    
    enum CodingKeys: String, CodingKey {
        case get, errors, results, paging, response, parameters
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decodeIfPresent(String.self, forKey: .get)
        errors = try container.decodeIfPresent([String].self, forKey: .errors)
        results = try container.decode(Int.self, forKey: .results)
        paging = try container.decodeIfPresent(Paging.self, forKey: .paging)
        response = try container.decode([T].self, forKey: .response)
        
        // parameters는 [String: Any]이므로 직접 디코딩 불가, nil로 처리
        parameters = nil
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(get, forKey: .get)
        try container.encodeIfPresent(errors, forKey: .errors)
        try container.encode(results, forKey: .results)
        try container.encodeIfPresent(paging, forKey: .paging)
        try container.encode(response, forKey: .response)
    }
}

// Supabase Edge Functions를 통한 API 호출 서비스
class SupabaseEdgeFunctionsService {
    static let shared = SupabaseEdgeFunctionsService()
    
    // Supabase Edge Functions URL
    private let baseURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1"
    
    private init() {}
    
    private func makeRequest<T: Decodable>(
        endpoint: String,
        parameters: [String: Any],
        responseType: T.Type,
        forceRefresh: Bool = false
    ) async throws -> T {
        // URL 구성
        guard var urlComponents = URLComponents(string: "\(baseURL)/\(endpoint)") else {
            throw FootballAPIError.invalidURL
        }
        
        // 쿼리 파라미터 추가
        var queryParameters = parameters
        if forceRefresh {
            queryParameters["forceRefresh"] = "true"
        }
        
        urlComponents.queryItems = queryParameters.map { key, value in
            URLQueryItem(name: key, value: "\(value)")
        }
        
        guard let url = urlComponents.url else {
            throw FootballAPIError.invalidURL
        }
        
        // 요청 생성
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 30
        
        print("🔄 Supabase Edge Functions 요청: \(url.absoluteString)")
        
        // 요청 실행
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // HTTP 응답 확인
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        // Rate limit 처리
        if httpResponse.statusCode == 429 {
            throw FootballAPIError.rateLimitExceeded
        }
        
        // 성공 응답 확인
        guard (200...299).contains(httpResponse.statusCode) else {
            throw FootballAPIError.serverError(httpResponse.statusCode)
        }
        
        // JSON 디코딩
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: data)
        } catch {
            print("Decoding error: \(error)")
            throw FootballAPIError.decodingError(error)
        }
    }
    
    // MARK: - Public Methods
    
    // 경기 일정 가져오기
    func fetchFixtures(
        date: String,
        leagueId: Int? = nil,
        seasonYear: Int? = nil,
        timezone: String = "Asia/Seoul",
        forceRefresh: Bool = false
    ) async throws -> [Fixture] {
        var parameters: [String: Any] = [
            "date": date,
            "timezone": timezone
        ]
        
        if let leagueId = leagueId {
            parameters["league"] = leagueId
        }
        if let seasonYear = seasonYear {
            parameters["season"] = seasonYear
        }
        
        let response = try await makeRequest(
            endpoint: "fixtures-api/fixtures",
            parameters: parameters,
            responseType: APIResponse<Fixture>.self,
            forceRefresh: forceRefresh
        )
        
        return response.response
    }
    
    // 경기 통계 가져오기
    func fetchFixtureStatistics(fixtureId: Int) async throws -> [TeamStatistics] {
        let parameters = ["fixture": fixtureId]
        
        let response = try await makeRequest(
            endpoint: "fixtures-api/statistics",
            parameters: parameters,
            responseType: APIResponse<TeamStatistics>.self
        )
        
        return response.response
    }
    
    // 경기 이벤트 가져오기
    func fetchFixtureEvents(fixtureId: Int) async throws -> [FixtureEvent] {
        let parameters = ["fixture": fixtureId]
        
        let response = try await makeRequest(
            endpoint: "fixtures-api/events",
            parameters: parameters,
            responseType: APIResponse<FixtureEvent>.self
        )
        
        return response.response
    }
    
    // 순위 가져오기
    func fetchStandings(leagueId: Int, season: Int) async throws -> [StandingResponse] {
        let parameters = [
            "league": leagueId,
            "season": season
        ]
        
        let response = try await makeRequest(
            endpoint: "fixtures-api/standings",
            parameters: parameters,
            responseType: APIResponse<StandingResponse>.self
        )
        
        return response.response
    }
    
    // 상대 전적 가져오기
    func fetchHeadToHead(team1: Int, team2: Int) async throws -> [Fixture] {
        let _ = "h2h=\(team1)-\(team2)"
        
        let response = try await makeRequest(
            endpoint: "fixtures-api/h2h",
            parameters: ["h2h": "\(team1)-\(team2)"],
            responseType: APIResponse<Fixture>.self
        )
        
        return response.response
    }
    
    // 부상 정보 가져오기
    func fetchInjuries(teamId: Int? = nil, leagueId: Int? = nil, season: Int? = nil) async throws -> [InjuryData] {
        var parameters: [String: Any] = [:]
        
        if let teamId = teamId {
            parameters["team"] = teamId
        }
        if let leagueId = leagueId {
            parameters["league"] = leagueId
        }
        if let season = season {
            parameters["season"] = season
        }
        
        let response = try await makeRequest(
            endpoint: "fixtures-api/injuries",
            parameters: parameters,
            responseType: APIResponse<InjuryData>.self
        )
        
        return response.response
    }
    
    // 캐시 통계 가져오기 (관리자용)
    func getCacheStats() async throws -> CacheStats {
        return try await makeRequest(
            endpoint: "fixtures-api/cache-stats",
            parameters: [:],
            responseType: CacheStats.self
        )
    }
    
    // 강제 새로고침으로 데이터 가져오기
    func fetchFixturesWithForceRefresh(
        date: String,
        leagueId: Int? = nil,
        seasonYear: Int? = nil,
        timezone: String = "Asia/Seoul"
    ) async throws -> [Fixture] {
        var parameters: [String: Any] = [
            "date": date,
            "timezone": timezone,
            "forceRefresh": "true"  // 캐시 무시하고 새로 가져오기
        ]
        
        if let leagueId = leagueId {
            parameters["league"] = leagueId
        }
        if let seasonYear = seasonYear {
            parameters["season"] = seasonYear
        }
        
        let response = try await makeRequest(
            endpoint: "fixtures-api/fixtures",
            parameters: parameters,
            responseType: APIResponse<Fixture>.self
        )
        
        return response.response
    }
}

// 캐시 통계 모델
struct CacheStats: Codable {
    let totalDocuments: Int
    let totalSize: Int
    let oldestCache: Date?
    let newestCache: Date?
    let cachesByEndpoint: [String: Int]
}

// Supabase Edge Functions 사용 플래그
extension FootballAPIService {
    static var useSupabaseEdgeFunctions = true // 기본적으로 Supabase 사용
    
    // Supabase Edge Functions를 사용하도록 래퍼 메서드
    func fetchFixturesWithCache(date: String, leagueId: Int? = nil, seasonYear: Int? = nil) async throws -> [Fixture] {
        if FootballAPIService.useSupabaseEdgeFunctions {
            return try await SupabaseEdgeFunctionsService.shared.fetchFixtures(
                date: date,
                leagueId: leagueId,
                seasonYear: seasonYear
            )
        } else {
            // 기존 직접 API 호출 (백업용)
            return try await FootballAPIService.shared.getFixturesWithServerCache(
                date: date,
                leagueId: leagueId,
                seasonYear: seasonYear,
                forceRefresh: false
            )
        }
    }
}