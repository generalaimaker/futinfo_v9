import SwiftUI

struct FormIndicator: View {
    private let displayText: String
    private let resultType: ResultType
    
    init(result: String) {
        self.displayText = result
        self.resultType = .string(result)
    }
    
    init(result: TeamForm.MatchResult) {
        self.displayText = result.text
        self.resultType = .matchResult(result)
    }
    
    private enum ResultType {
        case string(String)
        case matchResult(TeamForm.MatchResult)
    }
    
    private var color: Color {
        switch resultType {
        case .string(let str):
            switch str.uppercased() {
            case "W": return .blue
            case "D": return .gray
            case "L": return .red
            default: return .gray
            }
        case .matchResult(let result):
            switch result {
            case .win: return .blue
            case .draw: return .gray
            case .loss: return .red
            }
        }
    }
    
    var body: some View {
        Circle()
            .fill(color.opacity(0.2))
            .overlay(
                Text(displayText)
                    .font(.system(.caption2, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(color)
            )
            .frame(width: 24, height: 24)
    }
}
