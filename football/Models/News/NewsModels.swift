import Foundation
import SwiftUI

// MARK: - News Models

struct NewsArticle: Identifiable {
    let id = UUID()
    let title: String
    let summary: String
    let source: String
    let url: String
    let publishedAt: Date
    let category: NewsCategory
    let imageUrl: String?
    
    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: publishedAt, relativeTo: Date())
    }
}

enum NewsCategory: String, CaseIterable, Identifiable, Codable {
    case all = "all"
    case transfer = "transfer"
    case match = "match"
    case injury = "injury"
    case general = "general"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .all: return "전체"
        case .transfer: return "이적"
        case .match: return "경기"
        case .injury: return "부상"
        case .general: return "일반"
        }
    }
    
    var icon: String {
        switch self {
        case .all: return "newspaper"
        case .transfer: return "arrow.left.arrow.right"
        case .match: return "sportscourt"
        case .injury: return "cross.case"
        case .general: return "doc.text"
        }
    }
}

// MARK: - News API Response Models

struct NewsAPIResponse: Codable {
    let articles: [NewsAPIArticle]
    let totalResults: Int
    let status: String
}

struct NewsAPIArticle: Codable {
    let title: String
    let description: String?
    let url: String
    let urlToImage: String?
    let publishedAt: String
    let source: NewsAPISource
}

struct NewsAPISource: Codable {
    let name: String
}

// MARK: - European League Model

enum EuropeanLeague: String, CaseIterable, Identifiable {
    case all = "all"
    case premierLeague = "premier_league"
    case laLiga = "la_liga"
    case serieA = "serie_a"
    case bundesliga = "bundesliga"
    case ligue1 = "ligue_1"
    case championsLeague = "champions_league"
    
    var id: String { rawValue }
    
    var displayName: String {
        switch self {
        case .all: return "전체"
        case .premierLeague: return "프리미어리그"
        case .laLiga: return "라리가"
        case .serieA: return "세리에A"
        case .bundesliga: return "분데스리가"
        case .ligue1: return "리그1"
        case .championsLeague: return "챔피언스리그"
        }
    }
    
    var shortName: String {
        switch self {
        case .all: return "전체"
        case .premierLeague: return "EPL"
        case .laLiga: return "라리가"
        case .serieA: return "세리에A"
        case .bundesliga: return "분데스"
        case .ligue1: return "리그1"
        case .championsLeague: return "UCL"
        }
    }
    
    var themeColor: Color {
        switch self {
        case .all: return .blue
        case .premierLeague: return Color(red: 0.23, green: 0.0, blue: 0.44)
        case .laLiga: return Color(red: 1.0, green: 0.27, blue: 0.0)
        case .serieA: return Color(red: 0.0, green: 0.4, blue: 0.73)
        case .bundesliga: return Color(red: 0.85, green: 0.0, blue: 0.0)
        case .ligue1: return Color(red: 0.0, green: 0.6, blue: 0.2)
        case .championsLeague: return Color(red: 0.0, green: 0.2, blue: 0.4)
        }
    }
    
    var logoName: String {
        switch self {
        case .all: return "globe.europe.africa"
        case .premierLeague: return "crown"
        case .laLiga: return "sun.max"
        case .serieA: return "star"
        case .bundesliga: return "shield"
        case .ligue1: return "flag"
        case .championsLeague: return "trophy"
        }
    }
}

// MARK: - NewsArticle Extensions

extension NewsArticle {
    func withTranslation(title: String?, summary: String?) -> NewsArticle {
        return NewsArticle(
            title: title ?? self.title,
            summary: summary ?? self.summary,
            source: self.source,
            url: self.url,
            publishedAt: self.publishedAt,
            category: self.category,
            imageUrl: self.imageUrl
        )
    }
}