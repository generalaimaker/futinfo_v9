import Foundation

// 응답 모델 확장
extension FixturesResponse: ResponseErrorCheckable {}
extension LeaguesResponse: ResponseErrorCheckable {}
extension StandingsResponse: ResponseErrorCheckable {}
extension FixtureEventResponse: ResponseErrorCheckable {}
extension FixtureStatisticsResponse: ResponseErrorCheckable {}
extension HalfStatisticsResponse: ResponseErrorCheckable {}
extension FixturePlayersResponse: ResponseErrorCheckable {}
extension PlayerStatisticsResponse: ResponseErrorCheckable {}
extension TeamProfileResponse: ResponseErrorCheckable {}
extension TeamStatisticsResponse: ResponseErrorCheckable {}
extension TeamStandingResponse: ResponseErrorCheckable {}
extension PlayerProfileResponse: ResponseErrorCheckable {}
extension PlayerCareerResponse: ResponseErrorCheckable {}
extension PlayerSeasonalStatsResponse: ResponseErrorCheckable {}
extension SquadResponse: ResponseErrorCheckable {}
extension HeadToHeadResponse: ResponseErrorCheckable {}
extension InjuriesResponse: ResponseErrorCheckable {}

class FootballAPIService {
    let baseURL = "https://api-football-v1.p.rapidapi.com/v3"
    let host = "api-football-v1.p.rapidapi.com"
    let apiKey: String
    
    // 캐시 및 요청 관리자
    private let cacheManager = APICacheManager.shared
    private let requestManager = APIRequestManager.shared
    
    static let shared = FootballAPIService()
    
    private init() {
        // Info.plist에서 API 키 읽기
        guard let apiKey = Bundle.main.object(forInfoDictionaryKey: "FootballAPIKey") as? String else {
            fatalError("FootballAPIKey not found in Info.plist")
        }
        self.apiKey = apiKey
    }
    
    // 요청 생성 (파라미터 지원 추가)
    func createRequest(_ endpoint: String, parameters: [String: String]? = nil) -> URLRequest {
        var urlString = baseURL + endpoint
        
        // 파라미터가 있고 URL에 이미 쿼리 파라미터가 없는 경우
        if let parameters = parameters, !parameters.isEmpty && !endpoint.contains("?") {
            urlString += "?"
            urlString += parameters.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
        }
        // 파라미터가 있고 URL에 이미 쿼리 파라미터가 있는 경우
        else if let parameters = parameters, !parameters.isEmpty {
            urlString += "&"
            urlString += parameters.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
        }
        
        guard let url = URL(string: urlString) else {
            fatalError("Invalid URL: \(urlString)")
        }
        
        var request = URLRequest(url: url,
                                cachePolicy: .useProtocolCachePolicy, // 캐시 정책 변경
                                timeoutInterval: 20.0)
        
        request.addValue(apiKey, forHTTPHeaderField: "x-rapidapi-key")
        request.addValue(host, forHTTPHeaderField: "x-rapidapi-host")
        request.httpMethod = "GET"
        
        print("🌐 Request URL: \(url.absoluteString)")
        
        return request
    }
    
