import Foundation
import Supabase

// MARK: - FixtureDetailViewModel Realtime Extension
extension FixtureDetailViewModel {
    
    // Realtime 구독 시작
    @MainActor
    func startRealtimeSubscription() async {
        guard isLiveMatch() else {
            print("⚠️ 라이브 경기가 아니므로 Realtime 구독하지 않음")
            return
        }
        
        print("🔴 경기 상세 Realtime 구독 시작 (fixtureId: \(fixtureId))")
        
        // LiveMatchRealtimeService를 통해 구독
        let realtimeService = LiveMatchRealtimeService.shared
        
        // 이미 구독 중인 경우 추가 구독 불필요
        if realtimeService.isConnected {
            print("✅ 이미 Realtime에 연결되어 있음")
            setupRealtimeObservers()
        } else {
            // 새로 구독 시작
            await realtimeService.startRealtimeSubscription()
            setupRealtimeObservers()
        }
    }
    
    // Realtime 이벤트 옵저버 설정
    private func setupRealtimeObservers() {
        // 경기 업데이트 감지
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleLiveMatchUpdate),
            name: Notification.Name("LiveMatchUpdated"),
            object: nil
        )
        
        // 골 이벤트 감지
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleLiveMatchGoal),
            name: Notification.Name("LiveMatchGoal"),
            object: nil
        )
        
        // 상태 변경 감지
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleLiveMatchStatusChanged),
            name: Notification.Name("LiveMatchStatusChanged"),
            object: nil
        )
        
        // 경기 종료 감지
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleLiveMatchEnded),
            name: Notification.Name("LiveMatchEnded"),
            object: nil
        )
        
        print("✅ Realtime 옵저버 설정 완료")
    }
    
    // MARK: - Realtime 이벤트 핸들러
    
    @objc private func handleLiveMatchUpdate(_ notification: Notification) {
        guard let match = notification.userInfo?["match"] as? LiveMatch,
              match.fixtureId == self.fixtureId else { return }
        
        print("🔄 Realtime: 경기 업데이트 감지")
        
        Task { @MainActor in
            // 경기 정보 업데이트
            if let updatedFixture = try? await LiveMatchService.shared.getLiveMatchDetails(fixtureId: fixtureId) {
                self.currentFixture = updatedFixture
                
                // 통계 업데이트
                await loadStatisticsIfNeeded()
            }
        }
    }
    
    @objc private func handleLiveMatchGoal(_ notification: Notification) {
        guard let match = notification.userInfo?["match"] as? LiveMatch,
              match.fixtureId == self.fixtureId else { return }
        
        print("⚽ Realtime: 골 이벤트 감지")
        
        Task { @MainActor in
            // 이벤트 및 통계 즉시 업데이트
            await loadEvents()
            await loadStatistics()
            
            // UI 업데이트
            self.objectWillChange.send()
        }
    }
    
    @objc private func handleLiveMatchStatusChanged(_ notification: Notification) {
        guard let match = notification.userInfo?["match"] as? LiveMatch,
              match.fixtureId == self.fixtureId,
              let oldStatus = notification.userInfo?["oldStatus"] as? String else { return }
        
        print("🔄 Realtime: 상태 변경 감지 \(oldStatus) → \(match.statusShort)")
        
        Task { @MainActor in
            // 상태 변경 처리
            await handleStatusChange(from: oldStatus, to: match.statusShort)
            
            // 현재 경기 정보 업데이트
            if let updatedFixture = try? await LiveMatchService.shared.getLiveMatchDetails(fixtureId: fixtureId) {
                self.currentFixture = updatedFixture
            }
        }
    }
    
    @objc private func handleLiveMatchEnded(_ notification: Notification) {
        guard let match = notification.userInfo?["match"] as? LiveMatch,
              match.fixtureId == self.fixtureId else { return }
        
        print("🏁 Realtime: 경기 종료 감지")
        
        // 자동 새로고침 중지
        stopAutoRefresh()
        
        Task { @MainActor in
            // 최종 데이터 로드
            await loadAllData()
        }
    }
    
    // Realtime 구독 해제
    func stopRealtimeSubscription() {
        print("🔴 경기 상세 Realtime 구독 해제")
        
        // 옵저버 제거
        NotificationCenter.default.removeObserver(self, name: Notification.Name("LiveMatchUpdated"), object: nil)
        NotificationCenter.default.removeObserver(self, name: Notification.Name("LiveMatchGoal"), object: nil)
        NotificationCenter.default.removeObserver(self, name: Notification.Name("LiveMatchStatusChanged"), object: nil)
        NotificationCenter.default.removeObserver(self, name: Notification.Name("LiveMatchEnded"), object: nil)
    }
}