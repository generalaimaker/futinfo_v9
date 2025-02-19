import SwiftUI

struct FormIndicator: View {
    let result: TeamForm.MatchResult
    
    private var color: Color {
        switch result {
        case .win: return .blue
        case .draw: return .gray
        case .loss: return .red
        }
    }
    
    var body: some View {
        Circle()
            .fill(color.opacity(0.2))
            .overlay(
                Text(result.text)
                    .font(.system(.caption2, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(color)
            )
            .frame(width: 24, height: 24)
    }
}
