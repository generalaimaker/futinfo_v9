import SwiftUI

/// 중복된 뉴스를 클러스터로 표시하는 카드
struct ClusteredNewsCard: View {
    let article: NewsArticle
    let duplicateCount: Int
    let sources: [String]
    let accentColor: Color
    @Environment(\.openURL) private var openURL
    @State private var showingSources = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Main Card
            Button(action: {
                if let url = URL(string: article.url) {
                    openURL(url)
                }
            }) {
                VStack(alignment: .leading, spacing: 12) {
                    // Header with source info
                    HStack {
                        // Primary source
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
                        
                        // Duplicate indicator
                        if duplicateCount > 0 {
                            DuplicateIndicator(count: duplicateCount)
                                .onTapGesture {
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        showingSources.toggle()
                                    }
                                }
                        }
                        
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
            }
            .buttonStyle(PlainButtonStyle())
            
            // Sources expansion
            if showingSources && duplicateCount > 0 {
                SourcesExpansion(sources: sources)
                    .transition(.asymmetric(
                        insertion: .move(edge: .top).combined(with: .opacity),
                        removal: .move(edge: .top).combined(with: .opacity)
                    ))
            }
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)
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

// MARK: - Duplicate Indicator
struct DuplicateIndicator: View {
    let count: Int
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "doc.on.doc.fill")
                .font(.caption2)
            
            Text("+\(count)")
                .font(.caption)
                .fontWeight(.semibold)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.blue.opacity(0.1))
        .foregroundColor(.blue)
        .cornerRadius(12)
    }
}

// MARK: - Sources Expansion
struct SourcesExpansion: View {
    let sources: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Divider()
            
            VStack(alignment: .leading, spacing: 4) {
                Text("동일한 뉴스를 보도한 다른 소스:")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                
                ForEach(sources, id: \.self) { source in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(trustColor(for: source))
                            .frame(width: 6, height: 6)
                        
                        Text(source)
                            .font(.caption)
                            .foregroundColor(.primary)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 12)
        }
        .background(Color(.systemGray6))
    }
    
    private func trustColor(for source: String) -> Color {
        if source.contains("[OFFICIAL]") || source.contains("Official") {
            return .green
        } else if source.contains("[Tier 1]") || source.contains("BBC") || source.contains("Guardian") {
            return .blue
        } else if source.contains("[Verified]") || source.contains("✓") {
            return .purple
        } else if source.contains("[Analytics]") {
            return .cyan
        } else if source.contains("[Transfer Expert]") {
            return .indigo
        } else if source.contains("[Rumour]") {
            return .orange
        } else {
            return .gray
        }
    }
}

// MARK: - Preview Helper
struct ClusteredNewsCard_Preview: View {
    let sampleArticle = NewsArticle(
        title: "Manchester United Close to Signing New Striker for £80m",
        summary: "The Red Devils are reportedly in advanced talks with the player's representatives and a medical is scheduled for next week.",
        source: "Sky Sports [Tier 1]",
        url: "https://example.com",
        publishedAt: Date().addingTimeInterval(-3600),
        category: .transfer,
        imageUrl: nil
    )
    
    let duplicateSources = [
        "BBC Sport ✓",
        "The Guardian [Tier 1]",
        "Goal.com [Reliable]",
        "Mirror Football [Rumour]",
        "ESPN FC"
    ]
    
    var body: some View {
        VStack(spacing: 20) {
            ClusteredNewsCard(
                article: sampleArticle,
                duplicateCount: 5,
                sources: duplicateSources,
                accentColor: .orange
            )
            
            ClusteredNewsCard(
                article: NewsArticle(
                    title: "Breaking: Player Signs New Contract",
                    summary: "Official announcement from the club.",
                    source: "Manchester United [OFFICIAL]",
                    url: "https://example.com",
                    publishedAt: Date(),
                    category: .general,
                    imageUrl: nil
                ),
                duplicateCount: 0,
                sources: [],
                accentColor: .red
            )
        }
        .padding()
        .background(Color(.systemGray6))
    }
}

#Preview {
    ClusteredNewsCard_Preview()
}