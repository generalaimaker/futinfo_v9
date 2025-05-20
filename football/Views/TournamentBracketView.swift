import SwiftUI
import Foundation

struct TournamentBracketView: View {
    let rounds: [String]
    let fixtures: [Any] // Any 타입으로 다시 변경
    let formatDate: (String) -> String
    
    // 디버깅을 위한 상태 변수
    @State private var debugMessage: String = ""

    // 토너먼트 라운드 정렬 순서 (Round of 16 이상만, 없으면 최대 4개까지 강제 노출)
    private var sortedRounds: [String] {
        let knockout = rounds
            .filter { !$0.lowercased().contains("group") }
            .sorted { orderValue(for: $0) < orderValue(for: $1) }

        let filtered = knockout.filter { orderValue(for: $0) >= 70 }
        return filtered.isEmpty ? Array(knockout.prefix(4)) : filtered
    }

    /// Knock‑out 라운드 문자열을 우선순위로 변환
    private func orderValue(for round: String) -> Int {
        let lower = round.lowercased()

        // Final
        if lower == "final" || lower.contains("grand final") {
            return 100
        }

        // Semi‑final
        if lower.contains("semi") || lower.contains("1/2") {
            return 90
        }

        // Quarter‑final
        if lower.contains("quarter") || lower.contains("1/4") {
            return 80
        }

        // Round of 16 / Play‑off
        if lower.contains("round of 16") ||
           lower.contains("play‑off")      || lower.contains("playoff") ||
           lower.contains("1/8") {
            return 70
        }

        // Round of 32
        if lower.contains("round of 32") || lower.contains("1/16") {
            return 60
        }

        // Round of 64
        if lower.contains("round of 64") || lower.contains("1/32") {
            return 50
        }

        return 0      // 기타 (그룹 스테이지 등)
    }
    // placeholderMatch: 빈 경기 카드용 더미 데이터
    private var placeholderMatch: AggregateMatch {
        AggregateMatch(
            home: TeamMini(id: 0, name: "TBD", logo: ""),
            away: TeamMini(id: 1, name: "TBD", logo: ""),
            homeTotal: 0, awayTotal: 0)
    }
    
    // 16강 더미 데이터
    private var dummyR16Matches: [AggregateMatch] {
        [
            AggregateMatch(
                home: TeamMini(id: 1, name: "ARS", logo: "https://media.api-sports.io/football/teams/42.png"),
                away: TeamMini(id: 2, name: "RMA", logo: "https://media.api-sports.io/football/teams/541.png"),
                homeTotal: 5, awayTotal: 1
            ),
            AggregateMatch(
                home: TeamMini(id: 3, name: "PSV", logo: "https://media.api-sports.io/football/teams/197.png"),
                away: TeamMini(id: 4, name: "ATM", logo: "https://media.api-sports.io/football/teams/530.png"),
                homeTotal: 3, awayTotal: 2
            ),
            AggregateMatch(
                home: TeamMini(id: 5, name: "PSG", logo: "https://media.api-sports.io/football/teams/85.png"),
                away: TeamMini(id: 6, name: "LIV", logo: "https://media.api-sports.io/football/teams/40.png"),
                homeTotal: 1, awayTotal: 1
            ),
            AggregateMatch(
                home: TeamMini(id: 7, name: "CLB", logo: "https://media.api-sports.io/football/teams/569.png"),
                away: TeamMini(id: 8, name: "AVL", logo: "https://media.api-sports.io/football/teams/66.png"),
                homeTotal: 1, awayTotal: 6
            ),
            AggregateMatch(
                home: TeamMini(id: 9, name: "BAR", logo: "https://media.api-sports.io/football/teams/529.png"),
                away: TeamMini(id: 10, name: "BVB", logo: "https://media.api-sports.io/football/teams/165.png"),
                homeTotal: 5, awayTotal: 3
            ),
            AggregateMatch(
                home: TeamMini(id: 11, name: "FCB", logo: "https://media.api-sports.io/football/teams/157.png"),
                away: TeamMini(id: 12, name: "INT", logo: "https://media.api-sports.io/football/teams/505.png"),
                homeTotal: 3, awayTotal: 4
            )
        ]
    }
    
