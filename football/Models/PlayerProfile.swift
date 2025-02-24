import Foundation

// MARK: - Player Profile Data
struct PlayerProfileData: Codable {
    let player: PlayerInfo      // 기존 PlayerInfo 모델 재사용
    let statistics: [PlayerSeasonStats]?  // API 응답의 statistics 배열과 일치 (옵셔널)
}

// MARK: - Player Career Stats
struct PlayerCareerStats: Codable, Identifiable {
    let team: Team
    let seasons: [Int]
    
    var id: Int { team.id }
    
    var period: String {
        if seasons.isEmpty {
            return "현재"
        }
        let sortedSeasons = seasons.sorted()
        if sortedSeasons.count == 1 {
            return "\(sortedSeasons[0])"
        }
        return "\(sortedSeasons.first!)-\(sortedSeasons.last!)"
    }
    
    var appearances: String {
        "\(seasons.count)시즌"
    }
}

// MARK: - API Response Models
struct PlayerProfileResponse: Codable {
    let get: String
    let parameters: PlayerProfileParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: [PlayerProfileData]
}

struct PlayerCareerResponse: Codable {
    let get: String
    let parameters: PlayerParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: [CareerTeamResponse]
}

struct CareerTeamResponse: Codable {
    let team: Team
    let seasons: [Int]
}

struct PlayerSeasonalStatsResponse: Codable {
    let get: String
    let parameters: PlayerProfileParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: [PlayerSeasonStats]
}
