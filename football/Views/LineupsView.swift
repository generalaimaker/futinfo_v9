import SwiftUI

// MARK: - Components
fileprivate struct LineupFilterButton: View {
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

fileprivate struct LineupStatItem: View {
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

fileprivate struct LineupPlayerStatRow: View {
    let player: PlayerInfo
    let stats: PlayerMatchStats
    @State private var isExpanded = false
    
    var body: some View {
        NavigationLink(destination: PlayerProfileView(playerId: player.id ?? 0)) {
            VStack(spacing: 8) {
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
                        Text(player.name ?? "선수 정보 없음")
                            .font(.callout)
                        
                        HStack(spacing: 4) {
                            if let games = stats.games,
                               let position = games.position {
                                Text(position)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            if let games = stats.games,
                               games.substitute ?? false {
                                Text("(교체)")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // 평점이 있는 경우에만 표시
                    if let games = stats.games,
                       let rating = games.rating,
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
                
                if isExpanded {
                    VStack(spacing: 12) {
                        // 기본 정보
                        HStack(spacing: 20) {
                            if let games = stats.games {
                                LineupStatItem(title: "출전 시간", value: "\(games.minutes ?? 0)'")
                                if let number = games.number {
                                    LineupStatItem(title: "등번호", value: "\(number)")
                                }
                                if games.captain == true {
                                    LineupStatItem(title: "주장", value: "○")
                                }
                            }
                        }
                        
                        // 공격 지표
                        if let shots = stats.shots, let goals = stats.goals {
                            HStack(spacing: 20) {
                                LineupStatItem(title: "슈팅", value: "\(shots.total ?? 0)")
                                LineupStatItem(title: "유효슈팅", value: "\(shots.on ?? 0)")
                                LineupStatItem(title: "득점", value: "\(goals.total ?? 0)")
                                if let assists = goals.assists {
                                    LineupStatItem(title: "도움", value: "\(assists)")
                                }
                            }
                        }
                        
                        // 패스
                        if let passes = stats.passes {
                            HStack(spacing: 20) {
                                LineupStatItem(title: "패스 시도", value: "\(passes.total ?? 0)")
                                LineupStatItem(title: "성공률", value: passes.accuracy?.displayValue ?? "0%")
                                LineupStatItem(title: "키패스", value: "\(passes.key ?? 0)")
                            }
                        }
                        
                        // 수비 지표
                        if let tackles = stats.tackles {
                            HStack(spacing: 20) {
                                LineupStatItem(title: "태클", value: "\(tackles.total ?? 0)")
                                LineupStatItem(title: "차단", value: "\(tackles.blocks ?? 0)")
                                LineupStatItem(title: "인터셉트", value: "\(tackles.interceptions ?? 0)")
                            }
                        }
                        
                        // 기타 지표
                        HStack(spacing: 20) {
                            if let duels = stats.duels {
                                LineupStatItem(title: "듀얼 성공", value: "\(duels.won ?? 0)/\(duels.total ?? 0)")
                            }
                            if let dribbles = stats.dribbles {
                                LineupStatItem(title: "드리블 성공", value: "\(dribbles.success ?? 0)/\(dribbles.attempts ?? 0)")
                            }
                            if let fouls = stats.fouls {
                                LineupStatItem(title: "파울", value: "\(fouls.committed ?? 0)")
                                LineupStatItem(title: "피파울", value: "\(fouls.drawn ?? 0)")
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
        .buttonStyle(PlainButtonStyle())
    }
}

// FormationView는 Components/FormationView.swift에서 정의됨

// MARK: - Player Components
struct PlayerDot: View {
    let number: Int
    let name: String
    let position: String
    let stats: Int
    @State private var isShowingDetails = false
    @State private var isPressed = false
    
    var body: some View {
        ZStack {
            // 배경 서클
            Circle()
                .fill(Color.white)
                .frame(width: 36, height: 36)
                .shadow(color: Color.black.opacity(0.1), radius: isPressed ? 2 : 4,
                       x: 0, y: isPressed ? 1 : 2)
            
            // 내부 서클
            Circle()
                .fill(LinearGradient(
                    gradient: Gradient(colors: [.blue.opacity(0.3), .blue.opacity(0.1)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: 34, height: 34)
            
            // 선수 번호
            Text("\(number)")
                .font(.system(.callout, design: .rounded).weight(.bold))
                .foregroundColor(.blue)
        }
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .overlay {
            if isShowingDetails {
                VStack(spacing: 4) {
                    Text(name)
                        .font(.system(.callout, design: .rounded).weight(.semibold))
                    
                    HStack(spacing: 8) {
                        Text(position)
                            .font(.system(.caption, design: .rounded))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(4)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 8)
                .offset(y: -50)
                .transition(.scale.combined(with: .opacity))
            }
        }
        .onTapGesture {
            withAnimation(.spring()) {
                isShowingDetails.toggle()
            }
        }
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct PlayerCard: View {
    let number: Int
    let name: String
    let position: String
    let isStarter: Bool
    let playerId: Int
    @State private var isPressed = false
    
    var body: some View {
        NavigationLink(destination: PlayerProfileView(playerId: playerId)) {
            VStack(spacing: 16) {
                // 선수 번호
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    isStarter ? Color.blue.opacity(0.15) : Color.gray.opacity(0.15),
                                    isStarter ? Color.blue.opacity(0.05) : Color.gray.opacity(0.05)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                        .shadow(
                            color: isStarter ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1),
                            radius: isPressed ? 4 : 8,
                            y: isPressed ? 1 : 2
                        )
                    
                    Text("\(number)")
                        .font(.system(.title2, design: .rounded).weight(.bold))
                        .foregroundColor(isStarter ? .blue : .gray)
                }
                
                VStack(spacing: 6) {
                    // 선수 이름
                    Text(name)
                        .font(.system(.callout, design: .rounded))
                        .fontWeight(.medium)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .frame(height: 40)
                    
                    // 포지션
                    Text(position)
                        .font(.system(.caption, design: .rounded))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            isStarter ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1)
                        )
                        .cornerRadius(8)
                }
            }
            .frame(width: 120)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(
                color: Color.black.opacity(0.05),
                radius: isPressed ? 4 : 8,
                y: isPressed ? 1 : 2
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct TopPlayerCard: View {
    let player: PlayerInfo
    let team: Team
    let rating: String
    @State private var isPressed = false
    
    var body: some View {
        NavigationLink(destination: PlayerProfileView(playerId: player.id ?? 0)) {
            VStack(spacing: 12) {
                // 선수 사진
                AsyncImage(url: URL(string: player.photo ?? "")) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "person.circle")
                        .foregroundColor(.gray)
                }
                .frame(width: 60, height: 60)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(Color.blue, lineWidth: 2)
                )
                .shadow(
                    color: Color.blue.opacity(0.1),
                    radius: isPressed ? 4 : 8,
                    y: isPressed ? 1 : 2
                )
                
                VStack(spacing: 6) {
                    // 선수 이름
                    Text(player.name ?? "선수 정보 없음")
                        .font(.system(.callout, design: .rounded))
                        .fontWeight(.medium)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                    
                    // 팀 로고
                    AsyncImage(url: URL(string: team.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    
                    // 평점
                    Text(rating)
                        .font(.system(.title3, design: .rounded).weight(.bold))
                        .foregroundColor(.blue)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            .frame(width: 120)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(
                color: Color.black.opacity(0.05),
                radius: isPressed ? 4 : 8,
                y: isPressed ? 1 : 2
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - Main View
struct LineupsView: View {
    let lineups: [TeamLineup]
    let topPlayers: [PlayerProfileData]
    let teamStats: [TeamPlayersStatistics]
    @State private var selectedTeamIndex = 0
    @State private var showingFormation = true
    @State private var selectedPosition: String?
    
    private let positions = ["G", "D", "M", "F"]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if lineups.isEmpty {
                    Text("라인업 정보가 없습니다")
                        .foregroundColor(.gray)
                        .padding()
                } else {
                    // 팀 선택 슬라이더
                    HStack(spacing: 0) {
                        ForEach(lineups.indices, id: \.self) { index in
                            Button(action: {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    selectedTeamIndex = index
                                }
                            }) {
                                HStack(spacing: 12) {
                                    AsyncImage(url: URL(string: lineups[index].team.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .saturation(selectedTeamIndex == index ? 1.0 : 0.7)
                                    } placeholder: {
                                        Image(systemName: "sportscourt.fill")
                                            .foregroundColor(.gray)
                                    }
                                    .frame(width: 32, height: 32)
                                    
                                    Text(lineups[index].team.name)
                                        .font(.system(.callout, design: .rounded))
                                        .fontWeight(selectedTeamIndex == index ? .semibold : .regular)
                                        .foregroundColor(selectedTeamIndex == index ? .primary : .secondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(selectedTeamIndex == index ? Color.blue.opacity(0.1) : Color.clear)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(selectedTeamIndex == index ? Color.blue.opacity(0.3) : Color.clear, lineWidth: 1)
                                )
                            }
                            .buttonStyle(PlainButtonStyle())
                            
                            if index == 0 {
                                Divider()
                                    .padding(.vertical, 8)
                            }
                        }
                    }
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    .padding(.horizontal)
                    
                    if !lineups.isEmpty && selectedTeamIndex < lineups.count {
                        let lineup = lineups[selectedTeamIndex]
                        
                        // 포메이션 정보
                        VStack(spacing: 12) {
                            HStack {
                                Text("포메이션")
                                    .font(.headline)
                                
                                Text(lineup.formation)
                                    .font(.title2.bold())
                                    .foregroundColor(.blue)
                                
                                Spacer()
                                
                                Button(action: { showingFormation.toggle() }) {
                                    Image(systemName: "arrow.left.and.right.square")
                                        .imageScale(.large)
                                        .foregroundColor(.blue)
                                        .rotationEffect(.degrees(showingFormation ? 180 : 0))
                                }
                            }
                            .padding(.horizontal)
                            
                            if showingFormation {
                                FormationView(lineup: lineup)
                                    .frame(height: 400)
                                    .padding(.vertical)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                        
                        // 선발 선수
                        VStack(alignment: .leading, spacing: 16) {
                            Text("선발 라인업")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                LazyHStack(spacing: 12) {
                                    ForEach(lineup.startXI) { player in
                                        PlayerCard(
                                            number: player.player.number,
                                            name: player.player.name,
                                            position: player.player.pos ?? "",
                                            isStarter: true,
                                            playerId: player.player.id
                                        )
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                        
                        // 교체 선수
                        VStack(alignment: .leading, spacing: 16) {
                            Text("교체 선수")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                LazyHStack(spacing: 12) {
                                    ForEach(lineup.substitutes) { player in
                                        PlayerCard(
                                            number: player.number,
                                            name: player.name,
                                            position: player.pos ?? "",
                                            isStarter: false,
                                            playerId: player.id
                                        )
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                    } else {
                        Text("라인업 정보를 불러오는 중입니다")
                            .foregroundColor(.gray)
                            .padding()
                    }
                    
                    
                    // 최고 평점 선수
                    if !topPlayers.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("최고 평점 선수")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                LazyHStack(spacing: 12) {
                                    ForEach(topFivePlayers, id: \.player.id) { playerData in
                                        createTopPlayerCard(for: playerData)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                    }
                }
                
                // 선수 통계 섹션
                VStack(alignment: .leading, spacing: 16) {
                    Text("선수 통계")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    // 포지션 필터
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            LineupFilterButton(
                                title: "전체",
                                isSelected: selectedPosition == nil,
                                action: { selectedPosition = nil }
                            )
                            
                            ForEach(positions, id: \.self) { position in
                                LineupFilterButton(
                                    title: getPositionName(position),
                                    isSelected: selectedPosition == position,
                                    action: { selectedPosition = position }
                                )
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // 팀별 선수 통계
                    if !lineups.isEmpty && selectedTeamIndex < lineups.count {
                        TeamStatsSection(
                            teamStats: teamStats,
                            selectedTeamId: lineups[selectedTeamIndex].team.id,
                            selectedPosition: selectedPosition,
                            filterPlayers: filterPlayers,
                            getPlayerStats: getPlayerStats
                        )
                    } else {
                        Text("선수 통계 정보를 불러오는 중입니다")
                            .foregroundColor(.gray)
                            .padding()
                    }
                }
                .padding(.top, 24)
            }
            .padding(.vertical)
        }
    }
    
    private func filterPlayers(_ players: [FixturePlayerStats]) -> [FixturePlayerStats] {
        // 유효한 통계가 있는 선수만 필터링
        let validPlayers = players.filter { player in
            // 선수의 첫 번째 통계 데이터 사용
            guard let stats = player.statistics.first else { return false }
            
            // 포지션이 있고 선수 번호가 있는 경우 표시
            guard let games = stats.games,
                  let position = games.position,
                  games.number != nil else {
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
            let sub1 = stats1.games?.substitute ?? true
            let sub2 = stats2.games?.substitute ?? true
            if sub1 != sub2 {
                return !sub1
            }
            
            // 같은 그룹 내에서는 선수 번호로 정렬
            let num1 = stats1.games?.number ?? 99
            let num2 = stats2.games?.number ?? 99
            return num1 < num2
        }
    }
    
    private func getPlayerStats(for player: FixturePlayerStats) -> PlayerMatchStats {
        // 선수의 첫 번째 통계 데이터 사용 또는 기본값 생성
        return player.statistics.first ?? PlayerMatchStats(
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
            cards: nil,
            penalty: nil,
            substitutes: nil,
            team: Team(id: 0, name: "Unknown Team", logo: ""),
            league: nil
        )
    }
    
    @ViewBuilder
    private func createTopPlayerCard(for playerData: PlayerProfileData) -> some View {
        if let statistics = playerData.statistics,
           let stats = statistics.first,
           let games = stats.games,
           let rating = games.rating {
            if let team = stats.team {
                TopPlayerCard(
                    player: playerData.player,
                    team: team,
                    rating: rating
                )
            }
        }
    }
    
    // MARK: - Team Stats Section
    private struct TeamStatsSection: View {
        let teamStats: [TeamPlayersStatistics]
        let selectedTeamId: Int
        let selectedPosition: String?
        let filterPlayers: ([FixturePlayerStats]) -> [FixturePlayerStats]
        let getPlayerStats: (FixturePlayerStats) -> PlayerMatchStats
        
        private var selectedTeamStat: TeamPlayersStatistics? {
            teamStats.first { $0.team.id == selectedTeamId }
        }
        
        var body: some View {
            if let teamStat = selectedTeamStat {
                PlayerStatsList(
                    players: filterPlayers(teamStat.players),
                    getPlayerStats: getPlayerStats
                )
            }
        }
    }
    
    private struct PlayerStatsList: View {
        let players: [FixturePlayerStats]
        let getPlayerStats: (FixturePlayerStats) -> PlayerMatchStats
        
        var body: some View {
            VStack(spacing: 16) {
                ForEach(players) { player in
                    LineupPlayerStatRow(
                        player: player.player,
                        stats: getPlayerStats(player)
                    )
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }
    
    private var topFivePlayers: [PlayerProfileData] {
        Array(topPlayers.prefix(5))
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
