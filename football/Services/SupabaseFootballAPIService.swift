import Foundation
import SwiftUI
import Combine

@MainActor
class SupabaseFootballAPIService: ObservableObject {
    static let shared = SupabaseFootballAPIService()
    
    private let supabaseService = SupabaseService.shared
    private let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co"
    private let cacheManager = APICacheManager.shared
    private let defaultTimeout: TimeInterval = 30.0
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {}
    
    // MARK: - Fixtures
    
    func fetchFixtures(date: String, leagueId: Int? = nil, season: Int? = nil) async throws -> FixturesResponse {
        // Edge Functions를 통한 API 호출
        print("🌐 Supabase Edge Functions 호출")
        
        // Rate Limit 확인
        await RateLimitManager.shared.waitForSlot()
        
        // Build URL for GET request with query parameters
        var urlString = "\(supabaseURL)/functions/v1/football-api/fixtures?date=\(date)"
        if let leagueId = leagueId {
            urlString += "&league=\(leagueId)"
        }
        if let season = season {
            urlString += "&season=\(season)"
        }
        
        // 캐시 우선 사용 플래그 추가 (빠른 응답을 위해)
        urlString += "&preferCache=true"
        
        print("🌐 Edge Function URL: \(urlString)")
        
        // Rate Limit 기록
        RateLimitManager.shared.recordRequest(endpoint: "fixtures")
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = 30.0
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FootballAPIError.invalidResponse
            }
            
            print("📡 HTTP 응답 코드: \(httpResponse.statusCode)")
            
            // 429 Rate Limit 에러 처리
            if httpResponse.statusCode == 429 {
                print("⚠️ Rate Limit 초과")
                RateLimitManager.shared.handleRateLimitError()
                throw FootballAPIError.rateLimitExceeded
            }
            
            // 404나 500 에러 시 빈 응답 반환
            if httpResponse.statusCode == 404 || httpResponse.statusCode == 500 {
                print("⚠️ Edge Function 오류 (\(httpResponse.statusCode))")
                return FixturesResponse(
                    get: "fixtures",
                    parameters: ResponseParameters(date: date),
                    errors: [],
                    results: 0,
                    paging: APIPaging(current: 1, total: 1),
                    response: []
                )
            }
            
            if httpResponse.statusCode != 200 {
                print("❌ HTTP 오류: \(httpResponse.statusCode)")
                // 빈 응답 반환 (앱 크래시 방지)
                return FixturesResponse(
                    get: "fixtures",
                    parameters: ResponseParameters(date: date),
                    errors: [],
                    results: 0,
                    paging: APIPaging(current: 1, total: 1),
                    response: []
                )
            }
            
            // 응답 데이터 디버깅
            if let jsonString = String(data: data, encoding: .utf8) {
                print("📋 API 응답 데이터 (처음 500자): \(String(jsonString.prefix(500)))")
            }
            
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
            print("✅ Edge Function 응답: \(fixturesResponse.response.count)개 경기")
            
