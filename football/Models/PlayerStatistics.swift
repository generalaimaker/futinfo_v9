import Foundation

// MARK: - Player Statistics Response
struct PlayerStatisticsResponse: Codable {
    let get: String
    let parameters: PlayerStatisticsParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: [PlayerProfileData]
}
