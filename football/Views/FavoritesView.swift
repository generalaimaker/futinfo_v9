import SwiftUI

struct FavoritesView: View {
    @ObservedObject private var favoriteService = FavoriteService.shared
    
    var body: some View {
        NavigationView {
            List {
                // 팀 즐겨찾기 섹션
                Section(header: Text("팀")) {
                    if favoriteService.teamFavorites.isEmpty {
                        Text("즐겨찾기한 팀이 없습니다")
                            .foregroundColor(.gray)
                            .italic()
                    } else {
                        ForEach(favoriteService.teamFavorites) { favorite in
                            NavigationLink(destination: TeamProfileView(teamId: favorite.entityId)) {
                                HStack {
                                    // 팀 로고
                                    if let imageUrl = favorite.imageUrl, let url = URL(string: imageUrl) {
                                        AsyncImage(url: url) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                        } placeholder: {
                                            Image(systemName: "sportscourt")
                                                .foregroundColor(.gray)
                                        }
                                        .frame(width: 40, height: 40)
                                    } else {
                                        Image(systemName: "sportscourt")
                                            .foregroundColor(.gray)
                                            .frame(width: 40, height: 40)
                                    }
                                    
                                    // 팀 이름
                                    Text(favorite.name)
                                        .font(.body)
                                }
                            }
                        }
                    }
                }
                
                // 선수 즐겨찾기 섹션
                Section(header: Text("선수")) {
                    if favoriteService.playerFavorites.isEmpty {
                        Text("즐겨찾기한 선수가 없습니다")
                            .foregroundColor(.gray)
                            .italic()
                    } else {
                        ForEach(favoriteService.playerFavorites) { favorite in
                            NavigationLink(destination: PlayerProfileView(playerId: favorite.entityId)) {
                                HStack {
                                    // 선수 사진
                                    if let imageUrl = favorite.imageUrl, let url = URL(string: imageUrl) {
                                        AsyncImage(url: url) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                        } placeholder: {
                                            Image(systemName: "person")
                                                .foregroundColor(.gray)
                                        }
                                        .frame(width: 40, height: 40)
                                        .clipShape(Circle())
                                    } else {
                                        Image(systemName: "person")
                                            .foregroundColor(.gray)
                                            .frame(width: 40, height: 40)
                                    }
                                    
                                    // 선수 이름
                                    Text(favorite.name)
                                        .font(.body)
                                }
                            }
                        }
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("즐겨찾기")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        // 즐겨찾기 새로고침
                        favoriteService.loadFavorites()
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
    }
}

struct FavoritesView_Previews: PreviewProvider {
    static var previews: some View {
        FavoritesView()
    }
}