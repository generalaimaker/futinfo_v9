import SwiftUI
import Kingfisher
import Supabase

@main
struct footballApp: App {
    // 환경 객체로 ScenePhase 관찰
    @Environment(\.scenePhase) private var scenePhase
    
    // FixturesOverviewViewModel 인스턴스 생성
    @StateObject private var fixturesViewModel = FixturesOverviewViewModel()
    
    // NewsPreloaderService 인스턴스 생성
    @StateObject private var newsPreloader = NewsPreloaderService.shared
    
    init() {
        // Kingfisher 캐시 설정
        setupKingfisher()
        
        // 주요 팀 로고 프리페치
        prefetchMainTeamLogos()
        
        // 분데스리가 팀 설정
        setupBundesligaTeams()
        
        // MLS, 사우디 프로 리그, K리그2 자동 추가
        addSpecificLeagues()
        
        // 뉴스 프리로드 시작
        Task {
            print("📰 뉴스 프리로드 시작...")
            await NewsPreloaderService.shared.preloadAllNews()
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(fixturesViewModel)
                .onOpenURL { url in
                    print("🔗 OAuth 콜백 URL 수신: \(url.absoluteString)")
                    
                    // OAuth 콜백 처리
                    Task {
                        do {
                            print("🔐 OAuth 세션 처리 시작...")
                            try await SupabaseService.shared.client.auth.session(from: url)
                            print("✅ OAuth 세션 처리 성공")
                            
                            // 로그인 성공 후 커뮤니티 서비스 업데이트
                            print("👤 사용자 인증 확인 중...")
                            await SupabaseCommunityService.shared.checkAuthentication()
                            
                            // Sync favorites after OAuth login
                            print("⭐ 즐겨찾기 동기화 중...")
                            await FavoriteService.shared.syncFromServerToLocal()
                            
                            print("✅ Google 로그인 완료!")
                            
                            // AuthView를 닫기 위한 추가 알림
                            await MainActor.run {
                                NotificationCenter.default.post(name: Notification.Name("AuthStateChanged"), object: nil)
                            }
                        } catch {
                            print("❌ OAuth callback error: \(error)")
                            print("❌ Error details: \(error.localizedDescription)")
                        }
                    }
                }
        }
        .onChange(of: scenePhase) { newPhase, oldPhase in
            // ScenePhase 변경 시 FixturesOverviewViewModel에 알림
            fixturesViewModel.handleScenePhaseChange(newPhase: newPhase, oldPhase: oldPhase)
        }
    }
    
    // Kingfisher 캐시 설정
    private func setupKingfisher() {
        // 디스크 캐시 설정 (30일 유지)
        KingfisherManager.setupCache()
    }
    
    // 주요 팀 로고 프리페치
    private func prefetchMainTeamLogos() {
        // 주요 팀 로고 URL 목록
        let mainTeamLogoURLs = [
            // 프리미어 리그 주요 팀
            "https://media.api-sports.io/football/teams/33.png",  // 맨체스터 유나이티드
            "https://media.api-sports.io/football/teams/40.png",  // 리버풀
            "https://media.api-sports.io/football/teams/50.png",  // 맨체스터 시티
            "https://media.api-sports.io/football/teams/47.png",  // 토트넘
            "https://media.api-sports.io/football/teams/42.png",  // 아스널
            "https://media.api-sports.io/football/teams/49.png",  // 첼시
            
            // 라리가 주요 팀
            "https://media.api-sports.io/football/teams/529.png", // 바르셀로나
            "https://media.api-sports.io/football/teams/541.png", // 레알 마드리드
            "https://media.api-sports.io/football/teams/530.png", // 아틀레티코 마드리드
            
            // 세리에 A 주요 팀
            "https://media.api-sports.io/football/teams/489.png", // AC 밀란
            "https://media.api-sports.io/football/teams/505.png", // 인터 밀란
            "https://media.api-sports.io/football/teams/496.png", // 유벤투스
            
            // 분데스리가 주요 팀
            "https://media.api-sports.io/football/teams/157.png", // 바이에른 뮌헨
            "https://media.api-sports.io/football/teams/165.png", // 도르트문트
            
            // 리그 1 주요 팀
            "https://media.api-sports.io/football/teams/85.png",  // PSG
            
            // 주요 리그 로고
            "https://media.api-sports.io/football/leagues/39.png",  // 프리미어 리그
            "https://media.api-sports.io/football/leagues/140.png", // 라리가
            "https://media.api-sports.io/football/leagues/135.png", // 세리에 A
            "https://media.api-sports.io/football/leagues/78.png",  // 분데스리가
            "https://media.api-sports.io/football/leagues/61.png",  // 리그 1
            "https://media.api-sports.io/football/leagues/2.png",   // 챔피언스 리그
            "https://media.api-sports.io/football/leagues/3.png"    // 유로파 리그
        ]
        
        // URL 객체로 변환
        let urls = mainTeamLogoURLs.compactMap { URL(string: $0) }
        
        // 프리페치 실행
        KingfisherManager.prefetchTeamLogos(urls: urls)
    }
    
    // 분데스리가와 리그 1 팀 강제 설정
    private func setupBundesligaTeams() {
        Task {
            // 5초 대기 (앱 초기화 완료 대기)
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            
            print("🔨 리그 팀 강제 설정 시작...")
            await ForceFixLeagueTeams.fixNow()
        }
    }
    
    // MLS, 사우디 프로 리그, K리그2 자동 추가
    private func addSpecificLeagues() {
        let leagueFollowService = LeagueFollowService.shared
        var addedLeagues: [String] = []
        
        // MLS 추가 (ID: 253)
        if !leagueFollowService.isFollowing(leagueId: 253) {
            let mls = LeagueFollow(
                id: 253,
                name: "MLS",
                logo: "https://media.api-sports.io/football/leagues/253.png",
                country: "USA",
                isDefault: false
            )
            leagueFollowService.followLeague(mls)
            addedLeagues.append("MLS")
        }
        
        // 사우디 프로 리그 추가 (ID: 307)
        if !leagueFollowService.isFollowing(leagueId: 307) {
            let saudiLeague = LeagueFollow(
                id: 307,
                name: "Pro League",
                logo: "https://media.api-sports.io/football/leagues/307.png",
                country: "Saudi Arabia",
                isDefault: false
            )
            leagueFollowService.followLeague(saudiLeague)
            addedLeagues.append("사우디 프로 리그")
        }
        
        // K리그2 추가 (ID: 293)
        if !leagueFollowService.isFollowing(leagueId: 293) {
            let kLeague2 = LeagueFollow(
                id: 293,
                name: "K League 2",
                logo: "https://media.api-sports.io/football/leagues/293.png",
                country: "South Korea",
                isDefault: false
            )
            leagueFollowService.followLeague(kLeague2)
            addedLeagues.append("K리그2")
        }
        
        if !addedLeagues.isEmpty {
            print("⚽ 다음 리그가 자동으로 추가되었습니다: \(addedLeagues.joined(separator: ", "))")
            
            // 일정 화면 새로고침 알림
            NotificationCenter.default.post(
                name: NSNotification.Name("LeagueFollowUpdated"),
                object: nil,
                userInfo: ["action": "follow"]
            )
        } else {
            print("⚽ MLS, 사우디 프로 리그, K리그2가 이미 팔로우되어 있습니다.")
        }
    }
}