    // 8강 더미 데이터
    private var dummyQFMatches: [AggregateMatch] {
        [
            AggregateMatch(
                home: TeamMini(id: 1, name: "ARS", logo: "https://media.api-sports.io/football/teams/42.png"),
                away: TeamMini(id: 3, name: "PSV", logo: "https://media.api-sports.io/football/teams/197.png"),
                homeTotal: 4, awayTotal: 1
            ),
            AggregateMatch(
                home: TeamMini(id: 5, name: "PSG", logo: "https://media.api-sports.io/football/teams/85.png"),
                away: TeamMini(id: 8, name: "AVL", logo: "https://media.api-sports.io/football/teams/66.png"),
                homeTotal: 3, awayTotal: 2
            )
        ]
    }
    
    // 4강 더미 데이터
    private var dummySFMatches: [AggregateMatch] {
        [
            AggregateMatch(
                home: TeamMini(id: 1, name: "ARS", logo: "https://media.api-sports.io/football/teams/42.png"),
                away: TeamMini(id: 5, name: "PSG", logo: "https://media.api-sports.io/football/teams/85.png"),
                homeTotal: 2, awayTotal: 2
            )
        ]
    }
    
    // 결승 더미 데이터
    private var dummyFinalMatch: AggregateMatch {
        AggregateMatch(
            home: TeamMini(id: 1, name: "ARS", logo: "https://media.api-sports.io/football/teams/42.png"),
            away: TeamMini(id: 5, name: "PSG", logo: "https://media.api-sports.io/football/teams/85.png"),
            homeTotal: 1, awayTotal: 3
        )
    }
    
    /// 주어진 round(예: "Play‑off", "Round of 16")를 **포함**하는 모든 경기
    private func fixturesForRound(_ round: String) -> [Any] {
        let key = round.lowercased()
        return fixtures.filter { fixture in
            guard let dict = fixture as? [String: Any],
                  let leagueDict = dict["league"] as? [String: Any],
                  let fixtureRound = leagueDict["round"] as? String else {
                return false
            }
            return fixtureRound.lowercased().contains(key)
        }
    }
    
    // Fixture 타입의 필수 속성에 접근하기 위한 헬퍼 함수들
    private func getFixtureLeagueRound(_ fixture: Any) -> String {
        guard let dict = fixture as? [String: Any],
              let leagueDict = dict["league"] as? [String: Any],
              let round = leagueDict["round"] as? String else {
            return ""
        }
        return round
    }
    
    private func getFixtureTeams(_ fixture: Any) -> (home: (id: Int, name: String, logo: String), away: (id: Int, name: String, logo: String)) {
        guard let dict = fixture as? [String: Any],
              let teamsDict = dict["teams"] as? [String: Any],
              let homeDict = teamsDict["home"] as? [String: Any],
              let awayDict = teamsDict["away"] as? [String: Any],
              let homeId = homeDict["id"] as? Int,
              let homeName = homeDict["name"] as? String,
              let homeLogo = homeDict["logo"] as? String,
              let awayId = awayDict["id"] as? Int,
              let awayName = awayDict["name"] as? String,
              let awayLogo = awayDict["logo"] as? String else {
            return ((0, "", ""), (0, "", ""))
        }
        return ((homeId, homeName, homeLogo), (awayId, awayName, awayLogo))
    }
    
    private func getFixtureGoals(_ fixture: Any) -> (home: Int, away: Int) {
        guard let dict = fixture as? [String: Any],
              let goalsDict = dict["goals"] as? [String: Any],
              let home = goalsDict["home"] as? Int,
              let away = goalsDict["away"] as? Int else {
            return (0, 0)
        }
        return (home, away)
    }

