import SwiftUI

struct TrustedNewsTestView: View {
    @StateObject private var viewModel = NewsViewModel()
    @State private var selectedCategory = NewsCategory.all
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("공신력 있는 뉴스")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Spacer()
                        
                        Image(systemName: "checkmark.seal.fill")
                            .font(.title)
                            .foregroundColor(.green)
                    }
                    
                    Text("BBC, Sky Sports, UEFA 등 검증된 소스만 제공")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                
                // Category Picker
                Picker("Category", selection: $selectedCategory) {
                    ForEach(NewsCategory.allCases) { category in
                        Text(category.displayName).tag(category)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                
                // News List
                List {
                    ForEach(filteredNews) { article in
                        VStack(alignment: .leading, spacing: 12) {
                            // Title with emoji if present
                            Text(article.title)
                                .font(.headline)
                                .lineLimit(2)
                            
                            // Trust Indicator
                            TrustIndicator(source: article.source)
                            
                            // Source and Time
                            HStack {
                                Text(article.source)
                                    .font(.caption)
                                    .foregroundColor(.blue)
                                
                                Spacer()
                                
                                Text(article.timeAgo)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            // Summary
                            if !article.summary.isEmpty && article.summary != "No description available" {
                                Text(article.summary)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .lineLimit(3)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }
                .listStyle(PlainListStyle())
                .refreshable {
                    await viewModel.refreshNews()
                }
            }
            .navigationBarHidden(true)
            .task {
                await viewModel.loadNews()
            }
        }
    }
    
    var filteredNews: [NewsArticle] {
        if selectedCategory == .all {
            return viewModel.articles
        } else {
            return viewModel.articles.filter { $0.category == selectedCategory }
        }
    }
}

#Preview {
    TrustedNewsTestView()
}