import Foundation
import SwiftUI

// MARK: - 리그 팔로우 업데이트 처리
extension FixturesOverviewViewModel {
    
    /// 리그 팔로우 업데이트 알림 구독 설정
    func setupLeagueFollowObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleLeagueFollowUpdate),
            name: NSNotification.Name("LeagueFollowUpdated"),
            object: nil
        )
    }
    
    /// 리그 팔로우 업데이트 처리
    @objc private func handleLeagueFollowUpdate(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let action = userInfo["action"] as? String,
              let leagueId = userInfo["leagueId"] as? Int else { return }
        
        Task { @MainActor in
            switch action {
            case "follow":
                print("📱 새 리그 추가됨: \(leagueId)")
                await handleNewLeagueAdded(leagueId)
            case "unfollow":
                print("📱 리그 제거됨: \(leagueId)")
                await handleLeagueRemoved(leagueId)
            case "reset":
                print("📱 리그 목록 초기화됨")
                await handleLeagueReset()
            default:
                break
            }
        }
    }
    
    /// 새 리그 추가 시 처리
    private func handleNewLeagueAdded(_ leagueId: Int) async {
        // 현재 표시 중인 날짜들에 대해 새 리그의 경기 로드
        let datesToUpdate = Array(fixtures.keys).sorted()
        
        for date in datesToUpdate {
            // 해당 날짜에 새 리그가 활성화되어 있는지 확인
            let activeLeagues = leagueFollowService.getActiveLeagueIds(for: date)
            guard activeLeagues.contains(leagueId) else { continue }
            
            do {
                let dateString = formatDateForAPI(date)
                let seasonForRequest = await service.getSeasonForLeagueAndDate(leagueId, date: date)
                
                print("🔄 새 리그 \(leagueId) 경기 로드 중: \(dateString)")
                
                // 새 리그의 경기만 가져오기
                let newFixtures = try await service.getFixturesWithServerCache(
                    date: dateString,
                    leagueId: leagueId,
                    seasonYear: seasonForRequest,
                    forceRefresh: true
                )
                
                // 기존 경기 목록에 추가
                var existingFixtures = fixtures[date] ?? []
                let existingIds = Set(existingFixtures.map { $0.fixture.id })
                let uniqueNewFixtures = newFixtures.filter { !existingIds.contains($0.fixture.id) }
                
                existingFixtures.append(contentsOf: uniqueNewFixtures)
                
                // UI 업데이트
                withAnimation {
                    fixtures[date] = existingFixtures
                }
                
                // 캐시 업데이트
                cachedFixtures[dateString] = existingFixtures
                saveCachedFixtures(for: dateString)
                
                print("✅ 리그 \(leagueId): \(uniqueNewFixtures.count)개 경기 추가됨")
                
            } catch {
                print("❌ 리그 \(leagueId) 경기 로드 실패: \(error)")
            }
            
            // API 제한 방지를 위한 짧은 지연 (429 에러 방지를 위해 증가)
            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초
        }
    }
    
    /// 리그 제거 시 처리
    private func handleLeagueRemoved(_ leagueId: Int) async {
        // 제거된 리그의 경기를 모든 날짜에서 필터링
        for (date, fixtureList) in fixtures {
            let filteredFixtures = fixtureList.filter { fixture in
                fixture.league.id != leagueId
            }
            
            if filteredFixtures.count != fixtureList.count {
                // UI 업데이트
                withAnimation {
                    fixtures[date] = filteredFixtures
                }
                
                // 캐시 업데이트
                let dateString = formatDateForAPI(date)
                cachedFixtures[dateString] = filteredFixtures
                saveCachedFixtures(for: dateString)
                
                print("✅ 날짜 \(dateString)에서 리그 \(leagueId) 경기 제거됨")
            }
        }
    }
    
    /// 리그 목록 초기화 시 처리
    private func handleLeagueReset() async {
        // 모든 날짜에 대해 전체 새로고침
        await loadFixturesForDate(selectedDate, forceRefresh: true)
    }
}