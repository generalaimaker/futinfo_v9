import Foundation

// MARK: - Team Trophy Response
struct TeamTrophyResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [TeamTrophy]
}

struct TeamTrophy: Codable, Identifiable {
    let league: String
    let country: String
    let season: String
    let place: String
    
    var id: String { "\(league)-\(season)-\(place)" }
}

// MARK: - Team History
struct TeamHistory {
    let season: Int
    let leagueId: Int
    let statistics: TeamSeasonStatistics
    let standing: TeamStanding?
    
    var seasonDisplay: String {
        "\(season)-\((season + 1) % 100)"
    }
    
    var leaguePosition: String {
        standing?.rank.description ?? "N/A"
    }
    
    var winRate: Double {
        guard let fixtures = statistics.fixtures else { return 0 }
        let totalGames = fixtures.played.total
        return totalGames > 0 ? Double(fixtures.wins.total) / Double(totalGames) * 100 : 0
    }
    
    var goalsPerGame: Double {
        guard let goals = statistics.goals else { return 0 }
        let totalGames = statistics.fixtures?.played.total ?? 0
        return totalGames > 0 ? Double(goals.for.total.total) / Double(totalGames) : 0
    }
    
    var cleanSheetRate: Double {
        guard let cleanSheets = statistics.clean_sheets,
              let totalGames = statistics.fixtures?.played.total,
              totalGames > 0
        else { return 0 }
        return Double(cleanSheets.total) / Double(totalGames) * 100
    }
}