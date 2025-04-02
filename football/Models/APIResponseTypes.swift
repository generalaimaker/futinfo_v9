import Foundation

// MARK: - API 응답 공통 모델

// API 에러 확인 프로토콜
public protocol ResponseErrorCheckable {
    var errors: [String] { get }
}

// API 응답의 파라미터 모델 (FixtureDetail.swift에서 사용)
public struct ResponseParameters: Codable {
    public let fixture: String?
    public let league: String?
    public let season: String?
    public let team: String?
    public let date: String?
    
    public init(fixture: String? = nil, league: String? = nil, season: String? = nil, team: String? = nil, date: String? = nil) {
        self.fixture = fixture
        self.league = league
        self.season = season
        self.team = team
        self.date = date
    }
}

// API 응답의 페이징 모델 (FixtureDetail.swift에서 사용)
public struct ResponsePaging: Codable {
    public let current: Int
    public let total: Int
    
    public init(current: Int, total: Int) {
        self.current = current
        self.total = total
    }
}