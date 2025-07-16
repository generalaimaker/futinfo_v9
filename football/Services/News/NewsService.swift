import Foundation

/// 뉴스 서비스 - RSS 기반 실제 축구 뉴스 제공
class NewsService: ObservableObject {
    
    static let shared = NewsService()
    
    private let rssService = FootballRSSService.shared
    private let trustedRSSService = TrustedFootballRSSService.shared
    private let expandedRSSService = ExpandedFootballRSSService.shared
    private let cacheManager = EnhancedNewsCacheManager.shared
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// 카테고리별 뉴스 가져오기 (확장된 RSS 소스 사용)
    func fetchNews(category: NewsCategory = .all, forceRefresh: Bool = false) async throws -> [NewsArticle] {
        // 강제 새로고침이 아니고 캐시가 유효하면 캐시 반환
        if !forceRefresh, let cachedNews = cacheManager.getCachedNews(for: category) {
            print("📱 Returning cached news immediately")
            return cachedNews
        }
        
        do {
            // 신뢰할 수 있는 소스에서만 뉴스 가져오기
            let trustedCategory = mapToTrustedCategory(category)
            // 이적 뉴스는 루머도 포함하기 위해 신뢰도 기준을 낮춤
            let minimumTrustScore = category == .transfer ? 50 : 80
            
            let trustedNews = try await trustedRSSService.fetchTrustedNews(
                category: trustedCategory,
                minimumTrustScore: minimumTrustScore
            )
            
            // 이적 뉴스는 모든 티어 포함 (루머도 포함)
            let filteredNews: [TrustedFootballRSSService.TrustedRSSNewsItem]
            if category == .transfer {
                // 이적 뉴스는 필터링하지 않고 모두 포함
                filteredNews = trustedNews
            } else {
                // 다른 카테고리는 신뢰도 높은 것만
                filteredNews = trustedNews
            }
            
            // TrustedRSSNewsItem을 NewsArticle로 변환
            let newsArticles = filteredNews.map { trustedItem in
                NewsArticle(
                    title: formatTransferTitle(trustedItem),
                    summary: trustedItem.description ?? "No description available",
                    source: formatSource(trustedItem),
                    url: trustedItem.link,
                    publishedAt: trustedItem.pubDate,
                    category: category,
                    imageUrl: nil
                )
            }
            
            print("✅ Fetched \(newsArticles.count) trusted news articles (min trust: \(minimumTrustScore)%)")
            
            // 캐시에 저장
            if !newsArticles.isEmpty {
                cacheManager.cacheNews(newsArticles, for: category)
            }
            
            return newsArticles
            
        } catch {
            print("❌ Failed to fetch trusted RSS news: \(error.localizedDescription)")
            
            // 네트워크 오류 시 캐시된 뉴스 반환
            if let cachedNews = cacheManager.getCachedNews(for: category) {
                print("📋 Returning \(cachedNews.count) cached news articles")
                return cachedNews
            }
            
            // 캐시도 없으면 샘플 데이터 반환
            print("📋 Returning sample news as fallback")
            return EnhancedNewsCacheManager.getSampleNews(for: category)
        }
    }
    
    /// 뉴스 검색
    func searchNews(query: String) async throws -> [NewsArticle] {
        let allNews = try await fetchNews()
        return allNews.filter { article in
            article.title.localizedCaseInsensitiveContains(query) ||
            article.summary.localizedCaseInsensitiveContains(query) ||
            article.source.localizedCaseInsensitiveContains(query)
        }
    }
    
    /// 최고 품질 뉴스만 가져오기 (신뢰도 90% 이상)
    func fetchTopQualityNews(limit: Int = 20) async throws -> [NewsArticle] {
        do {
            let trustedNews = try await trustedRSSService.fetchTrustedNews(
                category: .general,
                minimumTrustScore: 90
            )
            
            let topNews = Array(trustedNews.prefix(limit))
            
            return topNews.map { trustedItem in
                NewsArticle(
                    title: trustedItem.title,
                    summary: trustedItem.description ?? "No description available",
                    source: formatSource(trustedItem),
                    url: trustedItem.link,
                    publishedAt: trustedItem.pubDate,
                    category: mapFromTrustedCategory(trustedItem.category),
                    imageUrl: nil
                )
            }
        } catch {
            print("❌ Failed to fetch top quality news: \(error)")
            return try await fetchNews(category: .all)
        }
    }
    
