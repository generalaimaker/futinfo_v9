import Foundation

// 즐겨찾기 모델
struct Favorite: Identifiable, Codable, Equatable, Comparable {
    let id: UUID
    let type: FavoriteType
    let entityId: Int
    let name: String
    let imageUrl: String?
    let createdAt: Date
    
    init(id: UUID = UUID(), type: FavoriteType, entityId: Int, name: String, imageUrl: String? = nil) {
        self.id = id
        self.type = type
        self.entityId = entityId
        self.name = name
        self.imageUrl = imageUrl
        self.createdAt = Date()
    }
    
    enum FavoriteType: String, Codable {
        case team
        case player
    }
    
    // 정렬을 위한 비교 연산자
    static func < (lhs: Favorite, rhs: Favorite) -> Bool {
        if lhs.type != rhs.type {
            return lhs.type.rawValue < rhs.type.rawValue
        }
        return lhs.name < rhs.name
    }
}