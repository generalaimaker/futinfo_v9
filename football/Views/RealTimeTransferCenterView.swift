import SwiftUI

// MARK: - 간소화된 실시간 이적센터 뷰

struct RealTimeTransferCenterView: View {
    @StateObject private var transferService = RealTransferDataService.shared
    @State private var selectedTab = 0
    @State private var showingPlayerSearch = false
    @State private var refreshTimer: Timer?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // 헤더
                transferCenterHeader
                
                // 탭 선택
                transferTabs
                
                // 콘텐츠
                TabView(selection: $selectedTab) {
                    // 실시간 이적
                    liveTransfersView
                        .tag(0)
                    
                    // TOP 이적
                    topTransfersView
                        .tag(1)
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .navigationTitle("실시간 이적센터")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { refreshAllData() }) {
                        Image(systemName: "arrow.clockwise")
                            .rotationEffect(.degrees(transferService.isLoading ? 360 : 0))
                            .animation(transferService.isLoading ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: transferService.isLoading)
                    }
                }
            }
            .onAppear {
                startAutoRefresh()
                Task {
                    await loadInitialData()
                }
            }
            .onDisappear {
                stopAutoRefresh()
            }
        }
    }
    
    // MARK: - 헤더
    
    private var transferCenterHeader: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("실시간 이적센터")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    if let lastUpdate = transferService.lastUpdateTime {
                        Text("마지막 업데이트: \(lastUpdate, formatter: timeFormatter)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                            .opacity(0.8)
                        
                        Text("\(transferService.latestTransfers.count)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                    
                    Text("🔥 실시간 이적")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if transferService.isLoading {
                VStack(spacing: 8) {
                    ProgressView()
                        .scaleEffect(0.8)
                    
                    Text("데이터 업데이트 중...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.vertical, 8)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(UIColor.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 1, x: 0, y: 1)
    }
    
    // MARK: - 탭
    
    private var transferTabs: some View {
        HStack(spacing: 20) {
            ForEach(Array(tabTitles.enumerated()), id: \.offset) { index, title in
                Button(action: { selectedTab = index }) {
                    VStack(spacing: 4) {
                        Text(title)
                            .font(.subheadline)
                            .fontWeight(selectedTab == index ? .semibold : .regular)
                            .foregroundColor(selectedTab == index ? .blue : .secondary)
                        
                        Rectangle()
                            .fill(selectedTab == index ? Color.blue : Color.clear)
                            .frame(height: 2)
                    }
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(UIColor.systemBackground))
    }
    
    private var tabTitles: [String] {
        ["실시간 이적", "TOP 이적"]
    }
    
    // MARK: - 실시간 이적 뷰
    
    private var liveTransfersView: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(transferService.latestTransfers) { transfer in
                    TransferCard(transfer: transfer)
                }
            }
            .padding()
        }
        .refreshable {
            await transferService.fetchRealTimeTransferData()
        }
    }
    
    // MARK: - TOP 이적 뷰
    
    private var topTransfersView: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(Array(transferService.topTransfersByFee.enumerated()), id: \.element.id) { index, transfer in
                    TopTransferCard(transfer: transfer, rank: index + 1)
                }
            }
            .padding()
        }
        .refreshable {
            await transferService.fetchRealTimeTransferData()
        }
    }
    
    // MARK: - 헬퍼 메서드
    
    private func loadInitialData() async {
        await transferService.fetchRealTimeTransferData()
    }
    
    private func refreshAllData() {
        Task {
            await loadInitialData()
        }
    }
    
    private func startAutoRefresh() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { _ in
            Task { @MainActor in
                await transferService.fetchRealTimeTransferData()
            }
        }
    }
    
    private func stopAutoRefresh() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
    
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }
}

// MARK: - 이적 카드

struct TransferCard: View {
    let transfer: RealTransferData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 헤더
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(transfer.playerName)
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Text("\(transfer.position) • \(transfer.age)세 • \(transfer.nationality)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 4) {
                        if isVeryRecent {
                            Text("NEW")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.red)
                                .cornerRadius(4)
                        }
                        
                        Text(reliabilityBadge)
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(reliabilityColor)
                    }
                    
                    Text(transfer.status)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(statusColor)
                }
            }
            
            // 이적 정보
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("FROM")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Text(transfer.fromClub)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                
                Spacer()
                
                Image(systemName: "arrow.right")
                    .foregroundColor(.blue)
                    .font(.title2)
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("TO")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Text(transfer.toClub)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
            }
            
            // 이적료 및 기타 정보
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("이적료")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Text(transfer.transferFee)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(isHighValue ? .green : .primary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("계약기간")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    
                    Text(transfer.contractLength)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
            }
            
            // 소스 및 시간
            HStack {
                Text(transfer.source)
                    .font(.caption2)
                    .foregroundColor(.blue)
                
                Spacer()
                
                Text(formattedDate)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
    
    private var reliabilityBadge: String {
        switch transfer.reliability {
        case 90...100: return "🟢 매우 신뢰"
        case 70...89: return "🔵 신뢰"
        case 50...69: return "🟡 보통"
        default: return "🔴 낮음"
        }
    }
    
    private var reliabilityColor: Color {
        switch transfer.reliability {
        case 90...100: return .green
        case 70...89: return .blue
        case 50...69: return .orange
        default: return .red
        }
    }
    
    private var statusColor: Color {
        switch transfer.status {
        case "완료": return .green
        case "진행중": return .blue
        case "루머": return .orange
        default: return .secondary
        }
    }
    
    private var isVeryRecent: Bool {
        Date().timeIntervalSince(transfer.transferDate) < 3600 // 1시간 이내
    }
    
    private var isHighValue: Bool {
        let numericValue = extractNumericValue(from: transfer.transferFee)
        return numericValue >= 50.0 // 50M 이상
    }
    
    private var formattedDate: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: transfer.transferDate, relativeTo: Date())
    }
    
    private func extractNumericValue(from feeString: String) -> Double {
        let pattern = #"(\d+(?:\.\d+)?)"#
        
        if let regex = try? NSRegularExpression(pattern: pattern, options: []),
           let match = regex.firstMatch(in: feeString, options: [], range: NSRange(feeString.startIndex..., in: feeString)),
           let range = Range(match.range(at: 1), in: feeString),
           let value = Double(feeString[range]) {
            return value
        }
        
        return 0.0
    }
}

// MARK: - TOP 이적 카드

struct TopTransferCard: View {
    let transfer: RealTransferData
    let rank: Int
    
    var body: some View {
        HStack(spacing: 16) {
            // 순위
            ZStack {
                Circle()
                    .fill(rankColor)
                    .frame(width: 40, height: 40)
                
                Text("\(rank)")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            
            // 이적 정보
            VStack(alignment: .leading, spacing: 4) {
                Text(transfer.playerName)
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Text("\(transfer.fromClub) → \(transfer.toClub)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text(transfer.transferFee)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.green)
            }
            
            Spacer()
            
            // 상태
            VStack(alignment: .trailing, spacing: 4) {
                Text(transfer.status)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(statusColor)
                
                Text(formattedDate)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
    
    private var rankColor: Color {
        switch rank {
        case 1: return .yellow
        case 2: return .gray
        case 3: return .brown
        default: return .blue
        }
    }
    
    private var statusColor: Color {
        switch transfer.status {
        case "완료": return .green
        case "진행중": return .blue
        case "루머": return .orange
        default: return .secondary
        }
    }
    
    private var formattedDate: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: transfer.transferDate, relativeTo: Date())
    }
}

#Preview {
    RealTimeTransferCenterView()
}