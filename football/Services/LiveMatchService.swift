import Foundation
import Combine

/// 라이브 경기 데이터를 처리하는 전용 서비스 클래스
@MainActor
class LiveMatchService {
    static let shared = LiveMatchService()
    private let apiService = SupabaseFootballAPIService.shared
    private var realtimeService: LiveMatchRealtimeService {
        LiveMatchRealtimeService.shared
    }
    
    // 라이브 경기 목록 게시자
    @Published var liveMatches: [Fixture] = []
    
    // Realtime 사용 여부
    private let useRealtime = true
    
    // 폴링 타이머 (Realtime 백업용)
    private var pollingTimer: Timer?
    private let pollingInterval: TimeInterval = 30.0 // 30초 간격으로 폴링 (안정성 강화)
    
    // 라이브 경기 상태 목록
    private let liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"]
    
    // 마지막 업데이트 시간
    private var lastUpdateTime: Date?
    
    // 경기 상태 캐시 (경기별 상태 추적)
    private var matchStatusCache: [Int: (status: String, lastUpdated: Date)] = [:]
    
    // 종료된 경기 추적 (더 이상 폴링하지 않음)
    private var finishedMatches: Set<Int> = []
    
    // 무한 요청 방지를 위한 상태 관리
    private var consecutiveEmptyResponses = 0
    private let maxEmptyResponses = 3 // 연속 3회 빈 응답 시 폴링 중단
    private var isPollingActive = false
    
    private init() {
        // 앱 시작 시 라이브 경기 로드 및 폴링 시작
        startLivePolling()
    }
    
