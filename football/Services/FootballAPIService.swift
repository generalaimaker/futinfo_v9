import Foundation

// --- 필요한 프로토콜 및 타입 정의 ---
// APIResponseTypes.swift 파일에 필요한 정의들이 포함되어 있다고 가정합니다.
// APIErrorCheckable 프로토콜은 FootballAPIError.swift에 정의되어 있음

// 더미 데이터 생성에 필요한 타입 정의
struct StatisticsTeam: Codable {
    let id: Int
    let name: String
    let logo: String
}

struct StatisticsLeague: Codable {
    let id: Int
    let name: String
    let country: String
    let logo: String
    let flag: String?
    let season: Int
}

struct PlayerGames: Codable {
    let appearences: Int
    let lineups: Int
    let minutes: Int
    let number: Int?
    let position: String
    let rating: String
    let captain: Bool
}

struct Shots: Codable {
    let total: Int
    let on: Int
}

struct Passes: Codable {
    let total: Int
    let key: Int
    let accuracy: Int
}

struct Tackles: Codable {
    let total: Int
    let blocks: Int
    let interceptions: Int
}

struct Duels: Codable {
    let total: Int
    let won: Int
}

struct Dribbles: Codable {
    let attempts: Int
    let success: Int
    let past: Int?
}

struct Fouls: Codable {
    let drawn: Int
    let committed: Int
}

struct Cards: Codable {
    let yellow: Int
    let yellowred: Int
    let red: Int
}

struct Penalty: Codable {
    let won: Int
    let committed: Int
    let scored: Int
    let missed: Int
    let saved: Int?
}

struct FootballPlayerGoals: Codable {
    let total: Int?
    let conceded: Int?
    let assists: Int?
    let saves: Int?
}

struct PlayerStatistics: Codable {
    let team: StatisticsTeam
    let league: StatisticsLeague
    let games: PlayerGames
    let shots: Shots
    let goals: FootballPlayerGoals
    let passes: Passes
    let tackles: Tackles
    let duels: Duels
    let dribbles: Dribbles
    let fouls: Fouls
    let cards: Cards
    let penalty: Penalty
}

struct CoachTeam: Codable {
    let id: Int
    let name: String
    let logo: String
}

struct CoachCareerInfo: Codable {
    let team: CoachTeam
    let start: String?
    let end: String?
}

struct Birth: Codable {
    let date: String?
    let place: String?
    let country: String?
}
// --- 타입 정의 끝 ---


