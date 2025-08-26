import Foundation

/// API 레이트 리밋 매니저
@MainActor
class RateLimitManager {
    static let shared = RateLimitManager()
    
    /// 요청 기록
    private struct RequestRecord {
        let timestamp: Date
        let endpoint: String
    }
    
    private var requests: [RequestRecord] = []
    private var blocked = false
    private var blockUntil: Date?
    private var queue: [(CheckedContinuation<Void, Never>)] = []
    
    // 설정 - Rapid API 제한에 맞게 조정 (450 requests/minute)
    private let maxRequests = 400  // 450보다 낮게 설정하여 여유 확보
    private let windowInterval: TimeInterval = 60 // 1분
    private let retryAfter: TimeInterval = 65 // 65초 (1분 + 여유)
    
    private init() {
        // 주기적으로 오래된 요청 정리
        Timer.scheduledTimer(withTimeInterval: 10, repeats: true) { _ in
            Task { @MainActor in
                self.cleanOldRequests()
            }
        }
    }
    
    /// 요청 가능 여부 확인
    func canMakeRequest() -> Bool {
        cleanOldRequests()
        
        // 차단 상태 확인
        if blocked, let blockUntil = blockUntil {
            if Date() < blockUntil {
                return false
            } else {
                // 차단 해제
                self.blocked = false
                self.blockUntil = nil
                processQueue()
            }
        }
        
        return requests.count < maxRequests
    }
    
    /// 요청 기록
    func recordRequest(endpoint: String) {
        requests.append(RequestRecord(timestamp: Date(), endpoint: endpoint))
    }
    
    /// 요청 슬롯 대기
    func waitForSlot() async {
        if canMakeRequest() {
            return
        }
        
        await withCheckedContinuation { continuation in
            queue.append(continuation)
        }
    }
    
    /// 레이트 리밋 에러 처리
    func handleRateLimitError(retryAfter: TimeInterval? = nil) {
        blocked = true
        blockUntil = Date().addingTimeInterval(retryAfter ?? self.retryAfter)
        
        print("⚠️ Rate limit hit. Blocked until \(blockUntil!)")
    }
    
    /// 현재 상태
    func getStatus() -> (current: Int, max: Int, remaining: Int, resetTime: Date) {
        cleanOldRequests()
        
        return (
            current: requests.count,
            max: maxRequests,
            remaining: max(0, maxRequests - requests.count),
            resetTime: Date().addingTimeInterval(windowInterval)
        )
    }
    
    /// 엔드포인트별 통계
    func getEndpointStats() -> [String: Int] {
        cleanOldRequests()
        
        var stats: [String: Int] = [:]
        requests.forEach { record in
            stats[record.endpoint, default: 0] += 1
        }
        
        return stats
    }
    
    // MARK: - Private
    
    /// 오래된 요청 정리
    private func cleanOldRequests() {
        let cutoff = Date().addingTimeInterval(-windowInterval)
        requests.removeAll { $0.timestamp < cutoff }
    }
    
    /// 대기열 처리
    private func processQueue() {
        while !queue.isEmpty && canMakeRequest() {
            let continuation = queue.removeFirst()
            continuation.resume()
        }
    }
}

/// 레이트 리밋을 적용한 API 요청
func withRateLimit<T>(
    endpoint: String,
    request: () async throws -> T
) async throws -> T {
    // 요청 가능할 때까지 대기
    await RateLimitManager.shared.waitForSlot()
    
    // 요청 기록
    await MainActor.run {
        RateLimitManager.shared.recordRequest(endpoint: endpoint)
    }
    
    do {
        let result = try await request()
        return result
    } catch {
        // 429 에러 처리
        if let urlError = error as? URLError,
           urlError.code == .userAuthenticationRequired { // 429 상태 코드
            await MainActor.run {
                RateLimitManager.shared.handleRateLimitError()
            }
            throw FootballAPIError.rateLimitExceeded
        }
        
        throw error
    }
}

