import SwiftUI

struct StatisticItem: View {
    let title: String
    let leftValue: String
    let rightValue: String
    let homeTeam: Team?
    let awayTeam: Team?
    
    init(
        title: String,
        leftValue: String,
        rightValue: String,
        homeTeam: Team? = nil,
        awayTeam: Team? = nil
    ) {
        self.title = title
        self.leftValue = leftValue
        self.rightValue = rightValue
        self.homeTeam = homeTeam
        self.awayTeam = awayTeam
    }
    
    var body: some View {
        HStack(spacing: 0) {
            Text(leftValue)
                .font(.system(.title, design: .rounded))
                .fontWeight(.semibold)
                .foregroundColor(.blue)
                .frame(width: 100, alignment: .trailing)
            
            Text(title)
                .font(.system(.body))
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity)
                .multilineTextAlignment(.center)
            
            Text(rightValue)
                .font(.system(.title, design: .rounded))
                .fontWeight(.semibold)
                .foregroundColor(.red)
                .frame(width: 100, alignment: .leading)
        }
        .padding(.vertical, 8)
    }
}
