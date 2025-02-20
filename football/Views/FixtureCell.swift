import SwiftUI

struct FixtureCell: View {
    let fixture: Fixture
    let formattedDate: String
    let status: String
    
    private func formatRound(_ round: String) -> String {
        // "Regular Season - 24" -> "Round - 24"
        if let roundNumber = round.split(separator: "-").last?.trimmingCharacters(in: .whitespaces) {
            return "Round - \(roundNumber)"
        }
        return round
    }
    
    var body: some View {
        NavigationLink(destination: FixtureDetailView(fixture: fixture)) {
            VStack(spacing: 16) {
                // 날짜와 상태
                HStack {
                    Text(formattedDate)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    Text(status)
                        .font(.caption)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(4)
                }
                
                // 팀 정보
                HStack(spacing: 20) {
                    // 홈팀
                    TeamView(team: fixture.teams.home, leagueId: fixture.league.id)
                    
                    // 스코어
                    ScoreView(
                        homeScore: fixture.goals?.home,
                        awayScore: fixture.goals?.away,
                        isLive: fixture.fixture.status.short == "1H" || fixture.fixture.status.short == "2H",
                        elapsed: fixture.fixture.status.elapsed
                    )
                    
                    // 원정팀
                    TeamView(team: fixture.teams.away, leagueId: fixture.league.id)
                }
                
                // 라운드 정보
                HStack(spacing: 8) {
                    Text(formatRound(fixture.league.round))
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    if let venue = fixture.fixture.venue.name {
                        Text(venue)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }
    
    // MARK: - Team View
    struct TeamView: View {
        let team: Team
        let leagueId: Int
        
        init(team: Team, leagueId: Int) {
            self.team = team
            self.leagueId = leagueId
        }
        
        var body: some View {
            VStack(spacing: 8) {
                NavigationLink(destination: TeamProfileView(teamId: team.id, leagueId: leagueId)) {
                    AsyncImage(url: URL(string: team.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    .frame(width: 30, height: 30)
                }
                .buttonStyle(PlainButtonStyle())
                
                Text(team.name)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(width: 80)
            }
        }
    }
    
    // MARK: - Score View
    struct ScoreView: View {
        let homeScore: Int?
        let awayScore: Int?
        let isLive: Bool
        let elapsed: Int?
        
        var body: some View {
            VStack(spacing: 4) {
                if isLive, let elapsed = elapsed {
                    Text("\(elapsed)'")
                        .font(.caption)
                        .foregroundColor(.red)
                }
                
                HStack(spacing: 8) {
                    Text(homeScore?.description ?? "-")
                    Text(":")
                    Text(awayScore?.description ?? "-")
                }
                .font(.title3.bold())
            }
            .frame(width: 60)
        }
    }
}
