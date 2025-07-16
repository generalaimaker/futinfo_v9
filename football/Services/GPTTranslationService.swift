import Foundation
import SwiftUI

/// GPT 기반 뉴스 번역 서비스
final class GPTTranslationService: @unchecked Sendable {
    
    // MARK: - Properties
    
    static let shared = GPTTranslationService()
    
    private let supabaseService = SupabaseService.shared
    
    // Thread-safe 번역 캐시
    private var translationCache: [String: String] = [:]
    private let cacheQueue = DispatchQueue(label: "translation.cache.queue", attributes: .concurrent)
    
    // MARK: - Initialization
    
    private init() {
        print("🔑 GPT 번역 서비스 초기화 완료 (Supabase Edge Function 사용)")
    }
    
    // MARK: - Public Methods
    
    /// 뉴스 제목 번역 (언어 코드 문자열 사용)
    func translateNewsTitle(_ title: String, to languageCode: String) async -> String {
        // 안전성 검사
        guard languageCode != "en" else { return title }
        guard !title.isEmpty else {
            print("⚠️ 제목이 비어있습니다.")
            return title
        }
        
        // 너무 긴 제목 처리
        let trimmedTitle = title.count > 500 ? String(title.prefix(500)) : title
        
        // Thread-safe 캐시 확인
        let cacheKey = "\(trimmedTitle)_\(languageCode)"
        let cachedTranslation = cacheQueue.sync {
            return translationCache[cacheKey]
        }
        
        if let cachedTranslation = cachedTranslation {
            print("📋 캐시된 번역 사용: \(trimmedTitle.prefix(30))... → \(cachedTranslation.prefix(30))...")
            return cachedTranslation
        }
        
        do {
            let translatedTitle = try await performGPTTranslation(title: trimmedTitle, to: languageCode)
            
            // 번역 결과 안전성 검사
            guard !translatedTitle.isEmpty else {
                print("⚠️ 번역 결과가 비어있습니다.")
                return title
            }
            
            // Thread-safe 캐시에 저장
            cacheQueue.async(flags: .barrier) { [weak self] in
                self?.translationCache[cacheKey] = translatedTitle
            }
            
            print("✅ 제목 번역 완료: \(trimmedTitle.prefix(30))... → \(translatedTitle.prefix(30))...")
            return translatedTitle
            
        } catch {
            print("❌ 제목 번역 실패: \(error.localizedDescription)")
            return title // 실패 시 원본 반환
        }
    }
    
    /// 뉴스 요약 번역 (언어 코드 문자열 사용)
    func translateNewsSummary(_ summary: String, to languageCode: String) async -> String {
        // 안전성 검사
        guard languageCode != "en" else { return summary }
        guard !summary.isEmpty else {
            print("⚠️ 요약 문장이 비어있습니다.")
            return summary
        }
        
        // 너무 긴 요약 처리
        let trimmedSummary = summary.count > 1000 ? String(summary.prefix(1000)) : summary
        
        let cacheKey = "\(trimmedSummary.prefix(50))_summary_\(languageCode)"
        let cachedTranslation = cacheQueue.sync {
            return translationCache[cacheKey]
        }
        
        if let cachedTranslation = cachedTranslation {
            print("📋 캐시된 요약 번역 사용")
            return cachedTranslation
        }
        
        do {
            let translatedSummary = try await performGPTSummaryTranslation(summary: trimmedSummary, to: languageCode)
            
            // 번역 결과 안전성 검사
            guard !translatedSummary.isEmpty else {
                print("⚠️ 번역 결과가 비어있습니다.")
                return summary
            }
            
            cacheQueue.async(flags: .barrier) { [weak self] in
                self?.translationCache[cacheKey] = translatedSummary
            }
            print("✅ 요약 번역 완료: \(trimmedSummary.prefix(30))... → \(translatedSummary.prefix(30))...")
            return translatedSummary
            
        } catch {
            print("❌ 요약 번역 실패: \(error.localizedDescription)")
            return summary
        }
    }
    
    /// 현재 설정 언어로 제목 번역
    func translateTitleToCurrentLanguage(_ title: String) async -> String {
        let currentLanguageCode = getCurrentLanguageCode()
        return await translateNewsTitle(title, to: currentLanguageCode)
    }
    
    /// 현재 설정 언어로 요약 번역
    func translateSummaryToCurrentLanguage(_ summary: String) async -> String {
        let currentLanguageCode = getCurrentLanguageCode()
        return await translateNewsSummary(summary, to: currentLanguageCode)
    }
    
    /// 캐시 클리어
    func clearCache() {
        cacheQueue.async(flags: .barrier) {
            self.translationCache.removeAll()
        }
        print("🗑️ 번역 캐시 클리어 완료")
    }
    
    // MARK: - Private Methods
    
