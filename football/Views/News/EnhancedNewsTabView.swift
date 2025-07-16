import SwiftUI

struct EnhancedNewsTabView: View {
    @StateObject private var viewModel = NewsViewModel()
    @State private var selectedTab: NewsTab = .major
    @State private var showingFilterSheet = false
    @State private var bounceAnimation = false
    @State private var showOnlyTier1 = false
    @State private var showRumours = true
    @State private var showOfficialOnly = false
    @Namespace private var tabAnimation
    
    enum NewsTab: CaseIterable {
        case major
        case transfer
        case injury
        
        var title: String {
            switch self {
            case .major: return "주요뉴스"
            case .transfer: return "이적시장"
            case .injury: return "부상뉴스"
            }
        }
        
        var icon: String {
            switch self {
            case .major: return "flame.fill"
            case .transfer: return "arrow.triangle.2.circlepath"
            case .injury: return "bandage.fill"
            }
        }
        
        var gradient: [Color] {
            switch self {
            case .major: return [.red, .orange]
            case .transfer: return [.blue, .purple]
            case .injury: return [.purple, .pink]
            }
        }
        
        var category: NewsCategory {
            switch self {
            case .major: return .general
            case .transfer: return .transfer
            case .injury: return .injury
            }
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background Gradient
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(.systemBackground),
                        selectedTab.gradient[0].opacity(0.05)
                    ]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Animated Header
                    animatedHeader
                    
                    // Beautiful Tab Selector
                    beautifulTabSelector
                    
