import Foundation

extension Array where Element == Fixture {
    
    /// 경기 상태별 우선순위 정렬
    func sortedByPriority() -> [Fixture] {
        return self.sorted { fixture1, fixture2 in
            // 1. 라이브 경기 최우선
            let live1 = fixture1.isLive
            let live2 = fixture2.isLive
            
            if live1 != live2 {
                return live1 // 라이브 경기가 위로
            }
            
            // 2. 경기 상태별 우선순위
            let priority1 = fixture1.statusPriority
            let priority2 = fixture2.statusPriority
            
            if priority1 != priority2 {
                return priority1 < priority2
            }
            
            // 3. 리그 우선순위
            let leaguePriority1 = fixture1.leaguePriority
            let leaguePriority2 = fixture2.leaguePriority
            
            if leaguePriority1 != leaguePriority2 {
                return leaguePriority1 < leaguePriority2
            }
            
            // 4. 시간순 정렬
            return fixture1.fixture.date < fixture2.fixture.date
        }
    }
    
    /// 리그별로 그룹화
    func groupedByLeague() -> [(league: LeagueFixtureInfo, fixtures: [Fixture])] {
        let grouped = Dictionary(grouping: self) { $0.league.id }
        
        return grouped.map { leagueId, fixtures in
            (league: fixtures[0].league, fixtures: fixtures.sortedByPriority())
        }.sorted { $0.league.priority < $1.league.priority }
    }
}

extension Fixture {
    
    /// 라이브 경기 여부
    var isLive: Bool {
        return ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"].contains(fixture.status.short)
    }
    
    /// 경기 상태 우선순위
    var statusPriority: Int {
        switch fixture.status.short {
        case "LIVE", "1H", "2H": return 0  // 진행중
        case "HT": return 1                 // 하프타임
        case "ET", "P", "BT": return 2      // 연장/승부차기
        case "SUSP", "INT": return 3        // 중단
        case "FT", "AET", "PEN": return 4   // 종료
        case "NS": return 5                  // 예정
        case "TBD": return 6                 // 미정
        case "PST": return 7                 // 연기
        case "CANC": return 8                // 취소
        case "ABD": return 9                 // 포기
        case "AWD": return 10                // 몰수
        case "WO": return 11                 // 부전승
        default: return 99
        }
    }
    
    /// 리그 우선순위
    var leaguePriority: Int {
        // 메이저 리그 우선순위
        let majorLeagues = [
            2,   // 챔피언스리그
            3,   // 유로파리그
            39,  // 프리미어리그
            140, // 라리가
            135, // 세리에A
            78,  // 분데스리가
            61,  // 리그1
            292, // K리그1
        ]
        
        if let index = majorLeagues.firstIndex(of: league.id) {
            return index
        }
        
        // 국가별 우선순위
        switch league.country {
        case "South Korea": return 100
        case "England": return 200
        case "Spain": return 201
        case "Italy": return 202
        case "Germany": return 203
        case "France": return 204
        default: return 999
        }
    }
}

extension LeagueFixtureInfo {
    /// 리그 우선순위
    var priority: Int {
        let majorLeagues = [
            2,   // 챔피언스리그
            3,   // 유로파리그  
            39,  // 프리미어리그
            140, // 라리가
            135, // 세리에A
            78,  // 분데스리가
            61,  // 리그1
            292, // K리그1
        ]
        
        if let index = majorLeagues.firstIndex(of: id) {
            return index
        }
        
        return 999
    }
}