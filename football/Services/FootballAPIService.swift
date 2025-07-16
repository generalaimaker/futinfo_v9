import Foundation
import SwiftUI
import Combine

// 한글-영문 팀 이름 매핑 딕셔너리 직접 정의
// TeamData.swift에서 복사해온 딕셔너리
let koreanToEnglishTeamName: [String: String] = [
    "맨유": "Manchester United",
    "맨시티": "Manchester City",
    "리버풀": "Liverpool",
    "첼시": "Chelsea",
    "아스날": "Arsenal",
    "토트넘": "Tottenham Hotspur",
    "뉴캐슬": "Newcastle United",
    "브라이튼": "Brighton & Hove Albion",
    "웨스트햄": "West Ham United",
    "레스터": "Leicester City",
    "리즈": "Leeds United",
    "에버턴": "Everton",
    "울버햄튼": "Wolverhampton Wanderers",
    "셰필드": "Sheffield United",
    "번리": "Burnley",
    "풀럼": "Fulham",
    "크리스탈팰리스": "Crystal Palace",
    "수정궁": "Crystal Palace",
    "브렌트포드": "Brentford",
    
    "레알": "Real Madrid",
    "바르셀로나": "Barcelona",
    "바르샤": "Barcelona",
    "아틀레티코": "Atlético Madrid",
    "알레띠": "Atlético Madrid",
    "세비야": "Sevilla",
    "레알소시에다드": "Real Sociedad",
    "빌바오": "Athletic Club",
    "베티스": "Real Betis",
    "헤타페": "Getafe",
    "비야레알": "Villarreal",
    
    "유벤투스": "Juventus",
    "인터밀란": "Inter",
    "인테르": "Inter",
    "ac밀란": "AC Milan",
    "밀란": "AC Milan",
    "나폴리": "Napoli",
    "로마": "Roma",
    "라치오": "Lazio",
    "피오렌티나": "Fiorentina",
    "아탈란타": "Atalanta",
    
    "바이에른": "Bayern Munich",
    "뮌헨": "Bayern Munich",
    "바이언": "Bayern Munich",
    "도르트문트": "Borussia Dortmund",
    "돌문": "Borussia Dortmund",
    "레버쿠젠": "Bayer Leverkusen",
    "라이프치히": "RB Leipzig",
    "프라이부르크": "Freiburg",
    "프랑크푸르트": "Eintracht Frankfurt",
    
    "파리": "Paris Saint-Germain",
    "psg": "Paris Saint-Germain",
    "마르세유": "Marseille",
    "모나코": "Monaco",
    "리옹": "Lyon",
    "니스": "Nice",
    "렌": "Rennes",
    
    "벤피카": "Benfica",
    "포르투": "Porto",
    "셀틱": "Celtic",
    "레인저스": "Rangers",
    "샤흐타르": "Shakhtar Donetsk",
    "갈라타사라이": "Galatasaray",
    "페네르바체": "Fenerbahce",
    "아약스": "Ajax",
    "psv": "PSV",
    "아인트호번": "PSV",
    "브뤼허": "Club Brugge"
]

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
    let apiHost = "api-football-v1.p.rapidapi.com" // TestAPIView에서 사용
    let apiKey: String

    // 캐시 및 요청 관리자
    private let cacheManager = APICacheManager.shared
    private let requestManager = APIRequestManager.shared
    // Supabase Edge Functions \uc0ac\uc6a9
    private let config = AppConfiguration.shared

    static let shared = FootballAPIService()
    
    // API 키 유효성 검사 (Supabase Edge Functions 사용 시 항상 true)
    var isAPIKeyValid: Bool {
        // Supabase Edge Functions를 사용하므로 클라이언트에서는 API 키를 직접 검증하지 않음
        return true
    }

    private init() {
        // API 키는 Supabase Edge Functions secrets에서 관리됨
        // 클라이언트에서는 더미 키 사용 (실제 키는 서버에서만 사용)
        self.apiKey = "dummy-key-for-client"
        print("ℹ️ API 키는 Supabase Edge Functions에서 관리됩니다")
    }

    // 요청 생성 (파라미터 지원 추가)
    func createRequest(_ endpoint: String, parameters: [String: String]? = nil) -> URLRequest {
        var components = URLComponents(string: baseURL + endpoint)
        var queryItems: [URLQueryItem] = components?.queryItems ?? []

        // 파라미터 추가 (개별 키/값 인코딩)
        if let parameters = parameters {
            for (key, value) in parameters {
                // 값만 인코딩 (키는 일반적으로 인코딩 불필요)
                let encodedValue = value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)
                queryItems.append(URLQueryItem(name: key, value: encodedValue))
            }
        }

        // 기존 쿼리 아이템과 병합 (중복 제거는 필요 시 추가)
        components?.queryItems = queryItems

        guard let url = components?.url else {
            fatalError("Invalid URL components: \(String(describing: components))")
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
    // 요청 키 생성 메서드 추가
    private func createRequestKey(for endpoint: String, parameters: [String: String]?) -> String {
        var key = endpoint
        if let params = parameters, !params.isEmpty {
            let sortedParams = params.sorted(by: { $0.key < $1.key })
            let paramsString = sortedParams.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
            key += "?" + paramsString
        }
        return key
    }
    
    func performRequest<T: Decodable>(
        endpoint: String,
        parameters: [String: String]? = nil,
        cachePolicy: APICacheManager.CacheExpiration = .medium,
        forceRefresh: Bool = false
    ) async throws -> T {
        // 디버그 로그 추가
        print("🔍 performRequest 시작: \(endpoint), 파라미터: \(parameters ?? [:]), 강제 새로고침: \(forceRefresh)")
        print("🔄 요청 실행: \(endpoint)")
        
        return try await withCheckedThrowingContinuation { continuation in
            // 요청 키 생성 (로깅용)
            let requestKey = "\(endpoint)?\(parameters?.description ?? "no_params")"
            print("🔑 요청 키: \(requestKey)")
            
            // 중복 요청 체크 강화
            // 중복 요청 처리 개선 (2차 개선)
            if requestManager.isRequestInProgress(requestKey) {
                // 오늘 날짜 경기 요청인지 확인
                let isFixturesRequest = endpoint.contains("fixtures") || endpoint.contains("getFixtures")
                let isToday = isRequestForToday(parameters)
                
                print("⚠️ 중복 요청 감지: \(requestKey), 경기 요청: \(isFixturesRequest), 오늘 날짜: \(isToday)")
                
                // 오늘 날짜 경기 요청인 경우 캐시 확인
                if isFixturesRequest && isToday {
                    if let cachedData = APICacheManager.shared.getCache(for: endpoint, parameters: parameters) {
                        print("✅ 오늘 경기 중복 요청 - 캐시 데이터 사용: \(cachedData.count) 바이트")
                        
                        do {
                            // 캐시된 데이터 디코딩 시도
                            let decoder = JSONDecoder()
                            let decodedResponse = try decoder.decode(T.self, from: cachedData)
                            print("✅ 오늘 경기 중복 요청 - 캐시 데이터 디코딩 성공")
                            continuation.resume(returning: decodedResponse)
                        } catch {
                            print("⚠️ 오늘 경기 중복 요청 - 캐시 데이터 디코딩 실패, 빈 응답 생성")
                            // 디코딩 실패 시 빈 응답 생성
                            let emptyResponse = try? createEmptyResponse(ofType: T.self)
                            if let emptyResponse = emptyResponse {
                                continuation.resume(returning: emptyResponse)
                            } else {
                                continuation.resume(throwing: FootballAPIError.apiError(["이미 진행 중인 요청입니다."]))
                            }
                        }
                    } else {
                        print("⚠️ 오늘 경기 중복 요청 - 캐시 없음, 빈 응답 생성")
                        // 캐시가 없는 경우 빈 응답 생성
                        let emptyResponse = try? createEmptyResponse(ofType: T.self)
                        if let emptyResponse = emptyResponse {
                            continuation.resume(returning: emptyResponse)
                        } else {
                            continuation.resume(throwing: FootballAPIError.apiError(["이미 진행 중인 요청입니다."]))
                        }
                    }
                } else {
                    // 일반적인 중복 요청은 빈 응답 생성
                    print("⚠️ 일반 중복 요청 - 빈 응답 생성")
                    let emptyResponse = try? createEmptyResponse(ofType: T.self)
                    if let emptyResponse = emptyResponse {
                        continuation.resume(returning: emptyResponse)
                    } else {
                        continuation.resume(throwing: FootballAPIError.apiError(["이미 진행 중인 요청입니다."]))
                    }
                }
                return
            }
            
            // 이 시점에서는 task가 아직 생성되지 않았으므로,
            // 요청 시작 표시는 executeRequest 내부로 이동
            
            // APIRequestManager.executeRequest 내부에서 이미 markRequestAsCompleted를 호출하므로 여기서는 제거
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

                            // 실제 API 데이터만 사용 - 더미 데이터 생성 제거
                            continuation.resume(throwing: FootballAPIError.decodingError(error))
                        }
                    } catch {
                        print("❌ 응답 처리 오류: \(error)")

                        // 실제 API 데이터만 사용 - 빈 응답 생성 제거
                        continuation.resume(throwing: FootballAPIError.decodingError(error))
                    }

                case .failure(let error):
                    print("❌ API 요청 실패: \(error.localizedDescription)")

                    // 실제 API 데이터만 사용 - 빈 응답 생성 제거
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
        else if T.self is FixturesResponse.Type {
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
        else if T.self is FixtureLineupResponse.Type {
            jsonString = """
            {
                "get": "fixtures/lineups",
                "parameters": {"fixture": "0"},
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

    // 더미 응답 생성 함수 제거됨 - 실제 API 데이터만 사용

    // 빈 Parameters 생성 함수
    private func createEmptyParameters() -> ResponseParameters {
        return ResponseParameters(fixture: nil, league: nil, season: nil, team: nil, date: nil)
    }

    // 빈 Paging 생성 함수
    private func createEmptyPaging() -> APIPaging { // ResponsePaging -> APIPaging
        return APIPaging(current: 1, total: 1)
    }

    // 더미 이벤트 생성 함수 제거됨 - 실제 API 데이터만 사용

    // 더미 통계 생성 함수 제거됨 - 실제 API 데이터만 사용

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
    func getFixtures(
        leagueIds: [Int],
        season: Int,
        from: Date? = nil,
        to: Date? = nil,
        last: Int? = nil,
        next: Int? = nil
    ) async throws -> [Fixture] {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul") // UTC에서 Asia/Seoul로 변경하여 날짜 불일치 문제 해결

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

        if let last = last {
            parameters["last"] = String(last)
        }
        if let next = next {
            parameters["next"] = String(next)
        }

        // 날짜·last·next 파라미터가 모두 없으면 기본 범위 설정
        if from == nil && to == nil && last == nil && next == nil {
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
                // 오늘 날짜는 매우 짧은 캐싱 (1분으로 변경)
                cachePolicy = .custom(60) // 1분으로 설정
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
    func getFixtures(
        leagueId: Int,
        season: Int,
        from: Date? = nil,
        to: Date? = nil,
        last: Int? = nil,
        next: Int? = nil
    ) async throws -> [Fixture] {
        return try await getFixtures(
            leagueIds: [leagueId],
            season: season,
            from: from,
            to: to,
            last: last,
            next: next
        )
    }

    // 상대전적 가져오기 (캐싱 적용)
    func getHeadToHead(team1Id: Int, team2Id: Int, last: Int = 10) async throws -> [Fixture] {
        let parameters = ["h2h": "\(team1Id)-\(team2Id)", "last": String(last)]
        let response: FixturesResponse = try await performRequest(
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

    // 팀 경기 일정 가져오기 (캐싱 적용, forceRefresh 매개변수 추가)
    func getTeamFixtures(teamId: Int, season: Int, last: Int? = nil, forceRefresh: Bool = false) async throws -> [Fixture] {
        print("🔄 팀 경기 일정 가져오기: 팀 ID \(teamId), 시즌 \(season), forceRefresh: \(forceRefresh)")
        
        var parameters: [String: String] = ["team": String(teamId), "season": String(season)]
        if let last = last {
            parameters["last"] = String(last)
        }

        let response: FixturesResponse = try await performRequest(
            endpoint: "/fixtures",
            parameters: parameters,
            cachePolicy: .short, // 경기 일정은 자주 변경될 수 있으므로 짧은 캐싱
            forceRefresh: forceRefresh // forceRefresh 매개변수 전달
        )

        print("✅ 팀 경기 일정 가져오기 성공: \(response.response.count)개 경기")
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

            // response는 단일 객체
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

    // 팀 순위 가져오기 (캐싱 적용, 개선된 버전)
    func getTeamStanding(teamId: Int, leagueId: Int, season: Int) async throws -> TeamStanding? {
        let parameters = ["team": String(teamId), "league": String(leagueId), "season": String(season)]
        
        print("🏆 팀 순위 정보 요청: 팀 ID \(teamId), 리그 ID \(leagueId), 시즌 \(season)")
        
        do {
            let response: TeamStandingResponse = try await performRequest(
                endpoint: "/standings",
                parameters: parameters,
                cachePolicy: .medium, // 순위는 경기 후 변경될 수 있으므로 중간 캐싱
                forceRefresh: true // 캐시 무시하고 항상 새로운 데이터 요청
            )

            // 응답이 비어있는 경우 nil 반환
            if response.results == 0 || response.response.isEmpty {
                print("⚠️ 팀 순위 정보 없음: 팀 ID \(teamId), 리그 ID \(leagueId)")
                return nil
            }

            // 팀 순위 찾기
            for leagueStanding in response.response {
                // 리그 ID 확인 로깅
                print("🔍 응답에서 리그 ID 확인: \(leagueStanding.league.id) (요청한 리그 ID: \(leagueId))")
                
                // 리그 ID가 일치하는지 확인
                if leagueStanding.league.id != leagueId {
                    print("⚠️ 리그 ID 불일치: 요청 \(leagueId) vs 응답 \(leagueStanding.league.id)")
                    continue
                }
                
                for standingGroup in leagueStanding.league.standings {
                    for standing in standingGroup {
                        if standing.team.id == teamId {
                            print("✅ 팀 순위 정보 찾음: 팀 ID \(teamId), 리그 ID \(leagueId), 순위 \(standing.rank)")
                            return standing
                        }
                    }
                }
            }

            print("⚠️ 응답에서 팀 ID \(teamId)를 찾을 수 없음")
            return nil
        } catch {
            print("❌ 팀 순위 정보 요청 실패: \(error.localizedDescription)")
            
            // 실제 API 데이터만 사용 - 더미 데이터 생성 제거
            throw error
        }
    }
    
    // 더미 팀 순위 데이터 생성 함수 제거됨 - 실제 API 데이터만 사용

    // 팀 스쿼드 가져오기 (캐싱 적용)
    func getTeamSquad(teamId: Int) async throws -> [SquadPlayerResponse] {
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

        // TeamSquadResponse를 [SquadPlayerResponse]로 변환
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

    // 선수 시즌 목록 가져오기 (캐싱 적용)
    func getPlayerSeasons(playerId: Int) async throws -> [Int] {
        let parameters = ["player": String(playerId)]
        // PlayerSeasonsResponse 구조체는 APIResponseTypes.swift 또는 유사 파일로 이동했다고 가정

        // PlayerSeasonsResponse 타입을 직접 사용 (구조체 정의는 다른 파일에 있어야 함)
        let response: PlayerSeasonsResponse = try await performRequest(
            endpoint: "/players/seasons",
            parameters: parameters,
            cachePolicy: .long // Seasons list changes infrequently
        )
        return response.response.sorted(by: >) // Return sorted seasons (latest first)
    }

    // 선수 프로필 가져오기 (모든 시즌 통계 통합)
    func getPlayerProfile(playerId: Int) async throws -> PlayerProfileData {
        // 1. 선수가 활동한 모든 시즌 목록 가져오기
        let seasons = try await getPlayerSeasons(playerId: playerId)
        guard !seasons.isEmpty else {
            print("⚠️ 선수 시즌 목록 없음: ID \(playerId). 현재 시즌으로 단일 조회를 시도합니다.")
            return try await getSingleSeasonPlayerProfile(playerId: playerId, season: Date().getCurrentSeason())
        }

        // 2. 모든 시즌의 통계를 병렬로 가져오기
        var allStatistics: [PlayerSeasonStats] = []
        var playerInfo: PlayerInfo?
        
        // 최신 시즌부터 조회하여 첫 번째 유효한 playerInfo를 사용
        let sortedSeasons = seasons.sorted(by: >)

        await withTaskGroup(of: PlayerProfileData?.self) { group in
            for season in sortedSeasons {
                group.addTask {
                    try? await self.getSingleSeasonPlayerProfile(playerId: playerId, season: season)
                }
            }

            for await profileData in group {
                if let data = profileData {
                    if playerInfo == nil { // 첫 번째 성공적인 응답에서 선수 정보 설정
                        playerInfo = data.player
                    }
                    if let stats = data.statistics {
                        allStatistics.append(contentsOf: stats)
                    }
                }
            }
        }

        guard let finalPlayerInfo = playerInfo else {
            throw FootballAPIError.apiError(["선수 정보를 가져올 수 없습니다."])
        }

        // 중복된 통계 제거 (리그 ID, 팀 ID, 시즌 ID 기준)
        var uniqueStats: [PlayerSeasonStats] = []
        var seen = Set<String>()
        for stat in allStatistics {
            let key = "\(stat.league?.id ?? 0)-\(stat.team?.id ?? 0)-\(stat.league?.season ?? 0)"
            if !seen.contains(key) {
                uniqueStats.append(stat)
                seen.insert(key)
            }
        }
        
        print("✅ 모든 시즌(\(seasons.count)개)의 통계 통합 완료. 총 \(uniqueStats.count)개의 고유 통계.")

        return PlayerProfileData(player: finalPlayerInfo, statistics: uniqueStats)
    }

    // 특정 시즌의 선수 프로필을 가져오는 헬퍼 함수
    private func getSingleSeasonPlayerProfile(playerId: Int, season: Int) async throws -> PlayerProfileData {
        let parameters = ["id": String(playerId), "season": String(season)]
        print("   -> 단일 시즌 프로필 조회 시도: 시즌 \(season)")
        let response: PlayerProfileResponse = try await performRequest(
            endpoint: "/players",
            parameters: parameters,
            cachePolicy: .long // 개별 시즌 데이터는 길게 캐시
        )

        guard let profile = response.response.first else {
            throw FootballAPIError.apiError(["선수 정보를 찾을 수 없습니다 (시즌: \(season))"])
        }
        
        print("   ✅ 단일 시즌 프로필 조회 성공 (시즌: \(season))")
        return profile
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

    // 팀 검색 (한글 팀 이름 지원 추가)
    func searchTeams(query: String) async throws -> [TeamProfile] {
        // 원본 검색어 저장
        let originalQuery = query
        
        // 검색어가 한글인지 확인하고 영문으로 변환
        var searchQuery = query
        let koreanPattern = "[\u{AC00}-\u{D7A3}]"
        let koreanRegex = try? NSRegularExpression(pattern: koreanPattern)
        let range = NSRange(location: 0, length: query.utf16.count)
        
        // 한글이 포함된 경우
        if koreanRegex?.firstMatch(in: query, range: range) != nil {
            print("🇰🇷 한글 검색어 감지: \(query)")
            
            // 한글 -> 영문 변환 시도
            if let englishName = koreanToEnglishTeamName[query.lowercased()] {
                searchQuery = englishName
                print("🔄 한글 -> 영문 변환: \(query) -> \(englishName)")
            } else {
                // 부분 일치 시도
                for (koreanName, englishName) in koreanToEnglishTeamName {
                    if query.lowercased().contains(koreanName) || koreanName.contains(query.lowercased()) {
                        searchQuery = englishName
                        print("🔄 부분 일치 한글 -> 영문 변환: \(query) -> \(englishName)")
                        break
                    }
                }
            }
        }
        
        // 검색어 인코딩 (첫 번째 단어만 사용)
        // API 제약: 공백이 포함된 검색어는 문제를 일으키므로 첫 번째 단어만 사용
        let firstWord = searchQuery.components(separatedBy: " ").first ?? searchQuery
        let encodedQuery = encodeSearchQuery(firstWord)
        let parameters = ["search": encodedQuery]
        
        print("🔍 팀 검색 최종 파라미터: \(originalQuery) -> \(searchQuery) -> 첫 단어만: \(firstWord)")

        // 로그 수정: API로 전송될 최종 파라미터 값 로깅
        print("🔍 팀 검색 시작: \(originalQuery) -> \(searchQuery) (API 전송 파라미터 search=\(encodedQuery))")

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

    // 리그/컵대회 검색 (한글 이름 지원 추가)
    func searchLeagues(query: String, type: String? = nil) async throws -> [LeagueDetails] {
        // 원본 검색어 저장
        let originalQuery = query
        
        // 검색어가 한글인지 확인
        var searchQuery = query
        let koreanPattern = "[\u{AC00}-\u{D7A3}]"
        let koreanRegex = try? NSRegularExpression(pattern: koreanPattern)
        let range = NSRange(location: 0, length: query.utf16.count)
        
        // 한글이 포함된 경우 - 한글 리그 이름 처리
        if koreanRegex?.firstMatch(in: query, range: range) != nil {
            print("🇰🇷 한글 리그 이름 감지: \(query)")
            
            // 한글 리그 이름 매핑 (간단한 매핑 추가)
            let koreanToEnglishLeagueName: [String: String] = [
                "프리미어리그": "Premier League",
                "프리미어 리그": "Premier League",
                "프리미어": "Premier League",
                "라리가": "La Liga",
                "세리에a": "Serie A",
                "세리에 a": "Serie A",
                "분데스리가": "Bundesliga",
                "리그앙": "Ligue 1",
                "리그 앙": "Ligue 1",
                "챔피언스리그": "Champions League",
                "챔스": "Champions League",
                "유로파리그": "Europa League",
                "유로파": "Europa League",
                "컨퍼런스리그": "Conference League"
            ]
            
            // 한글 -> 영문 변환 시도
            if let englishName = koreanToEnglishLeagueName[query.lowercased()] {
                searchQuery = englishName
                print("🔄 한글 -> 영문 변환: \(query) -> \(englishName)")
            } else {
                // 부분 일치 시도
                for (koreanName, englishName) in koreanToEnglishLeagueName {
                    if query.lowercased().contains(koreanName) || koreanName.contains(query.lowercased()) {
                        searchQuery = englishName
                        print("🔄 부분 일치 한글 -> 영문 변환: \(query) -> \(englishName)")
                        break
                    }
                }
            }
        }
        
        // 검색어 인코딩 (첫 번째 단어만 사용)
        let firstWord = searchQuery.components(separatedBy: " ").first ?? searchQuery
        let encodedQuery = encodeSearchQuery(firstWord)
        var parameters = ["search": encodedQuery]
        
        print("🔍 리그 검색 최종 파라미터: \(originalQuery) -> \(searchQuery) -> 첫 단어만: \(firstWord)")
        if let type = type {
            parameters["type"] = type // "league" 또는 "cup"
        }
        
        // 로그 추가
        print("🔍 리그 검색 시작: \(originalQuery) -> \(searchQuery) (인코딩: \(encodedQuery))")
        
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

    // 선수 검색 (한글 이름 지원 추가)
    func searchPlayers(query: String, leagueId: Int, season: Int) async throws -> [PlayerProfileData] {
        // 원본 검색어 저장
        let originalQuery = query
        
        // 검색어가 한글인지 확인
        var searchQuery = query
        let koreanPattern = "[\u{AC00}-\u{D7A3}]"
        let koreanRegex = try? NSRegularExpression(pattern: koreanPattern)
        let range = NSRange(location: 0, length: query.utf16.count)
        
        // 한글이 포함된 경우 - 한글 선수 이름 처리
        if koreanRegex?.firstMatch(in: query, range: range) != nil {
            print("🇰🇷 한글 선수 이름 감지: \(query)")
            
            // 한글 선수 이름 매핑 (간단한 매핑 추가)
            let koreanToEnglishPlayerName: [String: String] = [
                // 한국 선수
                "손흥민": "Son Heung-min",
                "손": "Son",
                "이강인": "Lee Kang-in",
                "황희찬": "Hwang Hee-chan",
                "김민재": "Kim Min-jae",
                "황인범": "Hwang In-beom",
                "조규성": "Cho Gue-sung",
                "이승우": "Lee Seung-woo",
                "박지성": "Park Ji-sung",
                "기성용": "Ki Sung-yueng",
                
                // 팀 이름 -> 해당 팀의 주요 선수로 매핑
                "맨유": "Rashford", // 맨체스터 유나이티드의 주요 선수
                "맨시티": "Haaland", // 맨체스터 시티의 주요 선수
                "리버풀": "Salah", // 리버풀의 주요 선수
                "첼시": "Sterling", // 첼시의 주요 선수
                "아스날": "Saka", // 아스날의 주요 선수
                "토트넘": "Son", // 토트넘의 주요 선수
                "레알": "Vinicius", // 레알 마드리드의 주요 선수
                "바르셀로나": "Lewandowski", // 바르셀로나의 주요 선수
                "바르샤": "Lewandowski", // 바르셀로나의 주요 선수
                "바이에른": "Kane", // 바이에른 뮌헨의 주요 선수
                "뮌헨": "Kane", // 바이에른 뮌헨의 주요 선수
                "알레띠": "Griezmann", // 아틀레티코 마드리드의 주요 선수
                "아틀레티코": "Griezmann", // 아틀레티코 마드리드의 주요 선수
                "수정궁": "Eze", // 크리스탈 팰리스의 주요 선수
                "밀란": "Leao", // AC 밀란의 주요 선수
                "ac밀란": "Leao", // AC 밀란의 주요 선수
                "아인트호번": "De Jong" // PSV의 주요 선수
            ]
            
            // 한글 -> 영문 변환 시도
            if let englishName = koreanToEnglishPlayerName[query.lowercased()] {
                searchQuery = englishName
                print("🔄 한글 -> 영문 변환: \(query) -> \(englishName)")
            } else {
                // 부분 일치 시도
                for (koreanName, englishName) in koreanToEnglishPlayerName {
                    if query.lowercased().contains(koreanName) || koreanName.contains(query.lowercased()) {
                        searchQuery = englishName
                        print("🔄 부분 일치 한글 -> 영문 변환: \(query) -> \(englishName)")
                        break
                    }
                }
            }
        }

        // 검색어 인코딩 (첫 번째 단어만 사용)
        let firstWord = searchQuery.components(separatedBy: " ").first ?? searchQuery
        let encodedQuery = encodeSearchQuery(firstWord)

        // 검색어가 비어있는지 확인
        if encodedQuery.isEmpty {
            print("⚠️ 검색어가 비어있습니다. 기본값 'player'로 대체합니다.")
            // 파라미터 설정 (기본값 'player' 사용)
            let parameters = ["search": "player", "league": String(leagueId), "season": String(season)]
            print("🔍 선수 검색 최종 파라미터: \(originalQuery) -> 'player' (검색어 비어있음)")
            print("🔍 선수 검색 시작: \(originalQuery) -> 'player' (API 전송 파라미터 search=player, league=\(leagueId), season=\(season))")
            
            do {
                let response: PlayerProfileResponse = try await performRequest(
                    endpoint: "players",
                    parameters: parameters,
                    cachePolicy: .short
                )
                
                print("✅ 선수 검색 성공: \(response.response.count)개 결과")
                return response.response
            } catch {
                print("❌ 선수 검색 실패: \(error.localizedDescription)")
                return []
            }
        } else {
            // 파라미터 설정
            let parameters = ["search": encodedQuery, "league": String(leagueId), "season": String(season)]
            
            print("🔍 선수 검색 최종 파라미터: \(originalQuery) -> \(searchQuery) -> 첫 단어만: \(firstWord)")
            print("🔍 선수 검색 시작: \(originalQuery) -> \(searchQuery) (API 전송 파라미터 search=\(encodedQuery), league=\(leagueId), season=\(season))")

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
                // 에러 발생 시 빈 배열 반환
                return []
            }
        }
    }

    // 감독 검색 (한글 이름 지원 추가)
    func searchCoaches(query: String) async throws -> [CoachInfo] {
        // 원본 검색어 저장
        let originalQuery = query
        
        // 검색어가 한글인지 확인
        var searchQuery = query
        let koreanPattern = "[\u{AC00}-\u{D7A3}]"
        let koreanRegex = try? NSRegularExpression(pattern: koreanPattern)
        let range = NSRange(location: 0, length: query.utf16.count)
        
        // 한글이 포함된 경우 - 한글 감독 이름 처리
        if koreanRegex?.firstMatch(in: query, range: range) != nil {
            print("🇰🇷 한글 감독 이름 감지: \(query)")
            
            // 한글 감독 이름 매핑 (간단한 매핑 추가)
            let koreanToEnglishCoachName: [String: String] = [
                "펩 과르디올라": "Pep Guardiola",
                "과르디올라": "Guardiola",
                "위르겐 클롭": "Jurgen Klopp",
                "클롭": "Klopp",
                "카를로 안첼로티": "Carlo Ancelotti",
                "안첼로티": "Ancelotti",
                "토마스 투헬": "Thomas Tuchel",
                "투헬": "Tuchel",
                "사비": "Xavi",
                "사비 에르난데스": "Xavi Hernandez",
                "디에고 시메오네": "Diego Simeone",
                "시메오네": "Simeone",
                "미켈 아르테타": "Mikel Arteta",
                "아르테타": "Arteta",
                "에릭 텐 하흐": "Erik ten Hag",
                "텐 하흐": "ten Hag"
            ]
            
            // 한글 -> 영문 변환 시도
            if let englishName = koreanToEnglishCoachName[query.lowercased()] {
                searchQuery = englishName
                print("🔄 한글 -> 영문 변환: \(query) -> \(englishName)")
            } else {
                // 부분 일치 시도
                for (koreanName, englishName) in koreanToEnglishCoachName {
                    if query.lowercased().contains(koreanName) || koreanName.contains(query.lowercased()) {
                        searchQuery = englishName
                        print("🔄 부분 일치 한글 -> 영문 변환: \(query) -> \(englishName)")
                        break
                    }
                }
            }
        }
        
        // 검색어 인코딩 (첫 번째 단어만 사용)
        let firstWord = searchQuery.components(separatedBy: " ").first ?? searchQuery
        let encodedQuery = encodeSearchQuery(firstWord)
        let parameters = ["search": encodedQuery]
        
        print("🔍 감독 검색 최종 파라미터: \(originalQuery) -> \(searchQuery) -> 첫 단어만: \(firstWord)")
        
        // 로그 추가
        print("🔍 감독 검색 시작: \(originalQuery) -> \(searchQuery) (인코딩: \(encodedQuery))")
        
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
    
    // 검색어 인코딩 함수 (특수 문자 처리 완화 및 악센트 부호 처리)
    private func encodeSearchQuery(_ query: String) -> String {
        // 1. 악센트 부호 제거 (é -> e, ñ -> n 등)
        let normalized = query.folding(options: .diacriticInsensitive, locale: .current)
        
        // 2. 허용할 특수 문자를 포함하여 정규식 수정 (예: 하이픈, 아포스트로피, 점 허용)
        let regex = try! NSRegularExpression(pattern: "[^a-zA-Z0-9\\s-'.]", options: []) // 허용 문자 추가
        let range = NSRange(location: 0, length: normalized.utf16.count)
        let sanitized = regex.stringByReplacingMatches(in: normalized, options: [], range: range, withTemplate: "")

        // 3. 공백이 2개 이상 연속된 경우 하나로 치환
        let multipleSpacesRegex = try! NSRegularExpression(pattern: "\\s{2,}", options: [])
        let sanitizedWithSingleSpaces = multipleSpacesRegex.stringByReplacingMatches(
            in: sanitized, options: [], range: NSRange(location: 0, length: sanitized.utf16.count), withTemplate: " "
        )
        
        // 4. 결과 로깅 (디버깅용)
        let result = sanitizedWithSingleSpaces.trimmingCharacters(in: .whitespacesAndNewlines)
        print("🔤 검색어 인코딩: \(query) -> \(result)")
        
        return result
    }
    
    // MARK: - Team Squad (현재 스쿼드)
    func getTeamSquad(teamId: Int) async throws -> [SquadPlayer] {
        let parameters = ["team": String(teamId)]
        
        struct SquadResponse: Codable {
            let response: [SquadData]
        }
        
        struct SquadData: Codable {
            let team: Team
            let players: [SquadPlayer]
        }
        
        let response: SquadResponse = try await performRequest(
            endpoint: "/players/squads",
            parameters: parameters,
            cachePolicy: .medium // 스쿼드는 자주 변경되지 않으므로 중간 캐싱
        )
        
        // 첫 번째 스쿼드 데이터 반환
        if let squadData = response.response.first {
            return squadData.players
        }
        return []
    }
    
    // MARK: - Transfers (이적 정보)
    func getTeamTransfers(teamId: Int) async throws -> [APITransfer] {
        // 현재 시즌 계산 (7월부터 다음해 6월까지)
        let currentDate = Date()
        let calendar = Calendar.current
        let year = calendar.component(.year, from: currentDate)
        let month = calendar.component(.month, from: currentDate)
        
        // 시스템 날짜가 2025년이므로 2024 시즌으로 고정
        let actualSeason = 2024
        
        let parameters = [
            "team": String(teamId),
            "season": String(actualSeason)  // 2024 시즌 고정
        ]
        
        print("🔍 이적 조회 파라미터: 팀ID=\(teamId), 시즌=\(actualSeason) (시스템 날짜: \(year)-\(month))")
        
        struct TransfersResponse: Codable {
            let response: [TransferData]
        }
        
        struct TransferData: Codable {
            let player: TransferPlayer
            let update: String
            let transfers: [APITransfer]
        }
        
        struct TransferPlayer: Codable {
            let id: Int
            let name: String
        }
        
        let response: TransfersResponse = try await performRequest(
            endpoint: "/transfers",
            parameters: parameters,
            cachePolicy: .short // 이적은 자주 업데이트되므로 짧은 캐싱
        )
        
        // 디버그: API 응답 확인
        print("🔍 API-Football 이적 데이터 응답: 총 \(response.response.count)명의 선수")
        
        // 최신 이적 5개 출력
        for (index, transferData) in response.response.prefix(5).enumerated() {
            print("📋 선수 \(index + 1): \(transferData.player.name)")
            for (tIndex, transfer) in transferData.transfers.prefix(3).enumerated() {
                print("   - 이적 \(tIndex + 1): \(transfer.teams.out.name) → \(transfer.teams.in.name) [\(transfer.date ?? "날짜없음")] 타입: \(transfer.type ?? "N/A")")
            }
        }
        
        // 2024 시즌 시작일 (2023년 7월 1일)
        let seasonStart = ISO8601DateFormatter().date(from: "2023-07-01T00:00:00Z") ?? Date()
        
        // 날짜 참조점 설정 (2024년 12월로 가정)
        let referenceDate = ISO8601DateFormatter().date(from: "2024-12-01T00:00:00Z") ?? Date()
        let oneWeekAgo = Calendar.current.date(byAdding: .weekOfYear, value: -1, to: referenceDate) ?? referenceDate
        let oneMonthAgo = Calendar.current.date(byAdding: .month, value: -1, to: referenceDate) ?? referenceDate
        
        // 모든 이적 정보를 하나의 배열로 합치고 최근 날짜순으로 정렬
        var allTransfers: [APITransfer] = []
        var recentWeekCount = 0
        var recentMonthCount = 0
        
        for transferData in response.response {
            for transfer in transferData.transfers {
                // 날짜 확인
                if let dateString = transfer.date,
                   let transferDate = ISO8601DateFormatter().date(from: dateString) {
                    
                    // 최근 이적 통계
                    if transferDate > oneWeekAgo {
                        recentWeekCount += 1
                        print("📌 최근 1주일 이적: \(transferData.player.name) - \(transfer.teams.out.name) → \(transfer.teams.in.name) [\(dateString)]")
                    } else if transferDate > oneMonthAgo {
                        recentMonthCount += 1
                    }
                    
                    // 시즌 시작 이후 이적만 추가
                    if transferDate > seasonStart {
                        // 플레이어 정보 추가
                        var enrichedTransfer = transfer
                        enrichedTransfer.playerName = transferData.player.name
                        allTransfers.append(enrichedTransfer)
                    } else {
                        print("⏩ 시즌 이전 이적 제외: \(transferData.player.name) - \(transfer.date ?? "날짜 없음")")
                    }
                } else {
                    print("⚠️ 날짜 파싱 실패: \(transferData.player.name) - \(transfer.date ?? "날짜 없음")")
                }
            }
        }
        
        print("📊 이적 통계 - 최근 1주일: \(recentWeekCount)건, 최근 1개월: \(recentMonthCount)건, 전체: \(allTransfers.count)건")
        
        // 날짜순 정렬 (최신 순)
        return allTransfers.sorted { transfer1, transfer2 in
            guard let date1 = ISO8601DateFormatter().date(from: transfer1.date ?? ""),
                  let date2 = ISO8601DateFormatter().date(from: transfer2.date ?? "") else {
                return false
            }
            return date1 > date2
        }
    }

} // 클래스 닫는 괄호 확인

// MARK: - Transfer Models
public struct APITransfer: Codable {
    public let date: String?
    public let type: String?
    public let teams: TransferTeams
    public var playerName: String? // 나중에 추가
}

public struct TransferTeams: Codable {
    public let `in`: TransferTeam
    public let out: TransferTeam
}

public struct TransferTeam: Codable {
    public let id: Int
    public let name: String
    public let logo: String
}

// MARK: - Squad Player Model
public struct SquadPlayer: Codable {
    public let id: Int
    public let name: String
    public let age: Int?
    public let number: Int?
    public let position: String?
    public let photo: String?
}

// MARK: - 헬퍼 메서드 확장
extension FootballAPIService {
    // 요청이 오늘 날짜에 대한 것인지 확인하는 함수
    private func isRequestForToday(_ parameters: [String: String]?) -> Bool {
        guard let parameters = parameters else { return false }
        
        // 오늘 날짜 계산
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")
        let today = dateFormatter.string(from: Date())
        
        // from과 to 파라미터가 모두 오늘 날짜인 경우
        if let from = parameters["from"], let to = parameters["to"] {
            return from == today && to == today
        }
        
        // date 파라미터가 오늘 날짜인 경우
        if let date = parameters["date"] {
            return date == today
        }
        
        return false
    }
}

// Date 확장 - 현재 시즌 가져오기
extension Date {
    func getCurrentSeason() -> Int {
        let calendar = Calendar.current
        let year = calendar.component(.year, from: self)
        let month = calendar.component(.month, from: self)
        // 축구 시즌은 일반적으로 8월에 시작하고 다음해 5월에 끝남
        // 8월-12월: 현재 연도가 시즌
        // 1월-7월: 이전 연도가 시즌
        // 예: 2025년 7월이면 2024-25 시즌(2024)
        return month < 8 ? year - 1 : year
    }
}

// MARK: - Supabase Edge Functions 통합
extension FootballAPIService {
    
    // Supabase Edge Functions를 통한 경기 일정 가져오기
    func getFixturesWithServerCache(
        date: String,
        leagueId: Int? = nil,
        seasonYear: Int? = nil,
        forceRefresh: Bool = false
    ) async throws -> [Fixture] {
        if config.useSupabaseEdgeFunctions {
            // TODO: Implement Supabase Edge Functions call
            throw FootballAPIError.invalidRequest
        } else {
            // 기존 직접 API 호출
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul") // 시간대 설정 추가하여 날짜 일치 보장
            guard let dateObj = dateFormatter.date(from: date) else {
                throw FootballAPIError.invalidDateFormat
            }
            
            return try await getFixtures(
                leagueIds: leagueId != nil ? [leagueId!] : [],
                season: seasonYear ?? Date().getCurrentSeason(),
                from: dateObj,
                to: dateObj
            )
        }
    }
    
    // Supabase Edge Functions를 통한 경기 통계 가져오기
    func getFixtureStatisticsWithServerCache(fixtureId: Int) async throws -> [TeamStatistics] {
        if config.useSupabaseEdgeFunctions {
            // TODO: Implement Supabase Edge Functions calls
            throw FootballAPIError.invalidRequest
            // return try await supabaseEdgeFunctions.fetchFixtureStatistics(fixtureId: fixtureId)
        } else {
            return try await getFixtureStatistics(fixtureId: fixtureId)
        }
    }
    
    // Supabase Edge Functions를 통한 경기 이벤트 가져오기
    func getFixtureEventsWithServerCache(fixtureId: Int) async throws -> [FixtureEvent] {
        if config.useSupabaseEdgeFunctions {
            // TODO: Implement Supabase Edge Functions calls
            throw FootballAPIError.invalidRequest
            // return try await supabaseEdgeFunctions.fetchFixtureEvents(fixtureId: fixtureId)
        } else {
            return try await getFixtureEvents(fixtureId: fixtureId)
        }
    }
    
    // Supabase Edge Functions를 통한 순위 가져오기
    func getStandingsWithServerCache(leagueId: Int, season: Int) async throws -> [StandingResponse] {
        if config.useSupabaseEdgeFunctions {
            // TODO: Implement Supabase Edge Functions calls
            throw FootballAPIError.invalidRequest
            // return try await supabaseEdgeFunctions.fetchStandings(leagueId: leagueId, season: season)
        } else {
            // getStandings는 [Standing]을 반환하므로, StandingResponse로 변환
            let _ = try await getStandings(leagueId: leagueId, season: season)
            
            // Standing을 StandingResponse로 변환
            // 임시로 빈 배열 반환 (실제 변환 로직 필요)
            return []
        }
    }
    
    // Supabase Edge Functions를 통한 상대 전적 가져오기
    func getHeadToHeadWithServerCache(team1: Int, team2: Int) async throws -> [Fixture] {
        if config.useSupabaseEdgeFunctions {
            // TODO: Implement Supabase Edge Functions calls
            throw FootballAPIError.invalidRequest
            // return try await supabaseEdgeFunctions.fetchHeadToHead(team1: team1, team2: team2)
        } else {
            return try await getFixtures(
                leagueIds: [],
                season: Date().getCurrentSeason(),
                last: 10
            ).filter { fixture in
                (fixture.teams.home.id == team1 && fixture.teams.away.id == team2) ||
                (fixture.teams.home.id == team2 && fixture.teams.away.id == team1)
            }
        }
    }
    
    // 캐시 통계 가져오기 (관리자용)
    func getCacheStats() async throws -> CacheStats? {
        if config.useSupabaseEdgeFunctions {
            // TODO: Implement Supabase Edge Functions calls
            throw FootballAPIError.invalidRequest
            // return try await supabaseEdgeFunctions.getCacheStats()
        } else {
            return nil // 직접 API 호출 시에는 캐시 통계 없음
        }
    }
}
