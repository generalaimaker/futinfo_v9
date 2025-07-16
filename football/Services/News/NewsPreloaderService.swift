import Foundation
import SwiftUI

/// 앱 시작 시 뉴스를 미리 준비하는 서비스
final class NewsPreloaderService: ObservableObject {
    
    static let shared = NewsPreloaderService()
    
    @Published private(set) var isReady = false
    @Published private(set) var preloadedNews: [NewsCategory: [NewsArticle]] = [:]
    
    private let simpleNewsService = SimpleNewsService.shared
    private let preloadedService = PreloadedNewsService.shared
    
    private init() {
        // 앱 시작 시 자동으로 프리로드
        Task {
            await preloadAllNews()
        }
    }
    
    /// 모든 카테고리의 뉴스를 미리 로드
    func preloadAllNews() async {
        print("🚀 뉴스 프리로딩 시작...")
        
        // 1. 즉시 프리로드된 데이터 설정
        await MainActor.run {
            self.preloadedNews[.general] = preloadedService.getPreloadedNews(for: .general)
            self.preloadedNews[.transfer] = preloadedService.getPreloadedNews(for: .transfer)
            self.preloadedNews[.injury] = preloadedService.getPreloadedNews(for: .injury)
            self.preloadedNews[.all] = preloadedService.getAllPreloadedNews()
            self.isReady = true
        }
        
        print("✅ 프리로드 뉴스 준비 완료")
        
        // 2. 백그라운드에서 실제 뉴스 가져오기
        await fetchRealNewsInBackground()
    }
    
    /// 특정 카테고리의 뉴스 가져오기 (캐시 우선)
    func getNews(for category: NewsCategory) -> [NewsArticle] {
        return preloadedNews[category] ?? preloadedService.getPreloadedNews(for: category)
    }
    
    /// 백그라운드에서 실제 뉴스 업데이트
    private func fetchRealNewsInBackground() async {
        // 각 카테고리별로 실제 뉴스 가져오기
        for category in NewsCategory.allCases {
            let realNews = await simpleNewsService.fetchNews(category: category)
            
            // 실제 뉴스가 더 많으면 업데이트
            if realNews.count > (preloadedNews[category]?.count ?? 0) {
                await MainActor.run {
                    self.preloadedNews[category] = realNews
                }
                print("✅ \(category.displayName) 실제 뉴스로 업데이트: \(realNews.count)개")
            }
        }
    }
    
    /// 뉴스 새로고침
    func refreshNews(for category: NewsCategory) async -> [NewsArticle] {
        let freshNews = await simpleNewsService.refreshNews(category: category)
        
        await MainActor.run {
            self.preloadedNews[category] = freshNews
        }
        
        return freshNews
    }
}