// 응답 모델 확장 (APIErrorCheckable 채택)
// -> 각 모델 파일에서 직접 채택하므로 여기서는 제거


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
        if let parameters = parameters, !parameters.isEmpty, !endpoint.contains("?") {
             urlString += "?"
             urlString += parameters.map { key, value in
                 // URL 인코딩 적용
                 let encodedKey = key.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? key
                 let encodedValue = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
                 return "\(encodedKey)=\(encodedValue)"
             }.joined(separator: "&")
         }
         // 파라미터가 있고 URL에 이미 쿼리 파라미터가 있는 경우
         else if let parameters = parameters, !parameters.isEmpty {
             urlString += "&"
             urlString += parameters.map { key, value in
                 let encodedKey = key.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? key
                 let encodedValue = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value
                 return "\(encodedKey)=\(encodedValue)"
             }.joined(separator: "&")
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

                            // API 에러 확인 (수정: hasErrors 메서드 사용)
                            if let errorCheckable = decodedResponse as? APIErrorCheckable {
                                if errorCheckable.hasErrors() {
                                    let errorMessages = errorCheckable.getErrorMessages()
                                    continuation.resume(throwing: FootballAPIError.apiError(errorMessages))
                                    return
                                }
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

    // 빈 응답 생성 함수 (JSON 문자열 디코딩 방식으로 변경)
    private func createEmptyResponse<T: Decodable>(ofType: T.Type) throws -> T {
        print("📦 빈 응답 생성 시도: \(String(describing: T.self))")
        
        // 기본 JSON 구조 생성
        let jsonString: String
        
        // 타입에 따라 다른 JSON 구조 생성
        if T.self is FixturesResponse.Type {
            jsonString = """
            {
                "get": "fixtures",
                "parameters": {},
                "errors": [],
                "results": 0,
                "paging": {"current": 1, "total": 1},
                "response": []
            }
            """
        }
        else if T.self is FixtureEventResponse.Type {
            jsonString = """
            {
                "get": "fixtures/events",
                "parameters": {},
                "errors": [],
                "results": 0,
                "paging": {"current": 1, "total": 1},
                "response": []
            }
            """
        }
        else if T.self is FixtureStatisticsResponse.Type {
            jsonString = """
            {
                "get": "fixtures/statistics",
                "parameters": {},
                "errors": [],
                "results": 0,
                "paging": {"current": 1, "total": 1},
                "response": []
            }
            """
        }
        else if T.self is HeadToHeadResponse.Type {
            jsonString = """
            {
                "get": "fixtures/headtohead",
                "parameters": {},
                "errors": [],
                "results": 0,
                "paging": {"current": 1, "total": 1},
                "response": []
            }
            """
        }
        else if T.self is TeamProfileResponse.Type {
            jsonString = """
            {
                "get": "teams",
                "parameters": {"id": "0"},
                "errors": [],
                "results": 1,
                "paging": {"current": 1, "total": 1},
                "response": [
                    {
                        "team": {
                            "id": 0,
                            "name": "Unknown Team",
                            "code": null,
                            "country": null,
                            "founded": null,
                            "national": false,
                            "logo": ""
                        },
                        "venue": {
                            "id": null,
                            "name": null,
                            "address": null,
                            "city": null,
                            "capacity": null,
                            "surface": null,
                            "image": null
                        }
                    }
                ]
            }
            """
        }
        else if T.self is TeamSeasonsResponse.Type {
            jsonString = """
            {
                "get": "teams/seasons",
                "parameters": {"id": "0"},
                "errors": [],
                "results": 3,
                "paging": {"current": 1, "total": 1},
                "response": [2024, 2023, 2022]
            }
            """
        }
        else {
            // 기본 빈 응답 구조
            jsonString = """
            {
                "get": "unknown",
                "parameters": {},
                "errors": [],
                "results": 0,
                "paging": {"current": 1, "total": 1},
                "response": []
            }
            """
        }
        
        // JSON 문자열을 데이터로 변환
        guard let jsonData = jsonString.data(using: .utf8) else {
            throw FootballAPIError.decodingError(NSError(domain: "FootballAPI", code: 0, 
                userInfo: [NSLocalizedDescriptionKey: "JSON 문자열을 데이터로 변환할 수 없습니다."]))
        }
        
        // 데이터를 디코딩
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: jsonData)
        } catch {
            print("❌ 빈 응답 디코딩 실패: \(error.localizedDescription)")
            throw FootballAPIError.decodingError(error)
        }
    }

    // 더미 응답 생성 함수 (JSON 문자열 디코딩 방식으로 변경)
    private func createDummyResponse<T: Decodable>(ofType: T.Type, endpoint: String, parameters: [String: String]? = nil) throws -> T {
        print("🔄 더미 응답 생성 시도: \(String(describing: T.self)) - 엔드포인트: \(endpoint)")
        
        // 기본 JSON 구조 생성
        let jsonString: String
        
        // FixturesResponse 타입인 경우
        if T.self is FixturesResponse.Type {
            // 날짜 파라미터 확인
            let date = parameters?["date"] ?? "2025-04-04"
            
            // 리그 ID 파라미터 확인
            var leagueId = 39
            if let leagueParam = parameters?["league"], let id = Int(leagueParam) {
                leagueId = id
            }
            
            // 시즌 파라미터 확인
            var season = 2024
            if let seasonParam = parameters?["season"], let s = Int(seasonParam) {
                season = s
            }
            
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
            var homeTeam1Id = 33
            var homeTeam1Name = "Manchester United"
            var homeTeam1Logo = "https://media.api-sports.io/football/teams/33.png"
            var awayTeam1Id = 40
            var awayTeam1Name = "Liverpool"
            var awayTeam1Logo = "https://media.api-sports.io/football/teams/40.png"
            var homeTeam2Id = 50
            var homeTeam2Name = "Manchester City"
            var homeTeam2Logo = "https://media.api-sports.io/football/teams/50.png"
            var awayTeam2Id = 47
            var awayTeam2Name = "Tottenham"
            var awayTeam2Logo = "https://media.api-sports.io/football/teams/47.png"
            
            // 리그 ID에 따라 팀 설정
            switch leagueId {
            case 140: // 라리가
                homeTeam1Id = 541
                homeTeam1Name = "Real Madrid"
                homeTeam1Logo = "https://media.api-sports.io/football/teams/541.png"
                awayTeam1Id = 529
                awayTeam1Name = "Barcelona"
                awayTeam1Logo = "https://media.api-sports.io/football/teams/529.png"
                homeTeam2Id = 530
                homeTeam2Name = "Atletico Madrid"
                homeTeam2Logo = "https://media.api-sports.io/football/teams/530.png"
                awayTeam2Id = 532
                awayTeam2Name = "Valencia"
                awayTeam2Logo = "https://media.api-sports.io/football/teams/532.png"
            case 135: // 세리에 A
                homeTeam1Id = 489
                homeTeam1Name = "AC Milan"
                homeTeam1Logo = "https://media.api-sports.io/football/teams/489.png"
                awayTeam1Id = 505
                awayTeam1Name = "Inter"
                awayTeam1Logo = "https://media.api-sports.io/football/teams/505.png"
                homeTeam2Id = 496
                homeTeam2Name = "Juventus"
                homeTeam2Logo = "https://media.api-sports.io/football/teams/496.png"
                awayTeam2Id = 497
                awayTeam2Name = "AS Roma"
                awayTeam2Logo = "https://media.api-sports.io/football/teams/497.png"
            default:
                // 기본값은 프리미어 리그 팀
                break
            }
            
            // 경기 ID 생성 (고유한 ID 생성)
            let fixtureId1 = Int.random(in: 1000000..<9999999)
            let fixtureId2 = Int.random(in: 1000000..<9999999)
            
            // 경기 시간
            let matchTime1 = "15:00"
            let matchTime2 = "20:00"
            
            // 경기 날짜 문자열 생성
            let matchDateString1 = "\(date)T\(matchTime1):00+00:00"
            let matchDateString2 = "\(date)T\(matchTime2):00+00:00"
            
            // 경기 라운드
            let round1 = "Regular Season - \(Int.random(in: 1...19))"
            let round2 = "Regular Season - \(Int.random(in: 20...38))"
            
            // 경기장 정보
            let venueId1 = 1001
            let venueName1 = "\(homeTeam1Name) Stadium"
            let venueId2 = 1002
            let venueName2 = "\(homeTeam2Name) Stadium"
            
            // JSON 문자열 생성
            jsonString = """
            {
                "get": "fixtures",
                "parameters": {
                    "league": "\(leagueId)",
                    "season": "\(season)",
                    "date": "\(date)"
                },
                "errors": [],
                "results": 2,
                "paging": {"current": 1, "total": 1},
                "response": [
                    {
                        "fixture": {
                            "id": \(fixtureId1),
                            "date": "\(matchDateString1)",
                            "status": {
                                "long": "Not Started",
                                "short": "NS",
                                "elapsed": null
                            },
                            "venue": {
                                "id": \(venueId1),
                                "name": "\(venueName1)",
                                "city": "\(leagueCountry)"
                            },
                            "timezone": "UTC",
                            "referee": null
                        },
                        "league": {
                            "id": \(leagueId),
                            "name": "\(leagueName)",
                            "country": "\(leagueCountry)",
                            "logo": "\(leagueLogo)",
                            "flag": null,
                            "season": \(season),
                            "round": "\(round1)",
                            "standings": true
                        },
                        "teams": {
                            "home": {
                                "id": \(homeTeam1Id),
                                "name": "\(homeTeam1Name)",
                                "logo": "\(homeTeam1Logo)",
                                "winner": null
                            },
                            "away": {
                                "id": \(awayTeam1Id),
                                "name": "\(awayTeam1Name)",
                                "logo": "\(awayTeam1Logo)",
                                "winner": null
                            }
                        },
                        "goals": {
                            "home": null,
                            "away": null
                        }
                    },
                    {
                        "fixture": {
                            "id": \(fixtureId2),
                            "date": "\(matchDateString2)",
                            "status": {
                                "long": "Not Started",
                                "short": "NS",
                                "elapsed": null
                            },
                            "venue": {
                                "id": \(venueId2),
                                "name": "\(venueName2)",
                                "city": "\(leagueCountry)"
                            },
                            "timezone": "UTC",
                            "referee": null
                        },
                        "league": {
                            "id": \(leagueId),
                            "name": "\(leagueName)",
                            "country": "\(leagueCountry)",
                            "logo": "\(leagueLogo)",
                            "flag": null,
                            "season": \(season),
                            "round": "\(round2)",
                            "standings": true
                        },
                        "teams": {
                            "home": {
                                "id": \(homeTeam2Id),
                                "name": "\(homeTeam2Name)",
                                "logo": "\(homeTeam2Logo)",
                                "winner": null
                            },
                            "away": {
                                "id": \(awayTeam2Id),
                                "name": "\(awayTeam2Name)",
                                "logo": "\(awayTeam2Logo)",
                                "winner": null
                            }
                        },
                        "goals": {
                            "home": null,
                            "away": null
                        }
                    }
                ]
            }
            """
            
            print("✅ 리그 \(leagueId)에 대한 더미 경기 일정 생성 완료")
        }
        else {
            // 다른 응답 타입에 대한 처리는 빈 응답 생성 함수로 위임
            return try createEmptyResponse(ofType: T.self)
        }
        
        // JSON 문자열을 데이터로 변환
        guard let jsonData = jsonString.data(using: .utf8) else {
            throw FootballAPIError.decodingError(NSError(domain: "FootballAPI", code: 0, 
                userInfo: [NSLocalizedDescriptionKey: "JSON 문자열을 데이터로 변환할 수 없습니다."]))
        }
        
        // 데이터를 디코딩
        do {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: jsonData)
        } catch {
            print("❌ 더미 응답 디코딩 실패: \(error.localizedDescription)")
            throw FootballAPIError.decodingError(error)
        }
    }

    // 빈 Parameters 생성 함수
    private func createEmptyParameters() -> ResponseParameters {
        return ResponseParameters(fixture: nil, league: nil, season: nil, team: nil, date: nil)
    }

    // 빈 Paging 생성 함수
    private func createEmptyPaging() -> APIPaging { // ResponsePaging -> APIPaging
        return APIPaging(current: 1, total: 1)
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

    // 빈 FixtureParameters 생성 함수 제거
    // private func createEmptyFixtureParameters() -> FixtureParameters { ... } // 제거

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
            let dateRange = getDateRange(forSeason: season) // getDateRange 함수 호출 복구
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

    // 토너먼트 녹아웃 스테이지인지 확인하는 함수 (새로 추가)
    private func isKnockoutStage(_ round: String) -> Bool {
        let lowercasedRound = round.lowercased()
        // 그룹 스테이지나 리그 스테이지는 제외
        if lowercasedRound.contains("group") || lowercasedRound.contains("league stage") {
            return false
        }
        // 녹아웃 스테이지 키워드 확인
        let knockoutKeywords = ["final", "semi", "quarter", "round of 16", "1st leg", "2nd leg"]
        return knockoutKeywords.contains { lowercasedRound.contains($0) }
    }

    // 1차전 경기 찾기 (캐싱 활용 및 로직 개선)
    func findFirstLegMatch(fixture: Fixture) async throws -> Fixture? {
        print("🏆 findFirstLegMatch - Function called for fixture: \(fixture.fixture.id), League ID: \(fixture.league.id), Round: \(fixture.league.round)")

        // 1. 챔피언스리그(2)나 유로파리그(3) 확인
        if ![2, 3].contains(fixture.league.id) {
            print("🏆 findFirstLegMatch - Not a target league (\(fixture.league.id)), returning nil.")
            return nil
        }

        // 2. 현재 경기가 녹아웃 스테이지인지 확인 (1차전/2차전 구분 없이) - 이 검사는 유지
        let isCurrentMatchKnockout = isKnockoutStage(fixture.league.round)
        if !isCurrentMatchKnockout {
            print("🏆 findFirstLegMatch - Not a knockout stage match (\(fixture.league.round)), returning nil.")
            return nil
        }
        print("🏆 findFirstLegMatch - Current match is a knockout stage match. Searching for 1st leg...")

        // 홈팀과 원정팀 ID
        let homeTeamId = fixture.teams.home.id
        let awayTeamId = fixture.teams.away.id

        // H2H 호출 전 로그 추가
        print("🏆 findFirstLegMatch - Calling getHeadToHead for \(homeTeamId) vs \(awayTeamId)...")
        let h2hFixtures: [Fixture] // Declare h2hFixtures here
        do {
            // 두 팀의 과거 경기 가져오기 (캐싱 활용)
            h2hFixtures = try await getHeadToHead(team1Id: homeTeamId, team2Id: awayTeamId, last: 20)
            // H2H 호출 성공 및 데이터 로깅 추가
            print("🏆 findFirstLegMatch - getHeadToHead call successful. Received \(h2hFixtures.count) H2H fixtures.")
            print("🏆 findFirstLegMatch - H2H Data for \(homeTeamId) vs \(awayTeamId):")
            h2hFixtures.forEach { print("  - Fixture ID: \($0.fixture.id), Date: \($0.fixture.date), Round: \($0.league.round), Status: \($0.fixture.status.short), Score: \($0.goals?.home ?? -1)-\($0.goals?.away ?? -1)") }
        } catch {
            print("❌ findFirstLegMatch - Error calling getHeadToHead: \(error.localizedDescription)")
            // getHeadToHead 실패 시 에러를 다시 던져서 호출 측에서 처리하도록 함
            throw error // Re-throw the error
        }

        // 1차전 경기 찾기 (라운드 이름 의존성 제거, 날짜 비교 강화)

        // 1. H2H 기록에서 같은 시즌, 같은 리그, 같은 녹아웃 스테이지의 경기 필터링
        let potentialMatches = h2hFixtures.filter { match in
            let isSameSeason = match.league.season == fixture.league.season
            let isSameLeague = match.league.id == fixture.league.id
            let isKnockout = isKnockoutStage(match.league.round) // 두 경기 모두 녹아웃이어야 함
            // 라운드 이름이 완전히 같거나, "1st leg"/"2nd leg"만 다른 경우 같은 스테이지로 간주
            // 예: "Quarter-finals" == "Quarter-finals - 1st leg" (앞부분 기준)
            let currentRoundBase = fixture.league.round.lowercased().components(separatedBy: " - ")[0]
            let matchRoundBase = match.league.round.lowercased().components(separatedBy: " - ")[0]
            let isSameStage = (currentRoundBase == matchRoundBase)

            return isSameSeason && isSameLeague && isKnockout && isSameStage
        }
        print("🏆 findFirstLegMatch - Found \(potentialMatches.count) potential matches in the same knockout stage.")

        // 2. potentialMatches 중에서 현재 경기보다 이전에 열렸고 종료된 경기를 찾음
        let possibleFirstLegs = potentialMatches.filter { match in
            let isEarlier = match.fixture.date < fixture.fixture.date
            let isFinished = ["FT", "AET", "PEN"].contains(match.fixture.status.short)
            let isDifferent = match.fixture.id != fixture.fixture.id
            // 홈/어웨이 팀이 반대인 경우를 우선적으로 고려 (선택 사항, 더 정확할 수 있음)
            // let teamsReversed = match.teams.home.id == awayTeamId && match.teams.away.id == homeTeamId
            return isEarlier && isFinished && isDifferent // && teamsReversed
        }.sorted { $0.fixture.date < $1.fixture.date } // 가장 이른 경기를 찾기 위해 정렬

        // 3. 찾은 1차전 후보 반환 (가장 이른 경기)
        if let firstLeg = possibleFirstLegs.first {
            print("🏆 findFirstLegMatch - Found potential 1st leg based on date and status: \(firstLeg.fixture.id)")
            return firstLeg
        } else {
            print("🏆 findFirstLegMatch - No suitable 1st leg found in H2H history.")
            return nil
        }
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

        // 엔드포인트 변환 로깅
        print("🔄 엔드포인트 변환: /teams/statistics -> teams/statistics")

        // 올바른 엔드포인트 사용
        do {
            let response: TeamStatisticsResponse = try await performRequest(
                endpoint: "/teams/statistics",
                parameters: parameters,
                cachePolicy: .medium // 팀 통계는 경기 후 변경될 수 있으므로 중간 캐싱
            )

            return response.response
        } catch {
            print("⚠️ 팀 통계 가져오기 실패: \(error.localizedDescription)")

            // 빈 응답 생성
            return TeamSeasonStatistics(
                league: TeamLeagueInfo(id: leagueId, name: "Unknown", country: nil, logo: "", flag: nil, season: season),
                team: TeamStatisticsInfo(id: teamId, name: "Unknown", logo: ""),
                form: nil,
                fixtures: nil,
                goals: nil,
                biggest: nil,
                clean_sheets: nil,
                failed_to_score: nil,
                penalty: nil,
                lineups: nil,
                cards: nil
            )
        }
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

        // 엔드포인트 변환 로깅
        print("🔄 엔드포인트 변환: /players/squads -> players/squads")

        // 올바른 엔드포인트 사용
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

    // 선수 프로필 가져오기 (캐싱 적용) - 수정: 올바른 엔드포인트 및 파라미터 사용
    func getPlayerProfile(playerId: Int) async throws -> PlayerProfileData {
        // 현재 시즌 가져오기
        let currentSeason = await SearchViewModel.getCurrentSeason()
        
        // 시도할 시즌 목록 (최신 시즌부터)
        let seasons = [currentSeason, currentSeason - 1, currentSeason - 2]
        var lastError: Error? = nil
        
        // 각 시즌을 순차적으로 시도
        for season in seasons {
            do {
                let parameters = ["id": String(playerId), "season": String(season)]
                print("🔍 선수 프로필 조회 시도: ID \(playerId), 시즌 \(season)")
                
                let response: PlayerProfileResponse = try await performRequest(
                    endpoint: "players", // 슬래시 제거 및 올바른 엔드포인트 사용
                    parameters: parameters,
                    cachePolicy: .medium
                )
                
                guard response.results > 0,
                      let profile = response.response.first else {
                    print("⚠️ 선수 프로필 없음 (ID: \(playerId), 시즌: \(season))")
                    continue // 다음 시즌 시도
                }
                
                print("✅ 선수 프로필 조회 성공: \(profile.player.name ?? "Unknown")")
                return profile
            } catch {
                print("❌ 선수 프로필 조회 실패 (ID: \(playerId), 시즌: \(season)): \(error.localizedDescription)")
                lastError = error
                continue // 다음 시즌 시도
            }
        }
        
        // 모든 시즌에서 실패한 경우
        if let error = lastError {
            print("❌ 모든 시즌에서 선수 프로필 조회 실패 (ID: \(playerId))")
            throw FootballAPIError.decodingError(error)
        } else {
            throw FootballAPIError.apiError(["선수 정보를 찾을 수 없습니다."])
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

    // 선수 프로필 가져오기 (ID 목록) - 새로 추가
    func getPlayerProfiles(playerIds: [Int]) async throws -> [PlayerProfileData] {
        // 현재 시즌 가져오기 (사용하지 않는 변수 제거)
        // let currentSeason = SearchViewModel.getCurrentSeason()
        var results: [PlayerProfileData] = []
        
        // 각 선수 ID에 대해 프로필 조회
        for playerId in playerIds {
            do {
                let profile = try await getPlayerProfile(playerId: playerId)
                results.append(profile)
            } catch {
                print("⚠️ 선수 ID \(playerId) 프로필 조회 실패: \(error.localizedDescription)")
                // 실패해도 계속 진행
                continue
            }
        }
        
        return results
    }

    // 날짜 범위 계산 (더 최적화) - 복구된 함수
    private func getDateRange(forSeason season: Int) -> (from: String, to: String) {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")

        let currentSeason = 2024 // 현재 시즌을 상수로 정의하거나 동적으로 가져올 수 있음
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

    // MARK: - Search Methods

    // 팀 검색 (수정: 엔드포인트 경로 및 특수 문자 처리)
    func searchTeams(query: String) async throws -> [TeamProfile] {
        // 검색어 인코딩 (URL 인코딩 적용)
        let encodedQuery = encodeSearchQuery(query)
        let parameters = ["search": encodedQuery]
        
        // 로그 추가
        print("🔍 팀 검색 시작: \(query) (인코딩: \(encodedQuery))")
        
        do {
            let response: TeamProfileResponse = try await performRequest(
                endpoint: "teams", // 슬래시 제거
                parameters: parameters,
                cachePolicy: .short // 검색 결과는 자주 변경될 수 있으므로 짧은 캐싱
            )
            
            print("✅ 팀 검색 성공: \(response.response.count)개 결과")
            return response.response
        } catch {
            print("❌ 팀 검색 실패: \(error.localizedDescription)")
            // 에러 발생 시 빈 배열 반환
            return []
        }
    }

    // 리그/컵대회 검색 (수정: 엔드포인트 경로 및 특수 문자 처리)
    func searchLeagues(query: String, type: String? = nil) async throws -> [LeagueDetails] {
        // 검색어 인코딩 (URL 인코딩 적용)
        let encodedQuery = encodeSearchQuery(query)
        var parameters = ["search": encodedQuery]
        if let type = type {
            parameters["type"] = type // "league" 또는 "cup"
        }
        
        // 로그 추가
        print("🔍 리그 검색 시작: \(query) (인코딩: \(encodedQuery))")
        
        do {
            let response: LeaguesResponse = try await performRequest(
                endpoint: "leagues", // 슬래시 제거
                parameters: parameters,
                cachePolicy: .short
            )
            
            print("✅ 리그 검색 성공: \(response.response.count)개 결과")
            return response.response
        } catch {
            print("❌ 리그 검색 실패: \(error.localizedDescription)")
            // 에러 발생 시 빈 배열 반환
            return []
        }
    }

    // 선수 검색 (특정 리그 내) (수정: 엔드포인트 경로, 파라미터 및 특수 문자 처리)
    func searchPlayers(query: String, leagueId: Int, season: Int) async throws -> [PlayerProfileData] {
        // 검색어 인코딩 (URL 인코딩 적용)
        let encodedQuery = encodeSearchQuery(query)
        
        // 파라미터 수정: API 문서에 따라 search 파라미터 사용
        let parameters = ["search": encodedQuery, "league": String(leagueId), "season": String(season)]
        
        // 로그 추가
        print("🔍 선수 검색 시작: \(query) (인코딩: \(encodedQuery)), 리그: \(leagueId), 시즌: \(season)")
        
        do {
            // 올바른 엔드포인트 경로 사용
            let response: PlayerProfileResponse = try await performRequest(
                endpoint: "players",
                parameters: parameters,
                cachePolicy: .short
            )
            
            print("✅ 선수 검색 성공: \(response.response.count)개 결과")
            return response.response
        } catch {
            print("❌ 선수 검색 실패: \(error.localizedDescription)")
            // 에러 발생 시 빈 배열 반환 (더미 데이터 사용하지 않음)
            return []
        }
    }

    // 감독 검색 (수정: 엔드포인트 경로 및 특수 문자 처리)
    func searchCoaches(query: String) async throws -> [CoachInfo] {
        // 검색어 인코딩 (URL 인코딩 적용)
        let encodedQuery = encodeSearchQuery(query)
        let parameters = ["search": encodedQuery]
        
        // 로그 추가
        print("🔍 감독 검색 시작: \(query) (인코딩: \(encodedQuery))")
        
        do {
            let response: CoachResponse = try await performRequest(
                endpoint: "coachs", // 슬래시 제거
                parameters: parameters,
                cachePolicy: .short
            )
            
            print("✅ 감독 검색 성공: \(response.response.count)개 결과")
            return response.response
        } catch {
            print("❌ 감독 검색 실패: \(error.localizedDescription)")
            // 에러 발생 시 빈 배열 반환
            return []
        }
    }
    
    // 검색어 인코딩 함수 (특수 문자 처리)
    private func encodeSearchQuery(_ query: String) -> String {
        // 알파벳, 숫자, 공백만 허용하는 정규식
        let regex = try! NSRegularExpression(pattern: "[^a-zA-Z0-9\\s]", options: [])
        let range = NSRange(location: 0, length: query.utf16.count)
        let sanitized = regex.stringByReplacingMatches(in: query, options: [], range: range, withTemplate: "")
        
        // 공백이 2개 이상 연속된 경우 하나로 치환
        let multipleSpacesRegex = try! NSRegularExpression(pattern: "\\s{2,}", options: [])
        let sanitizedWithSingleSpaces = multipleSpacesRegex.stringByReplacingMatches(
            in: sanitized, options: [], range: NSRange(location: 0, length: sanitized.utf16.count), withTemplate: " "
        )
        
        return sanitizedWithSingleSpaces.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    // 더미 팀 데이터 생성 함수
    private func createDummyTeams(query: String) -> [TeamProfile] {
        print("🔄 더미 팀 데이터 생성: \(query)")
        
        // 검색어를 소문자로 변환
        let lowercaseQuery = query.lowercased()
        
        // 주요 팀 목록
        let teams: [(id: Int, name: String, country: String, logo: String)] = [
            (33, "Manchester United", "England", "https://media.api-sports.io/football/teams/33.png"),
            (40, "Liverpool", "England", "https://media.api-sports.io/football/teams/40.png"),
            (50, "Manchester City", "England", "https://media.api-sports.io/football/teams/50.png"),
            (47, "Tottenham", "England", "https://media.api-sports.io/football/teams/47.png"),
            (42, "Arsenal", "England", "https://media.api-sports.io/football/teams/42.png"),
            (49, "Chelsea", "England", "https://media.api-sports.io/football/teams/49.png"),
            (541, "Real Madrid", "Spain", "https://media.api-sports.io/football/teams/541.png"),
            (529, "Barcelona", "Spain", "https://media.api-sports.io/football/teams/529.png"),
            (530, "Atletico Madrid", "Spain", "https://media.api-sports.io/football/teams/530.png"),
            (157, "Bayern Munich", "Germany", "https://media.api-sports.io/football/teams/157.png"),
            (165, "Borussia Dortmund", "Germany", "https://media.api-sports.io/football/teams/165.png"),
            (505, "Inter", "Italy", "https://media.api-sports.io/football/teams/505.png"),
            (489, "AC Milan", "Italy", "https://media.api-sports.io/football/teams/489.png"),
            (496, "Juventus", "Italy", "https://media.api-sports.io/football/teams/496.png"),
            (85, "Paris Saint Germain", "France", "https://media.api-sports.io/football/teams/85.png")
        ]
        
        // 검색어와 일치하는 팀 필터링
        let filteredTeams = teams.filter { team in
            team.name.lowercased().contains(lowercaseQuery) || 
            team.country.lowercased().contains(lowercaseQuery)
        }
        
        // TeamProfile 객체로 변환
        return filteredTeams.map { team in
            let teamInfo = TeamInfo(
                id: team.id,
                name: team.name,
                code: nil,
                country: team.country,
                founded: nil,
                national: false,
                logo: team.logo
            )
            
            let venueInfo = VenueInfo(
                id: nil,
                name: "\(team.name) Stadium",
                address: nil,
                city: team.country,
                capacity: nil,
                surface: nil,
                image: nil
            )
            
            return TeamProfile(team: teamInfo, venue: venueInfo)
        }
    }
    
    // 더미 리그 데이터 생성 함수
    private func createDummyLeagues(query: String) -> [LeagueDetails] {
        print("🔄 더미 리그 데이터 생성: \(query)")
        
        // 검색어를 소문자로 변환
        let lowercaseQuery = query.lowercased()
        
        // 주요 리그 목록
        let leagues: [(id: Int, name: String, country: String, logo: String, flag: String?)] = [
            (39, "Premier League", "England", "https://media.api-sports.io/football/leagues/39.png", "https://media.api-sports.io/flags/gb.svg"),
            (140, "La Liga", "Spain", "https://media.api-sports.io/football/leagues/140.png", "https://media.api-sports.io/flags/es.svg"),
            (135, "Serie A", "Italy", "https://media.api-sports.io/football/leagues/135.png", "https://media.api-sports.io/flags/it.svg"),
            (78, "Bundesliga", "Germany", "https://media.api-sports.io/football/leagues/78.png", "https://media.api-sports.io/flags/de.svg"),
            (61, "Ligue 1", "France", "https://media.api-sports.io/football/leagues/61.png", "https://media.api-sports.io/flags/fr.svg"),
            (2, "UEFA Champions League", "World", "https://media.api-sports.io/football/leagues/2.png", nil),
            (3, "UEFA Europa League", "World", "https://media.api-sports.io/football/leagues/3.png", nil),
            (4, "UEFA Conference League", "World", "https://media.api-sports.io/football/leagues/4.png", nil),
            (1, "World Cup", "World", "https://media.api-sports.io/football/leagues/1.png", nil),
            (45, "FA Cup", "England", "https://media.api-sports.io/football/leagues/45.png", "https://media.api-sports.io/flags/gb.svg")
        ]
        
        // 검색어와 일치하는 리그 필터링
        let filteredLeagues = leagues.filter { league in
            league.name.lowercased().contains(lowercaseQuery) || 
            league.country.lowercased().contains(lowercaseQuery)
        }
        
        // LeagueDetails 객체로 변환
        return filteredLeagues.map { league in
            let leagueInfo = LeagueInfo(
                id: league.id,
                name: league.name,
                type: league.id == 2 || league.id == 3 || league.id == 4 || league.id == 1 ? "Cup" : "League",
                logo: league.logo
            )
            
            let countryInfo = Country(
                name: league.country,
                code: nil,
                flag: league.flag
            )
            
            let seasons = [
                Season(year: 2024, start: "2024-08-01", end: "2025-05-31", current: true, coverage: nil),
                Season(year: 2023, start: "2023-08-01", end: "2024-05-31", current: false, coverage: nil)
            ]
            
            return LeagueDetails(league: leagueInfo, country: countryInfo, seasons: seasons)
        }
    }
    
    // 더미 선수 데이터 생성 함수
    private func createDummyPlayers(query: String, leagueId: Int) -> [PlayerProfileData] {
        print("🔄 더미 선수 데이터 생성: \(query), 리그: \(leagueId)")
        
        // 검색어를 소문자로 변환
        let lowercaseQuery = query.lowercased()
        
        // 리그별 주요 선수 목록
        var players: [(id: Int, name: String, age: Int, nationality: String, photo: String, teamId: Int, teamName: String, teamLogo: String)] = []
        
        // 리그별 선수 데이터 설정
        switch leagueId {
        case 39: // 프리미어 리그
            players = [
                (278, "Harry Kane", 30, "England", "https://media.api-sports.io/football/players/278.png", 47, "Tottenham", "https://media.api-sports.io/football/teams/47.png"),
                (18788, "Marcus Rashford", 26, "England", "https://media.api-sports.io/football/players/18788.png", 33, "Manchester United", "https://media.api-sports.io/football/teams/33.png"),
                (1100, "Kevin De Bruyne", 32, "Belgium", "https://media.api-sports.io/football/players/1100.png", 50, "Manchester City", "https://media.api-sports.io/football/teams/50.png"),
                (306, "Mohamed Salah", 31, "Egypt", "https://media.api-sports.io/football/players/306.png", 40, "Liverpool", "https://media.api-sports.io/football/teams/40.png")
            ]
        case 140: // 라리가
            players = [
                (874, "Karim Benzema", 35, "France", "https://media.api-sports.io/football/players/874.png", 541, "Real Madrid", "https://media.api-sports.io/football/teams/541.png"),
                (154, "Luka Modric", 38, "Croatia", "https://media.api-sports.io/football/players/154.png", 541, "Real Madrid", "https://media.api-sports.io/football/teams/541.png"),
                (521, "Robert Lewandowski", 35, "Poland", "https://media.api-sports.io/football/players/521.png", 529, "Barcelona", "https://media.api-sports.io/football/teams/529.png")
            ]
        case 135: // 세리에 A
            players = [
                (1550, "Romelu Lukaku", 30, "Belgium", "https://media.api-sports.io/football/players/1550.png", 505, "Inter", "https://media.api-sports.io/football/teams/505.png"),
                (742, "Paulo Dybala", 30, "Argentina", "https://media.api-sports.io/football/players/742.png", 497, "AS Roma", "https://media.api-sports.io/football/teams/497.png")
            ]
        default:
            players = [
                (278, "Harry Kane", 30, "England", "https://media.api-sports.io/football/players/278.png", 47, "Tottenham", "https://media.api-sports.io/football/teams/47.png"),
                (874, "Karim Benzema", 35, "France", "https://media.api-sports.io/football/players/874.png", 541, "Real Madrid", "https://media.api-sports.io/football/teams/541.png"),
                (521, "Robert Lewandowski", 35, "Poland", "https://media.api-sports.io/football/players/521.png", 529, "Barcelona", "https://media.api-sports.io/football/teams/529.png"),
                (1550, "Romelu Lukaku", 30, "Belgium", "https://media.api-sports.io/football/players/1550.png", 505, "Inter", "https://media.api-sports.io/football/teams/505.png")
            ]
        }
        
        // 검색어와 일치하는 선수 필터링
        let filteredPlayers = players.filter { player in
            player.name.lowercased().contains(lowercaseQuery) || 
            player.nationality.lowercased().contains(lowercaseQuery) ||
            player.teamName.lowercased().contains(lowercaseQuery)
        }
        
        // PlayerProfileData 객체로 변환
        return filteredPlayers.map { player in
            let playerInfo = PlayerInfo(
                id: player.id,
                name: player.name,
                firstname: player.name.components(separatedBy: " ").first,
                lastname: player.name.components(separatedBy: " ").last,
                age: player.age,
                nationality: player.nationality,
                height: nil,
                weight: nil,
                photo: player.photo,
                injured: false,
                birth: nil
            )
            
            let teamInfo = StatisticsTeam(
                id: player.teamId,
                name: player.teamName,
                logo: player.teamLogo
            )
            
            let leagueInfo = StatisticsLeague(
                id: leagueId,
                name: leagueId == 39 ? "Premier League" : 
                      leagueId == 140 ? "La Liga" : 
                      leagueId == 135 ? "Serie A" : "Unknown League",
                country: leagueId == 39 ? "England" : 
                         leagueId == 140 ? "Spain" : 
                         leagueId == 135 ? "Italy" : "Unknown",
                logo: "https://media.api-sports.io/football/leagues/\(leagueId).png",
                flag: nil,
                season: 2024
            )
            
            // 사용되지 않는 statistics 변수 제거
            let _ = [
                PlayerStatistics(
                    team: teamInfo,
                    league: leagueInfo,
                    games: PlayerGames(
                        appearences: 30,
                        lineups: 28,
                        minutes: 2520,
                        number: nil,
                        position: "Attacker",
                        rating: "7.5",
                        captain: false
                    ),
                    shots: Shots(total: 80, on: 40),
                    goals: FootballPlayerGoals(total: 20, conceded: nil, assists: 5, saves: nil),
                    passes: Passes(total: 500, key: 30, accuracy: 85),
                    tackles: Tackles(total: 15, blocks: 5, interceptions: 10),
                    duels: Duels(total: 200, won: 120),
                    dribbles: Dribbles(attempts: 50, success: 30, past: nil),
                    fouls: Fouls(drawn: 40, committed: 20),
                    cards: Cards(yellow: 3, yellowred: 0, red: 0),
                    penalty: Penalty(won: 2, committed: 0, scored: 3, missed: 1, saved: nil)
                )
            ]
            
            // 빈 PlayerSeasonStats 배열 생성 (타입 변환 문제 해결)
            let seasonStats: [PlayerSeasonStats] = []
            
            return PlayerProfileData(player: playerInfo, statistics: seasonStats)
        }
    }
    
    // 더미 감독 데이터 생성 함수
    private func createDummyCoaches(query: String) -> [CoachInfo] {
        print("🔄 더미 감독 데이터 생성: \(query)")
        
        // 검색어를 소문자로 변환
        let lowercaseQuery = query.lowercased()
        
        // 주요 감독 목록
        let coaches: [(id: Int, name: String, age: Int, nationality: String, photo: String, teamId: Int, teamName: String)] = [
            (1, "Pep Guardiola", 53, "Spain", "https://media.api-sports.io/football/coachs/1.png", 50, "Manchester City"),
            (2, "Jurgen Klopp", 56, "Germany", "https://media.api-sports.io/football/coachs/2.png", 40, "Liverpool"),
            (3, "Carlo Ancelotti", 64, "Italy", "https://media.api-sports.io/football/coachs/3.png", 541, "Real Madrid"),
            (4, "Thomas Tuchel", 50, "Germany", "https://media.api-sports.io/football/coachs/4.png", 157, "Bayern Munich"),
            (5, "Xavi Hernandez", 44, "Spain", "https://media.api-sports.io/football/coachs/5.png", 529, "Barcelona")
        ]
        
        // 검색어와 일치하는 감독 필터링
        let filteredCoaches = coaches.filter { coach in
            coach.name.lowercased().contains(lowercaseQuery) || 
            coach.nationality.lowercased().contains(lowercaseQuery) ||
            coach.teamName.lowercased().contains(lowercaseQuery)
        }
        
        // CoachInfo 객체로 변환
        return filteredCoaches.map { coach in
            // 팀 정보만 생성 (careerInfo 변수 제거)
            
            let teamInfo = Team(
                id: coach.teamId,
                name: coach.teamName,
                logo: "https://media.api-sports.io/football/teams/\(coach.teamId).png",
                winner: nil
            )
            
            return CoachInfo(
                id: coach.id,
                name: coach.name,
                firstname: coach.name.components(separatedBy: " ").first ?? "",
                lastname: coach.name.components(separatedBy: " ").last ?? "",
                age: coach.age,
                birth: nil, // Birth 타입 변환 문제 해결을 위해 nil 사용
                nationality: coach.nationality,
                height: nil,
                weight: nil,
                photo: coach.photo,
                team: teamInfo, // 누락된 team 파라미터 추가
                career: [] // CoachCareer 타입 변환 문제 해결을 위해 빈 배열 사용
            )
        }
    }

} // 클래스 닫는 괄호 확인
