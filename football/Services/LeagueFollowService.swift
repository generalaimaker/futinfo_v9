import Foundation
import SwiftUI

class LeagueFollowService: ObservableObject {
    static let shared = LeagueFollowService()
    
    @Published var followedLeagues: [LeagueFollow] = []
    
    private let userDefaultsKey = "followedLeagues"
    
    private init() {
        loadFollowedLeagues()
    }
    
    // 팔로우한 리그 로드
    private func loadFollowedLeagues() {
        // UserDefaults에서 로드
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let leagues = try? JSONDecoder().decode([LeagueFollow].self, from: data) {
            self.followedLeagues = leagues
        } else {
            // 처음 실행 시 기본 리그 설정
            self.followedLeagues = LeagueFollow.defaultLeagues
            saveFollowedLeagues()
        }
    }
    
    // 팔로우한 리그 저장
    private func saveFollowedLeagues() {
        if let data = try? JSONEncoder().encode(followedLeagues) {
            UserDefaults.standard.set(data, forKey: userDefaultsKey)
        }
    }
    
    // 리그 팔로우 추가
    func followLeague(_ league: LeagueFollow) {
        if !isFollowing(leagueId: league.id) {
            followedLeagues.append(league)
            saveFollowedLeagues()
            
            // 알림 발송
            NotificationCenter.default.post(
                name: NSNotification.Name("LeagueFollowUpdated"),
                object: nil,
                userInfo: ["action": "follow", "leagueId": league.id]
            )
        }
    }
    
    // 리그 팔로우 추가 (AvailableLeague로부터)
    func followLeague(_ availableLeague: AvailableLeague) {
        let league = LeagueFollow(
            id: availableLeague.id,
            name: availableLeague.name,
            logo: availableLeague.logo,
            country: availableLeague.country,
            isDefault: false
        )
        followLeague(league)
    }
    
    // 리그 팔로우 해제
    func unfollowLeague(leagueId: Int) {
        // 기본 리그는 언팔로우 불가
        if let league = followedLeagues.first(where: { $0.id == leagueId }), league.isDefault {
            print("기본 리그는 언팔로우할 수 없습니다.")
            return
        }
        
        followedLeagues.removeAll { $0.id == leagueId }
        saveFollowedLeagues()
        
        // 알림 발송
        NotificationCenter.default.post(
            name: NSNotification.Name("LeagueFollowUpdated"),
            object: nil,
            userInfo: ["action": "unfollow", "leagueId": leagueId]
        )
    }
    
    // 리그 팔로우 여부 확인
    func isFollowing(leagueId: Int) -> Bool {
        return followedLeagues.contains { $0.id == leagueId }
    }
    
    // 팔로우한 리그 ID 목록
    var followedLeagueIds: [Int] {
        return followedLeagues.map { $0.id }
    }
    
    // 팔로우한 리그 중 활성화된 리그 ID 목록 (시즌별)
    func getActiveLeagueIds(for date: Date = Date()) -> [Int] {
        let calendar = Calendar.current
        let month = calendar.component(.month, from: date)
        
        var activeLeagues = followedLeagueIds
        
        // 시즌별 리그 필터링
        // 챔피언스리그, 유로파리그, 컨퍼런스리그는 9월-5월 (1월, 6-8월 제외)
        if month == 1 || (month >= 6 && month <= 8) {
            activeLeagues.removeAll { [2, 3, 4].contains($0) }
        }
        
        // K리그는 3월-11월 (7월도 활동)
        if month < 3 || month > 11 {
            activeLeagues.removeAll { [292, 293].contains($0) }
        }
        
        // MLS는 2월-12월 (거의 연중 활동)
        if month < 2 {
            activeLeagues.removeAll { $0 == 253 }
        }
        
        // 브라질 세리에 A는 4월-12월 (7월도 활동)
        if month < 4 {
            activeLeagues.removeAll { $0 == 71 }
        }
        
        // 아시안 챔피언스리그는 2월-11월
        if month < 2 || month > 11 {
            activeLeagues.removeAll { $0 == 848 }
        }
        
        // 사우디 프로 리그는 8월-5월 (6-7월 휴식)
        if month >= 6 && month <= 7 {
            activeLeagues.removeAll { $0 == 307 }
        }
        
        // 클럽 월드컵은 12월-1월, 그리고 6-7월 (새로운 포맷)
        // 2025년부터 클럽월드컵이 6-7월에 개최
        if month > 1 && month < 6 {
            activeLeagues.removeAll { $0 == 15 }
        } else if month > 7 && month < 12 {
            activeLeagues.removeAll { $0 == 15 }
        }
        
        // 컵 대회들은 대부분 8월-5월 (여름 휴식기 제외)
        // FA컵, 코파 델 레이, 코파 이탈리아, DFB 포칼, 쿠프 드 프랑스
        if month >= 6 && month <= 7 {
            activeLeagues.removeAll { [45, 143, 137, 81, 66].contains($0) }
        }
        
        // 네이션스 리그는 국제 경기 주간에만 (3,6,9,10,11월)
        if ![3, 6, 9, 10, 11].contains(month) {
            activeLeagues.removeAll { $0 == 5 }
        }
        
        // 월드컵 예선은 국제 경기 주간에만 (3,6,9,10,11월)
        if ![3, 6, 9, 10, 11].contains(month) {
            activeLeagues.removeAll { [29, 32, 34].contains($0) }
        }
        
        return activeLeagues
    }
    
    // 카테고리별로 그룹화된 팔로우하지 않은 리그 목록
    func getAvailableLeaguesGrouped() -> [LeagueCategory: [AvailableLeague]] {
        let followedIds = Set(followedLeagueIds)
        
        var grouped: [LeagueCategory: [AvailableLeague]] = [:]
        
        for league in AvailableLeague.allLeagues {
            if !followedIds.contains(league.id) {
                if grouped[league.category] == nil {
                    grouped[league.category] = []
                }
                grouped[league.category]?.append(league)
            }
        }
        
        return grouped
    }
    
    // 리그 순서 재정렬
    func moveLeague(from source: IndexSet, to destination: Int) {
        followedLeagues.move(fromOffsets: source, toOffset: destination)
        saveFollowedLeagues()
    }
    
    // 기본 리그로 초기화
    func resetToDefaultLeagues() {
        followedLeagues = LeagueFollow.defaultLeagues
        saveFollowedLeagues()
        
        // 알림 발송
        NotificationCenter.default.post(
            name: NSNotification.Name("LeagueFollowUpdated"),
            object: nil,
            userInfo: ["action": "reset"]
        )
    }
}