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
    var errors: [String] { get }
}
