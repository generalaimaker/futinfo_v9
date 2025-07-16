import Foundation

/// 향상된 뉴스 중복 제거 서비스 - 클러스터 정보 포함
final class EnhancedNewsDeduplicationService {
    
    static let shared = EnhancedNewsDeduplicationService()
    
    private init() {}
    
    // MARK: - 중복 제거 with 클러스터 정보
    
    /// 중복 뉴스를 제거하고 클러스터 정보를 포함한 결과 반환
    func deduplicateNewsWithClusters(_ articles: [NewsArticle]) -> [EnhancedNewsArticle] {
        guard articles.count > 1 else {
            return articles.map { EnhancedNewsArticle(article: $0, duplicateCount: 0, duplicateSources: []) }
        }
        
        // 1단계: 뉴스 클러스터 생성
        let clusters = createNewsClusters(from: articles)
        
        // 2단계: 각 클러스터에서 최고의 기사 선택하고 중복 정보 추가
        let enhancedArticles = clusters.compactMap { cluster -> EnhancedNewsArticle? in
            guard let best = selectBestArticle(from: cluster) else { return nil }
            
            // 중복 소스 추출 (자기 자신 제외)
            let duplicateSources = cluster
                .filter { $0.id != best.id }
                .map { $0.source }
                .sorted { source1, source2 in
                    // 신뢰도 순으로 정렬
                    sourceReliabilityScore(source1) > sourceReliabilityScore(source2)
                }
            
            return EnhancedNewsArticle(
                article: best,
                duplicateCount: cluster.count - 1,
                duplicateSources: duplicateSources
            )
        }
        
        // 3단계: 날짜순 정렬
        return enhancedArticles.sorted { $0.article.publishedAt > $1.article.publishedAt }
    }
    
    // MARK: - 빠른 중복 제거 (클러스터 정보 없이)
    
    /// 간단한 중복 제거 (성능 우선)
    func quickDeduplicate(_ articles: [NewsArticle]) -> [NewsArticle] {
        var seen = Set<String>()
        var deduped: [NewsArticle] = []
        
        for article in articles {
            // 빠른 해시 생성
            let hash = generateQuickHash(for: article)
            
            if seen.insert(hash).inserted {
                deduped.append(article)
            }
        }
        
        return deduped
    }
    
    // MARK: - Private Methods (기존 NewsDeduplicationService와 동일)
    
    private func createNewsClusters(from articles: [NewsArticle]) -> [[NewsArticle]] {
        var clusters: [[NewsArticle]] = []
        var processedArticles = Set<String>()
        
        for article in articles {
            if processedArticles.contains(article.id.uuidString) {
                continue
            }
            
            var cluster = [article]
            processedArticles.insert(article.id.uuidString)
            
            for otherArticle in articles {
                if otherArticle.id != article.id && 
                   !processedArticles.contains(otherArticle.id.uuidString) &&
                   areSimilar(article, otherArticle) {
                    cluster.append(otherArticle)
                    processedArticles.insert(otherArticle.id.uuidString)
                }
            }
            
            clusters.append(cluster)
        }
        
        return clusters
    }
    
    private func areSimilar(_ article1: NewsArticle, _ article2: NewsArticle) -> Bool {
        // 1. 제목 유사도 검사
        let titleSimilarity = calculateSimilarity(article1.title, article2.title)
        if titleSimilarity > 0.85 {
            return true
        }
        
        // 2. 시간 근접성 검사 (4시간 이내)
        let timeDifference = abs(article1.publishedAt.timeIntervalSince(article2.publishedAt))
        if timeDifference > 14400 {
            return false
        }
        
        // 3. 핵심 키워드 검사
        let keywords1 = extractKeywords(from: article1)
        let keywords2 = extractKeywords(from: article2)
        let commonKeywords = keywords1.intersection(keywords2)
        
        let keywordOverlap = Double(commonKeywords.count) / Double(min(keywords1.count, keywords2.count))
        if keywordOverlap > 0.7 && titleSimilarity > 0.5 {
            return true
        }
        
        // 4. 특별한 경우: 이적 뉴스는 선수명이 같으면 유사
        if article1.category == .transfer && article2.category == .transfer {
            let playerName1 = extractPlayerName(from: article1.title)
            let playerName2 = extractPlayerName(from: article2.title)
            if let name1 = playerName1, let name2 = playerName2, name1 == name2 {
                return true
            }
        }
        
        return false
    }
    
    private func selectBestArticle(from cluster: [NewsArticle]) -> NewsArticle? {
        guard !cluster.isEmpty else { return nil }
        guard cluster.count > 1 else { return cluster.first }
        
        let scoredArticles = cluster.map { article -> (NewsArticle, Double) in
            var score = 0.0
            
            // 1. 소스 신뢰도 점수 (최대 40점)
            score += sourceReliabilityScore(article.source) * 40
            
            // 2. 콘텐츠 품질 점수 (최대 30점)
            score += contentQualityScore(article) * 30
            
            // 3. 시간 점수 (최신일수록 높음, 최대 20점)
            let hoursAgo = Date().timeIntervalSince(article.publishedAt) / 3600
            score += max(0, 20 - hoursAgo * 2)
            
            // 4. 제목 품질 점수 (최대 10점)
            score += titleQualityScore(article.title) * 10
            
            return (article, score)
        }
        
        return scoredArticles.max { $0.1 < $1.1 }?.0
    }
    
