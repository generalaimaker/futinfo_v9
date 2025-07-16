import Foundation

// MARK: - Team
public struct Team: Codable, Hashable, Identifiable {
    public let id: Int
    public let name: String
    public let logo: String
    public let winner: Bool?

    // Nested color structs to decode team kit colors from API
    public struct ColorSet: Codable, Hashable {
        public let primary: String?
        public let number: String?
        public let border: String?
    }

    public struct TeamColors: Codable, Hashable {
        public let player: ColorSet?
        public let goalkeeper: ColorSet?
    } 

    /// Optional kit colors information (player / goalkeeper).
    public let colors: TeamColors?
    
    public init(id: Int,
                name: String,
                logo: String,
                winner: Bool? = nil,
                colors: TeamColors? = nil) {
        self.id = id
        self.name = name
        self.logo = logo
        self.winner = winner
        self.colors = colors
    }
}