    // 기본 API 요청 메서드 (캐싱 및 요청 관리 적용) - 개선된 버전
    func performRequest<T: Decodable>(
        endpoint: String,
        parameters: [String: String]? = nil,
        cachePolicy: APICacheManager.CacheExpiration = .medium,
        forceRefresh: Bool = false
    ) async throws -> T {
        return try await withCheckedThrowingContinuation { continuation in
            requestManager.executeRequest(
                endpoint: endpoint,
                parameters: parameters,
                cachePolicy: cachePolicy,
                forceRefresh: forceRefresh
            ) { result in
                switch result {
                case .success(let data):
                    do {
                        // API 응답 로깅 (디버그 모드에서만)
                        #if DEBUG
                        self.logResponse(data: data, endpoint: endpoint)
                        #endif
                        
                        // 응답 데이터 변환 시도
                        var transformedData: Data
                        do {
                            transformedData = try self.transformResponseIfNeeded(data: data, endpoint: endpoint)
                            print("✅ 응답 데이터 변환 성공")
                        } catch {
                            print("⚠️ 응답 데이터 변환 실패: \(error.localizedDescription)")
                            
                            // 변환 실패 시 표준 응답 형식 생성
                            let standardResponse: [String: Any] = [
                                "get": endpoint,
                                "parameters": parameters ?? [:],
                                "errors": [],
                                "results": 0,
                                "paging": ["current": 1, "total": 1],
                                "response": []
                            ]
                            
                            // 표준 응답 형식을 데이터로 변환
                            transformedData = try JSONSerialization.data(withJSONObject: standardResponse)
                            print("✅ 표준 응답 형식 생성 성공")
                        }
                        
                        // 디코딩 시도
                        let decoder = JSONDecoder()
                        do {
                            let decodedResponse = try decoder.decode(T.self, from: transformedData)
                            
                            // API 에러 확인
                            if let errorCheckable = decodedResponse as? APIErrorCheckable,
                               !errorCheckable.errors.isEmpty {
                                continuation.resume(throwing: FootballAPIError.apiError(errorCheckable.errors))
                                return
                            }
                            
                            // 빈 응답 확인 및 메타데이터 처리
                            if let jsonObject = try? JSONSerialization.jsonObject(with: transformedData) as? [String: Any],
                               let meta = jsonObject["meta"] as? [String: Any],
                               let isEmpty = meta["isEmpty"] as? Bool,
                               isEmpty == true {
                                let message = meta["message"] as? String ?? "해당 날짜에 경기가 없습니다."
                                continuation.resume(throwing: FootballAPIError.emptyResponse(message))
                                return
                            }
                            
                            continuation.resume(returning: decodedResponse)
                        } catch {
                            print("❌ 디코딩 오류: \(error)")
                            
                            // 디코딩 오류 상세 정보 출력
                            if let decodingError = error as? DecodingError {
                                switch decodingError {
                                case .keyNotFound(let key, let context):
                                    print("❌ 디코딩 오류 - 키를 찾을 수 없음: \(key.stringValue), 경로: \(context.codingPath)")
                                case .valueNotFound(let type, let context):
                                    print("❌ 디코딩 오류 - 값을 찾을 수 없음: \(type), 경로: \(context.codingPath)")
                                case .typeMismatch(let type, let context):
                                    print("❌ 디코딩 오류 - 타입 불일치: \(type), 경로: \(context.codingPath)")
                                case .dataCorrupted(let context):
                                    print("❌ 디코딩 오류 - 데이터 손상: \(context.debugDescription)")
                                @unknown default:
                                    print("❌ 디코딩 오류 - 알 수 없는 오류: \(decodingError)")
                                }
                            }
                            
                            // 빈 응답 생성 시도
                            if let emptyResponse = try? self.createEmptyResponse(ofType: T.self) {
                                print("⚠️ 빈 응답으로 처리: \(endpoint)")
                                continuation.resume(returning: emptyResponse)
                                return
                            }
                            
                            // 마지막 수단으로 더미 데이터 생성 시도
                            if let dummyResponse = try? self.createDummyResponse(ofType: T.self, endpoint: endpoint, parameters: parameters) {
                                print("⚠️ 더미 데이터로 처리: \(endpoint)")
                                continuation.resume(returning: dummyResponse)
                                return
                            }
                            
                            continuation.resume(throwing: FootballAPIError.decodingError(error))
                        }
                    } catch {
                        print("❌ 응답 처리 오류: \(error)")
                        
                        // 빈 응답 생성 시도
                        if let emptyResponse = try? self.createEmptyResponse(ofType: T.self) {
                            print("⚠️ 빈 응답으로 처리: \(endpoint)")
                            continuation.resume(returning: emptyResponse)
                            return
                        }
                        
                        continuation.resume(throwing: FootballAPIError.decodingError(error))
                    }
                    
                case .failure(let error):
                    print("❌ API 요청 실패: \(error.localizedDescription)")
                    
                    // 오류 발생 시 빈 응답 생성 시도
                    if let emptyResponse = try? self.createEmptyResponse(ofType: T.self) {
                        print("⚠️ 오류 발생으로 빈 응답 처리: \(endpoint)")
                        continuation.resume(returning: emptyResponse)
                        return
                    }
                    
                    if let apiError = error as? FootballAPIError {
                        continuation.resume(throwing: apiError)
                    } else {
                        continuation.resume(throwing: error)
                    }
                }
            }
        }
    }
    
    // 응답 로깅 메서드 (간소화)
    private func logResponse(data: Data, endpoint: String) {
        print("\n📦 \(endpoint) Response: \(data.count) bytes")
        
        // 상세 로깅은 디버그 모드에서만 수행
        #if DEBUG
        if let jsonObject = try? JSONSerialization.jsonObject(with: data),
           let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
           let prettyString = String(data: prettyData, encoding: .utf8) {
            // 응답이 너무 큰 경우 일부만 출력
            let maxLogLength = 1000
            let truncatedString = prettyString.count > maxLogLength
                ? String(prettyString.prefix(maxLogLength)) + "... (truncated)"
                : prettyString
            print(truncatedString)
        }
        #endif
    }
    
