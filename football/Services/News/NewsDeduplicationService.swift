import Foundation
import CryptoKit

/// 뉴스 중복 제거 서비스 - 고급 알고리즘 사용
final class NewsDeduplicationService {
    
    static let shared = NewsDeduplicationService()
    
    private init() {}
    
    // MARK: - 중복 제거 메인 메서드
    
    /// 중복 뉴스를 제거하고 가장 신뢰할 수 있는 소스의 뉴스만 남김
    func deduplicateNews(_ articles: [NewsArticle]) -> [NewsArticle] {
        guard articles.count > 1 else { return articles }
        
        // 1단계: 뉴스 클러스터 생성
        let clusters = createNewsClusters(from: articles)
        
        // 2단계: 각 클러스터에서 최고의 기사 선택
        let bestArticles = clusters.compactMap { cluster in
            selectBestArticle(from: cluster)
        }
        
        // 3단계: 날짜순 정렬
        return bestArticles.sorted { $0.publishedAt > $1.publishedAt }
    }
    
    // MARK: - 뉴스 클러스터링
    
    private func createNewsClusters(from articles: [NewsArticle]) -> [[NewsArticle]] {
        var clusters: [[NewsArticle]] = []
        var processedArticles = Set<String>()
        
        for article in articles {
            // 이미 처리된 기사는 스킵
            if processedArticles.contains(article.id.uuidString) {
                continue
            }
            
            // 유사한 기사들 찾기
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
    
    // MARK: - 유사도 검사
    
    private func areSimilar(_ article1: NewsArticle, _ article2: NewsArticle) -> Bool {
        // 1. 제목 유사도 검사
        let titleSimilarity = calculateSimilarity(article1.title, article2.title)
        if titleSimilarity > 0.85 {
            return true
        }
        
        // 2. 시간 근접성 검사 (4시간 이내)
        let timeDifference = abs(article1.publishedAt.timeIntervalSince(article2.publishedAt))
        if timeDifference > 14400 { // 4시간
            return false
        }
        
        // 3. 핵심 키워드 검사
        let keywords1 = extractKeywords(from: article1)
        let keywords2 = extractKeywords(from: article2)
        let commonKeywords = keywords1.intersection(keywords2)
        
        // 공통 키워드가 충분히 많으면 유사한 기사로 판단
        let keywordOverlap = Double(commonKeywords.count) / Double(min(keywords1.count, keywords2.count))
        if keywordOverlap > 0.7 && titleSimilarity > 0.5 {
            return true
        }
        
        // 4. 내용 해시 기반 검사 (정확히 같은 내용)
        if article1.summary == article2.summary && !article1.summary.isEmpty {
            return true
        }
        
        return false
    }
    
    // MARK: - 문자열 유사도 계산
    
    private func calculateSimilarity(_ text1: String, _ text2: String) -> Double {
        let str1 = normalizeText(text1)
        let str2 = normalizeText(text2)
        
        // Jaccard 유사도 계산
        let words1 = Set(str1.split(separator: " ").map { String($0) })
        let words2 = Set(str2.split(separator: " ").map { String($0) })
        
        let intersection = words1.intersection(words2)
        let union = words1.union(words2)
        
        guard !union.isEmpty else { return 0 }
        
        let jaccardSimilarity = Double(intersection.count) / Double(union.count)
        
        // Levenshtein 거리 기반 유사도도 고려
        let levenshteinSimilarity = 1.0 - (Double(levenshteinDistance(str1, str2)) / Double(max(str1.count, str2.count)))
        
        // 두 유사도의 평균
        return (jaccardSimilarity + levenshteinSimilarity) / 2.0
    }
    
    // MARK: - 텍스트 정규화
    
    private func normalizeText(_ text: String) -> String {
        // 소문자 변환, 특수문자 제거, 공백 정규화
        return text
            .lowercased()
            .replacingOccurrences(of: "[^a-zA-Z0-9\\s]", with: " ", options: .regularExpression)
            .split(separator: " ")
            .filter { !$0.isEmpty }
            .joined(separator: " ")
    }
    
    // MARK: - 키워드 추출
    
    private func extractKeywords(from article: NewsArticle) -> Set<String> {
        let fullText = "\(article.title) \(article.summary)".lowercased()
        
        // 불용어 제거
        let stopWords = Set([
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "been", "be",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "must", "can", "this", "that", "these", "those",
            "i", "you", "he", "she", "it", "we", "they", "them", "their", "what",
            "which", "who", "when", "where", "why", "how", "all", "each", "every"
        ])
        
        // 단어 추출 및 필터링
        let words = fullText
            .replacingOccurrences(of: "[^a-zA-Z0-9\\s]", with: " ", options: .regularExpression)
            .split(separator: " ")
            .map { String($0) }
            .filter { $0.count > 2 && !stopWords.contains($0) }
        
        // 중요 키워드 추출 (선수명, 팀명, 숫자 포함 단어 등)
        var keywords = Set<String>()
        
        for word in words {
            // 대문자로 시작하는 고유명사 (선수명, 팀명)
            if article.title.contains(word.capitalized) || article.summary.contains(word.capitalized) {
                keywords.insert(word)
            }
            // 숫자가 포함된 단어 (이적료, 계약 기간 등)
            else if word.contains(where: { $0.isNumber }) {
                keywords.insert(word)
            }
            // 축구 관련 주요 키워드
            else if footballKeywords.contains(word) {
                keywords.insert(word)
            }
        }
        
        // 빈도수가 높은 단어도 추가
        let wordFrequency = Dictionary(grouping: words, by: { $0 }).mapValues { $0.count }
        let frequentWords = wordFrequency.filter { $0.value >= 2 }.keys
        keywords.formUnion(frequentWords)
        
        return keywords
    }
    
    // MARK: - 최고의 기사 선택
    
    private func selectBestArticle(from cluster: [NewsArticle]) -> NewsArticle? {
        guard !cluster.isEmpty else { return nil }
        guard cluster.count > 1 else { return cluster.first }
        
        // 점수 계산하여 최고의 기사 선택
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
        
        // 점수가 가장 높은 기사 선택
        let bestArticle = scoredArticles.max { $0.1 < $1.1 }?.0
        
        // 중복 기사 정보를 메타데이터에 추가 (선택사항)
        if let best = bestArticle {
            print("📰 Selected best article from cluster of \(cluster.count) similar articles: \(best.title)")
            print("   Sources: \(cluster.map { $0.source }.joined(separator: ", "))")
        }
        
        return bestArticle
    }
    
    // MARK: - 점수 계산 헬퍼
    
    private func sourceReliabilityScore(_ source: String) -> Double {
        // 소스에 포함된 신뢰도 표시를 기반으로 점수 계산
        if source.contains("[OFFICIAL]") || source.contains("Official") {
            return 1.0
        } else if source.contains("[Tier 1]") || source.contains("BBC") || source.contains("Guardian") {
            return 0.95
        } else if source.contains("[CONFIRMED]") || source.contains("✓") {
            return 0.9
        } else if source.contains("[Verified]") || source.contains("⭐") {
            return 0.85
        } else if source.contains("[Analytics]") || source.contains("Opta") || source.contains("WhoScored") {
            return 0.8
        } else if source.contains("[Transfer Expert]") || source.contains("Transfermarkt") {
            return 0.75
        } else if source.contains("[Reliable]") {
            return 0.7
        } else if source.contains("[Rumour]") || source.contains("[Unverified]") {
            return 0.4
        }
        return 0.5
    }
    
    private func contentQualityScore(_ article: NewsArticle) -> Double {
        var score = 0.0
        
        // 요약 길이 (적당한 길이가 좋음)
        let summaryLength = article.summary.count
        if summaryLength > 100 && summaryLength < 500 {
            score += 0.4
        } else if summaryLength > 50 {
            score += 0.2
        }
        
        // 제목과 요약의 일관성
        let titleWords = Set(article.title.lowercased().split(separator: " ").map { String($0) })
        let summaryWords = Set(article.summary.lowercased().split(separator: " ").map { String($0) })
        let overlap = titleWords.intersection(summaryWords).count
        if overlap > 3 {
            score += 0.3
        }
        
        // 특수 마커 (속보, 공식 등)
        if article.title.contains("🚨") || article.title.contains("✅") || article.title.contains("⚡") {
            score += 0.3
        }
        
        return min(score, 1.0)
    }
    
    private func titleQualityScore(_ title: String) -> Double {
        var score = 0.5 // 기본 점수
        
        // 제목 길이 (너무 짧거나 길지 않은 것이 좋음)
        if title.count > 30 && title.count < 120 {
            score += 0.3
        }
        
        // 클릭베이트 단어 감점
        let clickbaitWords = ["BREAKING", "SHOCK", "BOMBSHELL", "EXCLUSIVE", "YOU WON'T BELIEVE"]
        if clickbaitWords.contains(where: { title.uppercased().contains($0) }) {
            score -= 0.3
        }
        
        // 구체적인 정보 포함 가점
        if title.contains(where: { $0.isNumber }) { // 숫자 포함
            score += 0.2
        }
        
        return max(0, min(score, 1.0))
    }
    
    // MARK: - Levenshtein Distance
    
    private func levenshteinDistance(_ s1: String, _ s2: String) -> Int {
        let m = s1.count
        let n = s2.count
        
        if m == 0 { return n }
        if n == 0 { return m }
        
        var matrix = Array(repeating: Array(repeating: 0, count: n + 1), count: m + 1)
        
        for i in 0...m { matrix[i][0] = i }
        for j in 0...n { matrix[0][j] = j }
        
        let s1Array = Array(s1)
        let s2Array = Array(s2)
        
        for i in 1...m {
            for j in 1...n {
                let cost = s1Array[i-1] == s2Array[j-1] ? 0 : 1
                matrix[i][j] = min(
                    matrix[i-1][j] + 1,      // deletion
                    matrix[i][j-1] + 1,      // insertion
                    matrix[i-1][j-1] + cost  // substitution
                )
            }
        }
        
        return matrix[m][n]
    }
    
    // MARK: - 축구 관련 키워드
    
    private let footballKeywords = Set([
        "goal", "goals", "scored", "score", "win", "won", "loss", "lost", "draw", "drew",
        "match", "game", "fixture", "transfer", "sign", "signed", "signing", "deal", "contract",
        "injury", "injured", "return", "comeback", "manager", "coach", "player", "striker",
        "midfielder", "defender", "goalkeeper", "penalty", "red", "card", "yellow", "var",
        "offside", "foul", "tackle", "save", "assist", "champions", "league", "cup", "final",
        "semifinal", "quarterfinal", "season", "points", "table", "standings", "top", "bottom"
    ])
}

// MARK: - 뉴스 클러스터 정보

struct NewsCluster {
    let primaryArticle: NewsArticle
    let duplicates: [NewsArticle]
    let commonKeywords: Set<String>
    
    var totalSources: Int {
        return 1 + duplicates.count
    }
    
    var sourcesDescription: String {
        let allSources = [primaryArticle.source] + duplicates.map { $0.source }
        return allSources.joined(separator: ", ")
    }
}