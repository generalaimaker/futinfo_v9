import SwiftUI

// MARK: - Filter Button
fileprivate struct FilterButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color.gray.opacity(0.2))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(12)
        }
    }
}

// MARK: - Match Player Stats View
struct MatchPlayerStatsView: View {
    let teamStats: [TeamPlayersStatistics]
    @State private var selectedPosition: String?
    
    private let positions = ["G", "D", "M", "F"]
    
    var body: some View {
        VStack(spacing: 24) {
            if teamStats.isEmpty {
                Text("선수 통계 정보가 없습니다")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                // 포지션 필터
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        FilterButton(
                            title: "전체",
                            isSelected: selectedPosition == nil,
                            action: { selectedPosition = nil }
                        )
                        
                        ForEach(positions, id: \.self) { position in
                            FilterButton(
                                title: getPositionName(position),
                                isSelected: selectedPosition == position,
                                action: { selectedPosition = position }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                
                ForEach(teamStats, id: \.team.id) { teamStat in
                    VStack(spacing: 16) {
                        // 팀 정보
                        HStack {
                            AsyncImage(url: URL(string: teamStat.team.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 30, height: 30)
                            
                            Text(teamStat.team.name)
                                .font(.headline)
                            
                            Spacer()
                        }
                        
                        // 선수 통계
                        let filteredPlayers = filterPlayers(teamStat.players)
                        ForEach(filteredPlayers) { player in
                            PlayerStatRow(
                                player: player.player,
                                stats: player.statistics.first ?? PlayerMatchStats(
                                    games: PlayerGameStats(
                                        minutes: 0,
                                        number: nil,
                                        position: nil,
                                        rating: "0.0",
                                        captain: false,
                                        substitute: true,
                                        appearences: 0,
                                        lineups: 0
                                    ),
                                    offsides: nil,
                                    shots: nil,
                                    goals: nil,
                                    passes: nil,
                                    tackles: nil,
                                    duels: nil,
                                    dribbles: nil,
                                    fouls: nil,
                                    cards: nil
                                )
                            )
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                }
            }
        }
        .padding(.horizontal)
    }
    
    private func filterPlayers(_ players: [FixturePlayerStats]) -> [FixturePlayerStats] {
        // 유효한 통계가 있는 선수만 필터링
        let validPlayers = players.filter { player in
            // 선수의 첫 번째 통계 데이터 사용
            guard let stats = player.statistics.first else { return false }
            
            // 포지션이 있고 선수 번호가 있는 경우 표시
            guard let position = stats.games.position,
                  stats.games.number != nil else {
                return false
            }
            
            // 포지션 필터가 선택된 경우
            if let selectedPos = selectedPosition {
                return position.starts(with: selectedPos)
            }
            
            return true
        }
        
        // 선발/교체 여부와 선수 번호로 정렬
        return validPlayers.sorted { player1, player2 in
            let stats1 = player1.statistics.first!
            let stats2 = player2.statistics.first!
            
            // 선발 선수를 먼저 표시
            if (stats1.games.substitute ?? true) != (stats2.games.substitute ?? true) {
                return !(stats1.games.substitute ?? true)
            }
            
            // 같은 그룹 내에서는 선수 번호로 정렬
            return (stats1.games.number ?? 99) < (stats2.games.number ?? 99)
        }
    }
    
    private func getPositionName(_ position: String) -> String {
        switch position {
        case "G": return "골키퍼"
        case "D": return "수비수"
        case "M": return "미드필더"
        case "F": return "공격수"
        default: return position
        }
    }
}

struct PlayerStatRow: View {
    let player: PlayerInfo
    let stats: PlayerMatchStats
    @State private var isExpanded = false
    
    var body: some View {
        VStack(spacing: 8) {
            Button(action: { isExpanded.toggle() }) {
                HStack {
                    AsyncImage(url: URL(string: player.photo ?? "")) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Image(systemName: "person.circle")
                            .foregroundColor(.gray)
                    }
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(player.name)
                            .font(.callout)
                        
                        HStack(spacing: 4) {
                            if let position = stats.games.position {
                                Text(position)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            if stats.games.substitute ?? false {
                                Text("(교체)")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // 평점이 있는 경우에만 표시
                    if let rating = stats.games.rating,
                       let ratingValue = Double(rating),
                       ratingValue > 0 {
                        Text(String(format: "%.1f", ratingValue))
                            .font(.headline)
                            .foregroundColor(.blue)
                    }
                    
                    Image(systemName: "chevron.right")
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                        .foregroundColor(.gray)
                }
            }
            .buttonStyle(PlainButtonStyle())
            
            if isExpanded {
                VStack(spacing: 12) {
                    // 기본 정보
                    HStack(spacing: 20) {
                        StatItem(title: "출전 시간", value: "\(stats.games.minutes ?? 0)'")
                        if let number = stats.games.number {
                            StatItem(title: "등번호", value: "\(number)")
                        }
                        if stats.games.captain == true {
                            StatItem(title: "주장", value: "○")
                        }
                    }
                    
                    // 공격 지표
                    if let shots = stats.shots, let goals = stats.goals {
                        HStack(spacing: 20) {
                            StatItem(title: "슈팅", value: "\(shots.total ?? 0)")
                            StatItem(title: "유효슈팅", value: "\(shots.on ?? 0)")
                            StatItem(title: "득점", value: "\(goals.total ?? 0)")
                            if let assists = goals.assists {
                                StatItem(title: "도움", value: "\(assists)")
                            }
                        }
                    }
                    
                    // 패스
                    if let passes = stats.passes {
                        HStack(spacing: 20) {
                            StatItem(title: "패스 시도", value: "\(passes.total ?? 0)")
                            StatItem(title: "성공률", value: "\(passes.accuracy ?? "0")%")
                            StatItem(title: "키패스", value: "\(passes.key ?? 0)")
                        }
                    }
                    
                    // 수비 지표
                    if let tackles = stats.tackles {
                        HStack(spacing: 20) {
                            StatItem(title: "태클", value: "\(tackles.total ?? 0)")
                            StatItem(title: "차단", value: "\(tackles.blocks ?? 0)")
                            StatItem(title: "인터셉트", value: "\(tackles.interceptions ?? 0)")
                        }
                    }
                    
                    // 기타 지표
                    HStack(spacing: 20) {
                        if let duels = stats.duels {
                            StatItem(title: "듀얼 성공", value: "\(duels.won ?? 0)/\(duels.total ?? 0)")
                        }
                        if let dribbles = stats.dribbles {
                            StatItem(title: "드리블 성공", value: "\(dribbles.success ?? 0)/\(dribbles.attempts ?? 0)")
                        }
                        if let fouls = stats.fouls {
                            StatItem(title: "파울", value: "\(fouls.committed ?? 0)")
                            StatItem(title: "피파울", value: "\(fouls.drawn ?? 0)")
                        }
                    }
                }
                .font(.caption)
                .padding(.top, 8)
            }
        }
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .animation(.easeInOut, value: isExpanded)
    }
}

struct StatItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .foregroundColor(.gray)
            Text(value)
                .fontWeight(.medium)
        }
    }
}
