import Foundation
import SwiftUI
import Combine

class SupabaseFootballAPIService: ObservableObject {
    static let shared = SupabaseFootballAPIService()
    
    private let supabaseService = SupabaseService.shared
    private let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co"
    private let cacheManager = APICacheManager.shared
    private let defaultTimeout: TimeInterval = 20.0 // 20초로 줄여서 빠른 실패 처리
    
    private var cancellables = Set<AnyCancellable>()
    
    private init() {}
    
    // MARK: - Fixtures
    
    func fetchFixtures(date: String, leagueId: Int? = nil, season: Int? = nil) async throws -> FixturesResponse {
        // Rate Limit 확인
        let rateLimitManager = RateLimitManager.shared
        if !rateLimitManager.canMakeRequest() {
            let waitTime = rateLimitManager.timeUntilNextRequest()
            print("⏳ Rate Limit 대기: \(String(format: "%.1f", waitTime))초")
            if waitTime > 0 {
                try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
            }
        }
        
        // Build URL for POST request
        let urlString = "\(supabaseURL)/functions/v1/unified-football-api"
        
        // Build request body
        var params: [String: Any] = ["date": date]
        if let leagueId = leagueId {
            params["league"] = leagueId
        }
        if let season = season {
            params["season"] = season
        }
        
        let requestBody: [String: Any] = [
            "endpoint": "fixtures",
            "params": params
        ]
        
        print("🌐 Supabase API 호출: \(urlString)")
        print("📅 요청 파라미터 - Date: \(date), League: \(leagueId ?? -1), Season: \(season ?? -1)")
        
        // Rate Limit 기록
        rateLimitManager.recordRequest()
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add request body
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
        // Add Supabase anon key for Edge Functions
        let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.timeoutInterval = defaultTimeout
        
        // Retry logic for errors - 개선된 재시도 로직
        var retryCount = 0
        let maxRetries = 3  // 재시도 횟수 증가 (안정성 향상)
        
        while retryCount <= maxRetries {
            do {
                let (data, response) = try await URLSession.shared.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    print("❌ Invalid HTTP response")
                    throw FootballAPIError.invalidResponse
                }
                
                print("📡 HTTP 응답 코드: \(httpResponse.statusCode)")
                
                if httpResponse.statusCode == 504 && retryCount < maxRetries {
                    // 504 Gateway Timeout - exponential backoff 적용
                    retryCount += 1
                    let delay = Double(retryCount) * 2.0 // 2초, 4초, 6초 지연
                    print("⚠️ 504 Gateway Timeout - 재시도 \(retryCount)/\(maxRetries) (\(delay)초 대기)")
                    try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                    continue
                }
                
                // 429 Rate Limit 에러 특별 처리
                if httpResponse.statusCode == 429 || (httpResponse.statusCode == 500 && String(data: data, encoding: .utf8)?.contains("429") == true) {
                    print("⚠️ Rate Limit 초과 감지 - 긴 대기 시간 필요")
                    // Rate limit manager 리셋하고 1분 대기
                    RateLimitManager.shared.reset()
                    
                    if retryCount < maxRetries {
                        retryCount += 1
                        let waitTime = Double(retryCount) * 10.0 // 10초, 20초, 30초 대기
                        print("⏳ Rate Limit 회복 대기: \(waitTime)초")
                        try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
                        continue
                    }
                    throw FootballAPIError.rateLimitExceeded
                }
                
                if httpResponse.statusCode != 200 {
                    print("❌ HTTP 오류: \(httpResponse.statusCode)")
                    if let errorData = String(data: data, encoding: .utf8) {
                        print("❌ 오류 응답: \(errorData)")
                        
                        // Edge Function 구독 오류 체크
                        if errorData.contains("You are not subscribed to this API") {
                            print("❌ Edge Function 구독 오류 감지 - 직접 API 호출로 전환")
                            throw FootballAPIError.edgeFunctionError("You are not subscribed to this API")
                        }
                        
                        // Edge Function이 없는 경우 (404) - 직접 API 폴백
                        if httpResponse.statusCode == 404 && errorData.contains("NOT_FOUND") {
                            print("❌ Edge Function이 배포되지 않음 - 직접 API 호출로 전환")
                            return try await fetchFixturesDirect(date: date, leagueId: leagueId)
                        }
                    }
                    throw FootballAPIError.httpError(httpResponse.statusCode)
                }
                
                // 응답 데이터 디버깅
                if let jsonString = String(data: data, encoding: .utf8) {
                    print("📋 API 응답 데이터 (처음 500자): \(String(jsonString.prefix(500)))")
                }
                
                let decoder = JSONDecoder()
                decoder.dateDecodingStrategy = .iso8601
                
                let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
                print("✅ Fixtures 응답: \(fixturesResponse.response.count)개 경기")
                
                // 응답이 비어있으면 추가 정보 출력
                if fixturesResponse.response.isEmpty {
                    print("⚠️ 빈 응답 - 요청 파라미터: date=\(date), league=\(leagueId ?? -1), season=\(season ?? -1)")
                }
                
                return fixturesResponse
            } catch {
                if retryCount < maxRetries {
                    retryCount += 1
                    print("⚠️ API 호출 실패 - 재시도 \(retryCount)/\(maxRetries): \(error)")
                    try await Task.sleep(nanoseconds: UInt64(Double(retryCount) * 1_000_000_000))
                    continue
                }
                
                // 최종 실패 시 직접 API 폴백 시도
                print("❌ Edge Function 호출 최종 실패, 직접 API 폴백 시도: \(error)")
                do {
                    return try await fetchFixturesDirect(date: date, leagueId: leagueId)
                } catch {
                    print("❌ 직접 API 폴백도 실패: \(error)")
                    throw error
                }
            }
        }
        
