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
                        Image(systemName: "whistle.fill")
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

            if let form = form {
                HStack(spacing: 4) {
                    ForEach(Array(form.results.enumerated().reversed()), id: \.offset) { _, result in
                        FormIndicator(result: result)
                    }
                }
            } else {
                Text("정보 없음")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .frame(maxWidth: .infinity)
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
