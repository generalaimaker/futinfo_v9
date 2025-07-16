import SwiftUI
import Charts

struct PlayerProfileView: View {
    @StateObject private var viewModel: PlayerProfileViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTab = 0
    @State private var showComparison = false
    @State private var isAnimating = false
    
    init(playerId: Int) {
        _viewModel = StateObject(wrappedValue: PlayerProfileViewModel(playerId: playerId))
    }
    
    @ObservedObject private var favoriteService = FavoriteService.shared
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // 탭 1: 프로필 & 통계
            PlayerOverviewTab()
                .tabItem {
                    Label("프로필", systemImage: "person.circle.fill")
                }
                .tag(0)
            
            // 탭 2: 성과 & 하이라이트
            PlayerPerformanceTab()
                .tabItem {
                    Label("성과", systemImage: "chart.line.uptrend.xyaxis")
                }
                .tag(1)
            
            // 탭 3: 커리어 히스토리
            PlayerCareerTab()
                .tabItem {
                    Label("커리어", systemImage: "clock.arrow.circlepath")
                }
                .tag(2)
        }
        .environmentObject(viewModel)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                if viewModel.isLoadingProfile {
                    ProgressView()
                        .scaleEffect(0.8)
                } else if let player = viewModel.playerProfile?.player {
                    Button(action: {
                        withAnimation(.spring()) {
                            favoriteService.toggleFavorite(
                                type: .player,
                                entityId: player.id ?? 0,
                                name: player.name ?? "",
                                imageUrl: player.photo
                            )
                        }
                    }) {
                        Image(systemName: favoriteService.isFavorite(type: .player, entityId: player.id ?? 0) ? "star.fill" : "star")
                            .foregroundColor(favoriteService.isFavorite(type: .player, entityId: player.id ?? 0) ? .yellow : .gray)
                    }
                }
            }
        }
        .task {
            await viewModel.loadAllData()
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0)) {
                isAnimating = true
            }
        }
    }
}

// MARK: - Player Overview Tab
struct PlayerOverviewTab: View {
    @EnvironmentObject var viewModel: PlayerProfileViewModel
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Hero Header
                PlayerHeroHeader()
                
                // Quick Stats Cards
                QuickStatsSection()
                
                // Current Season Performance
                CurrentSeasonSection()
                
                // Position Analysis
                PositionAnalysisSection()
                
                // Recent Form
                RecentFormSection()
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }
}

// MARK: - Player Hero Header
struct PlayerHeroHeader: View {
    @EnvironmentObject var viewModel: PlayerProfileViewModel
    @State private var headerOffset: CGFloat = 0
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Team Color Gradient Background
                LinearGradient(
                    colors: [
                        teamPrimaryColor.opacity(0.8),
                        teamSecondaryColor.opacity(0.6),
                        Color.clear
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea(edges: .top)
                
                // Player Image with Parallax Effect
                if let photoUrl = viewModel.playerProfile?.player.photo {
                    AsyncImage(url: URL(string: photoUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Image(systemName: "person.fill")
                            .foregroundColor(.gray.opacity(0.3))
                    }
                    .frame(width: 200, height: 200)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 4)
                    )
                    .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5)
                    .offset(y: headerOffset * 0.5)
                    .position(x: geometry.size.width * 0.75, y: geometry.size.height * 0.4)
                }
                
                // Player Info Overlay
                VStack(alignment: .leading, spacing: 8) {
                    Spacer()
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            // Player Number (Large)
                            if viewModel.playerNumber > 0 {
                                Text("#\(viewModel.playerNumber)")
                                    .font(.system(size: 60, weight: .black, design: .rounded))
                                    .foregroundColor(.white)
                                    .shadow(color: .black.opacity(0.5), radius: 2, x: 1, y: 1)
                            }
                            
                            // Player Name
                            Text(viewModel.playerProfile?.player.name ?? "Player Name")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .shadow(color: .black.opacity(0.5), radius: 2, x: 1, y: 1)
                            
                            // Position Badge
                            PositionBadge(position: viewModel.playerPosition)
                            
                            // Team Info
                            if let team = viewModel.teamInfo {
                                HStack(spacing: 8) {
                                    AsyncImage(url: URL(string: team.logo)) { image in
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fit)
                                    } placeholder: {
                                        Image(systemName: "shield.fill")
                                            .foregroundColor(.white)
                                    }
                                    .frame(width: 24, height: 24)
                                    
                                    Text(team.name)
                                        .font(.subheadline)
                                        .foregroundColor(.white.opacity(0.9))
                                }
                                .padding(.top, 4)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                }
            }
        }
        .frame(height: 350)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5)) {
                headerOffset = 0
            }
        }
    }
    
    private var teamPrimaryColor: Color {
        // 팀 컬러를 가져오거나 기본 색상 사용
        return Color.blue
    }
    
    private var teamSecondaryColor: Color {
        return Color.purple
    }
}

