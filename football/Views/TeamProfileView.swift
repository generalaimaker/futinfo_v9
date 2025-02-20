import SwiftUI

// MARK: - Components
import Foundation

struct TeamProfileView: View {
    @StateObject private var viewModel: TeamProfileViewModel
    @Environment(\.dismiss) private var dismiss
    
    init(teamId: Int, leagueId: Int? = nil) {
        _viewModel = StateObject(wrappedValue: TeamProfileViewModel(teamId: teamId, leagueId: leagueId))
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 팀 헤더
                TeamHeaderSection(profile: viewModel.teamProfile)
                
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
                        StatisticsSection(stats: stats, viewModel: viewModel)
                    }
                    
                    // 최근 폼
                    if let form = viewModel.teamStatistics?.form {
                        FormSection(form: form)
                    }
                    
                    // 선수단
                    SquadSection(squadGroups: viewModel.squadByPosition)
                    
                    // 역대 성적
                    if viewModel.isLoadingStats {
                        ProgressView("역대 성적 로딩 중...")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                    } else {
                        TeamHistorySection(history: viewModel.teamHistory)
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
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if viewModel.isLoadingProfile || viewModel.isLoadingStats {
                    ProgressView()
                }
            }
        }
    }
}

// MARK: - Team Header Section
struct TeamHeaderSection: View {
    let profile: TeamProfile?
    
