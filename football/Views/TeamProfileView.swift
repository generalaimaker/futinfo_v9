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
            TeamInfoTabView(showFullSquad: { selectedTab = 1 })
                .tabItem {
                    Label("팀 정보", systemImage: "shield.fill")
                }
                .tag(0)
            
            // 두 번째 탭: 선수단
            TeamSquadTabView()
                .tabItem {
                    Label("선수단", systemImage: "person.3.fill")
                }
                .tag(1)
        }
        .environmentObject(viewModel)
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
            // 데이터가 로드되지 않은 경우에만 로드
            if viewModel.teamProfile == nil {
                print("🔄 TeamProfileView: 팀 데이터 로드 시작")
                
                // 리그 ID가 없는 경우 (검색에서 접근한 경우)
                if viewModel.selectedLeagueId == nil {
                    print("🔄 TeamProfileView: 리그 ID 없음, 자동 탐색 시작")
                    
                    // 팀의 기본 리그 ID 찾기 및 데이터 로드
                    do {
                        // 팀의 현재 시즌 경기 가져오기 (forceRefresh: true로 설정하여 캐시를 무시하고 최신 데이터 가져오기)
                        let fixtures = try await viewModel.service.getTeamFixtures(
                            teamId: viewModel.teamId,
                            season: viewModel.selectedSeason,
                            forceRefresh: true
                        )
                        print("📊 팀 경기 데이터 로드 성공: \(fixtures.count)개 경기")
                        
                        // 주요 리그 ID 목록 (우선순위 순)
                        let majorLeagueIds = [
                            39,   // 프리미어 리그 (영국)
                            140,  // 라리가 (스페인)
                            135,  // 세리에 A (이탈리아)
                            78,   // 분데스리가 (독일)
                            61,   // 리그 앙 (프랑스)
                            2,    // UEFA 챔피언스 리그
                            3     // UEFA 유로파 리그
                        ]
                        
                        // 팀이 참가하는 모든 리그 ID 수집 및 카운트
                        var leagueCounts: [Int: (count: Int, name: String)] = [:]
                        for fixture in fixtures {
                            let leagueId = fixture.league.id
                            if let existing = leagueCounts[leagueId] {
                                leagueCounts[leagueId] = (existing.count + 1, fixture.league.name)
                            } else {
                                leagueCounts[leagueId] = (1, fixture.league.name)
                            }
                        }
                        
                        // 리그 선택 로직
                        var selectedId: Int? = nil
                        
                        // 가장 많은 경기를 가진 주요 리그 찾기
                        for leagueId in majorLeagueIds {
                            if let info = leagueCounts[leagueId], info.count > 0 {
                                selectedId = leagueId
                                print("✅ 주요 리그 발견: ID \(leagueId), 이름: \(info.name), 경기 수: \(info.count)")
                                break
                            }
                        }
                        
                        // 주요 리그가 없으면 가장 많은 경기를 가진 리그 선택
                        if selectedId == nil {
                            let sortedLeagues = leagueCounts.sorted { $0.value.count > $1.value.count }
                            if let firstLeague = sortedLeagues.first {
                                selectedId = firstLeague.key
                                print("⚠️ 주요 리그 없음, 가장 많은 경기 리그 선택: ID \(firstLeague.key), 이름: \(firstLeague.value.name), 경기 수: \(firstLeague.value.count)")
                            }
                        }
                        
                        // 선택된 리그 ID로 데이터 로드
                        if let leagueId = selectedId {
                            print("✅ 팀의 기본 리그 ID 찾기 성공: 리그 ID \(leagueId)")
                            viewModel.selectedLeagueId = leagueId
                        } else {
                            print("❌ 팀의 리그를 찾을 수 없음")
                            
                            // 기본 리그 ID 사용 (프리미어 리그)
                            let defaultLeagueId = 39
                            print("⚠️ 기본 리그 ID 사용: \(defaultLeagueId) (프리미어 리그)")
                            viewModel.selectedLeagueId = defaultLeagueId
                        }
                    } catch {
                        print("❌ 팀의 기본 리그 ID 찾기 실패: \(error.localizedDescription)")
                        
                        // 에러 발생 시 기본 리그 ID 사용 (프리미어 리그)
                        let defaultLeagueId = 39
                        print("⚠️ 기본 리그 ID 사용: \(defaultLeagueId) (프리미어 리그)")
                        viewModel.selectedLeagueId = defaultLeagueId
                    }
                }
                
                // 모든 데이터 로드 (ViewModel의 loadAllData 메서드 호출)
                // 이 메서드는 리그 ID가 있는 경우와 없는 경우 모두 처리
                for _ in 1...3 { // 최대 3번 재시도
                    await viewModel.loadAllData()
                    break // 성공하면 반복문 종료
                }
                
                print("✅ TeamProfileView: 팀 데이터 로드 완료")
            }
        }
    }
}