                    // Content with Transition
                    contentView
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showingFilterSheet) {
                if selectedTab == .transfer {
                    TransferNewsFilterView(
                        showOnlyTier1: $showOnlyTier1,
                        showRumours: $showRumours,
                        showOfficialOnly: $showOfficialOnly
                    )
                } else {
                    NewsFilterSheet(viewModel: viewModel)
                }
            }
            .task {
                await viewModel.loadNews()
                startPulseAnimation()
            }
        }
    }
    
    // MARK: - Animated Header
    private var animatedHeader: some View {
        VStack(spacing: 12) {
            HStack {
                HStack(spacing: 12) {
                    // Animated Football Icon
                    Image(systemName: "sportscourt.fill")
                        .font(.title)
                        .foregroundColor(selectedTab.gradient[0])
                        .rotationEffect(.degrees(bounceAnimation ? 10 : -10))
                        .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: bounceAnimation)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Football News")
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(
                                    gradient: Gradient(colors: selectedTab.gradient),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                        
                        // Live Status
                        HStack(spacing: 6) {
                            PulsingDot(color: .green)
                            
                            Text("실시간 업데이트 중")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                // Action Buttons
                HStack(spacing: 12) {
                    // Filter Button (이적 탭에서만 표시)
                    if selectedTab == .transfer {
                        Button(action: { showingFilterSheet = true }) {
                            ZStack {
                                Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                    .font(.title2)
                                    .foregroundStyle(
                                        LinearGradient(
                                            gradient: Gradient(colors: [.orange, .orange.opacity(0.8)]),
                                            startPoint: .top,
                                            endPoint: .bottom
                                        )
                                    )
                                
                                // 필터 활성화 표시
                                if showOnlyTier1 || showOfficialOnly || !showRumours {
                                    Circle()
                                        .fill(Color.red)
                                        .frame(width: 10, height: 10)
                                        .offset(x: 10, y: -10)
                                }
                            }
                        }
                    }
                    
                    // Notification Button
                    NotificationButton()
                }
            }
            .padding(.horizontal)
            .padding(.top, 50)
            .padding(.bottom, 8)
        }
        .background(
            Color(.systemBackground)
                .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 5)
        )
    }
    
    // MARK: - Beautiful Tab Selector
    private var beautifulTabSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 20) {
                ForEach(NewsTab.allCases, id: \.self) { tab in
                    BeautifulTabButton(
                        tab: tab,
                        isSelected: selectedTab == tab,
                        namespace: tabAnimation
                    ) {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            selectedTab = tab
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
    }
    
    // MARK: - Content View
    private var contentView: some View {
        TabView(selection: $selectedTab) {
            ForEach(NewsTab.allCases, id: \.self) { tab in
                EnhancedNewsContent(
                    viewModel: viewModel,
                    tab: tab,
                    showOnlyTier1: $showOnlyTier1,
                    showRumours: $showRumours,
                    showOfficialOnly: $showOfficialOnly
                )
                .tag(tab)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .animation(.easeInOut(duration: 0.3), value: selectedTab)
    }
    
    private func startPulseAnimation() {
        bounceAnimation = true
    }
}

// MARK: - Beautiful Tab Button
struct BeautifulTabButton: View {
    let tab: EnhancedNewsTabView.NewsTab
    let isSelected: Bool
    let namespace: Namespace.ID
    let action: () -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            withAnimation(.spring()) {
                isPressed = true
            }
            action()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                isPressed = false
            }
        }) {
            VStack(spacing: 8) {
                // Icon with Badge
                ZStack(alignment: .topTrailing) {
                    ZStack {
                        if isSelected {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        gradient: Gradient(colors: tab.gradient),
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 50, height: 50)
                                .matchedGeometryEffect(id: "tab_bg", in: namespace)
                        } else {
                            Circle()
                                .fill(Color(.systemGray6))
                                .frame(width: 50, height: 50)
                        }
                        
                        Image(systemName: tab.icon)
                            .font(.title3)
                            .foregroundColor(isSelected ? .white : .gray)
                            .scaleEffect(isPressed ? 0.9 : 1.0)
                    }
                    
                    // News Count Badge
                    if isSelected {
                        Text("5")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(width: 18, height: 18)
                            .background(Color.red)
                            .clipShape(Circle())
                            .offset(x: 5, y: -5)
                    }
                }
                
                Text(tab.title)
                    .font(.caption)
                    .fontWeight(isSelected ? .bold : .medium)
                    .foregroundColor(isSelected ? .primary : .gray)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Enhanced News Content
struct EnhancedNewsContent: View {
    @ObservedObject var viewModel: NewsViewModel
    let tab: EnhancedNewsTabView.NewsTab
    @Binding var showOnlyTier1: Bool
    @Binding var showRumours: Bool
    @Binding var showOfficialOnly: Bool
    @Environment(\.openURL) private var openURL
    @State private var selectedArticle: NewsArticle?
    
    var filteredNews: [NewsArticle] {
        var filtered: [NewsArticle]
        
        if tab.category == .general {
            filtered = viewModel.articles
        } else if tab.category == .transfer {
            // 이적 뉴스 필터링
            filtered = viewModel.articles.filter { article in
                guard article.category == .transfer else { return false }
                
                // 필터 적용
                if showOfficialOnly && !article.source.contains("[OFFICIAL]") {
                    return false
                }
                
                if showOnlyTier1 && !article.source.contains("[Tier 1]") && !article.source.contains("[OFFICIAL]") {
                    return false
                }
                
                if !showRumours && (article.source.contains("[Rumour]") || article.source.contains("[Unverified]")) {
                    return false
                }
                
                return true
            }
        } else {
            filtered = viewModel.articles.filter { $0.category == tab.category }
        }
        
        return filtered.sorted { $0.publishedAt > $1.publishedAt }
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Section
                if let hero = filteredNews.first {
                    HeroNewsCard(
                        article: hero,
                        gradient: tab.gradient
                    ) {
                        selectedArticle = hero
                    }
                    .padding()
                }
                
                // Section Header
                if filteredNews.count > 1 {
                    HStack {
                        Text("최신 소식")
                            .font(.headline)
                            .fontWeight(.bold)
                        
                        Spacer()
                        
                        Text("\(filteredNews.count - 1)개")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }
                
                // News Grid
                LazyVStack(spacing: 12) {
                    ForEach(filteredNews.dropFirst()) { article in
                        PremiumNewsRow(
                            article: article,
                            accentColor: tab.gradient[0]
                        ) {
                            selectedArticle = article
                        }
                        .padding(.horizontal)
                    }
                }
                
                // Empty State
                if filteredNews.isEmpty {
                    EmptyNewsState(tab: tab)
                        .padding(.top, 100)
                }
            }
            .padding(.bottom, 30)
        }
        .sheet(item: $selectedArticle) { article in
            NewsDetailSheet(article: article, gradient: tab.gradient)
        }
        .refreshable {
            await viewModel.refreshNews()
        }
    }
}

// MARK: - Hero News Card
struct HeroNewsCard: View {
    let article: NewsArticle
    let gradient: [Color]
    let onTap: () -> Void
    
    @State private var isHovered = false
    
    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .bottom) {
                // Gradient Background
                LinearGradient(
                    gradient: Gradient(colors: gradient),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .frame(height: 220)
                .overlay(
                    // Pattern Overlay
                    ZStack {
                        Image(systemName: "hexagon.fill")
                            .font(.system(size: 100))
                            .foregroundColor(.white.opacity(0.1))
                            .offset(x: -50, y: -30)
                        
                        Image(systemName: "sportscourt.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.white.opacity(0.1))
                            .offset(x: 60, y: 20)
                    }
                )
                
                // Content
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Label("BREAKING", systemImage: "bolt.fill")
                            .font(.caption)
                            .fontWeight(.black)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.white)
                            .foregroundColor(gradient[0])
                            .cornerRadius(20)
                        
                        Spacer()
                        
                        if isHighQualitySource(article.source) {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(.white)
                                .font(.title3)
                        }
                    }
                    
                    Text(article.title)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                    
                    HStack {
                        // 소스와 신뢰도 표시
                        if article.source.contains("✓") || article.source.contains("[OFFICIAL]") || article.source.contains("[Tier 1]") {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.caption)
                                Text(article.source)
                                    .font(.caption)
                                    .fontWeight(.bold)
                            }
                        } else {
                            Text(article.source)
                                .font(.caption)
                                .fontWeight(.semibold)
                        }
                        
                        Text("•")
                        
                        Text(article.timeAgo)
                            .font(.caption)
                    }
                    .foregroundColor(.white.opacity(0.9))
                }
                .padding()
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [.clear, .black.opacity(0.3)]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
            .cornerRadius(20)
            .shadow(color: gradient[0].opacity(0.3), radius: 15, x: 0, y: 10)
            .scaleEffect(isHovered ? 0.98 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
        .onHover { hovering in
            withAnimation(.spring(response: 0.3)) {
                isHovered = hovering
            }
        }
    }
    
    private func isHighQualitySource(_ source: String) -> Bool {
        // Check for verified sources or official/tier 1 markers
        return source.contains("✓") || 
               source.contains("[OFFICIAL]") || 
               source.contains("[Tier 1]") ||
               ["BBC Sport", "Sky Sports", "The Guardian", "Reuters", "Premier League Official", "UEFA Official"].contains { source.contains($0) }
    }
}

