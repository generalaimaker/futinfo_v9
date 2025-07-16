import Foundation
import SwiftUI

/// 강화된 뉴스 캐시 매니저 - 안정적인 뉴스 표시를 위한 캐싱
final class EnhancedNewsCacheManager {
    static let shared = EnhancedNewsCacheManager()
    
    private let userDefaults = UserDefaults.standard
    private let cacheKeyPrefix = "news_cache_v3_" // 버전 업데이트로 기존 캐시 무효화
    private let lastFetchKeyPrefix = "news_last_fetch_"
    private let cacheExpiry: TimeInterval = 1800 // 30분
    
    private init() {}
    
    // MARK: - In-Memory Cache for Fast Access
    private var memoryCache: [NewsCategory: [CachedNewsArticle]] = [:]
    private var memoryCacheTimes: [NewsCategory: Date] = [:]
    
    // MARK: - Models
    
    struct CachedNewsArticle: Codable {
        let id: String
        let title: String
        let summary: String
        let source: String
        let url: String
        let publishedAt: Date
        let category: String
        let imageUrl: String?
        
        init(from article: NewsArticle) {
            self.id = article.id.uuidString
            self.title = article.title
            self.summary = article.summary
            self.source = article.source
            self.url = article.url
            self.publishedAt = article.publishedAt
            self.category = article.category.rawValue
            self.imageUrl = article.imageUrl
        }
        
        func toNewsArticle() -> NewsArticle {
            NewsArticle(
                title: title,
                summary: summary,
                source: source,
                url: url,
                publishedAt: publishedAt,
                category: NewsCategory(rawValue: category) ?? .general,
                imageUrl: imageUrl
            )
        }
    }
    
    // MARK: - Cache Operations
    
    /// 뉴스 캐시 저장
    func cacheNews(_ articles: [NewsArticle], for category: NewsCategory) {
        let cachedArticles = articles.map { CachedNewsArticle(from: $0) }
        
        // 메모리 캐시 업데이트
        memoryCache[category] = cachedArticles
        memoryCacheTimes[category] = Date()
        
        // 디스크 캐시 저장
        let key = cacheKeyPrefix + category.rawValue
        if let encoded = try? JSONEncoder().encode(cachedArticles) {
            userDefaults.set(encoded, forKey: key)
            userDefaults.set(Date(), forKey: lastFetchKeyPrefix + category.rawValue)
        }
        
        print("✅ Cached \(articles.count) articles for \(category.displayName)")
    }
    
    /// 캐시된 뉴스 가져오기
    func getCachedNews(for category: NewsCategory) -> [NewsArticle]? {
        // 1. 먼저 메모리 캐시 확인
        if let memCached = memoryCache[category],
           let cacheTime = memoryCacheTimes[category],
           Date().timeIntervalSince(cacheTime) < 60 { // 1분 이내 메모리 캐시 사용
            print("📱 Returning \(memCached.count) articles from memory cache")
            return memCached.map { $0.toNewsArticle() }
        }
        
        // 2. 디스크 캐시 확인
        let key = cacheKeyPrefix + category.rawValue
        guard let data = userDefaults.data(forKey: key),
              let cachedArticles = try? JSONDecoder().decode([CachedNewsArticle].self, from: data) else {
            return nil
        }
        
        // 3. 캐시 만료 확인
        let lastFetchKey = lastFetchKeyPrefix + category.rawValue
        if let lastFetch = userDefaults.object(forKey: lastFetchKey) as? Date {
            let age = Date().timeIntervalSince(lastFetch)
            if age > cacheExpiry {
                print("⏰ Cache expired for \(category.displayName) (age: \(Int(age))s)")
                return nil
            }
        }
        
        // 4. 메모리 캐시 업데이트 후 반환
        memoryCache[category] = cachedArticles
        memoryCacheTimes[category] = Date()
        
        print("💾 Returning \(cachedArticles.count) articles from disk cache")
        return cachedArticles.map { $0.toNewsArticle() }
    }
    
    /// 캐시가 유효한지 확인
    func isCacheValid(for category: NewsCategory) -> Bool {
        let lastFetchKey = lastFetchKeyPrefix + category.rawValue
        guard let lastFetch = userDefaults.object(forKey: lastFetchKey) as? Date else {
            return false
        }
        
        return Date().timeIntervalSince(lastFetch) < cacheExpiry
    }
    
    /// 마지막 업데이트 시간
    func lastUpdateTime(for category: NewsCategory) -> Date? {
        let lastFetchKey = lastFetchKeyPrefix + category.rawValue
        return userDefaults.object(forKey: lastFetchKey) as? Date
    }
    
    /// 모든 캐시 삭제
    func clearAllCache() {
        memoryCache.removeAll()
        memoryCacheTimes.removeAll()
        
        for category in NewsCategory.allCases {
            userDefaults.removeObject(forKey: cacheKeyPrefix + category.rawValue)
            userDefaults.removeObject(forKey: lastFetchKeyPrefix + category.rawValue)
        }
        
        print("🗑️ All news cache cleared")
    }
    
    /// 특정 카테고리 캐시 삭제
    func clearCache(for category: NewsCategory) {
        memoryCache[category] = nil
        memoryCacheTimes[category] = nil
        
        userDefaults.removeObject(forKey: cacheKeyPrefix + category.rawValue)
        userDefaults.removeObject(forKey: lastFetchKeyPrefix + category.rawValue)
        
        print("🗑️ Cache cleared for \(category.displayName)")
    }
}

// MARK: - Sample Data Provider (Fallback)

extension EnhancedNewsCacheManager {
    /// 네트워크 실패시 표시할 샘플 데이터
    static func getSampleNews(for category: NewsCategory) -> [NewsArticle] {
        let now = Date()
        
        switch category {
        case .transfer:
            return [
                NewsArticle(
                    title: "Breaking: Manchester United close to signing new striker",
                    summary: "The Red Devils are reportedly in advanced talks with a world-class striker. Deal expected to be completed within days.",
                    source: "Sky Sports [Sample]",
                    url: "https://example.com",
                    publishedAt: now.addingTimeInterval(-3600),
                    category: .transfer,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Chelsea preparing £80m bid for midfielder",
                    summary: "Chelsea are ready to make a significant investment in their midfield with a big-money move.",
                    source: "BBC Sport [Sample]",
                    url: "https://example.com",
                    publishedAt: now.addingTimeInterval(-7200),
                    category: .transfer,
                    imageUrl: nil
                )
            ]
            
        case .injury:
            return [
                NewsArticle(
                    title: "Liverpool star ruled out for 6 weeks",
                    summary: "Key player suffers hamstring injury in training and will miss crucial fixtures.",
                    source: "The Guardian [Sample]",
                    url: "https://example.com",
                    publishedAt: now.addingTimeInterval(-5400),
                    category: .injury,
                    imageUrl: nil
                )
            ]
            
        default:
            return [
                NewsArticle(
                    title: "Premier League: Weekend preview and predictions",
                    summary: "All you need to know about this weekend's Premier League fixtures.",
                    source: "BBC Sport [Sample]",
                    url: "https://example.com",
                    publishedAt: now.addingTimeInterval(-1800),
                    category: .general,
                    imageUrl: nil
                ),
                NewsArticle(
                    title: "Champions League draw: Key matchups revealed",
                    summary: "European giants set to clash in the knockout stages.",
                    source: "UEFA [Sample]",
                    url: "https://example.com",
                    publishedAt: now.addingTimeInterval(-3600),
                    category: .match,
                    imageUrl: nil
                )
            ]
        }
    }
}