    /// 실제 데이터가 존재하는 knockout 라운드만
    private var knockoutRoundsWithData: [String] {
        sortedRounds.filter { !fixturesForRound($0).isEmpty }
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

    /// 최소 정보만 담는 로컬 팀 모델
    private struct TeamMini: Identifiable {
        let id: Int
        let name: String
        let logo: String
    }

    /// 두 경기(홈/원정) 합산 정보를 담는 로컬 모델
    private struct AggregateMatch: Identifiable {
        let id = UUID()
        let home: TeamMini
        let away: TeamMini
        let homeTotal: Int
        let awayTotal: Int
    }
    
    /// 같은 라운드에서 두 팀이 홈/원정 두 번 치른 경우 1박스로 묶어 반환
    private func aggregatedMatches(for round: String) -> [AggregateMatch] {
        // roundFixtures 에는 이미 해당 라운드 경기만 필터링되어 있음
        let roundFixtures = fixturesForRound(round)
        
        // key: 정렬된 두 팀 id 조합
        var buckets: [String: [Any]] = [:]
        for f in roundFixtures {
            let teams = getFixtureTeams(f)
            let homeId = teams.home.id
            let awayId = teams.away.id
            let key = homeId < awayId ? "\(homeId)-\(awayId)" : "\(awayId)-\(homeId)"
            buckets[key, default: []].append(f)
        }
        
        // 각 버킷마다 합산 스코어 계산
        return buckets.values.compactMap { bucket in
            guard let first = bucket.first else { return nil }
            
            // 첫 번째 경기의 팀 정보 가져오기
            let firstTeams = getFixtureTeams(first)
            
            // 왼쪽(Team A) = 항상 ID가 더 작은 팀으로 고정
            let (teamA, teamB) = firstTeams.home.id < firstTeams.away.id
            ? (firstTeams.home, firstTeams.away)
            : (firstTeams.away, firstTeams.home)
            
            let teamMiniA = TeamMini(id: teamA.id, name: teamA.name, logo: teamA.logo)
            let teamMiniB = TeamMini(id: teamB.id, name: teamB.name, logo: teamB.logo)
            
            var totalA = 0
            var totalB = 0
            for f in bucket {
                let teams = getFixtureTeams(f)
                let goals = getFixtureGoals(f)
                
                if teams.home.id == teamA.id {
                    totalA += goals.home
                    totalB += goals.away
                } else {
                    totalA += goals.away
                    totalB += goals.home
                }
            }

            return AggregateMatch(home: teamMiniA, away: teamMiniB,
                                  homeTotal: totalA, awayTotal: totalB)
        }
        // fixture id 오름차순 첫 경기 기준 정렬(안정적)
        .sorted { (lhs: AggregateMatch, rhs: AggregateMatch) in
            lhs.home.id < rhs.home.id
        }
    }


    /// 4‑열 레이아웃에서 경기 수(1 / 2 / 4)에 따른 위치 인덱스
    private func positions(for count: Int) -> [Int] {
        switch count {
        case 4: return [0,1,2,3]          // 16강
        case 2: return [1,3]              // 8강
        case 1: return [2]                // 4강·결승
        default:
            return Array(0..<min(count,4))
        }
    }
    // MARK: - 라운드별 행 (최소 1개 카드 공간 확보)
    private func roundRow(rowMatches: [AggregateMatch]) -> some View {
        let pos = positionOfCount(max(rowMatches.count, 1))
        return gridRow(rowMatches: rowMatches, pos: pos)
    }

    private func positionOfCount(_ count: Int) -> [Int] {
        switch count {
        case 4: return [0,1,2,3]
        case 2: return [1,3]
        case 1: return [2]
        default: return Array(0..<max(count, 1))
        }
    }

    private func gridRow(rowMatches: [AggregateMatch], pos: [Int]) -> some View {
        HStack(spacing: 12) {
            ForEach(rowMatches) { match in
                MatchCard(match: match, width: 140)
            }
            // 최소 1개 카드 공간 확보
            if rowMatches.isEmpty {
                MatchCard(match: placeholderMatch, width: 140)
            }
            Spacer()
        }
        .padding(.horizontal)
        .padding(.bottom, 30)
    }

    /// 라운드의 상·하 절반을 반환
    private func splitHalf(_ matches: [AggregateMatch]) -> (top: [AggregateMatch], bottom: [AggregateMatch]) {
        let half = matches.count / 2
        // If odd (safety), top gets the extra
        return (Array(matches.prefix(half)),
                Array(matches.suffix(from: half)))
    }

    /// 주어진 라운드의 다음 라운드(Quarter, Semi, Final)를 반환
    private func nextRound(after round: String) -> String? {
        guard let idx = sortedRounds.firstIndex(of: round),
              idx + 1 < sortedRounds.count else { return nil }
        return sortedRounds[idx + 1]
    }

    /// 16강 매치를 같은 8강 그룹 순서로 재정렬
    private func reorderedRoundOf16(_ matches16: [AggregateMatch]) -> [AggregateMatch] {
        guard let qfRound = nextRound(after: "Round of 16") ?? sortedRounds.first(where: { $0.contains("Quarter") }) else {
            return matches16
        }
        let qfMatches = aggregatedMatches(for: qfRound)
        // Build mapping: each QF's team id set -> its index
        var map: [Set<Int>: Int] = [:]
        for (idx, q) in qfMatches.enumerated() {
            map[Set([q.home.id, q.away.id])] = idx
        }
        // Bucket round‑of‑16 matches by the QF they belong to
        var buckets: [[AggregateMatch]] = Array(repeating: [], count: qfMatches.count)
        for m in matches16 {
            let ids = Set([m.home.id, m.away.id])
            if let target = map.first(where: { ids.isSubset(of: $0.key) })?.value {
                buckets[target].append(m)
            }
        }
        // Flatten preserving pair order (first two buckets correspond to top half)
        return buckets.flatMap { $0.sorted { $0.home.id < $1.home.id } }
    }

    /// 홈·원정 ID 집합으로 중복 제거
    private func distinct(_ matches: [AggregateMatch]) -> [AggregateMatch] {
        Dictionary(grouping: matches, by: { Set([$0.home.id, $0.away.id]) })
            .compactMap { $0.value.first }
    }

    // MARK: - Bracket Grid (Vertically scrolled with connecting lines)
    // 카드 크기 상수
    private let cardWidth: CGFloat = 100
    private let cardHeight: CGFloat = 70
    private let cardSpacing: CGFloat = 8
    
    // MARK: - 브라켓 그리드 뷰
    var body: some View {
        // 라운드 정보 가져오기
        let rounds = knockoutRoundsWithData.isEmpty ? sortedRounds : knockoutRoundsWithData
        
        // 디버깅 정보 업데이트
        let fixturesCount = fixtures.count
        let roundsCount = rounds.count
        
        // 테스트용 더미 데이터 사용 (실제 구현에서는 제거)
        let useDummyData = true
        
        // 각 라운드별 경기 데이터 준비
        let r16Matches: [AggregateMatch] = useDummyData
            ? Array(dummyR16Matches.prefix(4))
            : (rounds.count > 0 ? distinct(aggregatedMatches(for: rounds[0])) : [])
            
        let qfMatches: [AggregateMatch] = useDummyData
            ? dummyQFMatches
            : (rounds.count > 1 ? distinct(aggregatedMatches(for: rounds[1])) : [])
            
        let sfMatches: [AggregateMatch] = useDummyData
            ? dummySFMatches
            : (rounds.count > 2 ? distinct(aggregatedMatches(for: rounds[2])) : [])
            
        let finalMatches: [AggregateMatch] = useDummyData
            ? [dummyFinalMatch]
            : (rounds.count > 3 ? distinct(aggregatedMatches(for: rounds[3])) : [])
        
        // 상단/하단 분할
        let (r16Top, r16Bottom) = splitHalf(r16Matches)
        let (qfTop, qfBottom) = splitHalf(qfMatches)
        let (sfTop, sfBottom) = splitHalf(sfMatches)
        
        // 빈 데이터 확인
        let isEmpty = r16Matches.isEmpty && qfMatches.isEmpty && sfMatches.isEmpty && finalMatches.isEmpty
        
        ScrollView {
            // 디버깅 정보 표시
            VStack(alignment: .leading) {
                Text("총 경기 수: \(fixturesCount)")
                    .font(.caption)
                    .foregroundColor(.gray)
                Text("라운드 수: \(roundsCount)")
                    .font(.caption)
                    .foregroundColor(.gray)
                if !rounds.isEmpty {
                    Text("라운드: \(rounds.joined(separator: ", "))")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                }
                Text("16강: \(r16Matches.count), 8강: \(qfMatches.count), 4강: \(sfMatches.count), 결승: \(finalMatches.count)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(.horizontal)
            .padding(.top, 8)
            
            if isEmpty {
                // 빈 데이터 표시
                VStack(spacing: 20) {
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 80))
                        .foregroundColor(Color.gray.opacity(0.4))
                        .padding(.top, 60)
                    
                    Text("토너먼트 편성 전입니다")
                        .font(.headline)
                        .foregroundColor(.gray)
                        .padding(.bottom, 60)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                // 브라켓 뷰
                ZStack {
                    // 연결선 그리기
                    BracketConnectorView(
                        r16Count: r16Matches.count,
                        qfCount: qfMatches.count,
                        sfCount: sfMatches.count,
                        finalCount: finalMatches.count
                    )
                    
                    VStack(spacing: 20) {
                        // 16강 라운드 제목
                        if rounds.count > 0 {
                            Text(formatRoundName(rounds[0]))
                                .font(.headline)
                                .padding(.top, 16)
                        }
                        
                        // 상단 16강 경기들
                        gridRow(matches: r16Top)
                            .padding(.bottom, 30)
                        
                        // 8강 라운드 제목
                        if rounds.count > 1 {
                            Text(formatRoundName(rounds[1]))
                                .font(.headline)
                        }
                        
                        // 상단 8강 경기들
                        gridRow(matches: qfTop)
                            .padding(.bottom, 30)
                        
                        // 4강 라운드 제목
                        if rounds.count > 2 {
                            Text(formatRoundName(rounds[2]))
                                .font(.headline)
                        }
                        
                        // 상단 4강 경기들
                        gridRow(matches: sfTop)
                            .padding(.bottom, 30)
                        
                        // 결승 라운드 제목
                        if rounds.count > 3 {
                            Text(formatRoundName(rounds[3]))
                                .font(.headline)
                        }
                        
                        // 결승 경기
                        if !finalMatches.isEmpty {
                            HStack {
                                Spacer()
                                ForEach(finalMatches) { match in
                                    MatchCard(match: match, width: cardWidth)
                                }
                                Spacer()
                            }
                            .padding(.horizontal)
                            .padding(.bottom, 30)
                        } else {
                            // 결승 플레이스홀더
                            HStack {
                                Spacer()
                                MatchCard(match: placeholderMatch, width: cardWidth)
                                Spacer()
                            }
                            .padding(.horizontal)
                            .padding(.bottom, 30)
                        }
                        
                        // 하단 4강 경기들
                        gridRow(matches: sfBottom)
                            .padding(.bottom, 30)
                        
                        // 하단 8강 경기들
                        gridRow(matches: qfBottom)
                            .padding(.bottom, 30)
                        
                        // 하단 16강 경기들
                        gridRow(matches: r16Bottom)
                        
                        // 트로피 이미지
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 60))
                            .foregroundColor(Color.gray.opacity(0.6))
                            .padding(.top, 20)
                            .padding(.bottom, 40)
                    }
                }
            }
        }
    }
    
