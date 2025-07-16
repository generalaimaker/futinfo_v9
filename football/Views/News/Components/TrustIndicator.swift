import SwiftUI

struct TrustIndicator: View {
    let source: String
    
    var trustLevel: TrustLevel {
        if source.contains("[OFFICIAL]") {
            return .official
        } else if source.contains("[Tier 1]") || source.contains("Fabrizio Romano") {
            return .tier1
        } else if source.contains("✓") {
            return .verified
        } else if ["BBC Sport", "Sky Sports", "The Guardian", "Reuters", "UEFA", "FIFA", "Premier League"].contains(where: source.contains) {
            return .trusted
        } else {
            return .standard
        }
    }
    
    enum TrustLevel {
        case official
        case tier1
        case verified
        case trusted
        case standard
        
        var color: Color {
            switch self {
            case .official: return .green
            case .tier1: return .blue
            case .verified: return .purple
            case .trusted: return .orange
            case .standard: return .gray
            }
        }
        
        var icon: String {
            switch self {
            case .official: return "checkmark.seal.fill"
            case .tier1: return "star.circle.fill"
            case .verified: return "checkmark.circle.fill"
            case .trusted: return "shield.fill"
            case .standard: return "globe"
            }
        }
        
        var label: String {
            switch self {
            case .official: return "공식"
            case .tier1: return "Tier 1"
            case .verified: return "검증됨"
            case .trusted: return "신뢰"
            case .standard: return ""
            }
        }
        
        var description: String {
            switch self {
            case .official: return "공식 발표 또는 클럽 확인"
            case .tier1: return "최고 신뢰도 기자/매체"
            case .verified: return "검증된 출처"
            case .trusted: return "신뢰할 수 있는 매체"
            case .standard: return "일반 뉴스"
            }
        }
    }
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: trustLevel.icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(trustLevel.color)
            
            if !trustLevel.label.isEmpty {
                Text(trustLevel.label)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(trustLevel.color)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(trustLevel.color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct DetailedTrustIndicator: View {
    let source: String
    @State private var showingInfo = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                TrustIndicator(source: source)
                
                Button(action: { showingInfo.toggle() }) {
                    Image(systemName: "info.circle")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            if showingInfo {
                VStack(alignment: .leading, spacing: 4) {
                    Text("신뢰도 정보")
                        .font(.caption)
                        .fontWeight(.semibold)
                    
                    Text(TrustIndicator(source: source).trustLevel.description)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    if source.contains("•") {
                        Text("기자: \(source.components(separatedBy: "•").last?.trimmingCharacters(in: .whitespaces) ?? "")")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: showingInfo)
    }
}

// MARK: - Transfer News Trust Badge
struct TransferNewsTrustBadge: View {
    let title: String
    let source: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Title with special markers
            HStack(alignment: .top, spacing: 6) {
                if title.hasPrefix("🚨") {
                    Text("🚨")
                        .font(.title3)
                }
                
                if title.hasPrefix("✅") {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.title3)
                        .foregroundColor(.green)
                }
                
                Text(title.replacingOccurrences(of: "🚨", with: "")
                        .replacingOccurrences(of: "✅", with: "")
                        .trimmingCharacters(in: .whitespaces))
                    .font(.headline)
                    .lineLimit(2)
            }
            
            // Trust indicator
            HStack {
                TrustIndicator(source: source)
                
                Spacer()
                
                // Additional info
                if source.contains("Fabrizio Romano") {
                    Label("HERE WE GO!", systemImage: "megaphone.fill")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                }
            }
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        TrustIndicator(source: "BBC Sport ✓")
        TrustIndicator(source: "Sky Sports [Tier 1]")
        TrustIndicator(source: "Official Club [OFFICIAL]")
        TrustIndicator(source: "The Guardian • Fabrizio Romano")
        TrustIndicator(source: "Unknown Source")
        
        Divider()
        
        DetailedTrustIndicator(source: "BBC Sport ✓ • David Ornstein")
        
        Divider()
        
        TransferNewsTrustBadge(
            title: "🚨 Manchester United close to signing new striker",
            source: "Sky Sports [Tier 1] • Fabrizio Romano"
        )
        .padding()
    }
    .padding()
}