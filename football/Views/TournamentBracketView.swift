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
            
            let order1 = roundOrder.first(where: { round1.contains($0.key) })?.value ?? 0
            let order2 = roundOrder.first(where: { round2.contains($0.key) })?.value ?? 0
            
            return order1 < order2
        }
    }
    
    // 라운드별 경기 그룹화
    private func fixturesForRound(_ round: String) -> [Fixture] {
        fixtures.filter { $0.league.round == round }
    }
    
    // 라운드 이름 포맷팅 (한글)
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
            VStack(alignment: .center, spacing: 24) {
                ForEach(sortedRounds, id: \.self) { round in
                    VStack(alignment: .leading, spacing: 12) {
                        // 라운드 헤더
                        Text(formatRoundName(round))
                            .font(.headline)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 8)
                        
                        // 해당 라운드 경기 목록
                        ForEach(fixturesForRound(round), id: \.fixture.id) { fixture in
                            HStack(alignment: .center, spacing: 16) {
                                // 홈팀 로고 + 약어
                                VStack(spacing: 4) {
                                    AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 24, height: 24)
                                    } placeholder: {
                                        Image(systemName: "sportscourt")
                                            .foregroundColor(.gray)
                                    }
                                    Text(TeamAbbreviations.abbreviation(for: fixture.teams.home.name))
                                        .font(.caption)
                                }
                                
                                // 스코어
                                Text("\(fixture.goals?.home ?? 0) - \(fixture.goals?.away ?? 0)")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                // 원정팀 로고 + 약어
                                VStack(spacing: 4) {
                                    AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .frame(width: 24, height: 24)
                                    } placeholder: {
                                        Image(systemName: "sportscourt")
                                            .foregroundColor(.gray)
                                    }
                                    Text(TeamAbbreviations.abbreviation(for: fixture.teams.away.name))
                                        .font(.caption)
                                }
                                
                                Spacer()
                            }
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(8)
                        }
                    }
                }
            }
            .padding()
        }
    }
}

}
