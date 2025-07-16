import Foundation

/// Community input validation and security utilities
enum CommunityValidator {
    
    // MARK: - Validation Errors
    
    enum ValidationError: LocalizedError {
        case titleTooShort(minLength: Int)
        case titleTooLong(maxLength: Int)
        case contentTooShort(minLength: Int)
        case contentTooLong(maxLength: Int)
        case invalidCharacters(field: String)
        case spamDetected
        case tooManyImages(maxCount: Int)
        case imageTooLarge(maxSize: Int)
        case invalidImageFormat
        case tagsTooMany(maxCount: Int)
        case tagTooLong(maxLength: Int)
        
        var errorDescription: String? {
            switch self {
            case .titleTooShort(let minLength):
                return "제목은 최소 \(minLength)자 이상이어야 합니다"
            case .titleTooLong(let maxLength):
                return "제목은 최대 \(maxLength)자까지 가능합니다"
            case .contentTooShort(let minLength):
                return "내용은 최소 \(minLength)자 이상이어야 합니다"
            case .contentTooLong(let maxLength):
                return "내용은 최대 \(maxLength)자까지 가능합니다"
            case .invalidCharacters(let field):
                return "\(field)에 사용할 수 없는 문자가 포함되어 있습니다"
            case .spamDetected:
                return "스팸으로 의심되는 내용이 감지되었습니다"
            case .tooManyImages(let maxCount):
                return "이미지는 최대 \(maxCount)개까지 첨부 가능합니다"
            case .imageTooLarge(let maxSize):
                return "이미지 크기는 최대 \(maxSize)MB까지 가능합니다"
            case .invalidImageFormat:
                return "지원하지 않는 이미지 형식입니다"
            case .tagsTooMany(let maxCount):
                return "태그는 최대 \(maxCount)개까지 가능합니다"
            case .tagTooLong(let maxLength):
                return "태그는 최대 \(maxLength)자까지 가능합니다"
            }
        }
    }
    
    // MARK: - Validation Constants
    
    private enum Constants {
        static let titleMinLength = 3
        static let titleMaxLength = 100
        static let contentMinLength = 5
        static let contentMaxLength = 10000
        static let commentMinLength = 1
        static let commentMaxLength = 1000
        static let maxImages = 5
        static let maxImageSizeMB = 5
        static let maxTags = 10
        static let maxTagLength = 20
        static let allowedImageFormats = ["jpg", "jpeg", "png", "gif", "webp"]
    }
    
    // MARK: - Validation Methods
    
    static func validatePostTitle(_ title: String) throws -> String {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard trimmed.count >= Constants.titleMinLength else {
            throw ValidationError.titleTooShort(minLength: Constants.titleMinLength)
        }
        
        guard trimmed.count <= Constants.titleMaxLength else {
            throw ValidationError.titleTooLong(maxLength: Constants.titleMaxLength)
        }
        
        // Check for XSS attempts
        let sanitized = sanitizeHTML(trimmed)
        if sanitized != trimmed {
            throw ValidationError.invalidCharacters(field: "제목")
        }
        
        return sanitized
    }
    
    static func validatePostContent(_ content: String) throws -> String {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard trimmed.count >= Constants.contentMinLength else {
            throw ValidationError.contentTooShort(minLength: Constants.contentMinLength)
        }
        
        guard trimmed.count <= Constants.contentMaxLength else {
            throw ValidationError.contentTooLong(maxLength: Constants.contentMaxLength)
        }
        
        // Basic spam detection
        if isSpam(trimmed) {
            throw ValidationError.spamDetected
        }
        
        // Sanitize HTML but allow basic formatting
        let sanitized = sanitizeHTML(trimmed, allowBasicFormatting: true)
        
        return sanitized
    }
    
    static func validateComment(_ content: String) throws -> String {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard trimmed.count >= Constants.commentMinLength else {
            throw ValidationError.contentTooShort(minLength: Constants.commentMinLength)
        }
        
        guard trimmed.count <= Constants.commentMaxLength else {
            throw ValidationError.contentTooLong(maxLength: Constants.commentMaxLength)
        }
        
        // Sanitize HTML
        let sanitized = sanitizeHTML(trimmed)
        
        return sanitized
    }
    
    static func validateTags(_ tags: [String]) throws -> [String] {
        guard tags.count <= Constants.maxTags else {
            throw ValidationError.tagsTooMany(maxCount: Constants.maxTags)
        }
        
        var validatedTags: [String] = []
        
        for tag in tags {
            let trimmed = tag.trimmingCharacters(in: .whitespacesAndNewlines)
            
            guard trimmed.count <= Constants.maxTagLength else {
                throw ValidationError.tagTooLong(maxLength: Constants.maxTagLength)
            }
            
            if !trimmed.isEmpty {
                validatedTags.append(sanitizeHTML(trimmed))
            }
        }
        
        return Array(Set(validatedTags)) // Remove duplicates
    }
    
