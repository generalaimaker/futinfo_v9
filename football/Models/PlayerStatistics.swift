import Foundation

// MARK: - Player Statistics Response
struct PlayerStatisticsResponse: Codable {
    let get: String
    let parameters: TopScorersParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: [PlayerProfileData]
}

// MARK: - Top Scorers Parameters
struct TopScorersParameters: Codable {
    let league: String
    let season: String
}
