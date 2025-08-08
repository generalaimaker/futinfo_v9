import Foundation
import SwiftUI

/// 라이브 경기 이벤트 알림 서비스 (스텁 버전)
/// 실제 구현은 LiveMatchNotificationService.swift 참조
@MainActor
class LiveMatchNotificationService: ObservableObject {
    static let shared = LiveMatchNotificationService()
    
    // 알림 설정
    @Published var isNotificationEnabled = false
    @Published var isSoundEnabled = false
    @Published var followingTeamIds: Set<Int> = []
    @Published var notificationAuthStatus = 0
    
    private init() {
        loadSettings()
    }
    
    func checkNotificationPermission() {
        // 스텁
    }
    
    func requestNotificationPermission() async -> Bool {
        return false
    }
    
    func toggleTeamFollow(_ teamId: Int) {
        if followingTeamIds.contains(teamId) {
            followingTeamIds.remove(teamId)
        } else {
            followingTeamIds.insert(teamId)
        }
        saveSettings()
    }
    
    func saveSettings() {
        UserDefaults.standard.set(isNotificationEnabled, forKey: "LiveMatchNotificationEnabled")
        UserDefaults.standard.set(isSoundEnabled, forKey: "LiveMatchSoundEnabled")
        UserDefaults.standard.set(Array(followingTeamIds), forKey: "FollowingTeamIds")
    }
    
    private func loadSettings() {
        if let savedTeamIds = UserDefaults.standard.array(forKey: "FollowingTeamIds") as? [Int] {
            followingTeamIds = Set(savedTeamIds)
        }
    }
}

// MARK: - 알림 설정 뷰
struct LiveMatchNotificationSettingsView: View {
    @StateObject private var notificationService = LiveMatchNotificationService.shared
    
    var body: some View {
        Form {
            Section(header: Text("알림 설정")) {
                Text("iOS에서만 알림 기능을 사용할 수 있습니다")
                    .foregroundColor(.secondary)
            }
            
            Section(header: Text("팔로잉 팀")) {
                if notificationService.followingTeamIds.isEmpty {
                    Text("팔로잉 중인 팀이 없습니다")
                        .foregroundColor(.secondary)
                } else {
                    Text("\(notificationService.followingTeamIds.count)개 팀 팔로잉 중")
                }
            }
        }
        .navigationTitle("알림 설정")
    }
}