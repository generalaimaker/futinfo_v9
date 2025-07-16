import Foundation

/// 최적화된 번역 서비스 - 배치 처리와 병렬화로 성능 개선
final class OptimizedTranslationService: @unchecked Sendable {
    
    static let shared = OptimizedTranslationService()
    
    private let supabaseService = SupabaseService.shared
    
    // 개선된 캐시 시스템
    private let cache = NSCache<NSString, TranslationCache>()
    private let cacheQueue = DispatchQueue(label: "translation.cache.queue", attributes: .concurrent)
    
    // 배치 처리 설정
    private let batchSize = 5
    private let maxConcurrentBatches = 3
    
    private init() {
        // 캐시 설정
        cache.countLimit = 500
        cache.totalCostLimit = 10 * 1024 * 1024 // 10MB
        
        print("⚡ 최적화된 번역 서비스 초기화 완료")
    }
    
    // MARK: - Public Methods
    
    /// 뉴스 아이템 배치 번역 - 병렬 처리로 최적화
    func translateNewsBatch(_ items: [NewsArticle], to languageCode: String) async -> [NewsArticle] {
        // 영어는 번역 불필요
        guard languageCode != "en" else { return items }
        
        print("🌐 배치 번역 시작: \(items.count)개 아이템 → \(languageCode)")
        let startTime = Date()
        
        // 배치로 나누기
        let batches = items.chunked(into: batchSize)
        
        // 병렬 처리
        let translatedBatches = await withTaskGroup(of: [NewsArticle].self) { group in
            for (index, batch) in batches.enumerated() {
                // 동시 실행 제한
                if index >= maxConcurrentBatches {
                    // 이전 배치 완료 대기
                    _ = await group.next()
                }
                
                group.addTask { [weak self] in
                    await self?.translateBatch(batch, to: languageCode) ?? []
                }
            }
            
            var results: [[NewsArticle]] = []
            for await batch in group {
                results.append(batch)
            }
            return results
        }
        
        // 결과 합치기
        let translatedItems = translatedBatches.flatMap { $0 }
        
        let duration = Date().timeIntervalSince(startTime)
        print("✅ 배치 번역 완료: \(String(format: "%.1f", duration))초 소요")
        
        return translatedItems
    }
    
    /// 단일 뉴스 번역 (캐시 활용)
    func translateNewsItem(_ item: NewsArticle, to languageCode: String) async -> NewsArticle {
        // 캐시 확인
        let cacheKey = "\(item.id)_\(languageCode)" as NSString
        
        if let cached = cache.object(forKey: cacheKey) {
            print("📋 캐시된 번역 사용: \(item.title.prefix(30))...")
            return cached.item
        }
        
        // 번역 수행
        let translatedTitle = await translateTextOptimized(
            item.title,
            to: languageCode,
            maxLength: 200
        )
        
        let translatedSummary = await translateTextOptimized(
            item.summary,
            to: languageCode,
            maxLength: 500
        )
        
        let translatedItem = item.withTranslation(
            title: translatedTitle.isEmpty ? nil : translatedTitle,
            summary: translatedSummary.isEmpty ? nil : translatedSummary
        )
        
        // 캐시 저장
        let cached = TranslationCache(item: translatedItem)
        cache.setObject(cached, forKey: cacheKey, cost: 1000)
        
        return translatedItem
    }
    
    /// 캐시 클리어
    func clearCache() {
        cache.removeAllObjects()
        print("🗑️ 번역 캐시 클리어 완료")
    }
    
    // MARK: - Private Methods
    
    private func translateBatch(_ batch: [NewsArticle], to languageCode: String) async -> [NewsArticle] {
        await withTaskGroup(of: NewsArticle.self) { group in
            for item in batch {
                group.addTask { [weak self] in
                    await self?.translateNewsItem(item, to: languageCode) ?? item
                }
            }
            
            var results: [NewsArticle] = []
            for await translatedItem in group {
                results.append(translatedItem)
            }
            
            // 원래 순서 유지
            return batch.compactMap { originalItem in
                results.first { $0.id == originalItem.id }
            }
        }
    }
    
