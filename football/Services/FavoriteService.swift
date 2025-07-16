import Foundation
import Combine
import Supabase

@MainActor
class FavoriteService: ObservableObject {
    // 싱글톤 인스턴스
    static let shared = FavoriteService()
    
    // 즐겨찾기 목록
    @Published var favorites: [Favorite] = []
    
    // UserDefaults 키
    private let favoritesKey = "favorites"
    
    // Supabase 서비스
    private let supabaseService = SupabaseService.shared
    private let communityService = SupabaseCommunityService.shared
    
    // 동기화 상태
    @Published var isSyncing = false
    private var cancellables = Set<AnyCancellable>()
    
    // 초기화
    private init() {
        loadFavorites()
        setupAuthObserver()
    }
    
    // 인증 상태 변경 관찰
    private func setupAuthObserver() {
        communityService.$isAuthenticated
            .dropFirst()
            .sink { [weak self] isAuthenticated in
                Task {
                    if isAuthenticated {
                        await self?.syncFromServerToLocal()
                    }
                }
            }
            .store(in: &cancellables)
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
            
            // 로그인한 경우 서버에도 저장
            if communityService.isAuthenticated {
                Task {
                    await syncToServer(favorite: favorite, action: .add)
                }
            }
        }
    }
    
    // 즐겨찾기 제거
    func removeFavorite(type: Favorite.FavoriteType, entityId: Int) {
        if let favorite = favorites.first(where: { $0.type == type && $0.entityId == entityId }) {
            favorites.removeAll { $0.type == type && $0.entityId == entityId }
            saveFavorites()
            
            // 로그인한 경우 서버에서도 제거
            if communityService.isAuthenticated {
                Task {
                    await syncToServer(favorite: favorite, action: .remove)
                }
            }
        }
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
    
    // MARK: - Sync Methods
    
    private enum SyncAction {
        case add
        case remove
    }
    
    // 서버로 동기화
    private func syncToServer(favorite: Favorite, action: SyncAction) async {
        do {
            switch action {
            case .add:
                let followName = favorite.name
                let followImageUrl = favorite.imageUrl
                
                switch favorite.type {
                case .team:
                    try await supabaseService.followTeam(
                        teamId: favorite.entityId,
                        teamName: followName,
                        teamImageUrl: followImageUrl
                    )
                case .player:
                    try await supabaseService.followPlayer(
                        playerId: favorite.entityId,
                        playerName: followName,
                        playerImageUrl: followImageUrl
                    )
                }
                
            case .remove:
                switch favorite.type {
                case .team:
                    try await supabaseService.unfollowTeam(teamId: favorite.entityId)
                case .player:
                    try await supabaseService.unfollowPlayer(playerId: favorite.entityId)
                }
            }
        } catch {
            print("서버 동기화 실패: \(error)")
        }
    }
    
    // 서버에서 로컬로 동기화 (병합 전략)
    func syncFromServerToLocal() async {
        guard communityService.isAuthenticated else { return }
        
        isSyncing = true
        
        do {
            // 서버에서 팔로우 목록 가져오기
            let teamFollows = try await supabaseService.getFollowedTeams()
            let playerFollows = try await supabaseService.getFollowedPlayers()
            let follows = teamFollows + playerFollows
            
            // 현재 로컬 즐겨찾기를 백업
            let localFavorites = favorites
            
            // 서버 데이터를 Set으로 변환 (중복 제거 및 빠른 검색)
            var serverFavorites = Set<Favorite>()
            for follow in follows {
                let favorite = Favorite(
                    type: follow.followType == "team" ? .team : .player,
                    entityId: follow.followId,
                    name: follow.followName,
                    imageUrl: follow.followImageUrl
                )
                serverFavorites.insert(favorite)
            }
            
            // 병합 전략: 로컬과 서버 데이터 합치기
            var mergedFavorites = serverFavorites
            
            // 로컬에만 있는 항목을 서버에 추가
            for localFavorite in localFavorites {
                if !serverFavorites.contains(localFavorite) {
                    mergedFavorites.insert(localFavorite)
                    // 서버에도 추가
                    await syncToServer(favorite: localFavorite, action: .add)
                }
            }
            
            // 병합된 데이터를 로컬에 저장
            favorites = Array(mergedFavorites).sorted()
            saveFavorites()
            
        } catch {
            print("서버에서 동기화 실패: \(error)")
        }
        
        isSyncing = false
    }
    
    // 로컬에서 서버로 전체 동기화 (로그인 시)
    func syncLocalToServer() async {
        guard communityService.isAuthenticated else { return }
        
        isSyncing = true
        
        // 현재 로컬 즐겨찾기를 서버로 업로드
        for favorite in favorites {
            await syncToServer(favorite: favorite, action: .add)
        }
        
        isSyncing = false
    }
}