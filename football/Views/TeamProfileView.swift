import SwiftUI
import Charts // SwiftUI Charts 임포트

// MARK: - Components
import Foundation

// TeamHistoryView를 Identifiable로 만듭니다. season을 id로 사용합니다.
struct TeamHistoryView: Identifiable {
    let id: Int // season을 id로 사용
    let season: Int
    let leagueId: Int
    let statistics: TeamSeasonStatistics
    let standing: TeamStanding?

    var seasonDisplay: String {
        "\(season)-\((season + 1) % 100)"
    }

    var leaguePosition: String {
        standing?.rank.description ?? "N/A"
    }

    var winRate: Double {
        guard let fixtures = statistics.fixtures else { return 0 }
        let totalGames = fixtures.played.total
        return totalGames > 0 ? Double(fixtures.wins.total) / Double(totalGames) * 100 : 0
    }

    var goalsPerGame: Double {
        guard let goals = statistics.goals else { return 0 }
        let totalGames = statistics.fixtures?.played.total ?? 0
        return totalGames > 0 ? Double(goals.for.total.total) / Double(totalGames) : 0
    }

    var cleanSheetRate: Double {
        guard let cleanSheets = statistics.clean_sheets,
              let totalGames = statistics.fixtures?.played.total,
              totalGames > 0
        else { return 0 }
        return Double(cleanSheets.total) / Double(totalGames) * 100
    }

    init(season: Int, leagueId: Int, statistics: TeamSeasonStatistics, standing: TeamStanding?) {
        self.id = season // season을 고유 ID로 사용
        self.season = season
        self.leagueId = leagueId
        self.statistics = statistics
        self.standing = standing
    }
}

struct TeamProfileView: View {
    @StateObject private var viewModel: TeamProfileViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = 0 // 선택된 탭 인덱스 (0: 팀 정보, 1: 선수단)

    // ViewModel을 외부에서 주입받거나, teamId로 초기화하는 방식 모두 지원
    init(viewModel: TeamProfileViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    init(teamId: Int, leagueId: Int? = nil) {
        _viewModel = StateObject(wrappedValue: TeamProfileViewModel(teamId: teamId, leagueId: leagueId))
    }

    @ObservedObject private var favoriteService = FavoriteService.shared

    var body: some View {
        TabView(selection: $selectedTab) {
            // 첫 번째 탭: 팀 정보
            TeamInfoTabView(viewModel: viewModel, showFullSquad: { selectedTab = 1 })
                .tabItem {
                    Label("팀 정보", systemImage: "shield.fill")
                }
                .tag(0)
            
            // 두 번째 탭: 선수단
            TeamSquadTabView(viewModel: viewModel)
                .tabItem {
                    Label("선수단", systemImage: "person.3.fill")
                }
                .tag(1)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if viewModel.isLoadingProfile || viewModel.isLoadingStats {
                    ProgressView()
                } else if let team = viewModel.teamProfile?.team {
                    Button(action: {
                        withAnimation(.spring()) {
                            favoriteService.toggleFavorite(
                                type: .team,
                                entityId: team.id,
                                name: team.name,
                                imageUrl: team.logo
                            )
                        }
                    }) {
                        Image(systemName: favoriteService.isFavorite(type: .team, entityId: team.id) ? "star.fill" : "star")
                            .foregroundColor(favoriteService.isFavorite(type: .team, entityId: team.id) ? .yellow : .gray)
                    }
                }
            }
        }
        .task {
            if viewModel.teamProfile == nil {
                await viewModel.loadAllData()
            }
        }
    }
}

// MARK: - Team Header Section (완전 개선)
struct TeamHeaderSection: View {
    let profile: TeamProfile?
    
    var body: some View {
        ZStack(alignment: .top) {
            // 상단 배경
            VStack(spacing: 0) {
                Rectangle()
                    .fill(Color.blue.opacity(0.1))
                    .frame(height: 150)
                
                // 팀 정보 카드 (로고 아래 충분한 공간 확보)
                VStack(spacing: 8) {
                    // 로고를 위한 빈 공간
                    Spacer()
                        .frame(height: 60)
                    
                    // 팀 이름
                    Text(profile?.team.name ?? "팀 이름")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    // 팀 정보
                    HStack(spacing: 10) {
                        Text(profile?.team.country ?? "국가")
                        if let founded = profile?.team.founded {
                            Text("• 창단: \(founded)년")
                        }
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.bottom, 16)
                }
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.8)) // 반투명 배경
                .cornerRadius(15)
                .padding(.horizontal)
            }
            
            // 로고 (완전히 위에 표시)
            logoView()
                .offset(y: 90) // 로고 위치 조정
                .zIndex(100) // 항상 최상위에 표시
        }
        .padding(.bottom, 20)
    }
    
    // 로고 뷰를 별도 함수로 분리
    @ViewBuilder
    private func logoView() -> some View {
        ZStack {
            // 로고 배경 (흰색 원)
            Circle()
                .fill(Color.white)
                .frame(width: 120, height: 120)
                .shadow(color: .black.opacity(0.2), radius: 5, x: 0, y: 2)
            
            // 팀 로고
            if let logoUrl = profile?.team.logo, let url = URL(string: logoUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .padding(8)
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 110, height: 110)
            } else {
                Image(systemName: "shield.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.gray)
                    .frame(width: 110, height: 110)
            }
        }
    }
}

