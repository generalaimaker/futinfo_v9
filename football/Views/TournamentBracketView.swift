import SwiftUI

struct TournamentBracketView: View {
    let rounds: [String]
    let fixtures: [Fixture]
    let formatDate: (String) -> String
    
    // 토너먼트 라운드 정렬 순서
    private var sortedRounds: [String] {
        // 조별리그는 제외하고 토너먼트 단계만 표시
        let tournamentRounds = rounds.filter { !$0.contains("Group") }
        
        // 라운드 정렬 로직 (16강 -> 8강 -> 4강 -> 결승)
        return tournamentRounds.sorted { round1, round2 in
            let roundOrder: [String: Int] = [
                "Final": 100,
                "Semi-finals": 90,
                "Quarter-finals": 80,
                "Round of 16": 70,
                "Round of 32": 60,
                "Round of 64": 50
            ]
            
            // 기본 순서 값
            let order1 = roundOrder.first(where: { round1.contains($0.key) })?.value ?? 0
            let order2 = roundOrder.first(where: { round2.contains($0.key) })?.value ?? 0
            
            // 값이 클수록 나중에 표시 (결승이 마지막)
            return order1 < order2
        }
    }
    
    // 라운드별 경기 그룹화
    private func fixturesForRound(_ round: String) -> [Fixture] {
        return fixtures.filter { $0.league.round == round }
    }
    
    // 라운드 이름 포맷팅
    private func formatRoundName(_ round: String) -> String {
        if round.contains("Final") {
            if round == "Final" {
                return "결승"
            } else if round.contains("Semi") {
                return "준결승"
            } else if round.contains("Quarter") {
                return "8강"
            }
        } else if round.contains("Round of 16") {
            return "16강"
        } else if round.contains("Round of 32") {
            return "32강"
        } else if round.contains("Round of 64") {
            return "64강"
        }
        return round
    }
    
    var body: some View {
        ScrollView {
            if sortedRounds.isEmpty {
                EmptyDataView(message: "토너먼트 정보가 없습니다")
            } else {
                VStack(spacing: 0) {
                    // 토너먼트 브라켓 뷰
                    HStack(alignment: .top, spacing: 0) {
                        // 각 라운드 열
                        ForEach(sortedRounds, id: \.self) { round in
                            // 라운드 경기 (VStack 외부에서 정의하여 스코프 문제 해결)
                            let roundFixtures = fixturesForRound(round)

                            VStack(spacing: 0) {
                                // 라운드 헤더
                                Text(formatRoundName(round))
                                    .font(.headline)
                                    .padding(.vertical, 10)
                                    .frame(maxWidth: .infinity)
                                    .background(Color(.systemGray6))

                                // 경기 간격 계산 (라운드가 진행될수록 간격이 커짐)
                                let spacing = calculateSpacing(for: round)
                                
                                ForEach(roundFixtures.indices, id: \.self) { index in
                                    let fixture = roundFixtures[index]
                                    
                                    // 경기 카드
                                    BracketMatchCard(fixture: fixture, formattedDate: formatDate(fixture.fixture.date))
                                        .padding(.horizontal, 4)
                                    
                                    // 마지막 경기가 아니면 간격 추가
                                    if index < roundFixtures.count - 1 {
                                        Spacer()
                                            .frame(height: spacing)
                                    }
                                }
                                
                                Spacer()
                            }
                            .frame(width: 160)
                            
                            // 마지막 라운드가 아니면 연결선 추가
                            if round != sortedRounds.last {
                                BracketConnectorView(roundFixtures: roundFixtures, nextRoundFixtures: fixturesForRound(sortedRounds[sortedRounds.firstIndex(of: round)! + 1]))
                                    .frame(width: 20)
                            }
                        }
                    }
                    .padding(.vertical)
                }
            }
        }
    }
    
    // 라운드별 경기 간격 계산
    private func calculateSpacing(for round: String) -> CGFloat {
        if round.contains("Final") {
            return 100
        } else if round.contains("Semi") {
            return 80
        } else if round.contains("Quarter") {
            return 40
        } else if round.contains("Round of 16") {
            return 20
        } else {
            return 10
        }
    }
}

// 브라켓 연결선 뷰
struct BracketConnectorView: View {
    let roundFixtures: [Fixture]
    let nextRoundFixtures: [Fixture]
    
