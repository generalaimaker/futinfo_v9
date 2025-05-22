import SwiftUI

struct MatchSummaryView: View {
    let fixture: Fixture
    let events: [FixtureEvent]
    let statistics: [TeamStatistics]
    let viewModel: FixtureDetailViewModel
    
    // 라이브 경기인지 확인하는 계산 속성
    private var isLiveMatch: Bool {
        return ["1H", "2H", "HT", "ET", "P", "BT"].contains(fixture.fixture.status.short)
    }
    
    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        return formatter
    }
    
    private var userTimeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy년 M월 d일 (E) HH:mm"
        formatter.locale = Locale(identifier: "ko_KR")
        // 사용자의 현재 시스템 시간대 사용
        formatter.timeZone = TimeZone.current
        return formatter
    }
    
    private var formattedUserTime: String {
        guard let date = dateFormatter.date(from: fixture.fixture.date) else { return "" }
        return userTimeFormatter.string(from: date)
    }
    
    private var keyEvents: [(Int, [FixtureEvent])] {
        let filteredEvents = events.filter { event in
            // 골 이벤트인 경우 isActualGoal 속성 사용
            if event.type.lowercased() == "goal" {
                return event.isActualGoal
            }
            
            switch event.eventCategory {
            case .goal, .card, .substitution, .var:
                return true
            case .other:
                return false
            }
        }
        
        // 이벤트 로깅 (디버깅용)
        print("🔄 MatchSummaryView - 필터링된 이벤트: \(filteredEvents.count)개")
        for (index, event) in filteredEvents.enumerated() {
            let timeInfo = event.isExtraTime ? "\(event.time.elapsed)' (연장)" : "\(event.time.elapsed)'"
            print("  [\(index+1)] \(timeInfo) - \(event.type) - \(event.detail) - \(event.player.name ?? "알 수 없음")")
        }
        
        return Dictionary(grouping: filteredEvents) { $0.time.elapsed }
            .sorted { $0.key < $1.key }
    }
    
    private var homeStats: [String: StatisticValue] {
        guard !statistics.isEmpty else { return [:] }
        let stats = statistics[0].statistics
        return Dictionary(uniqueKeysWithValues: stats.map { ($0.type, $0.value) })
    }
    
    private var awayStats: [String: StatisticValue] {
        guard statistics.count > 1 else { return [:] }
        let stats = statistics[1].statistics
        return Dictionary(uniqueKeysWithValues: stats.map { ($0.type, $0.value) })
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 32) { // 섹션 간 간격 증가
            // 맨 오브 더 매치
            if let motm = viewModel.manOfTheMatch {
                VStack(alignment: .leading) {
                    Text("맨 오브 더 매치")
                        .font(.headline)
                    
                    ManOfTheMatchView(player: motm)
                        .onAppear {
                            print("✅ 맨 오브 더 매치 뷰 등장: \(motm.player.name ?? "Unknown")")
                        }
                }
            } else {
                // 맨 오브 더 매치가 없는 경우 로딩 표시
                VStack(alignment: .leading, spacing: 16) {
                    Text("맨 오브 더 매치")
                        .font(.headline)
                    
                    VStack {
                        ProgressView()
                            .padding()
                        Text("맨 오브 더 매치 선정 중...")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.1), radius: 5, y: 2)
                    .onAppear {
                        // 맨 오브 더 매치 로드 시도
                        if viewModel.matchPlayerStats.isEmpty {
                            Task {
                                await viewModel.loadMatchPlayerStats()
                            }
                        }
                    }
                }
            }
            
            // 주요 이벤트
            VStack(alignment: .leading, spacing: 16) {
                Text("주요 이벤트")
                    .font(.headline)
                
                if keyEvents.isEmpty {
                    // 경기가 진행 중이지만 아직 이벤트가 없는 경우에만 "대기 중" 메시지 표시
                    if isLiveMatch {
                        Text("경기 진행 중... 주요 이벤트 대기 중")
                            .foregroundColor(.red)
                            .padding()
                    } else {
                        Text("주요 이벤트가 없습니다")
                            .foregroundColor(.gray)
                            .padding()
                    }
                } else {
                    VStack(spacing: 0) {
                        ForEach(keyEvents, id: \.0) { elapsed, timeEvents in
                            TimelineSection(
                                elapsed: elapsed,
                                events: timeEvents,
                                fixture: fixture
                            )
                        }
                    }
                    .padding(.all, 16)
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
            }
            
            // 요약 통계
            VStack(alignment: .leading, spacing: 20) {
                Text("요약 통계")
                    .font(.headline)
                
                if statistics.isEmpty {
                    Text("통계 정보가 없습니다")
                        .foregroundColor(.gray)
                        .padding()
                } else {
                    VStack(spacing: 24) {
                        // 팀 로고 - 경기 요약 탭 하단에서는 팀 프로필로 이동하지 않음
                        HStack {
                            // 홈팀 로고 + 약어
                            VStack(spacing: 4) {
                                // 홈팀 로고 (Kingfisher 캐싱 사용)
                                TeamLogoView(logoUrl: statistics[0].team.logo, size: 40)

                                Text(TeamAbbreviations.abbreviation(for: statistics[0].team.name))
                                    .font(.caption)
                                    .fontWeight(.medium)
                            }

                            Spacer()

                            Text("vs")
                                .font(.subheadline)
                                .foregroundColor(.gray)

                            Spacer()

                            // 원정팀 로고 + 약어
                            VStack(spacing: 4) {
                                // 원정팀 로고 (Kingfisher 캐싱 사용)
                                TeamLogoView(logoUrl: statistics[1].team.logo, size: 40)

                                Text(TeamAbbreviations.abbreviation(for: statistics[1].team.name))
                                    .font(.caption)
                                    .fontWeight(.medium)
                            }
                        }
                        .padding(.horizontal, 40)
                        
                        // 통계 값들
                        VStack(spacing: 16) {
                            // 점유율
                            if let homePossession = homeStats["Ball Possession"],
                               let awayPossession = awayStats["Ball Possession"] {
                                StatisticItem(
                                    title: "점유율",
                                    leftValue: homePossession.displayValue,
                                    rightValue: awayPossession.displayValue,
                                    homeTeam: statistics[0].team,
                                    awayTeam: statistics[1].team
                                )
                            }
                            
                            // 예상 득점
                            if let homeXG = homeStats["expected_goals"],
                               let awayXG = awayStats["expected_goals"] {
                                StatisticItem(
                                    title: "예상 득점",
                                    leftValue: homeXG.displayValue,
                                    rightValue: awayXG.displayValue,
                                    homeTeam: statistics[0].team,
                                    awayTeam: statistics[1].team
                                )
                            }
                            
                            // 전체 슈팅
                            if let homeShots = homeStats["Total Shots"],
                               let awayShots = awayStats["Total Shots"] {
                                StatisticItem(
                                    title: "전체 슈팅",
                                    leftValue: homeShots.displayValue,
                                    rightValue: awayShots.displayValue,
                                    homeTeam: statistics[0].team,
                                    awayTeam: statistics[1].team
                                )
                            }
                        }
                    }
                    .padding(.all, 16)
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
                }
            }
            
            // 최근 폼 - 항상 표시
            VStack(alignment: .leading, spacing: 16) {
                Text("최근 폼")
                    .font(.headline)
                
                // 로딩 상태와 관계없이 항상 팀 폼 뷰 표시
                HStack(spacing: 24) {
                    teamFormView(team: fixture.teams.home, form: viewModel.homeTeamForm)
                    teamFormView(team: fixture.teams.away, form: viewModel.awayTeamForm)
                }
                .padding(.horizontal)
                .padding(.all, 16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
            }
            .onAppear {
                // 폼 데이터 로드 시도
                if viewModel.homeTeamForm == nil || viewModel.awayTeamForm == nil {
                    Task {
                        await viewModel.loadTeamForms()
                    }
                }
            }
            
            // 기본 정보 (맨 하단에 배치)
            VStack(alignment: .leading, spacing: 16) {
                Text("기본 정보")
                    .font(.headline)
                
                VStack(spacing: 16) {
                    // 경기 시간
                    HStack(spacing: 12) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.blue)
                            .frame(width: 28)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("경기 시간")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            Text(formattedUserTime)
                                .font(.system(.body, design: .rounded))
                                .fontWeight(.medium)
                        }
                        
                        Spacer()
                    }
                    
                    Divider()
                    
                    // 경기장
                    if let venueName = fixture.fixture.venue.name {
                        HStack(spacing: 12) {
                            Image(systemName: "mappin.circle.fill")
                                .font(.system(size: 20))
                                .foregroundColor(.red)
                                .frame(width: 28)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("경기장")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                Text(venueName)
                                    .font(.system(.body, design: .rounded))
                                    .fontWeight(.medium)
                            }
                            
                            Spacer()
                        }
                        
                        Divider()
                    }
                    
                    // 심판
                    if let referee = fixture.fixture.referee {
                        HStack(spacing: 12) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 20))
                                .foregroundColor(.purple)
                                .frame(width: 28)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("심판")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                Text(referee)
                                    .font(.system(.body, design: .rounded))
                                    .fontWeight(.medium)
                            }
                            
                            Spacer()
                        }
                    }
                }
                .padding(.all, 16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
            }
        }
        .padding(.horizontal, 16) // 좌우 여백 추가하여 가독성 향상
    }
    
    // 최근 경기 행 표시
    private func recentFixtureRow(fixture: Fixture, teamId: Int) -> some View {
        NavigationLink(destination: FixtureDetailView(fixture: fixture)) {
            HStack(spacing: 4) {
                // 경기 일자
                Text(formattedShortDate(from: fixture.fixture.date))
                    .font(.system(.caption, design: .rounded))
                    .foregroundColor(.secondary)
                    .frame(width: 40, alignment: .leading)
                
                // 상대팀 (홈/원정에 따라 다름)
                let isHome = fixture.teams.home.id == teamId
                let opponent = isHome ? fixture.teams.away : fixture.teams.home
                
                Text(TeamAbbreviations.abbreviation(for: opponent.name))
                    .font(.system(.caption, design: .rounded))
                    .foregroundColor(.secondary)
                    .frame(width: 30, alignment: .center)
                    .lineLimit(1)
                
                // 스코어
                if let homeGoals = fixture.goals?.home, let awayGoals = fixture.goals?.away {
                    let score = isHome ? "\(homeGoals)-\(awayGoals)" : "\(awayGoals)-\(homeGoals)"
                    Text(score)
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.secondary)
                        .frame(width: 30, alignment: .center)
                } else {
                    Text("-")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.secondary)
                        .frame(width: 30, alignment: .center)
                }
                
                // 결과 (승/무/패)
                let result = getMatchResult(fixture: fixture, teamId: teamId)
                Text(result.text)
                    .font(.system(.caption, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .frame(width: 24, height: 24)
                    .background(resultColor(result))
                    .cornerRadius(4)
            }
            .padding(.vertical, 2)
            .padding(.horizontal, 4)
            .background(Color(.systemGray6).opacity(0.5))
            .cornerRadius(4)
        }
        .buttonStyle(PlainButtonStyle()) // 기본 버튼 스타일 제거
    }
    
    // 경기 결과 계산
    private func getMatchResult(fixture: Fixture, teamId: Int) -> TeamForm.MatchResult {
        // 경기가 완료된 경우에만 계산
        guard fixture.fixture.status.short == "FT" ||
              fixture.fixture.status.short == "AET" ||
              fixture.fixture.status.short == "PEN" else {
            return .draw // 기본값
        }
        
        // 골 정보가 있는지 확인
        guard let homeGoals = fixture.goals?.home,
              let awayGoals = fixture.goals?.away else {
            return .draw // 기본값
        }
        
        // 팀 ID에 따라 결과 계산
        if fixture.teams.home.id == teamId {
            if homeGoals > awayGoals {
                return .win
            } else if homeGoals < awayGoals {
                return .loss
            } else {
                return .draw
            }
        } else {
            if awayGoals > homeGoals {
                return .win
            } else if awayGoals < homeGoals {
                return .loss
            } else {
                return .draw
            }
        }
    }
    
    // 결과 색상
    private func resultColor(_ result: TeamForm.MatchResult) -> Color {
        switch result {
        case .win:  return .blue
        case .draw: return .gray
        case .loss: return .red
        }
    }
    
    // 짧은 날짜 포맷 (MM.dd)
    private func formattedShortDate(from dateString: String) -> String {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        inputFormatter.timeZone = TimeZone(secondsFromGMT: 0)
        
        if let date = inputFormatter.date(from: dateString) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "MM.dd"
            outputFormatter.timeZone = TimeZone.current
            return outputFormatter.string(from: date)
        }
        return "--"
    }
    
    // 팀 폼 뷰
    private func teamFormView(team: Team, form: TeamForm?) -> some View {
        VStack(spacing: 12) {
            // 팀 로고 및 이름
            TeamLogoView(logoUrl: team.logo, size: 40)
            
            Text(team.name)
                .font(.system(.subheadline, design: .rounded))
                .fontWeight(.medium)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(height: 40)
            
            // 최근 경기 결과 표시
            if let form = form {
                VStack(spacing: 8) {
                    // 최근 경기 결과 헤더
                    HStack {
                        Text("최근 경기")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.leading, 4)
                        Spacer()
                    }
                    
                    // 최근 경기 목록
                    VStack(spacing: 6) {
                        let recentFixtures = team.id == fixture.teams.home.id ?
                            viewModel.homeTeamRecentFixtures : viewModel.awayTeamRecentFixtures
                        
                        if recentFixtures.isEmpty {
                            // 기존 방식으로 표시 (폼 인디케이터만)
                            HStack(spacing: 4) {
                                ForEach(Array(form.results.enumerated().reversed()), id: \.offset) { _, result in
                                    FormIndicator(result: result)
                                }
                            }
                        } else {
                            // 상세 경기 정보 표시
                            ForEach(recentFixtures.prefix(5), id: \.fixture.id) { fixture in
                                recentFixtureRow(fixture: fixture, teamId: team.id)
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            } else {
                Text("정보 없음")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct InfoRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Label(title, systemImage: icon)
                .foregroundColor(.gray)
            
            Spacer()
            
            Text(value)
                .fontWeight(.medium)
        }
    }
}

struct TimelineSection: View {
    let elapsed: Int
    let events: [FixtureEvent]
    let fixture: Fixture
    
    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            // 시간 표시
            Text("\(elapsed)'")
                .font(.system(.caption, design: .rounded))
                .fontWeight(.medium)
                .foregroundColor(.gray)
                .frame(width: 40)
            
            // 타임라인 라인
            TimelineLine()
                .frame(width: 2)
                .padding(.horizontal, 8)
            
            // 이벤트 카드들
            VStack(spacing: 8) {
                ForEach(events) { event in
                    TimelineEventCard(
                        event: event,
                        isHome: event.team.id == fixture.teams.home.id
                    )
                }
            }
            .padding(.trailing)
        }
        .padding(.vertical, 8)
    }
}

struct TimelineLine: View {
    var body: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.2))
    }
}

