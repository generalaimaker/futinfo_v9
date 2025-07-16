import Foundation

/// API Rate Limit 관리자
final class RateLimitManager {
    static let shared = RateLimitManager()
    
    private let maxRequestsPerMinute = 200  // Rate Limit 초과 방지를 위해 제한 축소
    private let maxRequestsPerSecond = 5    // 초당 제한도 축소
    private var requestTimestamps: [Date] = []
    private let queue = DispatchQueue(label: "com.futinfo.ratelimit")
    
    private init() {}
    
    /// 요청 가능 여부 확인
    func canMakeRequest() -> Bool {
        queue.sync {
            let now = Date()
            let oneMinuteAgo = now.addingTimeInterval(-60)
            let oneSecondAgo = now.addingTimeInterval(-1)
            
            // 1분 이상 지난 요청 기록 제거
            requestTimestamps.removeAll { $0 < oneMinuteAgo }
            
            // 최근 1초 내의 요청 수 계산
            let recentRequests = requestTimestamps.filter { $0 >= oneSecondAgo }
            
            // 분당 제한과 초당 제한 모두 확인
            return requestTimestamps.count < maxRequestsPerMinute && 
                   recentRequests.count < maxRequestsPerSecond
        }
    }
    
    /// 요청 기록
    func recordRequest() {
        queue.sync {
            requestTimestamps.append(Date())
        }
    }
    
    /// 다음 요청까지 대기 시간 (초)
    func timeUntilNextRequest() -> TimeInterval {
        queue.sync {
            let now = Date()
            let oneSecondAgo = now.addingTimeInterval(-1)
            
            // 최근 1초 내의 요청 수 확인
            let recentRequests = requestTimestamps.filter { $0 >= oneSecondAgo }
            
            // 초당 제한에 걸린 경우
            if recentRequests.count >= maxRequestsPerSecond {
                // 가장 오래된 최근 요청으로부터 1초 후
                if let oldestRecentRequest = recentRequests.first {
                    let nextAvailableTime = oldestRecentRequest.addingTimeInterval(1)
                    return max(0.1, nextAvailableTime.timeIntervalSinceNow) // 최소 0.1초
                }
            }
            
            // 분당 제한에 걸린 경우
            if requestTimestamps.count >= maxRequestsPerMinute {
                // 가장 오래된 요청으로부터 1분 후
                if let oldestRequest = requestTimestamps.first {
                    let nextAvailableTime = oldestRequest.addingTimeInterval(60)
                    return max(0, nextAvailableTime.timeIntervalSinceNow)
                }
            }
            
            return 0
        }
    }
    
    /// Rate limit 상태 확인
    var isRateLimited: Bool {
        !canMakeRequest()
    }
    
    /// 현재 Rate Limit 상태 출력 (디버그용)
    func printStatus() {
        queue.sync {
            let now = Date()
            let oneMinuteAgo = now.addingTimeInterval(-60)
            let oneSecondAgo = now.addingTimeInterval(-1)
            
            let validRequests = requestTimestamps.filter { $0 >= oneMinuteAgo }
            let recentRequests = requestTimestamps.filter { $0 >= oneSecondAgo }
            
            print("📊 Rate Limit 상태:")
            print("   - 최근 1초: \(recentRequests.count)/\(maxRequestsPerSecond) 요청")
            print("   - 최근 1분: \(validRequests.count)/\(maxRequestsPerMinute) 요청")
        }
    }
    
    /// 현재 분당 요청 수
    var currentRequestCount: Int {
        queue.sync {
            let oneMinuteAgo = Date().addingTimeInterval(-60)
            return requestTimestamps.filter { $0 >= oneMinuteAgo }.count
        }
    }
    
    /// Rate limit 정보 문자열
    var statusDescription: String {
        let current = currentRequestCount
        let remaining = max(0, maxRequestsPerMinute - current)
        return "API 요청: \(current)/\(maxRequestsPerMinute) (남은 요청: \(remaining))"
    }
    
    /// 모든 요청 기록 초기화
    func reset() {
        queue.sync {
            requestTimestamps.removeAll()
        }
    }
}

// MARK: - FootballAPIService Extension
extension FootballAPIService {
    /// Rate limit을 고려한 안전한 요청
    func performRequestWithRateLimit<T: Decodable>(
        endpoint: String,
        parameters: [String: String] = [:],
        cachePolicy: APICacheManager.CacheExpiration = .medium,
        forceRefresh: Bool = false
    ) async throws -> T {
        // Rate limit 확인 및 대기
        if !RateLimitManager.shared.canMakeRequest() {
            let waitTime = RateLimitManager.shared.timeUntilNextRequest()
            print("⏳ Rate limit 도달 - \(Int(waitTime))초 대기 필요")
            
            // 대기 시간이 있으면 기다림
            if waitTime > 0 {
                try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
            }
        }
        
        // 요청 기록
        RateLimitManager.shared.recordRequest()
        
        // 실제 요청 수행
        return try await self.performRequest(
            endpoint: endpoint,
            parameters: parameters,
            cachePolicy: cachePolicy,
            forceRefresh: forceRefresh
        )
    }
}

// MARK: - SupabaseFootballAPIService Extension
extension SupabaseFootballAPIService {
    /// Rate limit을 고려한 안전한 요청
    func performRequestWithRateLimit<T: Decodable>(
        endpoint: String,
        parameters: [String: Any] = [:],
        cachePolicy: CachePolicy = .standard,
        forceRefresh: Bool = false
    ) async throws -> T {
        // Rate limit 확인 및 대기
        if !RateLimitManager.shared.canMakeRequest() {
            let waitTime = RateLimitManager.shared.timeUntilNextRequest()
            print("⏳ Rate limit 도달 - \(Int(waitTime))초 대기 필요")
            
            // 대기 시간이 있으면 기다림
            if waitTime > 0 {
                try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
            }
        }
        
        // 요청 기록
        RateLimitManager.shared.recordRequest()
        
        // 실제 요청 수행
        return try await self.performRequest(
            endpoint: endpoint,
            parameters: parameters,
            cachePolicy: cachePolicy,
            forceRefresh: forceRefresh
        )
    }
}