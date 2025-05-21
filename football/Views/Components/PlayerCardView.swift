import SwiftUI

struct LineupPlayerCardView: View {
    let player: LineupPlayer
    let getLastName: (String) -> String
    var rating: Double = 0.0
    var goals: Int = 0
    
    var body: some View {
        VStack(spacing: 1) {
            // 선수 평점
            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.8))
                    .frame(width: 24, height: 24)
                Text(String(format: "%.1f", rating))
                    .font(.system(.caption2, design: .rounded).weight(.bold))
                    .foregroundColor(.white)
            }
            .offset(y: 6)
            .zIndex(1)
            
            // 선수 프로필 원
            ZStack {
                Circle()
                    .fill(Color.white)
                    .frame(width: 50, height: 50)
                    .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
                
                // 선수 번호
                Text("\(player.number)")
                    .font(.system(.body, design: .rounded).weight(.bold))
                    .foregroundColor(.black)
            }
            
            // 골 아이콘 (골을 넣은 선수만)
            if goals > 0 {
                HStack(spacing: 1) {
                    Circle()
                        .fill(Color.black.opacity(0.8))
                        .frame(width: 16, height: 16)
                        .overlay(
                            Image(systemName: "soccerball")
                                .font(.system(size: 8))
                                .foregroundColor(.white)
                        )
                    
                    if goals > 1 {
                        Text("\(goals)")
                            .font(.system(.caption2, design: .rounded).weight(.bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 3)
                            .padding(.vertical, 1)
                            .background(Color.black.opacity(0.8))
                            .cornerRadius(6)
                    }
                }
                .offset(y: -6)
            }
            
            // 선수 이름
            Text("\(getLastName(player.name))")
                .font(.system(.caption2, design: .rounded).weight(.semibold))
                .foregroundColor(.white)
                .lineLimit(1)
                .padding(.top, 1)
        }
        .frame(width: 60)
    }
}

// TeamProfileView에서 사용하는 PlayerCardView 구현
struct PlayerCardView: View {
    let player: PlayerInfo
    var onPlayerTap: (Int) -> Void = { _ in }  // 선수 ID를 전달하는 클로저 추가
    
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
                .frame(width: 70, height: 70)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(Color.blue.opacity(0.3), lineWidth: 2)
                )
                .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
                
                // 선수 이름
                Text(player.name ?? "")
                    .font(.system(.callout, design: .rounded))
                    .fontWeight(.medium)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(height: 40)
                
                // 국적
                if let nationality = player.nationality {
                    Text(nationality)
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 100)
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
