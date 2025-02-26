import SwiftUI

// MARK: - Formation View
struct FormationView: View {
    let lineup: TeamLineup
    @Environment(\.colorScheme) private var colorScheme
    
    // 선수 통계 정보 가져오기
    private func getPlayerRating(_ player: LineupPlayer, _ lineup: TeamLineup) -> Double {
        guard let teamStats = lineup.teamStats?.first(where: { $0.team.id == lineup.team.id }),
              let playerStat = teamStats.players.first(where: { $0.player.id == player.player.id }),
              let stats = playerStat.statistics.first,
              let games = stats.games,
              let ratingStr = games.rating,
              let rating = Double(ratingStr) else {
            return 0.0
        }
        return rating
    }
    
    private func getPlayerGoals(_ player: LineupPlayer, _ lineup: TeamLineup) -> Int {
        guard let teamStats = lineup.teamStats?.first(where: { $0.team.id == lineup.team.id }),
              let playerStat = teamStats.players.first(where: { $0.player.id == player.player.id }),
              let stats = playerStat.statistics.first,
              let goals = stats.goals?.total else {
            return 0
        }
        return goals
    }
    
    private func getPlayerAssists(_ player: LineupPlayer, _ lineup: TeamLineup) -> Int {
        guard let teamStats = lineup.teamStats?.first(where: { $0.team.id == lineup.team.id }),
              let playerStat = teamStats.players.first(where: { $0.player.id == player.player.id }),
              let stats = playerStat.statistics.first,
              let assists = stats.goals?.assists else {
            return 0
        }
        return assists
    }
    
    private func getPlayerYellowCards(_ player: LineupPlayer, _ lineup: TeamLineup) -> Int {
        guard let teamStats = lineup.teamStats?.first(where: { $0.team.id == lineup.team.id }),
              let playerStat = teamStats.players.first(where: { $0.player.id == player.player.id }),
              let stats = playerStat.statistics.first,
              let cards = stats.cards,
              let yellow = cards.yellow else {
            return 0
        }
        return yellow
    }
    
    private func getPlayerRedCards(_ player: LineupPlayer, _ lineup: TeamLineup) -> Int {
        guard let teamStats = lineup.teamStats?.first(where: { $0.team.id == lineup.team.id }),
              let playerStat = teamStats.players.first(where: { $0.player.id == player.player.id }),
              let stats = playerStat.statistics.first,
              let cards = stats.cards,
              let red = cards.red else {
            return 0
        }
        return red
    }
    
    // 포지션별 선수 그룹화
    private var playersByPositionGroup: [String: [LineupPlayer]] {
        var result: [String: [LineupPlayer]] = [:]
        
        for player in lineup.startXI {
            guard let pos = player.pos else { continue }
            let group = FormationPositions.getPositionGroup(for: pos)
            
            if result[group] == nil {
                result[group] = []
            }
            result[group]?.append(player)
        }
        
        return result
    }
    
