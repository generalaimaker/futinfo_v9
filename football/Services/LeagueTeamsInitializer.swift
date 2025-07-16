import Foundation

class LeagueTeamsInitializer {
    static let shared = LeagueTeamsInitializer()
    
    // 각 리그별 정확한 10개 팀
    private let leagueTeams: [Int: [(id: Int, name: String)]] = [
        // 프리미어리그
        39: [
            (33, "Man United"), (50, "Man City"), (40, "Liverpool"), (49, "Chelsea"),
            (42, "Arsenal"), (47, "Tottenham"), (48, "West Ham"), (34, "Newcastle"),
            (66, "Aston Villa"), (51, "Brighton")
        ],
        // 라리가
        140: [
            (541, "Real Madrid"), (529, "Barcelona"), (530, "Atletico Madrid"), (531, "Athletic Bilbao"),
            (548, "Real Sociedad"), (532, "Valencia"), (536, "Sevilla"), (543, "Real Betis"),
            (533, "Villarreal"), (538, "Celta Vigo")
        ],
        // 분데스리가
        78: [
            (168, "Bayer Leverkusen"), (172, "VfB Stuttgart"), (157, "Bayern Munich"), (165, "Borussia Dortmund"),
            (160, "Eintracht Frankfurt"), (167, "VfL Wolfsburg"), (173, "Borussia M.Gladbach"), (182, "Union Berlin"),
            (162, "Werder Bremen"), (169, "RB Leipzig")
        ],
        // 세리에 A
        135: [
            (497, "Juventus"), (489, "AC Milan"), (496, "Inter"), (505, "Roma"),
            (502, "Napoli"), (499, "Lazio"), (487, "Fiorentina"), (503, "Torino"),
            (492, "Atalanta"), (495, "Genoa")
        ],
        // 리그 1
        61: [
            (85, "PSG"), (106, "Monaco"), (81, "Marseille"), (80, "Lyon"),
            (96, "Saint-Etienne"), (83, "Nantes"), (78, "Bordeaux"), (91, "Lille"),
            (84, "Nice"), (93, "Strasbourg")
        ]
    ]
    
    func initializeAllLeagues() async throws {
        print("🚀 모든 리그 팀 초기화 시작")
        
        for (leagueId, teams) in leagueTeams {
            let leagueName = getLeagueName(leagueId)
            print("\n📋 \(leagueName) 초기화 중...")
            
            try await initializeLeague(leagueId: leagueId, teams: teams)
            
            // 각 리그 처리 후 잠시 대기
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5초
        }
        
        print("\n✅ 모든 리그 팀 초기화 완료!")
    }
    
    private func initializeLeague(leagueId: Int, teams: [(id: Int, name: String)]) async throws {
        let supabase = SupabaseService.shared
        
        // 1. 기존 게시판 삭제
        print("  🗑️ 기존 게시판 삭제 중...")
        
        // 해당 리그의 모든 팀 게시판 삭제
        try await supabase.client
            .from("boards")
            .delete()
            .eq("league_id", value: String(leagueId))
            .eq("type", value: "team")
            .execute()
        
        // 2. 새 게시판 생성
        print("  ➕ 10개 팀 게시판 생성 중...")
        
        struct BoardInsert: Encodable {
            let id: String
            let name: String
            let description: String
            let type: String
            let team_id: String
            let league_id: String
            let icon_url: String
            let member_count: Int
            let post_count: Int
            let created_at: String
        }
        
        for (index, team) in teams.enumerated() {
            let boardData = BoardInsert(
                id: "team_\(team.id)",
                name: "\(team.name) 게시판",
                description: "\(team.name) 팬들을 위한 게시판",
                type: "team",
                team_id: String(team.id),
                league_id: String(leagueId),
                icon_url: "https://media.api-sports.io/football/teams/\(team.id).png",
                member_count: 0,
                post_count: 0,
                created_at: ISO8601DateFormatter().string(from: Date())
            )
            
            try await supabase.client
                .from("boards")
                .insert(boardData)
                .execute()
            
            print("    ✓ \(index + 1)/10: \(team.name)")
        }
        
        print("  ✅ \(getLeagueName(leagueId)) 10개 팀 설정 완료")
    }
    
    private func getLeagueName(_ leagueId: Int) -> String {
        switch leagueId {
        case 39: return "프리미어리그"
        case 140: return "라리가"
        case 78: return "분데스리가"
        case 135: return "세리에 A"
        case 61: return "리그 1"
        default: return "리그 \(leagueId)"
        }
    }
    
    // 특정 리그만 초기화
    func initializeBundesligaAndLigue1() async throws {
        print("🔧 분데스리가와 리그 1 수정")
        
        // 분데스리가
        if let bundesligaTeams = leagueTeams[78] {
            try await initializeLeague(leagueId: 78, teams: bundesligaTeams)
        }
        
        // 리그 1
        if let ligue1Teams = leagueTeams[61] {
            try await initializeLeague(leagueId: 61, teams: ligue1Teams)
        }
        
        print("\n✅ 분데스리가와 리그 1 수정 완료!")
    }
}