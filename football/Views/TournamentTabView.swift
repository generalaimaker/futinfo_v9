import SwiftUI

struct TournamentTabView: View {
    let leagueId: Int
    let rounds: [String]
    let fixtures: [Fixture]
    let formatDate: (String) -> String
    
    // 컵대회 ID 목록 (챔피언스리그, 유로파리그, 주요 컵대회)
    private let cupCompetitionIds = [2, 3, 45, 143, 137, 66, 81]
    
    // 현재 리그가 컵대회인지 확인
    private var isCupCompetition: Bool {
        return cupCompetitionIds.contains(leagueId)
    }
    
    // 조별리그 라운드 여부 확인
    private var hasGroupStageRounds: Bool {
        return rounds.contains { $0.contains("Group") }
    }
    
    // 토너먼트 라운드 여부 확인 (16강, 8강, 4강, 결승 등)
    private var hasTournamentRounds: Bool {
        return rounds.contains { 
            $0.contains("Final") || 
            $0.contains("Round of") || 
            $0.contains("Semi") || 
            $0.contains("Quarter")
        }
    }
    
    @State private var viewMode: TournamentViewMode = .list
    
    enum TournamentViewMode {
        case list
        case bracket
    }
    
    var body: some View {
        VStack {
            if rounds.isEmpty || fixtures.isEmpty {
                EmptyDataView(message: "토너먼트 정보가 없습니다")
            } else if isCupCompetition && hasTournamentRounds {
                // 컵대회이고 토너먼트 라운드가 있는 경우 뷰 모드 선택 버튼 표시
                HStack {
                    Picker("보기 모드", selection: $viewMode) {
                        Text("목록").tag(TournamentViewMode.list)
                        Text("브라켓").tag(TournamentViewMode.bracket)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .padding(.horizontal)
                }
                .padding(.top)
                
                // 선택된 뷰 모드에 따라 다른 뷰 표시
                if viewMode == .list {
                    listView
                } else {
                    TournamentBracketView(rounds: rounds, fixtures: fixtures, formatDate: formatDate)
                }
            } else {
                // 일반 리그 또는 조별리그만 있는 경우 목록 뷰만 표시
                listView
            }
        }
    }
    
    // 목록 뷰
    private var listView: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 라운드별로 경기 그룹화
                ForEach(rounds, id: \.self) { round in
                    RoundSection(
                        round: round,
                        fixtures: fixtures.filter { $0.league.round == round },
                        formatDate: formatDate
                    )
                }
            }
            .padding(.vertical)
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
            SectionHeader(title: formattedRound)
            
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
                    AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    .frame(width: 30, height: 30)
                    
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
                    AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    .frame(width: 30, height: 30)
                    
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