    // 포지션 그룹별 선수 연결선 생성 (개선된 매칭 로직 적용)
    private func createConnectionLines(for positionGroup: String, positions: [[Double]], geometry: GeometryProxy) -> some View {
        // 개선된 매칭 로직 사용
        let matchingPlayers = findMatchingPlayers(for: positionGroup, in: lineup.startXI)
        
        guard matchingPlayers.count >= 2, positions.count >= 2 else {
            return AnyView(EmptyView())
        }
        
        // 같은 포지션 그룹의 선수들을 연결하는 선
        return AnyView(
            Path { path in
                // 첫 번째 위치로 이동
                let startX = CGFloat(positions[0][0]) * geometry.size.width / 10
                let startY = geometry.size.height - (CGFloat(positions[0][1]) * geometry.size.height / 10)
                path.move(to: CGPoint(x: startX, y: startY))
                
                // 나머지 위치로 선 그리기
                for i in 1..<positions.count {
                    if i < positions.count {
                        let x = CGFloat(positions[i][0]) * geometry.size.width / 10
                        let y = geometry.size.height - (CGFloat(positions[i][1]) * geometry.size.height / 10)
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(getPositionColor(positionGroup).opacity(0.6), style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round, dash: [5, 5]))
        )
    }
    
    // 포지션 그룹에 따른 색상 결정
    private func getPositionColor(_ positionGroup: String) -> Color {
        switch positionGroup {
        case "GK": return .cyan
        case "DEF": return .blue
        case "MID", "CDM": return .green
        case "CAM": return .orange
        case "FW": return .red
        default: return .gray
        }
    }
    
    // 선수 이름에서 성(last name)만 추출
    private func getLastName(_ fullName: String) -> String {
        let components = fullName.components(separatedBy: " ")
        if components.count > 1 {
            return components.last ?? fullName
        } else {
            return fullName
        }
    }
    
    // 포지션을 간단한 약어(G, D, M, F)로 변환
    private func getSimplePosition(_ position: String) -> String {
        let pos = position.uppercased()
        
        if pos.contains("GK") || pos.contains("GOALKEEPER") || pos == "G" {
            return "G"
        } else if pos.contains("CB") || pos.contains("LB") || pos.contains("RB") || 
                  pos.contains("WB") || pos.contains("DEF") || pos == "D" {
            return "D"
        } else if pos.contains("CM") || pos.contains("DM") || pos.contains("AM") || 
                  pos.contains("LM") || pos.contains("RM") || pos.contains("MID") || pos == "M" {
            return "M"
        } else if pos.contains("ST") || pos.contains("CF") || pos.contains("LW") || 
                  pos.contains("RW") || pos.contains("FW") || pos == "F" {
            return "F"
        }
        
        // 기본값
        return "M"
    }
    
    // 특정 포지션 그룹에 맞는 선수들 찾기 (개선된 버전)
    private func findMatchingPlayers(for positionGroup: String, in players: [LineupPlayer]) -> [LineupPlayer] {
        // 1. 포지션 그룹별 선수 매칭 우선순위 정의 (더 많은 포지션 약어 추가)
        let positionPriorities: [String: [String]] = [
            "GK": ["GK", "G", "GOALKEEPER"],
            "DEF": ["CB", "LB", "RB", "LWB", "RWB", "D", "DEF", "BACK"],
            "CDM": ["CDM", "DM", "DMF", "DCM", "DEFENSIVE", "HOLDING", "PIVOT"],
            "MID": ["CM", "LM", "RM", "M", "MID", "CMF", "CENTRAL"],
            "CAM": ["CAM", "AM", "AMF", "LAM", "RAM", "ACM", "ATTACKING", "OFFENSIVE", "PLAYMAKER"],
            "FW": ["ST", "CF", "LW", "RW", "LF", "RF", "F", "FW", "FORWARD", "STRIKER", "WING"]
        ]
        
        // 포지션 위치 정보 (왼쪽/오른쪽/중앙)
        let leftPositions = ["LB", "LWB", "LCB", "LM", "LW", "LAM", "LF", "LEFT"]
        let rightPositions = ["RB", "RWB", "RCB", "RM", "RW", "RAM", "RF", "RIGHT"]
        let centerPositions = ["CB", "CM", "CAM", "CDM", "CF", "ST", "CENTER", "CENTRAL"]
        
        // 포메이션 데이터에서 위치 정보 추출
        var positionLocations: [Int: String] = [:]
        if let positions = FormationPositions.formationData[lineup.formation]?[positionGroup] {
            for (index, position) in positions.enumerated() {
                let x = position[0]
                // x 좌표에 따라 왼쪽/오른쪽/중앙 결정
                if x < 4 {
                    positionLocations[index] = "LEFT"
                } else if x > 6 {
                    positionLocations[index] = "RIGHT"
                } else {
                    positionLocations[index] = "CENTER"
                }
            }
        }
        
        // 2. 포지션 그룹에 정확히 매칭되는 선수들 먼저 찾기
        var exactMatches: [LineupPlayer] = []
        var closeMatches: [LineupPlayer] = []
        var fallbackMatches: [LineupPlayer] = []
        var positionBasedMatches: [LineupPlayer] = []
        
        // 위치별 선수 분류
        var leftPlayers: [LineupPlayer] = []
        var rightPlayers: [LineupPlayer] = []
        var centerPlayers: [LineupPlayer] = []
        
        // 해당 포지션 그룹의 우선순위 포지션 목록
        let priorityPositions = positionPriorities[positionGroup] ?? []
        
        // 디버깅을 위한 로그
        print("🔍 Finding players for position group: \(positionGroup)")
        print("🔍 Priority positions: \(priorityPositions)")
        print("🔍 Total players to match: \(players.count)")
        print("🔍 Formation: \(lineup.formation)")
        print("🔍 Position locations: \(positionLocations)")
        
        // 포메이션 기반 추론을 위한 준비
        _ = lineup.formation.split(separator: "-").compactMap { Int($0) }
        let hasCDMPosition = lineup.formation.contains("4-2-3") || 
                           lineup.formation.contains("3-2-") || 
                           lineup.formation.contains("4-1-") || 
                           lineup.formation.contains("3-1-")
        
        let hasCAMPosition = lineup.formation.contains("4-2-3") || 
                           lineup.formation.contains("4-3-2") || 
                           lineup.formation.contains("4-4-1-1") || 
                           lineup.formation.contains("3-4-1")
        
        // 모든 선수 순회
        for player in players {
            guard let pos = player.pos?.uppercased() else { 
                print("⚠️ Player \(player.name) has no position")
                continue 
            }
            
            print("🔍 Checking player: \(player.name), Position: \(pos)")
            
            let playerGroup = FormationPositions.getPositionGroup(for: pos)
            print("🔍 Player group determined: \(playerGroup)")
            
            // 선수의 위치 정보 (왼쪽/오른쪽/중앙) 결정
            var playerLocation = "CENTER" // 기본값은 중앙
            
            // 포지션 문자열에서 위치 정보 추출
            if leftPositions.contains(where: { pos.contains($0) }) {
                playerLocation = "LEFT"
            } else if rightPositions.contains(where: { pos.contains($0) }) {
                playerLocation = "RIGHT"
            } else if centerPositions.contains(where: { pos.contains($0) }) {
                playerLocation = "CENTER"
            }
            
            // 그리드 위치에서 추가 정보 활용
            if let gridPos = player.gridPosition {
                // x 좌표가 작을수록 왼쪽, 클수록 오른쪽
                if gridPos.x <= 1 {
                    playerLocation = "LEFT"
                } else if gridPos.x >= 3 {
                    playerLocation = "RIGHT"
                } else {
                    playerLocation = "CENTER"
                }
            }
            
            print("🔍 Player location determined: \(playerLocation)")
            
            // 위치별 선수 분류
            switch playerLocation {
            case "LEFT":
                leftPlayers.append(player)
            case "RIGHT":
                rightPlayers.append(player)
            default:
                centerPlayers.append(player)
            }
            
            // 정확한 포지션 그룹 매칭
            if playerGroup == positionGroup {
                print("✅ Exact group match for \(player.name): \(pos) -> \(positionGroup)")
                
                // 우선순위에 따라 정렬
                if priorityPositions.contains(where: { pos.contains($0) }) {
                    print("⭐ Priority match for \(player.name)")
                    exactMatches.append(player)
                } else {
                    closeMatches.append(player)
                }
                continue
            }
            
            // 특수 케이스 처리 - 더 많은 케이스 추가
            switch positionGroup {
            case "CDM":
                if pos.contains("DM") || pos.contains("CDM") || pos.contains("DMF") || 
                   pos.contains("DEFENSIVE MID") || pos.contains("HOLDING MID") ||
                   (pos.contains("CM") && (pos.contains("D") || pos.contains("DEFENSIVE"))) {
                    print("✅ CDM fallback match for \(player.name): \(pos)")
                    fallbackMatches.append(player)
                }
                // 포메이션 기반 추론 (그리드 위치 활용)
                else if (pos.contains("CM") || pos.contains("M")) && hasCDMPosition {
                    if let gridPos = player.gridPosition {
                        // y 좌표가 클수록 수비에 가까움 (일반적으로 3 이상이면 수비형 미드필더)
                        if gridPos.y >= 3 {
                            print("✅ CDM position-based match for \(player.name): grid \(gridPos)")
                            positionBasedMatches.append(player)
                        }
                    }
                }
            case "CAM":
                if pos.contains("AM") || pos.contains("CAM") || pos.contains("AMF") || 
                   pos.contains("ATTACKING MID") || pos.contains("OFFENSIVE MID") ||
                   (pos.contains("CM") && (pos.contains("A") || pos.contains("ATTACKING"))) {
                    print("✅ CAM fallback match for \(player.name): \(pos)")
                    fallbackMatches.append(player)
                }
                // 포메이션 기반 추론 (그리드 위치 활용)
                else if (pos.contains("CM") || pos.contains("M")) && hasCAMPosition {
                    if let gridPos = player.gridPosition {
                        // y 좌표가 작을수록 공격에 가까움 (일반적으로 3 미만이면 공격형 미드필더)
                        if gridPos.y < 3 {
                            print("✅ CAM position-based match for \(player.name): grid \(gridPos)")
                            positionBasedMatches.append(player)
                        }
                    }
                }
            case "MID":
                if playerGroup == "CDM" || playerGroup == "CAM" {
                    print("✅ MID fallback match for \(player.name): \(pos) -> \(playerGroup)")
                    fallbackMatches.append(player)
                }
            default:
                break
            }
        }
        
        // 3. 결과 합치기 (정확한 매칭 먼저, 그 다음 가까운 매칭, 그 다음 위치 기반 매칭, 마지막으로 대체 매칭)
        var result = exactMatches + closeMatches + positionBasedMatches + fallbackMatches
        print("📊 Initial matching result for \(positionGroup): \(result.count) players")
        
        // 4. 위치 기반 정렬 (왼쪽/오른쪽/중앙)
        if let positions = FormationPositions.formationData[lineup.formation]?[positionGroup] {
            var sortedResult: [LineupPlayer] = []
            
            // 각 포지션 위치에 맞는 선수 할당
            for (index, _) in positions.enumerated() {
                if index >= result.count {
                    break // 선수가 부족한 경우 중단
                }
                
                let location = positionLocations[index] ?? "CENTER"
                var matchedPlayer: LineupPlayer? = nil
                
                // 위치에 맞는 선수 찾기
                switch location {
                case "LEFT":
                    if !leftPlayers.isEmpty {
                        matchedPlayer = leftPlayers.removeFirst()
                    }
                case "RIGHT":
                    if !rightPlayers.isEmpty {
                        matchedPlayer = rightPlayers.removeFirst()
                    }
                default: // CENTER
                    if !centerPlayers.isEmpty {
                        matchedPlayer = centerPlayers.removeFirst()
                    }
                }
                
                // 위치에 맞는 선수가 없으면 일반 결과에서 가져오기
                if matchedPlayer == nil && !result.isEmpty {
                    matchedPlayer = result.removeFirst()
                }
                
                if let player = matchedPlayer {
                    sortedResult.append(player)
                    print("📍 Assigned \(player.name) to position \(index) (\(location))")
                }
            }
            
            // 남은 선수들 추가
            sortedResult.append(contentsOf: result)
            
            result = sortedResult
        }
        
        print("📊 Final matching result for \(positionGroup): \(result.count) players")
        print("📊 - Exact matches: \(exactMatches.count)")
        print("📊 - Close matches: \(closeMatches.count)")
        print("📊 - Position-based matches: \(positionBasedMatches.count)")
        print("📊 - Fallback matches: \(fallbackMatches.count)")
        print("📊 - Left players: \(leftPlayers.count)")
        print("📊 - Right players: \(rightPlayers.count)")
        print("📊 - Center players: \(centerPlayers.count)")
        
        return result
    }
    
    // 포지션 그룹에 따라 y 좌표 계산
    private func getYPosition(for posGroup: String, gridPosition: (x: Int, y: Int), geometry: GeometryProxy) -> CGFloat {
        switch posGroup {
        case "GK":
            // 골키퍼는 하단에 배치
            return geometry.size.height * 0.8
        case "DEF":
            // 수비수는 하단과 중간 사이에 배치
            return geometry.size.height * 0.6
        case "CDM":
            // 수비형 미드필더는 중간 약간 아래에 배치
            return geometry.size.height * 0.4
        case "MID":
            // 미드필더는 중간에 배치
            return geometry.size.height * 0.3
        case "CAM":
            // 공격형 미드필더는 중간 약간 위에 배치
            return geometry.size.height * 0.2
        case "FW":
            // 공격수는 상단에 배치
            return geometry.size.height * 0.1
        default:
            // 기본값은 FormationPositions에서 제공하는 좌표 사용
            if let positions = FormationPositions.formationData[lineup.formation]?[posGroup],
               !positions.isEmpty,
               let position = positions.first {
                // y 좌표 반전
                return geometry.size.height - (CGFloat(position[1]) * geometry.size.height / 10)
            }
            // 그리드 위치 사용 (폴백)
            return geometry.size.height - (CGFloat(gridPosition.y) * geometry.size.height / 10)
        }
    }
    
    // 잔디 색상 및 패턴 정의
    private var grassGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 0.25, green: 0.6, blue: 0.3),
                Color(red: 0.3, green: 0.65, blue: 0.35)
            ]),
            startPoint: .top,
            endPoint: .bottom
        )
    }
    
    private var darkModeGrassGradient: LinearGradient {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 0.15, green: 0.4, blue: 0.2),
                Color(red: 0.2, green: 0.45, blue: 0.25)
            ]),
            startPoint: .top,
            endPoint: .bottom
        )
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 축구장 배경
                (colorScheme == .dark ? darkModeGrassGradient : grassGradient)
                    .overlay {
                        // 잔디 패턴
                        ZStack {
                            ForEach(0..<20, id: \.self) { row in
                                Rectangle()
                                    .fill(Color.white.opacity(0.03))
                                    .frame(height: 1)
                                    .offset(y: CGFloat(row) * geometry.size.height / 20 - geometry.size.height / 2)
                            }
                            
                            ForEach(0..<10, id: \.self) { col in
                                Rectangle()
                                    .fill(Color.white.opacity(0.03))
                                    .frame(width: 1)
                                    .offset(x: CGFloat(col) * geometry.size.width / 10 - geometry.size.width / 2)
                            }
                        }
                    }
                
                // 축구장 라인
                FieldLinesView(geometry: geometry)
                
                // 포메이션 연결선
                if let formationData = FormationPositions.formationData[lineup.formation] {
                    ForEach(Array(formationData.keys), id: \.self) { positionGroup in
                        if let positions = formationData[positionGroup] {
                            createConnectionLines(for: positionGroup, positions: positions, geometry: geometry)
                        }
                    }
                }
                
                // 포메이션 라인 (수비, 미드필드, 공격 라인)
                Group {
                    // 수비수-골키퍼 라인 (하단)
                    Rectangle()
                        .fill(Color.blue.opacity(0.3))
                        .frame(width: geometry.size.width * 0.9, height: 1)
                        .position(x: geometry.size.width / 2, y: geometry.size.height * 0.3)
                    
                    // 미드필더-수비수 라인 (중간)
                    Rectangle()
                        .fill(Color.green.opacity(0.3))
                        .frame(width: geometry.size.width * 0.9, height: 1)
                        .position(x: geometry.size.width / 2, y: geometry.size.height * 0.55)
                    
                    // 공격수-미드필더 라인 (상단)
                    Rectangle()
                        .fill(Color.red.opacity(0.3))
                        .frame(width: geometry.size.width * 0.9, height: 1)
                        .position(x: geometry.size.width / 2, y: geometry.size.height * 0.8)
                }
                
                // 포메이션 표시 - 포메이션 데이터 기반으로 표시
                ForEach(lineup.startXI) { player in
                    let posGroup = FormationPositions.getPositionGroup(for: player.pos ?? "")
                    
                    // 포메이션 데이터에서 해당 포지션 그룹의 위치 가져오기
                    if let positions = FormationPositions.formationData[lineup.formation]?[posGroup],
                       !positions.isEmpty {
                        // 각 포지션 그룹에 속한 선수들 찾기
                        let groupPlayers = lineup.startXI.filter { 
                            FormationPositions.getPositionGroup(for: $0.pos ?? "") == posGroup 
                        }
                        
                        // 현재 선수의 인덱스 찾기
                        if let playerIndex = groupPlayers.firstIndex(where: { $0.id == player.id }) {
                            // 포지션 인덱스 (배열 범위 내에서)
                            let positionIndex = min(playerIndex, positions.count - 1)
                            
                            // 화면 좌표 계산
                            let position = positions[positionIndex]
                            let x = CGFloat(position[0]) * geometry.size.width / 10
                            // y 좌표 반전 (10에서 빼서 반전)
                            let y = geometry.size.height - (CGFloat(position[1]) * geometry.size.height / 10)
                            
                            NavigationLink(destination: PlayerProfileView(playerId: player.player.id)) {
                                LineupPlayerCardView(
                                    player: player, 
                                    getLastName: getLastName,
                                    rating: getPlayerRating(player, lineup),
                                    goals: getPlayerGoals(player, lineup)
                                )
                            }
                            .position(x: x, y: y)
                            .shadow(color: Color.black.opacity(0.3), radius: 5, x: 0, y: 2)
                        }
                    } else if let gridPosition = player.gridPosition {
                        // 폴백: 포메이션 데이터가 없는 경우 그리드 위치 사용
                        let x = CGFloat(gridPosition.x) * geometry.size.width / 5
                        let y = getYPosition(for: posGroup, gridPosition: gridPosition, geometry: geometry)
                        
                        NavigationLink(destination: PlayerProfileView(playerId: player.player.id)) {
                            LineupPlayerCardView(
                                player: player, 
                                getLastName: getLastName,
                                rating: getPlayerRating(player, lineup),
                                goals: getPlayerGoals(player, lineup)
                            )
                        }
                        .position(x: x, y: y)
                        .shadow(color: Color.black.opacity(0.3), radius: 5, x: 0, y: 2)
                    }
                }
                
                // 팀 정보 및 포메이션 표시
                VStack {
                    HStack {
                        // 팀 로고
                        AsyncImage(url: URL(string: lineup.team.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                                .frame(width: 28, height: 28)
                        } placeholder: {
                            Circle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(width: 28, height: 28)
                        }
                        
                        // 팀 이름 및 포메이션
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lineup.team.name)
                                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                                .foregroundColor(.white)
                            
                            Text(lineup.formation)
                                .font(.system(.caption, design: .rounded))
                                .foregroundColor(.white.opacity(0.8))
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.black.opacity(0.5))
                    )
                    .padding(.top, 8)
                    .padding(.horizontal, 8)
                    
                    Spacer()
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.2), radius: 10, x: 0, y: 5)
        }
        .padding(.horizontal, 8) // 좌우 여백 유지
        .padding(.vertical, 0) // 세로 패딩 제거
        .frame(maxWidth: .infinity) // 최대 너비로 설정
    }
}

