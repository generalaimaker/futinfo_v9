import Foundation
import SwiftUI

/// 앱 언어 설정 관리 서비스
class LanguageSettingsService: ObservableObject {
    
    // MARK: - Properties
    
    static let shared = LanguageSettingsService()
    
    @Published var currentLanguage: AppLanguage {
        didSet {
            UserDefaults.standard.set(currentLanguage.rawValue, forKey: "app_language")
            print("🌐 언어 설정 변경: \(currentLanguage.displayName)")
        }
    }
    
    // MARK: - Initialization
    
    private init() {
        let savedLanguage = UserDefaults.standard.string(forKey: "app_language") ?? AppLanguage.korean.rawValue
        self.currentLanguage = AppLanguage(rawValue: savedLanguage) ?? .korean
        print("🌐 저장된 언어 설정 로드: \(currentLanguage.displayName)")
    }
    
    // MARK: - Public Methods
    
    /// 언어 변경
    func changeLanguage(to language: AppLanguage) {
        currentLanguage = language
    }
    
    /// 현재 언어가 한국어인지 확인
    var isKorean: Bool {
        return currentLanguage == .korean
    }
    
    /// 현재 언어가 영어인지 확인
    var isEnglish: Bool {
        return currentLanguage == .english
    }
}

/// 앱 지원 언어
enum AppLanguage: String, CaseIterable, Identifiable {
    case korean = "ko"
    case english = "en"
    case japanese = "ja"
    case chinese = "zh"
    case spanish = "es"
    case french = "fr"
    case german = "de"
    case italian = "it"
    case portuguese = "pt"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .korean: return "한국어"
        case .english: return "English"
        case .japanese: return "日本語"
        case .chinese: return "中文"
        case .spanish: return "Español"
        case .french: return "Français"
        case .german: return "Deutsch"
        case .italian: return "Italiano"
        case .portuguese: return "Português"
        }
    }
    
    var nativeName: String {
        switch self {
        case .korean: return "한국어"
        case .english: return "English"
        case .japanese: return "日本語"
        case .chinese: return "中文"
        case .spanish: return "Español"
        case .french: return "Français"
        case .german: return "Deutsch"
        case .italian: return "Italiano"
        case .portuguese: return "Português"
        }
    }
    
    var flag: String {
        switch self {
        case .korean: return "🇰🇷"
        case .english: return "🇺🇸"
        case .japanese: return "🇯🇵"
        case .chinese: return "🇨🇳"
        case .spanish: return "🇪🇸"
        case .french: return "🇫🇷"
        case .german: return "🇩🇪"
        case .italian: return "🇮🇹"
        case .portuguese: return "🇵🇹"
        }
    }
    
    var shortName: String {
        switch self {
        case .korean: return "한국어"
        case .english: return "EN"
        case .japanese: return "日本語"
        case .chinese: return "中文"
        case .spanish: return "ES"
        case .french: return "FR"
        case .german: return "DE"
        case .italian: return "IT"
        case .portuguese: return "PT"
        }
    }
    
    /// GPT 번역용 언어 코드
    var gptLanguageCode: String {
        switch self {
        case .korean: return "Korean"
        case .english: return "English"
        case .japanese: return "Japanese"
        case .chinese: return "Chinese"
        case .spanish: return "Spanish"
        case .french: return "French"
        case .german: return "German"
        case .italian: return "Italian"
        case .portuguese: return "Portuguese"
        }
    }
    
    /// 축구 관련 전문 용어 번역 가이드
    var footballTermsGuide: String {
        switch self {
        case .korean:
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
        default:
            return ""
        }
    }
}