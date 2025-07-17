import SwiftUI

struct RealtimeConnectionStatusView: View {
    @ObservedObject private var connectionManager = RealtimeConnectionManager.shared
    @ObservedObject private var communityService = SupabaseCommunityService.shared
    
    var body: some View {
        if connectionManager.showConnectionStatus {
            HStack(spacing: 8) {
                statusIcon
                
                Text(connectionManager.connectionStatusMessage)
                    .font(.caption)
                    .foregroundColor(statusColor)
                
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(statusBackgroundColor)
            .cornerRadius(8)
            .shadow(radius: 2)
            .animation(.easeInOut(duration: 0.3), value: connectionManager.showConnectionStatus)
        }
    }
    
    @ViewBuilder
    private var statusIcon: some View {
        switch communityService.realtimeConnectionStatus {
        case .connecting, .reconnecting:
            ProgressView()
                .scaleEffect(0.8)
                .progressViewStyle(CircularProgressViewStyle(tint: .orange))
            
        case .connected:
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.caption)
            
        case .error:
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .font(.caption)
            
        case .disconnected:
            Image(systemName: "wifi.slash")
                .foregroundColor(.gray)
                .font(.caption)
        }
    }
    
    private var statusColor: Color {
        switch communityService.realtimeConnectionStatus {
        case .connecting, .reconnecting:
            return .orange
        case .connected:
            return .green
        case .error:
            return .red
        case .disconnected:
            return .gray
        }
    }
    
    private var statusBackgroundColor: Color {
        switch communityService.realtimeConnectionStatus {
        case .connecting, .reconnecting:
            return Color.orange.opacity(0.1)
        case .connected:
            return Color.green.opacity(0.1)
        case .error:
            return Color.red.opacity(0.1)
        case .disconnected:
            return Color.gray.opacity(0.1)
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        RealtimeConnectionStatusView()
        
        // Preview different states
        VStack(spacing: 8) {
            Text("Preview States:")
                .font(.headline)
            
            mockStatusView(status: .connecting, message: "연결 중...")
            mockStatusView(status: .connected, message: "실시간 연결됨")
            mockStatusView(status: .reconnecting, message: "재연결 중...")
            mockStatusView(status: .error("네트워크 오류"), message: "오류: 네트워크 오류")
            mockStatusView(status: .disconnected, message: "연결 안됨")
        }
    }
    .padding()
}

private func mockStatusView(status: RealtimeConnectionStatus, message: String) -> some View {
    HStack(spacing: 8) {
        switch status {
        case .connecting, .reconnecting:
            ProgressView()
                .scaleEffect(0.8)
                .progressViewStyle(CircularProgressViewStyle(tint: .orange))
        case .connected:
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.caption)
        case .error:
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .font(.caption)
        case .disconnected:
            Image(systemName: "wifi.slash")
                .foregroundColor(.gray)
                .font(.caption)
        }
        
        Text(message)
            .font(.caption)
            .foregroundColor({
                switch status {
                case .connecting, .reconnecting: return .orange
                case .connected: return .green
                case .error: return .red
                case .disconnected: return .gray
                }
            }())
        
        Spacer()
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .background({
        switch status {
        case .connecting, .reconnecting: return Color.orange.opacity(0.1)
        case .connected: return Color.green.opacity(0.1)
        case .error: return Color.red.opacity(0.1)
        case .disconnected: return Color.gray.opacity(0.1)
        }
    }())
    .cornerRadius(8)
}