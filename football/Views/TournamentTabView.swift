import SwiftUI

struct TournamentTabView: View {
    let leagueId: Int
    let rounds: [String]
    let fixtures: [Fixture]
    let formatDate: (String) -> String
    
    // 컵대회 ID 목록 (챔피언스리그, 유로파리그, 주요 컵대회, 클럽 월드컵)
    private let cupCompetitionIds = [2, 3, 45, 143, 137, 66, 81, 15]
    
    // 현재 리그가 컵대회인지 확인
    private var isCupCompetition: Bool {
        return cupCompetitionIds.contains(leagueId)
    }
    
    // 조별리그 라운드 여부 확인
    private var hasGroupStageRounds: Bool {
        return rounds.contains { $0.contains("Group") }
    }
    
    // 토너먼트 라운드 여부 확인 (16강, 8강, 4강, 결승 등 다양한 표기)
    private var hasTournamentRounds: Bool {
        return rounds.contains { raw in
            let round = raw.lowercased()
            return
                round.contains("final") ||               // Final, Finals
                round.contains("semi") ||                // Semi‑final, Semifinals
                round.contains("quarter") ||             // Quarter‑final
                round.contains("round of") ||            // Round of 16 / 32 …
                round.contains("1/16") ||                // 1/16 Finals
                round.contains("1/8")  ||                // 1/8 Finals
                round.contains("1/4")  ||                // 1/4 Finals
                round.contains("1/2")                    // 1/2 Finals
        }
    }
    
    var body: some View {
        VStack {
            if rounds.isEmpty || fixtures.isEmpty {
                EmptyDataView(message: "토너먼트 정보가 없습니다")
            } else if isCupCompetition && hasTournamentRounds {
                // 컵대회이고 토너먼트 라운드가 있는 경우 브라켓 뷰 표시
                TournamentBracketView(rounds: rounds, fixtures: fixtures, formatDate: formatDate)
            } else if hasGroupStageRounds {
                // 조별리그만 있는 경우 안내 메시지 표시
                VStack(spacing: 20) {
                    Text("조별리그 경기는 경기 탭에서 확인할 수 있습니다")
                        .font(.headline)
                        .foregroundColor(.gray)
                        .padding()
                    
                    Image(systemName: "arrow.left")
                        .font(.largeTitle)
                        .foregroundColor(.blue)
                        .padding()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                // 일반 리그인 경우 안내 메시지 표시
                EmptyDataView(message: "토너먼트 정보가 없습니다\n경기 탭에서 모든 경기를 확인할 수 있습니다")
            }
        }
    }
}

// MARK: - 라운드 섹션
struct RoundSection: View {
    let round: String
    let fixtures: [Fixture]
    let formatDate: (String) -> String
    
    // 라운드 이름 포맷팅
    var formattedRound: String {
        if round.contains("Final") {
            return round.replacingOccurrences(of: "Final", with: "결승")
                .replacingOccurrences(of: "Quarter-", with: "8강 ")
                .replacingOccurrences(of: "Semi-", with: "4강 ")
                .replacingOccurrences(of: "Round of 16", with: "16강")
                .replacingOccurrences(of: "Round of 32", with: "32강")
                .replacingOccurrences(of: "Round of 64", with: "64강")
        } else if round.contains("Group") {
            return round.replacingOccurrences(of: "Group", with: "조별리그")
        } else if round.contains("Round") {
            return round.replacingOccurrences(of: "Round", with: "라운드")
        }
        return round
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // 라운드 헤더
            SectionHeader(title: formattedRound, icon: "sportscourt")
            
            // 경기 목록
            ForEach(fixtures) { fixture in
                TournamentFixtureCell(
                    fixture: fixture,
                    formattedDate: formatDate(fixture.fixture.date)
                )
                .padding(.horizontal)
            }
        }
        .padding(.bottom, 8)
    }
}

// MARK: - 토너먼트 경기 셀
struct TournamentFixtureCell: View {
    let fixture: Fixture
    let formattedDate: String
    
    var body: some View {
        NavigationLink(destination: FixtureDetailView(fixture: fixture)) {
            VStack(spacing: 12) {
                // 경기 날짜 및 시간
                HStack {
                    Text(formattedDate)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    // 경기장
                    if let venueName = fixture.fixture.venue.name {
                        Text(venueName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // 홈팀
                HStack(spacing: 12) {
                    // Kingfisher 캐싱을 사용하여 팀 로고 이미지 빠르게 로드
                    TeamLogoView(logoUrl: fixture.teams.home.logo, size: 30)
                    
                    Text(fixture.teams.home.name)
                        .font(.subheadline)
                        .fontWeight(fixture.teams.home.winner == true ? .bold : .regular)
                        .foregroundColor(fixture.teams.home.winner == true ? .primary : .secondary)
                    
                    Spacer()
                    
                    // 홈팀 스코어
                    if let goals = fixture.goals, let homeGoals = goals.home {
                        Text("\(homeGoals)")
                            .font(.headline)
                            .fontWeight(fixture.teams.home.winner == true ? .bold : .regular)
                            .foregroundColor(fixture.teams.home.winner == true ? .primary : .secondary)
                    } else {
                        Text("-")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                }
                
                // 원정팀
                HStack(spacing: 12) {
                    // Kingfisher 캐싱을 사용하여 팀 로고 이미지 빠르게 로드
                    TeamLogoView(logoUrl: fixture.teams.away.logo, size: 30)
                    
                    Text(fixture.teams.away.name)
                        .font(.subheadline)
                        .fontWeight(fixture.teams.away.winner == true ? .bold : .regular)
                        .foregroundColor(fixture.teams.away.winner == true ? .primary : .secondary)
                    
                    Spacer()
                    
                    // 원정팀 스코어
                    if let goals = fixture.goals, let awayGoals = goals.away {
                        Text("\(awayGoals)")
                            .font(.headline)
                            .fontWeight(fixture.teams.away.winner == true ? .bold : .regular)
                            .foregroundColor(fixture.teams.away.winner == true ? .primary : .secondary)
                    } else {
                        Text("-")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