// MARK: - Position Badge
struct PositionBadge: View {
    let position: String
    
    var body: some View {
        Text(position)
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(positionColor.opacity(0.8))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
            )
    }
    
    private var positionColor: Color {
        switch position.lowercased() {
        case let pos where pos.contains("goalkeeper") || pos.contains("골키퍼"):
            return .yellow
        case let pos where pos.contains("defender") || pos.contains("수비"):
            return .blue
        case let pos where pos.contains("midfielder") || pos.contains("미드"):
            return .green
        case let pos where pos.contains("attacker") || pos.contains("공격") || pos.contains("forward"):
            return .red
        default:
            return .gray
        }
    }
}

// MARK: - Quick Stats Section
struct QuickStatsSection: View {
    @EnvironmentObject var viewModel: PlayerProfileViewModel
    @State private var animateStats = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("시즌 주요 기록")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                // 시즌 정보 표시
                if viewModel.selectedSeason > 0 {
                    Text(formatSeasonDisplay(viewModel.selectedSeason))
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.8))
                        .cornerRadius(8)
                }
            }
            
            HStack(spacing: 12) {
                AnimatedStatCard(
                    title: "골",
                    value: viewModel.formattedStats.goals,
                    icon: "soccerball.inverse",
                    color: .red,
                    animate: animateStats
                )
                .onAppear {
                    print("🎯 UI에서 표시되는 골 수: \(viewModel.formattedStats.goals)")
                }
                
                AnimatedStatCard(
                    title: "어시스트",
                    value: viewModel.formattedStats.assists,
                    icon: "hand.point.up.left.fill",
                    color: .blue,
                    animate: animateStats
                )
                .onAppear {
                    print("🎯 UI에서 표시되는 어시스트 수: \(viewModel.formattedStats.assists)")
                }
                
                AnimatedStatCard(
                    title: "출전",
                    value: viewModel.formattedStats.appearances,
                    icon: "figure.run",
                    color: .green,
                    animate: animateStats
                )
                .onAppear {
                    print("🎯 UI에서 표시되는 출전 수: \(viewModel.formattedStats.appearances)")
                }
                
                AnimatedStatCard(
                    title: "평점",
                    value: viewModel.formattedStats.rating,
                    icon: "star.fill",
                    color: .orange,
                    animate: animateStats
                )
            }
        }
        .padding()
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        .onAppear {
            withAnimation(.easeOut(duration: 1.0).delay(0.3)) {
                animateStats = true
            }
        }
    }
    
    // 시즌 표시 형식 헬퍼 함수
    private func formatSeasonDisplay(_ season: Int) -> String {
        let nextYear = season + 1
        let seasonStart = String(season).suffix(2)
        let seasonEnd = String(nextYear).suffix(2)
        return "\(seasonStart)-\(seasonEnd)"
    }
}

// MARK: - Animated Stat Card
struct AnimatedStatCard: View {
    let title: String
    let value: Any
    let icon: String
    let color: Color
    let animate: Bool
    
    @State private var displayValue: Double = 0
    @State private var scale: CGFloat = 0.8
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .scaleEffect(scale)
            
            if value is Int {
                Text("\(Int(displayValue))")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            } else if let stringValue = value as? String {
                Text(stringValue)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.1))
        .cornerRadius(12)
        .onChange(of: animate) { _, newValue in
            if newValue {
                withAnimation(.spring(duration: 0.8)) {
                    scale = 1.0
                }
                
                if let intValue = value as? Int {
                    withAnimation(.easeOut(duration: 1.5)) {
                        displayValue = Double(intValue)
                    }
                }
            }
        }
    }
}

// MARK: - Current Season Section
struct CurrentSeasonSection: View {
    @EnvironmentObject var viewModel: PlayerProfileViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("상세 통계")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    // 시즌 정보 표시
                    if viewModel.selectedSeason > 0 {
                        Text(formatSeasonDisplay(viewModel.selectedSeason))
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                if let league = viewModel.leagueInfo {
                    HStack(spacing: 4) {
                        if let logoUrl = league.logo {
                            AsyncImage(url: URL(string: logoUrl)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 20, height: 20)
                        }
                        Text(league.name ?? "League")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Performance Grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                DetailedStatCard(title: "슈팅", value: "\(viewModel.formattedStats.shotsTotal)", subtitle: "온타겟: \(viewModel.formattedStats.shotsOnTarget)", icon: "target", color: .red)
                
                DetailedStatCard(title: "패스 정확도", value: viewModel.formattedStats.passAccuracy, subtitle: "성공적인 패스", icon: "arrow.triangle.swap", color: .blue)
                
                DetailedStatCard(title: "태클", value: "\(viewModel.formattedStats.tacklesTotal)", subtitle: "인터셉트: \(viewModel.formattedStats.interceptions)", icon: "shield.fill", color: .green)
                
                DetailedStatCard(title: "경고", value: "\(viewModel.formattedStats.yellowCards)", subtitle: "퇴장: \(viewModel.formattedStats.redCards)", icon: "rectangle.fill", color: .yellow)
            }
        }
        .padding()
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
    
    // 시즌 표시 형식 헬퍼 함수
    private func formatSeasonDisplay(_ season: Int) -> String {
        let nextYear = season + 1
        let seasonStart = String(season).suffix(2)
        let seasonEnd = String(nextYear).suffix(2)
        return "\(seasonStart)-\(seasonEnd)"
    }
}

// MARK: - Detailed Stat Card
struct DetailedStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title3)
                
                Spacer()
                
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
            }
            
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
            
            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Position Analysis Section
