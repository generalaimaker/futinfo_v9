import Foundation
import Combine
#if os(iOS)
import UIKit
#endif

/// 간단하고 효과적인 라이브 경기 서비스 - 10초 이내 업데이트
@MainActor
class SimpleLiveMatchService {
    static let shared = SimpleLiveMatchService()
    private let apiService = SupabaseFootballAPIService.shared
    
    // 라이브 경기 목록
    @Published var liveMatches: [Fixture] = []
    @Published var lastUpdateTime: Date?
    
    // 향상된 폴링 설정
    private var mainPollingTimer: Timer?
    private let fastPollingInterval: TimeInterval = 10.0 // 10초마다
    private let normalPollingInterval: TimeInterval = 30.0 // 30초마다
    
    // 라이브 경기 상태
    private let liveStatuses = ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"]
    
    // 연속 빈 응답 추적
    private var consecutiveEmptyResponses = 0
    private let maxEmptyResponses = 3
    
    private init() {
        startFastPolling()
    }
    
    // MARK: - 빠른 폴링 시스템
    
    func startFastPolling() {
        print("⚡ 빠른 라이브 경기 폴링 시작 (10초 간격)")
        
        // 즉시 첫 로드
        Task {
            await loadLiveMatches()
        }
        
        // 10초마다 업데이트
        mainPollingTimer = Timer.scheduledTimer(withTimeInterval: fastPollingInterval, repeats: true) { [weak self] _ in
            Task {
                await self?.loadLiveMatches()
            }
        }
    }
    
    func stopPolling() {
        mainPollingTimer?.invalidate()
        mainPollingTimer = nil
        print("⏹️ 폴링 중지")
    }
    
    // MARK: - 라이브 경기 로드
    
    @MainActor
    private func loadLiveMatches() async {
        do {
            // 라이브 경기 가져오기 (캐시 없이)
            let response: FixturesResponse = try await apiService.performRequest(
                endpoint: "fixtures",
                parameters: ["live": "all"],
                cachePolicy: .veryShort, // 매우 짧은 캐시 (5초)
                forceRefresh: true // 항상 새 데이터
            )
            
            let fixtures = response.response.filter { fixture in
                liveStatuses.contains(fixture.fixture.status.short)
            }
            
            // 빈 응답 처리
            if fixtures.isEmpty {
                consecutiveEmptyResponses += 1
                if consecutiveEmptyResponses >= maxEmptyResponses {
                    print("🚫 라이브 경기 없음 - 폴링 속도 감소")
                    // 라이브 경기가 없으면 30초로 변경
                    changePollingInterval(to: normalPollingInterval)
                }
            } else {
                consecutiveEmptyResponses = 0
                // 라이브 경기가 있으면 10초 유지
                changePollingInterval(to: fastPollingInterval)
                
                // 변경사항 감지
                detectChanges(oldMatches: self.liveMatches, newMatches: fixtures)
            }
            
            self.liveMatches = fixtures
            self.lastUpdateTime = Date()
            
            print("✅ 라이브 경기 업데이트: \(fixtures.count)개")
            
        } catch {
            print("❌ 라이브 경기 로드 실패: \(error)")
        }
    }
    
    // MARK: - 폴링 간격 변경
    
    private func changePollingInterval(to interval: TimeInterval) {
        guard mainPollingTimer?.timeInterval != interval else { return }
        
        mainPollingTimer?.invalidate()
        
        mainPollingTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task {
                await self?.loadLiveMatches()
            }
        }
        
        print("⏱️ 폴링 간격 변경: \(Int(interval))초")
    }
    
    // MARK: - 변경사항 감지
    
    private func detectChanges(oldMatches: [Fixture], newMatches: [Fixture]) {
        for newMatch in newMatches {
            if let oldMatch = oldMatches.first(where: { $0.fixture.id == newMatch.fixture.id }) {
                // 득점 변경 감지
                if oldMatch.goals?.home != newMatch.goals?.home || 
                   oldMatch.goals?.away != newMatch.goals?.away {
                    
                    print("⚽ 득점! \(newMatch.teams.home.name) \(newMatch.goals?.home ?? 0) - \(newMatch.goals?.away ?? 0) \(newMatch.teams.away.name)")
                    
                    // 득점 알림
                    NotificationCenter.default.post(
                        name: NSNotification.Name("GoalScored"),
                        object: nil,
                        userInfo: [
                            "match": newMatch,
                            "homeTeam": newMatch.teams.home.name,
                            "awayTeam": newMatch.teams.away.name,
                            "score": "\(newMatch.goals?.home ?? 0) - \(newMatch.goals?.away ?? 0)"
                        ]
                    )
                    
                    // 햅틱 피드백
                    #if os(iOS)
                    let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
                    impactFeedback.impactOccurred()
                    #endif
                }
                
                // 상태 변경 감지
                if oldMatch.fixture.status.short != newMatch.fixture.status.short {
                    print("📢 경기 상태 변경: \(oldMatch.fixture.status.short) → \(newMatch.fixture.status.short)")
                    
                    NotificationCenter.default.post(
                        name: NSNotification.Name("MatchStatusChanged"),
                        object: nil,
                        userInfo: [
                            "match": newMatch,
                            "oldStatus": oldMatch.fixture.status.short,
                            "newStatus": newMatch.fixture.status.short
                        ]
                    )
                }
            }
        }
    }
    
    // MARK: - 특정 경기 상세 정보
    
    func getMatchDetails(fixtureId: Int) async throws -> Fixture {
        let response: FixturesResponse = try await apiService.performRequest(
            endpoint: "fixtures",
            parameters: ["id": String(fixtureId)],
            cachePolicy: .veryShort,
            forceRefresh: true
        )
        
        guard let fixture = response.response.first else {
            throw FootballAPIError.apiError(["경기를 찾을 수 없습니다"])
        }
        
        return fixture
    }
    
    func getMatchEvents(fixtureId: Int) async throws -> [FixtureEvent] {
        return try await apiService.getFixtureEvents(fixtureId: fixtureId)
    }
    
    // MARK: - 라이프사이클
    
    func pauseUpdates() {
        stopPolling()
    }
    
    func resumeUpdates() {
        startFastPolling()
    }
}