    var body: some View {
        GeometryReader { geometry in
            ForEach(0..<max(1, nextRoundFixtures.count), id: \.self) { nextIndex in
                // 다음 라운드의 각 경기에 대해 연결선 그리기
                let nextFixture = nextRoundFixtures.count > nextIndex ? nextRoundFixtures[nextIndex] : nil
                
                // 현재 라운드에서 다음 라운드로 진출한 팀 찾기
                let matchingFixtures = findMatchingFixtures(for: nextFixture)
                
                ForEach(matchingFixtures.indices, id: \.self) { index in
                    let fixture = matchingFixtures[index]
                    if let fixtureIndex = roundFixtures.firstIndex(where: { $0.fixture.id == fixture.fixture.id }) {
                        // 연결선 그리기
                        let startY = calculateYPosition(for: fixtureIndex, totalFixtures: roundFixtures.count, height: geometry.size.height)
                        let endY = calculateYPosition(for: nextIndex, totalFixtures: nextRoundFixtures.count, height: geometry.size.height)
                        
                        Path { path in
                            path.move(to: CGPoint(x: 0, y: startY))
                            path.addLine(to: CGPoint(x: geometry.size.width / 2, y: startY))
                            path.addLine(to: CGPoint(x: geometry.size.width / 2, y: endY))
                            path.addLine(to: CGPoint(x: geometry.size.width, y: endY))
                        }
                        .stroke(Color.gray, lineWidth: 1)
                    }
                }
            }
        }
    }
    
    // 다음 라운드 경기에 진출한 팀이 있는 현재 라운드 경기 찾기
    private func findMatchingFixtures(for nextFixture: Fixture?) -> [Fixture] {
        guard let nextFixture = nextFixture else { return [] }
        
        // 다음 라운드 경기의 홈팀과 원정팀
        let homeTeamId = nextFixture.teams.home.id
        let awayTeamId = nextFixture.teams.away.id
        
        // 현재 라운드에서 해당 팀이 승리한 경기 찾기
        return roundFixtures.filter { fixture in
            (fixture.teams.home.id == homeTeamId && fixture.teams.home.winner == true) ||
            (fixture.teams.away.id == homeTeamId && fixture.teams.away.winner == true) ||
            (fixture.teams.home.id == awayTeamId && fixture.teams.home.winner == true) ||
            (fixture.teams.away.id == awayTeamId && fixture.teams.away.winner == true)
        }
    }
    
    // 경기 카드의 Y 위치 계산
    private func calculateYPosition(for index: Int, totalFixtures: Int, height: CGFloat) -> CGFloat {
        if totalFixtures <= 1 {
            return height / 2
        }
        
        let spacing = height / CGFloat(totalFixtures)
        return spacing * CGFloat(index) + spacing / 2
    }
}

// 브라켓 경기 카드
struct BracketMatchCard: View {
    let fixture: Fixture
    let formattedDate: String
    
    var body: some View {
        VStack(spacing: 8) {
            // 경기 날짜
            Text(formattedDate)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
            
            // 홈팀
            HStack {
                AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .foregroundColor(.gray)
                }
                .frame(width: 20, height: 20)
                
                Text(fixture.teams.home.name)
                    .font(.caption)
                    .lineLimit(1)
                    .fontWeight(fixture.teams.home.winner == true ? .bold : .regular)
                
                Spacer()
                
                if let goals = fixture.goals, let homeGoals = goals.home {
                    Text("\(homeGoals)")
                        .font(.caption)
                        .fontWeight(fixture.teams.home.winner == true ? .bold : .regular)
                } else {
                    Text("-")
                        .font(.caption)
                }
            }
            
            // 원정팀
            HStack {
                AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .foregroundColor(.gray)
                }
                .frame(width: 20, height: 20)
                
                Text(fixture.teams.away.name)
                    .font(.caption)
                    .lineLimit(1)
                    .fontWeight(fixture.teams.away.winner == true ? .bold : .regular)
                
                Spacer()
                
                if let goals = fixture.goals, let awayGoals = goals.away {
                    Text("\(awayGoals)")
                        .font(.caption)
                        .fontWeight(fixture.teams.away.winner == true ? .bold : .regular)
                } else {
                    Text("-")
                        .font(.caption)
                }
            }
        }
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}
