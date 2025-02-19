import SwiftUI

struct StatRow: View {
    let title: String
    let homeValue: String
    let awayValue: String
    let homeTeam: Team
    let awayTeam: Team
    
    var body: some View {
        HStack {
            Text(homeValue)
                .font(.system(.title2, design: .rounded))
                .fontWeight(.semibold)
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
            
            Text(title)
                .font(.subheadline)
                .foregroundColor(.gray)
                .frame(maxWidth: .infinity)
            
            Text(awayValue)
                .font(.system(.title2, design: .rounded))
                .fontWeight(.semibold)
                .foregroundColor(.red)
                .frame(maxWidth: .infinity)
        }
    }
}
