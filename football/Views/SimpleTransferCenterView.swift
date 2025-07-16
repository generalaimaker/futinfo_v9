import SwiftUI

struct SimpleTransferCenterView: View {
    @StateObject private var viewModel = TransferCenterViewModel()
    @State private var selectedReliability: TransferReliabilityTier? = nil
    @State private var showOnlyReliable = true
    @State private var expandedTransferID: UUID?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 헤더
                VStack(spacing: 8) {
                    HStack {
                        Image(systemName: "arrow.left.arrow.right.circle.fill")
                            .font(.largeTitle)
                            .foregroundColor(.blue)
                        
                        Text("이적 센터")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                    }
                    
                    Text("신뢰할 수 있는 이적 소식만 모았습니다")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                
                // 신뢰도 필터
                VStack(spacing: 12) {
                    Toggle(isOn: $showOnlyReliable) {
                        Label("공신력 있는 소식만 보기", systemImage: "checkmark.shield")
                            .font(.subheadline)
                    }
                    .tint(.blue)
                    .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            Button(action: { selectedReliability = nil }) {
                                Text("모든 신뢰도")
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .foregroundColor(selectedReliability == nil ? .white : .primary)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(selectedReliability == nil ? Color.blue : Color.gray.opacity(0.1))
                                    )
                            }
                            
                            ForEach([TransferReliabilityTier.official, .tierOne, .verified], id: \.self) { tier in
                                Button(action: { selectedReliability = tier }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: tier.icon)
                                            .font(.caption2)
                                        Text(tier.displayName)
                                            .font(.caption)
                                            .fontWeight(.medium)
                                    }
                                    .foregroundColor(selectedReliability == tier ? .white : .primary)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(
                                        RoundedRectangle(cornerRadius: 12)
                                            .fill(selectedReliability == tier ? tier.color : Color.gray.opacity(0.1))
                                    )
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                
                // 메인 콘텐츠
                if viewModel.isLoading {
                    ProgressView("이적 소식 불러오는 중...")
                        .padding(50)
                } else {
                    VStack(spacing: 20) {
                        ForEach(filteredTransfers) { transfer in
                            TransferNewsCardEnhanced(
                                transfer: transfer,
                                isExpanded: expandedTransferID == transfer.id,
                                onTap: {
                                    withAnimation(.spring()) {
                                        if expandedTransferID == transfer.id {
                                            expandedTransferID = nil
                                        } else {
                                            expandedTransferID = transfer.id
                                        }
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .refreshable {
            await viewModel.refreshTransfers()
        }
        .task {
            await viewModel.loadTransfers()
        }
    }
    
    var filteredTransfers: [TransferNews] {
        var filtered = viewModel.transfers
        
        // 신뢰도 필터
        if showOnlyReliable {
            filtered = filtered.filter { transfer in
                if let reliability = transfer.reliability {
                    return reliability.rawValue >= TransferReliabilityTier.verified.rawValue
                }
                return false
            }
        }
        
        if let selectedReliability = selectedReliability {
            filtered = filtered.filter { transfer in
                if let reliability = transfer.reliability {
                    return reliability == selectedReliability
                }
                return false
            }
        }
        
        return filtered
    }
}

// MARK: - 향상된 이적 뉴스 카드
struct TransferNewsCardEnhanced: View {
    let transfer: TransferNews
    let isExpanded: Bool
    let onTap: () -> Void
    @Environment(\.openURL) private var openURL
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 메인 정보
            HStack(spacing: 12) {
                // 선수 아바타
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 50, height: 50)
                    
                    Text(transfer.playerName.prefix(2).uppercased())
                        .font(.system(size: 20))
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(transfer.playerName)
                        .font(.headline)
                        .lineLimit(1)
                    
                    HStack(spacing: 6) {
                        Text(transfer.fromClub.isEmpty ? "Unknown" : transfer.fromClub)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Image(systemName: "arrow.right")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        Text(transfer.toClub.isEmpty ? "Unknown" : transfer.toClub)
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    if let fee = transfer.fee {
                        Text(fee)
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    
                    Text(simpleRelativeTime(from: transfer.publishedAt))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // 신뢰도 및 상태
            HStack(spacing: 8) {
                TransferCenterStatusBadge(status: transfer.status)
                
                if let reliability = transfer.reliability {
                    TransferReliabilityBadge(tier: reliability)
                }
                
                Spacer()
                
                // 소스
                Text(transfer.source)
                    .font(.caption2)
                    .foregroundColor(.blue)
                    .lineLimit(1)
            }
            
            // 확장된 콘텐츠
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Divider()
                    
                    Text(transfer.title)
                        .font(.subheadline)
                        .fixedSize(horizontal: false, vertical: true)
                    
                    // 원문 보기 버튼
                    Button(action: {
                        if let url = URL(string: transfer.url) {
                            openURL(url)
                        }
                    }) {
                        Label("원문 보기", systemImage: "safari")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                    .padding(.top, 4)
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(UIColor.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
        )
        .onTapGesture(perform: onTap)
    }
}

// Helper function
private func simpleRelativeTime(from date: Date) -> String {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .abbreviated
    return formatter.localizedString(for: date, relativeTo: Date())
}

#Preview {
    SimpleTransferCenterView()
}