    /// 현재 언어 코드 가져오기
    private func getCurrentLanguageCode() -> String {
        return UserDefaults.standard.string(forKey: "app_language") ?? "ko"
    }
    
    /// 언어 코드를 GPT 언어명으로 변환
    private func getGPTLanguageName(for languageCode: String) -> String {
        switch languageCode {
        case "ko": return "Korean"
        case "en": return "English"
        case "ja": return "Japanese"
        case "zh": return "Chinese"
        case "es": return "Spanish"
        case "fr": return "French"
        case "de": return "German"
        case "it": return "Italian"
        case "pt": return "Portuguese"
        default: return "Korean"
        }
    }
    
    /// 축구 전문 용어 가이드 가져오기
    private func getFootballTermsGuide(for languageCode: String) -> String {
        if languageCode == "ko" {
            return """
            축구 전문 용어 번역 가이드:
            - Transfer → 이적
            - Signing → 영입
            - Contract → 계약
            - Manager → 감독
            - Coach → 코치
            - Player → 선수
            - Goal → 골
            - Match → 경기
            - League → 리그
            - Championship → 챔피언십
            - Premier League → 프리미어리그
            - La Liga → 라리가
            - Serie A → 세리에A
            - Bundesliga → 분데스리가
            - Ligue 1 → 리그1
            - Champions League → 챔피언스리그
            - Europa League → 유로파리그
            - World Cup → 월드컵
            - Euro → 유로
            - Injury → 부상
            - Comeback → 복귀
            - Debut → 데뷔
            - Retirement → 은퇴
            """
        }
        return ""
    }
    