    // MARK: - 그리드 행 뷰
    @ViewBuilder
    private func gridRow(matches: [AggregateMatch]) -> some View {
        let pos = positionOfCount(max(matches.count, 1))
        
        GeometryReader { geo in
            let availableWidth = geo.size.width - 32 // 좌우 패딩 16씩 제외
            let effectiveCardWidth = min(cardWidth, (availableWidth - cardSpacing * 3) / 4)
            
            HStack(spacing: cardSpacing) {
                ForEach(0..<4) { col in
                    if let idx = pos.firstIndex(of: col), idx < matches.count {
                        MatchCard(match: matches[idx], width: effectiveCardWidth)
                    } else if matches.isEmpty && col == 2 {
                        // 빈 데이터일 경우 중앙에 플레이스홀더 표시
                        MatchCard(match: placeholderMatch, width: effectiveCardWidth)
                    } else {
                        // 빈 공간
                        Color.clear
                            .frame(width: effectiveCardWidth, height: cardHeight)
                    }
                }
            }
            .frame(width: availableWidth)
            .position(x: availableWidth/2 + 16, y: cardHeight/2)
        }
        .frame(height: cardHeight)
        .padding(.horizontal, 16)
    }
    
    // MARK: - 브라켓 연결선 뷰
    // MARK: - 브라켓 연결선 뷰
    private struct BracketConnectorView: View {
        let r16Count: Int
        let qfCount: Int
        let sfCount: Int
        let finalCount: Int
        
