import SwiftUI

struct TabbedNewsView: View {
    @StateObject private var viewModel = NewsViewModel()
    @State private var selectedTab: NewsTab = .major
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
            case .injury: return "cross.case.fill"
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
            VStack(spacing: 0) {
                // Custom Header with Live Indicator
                headerView
                
                // Beautiful Tab Bar
                customTabBar
                
                // Tab Content
                TabView(selection: $selectedTab) {
                    ForEach(NewsTab.allCases, id: \.self) { tab in
                        NewsTabContent(
                            viewModel: viewModel,
                            category: tab.category,
                            tabColor: tab.color
                        )
                        .tag(tab)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut(duration: 0.3), value: selectedTab)
            }
            .navigationBarHidden(true)
            .task {
                await viewModel.loadNews()
            }
        }
    }
    
    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 0) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 8) {
                        Text("⚽")
                            .font(.title)
                        
                        Text("Football News")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                    }
                    
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                            .overlay(
                                Circle()
                                    .fill(Color.green)
                                    .frame(width: 8, height: 8)
                                    .scaleEffect(1.5)
                                    .opacity(0.3)
                                    .animation(.easeInOut(duration: 1).repeatForever(), value: true)
                            )
                        
                        Text("LIVE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                        
                        Text("•")
                            .foregroundColor(.secondary)
                        
                        Text("실시간 업데이트")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                // Notification Button
                Button(action: {}) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "bell.fill")
                            .font(.title2)
                            .foregroundColor(.primary)
                        
                        Circle()
                            .fill(Color.red)
                            .frame(width: 10, height: 10)
                            .offset(x: 2, y: -2)
                    }
                }
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(Circle())
            }
            .padding(.horizontal)
            .padding(.top, 50)
            .padding(.bottom, 16)
            .background(Color(.systemBackground))
        }
    }
    
    // MARK: - Custom Tab Bar
    private var customTabBar: some View {
        HStack(spacing: 0) {
            ForEach(NewsTab.allCases, id: \.self) { tab in
                TabButton(
                    tab: tab,
                    isSelected: selectedTab == tab,
                    namespace: tabAnimation
                ) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedTab = tab
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 3, x: 0, y: 2)
    }
}

// MARK: - Tab Button
struct TabButton: View {
    let tab: TabbedNewsView.NewsTab
    let isSelected: Bool
    let namespace: Namespace.ID
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: tab.icon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(isSelected ? tab.color : .gray)
                        .scaleEffect(isSelected ? 1.2 : 1.0)
                    
                    Text(tab.title)
                        .font(.system(size: 15, weight: isSelected ? .bold : .medium))
                        .foregroundColor(isSelected ? .primary : .gray)
                }
                .padding(.vertical, 8)
                
                // Animated Underline
                if isSelected {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(tab.color)
                        .frame(height: 3)
                        .matchedGeometryEffect(id: "tab_indicator", in: namespace)
                } else {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.clear)
                        .frame(height: 3)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - News Tab Content
struct NewsTabContent: View {
    @ObservedObject var viewModel: NewsViewModel
    let category: NewsCategory
    let tabColor: Color
    @Environment(\.openURL) private var openURL
    
    var filteredNews: [NewsArticle] {
        if category == .general {
            // For major news, show all categories but prioritize important news
            return viewModel.articles
                .sorted { article1, article2 in
                    // Priority order: match > transfer > injury > general
                    let priority1 = newsPriority(for: article1.category)
                    let priority2 = newsPriority(for: article2.category)
                    
                    if priority1 != priority2 {
                        return priority1 > priority2
                    }
                    
                    return article1.publishedAt > article2.publishedAt
                }
        } else {
            return viewModel.articles
                .filter { $0.category == category }
                .sorted { $0.publishedAt > $1.publishedAt }
        }
    }
    
