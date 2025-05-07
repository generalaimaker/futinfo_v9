import Foundation
import Combine

/// 라이브 경기 데이터를 처리하는 전용 서비스 클래스
class LiveMatchService {
    static let shared = LiveMatchService()
    private let apiService = FootballAPIService.shared
    
    // 라이브 경기 목록 게시자
    @Published var liveMatches: [Fixture] = []
    
    // 폴링 타이머
    private var pollingTimer: Timer?
    private let pollingInterval: TimeInterval = 5.0 // 5초 간격으로 폴링
    
    // 라이브 경기 상태 목록
    private let liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"]
    
    // 마지막 업데이트 시간
    private var lastUpdateTime: Date?
    
    private init() {
        // 앱 시작 시 라이브 경기 로드 및 폴링 시작
        startLivePolling()
    }
    
    /// 라이브 경기 폴링 시작
    func startLivePolling() {
        print("⏱️ 라이브 경기 폴링 시작 (간격: \(pollingInterval)초)")
        
        // 기존 타이머가 있으면 중지
        stopLivePolling()
        
        // 즉시 첫 번째 로드 실행
        Task {
            await loadLiveMatches()
        }
        
        // 폴링 타이머 시작
        pollingTimer = Timer.scheduledTimer(withTimeInterval: pollingInterval, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            Task {
                await self.loadLiveMatches()
            }
        }
    }
    
    /// 라이브 경기 폴링 중지
    func stopLivePolling() {
        pollingTimer?.invalidate()
        pollingTimer = nil
        print("⏱️ 라이브 경기 폴링 중지")
    }
    
    /// 라이브 경기 목록 로드 (내부 메서드)
    @MainActor
    private func loadLiveMatches() async {
        do {
            // 라이브 경기 목록 가져오기
            let fixtures = try await getLiveMatches()
            
            // 마지막 업데이트 시간 기록
            lastUpdateTime = Date()
            
            // 라이브 경기 목록 업데이트
            self.liveMatches = fixtures
            
            print("✅ 라이브 경기 업데이트 완료: \(fixtures.count)개 경기")
        } catch {
            print("❌ 라이브 경기 로드 실패: \(error.localizedDescription)")
        }
    }
    
    /// 현재 진행 중인 모든 라이브 경기 목록 가져오기
    /// - Returns: 라이브 경기 목록
    func getLiveMatches() async throws -> [Fixture] {
        // 캐시 정책을 매우 짧게 설정하고 항상 최신 데이터 요청
        let response: FixturesResponse = try await apiService.performRequest(
            endpoint: "fixtures",
            parameters: ["live": "all"],
            cachePolicy: .veryShort,  // 매우 짧은 캐시 시간
            forceRefresh: true  // 항상 최신 데이터 요청
        )
        
        print("✅ 라이브 경기 \(response.response.count)개 조회 성공")
        
        // 라이브 경기만 필터링
        let liveFixtures = response.response.filter { fixture in
            liveStatuses.contains(fixture.fixture.status.short)
        }
        
        print("📊 필터링된 라이브 경기: \(liveFixtures.count)개")
        return liveFixtures
    }
    
    /// 특정 라이브 경기 상세 정보 가져오기
    /// - Parameter fixtureId: 경기 ID
    /// - Returns: 경기 상세 정보
    func getLiveMatchDetails(fixtureId: Int) async throws -> Fixture {
        let response: FixturesResponse = try await apiService.performRequest(
            endpoint: "fixtures",
            parameters: ["id": String(fixtureId)],
            cachePolicy: .veryShort,
            forceRefresh: true
        )
        
        guard let fixture = response.response.first else {
            throw FootballAPIError.apiError(["경기 정보를 찾을 수 없습니다."])
        }
        
        print("✅ 라이브 경기 ID \(fixtureId) 상세 정보 조회 성공")
        return fixture
    }
    
    /// 특정 라이브 경기의 이벤트 목록 가져오기
    /// - Parameter fixtureId: 경기 ID
    /// - Returns: 경기 이벤트 목록
    func getLiveMatchEvents(fixtureId: Int) async throws -> [FixtureEvent] {
        let response: FixtureEventResponse = try await apiService.performRequest(
            endpoint: "fixtures/events",
            parameters: ["fixture": String(fixtureId)],
            cachePolicy: .veryShort,
            forceRefresh: true
        )
        
        print("✅ 라이브 경기 ID \(fixtureId) 이벤트 \(response.response.count)개 조회 성공")
        return response.response
    }
    
    /// 특정 라이브 경기의 통계 정보 가져오기
    /// - Parameter fixtureId: 경기 ID
    /// - Returns: 경기 통계 정보
    func getLiveMatchStatistics(fixtureId: Int) async throws -> [TeamStatistics] {
        let response: FixtureStatisticsResponse = try await apiService.performRequest(
            endpoint: "fixtures/statistics",
            parameters: ["fixture": String(fixtureId)],
            cachePolicy: .veryShort,
            forceRefresh: true
        )
        
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
}