        // 카드 위치 계산을 위한 상수
        private let cardHeight: CGFloat = 80
        private let headerHeight: CGFloat = 40
        private let roundSpacing: CGFloat = 50
        
        // 각 라운드별 Y 위치 계산
        private var r16TopY: CGFloat { headerHeight + cardHeight/2 }
        private var qfTopY: CGFloat { r16TopY + cardHeight + headerHeight + roundSpacing }
        private var sfTopY: CGFloat { qfTopY + cardHeight + headerHeight + roundSpacing }
        private var finalY: CGFloat { sfTopY + cardHeight + headerHeight + roundSpacing }
        private var sfBottomY: CGFloat { finalY + cardHeight + headerHeight + roundSpacing }
        private var qfBottomY: CGFloat { sfBottomY + cardHeight + headerHeight + roundSpacing }
        private var r16BottomY: CGFloat { qfBottomY + cardHeight + headerHeight + roundSpacing }
        
        var body: some View {
            GeometryReader { geo in
                let width = geo.size.width
                
                Path { path in
                    // 카드 위치 계산
                    let col0X = width * 0.15
                    let col1X = width * 0.35
                    let col2X = width * 0.55
                    let col3X = width * 0.75
                    let centerX = width * 0.5
                    
                    // 상단 브라켓 연결선
                    
                    // 16강 -> 8강 연결선 (상단)
                    if r16Count >= 2 && qfCount >= 1 {
                        // 첫 번째 16강 -> 8강
                        let fromPoint1 = CGPoint(x: Double(col0X), y: Double(r16TopY))
                        let toPoint1 = CGPoint(x: Double(col1X), y: Double(qfTopY))
                        drawConnection(in: &path, from: fromPoint1, to: toPoint1)
                        
                        // 두 번째 16강 -> 8강
                        let fromPoint2 = CGPoint(x: Double(col1X), y: Double(r16TopY))
                        let toPoint2 = CGPoint(x: Double(col1X), y: Double(qfTopY))
                        drawConnection(in: &path, from: fromPoint2, to: toPoint2)
                    }
                    
                    // 8강 -> 4강 연결선 (상단)
                    if qfCount >= 1 && sfCount >= 1 {
                        let fromPoint = CGPoint(x: Double(col1X), y: Double(qfTopY))
                        let toPoint = CGPoint(x: Double(col2X), y: Double(sfTopY))
                        drawConnection(in: &path, from: fromPoint, to: toPoint)
                    }
                    
                    // 4강 -> 결승 연결선 (상단)
                    if sfCount >= 1 && finalCount >= 1 {
                        let fromPoint = CGPoint(x: Double(col2X), y: Double(sfTopY))
                        let toPoint = CGPoint(x: Double(centerX), y: Double(finalY))
                        drawConnection(in: &path, from: fromPoint, to: toPoint)
                    }
                    
                    // 4강 -> 결승 연결선 (하단)
                    if sfCount >= 2 && finalCount >= 1 {
                        let fromPoint = CGPoint(x: Double(col2X), y: Double(sfBottomY))
                        let toPoint = CGPoint(x: Double(centerX), y: Double(finalY))
                        drawConnection(in: &path, from: fromPoint, to: toPoint)
                    }
                    
                    // 8강 -> 4강 연결선 (하단)
                    if qfCount >= 2 && sfCount >= 2 {
                        let fromPoint = CGPoint(x: Double(col1X), y: Double(qfBottomY))
                        let toPoint = CGPoint(x: Double(col2X), y: Double(sfBottomY))
                        drawConnection(in: &path, from: fromPoint, to: toPoint)
                    }
                    
                    // 16강 -> 8강 연결선 (하단)
                    if r16Count >= 4 && qfCount >= 2 {
                        // 첫 번째 16강 -> 8강
                        let fromPoint1 = CGPoint(x: Double(col0X), y: Double(r16BottomY))
                        let toPoint1 = CGPoint(x: Double(col1X), y: Double(qfBottomY))
                        drawConnection(in: &path, from: fromPoint1, to: toPoint1)
                        
                        // 두 번째 16강 -> 8강
                        let fromPoint2 = CGPoint(x: Double(col1X), y: Double(r16BottomY))
                        let toPoint2 = CGPoint(x: Double(col1X), y: Double(qfBottomY))
                        drawConnection(in: &path, from: fromPoint2, to: toPoint2)
                    }
                }
                .stroke(Color.gray.opacity(0.4), style: StrokeStyle(lineWidth: 1, dash: [5, 3]))
            }
        }
        
