import Foundation
import Combine

class FavoriteService: ObservableObject {
    // 싱글톤 인스턴스
    static let shared = FavoriteService()
    
    // 즐겨찾기 목록
    @Published var favorites: [Favorite] = []
    
    // UserDefaults 키
    private let favoritesKey = "favorites"
    
    // 초기화
    private init() {
        loadFavorites()
    }
    
    // 즐겨찾기 로드
    func loadFavorites() {
        if let data = UserDefaults.standard.data(forKey: favoritesKey) {
            do {
                let decoder = JSONDecoder()
                favorites = try decoder.decode([Favorite].self, from: data)
            } catch {
                print("즐겨찾기 로드 실패: \(error.localizedDescription)")
                favorites = []
            }
        }
    }
    
    // 즐겨찾기 저장
    func saveFavorites() {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(favorites)
            UserDefaults.standard.set(data, forKey: favoritesKey)
        } catch {
            print("즐겨찾기 저장 실패: \(error.localizedDescription)")
        }
    }
    
    // 즐겨찾기 추가
    func addFavorite(type: Favorite.FavoriteType, entityId: Int, name: String, imageUrl: String? = nil) {
        // 이미 존재하는지 확인
        if !isFavorite(type: type, entityId: entityId) {
            let favorite = Favorite(type: type, entityId: entityId, name: name, imageUrl: imageUrl)
            favorites.append(favorite)
            saveFavorites()
        }
    }
    
    // 즐겨찾기 제거
    func removeFavorite(type: Favorite.FavoriteType, entityId: Int) {
        favorites.removeAll { $0.type == type && $0.entityId == entityId }
        saveFavorites()
    }
    
    // 즐겨찾기 토글
    func toggleFavorite(type: Favorite.FavoriteType, entityId: Int, name: String, imageUrl: String? = nil) {
        if isFavorite(type: type, entityId: entityId) {
            removeFavorite(type: type, entityId: entityId)
        } else {
            addFavorite(type: type, entityId: entityId, name: name, imageUrl: imageUrl)
        }
    }
    
    // 즐겨찾기 여부 확인
    func isFavorite(type: Favorite.FavoriteType, entityId: Int) -> Bool {
        return favorites.contains { $0.type == type && $0.entityId == entityId }
    }
    
    // 특정 타입의 즐겨찾기 목록 가져오기
    func getFavorites(type: Favorite.FavoriteType) -> [Favorite] {
        return favorites.filter { $0.type == type }.sorted()
    }
    
    // 팀 즐겨찾기 목록
    var teamFavorites: [Favorite] {
        return getFavorites(type: .team)
    }
    
    // 선수 즐겨찾기 목록
    var playerFavorites: [Favorite] {
        return getFavorites(type: .player)
    }
}