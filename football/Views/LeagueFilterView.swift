import SwiftUI
import Foundation

struct LeagueFilterView: View {
    @Binding var selectedLeague: EuropeanLeague
    let onLeagueSelected: (EuropeanLeague) -> Void
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(EuropeanLeague.allCases) { league in
                    LeagueFilterButton(
                        league: league,
                        isSelected: selectedLeague == league,
                        onTap: {
                            selectedLeague = league
                            onLeagueSelected(league)
                        }
                    )
                }
            }
            .padding(.horizontal, 16)
        }
        .background(Color(.systemBackground))
    }
}

struct LeagueFilterButton: View {
    let league: EuropeanLeague
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 8) {
                // 리그 로고
                Image(systemName: league.logoName)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(isSelected ? .white : league.themeColor)
                
                // 리그 이름
                Text(league.shortName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(isSelected ? .white : league.themeColor)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? league.themeColor : league.themeColor.opacity(0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(league.themeColor, lineWidth: isSelected ? 0 : 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(isSelected ? 1.05 : 1.0)
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        LeagueFilterView(
            selectedLeague: .constant(.premierLeague),
            onLeagueSelected: { _ in }
        )
        
        LeagueFilterView(
            selectedLeague: .constant(.all),
            onLeagueSelected: { _ in }
        )
    }
    .background(Color.gray.opacity(0.1))
}