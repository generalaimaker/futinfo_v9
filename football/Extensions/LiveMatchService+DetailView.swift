import Foundation
import Combine
#if os(iOS)
import UIKit
#endif

// MARK: - 경기 상세 화면용 확장
extension LiveMatchService {
    
    /// 특정 경기만 집중적으로 업데이트
    private static var detailTimers: [Int: Timer] = [:]
    
    /// 경기 상세 화면용 빠른 업데이트 시작 (5초 간격)
    func startDetailViewUpdates(for fixtureId: Int) {
        print("⚡ 경기 \(fixtureId) 상세 업데이트 시작 (5초 간격)")
        
        // 기존 타이머 제거
        Self.detailTimers[fixtureId]?.invalidate()
        
        // 즉시 첫 업데이트
        Task {
            await updateSingleMatch(fixtureId: fixtureId)
        }
        
        // 5초마다 업데이트
        Self.detailTimers[fixtureId] = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            Task {
                await self.updateSingleMatch(fixtureId: fixtureId)
            }
        }
    }
    
    /// 경기 상세 화면 업데이트 중지
    func stopDetailViewUpdates(for fixtureId: Int) {
        print("⏹️ 경기 \(fixtureId) 상세 업데이트 중지")
        Self.detailTimers[fixtureId]?.invalidate()
        Self.detailTimers.removeValue(forKey: fixtureId)
    }
    
    /// 단일 경기 업데이트
    @MainActor
    private func updateSingleMatch(fixtureId: Int) async {
        do {
            // 캐시 없이 직접 API 호출
            let updatedMatch = try await getLiveMatchDetails(fixtureId: fixtureId)
            
            // 라이브 경기 목록에서 업데이트
            if let index = liveMatches.firstIndex(where: { $0.fixture.id == fixtureId }) {
                let oldMatch = liveMatches[index]
                liveMatches[index] = updatedMatch
                
                // 변경사항 감지
                detectChanges(old: oldMatch, new: updatedMatch)
            }
            
            // 경기 상세 업데이트 알림
            NotificationCenter.default.post(
                name: NSNotification.Name("MatchDetailUpdated"),
                object: nil,
                userInfo: ["match": updatedMatch]
            )
            
            print("✅ 경기 \(fixtureId) 상세 업데이트 완료")
            
        } catch {
            print("❌ 경기 \(fixtureId) 업데이트 실패: \(error)")
        }
    }
    
    /// 변경사항 감지 및 알림
    private func detectChanges(old: Fixture, new: Fixture) {
        // 득점 변경 감지
        if old.goals?.home != new.goals?.home || old.goals?.away != new.goals?.away {
            print("⚽ 득점! \(new.teams.home.name) \(new.goals?.home ?? 0) - \(new.goals?.away ?? 0) \(new.teams.away.name)")
            
            NotificationCenter.default.post(
                name: NSNotification.Name("GoalScored"),
                object: nil,
                userInfo: [
                    "match": new,
                    "homeTeam": new.teams.home.name,
                    "awayTeam": new.teams.away.name,
                    "score": "\(new.goals?.home ?? 0) - \(new.goals?.away ?? 0)"
                ]
            )
            
            // 햅틱 피드백
            #if os(iOS)
            let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
            impactFeedback.impactOccurred()
            #endif
        }
        
        // 상태 변경 감지
        if old.fixture.status.short != new.fixture.status.short {
            print("📢 경기 상태 변경: \(old.fixture.status.short) → \(new.fixture.status.short)")
            
            NotificationCenter.default.post(
                name: NSNotification.Name("MatchStatusChanged"),
                object: nil,
                userInfo: [
                    "match": new,
                    "oldStatus": old.fixture.status.short,
                    "newStatus": new.fixture.status.short
                ]
            )
        }
    }
}