    /// 최적화된 텍스트 번역 - 길이 제한과 에러 처리
    private func translateTextOptimized(
        _ text: String,
        to languageCode: String,
        maxLength: Int
    ) async -> String {
        // 빈 텍스트 체크
        guard !text.isEmpty else { return text }
        
        // 길이 제한
        let trimmedText = text.count > maxLength ? String(text.prefix(maxLength)) : text
        
        // 간단한 텍스트 캐시 체크
        let textCacheKey = "\(trimmedText.prefix(50))_\(languageCode)" as NSString
        if let cachedText = getCachedText(for: textCacheKey) {
            return cachedText
        }
        
        do {
            // GPT API 호출 (타임아웃 설정)
            let translated = try await withThrowingTaskGroup(of: String.self) { group in
                group.addTask {
                    try await self.callGPTTranslation(
                        text: trimmedText,
                        to: languageCode
                    )
                }
                
                group.addTask {
                    // 타임아웃 (3초)
                    try await Task.sleep(nanoseconds: 3_000_000_000)
                    throw OptimizedTranslationError.timeout
                }
                
                // 먼저 완료되는 작업의 결과 반환
                guard let result = try await group.next() else {
                    throw OptimizedTranslationError.invalidResponse
                }
                
                group.cancelAll()
                return result
            }
            
            // 캐시 저장
            saveCachedText(translated, for: textCacheKey)
            
            return translated
            
        } catch {
            print("⚠️ 번역 실패, 원본 반환: \(error)")
            return text
        }
    }
    
    /// GPT API 호출 - 간소화된 프롬프트
    private func callGPTTranslation(text: String, to languageCode: String) async throws -> String {
        let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/ai-proxy"
        guard let url = URL(string: supabaseURL) else {
            throw OptimizedTranslationError.apiError
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 3.0 // 짧은 타임아웃
        
        // 간소화된 프롬프트
        let prompt = "Translate to \(getLanguageName(for: languageCode)): \(text)"
        
        let requestBody: [String: Any] = [
            "service": "openai",
            "model": "gpt-3.5-turbo", // 더 빠르고 저렴한 모델
            "messages": [
                ["role": "system", "content": "You are a translator. Translate football news concisely."],
                ["role": "user", "content": prompt]
            ],
            "max_tokens": 150,
            "temperature": 0.3
        ]
        
        // Supabase 인증
        if let anonKey = try? await supabaseService.client.auth.session.accessToken {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw OptimizedTranslationError.apiError
        }
        
        guard let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let choices = jsonResponse["choices"] as? [[String: Any]],
              let firstChoice = choices.first,
              let message = firstChoice["message"] as? [String: Any],
              let content = message["content"] as? String,
              !content.isEmpty else {
            throw OptimizedTranslationError.invalidResponse
        }
        
        return content.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    // MARK: - 간단한 텍스트 캐시
    
    private var textCache: [String: String] = [:]
    private let textCacheLimit = 100
    
    private func getCachedText(for key: NSString) -> String? {
        cacheQueue.sync {
            return textCache[key as String]
        }
    }
    
    private func saveCachedText(_ text: String, for key: NSString) {
        cacheQueue.async(flags: .barrier) { [weak self] in
            guard let self = self else { return }
            
            // 캐시 크기 제한
            if self.textCache.count >= self.textCacheLimit {
                // 가장 오래된 항목 제거 (간단한 FIFO)
                if let firstKey = self.textCache.keys.first {
                    self.textCache.removeValue(forKey: firstKey)
                }
            }
            
            self.textCache[key as String] = text
        }
    }
    
    private func getLanguageName(for code: String) -> String {
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

// MARK: - Helper Classes

private class TranslationCache {
    let item: NewsArticle
    let timestamp = Date()
    
    init(item: NewsArticle) {
        self.item = item
    }
}

// MARK: - Error Types

enum OptimizedTranslationError: Error {
    case apiError
    case invalidResponse
    case timeout
}

// MARK: - Array Extension

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}