struct PositionAnalysisSection: View {
    @EnvironmentObject var viewModel: PlayerProfileViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("포지션 분석")
                .font(.headline)
                .fontWeight(.semibold)
            
            VStack(spacing: 12) {
                Text("주요 능력치")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                VStack(spacing: 8) {
                    SkillBar(title: "공격", value: calculateAttackSkill(), color: .red)
                    SkillBar(title: "패스", value: calculatePassSkill(), color: .blue)
                    SkillBar(title: "수비", value: calculateDefenseSkill(), color: .green)
                    SkillBar(title: "체력", value: calculatePhysicalSkill(), color: .orange)
                }
            }
        }
        .padding()
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
    
    private func calculateAttackSkill() -> Double {
        let goals = Double(viewModel.formattedStats.goals)
        let assists = Double(viewModel.formattedStats.assists)
        let shots = Double(viewModel.formattedStats.shotsTotal)
        return min((goals * 10 + assists * 8 + shots * 0.5) / 100, 1.0)
    }
    
    private func calculatePassSkill() -> Double {
        let accuracyString = viewModel.formattedStats.passAccuracy
        if let percentage = Double(accuracyString.replacingOccurrences(of: "%", with: "")) {
            return percentage / 100.0
        }
        return 0.7
    }
    
    private func calculateDefenseSkill() -> Double {
        let tackles = Double(viewModel.formattedStats.tacklesTotal)
        let interceptions = Double(viewModel.formattedStats.interceptions)
        return min((tackles * 2 + interceptions * 3) / 100, 1.0)
    }
    
    private func calculatePhysicalSkill() -> Double {
        let minutes = Double(viewModel.formattedStats.minutesPlayed)
        let appearances = Double(viewModel.formattedStats.appearances)
        if appearances > 0 {
            return min(minutes / (appearances * 90), 1.0)
        }
        return 0.8
    }
}

// MARK: - Skill Bar
struct SkillBar: View {
    let title: String
    let value: Double
    let color: Color
    @State private var animatedValue: Double = 0
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                Text("\(Int(animatedValue * 100))%")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(color)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(color)
                        .frame(width: geometry.size.width * animatedValue, height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.0).delay(0.5)) {
                animatedValue = value
            }
        }
    }
}

// MARK: - Recent Form Section
struct RecentFormSection: View {
    @EnvironmentObject var viewModel: PlayerProfileViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("최근 폼")
                .font(.headline)
                .fontWeight(.semibold)
            
            HStack(spacing: 8) {
                ForEach(0..<5, id: \.self) { index in
                    PlayerFormIndicator(performance: getRandomPerformance())
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("평균 평점")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(viewModel.formattedStats.rating)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                }
            }
        }
        .padding()
        .background(.regularMaterial)
        .cornerRadius(15)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
    
    private func getRandomPerformance() -> FormPerformance {
        let performances: [FormPerformance] = [.excellent, .good, .average, .poor]
        return performances.randomElement() ?? .average
    }
}

// MARK: - Form Indicator
enum FormPerformance {
    case excellent, good, average, poor
    
    var color: Color {
        switch self {
        case .excellent: return .green
        case .good: return .blue
        case .average: return .orange
        case .poor: return .red
        }
    }
}

struct PlayerFormIndicator: View {
    let performance: FormPerformance
    @State private var scale: CGFloat = 0.5
    
    var body: some View {
        Circle()
            .fill(performance.color)
            .frame(width: 30, height: 30)
            .scaleEffect(scale)
            .onAppear {
                withAnimation(.spring(duration: 0.6).delay(Double.random(in: 0...0.5))) {
                    scale = 1.0
                }
            }
    }
}

// MARK: - Performance Tab (Placeholder)
struct PlayerPerformanceTab: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("성과 분석")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding()
                
                Text("시즌별 성과 차트와 하이라이트가 여기에 표시됩니다.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
            }
        }
    }
}

// MARK: - Career Tab (Placeholder)
struct PlayerCareerTab: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Text("커리어 히스토리")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding()
                
                Text("선수의 커리어 타임라인과 이적 히스토리가 여기에 표시됩니다.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
            }
        }
    }
}

#Preview {
    NavigationView {
        PlayerProfileView(playerId: 1)
    }
}
