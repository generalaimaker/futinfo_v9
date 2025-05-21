import SwiftUI

// MARK: - Formation View
struct FormationView: View {
    let lineup: TeamLineup
    /// When true, the Y‑axis is not flipped (used for home side at top of combined pitch)
    let flipVertical: Bool
    /// Whether to draw the pitch background‑and‑lines.
    /// Set to `false` when we stack two FormationView instances on a single pitch.
    let drawPitch: Bool
    var onPlayerTap: (Int) -> Void  // 선수 ID를 전달하는 클로저 추가
    
    init(lineup: TeamLineup, flipVertical: Bool = false, drawPitch: Bool = true, onPlayerTap: @escaping (Int) -> Void = { _ in }) {
        self.lineup = lineup
        self.flipVertical = flipVertical
        self.drawPitch = drawPitch
        self.onPlayerTap = onPlayerTap
    }
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
    
    /// Returns a refined position group.
    /// For 4-2-3-1 formation, we force assign players to specific positions
    /// based on their index in the lineup.
    private func adjustedGroup(for player: LineupPlayer) -> String {
        // 디버깅: 실제 포지션 데이터 확인
        print("👉 Player: \(player.player.name), Position: \(player.pos ?? "Unknown"), Grid: \(player.gridPosition?.x ?? -1),\(player.gridPosition?.y ?? -1)")
        
        // 포메이션별 특별 처리
        switch lineup.formation {
        case "4-2-3-1":
            // 골키퍼 처리
            if (player.pos ?? "").uppercased().contains("GK") {
                return "GK"
            }
            
            // 수비수 처리
            if ["LB", "LCB", "CB", "RCB", "RB", "LWB", "RWB"].contains(where: { (player.pos ?? "").uppercased().contains($0) }) {
                return "DEF"
            }
            
            // 미드필더 및 공격수 처리 - 인덱스 기반 강제 할당
            let allPlayers = lineup.startXI
            let midfielders = allPlayers.filter {
                let pos = ($0.pos ?? "").uppercased()
                return pos.contains("M") || pos.contains("AM") || pos.contains("DM") || pos.contains("CM")
            }.sorted { ($0.gridPosition?.x ?? 0) < ($1.gridPosition?.x ?? 0) }
            
            if let index = midfielders.firstIndex(where: { $0.id == player.id }) {
                // 미드필더 수에 따라 다르게 처리
                switch midfielders.count {
                case 5: // 5명인 경우 (4-2-3-1 기준)
                    if index < 2 {
                        return "CDM" // 첫 2명은 CDM
                    } else {
                        // 나머지는 LW, CAM, RW로 할당
                        if index == 2 {
                            return "LW"
                        } else if index == 3 {
                            return "CAM"
                        } else {
                            return "RW"
                        }
                    }
                case 3: // 3명인 경우
                    if index == 0 {
                        return "LW"
                    } else if index == 1 {
                        return "CAM"
                    } else {
                        return "RW"
                    }
                default: // 기타 경우
                    if index % 2 == 0 {
                        return "CDM"
                    } else {
                        return "CAM"
                    }
                }
            }
            
            // 스트라이커 처리
            if ["ST", "CF", "SS"].contains(where: { (player.pos ?? "").uppercased().contains($0) }) {
                return "FW"
            }
            
        case "4-1-4-1":
            // 골키퍼 처리
            if (player.pos ?? "").uppercased().contains("GK") {
                return "GK"
            }
            
            // 수비수 처리
            if ["LB", "LCB", "CB", "RCB", "RB", "LWB", "RWB"].contains(where: { (player.pos ?? "").uppercased().contains($0) }) {
                return "DEF"
            }
            
            // CDM 처리
            if ["CDM", "DMF", "DM", "ANCHOR"].contains(where: { (player.pos ?? "").uppercased().contains($0) }) {
                return "CDM"
            }
            
            // 미드필더 처리 - 인덱스 기반 강제 할당
            let midfielders = lineup.startXI.filter {
                let pos = ($0.pos ?? "").uppercased()
                return (pos.contains("M") || pos.contains("CM")) && !pos.contains("DM") && !pos.contains("AM")
            }.sorted { ($0.gridPosition?.x ?? 0) < ($1.gridPosition?.x ?? 0) }
            
            if let index = midfielders.firstIndex(where: { $0.id == player.id }) {
                switch index {
                case 0: return "LM"
                case 1: return "LCM"
                case 2: return "RCM"
                case 3: return "RM"
                default: return "MID"
                }
            }
            
            // 스트라이커 처리
            if ["ST", "CF", "SS"].contains(where: { (player.pos ?? "").uppercased().contains($0) }) {
                return "FW"
            }
            
        case "3-4-2-1":
            // 디버깅 정보 출력
            print("🔍 3-4-2-1 포메이션 처리: \(player.player.name), Position: \(player.pos ?? "Unknown")")
            
            // 골키퍼 처리
            if (player.pos ?? "").uppercased().contains("GK") {
                return "GK"
            }
            
            // 수비수 처리
            if ["LCB", "CB", "RCB", "LWB", "RWB"].contains(where: { (player.pos ?? "").uppercased().contains($0) }) {
                return "DEF"
            }
            
            // 스트라이커 처리 - 최우선 처리
            let pos = (player.pos ?? "").uppercased()
            if pos.contains("ST") || pos.contains("CF") || pos.contains("SS") ||
               (pos.contains("FW") && !pos.contains("LW") && !pos.contains("RW")) {
                print("✅ 스트라이커 감지: \(player.player.name)")
                return "FW"
            }
            
            // 공격형 미드필더 처리
            if pos.contains("AM") || pos.contains("CAM") || pos.contains("LW") || pos.contains("RW") {
                // 공격형 미드필더 수에 따라 처리
                let attackingMids = lineup.startXI.filter { p in
                    let ppos = (p.pos ?? "").uppercased()
                    return (ppos.contains("AM") || ppos.contains("CAM") ||
                            ppos.contains("LW") || ppos.contains("RW")) &&
                           !(ppos.contains("ST") || ppos.contains("CF") || ppos.contains("SS"))
                }.sorted { ($0.gridPosition?.x ?? 0) < ($1.gridPosition?.x ?? 0) }
                
                if let index = attackingMids.firstIndex(where: { $0.id == player.id }) {
                    print("✅ 공격형 미드필더 감지: \(player.player.name), 인덱스: \(index)")
                    return "CAM"
                }
            }
            
            // 미드필더 처리
            if pos.contains("M") || pos.contains("WB") {
                return "MID"
            }
        
        default:
            break
        }
        
        // 기본 포지션 그룹 처리
        guard let group = FormationPositions.getPositionGroup(for: player.pos ?? "") as String? else {
            return "MID"
        }
        
        return group
    }

