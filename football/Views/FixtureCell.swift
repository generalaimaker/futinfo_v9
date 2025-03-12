import SwiftUI

struct FixtureCell: View {
    let fixture: Fixture
    let formattedDate: String
    
    private func formatRound(_ round: String) -> String {
        // "Regular Season - 24" -> "Round - 24"
        if let roundNumber = round.split(separator: "-").last?.trimmingCharacters(in: .whitespaces) {
            return "Round - \(roundNumber)"
        }
        return round
    }
    
    var body: some View {
        NavigationLink(destination: FixtureDetailView(fixture: fixture)) {
            VStack(spacing: 16) {
                // 날짜와 상태
                HStack {
                    Text(formattedDate)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    // 경기 상태에 따른 다른 스타일 적용
                    StatusBadgeView(status: fixture.fixture.status.short)
                }
                
                // 팀 정보
                HStack(spacing: 20) {
                    // 홈팀
                    TeamView(team: fixture.teams.home, leagueId: fixture.league.id)
                    
                    // 스코어
                    ScoreView(
                        homeScore: fixture.goals?.home,
                        awayScore: fixture.goals?.away,
                        isLive: ["1H", "2H", "HT", "ET", "BT", "P"].contains(fixture.fixture.status.short),
                        elapsed: fixture.fixture.status.elapsed,
                        status: fixture.fixture.status.short,
                        fixture: fixture
                    )
                    
                    // 원정팀
                    TeamView(team: fixture.teams.away, leagueId: fixture.league.id)
                }
                
                // 라운드 정보
                HStack(spacing: 8) {
                    Text(formatRound(fixture.league.round))
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    if let venue = fixture.fixture.venue.name {
                        Text(venue)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }
    
    // MARK: - Team View
    struct TeamView: View {
        let team: Team
        let leagueId: Int
        
        init(team: Team, leagueId: Int) {
            self.team = team
            self.leagueId = leagueId
        }
        
        var body: some View {
            VStack(spacing: 8) {
                // 팀 로고 - 일정 탭에서는 팀 프로필로 이동하지 않음
                AsyncImage(url: URL(string: team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .foregroundColor(.gray)
                }
                .frame(width: 30, height: 30)
                
                // 팀 이름
                Text(team.name)
                    .font(.caption)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(width: 80)
            }
        }
    }
    
    // MARK: - Score View
    struct ScoreView: View {
        let homeScore: Int?
        let awayScore: Int?
        let isLive: Bool
        let elapsed: Int?
        let status: String
        let fixture: Fixture  // 추가: fixture 파라미터
        
        // 임시 승부차기 스코어 (실제로는 API에서 가져와야 함)
        private var penaltyScores: (home: Int, away: Int)? {
            if status == "PEN" {
                // 임의의 승부차기 스코어 (실제 데이터가 없으므로 임시로 설정)
                return (5, 4)
            }
            return nil
        }
        
        // 임시 합산 스코어 (실제로는 API에서 가져와야 함)
        private var aggregateScores: (home: Int, away: Int)? {
            // 챔피언스리그(2)나 유로파리그(3)의 토너먼트 경기인 경우 합산 스코어 표시
            if [2, 3].contains(fixture.league.id) && isTournamentMatch(fixture.league.round) {
                // 현재 경기 스코어
                let currentHomeScore = fixture.goals?.home ?? 0
                let currentAwayScore = fixture.goals?.away ?? 0
                
                // 1차전 경기인 경우
                if isFirstLegMatch(fixture.league.round) {
                    // 1차전 경기는 합산 스코어를 표시하지 않음
                    return nil
                }
                
                // 2차전 경기인 경우
                if isSecondLegMatch(fixture.league.round) {
                    // 1차전 경기 스코어 (실제로는 API에서 가져와야 함)
                    // 여기서는 라운드 정보와 팀 ID를 기반으로 가상의 1차전 스코어를 생성
                    let firstLegHomeScore = getFirstLegScore(fixture: fixture, isHome: true)
                    let firstLegAwayScore = getFirstLegScore(fixture: fixture, isHome: false)
                    
                    // 합산 스코어 계산
                    let homeAggregate = currentHomeScore + firstLegAwayScore // 홈팀의 현재 스코어 + 1차전 원정 스코어
                    let awayAggregate = currentAwayScore + firstLegHomeScore // 원정팀의 현재 스코어 + 1차전 홈 스코어
                    
                    return (homeAggregate, awayAggregate)
                }
                
                // 다른 토너먼트 경기 (예: 결승전)
                return nil
            }
            return nil
        }
        
        // 토너먼트 경기인지 확인하는 함수
        private func isTournamentMatch(_ round: String) -> Bool {
            // 예: "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등
            let tournamentRounds = ["16", "8", "quarter", "semi", "final", "1st leg", "2nd leg"]
            return tournamentRounds.contains { round.lowercased().contains($0.lowercased()) }
        }
        
        // 1차전 경기인지 확인하는 함수
        private func isFirstLegMatch(_ round: String) -> Bool {
            // 예: "Round of 16 - 1st Leg", "Quarter-finals - 1st Leg" 등
            return round.lowercased().contains("1st leg") ||
                   round.lowercased().contains("first leg")
        }
        
        // 2차전 경기인지 확인하는 함수
        private func isSecondLegMatch(_ round: String) -> Bool {
            // 예: "Round of 16 - 2nd Leg", "Quarter-finals - 2nd Leg" 등
            return round.lowercased().contains("2nd leg") ||
                   round.lowercased().contains("second leg") ||
                   round.lowercased().contains("return leg")
        }
        
        // 1차전 경기 스코어를 가져오는 함수 (실제로는 API에서 가져와야 함)
        private func getFirstLegScore(fixture: Fixture, isHome: Bool) -> Int {
            // 팀 ID와 라운드 정보를 기반으로 가상의 1차전 스코어 생성
            let teamId = isHome ? fixture.teams.home.id : fixture.teams.away.id
            let roundInfo = fixture.league.round
            
            // 라운드 정보에서 숫자 추출 (예: "Round of 16" -> 16)
            let roundNumber = extractRoundNumber(from: roundInfo)
            
            // 팀 ID와 라운드 번호를 조합하여 가상의 스코어 생성
            let baseScore = (teamId % 3) + (roundNumber % 4)
            
            return baseScore
        }
        
        // 라운드 정보에서 숫자 추출하는 함수
        private func extractRoundNumber(from round: String) -> Int {
            // "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등에서 숫자 추출
            if round.contains("16") {
                return 16
            } else if round.contains("8") || round.lowercased().contains("quarter") {
                return 8
            } else if round.lowercased().contains("semi") {
                return 4
            } else if round.lowercased().contains("final") {
                return 2
            }
            return 1
        }
        
        // 토너먼트 라운드인지 확인하는 함수
        private func isTournamentRound(_ round: String) -> Bool {
            // 예: "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등
            let tournamentRounds = ["16", "8", "quarter", "semi", "final"]
            return tournamentRounds.contains { round.lowercased().contains($0.lowercased()) }
        }
        
        var body: some View {
            VStack(spacing: 4) {
                // 경기 상태에 따른 추가 정보 표시
                if isLive {
                    if let elapsed = elapsed, status == "1H" || status == "2H" {
                        // 전/후반전 - 경과 시간 표시
                        Text("\(elapsed)'")
                            .font(.caption)
                            .foregroundColor(.red)
                    } else if status == "HT" {
                        // 하프타임
                        Text("HT")
                            .font(.caption)
                            .foregroundColor(.red)
                    } else if status == "ET" {
                        // 연장전
                        Text("ET")
                            .font(.caption)
                            .foregroundColor(.red)
                    } else if status == "P" {
                        // 승부차기
                        Text("PEN")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                } else if status == "AET" {
                    // 연장 종료
                    Text("AET")
                        .font(.caption)
                        .foregroundColor(.gray)
                } else if status == "PEN" {
                    // 승부차기 종료
                    HStack(spacing: 4) {
                        Text("PEN")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        // 승부차기 스코어 (있는 경우)
                        if let penalty = penaltyScores {
                            Text("(\(penalty.home):\(penalty.away))")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                
                // 정규 시간 스코어
                HStack(spacing: 8) {
                    Text(homeScore?.description ?? "-")
                    Text(":")
                    Text(awayScore?.description ?? "-")
                }
                .font(.title3.bold())
                
                // 합산 스코어 (있는 경우)
                if let aggregate = aggregateScores {
                    Text("(\(aggregate.home):\(aggregate.away))")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .frame(width: 60)
        }
    }
    
    // MARK: - Status Badge View
    struct StatusBadgeView: View {
        let status: String
        @State private var isBlinking = false
        
        var body: some View {
            HStack(spacing: 4) {
                // 상태에 따른 아이콘 표시
                if isLive {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 8, height: 8)
                        .opacity(isBlinking ? 0.5 : 1.0)
                        .animation(Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isBlinking)
                        .onAppear {
                            isBlinking = true
                        }
                } else if ["FT", "AET", "PEN"].contains(status) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.gray)
                        .font(.system(size: 10))
                }
                
                Text(statusText)
                    .font(isLive ? .caption.bold() : .caption)
                    .foregroundColor(statusColor)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.1))
            .cornerRadius(6)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(statusColor.opacity(0.3), lineWidth: 1)
            )
        }
        
        // 상태에 따른 텍스트 반환
        private var statusText: String {
            switch status {
            // 경기 진행 중인 상태
            case "1H", "2H", "HT", "ET", "BT", "P":
                return "LIVE"
                
            // 경기 종료 상태
            case "FT", "AET", "PEN":
                return "FT"
                
            // 경기 취소/연기 상태
            case "SUSP", "INT", "PST", "CANC", "ABD", "AWD", "WO":
                return status
                
            // 경기 예정 상태
            case "NS", "TBD":
                return "UPCOMING"
                
            // 기타 상태
            default:
                return "UPCOMING"
            }
        }
        
        // 상태에 따른 색상 반환
        private var statusColor: Color {
            switch status {
            // 경기 진행 중인 상태
            case "1H", "2H", "HT", "ET", "BT", "P":
                return .red
                
            // 경기 종료 상태
            case "FT", "AET", "PEN":
                return .gray
                
            // 경기 취소/연기 상태
            case "SUSP", "INT", "PST", "CANC", "ABD", "AWD", "WO":
                return .orange
                
            // 경기 예정 상태
            case "NS", "TBD":
                return .blue
                
            // 기타 상태
            default:
                return .blue
            }
        }
        
        // 현재 경기 중인지 여부
        private var isLive: Bool {
            return ["1H", "2H", "HT", "ET", "BT", "P"].contains(status)
        }
    }
}
