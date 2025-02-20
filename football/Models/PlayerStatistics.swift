import Foundation
import SwiftUI

// MARK: - Player Statistics Response


// MARK: - Player Statistics Response
struct PlayerStatisticsResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [PlayerStats]
}

struct PlayerStats: Codable {
    let player: PlayerInfo
    let statistics: [PlayerSeasonStats]
}