// MARK: - Season Picker Section
struct SeasonPickerSection: View {
    let seasons: [Int]
    @Binding var selectedSeason: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("시즌")
                .font(.headline)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(seasons, id: \.self) { season in
                        Button(action: {
                            selectedSeason = season
                        }) {
                            Text("\(season)-\((season + 1) % 100)")
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(
                                    selectedSeason == season ?
                                    Color.blue : Color(.systemGray6)
                                )
                                .foregroundColor(
                                    selectedSeason == season ?
                                    .white : .primary
                                )
                                .cornerRadius(20)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(15)
        .shadow(radius: 5)
    }
}

// MARK: - Statistics Section
struct StatisticsSection: View {
    let stats: TeamSeasonStatistics

    var body: some View {
        VStack(spacing: 16) {
            let league = stats.league
            HStack(spacing: 12) {
                AsyncImage(url: URL(string: league.logo)) { image in
                    image.resizable().scaledToFit()
                } placeholder: {
                    Circle().fill(Color.gray.opacity(0.3))
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(league.name)
                        .font(.headline)
                        .fontWeight(.medium)
                    Text("\(league.season)-\((league.season + 1) % 100) 시즌")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                AsyncImage(url: URL(string: league.flag ?? "")) { image in
                    image.resizable().scaledToFit()
                } placeholder: {
                    EmptyView()
                }
                .frame(width: 30, height: 20)
                .clipShape(RoundedRectangle(cornerRadius: 4))
            }
            .padding()
            .background(.thinMaterial)
            .cornerRadius(15)
            .shadow(radius: 3, y: 2)

            if let fixtures = stats.fixtures {
                VStack(alignment: .leading, spacing: 16) {
                    Text("경기 기록")
                        .font(.headline)
                        .padding(.horizontal)

                    HStack(spacing: 12) {
                        ImprovedStatBox(title: "총 경기", value: "\(fixtures.played.total)", icon: "figure.soccer", color: .gray)
                        ImprovedStatBox(title: "승", value: "\(fixtures.wins.total)", icon: "checkmark.circle.fill", color: .green)
                        ImprovedStatBox(title: "무", value: "\(fixtures.draws.total)", icon: "minus.circle.fill", color: .orange)
                        ImprovedStatBox(title: "패", value: "\(fixtures.loses.total)", icon: "xmark.circle.fill", color: .red)
                    }
                    .padding(.horizontal)

                    VStack(spacing: 12) {
                        Text("홈 / 원정 기록")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)

                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("🏠 홈")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                StatRow(title: "승", value: "\(fixtures.wins.home)")
                                StatRow(title: "무", value: "\(fixtures.draws.home)")
                                StatRow(title: "패", value: "\(fixtures.loses.home)")
                            }
                            .padding()
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(10)

                            VStack(alignment: .leading, spacing: 8) {
                                Text("✈️ 원정")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                StatRow(title: "승", value: "\(fixtures.wins.away)")
                                StatRow(title: "무", value: "\(fixtures.draws.away)")
                                StatRow(title: "패", value: "\(fixtures.loses.away)")
                            }
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(10)
                        }
                        .padding(.horizontal)
                    }

                    Chart {
                        BarMark(
                            x: .value("결과", "승"),
                            y: .value("횟수", fixtures.wins.total)
                        )
                        .foregroundStyle(.green)
                        .annotation(position: .top) {
                            Text("\(fixtures.wins.total)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }

                        BarMark(
                            x: .value("결과", "무"),
                            y: .value("횟수", fixtures.draws.total)
                        )
                        .foregroundStyle(.orange)
                        .annotation(position: .top) {
                            Text("\(fixtures.draws.total)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }

                        BarMark(
                            x: .value("결과", "패"),
                            y: .value("횟수", fixtures.loses.total)
                        )
                        .foregroundStyle(.red)
                        .annotation(position: .top) {
                            Text("\(fixtures.loses.total)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .frame(height: 100)
                    .chartXAxis(.hidden)
                    .padding(.horizontal)
                    .padding(.top, 8)
                }
                .padding(.vertical)
                .background(.regularMaterial)
                .cornerRadius(15)
                .shadow(radius: 3, y: 2)
            }

            if let goals = stats.goals {
                VStack(alignment: .leading, spacing: 16) {
                    Text("득실점")
                        .font(.headline)
                        .padding(.horizontal)

                    HStack(spacing: 12) {
                        ImprovedStatBox(
                            title: "총 득점",
                            value: "\(goals.for.total.total)",
                            subvalue: "평균 \(goals.for.average.total)",
                            icon: "soccerball.inverse",
                            color: .blue
                        )
                        ImprovedStatBox(
                            title: "총 실점",
                            value: "\(goals.against.total.total)",
                            subvalue: "평균 \(goals.against.average.total)",
                            icon: "shield.lefthalf.filled",
                            color: .red
                        )
                    }
                    .padding(.horizontal)

                    VStack(spacing: 12) {
                        Text("홈 / 원정 득실점")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)

                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("🏠 홈")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                StatRow(title: "득점", value: "\(goals.for.total.home)")
                                StatRow(title: "실점", value: "\(goals.against.total.home)")
                            }
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(10)

                            VStack(alignment: .leading, spacing: 8) {
                                Text("✈️ 원정")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                StatRow(title: "득점", value: "\(goals.for.total.away)")
                                StatRow(title: "실점", value: "\(goals.against.total.away)")
                            }
                            .padding()
                            .background(Color.purple.opacity(0.1))
                            .cornerRadius(10)
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
                .background(.regularMaterial)
                .cornerRadius(15)
                .shadow(radius: 3, y: 2)
            }

            if let penalty = stats.penalty {
                VStack(alignment: .leading, spacing: 16) {
                    Text("페널티킥")
                        .font(.headline)
                        .padding(.horizontal)

                    HStack(spacing: 12) {
                        ImprovedStatBox(
                            title: "성공",
                            value: "\(penalty.scored.total)",
                            subvalue: penalty.scored.percentage,
                            icon: "checkmark.circle.fill",
                            color: .green
                        )
                        ImprovedStatBox(
                            title: "실패",
                            value: "\(penalty.missed.total)",
                            subvalue: penalty.missed.percentage,
                            icon: "xmark.circle.fill",
                            color: .red
                        )
                        ImprovedStatBox(
                            title: "총 시도",
                            value: "\(penalty.total)",
                            icon: "target",
                            color: .gray
                        )
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
                .background(.regularMaterial)
                .cornerRadius(15)
                .shadow(radius: 3, y: 2)
            }
        }
    }
}

// StatBox 개선 (아이콘 추가 등)
struct ImprovedStatBox: View {
    let title: String
    let value: String
    var subvalue: String? = nil
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
            Text(value)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            if let subvalue = subvalue {
                Text(subvalue)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .padding(.horizontal, 8)
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Venue Section (리뉴얼)
struct VenueSection: View {
    let venue: VenueInfo

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("홈 구장")
                .font(.headline)
                .padding(.horizontal)

            if let imageUrl = venue.image, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 200)
                        .clipped()
                        .cornerRadius(10)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 200)
                        .cornerRadius(10)
                        .overlay(Image(systemName: "sportscourt.fill").font(.largeTitle).foregroundColor(.gray))
                }
                .padding(.horizontal)
            }

            VStack(alignment: .leading, spacing: 12) {
                if let name = venue.name {
                    Text(name)
                        .font(.title3)
                        .fontWeight(.semibold)
                }
                if let city = venue.city {
                    Text(city)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Divider()

                HStack(spacing: 16) {
                    if let capacity = venue.capacity {
                        InfoItem(icon: "person.3.fill", label: "수용 인원", value: "\(capacity.formatted())명", color: .blue)
                    }
                    if let surface = venue.surface {
                        InfoItem(icon: "leaf.fill", label: "구장 표면", value: surface, color: .green)
                    }
                    Spacer()
                }

                if let address = venue.address {
                    InfoItem(icon: "mappin.circle.fill", label: "주소", value: address, color: .red)
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical)
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }
}

// 경기장 정보 항목을 위한 Helper View
struct InfoItem: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 20, alignment: .center)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
        }
    }
}

// MARK: - Recent Match Card (새로 정의)
struct RecentMatchCard: View {
    let fixture: Fixture
    let currentTeamId: Int

    private var matchResult: (text: String, color: Color) {
        if fixture.teams.home.winner == true {
            return fixture.teams.home.id == currentTeamId ? ("승", .blue) : ("패", .red)
        } else if fixture.teams.away.winner == true {
            return fixture.teams.away.id == currentTeamId ? ("승", .blue) : ("패", .red)
        } else {
            if let homeScore = fixture.goals?.home, let awayScore = fixture.goals?.away {
                if homeScore == awayScore {
                    return ("무", .gray)
                }
            }
            return ("무", .gray)
        }
    }

    private var opponent: Team {
        return fixture.teams.home.id == currentTeamId ? fixture.teams.away : fixture.teams.home
    }

    private var scoreDisplay: String {
        let homeScore = fixture.goals?.home ?? 0
        let awayScore = fixture.goals?.away ?? 0
        return fixture.teams.home.id == currentTeamId ? "\(homeScore) : \(awayScore)" : "\(awayScore) : \(homeScore)"
    }

    private var formattedDate: String {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        inputFormatter.timeZone = TimeZone(secondsFromGMT: 0)

        if let date = inputFormatter.date(from: fixture.fixture.date) {
            let outputFormatter = DateFormatter()
            outputFormatter.dateFormat = "MM/dd"
            outputFormatter.timeZone = TimeZone.current
            return outputFormatter.string(from: date)
        } else {
            return "N/A"
        }
    }

    var body: some View {
        VStack(spacing: 8) {
            AsyncImage(url: URL(string: opponent.logo)) { image in
                image.resizable().scaledToFit()
            } placeholder: {
                Color.gray.opacity(0.3)
            }
            .frame(width: 30, height: 30)
            .clipShape(Circle())

            Text(scoreDisplay)
                .font(.footnote)
                .fontWeight(.bold)

            Text(matchResult.text)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(matchResult.color)
                .clipShape(Capsule())

            Text(formattedDate)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(10)
        .background(.thinMaterial)
        .cornerRadius(10)
    }
}

// MARK: - Form Section (리뉴얼)
struct FormSection: View {
    let recentFixtures: [Fixture]?
    let currentTeamId: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("최근 5경기")
                .font(.headline)
                .padding(.horizontal)

            if let fixtures = recentFixtures, !fixtures.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(fixtures.prefix(5)) { fixture in
                            RecentMatchCard(fixture: fixture, currentTeamId: currentTeamId)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 5)
                }
            } else {
                Text("최근 경기 정보 없음")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            }
        }
        .padding(.vertical)
        .background(Color(.systemGroupedBackground))
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }
}

