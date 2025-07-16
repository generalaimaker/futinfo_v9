import Foundation
import SwiftUI

// MARK: - Squad Response
struct SquadResponse: Codable, APIErrorCheckable {
    let get: String
    let parameters: SquadParameters
    let errors: Any
    let results: Int
    let paging: APIPaging
    let response: [TeamSquadResponse]
    
    // 디코딩 오류 디버깅을 위한 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        get = try container.decode(String.self, forKey: .get)
        parameters = try container.decode(SquadParameters.self, forKey: .parameters)
        
        // errors 필드 디코딩 (Any 타입으로 변경)
        if let errorArray = try? container.decode([String].self, forKey: .errors) {
            errors = errorArray
        } else if let errorDict = try? container.decode([String: String].self, forKey: .errors) {
            errors = errorDict
        } else {
            errors = []
        }
        
        results = try container.decode(Int.self, forKey: .results)
        paging = try container.decode(APIPaging.self, forKey: .paging)
        
        // response 필드 디코딩 시도
        do {
            response = try container.decode([TeamSquadResponse].self, forKey: .response)
            print("✅ SquadResponse: 배열로 디코딩 성공 (\(response.count)개 항목)")
        } catch {
            print("❌ SquadResponse 디코딩 오류: \(error)")
            
            // 단일 객체로 디코딩 시도
            if let singleResponse = try? container.decode(TeamSquadResponse.self, forKey: .response) {
                response = [singleResponse]
                print("✅ SquadResponse: 단일 객체를 배열로 변환")
            } else {
                // 빈 배열 생성
                response = []
                print("⚠️ SquadResponse: 빈 배열 생성")
            }
        }
    }
    
    // 사용자 정의 인코더 추가
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(get, forKey: .get)
        try container.encode(parameters, forKey: .parameters)
        
        // errors 필드 인코딩
        if let errorArray = errors as? [String] {
            try container.encode(errorArray, forKey: .errors)
        } else if let errorDict = errors as? [String: String] {
            try container.encode(errorDict, forKey: .errors)
        } else {
            try container.encode([] as [String], forKey: .errors)
        }
        
        try container.encode(results, forKey: .results)
        try container.encode(paging, forKey: .paging)
        try container.encode(response, forKey: .response)
    }
    
    // CodingKeys 열거형 추가
    private enum CodingKeys: String, CodingKey {
        case get, parameters, errors, results, paging, response
    }
}

// MARK: - TeamSquadResponse
struct TeamSquadResponse: Codable {
    let team: Team
    let players: [FootballSquadPlayer]
}

struct TeamSquadData: Codable {
    let team: Team
    let players: [FootballSquadPlayer]
    
    // 디코딩 오류 처리를 위한 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        team = try container.decode(Team.self, forKey: .team)
        
        // players 배열 디코딩 시도
        do {
            players = try container.decode([FootballSquadPlayer].self, forKey: .players)
        } catch {
            print("⚠️ TeamSquadResponse players 디코딩 오류: \(error)")
            
            // 빈 배열로 초기화
            players = []
        }
    }
}

struct FootballSquadPlayer: Codable {
    let id: Int
    let name: String
    let age: Int
    let number: Int?
    let position: String
    let photo: String
    
    // 디코딩 오류 처리를 위한 사용자 정의 디코더 추가
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        age = try container.decode(Int.self, forKey: .age)
        position = try container.decode(String.self, forKey: .position)
        photo = try container.decode(String.self, forKey: .photo)
        
        // number 필드가 null인 경우 처리
        number = try? container.decode(Int.self, forKey: .number)
    }
}

// 기존 PlayerResponse 구조체를 유지하되 SquadPlayer를 사용하도록 변환하는 확장 추가
extension TeamSquadResponse {
    func toPlayerResponses() -> [SquadPlayerResponse] {
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
            
            return SquadPlayerResponse(player: playerInfo, statistics: [stats])
        }
    }
}

struct SquadPlayerResponse: Codable {
    let player: Player
    let statistics: [PlayerSeasonStats]
}

// MARK: - Player
typealias Player = PlayerInfo

// MARK: - Squad Group
struct SquadGroup: Identifiable {
    let position: String
    let players: [SquadPlayerResponse]
    
    var id: String { position }
    
    static func groupPlayers(_ players: [SquadPlayerResponse]) -> [SquadGroup] {
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
