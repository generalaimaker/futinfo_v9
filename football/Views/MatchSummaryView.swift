import SwiftUI

struct MatchSummaryView: View {
    let fixture: Fixture
    let events: [FixtureEvent]
    let statistics: [TeamStatistics]
    let viewModel: FixtureDetailViewModel
    
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
            switch event.eventCategory {
            case .goal, .card, .substitution, .var:
                return true
            case .other:
                return false
            }
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
        VStack(spacing: 24) {
            // 주요 이벤트
            VStack(spacing: 16) {
                Text("주요 이벤트")
                    .font(.headline)
                
                if keyEvents.isEmpty {
                    Text("주요 이벤트가 없습니다")
                        .foregroundColor(.gray)
                        .padding()
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
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                }
            }
            
            // 요약 통계
            VStack(spacing: 20) {
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
                            // 홈팀 로고
                            AsyncImage(url: URL(string: statistics[0].team.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .font(.system(size: 30))
                                    .foregroundColor(.gray)
                            }
                            
                            Spacer()
                            
                            Text("vs")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            Spacer()
                            
                            // 원정팀 로고
                            AsyncImage(url: URL(string: statistics[1].team.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .font(.system(size: 30))
                                    .foregroundColor(.gray)
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
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
                }
            }
            
            // 최근 폼 - 항상 표시
            VStack(spacing: 16) {
                Text("최근 폼")
                    .font(.headline)
                
                VStack(spacing: 16) {
                    // 홈팀 - 최근 폼 영역에서도 팀 프로필로 이동하지 않음
                    HStack {
                        // 홈팀 로고
                        AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                                .frame(width: 32, height: 32)
                        } placeholder: {
                            Image(systemName: "sportscourt")
                                .font(.system(size: 24))
                                .foregroundColor(.gray)
                        }
                        
                        Text(fixture.teams.home.name)
                            .font(.system(.body, design: .rounded))
                            .fontWeight(.medium)
                        
                        Spacer()
                        
                        if let homeForm = viewModel.homeTeamForm {
                            HStack(spacing: 8) {
                                ForEach(Array(homeForm.results.enumerated()), id: \.offset) { _, result in
                                    FormIndicator(result: result)
                                }
                            }
                        } else {
                            // 폼 데이터가 없는 경우 로딩 표시
                            Text("데이터 로드 중...")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    // 원정팀 - 최근 폼 영역에서도 팀 프로필로 이동하지 않음
                    HStack {
                        // 원정팀 로고
                        AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                                .frame(width: 32, height: 32)
                        } placeholder: {
                            Image(systemName: "sportscourt")
                                .font(.system(size: 24))
                                .foregroundColor(.gray)
                        }
                        
                        Text(fixture.teams.away.name)
                            .font(.system(.body, design: .rounded))
                            .fontWeight(.medium)
                        
                        Spacer()
                        
                        if let awayForm = viewModel.awayTeamForm {
                            HStack(spacing: 8) {
                                ForEach(Array(awayForm.results.enumerated()), id: \.offset) { _, result in
                                    FormIndicator(result: result)
                                }
                            }
                        } else {
                            // 폼 데이터가 없는 경우 로딩 표시
                            Text("데이터 로드 중...")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding()
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
            VStack(spacing: 16) {
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
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
            }
        }
        .padding(.horizontal)
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