// MARK: - Formation Section (리뉴얼)
struct FormationSection: View {
    let lineups: [LineupStats]

    private var sortedLineups: [LineupStats] {
        lineups.sorted { $0.played > $1.played }
    }

    private var totalGamesPlayed: Int {
        max(1, sortedLineups.reduce(0) { $0 + $1.played })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("주요 포메이션")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 12) {
                ForEach(sortedLineups.prefix(3), id: \.formation) { lineup in
                    HStack {
                        Text(lineup.formation)
                            .font(.system(.body, design: .monospaced).weight(.medium))
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(lineup.played)회 사용")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("(\(Int(Double(lineup.played) / Double(totalGamesPlayed) * 100))%)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal)

                    if lineup.formation != sortedLineups.prefix(3).last?.formation {
                        Divider().padding(.horizontal)
                    }
                }
            }
        }
        .padding(.vertical)
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }
}

// MARK: - Helper Views
struct StatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

struct StatRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .foregroundColor(.secondary)

            Text(value)
                .fontWeight(.semibold)
        }
    }
}

// MARK: - Standing Section (리뉴얼)
struct StandingSection: View {
    let standing: TeamStanding
    let rankChange: Int = 0

    var rankChangeIcon: (name: String, color: Color) {
        switch rankChange {
        case 1...: return ("arrow.up", .green)
        case ..<0: return ("arrow.down", .red)
        default: return ("minus", .gray)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("현재 순위")
                .font(.headline)
                .padding(.horizontal)

            HStack(spacing: 16) {
                VStack(alignment: .center, spacing: 4) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(standing.rank)")
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        Image(systemName: rankChangeIcon.name)
                            .font(.caption)
                            .foregroundColor(rankChangeIcon.color)
                    }
                    Text("순위")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(width: 80)

                Divider().frame(height: 50)

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Label("승점", systemImage: "sum")
                            .labelStyle(.titleAndIcon)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(standing.points)")
                            .fontWeight(.semibold)
                    }
                    HStack {
                        Label("득실차", systemImage: "arrow.left.arrow.right")
                            .labelStyle(.titleAndIcon)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(standing.goalsDiff > 0 ? "+" : "")\(standing.goalsDiff)")
                            .fontWeight(.semibold)
                            .foregroundColor(standing.goalsDiff > 0 ? .blue : (standing.goalsDiff < 0 ? .red : .primary))
                    }
                    HStack {
                        Label("경기", systemImage: "figure.soccer")
                            .labelStyle(.titleAndIcon)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text("\(standing.all.win)승 \(standing.all.draw)무 \(standing.all.lose)패")
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                    }
                }
                .padding(.leading, 8)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(.regularMaterial)
            .cornerRadius(15)
            .shadow(radius: 3, y: 2)
        }
    }
}

