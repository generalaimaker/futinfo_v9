import SwiftUI
import Kingfisher

@main
struct footballApp: App {
    init() {
        // Kingfisher 캐시 설정
        setupKingfisher()
        
        // 주요 팀 로고 프리페치
        prefetchMainTeamLogos()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
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
}