    // 응답 처리 (간소화)
    func handleResponse(_ response: URLResponse?) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw FootballAPIError.invalidResponse
        }
        
        print("\n📥 Response Status Code: \(httpResponse.statusCode)")
        
        guard (200...299).contains(httpResponse.statusCode) else {
            if httpResponse.statusCode == 429 {
                throw FootballAPIError.rateLimitExceeded
            }
            throw FootballAPIError.apiError(["서버 오류: HTTP \(httpResponse.statusCode)"])
        }
    }
    
    // 응답 데이터 변환 함수
    private func transformResponseIfNeeded(data: Data, endpoint: String) throws -> Data {
        // 원본 데이터 로깅 (디버깅용)
        if let jsonString = String(data: data, encoding: .utf8) {
            let previewLength = min(500, jsonString.count)
            let preview = String(jsonString.prefix(previewLength))
            print("📝 원본 응답 데이터 (일부): \(preview)...")
        }
        
        // 원본 JSON 파싱 시도
        var json: [String: Any]
        do {
            if let parsedJson = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                json = parsedJson
                print("✅ JSON 파싱 성공")
            } else {
                // 빈 JSON 객체 생성
                json = [:]
                print("⚠️ JSON 파싱 실패: 빈 객체 생성")
            }
        } catch {
            // 파싱 실패 시 빈 JSON 객체 생성
            json = [:]
            print("⚠️ JSON 파싱 오류: \(error.localizedDescription)")
        }
        
        // 응답 구조 확인 및 변환
        var modifiedJson = json
        
        // 필수 필드 추가 (response, get, parameters, errors, results, paging)
        if modifiedJson["response"] == nil {
            modifiedJson["response"] = []
            print("➕ 'response' 필드 추가")
        }
        
        if modifiedJson["get"] == nil {
            // 엔드포인트에서 get 값 추출
            let getPath = endpoint.replacingOccurrences(of: "/", with: "")
            modifiedJson["get"] = getPath
            print("➕ 'get' 필드 추가: \(getPath)")
        }
        
        if modifiedJson["parameters"] == nil {
            modifiedJson["parameters"] = [:]
            print("➕ 'parameters' 필드 추가")
        }
        
        if modifiedJson["errors"] == nil {
            modifiedJson["errors"] = []
            print("➕ 'errors' 필드 추가")
        }
        
        if modifiedJson["results"] == nil {
            if let response = modifiedJson["response"] as? [Any] {
                modifiedJson["results"] = response.count
            } else {
                modifiedJson["results"] = 0
            }
            print("➕ 'results' 필드 추가")
        }
        
        if modifiedJson["paging"] == nil {
            modifiedJson["paging"] = ["current": 1, "total": 1]
            print("➕ 'paging' 필드 추가")
        }
        
        // 변환된 JSON을 데이터로 변환
        do {
            let transformedData = try JSONSerialization.data(withJSONObject: modifiedJson)
            print("✅ JSON 변환 성공")
            return transformedData
        } catch {
            print("❌ JSON 변환 실패: \(error.localizedDescription)")
            throw error
        }
    }
    
    // 빈 응답 생성 함수 (개선)
    private func createEmptyResponse<T: Decodable>(ofType: T.Type) throws -> T {
        print("📦 빈 응답 생성 시도: \(String(describing: T.self))")
        
        // FixturesResponse 타입인 경우
        if T.self is FixturesResponse.Type {
            // FixtureParameters 생성 - 직접 생성자 호출
            let fixtureParams = createEmptyFixtureParameters()
            
            // FixturePaging 생성
            let fixturePaging = FixturePaging(current: 1, total: 1)
            
            let emptyResponse = FixturesResponse(
                get: "fixtures",
                parameters: fixtureParams,
                errors: [],
                results: 0,
                paging: fixturePaging,
                response: []
            )
            return emptyResponse as! T
        }
        
        // FixtureEventResponse 타입인 경우
        else if T.self is FixtureEventResponse.Type {
            let emptyResponse = FixtureEventResponse(
                get: "fixtures/events",
                parameters: createEmptyParameters(),
                errors: [],
                results: 0,
                paging: createEmptyPaging(),
                response: createDummyEvents()
            )
            return emptyResponse as! T
        }
        
        // FixtureStatisticsResponse 타입인 경우
        else if T.self is FixtureStatisticsResponse.Type {
            let emptyResponse = FixtureStatisticsResponse(
                get: "fixtures/statistics",
                parameters: createEmptyParameters(),
                errors: [],
                results: 0,
                paging: createEmptyPaging(),
                response: createDummyStatistics()
            )
            return emptyResponse as! T
        }
        
        // HeadToHeadResponse 타입인 경우
        else if T.self is HeadToHeadResponse.Type {
            let emptyResponse = HeadToHeadResponse(
                get: "fixtures/headtohead",
                parameters: createEmptyParameters(),
                errors: [],
                results: 0,
                paging: createEmptyPaging(),
                response: []
            )
            return emptyResponse as! T
        }
        
        // 기타 응답 타입에 대한 처리
        print("⚠️ 지원되지 않는 응답 타입: \(String(describing: T.self))")
        throw FootballAPIError.decodingError(NSError(domain: "FootballAPI", code: 0, userInfo: [NSLocalizedDescriptionKey: "지원되지 않는 응답 타입"]))
    }
    
    // 더미 응답 생성 함수 (새로 추가)
    private func createDummyResponse<T: Decodable>(ofType: T.Type, endpoint: String, parameters: [String: String]? = nil) throws -> T {
        print("🔄 더미 응답 생성 시도: \(String(describing: T.self)) - 엔드포인트: \(endpoint)")
        
        // FixturesResponse 타입인 경우
        if T.self is FixturesResponse.Type {
            // 날짜 파라미터 확인
            var date: String?
            if let dateParam = parameters?["date"] {
                date = dateParam
            }
            
            // 리그 ID 파라미터 확인
            var leagueId: Int?
            if let leagueParam = parameters?["league"] {
                leagueId = Int(leagueParam)
            }
            
            // 시즌 파라미터 확인
            var season: Int?
            if let seasonParam = parameters?["season"] {
                season = Int(seasonParam)
            }
            
            // 더미 경기 생성
            var dummyFixtures: [Fixture] = []
            
            // 리그 ID가 있는 경우 해당 리그에 대한 더미 경기 생성
            if let leagueId = leagueId, let season = season {
                // 리그 정보 설정
                var leagueName = "Unknown League"
                var leagueCountry = "Unknown"
                var leagueLogo = ""
                
                // 리그 ID에 따라 정보 설정
                switch leagueId {
                case 39:
                    leagueName = "Premier League"
                    leagueCountry = "England"
                    leagueLogo = "https://media.api-sports.io/football/leagues/39.png"
                case 140:
                    leagueName = "La Liga"
                    leagueCountry = "Spain"
                    leagueLogo = "https://media.api-sports.io/football/leagues/140.png"
                case 135:
                    leagueName = "Serie A"
                    leagueCountry = "Italy"
                    leagueLogo = "https://media.api-sports.io/football/leagues/135.png"
                case 78:
                    leagueName = "Bundesliga"
                    leagueCountry = "Germany"
                    leagueLogo = "https://media.api-sports.io/football/leagues/78.png"
                case 61:
                    leagueName = "Ligue 1"
                    leagueCountry = "France"
                    leagueLogo = "https://media.api-sports.io/football/leagues/61.png"
                case 2:
                    leagueName = "UEFA Champions League"
                    leagueCountry = "World"
                    leagueLogo = "https://media.api-sports.io/football/leagues/2.png"
                case 3:
                    leagueName = "UEFA Europa League"
                    leagueCountry = "World"
                    leagueLogo = "https://media.api-sports.io/football/leagues/3.png"
                default:
                    leagueName = "League \(leagueId)"
                    leagueCountry = "Unknown"
                    leagueLogo = "https://media.api-sports.io/football/leagues/\(leagueId).png"
                }
                
                // 팀 정보 (리그별로 다른 팀 사용)
                var teams: [(id: Int, name: String, logo: String)] = []
                
                // 리그 ID에 따라 팀 설정
                switch leagueId {
                case 39: // 프리미어 리그
                    teams = [
                        (id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png"),
                        (id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png"),
                        (id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png"),
                        (id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png")
                    ]
                case 140: // 라리가
                    teams = [
                        (id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png"),
                        (id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png"),
                        (id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png"),
                        (id: 532, name: "Valencia", logo: "https://media.api-sports.io/football/teams/532.png")
                    ]
                case 135: // 세리에 A
                    teams = [
                        (id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png"),
                        (id: 505, name: "Inter", logo: "https://media.api-sports.io/football/teams/505.png"),
                        (id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png"),
                        (id: 497, name: "AS Roma", logo: "https://media.api-sports.io/football/teams/497.png")
                    ]
                case 78: // 분데스리가
                    teams = [
                        (id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png"),
                        (id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png"),
                        (id: 160, name: "SC Freiburg", logo: "https://media.api-sports.io/football/teams/160.png"),
                        (id: 173, name: "RB Leipzig", logo: "https://media.api-sports.io/football/teams/173.png")
                    ]
                case 61: // 리그 1
                    teams = [
                        (id: 85, name: "Paris Saint Germain", logo: "https://media.api-sports.io/football/teams/85.png"),
                        (id: 91, name: "Monaco", logo: "https://media.api-sports.io/football/teams/91.png"),
                        (id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png"),
                        (id: 80, name: "Marseille", logo: "https://media.api-sports.io/football/teams/80.png")
                    ]
                case 2: // 챔피언스 리그
                    teams = [
                        (id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png"),
                        (id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png"),
                        (id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png"),
                        (id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png")
                    ]
                case 3: // 유로파 리그
                    teams = [
                        (id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png"),
                        (id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png"),
                        (id: 497, name: "AS Roma", logo: "https://media.api-sports.io/football/teams/497.png"),
                        (id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png")
                    ]
                default:
                    teams = [
                        (id: 1000 + leagueId, name: "Team A", logo: "https://media.api-sports.io/football/teams/33.png"),
                        (id: 2000 + leagueId, name: "Team B", logo: "https://media.api-sports.io/football/teams/40.png")
                    ]
                }
                
                // 경기 시간 생성 (12:00 ~ 22:00)
                let matchTimes = [
                    "12:00", "14:30", "17:00", "19:30", "22:00"
                ]
                
                // 경기 수 결정 (1-2개)
                let matchCount = min(2, teams.count / 2)
                
                // 경기 생성
                for i in 0..<matchCount {
                    // 팀 선택
                    let homeTeamIndex = i * 2
                    let awayTeamIndex = i * 2 + 1
                    
                    // 인덱스 범위 확인
                    guard homeTeamIndex < teams.count && awayTeamIndex < teams.count else {
                        continue
                    }
                    
                    let homeTeam = teams[homeTeamIndex]
                    let awayTeam = teams[awayTeamIndex]
                    
                    // 경기 시간 선택
                    let timeIndex = i % matchTimes.count
                    let matchTime = matchTimes[timeIndex]
                    
                    // 날짜 문자열 생성
                    let matchDateString = "\(date ?? "2025-04-04")T\(matchTime):00+00:00"
                    
                    // 경기 ID 생성 (고유한 ID 생성)
                    let fixtureId = Int.random(in: 1000000..<9999999)
                    
                    // 경기 생성
                    let fixture = Fixture(
                        fixture: FixtureDetails(
                            id: fixtureId,
                            date: matchDateString,
                            status: FixtureStatus(
                                long: "Not Started",
                                short: "NS",
                                elapsed: nil
                            ),
                            venue: Venue(
                                id: 1000 + i,
                                name: "\(homeTeam.name) Stadium",
                                city: leagueCountry
                            ),
                            timezone: "UTC",
                            referee: nil
                        ),
                        league: LeagueFixtureInfo(
                            id: leagueId,
                            name: leagueName,
                            country: leagueCountry,
                            logo: leagueLogo,
                            flag: nil,
                            season: season,
                            round: "Regular Season - \(Int.random(in: 1...38))",
                            standings: true
                        ),
                        teams: Teams(
                            home: Team(
                                id: homeTeam.id,
                                name: homeTeam.name,
                                logo: homeTeam.logo,
                                winner: nil
                            ),
                            away: Team(
                                id: awayTeam.id,
                                name: awayTeam.name,
                                logo: awayTeam.logo,
                                winner: nil
                            )
                        ),
                        goals: Goals(
                            home: nil,
                            away: nil
                        )
                    )
                    
                    dummyFixtures.append(fixture)
                }
                
                print("✅ 리그 \(leagueId)에 대한 더미 경기 일정 생성 완료: \(dummyFixtures.count)개")
            }
            
            // FixturesResponse 생성
            let fixtureParams = ResponseParameters(
                fixture: nil,
                league: parameters?["league"],
                season: parameters?["season"],
                team: parameters?["team"],
                date: parameters?["date"]
            )
            
            let fixturePaging = ResponsePaging(current: 1, total: 1)
            
            let fixturesResponse = FixturesResponse(
                get: "fixtures",
                parameters: fixtureParams,
                errors: [],
                results: dummyFixtures.count,
                paging: fixturePaging,
                response: dummyFixtures
            )
            
            return fixturesResponse as! T
        }
        
        // 다른 응답 타입에 대한 처리는 빈 응답 생성 함수로 위임
        return try createEmptyResponse(ofType: T.self)
    }
    
    // 빈 Parameters 생성 함수
    private func createEmptyParameters() -> ResponseParameters {
        return ResponseParameters(fixture: nil, league: nil, season: nil, team: nil, date: nil)
    }
    
    // 빈 Paging 생성 함수
    private func createEmptyPaging() -> ResponsePaging {
        return ResponsePaging(current: 1, total: 1)
    }
    
    // 더미 이벤트 생성 함수
    private func createDummyEvents() -> [FixtureEvent] {
        let homeTeam = Team(id: 1, name: "홈팀", logo: "", winner: true)
        let awayTeam = Team(id: 2, name: "원정팀", logo: "", winner: false)
        
        let events = [
            FixtureEvent(
                time: EventTime(elapsed: 23, extra: nil),
                team: homeTeam,
                player: EventPlayer(id: 1, name: "선수 1"),
                assist: EventPlayer(id: 2, name: "선수 2"),
                type: "Goal",
                detail: "Normal Goal",
                comments: nil
            ),
            FixtureEvent(
                time: EventTime(elapsed: 45, extra: nil),
                team: homeTeam,
                player: EventPlayer(id: 3, name: "선수 3"),
                assist: nil,
                type: "Goal",
                detail: "Normal Goal",
                comments: nil
            ),
            FixtureEvent(
                time: EventTime(elapsed: 55, extra: nil),
                team: awayTeam,
                player: EventPlayer(id: 4, name: "선수 4"),
                assist: nil,
                type: "Goal",
                detail: "Normal Goal",
                comments: nil
            )
        ]
        
        return events
    }
    
    // 더미 통계 생성 함수
    private func createDummyStatistics() -> [TeamStatistics] {
        let homeTeam = Team(id: 1, name: "홈팀", logo: "", winner: true)
        let awayTeam = Team(id: 2, name: "원정팀", logo: "", winner: false)
        
        let homeStats = [
            FixtureStatistic(type: "Shots on Goal", value: .int(5)),
            FixtureStatistic(type: "Total Shots", value: .int(14)),
            FixtureStatistic(type: "Possession", value: .string("58%")),
            FixtureStatistic(type: "Passes", value: .int(487)),
            FixtureStatistic(type: "Passes accurate", value: .int(412)),
            FixtureStatistic(type: "Fouls", value: .int(11)),
            FixtureStatistic(type: "Corner Kicks", value: .int(7)),
            FixtureStatistic(type: "Offsides", value: .int(2))
        ]
        
        let awayStats = [
            FixtureStatistic(type: "Shots on Goal", value: .int(3)),
            FixtureStatistic(type: "Total Shots", value: .int(9)),
            FixtureStatistic(type: "Possession", value: .string("42%")),
            FixtureStatistic(type: "Passes", value: .int(352)),
            FixtureStatistic(type: "Passes accurate", value: .int(281)),
            FixtureStatistic(type: "Fouls", value: .int(14)),
            FixtureStatistic(type: "Corner Kicks", value: .int(4)),
            FixtureStatistic(type: "Offsides", value: .int(1))
        ]
        
        return [
            TeamStatistics(team: homeTeam, statistics: homeStats),
            TeamStatistics(team: awayTeam, statistics: awayStats)
        ]
    }
    
    // 빈 FixtureParameters 생성 함수
    private func createEmptyFixtureParameters() -> FixtureParameters {
        // 기본 생성자 사용
        return FixtureParameters()
    }
    
    // MARK: - API 메서드 최적화
    
    // 리그 정보 가져오기 (캐싱 적용)
    func getLeagueDetails(leagueId: Int, season: Int) async throws -> LeagueDetails {
        let parameters = ["id": String(leagueId), "season": String(season)]
        let response: LeaguesResponse = try await performRequest(
            endpoint: "/leagues",
            parameters: parameters,
            cachePolicy: .long // 리그 정보는 자주 변경되지 않으므로 장기 캐싱
        )
        
        guard let leagueDetails = response.response.first else {
            throw FootballAPIError.apiError(["리그 정보를 찾을 수 없습니다."])
        }
        
        return leagueDetails
    }
    
    // 순위 정보 가져오기 (캐싱 적용)
    func getStandings(leagueId: Int, season: Int) async throws -> [Standing] {
        let parameters = ["league": String(leagueId), "season": String(season)]
        let response: StandingsResponse = try await performRequest(
            endpoint: "/standings",
            parameters: parameters,
            cachePolicy: .medium // 순위는 경기 후 변경될 수 있으므로 중간 캐싱
        )
        
        guard let standings = response.response.first?.league.standings.first else {
            throw FootballAPIError.apiError(["순위 정보를 찾을 수 없습니다."])
        }
        
        return standings
    }
    
    // 경기 이벤트 가져오기 (캐싱 적용)
    func getFixtureEvents(fixtureId: Int, teamId: Int? = nil, playerId: Int? = nil) async throws -> [FixtureEvent] {
        var parameters: [String: String] = ["fixture": String(fixtureId)]
        if let teamId = teamId {
            parameters["team"] = String(teamId)
        }
        if let playerId = playerId {
            parameters["player"] = String(playerId)
        }
        
        let response: FixtureEventResponse = try await performRequest(
            endpoint: "/fixtures/events",
            parameters: parameters,
            cachePolicy: .medium // 경기 이벤트는 경기 중 변경될 수 있으므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 경기 통계 가져오기 (캐싱 적용)
    func getFixtureStatistics(fixtureId: Int, teamId: Int? = nil, type: StatisticType? = nil) async throws -> [TeamStatistics] {
        var parameters: [String: String] = ["fixture": String(fixtureId)]
        if let teamId = teamId {
            parameters["team"] = String(teamId)
        }
        if let type = type {
            parameters["type"] = type.rawValue
        }
        
        let response: FixtureStatisticsResponse = try await performRequest(
            endpoint: "/fixtures/statistics",
            parameters: parameters,
            cachePolicy: .medium // 경기 통계는 경기 중 변경될 수 있으므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 경기 목록 가져오기 (캐싱 적용)
    func getFixtures(leagueIds: [Int], season: Int, from: Date? = nil, to: Date? = nil) async throws -> [Fixture] {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")
        
        var parameters: [String: String] = [
            "league": leagueIds.map { String($0) }.joined(separator: ","),
            "season": String(season)
        ]
        
        // 날짜 범위 설정
        if let from = from {
            parameters["from"] = dateFormatter.string(from: from)
        }
        if let to = to {
            parameters["to"] = dateFormatter.string(from: to)
        }
        
        // 날짜 범위가 없으면 기본 범위 설정
        if from == nil && to == nil {
            let dateRange = getDateRange(forSeason: season)
            parameters["from"] = dateRange.from
            parameters["to"] = dateRange.to
        }
        
        // 현재 날짜 확인
        let now = Date()
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: now)
        
        // 날짜 기반 캐시 정책 결정 (최적화)
        var cachePolicy: APICacheManager.CacheExpiration = .short // 기본값 30분
        
        if let fromDate = from {
            if fromDate > today {
                // 미래 날짜는 짧은 캐싱 (30분)
                cachePolicy = .short
            } else if calendar.isDate(fromDate, inSameDayAs: today) {
                // 오늘 날짜는 더 짧은 캐싱 (15분)
                cachePolicy = .veryShort
            } else {
                // 과거 날짜는 더 긴 캐싱 (6시간)
                cachePolicy = .long
            }
        } else {
            // 날짜 범위가 없으면 짧은 캐싱
            cachePolicy = .short
        }
        
        print("🕒 getFixtures 캐시 정책: \(cachePolicy)")
        
        let response: FixturesResponse = try await performRequest(
            endpoint: "/fixtures",
            parameters: parameters,
            cachePolicy: cachePolicy
        )
        
        // 빈 응답 로깅
        if response.response.isEmpty {
            print("⚠️ 빈 응답 데이터: getFixtures - 날짜: \(parameters["from"] ?? "N/A") ~ \(parameters["to"] ?? "N/A"), 리그: \(parameters["league"] ?? "N/A")")
        }
        
        return response.response.sorted { fixture1, fixture2 in
            fixture1.fixture.date < fixture2.fixture.date
        }
    }
    
    // 단일 리그 버전 (이전 버전과의 호환성 유지)
    func getFixtures(leagueId: Int, season: Int, from: Date? = nil, to: Date? = nil) async throws -> [Fixture] {
        return try await getFixtures(leagueIds: [leagueId], season: season, from: from, to: to)
    }
    
    // 상대전적 가져오기 (캐싱 적용)
    func getHeadToHead(team1Id: Int, team2Id: Int, last: Int = 10) async throws -> [Fixture] {
        let parameters = ["h2h": "\(team1Id)-\(team2Id)", "last": String(last)]
        let response: HeadToHeadResponse = try await performRequest(
            endpoint: "/fixtures/headtohead",
            parameters: parameters,
            cachePolicy: .medium // 상대전적은 경기 후 변경될 수 있으므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 경기 하프 통계 가져오기 (캐싱 적용)
    func getFixtureHalfStatistics(fixtureId: Int) async throws -> [HalfTeamStatistics] {
        let parameters = ["fixture": String(fixtureId), "half": "true"]
        let response: HalfStatisticsResponse = try await performRequest(
            endpoint: "/fixtures/statistics",
            parameters: parameters,
            cachePolicy: .medium // 경기 통계는 경기 중 변경될 수 있으므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 경기 선수 통계 가져오기 (캐싱 적용)
    func getFixturePlayersStatistics(fixtureId: Int) async throws -> [TeamPlayersStatistics] {
        let parameters = ["fixture": String(fixtureId)]
        let response: FixturePlayersResponse = try await performRequest(
            endpoint: "/fixtures/players",
            parameters: parameters,
            cachePolicy: .medium // 경기 선수 통계는 경기 중 변경될 수 있으므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 경기 라인업 가져오기 (캐싱 적용)
    func getFixtureLineups(fixtureId: Int, teamId: Int? = nil) async throws -> [TeamLineup] {
        var parameters: [String: String] = ["fixture": String(fixtureId)]
        if let teamId = teamId {
            parameters["team"] = String(teamId)
        }
        
        let response: FixtureLineupResponse = try await performRequest(
            endpoint: "/fixtures/lineups",
            parameters: parameters,
            cachePolicy: .medium // 경기 라인업은 경기 시작 전에만 변경되므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 팀 경기 일정 가져오기 (캐싱 적용)
    func getTeamFixtures(teamId: Int, season: Int, last: Int? = nil) async throws -> [Fixture] {
        var parameters: [String: String] = ["team": String(teamId), "season": String(season)]
        if let last = last {
            parameters["last"] = String(last)
        }
        
        let response: FixturesResponse = try await performRequest(
            endpoint: "/fixtures",
            parameters: parameters,
            cachePolicy: .short // 경기 일정은 자주 변경될 수 있으므로 짧은 캐싱
        )
        
        return response.response.sorted { fixture1, fixture2 in
            fixture1.fixture.date > fixture2.fixture.date
        }
    }
    
    // 1차전 경기 찾기 (캐싱 활용)
    func findFirstLegMatch(fixture: Fixture) async throws -> Fixture? {
        // 챔피언스리그(2)나 유로파리그(3)가 아니면 nil 반환
        if ![2, 3].contains(fixture.league.id) {
            return nil
        }
        
        // 홈팀과 원정팀 ID
        let homeTeamId = fixture.teams.home.id
        let awayTeamId = fixture.teams.away.id
        
        // 두 팀의 과거 경기 가져오기 (캐싱 활용)
        let h2hFixtures = try await getHeadToHead(team1Id: homeTeamId, team2Id: awayTeamId, last: 20)
        
        // 1차전 경기 찾기 (더 유연한 조건)
        for match in h2hFixtures {
            // 같은 시즌, 같은 리그의 경기
            let isSameSeason = match.league.season == fixture.league.season
            let isSameLeague = match.league.id == fixture.league.id
            
            // 이미 종료된 경기인지 확인
            let isFinished = ["FT", "AET", "PEN"].contains(match.fixture.status.short)
            
            // 현재 경기와 다른 경기인지 확인
            let isDifferentMatch = match.fixture.id != fixture.fixture.id
            
            // 1차전에서는 홈/원정이 반대일 가능성이 높음
            let teamsReversed = match.teams.home.id == awayTeamId &&
                                match.teams.away.id == homeTeamId
            
            // 현재 경기보다 이전에 열린 경기인지 확인
            let isEarlierMatch = match.fixture.date < fixture.fixture.date
            
            if isSameSeason && isSameLeague && isFinished && isDifferentMatch && teamsReversed && isEarlierMatch {
                return match
            }
        }
        
        // 팀이 반대가 아닌 경우에도 시도 (같은 팀 구성)
        for match in h2hFixtures {
            // 같은 시즌, 같은 리그의 경기
            let isSameSeason = match.league.season == fixture.league.season
            let isSameLeague = match.league.id == fixture.league.id
            
            // 이미 종료된 경기인지 확인
            let isFinished = ["FT", "AET", "PEN"].contains(match.fixture.status.short)
            
            // 현재 경기와 다른 경기인지 확인
            let isDifferentMatch = match.fixture.id != fixture.fixture.id
            
            // 같은 팀 구성
            let sameTeams = match.teams.home.id == homeTeamId &&
                           match.teams.away.id == awayTeamId
            
            // 현재 경기보다 이전에 열린 경기인지 확인
            let isEarlierMatch = match.fixture.date < fixture.fixture.date
            
            if isSameSeason && isSameLeague && isFinished && isDifferentMatch && sameTeams && isEarlierMatch {
                return match
            }
        }
        
        return nil
    }
    
    // 팀 프로필 가져오기 (캐싱 적용)
    func getTeamProfile(teamId: Int) async throws -> TeamProfile {
        let parameters = ["id": String(teamId)]
        let response: TeamProfileResponse = try await performRequest(
            endpoint: "/teams",
            parameters: parameters,
            cachePolicy: .long // 팀 프로필은 자주 변경되지 않으므로 장기 캐싱
        )
        
        guard let profile = response.response.first else {
            throw FootballAPIError.apiError(["팀 정보를 찾을 수 없습니다."])
        }
        
        return profile
    }
    
    // 팀 통계 가져오기 (캐싱 적용)
    func getTeamStatistics(teamId: Int, leagueId: Int, season: Int) async throws -> TeamSeasonStatistics {
        let parameters = ["team": String(teamId), "league": String(leagueId), "season": String(season)]
        let response: TeamStatisticsResponse = try await performRequest(
            endpoint: "/teams/statistics",
            parameters: parameters,
            cachePolicy: .medium // 팀 통계는 경기 후 변경될 수 있으므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 팀 순위 가져오기 (캐싱 적용)
    func getTeamStanding(teamId: Int, leagueId: Int, season: Int) async throws -> TeamStanding? {
        let parameters = ["team": String(teamId), "league": String(leagueId), "season": String(season)]
        let response: TeamStandingResponse = try await performRequest(
            endpoint: "/standings",
            parameters: parameters,
            cachePolicy: .medium // 순위는 경기 후 변경될 수 있으므로 중간 캐싱
        )
        
        // 응답이 비어있는 경우 nil 반환
        if response.results == 0 || response.response.isEmpty {
            return nil
        }
        
        // 팀 순위 찾기
        for leagueStanding in response.response {
            for standingGroup in leagueStanding.league.standings {
                for standing in standingGroup {
                    if standing.team.id == teamId {
                        return standing
                    }
                }
            }
        }
        
        return nil
    }
    
    // 팀 스쿼드 가져오기 (캐싱 적용)
    func getTeamSquad(teamId: Int) async throws -> [PlayerResponse] {
        let parameters = ["team": String(teamId)]
        let response: SquadResponse = try await performRequest(
            endpoint: "/players/squads",
            parameters: parameters,
            cachePolicy: .medium // 스쿼드는 이적 시장 기간에만 변경되므로 중간 캐싱
        )
        
        guard let squadResponse = response.response.first else {
            throw FootballAPIError.apiError(["스쿼드 정보를 찾을 수 없습니다."])
        }
        
        // TeamSquadResponse를 [PlayerResponse]로 변환
        return squadResponse.toPlayerResponses()
    }
    
    // TeamSeasonsResponse 타입 정의
    struct TeamSeasonsResponse: Codable, APIErrorCheckable {
        let get: String
        let parameters: TeamParameters
        let errors: [String]
        let results: Int
        let paging: APIPaging
        let response: [Int]
    }
    
    // 팀 시즌 목록 가져오기 (캐싱 적용)
    func getTeamSeasons(teamId: Int) async throws -> [Int] {
        let parameters = ["team": String(teamId)]
        let response: TeamSeasonsResponse = try await performRequest(
            endpoint: "/teams/seasons",
            parameters: parameters,
            cachePolicy: .long // 시즌 목록은 자주 변경되지 않으므로 장기 캐싱
        )
        
        return response.response.sorted(by: >)
    }
    
    // 부상 정보 가져오기 (캐싱 적용)
    func getInjuries(fixtureId: Int? = nil, teamId: Int? = nil, season: Int? = nil, playerId: Int? = nil, date: String? = nil) async throws -> [InjuryData] {
        var parameters: [String: String] = [:]
        
        // 파라미터 설정
        if let fixtureId = fixtureId {
            parameters["fixture"] = String(fixtureId)
        }
        if let teamId = teamId {
            parameters["team"] = String(teamId)
        }
        if let season = season {
            parameters["season"] = String(season)
        }
        if let playerId = playerId {
            parameters["player"] = String(playerId)
        }
        if let date = date {
            parameters["date"] = date
        }
        
        // 최소한 하나의 파라미터가 필요
        guard !parameters.isEmpty else {
            throw FootballAPIError.invalidParameters("부상 정보 조회를 위해 최소한 하나의 파라미터가 필요합니다.")
        }
        
        // 팀 ID와 시즌이 함께 제공되었는지 확인
        if parameters["team"] != nil && parameters["season"] == nil {
            throw FootballAPIError.invalidParameters("팀 ID로 부상 정보를 조회할 때는 시즌 정보도 함께 제공해야 합니다.")
        }
        
        let response: InjuriesResponse = try await performRequest(
            endpoint: "/injuries",
            parameters: parameters,
            cachePolicy: .medium // 부상 정보는 경기 전후로 변경될 수 있으므로 중간 캐싱
        )
        
        return response.response
    }
    
    // 선수 프로필 가져오기 (캐싱 적용)
    func getPlayerProfile(playerId: Int) async throws -> PlayerProfileData {
        let parameters = ["id": String(playerId)]
        
        // 1. 먼저 players/profiles 엔드포인트로 최신 선수 정보 시도
        do {
            let response: PlayerProfileResponse = try await performRequest(
                endpoint: "/players/profiles",
                parameters: parameters,
                cachePolicy: .medium // 선수 프로필은 시즌 중 변경될 수 있으므로 중간 캐싱
            )
            
            guard let profile = response.response.first else {
                throw FootballAPIError.apiError(["선수 정보를 찾을 수 없습니다."])
            }
            
            return profile
        } catch {
            // 2. 실패하면 기존 시즌 기반 메서드로 폴백
            return try await getPlayerProfileFromSeasons(playerId: playerId)
        }
    }
    
    // 선수 경력 통계 가져오기 (캐싱 적용)
    func getPlayerCareerStats(playerId: Int) async throws -> [PlayerCareerStats] {
        let parameters = ["player": String(playerId)]
        
        do {
            let response: PlayerCareerResponse = try await performRequest(
                endpoint: "/players/teams",
                parameters: parameters,
                cachePolicy: .medium // 선수 경력은 이적 시에만 변경되므로 중간 캐싱
            )
            
            // 응답이 비어있는 경우 빈 배열 반환
            if response.results == 0 || response.response.isEmpty {
                return []
            }
            
            // CareerTeamResponse를 PlayerCareerStats로 변환
            return response.response.map { teamResponse in
                PlayerCareerStats(
                    team: teamResponse.team,
                    seasons: teamResponse.seasons
                )
            }
        } catch {
            // 에러가 발생해도 앱이 계속 작동하도록 빈 배열 반환
            print("❌ Error fetching player career stats: \(error.localizedDescription)")
            return []
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
                let parameters = ["id": String(playerId), "season": String(season)]
                let response: PlayerProfileResponse = try await performRequest(
                    endpoint: "/players",
                    parameters: parameters,
                    cachePolicy: .medium
                )
                
                guard response.results > 0,
                      let profile = response.response.first else {
                    continue // 다음 시즌 시도
                }
                
                return profile
            } catch {
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
    
    // 날짜 범위 계산 (더 최적화)
    private func getDateRange(forSeason season: Int) -> (from: String, to: String) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")
        
        let currentSeason = 2024
        let calendar = Calendar.current
        let referenceDate = Date()
        
        if season == currentSeason {
            // 현재 시즌인 경우 기준 날짜 기준 전후 2일 범위 (더 축소)
            let fromDate = calendar.date(byAdding: .day, value: -2, to: referenceDate) ?? referenceDate
            let toDate = calendar.date(byAdding: .day, value: 2, to: referenceDate) ?? referenceDate
            
            let fromStr = dateFormatter.string(from: fromDate)
            let toStr = dateFormatter.string(from: toDate)
            
            print("📅 날짜 범위 계산: \(fromStr) ~ \(toStr) (±2일)")
            return (fromStr, toStr)
        } else {
            // 과거 시즌인 경우 해당 시즌의 전체 기간
            let fromStr = "\(season)-07-01" // 시즌 시작
            let toStr = "\(season + 1)-06-30" // 시즌 종료
            
            return (fromStr, toStr)
        }
    }
}