// MARK: - Squad Section (리뉴얼)
struct SquadSection: View {
    let squadGroups: [SquadGroup]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("선수단")
                .font(.headline)
                .padding(.horizontal)

            ForEach(squadGroups) { group in
                PositionGroupView(group: group)
            }
        }
        .padding(.vertical)
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }
}

// 포지션 그룹 뷰 (복잡한 표현식 분리)
struct PositionGroupView: View {
    let group: SquadGroup
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(group.position)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(group.players, id: \.player.id) { playerInfo in
                        PlayerRowView(playerInfo: playerInfo)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 5)
            }
        }
    }
}

// 선수 행 뷰 (복잡한 표현식 분리)
struct PlayerRowView: View {
    let playerInfo: PlayerResponse
    
    var body: some View {
        NavigationLink(destination: PlayerProfileView(playerId: playerInfo.player.id ?? 0)) {
            PlayerCardView(player: playerInfo.player)
                .frame(width: 100)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Team History Section (리뉴얼)
struct TeamHistorySection: View {
    let history: [TeamHistory]
    let trophies: [TeamTrophy]?

    // 트로피를 그룹화한 계산 속성
    private var groupedTrophies: [String: [TeamTrophy]] {
        guard let trophies = trophies else { return [:] }
        return Dictionary(grouping: trophies, by: { $0.place })
    }

    // 트로피 순서를 정의한 상수
    private let placeOrder = ["Winner", "Runner-up", "기타"]

    // Chart 데이터를 계산 속성으로 분리
    private var chartData: [(season: String, position: Int)] {
        history.compactMap { seasonData in
            if let position = Int(seasonData.leaguePosition) {
                return (season: String(seasonData.season), position: position)
            }
            return nil
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("역대 성적 및 트로피")
                .font(.headline)
                .padding(.horizontal)

            if let trophies = trophies, !trophies.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("주요 트로피")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)

                    ForEach(placeOrder, id: \.self) { place in
                        if let group = groupedTrophies[place], !group.isEmpty {
                            HStack {
                                Text(trophyGroupTitle(place))
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                Spacer()
                            }
                            .padding(.horizontal)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) {
                                    ForEach(group) { trophy in
                                        TrophyCard(trophy: trophy)
                                    }
                                }
                                .padding(.horizontal)
                                .padding(.bottom, 8)
                            }
                        }
                    }
                }
                Divider().padding(.horizontal)
            }

