import SwiftUI
import Foundation

// TeamForm 타입 직접 사용
typealias MatchResult = TeamForm.MatchResult

struct FormIndicator: View {
    private let displayText: String
    private let resultType: ResultType
    
    init(result: String) {
        self.displayText = result
        self.resultType = .string(result)
    }
    
    init(result: MatchResult) {
        self.displayText = result.text
        self.resultType = .matchResult(result)
    }
    
    private enum ResultType {
        case string(String)
        case matchResult(MatchResult)
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
        RoundedRectangle(cornerRadius: 6)
            .fill(color)
            .overlay(
                Text(displayText)
                    .font(.system(.caption, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            )
            .frame(width: 28, height: 28)
            .shadow(color: color.opacity(0.3), radius: 2, x: 0, y: 1)
    }
}
