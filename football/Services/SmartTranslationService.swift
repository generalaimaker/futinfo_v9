import Foundation
import SwiftUI
import os

/// 스마트 번역 서비스 - 최소 비용으로 효율적인 번역
final class SmartTranslationService: @unchecked Sendable {
    
    static let shared = SmartTranslationService()
    
    private let supabaseService = SupabaseService.shared
    
    // 다층 캐싱 시스템
    private let memoryCache = NSCache<NSString, TranslatedContent>()
    private let diskCache = DiskCache<TranslatedContent>()
    
    // 번역 대기열 (배치 처리용)
    private var translationQueue: [TranslationRequest] = []
    private let queueLock = OSAllocatedUnfairLock()
    
    private init() {
        memoryCache.countLimit = 1000
        memoryCache.totalCostLimit = 20 * 1024 * 1024 // 20MB
        
        // 주기적 배치 처리
        startBatchProcessor()
        
        print("🌐 스마트 번역 서비스 초기화")
    }
    
    // MARK: - Public Methods
    
    /// 제목과 요약만 번역 (UI 표시용)
    func translateForUI(_ item: NewsArticle, to languageCode: String) async -> TranslatedNewsItem {
        // 영어는 번역 불필요
        guard languageCode != "en" else {
            return TranslatedNewsItem(original: item)
        }
        
        // 1. 메모리 캐시 확인
        let cacheKey = "\(item.url)_\(languageCode)" as NSString
        if let cached = memoryCache.object(forKey: cacheKey) {
            return TranslatedNewsItem(
                original: item,
                translatedTitle: cached.title,
                translatedSummary: cached.summary
            )
        }
        
        // 2. 디스크 캐시 확인
        if let cached = await diskCache.load(key: cacheKey as String) {
            memoryCache.setObject(cached, forKey: cacheKey)
            return TranslatedNewsItem(
                original: item,
                translatedTitle: cached.title,
                translatedSummary: cached.summary
            )
        }
        
        // 3. Supabase DB 확인 (서버에서 미리 번역된 콘텐츠)
        if let cached = await fetchFromSupabase(url: item.url, language: languageCode) {
            let content = TranslatedContent(
                title: cached.title,
                summary: cached.summary,
                language: languageCode
            )
            
            // 캐시 저장
            memoryCache.setObject(content, forKey: cacheKey)
            await diskCache.save(content, key: cacheKey as String)
            
            return TranslatedNewsItem(
                original: item,
                translatedTitle: cached.title,
                translatedSummary: cached.summary
            )
        }
        
        // 4. 번역 큐에 추가 (즉시 번역하지 않고 배치 처리)
        addToQueue(item: item, language: languageCode)
        
        // 5. 일단 원본 반환 (나중에 번역됨)
        return TranslatedNewsItem(original: item)
    }
    
    /// 여러 아이템 일괄 번역 (효율적)
    func translateBatch(_ items: [NewsArticle], to languageCode: String) async -> [TranslatedNewsItem] {
        guard languageCode != "en" else {
            return items.map { TranslatedNewsItem(original: $0) }
        }
        
        var results: [TranslatedNewsItem] = []
        var itemsToTranslate: [(NewsArticle, String)] = []
        
        // 캐시 확인 및 번역 필요 항목 분류
        for item in items {
            let cacheKey = "\(item.url)_\(languageCode)"
            
            if let cached = getCachedTranslation(key: cacheKey, language: languageCode) {
                results.append(TranslatedNewsItem(
                    original: item,
                    translatedTitle: cached.title,
                    translatedSummary: cached.summary
                ))
            } else {
                itemsToTranslate.append((item, cacheKey))
            }
        }
        
        // 번역 필요한 항목만 처리
        if !itemsToTranslate.isEmpty {
            let translations = await performBatchTranslation(
                itemsToTranslate.map { $0.0 },
                to: languageCode
            )
            
            // 결과 저장 및 반환
            for (index, translation) in translations.enumerated() {
                let item = itemsToTranslate[index].0
                let cacheKey = itemsToTranslate[index].1
                
                // 캐시 저장
                let content = TranslatedContent(
                    title: translation.title,
                    summary: translation.summary,
                    language: languageCode
                )
                saveToCache(content, key: cacheKey)
                
                results.append(TranslatedNewsItem(
                    original: item,
                    translatedTitle: translation.title,
                    translatedSummary: translation.summary
                ))
            }
        }
        
        return results
    }
    
    // MARK: - Translation Strategies
    