            if history.isEmpty {
                Text("역대 성적 데이터 로딩 중...")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else {
                Text("시즌별 리그 순위")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)

                // Chart를 별도 뷰로 분리
                HistoryChartView(chartData: chartData)
            }
        }
        .padding(.vertical)
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }

    private func trophyGroupTitle(_ place: String) -> String {
        switch place {
        case "Winner": return "🥇 우승"
        case "Runner-up": return "🥈 준우승"
        default: return "기타"
        }
    }
}

// MARK: - History Chart View
struct HistoryChartView: View {
    let chartData: [(season: String, position: Int)]

    // Chart의 Y축 반전 처리를 위한 최대 순위 계산
    private var maxPosition: Int {
        chartData.map { $0.position }.max() ?? 1
    }

    var body: some View {
        Chart(chartData, id: \.season) { data in
            LineMark(
                x: .value("시즌", data.season),
                y: .value("순위", data.position)
            )
            .foregroundStyle(.blue)
            .symbol(Circle().strokeBorder(lineWidth: 2))
            .interpolationMethod(.catmullRom)
        }
        .chartYAxis {
            AxisMarks(preset: .automatic, position: .leading) { value in
                AxisGridLine()
                AxisTick()
                AxisValueLabel {
                    if let intValue = value.as(Int.self) {
                        Text("\(intValue)위")
                    }
                }
            }
        }
        .chartYScale(domain: [maxPosition, 1]) // Y축 반전
        .frame(height: 150)
        .padding(.horizontal)
        .padding(.top, 8)
    }
}

// MARK: - Trophy Card
struct TrophyCard: View {
    let trophy: TeamTrophy

    private var trophyIcon: String {
        let leagueNameLower = trophy.league.lowercased()
        if leagueNameLower.contains("champions league") {
            return "trophy.circle.fill"
        } else if leagueNameLower.contains("premier league") {
            return "sportscourt.fill"
        } else if leagueNameLower.contains("cup") || leagueNameLower.contains("copa") {
            return "cup.and.saucer.fill"
        }
        return "medal.fill"
    }

    private var trophyColor: Color {
        switch trophy.place {
        case "Winner": return .yellow
        case "Runner-up": return .gray
        default: return .brown
        }
    }

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: trophyIcon)
                .font(.title2)
                .foregroundColor(trophyColor)

            Text(trophy.league)
                .font(.caption)
                .fontWeight(.medium)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(height: 30)

            Text("\(trophy.season) 시즌")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(width: 80)
        .padding(8)
        .background(.thinMaterial)
        .cornerRadius(10)
    }
}

// MARK: - Error View
struct ErrorView: View {
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.red)

            Text(message)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.systemBackground))
        .cornerRadius(15)
        .shadow(radius: 5)
    }
}

// MARK: - Team Info Tab View
struct TeamInfoTabView: View {
    @ObservedObject var viewModel: TeamProfileViewModel
    var showFullSquad: () -> Void // 전체 스쿼드 보기 액션
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 팀 헤더
                TeamHeaderSection(profile: viewModel.teamProfile)
                
                // 다음 예정된 경기
                UpcomingFixtureSection(
                    fixture: viewModel.upcomingFixture,
                    currentTeamId: viewModel.teamId
                )