    // MARK: - 빠른 해시 생성
    
    private func generateQuickHash(for article: NewsArticle) -> String {
        // 제목의 주요 단어들로 해시 생성
        let normalizedTitle = article.title
            .lowercased()
            .replacingOccurrences(of: "[^a-zA-Z0-9\\s]", with: "", options: .regularExpression)
            .split(separator: " ")
            .filter { $0.count > 3 } // 짧은 단어 제외
            .sorted() // 순서 무관하게
            .joined(separator: "-")
        
        // 카테고리와 시간대 포함
        let hourBucket = Int(article.publishedAt.timeIntervalSince1970 / 3600)
        
        return "\(article.category.rawValue)-\(hourBucket)-\(normalizedTitle)"
    }
    
    // MARK: - Helper Methods (기존과 동일)
    
    private func calculateSimilarity(_ text1: String, _ text2: String) -> Double {
        let str1 = normalizeText(text1)
        let str2 = normalizeText(text2)
        
        let words1 = Set(str1.split(separator: " ").map { String($0) })
        let words2 = Set(str2.split(separator: " ").map { String($0) })
        
        let intersection = words1.intersection(words2)
        let union = words1.union(words2)
        
        guard !union.isEmpty else { return 0 }
        
        return Double(intersection.count) / Double(union.count)
    }
    
    private func normalizeText(_ text: String) -> String {
        return text
            .lowercased()
            .replacingOccurrences(of: "[^a-zA-Z0-9\\s]", with: " ", options: .regularExpression)
            .split(separator: " ")
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }
    
    private func extractKeywords(from article: NewsArticle) -> Set<String> {
        let fullText = "\(article.title) \(article.summary)".lowercased()
        
        let stopWords = Set([
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "been", "be"
        ])
        
        let words = fullText
            .replacingOccurrences(of: "[^a-zA-Z0-9\\s]", with: " ", options: .regularExpression)
            .split(separator: " ")
            .map { String($0) }
            .filter { $0.count > 2 && !stopWords.contains($0) }
        
        return Set(words)
    }
    
    private func extractPlayerName(from title: String) -> String? {
        // 간단한 휴리스틱: 대문자로 시작하는 연속된 2-3개 단어
        let words = title.split(separator: " ").map { String($0) }
        
        for i in 0..<words.count-1 {
            let word1 = words[i]
            let word2 = words[i+1]
            
            if word1.first?.isUppercase == true && word2.first?.isUppercase == true {
                // 제외할 팀명들
                let teamNames = Set(["Manchester", "United", "City", "Chelsea", "Arsenal", "Liverpool", "Tottenham", "Real", "Madrid", "Barcelona"])
                if !teamNames.contains(word1) && !teamNames.contains(word2) {
                    return "\(word1) \(word2)"
                }
            }
        }
        
        return nil
    }
    
    private func sourceReliabilityScore(_ source: String) -> Double {
        if source.contains("[OFFICIAL]") || source.contains("Official") {
            return 1.0
        } else if source.contains("[Tier 1]") || source.contains("BBC") || source.contains("Guardian") {
            return 0.95
        } else if source.contains("[CONFIRMED]") || source.contains("✓") {
            return 0.9
        } else if source.contains("[Verified]") || source.contains("⭐") {
            return 0.85
        } else if source.contains("[Analytics]") {
            return 0.8
        } else if source.contains("[Transfer Expert]") {
            return 0.75
        } else if source.contains("[Reliable]") {
            return 0.7
        } else if source.contains("[Rumour]") {
            return 0.4
        }
        return 0.5
    }
    
    private func contentQualityScore(_ article: NewsArticle) -> Double {
        var score = 0.0
        
        let summaryLength = article.summary.count
        if summaryLength > 100 && summaryLength < 500 {
            score += 0.4
        } else if summaryLength > 50 {
            score += 0.2
        }
        
        if article.title.contains("🚨") || article.title.contains("✅") || article.title.contains("⚡") {
            score += 0.3
        }
        
        return min(score, 1.0)
    }
    
    private func titleQualityScore(_ title: String) -> Double {
        var score = 0.5
        
        if title.count > 30 && title.count < 120 {
            score += 0.3
        }
        
        let clickbaitWords = ["BREAKING", "SHOCK", "BOMBSHELL", "EXCLUSIVE"]
        if clickbaitWords.contains(where: { title.uppercased().contains($0) }) {
            score -= 0.3
        }
        
        if title.contains(where: { $0.isNumber }) {
            score += 0.2
        }
        
        return max(0, min(score, 1.0))
    }
}

// MARK: - Enhanced News Article Model

struct EnhancedNewsArticle: Identifiable {
    let id = UUID()
    let article: NewsArticle
    let duplicateCount: Int
    let duplicateSources: [String]
    
    var hasDuplicates: Bool {
        duplicateCount > 0
    }
}