        // 두 점 사이에 ㄱ자 연결선 그리기
        private func drawConnection(in path: inout Path, from: CGPoint, to: CGPoint) {
            path.move(to: from)
            
            if abs(from.y - to.y) > 10 {
                // 수직 이동이 있는 경우 ㄱ자 연결
                let midX = (from.x + to.x) / 2
                path.addLine(to: CGPoint(x: Double(midX), y: Double(from.y)))
                path.addLine(to: CGPoint(x: Double(midX), y: Double(to.y)))
                path.addLine(to: to)
            } else {
                // 수평 이동만 있는 경우 직선 연결
                path.addLine(to: to)
            }
        }
    }

    // MARK: - Reusable MatchCard
    private struct MatchCard: View {
        let match: AggregateMatch
        let width: CGFloat
    
        var body: some View {
            VStack(spacing: 8) {
                // 홈팀
                HStack {
                    TeamLogo(name: match.home.name, logo: match.home.logo)
                    Spacer()
                    Text("\(match.homeTotal)")
                        .font(.headline)
                        .bold()
                }
                
                // 원정팀
                HStack {
                    TeamLogo(name: match.away.name, logo: match.away.logo)
                    Spacer()
                    Text("\(match.awayTotal)")
                        .font(.headline)
                        .bold()
                }
            }
            .padding(8)
            .frame(width: width)
            .background(Color.secondary.opacity(0.1))
            .cornerRadius(10)
            .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
        }
    }

    private struct TeamLogo: View {
        let name: String
        let logo: String
        var body: some View {
            VStack(spacing: 2) {
                AsyncImage(url: URL(string: logo)) { img in
                    img.resizable().scaledToFit().frame(width: 20, height: 20)
                } placeholder: {
                    Image(systemName: "sportscourt").resizable()
                        .scaledToFit().frame(width: 20, height: 20)
                        .foregroundColor(.gray)
                }
                Text(name.prefix(3).uppercased())
                    .font(.system(size: 9))
            }
        }
    }
}

// MARK: - Utility
private extension Array {
    /// 배열을 고정 크기 청크로 분할
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
