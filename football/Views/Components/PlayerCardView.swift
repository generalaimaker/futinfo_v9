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
