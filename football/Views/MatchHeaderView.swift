import SwiftUI

struct MatchHeaderView: View {
    let fixture: Fixture
    
    private var isLive: Bool {
        ["1H", "2H", "HT", "ET", "P"].contains(fixture.fixture.status.short)
    }
    
    private var statusColor: Color {
        if isLive {
            return .red
        } else if fixture.fixture.status.short == "NS" {
            return .blue
        } else {
            return .gray
        }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // 리그 및 경기 상태
            VStack(spacing: 8) {
                HStack {
                    AsyncImage(url: URL(string: fixture.league.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "trophy.fill")
                            .foregroundColor(.gray)
                    }
                    
                    Text(fixture.league.name)
                        .font(.system(.subheadline, design: .rounded))
                        .fontWeight(.medium)
                }
                
                // 경기 상태
                HStack(spacing: 6) {
                    if isLive {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                    }
                    
                    Text(fixture.fixture.status.long)
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundColor(statusColor)
                        .fontWeight(.medium)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // 팀 정보와 스코어
            HStack(alignment: .center, spacing: 0) {
                // 홈팀
                TeamInfoView(team: fixture.teams.home, isWinner: fixture.teams.home.winner == true)
                    .frame(maxWidth: .infinity)
                
                // 스코어
                VStack(spacing: 8) {
                    if fixture.fixture.status.short == "NS" {
                        Text("VS")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(.blue)
                            .frame(width: 120)
                            .padding(.vertical, 12)
                    } else {
                        VStack(spacing: 6) {
                            HStack(spacing: 20) {
                                Text("\(fixture.goals?.home ?? 0)")
                                Text("-")
                                Text("\(fixture.goals?.away ?? 0)")
                            }
                            .font(.system(size: 44, weight: .bold, design: .rounded))
                            
                            if let elapsed = fixture.fixture.status.elapsed {
                                Text("\(elapsed)'")
                                    .font(.system(.callout, design: .rounded))
                                    .fontWeight(.medium)
                                    .foregroundColor(statusColor)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(statusColor.opacity(0.1))
                                    .clipShape(Capsule())
                            }
                        }
                        .frame(width: 120)
                        .padding(.vertical, 12)
                    }
                }
                .background(Color(.systemBackground))
                
                // 원정팀
                TeamInfoView(team: fixture.teams.away, isWinner: fixture.teams.away.winner == true)
                    .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 20)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 8, y: 2)
            
            // 경기 정보
            HStack(spacing: 24) {
                if let venue = fixture.fixture.venue.name {
                    Label {
                        Text(venue)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.gray)
                    } icon: {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(.gray)
                    }
                }
                
                if let referee = fixture.fixture.referee {
                    Label {
                        Text(referee)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.gray)
                    } icon: {
                        Image(systemName: "whistle.fill")
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }
}

struct TeamInfoView: View {
    let team: Team
    let isWinner: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // 팀 로고
            ZStack {
                Circle()
                    .fill(Color(.systemBackground))
                    .frame(width: 80, height: 80)
                    .shadow(color: isWinner ? Color.blue.opacity(0.2) : Color.black.opacity(0.05),
                           radius: isWinner ? 12 : 8)
                
                AsyncImage(url: URL(string: team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .saturation(isWinner ? 1.0 : 0.8)
                } placeholder: {
                    Image(systemName: "sportscourt.fill")
                        .font(.system(size: 30))
                        .foregroundColor(.gray)
                }
                .frame(width: 60, height: 60)
                
                if isWinner {
                    Circle()
                        .strokeBorder(Color.blue.opacity(0.3), lineWidth: 3)
                        .frame(width: 80, height: 80)
                }
            }
            
            VStack(spacing: 6) {
                // 팀 이름
                Text(team.name)
                    .font(.system(.callout, design: .rounded))
                    .fontWeight(isWinner ? .semibold : .medium)
                    .foregroundColor(isWinner ? .primary : .secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(maxWidth: 130)
                
                // 승리 표시
                if isWinner {
                    Label("승리", systemImage: "checkmark.circle.fill")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.blue)
                        .imageScale(.small)
                }
            }
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}
