import SwiftUI

struct StatisticItem: View {
    let title: String
    let leftValue: String
    let rightValue: String
    let homeTeam: Team?
    let awayTeam: Team?
    let showProgressBar: Bool
    
    init(
        title: String,
        leftValue: String,
        rightValue: String,
        homeTeam: Team? = nil,
        awayTeam: Team? = nil,
        showProgressBar: Bool = false
    ) {
        self.title = title
        self.leftValue = leftValue
        self.rightValue = rightValue
        self.homeTeam = homeTeam
        self.awayTeam = awayTeam
        self.showProgressBar = showProgressBar
    }
    
    private var leftNumericValue: Double {
        Double(leftValue.replacingOccurrences(of: "%", with: "")) ?? 0
    }
    
    private var rightNumericValue: Double {
        Double(rightValue.replacingOccurrences(of: "%", with: "")) ?? 0
    }
    
    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 0) {
                Text(leftValue)
                    .font(.system(.title2, design: .rounded))
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
                    .frame(width: 100, alignment: .trailing)
                
                Text(title)
                    .font(.system(.body))
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
                
                Text(rightValue)
                    .font(.system(.title2, design: .rounded))
                    .fontWeight(.semibold)
                    .foregroundColor(.red)
                    .frame(width: 100, alignment: .leading)
            }
            
            if showProgressBar {
                ProgressBar(
                    leftValue: leftNumericValue,
                    rightValue: rightNumericValue,
                    leftColor: .blue,
                    rightColor: .red
                )
                .padding(.horizontal, 40)
            }
        }
        .padding(.vertical, 8)
    }
}