            return fixturesResponse
        } catch {
            print("❌ Edge Function 호출 실패: \(error)")
            // 빈 응답 반환
            return FixturesResponse(
                get: "fixtures",
                parameters: ResponseParameters(date: date),
                errors: [],
                results: 0,
                paging: APIPaging(current: 1, total: 1),
                response: []
            )
        }
    }
    
    // MARK: - Standings
    
    func fetchStandings(leagueId: Int, season: Int) async throws -> StandingsResponse {
        let urlString = "\(supabaseURL)/functions/v1/football-api/standings?league=\(leagueId)&season=\(season)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(StandingsResponse.self, from: data)
    }
    
    // MARK: - Fixture Details
    
    func fetchFixtureStatistics(fixtureId: Int) async throws -> FixtureStatisticsResponse {
        return try await performRequest(
            endpoint: "fixtures/statistics",
            parameters: ["fixture": fixtureId]
        )
    }
    
    func fetchFixtureEvents(fixtureId: Int) async throws -> FixtureEventsResponse {
        return try await performRequest(
            endpoint: "fixtures/events",
            parameters: ["fixture": fixtureId]
        )
    }
    
    func fetchFixtureLineups(fixtureId: Int) async throws -> FixtureLineupsResponse {
        return try await performRequest(
            endpoint: "fixtures/lineups",
            parameters: ["fixture": fixtureId]
        )
    }
    
    // MARK: - Helper Methods
    
    func getFixtures(for date: Date) async throws -> [Fixture] {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        let dateString = dateFormatter.string(from: date)
        
        let response = try await fetchFixtures(date: dateString)
        return response.response
    }
    
    func getFixturesForLeague(leagueId: Int, date: Date) async throws -> [Fixture] {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        let dateString = dateFormatter.string(from: date)
        
        let response = try await fetchFixtures(date: dateString, leagueId: leagueId)
        return response.response
    }
    
    // 서버 캐싱을 활용한 경기 일정 가져오기 (Supabase 사용)
    func getFixturesWithServerCache(
        date: String,
        leagueId: Int? = nil,
        seasonYear: Int? = nil,
        forceRefresh: Bool = false
    ) async throws -> [Fixture] {
        // Supabase Edge Function은 이미 서버사이드 캐싱을 구현했으므로
        // 직접 fetchFixtures를 호출하면 됨
        let response = try await fetchFixtures(date: date, leagueId: leagueId, season: seasonYear)
        return response.response
    }
    
    func getStandings(leagueId: Int, season: Int) async throws -> [Standing] {
        let response = try await fetchStandings(leagueId: leagueId, season: season)
        let standings = response.response.first?.league.standings.first ?? []
        
        // Return all teams from the API without filtering
        // Bundesliga has 18 teams, not 10
        return standings
    }
    
    // MARK: - Migration Helper
    // 기존 FootballAPIService 메서드들과 호환성을 위한 래퍼 메서드들
    
    func fetchFixturesLegacy(for date: Date) -> AnyPublisher<FixturesResponse, FootballAPIError> {
        Future { promise in
            Task {
                do {
                    let response = try await self.fetchFixtures(date: self.formatDate(date))
                    promise(.success(response))
                } catch let error as FootballAPIError {
                    promise(.failure(error))
                } catch {
                    promise(.failure(.networkError(error)))
                }
            }
        }
        .eraseToAnyPublisher()
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

// MARK: - Team API Methods

extension SupabaseFootballAPIService {
    func fetchTeamInfo(teamId: Int) async throws -> TeamResponse {
        let urlString = "\(supabaseURL)/functions/v1/teams-api/team?id=\(teamId)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(TeamResponse.self, from: data)
    }
    
    func fetchTeamStatistics(teamId: Int, season: Int, leagueId: Int) async throws -> TeamStatisticsResponse {
        let urlString = "\(supabaseURL)/functions/v1/teams-api/statistics?team=\(teamId)&season=\(season)&league=\(leagueId)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(TeamStatisticsResponse.self, from: data)
    }
    
    func fetchTeamSquad(teamId: Int) async throws -> SquadResponse {
        let urlString = "\(supabaseURL)/functions/v1/teams-api/squad?team=\(teamId)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(SquadResponse.self, from: data)
    }
    
    func fetchHeadToHead(team1Id: Int, team2Id: Int) async throws -> HeadToHeadResponse {
        let urlString = "\(supabaseURL)/functions/v1/teams-api/head-to-head?h2h=\(team1Id)-\(team2Id)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(HeadToHeadResponse.self, from: data)
    }
    
    // 팀별 경기 일정 가져오기
    func getTeamFixtures(teamId: Int, season: Int, last: Int? = nil) async throws -> [Fixture] {
        // Rate Limit 확인
        await RateLimitManager.shared.waitForSlot()
        
        let urlString = "\(supabaseURL)/functions/v1/football-api/fixtures?team=\(teamId)&season=\(season)"
        
        print("🌐 팀 경기 일정 조회: \(urlString)")
        
        // Rate Limit 기록
        RateLimitManager.shared.recordRequest(endpoint: "fixtures")
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        print("📡 HTTP 응답 코드: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode != 200 {
            // Edge Function 오류 메시지 확인
            if let errorData = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let errorMessage = errorData["error"] as? String ?? "Unknown error"
                let details = errorData["details"] as? String
                print("❌ Edge Function 오류: \(errorMessage)")
                if let details = details {
                    print("❌ 오류 상세: \(details)")
                }
                
                // 전체 응답 출력 (디버깅용)
                if let jsonString = String(data: data, encoding: .utf8) {
                    print("❌ 전체 응답: \(jsonString)")
                }
                
                if errorMessage.contains("You are not subscribed to this API") {
                    throw FootballAPIError.edgeFunctionError("API 구독이 필요합니다. Rapid API 구독을 확인하세요.")
                } else if errorMessage.contains("API key not configured") {
                    throw FootballAPIError.edgeFunctionError("Edge Function에 API 키가 설정되지 않았습니다.")
                } else if errorMessage.contains("Rate limit exceeded") {
                    throw FootballAPIError.rateLimitExceeded
                }
            }
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
        
        print("✅ 팀 경기 일정 조회 성공: \(fixturesResponse.response.count)개 경기")
        
        // last 파라미터가 있으면 최근 경기만 반환
        if let last = last {
            return Array(fixturesResponse.response.prefix(last))
        }
        
        return fixturesResponse.response
    }
}

// MARK: - Player API Methods

extension SupabaseFootballAPIService {
    func fetchPlayerStatistics(playerId: Int, season: Int) async throws -> PlayerStatisticsResponse {
        let urlString = "\(supabaseURL)/functions/v1/players-api/statistics?player=\(playerId)&season=\(season)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(PlayerStatisticsResponse.self, from: data)
    }
    
    func fetchPlayerInfo(playerId: Int) async throws -> PlayerProfileResponse {
        let urlString = "\(supabaseURL)/functions/v1/players-api/player?id=\(playerId)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(PlayerProfileResponse.self, from: data)
    }
    
    // TODO: Define SearchPlayersResponse type before uncommenting
    /*
    func fetchPlayersSearch(query: String) async throws -> SearchPlayersResponse {
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let urlString = "\(supabaseURL)/functions/v1/players-api/search?search=\(encodedQuery)"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(SearchPlayersResponse.self, from: data)
    }
    */
    
    // MARK: - FixtureDetailViewModel에서 필요한 메서드들
    
    // 경기 이벤트 가져오기 (fetchFixtureEvents가 이미 있다면 별칭)
    func getFixtureEvents(fixtureId: Int) async throws -> [FixtureEvent] {
        let response = try await fetchFixtureEvents(fixtureId: fixtureId)
        return response.response
    }
    
    // 부상자 정보 가져오기
    func getInjuries(teamId: Int) async throws -> [InjuryData] {
        // TODO: Implement injuries endpoint
        return []
    }
    
    // 첫 번째 레그 경기 찾기
    func findFirstLegMatch(fixture: Fixture) async throws -> Fixture? {
        // TODO: Implement first leg match finding logic
        return nil
    }
    
    // 경기 통계 가져오기
    func getFixtureStatistics(fixtureId: Int) async throws -> [TeamStatistics] {
        let response = try await fetchFixtureStatistics(fixtureId: fixtureId)
        return response.response
    }
    
    // 하프타임 통계 가져오기
    func getFixtureHalfStatistics(fixtureId: Int) async throws -> [TeamStatistics] {
        // 일반 통계와 동일하게 처리 (하프타임 데이터는 response에 포함됨)
        return try await getFixtureStatistics(fixtureId: fixtureId)
    }
    
    // 라인업 가져오기
    func getFixtureLineups(fixtureId: Int) async throws -> [TeamLineup] {
        let response = try await fetchFixtureLineups(fixtureId: fixtureId)
        return response.response
    }
    
    // 선수 통계 가져오기
    func getFixturePlayersStatistics(fixtureId: Int) async throws -> [TeamPlayersStatistics] {
        // TODO: Implement player statistics endpoint
        return []
    }
    
    // 맞대결 기록 가져오기
    func getHeadToHead(team1: Int, team2: Int, last: Int = 10) async throws -> [Fixture] {
        let response = try await fetchHeadToHead(team1Id: team1, team2Id: team2)
        return Array(response.response.prefix(last))
    }
}

// MARK: - Generic Request Method

extension SupabaseFootballAPIService {
    private func performRequest<T: Decodable>(
        endpoint: String,
        parameters: [String: Any]? = nil
    ) async throws -> T {
        var urlString = "\(supabaseURL)/functions/v1/football-api/\(endpoint)"
        
        // Add query parameters if provided
        if let parameters = parameters {
            let queryItems = parameters.map { key, value in
                URLQueryItem(name: key, value: "\(value)")
            }
            var components = URLComponents(string: urlString)!
            components.queryItems = queryItems
            urlString = components.url!.absoluteString
        }
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        return try decoder.decode(T.self, from: data)
    }
}

// MARK: - Batch Request Methods

extension SupabaseFootballAPIService {
    /// 배치 요청을 사용한 경기 일정 가져오기
    func fetchFixturesBatch(date: String, leagueIds: [Int]) async throws -> FixturesResponse {
        print("🚀 배치 요청 시작: \(leagueIds.count)개 리그")
        
        // 병렬 처리를 위한 TaskGroup 사용
        let results = await withTaskGroup(of: (Int, Result<FixturesResponse, Error>).self) { group in
            for leagueId in leagueIds {
                group.addTask {
                    do {
                        let response = try await self.fetchFixtures(date: date, leagueId: leagueId)
                        return (leagueId, .success(response))
                    } catch {
                        return (leagueId, .failure(error))
                    }
                }
            }
            
            var allFixtures: [Fixture] = []
            var errors: [String] = []
            
            for await (leagueId, result) in group {
                switch result {
                case .success(let response):
                    allFixtures.append(contentsOf: response.response)
                    if !response.response.isEmpty {
                        print("✅ 리그 \(leagueId): \(response.response.count)개 경기")
                    }
                case .failure(let error):
                    errors.append("리그 \(leagueId): \(error.localizedDescription)")
                    print("❌ 리그 \(leagueId) 실패: \(error)")
                }
            }
            
            return (allFixtures, errors)
        }
        
        let (allFixtures, errors) = results
        
        print("✅ 배치 요청 완료: \(allFixtures.count)개 경기 로드")
        
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
    
    /// 리그별 시즌 정보 가져오기
    func getSeasonForLeagueAndDate(_ leagueId: Int, date: Date) async -> Int {
        let calendar = Calendar.current
        let year = calendar.component(.year, from: date)
        let month = calendar.component(.month, from: date)
        
        // 각 리그별 시즌 계산 로직
        switch leagueId {
        case 39, 140, 135, 78, 61, 94, 88, 203, 144, 179: // 유럽 리그
            return month >= 8 ? year : year - 1
        case 253, 71, 307: // 여름 시즌 리그
            return year
        case 292, 293: // K리그
            return year
        default:
            return year
        }
    }
}

// MARK: - Direct API Fallback

extension SupabaseFootballAPIService {
    // Supabase Edge Function이 실패하면 직접 API 호출
    // 직접 API 호출을 위한 개선된 폴백 메서드
    func fetchFixturesDirect(date: String, leagueId: Int? = nil) async throws -> FixturesResponse {
        print("🔄 직접 API 폴백 메서드 호출 시작: date=\(date), league=\(leagueId ?? -1)")
        
        // DirectAPIService 사용하여 날짜별 조회
        let directService = DirectAPIService.shared
        
        do {
            // 각 리그별 경기 직접 조회
            let response = try await directService.fetchFixturesByDate(date: date, leagueId: leagueId)
            
            // 빈 응답 처리
            if response.response.isEmpty {
                print("⚠️ 빈 응답 받음 - date: \(date), league: \(leagueId ?? -1)")
                // 빈 응답도 정상적인 응답으로 처리
                return response
            }
            
            print("✅ 직접 API 성공: \(response.response.count)개 경기")
            return response
        } catch let error as FootballAPIError {
            print("❌ 직접 API 실패 (FootballAPIError): \(error)")
            
            // Rate Limit 에러는 그대로 전파
            if case .rateLimitExceeded = error {
                throw error
            }
            
            // 빈 응답 반환
            return FixturesResponse(
                get: "fixtures",
                parameters: ResponseParameters(date: date),
                errors: [],
                results: 0,
                paging: APIPaging(current: 1, total: 1),
                response: []
            )
        } catch {
            print("❌ 직접 API 실패 (기타 에러): \(error)")
            
            // FootballAPIService로 재시도 (기존 방식)
            let apiService = FootballAPIService.shared
            var endpoint = "/fixtures?date=\(date)"
            if let leagueId = leagueId {
                endpoint += "&league=\(leagueId)"
            }
            
            do {
                let request = apiService.createRequest(endpoint)
                let (data, response) = try await URLSession.shared.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw FootballAPIError.invalidResponse
                }
                
                if httpResponse.statusCode != 200 {
                    throw FootballAPIError.httpError(httpResponse.statusCode)
                }
                
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                
                return try decoder.decode(FixturesResponse.self, from: data)
            } catch {
                // 최종 실패 시 빈 응답 반환
                return FixturesResponse(
                    get: "fixtures",
                    parameters: ResponseParameters(date: date),
                    errors: [],
                    results: 0,
                    paging: APIPaging(current: 1, total: 1),
                    response: []
                )
            }
        }
    }
    
    // MARK: - League Fixtures Methods
    
    func getFixtures(leagueId: Int, season: Int, last: Int? = nil, next: Int? = nil) async throws -> [Fixture] {
        // Edge Functions endpoint for league fixtures with last/next parameters
        await RateLimitManager.shared.waitForSlot()
        
        var urlString = "\(supabaseURL)/functions/v1/football-api/fixtures?league=\(leagueId)&season=\(season)"
        
        if let last = last {
            urlString += "&last=\(last)"
        } else if let next = next {
            urlString += "&next=\(next)"
        }
        
        print("🌐 리그 경기 일정 조회: \(urlString)")
        RateLimitManager.shared.recordRequest(endpoint: "fixtures")
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        print("📡 HTTP 응답 코드: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let fixturesResponse = try JSONDecoder().decode(FixturesResponse.self, from: data)
        return fixturesResponse.response
    }
    
    func getFixtures(leagueId: Int, season: Int, from: Date, to: Date) async throws -> [Fixture] {
        // Edge Functions endpoint for league fixtures with date range
        await RateLimitManager.shared.waitForSlot()
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let fromString = dateFormatter.string(from: from)
        let toString = dateFormatter.string(from: to)
        
        let urlString = "\(supabaseURL)/functions/v1/football-api/fixtures?league=\(leagueId)&season=\(season)&from=\(fromString)&to=\(toString)"
        
        print("🌐 리그 경기 일정 조회 (날짜 범위): \(urlString)")
        RateLimitManager.shared.recordRequest(endpoint: "fixtures")
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        print("📡 HTTP 응답 코드: \(httpResponse.statusCode)")
        
        if httpResponse.statusCode != 200 {
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let fixturesResponse = try JSONDecoder().decode(FixturesResponse.self, from: data)
        return fixturesResponse.response
    }
}