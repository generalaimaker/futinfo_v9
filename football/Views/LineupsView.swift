import SwiftUI

struct LineupsView: View {
    let lineups: [TeamLineup]
    let topPlayers: [PlayerStats]
    @State private var selectedTeamIndex = 0
    @State private var showingFormation = true
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                if lineups.isEmpty {
                    Text("라인업 정보가 없습니다")
                        .foregroundColor(.gray)
                        .padding()
                } else {
                    // 팀 선택 슬라이더
                    HStack(spacing: 0) {
                        ForEach(lineups.indices, id: \.self) { index in
                            Button(action: {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    selectedTeamIndex = index
                                }
                            }) {
                                HStack(spacing: 12) {
                                    AsyncImage(url: URL(string: lineups[index].team.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                            .saturation(selectedTeamIndex == index ? 1.0 : 0.7)
                                    } placeholder: {
                                        Image(systemName: "sportscourt.fill")
                                            .foregroundColor(.gray)
                                    }
                                    .frame(width: 32, height: 32)
                                    
                                    Text(lineups[index].team.name)
                                        .font(.system(.callout, design: .rounded))
                                        .fontWeight(selectedTeamIndex == index ? .semibold : .regular)
                                        .foregroundColor(selectedTeamIndex == index ? .primary : .secondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(selectedTeamIndex == index ? Color.blue.opacity(0.1) : Color.clear)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(selectedTeamIndex == index ? Color.blue.opacity(0.3) : Color.clear, lineWidth: 1)
                                )
                            }
                            .buttonStyle(PlainButtonStyle())
                            
                            if index == 0 {
                                Divider()
                                    .padding(.vertical, 8)
                            }
                        }
                    }
                    .padding(8)
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    .padding(.horizontal)
                    
                    let lineup = lineups[selectedTeamIndex]
                    
                    // 포메이션 정보
                    VStack(spacing: 12) {
                        HStack {
                            Text("포메이션")
                                .font(.headline)
                            
                            Text(lineup.formation)
                                .font(.title2.bold())
                                .foregroundColor(.blue)
                            
                            Spacer()
                            
                            Button(action: { showingFormation.toggle() }) {
                                Image(systemName: "arrow.left.and.right.square")
                                    .imageScale(.large)
                                    .foregroundColor(.blue)
                                    .rotationEffect(.degrees(showingFormation ? 180 : 0))
                            }
                        }
                        .padding(.horizontal)
                        
                        if showingFormation {
                            FormationView(lineup: lineup)
                                .frame(height: 400)
                                .padding(.vertical)
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                    
                    // 선발 선수
                    VStack(alignment: .leading, spacing: 16) {
                        Text("선발 라인업")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(spacing: 12) {
                                ForEach(lineup.startXI) { player in
                                    PlayerCard(
                                        number: player.number,
                                        name: player.name,
                                        position: player.pos ?? "",
                                        isStarter: true
                                    )
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                    
                    // 교체 선수
                    VStack(alignment: .leading, spacing: 16) {
                        Text("교체 선수")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(spacing: 12) {
                                ForEach(lineup.substitutes) { player in
                                    PlayerCard(
                                        number: player.number,
                                        name: player.name,
                                        position: player.pos ?? "",
                                        isStarter: false
                                    )
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                    
                    // 최고 평점 선수
                    if !topPlayers.isEmpty {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("최고 평점 선수")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                LazyHStack(spacing: 12) {
                                    ForEach(topPlayers.prefix(5), id: \.player.id) { playerStat in
                                        if let stats = playerStat.statistics.first,
                                           let rating = stats.games.rating {
                                            TopPlayerCard(
                                                player: playerStat.player,
                                                team: stats.team,
                                                rating: rating
                                            )
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                        .background(Color(.systemBackground))
                        .cornerRadius(16)
                        .shadow(color: Color.black.opacity(0.05), radius: 10)
                    }
                }
            }
            .padding(.vertical)
        }
    }
}

struct FormationView: View {
    let lineup: TeamLineup
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 축구장 배경
                Color(.systemGray6)
                    .overlay(
                        VStack(spacing: 0) {
                            // 필드 라인
                            Rectangle()
                                .stroke(Color.white, lineWidth: 1)
                                .overlay(
                                    VStack(spacing: 0) {
                                        // 센터 서클
                                        Circle()
                                            .stroke(Color.white, lineWidth: 1)
                                            .frame(width: 80)
                                            .position(x: geometry.size.width/2, y: geometry.size.height/2)
                                        
                                        // 페널티 에어리어
                                        ForEach([0.2, 0.8], id: \.self) { y in
                                            Rectangle()
                                                .stroke(Color.white, lineWidth: 1)
                                                .frame(width: geometry.size.width * 0.4, height: geometry.size.height * 0.2)
                                                .position(x: geometry.size.width/2, y: geometry.size.height * y)
                                        }
                                    }
                                )
                        }
                    )
                
                // 포메이션 라인
                ForEach(0..<lineup.formationArray.count, id: \.self) { row in
                    let yPosition = CGFloat(row + 1) * geometry.size.height / CGFloat(lineup.formationArray.count + 1)
                    HStack(spacing: 0) {
                        ForEach(0..<lineup.formationArray[row], id: \.self) { _ in
                            Rectangle()
                                .stroke(Color.white.opacity(0.3), lineWidth: 1)
                                .frame(width: geometry.size.width / CGFloat(lineup.formationArray[row] + 1),
                                       height: geometry.size.height / CGFloat(lineup.formationArray.count + 1))
                        }
                    }
                    .position(x: geometry.size.width / 2, y: yPosition)
                }
                
                // 선수 배치
                ForEach(lineup.startXI) { player in
                    if let gridPosition = player.gridPosition {
                        PlayerDot(
                            number: player.number,
                            name: player.name,
                            position: player.pos ?? "",
                            stats: lineup.playersByPosition[player.pos ?? ""]?.count ?? 0
                        )
                        .position(
                            x: CGFloat(gridPosition.x) * geometry.size.width / 5,
                            y: CGFloat(gridPosition.y) * geometry.size.height / 6
                        )
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .padding()
    }
}

struct PlayerDot: View {
    let number: Int
    let name: String
    let position: String
    let stats: Int
    @State private var isShowingDetails = false
    @State private var isPressed = false
    
    var body: some View {
        Button(action: { withAnimation(.spring()) { isShowingDetails.toggle() } }) {
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
        }
        .buttonStyle(PlainButtonStyle())
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
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct PlayerCard: View {
    let number: Int
    let name: String
    let position: String
    let isStarter: Bool
    @State private var isPressed = false
    
    var body: some View {
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
    
    var body: some View {
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
                Text(player.name)
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
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}
