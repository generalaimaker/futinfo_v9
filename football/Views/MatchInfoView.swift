import SwiftUI

struct MatchInfoView: View {
    let fixture: Fixture
    @ObservedObject var viewModel: FixtureDetailViewModel

    @State private var isDataLoaded = false
    @State private var retryCount = 0

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        mainContentView
            .padding(.horizontal)
            .navigationTitle("정보")
            .onAppear { loadData() }
            .onReceive(timer) { _ in
                if !isDataLoaded && retryCount < 3 {
                    retryCount += 1
                    loadData()
                }
            }
    }

    // MARK: - Data Loading
    private func loadData() {
        Task {
            await viewModel.loadTeamForms()
            await viewModel.loadStandings()
            checkDataLoaded()
        }
    }

    private func checkDataLoaded() {
        if viewModel.homeTeamForm != nil &&
            viewModel.awayTeamForm != nil &&
            !viewModel.standings.isEmpty {
            isDataLoaded = true
        }
    }

    // MARK: - Helpers
    private func resultColor(_ result: TeamForm.MatchResult) -> Color {
        switch result {
        case .win:  return .green
        case .draw: return .orange
        case .loss: return .red
        }
    }

    /// ISO8601 문자열을 "2025년 5월 11일 (일) 23:15" 형식으로 변환
    private func formattedMatchDate() -> String {
        let iso = fixture.fixture.date            // API‑Football ISO8601 string
        let isoFormatter = ISO8601DateFormatter()
        guard let date = isoFormatter.date(from: iso) else { return iso }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "yyyy년 M월 d일 (E) HH:mm"
        return formatter.string(from: date)
    }

    // MARK: - UI Components
    private var mainContentView: some View {
        VStack(spacing: 24) {
            basicInfoSection
            recentFormSection
            standingsSection
        }
    }

    // 기본 정보
    private var basicInfoSection: some View {
        VStack(spacing: 16) {
            Text("기본 정보")
                .font(.headline)

            VStack(spacing: 12) {
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.blue)
                    Text(formattedMatchDate())
                        .font(.system(.body, design: .rounded))
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if let venueName = fixture.fixture.venue.name {
                    HStack {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(.blue)
                        Text(venueName)
                            .font(.system(.body, design: .rounded))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                HStack {
                    Image(systemName: "trophy.fill")
                        .foregroundColor(.blue)
                    Text("\(fixture.league.name) - \(fixture.league.round)")
                        .font(.system(.body, design: .rounded))
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if let referee = fixture.fixture.referee {
                    HStack {
                        Image(systemName: "person.fill.badge.plus")
                            .foregroundColor(.blue)
                        Text(referee)
                            .font(.system(.body, design: .rounded))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding(.horizontal)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }

    // 최근 5경기
    private var recentFormSection: some View {
        VStack(spacing: 16) {
            Text("최근 5경기")
                .font(.headline)

            if viewModel.isLoadingForm {
                ProgressView().padding()
            } else {
                HStack(spacing: 24) {
                    teamFormView(team: fixture.teams.home, form: viewModel.homeTeamForm)
                    teamFormView(team: fixture.teams.away, form: viewModel.awayTeamForm)
                }
                .padding(.horizontal)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }

    private func teamFormView(team: Team, form: TeamForm?) -> some View {
        VStack(spacing: 12) {
            // 팀 로고 및 이름
            AsyncImage(url: URL(string: team.logo)) { image in
                image.resizable().scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt.fill").foregroundColor(.gray)
            }
            .frame(width: 40, height: 40)

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

    // 순위
    private var standingsSection: some View {
        VStack(spacing: 16) {
            Text("현재 순위")
                .font(.headline)

            if viewModel.isLoadingStandings {
                ProgressView().padding()
            } else if !viewModel.standings.isEmpty {
                standingsTableView
            } else {
                Text("순위 정보가 없습니다")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding()
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }

    private var standingsTableView: some View {
        VStack(spacing: 0) {
            standingsTableHeader
            ForEach(viewModel.standings) { standing in
                if standing.team.id == fixture.teams.home.id ||
                    standing.team.id == fixture.teams.away.id {
                    standingRow(standing: standing)
                }
            }
        }
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color(.systemGray5), lineWidth: 1)
        )
        .frame(maxWidth: .infinity)   // << added
    }

    private var standingsTableHeader: some View {
        HStack {
            Text("순위").font(.caption).foregroundColor(.gray).frame(width: 40)
            Text("팀").font(.caption).foregroundColor(.gray).frame(maxWidth: .infinity, alignment: .leading)
            Text("경기").font(.caption).foregroundColor(.gray).frame(width: 40)
            Text("승점").font(.caption).foregroundColor(.gray).frame(width: 40)
            Text("득실").font(.caption).foregroundColor(.gray).frame(width: 40)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
    }

    private func standingRow(standing: Standing) -> some View {
        HStack {
            Text("\(standing.rank)")
                .font(.system(.body, design: .rounded))
                .fontWeight(.bold)
                .frame(width: 40)

            HStack(spacing: 8) {
                AsyncImage(url: URL(string: standing.team.logo)) { image in
                    image.resizable().scaledToFit()
                } placeholder: {
                    Image(systemName: "sportscourt.fill").foregroundColor(.gray)
                }
                .frame(width: 20, height: 20)

                Text(TeamAbbreviations.abbreviation(for: standing.team.name))
                    .font(.system(.body, design: .rounded))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text("\(standing.all.played)").frame(width: 40)
            Text("\(standing.points)").fontWeight(.bold).frame(width: 40)
            Text("\(standing.goalsDiff)")
                .foregroundColor(standing.goalsDiff >= 0 ? .blue : .red)
                .frame(width: 40)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            standing.team.id == fixture.teams.home.id ? Color.blue.opacity(0.1) :
            standing.team.id == fixture.teams.away.id ? Color.red.opacity(0.1) :
            Color.clear
        )
    }
}