// 축구장 라인 뷰
struct FieldLinesView: View {
    let geometry: GeometryProxy
    
    var body: some View {
        ZStack {
            // 외곽선
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.white.opacity(0.7), lineWidth: 2)
                .frame(width: geometry.size.width * 0.95, height: geometry.size.height * 0.95)
            
            // 센터 라인
            Rectangle()
                .fill(Color.white.opacity(0.7))
                .frame(width: geometry.size.width * 0.95, height: 2)
            
            // 센터 서클
            Circle()
                .stroke(Color.white.opacity(0.7), lineWidth: 2)
                .frame(width: min(geometry.size.width, geometry.size.height) * 0.2)
            
            // 센터 점
            Circle()
                .fill(Color.white.opacity(0.7))
                .frame(width: 6, height: 6)
            
            // 상단 골 에어리어 (공격 쪽)
            VStack {
                ZStack {
                    // 페널티 박스
                    RoundedRectangle(cornerRadius: 2)
                        .stroke(Color.white.opacity(0.7), lineWidth: 2)
                        .frame(width: geometry.size.width * 0.6, height: geometry.size.height * 0.2)
                        .offset(y: -geometry.size.height * 0.375)
                    
                    // 골 에어리어
                    RoundedRectangle(cornerRadius: 2)
                        .stroke(Color.white.opacity(0.7), lineWidth: 2)
                        .frame(width: geometry.size.width * 0.3, height: geometry.size.height * 0.08)
                        .offset(y: -geometry.size.height * 0.435)
                    
                    // 골대
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color.white.opacity(0.9))
                        .frame(width: geometry.size.width * 0.15, height: 4)
                        .offset(y: -geometry.size.height * 0.475)
                    
                    // 페널티 아크
                    Arc(startAngle: .degrees(230), endAngle: .degrees(310), clockwise: false)
                        .stroke(Color.white.opacity(0.7), lineWidth: 2)
                        .frame(width: geometry.size.width * 0.2, height: geometry.size.height * 0.1)
                        .offset(y: -geometry.size.height * 0.32)
                    
                    // 페널티 스팟
                    Circle()
                        .fill(Color.white.opacity(0.7))
                        .frame(width: 6, height: 6)
                        .offset(y: -geometry.size.height * 0.35)
                }
                
                Spacer()
                
                // 하단 골 에어리어 (수비 쪽)
                ZStack {
                    // 페널티 박스
                    RoundedRectangle(cornerRadius: 2)
                        .stroke(Color.white.opacity(0.7), lineWidth: 2)
                        .frame(width: geometry.size.width * 0.6, height: geometry.size.height * 0.2)
                        .offset(y: geometry.size.height * 0.375)
                    
                    // 골 에어리어
                    RoundedRectangle(cornerRadius: 2)
                        .stroke(Color.white.opacity(0.7), lineWidth: 2)
                        .frame(width: geometry.size.width * 0.3, height: geometry.size.height * 0.08)
                        .offset(y: geometry.size.height * 0.435)
                    
                    // 골대
                    RoundedRectangle(cornerRadius: 1)
                        .fill(Color.white.opacity(0.9))
                        .frame(width: geometry.size.width * 0.15, height: 4)
                        .offset(y: geometry.size.height * 0.475)
                    
                    // 페널티 아크
                    Arc(startAngle: .degrees(50), endAngle: .degrees(130), clockwise: false)
                        .stroke(Color.white.opacity(0.7), lineWidth: 2)
                        .frame(width: geometry.size.width * 0.2, height: geometry.size.height * 0.1)
                        .offset(y: geometry.size.height * 0.32)
                    
                    // 페널티 스팟
                    Circle()
                        .fill(Color.white.opacity(0.7))
                        .frame(width: 6, height: 6)
                        .offset(y: geometry.size.height * 0.35)
                }
            }
            .frame(height: geometry.size.height * 0.95)
        }
    }
}

