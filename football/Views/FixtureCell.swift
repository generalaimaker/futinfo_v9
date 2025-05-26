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
            ZStack(alignment: .topTrailing) {
                // 메인 카드 컨텐츠
                VStack(spacing: 0) {
                    // 팀 정보와 스코어를 포함한 중앙 컨텐츠
                    HStack(alignment: .center, spacing: 8) {
                        // Home team abbreviation and logo
                        TeamView(team: fixture.teams.home, leagueId: fixture.league.id, isHome: true)
                            .frame(height: 24)

                        // Score - 중앙에 배치
                        ScoreView(
                            homeScore: fixture.goals?.home,
                            awayScore: fixture.goals?.away,
                            isLive: ["1H", "2H", "HT", "ET", "BT", "P"].contains(fixture.fixture.status.short),
                            elapsed: fixture.fixture.status.elapsed,
                            status: fixture.fixture.status.short,
                            fixture: fixture
                        )
                        .frame(width: 50)

                        // Away team logo and abbreviation
                        TeamView(team: fixture.teams.away, leagueId: fixture.league.id, isHome: false)
                            .frame(height: 24)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity) // 수직 중앙 정렬을 위해 최대 높이 설정
                    .padding(.vertical, 10) // 팀 정보 주변에 패딩 추가
                    
                    // 라운드 정보 (중앙 정렬)
                    HStack {
                        Spacer()
                        
                        Text(formatRound(fixture.league.round))
                            .font(.caption2)
                            .foregroundColor(.gray)
                        
                        if let venue = fixture.fixture.venue.name {
                            Text("•")
                                .font(.caption2)
                                .foregroundColor(.gray)
                                .padding(.horizontal, 2)
                            
                            Text(venue)
                                .font(.caption2)
                                .foregroundColor(.gray)
                                .lineLimit(1)
                        }
                        
                        Spacer()
                    }
                }
                .padding(.vertical, 10)
                .padding(.horizontal, 10)
                .background(Color(.systemBackground))
                .cornerRadius(10)
                .frame(width: UIScreen.main.bounds.width - 40) // 화면 너비에서 좌우 여백 20씩 뺀 값
                
                // 상태 뱃지 또는 경기 시간 (우상단 귀퉁이에 배치)
                if ["NS", "TBD"].contains(fixture.fixture.status.short) {
                    // 경기 예정인 경우 시간 표시
                    Text(formattedDate)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.blue)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(4)
                        .overlay(
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(Color.blue.opacity(0.3), lineWidth: 0.5)
                        )
                        .padding(6)
                } else {
                    // 다른 상태인 경우 상태 뱃지 표시
                    MiniStatusBadgeView(status: fixture.fixture.status.short)
                        .padding(6)
                }
            }
            .shadow(color: Color.black.opacity(0.1), radius: 3, x: 0, y: 1)
        }
    }
    
    // MARK: - Team View
    struct TeamView: View {
        let team: Team
        let leagueId: Int
        let isHome: Bool

        var body: some View {
            HStack(spacing: 3) {
                if isHome {
                    Text(TeamAbbreviations.shortenedName(for: team.name))
                        .font(.system(size: 12, weight: .semibold))
                        .lineLimit(1)
                        .frame(width: 100, alignment: .trailing)
                }

                // 팀 로고
                CachedImageView(
                    url: URL(string: team.logo),
                    placeholder: Image(systemName: "sportscourt.fill"),
                    failureImage: Image(systemName: "sportscourt.fill"),
                    contentMode: .fit
                )
                .frame(width: 22, height: 22)

                if !isHome {
                    Text(TeamAbbreviations.shortenedName(for: team.name))
                        .font(.system(size: 12, weight: .semibold))
                        .lineLimit(1)
                        .frame(width: 100, alignment: .leading)
                }
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
            await MainActor.run { isLoadingAggregateScore = true } // Ensure UI update for loading

            let service = FootballAPIService.shared
            let isFinished = fixture.fixture.status.short == "FT" || fixture.fixture.status.short == "AET" || fixture.fixture.status.short == "PEN"
            let currentHomeScore = homeScore ?? 0
            let currentAwayScore = awayScore ?? 0
            print("🏆 FixtureCell - \(fixture.fixture.id): isFinished=\(isFinished), currentScore=\(currentHomeScore)-\(currentAwayScore)")

            var finalAggregate: (home: Int, away: Int)? = nil // Temporary variable to store result

            do {
                print("🏆 FixtureCell - \(fixture.fixture.id): Attempting to find 1st leg...")
                let firstLeg = try await service.findFirstLegMatch(fixture: fixture)
                print("🏆 FixtureCell - \(fixture.fixture.id): findFirstLegMatch result: \(firstLeg == nil ? "Not Found" : "Found (\(firstLeg!.fixture.id))")")

                if let firstLeg = firstLeg {
                    // 2nd Leg logic
                    print("🏆 FixtureCell - 2차전 합산 시도 (1차전 ID: \(firstLeg.fixture.id))")
                    let firstLegHomeScore = firstLeg.goals?.home ?? 0
                    let firstLegAwayScore = firstLeg.goals?.away ?? 0
                    let isReversed = firstLeg.teams.home.id == fixture.teams.away.id
                    let homeAggregate = currentHomeScore + (isReversed ? firstLegAwayScore : firstLegHomeScore)
                    let awayAggregate = currentAwayScore + (isReversed ? firstLegHomeScore : firstLegAwayScore)
                    print("🏆 FixtureCell - 합산 결과: \(homeAggregate)-\(awayAggregate)")
                    finalAggregate = (home: homeAggregate, away: awayAggregate)
                } else {
                    // 1st Leg or Single Match logic
                    if isFinished {
                        print("🏆 FixtureCell - 1차전 또는 단판 결과 표시 (fixture: \(fixture.fixture.id))")
                        finalAggregate = (home: currentHomeScore, away: currentAwayScore)
                    } else {
                        print("🏆 FixtureCell - 1차전 진행 중 또는 예정 (합산 스코어 없음, fixture: \(fixture.fixture.id))")
                        finalAggregate = nil
                    }
                }
            } catch {
                // Error finding 1st leg
                print("🏆 FixtureCell - 1차전 찾기 에러: \(error.localizedDescription) (fixture: \(fixture.fixture.id))")
                if isFinished {
                    print("🏆 FixtureCell - 에러 발생, 현재 경기 결과만 표시 (fixture: \(fixture.fixture.id))")
                    finalAggregate = (home: currentHomeScore, away: currentAwayScore)
                } else {
                    finalAggregate = nil
                }
            }

            // Update state variables on MainActor AFTER all calculation logic
            await MainActor.run {
                self.aggregateScores = finalAggregate
                self.isLoadingAggregateScore = false
                print("🏆 FixtureCell - \(fixture.fixture.id): Final aggregateScores state set to: \(finalAggregate == nil ? "nil" : "\(finalAggregate!.home)-\(finalAggregate!.away)")")
            }
        }


        // 토너먼트 경기인지 확인하는 함수 (참고용, 현재 로직에서는 직접 사용 안 함)
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
            // 경기 예정인 경우 시간 표시, 그렇지 않은 경우 스코어 표시
            if status == "NS" || status == "TBD" {
                // 경기 예정 시간 표시
                Text(formatMatchTime())
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.blue)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(6)
            } else {
                // 정규 시간 스코어 표시
                ZStack {
                    // 중앙에 ":" 배치
                    Text(":")
                        .font(.title3.bold())
                        .frame(maxWidth: .infinity)
                    
                    // 홈팀과 원정팀 스코어
                    HStack {
                        // 홈팀 스코어 (왼쪽 정렬)
                        Text("\(homeScore ?? 0)")
                            .font(.title3.bold())
                            .frame(maxWidth: .infinity, alignment: .trailing)
                            .padding(.trailing, 10)
                        
                        // 중앙 여백 (":"가 위치할 공간)
                        Spacer()
                            .frame(width: 10)
                        
                        // 원정팀 스코어 (오른쪽 정렬)
                        Text("\(awayScore ?? 0)")
                            .font(.title3.bold())
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.leading, 10)
                    }
                }
            }
        }
        
        // 경기 시간 포맷팅 함수
        private func formatMatchTime() -> String {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
            dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
            
            if let date = dateFormatter.date(from: fixture.fixture.date) {
                dateFormatter.dateFormat = "HH:mm"
                return dateFormatter.string(from: date)
            }
            
            return "TBD"
        }
    }
    
    // MARK: - Status Badge View (기존)
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
                    .font(isLive ? .caption2.bold() : .caption2)
                    .foregroundColor(statusColor)
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(statusColor.opacity(0.1))
            .cornerRadius(4)
            .overlay(
                RoundedRectangle(cornerRadius: 4)
                    .stroke(statusColor.opacity(0.3), lineWidth: 0.5)
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
                
            // 경기 종료 상태 (추가)
            case "MATCH_FINISHED", "FINISHED", "FULL_TIME", "AFTER_EXTRA_TIME", "AFTER_PENALTIES":
                return "FT"
                
            // 기타 상태
            default:
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
                return .gray
            }
        }
        
        // 현재 경기 중인지 여부
        private var isLive: Bool {
            return ["1H", "2H", "HT", "ET", "BT", "P"].contains(status)
        }
    }
    
    // MARK: - Mini Status Badge View (우상단 귀퉁이용)
    struct MiniStatusBadgeView: View {
        let status: String
        @State private var isBlinking = false
        
        var body: some View {
            HStack(spacing: 2) {
                // 라이브 경기인 경우 깜빡이는 원 표시
                if isLive {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 5, height: 5)
                        .opacity(isBlinking ? 0.5 : 1.0)
                        .animation(Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isBlinking)
                        .onAppear {
                            isBlinking = true
                        }
                }
                
                Text(statusText)
                    .font(.system(size: 8, weight: isLive ? .bold : .regular))
                    .foregroundColor(statusColor)
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 1)
            .background(statusColor.opacity(0.1))
            .cornerRadius(3)
            .overlay(
                RoundedRectangle(cornerRadius: 3)
                    .stroke(statusColor.opacity(0.3), lineWidth: 0.5)
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
                
            // 경기 종료 상태 (추가)
            case "MATCH_FINISHED", "FINISHED", "FULL_TIME", "AFTER_EXTRA_TIME", "AFTER_PENALTIES":
                return "FT"
                
            // 기타 상태
            default:
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
                return .gray
            }
        }
        
        // 현재 경기 중인지 여부
        private var isLive: Bool {
            return ["1H", "2H", "HT", "ET", "BT", "P"].contains(status)
        }
    }
}
