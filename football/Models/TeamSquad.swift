import Foundation
import SwiftUI

// MARK: - Squad Response
struct SquadResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [PlayerResponse]
}

struct PlayerResponse: Codable {
    let player: Player
    let statistics: [PlayerSeasonStats]
}

// MARK: - Player
typealias Player = PlayerInfo

// MARK: - Squad Response

// MARK: - Squad Group
struct SquadGroup: Identifiable {
    let position: String
    let players: [PlayerResponse]
    
    var id: String { position }
    
    static func groupPlayers(_ players: [PlayerResponse]) -> [SquadGroup] {
        let grouped = Dictionary(grouping: players) { player in
            player.statistics.first?.games.position ?? "Unknown"
        }
        
        let positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"]
        
        return positionOrder.compactMap { position in
            guard let players = grouped[position] else { return nil }
            return SquadGroup(position: position, players: players)
        }
    }
}