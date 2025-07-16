import SwiftUI
import Kingfisher

// 강화된 팀 정보 카드 - 팬 감성 극대화
struct EnhancedTeamInfoCard: View {
    let teamId: Int
    let teamName: String
    let teamStanding: TeamStanding?
    let onTeamChange: () -> Void
    
    @State private var isAnimating = false
    @State private var showTrophies = false
    @State private var particleAnimation = false
    
    var emotionalData: TeamEmotionalData {
        TeamEmotionalDataService.shared.getEmotionalData(for: teamId) ??
        TeamEmotionalDataService.shared.getDefaultEmotionalData(teamId: teamId, teamName: teamName)
    }
    
    var legendData: TeamLegendData? {
        TeamLegendDataService.shared.getLegendData(for: teamId)
    }
    
    var body: some View {
        ZStack {
            // 배경 패턴 (팀별 특수 패턴)
            TeamPatternBackground(pattern: legendData?.specialPattern)
                .opacity(0.1)
            
            // 그라데이션 오버레이
            LinearGradient(
                colors: [
                    emotionalData.primaryColor.opacity(0.3),
                    emotionalData.primaryColor.opacity(0.1),
                    Color.clear
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // 파티클 효과 (승리시)
            if let form = teamStanding?.form, form.suffix(1) == "W" {
                ParticleEffectView(color: emotionalData.primaryColor)
                    .opacity(particleAnimation ? 1 : 0)
            }
            
            VStack(spacing: 20) {
                // 헤더 섹션
                HStack(spacing: 20) {
                    // 팀 로고 컨테이너
                    ZStack {
                        // 배경 원형 그라데이션
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        emotionalData.primaryColor,
                                        emotionalData.primaryColor.opacity(0.5)
                                    ],
                                    center: .center,
                                    startRadius: 0,
                                    endRadius: 40
                                )
                            )
                            .frame(width: 90, height: 90)
                            .shadow(color: emotionalData.primaryColor.opacity(0.5), radius: 15, x: 0, y: 5)
                            .overlay(
                                Circle()
                                    .stroke(
                                        LinearGradient(
                                            colors: [Color.white.opacity(0.8), Color.white.opacity(0.2)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 3
                                    )
                            )
                            .scaleEffect(isAnimating ? 1.05 : 1.0)
                            .animation(
                                Animation.easeInOut(duration: 2)
                                    .repeatForever(autoreverses: true),
                                value: isAnimating
                            )
                        
                        // 팀 로고
                        KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                            .resizable()
                            .scaledToFit()
                            .frame(width: 70, height: 70)
                            .clipShape(Circle())
                    }
                    
                    // 팀 정보
                    VStack(alignment: .leading, spacing: 8) {
                        // 팀명과 창단년도
                        HStack(alignment: .bottom, spacing: 8) {
                            Text(teamName)
                                .font(.title)
                                .fontWeight(.black)
                                .foregroundColor(.primary)
                            
                            if let founded = legendData?.founded {
                                Text("Since \(founded)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(
                                        Capsule()
                                            .fill(Color.gray.opacity(0.2))
                                    )
                            }
                        }
                        
                        // 슬로건
                        Text(emotionalData.slogan)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [emotionalData.primaryColor, emotionalData.primaryColor.opacity(0.7)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .italic()
                        
                        // 별명들
                        if let nicknames = legendData?.nicknames {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 6) {
                                    ForEach(nicknames, id: \.self) { nickname in
                                        Text(nickname)
                                            .font(.caption2)
                                            .fontWeight(.medium)
                                            .padding(.horizontal, 8)
                                            .padding(.vertical, 3)
                                            .background(
                                                Capsule()
                                                    .fill(emotionalData.primaryColor.opacity(0.2))
                                                    .overlay(
                                                        Capsule()
                                                            .stroke(emotionalData.primaryColor.opacity(0.5), lineWidth: 1)
                                                    )
                                            )
                                    }
                                }
                            }
                        }
                    }
                    
                    Spacer()
                }
                
                // 경기장 정보
                if let stadium = legendData?.stadiumName, let capacity = legendData?.stadiumCapacity {
                    HStack(spacing: 6) {
                        Image(systemName: "sportscourt.fill")
                            .foregroundColor(emotionalData.primaryColor)
                            .font(.caption)
                        Text(stadium)
                            .font(.caption)
                            .fontWeight(.medium)
                        Text("•")
                            .foregroundColor(.secondary)
                        Text("\(capacity) 수용")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.gray.opacity(0.1))
                    )
                }
                
                // 순위 및 통계 섹션
                if let standing = teamStanding {
                    EnhancedStandingView(standing: standing, teamColor: emotionalData.primaryColor)
                }
                
                // 트로피 섹션
                if let trophies = legendData?.trophyEmojis {
                    VStack(spacing: 8) {
                        Button {
                            withAnimation(.spring()) {
                                showTrophies.toggle()
                            }
                        } label: {
                            HStack {
                                Text("🏆 Trophy Cabinet")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                Image(systemName: showTrophies ? "chevron.up" : "chevron.down")
                                    .font(.caption)
                            }
                            .foregroundColor(emotionalData.primaryColor)
                        }
                        
                        if showTrophies {
                            Text(trophies)
                                .font(.title3)
                                .transition(.scale.combined(with: .opacity))
                        }
                    }
                }
                
                // 응원 구호 애니메이션
                if let fanChant = emotionalData.fanChant {
                    Text(fanChant.uppercased())
                        .font(.caption)
                        .fontWeight(.black)
                        .foregroundColor(emotionalData.primaryColor)
                        .scaleEffect(isAnimating ? 1.1 : 1.0)
                        .opacity(isAnimating ? 1.0 : 0.7)
                        .animation(
                            Animation.easeInOut(duration: 1.5)
                                .repeatForever(autoreverses: true),
                            value: isAnimating
                        )
                }
            }
            .padding()
        }
        .background(Color(.systemBackground))
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(
                    LinearGradient(
                        colors: [
                            emotionalData.primaryColor,
                            emotionalData.primaryColor.opacity(0.3),
                            emotionalData.primaryColor.opacity(0.1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 2
                )
        )
        .shadow(color: emotionalData.primaryColor.opacity(0.3), radius: 15, x: 0, y: 8)
        .onAppear {
            isAnimating = true
            if teamStanding?.form?.suffix(1) == "W" {
                withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                    particleAnimation = true
                }
            }
        }
    }
}