    private func newsPriority(for category: NewsCategory) -> Int {
        switch category {
        case .match: return 4
        case .transfer: return 3
        case .injury: return 2
        case .general: return 1
        case .all: return 0
        }
    }
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Featured News Card (First Item)
                if let featuredNews = filteredNews.first {
                    FeaturedNewsCard(
                        article: featuredNews,
                        accentColor: tabColor
                    ) {
                        if let url = URL(string: featuredNews.url) {
                            openURL(url)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 12)
                }
                
                // Regular News Items
                ForEach(filteredNews.dropFirst()) { article in
                    ModernNewsCard(
                        article: article,
                        accentColor: tabColor
                    ) {
                        if let url = URL(string: article.url) {
                            openURL(url)
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Loading or Empty State
                if viewModel.isLoading && filteredNews.isEmpty {
                    LoadingStateView()
                        .padding(.top, 100)
                } else if filteredNews.isEmpty {
                    EmptyStateView(category: category)
                        .padding(.top, 100)
                }
            }
            .padding(.bottom, 20)
        }
        .refreshable {
            await viewModel.refreshNews()
        }
    }
}

// MARK: - Featured News Card
struct FeaturedNewsCard: View {
    let article: NewsArticle
    let accentColor: Color
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Image Placeholder with Gradient
                ZStack(alignment: .bottomLeading) {
                    LinearGradient(
                        gradient: Gradient(colors: [accentColor.opacity(0.8), accentColor]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .frame(height: 200)
                    .overlay(
                        Image(systemName: "sportscourt.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.white.opacity(0.3))
                    )
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("FEATURED")
                            .font(.caption)
                            .fontWeight(.black)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color.white)
                            .foregroundColor(accentColor)
                            .cornerRadius(12)
                        
                        Text(article.title)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .lineLimit(2)
                            .shadow(radius: 2)
                    }
                    .padding()
                }
                .cornerRadius(16)
                
                // Article Details
                VStack(alignment: .leading, spacing: 8) {
                    if !article.summary.isEmpty && article.summary != "No description available" {
                        Text(article.summary)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(3)
                    }
                    
                    HStack {
                        HStack(spacing: 4) {
                            Image(systemName: "globe")
                                .font(.caption)
                            Text(article.source)
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                        .foregroundColor(accentColor)
                        
                        Spacer()
                        
                        Text(article.timeAgo)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(20)
            .shadow(color: accentColor.opacity(0.15), radius: 10, x: 0, y: 5)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Modern News Card
struct ModernNewsCard: View {
    let article: NewsArticle
    let accentColor: Color
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Icon Container
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(accentColor.opacity(0.1))
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: article.category.icon)
                        .font(.title2)
                        .foregroundColor(accentColor)
                }
                
                // Content
                VStack(alignment: .leading, spacing: 6) {
                    Text(article.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    
                    HStack {
                        HStack(spacing: 4) {
                            if isHighQualitySource(article.source) {
                                Image(systemName: "checkmark.seal.fill")
                                    .font(.caption2)
                                    .foregroundColor(.green)
                            }
                            
                            Text(article.source)
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(accentColor)
                        }
                        
                        Text("•")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text(article.timeAgo)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func isHighQualitySource(_ source: String) -> Bool {
        let qualitySources = [
            "BBC Sport", "Sky Sports", "The Guardian", "Reuters",
            "AP News", "ESPN FC", "ESPN", "Transfermarkt"
        ]
        return qualitySources.contains(source)
    }
}

// MARK: - Loading State
struct LoadingStateView: View {
    var body: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.blue)
            
            Text("뉴스를 불러오고 있습니다...")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Empty State
struct EmptyStateView: View {
    let category: NewsCategory
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: category.icon)
                .font(.system(size: 60))
                .foregroundColor(.gray.opacity(0.5))
            
            Text("아직 뉴스가 없습니다")
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text("잠시 후 다시 확인해주세요")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    TabbedNewsView()
}