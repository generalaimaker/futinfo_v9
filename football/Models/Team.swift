import Foundation

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