    /// 전략 1: 서버 사전 번역 (비용 0)
    private func fetchFromSupabase(url: String, language: String) async -> (title: String, summary: String)? {
        do {
            let response = try await supabaseService.client
                .from("news_translations")
                .select("title_\(language), summary_\(language)")
                .eq("url", value: url)
                .single()
                .execute()
            
            if let data = try? JSONSerialization.jsonObject(with: response.data) as? [String: Any],
               let title = data["title_\(language)"] as? String,
               let summary = data["summary_\(language)"] as? String {
                return (title, summary)
            }
        } catch {
            // 캐시 미스는 정상
        }
        
        return nil
    }
    
    /// 전략 2: 간단한 규칙 기반 번역 (비용 0)
    private func ruleBasedTranslation(_ text: String, to language: String) -> String {
        guard language == "ko" else { return text }
        
        // 자주 나오는 축구 용어 매핑
        let replacements = [
            // 클럽명은 그대로 유지
            "Manchester United": "맨체스터 유나이티드",
            "Manchester City": "맨체스터 시티",
            "Liverpool": "리버풀",
            "Chelsea": "첼시",
            "Arsenal": "아스날",
            "Tottenham": "토트넘",
            "Real Madrid": "레알 마드리드",
            "Barcelona": "바르셀로나",
            "Bayern Munich": "바이에른 뮌헨",
            
            // 기본 용어
            "transfer": "이적",
            "signs": "영입",
            "contract": "계약",
            "deal": "계약",
            "million": "백만",
            "injury": "부상",
            "return": "복귀",
            "win": "승리",
            "defeat": "패배",
            "draw": "무승부",
            "goal": "골",
            "match": "경기",
            "manager": "감독",
            "player": "선수",
            "confirms": "확정",
            "official": "공식"
        ]
        
        var translated = text
        for (eng, kor) in replacements {
            translated = translated.replacingOccurrences(of: eng, with: kor)
        }
        
        return translated
    }
    
    /// 전략 3: GPT 번역 (배치 처리로 비용 절감)
    private func performBatchTranslation(_ items: [NewsArticle], to language: String) async -> [(title: String, summary: String)] {
        // 최대 10개씩 묶어서 처리
        let chunks = items.chunked(into: 10)
        var allTranslations: [(title: String, summary: String)] = []
        
        for chunk in chunks {
            // 한 번의 API 호출로 여러 아이템 번역
            let prompt = createBatchPrompt(chunk, language: language)
            
            do {
                let translations = try await callGPTBatch(prompt: prompt, count: chunk.count)
                allTranslations.append(contentsOf: translations)
            } catch {
                // 실패시 규칙 기반 번역으로 폴백
                let fallback = chunk.map { item in
                    (
                        title: ruleBasedTranslation(item.title, to: language),
                        summary: ruleBasedTranslation(String(item.summary.prefix(100)), to: language)
                    )
                }
                allTranslations.append(contentsOf: fallback)
            }
        }
        
        return allTranslations
    }
    
    private func createBatchPrompt(_ items: [NewsArticle], language: String) -> String {
        var prompt = "Translate these football news headlines and summaries to \(getLanguageName(language)). Keep team names and player names as is. Format: 'Title: ... | Summary: ...'\n\n"
        
        for (index, item) in items.enumerated() {
            let shortSummary = String(item.summary.prefix(100))
            prompt += "\(index + 1). Title: \(item.title) | Summary: \(shortSummary)\n"
        }
        
        return prompt
    }
    
