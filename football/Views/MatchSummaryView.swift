import SwiftUI

struct MatchSummaryView: View {
    let fixture: Fixture
    let events: [FixtureEvent]
    let statistics: [TeamStatistics]
    let viewModel: FixtureDetailViewModel
    
    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        formatter.timeZone = TimeZone(identifier: fixture.fixture.timezone)
        return formatter
    }
    
    private var localTimeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy년 M월 d일 (E) HH:mm"
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.timeZone = TimeZone(identifier: fixture.fixture.timezone)
        return formatter
    }
    
    private var formattedLocalTime: String {
        guard let date = dateFormatter.date(from: fixture.fixture.date) else { return "" }
        return localTimeFormatter.string(from: date)
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
            // 기본 정보
            VStack(spacing: 20) {
                Text("기본 정보")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                VStack(spacing: 16) {
                    // 현지 시간
                    HStack(spacing: 12) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.blue)
                            .frame(width: 28)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("현지 시간")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            Text(formattedLocalTime)
                                .font(.system(.body, design: .rounded))
                                .fontWeight(.medium)
                        }
                        
                        Spacer()
                    }
                    
                    Divider()
                    
                    // 리그 및 라운드
                    HStack(spacing: 12) {
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.yellow)
                            .frame(width: 28)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("대회")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            Text("\(fixture.league.name)")
                                .font(.system(.body, design: .rounded))
                                .fontWeight(.medium)
                            Text("\(fixture.league.round)")
                                .font(.subheadline)
                                .foregroundColor(.gray)
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
                        // 팀 로고
                        HStack {
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
                                StatRow(
                                    title: "점유율",
                                    homeValue: homePossession.displayValue,
                                    awayValue: awayPossession.displayValue,
                                    homeTeam: statistics[0].team,
                                    awayTeam: statistics[1].team
                                )
                            }
                            
                            // 예상 득점
                            if let homeXG = homeStats["expected_goals"],
                               let awayXG = awayStats["expected_goals"] {
                                StatRow(
                                    title: "예상 득점",
                                    homeValue: homeXG.displayValue,
                                    awayValue: awayXG.displayValue,
                                    homeTeam: statistics[0].team,
                                    awayTeam: statistics[1].team
                                )
                            }
                            
                            // 전체 슈팅
                            if let homeShots = homeStats["Total Shots"],
                               let awayShots = awayStats["Total Shots"] {
                                StatRow(
                                    title: "전체 슈팅",
                                    homeValue: homeShots.displayValue,
                                    awayValue: awayShots.displayValue,
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
            
            // 최근 폼
            if let homeForm = viewModel.homeTeamForm,
               let awayForm = viewModel.awayTeamForm {
                VStack(spacing: 16) {
                    Text("최근 폼")
                        .font(.headline)
                    
                    VStack(spacing: 16) {
                        // 홈팀
                        HStack {
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
                            
                            HStack(spacing: 8) {
                                ForEach(Array(homeForm.results.enumerated()), id: \.offset) { _, result in
                                    FormIndicator(result: result)
                                }
                            }
                        }
                        
                        // 원정팀
                        HStack {
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
                            
                            HStack(spacing: 8) {
                                ForEach(Array(awayForm.results.enumerated()), id: \.offset) { _, result in
                                    FormIndicator(result: result)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10, y: 5)
                }
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