// MARK: - Premium News Row
struct PremiumNewsRow: View {
    let article: NewsArticle
    let accentColor: Color
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Gradient Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [accentColor, accentColor.opacity(0.7)]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 65, height: 65)
                    
                    Image(systemName: article.category.icon)
                        .font(.title2)
                        .foregroundColor(.white)
                }
                
                // Content
                VStack(alignment: .leading, spacing: 6) {
                    Text(article.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    
                    HStack(spacing: 6) {
                        // 신뢰도 높은 소스 강조
                        if article.source.contains("[OFFICIAL]") {
                            Label(article.source, systemImage: "checkmark.seal.fill")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        } else if article.source.contains("[Tier 1]") {
                            Label(article.source, systemImage: "star.fill")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(accentColor)
                        } else if article.source.contains("✓") {
                            Label(article.source, systemImage: "checkmark.circle.fill")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(accentColor)
                        } else {
                            Label(article.source, systemImage: "globe")
                                .font(.caption)
                                .foregroundColor(accentColor)
                        }
                        
                        Spacer()
                        
                        Text(article.timeAgo)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Supporting Views
struct PulsingDot: View {
    let color: Color
    @State private var isAnimating = false
    
    var body: some View {
        ZStack {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            
            Circle()
                .stroke(color, lineWidth: 1)
                .frame(width: 8, height: 8)
                .scaleEffect(isAnimating ? 2.5 : 1)
                .opacity(isAnimating ? 0 : 1)
                .animation(.easeOut(duration: 1.5).repeatForever(autoreverses: false), value: isAnimating)
        }
        .onAppear { isAnimating = true }
    }
}

struct NotificationButton: View {
    @State private var hasNotifications = true
    
    var body: some View {
        Button(action: {}) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "bell.fill")
                    .font(.title2)
                    .foregroundStyle(
                        LinearGradient(
                            gradient: Gradient(colors: [.gray, .gray.opacity(0.8)]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                
                if hasNotifications {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 12, height: 12)
                        .overlay(
                            Text("3")
                                .font(.system(size: 8))
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        )
                        .offset(x: 3, y: -3)
                }
            }
        }
    }
}

struct EmptyNewsState: View {
    let tab: EnhancedNewsTabView.NewsTab
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: tab.icon)
                .font(.system(size: 70))
                .foregroundStyle(
                    LinearGradient(
                        gradient: Gradient(colors: tab.gradient),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            
            Text("아직 \(tab.title)가 없습니다")
                .font(.headline)
                .foregroundColor(.primary)
            
            Text("새로운 소식이 있으면 바로 알려드릴게요!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

// MARK: - News Detail Sheet
struct NewsDetailSheet: View {
    let article: NewsArticle
    let gradient: [Color]
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header Image
                    LinearGradient(
                        gradient: Gradient(colors: gradient),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .frame(height: 200)
                    .overlay(
                        Image(systemName: article.category.icon)
                            .font(.system(size: 80))
                            .foregroundColor(.white.opacity(0.5))
                    )
                    
                    VStack(alignment: .leading, spacing: 16) {
                        // Title
                        Text(article.title)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        // Metadata
                        HStack {
                            Label(article.source, systemImage: "globe")
                                .font(.subheadline)
                                .foregroundColor(gradient[0])
                            
                            Spacer()
                            
                            Text(article.publishedAt, style: .date)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Divider()
                        
                        // Summary
                        Text(article.summary)
                            .font(.body)
                            .lineSpacing(8)
                        
                        // Read Full Article Button
                        Button(action: {
                            if let url = URL(string: article.url) {
                                openURL(url)
                            }
                        }) {
                            Label("전체 기사 읽기", systemImage: "safari")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(
                                    LinearGradient(
                                        gradient: Gradient(colors: gradient),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .cornerRadius(16)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    .padding()
                }
            }
            .navigationTitle("뉴스 상세")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("닫기") { dismiss() }
                }
            }
        }
    }
}

// MARK: - News Filter Sheet
struct NewsFilterSheet: View {
    @ObservedObject var viewModel: NewsViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section("뉴스 소스") {
                    Toggle("BBC Sport", isOn: .constant(true))
                    Toggle("Sky Sports", isOn: .constant(true))
                    Toggle("The Guardian", isOn: .constant(true))
                }
                
                Section("알림 설정") {
                    Toggle("주요 뉴스 알림", isOn: .constant(true))
                    Toggle("이적 소식 알림", isOn: .constant(false))
                    Toggle("부상 뉴스 알림", isOn: .constant(false))
                }
            }
            .navigationTitle("필터 및 설정")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("완료") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    EnhancedNewsTabView()
}