    /// GPT API를 통한 제목 번역 (Supabase Edge Function 사용)
    private func performGPTTranslation(title: String, to languageCode: String) async throws -> String {
        // 입력값 안전성 검사
        guard !title.isEmpty else {
            print("⚠️ performGPTTranslation: 제목이 비어있습니다")
            throw TranslationError.invalidResponse
        }
        
        guard !languageCode.isEmpty else {
            print("⚠️ performGPTTranslation: 언어 코드가 비어있습니다")
            throw TranslationError.invalidResponse
        }
        
        let prompt = buildTranslationPrompt(title: title, languageCode: languageCode)
        
        // Supabase Edge Function 호출
        let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/ai-proxy"
        guard let url = URL(string: supabaseURL) else {
            print("❌ performGPTTranslation: URL 생성 실패")
            throw TranslationError.apiError
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Supabase anon key 추가
        if let anonKey = try? await supabaseService.client.auth.session.accessToken {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        }
        
        request.timeoutInterval = 30.0
        
        let requestBody: [String: Any] = [
            "service": "openai",
            "model": "gpt-4o-mini",
            "messages": [
                [
                    "role": "system",
                    "content": "You are a professional football news translator. Translate football news titles accurately while preserving the meaning and context. Keep team names, player names, and proper nouns in their original form unless they have established translations."
                ],
                [
                    "role": "user",
                    "content": prompt
                ]
            ],
            "max_tokens": 150,
            "temperature": 0.3
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            print("❌ performGPTTranslation: JSON 직렬화 실패 - \(error)")
            throw TranslationError.apiError
        }
        
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            print("❌ performGPTTranslation: 네트워크 요청 실패 - \(error)")
            throw TranslationError.networkError
        }
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ performGPTTranslation: HTTP 응답 변환 실패")
            throw TranslationError.apiError
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ performGPTTranslation: HTTP 오류 - 상태 코드: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ 오류 응답: \(errorData)")
            }
            throw TranslationError.apiError
        }
        
        let jsonResponse: [String: Any]
        do {
            guard let response = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                print("❌ performGPTTranslation: JSON 응답 파싱 실패")
                throw TranslationError.invalidResponse
            }
            jsonResponse = response
        } catch {
            print("❌ performGPTTranslation: JSON 파싱 오류 - \(error)")
            throw TranslationError.invalidResponse
        }
        
        guard let choices = jsonResponse["choices"] as? [[String: Any]],
              !choices.isEmpty,
              let firstChoice = choices.first,
              let message = firstChoice["message"] as? [String: Any],
              let content = message["content"] as? String,
              !content.isEmpty else {
            print("❌ performGPTTranslation: 응답 구조 오류")
            print("📊 응답 데이터: \(jsonResponse)")
            throw TranslationError.invalidResponse
        }
        
        let trimmedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedContent.isEmpty else {
            print("⚠️ performGPTTranslation: 번역 결과가 비어있습니다")
            throw TranslationError.invalidResponse
        }
        
        print("✅ performGPTTranslation: 번역 성공")
        return trimmedContent
    }
    
    /// GPT API를 통한 요약 번역
    private func performGPTSummaryTranslation(summary: String, to languageCode: String) async throws -> String {
        // 입력값 안전성 검사
        guard !summary.isEmpty else {
            print("⚠️ performGPTSummaryTranslation: 요약이 비어있습니다")
            throw TranslationError.invalidResponse
        }
        
        guard !languageCode.isEmpty else {
            print("⚠️ performGPTSummaryTranslation: 언어 코드가 비어있습니다")
            throw TranslationError.invalidResponse
        }
        
        // Supabase Edge Function 호출
        let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/ai-proxy"
        guard let url = URL(string: supabaseURL) else {
            print("❌ performGPTSummaryTranslation: URL 생성 실패")
            throw TranslationError.apiError
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Supabase anon key 추가
        if let anonKey = try? await supabaseService.client.auth.session.accessToken {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        }
        
        request.timeoutInterval = 30.0
        
        let prompt = buildSummaryTranslationPrompt(summary: summary, languageCode: languageCode)
        
        let requestBody: [String: Any] = [
            "service": "openai",
            "model": "gpt-4o-mini",
            "messages": [
                [
                    "role": "system",
                    "content": "You are a professional football news translator. Translate football news summaries accurately while preserving the meaning and context."
                ],
                [
                    "role": "user",
                    "content": prompt
                ]
            ],
            "max_tokens": 300,
            "temperature": 0.3
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        } catch {
            print("❌ performGPTSummaryTranslation: JSON 직렬화 실패 - \(error)")
            throw TranslationError.apiError
        }
        
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            print("❌ performGPTSummaryTranslation: 네트워크 요청 실패 - \(error)")
            throw TranslationError.networkError
        }
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ performGPTSummaryTranslation: HTTP 응답 변환 실패")
            throw TranslationError.apiError
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ performGPTSummaryTranslation: HTTP 오류 - 상태 코드: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ 오류 응답: \(errorData)")
            }
            throw TranslationError.apiError
        }
        
        let jsonResponse: [String: Any]
        do {
            guard let response = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                print("❌ performGPTSummaryTranslation: JSON 응답 파싱 실패")
                throw TranslationError.invalidResponse
            }
            jsonResponse = response
        } catch {
            print("❌ performGPTSummaryTranslation: JSON 파싱 오류 - \(error)")
            throw TranslationError.invalidResponse
        }
        
        guard let choices = jsonResponse["choices"] as? [[String: Any]],
              !choices.isEmpty,
              let firstChoice = choices.first,
              let message = firstChoice["message"] as? [String: Any],
              let content = message["content"] as? String,
              !content.isEmpty else {
            print("❌ performGPTSummaryTranslation: 응답 구조 오류")
            print("📊 응답 데이터: \(jsonResponse)")
            throw TranslationError.invalidResponse
        }
        
        let trimmedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedContent.isEmpty else {
            print("⚠️ performGPTSummaryTranslation: 번역 결과가 비어있습니다")
            throw TranslationError.invalidResponse
        }
        
        print("✅ performGPTSummaryTranslation: 번역 성공")
        return trimmedContent
    }
    
    /// 제목 번역 프롬프트 생성
    private func buildTranslationPrompt(title: String, languageCode: String) -> String {
        let languageName = getGPTLanguageName(for: languageCode)
        
        var prompt = "Translate this football news title to \(languageName):\n\n"
        prompt += "Original: \(title)\n\n"
        prompt += "Requirements:\n"
        prompt += "- Keep team names in their commonly used form\n"
        prompt += "- Keep player names unchanged\n"
        prompt += "- Translate football terms appropriately\n"
        prompt += "- Maintain the news tone and urgency\n"
        
        if languageCode == "ko" {
            prompt += "\n" + getFootballTermsGuide(for: languageCode)
        }
        
        prompt += "\nTranslated title:"
        
        return prompt
    }
    
    /// 요약 번역 프롬프트 생성
    private func buildSummaryTranslationPrompt(summary: String, languageCode: String) -> String {
        let languageName = getGPTLanguageName(for: languageCode)
        
        var prompt = "Translate this football news summary to \(languageName):\n\n"
        prompt += "Original: \(summary)\n\n"
        prompt += "Requirements:\n"
        prompt += "- Keep team names and player names unchanged\n"
        prompt += "- Translate football terms appropriately\n"
        prompt += "- Maintain the informative tone\n"
        prompt += "- Keep the same length and detail level\n"
        
        if languageCode == "ko" {
            prompt += "\n" + getFootballTermsGuide(for: languageCode)
        }
        
        prompt += "\nTranslated summary:"
        
        return prompt
    }
}

// MARK: - Error Types

enum TranslationError: Error, LocalizedError {
    case apiError
    case invalidResponse
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .apiError:
            return "번역 API 오류가 발생했습니다."
        case .invalidResponse:
            return "번역 응답이 올바르지 않습니다."
        case .networkError:
            return "네트워크 오류가 발생했습니다."
        }
    }
}