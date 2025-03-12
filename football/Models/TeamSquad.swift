import Foundation
import SwiftUI

// MARK: - Squad Response
struct SquadResponse: Codable {
    let get: String
    let parameters: SquadParameters
    let errors: [String]
    let results: Int
    let paging: APIPaging
    let response: [TeamSquadResponse]
}

struct TeamSquadResponse: Codable {
    let team: Team
    let players: [SquadPlayer]
}

struct SquadPlayer: Codable {
    let id: Int
    let name: String
    let age: Int
    let number: Int
    let position: String
    let photo: String
}

// 기존 PlayerResponse 구조체를 유지하되 SquadPlayer를 사용하도록 변환하는 확장 추가
extension TeamSquadResponse {
    func toPlayerResponses() -> [PlayerResponse] {
        return players.map { player in
            let playerInfo = PlayerInfo(
                id: player.id,
                name: player.name,
                firstname: nil,
                lastname: nil,
                age: player.age,
                nationality: nil,
                height: nil,
                weight: nil,
                photo: player.photo,
                injured: nil,
                birth: nil
            )
            
            // 포지션 정보를 games.position에 매핑
            let games = PlayerGameStats(
                minutes: nil,
                number: player.number,
                position: player.position,
                rating: nil,
                captain: nil,
                substitute: nil,
                appearences: nil,
                lineups: nil
            )
            
            let stats = PlayerSeasonStats(
                team: team,
                league: nil,
                games: games,
                substitutes: nil,
                shots: nil,
                goals: nil,
                passes: nil,
                tackles: nil,
                duels: nil,
                dribbles: nil,
                fouls: nil,
                cards: nil,
                penalty: nil
            )
            
            return PlayerResponse(player: playerInfo, statistics: [stats])
        }
    }
}

struct PlayerResponse: Codable {
    let player: Player
    let statistics: [PlayerSeasonStats]
}

// MARK: - Player
typealias Player = PlayerInfo

// MARK: - Squad Group
struct SquadGroup: Identifiable {
    let position: String
    let players: [PlayerResponse]
    
    var id: String { position }
    
    static func groupPlayers(_ players: [PlayerResponse]) -> [SquadGroup] {
        let grouped = Dictionary(grouping: players) { player in
            player.statistics.first?.games?.position ?? "Unknown"
        }
        
        let positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"]
        
        return positionOrder.compactMap { position in
            guard let players = grouped[position] else { return nil }
            return SquadGroup(position: position, players: players)
        }
    }
}
