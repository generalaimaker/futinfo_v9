import Foundation
import SwiftUI

// HeadToHeadResponse는 FixturesResponse와 동일한 구조를 가지므로 별도로 정의하지 않고
// FixturesResponse를 사용합니다. (Fixture.swift 파일에 정의되어 있음)
// typealias HeadToHeadResponse = FixturesResponse

struct HeadToHeadStats {
    let totalMatches: Int
    let wins: Int
    let draws: Int
    let losses: Int
    let goalsFor: Int
    let goalsAgainst: Int
    
    // Fixture 타입 대신 [Any] 타입을 사용하여 컴파일 오류 해결
    init(fixtures: [Any], teamId: Int) {
        self.totalMatches = fixtures.count
        
        var wins = 0
        var draws = 0
        var losses = 0
        var goalsFor = 0
        var goalsAgainst = 0
        
        for fixtureAny in fixtures {
            // Dictionary로 변환하여 필요한 정보 추출
            guard let fixture = fixtureAny as? [String: Any],
                  let teams = fixture["teams"] as? [String: Any],
                  let home = teams["home"] as? [String: Any],
                  let away = teams["away"] as? [String: Any],
                  let homeId = home["id"] as? Int,
                  let _ = away["id"] as? Int, // 사용되지 않는 변수를 _로 대체
                  let goals = fixture["goals"] as? [String: Any?] else {
                continue
            }
            
            let homeGoals = goals["home"] as? Int ?? 0
            let awayGoals = goals["away"] as? Int ?? 0
            let isHome = homeId == teamId
            
            if isHome {
                goalsFor += homeGoals
                goalsAgainst += awayGoals
                
                if homeGoals > awayGoals {
                    wins += 1
                } else if homeGoals < awayGoals {
                    losses += 1
                } else {
                    draws += 1
                }
            } else {
                goalsFor += awayGoals
                goalsAgainst += homeGoals
                
                if awayGoals > homeGoals {
                    wins += 1
                } else if awayGoals < homeGoals {
                    losses += 1
                } else {
                    draws += 1
                }
            }
        }
        
        self.wins = wins
        self.draws = draws
        self.losses = losses
        self.goalsFor = goalsFor
        self.goalsAgainst = goalsAgainst
    }
    
    var winRate: Double {
        guard totalMatches > 0 else { return 0 }
        return Double(wins) / Double(totalMatches) * 100
    }
    
    var drawRate: Double {
        guard totalMatches > 0 else { return 0 }
        return Double(draws) / Double(totalMatches) * 100
    }
    
    var goalDifference: Int {
        goalsFor - goalsAgainst
    }
}
