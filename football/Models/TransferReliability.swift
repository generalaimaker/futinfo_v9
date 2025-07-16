import Foundation
import SwiftUI

// MARK: - 이적 뉴스 신뢰도 평가 시스템

enum TransferReliabilityTier: Int, CaseIterable {
    case official = 5      // 공식 발표
    case tierOne = 4       // Tier 1 저널리스트
    case verified = 3      // 검증된 소스
    case reliable = 2      // 신뢰할 만한 소스
    case questionable = 1  // 의심스러운 소스
    case unreliable = 0    // 신뢰할 수 없는 소스
    
    var displayName: String {
        switch self {
        case .official: return "공식 발표"
        case .tierOne: return "Tier 1"
        case .verified: return "검증됨"
        case .reliable: return "신뢰가능"
        case .questionable: return "미확인"
        case .unreliable: return "루머"
        }
    }
    
    var color: Color {
        switch self {
        case .official: return .green
        case .tierOne: return .blue
        case .verified: return .mint
        case .reliable: return .orange
        case .questionable: return .gray
        case .unreliable: return .red.opacity(0.6)
        }
    }
    
    var icon: String {
        switch self {
        case .official: return "checkmark.seal.fill"
        case .tierOne: return "checkmark.shield.fill"
        case .verified: return "checkmark.circle.fill"
        case .reliable: return "info.circle.fill"
        case .questionable: return "questionmark.circle"
        case .unreliable: return "exclamationmark.triangle"
        }
    }
}

// MARK: - 신뢰도 평가 기준

struct TransferReliabilityEvaluator {
    
    // Tier 1 저널리스트 (가장 신뢰도 높음)
    static let tierOneJournalists = [
        "Fabrizio Romano",
        "David Ornstein",
        "Gianluca Di Marzio",
        "Mohamed Bouhafsi",
        "Florian Plettenberg"
    ]
    
    // 공식 소스
    static let officialSources = [
        "Official", "official",
        "FC Barcelona", "Real Madrid CF", "Manchester United",
        "Liverpool FC", "Chelsea FC", "Arsenal FC",
        "Bayern Munich", "Juventus FC", "AC Milan",
        "Paris Saint-Germain", "Borussia Dortmund"
    ]
    
    // 신뢰도 높은 미디어
    static let trustedMedia = [
        "BBC Sport", "Sky Sports", "The Guardian",
        "The Athletic", "ESPN", "L'Équipe",
        "Gazzetta dello Sport", "Marca", "AS",
        "Kicker", "Sport Bild", "RMC Sport"
    ]
    
    // 신뢰도 중간 미디어
    static let reliableMedia = [
        "Goal.com", "Football Italia", "Sport",
        "Mundo Deportivo", "Daily Mail", "Mirror",
        "The Sun", "Metro", "90min"
    ]
    
    // 공식 발표 키워드
    static let officialKeywords = [
        "official", "confirmed", "announces", "unveils",
        "completed", "signs", "medical completed",
        "deal done", "here we go", "contract signed"
    ]
    
    // 신뢰도 높은 키워드
    static let verifiedKeywords = [
        "agreement reached", "personal terms agreed",
        "medical scheduled", "set to join", "close to signing"
    ]
    
    // 루머 키워드
    static let rumorKeywords = [
        "linked", "interested", "monitoring", "considering",
        "could", "might", "reportedly", "rumored",
        "exploring", "weighing up", "keeping tabs"
    ]
    
    // MARK: - 신뢰도 평가 메서드
    
    static func evaluateReliability(
        source: String,
        title: String,
        description: String? = nil,
        author: String? = nil
    ) -> (tier: TransferReliabilityTier, score: Int) {
        
        let combinedText = "\(title) \(description ?? "")".lowercased()
        let sourceLower = source.lowercased()
        
        // 1. 공식 발표 체크
        if officialSources.contains(where: { sourceLower.contains($0.lowercased()) }) &&
           officialKeywords.contains(where: { combinedText.contains($0) }) {
            return (.official, 100)
        }
        
        // 2. Tier 1 저널리스트 체크
        if let author = author,
           tierOneJournalists.contains(where: { author.contains($0) }) {
            if officialKeywords.contains(where: { combinedText.contains($0) }) {
                return (.tierOne, 95)
            }
            return (.tierOne, 90)
        }
        
        // 3. 신뢰도 높은 미디어 + 확정 키워드
        if trustedMedia.contains(where: { source.contains($0) }) {
            if officialKeywords.contains(where: { combinedText.contains($0) }) {
                return (.verified, 85)
            }
            if verifiedKeywords.contains(where: { combinedText.contains($0) }) {
                return (.verified, 80)
            }
            return (.reliable, 70)
        }
        
        // 4. 중간 신뢰도 미디어
        if reliableMedia.contains(where: { source.contains($0) }) {
            if !rumorKeywords.contains(where: { combinedText.contains($0) }) {
                return (.reliable, 60)
            }
            return (.questionable, 40)
        }
        
        // 5. 루머 키워드만 있는 경우
        if rumorKeywords.contains(where: { combinedText.contains($0) }) {
            return (.unreliable, 20)
        }
        
        // 6. 기타
        return (.questionable, 30)
    }
    
