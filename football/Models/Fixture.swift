import Foundation

// MARK: - Fixture Response
struct FixturesResponse: Codable {
    let get: String
    let parameters: Parameters
    let errors: [String]
    let results: Int
    let paging: Paging
    let response: [Fixture]
}

// MARK: - Fixture
struct Fixture: Codable, Identifiable, Hashable {
    let fixture: FixtureDetails
    let league: LeagueFixtureInfo
    let teams: Teams
    let goals: Goals?
    
    var id: Int { fixture.id }
    var date: String { fixture.date }
    var status: FixtureStatus { fixture.status }
    var venue: Venue { fixture.venue }
    
    // Hashable 구현
    func hash(into hasher: inout Hasher) {
        hasher.combine(fixture.id)
    }
    
    // Equatable 구현 (Hashable이 Equatable을 상속함)
    static func == (lhs: Fixture, rhs: Fixture) -> Bool {
        lhs.fixture.id == rhs.fixture.id
    }
}

// MARK: - League Fixture Info
struct LeagueFixtureInfo: Codable, Hashable {
    let id: Int
    let name: String
    let country: String
    let logo: String
    let flag: String?
    let season: Int
    let round: String
    let standings: Bool?
}

// MARK: - Fixture Details
struct FixtureDetails: Codable, Hashable {
    let id: Int
    let date: String
    let status: FixtureStatus
    let venue: Venue
    let timezone: String
    let referee: String?
}

// MARK: - Status
struct FixtureStatus: Codable, Hashable {
    let long: String
    let short: String
    let elapsed: Int?
}

// MARK: - Venue
struct Venue: Codable, Hashable {
    let id: Int?
    let name: String?
    let city: String?
}

// MARK: - Teams
struct Teams: Codable, Hashable {
    let home: Team
    let away: Team
}

// MARK: - Team
public struct Team: Codable, Hashable {
    public let id: Int
    public let name: String
    public let logo: String
    public let winner: Bool?
    
    public init(id: Int, name: String, logo: String, winner: Bool? = nil) {
        self.id = id
        self.name = name
        self.logo = logo
        self.winner = winner
    }
}

// MARK: - Goals
struct Goals: Codable, Hashable {
    let home: Int?
    let away: Int?
}
