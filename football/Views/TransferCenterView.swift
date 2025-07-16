import SwiftUI

struct TransferCenterView: View {
    @StateObject private var viewModel = TransferCenterViewModel()
    @State private var selectedTransferType: TransferType = .confirmed
    @State private var selectedLeague: EuropeanLeague = .all
    @State private var selectedReliability: TransferReliabilityTier? = nil
    @State private var showingNotificationSettings = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // 이적 시장 현황 카드
                    TransferMarketStatusCard(transfers: viewModel.transfers)
                    
                    // 이적 유형 필터
                    TransferTypeFilterView(selectedType: $selectedTransferType)
                    
                    // 신뢰도 필터
                    ReliabilityFilterView(selectedReliability: $selectedReliability)
                    
                    // 리그 필터
                    LeagueFilterView(selectedLeague: $selectedLeague) { _ in
                        // 선택된 리그가 변경되면 자동으로 업데이트됨
                    }
                    
                    // 이적 뉴스 리스트
                    TransferNewsListView(
                        transfers: viewModel.filteredTransfers(
                            type: selectedTransferType,
                            league: selectedLeague,
                            reliability: selectedReliability
                        )
                    )
                }
                .padding(.horizontal)
            }
            .navigationTitle("⚡ 이적 센터")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingNotificationSettings = true }) {
                        Image(systemName: "bell")
                    }
                }
            }
            .sheet(isPresented: $showingNotificationSettings) {
                TransferNotificationSettingsView()
            }
            .refreshable {
                await viewModel.refreshTransfers()
            }
        }
        .task {
            await viewModel.loadTransfers()
        }
    }
}

// MARK: - 이적 시장 현황 카드
struct TransferMarketStatusCard: View {
    let transfers: [TransferNews]
    
    private var confirmedCount: Int {
        transfers.filter { $0.status == .confirmed }.count
    }
    
    private var negotiatingCount: Int {
        transfers.filter { $0.status == .negotiating }.count
    }
    
    private var rumorCount: Int {
        transfers.filter { $0.status == .rumor }.count
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.title2)
                    .foregroundColor(.green)
                
                Text("이적 시장 현황")
                    .font(.headline)
                
                Spacer()
                
                if !transfers.isEmpty {
                    Text("LIVE")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red)
                        .cornerRadius(4)
                }
            }
            
            HStack(spacing: 20) {
                TransferStatItem(title: "확정", count: confirmedCount, color: .green)
                TransferStatItem(title: "협상 중", count: negotiatingCount, color: .orange)
                TransferStatItem(title: "루머", count: rumorCount, color: .gray)
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

struct TransferStatItem: View {
    let title: String
    let count: Int
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - 이적 유형 필터
struct TransferTypeFilterView: View {
    @Binding var selectedType: TransferType
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(TransferType.allCases, id: \.self) { type in
                    TransferTypeButton(
                        type: type,
                        isSelected: selectedType == type
                    ) {
                        selectedType = type
                    }
                }
            }
        }
    }
}

struct TransferTypeButton: View {
    let type: TransferType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: type.icon)
                    .font(.caption)
                
                Text(type.displayName)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isSelected ? type.color : Color.gray.opacity(0.1))
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - 신뢰도 필터
struct ReliabilityFilterView: View {
    @Binding var selectedReliability: TransferReliabilityTier?
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // 전체 보기
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
                
                ForEach([TransferReliabilityTier.official, .tierOne, .verified, .reliable], id: \.self) { tier in
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
        }
    }
}

// MARK: - 이적 뉴스 리스트
struct TransferNewsListView: View {
    let transfers: [TransferNews]
    
    var body: some View {
        LazyVStack(spacing: 12) {
            ForEach(transfers) { transfer in
                TransferNewsCard(transfer: transfer)
            }
        }
    }
}

struct TransferNewsCard: View {
    let transfer: TransferNews
    @Environment(\.openURL) private var openURL
    
