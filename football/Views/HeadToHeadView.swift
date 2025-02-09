import SwiftUI

struct HeadToHeadView: View {
    let fixtures: [Fixture]
    let team1Stats: HeadToHeadStats
    let team2Stats: HeadToHeadStats
    let team1: Team
    let team2: Team
    
    var body: some View {
        VStack(spacing: 20) {
            // 전적 요약
            HStack(spacing: 0) {
                // 팀1 통계
                TeamStatsView(
                    team: team1,
                    stats: team1Stats,
                    alignment: .leading
                )
                
                // 중앙 구분선
                VStack(spacing: 12) {
                    Text("H2H")
                        .font(.headline)
                        .foregroundColor(.gray)
                    
                    Text("\(team1Stats.wins)-\(team1Stats.draws)-\(team2Stats.wins)")
                        .font(.system(.title2, design: .rounded))
                        .fontWeight(.bold)
                }
                .frame(width: 100)
                
                // 팀2 통계
                TeamStatsView(
                    team: team2,
                    stats: team2Stats,
                    alignment: .trailing
                )
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            
            // 최근 경기 목록
            VStack(alignment: .leading, spacing: 12) {
                Text("최근 경기")
                    .font(.headline)
                
                if fixtures.isEmpty {
                    Text("이전 경기 기록이 없습니다")
                        .foregroundColor(.gray)
                        .padding()
                } else {
                    ForEach(fixtures.prefix(5), id: \.fixture.id) { fixture in
                        RecentMatchRow(fixture: fixture)
                    }
                }
            }
        }
        .padding()
    }
}

struct TeamStatsView: View {
    let team: Team
    let stats: HeadToHeadStats
    let alignment: HorizontalAlignment
    
    init(team: Team, stats: HeadToHeadStats, alignment: HorizontalAlignment) {
        self.team = team
        self.stats = stats
        self.alignment = alignment
    }
    
    var body: some View {
        VStack(alignment: alignment, spacing: 12) {
            // 팀 정보
            HStack(spacing: 8) {
                if alignment == .trailing {
                    Text(team.name)
                        .font(.headline)
                        .lineLimit(1)
                }
                
                AsyncImage(url: URL(string: team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .foregroundColor(.gray)
                }
                .frame(width: 30, height: 30)
                
                if alignment == .leading {
                    Text(team.name)
                        .font(.headline)
                        .lineLimit(1)
                }
            }
            
            // 승률
            Text(String(format: "%.1f%%", stats.winRate))
                .font(.system(.title3, design: .rounded))
                .fontWeight(.semibold)
                .foregroundColor(.blue)
            
            // 득실
            HStack(spacing: 4) {
                if alignment == .trailing {
                    Text("\(stats.goalsFor)")
                        .foregroundColor(.green)
                    Text("-")
                    Text("\(stats.goalsAgainst)")
                        .foregroundColor(.red)
                } else {
                    Text("\(stats.goalsFor)")
                        .foregroundColor(.green)
                    Text("-")
                    Text("\(stats.goalsAgainst)")
                        .foregroundColor(.red)
                }
            }
            .font(.system(.callout, design: .rounded))
            .fontWeight(.medium)
        }
        .frame(maxWidth: .infinity)
    }
}

struct RecentMatchRow: View {
    let fixture: Fixture
    
    init(fixture: Fixture) {
        self.fixture = fixture
    }
    
    var body: some View {
        HStack {
            // 날짜
            Text(matchDate)
                .font(.caption)
                .foregroundColor(.gray)
                .frame(width: 80, alignment: .leading)
            
            // 홈팀
            TeamScoreView(
                team: fixture.teams.home,
                score: fixture.goals?.home ?? 0,
                isHome: true
            )
            
            Text("vs")
                .font(.caption)
                .foregroundColor(.gray)
                .padding(.horizontal, 8)
            
            // 원정팀
            TeamScoreView(
                team: fixture.teams.away,
                score: fixture.goals?.away ?? 0,
                isHome: false
            )
        }
        .padding(.vertical, 8)
        .padding(.horizontal)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
    
    private var dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    private var matchDate: String {
        if let date = ISO8601DateFormatter().date(from: fixture.fixture.date) {
            return dateFormatter.string(from: date)
        }
        return ""
    }
    
}

struct TeamScoreView: View {
    let team: Team
    let score: Int
    let isHome: Bool
    
    init(team: Team, score: Int, isHome: Bool) {
        self.team = team
        self.score = score
        self.isHome = isHome
    }
    
    var body: some View {
        HStack(spacing: 8) {
            if !isHome {
                scoreView
                teamInfoView
            } else {
                teamInfoView
                scoreView
            }
        }
        .frame(maxWidth: .infinity)
    }
    
    private var teamInfoView: some View {
        HStack(spacing: 8) {
            AsyncImage(url: URL(string: team.logo)) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt")
                    .foregroundColor(.gray)
            }
            .frame(width: 20, height: 20)
            
            Text(team.name)
                .font(.caption)
                .lineLimit(1)
        }
    }
    
    private var scoreView: some View {
        Text("\(score)")
            .font(.system(.body, design: .rounded))
            .fontWeight(.semibold)
            .foregroundColor(team.winner == true ? .blue : .primary)
    }
}