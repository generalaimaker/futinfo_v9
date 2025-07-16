import Foundation

class BundesligaFixService {
    static let shared = BundesligaFixService()
    
    // 분데스리가 정확한 10개 팀 (커뮤니티용)
    private let bundesligaTop10 = [
        (168, "Bayer Leverkusen"),
        (172, "VfB Stuttgart"),
        (157, "Bayern Munich"),
        (165, "Borussia Dortmund"),
        (160, "Eintracht Frankfurt"),
        (167, "VfL Wolfsburg"),
        (173, "Borussia M.Gladbach"),
        (182, "Union Berlin"),
        (162, "Werder Bremen"),
        (169, "RB Leipzig")
    ]
    
    func fixBundesligaCommunity() async throws {
        let supabase = SupabaseService.shared
        
        print("🔧 분데스리가 커뮤니티 팀 수정 시작")
        
        // 1. 현재 분데스리가 게시판 확인
        struct BoardResponse: Decodable {
            let id: String
            let name: String
            let type: String
            let team_id: String?
            let league_id: String?
        }
        
        let response = try await supabase.client
            .from("boards")
            .select()
            .eq("league_id", value: "78")
            .eq("type", value: "team")
            .execute()
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let boards = try decoder.decode([BoardResponse].self, from: response.data)
        
        print("📊 현재 분데스리가 게시판 수: \(boards.count)")
        
        // 현재 있는 팀 ID들
        let existingTeamIds = boards.compactMap { board -> Int? in
            if let teamIdStr = board.team_id,
               let teamId = Int(teamIdStr) {
                return teamId
            }
            return nil
        }
        
        print("📋 현재 팀들: \(existingTeamIds)")
        
        // 2. 누락된 팀 찾기
        let missingTeams = bundesligaTop10.filter { team in
            !existingTeamIds.contains(team.0)
        }
        
        print("❌ 누락된 팀 수: \(missingTeams.count)")
        for team in missingTeams {
            print("  - \(team.1) (ID: \(team.0))")
        }
        
        // 3. 누락된 팀 추가
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
        
        for team in missingTeams {
            let boardData = BoardInsert(
                id: "team_\(team.0)",
                name: "\(team.1) 게시판",
                description: "\(team.1) 팬들을 위한 게시판",
                type: "team",
                team_id: String(team.0),
                league_id: "78",
                icon_url: "https://media.api-sports.io/football/teams/\(team.0).png",
                member_count: 0,
                post_count: 0,
                created_at: ISO8601DateFormatter().string(from: Date())
            )
            
            try await supabase.client
                .from("boards")
                .insert(boardData)
                .execute()
            
            print("✅ \(team.1) 게시판 추가 완료")
        }
        
        // 4. 잘못된 팀 제거 (10개 팀에 없는 팀)
        let validTeamIds = bundesligaTop10.map { $0.0 }
        let invalidBoards = boards.filter { board in
            if let teamIdStr = board.team_id,
               let teamId = Int(teamIdStr) {
                return !validTeamIds.contains(teamId)
            }
            return false
        }
        
        if !invalidBoards.isEmpty {
            print("🗑️ 잘못된 팀 \(invalidBoards.count)개 제거")
            for board in invalidBoards {
                try await supabase.client
                    .from("boards")
                    .delete()
                    .eq("id", value: board.id)
                    .execute()
            }
        }
        
        print("🎉 분데스리가 커뮤니티 10개 팀 설정 완료!")
    }
}