                if let errorMessage = viewModel.errorMessage {
                    ErrorView(message: errorMessage)
                } else {
                    // 시즌 선택
                    SeasonPickerSection(
                        seasons: viewModel.seasons,
                        selectedSeason: $viewModel.selectedSeason
                    )

                    // 현재 순위
                    if let standing = viewModel.teamStanding {
                        StandingSection(standing: standing)
                    }

                    // 주요 통계
                    if let stats = viewModel.teamStatistics {
                        StatisticsSection(stats: stats)
                    }

                    // 최근 폼 (리뉴얼된 FormSection 사용)
                    FormSection(
                        recentFixtures: viewModel.recentFixtures,
                        currentTeamId: viewModel.teamId
                    )
                    
                    // 주요 선수 (최대 3명)
                    if !viewModel.squadByPosition.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("주요 선수")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            // 주요 선수 선택 로직
                            let topPlayers = selectTopPlayers(from: viewModel.squadByPosition)
                            
                            HStack(spacing: 16) {
                                ForEach(topPlayers, id: \.player.id) { playerInfo in
                                    VStack(spacing: 8) {
                                        // 선수 이미지
                                        AsyncImage(url: URL(string: playerInfo.player.photo ?? "")) { image in
                                            image
                                                .resizable()
                                                .scaledToFill()
                                        } placeholder: {
                                            Image(systemName: "person.fill")
                                                .font(.title)
                                                .foregroundColor(.gray)
                                        }
                                        .frame(width: 70, height: 70)
                                        .clipShape(Circle())
                                        .overlay(
                                            Circle()
                                                .stroke(Color.white, lineWidth: 2)
                                        )
                                        .shadow(radius: 2)
                                        
                                        // 선수 이름
                                        Text(playerInfo.player.name ?? "Unknown")
                                            .font(.caption)
                                            .fontWeight(.medium)
                                            .lineLimit(1)
                                            .multilineTextAlignment(.center)
                                            .frame(width: 80)
                                    }
                                }
                                Spacer()
                            }
                            .padding(.horizontal)
                            
                            // 전체 스쿼드 보기 버튼
                            Button(action: {
                                // 선수단 탭으로 이동
                                showFullSquad()
                            }) {
                                HStack {
                                    Text("전체 스쿼드 보기")
                                        .font(.subheadline)
                                        .foregroundColor(.blue)
                                    
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(.blue)
                                }
                            }
                            .padding(.horizontal)
                            .padding(.top, 8)
                        }
                        .padding(.vertical)
                        .background(.regularMaterial)
                        .cornerRadius(15)
                        .shadow(radius: 3, y: 2)
                    }

                    // 역대 성적
                    if viewModel.isLoadingStats || viewModel.isLoadingTrophies {
                        ProgressView("역대 성적 로딩 중...")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                    } else {
                        // 트로피 정보 표시 (트로피 데이터가 있는 모든 팀)
                        if let trophies = viewModel.trophies,
                           !trophies.isEmpty {
                            TeamTrophyView(trophies: trophies)
                        }
                        
                        // 역대 성적 정보 표시
                        if !viewModel.teamHistory.isEmpty {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("시즌별 리그 순위")
                                    .font(.headline)
                                    .padding(.horizontal)
                                
                                // 역대 성적 차트
                                HistoryChartView(chartData: viewModel.teamHistory.compactMap { seasonData in
                                    if let position = Int(seasonData.leaguePosition) {
                                        return (season: String(seasonData.season), position: position)
                                    }
                                    return nil
                                })
                            }
                            .padding(.vertical)
                            .background(.regularMaterial)
                            .cornerRadius(15)
                            .shadow(radius: 3, y: 2)
                        }
                    }

                    // 자주 사용하는 포메이션
                    if let lineups = viewModel.teamStatistics?.lineups {
                        FormationSection(lineups: lineups)
                    }

                    // 경기장 정보
                    if let venue = viewModel.teamProfile?.venue {
                        VenueSection(venue: venue)
                    }
                }
            }
            .padding()
        }
    }
    
    // 주요 선수 선택 함수
    private func selectTopPlayers(from squadGroups: [SquadGroup]) -> [PlayerResponse] {
        var result: [PlayerResponse] = []
        
        // 1. 주장이 있으면 먼저 추가
        let captains = squadGroups.flatMap { $0.players }.filter { player in
            if let stats = player.statistics.first?.games {
                return stats.captain == true
            }
            return false
        }
        
        if let captain = captains.first {
            result.append(captain)
        }
        
        // 2. 포지션별로 중요한 선수 선택 (골키퍼, 수비수, 미드필더, 공격수 순)
        let positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker", "골키퍼", "수비수", "미드필더", "공격수"]
        
        for position in positionOrder {
            // 이미 선택된 포지션은 건너뛰기
            if result.count >= 3 {
                break
            }
            
            // 해당 포지션의 선수 그룹 찾기
            if let group = squadGroups.first(where: { $0.position == position }) {
                // 이미 선택된 선수는 제외
                let availablePlayers = group.players.filter { player in
                    !result.contains(where: { $0.player.id == player.player.id })
                }
                
                if let bestPlayer = findBestPlayer(in: availablePlayers) {
                    result.append(bestPlayer)
                }
            }
        }
        
        // 3. 아직 3명이 안 되면 남은 선수 중에서 추가
        if result.count < 3 {
            let remainingPlayers = squadGroups.flatMap { $0.players }.filter { player in
                !result.contains(where: { $0.player.id == player.player.id })
            }
            
            let sortedPlayers = remainingPlayers.sorted { (a, b) -> Bool in
                let aStats = a.statistics.first?.games
                let bStats = b.statistics.first?.games
                
                // 출전 횟수로 비교
                let aAppearances = aStats?.appearences ?? 0
                let bAppearances = bStats?.appearences ?? 0
                
                return aAppearances > bAppearances
            }
            
            result.append(contentsOf: sortedPlayers.prefix(3 - result.count))
        }
        
        return Array(result.prefix(3))
    }
    
    // 특정 포지션에서 가장 중요한 선수 찾기
    private func findBestPlayer(in players: [PlayerResponse]) -> PlayerResponse? {
        guard !players.isEmpty else { return nil }
        
        return players.sorted { (a, b) -> Bool in
            let aStats = a.statistics.first
            let bStats = b.statistics.first
            
            // 1. 주장 여부
            if let aCaptain = aStats?.games?.captain, let bCaptain = bStats?.games?.captain {
                if aCaptain != bCaptain {
                    return aCaptain
                }
            }
            
            // 2. 출전 횟수
            let aAppearances = aStats?.games?.appearences ?? 0
            let bAppearances = bStats?.games?.appearences ?? 0
            if aAppearances != bAppearances {
                return aAppearances > bAppearances
            }
            
            // 3. 선발 출전 횟수
            let aLineups = aStats?.games?.lineups ?? 0
            let bLineups = bStats?.games?.lineups ?? 0
            if aLineups != bLineups {
                return aLineups > bLineups
            }
            
            // 4. 득점 수
            let aGoals = aStats?.goals?.total ?? 0
            let bGoals = bStats?.goals?.total ?? 0
            if aGoals != bGoals {
                return aGoals > bGoals
            }
            
            // 5. 어시스트 수
            let aAssists = aStats?.goals?.assists ?? 0
            let bAssists = bStats?.goals?.assists ?? 0
            return aAssists > bAssists
        }.first
    }
}

