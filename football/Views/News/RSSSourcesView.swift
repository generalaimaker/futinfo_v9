import SwiftUI

struct RSSSourcesView: View {
    @State private var selectedCategory: ExpandedFootballRSSService.NewsSourceCategory? = nil
    @State private var searchText = ""
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    headerSection
                    
                    // Category Filter
                    categoryFilter
                    
                    // Sources List
                    sourcesSection
                }
                .padding()
            }
            .background(Color(.systemGray6))
            .navigationTitle("RSS 뉴스 소스")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("완료") {
                        dismiss()
                    }
                }
            }
            .searchable(text: $searchText, prompt: "소스 검색...")
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "dot.radiowaves.left.and.right")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text("60+ 프리미엄 RSS 소스")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            Text("전 세계 최고의 축구 뉴스 소스를 한곳에서")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
    
    // MARK: - Category Filter
    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                CategoryChip(
                    title: "전체",
                    icon: "square.grid.2x2",
                    isSelected: selectedCategory == nil,
                    action: { selectedCategory = nil }
                )
                
                ForEach(ExpandedFootballRSSService.NewsSourceCategory.allCases, id: \.self) { category in
                    CategoryChip(
                        title: categoryDisplayName(category),
                        icon: categoryIcon(category),
                        isSelected: selectedCategory == category,
                        action: { selectedCategory = category }
                    )
                }
            }
        }
    }
    
    // MARK: - Sources Section
    private var sourcesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(filteredSources, id: \.self) { source in
                SourceCard(source: source)
            }
        }
    }
    
    // MARK: - Helper Methods
    private var filteredSources: [ExpandedFootballRSSService.ExpandedRSSSource] {
        var sources = ExpandedFootballRSSService.ExpandedRSSSource.allCases
        
        // 카테고리 필터
        if let category = selectedCategory {
            sources = sources.filter { $0.category == category }
        }
        
        // 검색 필터
        if !searchText.isEmpty {
            sources = sources.filter { source in
                source.displayName.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // 신뢰도 순으로 정렬
        return sources.sorted { $0.trustScore > $1.trustScore }
    }
    
    private func categoryDisplayName(_ category: ExpandedFootballRSSService.NewsSourceCategory) -> String {
        switch category {
        case .official: return "공식"
        case .tier1Media: return "주요 언론"
        case .internationalMedia: return "국제 언론"
        case .specializedMedia: return "전문 매체"
        case .transferSpecialist: return "이적 전문"
        case .analytics: return "분석/통계"
        case .podcast: return "팟캐스트"
        case .clubOfficial: return "클럽 공식"
        }
    }
    
    private func categoryIcon(_ category: ExpandedFootballRSSService.NewsSourceCategory) -> String {
        switch category {
        case .official: return "checkmark.seal.fill"
        case .tier1Media: return "newspaper.fill"
        case .internationalMedia: return "globe"
        case .specializedMedia: return "sportscourt.fill"
        case .transferSpecialist: return "arrow.left.arrow.right"
        case .analytics: return "chart.line.uptrend.xyaxis"
        case .podcast: return "mic.fill"
        case .clubOfficial: return "shield.fill"
        }
    }
}

// MARK: - Category Chip
struct CategoryChip: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.caption)
                
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Source Card
struct SourceCard: View {
    let source: ExpandedFootballRSSService.ExpandedRSSSource
    
    var body: some View {
        HStack(spacing: 16) {
            // Trust Score
            ZStack {
                Circle()
                    .fill(trustScoreColor.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                Text("\(source.trustScore)")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(trustScoreColor)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                // Name and badges
                HStack(spacing: 8) {
                    Text(source.displayName)
                        .font(.headline)
                    
                    // Language badge
                    if source.language != .english {
                        Text(source.language.code.uppercased())
                            .font(.caption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.2))
                            .foregroundColor(.orange)
                            .cornerRadius(4)
                    }
                }
                
                // Category and description
                HStack(spacing: 8) {
                    Image(systemName: categoryIcon(source.category))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(categoryDisplayName(source.category))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if source.category == .transferSpecialist && 
                       (source == .transfermarkt || source == .fabrizioRomano) {
                        Text("• TOP")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                }
                
                // URL preview
                Text(source.rawValue)
                    .font(.caption2)
                    .foregroundColor(Color(.tertiaryLabel))
                    .lineLimit(1)
            }
            
            Spacer()
            
            // Category icon
            Image(systemName: categoryIcon(source.category))
                .font(.title2)
                .foregroundColor(.secondary.opacity(0.5))
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
    
    private var trustScoreColor: Color {
        if source.trustScore >= 95 {
            return .green
        } else if source.trustScore >= 85 {
            return .blue
        } else if source.trustScore >= 70 {
            return .orange
        } else {
            return .gray
        }
    }
    
    private func categoryIcon(_ category: ExpandedFootballRSSService.NewsSourceCategory) -> String {
        switch category {
        case .official: return "checkmark.seal.fill"
        case .tier1Media: return "newspaper.fill"
        case .internationalMedia: return "globe"
        case .specializedMedia: return "sportscourt.fill"
        case .transferSpecialist: return "arrow.left.arrow.right"
        case .analytics: return "chart.line.uptrend.xyaxis"
        case .podcast: return "mic.fill"
        case .clubOfficial: return "shield.fill"
        }
    }
    
    private func categoryDisplayName(_ category: ExpandedFootballRSSService.NewsSourceCategory) -> String {
        switch category {
        case .official: return "공식 기구"
        case .tier1Media: return "주요 언론"
        case .internationalMedia: return "국제 언론"
        case .specializedMedia: return "축구 전문"
        case .transferSpecialist: return "이적 전문"
        case .analytics: return "분석/통계"
        case .podcast: return "팟캐스트"
        case .clubOfficial: return "클럽 공식"
        }
    }
}

// MARK: - NewsSourceCategory Extension
extension ExpandedFootballRSSService.NewsSourceCategory: CaseIterable {
    static var allCases: [ExpandedFootballRSSService.NewsSourceCategory] {
        [.official, .tier1Media, .internationalMedia, .specializedMedia, 
         .transferSpecialist, .analytics, .podcast, .clubOfficial]
    }
}

#Preview {
    RSSSourcesView()
}