// MARK: - Team Header Section (완전 개선)
struct TeamHeaderSection: View {
    @EnvironmentObject var viewModel: TeamProfileViewModel

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
                    Text(viewModel.teamProfile?.team.name ?? "팀 이름")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    // 팀 정보
                    HStack(spacing: 10) {
                        Text(viewModel.teamProfile?.team.country ?? "국가")
                        if let founded = viewModel.teamProfile?.team.founded {
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
            
            // 팀 로고 (Kingfisher 캐싱 사용)
            if let logoUrl = viewModel.teamProfile?.team.logo {
                TeamLogoView(logoUrl: logoUrl, size: 110)
                    .padding(8)
            } else {
                Image(systemName: "shield.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.gray)
                    .frame(width: 110, height: 110)
            }
        }
    }
}

// MARK: - Statistics Section
struct StatisticsSection: View {
    @EnvironmentObject var viewModel: TeamProfileViewModel

    var body: some View {
        if let stats = viewModel.teamStatistics {
            VStack(spacing: 16) {
                let league = stats.league
                HStack(spacing: 12) {
                    // 리그 로고 (Kingfisher 캐싱 사용)
                    LeagueLogoView(logoUrl: league.logo, size: 40)
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
                    
                    // 리그 국기 (Kingfisher 캐싱 사용)
                    if let flag = league.flag, !flag.isEmpty {
                        CachedImageView(
                            url: URL(string: flag),
                            placeholder: Image(systemName: "flag"),
                            failureImage: Image(systemName: "flag"),
                            contentMode: .fit
                        )
                        .frame(width: 30, height: 20)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                    } else {
                        Image(systemName: "flag")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .foregroundColor(.gray.opacity(0.3))
                            .frame(width: 30, height: 20)
                    }
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
    @EnvironmentObject var viewModel: TeamProfileViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("홈 구장")
                .font(.headline)
                .padding(.horizontal)

            if let venue = viewModel.teamProfile?.venue {
                if let imageUrl = venue.image {
                    // 경기장 이미지 (Kingfisher 캐싱 사용)
                    CachedImageView(
                        url: URL(string: imageUrl),
                        placeholder: Image(systemName: "sportscourt.fill"),
                        failureImage: Image(systemName: "sportscourt.fill"),
                        contentMode: .fill
                    )
                    .frame(height: 200)
                    .clipped()
                    .cornerRadius(10)
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
                            TeamInfoItem(icon: "person.3.fill", label: "수용 인원", value: "\(capacity.formatted())명", color: .blue)
                        }
                        if let surface = venue.surface {
                            TeamInfoItem(icon: "leaf.fill", label: "구장 표면", value: surface, color: .green)
                        }
                        Spacer()
                    }

                    if let address = venue.address {
                        TeamInfoItem(icon: "mappin.circle.fill", label: "주소", value: address, color: .red)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(radius: 3, y: 2)
    }
}

// 경기장 정보 항목을 위한 Helper View
struct TeamInfoItem: View {
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
            // 상대팀 로고 (Kingfisher 캐싱 사용)
            TeamLogoView(logoUrl: opponent.logo, size: 30)
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
    @EnvironmentObject var viewModel: TeamProfileViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("최근 5경기")
                .font(.headline)
                .padding(.horizontal)

            // 안전하게 접근
            if let fixtures = viewModel.recentFixtures, !fixtures.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        // 시간순으로 정렬 (과거 -> 최근)
                        // 최근 5경기만 표시하고, 완료된 경기만 표시
                        let completedFixtures = fixtures
                            .filter { $0.fixture.status.short == "FT" || $0.fixture.status.short == "AET" || $0.fixture.status.short == "PEN" }
                            .sorted(by: { $0.fixture.date > $1.fixture.date })
                            .prefix(5)
                        
                        if completedFixtures.isEmpty {
                            Text("최근 완료된 경기가 없습니다")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding()
                        } else {
                            ForEach(Array(completedFixtures.reversed()), id: \.fixture.id) { fixture in
                                RecentMatchCard(fixture: fixture, currentTeamId: viewModel.teamId)
                            }
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
    @EnvironmentObject var viewModel: TeamProfileViewModel
    @State private var showFullStandings = false

    var body: some View {
        standingContent
    }
    
    @ViewBuilder
    private var standingContent: some View {
        // 로딩 중인 경우 로딩 표시
        if viewModel.isLoadingStandings {
            VStack(alignment: .leading, spacing: 12) {
                Text("현재 순위")
                    .font(.headline)
                    .padding(.horizontal)
                
                ProgressView("순위 정보 로딩 중...")
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .background(.regularMaterial)
                    .cornerRadius(15)
                    .shadow(radius: 3, y: 2)
            }
        }
        // 팀 순위 정보가 있거나 리그 순위 정보가 있는 경우 표시
        else if viewModel.teamStanding != nil || (viewModel.leagueStandings != nil && !viewModel.leagueStandings!.isEmpty) {
            standingView()
        }
        // 로딩이 완료되었지만 데이터가 없는 경우 메시지 표시
        else {
            VStack(alignment: .leading, spacing: 12) {
                Text("현재 순위")
                    .font(.headline)
                    .padding(.horizontal)
                
                Text("순위 정보를 불러올 수 없습니다.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .background(.regularMaterial)
                    .cornerRadius(15)
                    .shadow(radius: 3, y: 2)
            }
        }
    }
    
    private func standingView() -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("현재 순위")
                .font(.headline)
                .padding(.horizontal)

            // 테이블 형식의 순위 표시
            VStack(spacing: 0) {
                // 테이블 헤더
                tableHeader
                
                // 팀 순위 표시 (3개 팀)
                if viewModel.isLoadingStandings {
                    ProgressView("순위 정보 로딩 중...")
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else if let standings = viewModel.leagueStandings, standings.isEmpty {
                    Text("순위 정보를 불러올 수 없습니다.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else {
                    standingTeamsList
                }
                
                // 전체 순위 보기 버튼 (리그 순위가 있는 경우에만 표시)
                if let standings = viewModel.leagueStandings, !standings.isEmpty {
                    fullStandingsButton
                }
            }
            .background(.regularMaterial)
            .cornerRadius(15)
            .shadow(radius: 3, y: 2)
        }
        .sheet(isPresented: $showFullStandings) {
            standingsSheet
        }
    }
    
    private var tableHeader: some View {
        HStack {
            Text("순위")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 40, alignment: .center)
            
            Text("팀")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            Text("경기")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 40, alignment: .center)
            
            Text("승점")
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 40, alignment: .center)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color.gray.opacity(0.1))
    }
    
    private var standingTeamsList: some View {
        let nearbyTeams = viewModel.getNearbyTeams()
        let currentTeamId = viewModel.teamId
        
        return ForEach(nearbyTeams, id: \.rank) { teamStanding in
            StandingTeamRow(
                teamStanding: teamStanding,
                isCurrentTeam: teamStanding.team.id == currentTeamId
            )
        }
    }
    
    private var fullStandingsButton: some View {
        Button(action: {
            showFullStandings = true
        }) {
            HStack {
                Text("전체 순위 보기")
                    .font(.subheadline)
                    .foregroundColor(.blue)
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 12)
        }
        .background(Color.gray.opacity(0.05))
        .cornerRadius(8)
    }
    
    private var standingsSheet: some View {
        NavigationView {
            if viewModel.leagueStandings?.isEmpty != false {
                Text("순위 정보를 불러오는 중입니다...")
                    .navigationTitle("리그 순위")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("닫기") {
                                showFullStandings = false
                            }
                        }
                    }
            } else {
                FullStandingsView(
                    standings: viewModel.leagueStandings != nil ? viewModel.leagueStandings! : [],
                    teamId: viewModel.teamId
                )
                    .navigationTitle("리그 순위")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("닫기") {
                                showFullStandings = false
                            }
                        }
                    }
            }
        }
    }
    
    
}