// 강화된 순위 뷰
struct EnhancedStandingView: View {
    let standing: TeamStanding
    let teamColor: Color
    
    var body: some View {
        VStack(spacing: 12) {
            // 메인 통계
            HStack(spacing: 16) {
                // 순위
                VStack(spacing: 4) {
                    ZStack {
                        Circle()
                            .fill(
                                standing.rank <= 3 ?
                                LinearGradient(
                                    colors: [Color.yellow, Color.orange],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ) :
                                LinearGradient(
                                    colors: [teamColor, teamColor.opacity(0.7)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 50, height: 50)
                        
                        VStack(spacing: 0) {
                            Text("\(standing.rank)")
                                .font(.title2)
                                .fontWeight(.black)
                                .foregroundColor(.white)
                            if standing.rank <= 3 {
                                Text("위")
                                    .font(.caption2)
                                    .foregroundColor(.white.opacity(0.8))
                            }
                        }
                    }
                    
                    if standing.rank == 1 {
                        Text("👑 리더")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                }
                
                // 승점
                VStack(spacing: 4) {
                    Text("\(standing.points)")
                        .font(.title)
                        .fontWeight(.black)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [teamColor, teamColor.opacity(0.7)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                    Text("Points")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(teamColor.opacity(0.1))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(teamColor.opacity(0.3), lineWidth: 1)
                        )
                )
                
                Spacer()
                
                // 최근 폼 (강화된 디자인)
                if let form = standing.form {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Form")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        HStack(spacing: 3) {
                            ForEach(Array(form.suffix(5).enumerated()), id: \.offset) { index, result in
                                FormBubble(result: String(result), index: index)
                            }
                        }
                    }
                }
            }
            
            // 골 통계
            HStack(spacing: 20) {
                GoalStatView(title: "득점", value: standing.all.goals.for, color: .green)
                GoalStatView(title: "실점", value: standing.all.goals.against, color: .red)
                GoalStatView(title: "득실차", value: standing.goalsDiff, color: standing.goalsDiff > 0 ? .green : .red, showSign: true)
            }
            .padding(.top, 8)
        }
    }
}

// 폼 버블
struct FormBubble: View {
    let result: String
    let index: Int
    
    var formColor: Color {
        switch result {
        case "W": return .green
        case "D": return .orange
        case "L": return .red
        default: return .gray
        }
    }
    
