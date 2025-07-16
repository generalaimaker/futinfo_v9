import Foundation
import SwiftUI

@MainActor
class NewsViewModel: ObservableObject {
    @Published var articles: [NewsArticle] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedCategory: NewsCategory = .all
    @Published var searchText = ""
    
    private let newsService = NewsService.shared
    
    var filteredArticles: [NewsArticle] {
        var filtered = articles
        
        // 카테고리 필터
        if selectedCategory != .all {
            filtered = filtered.filter { $0.category == selectedCategory }
        }
        
        // 검색 필터
        if !searchText.isEmpty {
            filtered = filtered.filter { article in
                article.title.localizedCaseInsensitiveContains(searchText) ||
                article.summary.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        // 최신순 정렬
        return filtered.sorted { $0.publishedAt > $1.publishedAt }
    }
    
    func loadNews() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let fetchedArticles = try await newsService.fetchNews(category: .all)
            articles = fetchedArticles
        } catch {
            errorMessage = "뉴스를 불러오는데 실패했습니다: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func refreshNews() async {
        await loadNews()
    }
    
    func selectCategory(_ category: NewsCategory) {
        selectedCategory = category
    }
    
    func searchNews(_ query: String) {
        searchText = query
    }
}