// 전체 순위 보기 뷰
struct FullStandingsView: View {
    let standings: [Standing]
    let teamId: Int
    
    var body: some View {
        List {
            ForEach(standings, id: \.rank) { standing in
                HStack {
                    Text("\(standing.rank)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .frame(width: 30)
                    
                    HStack(spacing: 8) {
                        // 팀 로고 (Kingfisher 캐싱 사용)
                        TeamLogoView(logoUrl: standing.team.logo, size: 30)
                        
                        Text(standing.team.name)
                            .font(.subheadline)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Text("\(standing.all.played)")
                        .font(.subheadline)
                        .frame(width: 30)
                    
                    Text("\(standing.all.win)")
                        .font(.subheadline)
                        .frame(width: 30)
                    
                    Text("\(standing.all.draw)")
                        .font(.subheadline)
                        .frame(width: 30)
                    
                    Text("\(standing.all.lose)")
                        .font(.subheadline)
                        .frame(width: 30)
                    
                    Text("\(standing.points)")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .frame(width: 30)
                }
                .padding(.vertical, 4)
                .listRowBackground(
                    standing.team.id == teamId ?
                    Color.blue.opacity(0.1) : Color.clear
                )
            }
        }
        .listStyle(PlainListStyle())
    }
}


// MARK: - Squad Section (리뉴얼)
struct SquadSection: View {
    @EnvironmentObject var viewModel: TeamProfileViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("선수단")
                .font(.headline)
                .padding(.horizontal)

            ForEach(viewModel.squadByPosition) { group in
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
        Button(action: {
            // 알림을 통해 PlayerProfileView로 이동
            NotificationCenter.default.post(
                name: NSNotification.Name("ShowPlayerProfile"),
                object: nil,
                userInfo: ["playerId": playerInfo.player.id ?? 0]
            )
        }) {
            PlayerCardView(player: playerInfo.player, onPlayerTap: { playerId in
                // 알림을 통해 PlayerProfileView로 이동
                NotificationCenter.default.post(
                    name: NSNotification.Name("ShowPlayerProfile"),
                    object: nil,
                    userInfo: ["playerId": playerId]
                )
            })
            .frame(width: 100)
        }
        .buttonStyle(PlainButtonStyle())
    }
}


// MARK: - History Chart View
struct HistoryChartView: View {
    let chartData: [(season: String, position: Int)]

    // Chart의 Y축 반전 처리를 위한 최대 순위 계산
    private var maxPosition: Int {
        chartData.map { $0.position }.max() ?? 1
    }
    
    // 시즌 데이터를 시간순으로 정렬 (과거 -> 최근)
    private var sortedChartData: [(season: String, position: Int)] {
        chartData.sorted { Int($0.season) ?? 0 < Int($1.season) ?? 0 }
    }

    var body: some View {
        Chart(sortedChartData, id: \.season) { data in
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
        .chartXAxis {
            AxisMarks { value in
                AxisValueLabel {
                    if let season = value.as(String.self) {
                        Text(season)
                            .font(.caption)
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
    @EnvironmentObject var viewModel: TeamProfileViewModel // @EnvironmentObject로 변경
    var showFullSquad: () -> Void // 전체 스쿼드 보기 액션
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 팀 헤더
                TeamHeaderSection()
                
                // 다음 예정된 경기
                if viewModel.recentFixtures != nil && !viewModel.recentFixtures!.isEmpty {
                    UpcomingFixtureSection()
                        .environmentObject(viewModel)
                } else {
                    Text("예정된 경기 정보를 불러오는 중...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                        .background(Color(.systemGroupedBackground))
                        .cornerRadius(15)
                        .shadow(radius: 3, y: 2)
                }
                
                if let errorMessage = viewModel.errorMessage {
                    ErrorView(message: errorMessage)
                } else {
                    // 현재 순위
                    StandingSection()
                    
                    // 최근 폼 (리뉴얼된 FormSection 사용)
                    FormSection()
                    
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
                                        // 선수 이미지 (Kingfisher 캐싱 사용)
                                        CachedImageView(
                                            url: URL(string: playerInfo.player.photo ?? ""),
                                            placeholder: Image(systemName: "person.fill"),
                                            failureImage: Image(systemName: "person.fill"),
                                            contentMode: .fill
                                        )
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
                    if viewModel.isLoadingStats {
                        ProgressView("역대 성적 로딩 중...")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                    } else {
                        // 트로피 정보 표시
                        if viewModel.isLoadingTrophies {
                            // 트로피 로딩 중 표시
                            VStack(spacing: 12) {
                                Text("트로피")
                                    .font(.headline)
                                    .padding(.horizontal)
                                
                                ProgressView("트로피 정보 로딩 중...")
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .padding()
                            }
                            .padding(.vertical)
                            .background(.regularMaterial)
                            .cornerRadius(15)
                            .shadow(radius: 3, y: 2)
                        } else {
                            // 트로피 정보 표시 (트로피 데이터가 있는 팀만 표시)
                            let trophies = viewModel.trophies ?? []
                            if !trophies.isEmpty {
                                TeamTrophyView(trophies: trophies)
                            }
                            // 트로피 데이터가 없는 경우 아무것도 표시하지 않음
                        }
                        
                        // 역대 성적 정보 표시
                        if !viewModel.teamHistory.isEmpty {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("시즌별 리그 순위")
                                    .font(.headline)
                                    .padding(.horizontal)
                                
                                // 역대 성적 차트 (최대 5개 시즌만 표시)
                                HistoryChartView(chartData: viewModel.teamHistory.prefix(5).compactMap { seasonData in
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
                    VenueSection()
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
    @EnvironmentObject var viewModel: TeamProfileViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 팀 헤더 (간소화된 버전)
                if let team = viewModel.teamProfile?.team {
                    HStack(spacing: 16) {
                        // 팀 로고 (Kingfisher 캐싱 사용)
                        TeamLogoView(logoUrl: team.logo, size: 60)
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
        Button(action: {
            // 알림을 통해 PlayerProfileView로 이동
            NotificationCenter.default.post(
                name: NSNotification.Name("ShowPlayerProfile"),
                object: nil,
                userInfo: ["playerId": playerInfo.player.id ?? 0]
            )
        }) {
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



// MARK: - Standing Team Row
struct StandingTeamRow: View {
    let teamStanding: Standing
    let isCurrentTeam: Bool
    
    var body: some View {
        HStack {
            Text("\(teamStanding.rank)")
                .font(.subheadline)
                .fontWeight(.medium)
                .frame(width: 40, alignment: .center)
            
            HStack(spacing: 8) {
                // 팀 로고 (Kingfisher 캐싱 사용)
                TeamLogoView(logoUrl: teamStanding.team.logo, size: 24)
                
                Text(teamStanding.team.name)
                    .font(.subheadline)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            Text("\(teamStanding.all.played)")
                .font(.subheadline)
                .frame(width: 40, alignment: .center)
            
            Text("\(teamStanding.points)")
                .font(.subheadline)
                .fontWeight(.semibold)
                .frame(width: 40, alignment: .center)
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
        .background(
            isCurrentTeam ?
            Color.blue.opacity(0.1) : Color.clear
        )
        .cornerRadius(4)
    }
}