    var body: some View {
        ZStack {
            Circle()
                .fill(formColor)
                .frame(width: 24, height: 24)
                .overlay(
                    Circle()
                        .stroke(Color.white, lineWidth: 2)
                )
                .shadow(color: formColor.opacity(0.5), radius: 3, x: 0, y: 2)
            
            Text(result)
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
        .scaleEffect(index == 4 ? 1.2 : 1.0) // 최근 경기 강조
    }
}

// 골 통계 뷰
struct GoalStatView: View {
    let title: String
    let value: Int
    let color: Color
    var showSign: Bool = false
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
            Text(showSign && value > 0 ? "+\(value)" : "\(value)")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(minWidth: 50)
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
    }
}

// 팀 패턴 배경
struct TeamPatternBackground: View {
    let pattern: String?
    
    var body: some View {
        GeometryReader { geometry in
            if pattern == "red_devils" {
                // 맨유 - 악마 패턴
                ForEach(0..<5) { row in
                    ForEach(0..<5) { col in
                        Text("😈")
                            .font(.system(size: 30))
                            .opacity(0.1)
                            .position(
                                x: CGFloat(col) * geometry.size.width / 4,
                                y: CGFloat(row) * geometry.size.height / 4
                            )
                            .rotationEffect(.degrees(Double.random(in: -30...30)))
                    }
                }
            } else if pattern == "liverbird" {
                // 리버풀 - 리버버드
                Image(systemName: "bird.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.red.opacity(0.1))
                    .position(x: geometry.size.width * 0.8, y: geometry.size.height * 0.5)
            } else if pattern == "cannon" {
                // 아스날 - 대포
                Image(systemName: "scope")
                    .font(.system(size: 100))
                    .foregroundColor(.red.opacity(0.1))
                    .position(x: geometry.size.width * 0.85, y: geometry.size.height * 0.5)
                    .rotationEffect(.degrees(-45))
            } else if pattern == "blaugrana_stripes" {
                // 바르샤 - 블라우그라나 줄무늬
                HStack(spacing: 0) {
                    ForEach(0..<10) { index in
                        Rectangle()
                            .fill(index % 2 == 0 ? Color.blue.opacity(0.1) : Color.red.opacity(0.1))
                    }
                }
            }
        }
    }
}

// 파티클 효과 뷰
struct ParticleEffectView: View {
    let color: Color
    @State private var particles: [Particle] = []
    
    struct Particle: Identifiable {
        let id = UUID()
        var position: CGPoint
        var velocity: CGVector
        var opacity: Double
    }
    
    var body: some View {
        Canvas { context, size in
            for particle in particles {
                context.opacity = particle.opacity
                context.fill(
                    Circle().path(in: CGRect(x: particle.position.x - 3, y: particle.position.y - 3, width: 6, height: 6)),
                    with: .color(color)
                )
            }
        }
        .onAppear {
            generateParticles()
        }
    }
    
    func generateParticles() {
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            // 파티클 생성 및 애니메이션
            let newParticle = Particle(
                position: CGPoint(x: CGFloat.random(in: 0...300), y: 250),
                velocity: CGVector(
                    dx: CGFloat.random(in: -2...2),
                    dy: CGFloat.random(in: -5...(-2))
                ),
                opacity: 1.0
            )
            particles.append(newParticle)
            
            // 파티클 업데이트
            particles = particles.compactMap { particle in
                var updated = particle
                updated.position.x += updated.velocity.dx
                updated.position.y += updated.velocity.dy
                updated.opacity -= 0.02
                return updated.opacity > 0 ? updated : nil
            }
        }
    }
}

// 강화된 게시판 카드 (내 팀)
struct EnhancedMyTeamBoardCard: View {
    let board: CommunityBoard
    @State private var isPressed = false
    @State private var showFireworks = false
    @State private var rotationAngle: Double = 0
    
    var emotionalData: TeamEmotionalData? {
        guard let teamId = board.teamId else { return nil }
        return TeamEmotionalDataService.shared.getEmotionalData(for: teamId)
    }
    
    var legendData: TeamLegendData? {
        guard let teamId = board.teamId else { return nil }
        return TeamLegendDataService.shared.getLegendData(for: teamId)
    }
    
