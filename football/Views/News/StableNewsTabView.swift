import SwiftUI

struct StableNewsTabView: View {
    @StateObject private var viewModel = StableNewsViewModel()
    @State private var selectedTab: NewsTab = .major
    @State private var showingFilterSheet = false
    @State private var showingSourcesSheet = false
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
            case .transfer: return "arrow.left.arrow.right"
            case .injury: return "bandage.fill"
            }
        }
        
        var color: Color {
            switch self {
            case .major: return .red
            case .transfer: return .orange
            case .injury: return .purple
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
                // Background
                Color(.systemBackground).ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    headerView
                    
                    // Tab Selector
                    tabSelector
                    
                    // Content
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
                }
            }
            .sheet(isPresented: $showingSourcesSheet) {
                RSSSourcesView()
            }
            .task {
                await viewModel.loadNews()
            }
        }
    }
    
    // MARK: - Header
    private var headerView: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("⚽ Football News")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    if let lastUpdate = viewModel.lastUpdateTime {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 6, height: 6)
                            
                            Text("업데이트: \(lastUpdate, style: .relative) 전")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                // RSS Sources button
                Button(action: { showingSourcesSheet = true }) {
                    Image(systemName: "dot.radiowaves.left.and.right")
                        .font(.title2)
                        .foregroundColor(.blue)
                }
                
                // Filter button for transfer tab
                if selectedTab == .transfer {
                    Button(action: { showingFilterSheet = true }) {
                        ZStack {
                            Image(systemName: "line.3.horizontal.decrease.circle.fill")
                                .font(.title2)
                                .foregroundColor(.orange)
                            
                            if showOnlyTier1 || showOfficialOnly || !showRumours {
                                Circle()
                                    .fill(Color.red)
                                    .frame(width: 8, height: 8)
                                    .offset(x: 8, y: -8)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.top, 50)
            .padding(.bottom, 12)
            
            // Loading Progress
            if viewModel.isLoading && viewModel.loadingProgress > 0 {
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .frame(height: 2)
                        
                        Rectangle()
                            .fill(selectedTab.color)
                            .frame(width: geometry.size.width * viewModel.loadingProgress, height: 2)
                            .animation(.easeInOut(duration: 0.3), value: viewModel.loadingProgress)
                    }
                }
                .frame(height: 2)
            }
        }
        .background(Color(.systemBackground))
    }
    
    // MARK: - Tab Selector
    private var tabSelector: some View {
        HStack(spacing: 0) {
            ForEach(NewsTab.allCases, id: \.self) { tab in
                NewsTabButton(
                    tab: tab,
                    isSelected: selectedTab == tab,
                    namespace: tabAnimation
                ) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        selectedTab = tab
                        viewModel.selectCategory(tab.category)
                    }
                }
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }
    
    // MARK: - Content View
    private var contentView: some View {
        Group {
            if viewModel.isInitialLoad && viewModel.articles.isEmpty {
                initialLoadingView
            } else if viewModel.articles.isEmpty && !viewModel.isLoading {
                emptyStateView
            } else {
                newsListView
            }
        }
        .refreshable {
            await viewModel.refreshNews()
        }
    }
    
    // MARK: - Loading View
    private var initialLoadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(selectedTab.color)
            
            VStack(spacing: 8) {
                Text("뉴스를 불러오고 있습니다")
                    .font(.headline)
                
                if viewModel.loadingProgress > 0 {
                    Text("\(Int(viewModel.loadingProgress * 100))%")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Loading skeleton
            VStack(spacing: 12) {
                ForEach(0..<3, id: \.self) { _ in
                    NewsSkeletonView()
                        .padding(.horizontal)
                }
            }
            .padding(.top, 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: selectedTab.icon)
                .font(.system(size: 60))
                .foregroundColor(selectedTab.color.opacity(0.5))
            
            Text("\(selectedTab.title)가 없습니다")
                .font(.headline)
            
            Text("잠시 후 다시 확인해주세요")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Button(action: {
                Task {
                    await viewModel.refreshNews()
                }
            }) {
                Label("새로고침", systemImage: "arrow.clockwise")
                    .font(.subheadline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(selectedTab.color)
                    .cornerRadius(20)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
    
    // MARK: - News List
    private var newsListView: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                // New news alert
                if viewModel.hasNewNews {
                    NewNewsAlert {
                        Task {
                            await viewModel.refreshNews()
                        }
                    }
                    .padding(.horizontal)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
                
                // News items
                ForEach(filteredArticles) { article in
                    StableNewsCard(
                        article: article,
                        accentColor: selectedTab.color
                    )
                    .padding(.horizontal)
                    .transition(.opacity)
                }
            }
            .padding(.vertical, 12)
        }
        .background(Color(.systemGray6))
    }
    
    // Filter articles based on selected filters
    private var filteredArticles: [NewsArticle] {
        var filtered = viewModel.filteredArticles
        
        if selectedTab == .transfer {
            filtered = filtered.filter { article in
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
        }
        
        return filtered
    }
}

// MARK: - News Tab Button
struct NewsTabButton: View {
    let tab: StableNewsTabView.NewsTab
    let isSelected: Bool
    let namespace: Namespace.ID
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: tab.icon)
                        .font(.system(size: 16, weight: .semibold))
                    
                    Text(tab.title)
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundColor(isSelected ? tab.color : .gray)
                .scaleEffect(isSelected ? 1.05 : 1.0)
                
                if isSelected {
                    Rectangle()
                        .fill(tab.color)
                        .frame(height: 3)
                        .matchedGeometryEffect(id: "tab_indicator", in: namespace)
                } else {
                    Rectangle()
                        .fill(Color.clear)
                        .frame(height: 3)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - News Card
struct StableNewsCard: View {
    let article: NewsArticle
    let accentColor: Color
    @State private var showingWebView = false
    
    var body: some View {
        Button(action: {
            showingWebView = true
        }) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    // Category and Source
                    HStack(spacing: 8) {
                        Image(systemName: article.category.icon)
                            .font(.caption)
                            .foregroundColor(accentColor)
                        
                        Text(article.source)
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(sourceColor)
                    }
                    
                    Spacer()
                    
                    Text(article.timeAgo)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Title
                Text(article.title)
                    .font(.headline)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
                
                // Summary
                if !article.summary.isEmpty && article.summary != "No description available" {
                    Text(article.summary)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(PlainButtonStyle())
        .sheet(isPresented: $showingWebView) {
            if let url = URL(string: article.url) {
                WebViewContainer(url: url)
            }
        }
    }
    
    private var sourceColor: Color {
        if article.source.contains("[OFFICIAL]") {
            return .green
        } else if article.source.contains("[Tier 1]") {
            return .blue
        } else if article.source.contains("✓") {
            return .purple
        } else if article.source.contains("[Rumour]") {
            return .orange
        } else {
            return .primary
        }
    }
}

// MARK: - Loading Skeleton
struct NewsSkeletonView: View {
    @State private var isAnimating = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header skeleton
            HStack {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 120, height: 16)
                
                Spacer()
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 60, height: 16)
            }
            
            // Title skeleton
            VStack(alignment: .leading, spacing: 6) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 20)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 200, height: 20)
            }
            
            // Summary skeleton
            VStack(alignment: .leading, spacing: 4) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 16)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 250, height: 16)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
        .opacity(isAnimating ? 0.6 : 1.0)
        .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: isAnimating)
        .onAppear {
            isAnimating = true
        }
    }
}

// MARK: - New News Alert
struct NewNewsAlert: View {
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.yellow)
                
                Text("새로운 뉴스가 있습니다")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Spacer()
                
                Text("탭하여 새로고침")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    StableNewsTabView()
}