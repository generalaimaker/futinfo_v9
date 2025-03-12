import Foundation

enum FootballAPIError: LocalizedError, Equatable {
    case invalidURL
    case invalidResponse
    case rateLimitExceeded
    case apiError([String])     // 원래 배열 형태로 되돌림
    case decodingError(Error)
    case missingAPIKey
    
    static func == (lhs: FootballAPIError, rhs: FootballAPIError) -> Bool {
        switch (lhs, rhs) {
        case (.invalidURL, .invalidURL),
             (.invalidResponse, .invalidResponse),
             (.rateLimitExceeded, .rateLimitExceeded),
             (.missingAPIKey, .missingAPIKey):
            return true
        case (.apiError(let lhsErrors), .apiError(let rhsErrors)):
            return lhsErrors == rhsErrors
        case (.decodingError, .decodingError):
            // Error 프로토콜은 Equatable을 준수하지 않으므로 타입만 비교
            return true
        default:
            return false
        }
    }
    
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
    
    // MARK: - Leagues
    
    func getCurrentLeagues() async throws -> [LeagueDetails] {
        var allLeagues: [LeagueDetails] = []
        let currentSeason = 2024 // 2024-25 시즌
        
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
    
    func getLeagueDetails(leagueId: Int, season: Int) async throws -> LeagueDetails {
        let endpoint = "/leagues?id=\(leagueId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching league details for league \(leagueId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "League Details")
        
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
    
    // MARK: - Standings
    
    func getStandings(leagueId: Int, season: Int) async throws -> [Standing] {
        let endpoint = "/standings?league=\(leagueId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching standings for league \(leagueId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Standings")
        
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
    
    // MARK: - Fixture Events
    
    func getFixtureEvents(fixtureId: Int, teamId: Int? = nil, playerId: Int? = nil) async throws -> [FixtureEvent] {
        var endpoint = "/fixtures/events?fixture=\(fixtureId)"
        if let teamId = teamId {
            endpoint += "&team=\(teamId)"
        }
        if let playerId = playerId {
            endpoint += "&player=\(playerId)"
        }
        
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching events for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Fixture Events")
        
        let decoder = JSONDecoder()
        let eventsResponse = try decoder.decode(FixtureEventResponse.self, from: data)
        
        if !eventsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(eventsResponse.errors)
        }
        
        return eventsResponse.response
    }
    
    // MARK: - Fixture Statistics
    
    func getFixtureStatistics(fixtureId: Int, teamId: Int? = nil, type: StatisticType? = nil, includeHalves: Bool = false) async throws -> [TeamStatistics] {
        var endpoint = "/fixtures/statistics?fixture=\(fixtureId)"
        if let teamId = teamId {
            endpoint += "&team=\(teamId)"
        }
        if let type = type {
            endpoint += "&type=\(type.rawValue.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? type.rawValue)"
        }
        if includeHalves {
            endpoint += "&half=true"
        }
        
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching statistics for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        print("\n📦 Raw Statistics Response:")
        if let jsonString = String(data: data, encoding: .utf8) {
            print(jsonString)
        }
        
        // 통계 데이터 구조 자세히 출력
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let response = json["response"] as? [[String: Any]] {
            print("\n📊 Detailed Statistics:")
            for teamStats in response {
                if let team = teamStats["team"] as? [String: Any],
                   let teamName = team["name"] as? String,
                   let statistics = teamStats["statistics"] as? [[String: Any]] {
                    print("\n🏃‍♂️ Team: \(teamName)")
                    for stat in statistics {
                        if let type = stat["type"] as? String,
                           let value = stat["value"] {
                            print("   • \(type): \(value)")
                        }
                    }
                }
            }
        }
        
        do {
            // 먼저 JSON 구조 출력
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                print("\n📦 JSON Structure:")
                print(json)
            }
            
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            
            do {
                let statisticsResponse = try decoder.decode(FixtureStatisticsResponse.self, from: data)
                
                if !statisticsResponse.errors.isEmpty {
                    throw FootballAPIError.apiError(statisticsResponse.errors)
                }
                
                print("\n✅ Successfully decoded statistics response")
                print("📊 Teams found: \(statisticsResponse.response.count)")
                for team in statisticsResponse.response {
                    print("   - \(team.team.name): \(team.statistics.count) statistics")
                    for stat in team.statistics {
                        print("     • Type: '\(stat.type)'")
                    print("       Raw Type: '\(stat.type)'")
                    print("       Raw Value: '\(stat.value)'")
                    print("       Display Value: '\(stat.value.displayValue)'")
                    print("       Dictionary Key: '\(stat.type)'")
                    print("       All Stats Keys: '\(team.statistics.map { $0.type }.joined(separator: ", "))'")
                    }
                }
                
                return statisticsResponse.response
                
            } catch DecodingError.keyNotFound(let key, let context) {
                print("❌ Key '\(key)' not found:", context.debugDescription)
                print("Coding path:", context.codingPath)
                throw FootballAPIError.decodingError(DecodingError.keyNotFound(key, context))
            } catch DecodingError.typeMismatch(let type, let context) {
                print("❌ Type '\(type)' mismatch:", context.debugDescription)
                print("Coding path:", context.codingPath)
                throw FootballAPIError.decodingError(DecodingError.typeMismatch(type, context))
            } catch {
                print("❌ Other decoding error:", error)
                throw FootballAPIError.decodingError(error)
            }
            
        } catch {
            print("\n❌ Failed to decode statistics response: \(error)")
            throw FootballAPIError.decodingError(error)
        }
    }
    