    /// 라이브 경기 폴링 시작
    func startLivePolling() {
        guard !isPollingActive else {
            print("⚠️ 이미 폴링이 활성화되어 있습니다.")
            return
        }
        
        print("⏱️ 라이브 경기 폴링 시작 (간격: \(pollingInterval)초)")
        isPollingActive = true
        consecutiveEmptyResponses = 0
        
        // 기존 타이머가 있으면 중지
        stopLivePolling()
        
        // 즉시 첫 번째 로드 실행
        Task {
            await loadLiveMatches()
        }
        
        // 폴링 타이머 시작
        pollingTimer = Timer.scheduledTimer(withTimeInterval: pollingInterval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self = self, self.isPollingActive else { return }
                
                // 연속 빈 응답이 너무 많으면 폴링 중단
                if self.consecutiveEmptyResponses >= self.maxEmptyResponses {
                    print("🚫 연속 \(self.maxEmptyResponses)회 빈 응답으로 폴링 중단")
                    self.stopLivePolling()
                    return
                }
                
                await self.loadLiveMatches()
            }
        }
    }
    
    /// 라이브 경기 폴링 중지
    func stopLivePolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
        isPollingActive = false
        print("⏱️ 라이브 경기 폴링 중지")
    }
    
    /// 라이브 경기 목록 로드 (내부 메서드)
    @MainActor
    private func loadLiveMatches() async {
        do {
            // 라이브 경기 목록 가져오기
            let fixtures = try await getLiveMatches()
            
            // 경기 상태 변화 감지
            var statusChangedMatches: [Int] = []
            for fixture in fixtures {
                let fixtureId = fixture.fixture.id
                let currentStatus = fixture.fixture.status.short
                
                // 이전 상태와 비교
                if let cached = matchStatusCache[fixtureId] {
                    if cached.status != currentStatus {
                        statusChangedMatches.append(fixtureId)
                        print("🔄 경기 \(fixtureId) 상태 변경: \(cached.status) → \(currentStatus)")
                        
                        // 경기 종료 감지
                        if ["FT", "AET", "PEN"].contains(currentStatus) {
                            finishedMatches.insert(fixtureId)
                            print("🏁 경기 \(fixtureId) 종료")
                            
                            // 경기 종료 알림 발송
                            NotificationCenter.default.post(
                                name: Notification.Name("MatchFinished"),
                                object: nil,
                                userInfo: ["fixtureId": fixtureId, "fixture": fixture]
                            )
                        }
                    }
                }
                
                // 캐시 업데이트
                matchStatusCache[fixtureId] = (status: currentStatus, lastUpdated: Date())
            }
            
            // 빈 응답 처리
            if fixtures.isEmpty {
                consecutiveEmptyResponses += 1
                print("⚠️ 라이브 경기 없음 (연속 \(consecutiveEmptyResponses)회)")
                
                // 연속 빈 응답이 임계값에 도달하면 폴링 중단 예고
                if consecutiveEmptyResponses >= maxEmptyResponses {
                    print("🚫 연속 \(maxEmptyResponses)회 빈 응답으로 다음 폴링에서 중단 예정")
                }
            } else {
                // 라이브 경기가 있으면 카운터 리셋
                consecutiveEmptyResponses = 0
                print("✅ 라이브 경기 발견: \(fixtures.count)개")
                
                if !statusChangedMatches.isEmpty {
                    print("📊 상태 변경된 경기: \(statusChangedMatches.count)개")
                }
            }
            
            // 마지막 업데이트 시간 기록
            lastUpdateTime = Date()
            
            // 라이브 경기 목록 업데이트
            self.liveMatches = fixtures
            
            print("✅ 라이브 경기 업데이트 완료: \(fixtures.count)개 경기")
            
            // 종료된 경기 캐시 정리 (메모리 관리)
            cleanupFinishedMatchesCache()
            
        } catch {
            print("❌ 라이브 경기 로드 실패: \(error.localizedDescription)")
            consecutiveEmptyResponses += 1
        }
    }
    
    /// 현재 진행 중인 모든 라이브 경기 목록 가져오기
    /// - Returns: 라이브 경기 목록
    func getLiveMatches() async throws -> [Fixture] {
        // 🔥 라이브 경기는 항상 실시간 데이터
        // performRequest가 private이므로 오늘 날짜의 경기를 가져와서 라이브만 필터링
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let today = dateFormatter.string(from: Date())
        
        let response = try await apiService.fetchFixtures(date: today)
        
        print("✅ 라이브 경기 API 응답: \(response.response.count)개")
        
        // 라이브 경기만 필터링
        let liveFixtures = response.response.filter { fixture in
            liveStatuses.contains(fixture.fixture.status.short)
        }
        
        print("📊 필터링된 라이브 경기: \(liveFixtures.count)개")
        
        // 빈 응답 로깅
        if liveFixtures.isEmpty {
            print("⚠️ 현재 진행 중인 라이브 경기가 없습니다.")
        }
        
        return liveFixtures
    }
    
    /// 특정 라이브 경기 상세 정보 가져오기
    /// - Parameter fixtureId: 경기 ID
    /// - Returns: 경기 상세 정보
    func getLiveMatchDetails(fixtureId: Int) async throws -> Fixture {
        // performRequest가 private이므로 오늘 날짜 경기에서 찾기
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let today = dateFormatter.string(from: Date())
        
        let response = try await apiService.fetchFixtures(date: today)
        
        guard let fixture = response.response.first(where: { $0.fixture.id == fixtureId }) else {
            throw FootballAPIError.apiError(["경기 정보를 찾을 수 없습니다."])
        }
        
        print("✅ 라이브 경기 ID \(fixtureId) 상세 정보 조회 성공")
        return fixture
    }
    
    /// 특정 라이브 경기의 이벤트 목록 가져오기
    /// - Parameter fixtureId: 경기 ID
    /// - Returns: 경기 이벤트 목록
    func getLiveMatchEvents(fixtureId: Int) async throws -> [FixtureEvent] {
        // performRequest가 private이므로 fetchFixtureEvents 사용
        let response = try await apiService.fetchFixtureEvents(fixtureId: fixtureId)
        
        print("✅ 라이브 경기 ID \(fixtureId) 이벤트 \(response.response.count)개 조회 성공")
        return response.response
    }
    
    /// 특정 라이브 경기의 통계 정보 가져오기
    /// - Parameter fixtureId: 경기 ID
    /// - Returns: 경기 통계 정보
    func getLiveMatchStatistics(fixtureId: Int) async throws -> [TeamStatistics] {
        // performRequest가 private이므로 fetchFixtureStatistics 사용
        let response = try await apiService.fetchFixtureStatistics(fixtureId: fixtureId)
        
        print("✅ 라이브 경기 ID \(fixtureId) 통계 정보 조회 성공")
        return response.response
    }
    
    /// 경기가 라이브 상태인지 확인
    /// - Parameter fixture: 확인할 경기
    /// - Returns: 라이브 상태 여부
    func isLiveMatch(_ fixture: Fixture) -> Bool {
        return liveStatuses.contains(fixture.fixture.status.short)
    }
    
    /// 마지막 업데이트 시간 문자열 반환
    func getLastUpdateTimeString() -> String {
        guard let lastUpdate = lastUpdateTime else {
            return "업데이트 정보 없음"
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: lastUpdate)
    }
    
    /// 종료된 경기 캐시 정리
    private func cleanupFinishedMatchesCache() {
        let now = Date()
        let cacheExpiration: TimeInterval = 3600 // 1시간
        
        // 종료된 지 1시간이 지난 경기들의 캐시 제거
        matchStatusCache = matchStatusCache.filter { (fixtureId, cache) in
            if finishedMatches.contains(fixtureId) {
                return now.timeIntervalSince(cache.lastUpdated) < cacheExpiration
            }
            return true
        }
        
        // 종료된 경기 세트도 정리
        finishedMatches = finishedMatches.filter { fixtureId in
            matchStatusCache[fixtureId] != nil
        }
        
        print("🧹 종료된 경기 캐시 정리 완료")
    }
    
    /// 특정 경기의 상태 캐시 확인
    func getCachedStatus(for fixtureId: Int) -> String? {
        return matchStatusCache[fixtureId]?.status
    }
    
    /// 경기가 최근에 종료되었는지 확인
    func hasRecentlyFinished(_ fixtureId: Int) -> Bool {
        guard let cached = matchStatusCache[fixtureId],
              ["FT", "AET", "PEN"].contains(cached.status) else {
            return false
        }
        
        // 종료된 지 5분 이내인 경우 true
        return Date().timeIntervalSince(cached.lastUpdated) < 300
    }
}