    private func callGPTBatch(prompt: String, count: Int) async throws -> [(title: String, summary: String)] {
        // GPT-3.5-turbo로 비용 절감
        let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/ai-proxy"
        guard let url = URL(string: supabaseURL) else {
            throw SmartTranslationError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10.0
        
        let requestBody: [String: Any] = [
            "service": "openai",
            "model": "gpt-3.5-turbo",
            "messages": [
                ["role": "system", "content": "You are a concise translator for football news. Translate accurately and keep responses brief."],
                ["role": "user", "content": prompt]
            ],
            "max_tokens": 100 * count, // 아이템당 100토큰
            "temperature": 0.3
        ]
        
        if let anonKey = try? await supabaseService.client.auth.session.accessToken {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        // 응답 파싱 및 번역 추출
        guard let response = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let choices = response["choices"] as? [[String: Any]],
              let content = choices.first?["message"] as? [String: Any],
              let text = content["content"] as? String else {
            throw SmartTranslationError.invalidResponse
        }
        
        // 파싱: "1. Title: ... | Summary: ..." 형식
        return parseGPTBatchResponse(text, count: count)
    }
    
    private func parseGPTBatchResponse(_ text: String, count: Int) -> [(title: String, summary: String)] {
        var results: [(String, String)] = []
        let lines = text.components(separatedBy: .newlines)
        
        for line in lines {
            if let titleRange = line.range(of: "Title: "),
               let summaryRange = line.range(of: " | Summary: ") {
                let title = String(line[titleRange.upperBound..<summaryRange.lowerBound])
                let summary = String(line[summaryRange.upperBound...])
                results.append((title.trimmingCharacters(in: .whitespaces), 
                              summary.trimmingCharacters(in: .whitespaces)))
            }
        }
        
        // 부족한 경우 빈 값으로 채우기
        while results.count < count {
            results.append(("", ""))
        }
        
        return results
    }
    
    // MARK: - Queue Management
    
    private func addToQueue(item: NewsArticle, language: String) {
        queueLock.withLock {
            let request = TranslationRequest(
                item: item,
                language: language,
                timestamp: Date()
            )
            
            translationQueue.append(request)
        }
    }
    
    private func startBatchProcessor() {
        // 30초마다 큐 처리
        Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task {
                await self?.processBatchQueue()
            }
        }
    }
    
    private func processBatchQueue() async {
        let requests = queueLock.withLock {
            let temp = translationQueue
            translationQueue.removeAll()
            return temp
        }
        
        guard !requests.isEmpty else { return }
        
        // 언어별로 그룹화
        let grouped = Dictionary(grouping: requests) { $0.language }
        
        for (language, langRequests) in grouped {
            let items = langRequests.map { $0.item }
            let translations = await performBatchTranslation(items, to: language)
            
            // 결과 캐싱
            for (index, translation) in translations.enumerated() {
                let item = items[index]
                let cacheKey = "\(item.url)_\(language)"
                
                let content = TranslatedContent(
                    title: translation.title,
                    summary: translation.summary,
                    language: language
                )
                
                saveToCache(content, key: cacheKey)
            }
        }
    }
    
    // MARK: - Cache Management
    
    private func getCachedTranslation(key: String, language: String) -> TranslatedContent? {
        // 메모리 캐시 우선
        if let cached = memoryCache.object(forKey: key as NSString) {
            return cached
        }
        
        // 디스크 캐시는 비동기라 여기서는 체크 안함
        return nil
    }
    
    private func saveToCache(_ content: TranslatedContent, key: String) {
        memoryCache.setObject(content, forKey: key as NSString)
        
        Task {
            await diskCache.save(content, key: key)
        }
    }
    
    private func getLanguageName(_ code: String) -> String {
        switch code {
        case "ko": return "Korean"
        case "ja": return "Japanese"
        case "zh": return "Chinese"
        case "es": return "Spanish"
        case "fr": return "French"
        case "de": return "German"
        case "it": return "Italian"
        case "pt": return "Portuguese"
        default: return "English"
        }
    }
}

// MARK: - Models

struct TranslatedNewsItem {
    let original: NewsArticle
    var translatedTitle: String?
    var translatedSummary: String?
    
    var displayTitle: String {
        translatedTitle ?? original.title
    }
    
    var displaySummary: String {
        translatedSummary ?? original.summary
    }
}

private class TranslatedContent: NSObject, Codable {
    let title: String
    let summary: String
    let language: String
    let timestamp: Date
    
    init(title: String, summary: String, language: String) {
        self.title = title
        self.summary = summary
        self.language = language
        self.timestamp = Date()
        super.init()
    }
    
    private enum CodingKeys: String, CodingKey {
        case title, summary, language, timestamp
    }
}

private struct TranslationRequest {
    let item: NewsArticle
    let language: String
    let timestamp: Date
}

private enum SmartTranslationError: Error {
    case invalidURL
    case invalidResponse
}

// MARK: - Disk Cache

actor DiskCache<T: Codable> {
    private let cacheDirectory: URL
    
    init() {
        let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
        cacheDirectory = paths[0].appendingPathComponent("translations")
        
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    func save(_ object: T, key: String) async {
        let url = cacheDirectory.appendingPathComponent("\(key).json")
        
        if let data = try? JSONEncoder().encode(object) {
            try? data.write(to: url)
        }
    }
    
    func load(key: String) async -> T? {
        let url = cacheDirectory.appendingPathComponent("\(key).json")
        
        guard let data = try? Data(contentsOf: url) else { return nil }
        
        // 7일 이상 된 캐시는 무시
        if let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
           let modificationDate = attributes[.modificationDate] as? Date,
           Date().timeIntervalSince(modificationDate) > 604800 { // 7일
            try? FileManager.default.removeItem(at: url)
            return nil
        }
        
        return try? JSONDecoder().decode(T.self, from: data)
    }
}

// Array extension이 이미 다른 파일에 있으므로 여기서는 제외