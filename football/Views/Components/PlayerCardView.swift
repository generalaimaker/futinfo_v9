import SwiftUI
import Foundation

struct PlayerCardView: View {
    let player: PlayerInfo
    
    var body: some View {
        VStack(spacing: 8) {
            AsyncImage(url: URL(string: player.photo ?? "")) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Color.gray.opacity(0.3)
            }
            .frame(width: 80, height: 80)
            .clipShape(Circle())
            
            VStack(spacing: 2) {
                Text(player.name)
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(1)
                
                if let age = player.age {
                    Text("\(age)세")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 100)
        }
    }
}