import SwiftUI

struct EnhancedTransferCenterView: View {
    @StateObject private var viewModel = EnhancedTransferViewModel()
    @State private var selectedFilter: TransferFilter = .all
    @State private var showOnlyReliable = true
    @State private var expandedTransferID: UUID?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // 헤더 섹션
                TransferCenterHeaderView()
                
                // 핫 이슈 배너 (가장 화제의 이적)
                if let hotTransfer = viewModel.hotTransfer {
                    HotTransferBanner(transfer: hotTransfer)
                        .padding(.horizontal)
                }
                
                // 필터 섹션
                TransferFilterSection(
                    selectedFilter: $selectedFilter,
                    showOnlyReliable: $showOnlyReliable
                )
                
                // 메인 콘텐츠
                if viewModel.isLoading {
                    ProgressView("이적 소식 불러오는 중...")
                        .padding(50)
                } else {
                    // 카테고리별 이적 뉴스
                    VStack(spacing: 24) {
                        // 공식 발표
                        if !viewModel.officialTransfers.isEmpty {
                            EnhancedTransferSection(
                                title: "✅ 공식 발표",
                                icon: "checkmark.seal.fill",
                                transfers: viewModel.officialTransfers,
                                expandedID: $expandedTransferID,
                                accentColor: .green
                            )
                        }
                        
                        // 메디컬 진행/임박
                        if !viewModel.medicalTransfers.isEmpty {
                            EnhancedTransferSection(
                                title: "🏥 메디컬 진행",
                                icon: "heart.text.square.fill",
                                transfers: viewModel.medicalTransfers,
                                expandedID: $expandedTransferID,
                                accentColor: .orange
                            )
                        }
                        
                        // 협상 진행 중
                        if !viewModel.negotiatingTransfers.isEmpty {
                            EnhancedTransferSection(
                                title: "💬 협상 진행 중",
                                icon: "bubble.left.and.bubble.right.fill",
                                transfers: viewModel.negotiatingTransfers,
                                expandedID: $expandedTransferID,
                                accentColor: .blue
                            )
                        }
                        
                        // 신뢰도 높은 루머
                        if !showOnlyReliable && !viewModel.reliableRumors.isEmpty {
                            EnhancedTransferSection(
                                title: "📰 신뢰도 높은 소식",
                                icon: "newspaper.fill",
                                transfers: viewModel.reliableRumors,
                                expandedID: $expandedTransferID,
                                accentColor: .purple
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
}

// MARK: - 헤더 뷰
struct TransferCenterHeaderView: View {
    var body: some View {
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
    }
}

// MARK: - 핫 이슈 배너
struct HotTransferBanner: View {
    let transfer: EnhancedTransferNews
    @State private var animate = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("HOT", systemImage: "flame.fill")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.red)
                    .cornerRadius(6)
                
                Spacer()
                
                Text(relativeTime(from: transfer.publishedAt))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack(spacing: 16) {
                // 선수 이미지 플레이스홀더
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.3)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 80, height: 80)
                    
                    Text(transfer.playerName.prefix(2).uppercased())
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                .scaleEffect(animate ? 1.05 : 1.0)
                .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: animate)
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(transfer.playerName)
                        .font(.title3)
                        .fontWeight(.bold)
                    
                    HStack(spacing: 8) {
                        Text(transfer.fromClub)
                            .foregroundColor(.secondary)
                        
                        Image(systemName: "arrow.right.circle.fill")
                            .foregroundColor(.blue)
                        
                        Text(transfer.toClub)
                            .fontWeight(.semibold)
                    }
                    .font(.subheadline)
                    
                    if let fee = transfer.fee {
                        Text(fee)
                            .font(.headline)
                            .foregroundColor(.green)
                    }
                }
                