    var body: some View {
        ZStack {
            // 배경 그라데이션 (팀 컬러)
            if let emotionalData = emotionalData {
                LinearGradient(
                    colors: [
                        emotionalData.primaryColor.opacity(0.2),
                        emotionalData.secondaryColor.opacity(0.1),
                        emotionalData.primaryColor.opacity(0.05)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
            
            // 팀 패턴
            if let pattern = legendData?.specialPattern {
                TeamPatternBackground(pattern: pattern)
                    .opacity(0.15)
            }
            
            // 메인 콘텐츠
            VStack(spacing: 16) {
                HStack(spacing: 16) {
                    // 팀 로고 애니메이션
                    ZStack {
                        // 펄스 효과
                        Circle()
                            .fill(emotionalData?.primaryColor.opacity(0.3) ?? Color.blue.opacity(0.3))
                            .frame(width: 70, height: 70)
                            .scaleEffect(showFireworks ? 1.5 : 1.0)
                            .opacity(showFireworks ? 0 : 0.5)
                            .animation(
                                Animation.easeOut(duration: 1.5)
                                    .repeatForever(autoreverses: false),
                                value: showFireworks
                            )
                        
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        emotionalData?.primaryColor ?? .blue,
                                        (emotionalData?.primaryColor ?? .blue).opacity(0.7)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 60, height: 60)
                            .overlay(
                                Circle()
                                    .stroke(Color.white, lineWidth: 3)
                            )
                            .shadow(color: (emotionalData?.primaryColor ?? .blue).opacity(0.5), radius: 10, x: 0, y: 5)
                        
                        if let teamId = board.teamId {
                            KFImage(URL(string: "https://media.api-sports.io/football/teams/\(teamId).png"))
                                .resizable()
                                .scaledToFit()
                                .frame(width: 50, height: 50)
                                .clipShape(Circle())
                                .rotationEffect(.degrees(rotationAngle))
                        }
                        
                        // 별 아이콘
                        Image(systemName: "star.fill")
                            .foregroundColor(.yellow)
                            .font(.caption)
                            .background(
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 20, height: 20)
                            )
                            .offset(x: 25, y: -25)
                            .scaleEffect(showFireworks ? 1.3 : 1.0)
                            .animation(
                                Animation.easeInOut(duration: 0.8)
                                    .repeatForever(autoreverses: true),
                                value: showFireworks
                            )
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        // 게시판 이름
                        HStack(spacing: 8) {
                            Text(board.name)
                                .font(.headline)
                                .fontWeight(.black)
                            
                            Text(emotionalData?.emoji ?? "⚽")
                                .font(.title3)
                        }
                        
                        // 전설적인 문구
                        if let historicMoment = legendData?.historicMoments.randomElement() {
                            Text(historicMoment)
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(emotionalData?.primaryColor ?? .blue)
                                .italic()
                        }
                        
                        // 팬 응원 구호
                        if let fanChant = emotionalData?.fanChant {
                            Text("🎤 \(fanChant)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Spacer()
                    
                    // 라이벌전 표시
                    if let rivals = legendData?.rivals, !rivals.isEmpty {
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("Rivals")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            ForEach(rivals.prefix(2), id: \.teamId) { rival in
                                HStack(spacing: 4) {
                                    KFImage(URL(string: "https://media.api-sports.io/football/teams/\(rival.teamId).png"))
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 20, height: 20)
                                    Text("vs")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
                
                Divider()
                    .background(emotionalData?.primaryColor.opacity(0.3) ?? Color.gray.opacity(0.3))
                
                // 통계 및 레전드
                HStack {
                    // 게시글/멤버 수
                    HStack(spacing: 16) {
                        StatBadge(
                            icon: "doc.text.fill",
                            value: "\(board.postCount)",
                            label: "Posts",
                            color: emotionalData?.primaryColor ?? .blue
                        )
                        
                        StatBadge(
                            icon: "person.2.fill",
                            value: "\(board.memberCount)",
                            label: "Fans",
                            color: emotionalData?.primaryColor ?? .blue
                        )
                    }
                    
                    Spacer()
                    
                    // 레전드 선수들
                    if let legends = legendData?.legendaryPlayers.prefix(3) {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("Legends")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            ForEach(Array(legends), id: \.self) { player in
                                Text(player)
                                    .font(.caption2)
                                    .fontWeight(.medium)
                                    .foregroundColor(emotionalData?.primaryColor ?? .blue)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .strokeBorder(
                    LinearGradient(
                        colors: [
                            (emotionalData?.primaryColor ?? .blue),
                            (emotionalData?.primaryColor ?? .blue).opacity(0.5),
                            (emotionalData?.primaryColor ?? .blue).opacity(0.2)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 3
                )
        )
        .shadow(color: (emotionalData?.primaryColor ?? .blue).opacity(0.3), radius: 15, x: 0, y: 8)
        .scaleEffect(isPressed ? 0.97 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: isPressed)
        .onAppear {
            showFireworks = true
            withAnimation(.linear(duration: 20).repeatForever(autoreverses: false)) {
                rotationAngle = 360
            }
        }
        .onLongPressGesture(minimumDuration: 0.05, maximumDistance: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
    }
}

// 통계 배지
struct StatBadge: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundColor(color)
                Text(value)
                    .font(.headline)
                    .fontWeight(.bold)
            }
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(color.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
    }
}