    var body: some View {
        VStack(spacing: 16) {
            if let profile = profile {
                AsyncImage(url: URL(string: profile.team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 120, height: 120)
                
                VStack(spacing: 8) {
                    Text(profile.team.name)
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text(profile.team.country ?? "")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    if let founded = profile.team.founded {
                        Text("창단: \(founded)년")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
            } else {
                ProgressView()
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(15)
        .shadow(radius: 5)
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
    let viewModel: TeamProfileViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // 리그 정보
            let league = stats.league
                HStack(spacing: 12) {
                    AsyncImage(url: URL(string: league.logo)) { image in
                        image.resizable().scaledToFit()
                    } placeholder: {
                        Color.gray.opacity(0.3)
                    }
                    .frame(width: 30, height: 30)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(league.name)
                            .font(.headline)
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
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
            
            // 경기 통계
            if let fixtures = stats.fixtures {
                VStack(alignment: .leading, spacing: 12) {
                    Text("경기 기록")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    HStack(spacing: 20) {
                        StatBox(title: "승", value: "\(fixtures.wins.total)", color: .green)
                        StatBox(title: "무", value: "\(fixtures.draws.total)", color: .orange)
                        StatBox(title: "패", value: "\(fixtures.loses.total)", color: .red)
                    }
                    .padding(.horizontal)
                    
                    Divider()
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("홈")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            StatRow(title: "승", value: "\(fixtures.wins.home)")
                            StatRow(title: "무", value: "\(fixtures.draws.home)")
                            StatRow(title: "패", value: "\(fixtures.loses.home)")
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("원정")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            StatRow(title: "승", value: "\(fixtures.wins.away)")
                            StatRow(title: "무", value: "\(fixtures.draws.away)")
                            StatRow(title: "패", value: "\(fixtures.loses.away)")
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
            
            // 득실점 통계
            if let goals = stats.goals {
                VStack(alignment: .leading, spacing: 12) {
                    Text("득실점")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    VStack(spacing: 16) {
                        HStack {
                            StatBox(
                                title: "득점",
                                value: "\(goals.for.total.total)",
                                subvalue: "평균 \(goals.for.average.total)",
                                color: .blue
                            )
                            StatBox(
                                title: "실점",
                                value: "\(goals.against.total.total)",
                                subvalue: "평균 \(goals.against.average.total)",
                                color: .red
                            )
                        }
                        
                        HStack {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("홈")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                StatRow(title: "득점", value: "\(goals.for.total.home)")
                                StatRow(title: "실점", value: "\(goals.against.total.home)")
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("원정")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                StatRow(title: "득점", value: "\(goals.for.total.away)")
                                StatRow(title: "실점", value: "\(goals.against.total.away)")
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
            
            // 페널티 통계
            if let penalty = stats.penalty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("페널티")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    HStack {
                        StatBox(
                            title: "성공",
                            value: "\(penalty.scored.total)",
                            subvalue: penalty.scored.percentage,
                            color: .green
                        )
                        StatBox(
                            title: "실패",
                            value: "\(penalty.missed.total)",
                            subvalue: penalty.missed.percentage,
                            color: .red
                        )
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
        }
    }


struct StatBox: View {
    let title: String
    let value: String
    var subvalue: String? = nil
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            if let subvalue = subvalue {
                Text(subvalue)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Venue Section
struct VenueSection: View {
    let venue: VenueInfo
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("홈 구장")
                .font(.headline)
                .padding(.horizontal)
            
            if let image = venue.image {
                AsyncImage(url: URL(string: image)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 200)
                        .clipped()
                } placeholder: {
                    Color.gray.opacity(0.3)
                        .frame(height: 200)
                }
            }
            
            VStack(alignment: .leading, spacing: 16) {
                if let name = venue.name {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(name)
                            .font(.title3)
                            .fontWeight(.bold)
                        if let city = venue.city {
                            Text(city)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                HStack(spacing: 24) {
                    if let capacity = venue.capacity {
                        VStack(alignment: .leading, spacing: 4) {
                            Label {
                                Text("수용 인원")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            } icon: {
                                Image(systemName: "person.3.fill")
                                    .foregroundColor(.blue)
                            }
                            Text("\(capacity.formatted())명")
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                    }
                    
                    if let surface = venue.surface {
                        VStack(alignment: .leading, spacing: 4) {
                            Label {
                                Text("구장 표면")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            } icon: {
                                Image(systemName: "leaf.fill")
                                    .foregroundColor(.green)
                            }
                            Text(surface)
                                .font(.subheadline)
                                .fontWeight(.medium)
                        }
                    }
                }
                
                if let address = venue.address {
                    VStack(alignment: .leading, spacing: 4) {
                        Label {
                            Text("주소")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        } icon: {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(.red)
                        }
                        Text(address)
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
}

// MARK: - Form Section
struct FormSection: View {
    let form: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("최근 경기")
                .font(.headline)
                .padding(.horizontal)
            
            if form.isEmpty {
                Text("데이터 없음")
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
            } else {
                VStack(spacing: 12) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(0..<form.count, id: \.self) { index in
                                let char = form[form.index(form.startIndex, offsetBy: index)]
                                FormIndicator(result: String(char))
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    HStack(spacing: 16) {
                        FormLegend(text: "승", color: .blue)
                        FormLegend(text: "무", color: .gray)
                        FormLegend(text: "패", color: .red)
                    }
                    .padding(.horizontal)
                }
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
}

struct FormLegend: View {
    let text: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(text)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Formation Section
struct FormationSection: View {
    let lineups: [LineupStats]
    
    private var sortedLineups: [LineupStats] {
        lineups.sorted { $0.played > $1.played }
    }
    
    private var totalGames: Int {
        sortedLineups.reduce(0) { $0 + $1.played }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("자주 사용하는 포메이션")
                .font(.headline)
                .padding(.horizontal)
            
            VStack(spacing: 16) {
                ForEach(sortedLineups.prefix(3), id: \.formation) { lineup in
                    HStack {
                        Text(lineup.formation)
                            .font(.system(.body, design: .monospaced))
                            .fontWeight(.medium)
                        
                        Spacer()
                        
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("\(lineup.played)회")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            Text("\(Int(Double(lineup.played) / Double(totalGames) * 100))%")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal)
                    
                    if lineup.formation != sortedLineups.prefix(3).last?.formation {
                        Divider()
                            .padding(.horizontal)
                    }
                }
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(12)
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


// MARK: - Standing Section
struct StandingSection: View {
    let standing: TeamStanding
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("현재 순위")
                .font(.headline)
                .padding(.horizontal)
            
            HStack(spacing: 24) {
                VStack(alignment: .center, spacing: 4) {
                    Text("\(standing.rank)")
                        .font(.system(.title, design: .rounded))
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                    Text("순위")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("승점")
                            .foregroundColor(.secondary)
                        Text("\(standing.points)")
                            .fontWeight(.medium)
                    }
                    
                    HStack {
                        Text("득실차")
                            .foregroundColor(.secondary)
                        Text("\(standing.goalsDiff)")
                            .fontWeight(.medium)
                    }
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("승")
                            .foregroundColor(.secondary)
                        Text("\(standing.all.win)")
                            .fontWeight(.medium)
                            .foregroundColor(.green)
                    }
                    
                    HStack {
                        Text("패")
                            .foregroundColor(.secondary)
                        Text("\(standing.all.lose)")
                            .fontWeight(.medium)
                            .foregroundColor(.red)
                    }
                }
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color(.systemBackground))
            .cornerRadius(12)
        }
    }
}

// MARK: - Squad Section
struct SquadSection: View {
    let squadGroups: [SquadGroup]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("선수단")
                .font(.headline)
                .padding(.horizontal)
            
            ForEach(squadGroups) { group in
                VStack(alignment: .leading, spacing: 8) {
                    Text(group.position)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 16) {
                            ForEach(group.players, id: \.player.id) { player in
                                PlayerCardView(player: player.player)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
        }
        .padding(.vertical)
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
}


// MARK: - Team History Section
struct TeamHistorySection: View {
    let history: [TeamHistory]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("역대 성적")
                .font(.headline)
                .padding(.horizontal)
            
            if history.isEmpty {
                Text("데이터 로딩 중...")
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                VStack(spacing: 16) {
                    ForEach(history, id: \.season) { season in
                        HStack {
                            Text(season.seasonDisplay)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            VStack(alignment: .trailing, spacing: 4) {
                                Text("\(season.leaguePosition)위")
                                    .font(.system(.body, design: .rounded))
                                    .fontWeight(.medium)
                                
                                Text("승률 \(String(format: "%.1f", season.winRate))%")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.horizontal)
                        
                        if season.season != history.last?.season {
                            Divider()
                                .padding(.horizontal)
                        }
                    }
                }
                .padding(.vertical)
                .background(Color(.systemBackground))
                .cornerRadius(12)
            }
        }
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