    func getFixtureHalfStatistics(fixtureId: Int) async throws -> [HalfTeamStatistics] {
        let endpoint = "/fixtures/statistics?fixture=\(fixtureId)&half=true"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching half statistics for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        print("\n📦 Raw Half Statistics Response:")
        if let jsonString = String(data: data, encoding: .utf8) {
            print(jsonString)
        }
        
        // JSON 구조 출력
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            print("\n📦 JSON Structure:")
            print(json)
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let statisticsResponse = try decoder.decode(HalfStatisticsResponse.self, from: data)
        
        if !statisticsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(statisticsResponse.errors)
        }
        
        print("\n✅ Successfully decoded half statistics response")
        print("📊 Teams found: \(statisticsResponse.response.count)")
        for team in statisticsResponse.response {
            print("   - \(team.team.name):")
            let stats = team.halfStats
            print("     First Half: \(stats.firstHalf.count) statistics")
            for stat in stats.firstHalf {
                print("       • \(stat.type): \(stat.value.displayValue)")
            }
            print("     Second Half: \(stats.secondHalf.count) statistics")
            for stat in stats.secondHalf {
                print("       • \(stat.type): \(stat.value.displayValue)")
            }
        }
        
        return statisticsResponse.response
    }
    
    // MARK: - Fixture Players Statistics
    
    func getFixturePlayersStatistics(fixtureId: Int) async throws -> [TeamPlayersStatistics] {
        let endpoint = "/fixtures/players?fixture=\(fixtureId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching players statistics for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Fixture Players Statistics")
        
        let decoder = JSONDecoder()
        let playersResponse = try decoder.decode(FixturePlayersResponse.self, from: data)
        
        if !playersResponse.errors.isEmpty {
            throw FootballAPIError.apiError(playersResponse.errors)
        }
        
        return playersResponse.response
    }
    
    // MARK: - Player Statistics
    
    func getPlayerStatistics(playerId: Int, season: Int) async throws -> [PlayerProfileData] {
        let endpoint = "/players?id=\(playerId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching statistics for player \(playerId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Player Statistics")
        
        let decoder = JSONDecoder()
        let playerResponse = try decoder.decode(PlayerStatisticsResponse.self, from: data)
        
        if !playerResponse.errors.isEmpty {
            throw FootballAPIError.apiError(playerResponse.errors)
        }
        
        return playerResponse.response
    }
    
    // MARK: - Team Fixtures
    
    func getTeamFixtures(teamId: Int, season: Int, last: Int? = nil) async throws -> [Fixture] {
        var endpoint = "/fixtures?team=\(teamId)&season=\(season)"
        if let last = last {
            endpoint += "&last=\(last)"
        }
        
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching fixtures for team \(teamId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Team Fixtures")
        
        let decoder = JSONDecoder()
        let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
        
        if !fixturesResponse.errors.isEmpty {
            throw FootballAPIError.apiError(fixturesResponse.errors)
        }
        
        return fixturesResponse.response.sorted { fixture1, fixture2 in
            fixture1.fixture.date > fixture2.fixture.date
        }
    }
    
    // MARK: - Fixtures
    
    func getFixtures(leagueIds: [Int], season: Int) async throws -> [Fixture] {
        var allFixtures: [Fixture] = []
        let decoder = JSONDecoder()
        let dateRange = getDateRange(forSeason: season)
        
        // 리그 ID를 쉼표로 구분된 문자열로 변환
        let leaguesStr = leagueIds.map { String($0) }.joined(separator: ",")
        
        // 1. 실시간 경기 가져오기 (현재 시즌만)
        if season == 2024 {
            let liveEndpoint = "/fixtures?live=all&league=\(leaguesStr)&season=\(season)"
            let liveRequest = createRequest(liveEndpoint)
            
            print("\n📡 Fetching live fixtures for leagues \(leaguesStr)...")
            
            do {
                let (liveData, liveResponse) = try await URLSession.shared.data(for: liveRequest)
                try handleResponse(liveResponse)
                
                // API 응답 로깅
                logResponse(data: liveData, endpoint: "Live Fixtures")
                
                let liveFixtures = try decoder.decode(FixturesResponse.self, from: liveData)
                if !liveFixtures.errors.isEmpty {
                    print("⚠️ Live fixtures API errors: \(liveFixtures.errors.joined(separator: ", "))")
                } else {
                    print("✅ Found \(liveFixtures.response.count) live fixtures")
                    allFixtures.append(contentsOf: liveFixtures.response)
                }
            } catch {
                print("⚠️ Error fetching live fixtures: \(error.localizedDescription)")
                // 라이브 경기 로드 실패는 무시하고 계속 진행
            }
            
            // API 요청 제한을 고려한 딜레이
            do {
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
            } catch {
                if error is CancellationError {
                    print("⚠️ Task cancelled during delay (normal)")
                } else {
                    print("⚠️ Task.sleep error: \(error.localizedDescription)")
                }
            }
        }
        
        // 2. 날짜 범위로 경기 가져오기
        let fixturesEndpoint = "/fixtures?league=\(leaguesStr)&season=\(season)&from=\(dateRange.from)&to=\(dateRange.to)"
        let fixturesRequest = createRequest(fixturesEndpoint)
        
        print("\n📡 Fetching fixtures for leagues \(leaguesStr)...")
        print("📅 Date range: \(dateRange.from) to \(dateRange.to)")
        
        let (fixturesData, fixturesResponse) = try await URLSession.shared.data(for: fixturesRequest)
        try handleResponse(fixturesResponse)
        
        // API 응답 로깅
        logResponse(data: fixturesData, endpoint: "Fixtures")
        
        let fixtures = try decoder.decode(FixturesResponse.self, from: fixturesData)
        if !fixtures.errors.isEmpty {
            throw FootballAPIError.apiError(fixtures.errors)
        }
        
        print("✅ Received \(fixtures.response.count) fixtures from API")
        allFixtures.append(contentsOf: fixtures.response)
        
        // 중복 제거
        let uniqueFixtures = Array(Set(allFixtures))
        
        print("\n✅ Successfully fetched \(uniqueFixtures.count) unique fixtures for leagues \(leaguesStr)")
        return uniqueFixtures.sorted { fixture1, fixture2 in
            fixture1.fixture.date < fixture2.fixture.date
        }
    }
    
    // 단일 리그 버전 (이전 버전과의 호환성 유지)
    func getFixtures(leagueId: Int, season: Int) async throws -> [Fixture] {
        return try await getFixtures(leagueIds: [leagueId], season: season)
    }
    
    // MARK: - Head to Head
    
    func getHeadToHead(team1Id: Int, team2Id: Int, last: Int = 20) async throws -> [Fixture] {
        let endpoint = "/fixtures/headtohead?h2h=\(team1Id)-\(team2Id)&last=\(last)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching head to head statistics...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Head to Head")
        
        let decoder = JSONDecoder()
        let headToHeadResponse = try decoder.decode(HeadToHeadResponse.self, from: data)
        
        if !headToHeadResponse.errors.isEmpty {
            throw FootballAPIError.apiError(headToHeadResponse.errors)
        }
        
        return headToHeadResponse.response
    }
    
    // MARK: - Lineups
    
    func getFixtureLineups(fixtureId: Int, teamId: Int? = nil) async throws -> [TeamLineup] {
        var endpoint = "/fixtures/lineups?fixture=\(fixtureId)"
        if let teamId = teamId {
            endpoint += "&team=\(teamId)"
        }
        
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching lineups for fixture \(fixtureId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Fixture Lineups")
        
        let decoder = JSONDecoder()
        let lineupsResponse = try decoder.decode(FixtureLineupResponse.self, from: data)
        
        if !lineupsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(lineupsResponse.errors)
        }
        
        return lineupsResponse.response
    }
    
    // MARK: - Team Profile
    
    func getTeamProfile(teamId: Int) async throws -> TeamProfile {
        let endpoint = "/teams?id=\(teamId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching team profile for team \(teamId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Team Profile")
        
        let decoder = JSONDecoder()
        let profileResponse = try decoder.decode(TeamProfileResponse.self, from: data)
        
        if !profileResponse.errors.isEmpty {
            throw FootballAPIError.apiError(profileResponse.errors)
        }
        
        guard let profile = profileResponse.response.first else {
            throw FootballAPIError.apiError(["팀 정보를 찾을 수 없습니다."])
        }
        
        return profile
    }
    
    // MARK: - Team Statistics and Standing
    func getTeamStatistics(teamId: Int, leagueId: Int, season: Int) async throws -> TeamSeasonStatistics {
        let endpoint = "/teams/statistics?team=\(teamId)&league=\(leagueId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching team statistics for team \(teamId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Team Statistics")
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let statsResponse = try decoder.decode(TeamStatisticsResponse.self, from: data)
        
        if !statsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(statsResponse.errors)
        }
        
        return statsResponse.response
    }
    
    func getTeamStanding(teamId: Int, leagueId: Int, season: Int) async throws -> TeamStanding? {
        let endpoint = "/standings?team=\(teamId)&league=\(leagueId)&season=\(season)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching team standing for team \(teamId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Team Standing")
        
        let decoder = JSONDecoder()
        let standingResponse = try decoder.decode(TeamStandingResponse.self, from: data)
        
        if !standingResponse.errors.isEmpty {
            throw FootballAPIError.apiError(standingResponse.errors)
        }
        
        return standingResponse.response.first?.league.standings.first?.first
    }
    
    // MARK: - Player Profile
    
    func getPlayerProfile(playerId: Int) async throws -> PlayerProfileData {
        // 1. 먼저 players/profiles 엔드포인트로 최신 선수 정보 시도
        do {
            let profileData = try await getPlayerProfileFromProfiles(playerId: playerId)
            print("✅ Successfully loaded player profile from profiles endpoint")
            return profileData
        } catch {
            print("⚠️ Failed to load player profile from profiles endpoint: \(error.localizedDescription)")
            print("⚠️ Falling back to season-based endpoint...")
            // 실패하면 기존 시즌 기반 메서드로 폴백
            return try await getPlayerProfileFromSeasons(playerId: playerId)
        }
    }
    
    // 기존 시즌 기반 메서드 (이름 변경)
    private func getPlayerProfileFromSeasons(playerId: Int) async throws -> PlayerProfileData {
        // 시도할 시즌 목록 (최신 시즌부터)
        let seasons = [2024, 2023, 2022]
        var lastError: Error? = nil
        
        // 각 시즌을 순차적으로 시도
        for season in seasons {
            do {
                let endpoint = "/players?id=\(playerId)&season=\(season)"
                let request = createRequest(endpoint)
                
                print("\n📡 Fetching profile for player \(playerId) (season \(season))...")
                let (data, response) = try await URLSession.shared.data(for: request)
                try handleResponse(response)
                
                // API 응답 로깅
                logResponse(data: data, endpoint: "Player Profile (Season \(season))")
                
                // JSON 구조 분석 (디버깅용)
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    print("\n📊 Player Profile JSON Structure:")
                    if let results = json["results"] as? Int {
                        print("Results: \(results)")
                    }
                    if let response = json["response"] as? [[String: Any]], !response.isEmpty {
                        print("Response items: \(response.count)")
                        if let firstPlayer = response.first {
                            print("Player keys: \(firstPlayer.keys.joined(separator: ", "))")
                            if let player = firstPlayer["player"] as? [String: Any] {
                                print("Player info keys: \(player.keys.joined(separator: ", "))")
                            }
                            if let statistics = firstPlayer["statistics"] as? [[String: Any]] {
                                print("Statistics items: \(statistics.count)")
                            }
                        }
                    }
                }
                
                let decoder = JSONDecoder()
                
                // 디코딩 시도
                do {
                    let profileResponse = try decoder.decode(PlayerProfileResponse.self, from: data)
                    
                    if !profileResponse.errors.isEmpty {
                        print("⚠️ API errors: \(profileResponse.errors.joined(separator: ", "))")
                        continue // 다음 시즌 시도
                    }
                    
                    guard profileResponse.results > 0,
                          let profile = profileResponse.response.first else {
                        print("⚠️ No player data found for season \(season)")
                        continue // 다음 시즌 시도
                    }
                    
                    print("✅ Successfully loaded player profile for season \(season)")
                    return profile
                    
                } catch DecodingError.keyNotFound(let key, let context) {
                    print("❌ Decoding error - Key '\(key)' not found: \(context.debugDescription)")
                    print("Coding path: \(context.codingPath)")
                    lastError = DecodingError.keyNotFound(key, context)
                    continue // 다음 시즌 시도
                } catch DecodingError.typeMismatch(let type, let context) {
                    print("❌ Decoding error - Type '\(type)' mismatch: \(context.debugDescription)")
                    print("Coding path: \(context.codingPath)")
                    lastError = DecodingError.typeMismatch(type, context)
                    continue // 다음 시즌 시도
                } catch {
                    print("❌ Other decoding error: \(error)")
                    lastError = error
                    continue // 다음 시즌 시도
                }
            } catch {
                print("❌ API request error for season \(season): \(error)")
                lastError = error
                continue // 다음 시즌 시도
            }
        }
        
        // 모든 시즌에서 실패한 경우
        if let error = lastError {
            throw FootballAPIError.decodingError(error)
        } else {
            throw FootballAPIError.apiError(["선수 정보를 찾을 수 없습니다."])
        }
    }
    
    // 새로운 profiles 엔드포인트 메서드
    private func getPlayerProfileFromProfiles(playerId: Int) async throws -> PlayerProfileData {
        let endpoint = "/players/profiles?id=\(playerId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching profile for player \(playerId) from profiles endpoint...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Player Profiles")
        
        // JSON 구조 분석 (디버깅용)
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            print("\n📊 Player Profiles JSON Structure:")
            if let results = json["results"] as? Int {
                print("Results: \(results)")
            }
            if let response = json["response"] as? [[String: Any]], !response.isEmpty {
                print("Response items: \(response.count)")
                if let firstPlayer = response.first {
                    print("Player keys: \(firstPlayer.keys.joined(separator: ", "))")
                }
            }
        }
        
        let decoder = JSONDecoder()
        
        // 디코딩 시도
        do {
            // 응답 구조가 다를 수 있으므로 먼저 일반 구조로 디코딩
            let profileResponse = try decoder.decode(PlayerProfileResponse.self, from: data)
            
            if !profileResponse.errors.isEmpty {
                throw FootballAPIError.apiError(profileResponse.errors)
            }
            
            guard profileResponse.results > 0,
                  let profile = profileResponse.response.first else {
                throw FootballAPIError.apiError(["선수 정보를 찾을 수 없습니다."])
            }
            
            return profile
            
        } catch DecodingError.keyNotFound(let key, let context) {
            print("❌ Profiles decoding error - Key '\(key)' not found: \(context.debugDescription)")
            print("Coding path: \(context.codingPath)")
            throw FootballAPIError.decodingError(DecodingError.keyNotFound(key, context))
        } catch DecodingError.typeMismatch(let type, let context) {
            print("❌ Profiles decoding error - Type '\(type)' mismatch: \(context.debugDescription)")
            print("Coding path: \(context.codingPath)")
            throw FootballAPIError.decodingError(DecodingError.typeMismatch(type, context))
        } catch {
            print("❌ Other profiles decoding error: \(error)")
            throw FootballAPIError.decodingError(error)
        }
    }
    
    func getPlayerCareerStats(playerId: Int) async throws -> [PlayerCareerStats] {
        let endpoint = "/players/teams?player=\(playerId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching career stats for player \(playerId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Player Career")
        
        // JSON 구조 분석 (디버깅용)
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            print("\n📊 Player Career JSON Structure:")
            if let results = json["results"] as? Int {
                print("Results: \(results)")
            }
            if let response = json["response"] as? [[String: Any]], !response.isEmpty {
                print("Response items: \(response.count)")
                if let firstTeam = response.first {
                    print("Team keys: \(firstTeam.keys.joined(separator: ", "))")
                }
            }
        }
        
        let decoder = JSONDecoder()
        
        do {
            let careerResponse = try decoder.decode(PlayerCareerResponse.self, from: data)
            
            if !careerResponse.errors.isEmpty {
                print("⚠️ API errors: \(careerResponse.errors.joined(separator: ", "))")
                return [] // 에러가 있지만 빈 배열 반환하여 앱이 계속 작동하도록 함
            }
            
            guard careerResponse.results > 0,
                  !careerResponse.response.isEmpty else {
                print("⚠️ No career data found for player \(playerId)")
                return [] // 데이터가 없지만 빈 배열 반환하여 앱이 계속 작동하도록 함
            }
            
            // CareerTeamResponse를 PlayerCareerStats로 변환
            return careerResponse.response.map { teamResponse in
                PlayerCareerStats(
                    team: teamResponse.team,
                    seasons: teamResponse.seasons
                )
            }
            
        } catch DecodingError.keyNotFound(let key, let context) {
            print("❌ Career decoding error - Key '\(key)' not found: \(context.debugDescription)")
            print("Coding path: \(context.codingPath)")
            return [] // 디코딩 에러가 있지만 빈 배열 반환하여 앱이 계속 작동하도록 함
        } catch DecodingError.typeMismatch(let type, let context) {
            print("❌ Career decoding error - Type '\(type)' mismatch: \(context.debugDescription)")
            print("Coding path: \(context.codingPath)")
            return [] // 디코딩 에러가 있지만 빈 배열 반환하여 앱이 계속 작동하도록 함
        } catch {
            print("❌ Other career decoding error: \(error)")
            throw FootballAPIError.decodingError(error)
        }
    }
    
    func getPlayerSeasonalStats(playerId: Int, season: Int) async throws -> [PlayerSeasonStats] {
        // 시도할 시즌 목록 (지정된 시즌과 이전 시즌들)
        let seasons = [season, season-1, season-2].filter { $0 > 0 }
        var lastError: Error? = nil
        
        // 각 시즌을 순차적으로 시도
        for trySeason in seasons {
            do {
                let endpoint = "/players?id=\(playerId)&season=\(trySeason)"
                let request = createRequest(endpoint)
                
                print("\n📡 Fetching seasonal stats for player \(playerId) (season \(trySeason))...")
                let (data, response) = try await URLSession.shared.data(for: request)
                try handleResponse(response)
                
                // API 응답 로깅
                logResponse(data: data, endpoint: "Player Seasonal Stats (Season \(trySeason))")
                
                // JSON 구조 분석 (디버깅용)
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    print("\n📊 Player Seasonal Stats JSON Structure:")
                    if let results = json["results"] as? Int {
                        print("Results: \(results)")
                    }
                }
                
                let decoder = JSONDecoder()
                
                do {
                    let statsResponse = try decoder.decode(PlayerSeasonalStatsResponse.self, from: data)
                    
                    if !statsResponse.errors.isEmpty {
                        print("⚠️ API errors: \(statsResponse.errors.joined(separator: ", "))")
                        continue // 다음 시즌 시도
                    }
                    
                    guard statsResponse.results > 0,
                          !statsResponse.response.isEmpty else {
                        print("⚠️ No seasonal stats found for player \(playerId) in season \(trySeason)")
                        continue // 다음 시즌 시도
                    }
                    
                    print("✅ Successfully loaded seasonal stats for player \(playerId) in season \(trySeason)")
                    return statsResponse.response
                    
                } catch DecodingError.keyNotFound(let key, let context) {
                    print("❌ Seasonal stats decoding error - Key '\(key)' not found: \(context.debugDescription)")
                    print("Coding path: \(context.codingPath)")
                    lastError = DecodingError.keyNotFound(key, context)
                    continue // 다음 시즌 시도
                } catch DecodingError.typeMismatch(let type, let context) {
                    print("❌ Seasonal stats decoding error - Type '\(type)' mismatch: \(context.debugDescription)")
                    print("Coding path: \(context.codingPath)")
                    lastError = DecodingError.typeMismatch(type, context)
                    continue // 다음 시즌 시도
                } catch {
                    print("❌ Other seasonal stats decoding error: \(error)")
                    lastError = error
                    continue // 다음 시즌 시도
                }
            } catch {
                print("❌ API request error for season \(trySeason): \(error)")
                lastError = error
                continue // 다음 시즌 시도
            }
        }
        
        // 모든 시즌에서 실패한 경우
        if let error = lastError {
            throw FootballAPIError.decodingError(error)
        } else {
            throw FootballAPIError.apiError(["선수 시즌 통계를 찾을 수 없습니다."])
        }
    }
    
    // MARK: - Team Squad
    func getTeamSquad(teamId: Int) async throws -> [PlayerResponse] {
        let endpoint = "/players/squads?team=\(teamId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching squad for team \(teamId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Team Squad")
        
        let decoder = JSONDecoder()
        do {
            let squadResponse = try decoder.decode(SquadResponse.self, from: data)
            
            if !squadResponse.errors.isEmpty {
                throw FootballAPIError.apiError(squadResponse.errors)
            }
            
            // 응답이 비어있는 경우
            if squadResponse.response.isEmpty {
                return []
            }
            
            // TeamSquadResponse를 PlayerResponse 배열로 변환
            return squadResponse.response.first?.toPlayerResponses() ?? []
            
        } catch DecodingError.keyNotFound(let key, let context) {
            print("❌ Squad decoding error - Key '\(key)' not found:", context.debugDescription)
            // 디코딩 에러 발생 시 빈 배열 반환
            return []
        } catch {
            print("❌ Squad decoding error:", error)
            throw FootballAPIError.decodingError(error)
        }
    }
    
    func getTeamSeasons(teamId: Int) async throws -> [Int] {
        let endpoint = "/teams/seasons?team=\(teamId)"
        let request = createRequest(endpoint)
        
        print("\n📡 Fetching seasons for team \(teamId)...")
        let (data, response) = try await URLSession.shared.data(for: request)
        try handleResponse(response)
        
        // API 응답 로깅
        logResponse(data: data, endpoint: "Team Seasons")
        
        struct SeasonsResponse: Codable {
            let response: [Int]
            let errors: [String]
        }
        
        let decoder = JSONDecoder()
        let seasonsResponse = try decoder.decode(SeasonsResponse.self, from: data)
        
        if !seasonsResponse.errors.isEmpty {
            throw FootballAPIError.apiError(seasonsResponse.errors)
        }
        
        return seasonsResponse.response.sorted(by: >)
    }
    
    // MARK: - Private Methods
    
    private init() {
        // Info.plist에서 API 키 읽기
        guard let apiKey = Bundle.main.object(forInfoDictionaryKey: "FootballAPIKey") as? String else {
            fatalError("FootballAPIKey not found in Info.plist")
        }
        self.apiKey = apiKey
    }
    
    func createRequest(_ endpoint: String) -> URLRequest {
        guard let url = URL(string: baseURL + endpoint) else {
            fatalError("Invalid URL: \(baseURL + endpoint)")
        }
        
        var request = URLRequest(url: url,
                                cachePolicy: .reloadIgnoringLocalCacheData, // 캐시 무시하고 항상 새로 로드
                                timeoutInterval: 20.0) // 타임아웃 증가
        
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
    
    private func logResponse(data: Data, endpoint: String) {
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            print("\n📦 \(endpoint) Response:")
            print(prettyString)
        }
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
    
    func handleResponse(_ response: URLResponse?) throws {
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
    
    private func getDateRange(forSeason season: Int) -> (from: String, to: String) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")
        
        let currentSeason = 2024
        let calendar = Calendar.current
        
        // 현재 날짜를 기준으로 사용
        let referenceDate = Date()
        
        if season == currentSeason {
            // 현재 시즌인 경우 시즌 시작일부터 기준 날짜 기준 전후 15일 범위
            let from = "2024-08-01" // 시즌 시작일
            
            // 기준 날짜 기준 15일 전
            let fromDate = calendar.date(byAdding: .day, value: -15, to: referenceDate) ?? referenceDate
            let toDate = calendar.date(byAdding: .day, value: 15, to: referenceDate) ?? referenceDate
            
            let actualFrom = max(fromDate, dateFormatter.date(from: from) ?? fromDate)
            let actualFromStr = dateFormatter.string(from: actualFrom)
            let toStr = dateFormatter.string(from: toDate)
            
            print("📅 Current season date range: \(actualFromStr) ~ \(toStr)")
            return (actualFromStr, toStr)
        } else {
            // 과거 시즌인 경우 해당 시즌의 전체 기간
            let fromStr = "\(season)-07-01" // 시즌 시작
            let toStr = "\(season + 1)-06-30" // 시즌 종료
            
            print("📅 Past season date range: \(fromStr) ~ \(toStr)")
            return (fromStr, toStr)
        }
    }
}
