import SwiftUI

struct TimelineEventCard: View {
    let event: FixtureEvent
    let isHome: Bool
    
    var body: some View {
        HStack {
            if !isHome {
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    // 이벤트 아이콘
                    Text(event.icon)
                    
                    // 선수 이름과 이벤트 정보
                    VStack(alignment: .leading, spacing: 2) {
                        switch event.eventCategory {
                        case .goal:
                            if let playerName = event.player.name {
                                Text(playerName)
                                    .font(.callout)
                                    .fontWeight(.medium)
                            }
                            if let assist = event.assist, let assistName = assist.name {
                                Text("어시스트: \(assistName)")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                        case .substitution:
                            if let assist = event.assist, let assistName = assist.name {
                                HStack(spacing: 4) {
                                    Text(assistName)
                                    Text("IN")
                                        .foregroundColor(.green)
                                }
                                .font(.callout)
                                .fontWeight(.medium)
                            }
                            if let playerName = event.player.name {
                                HStack(spacing: 4) {
                                    Text(playerName)
                                    Text("OUT")
                                        .foregroundColor(.red)
                                }
                                .font(.callout)
                                .foregroundColor(.gray)
                            }
                            
                        case .card:
                            if let playerName = event.player.name {
                                Text(playerName)
                                    .font(.callout)
                                    .fontWeight(.medium)
                            }
                            
                        case .var:
                            if let playerName = event.player.name {
                                Text(playerName)
                                    .font(.callout)
                                    .fontWeight(.medium)
                            }
                            Text("VAR: \(event.detail)")
                                .font(.caption)
                                .foregroundColor(.blue)
                            
                        case .other:
                            if let playerName = event.player.name {
                                Text(playerName)
                                    .font(.callout)
                                    .fontWeight(.medium)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(backgroundColor)
            .cornerRadius(8)
            
            if isHome {
                Spacer()
            }
        }
    }
    
    private var backgroundColor: Color {
        switch event.eventCategory {
        case .goal:
            return Color.green.opacity(0.1)
        case .card(let type):
            return type == .yellow ? Color.yellow.opacity(0.1) : Color.red.opacity(0.1)
        case .substitution:
            return Color.orange.opacity(0.1)
        case .var:
            return Color.blue.opacity(0.1)
        case .other:
            return Color(.systemGray6)
        }
    }
}