// MARK: - Team Squad Tab View
struct TeamSquadTabView: View {
    @ObservedObject var viewModel: TeamProfileViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 팀 헤더 (간소화된 버전)
                if let team = viewModel.teamProfile?.team {
                    HStack(spacing: 16) {
                        // 팀 로고
                        AsyncImage(url: URL(string: team.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(width: 60, height: 60)
                        .clipShape(Circle())
                        .shadow(radius: 2)
                        
                        // 팀 이름
                        Text(team.name)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Spacer()
                    }
                    .padding()
                    .background(.regularMaterial)
                    .cornerRadius(15)
                    .shadow(radius: 2)
                }
                
                if viewModel.isLoadingProfile {
                    ProgressView("선수단 정보 로딩 중...")
                        .frame(maxWidth: .infinity)
                        .padding()
                } else if viewModel.squadByPosition.isEmpty {
                    Text("선수단 정보가 없습니다.")
                        .font(.headline)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else {
                    // 선수단 정보 (향상된 디자인)
                    VStack(alignment: .leading, spacing: 20) {
                        Text("선수단")
                            .font(.title)
                            .fontWeight(.bold)
                            .padding(.horizontal)
                        
                        ForEach(viewModel.squadByPosition.sorted(by: { sortPositions($0.position, $1.position) })) { group in
                            VStack(alignment: .leading, spacing: 12) {
                                // 포지션 헤더
                                HStack {
                                    Text(group.position)
                                        .font(.headline)
                                        .fontWeight(.semibold)
                                        .padding(.vertical, 8)
                                        .padding(.horizontal, 16)
                                        .background(positionColor(for: group.position).opacity(0.2))
                                        .cornerRadius(20)
                                    
                                    Spacer()
                                    
                                    Text("\(group.players.count)명")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.horizontal)
                                
                                // 선수 목록 (목록형)
                                VStack(spacing: 8) {
                                    ForEach(sortPlayersByNumber(group.players), id: \.player.id) { playerInfo in
                                        EnhancedPlayerCardView(playerInfo: playerInfo)
                                    }
                                }
                                .padding(.horizontal)
                            }
                            .padding(.vertical)
                            .background(.regularMaterial)
                            .cornerRadius(15)
                            .shadow(radius: 2)
                        }
                    }
                }
            }
            .padding()
        }
    }
    
    // 포지션에 따른 색상 반환
    private func positionColor(for position: String) -> Color {
        switch position {
        case "Goalkeeper", "골키퍼":
            return .yellow
        case "Defender", "수비수":
            return .blue
        case "Midfielder", "미드필더":
            return .green
        case "Attacker", "공격수":
            return .red
        default:
            return .gray
        }
    }
    