        // Should not reach here
        throw FootballAPIError.apiError(["Max retries exceeded"])
    }
    
    // MARK: - Standings
    
    func fetchStandings(leagueId: Int, season: Int) async throws -> StandingsResponse {
        let urlString = "\(supabaseURL)/functions/v1/unified-football-api"
        
        let requestBody: [String: Any] = [
            "endpoint": "standings",
            "params": [
                "league": leagueId,
                "season": season
            ]
        ]
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add request body
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
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
    func getTeamFixtures(teamId: Int, season: Int) async throws -> [Fixture] {
        // Rate Limit 확인
        let rateLimitManager = RateLimitManager.shared
        if !rateLimitManager.canMakeRequest() {
            let waitTime = rateLimitManager.timeUntilNextRequest()
            print("⏳ Rate Limit 대기: \(String(format: "%.1f", waitTime))초")
            if waitTime > 0 {
                try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
            }
        }
        
        let urlString = "\(supabaseURL)/functions/v1/football-api/fixtures?team=\(teamId)&season=\(season)"
        
        print("🌐 팀 경기 일정 조회: \(urlString)")
        
        // Rate Limit 기록
        rateLimitManager.recordRequest()
        
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
        
        return fixturesResponse.response
    }
}

// MARK: - Player API Methods

extension SupabaseFootballAPIService {
    func fetchPlayerProfile(playerId: Int, season: Int? = nil) async throws -> SupabasePlayerResponse {
        let currentSeason = season ?? Calendar.current.component(.year, from: Date())
        let urlString = "\(supabaseURL)/functions/v1/players-api/player?id=\(playerId)&season=\(currentSeason)"
        
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
        return try decoder.decode(SupabasePlayerResponse.self, from: data)
    }
    
    func fetchPlayerStatistics(playerId: Int, season: Int, leagueId: Int? = nil) async throws -> SupabasePlayerResponse {
        var urlString = "\(supabaseURL)/functions/v1/players-api/statistics?id=\(playerId)&season=\(season)"
        if let leagueId = leagueId {
            urlString += "&league=\(leagueId)"
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
        return try decoder.decode(SupabasePlayerResponse.self, from: data)
    }
}

// MARK: - Search API Methods

extension SupabaseFootballAPIService {
    func searchAll(query: String) async throws -> FootballSearchResponse {
        let encodedQuery = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let urlString = "\(supabaseURL)/functions/v1/search-api?query=\(encodedQuery)&type=all"
        
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
        return try decoder.decode(FootballSearchResponse.self, from: data)
    }
    
    // Search teams by name
    func searchTeams(query: String, limit: Int = 10) async throws -> [TeamProfile] {
        // For now, return empty array - implement later with proper search
        return []
    }
    
    // Search players by name  
    func searchPlayers(query: String, leagueId: Int? = nil, season: Int? = nil) async throws -> [PlayerProfileData] {
        // For now, return empty array - implement later with proper search
        return []
    }
    