// MARK: - 맨 오브 더 매치 뷰
struct ManOfTheMatchView: View {
    let player: FixturePlayerStats
    
    private var playerRating: String {
        player.statistics.first?.games?.rating ?? "-"
    }
    
    private var playerGoals: Int {
        player.statistics.first?.goals?.total ?? 0
    }
    
    private var playerAssists: Int {
        player.statistics.first?.goals?.assists ?? 0
    }
    
    private var playerShots: Int {
        player.statistics.first?.shots?.total ?? 0
    }
    
    private var playerShotsOnTarget: Int {
        player.statistics.first?.shots?.on ?? 0
    }
    
    private var playerPasses: Int {
        player.statistics.first?.passes?.total ?? 0
    }
    
    private var playerKeyPasses: Int {
        player.statistics.first?.passes?.key ?? 0
    }
    
    private var playerDribbles: Int {
        player.statistics.first?.dribbles?.success ?? 0
    }
    
    private var playerTackles: Int {
        player.statistics.first?.tackles?.total ?? 0
    }
    
    private var playerPosition: String {
        player.statistics.first?.games?.position ?? "-"
    }
    
    private var playerTeamName: String {
        player.team?.name ?? "-"
    }
    
    private var playerTeamLogo: String {
        player.team?.logo ?? ""
    }
    
