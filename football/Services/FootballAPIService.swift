import Foundation

enum FootballAPIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case rateLimitExceeded
    case apiError([String])
    case decodingError(Error)
    case missingAPIKey
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "잘못된 URL입니다."
        case .invalidResponse:
            return "서버로부터 잘못된 응답을 받았습니다."
        case .rateLimitExceeded:
            return "API 요청 한도를 초과했습니다."
        case .apiError(let messages):
            return messages.joined(separator: ", ")
        case .decodingError(let error):
            return "데이터 디코딩 오류: \(error.localizedDescription)"
        case .missingAPIKey:
            return "API 키를 찾을 수 없습니다."
        }
    }
}

class FootballAPIService {
    private let baseURL = "https://api-football-v1.p.rapidapi.com/v3"
    private let host = "api-football-v1.p.rapidapi.com"
    private let apiKey: String
    
    private var requestsLimit: Int = 0
    private var requestsRemaining: Int = 0
    private var rateLimitPerMinute: Int = 0
    private var rateLimitRemainingPerMinute: Int = 0
    
    static let shared = FootballAPIService()
    
    // MARK: - Fixture Details
    
    func getFixtureEvents(fixtureId: Int) async throws -> [FixtureEvent] {
        let endpoint = "/fixtures/events?fixture=\(fixtureId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching events for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 Fixture Events Response:")
            print(prettyString)
        }
        
        let decoder = JSONDecoder()
        let eventsResponse = try decoder.decode(FixtureEventResponse.self, from: data)
        
        if !eventsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(eventsResponse.errors)
        }
        
        return eventsResponse.response
    }
    
    func getFixtureStatistics(fixtureId: Int) async throws -> [TeamStatistics] {
        let endpoint = "/fixtures/statistics?fixture=\(fixtureId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching statistics for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 Fixture Statistics Response:")
            print(prettyString)
        }
        
        let decoder = JSONDecoder()
        let statisticsResponse = try decoder.decode(FixtureStatisticsResponse.self, from: data)
        
        if !statisticsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(statisticsResponse.errors)
        }
        
        return statisticsResponse.response
    }
    
    func getFixtureLineups(fixtureId: Int) async throws -> [TeamLineup] {
        let endpoint = "/fixtures/lineups?fixture=\(fixtureId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching lineups for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 Fixture Lineups Response:")
            print(prettyString)
        }
        
        let decoder = JSONDecoder()
        let lineupsResponse = try decoder.decode(FixtureLineupResponse.self, from: data)
        
        if !lineupsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(lineupsResponse.errors)
        }
        
        return lineupsResponse.response
    }
    
    func getPlayerStatistics(playerId: Int, season: Int) async throws -> [PlayerStats] {
        let endpoint = "/players?id=\(playerId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching statistics for player \(playerId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 Player Statistics Response:")
            print(prettyString)
        }
        
        let decoder = JSONDecoder()
        let playerResponse = try decoder.decode(PlayerStatisticsResponse.self, from: data)
        
        if !playerResponse.errors.isEmpty {
            throw FootballAPIError.apiError(playerResponse.errors)
        }
        
        return playerResponse.response
    }
    
    private init() {
        // Info.plist에서 API 키 읽기
        guard let apiKey = Bundle.main.object(forInfoDictionaryKey: "FootballAPIKey") as? String else {
            fatalError("FootballAPIKey not found in Info.plist")
        }
        self.apiKey = apiKey
    }
    
    private func createRequest(_ endpoint: String) -> URLRequest {
        guard let url = URL(string: baseURL + endpoint) else {
            fatalError("Invalid URL: \(baseURL + endpoint)")
        }
        
        var request = URLRequest(url: url, 
                               cachePolicy: .useProtocolCachePolicy,
                               timeoutInterval: 10.0)
        
        request.addValue(apiKey, forHTTPHeaderField: "x-rapidapi-key")
        request.addValue(host, forHTTPHeaderField: "x-rapidapi-host")
        request.httpMethod = "GET"
        
        print("🌐 Request URL: \(url.absoluteString)")
        print("📋 Request Headers:")
        request.allHTTPHeaderFields?.forEach { key, value in
            let maskedValue = key.lowercased() == "x-rapidapi-key" ? "****" : value
            print("  \(key): \(maskedValue)")
        }
        
        return request
    }
    
    private func updateRateLimits(_ response: HTTPURLResponse) {
        // 일일 요청 제한
        if let limit = response.value(forHTTPHeaderField: "x-ratelimit-requests-limit"),
           let remaining = response.value(forHTTPHeaderField: "x-ratelimit-requests-remaining") {
            requestsLimit = Int(limit) ?? 0
            requestsRemaining = Int(remaining) ?? 0
        }
        
        // 분당 요청 제한
        if let perMinuteLimit = response.value(forHTTPHeaderField: "X-RateLimit-Limit"),
           let perMinuteRemaining = response.value(forHTTPHeaderField: "X-RateLimit-Remaining") {
            rateLimitPerMinute = Int(perMinuteLimit) ?? 0
            rateLimitRemainingPerMinute = Int(perMinuteRemaining) ?? 0
        }
        
        print("\n📊 API Requests:")
        print("  Daily - Limit: \(requestsLimit), Remaining: \(requestsRemaining)")
        print("  Per Minute - Limit: \(rateLimitPerMinute), Remaining: \(rateLimitRemainingPerMinute)")
    }
    
    private func handleResponse(_ response: URLResponse?) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        print("\n📥 Response Status Code: \(httpResponse.statusCode)")
        updateRateLimits(httpResponse)
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw FootballAPIError.apiError(["서버 오류: HTTP \(httpResponse.statusCode)"])
        }
        
        // 요청 제한 확인
        if requestsRemaining <= 0 {
            throw FootballAPIError.rateLimitExceeded
        }
    }
    
    private func handleError(_ error: Error, endpoint: String) {
        print("\n❌ API Error for endpoint \(endpoint):")
        print("Error: \(error.localizedDescription)")
    }
    
    private func getDateRange(forSeason season: Int) -> (from: String, to: String) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")
        
        let currentSeason = 2024
        let calendar = Calendar.current
        let today = Date()
        
        if season == currentSeason {
            // 현재 시즌인 경우 시즌 시작일부터 30일 후까지
            let from = "2023-08-01" // 시즌 시작일
            let to = dateFormatter.string(from: calendar.date(byAdding: .day, value: 30, to: today) ?? today)
            
            print("📅 Current season date range: \(from) ~ \(to)")
            return (from, to)
        } else {
            // 과거 시즌인 경우 해당 시즌의 전체 기간
            let fromStr = "\(season)-07-01" // 시즌 시작
            let toStr = "\(season + 1)-06-30" // 시즌 종료
            
            print("📅 Past season date range: \(fromStr) ~ \(toStr)")
            return (fromStr, toStr)
        }
    }
    
    func getFixtures(leagueId: Int, season: Int) async throws -> [Fixture] {
        var allFixtures: [Fixture] = []
        let decoder = JSONDecoder()
        let dateRange = getDateRange(forSeason: season)
        
        // 1. 실시간 경기 가져오기 (현재 시즌만)
        if season == 2024 {
            let liveEndpoint = "/fixtures?live=all&league=\(leagueId)&season=\(season)"
            let liveRequest = createRequest(liveEndpoint)
            
            print("\n📡 Fetching live fixtures for league \(leagueId)...")
            let (liveData, liveResponse) = try await URLSession.shared.data(for: liveRequest)
            try handleResponse(liveResponse)
            
            // API 응답 로깅
            if let jsonObject = try? JSONSerialization.jsonObject(with: liveData),
               let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
               let prettyString = String(data: prettyData, encoding: .utf8) {
                print("\n📦 Live Fixtures Response:")
                print(prettyString)
            }
            
            let liveFixtures = try decoder.decode(FixturesResponse.self, from: liveData)
            if !liveFixtures.errors.isEmpty {
                throw FootballAPIError.apiError(liveFixtures.errors)
            }
            allFixtures.append(contentsOf: liveFixtures.response)
            
            // API 요청 제한을 고려한 딜레이
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
        }
        
        // 2. 날짜 범위로 경기 가져오기
        let fixturesEndpoint = "/fixtures?league=\(leagueId)&season=\(season)&from=\(dateRange.from)&to=\(dateRange.to)"
        let fixturesRequest = createRequest(fixturesEndpoint)
        
        print("\n📡 Fetching fixtures for league \(leagueId)...")
        let (fixturesData, fixturesResponse) = try await URLSession.shared.data(for: fixturesRequest)
        try handleResponse(fixturesResponse)
        
        // API 응답 로깅
        if let jsonObject = try? JSONSerialization.jsonObject(with: fixturesData),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 Fixtures Response:")
            print(prettyString)
        }
        
        let fixtures = try decoder.decode(FixturesResponse.self, from: fixturesData)
        if !fixtures.errors.isEmpty {
            throw FootballAPIError.apiError(fixtures.errors)
        }
        allFixtures.append(contentsOf: fixtures.response)
        
        // 중복 제거
        allFixtures = Array(Set(allFixtures))
        
        print("\n✅ Successfully fetched \(allFixtures.count) fixtures for league \(leagueId)")
        return allFixtures.sorted { fixture1, fixture2 in
            fixture1.fixture.date < fixture2.fixture.date
        }
    }
    
    func getLeagueDetails(leagueId: Int, season: Int) async throws -> LeagueDetails {
        let endpoint = "/leagues?id=\(leagueId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching league details for league \(leagueId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 League Details Response:")
            print(prettyString)
        }
        
        let decoder = JSONDecoder()
        let leaguesResponse = try decoder.decode(LeaguesResponse.self, from: data)
        
        if !leaguesResponse.errors.isEmpty {
            throw FootballAPIError.apiError(leaguesResponse.errors)
        }
        
        guard let leagueDetails = leaguesResponse.response.first else {
            throw FootballAPIError.apiError(["리그 정보를 찾을 수 없습니다."])
        }
        
        return leagueDetails
    }
    
    func getCurrentLeagues() async throws -> [LeagueDetails] {
        var allLeagues: [LeagueDetails] = []
        let currentSeason = 2024 // 2023-24 시즌
        
        print("\n🎯 Starting to fetch league details...")
        
        for leagueId in SupportedLeagues.allLeagues {
            do {
                print("\n🏆 Fetching details for league \(leagueId) (\(SupportedLeagues.getName(leagueId)))")
                let league = try await getLeagueDetails(leagueId: leagueId, season: currentSeason)
                allLeagues.append(league)
                
                // API 요청 제한을 고려한 딜레이
                if leagueId != SupportedLeagues.allLeagues.last {
                    try await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
                }
            } catch {
                print("❌ Error fetching league details for league \(leagueId): \(error.localizedDescription)")
                continue
            }
        }
        
        print("\n📊 Total leagues fetched: \(allLeagues.count)")
        return allLeagues
    }
    
    func getStandings(leagueId: Int, season: Int) async throws -> [Standing] {
        let endpoint = "/standings?league=\(leagueId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching standings for league \(leagueId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 Standings Response:")
            print(prettyString)
        }
        
        let decoder = JSONDecoder()
        let standingsResponse = try decoder.decode(StandingsResponse.self, from: data)
        
        if !standingsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(standingsResponse.errors)
        }
        
        guard let standings = standingsResponse.response.first?.league.standings.first else {
            throw FootballAPIError.apiError(["순위 정보를 찾을 수 없습니다."])
        }
        
        return standings
    }
}