    var body: some View {
        Button(action: {
            if let url = URL(string: transfer.url) {
                openURL(url)
            }
        }) {
            VStack(alignment: .leading, spacing: 12) {
                // 상태 및 신뢰도 배지
                HStack {
                    TransferCenterStatusBadge(status: transfer.status)
                    
                    // 신뢰도 표시 추가
                    if let reliability = transfer.reliability {
                        TransferReliabilityBadge(tier: reliability)
                    }
                    
                    Spacer()
                    
                    Text(transfer.fee ?? "미정")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
                
                // 선수 정보
                HStack(spacing: 12) {
                    // 선수 이미지 (플레이스홀더)
                    Circle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(width: 50, height: 50)
                        .overlay(
                            Text(transfer.playerName.prefix(2))
                                .font(.headline)
                                .foregroundColor(.gray)
                        )
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(transfer.playerName)
                            .font(.headline)
                            .lineLimit(1)
                        
                        HStack(spacing: 4) {
                            Text(transfer.fromClub)
                            Image(systemName: "arrow.right")
                                .font(.caption)
                            Text(transfer.toClub)
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                
                // 뉴스 제목
                Text(transfer.title)
                    .font(.subheadline)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                
                // 메타 정보
                HStack {
                    Text(transfer.source)
                        .font(.caption)
                        .foregroundColor(.blue)
                    
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(timeAgoString(from: transfer.publishedAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                }
            }
            .padding()
            .background(Color(UIColor.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 1, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func timeAgoString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct TransferCenterStatusBadge: View {
    let status: TransferCenterStatus
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
                .font(.caption2)
            
            Text(status.displayName)
                .font(.caption2)
                .fontWeight(.bold)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(status.color)
        .cornerRadius(6)
    }
}

// MARK: - 신뢰도 배지
struct TransferReliabilityBadge: View {
    let tier: TransferReliabilityTier
    
    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: tier.icon)
                .font(.caption2)
            
            Text(tier.displayName)
                .font(.caption2)
                .fontWeight(.semibold)
        }
        .foregroundColor(tier == .unreliable ? .gray : .white)
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(tier.color)
        .cornerRadius(4)
    }
}

// MARK: - 알림 설정 뷰
struct TransferNotificationSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("transfer_notifications_enabled") private var notificationsEnabled = true
    @AppStorage("notify_confirmed_transfers") private var notifyConfirmed = true
    @AppStorage("notify_negotiations") private var notifyNegotiations = false
    @AppStorage("notify_rumors") private var notifyRumors = false
    @State private var selectedTeams: Set<String> = []
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    Toggle("이적 알림 받기", isOn: $notificationsEnabled)
                        .tint(.blue)
                }
                
                if notificationsEnabled {
                    Section(header: Text("알림 유형")) {
                        Toggle("확정 이적", isOn: $notifyConfirmed)
                        Toggle("협상 중", isOn: $notifyNegotiations)
                        Toggle("이적 루머", isOn: $notifyRumors)
                    }
                    
                    Section(header: Text("관심 팀 알림")) {
                        ForEach(["Manchester United", "Real Madrid", "Barcelona", "Bayern Munich"], id: \.self) { team in
                            HStack {
                                Text(team)
                                Spacer()
                                if selectedTeams.contains(team) {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                if selectedTeams.contains(team) {
                                    selectedTeams.remove(team)
                                } else {
                                    selectedTeams.insert(team)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("이적 알림 설정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("완료") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Data Models
enum TransferType: String, CaseIterable {
    case all = "all"
    case confirmed = "confirmed"
    case negotiating = "negotiating"
    case rumor = "rumor"
    
    var displayName: String {
        switch self {
        case .all: return "전체"
        case .confirmed: return "✅ 확정"
        case .negotiating: return "💬 협상중"
        case .rumor: return "🗣️ 루머"
        }
    }
    
    var icon: String {
        switch self {
        case .all: return "list.bullet"
        case .confirmed: return "checkmark.circle.fill"
        case .negotiating: return "bubble.left.and.bubble.right"
        case .rumor: return "questionmark.circle"
        }
    }
    
    var color: Color {
        switch self {
        case .all: return .blue
        case .confirmed: return .green
        case .negotiating: return .orange
        case .rumor: return .gray
        }
    }
}

enum TransferCenterStatus: String {
    case confirmed = "confirmed"
    case negotiating = "negotiating"
    case rumor = "rumor"
    case failed = "failed"
    
    var displayName: String {
        switch self {
        case .confirmed: return "확정"
        case .negotiating: return "협상중"
        case .rumor: return "루머"
        case .failed: return "무산"
        }
    }
    
    var icon: String {
        switch self {
        case .confirmed: return "checkmark.circle.fill"
        case .negotiating: return "arrow.left.arrow.right"
        case .rumor: return "questionmark"
        case .failed: return "xmark.circle"
        }
    }
    
    var color: Color {
        switch self {
        case .confirmed: return .green
        case .negotiating: return .orange
        case .rumor: return .gray
        case .failed: return .red
        }
    }
}

struct TransferNews: Identifiable {
    let id = UUID()
    let playerName: String
    let fromClub: String
    let toClub: String
    let fee: String?
    let status: TransferCenterStatus
    let title: String
    let source: String
    let url: String
    let publishedAt: Date
    let league: EuropeanLeague
    let reliability: TransferReliabilityTier?
    let reliabilityScore: Int?
}

// MARK: - View Model
@MainActor
class TransferCenterViewModel: ObservableObject {
    @Published var transfers: [TransferNews] = []
    @Published var isLoading = false
    
    private let newsService = NewsService.shared
    
    func loadTransfers() async {
        isLoading = true
        
        do {
            // 뉴스 서비스에서 이적 관련 뉴스 가져오기
            let newsArticles = try await newsService.fetchNews(category: .transfer)
            
            // 이적 뉴스로 변환
            let transferNews = newsArticles.compactMap { article in
                parseTransferNews(article)
            }
            
            await MainActor.run {
                self.transfers = transferNews.sorted { $0.publishedAt > $1.publishedAt }
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.isLoading = false
            }
        }
    }
    
    
    private func parseTransferNews(_ article: NewsArticle) -> TransferNews? {
        // 신뢰도 평가
        let (reliabilityTier, reliabilityScore) = TransferReliabilityEvaluator.evaluateReliability(
            source: article.source,
            title: article.title,
            description: article.summary
        )
        
        // 신뢰도가 너무 낮은 뉴스는 필터링
        if reliabilityTier == .unreliable && reliabilityScore < 30 {
            return nil
        }
        
        // 상태 판단 (신뢰도 기반)
        let status: TransferCenterStatus
        let stage = TransferReliabilityEvaluator.determineTransferStage(
            tier: reliabilityTier,
            title: article.title,
            description: article.summary
        )
        
        switch stage {
        case .completed:
            status = .confirmed
        case .termsAgreed, .medicalPending, .advanced:
            status = .negotiating
        case .failed:
            status = .failed
        default:
            status = .rumor
        }
        
        // 리그 판단
        let league = detectLeague(from: article.title + " " + article.summary)
        
        return TransferNews(
            playerName: extractPlayerName(from: article.title) ?? "Unknown",
            fromClub: "",
            toClub: "",
            fee: extractFee(from: article.title + " " + article.summary),
            status: status,
            title: article.title,
            source: article.source,
            url: article.url,
            publishedAt: article.publishedAt,
            league: league,
            reliability: reliabilityTier,
            reliabilityScore: reliabilityScore
        )
    }
    
    private func extractPlayerName(from text: String) -> String? {
        // 간단한 휴리스틱: 첫 번째 대문자로 시작하는 연속된 단어들
        let pattern = "([A-Z][a-z]+ [A-Z][a-z]+)"
        if let range = text.range(of: pattern, options: .regularExpression) {
            return String(text[range])
        }
        return nil
    }
    
    private func extractFee(from text: String) -> String? {
        // 금액 패턴 찾기
        let patterns = ["€[0-9]+[MmKk]", "£[0-9]+[MmKk]", "\\$[0-9]+[MmKk]"]
        for pattern in patterns {
            if let range = text.range(of: pattern, options: .regularExpression) {
                return String(text[range])
            }
        }
        return nil
    }
    
    private func detectLeague(from text: String) -> EuropeanLeague {
        let lowerText = text.lowercased()
        
        if lowerText.contains("premier league") || lowerText.contains("epl") ||
           lowerText.contains("manchester") || lowerText.contains("liverpool") ||
           lowerText.contains("arsenal") || lowerText.contains("chelsea") {
            return .premierLeague
        } else if lowerText.contains("la liga") || lowerText.contains("barcelona") ||
                  lowerText.contains("real madrid") || lowerText.contains("atletico") {
            return .laLiga
        } else if lowerText.contains("serie a") || lowerText.contains("juventus") ||
                  lowerText.contains("milan") || lowerText.contains("inter") {
            return .serieA
        } else if lowerText.contains("bundesliga") || lowerText.contains("bayern") ||
                  lowerText.contains("dortmund") || lowerText.contains("leipzig") {
            return .bundesliga
        } else if lowerText.contains("ligue 1") || lowerText.contains("psg") ||
                  lowerText.contains("monaco") || lowerText.contains("lyon") {
            return .ligue1
        }
        
        return .all
    }
    
    func refreshTransfers() async {
        await loadTransfers()
    }
    
    func filteredTransfers(type: TransferType, league: EuropeanLeague, reliability: TransferReliabilityTier? = nil) -> [TransferNews] {
        var filtered = transfers
        
        // 타입 필터
        if type != .all {
            filtered = filtered.filter { transfer in
                switch type {
                case .confirmed:
                    return transfer.status == .confirmed
                case .negotiating:
                    return transfer.status == .negotiating
                case .rumor:
                    return transfer.status == .rumor
                case .all:
                    return true
                }
            }
        }
        
        // 리그 필터
        if league != .all {
            filtered = filtered.filter { $0.league == league }
        }
        
        // 신뢰도 필터
        if let reliability = reliability {
            filtered = filtered.filter { transfer in
                if let transferReliability = transfer.reliability {
                    return transferReliability.rawValue >= reliability.rawValue
                }
                return false
            }
        }
        
        return filtered
    }
}

// Array extension은 이미 다른 파일에 정의되어 있음

#Preview {
    TransferCenterView()
}