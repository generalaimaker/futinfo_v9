import SwiftUI

// MARK: - Components
fileprivate struct LineupFilterButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.blue : Color.gray.opacity(0.2))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(12)
        }
    }
}

fileprivate struct LineupStatItem: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .foregroundColor(.gray)
            Text(value)
                .fontWeight(.medium)
        }
    }
}

fileprivate struct LineupPlayerStatRow: View {
    let player: PlayerInfo
    let stats: PlayerMatchStats
    @State private var isExpanded = false
    
    var onPlayerTap: (Int) -> Void  // 선수 ID를 전달하는 클로저 추가
    
    var body: some View {
        Button(action: {
            onPlayerTap(player.id ?? 0)  // 선수 ID 전달
        }) {
            VStack(spacing: 8) {
                HStack {
                    AsyncImage(url: URL(string: player.photo ?? "")) { image in
                        image
                            .resizable()
                            .scaledToFit()
                    } placeholder: {
                        Image(systemName: "person.circle")
                            .foregroundColor(.gray)
                    }
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(player.name ?? "선수 정보 없음")
                            .font(.callout)
                        
                        HStack(spacing: 4) {
                            if let games = stats.games,
                               let position = games.position {
                                Text(position)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            if let games = stats.games,
                               games.substitute ?? false {
                                Text("(교체)")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // 평점이 있는 경우에만 표시
                    if let games = stats.games,
                       let rating = games.rating,
                       let ratingValue = Double(rating),
                       ratingValue > 0 {
                        Text(String(format: "%.1f", ratingValue))
                            .font(.headline)
                            .foregroundColor(.blue)
                    }
                    
                    Image(systemName: "chevron.right")
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                        .foregroundColor(.gray)
                }
                
                if isExpanded {
                    VStack(spacing: 12) {
                        // 기본 정보
                        HStack(spacing: 20) {
                            if let games = stats.games {
                                LineupStatItem(title: "출전 시간", value: "\(games.minutes ?? 0)'")
                                if let number = games.number {
                                    LineupStatItem(title: "등번호", value: "\(number)")
                                }
                                if games.captain == true {
                                    LineupStatItem(title: "주장", value: "○")
                                }
                            }
                        }
                        
                        // 공격 지표
                        if let shots = stats.shots, let goals = stats.goals {
                            HStack(spacing: 20) {
                                LineupStatItem(title: "슈팅", value: "\(shots.total ?? 0)")
                                LineupStatItem(title: "유효슈팅", value: "\(shots.on ?? 0)")
                                LineupStatItem(title: "득점", value: "\(goals.total ?? 0)")
                                if let assists = goals.assists {
                                    LineupStatItem(title: "도움", value: "\(assists)")
                                }
                            }
                        }
                        
                        // 패스
                        if let passes = stats.passes {
                            HStack(spacing: 20) {
                                LineupStatItem(title: "패스 시도", value: "\(passes.total ?? 0)")
                                LineupStatItem(title: "성공률", value: passes.accuracy?.displayValue ?? "0%")
                                LineupStatItem(title: "키패스", value: "\(passes.key ?? 0)")
                            }
                        }
                        
                        // 수비 지표
                        if let tackles = stats.tackles {
                            HStack(spacing: 20) {
                                LineupStatItem(title: "태클", value: "\(tackles.total ?? 0)")
                                LineupStatItem(title: "차단", value: "\(tackles.blocks ?? 0)")
                                LineupStatItem(title: "인터셉트", value: "\(tackles.interceptions ?? 0)")
                            }
                        }
                        
                        // 기타 지표
                        HStack(spacing: 20) {
                            if let duels = stats.duels {
                                LineupStatItem(title: "듀얼 성공", value: "\(duels.won ?? 0)/\(duels.total ?? 0)")
                            }
                            if let dribbles = stats.dribbles {
                                LineupStatItem(title: "드리블 성공", value: "\(dribbles.success ?? 0)/\(dribbles.attempts ?? 0)")
                            }
                            if let fouls = stats.fouls {
                                LineupStatItem(title: "파울", value: "\(fouls.committed ?? 0)")
                                LineupStatItem(title: "피파울", value: "\(fouls.drawn ?? 0)")
                            }
                        }
                    }
                    .font(.caption)
                    .padding(.top, 8)
                }
            }
            .padding(.vertical, 8)
            .background(Color(.systemBackground))
            .animation(.easeInOut, value: isExpanded)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// FormationView는 Components/FormationView.swift에서 정의됨

// MARK: - Player Components
struct PlayerDot: View {
    let number: Int
    let name: String
    let position: String
    let stats: Int
    @State private var isShowingDetails = false
    @State private var isPressed = false
    
    var body: some View {
        ZStack {
            // 배경 서클
            Circle()
                .fill(Color.white)
                .frame(width: 36, height: 36)
                .shadow(color: Color.black.opacity(0.1), radius: isPressed ? 2 : 4,
                       x: 0, y: isPressed ? 1 : 2)
            
            // 내부 서클
            Circle()
                .fill(LinearGradient(
                    gradient: Gradient(colors: [.blue.opacity(0.3), .blue.opacity(0.1)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: 34, height: 34)
            
            // 선수 번호
            Text("\(number)")
                .font(.system(.callout, design: .rounded).weight(.bold))
                .foregroundColor(.blue)
        }
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .overlay {
            if isShowingDetails {
                VStack(spacing: 4) {
                    Text(name)
                        .font(.system(.callout, design: .rounded).weight(.semibold))
                    
                    HStack(spacing: 8) {
                        Text(position)
                            .font(.system(.caption, design: .rounded))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(4)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 8)
                .offset(y: -50)
                .transition(.scale.combined(with: .opacity))
            }
        }
        .onTapGesture {
            withAnimation(.spring()) {
                isShowingDetails.toggle()
            }
        }
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct LineupPlayerCard: View {
    let number: Int
    let name: String
    let position: String
    let isStarter: Bool
    let playerId: Int
    @State private var isPressed = false
    
    var onPlayerTap: (Int) -> Void  // 선수 ID를 전달하는 클로저 추가
    
    var body: some View {
        Button(action: {
            onPlayerTap(playerId)  // 선수 ID 전달
        }) {
            VStack(spacing: 16) {
                // 선수 번호
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    isStarter ? Color.blue.opacity(0.15) : Color.gray.opacity(0.15),
                                    isStarter ? Color.blue.opacity(0.05) : Color.gray.opacity(0.05)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                        .shadow(
                            color: isStarter ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1),
                            radius: isPressed ? 4 : 8,
                            y: isPressed ? 1 : 2
                        )
                    
                    Text("\(number)")
                        .font(.system(.title2, design: .rounded).weight(.bold))
                        .foregroundColor(isStarter ? .blue : .gray)
                }
                
                VStack(spacing: 6) {
                    // 선수 이름
                    Text(name)
                        .font(.system(.callout, design: .rounded))
                        .fontWeight(.medium)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .frame(height: 40)
                    
                    // 포지션
                    Text(position)
                        .font(.system(.caption, design: .rounded))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            isStarter ? Color.blue.opacity(0.1) : Color.gray.opacity(0.1)
                        )
                        .cornerRadius(8)
                }
            }
            .frame(width: 120)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(
                color: Color.black.opacity(0.05),
                radius: isPressed ? 4 : 8,
                y: isPressed ? 1 : 2
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct TopPlayerCard: View {
    let player: PlayerInfo
    let team: Team
    let rating: String
    @State private var isPressed = false
    
    var onPlayerTap: (Int) -> Void  // 선수 ID를 전달하는 클로저 추가
    
    var body: some View {
        Button(action: {
            onPlayerTap(player.id ?? 0)  // 선수 ID 전달
        }) {
            VStack(spacing: 12) {
                // 선수 사진
                AsyncImage(url: URL(string: player.photo ?? "")) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "person.circle")
                        .foregroundColor(.gray)
                }
                .frame(width: 60, height: 60)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(Color.blue, lineWidth: 2)
                )
                .shadow(
                    color: Color.blue.opacity(0.1),
                    radius: isPressed ? 4 : 8,
                    y: isPressed ? 1 : 2
                )
                
                VStack(spacing: 6) {
                    // 선수 이름
                    Text(player.name ?? "선수 정보 없음")
                        .font(.system(.callout, design: .rounded))
                        .fontWeight(.medium)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                    
                    // 팀 로고
                    AsyncImage(url: URL(string: team.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "sportscourt")
                            .foregroundColor(.gray)
                    }
                    
                    // 평점
                    Text(rating)
                        .font(.system(.title3, design: .rounded).weight(.bold))
                        .foregroundColor(.blue)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            .frame(width: 120)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(
                color: Color.black.opacity(0.05),
                radius: isPressed ? 4 : 8,
                y: isPressed ? 1 : 2
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isPressed)
        }
        .buttonStyle(PlainButtonStyle())
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - Main View (single pitch: home top, away bottom)
struct LineupsView: View {
    /// lineups[0] must be home, lineups[1] must be away
    let lineups: [TeamLineup]
    @State private var selectedPlayerId: Int?
    @State private var showPlayerProfile = false

    // 선수 선택 처리 함수
    private func handlePlayerSelection(_ playerId: Int) {
        print("🔍 LineupsView - 선수 선택: ID \(playerId)")
        selectedPlayerId = playerId
        showPlayerProfile = true
        
        // NotificationCenter를 통해 선수 프로필 표시 요청
        NotificationCenter.default.post(
            name: NSNotification.Name("ShowPlayerProfile"),
            object: nil,
            userInfo: ["playerId": playerId]
        )
    }
    
    // MARK: - Body
    var body: some View {
        // height for each half based on device width
        let pitchHeight = UIScreen.main.bounds.width * 0.9

        ScrollView(.vertical, showsIndicators: true) {
            VStack(spacing: 0) {
                PitchHalfView(lineup: lineups.first,
                              isHome: true,
                              height: pitchHeight,
                              onPlayerTap: handlePlayerSelection)

                PitchHalfView(lineup: lineups.dropFirst().first,
                              isHome: false,
                              height: pitchHeight,
                              onPlayerTap: handlePlayerSelection)
            }
            .frame(maxWidth: .infinity)
        }
        // Persistent banners
        .overlay(alignment: .top) {
            if let home = lineups.first {
                Banner(lineup: home, isHome: true)
            }
        }
        .overlay(alignment: .bottom) {
            if let away = lineups.dropFirst().first {
                Banner(lineup: away, isHome: false)
            }
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("Line‑ups")
    }
}

// MARK: - Half‑pitch wrapper
private struct PitchHalfView: View {
    let lineup: TeamLineup?
    let isHome: Bool
    let height: CGFloat
    var onPlayerTap: (Int) -> Void
    
    var body: some View {
        if let lineup {
            FormationView(lineup: lineup, flipVertical: isHome, onPlayerTap: onPlayerTap)
                .frame(maxWidth: .infinity)
                .frame(height: height)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.vertical, 4)
        }
    }
}

// MARK: - Banner (team name + formation)
private struct Banner: View {
    let lineup: TeamLineup
    let isHome: Bool

    var body: some View {
        HStack(spacing: 6) {
            teamInfo
            Spacer()
        }
        .padding(6)
        .frame(maxWidth: .infinity)
        .background(
            Color(hex: lineup.team.colors?.player?.primary ?? "3366FF")
                .opacity(0.9)
        )
    }

    private var teamInfo: some View {
        HStack(spacing: 4) {
            AsyncImage(url: URL(string: lineup.team.logo)) { img in
                img.resizable().scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt")
                    .foregroundColor(.white.opacity(0.6))
            }
            .frame(width: 18, height: 18)

            Text(lineup.team.name)
                .font(.caption.weight(.semibold))
                .foregroundColor(.white)

            Text(lineup.formation)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.8))
        }
    }
}

// MARK: - Hex → Color helper
private extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0 ; Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