// 호 모양을 그리기 위한 Shape
struct Arc: Shape {
    var startAngle: Angle
    var endAngle: Angle
    var clockwise: Bool

    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.addArc(center: CGPoint(x: rect.midX, y: rect.midY),
                    radius: rect.width / 2,
                    startAngle: startAngle,
                    endAngle: endAngle,
                    clockwise: clockwise)
        return path
    }
}

// 빈 포지션 카드 (포메이션에 정의된 포지션에 선수가 없을 때 표시)
struct EmptyPositionCard: View {
    let positionGroup: String
    
    // 포지션 그룹에 따른 배경색 결정
    private var positionColor: Color {
        switch positionGroup {
        case "GK": return Color.cyan.opacity(0.4)
        case "DEF": return Color.blue.opacity(0.4)
        case "MID", "CDM": return Color.green.opacity(0.4)
        case "CAM": return Color.orange.opacity(0.4)
        case "FW": return Color.red.opacity(0.4)
        default: return Color.gray.opacity(0.4)
        }
    }
    
    var body: some View {
        VStack(spacing: 8) {
            // 배경 원
            Circle()
                .fill(positionColor)
                .frame(width: 44, height: 44)
                .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
                .overlay(
                    Text("?")
                        .font(.system(.body, design: .rounded).weight(.bold))
                        .foregroundColor(.white.opacity(0.7))
                )
            
            // 포지션 그룹 이름
            Text(positionGroup)
                .font(.system(.caption2, design: .rounded).weight(.medium))
                .foregroundColor(.white)
                .padding(.horizontal, 3)
                .padding(.vertical, 1)
                .background(Color.black.opacity(0.6))
                .cornerRadius(3)
        }
        .frame(width: 60) // 가로 간격 확보를 위한 고정 너비
    }
}
