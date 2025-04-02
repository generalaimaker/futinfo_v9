import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 2 // "일정" 탭 기본 선택
    @StateObject private var favoriteService = FavoriteService.shared
    
    var body: some View {
        TabView(selection: $selectedTab) {
            CommunityView()
                .tabItem {
                    Label("커뮤", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .tag(0)
            
            LeaguesView()
                .tabItem {
                    Label("리그", systemImage: "trophy.fill")
                }
                .tag(1)
            
            FixturesOverviewView()
                .tabItem {
                    Label("일정", systemImage: "calendar")
                }
                .tag(2)
            
            NewsView()
                .tabItem {
                    Label("뉴스", systemImage: "newspaper.fill")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Label("설정", systemImage: "gearshape.fill")
                }
                .tag(4)
        }
        .accentColor(.blue)
        .environmentObject(favoriteService)
    }
}

// 더미 뷰 (추후 구현 예정)
struct CommunityView: View {
    var body: some View {
        NavigationView {
            Text("커뮤니티 화면")
                .navigationTitle("커뮤니티")
        }
    }
}

struct NewsView: View {
    var body: some View {
        NavigationView {
            Text("뉴스 화면")
                .navigationTitle("뉴스")
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject var favoriteService: FavoriteService
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("팔로잉")) {
                    NavigationLink(destination: FavoritesView()) {
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                            Text("즐겨찾기")
                        }
                    }
                    
                    NavigationLink(destination: FollowingTeamsView()) {
                        HStack {
                            Image(systemName: "person.3.fill")
                                .foregroundColor(.blue)
                            Text("팔로잉 팀")
                        }
                    }
                    
                    NavigationLink(destination: FollowingPlayersView()) {
                        HStack {
                            Image(systemName: "sportscourt.fill")
                                .foregroundColor(.green)
                            Text("팔로잉 선수")
                        }
                    }
                }
                
                Section(header: Text("앱 설정")) {
                    Toggle("다크 모드", isOn: .constant(false))
                    Toggle("푸시 알림", isOn: .constant(true))
                    
                    NavigationLink(destination: Text("언어 설정")) {
                        Text("언어")
                    }
                }
                
                Section(header: Text("정보")) {
                    NavigationLink(destination: Text("앱 정보")) {
                        Text("앱 정보")
                    }
                    
                    NavigationLink(destination: Text("개인정보 처리방침")) {
                        Text("개인정보 처리방침")
                    }
                    
                    NavigationLink(destination: Text("이용약관")) {
                        Text("이용약관")
                    }
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("설정")
        }
    }
}

// 팔로잉 팀 화면
struct FollowingTeamsView: View {
    @EnvironmentObject var favoriteService: FavoriteService
    
    var body: some View {
        List {
            if favoriteService.teamFavorites.isEmpty {
                Text("팔로잉하는 팀이 없습니다.")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                ForEach(favoriteService.teamFavorites) { team in
                    NavigationLink(destination: TeamProfileView(teamId: team.entityId)) {
                        HStack {
                            AsyncImage(url: URL(string: team.imageUrl ?? "")) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                            } placeholder: {
                                Image(systemName: "sportscourt.fill")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 40, height: 40)
                            
                            Text(team.name)
                                .padding(.leading, 8)
                        }
                    }
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        let team = favoriteService.teamFavorites[index]
                        favoriteService.removeFavorite(type: .team, entityId: team.entityId)
                    }
                }
            }
        }
        .navigationTitle("팔로잉 팀")
        .toolbar {
            EditButton()
        }
    }
}

// 팔로잉 선수 화면
struct FollowingPlayersView: View {
    @EnvironmentObject var favoriteService: FavoriteService
    
    var body: some View {
        List {
            if favoriteService.playerFavorites.isEmpty {
                Text("팔로잉하는 선수가 없습니다.")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                ForEach(favoriteService.playerFavorites) { player in
                    NavigationLink(destination: PlayerProfileView(playerId: player.entityId)) {
                        HStack {
                            AsyncImage(url: URL(string: player.imageUrl ?? "")) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                                    .clipShape(Circle())
                            } placeholder: {
                                Image(systemName: "person.fill")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 40, height: 40)
                            
                            VStack(alignment: .leading) {
                                Text(player.name)
                                    .font(.headline)
                                Text("선수 정보")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            .padding(.leading, 8)
                        }
                    }
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        let player = favoriteService.playerFavorites[index]
                        favoriteService.removeFavorite(type: .player, entityId: player.entityId)
                    }
                }
            }
        }
        .navigationTitle("팔로잉 선수")
        .toolbar {
            EditButton()
        }
    }
}