    /// Tier 1 이적 뉴스만 가져오기
    func fetchTier1TransferNews() async throws -> [NewsArticle] {
        do {
            let tier1News = try await trustedRSSService.fetchTier1TransferNews()
            
            return tier1News.map { trustedItem in
                NewsArticle(
                    title: formatTransferTitle(trustedItem),
                    summary: trustedItem.description ?? "No description available",
                    source: formatSource(trustedItem),
                    url: trustedItem.link,
                    publishedAt: trustedItem.pubDate,
                    category: .transfer,
                    imageUrl: nil
                )
            }
        } catch {
            print("❌ Failed to fetch Tier 1 transfer news: \(error)")
            return []
        }
    }
    
    /// 실시간 뉴스 업데이트 체크
    func hasNewNews(since lastUpdate: Date) async throws -> Bool {
        let recentNews = try await fetchNews()
        return recentNews.contains { $0.publishedAt > lastUpdate }
    }
    
    // MARK: - Private Methods
}

// MARK: - News Cache Manager

private class NewsCacheManager {
    private let cacheKey = "cached_news"
    private let cacheExpiry: TimeInterval = 300 // 5분
    
    func cacheNews(_ news: [NewsArticle], for category: NewsCategory) {
        // For now, disable caching since NewsArticle is not Codable
        // TODO: Implement proper caching with Codable models
    }
    
    func getCachedNews(for category: NewsCategory) -> [NewsArticle]? {
        // For now, return nil since we're not caching
        return nil
    }
    
    func clearCache() {
        let categories = NewsCategory.allCases
        for category in categories {
            UserDefaults.standard.removeObject(forKey: "\(cacheKey)_\(category.rawValue)")
        }
    }
}

private struct CachedNewsData {
    let news: [NewsArticle]
    let category: NewsCategory
    let timestamp: Date
}

    // MARK: - Helper Methods
    
    private func mapToTrustedCategory(_ category: NewsCategory) -> TrustedFootballRSSService.FootballNewsCategory {
        switch category {
        case .all, .general:
            return .general
        case .transfer:
            return .transfer
        case .match:
            return .match
        case .injury:
            return .injury
        }
    }
    
    private func mapFromTrustedCategory(_ category: TrustedFootballRSSService.FootballNewsCategory) -> NewsCategory {
        switch category {
        case .official, .general:
            return .general
        case .transfer:
            return .transfer
        case .match:
            return .match
        case .injury:
            return .injury
        }
    }
    
    private func formatSource(_ item: TrustedFootballRSSService.TrustedRSSNewsItem) -> String {
        var source = item.source
        
        // 신뢰도 점수에 따른 표시
        if item.trustScore >= 95 {
            source += " ✓"
        } else if item.trustScore >= 85 {
            source += " ⭐"
        }
        
        // 기자 정보 추가
        if let journalist = item.journalist {
            source += " • \(journalist)"
        }
        
        // 이적 신뢰도 티어 추가
        if let tier = item.transferTier {
            switch tier {
            case .official:
                source += " [OFFICIAL]"
            case .tierOne:
                source += " [Tier 1]"
            case .verified:
                source += " [Verified]"
            case .reliable:
                source += " [Reliable]"
            case .questionable:
                source += " [Rumour]"
            case .unreliable:
                source += " [Unverified]"
            }
        } else if item.trustScore < 70 && item.category == .transfer {
            // 낮은 신뢰도 이적 뉴스는 루머로 표시
            source += " [Rumour]"
        }
        
        return source
    }
    
    private func formatTransferTitle(_ item: TrustedFootballRSSService.TrustedRSSNewsItem) -> String {
        var title = item.title
        
        // Here we go! 표시
        if item.title.lowercased().contains("here we go") {
            title = "🚨 " + title
        }
        
        // 공식 발표 표시
        if let tier = item.transferTier, tier == .official {
            title = "✅ " + title
        }
        
        return title
    }

// MARK: - Extensions

extension FootballRSSService.FootballNewsCategory {
    init(from newsCategory: NewsCategory) {
        switch newsCategory {
        case .all:
            self = .all
        case .transfer:
            self = .transfer
        case .match, .general, .injury:
            self = .general
        }
    }
}

// NewsCategory extension removed - already defined in FootballRSSService.swift