    private var playerHighlights: [(String, String)] {
        var highlights: [(String, String)] = []
        
        if playerGoals > 0 {
            highlights.append(("⚽️", "\(playerGoals)골"))
        }
        
        if playerAssists > 0 {
            highlights.append(("🅰️", "\(playerAssists)어시스트"))
        }
        
        if playerKeyPasses > 0 {
            highlights.append(("🔑", "키패스 \(playerKeyPasses)회"))
        }
        
        if playerDribbles > 0 {
            highlights.append(("🏃‍♂️", "드리블 성공 \(playerDribbles)회"))
        }
        
        if playerTackles > 0 {
            highlights.append(("🛡️", "태클 \(playerTackles)회"))
        }
        
        if playerShotsOnTarget > 0 {
            highlights.append(("🎯", "유효슈팅 \(playerShotsOnTarget)회"))
        }
        
        return highlights
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            
            VStack(spacing: 20) {
                // 선수 정보 헤더
                HStack(spacing: 16) {
                    // 선수 사진 (Kingfisher 캐싱 사용)
                    CachedImageView(
                        url: URL(string: player.player.photo ?? ""),
                        placeholder: Image(systemName: "person.circle.fill"),
                        failureImage: Image(systemName: "person.circle.fill"),
                        contentMode: .fit
                    )
                    .frame(width: 80, height: 80)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Color.yellow, lineWidth: 3)
                            .shadow(color: .yellow.opacity(0.5), radius: 5)
                    )
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(player.player.name ?? "Unknown")
                            .font(.title3)
                            .fontWeight(.bold)
                        
                        HStack(spacing: 8) {
                            // 팀 로고 (Kingfisher 캐싱 사용)
                            TeamLogoView(logoUrl: playerTeamLogo, size: 20)
                            
                            Text(playerTeamName)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        HStack(spacing: 8) {
                            Text(playerPosition)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.1))
                                .cornerRadius(4)
                            
                            // 평점
                            HStack(spacing: 2) {
                                Image(systemName: "star.fill")
                                    .foregroundColor(.yellow)
                                    .font(.caption)
                                
                                Text(playerRating)
                                    .font(.caption.bold())
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.yellow.opacity(0.1))
                            .cornerRadius(4)
                        }
                    }
                    
                    Spacer()
                }
                
                // 주요 활약
                VStack(alignment: .leading, spacing: 12) {
                    Text("주요 활약")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        ForEach(playerHighlights, id: \.0) { icon, text in
                            HStack(spacing: 8) {
                                Text(icon)
                                    .font(.subheadline)
                                
                                Text(text)
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                            }
                            .padding(.vertical, 6)
                            .padding(.horizontal, 10)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                }
            }
            .padding(.all, 16)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.yellow.opacity(0.2), radius: 10, y: 5)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.yellow.opacity(0.3), lineWidth: 1)
            )
        }
    }
}
