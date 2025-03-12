import Foundation

public struct APIPaging: Codable {
    public let current: Int
    public let total: Int
    
    public init(current: Int, total: Int) {
        self.current = current
        self.total = total
    }
}

public struct TeamParameters: Codable {
    public let id: String
    
    public init(id: String) {
        self.id = id
    }
}

public struct TeamStatisticsParameters: Codable {
    public let team: String
    public let league: String
    public let season: String
    
    public init(team: String, league: String, season: String) {
        self.team = team
        self.league = league
        self.season = season
    }
}

public struct SquadParameters: Codable {
    public let team: String
    
    public init(team: String) {
        self.team = team
    }
}

public struct PlayerProfileParameters: Codable {
    public let id: String
    public let season: String
    
    public init(id: String, season: String) {
        self.id = id
        self.season = season
    }
}

public struct PlayerParameters: Codable {
    public let player: String
    
    public init(player: String) {
        self.player = player
    }
}

public struct PlayerStatisticsParameters: Codable {
    public let id: String
    public let season: String?
    
    public init(id: String, season: String?) {
        self.id = id
        self.season = season
    }
}
