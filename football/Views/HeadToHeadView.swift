import SwiftUI
// Ensure TeamAbbreviations is accessible

struct HeadToHeadView: View {
    @ObservedObject var viewModel: FixtureDetailViewModel
    let fixtures: [Fixture]
    let team1Stats: HeadToHeadStats
    let team2Stats: HeadToHeadStats
    let team1: Team
    let team2: Team
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                HeadToHeadSummaryView(team1: team1, team2: team2, team1Stats: team1Stats, team2Stats: team2Stats, fixturesCount: fixtures.count)
                RecentMatchesView(fixtures: fixtures)
                GoalStatsView(team1Stats: team1Stats, team2Stats: team2Stats)
                // Show standings for the league of the first fixture (if any)
                if !viewModel.standings.isEmpty,
                   let firstFixture = fixtures.first {
                    StandingsView(leagueId: firstFixture.league.id,
                                  leagueName: firstFixture.league.name)
                }
            }
            .frame(maxWidth: 400)
            .padding(.horizontal)
        }
    }
    
    private func formattedDate(from dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        guard let date = formatter.date(from: dateString) else { return "" }
        formatter.dateFormat = "yyyy.MM.dd"
        return formatter.string(from: date)
    }
}

// MARK: - HeadToHeadSummaryView
struct HeadToHeadSummaryView: View {
    let team1: Team
    let team2: Team
    let team1Stats: HeadToHeadStats
    let team2Stats: HeadToHeadStats
    let fixturesCount: Int

    var body: some View {
        VStack(spacing: 16) {
            Text("상대전적 요약")
                .font(.headline)

            HStack(spacing: 0) {
                // 팀1
                VStack(spacing: 12) {
                    AsyncImage(url: URL(string: team1.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    .frame(width: 50, height: 50)
                    Text(team1.name)
                        .font(.callout)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)

                // 전적
                VStack(spacing: 8) {
                    Text("\(fixturesCount)경기")
                        .font(.title3.bold())
                    HStack(spacing: 16) {
                        Text("\(team1Stats.wins)")
                            .foregroundColor(.blue)
                        Text("\(team1Stats.draws)")
                            .foregroundColor(.gray)
                        Text("\(team1Stats.losses)")
                            .foregroundColor(.red)
                    }
                    .font(.headline)
                }
                .frame(maxWidth: .infinity)

                // 팀2
                VStack(spacing: 12) {
                    AsyncImage(url: URL(string: team2.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    .frame(width: 50, height: 50)
                    Text(team2.name)
                        .font(.callout)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
            }

            // 승률 차트
            VStack(spacing: 8) {
                Text("승률")
                    .font(.subheadline)
                    .foregroundColor(.gray)

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.gray.opacity(0.1))
                            .frame(height: 12)
                        HStack(spacing: 0) {
                            // Home‑team wins
                            RoundedRectangle(cornerRadius: 6)
                                .fill(Color.blue.opacity(0.6))
                                .frame(width: geometry.size.width * CGFloat(team1Stats.winRate / 100), height: 12)
                            // Draws
                            RoundedRectangle(cornerRadius: 6)
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: geometry.size.width * CGFloat(team1Stats.drawRate / 100), height: 12)
                            // Away‑team wins
                            RoundedRectangle(cornerRadius: 6)
                                .fill(Color.red.opacity(0.6))
                                .frame(width: geometry.size.width * CGFloat(team2Stats.winRate / 100), height: 12)
                        }
                    }
                }
                .frame(height: 12)

                HStack {
                    Text(String(format: "%.1f%%", team1Stats.winRate))
                        .foregroundColor(.blue)
                    Spacer()
                    Text(String(format: "%.1f%%", team2Stats.winRate))
                        .foregroundColor(.red)
                }
                .font(.caption)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
}

// MARK: - RecentMatchesView
struct RecentMatchesView: View {
    let fixtures: [Fixture]

    private func formattedDate(from dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        guard let date = formatter.date(from: dateString) else { return "" }
        formatter.dateFormat = "yyyy.MM.dd"
        return formatter.string(from: date)
    }

    var body: some View {
        VStack(spacing: 16) {
            Text("최근 경기")
                .font(.headline)
            VStack(spacing: 0) {
                ForEach(Array(fixtures.sorted { $0.fixture.date > $1.fixture.date }.prefix(5).enumerated()), id: \.element.id) { index, fixture in
                    VStack(spacing: 8) {
                        Text(formattedDate(from: fixture.fixture.date))
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .padding(.top, 12)
                        HStack(spacing: 12) {
                            // 홈팀 약어 + 로고
                            Text(TeamAbbreviations.abbreviation(for: fixture.teams.home.name))
                                .font(.system(.body, design: .rounded))
                                .frame(width: 40, alignment: .trailing)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                            AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                                image.resizable().scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt").foregroundColor(.gray)
                            }
                            .frame(width: 24, height: 24)
                            // 스코어
                            Text("\(fixture.goals?.home ?? 0) - \(fixture.goals?.away ?? 0)")
                                .font(.system(.title3, design: .rounded, weight: .bold))
                                .frame(width: 50, alignment: .center)
                            // 어웨이팀 로고 + 약어
                            AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                                image.resizable().scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt").foregroundColor(.gray)
                            }
                            .frame(width: 24, height: 24)
                            Text(TeamAbbreviations.abbreviation(for: fixture.teams.away.name))
                                .font(.system(.body, design: .rounded))
                                .frame(width: 40, alignment: .leading)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                        .padding(.bottom, 12)
                    }
                    if index < fixtures.prefix(5).count - 1 {
                        Divider()
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
}

// MARK: - GoalStatsView
struct GoalStatsView: View {
    let team1Stats: HeadToHeadStats
    let team2Stats: HeadToHeadStats

    var body: some View {
        VStack(spacing: 16) {
            Text("득실 통계")
                .font(.headline)
            Grid(horizontalSpacing: 24, verticalSpacing: 16) {
                GridRow {
                    Text("\(team1Stats.goalsFor)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.blue)
                    Text("득점")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    Text("\(team2Stats.goalsFor)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.red)
                }
                GridRow {
                    Text("\(team1Stats.goalsAgainst)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.blue)
                    Text("실점")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    Text("\(team2Stats.goalsAgainst)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.red)
                }
                GridRow {
                    Text("\(team1Stats.goalDifference)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.blue)
                    Text("득실차")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    Text("\(team2Stats.goalDifference)")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.red)
                }
            }
            .padding(.vertical, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
}