                Spacer()
            }
            
            // 신뢰도 및 상태 표시
            HStack(spacing: 8) {
                TransferReliabilityBadge(tier: transfer.reliability)
                TransferStageBadge(stage: transfer.stage)
                
                Spacer()
                
                if !transfer.verificationBadges.isEmpty {
                    ForEach(transfer.verificationBadges.prefix(3), id: \.self) { badge in
                        Image(systemName: badge.icon)
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(UIColor.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
        )
        .onAppear { animate = true }
    }
}

// MARK: - 필터 섹션
struct TransferFilterSection: View {
    @Binding var selectedFilter: TransferFilter
    @Binding var showOnlyReliable: Bool
    
    var body: some View {
        VStack(spacing: 12) {
            // 신뢰도 토글
            Toggle(isOn: $showOnlyReliable) {
                Label("공신력 있는 소식만 보기", systemImage: "checkmark.shield")
                    .font(.subheadline)
            }
            .tint(.blue)
            .padding(.horizontal)
            
            // 리그 필터
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(TransferFilter.allCases, id: \.self) { filter in
                        EnhancedFilterChip(
                            title: filter.displayName,
                            isSelected: selectedFilter == filter
                        ) {
                            selectedFilter = filter
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - 이적 섹션
struct EnhancedTransferSection: View {
    let title: String
    let icon: String
    let transfers: [EnhancedTransferNews]
    @Binding var expandedID: UUID?
    let accentColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 섹션 헤더
            HStack {
                Image(systemName: icon)
                    .foregroundColor(accentColor)
                Text(title)
                    .font(.headline)
                Spacer()
                Text("\(transfers.count)")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(accentColor)
                    .cornerRadius(10)
            }
            
            // 이적 카드들
            VStack(spacing: 12) {
                ForEach(transfers) { transfer in
                    EnhancedTransferCard(
                        transfer: transfer,
                        isExpanded: expandedID == transfer.id,
                        onTap: {
                            withAnimation(.spring()) {
                                if expandedID == transfer.id {
                                    expandedID = nil
                                } else {
                                    expandedID = transfer.id
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

// MARK: - 향상된 이적 카드
struct EnhancedTransferCard: View {
    let transfer: EnhancedTransferNews
    let isExpanded: Bool
    let onTap: () -> Void
    @Environment(\.openURL) private var openURL
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 메인 정보
            HStack(spacing: 12) {
                // 선수 아바타
                PlayerAvatar(name: transfer.playerName, size: 50)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(transfer.playerName)
                        .font(.headline)
                        .lineLimit(1)
                    
                    HStack(spacing: 6) {
                        Text(transfer.fromClub)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Image(systemName: "arrow.right")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        Text(transfer.toClub)
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
                    
                    Text(relativeTime(from: transfer.publishedAt))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // 신뢰도 및 상태
            HStack(spacing: 8) {
                TransferReliabilityBadge(tier: transfer.reliability)
                TransferStageBadge(stage: transfer.stage)
                
                Spacer()
                
                // 소스
                Text(transfer.source)
                    .font(.caption2)
                    .foregroundColor(.blue)
            }
            
            // 확장된 콘텐츠
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Divider()
                    
                    Text(transfer.title)
                        .font(.subheadline)
                        .fixedSize(horizontal: false, vertical: true)
                    
                    if let description = transfer.description {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(3)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    
                    // 검증 배지들
                    if !transfer.verificationBadges.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(transfer.verificationBadges, id: \.self) { badge in
                                    HStack(spacing: 4) {
                                        Image(systemName: badge.icon)
                                            .font(.caption2)
                                        Text(badge.description)
                                            .font(.caption2)
                                    }
                                    .foregroundColor(.blue)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.blue.opacity(0.1))
                                    .cornerRadius(8)
                                }
                            }
                        }
                    }
                    
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

// MARK: - 보조 뷰들
struct PlayerAvatar: View {
    let name: String
    let size: CGFloat
    
    var body: some View {
        ZStack {
            Circle()
                .fill(LinearGradient(
                    colors: [Color.blue.opacity(0.3), Color.purple.opacity(0.3)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: size, height: size)
            
            Text(name.prefix(2).uppercased())
                .font(.system(size: size * 0.4))
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
    }
}

struct TransferStageBadge: View {
    let stage: TransferStage
    
    var body: some View {
        HStack(spacing: 3) {
            ProgressView(value: stage.progress)
                .frame(width: 30, height: 3)
                .tint(stage.color)
            
            Text(stage.displayName)
                .font(.caption2)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(stage.color.opacity(0.1))
        .cornerRadius(6)
    }
}

struct EnhancedFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(isSelected ? Color.blue : Color.gray.opacity(0.1))
                )
        }
    }
}

// MARK: - 데이터 타입
enum TransferFilter: String, CaseIterable {
    case all = "전체"
    case premierLeague = "프리미어리그"
    case laLiga = "라리가"
    case serieA = "세리에A"
    case bundesliga = "분데스리가"
    case ligue1 = "리그1"
    
    var displayName: String { rawValue }
}


// MARK: - ViewModel
@MainActor
class EnhancedTransferViewModel: ObservableObject {
    @Published var allTransfers: [EnhancedTransferNews] = []
    @Published var isLoading = false
    
    var hotTransfer: EnhancedTransferNews? {
        allTransfers
            .filter { $0.reliability.rawValue >= TransferReliabilityTier.verified.rawValue }
            .sorted { $0.publishedAt > $1.publishedAt }
            .first
    }
    
    var officialTransfers: [EnhancedTransferNews] {
        allTransfers.filter { $0.stage == .completed || $0.reliability == .official }
    }
    
    var medicalTransfers: [EnhancedTransferNews] {
        allTransfers.filter { $0.stage == .medicalPending }
    }
    
    var negotiatingTransfers: [EnhancedTransferNews] {
        allTransfers.filter { 
            [.negotiating, .advanced, .termsAgreed].contains($0.stage) &&
            $0.reliability.rawValue >= TransferReliabilityTier.verified.rawValue
        }
    }
    
    var reliableRumors: [EnhancedTransferNews] {
        allTransfers.filter {
            $0.reliability.rawValue >= TransferReliabilityTier.reliable.rawValue &&
            $0.stage.rawValue < TransferStage.negotiating.rawValue
        }
    }
    
    func loadTransfers() async {
        isLoading = true
        
        do {
            // RSS 피드에서 이적 뉴스 가져오기
            // Using NewsService instead of RSSNewsService
            let newsService = NewsService.shared
            let newsArticles = try await newsService.fetchNews(category: .transfer)
            
            // 이적 관련 키워드
            let transferKeywords = ["transfer", "이적", "move", "deal", "contract", "sign", "join", "medical", "official"]
            
            // 이적 뉴스 필터링 (NewsArticle은 이미 transfer 카테고리)
            let transferNews = newsArticles.filter { news in
                let combined = (news.title + " " + news.summary).lowercased()
                return transferKeywords.contains { combined.contains($0) }
            }
            
            // EnhancedTransferNews로 변환
            let enhancedTransfers = transferNews.compactMap { raw -> EnhancedTransferNews? in
                // 신뢰도 평가
                let (reliabilityTier, reliabilityScore) = TransferReliabilityEvaluator.evaluateReliability(
                    source: raw.source,
                    title: raw.title,
                    description: raw.summary
                )
                
                // 너무 낮은 신뢰도는 제외
                if reliabilityScore < 20 {
                    return nil
                }
                
                // 진행 단계 판단
                let stage = TransferReliabilityEvaluator.determineTransferStage(
                    tier: reliabilityTier,
                    title: raw.title,
                    description: raw.summary
                )
                
                // 상태 변환
                let status: TransferCenterStatus = {
                    switch stage {
                    case .completed: return .confirmed
                    case .medicalPending, .termsAgreed, .advanced: return .negotiating
                    case .failed: return .failed
                    default: return .rumor
                    }
                }()
                
                // 검증 배지 결정
                var badges: [VerificationBadge] = []
                if reliabilityTier == .official {
                    badges.append(.officialStatement)
                }
                if TransferReliabilityEvaluator.tierOneJournalists.contains(where: { raw.source.contains($0) }) {
                    badges.append(.tier1Journalist)
                }
                if reliabilityTier == .tierOne || reliabilityTier == .verified {
                    badges.append(.multipleSourcesConfirmed)
                }
                
                return EnhancedTransferNews(
                    playerName: extractPlayerName(from: raw.title) ?? "Unknown",
                    fromClub: extractClub(from: raw.title, position: .from) ?? "",
                    toClub: extractClub(from: raw.title, position: .to) ?? "",
                    fee: extractFee(from: raw.title + " " + raw.summary),
                    status: status,
                    stage: stage,
                    reliability: reliabilityTier,
                    reliabilityScore: reliabilityScore,
                    title: raw.title,
                    description: raw.summary,
                    source: raw.source,
                    author: nil,
                    url: raw.url,
                    publishedAt: raw.publishedAt,
                    league: detectLeague(from: raw.title + " " + raw.summary),
                    lastUpdated: nil,
                    verificationBadges: badges
                )
            }
            
            // 신뢰도 점수로 정렬
            allTransfers = enhancedTransfers.sorted { first, second in
                if first.reliabilityScore != second.reliabilityScore {
                    return first.reliabilityScore > second.reliabilityScore
                }
                return first.publishedAt > second.publishedAt
            }
            
            print("✅ 이적 뉴스 로드 완료: \(allTransfers.count)개")
            
        } catch {
            print("❌ 이적 뉴스 로드 실패: \(error)")
            allTransfers = []
        }
        
        isLoading = false
    }
    
    func refreshTransfers() async {
        await loadTransfers()
    }
    
    // MARK: - Helper Methods
    private func extractPlayerName(from text: String) -> String? {
        // 간단한 휴리스틱: 첫 번째 대문자로 시작하는 연속된 단어들
        let pattern = "([A-Z][a-z]+ [A-Z][a-z]+)"
        if let range = text.range(of: pattern, options: .regularExpression) {
            return String(text[range])
        }
        return nil
    }
    
    private func extractClub(from text: String, position: ClubPosition) -> String? {
        // 이적 패턴 찾기
        let patterns = [
            "from (.+?) to (.+?)(?:\\s|$)",
            "(.+?) to (.+?) transfer",
            "(.+?) signs for (.+?)(?:\\s|$)"
        ]
        
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
               let match = regex.firstMatch(in: text, options: [], range: NSRange(text.startIndex..., in: text)) {
                let groupIndex = position == .from ? 1 : 2
                if let range = Range(match.range(at: groupIndex), in: text) {
                    return String(text[range])
                }
            }
        }
        return nil
    }
    
    private func extractFee(from text: String) -> String? {
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
        
        if lowerText.contains("premier league") || lowerText.contains("manchester") ||
           lowerText.contains("liverpool") || lowerText.contains("arsenal") {
            return .premierLeague
        } else if lowerText.contains("la liga") || lowerText.contains("barcelona") ||
                  lowerText.contains("real madrid") {
            return .laLiga
        } else if lowerText.contains("serie a") || lowerText.contains("juventus") ||
                  lowerText.contains("milan") {
            return .serieA
        } else if lowerText.contains("bundesliga") || lowerText.contains("bayern") ||
                  lowerText.contains("dortmund") {
            return .bundesliga
        } else if lowerText.contains("ligue 1") || lowerText.contains("psg") ||
                  lowerText.contains("monaco") {
            return .ligue1
        }
        
        return .all
    }
    
    private func parseDate(_ dateString: String) -> Date? {
        let formatters = [
            ISO8601DateFormatter(),
            {
                let formatter = DateFormatter()
                formatter.dateFormat = "E, d MMM yyyy HH:mm:ss Z"
                formatter.locale = Locale(identifier: "en_US_POSIX")
                return formatter
            }(),
            {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
                return formatter
            }()
        ]
        
        // ISO8601DateFormatter 처리
        if let isoFormatter = formatters.first as? ISO8601DateFormatter,
           let date = isoFormatter.date(from: dateString) {
            return date
        }
        
        // DateFormatter 처리
        for formatter in formatters.dropFirst() {
            if let dateFormatter = formatter as? DateFormatter,
               let date = dateFormatter.date(from: dateString) {
                return date
            }
        }
        return nil
    }
}

enum ClubPosition {
    case from
    case to
}

// MARK: - Helper
func relativeTime(from date: Date) -> String {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .abbreviated
    return formatter.localizedString(for: date, relativeTo: Date())
}

#Preview {
    EnhancedTransferCenterView()
}