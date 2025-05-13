import SwiftUI

struct LeagueCell: View {
    let league: LeagueDetails
    
    private func formatSeason(_ year: Int) -> String {
        let nextYear = (year + 1) % 100
        return "\(year % 100)-\(nextYear)"
    }
    
    var body: some View {
        HStack(spacing: 16) {
            // 리그 로고 (Kingfisher 캐싱 사용)
            LeagueLogoView(logoUrl: league.league.logo, size: 40)
            
            // 리그 정보
            VStack(alignment: .leading, spacing: 4) {
                Text(league.league.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                HStack(spacing: 4) {
                    if let code = league.country?.code {
                        switch code.lowercased() {
                        case "gb", "gb-eng":
                            Text("🏴󠁧󠁢󠁥󠁮󠁧󠁿")
                        case "es":
                            Text("🇪🇸")
                        case "it":
                            Text("🇮🇹")
                        case "de":
                            Text("🇩🇪")
                        default:
                            Text("🇪🇺")
                        }
                    } else {
                        Text("🇪🇺")
                    }
                    
                    Text(league.country?.name ?? "UEFA")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            // 현재 시즌
            if let season = league.seasons?.first(where: { $0.current }) {
                Text(formatSeason(season.year))
                    .font(.subheadline)
                    .foregroundColor(.blue)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}