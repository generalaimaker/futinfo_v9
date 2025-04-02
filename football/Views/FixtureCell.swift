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
                // 팀 로고 - 캐싱된 이미지 뷰 사용
                TeamLogoView(logoUrl: team.logo, size: 30)
                
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
        
        // 합산 스코어 계산 - ViewModel 사용
        @State private var aggregateScores: (home: Int, away: Int)?
        @State private var isLoadingAggregateScore: Bool = false
        
        // 합산 스코어 계산 함수
        private func calculateAggregateScore() async {
            // 챔피언스리그(2)나 유로파리그(3)의 경기인 경우에만 합산 스코어 표시
            if ![2, 3].contains(fixture.league.id) {
                return
            }
            
            print("🏆 FixtureCell - 합산 스코어 계산 시작: \(fixture.fixture.id)")
            
            // 로딩 상태 설정
            isLoadingAggregateScore = true
            
            // 현재 경기 스코어
            let currentHomeScore = homeScore ?? 0
            let currentAwayScore = awayScore ?? 0
            
            // FootballAPIService 인스턴스 생성
            let service = FootballAPIService.shared
            
            // 1차전 경기 찾기 시도
            var firstLegMatch: Fixture?
            do {
                firstLegMatch = try await service.findFirstLegMatch(fixture: fixture)
            } catch {
                print("🏆 FixtureCell - 1차전 경기 찾기 실패: \(error.localizedDescription)")
            }
            
            // 1차전 경기 스코어
            var firstLegHomeScore = 0
            var firstLegAwayScore = 0
            
            if let firstLeg = firstLegMatch {
                // 실제 1차전 경기 데이터 사용
                firstLegHomeScore = firstLeg.goals?.home ?? 0
                firstLegAwayScore = firstLeg.goals?.away ?? 0
                print("🏆 FixtureCell - 1차전 실제 스코어: \(firstLegHomeScore)-\(firstLegAwayScore)")
                print("🏆 FixtureCell - 1차전 경기 ID: \(firstLeg.fixture.id)")
                print("🏆 FixtureCell - 1차전 홈팀: \(firstLeg.teams.home.name), 원정팀: \(firstLeg.teams.away.name)")
                
                // 1차전 경기에서 홈팀과 원정팀이 현재 경기와 반대인지 확인
                let isReversed = firstLeg.teams.home.id == fixture.teams.away.id &&
                                 firstLeg.teams.away.id == fixture.teams.home.id
                
                // 합산 스코어 계산
                var homeAggregate: Int
                var awayAggregate: Int
                
                if isReversed {
                    // 1차전에서는 홈/원정이 반대이므로 스코어도 반대로 계산
                    homeAggregate = currentHomeScore + firstLegAwayScore
                    awayAggregate = currentAwayScore + firstLegHomeScore
                    print("🏆 FixtureCell - 반대 팀 구성으로 합산 스코어 계산")
                } else {
                    // 같은 팀 구성인 경우 (드문 경우)
                    homeAggregate = currentHomeScore + firstLegHomeScore
                    awayAggregate = currentAwayScore + firstLegAwayScore
                    print("🏆 FixtureCell - 같은 팀 구성으로 합산 스코어 계산")
                }
                
                print("🏆 FixtureCell - 합산 스코어 계산 결과 - 홈: \(homeAggregate), 원정: \(awayAggregate)")
                
                // UI 스레드에서 업데이트
                await MainActor.run {
                    aggregateScores = (homeAggregate, awayAggregate)
                    isLoadingAggregateScore = false
                }
            } else {
                // 1차전 경기를 찾지 못한 경우
                print("🏆 FixtureCell - 1차전 경기를 찾지 못함")
                await MainActor.run {
                    aggregateScores = nil
                    isLoadingAggregateScore = false
                }
            }
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
                    // 항상 숫자가 표시되도록 수정
                    Text("\(homeScore ?? 0)")
                    Text(":")
                    Text("\(awayScore ?? 0)")
                }
                .font(.title3.bold())
                .onAppear {
                    // 디버깅을 위해 스코어 출력
                    print("📊 스코어: \(homeScore ?? 0) - \(awayScore ?? 0), 상태: \(status)")
                    
                    // 합산 스코어 계산 시작
                    if [2, 3].contains(fixture.league.id) {
                        print("🏆 ScoreView onAppear - 리그 ID: \(fixture.league.id), 라운드: \(fixture.league.round)")
                        Task {
                            await calculateAggregateScore()
                        }
                    }
                }
                
                // 합산 스코어 표시
                Group {
                    if isLoadingAggregateScore {
                        // 로딩 중 표시
                        Text("합산 계산 중...")
                            .font(.caption)
                            .foregroundColor(.gray)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                    } else if let aggregate = aggregateScores {
                        // 합산 스코어 표시 (계산 완료)
                        Text("합산 \(aggregate.home):\(aggregate.away)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Color.blue)
                            .cornerRadius(4)
                            .overlay(
                                RoundedRectangle(cornerRadius: 4)
                                    .stroke(Color.white, lineWidth: 1)
                            )
                            .shadow(color: Color.black.opacity(0.2), radius: 1, x: 0, y: 1)
                    }
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
                } else if ["FT", "AET", "PEN", "MATCH_FINISHED", "FINISHED", "FULL_TIME", "AFTER_EXTRA_TIME", "AFTER_PENALTIES"].contains(status) {
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
            // 디버깅을 위해 상태 값 출력
            print("📊 경기 상태: \(status)")
            
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
                
            // 경기 종료 상태 (추가)
            case "MATCH_FINISHED", "FINISHED", "FULL_TIME", "AFTER_EXTRA_TIME", "AFTER_PENALTIES":
                return "FT"
                
            // 기타 상태
            default:
                // 기본값을 "UPCOMING"에서 "FT"로 변경
                // 이미 진행된 경기가 "UPCOMING"으로 표시되는 문제 해결
                return "FT"
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
                
            // 경기 종료 상태 (추가)
            case "MATCH_FINISHED", "FINISHED", "FULL_TIME", "AFTER_EXTRA_TIME", "AFTER_PENALTIES":
                return .gray
                
            // 기타 상태
            default:
                // 기본값을 .blue에서 .gray로 변경
                return .gray
            }
        }
        
        // 현재 경기 중인지 여부
        private var isLive: Bool {
            return ["1H", "2H", "HT", "ET", "BT", "P"].contains(status)
        }
    }
}
