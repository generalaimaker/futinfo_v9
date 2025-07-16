import Foundation
import SwiftUI
import Combine

@MainActor
class StableNewsViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var articles: [NewsArticle] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedCategory: NewsCategory = .all
    @Published var searchText = ""
    @Published var hasNewNews = false
    @Published var lastUpdateTime: Date?
    
    // MARK: - Loading States
    @Published var isInitialLoad = true
    @Published var isRefreshing = false
    @Published var loadingProgress: Double = 0.0
    
    // MARK: - Services
    private let newsService = NewsService.shared
    private let enhancedNewsService = EnhancedNewsService.shared
    private let simpleNewsService = SimpleNewsService.shared
    private let optimizedNewsService = OptimizedNewsService.shared
    private let preloadedService = PreloadedNewsService.shared
    private let cacheManager = EnhancedNewsCacheManager.shared
    
    // MARK: - Private Properties
    private var cancellables = Set<AnyCancellable>()
    private var loadingTask: Task<Void, Never>?
    private var refreshTimer: Timer?
    
    // MARK: - Computed Properties
    var filteredArticles: [NewsArticle] {
        let filtered = searchText.isEmpty 
            ? articles 
            : articles.filter { article in
                article.title.localizedCaseInsensitiveContains(searchText) ||
                article.summary.localizedCaseInsensitiveContains(searchText) ||
                article.source.localizedCaseInsensitiveContains(searchText)
            }
        
        return filtered.sorted { $0.publishedAt > $1.publishedAt }
    }
    
    var hasContent: Bool {
        !articles.isEmpty || !isInitialLoad
    }
    
    // MARK: - Initialization
    init() {
        setupBindings()
        startAutoRefresh()
    }
    
    deinit {
        loadingTask?.cancel()
        refreshTimer?.invalidate()
    }
    
    // MARK: - Setup
    private func setupBindings() {
        // 카테고리 변경시 자동 로드
        $selectedCategory
            .dropFirst()
            .sink { [weak self] _ in
                Task {
                    await self?.loadNews()
                }
            }
            .store(in: &cancellables)
    }
    
    private func startAutoRefresh() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            Task {
                await self?.checkForNewNews()
            }
        }
    }
    
    // MARK: - Public Methods
    
    /// 뉴스 로드 (초기 로드 또는 카테고리 변경시)
    func loadNews() async {
        // 이미 로딩 중이면 리턴
        guard !isLoading else { return }
        
        // 기존 태스크 취소
        loadingTask?.cancel()
        
        loadingTask = Task {
            // 초기 로드 시 강제 새로고침으로 깨끗한 데이터 가져오기
            await performLoadNews(forceRefresh: isInitialLoad)
        }
    }
    
    /// 새로고침
    func refreshNews() async {
        // 이미 새로고침 중이면 리턴
        guard !isRefreshing else { return }
        
        isRefreshing = true
        await performLoadNews(forceRefresh: true)
        isRefreshing = false
    }
    
    /// 카테고리 선택
    func selectCategory(_ category: NewsCategory) {
        guard selectedCategory != category else { return }
        
        // 카테고리 변경 시 즉시 해당 카테고리의 프리로드 뉴스 표시
        withAnimation(.easeIn(duration: 0.1)) {
            self.articles = preloadedService.getPreloadedNews(for: category)
        }
        
        selectedCategory = category
    }
    
    /// 새 뉴스 확인
    func checkForNewNews() async {
        guard let lastUpdate = lastUpdateTime else { return }
        
        do {
            let hasNew = try await newsService.hasNewNews(since: lastUpdate)
            if hasNew {
                withAnimation {
                    hasNewNews = true
                }
            }
        } catch {
            // 조용히 실패
        }
    }
    
    // MARK: - Private Methods
    
    private func performLoadNews(forceRefresh: Bool) async {
        // UI 상태 업데이트
        errorMessage = nil
        
        // 카테고리가 변경되었거나 초기 로드인 경우 즉시 프리로드 뉴스 표시
        withAnimation(.easeIn(duration: 0.2)) {
            self.articles = preloadedService.getPreloadedNews(for: selectedCategory)
            self.isInitialLoad = false
            self.isLoading = false // 로딩 표시 안함
        }
        
        // 백그라운드에서 최적화된 뉴스 가져오기
        let freshNews = await optimizedNewsService.fetchNews(category: selectedCategory, forceRefresh: forceRefresh)
        
        // 실제 뉴스가 있으면 업데이트
        if freshNews.count > 3 { // 프리로드 데이터보다 많으면
            withAnimation(.easeInOut(duration: 0.3)) {
                self.articles = freshNews
                self.lastUpdateTime = Date()
                self.hasNewNews = false
            }
            print("✅ Successfully loaded \(freshNews.count) articles for \(selectedCategory.displayName)")
        } else {
            print("⚠️ Using preloaded news for \(selectedCategory.displayName)")
        }
        
        // UI 상태 정리
        isLoading = false
        loadingProgress = 0.0
    }
}

// MARK: - News Loading State

enum NewsLoadingState {
    case idle
    case loading(progress: Double)
    case loaded(count: Int)
    case error(String)
    case empty
    
    var description: String {
        switch self {
        case .idle:
            return "준비 중..."
        case .loading(let progress):
            return "뉴스 불러오는 중... \(Int(progress * 100))%"
        case .loaded(let count):
            return "\(count)개의 뉴스"
        case .error(let message):
            return message
        case .empty:
            return "뉴스가 없습니다"
        }
    }
}