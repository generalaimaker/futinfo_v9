import Foundation

enum FootballAPIError: LocalizedError, Equatable {
    case invalidURL
    case invalidResponse
    case rateLimitExceeded
    case apiError([String])
    case decodingError(Error)
    case missingAPIKey
    case invalidAPIKey
    case firebaseFunctionError(String)
    case serverError
    case emptyResponse(String)
    case invalidParameters(String)
    
    static func == (lhs: FootballAPIError, rhs: FootballAPIError) -> Bool {
        switch (lhs, rhs) {
        case (.invalidURL, .invalidURL),
             (.invalidResponse, .invalidResponse),
             (.rateLimitExceeded, .rateLimitExceeded),
             (.missingAPIKey, .missingAPIKey),
             (.invalidAPIKey, .invalidAPIKey),
             (.serverError, .serverError):
            return true
        case (.apiError(let lhsErrors), .apiError(let rhsErrors)):
            return lhsErrors == rhsErrors
        case (.decodingError, .decodingError):
            // Error 프로토콜은 Equatable을 준수하지 않으므로 타입만 비교
            return true
        case (.firebaseFunctionError(let lhsMessage), .firebaseFunctionError(let rhsMessage)):
            return lhsMessage == rhsMessage
        case (.emptyResponse(let lhsMessage), .emptyResponse(let rhsMessage)):
            return lhsMessage == rhsMessage
        case (.invalidParameters(let lhsMessage), .invalidParameters(let rhsMessage)):
            return lhsMessage == rhsMessage
        default:
            return false
        }
    }
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "잘못된 URL입니다."
        case .invalidResponse:
            return "서버로부터 잘못된 응답을 받았습니다."
        case .rateLimitExceeded:
            return "API 요청 한도를 초과했습니다."
        case .apiError(let messages):
            return messages.joined(separator: ", ")
        case .decodingError(let error):
            return "데이터 디코딩 오류: \(error.localizedDescription)"
        case .missingAPIKey:
            return "API 키를 찾을 수 없습니다."
        case .invalidAPIKey:
            return "유효하지 않은 API 키입니다."
        case .firebaseFunctionError(let message):
            return "Firebase 함수 호출 중 오류: \(message)"
        case .serverError:
            return "서버 오류가 발생했습니다."
        case .emptyResponse(let message):
            return message
        case .invalidParameters(let message):
            return message
        }
    }
}

// API 에러 확인 프로토콜
protocol APIErrorCheckable {
    var errors: Any { get }
    
    // 에러 메시지 배열로 변환하는 메서드
    func getErrorMessages() -> [String]
    
    // 에러가 있는지 확인하는 메서드
    func hasErrors() -> Bool
}

// APIErrorCheckable 프로토콜 기본 구현 추가
extension APIErrorCheckable {
    func getErrorMessages() -> [String] {
        // errors가 배열인 경우
        if let errorArray = errors as? [String] {
            return errorArray
        }
        // errors가 딕셔너리인 경우
        else if let errorDict = errors as? [String: String] {
            return errorDict.map { "\($0.key): \($0.value)" }
        }
        // 기타 타입인 경우
        else {
            return ["알 수 없는 오류 형식: \(errors)"]
        }
    }
    
    func hasErrors() -> Bool {
        // errors가 배열인 경우
        if let errorArray = errors as? [String] {
            return !errorArray.isEmpty
        }
        // errors가 딕셔너리인 경우
        else if let errorDict = errors as? [String: String] {
            return !errorDict.isEmpty
        }
        // errors가 빈 배열인 경우
        else if let emptyArray = errors as? [Any], emptyArray.isEmpty {
            return false
        }
        // errors가 빈 딕셔너리인 경우
        else if let emptyDict = errors as? [String: Any], emptyDict.isEmpty {
            return false
        }
        // 기타 타입인 경우 (nil이 아니면 에러가 있다고 간주)
        else {
            return true
        }
    }
}