    // 포지션별 선수 그룹화
    private var playersByPositionGroup: [String: [LineupPlayer]] {
        var result: [String: [LineupPlayer]] = [:]
        
        for player in lineup.startXI {
            guard player.pos != nil else { continue }
            let group = adjustedGroup(for: player)
            
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
    
    /// Returns players whose position maps to `positionGroup`,
    /// ordered from left to right based on gridPosition.x (if available).
    private func findMatchingPlayers(for positionGroup: String,
                                     in players: [LineupPlayer]) -> [LineupPlayer] {
        players
            .filter { player in
                guard player.pos != nil else { return false }
                return adjustedGroup(for: player) == positionGroup
            }
            .sorted {
                let x0 = $0.gridPosition?.x ?? 2
                let x1 = $1.gridPosition?.x ?? 2
                return x0 < x1
            }
    }
    
    // 포지션 그룹에 따라 y 좌표 계산
    private func getYPosition(for posGroup: String,
                              gridPosition: (x: Int, y: Int),
                              geometry: GeometryProxy,
                              flipVertical: Bool) -> CGFloat {
        let baseHeight = geometry.size.height
        switch posGroup {
        case "GK":
            let y = baseHeight * 0.9  // 더 아래로 이동
            return flipVertical ? (baseHeight - y) : y
        case "DEF":
            let y = baseHeight * 0.7  // 더 아래로 이동
            return flipVertical ? (baseHeight - y) : y
        case "CDM":
            let y = baseHeight * 0.5  // 중간 위치
            return flipVertical ? (baseHeight - y) : y
        case "MID":
            let y = baseHeight * 0.45 // CDM과 더 구분
            return flipVertical ? (baseHeight - y) : y
        case "CAM":
            let y = baseHeight * 0.3  // 더 위로 이동
            return flipVertical ? (baseHeight - y) : y
        case "FW":
            let y = baseHeight * 0.15 // 더 위로 이동
            return flipVertical ? (baseHeight - y) : y
        default:
            // 기본값은 FormationPositions에서 제공하는 좌표 사용
            if let positions = FormationPositions.formationData[lineup.formation]?[posGroup],
               !positions.isEmpty,
               let position = positions.first {
                let yPos = CGFloat(position[1]) * baseHeight / 10
                return flipVertical ? yPos : (baseHeight - yPos)
            }
            // 그리드 위치 사용 (폴백)
            let yPos = CGFloat(gridPosition.y) * baseHeight / 10
            return flipVertical ? yPos : (baseHeight - yPos)
        }
    }

    /// Creates the tappable player card at the specified field coordinates.
    @ViewBuilder
    private func playerCard(for player: LineupPlayer,
                            in lineup: TeamLineup,
                            x: CGFloat,
                            y: CGFloat) -> some View {
        Button(action: {
            onPlayerTap(player.player.id)  // 선수 ID 전달
        }) {
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
    
    /// Builds the view for a single player; returns EmptyView if coordinate cannot be resolved.
    private func viewForPlayer(_ player: LineupPlayer,
                               geometry: GeometryProxy) -> some View {
        let posGroup = adjustedGroup(for: player)
        
        // 좌→우 정렬
        let groupPlayers = lineup.startXI
            .filter { adjustedGroup(for: $0) == posGroup }
            .sorted { ($0.gridPosition?.x ?? 2) < ($1.gridPosition?.x ?? 2) }
        
        guard let playerIndex = groupPlayers.firstIndex(where: { $0.id == player.id }) else {
            return AnyView(EmptyView())
        }
        
        var finalX: CGFloat = 0
        var finalY: CGFloat = 0
        
        // 항상 FormationPositions에서 정의된 좌표 사용 시도
        if let positions = FormationPositions.formationData[lineup.formation]?[posGroup] {
            // 포지션 그룹에 정의된 좌표가 있는 경우
            let idx = min(playerIndex, positions.count - 1) // 인덱스 범위 체크
            let p = positions[idx]
            
            // 좌표 계산
            finalX = CGFloat(p[0]) * geometry.size.width / 10
            finalY = flipVertical
                ? CGFloat(p[1]) * geometry.size.height / 10
                : geometry.size.height - (CGFloat(p[1]) * geometry.size.height / 10)
            
            // 디버깅 정보
            print("📍 Player: \(player.player.name), Group: \(posGroup), Position: \(player.pos ?? "Unknown"), Coords: \(p[0]),\(p[1])")
        } else {
            // 정의된 좌표가 없는 경우 기본 위치 사용
            finalX = CGFloat(playerIndex + 1) * geometry.size.width / (CGFloat(groupPlayers.count) + 1)
            finalY = getYPosition(for: posGroup,
                                 gridPosition: player.gridPosition ?? (x: 2, y: 5),
                                 geometry: geometry,
                                 flipVertical: flipVertical)
            
            print("⚠️ No predefined coords for \(player.player.name), Group: \(posGroup), Position: \(player.pos ?? "Unknown")")
        }
        
        // 홈팀(상단)은 좌우 반전 없음, 원정팀(하단)은 좌우 반전
        if !flipVertical {
            // 원정팀(하단) - 좌우 반전
            finalX = geometry.size.width - finalX
        }
        
        return AnyView(
            playerCard(for: player,
                       in: lineup,
                       x: finalX,
                       y: finalY)
        )
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
    
    private var teamBanner: some View {
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
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if drawPitch {
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
                }

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
                    viewForPlayer(player, geometry: geometry)
                }

                // 팀 정보 및 포메이션 표시
                VStack {
                    if !flipVertical {
                        teamBanner
                        Spacer()
                    } else {
                        Spacer()
                        teamBanner
                    }
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