    // Generic request method for LiveMatchService compatibility
    func performRequest<T: Decodable>(
        endpoint: String,
        parameters: [String: Any] = [:],
        cachePolicy: CachePolicy = .standard,
        forceRefresh: Bool = false
    ) async throws -> T {
        // Build request body for unified-football-api
        let requestBody: [String: Any] = [
            "endpoint": endpoint,
            "params": parameters
        ]
        
        // Build URL
        let urlString = "\(supabaseURL)/functions/v1/unified-football-api"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add request body
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
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

// Cache policy enum for LiveMatchService
enum CachePolicy {
    case short
    case veryShort
    case standard
    case long
    case never
}

// MARK: - Fixture Detail Methods

extension SupabaseFootballAPIService {
    func getFixtureEvents(fixtureId: Int, teamId: Int? = nil, playerId: Int? = nil) async throws -> [FixtureEvent] {
        let response = try await fetchFixtureEvents(fixtureId: fixtureId)
        return response.response
    }
    
    func getFixtureStatistics(fixtureId: Int, teamId: Int? = nil, type: StatisticType? = nil) async throws -> [TeamStatistics] {
        let response = try await fetchFixtureStatistics(fixtureId: fixtureId)
        return response.response
    }
    
    func getFixtureHalfStatistics(fixtureId: Int) async throws -> [HalfTeamStatistics] {
        // For now, return empty array as half statistics might not be available
        return []
    }
    
    func getFixtureLineups(fixtureId: Int, teamId: Int? = nil) async throws -> [TeamLineup] {
        let response = try await fetchFixtureLineups(fixtureId: fixtureId)
        return response.response
    }
    
    func getFixturePlayersStatistics(fixtureId: Int) async throws -> [TeamPlayersStatistics] {
        // Fetch from Edge Function that combines lineup and player stats
        let urlString = "\(supabaseURL)/functions/v1/fixtures-api/fixture-details?fixture=\(fixtureId)&type=players"
        
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
        let playersResponse = try decoder.decode(FixturePlayersResponse.self, from: data)
        return playersResponse.response
    }
    
    func getHeadToHead(team1Id: Int, team2Id: Int, last: Int = 10) async throws -> [Fixture] {
        let urlString = "\(supabaseURL)/functions/v1/fixtures-api/head2head?team1=\(team1Id)&team2=\(team2Id)&last=\(last)"
        
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
        let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
        return fixturesResponse.response
    }
    
    // Get fixtures with multiple parameters (for LeagueProfileViewModel)
    func getFixtures(
        leagueId: Int,
        season: Int,
        from: Date? = nil,
        to: Date? = nil,
        last: Int? = nil,
        next: Int? = nil
    ) async throws -> [Fixture] {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        
        var urlString = "\(supabaseURL)/functions/v1/fixtures-api/fixtures?"
        var params: [String] = []
        
        params.append("league=\(leagueId)")
        params.append("season=\(season)")
        
        if let from = from {
            params.append("from=\(dateFormatter.string(from: from))")
        }
        if let to = to {
            params.append("to=\(dateFormatter.string(from: to))")
        }
        if let last = last {
            params.append("last=\(last)")
        }
        if let next = next {
            params.append("next=\(next)")
        }
        
        urlString += params.joined(separator: "&")
        
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
        let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
        return fixturesResponse.response
    }
    
    func getTeamFixtures(teamId: Int, season: Int, last: Int? = nil, forceRefresh: Bool = false) async throws -> [Fixture] {
        let urlString = "\(supabaseURL)/functions/v1/fixtures-api/fixtures?team=\(teamId)&season=\(season)"
        
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
            // Edge Function 오류 메시지 확인
            if let errorData = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorMessage = errorData["error"] as? String {
                print("❌ Edge Function 오류: \(errorMessage)")
                if errorMessage.contains("You are not subscribed to this API") {
                    throw FootballAPIError.edgeFunctionError("API 구독이 필요합니다. Rapid API 구독을 확인하세요.")
                } else {
                    throw FootballAPIError.edgeFunctionError(errorMessage)
                }
            }
            throw FootballAPIError.httpError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
        
        print("✅ 팀 경기 응답: \(fixturesResponse.response.count)개 경기")
        
        // Filter by last N fixtures if specified
        if let last = last {
            return Array(fixturesResponse.response.prefix(last))
        }
        
        return fixturesResponse.response
    }
    
    func findFirstLegMatch(fixture: Fixture) async throws -> Fixture? {
        // This is a complex method that searches for first leg matches in knockout rounds
        // For now, return nil as it requires specific logic
        return nil
    }
    
    func getInjuries(fixtureId: Int? = nil, teamId: Int? = nil, season: Int? = nil, playerId: Int? = nil, date: String? = nil) async throws -> [InjuryData] {
        var urlString = "\(supabaseURL)/functions/v1/injuries-api?"
        var params: [String] = []
        
        if let fixtureId = fixtureId {
            params.append("fixture=\(fixtureId)")
        }
        if let teamId = teamId {
            params.append("team=\(teamId)")
        }
        if let season = season {
            params.append("season=\(season)")
        }
        if let playerId = playerId {
            params.append("player=\(playerId)")
        }
        if let date = date {
            params.append("date=\(date)")
        }
        
        urlString += params.joined(separator: "&")
        
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
        let injuriesResponse = try decoder.decode(InjuriesResponse.self, from: data)
        return injuriesResponse.response
    }
}

// MARK: - Season Helper Methods

extension SupabaseFootballAPIService {
    /// 리그별 현재 활성 시즌 확인
    func getCurrentSeasonForLeague(_ leagueId: Int) -> Int {
        let calendar = Calendar.current
        let now = Date()
        let currentYear = calendar.component(.year, from: now)
        let currentMonth = calendar.component(.month, from: now)
        
        // 리그별 시즌 규칙
        switch leagueId {
        case 39, 667: // Premier League, Club Friendlies
            return currentMonth >= 8 ? currentYear : currentYear - 1
        case 140: // La Liga  
            return currentMonth >= 8 ? currentYear : currentYear - 1
        case 135: // Serie A
            return currentMonth >= 8 ? currentYear : currentYear - 1
        case 78: // Bundesliga
            return currentMonth >= 8 ? currentYear : currentYear - 1
        case 61: // Ligue 1
            return currentMonth >= 8 ? currentYear : currentYear - 1
        case 2: // Champions League
            return currentMonth >= 8 ? currentYear : currentYear - 1
        case 3: // Europa League
            return currentMonth >= 8 ? currentYear : currentYear - 1
        case 292: // K League 1
            // K리그는 3월부터 11월까지 진행
            return currentMonth >= 3 ? currentYear : currentYear - 1
        case 293: // K League 2
            return currentMonth >= 3 ? currentYear : currentYear - 1
        case 253: // MLS
            return currentMonth >= 3 ? currentYear : currentYear - 1
        case 307: // Saudi Pro League
            // 사우디 프로 리그는 8월부터 시즌 시작 (유럽과 동일)
            return currentMonth >= 8 ? currentYear : currentYear - 1
        default:
            // 기본값: 8월부터 시즌 시작
            return currentMonth >= 8 ? currentYear : currentYear - 1
        }
    }
    
    /// 날짜에 따른 리그별 시즌 확인
    func getSeasonForLeagueAndDate(_ leagueId: Int, date: Date) -> Int {
        let calendar = Calendar.current
        let year = calendar.component(.year, from: date)
        let month = calendar.component(.month, from: date)
        
        // 리그별 시즌 규칙
        switch leagueId {
        case 667: // 클럽 친선경기 - 연중 진행되므로 현재 연도 사용
            return year
            
        case 39, 140, 135, 78, 61, 2, 3, 4, 5: // 유럽 리그 (챔스, 유로파, 컨퍼런스, 네이션스 포함)
            // 8월~7월 시즌 (예: 2024년 8월~2025년 7월 = 2024 시즌)
            return month >= 8 ? year : year - 1
            
        case 292, 293: // K리그 (3월~11월 시즌)
            // 3월~11월: 현재 연도, 12월~2월: 전년도
            return month >= 3 && month <= 11 ? year : year - 1
            
        case 253: // MLS (2월~12월 시즌)
            // MLS는 거의 연중 진행 (2월~12월)
            return year
            
        case 307: // Saudi Pro League (8월~5월 시즌)
            // 사우디 프로 리그는 유럽 리그와 동일한 시즌 주기
            return month >= 8 ? year : year - 1
            
        case 71: // 브라질 세리에 A (4월~12월 시즌)
            // 브라질 리그는 연중 진행
            return year
            
        case 15: // FIFA 클럽 월드컵
            // 2025년부터 새로운 포맷 (6-7월 개최)
            if year >= 2025 && month >= 6 && month <= 7 {
                return year // 2025년 6-7월 → 2025 시즌
            } else {
                // 기존 포맷은 12월 개최
                return month == 12 ? year : year - 1
            }
            
        case 94: // 포르투갈 프리메이라 리가
            // 유럽 시즌과 동일
            return month >= 8 ? year : year - 1
            
        case 88: // 네덜란드 에레디비시
            // 유럽 시즌과 동일
            return month >= 8 ? year : year - 1
            
        case 144: // 벨기에 프로 리그
            // 유럽 시즌과 동일
            return month >= 8 ? year : year - 1
            
        default:
            // 기본: 유럽 리그 규칙 (대부분의 리그가 8월 시작)
            // 7월인 경우 대부분 시즌 오프이므로 전 시즌 사용
            if month == 7 {
                print("⚠️ 리그 \(leagueId): 7월은 시즌 오프 기간, \(year - 1) 시즌 사용")
                return year - 1 // 전년도 시즌
            }
            return month >= 8 ? year : year - 1
        }
    }
}

// MARK: - Direct API Fallback
extension SupabaseFootballAPIService {
    // Supabase Edge Function이 실패하면 직접 API 호출
    func fetchFixturesDirect(date: String, leagueId: Int? = nil) async throws -> FixturesResponse {
        let apiService = FootballAPIService.shared
        
        var endpoint = "/fixtures?date=\(date)"
        if let leagueId = leagueId {
            endpoint += "&league=\(leagueId)"
        }
        
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
    }
}