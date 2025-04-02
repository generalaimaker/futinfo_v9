import Foundation

struct HeadToHeadResponse: Codable {
    let get: String
    let parameters: ResponseParameters
    let errors: [String]
    let results: Int
    let paging: ResponsePaging
    let response: [Fixture]  // 기존 Fixture 모델 재사용
}

struct HeadToHeadStats {
    let totalMatches: Int
    let wins: Int
    let draws: Int
    let losses: Int
    let goalsFor: Int
    let goalsAgainst: Int
    
    init(fixtures: [Fixture], teamId: Int) {
        self.totalMatches = fixtures.count
        
        var wins = 0
        var draws = 0
        var losses = 0
        var goalsFor = 0
        var goalsAgainst = 0
        
        for fixture in fixtures {
            let isHome = fixture.teams.home.id == teamId
            let homeGoals = fixture.goals?.home ?? 0
            let awayGoals = fixture.goals?.away ?? 0
            
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
    
    var goalDifference: Int {
        goalsFor - goalsAgainst
    }
}