    // 선수를 등번호 순으로 정렬하는 함수
    private func sortPlayersByNumber(_ players: [PlayerResponse]) -> [PlayerResponse] {
        // 디버깅을 위해 정렬 전 선수 목록 출력
        print("정렬 전 선수 목록:")
        for player in players {
            let number = player.statistics.first?.games?.number ?? 0
            print("\(player.player.name ?? "Unknown"): \(number)")
        }
        
        let sortedPlayers = players.sorted { player1, player2 in
            // 등번호 가져오기 (옵셔널 체이닝 확인)
            let number1 = player1.statistics.first?.games?.number ?? 999
            let number2 = player2.statistics.first?.games?.number ?? 999
            
            // 등번호로 정렬 (0이나 nil은 가장 뒤로)
            if number1 == 0 || number1 == 999 {
                if number2 == 0 || number2 == 999 {
                    // 둘 다 등번호가 없으면 이름 순으로 정렬
                    return (player1.player.name ?? "") < (player2.player.name ?? "")
                }
                return false // player1은 등번호가 없고 player2는 있으면 player2가 앞으로
            } else if number2 == 0 || number2 == 999 {
                return true // player1은 등번호가 있고 player2는 없으면 player1이 앞으로
            }
            
            // 둘 다 등번호가 있으면 등번호 순으로 정렬
            return number1 < number2
        }
        
        // 디버깅을 위해 정렬 후 선수 목록 출력
        print("정렬 후 선수 목록:")
        for player in sortedPlayers {
            let number = player.statistics.first?.games?.number ?? 0
            print("\(player.player.name ?? "Unknown"): \(number)")
        }
        
        return sortedPlayers
    }
    
    // 포지션 정렬 함수
    private func sortPositions(_ position1: String, _ position2: String) -> Bool {
        let positionOrder = ["Goalkeeper", "골키퍼", "Defender", "수비수", "Midfielder", "미드필더", "Attacker", "공격수"]
        
        let index1 = positionOrder.firstIndex(of: position1) ?? positionOrder.count
        let index2 = positionOrder.firstIndex(of: position2) ?? positionOrder.count
        
        return index1 < index2
    }
}

// 컴팩트한 선수 카드 뷰 (목록형)
struct EnhancedPlayerCardView: View {
    let playerInfo: PlayerResponse
    
    var body: some View {
        NavigationLink(destination: PlayerProfileView(playerId: playerInfo.player.id ?? 0)) {
            HStack(spacing: 12) {
                // 선수 이미지와 등번호
                ZStack(alignment: .bottomTrailing) {
                    // 배경 원
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 50, height: 50)
                    
                    // 선수 번호 또는 이니셜
                    if !playerInfo.statistics.isEmpty,
                       let number = playerInfo.statistics.first?.games?.number,
                       number > 0 {
                        Text("\(number)")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.blue)
                    } else {
                        // 번호가 없는 경우 이니셜 표시
                        Text(getInitials(playerInfo.player.name ?? ""))
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.blue)
                    }
                    
                    // 사진이 있으면 사진 표시 (번호 위에 덮어씌움)
                    if let photoUrl = playerInfo.player.photo, !photoUrl.isEmpty {
                        CachedImageView(
                            url: URL(string: photoUrl),
                            placeholder: Image(systemName: "person.fill"),
                            failureImage: Image(systemName: "person.fill"),
                            contentMode: .fill
                        )
                        .frame(width: 50, height: 50)
                        .clipShape(Circle())
                    }
                    
                    // 등번호 (작은 배지로 표시)
                    if !playerInfo.statistics.isEmpty,
                       let number = playerInfo.statistics.first?.games?.number,
                       number > 0 {
                        Text("\(number)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .frame(width: 18, height: 18)
                            .background(Color.blue)
                            .clipShape(Circle())
                    }
                }
                
                // 선수 정보
                VStack(alignment: .leading, spacing: 2) {
                    Text(playerInfo.player.name ?? "Unknown")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(1)
                    
                    HStack(spacing: 4) {
                        // 나이와 국적을 함께 표시
                        Text("\(playerInfo.player.age ?? 0)세 • \(playerInfo.player.nationality ?? "Unknown")")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        // 주장 표시
                        if let isCaptain = playerInfo.statistics.first?.games?.captain, isCaptain {
                            Text("• 주장")
                                .font(.caption)
                                .foregroundColor(.blue)
                                .fontWeight(.semibold)
                        }
                    }
                }
                
                
                Spacer()
                
                // 화살표 아이콘
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(Color(.systemBackground))
            .cornerRadius(10)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    // 이름에서 이니셜을 추출하는 함수
    func getInitials(_ name: String) -> String {
        let words = name.components(separatedBy: " ")
        let initials = words.compactMap { $0.first }.prefix(2)
        return String(initials)
    }
}


