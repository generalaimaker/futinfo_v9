import SwiftUI

struct LeagueTabItem: View {
    let leagueId: Int
    let isSelected: Bool
    
    private var leagueLogo: String {
        switch leagueId {
        case 39:
            return "https://media.api-sports.io/football/leagues/39.png"
        case 140:
            return "https://media.api-sports.io/football/leagues/140.png"
        case 135:
            return "https://media.api-sports.io/football/leagues/135.png"
        case 78:
            return "https://media.api-sports.io/football/leagues/78.png"
        case 2:
            return "https://media.api-sports.io/football/leagues/2.png"
        case 3:
            return "https://media.api-sports.io/football/leagues/3.png"
        default:
            return ""
        }
    }
    
    private var leagueName: String {
        switch leagueId {
        case 39:
            return "Premier League"
        case 140:
            return "La Liga"
        case 135:
            return "Serie A"
        case 78:
            return "Bundesliga"
        case 2:
            return "Champions League"
        case 3:
            return "Europa League"
        default:
            return ""
        }
    }
    
    var body: some View {
        VStack(spacing: 8) {
            AsyncImage(url: URL(string: leagueLogo)) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt")
                    .foregroundColor(.gray)
            }
            .frame(width: 30, height: 30)
            
            Text(leagueName)
                .font(.caption)
                .foregroundColor(isSelected ? .blue : .gray)
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isSelected ? Color.blue.opacity(0.1) : Color.clear)
        )
    }
}