    // MARK: - 이적 진행 상태 판단
    
    static func determineTransferStage(
        tier: TransferReliabilityTier,
        title: String,
        description: String? = nil
    ) -> TransferStage {
        
        let combinedText = "\(title) \(description ?? "")".lowercased()
        
        // 공식 발표는 무조건 완료
        if tier == .official {
            return .completed
        }
        
        // 실패/무산 키워드
        let failedKeywords = ["collapsed", "failed", "rejected", "turned down", "fell through"]
        if failedKeywords.contains(where: { combinedText.contains($0) }) {
            return .failed
        }
        
        // 진행 단계 키워드
        if combinedText.contains("medical") || combinedText.contains("unveil") {
            return .medicalPending
        }
        
        if combinedText.contains("agreement") || combinedText.contains("terms agreed") {
            return .termsAgreed
        }
        
        if combinedText.contains("negotiat") || combinedText.contains("talks") {
            return .negotiating
        }
        
        if combinedText.contains("interest") || combinedText.contains("monitor") {
            return .interested
        }
        
        // 신뢰도에 따른 기본 상태
        switch tier {
        case .official, .tierOne:
            return .advanced
        case .verified:
            return .negotiating
        case .reliable:
            return .earlyTalks
        case .questionable, .unreliable:
            return .rumor
        }
    }
}

// MARK: - 이적 진행 단계

enum TransferStage: Int, CaseIterable {
    case rumor = 0
    case interested = 1
    case earlyTalks = 2
    case negotiating = 3
    case advanced = 4
    case termsAgreed = 5
    case medicalPending = 6
    case completed = 7
    case failed = -1
    
    var displayName: String {
        switch self {
        case .rumor: return "루머"
        case .interested: return "관심"
        case .earlyTalks: return "초기 접촉"
        case .negotiating: return "협상 중"
        case .advanced: return "협상 진전"
        case .termsAgreed: return "조건 합의"
        case .medicalPending: return "메디컬 예정"
        case .completed: return "완료"
        case .failed: return "무산"
        }
    }
    
    var progress: Double {
        switch self {
        case .rumor: return 0.1
        case .interested: return 0.2
        case .earlyTalks: return 0.3
        case .negotiating: return 0.5
        case .advanced: return 0.7
        case .termsAgreed: return 0.85
        case .medicalPending: return 0.95
        case .completed: return 1.0
        case .failed: return 0.0
        }
    }
    
    var color: Color {
        switch self {
        case .rumor: return .gray
        case .interested: return .blue.opacity(0.6)
        case .earlyTalks: return .blue
        case .negotiating: return .orange
        case .advanced: return .orange
        case .termsAgreed: return .mint
        case .medicalPending: return .green.opacity(0.8)
        case .completed: return .green
        case .failed: return .red
        }
    }
}

// MARK: - 향상된 이적 뉴스 모델

struct EnhancedTransferNews: Identifiable {
    let id = UUID()
    let playerName: String
    let fromClub: String
    let toClub: String
    let fee: String?
    let status: TransferCenterStatus // 기존 호환성
    let stage: TransferStage // 새로운 상세 단계
    let reliability: TransferReliabilityTier // 신뢰도 등급
    let reliabilityScore: Int // 0-100 점수
    let title: String
    let description: String? // 뉴스 설명
    let source: String
    let author: String?
    let url: String
    let publishedAt: Date
    let league: EuropeanLeague
    let lastUpdated: Date?
    let verificationBadges: [VerificationBadge]
}

// MARK: - 검증 배지

enum VerificationBadge {
    case officialStatement
    case tier1Journalist
    case multipleSourcesConfirmed
    case clubVerified
    case photographic
    case video
    
    var icon: String {
        switch self {
        case .officialStatement: return "doc.text.fill"
        case .tier1Journalist: return "person.crop.circle.badge.checkmark"
        case .multipleSourcesConfirmed: return "person.3.fill"
        case .clubVerified: return "building.2.crop.circle.fill"
        case .photographic: return "camera.fill"
        case .video: return "video.fill"
        }
    }
    
    var description: String {
        switch self {
        case .officialStatement: return "공식 발표"
        case .tier1Journalist: return "Tier 1 기자"
        case .multipleSourcesConfirmed: return "다중 소스 확인"
        case .clubVerified: return "클럽 인증"
        case .photographic: return "사진 증거"
        case .video: return "영상 증거"
        }
    }
}