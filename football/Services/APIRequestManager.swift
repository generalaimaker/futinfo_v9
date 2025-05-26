import Foundation

class APIRequestManager {
    static let shared = APIRequestManager()
    
    // API 요청 통계 추적을 위한 변수
    private var requestCount: Int = 0
    private var rateLimitHitCount: Int = 0
    private var requestStartTimes: [String: Date] = [:]
    private var requestsPerEndpoint: [String: Int] = [:]
    
    private let operationQueue: OperationQueue
    private var requestsInProgress: [String: URLSessionDataTask] = [:]
    private let requestsLock = NSLock()
    
    // 마지막 요청 시간 추적 (API 요청 제한 방지)
    private var lastRequestTime: Date?
    private let minRequestInterval: TimeInterval = 0.1 // 최소 요청 간격 (0.15초에서 0.1초로 추가 단축)
    
    // 최대 재시도 횟수
    private let maxRetryCount = 2
    
    private init() {
        operationQueue = OperationQueue()
        // 동시 요청 수를 2로 증가하여 성능 향상
        operationQueue.maxConcurrentOperationCount = 2
        operationQueue.qualityOfService = .userInitiated
        
        // 1분마다 요청 통계 출력
        Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.logRequestStatistics()
        }
    }
    
    // 요청 통계 로깅
    private func logRequestStatistics() {
        print("📊 API 요청 통계 (1분 간격):")
        print("   - 총 요청 수: \(requestCount)")
        print("   - Rate Limit 발생 횟수: \(rateLimitHitCount)")
        print("   - 현재 진행 중인 요청 수: \(requestsInProgress.count)")
        
        // 엔드포인트별 요청 수 (상위 5개만)
        let sortedEndpoints = requestsPerEndpoint.sorted { $0.value > $1.value }.prefix(5)
        print("   - 엔드포인트별 요청 수 (상위 5개):")
        for (endpoint, count) in sortedEndpoints {
            print("     * \(endpoint): \(count)회")
        }
    }
    
    // 요청 키 생성 (중복 요청 방지)
    private func requestKey(for endpoint: String, parameters: [String: String]? = nil) -> String {
        var key = endpoint
        if let parameters = parameters, !parameters.isEmpty {
            let sortedParams = parameters.sorted { $0.key < $1.key }
            let paramString = sortedParams.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
            key += "?\(paramString)"
        }
        return key.sha256() // 해시 사용하여 키 길이 일정하게 유지
    }
    
    // 현재 진행 중인 요청인지 확인
    func isRequestInProgress(_ requestKey: String) -> Bool {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        return requestsInProgress[requestKey] != nil
    }
    
    // 요청 시작 표시
    func markRequestAsInProgress(_ requestKey: String, task: URLSessionDataTask) {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        // 실제 요청이 시작될 때 호출됨
        requestsInProgress[requestKey] = task
        print("🔄 요청 시작 표시: \(requestKey)")
    }
    
    // 요청 완료 표시
    func markRequestAsCompleted(_ requestKey: String) {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        // 요청이 완료될 때 호출됨
        requestsInProgress.removeValue(forKey: requestKey)
        print("✅ 요청 완료 표시: \(requestKey)")
    }
    
    func executeRequest(
        endpoint: String,
        parameters: [String: String]? = nil,
        cachePolicy: APICacheManager.CacheExpiration = .long,
        forceRefresh: Bool = false,
        completion: @escaping (Result<Data, Error>) -> Void
    ) {
        let requestKey = self.requestKey(for: endpoint, parameters: parameters)
        
        // 요청 통계 업데이트 (락 사용)
        requestsLock.lock()
        requestCount += 1
        requestStartTimes[requestKey] = Date()
        requestsPerEndpoint[endpoint] = (requestsPerEndpoint[endpoint] ?? 0) + 1
        requestsLock.unlock()
        
        // 1. 이미 진행 중인 요청인지 확인
        if getExistingTask(for: requestKey) != nil {
            print("⏳ Request already in progress for: \(endpoint)")
            // 중복 요청 시 에러 반환
            completion(.failure(FootballAPIError.requestInProgress))
            return
        }
        
        // 2. 캐시 만료 여부 확인
        let isCacheExpired = APICacheManager.shared.isCacheExpired(for: endpoint, parameters: parameters)
        
        // 3. 캐시 확인 (강제 새로고침이 아니고 캐시가 만료되지 않은 경우)
        if !forceRefresh && !isCacheExpired, let cachedData = APICacheManager.shared.getCache(for: endpoint, parameters: parameters) {
            print("✅ Using cached data for: \(endpoint)")
            completion(.success(cachedData))
            return
        }
        
        // 4. 요청 간 지연 추가 (API 요청 제한 방지)
        if let lastTime = lastRequestTime {
            let elapsed = Date().timeIntervalSince(lastTime)
            if elapsed < minRequestInterval {
                let delay = minRequestInterval - elapsed
                print("⏱️ Adding delay of \(Int(delay * 1000))ms between requests")
                Thread.sleep(forTimeInterval: delay)
            }
        }
        lastRequestTime = Date()
        
        operationQueue.addOperation { [weak self] in
            guard let self = self else { return }
            
            // Rapid API 직접 호출로 변경
            let baseURL = "https://api-football-v1.p.rapidapi.com/v3"
            
            // 엔드포인트 경로 수정
            var fixedEndpoint = endpoint
            
            // 슬래시로 시작하는 경우 제거
            if fixedEndpoint.hasPrefix("/") {
                fixedEndpoint.removeFirst()
            }
            
            // 검색 관련 엔드포인트 처리 (추가)
            let searchEndpoints = ["coachs", "leagues", "teams", "players", "venues"]
            let isSearchEndpoint = searchEndpoints.contains { fixedEndpoint.starts(with: $0) }
            
            // Firebase Functions 엔드포인트를 Rapid API 엔드포인트로 변환
            if endpoint == "getFixtures" || endpoint.starts(with: "getFixtures?") {
                fixedEndpoint = "fixtures"
            } else if endpoint.contains("headtohead") {
                fixedEndpoint = "fixtures/headtohead"
            } else if endpoint.starts(with: "/fixtures") {
                // /fixtures로 시작하는 경우 앞의 슬래시만 제거
                fixedEndpoint = "fixtures" + endpoint.dropFirst(9)
            } else if endpoint == "standings" || endpoint.starts(with: "standings") || endpoint.starts(with: "/standings") {
                // standings 엔드포인트는 그대로 유지 (슬래시로 시작하는 경우도 처리)
                fixedEndpoint = "standings"
            } else if endpoint == "injuries" || endpoint.starts(with: "injuries") || endpoint.starts(with: "/injuries") {
                // injuries 엔드포인트는 그대로 유지 (슬래시로 시작하는 경우도 처리)
                fixedEndpoint = "injuries"
            } else if endpoint.contains("teams/statistics") || endpoint.contains("/teams/statistics") {
                // teams/statistics 엔드포인트 처리
                fixedEndpoint = "teams/statistics"
            } else if endpoint.contains("players/squads") || endpoint.contains("/players/squads") {
                // players/squads 엔드포인트 처리
                fixedEndpoint = "players/squads"
            } else if !endpoint.starts(with: "fixtures") && !endpoint.starts(with: "leagues") && 
                      !endpoint.starts(with: "teams") && !endpoint.starts(with: "players") && 
                      !endpoint.starts(with: "standings") && !endpoint.starts(with: "/standings") &&
                      !endpoint.starts(with: "injuries") && !endpoint.starts(with: "/injuries") &&
                      !isSearchEndpoint { // 검색 엔드포인트가 아닌 경우에만 fixtures/ 추가
                // 이미 fixtures가 포함되어 있는지 확인
                if !endpoint.contains("fixtures") {
                    fixedEndpoint = "fixtures/\(endpoint)"
                }
            }
            
            // 로깅 추가
            print("🔄 엔드포인트 변환: \(endpoint) -> \(fixedEndpoint)")
            
            // URL 생성 (baseURL만 사용, 쿼리 파라미터는 URLComponents에서 처리)
            var urlString = baseURL
            
            // 엔드포인트가 있는 경우에만 추가
            if !fixedEndpoint.isEmpty {
                urlString = "\(baseURL)/\(fixedEndpoint)"
            }
            
            // URL에서 이중 슬래시 제거 (http:// 또는 https:// 제외)
            if let range = urlString.range(of: "://") {
                let protocolPart = urlString[..<range.upperBound]
                var pathPart = String(urlString[range.upperBound...])
                
                // 연속된 슬래시를 하나로 치환
                while pathPart.contains("//") {
                    pathPart = pathPart.replacingOccurrences(of: "//", with: "/")
                }
                
                urlString = "\(protocolPart)\(pathPart)"
            }
            
            print("🔗 기본 URL: \(urlString)")
            
            // API 키 가져오기
            guard let apiKey = Bundle.main.object(forInfoDictionaryKey: "FootballAPIKey") as? String else {
                completion(.failure(FootballAPIError.invalidAPIKey))
                return
            }
            
            let host = "api-football-v1.p.rapidapi.com"
            
            // URLComponents를 사용하여 URL 생성
            guard var urlComponents = URLComponents(string: urlString) else {
                completion(.failure(FootballAPIError.invalidURL))
                return
            }
            
            // 쿼리 파라미터 추가
            if let parameters = parameters, !parameters.isEmpty {
                let queryItems = parameters.map { key, value in
                    URLQueryItem(name: key, value: value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed))
                }
                
                // 기존 쿼리 아이템이 있으면 추가
                if urlComponents.queryItems != nil {
                    urlComponents.queryItems?.append(contentsOf: queryItems)
                } else {
                    urlComponents.queryItems = queryItems
                }
            }
            
            // 최종 URL 생성
            guard let url = urlComponents.url else {
                completion(.failure(FootballAPIError.invalidURL))
                return
            }
            
            print("🔗 최종 URL: \(url.absoluteString)")
            
            // 타임아웃 설정 및 캐시 정책 설정
            var request = URLRequest(url: url, timeoutInterval: 20.0) // 타임아웃 시간 최적화 (30초에서 20초로 단축)
            request.httpMethod = "GET"
            request.cachePolicy = .reloadIgnoringLocalCacheData // 항상 서버에서 새로운 데이터 가져오기
            
            // Rapid API 헤더 추가
            request.addValue(apiKey, forHTTPHeaderField: "x-rapidapi-key")
            request.addValue(host, forHTTPHeaderField: "x-rapidapi-host")
            
            print("🌐 Request URL: \(url.absoluteString) \(forceRefresh ? "(Force Refresh)" : "")")
            
            // 세션 구성 (타임아웃 및 재시도 설정)
            let config = URLSessionConfiguration.default
            config.timeoutIntervalForRequest = 20.0 // 타임아웃 시간 최적화 (30초에서 20초로 단축)
            config.timeoutIntervalForResource = 30.0 // 리소스 타임아웃 시간 최적화 (60초에서 30초로 단축)
            config.waitsForConnectivity = true // 연결이 복원될 때까지 대기
            config.httpMaximumConnectionsPerHost = 8 // 동시 연결 수 증가 (5에서 8로 증가)
            
            let session = URLSession(configuration: config)
            
            let task = session.dataTask(with: request) { [weak self] data, response, error in
                guard let self = self else { return }
                
                self.removeTask(for: requestKey)
                
                if let error = error {
                    // 네트워크 오류 처리
                    print("❌ Network error: \(error.localizedDescription)")
                    completion(.failure(error))
                    return
                }
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    completion(.failure(FootballAPIError.invalidResponse))
                    return
                }
                
                guard (200...299).contains(httpResponse.statusCode) else {
                    var errorMessage = "서버 오류: HTTP \(httpResponse.statusCode)"
                    if let data = data,
                       let errorResponse = try? JSONDecoder().decode([String: String].self, from: data),
                       let message = errorResponse["message"] {
                        errorMessage = message
                    }
                    
                    // 429 오류 (Rate Limit) 처리
                    if httpResponse.statusCode == 429 {
                        self.rateLimitHitCount += 1
                        
                        // 요청 간격 및 패턴 분석을 위한 로그
                        print("⚠️ API 요청 제한 발생 (총 \(self.rateLimitHitCount)회)")
                        print("   - 요청 키: \(requestKey)")
                        print("   - 엔드포인트: \(endpoint)")
                        
                        self.requestsLock.lock()
                        let startTime = self.requestStartTimes[requestKey]
                        self.requestsLock.unlock()
                        
                        if let startTime = startTime {
                            let duration = Date().timeIntervalSince(startTime)
                            print("   - 요청 소요 시간: \(String(format: "%.2f", duration))초")
                        }
                        
                        // 현재 진행 중인 요청 수 및 엔드포인트 로깅
                        self.requestsLock.lock()
                        let currentRequests = self.requestsInProgress.count
                        let endpointCounts = self.requestsPerEndpoint
                        self.requestsLock.unlock()
                        
                        print("   - 현재 진행 중인 요청 수: \(currentRequests)")
                        print("   - 엔드포인트별 요청 수 (상위 3개):")
                        for (endpoint, count) in endpointCounts.sorted(by: { $0.value > $1.value }).prefix(3) {
                            print("     * \(endpoint): \(count)회")
                        }
                        
                        // 헤더 정보 로깅
                        print("   - 응답 헤더:")
                        for (key, value) in httpResponse.allHeaderFields {
                            print("     * \(key): \(value)")
                        }
                        
                        print("⚠️ Rate limit exceeded. Waiting before retrying...")
                        completion(.failure(FootballAPIError.rateLimitExceeded))
                        return
                    }
                    
                    completion(.failure(FootballAPIError.firebaseFunctionError(errorMessage)))
                    return
                }
                
                guard let data = data else {
                    completion(.failure(FootballAPIError.invalidResponse))
                    return
                }
                
                // 응답 데이터 로깅 및 분석 (개선된 로깅)
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    // 응답 구조 확인
                    if let response = json["response"] as? [Any] {
                        if response.isEmpty {
                            print("⚠️ Empty response data for: \(endpoint)")
                            print("📝 전체 응답 구조: \(json.keys.joined(separator: ", "))")
                            
                            // 오류 메시지 확인
                            if let errors = json["errors"] as? [String] {
                                print("⚠️ API 오류 메시지: \(errors)")
                            }
                            
                            // 메타데이터 확인
                            if let meta = json["meta"] as? [String: Any] {
                                print("ℹ️ 메타데이터: \(meta)")
                            }
                        } else {
                            print("✅ Response data contains \(response.count) items for: \(endpoint)")
                            
                            // 첫 번째 항목 구조 로깅 (디버깅용)
                            if let firstItem = response.first {
                                print("📊 First item type: \(type(of: firstItem))")
                                if let itemDict = firstItem as? [String: Any] {
                                    print("📊 First item keys: \(itemDict.keys.joined(separator: ", "))")
                                    
                                    // 주요 필드 값 확인
                                    if let fixture = itemDict["fixture"] as? [String: Any] {
                                        print("📅 Fixture ID: \(fixture["id"] ?? "unknown"), Date: \(fixture["date"] ?? "unknown")")
                                    }
                                    
                                    if let league = itemDict["league"] as? [String: Any] {
                                        print("🏆 League: \(league["name"] ?? "unknown") (\(league["id"] ?? "unknown"))")
                                    }
                                }
                            }
                        }
                    } else {
                        print("⚠️ Response field not found or not an array for: \(endpoint)")
                        
                        // 응답 구조 로깅 (전체 구조 출력)
                        print("📝 전체 응답 구조: \(json.keys.joined(separator: ", "))")
                        print("📝 응답 데이터 미리보기: \(String(data: data, encoding: .utf8)?.prefix(500) ?? "인코딩 실패")")
                        print("� Response structure: \(json.keys.joined(separator: ", "))")
                        
                        // 응답 데이터 변환 시도
                        let modifiedData = try? self.transformResponseIfNeeded(data: data, endpoint: endpoint)
                        if modifiedData != nil {
                            print("🔄 Response data transformed for: \(endpoint)")
                            
                            // 변환된 데이터 캐싱
                            APICacheManager.shared.setCache(
                                data: modifiedData!,
                                for: endpoint,
                                parameters: parameters,
                                expiration: cachePolicy
                            )
                            
                            completion(.success(modifiedData!))
                            return
                        }
                    }
                } else {
                    print("⚠️ Invalid JSON response for: \(endpoint)")
                    
                    // 응답 데이터 일부 출력 (디버깅용)
                    if let dataString = String(data: data, encoding: .utf8) {
                        let previewLength = min(200, dataString.count)
                        let preview = String(dataString.prefix(previewLength))
                        print("📝 Response preview: \(preview)...")
                    }
                }
                
                // 캐시에 데이터 저장
                APICacheManager.shared.setCache(
                    data: data,
                    for: endpoint,
                    parameters: parameters,
                    expiration: cachePolicy
                )
                
                completion(.success(data))
            }
            
            // 요청 시작 표시 및 태스크 추가
            self.markRequestAsInProgress(requestKey, task: task)
            task.resume()
        }
    }
    
    private func addTask(_ task: URLSessionDataTask, for key: String) {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        requestsInProgress[key] = task
    }
    
    private func removeTask(for key: String) {
        // 요청 완료 표시
        markRequestAsCompleted(key)
    }
    
    private func getExistingTask(for key: String) -> URLSessionDataTask? {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        return requestsInProgress[key]
    }
    
    func cancelAllRequests() {
        requestsLock.lock()
        defer { requestsLock.unlock() }
        for (_, task) in requestsInProgress {
            task.cancel()
        }
        requestsInProgress.removeAll()
    }
    
    // 응답 데이터 변환 메서드 (개선된 버전)
    private func transformResponseIfNeeded(data: Data, endpoint: String) throws -> Data {
        // 원본 데이터 로깅 (디버깅용)
        if let jsonString = String(data: data, encoding: .utf8) {
            let previewLength = min(200, jsonString.count)
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
            // 파싱 실패 시 표준 응답 형식 생성
            print("⚠️ JSON 파싱 오류: \(error.localizedDescription)")
            
            // 표준 응답 형식 생성
            let standardResponse: [String: Any] = [
                "get": endpoint,
                "parameters": [:],
                "errors": [],
                "results": 0,
                "paging": ["current": 1, "total": 1],
                "response": []
            ]
            
            // 표준 응답 형식을 데이터로 변환
            do {
                let standardData = try JSONSerialization.data(withJSONObject: standardResponse)
                print("✅ 표준 응답 형식 생성 성공: \(standardData.count) 바이트")
                return standardData
            } catch {
                print("❌ 표준 응답 형식 생성 실패: \(error.localizedDescription)")
                throw FootballAPIError.decodingError(error)
            }
        }
        
        // 응답 구조 확인 및 변환
        var modifiedJson = json
        
        // 응답 필드가 없는 경우 추가
        if modifiedJson["response"] == nil {
            // 빈 배열 추가
            modifiedJson["response"] = []
            print("➕ 'response' 필드 추가")
        } else if let responseDict = modifiedJson["response"] as? [String: Any] {
            // response 필드가 객체인 경우 (과거 시즌 팀 통계 API 응답 형식)
            print("🔍 'response' 필드가 객체 형태임: \(endpoint)")
            
            // 엔드포인트에 따라 다른 처리
            if endpoint.contains("teams/statistics") {
                // 팀 통계 엔드포인트인 경우 객체 그대로 유지
                print("✅ 팀 통계 엔드포인트 감지: 객체 형태 응답 유지")
                
                // 응답 구조 로깅
                let responseKeys = responseDict.keys.joined(separator: ", ")
                print("📊 응답 객체 키: \(responseKeys)")
                
                // 필요한 필드가 있는지 확인
                if responseDict["team"] != nil && responseDict["league"] != nil {
                    print("✅ 팀 통계 응답에 필요한 필드 확인됨")
                } else {
                    print("⚠️ 팀 통계 응답에 필요한 필드 누락됨")
                }
            } else {
                // 다른 엔드포인트의 경우 배열로 변환
                print("⚠️ 'response' 필드가 객체이지만 배열이 필요한 엔드포인트: \(endpoint)")
                
                // 객체를 배열에 담아 변환
                modifiedJson["response"] = [responseDict]
                print("🔄 객체를 배열로 변환: [객체]")
            }
        } else if let response = modifiedJson["response"], !(response is [Any]) {
            // response 필드가 배열이나 객체가 아닌 다른 타입인 경우
            print("⚠️ 'response' 필드가 배열이나 객체가 아님, 빈 배열로 대체")
            
            // 빈 배열로 대체
            modifiedJson["response"] = []
        }
        
        // 필수 필드 확인 및 추가
        if modifiedJson["get"] == nil {
            modifiedJson["get"] = endpoint
            print("➕ 'get' 필드 추가: \(endpoint)")
        }
        
        if modifiedJson["parameters"] == nil {
            modifiedJson["parameters"] = [String: String]()
            print("➕ 'parameters' 필드 추가")
        } else if let parameters = modifiedJson["parameters"], !(parameters is [String: Any]) {
            // parameters 필드가 딕셔너리가 아닌 경우 빈 딕셔너리로 대체
            print("⚠️ 'parameters' 필드가 딕셔너리가 아님, 빈 딕셔너리로 대체")
            modifiedJson["parameters"] = [String: String]()
        }
        
        if modifiedJson["errors"] == nil {
            modifiedJson["errors"] = []
            print("➕ 'errors' 필드 추가")
        } else if let errors = modifiedJson["errors"], !(errors is [Any]) {
            // errors 필드가 배열이 아닌 경우 빈 배열로 대체
            print("⚠️ 'errors' 필드가 배열이 아님, 빈 배열로 대체")
            modifiedJson["errors"] = []
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
        } else if let paging = modifiedJson["paging"], !(paging is [String: Any]) {
            // paging 필드가 딕셔너리가 아닌 경우 기본 딕셔너리로 대체
            print("⚠️ 'paging' 필드가 딕셔너리가 아님, 기본 딕셔너리로 대체")
            modifiedJson["paging"] = ["current": 1, "total": 1]
        }
        
        // 변환된 JSON 구조 로깅
        print("📊 변환된 JSON 구조: \(modifiedJson.keys.joined(separator: ", "))")
        
        // 변환된 JSON을 데이터로 변환
        do {
            let transformedData = try JSONSerialization.data(withJSONObject: modifiedJson)
            print("✅ JSON 변환 성공: \(transformedData.count) 바이트")
            return transformedData
        } catch {
            print("❌ JSON 변환 오류: \(error.localizedDescription)")
            
            // 변환 실패 시 표준 응답 형식 생성
            let standardResponse: [String: Any] = [
                "get": endpoint,
                "parameters": [:],
                "errors": [],
                "results": 0,
                "paging": ["current": 1, "total": 1],
                "response": []
            ]
            
            // 표준 응답 형식을 데이터로 변환
            do {
                let standardData = try JSONSerialization.data(withJSONObject: standardResponse)
                print("✅ 표준 응답 형식 생성 성공: \(standardData.count) 바이트")
                return standardData
            } catch {
                print("❌ 표준 응답 형식 생성 실패: \(error.localizedDescription)")
                throw FootballAPIError.decodingError(error)
            }
        }
    }
}