    static func validateImages(_ imageDatas: [Data]) throws {
        guard imageDatas.count <= Constants.maxImages else {
            throw ValidationError.tooManyImages(maxCount: Constants.maxImages)
        }
        
        for imageData in imageDatas {
            // Check size
            let sizeMB = Double(imageData.count) / (1024 * 1024)
            guard sizeMB <= Double(Constants.maxImageSizeMB) else {
                throw ValidationError.imageTooLarge(maxSize: Constants.maxImageSizeMB)
            }
            
            // Check format by looking at magic bytes
            if !isValidImageFormat(imageData) {
                throw ValidationError.invalidImageFormat
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private static func sanitizeHTML(_ input: String, allowBasicFormatting: Bool = false) -> String {
        var sanitized = input
        
        // Remove script tags and event handlers
        let dangerousPatterns = [
            "<script[^>]*>.*?</script>",
            "on\\w+\\s*=",
            "javascript:",
            "<iframe[^>]*>",
            "<object[^>]*>",
            "<embed[^>]*>"
        ]
        
        for pattern in dangerousPatterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive, .dotMatchesLineSeparators]) {
                sanitized = regex.stringByReplacingMatches(
                    in: sanitized,
                    options: [],
                    range: NSRange(location: 0, length: sanitized.utf16.count),
                    withTemplate: ""
                )
            }
        }
        
        // If not allowing formatting, remove all HTML tags
        if !allowBasicFormatting {
            sanitized = sanitized.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        }
        
        return sanitized
    }
    
    private static func isSpam(_ content: String) -> Bool {
        let lowercased = content.lowercased()
        
        // Basic spam patterns
        let spamPatterns = [
            "\\b(viagra|casino|poker|porn|xxx)\\b",
            "\\$\\d+",
            "\\b(click here|buy now|limited offer)\\b",
            "http[s]?://[^\\s]{50,}", // Very long URLs
            "\\b\\w{20,}\\b", // Very long words
            "([^\\s])\\1{10,}", // Repeated characters
        ]
        
        for pattern in spamPatterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
                let matches = regex.matches(in: lowercased, options: [], range: NSRange(location: 0, length: lowercased.utf16.count))
                if !matches.isEmpty {
                    return true
                }
            }
        }
        
        // Check for excessive caps
        let uppercaseCount = content.filter { $0.isUppercase }.count
        let totalLetters = content.filter { $0.isLetter }.count
        if totalLetters > 10 && Double(uppercaseCount) / Double(totalLetters) > 0.7 {
            return true
        }
        
        return false
    }
    
    private static func isValidImageFormat(_ data: Data) -> Bool {
        guard data.count > 8 else { return false }
        
        let headerBytes = data.prefix(8)
        
        // Check magic bytes for common image formats
        let jpegHeader: [UInt8] = [0xFF, 0xD8, 0xFF]
        let pngHeader: [UInt8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        let gifHeader87: [UInt8] = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]
        let gifHeader89: [UInt8] = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
        let webpHeader: [UInt8] = [0x52, 0x49, 0x46, 0x46] // RIFF
        
        if headerBytes.starts(with: jpegHeader) ||
           headerBytes.starts(with: pngHeader) ||
           headerBytes.starts(with: gifHeader87) ||
           headerBytes.starts(with: gifHeader89) ||
           (headerBytes.starts(with: webpHeader) && data.count > 12 && data[8...11].elementsEqual([0x57, 0x45, 0x42, 0x50])) {
            return true
        }
        
        return false
    }
    
    // MARK: - Nickname Validation
    
    static func isValidNickname(_ nickname: String) -> Bool {
        let trimmed = nickname.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // 길이 체크 (2-20자)
        guard trimmed.count >= 2 && trimmed.count <= 20 else {
            return false
        }
        
        // 한글, 영문, 숫자만 허용
        let pattern = "^[가-힣a-zA-Z0-9]+$"
        let regex = try? NSRegularExpression(pattern: pattern)
        let range = NSRange(location: 0, length: trimmed.utf16.count)
        
        return regex?.firstMatch(in: trimmed, options: [], range: range) != nil
    }
}

// MARK: - Rate Limiter

@MainActor
class RateLimiter {
    private var attempts: [String: [Date]] = [:]
    private let maxAttempts: Int
    private let windowSeconds: TimeInterval
    
    init(maxAttempts: Int = 5, windowSeconds: TimeInterval = 60) {
        self.maxAttempts = maxAttempts
        self.windowSeconds = windowSeconds
    }
    
    func checkLimit(for key: String) throws {
        let now = Date()
        
        // Clean old attempts
        attempts[key] = attempts[key]?.filter { now.timeIntervalSince($0) < windowSeconds } ?? []
        
        // Check limit
        if attempts[key]?.count ?? 0 >= maxAttempts {
            let oldestAttempt = attempts[key]?.first ?? now
            let retryAfter = windowSeconds - now.timeIntervalSince(oldestAttempt)
            throw CommunityError.rateLimited(retryAfter: retryAfter)
        }
        
        // Record attempt
        attempts[key]?.append(now)
        if attempts[key] == nil {
            attempts[key] = [now]
        }
    }
    
    func reset(for key: String) {
        attempts[key] = nil
    }
}

// MARK: - Community Errors

enum CommunityError: LocalizedError {
    case notLoggedIn
    case noPermission(String)
    case networkError
    case invalidData
    case invalidConfiguration
    case invalidCredential
    case unknownError
    case rateLimited(retryAfter: TimeInterval)
    case unauthorized
    case notFound
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .notLoggedIn:
            return "로그인이 필요합니다"
        case .noPermission(let reason):
            return reason
        case .networkError:
            return "네트워크 오류가 발생했습니다"
        case .invalidData:
            return "잘못된 데이터입니다"
        case .invalidConfiguration:
            return "앱 설정에 문제가 있습니다"
        case .invalidCredential:
            return "인증 정보가 올바르지 않습니다"
        case .unknownError:
            return "알 수 없는 오류가 발생했습니다"
        case .rateLimited(let retryAfter):
            return "너무 많은 요청입니다. \(Int(retryAfter))초 후에 다시 시도해주세요"
        case .unauthorized:
            return "권한이 없습니다"
        case .notFound:
            return "요청한 항목을 찾을 수 없습니다"
        case .serverError(let message):
            return "서버 오류: \(message)"
        }
    }
}