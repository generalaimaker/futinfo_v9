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
    
    let avgGoalsFor: Double
    let avgGoalsAgainst: Double
    
    /// `fixtures` must be an array of `Fixture` objects (API‑Football 모델).
    init(fixtures: [Fixture], teamId: Int) {
        self.totalMatches = fixtures.count
        
        var wins      = 0
        var draws     = 0
        var losses    = 0
        var goalsFor  = 0
        var goalsAgainst = 0
        
        for fx in fixtures {
            // 골 정보가 없으면 스킵
            guard let homeGoals = fx.goals?.home,
                  let awayGoals = fx.goals?.away else { continue }
            
            let isHomeTeam = fx.teams.home.id == teamId
            
            let myGoals  = isHomeTeam ? homeGoals : awayGoals
            let oppGoals = isHomeTeam ? awayGoals : homeGoals
            
            goalsFor     += myGoals
            goalsAgainst += oppGoals
            
            if myGoals > oppGoals {
                wins += 1
            } else if myGoals == oppGoals {
                draws += 1
            } else {
                losses += 1
            }
        }
        
        self.wins         = wins
        self.draws        = draws
        self.losses       = losses
        self.goalsFor     = goalsFor
        self.goalsAgainst = goalsAgainst
        
        self.avgGoalsFor     = fixtures.isEmpty ? 0 : Double(goalsFor)     / Double(fixtures.count)
        self.avgGoalsAgainst = fixtures.isEmpty ? 0 : Double(goalsAgainst) / Double(fixtures.count)
    }
    
    var winRate: Double {
        guard totalMatches > 0 else { return 0 }
        return Double(wins) / Double(totalMatches) * 100
    }
    
    var drawRate: Double {
        guard totalMatches > 0 else { return 0 }
        return Double(draws) / Double(totalMatches) * 100
    }
    
    var lossRate: Double {
        guard totalMatches > 0 else { return 0 }
        return Double(losses) / Double(totalMatches) * 100
    }
    
    var goalDifference: Int {
        goalsFor - goalsAgainst
    }
}
