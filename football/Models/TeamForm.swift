import Foundation

struct TeamForm: Codable {
    let teamId: Int
    let results: [MatchResult]
    
    enum MatchResult: String, Codable, Hashable {
        case win = "W"
        case draw = "D"
        case loss = "L"
        
        var text: String {
            switch self {
            case .win: return "승"
            case .draw: return "무"
            case .loss: return "패"
            }
        }
    }
}
