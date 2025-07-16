import Foundation

@MainActor
class ForceFixLeagueTeams {
    static func fixNow() async {
        print("🚨 강제 리그 팀 수정 시작")
        
        let service = SupabaseCommunityService.shared
        let supabase = SupabaseService.shared
        
        // 분데스리가 10개 팀
        let bundesligaTeams = [
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
        
        // 리그 1 10개 팀
        let ligue1Teams = [
            (85, "PSG"),
            (106, "Monaco"),
            (81, "Marseille"),
            (80, "Lyon"),
            (96, "Saint-Etienne"),
            (83, "Nantes"),
            (78, "Bordeaux"),
            (91, "Lille"),
            (84, "Nice"),
            (93, "Strasbourg")
        ]
        
        do {
            // 1. 분데스리가 처리
            print("\n🇩🇪 분데스리가 처리 중...")
            
            // 모든 분데스리가 관련 삭제
            for teamId in 150...190 {
                _ = try? await supabase.client
                    .from("boards")
                    .delete()
                    .eq("team_id", value: String(teamId))
                    .execute()
            }
            
            _ = try? await supabase.client
                .from("boards")
                .delete()
                .eq("league_id", value: "78")
                .execute()
            
            // 잠시 대기
            try await Task.sleep(nanoseconds: 1_000_000_000)
            
            // 분데스리가 10개 팀 생성
            for team in bundesligaTeams {
                let board: [String: String] = [
                    "id": "team_\(team.0)",
                    "name": "\(team.1) 게시판",
                    "description": "\(team.1) 팬들을 위한 게시판",
                    "type": "team",
                    "team_id": String(team.0),
                    "league_id": "78",
                    "icon_url": "https://media.api-sports.io/football/teams/\(team.0).png",
                    "member_count": "0",
                    "post_count": "0",
                    "created_at": ISO8601DateFormatter().string(from: Date())
                ]
                
                try await supabase.client
                    .from("boards")
                    .insert(board)
                    .execute()
                    
                print("  ✅ \(team.1) 추가됨")
            }
            
            // 2. 리그 1 처리
            print("\n🇫🇷 리그 1 처리 중...")
            
            // 모든 리그 1 관련 삭제
            for teamId in 77...110 {
                _ = try? await supabase.client
                    .from("boards")
                    .delete()
                    .eq("team_id", value: String(teamId))
                    .execute()
            }
            
            _ = try? await supabase.client
                .from("boards")
                .delete()
                .eq("league_id", value: "61")
                .execute()
            
            // 잠시 대기
            try await Task.sleep(nanoseconds: 1_000_000_000)
            
            // 리그 1 10개 팀 생성
            for team in ligue1Teams {
                let board: [String: String] = [
                    "id": "team_\(team.0)",
                    "name": "\(team.1) 게시판",
                    "description": "\(team.1) 팬들을 위한 게시판",
                    "type": "team",
                    "team_id": String(team.0),
                    "league_id": "61",
                    "icon_url": "https://media.api-sports.io/football/teams/\(team.0).png",
                    "member_count": "0",
                    "post_count": "0",
                    "created_at": ISO8601DateFormatter().string(from: Date())
                ]
                
                try await supabase.client
                    .from("boards")
                    .insert(board)
                    .execute()
                    
                print("  ✅ \(team.1) 추가됨")
            }
            
            print("\n🎉 완료! 게시판 다시 로드 중...")
            
            // 3. 게시판 다시 로드
            try await Task.sleep(nanoseconds: 2_000_000_000)
            await service.loadBoards()
            
            print("✅ 모든 작업 완료!")
            
        } catch {
            print("❌ 오류 발생: \(error)")
        }
    }
}