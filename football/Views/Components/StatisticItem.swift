import SwiftUI


public struct StatisticItem: View {
    public let title: String
    public let leftValue: String
    public let rightValue: String
    public let homeTeam: Team?
    public let awayTeam: Team?
    public let showProgressBar: Bool
    public let showPercentage: Bool
    
    public init(
        title: String,
        leftValue: String,
        rightValue: String,
        homeTeam: Team? = nil,
        awayTeam: Team? = nil,
        showProgressBar: Bool = false,
        showPercentage: Bool = false
    ) {
        self.title = title
        self.leftValue = leftValue
        self.rightValue = rightValue
        self.homeTeam = homeTeam
        self.awayTeam = awayTeam
        self.showProgressBar = showProgressBar
        self.showPercentage = showPercentage
    }
    
    private var leftNumericValue: Double {
        Double(leftValue.replacingOccurrences(of: "%", with: "")) ?? 0
    }
    
    private var rightNumericValue: Double {
        Double(rightValue.replacingOccurrences(of: "%", with: "")) ?? 0
    }
    
    private var leftPercentage: String {
        let total = leftNumericValue + rightNumericValue
        guard total > 0 else { return "0%" }
        return String(format: "%.0f%%", (leftNumericValue / total) * 100)
    }
    
    private var rightPercentage: String {
        let total = leftNumericValue + rightNumericValue
        guard total > 0 else { return "0%" }
        return String(format: "%.0f%%", (rightNumericValue / total) * 100)
    }
    
    public var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 0) {
                HStack {
                    Spacer()
                    if showPercentage {
                        Text(leftPercentage)
                            .font(.system(.subheadline, design: .rounded))
                            .foregroundColor(.gray)
                            .padding(.trailing, 4)
                    }
                    Text(leftValue)
                        .font(.system(.title2, design: .rounded))
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }
                .frame(width: 100)
                
                Text(title)
                    .font(.system(.body))
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
                
                HStack {
                    Text(rightValue)
                        .font(.system(.title2, design: .rounded))
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                    if showPercentage {
                        Text(rightPercentage)
                            .font(.system(.subheadline, design: .rounded))
                            .foregroundColor(.gray)
                            .padding(.leading, 4)
                    }
                    Spacer()
                }
                .frame(width: 100)
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
