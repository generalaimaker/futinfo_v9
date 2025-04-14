import SwiftUI

import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 2 // "일정" 탭 기본 선택
    @StateObject private var favoriteService = FavoriteService.shared
    @State private var showingSearchView = false // 검색 뷰 표시 상태

    var body: some View {
        TabView(selection: $selectedTab) {
            // 각 탭 뷰에 검색 버튼 추가
            CommunityView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("커뮤", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .tag(0)

            LeaguesView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("리그", systemImage: "trophy.fill")
                }
                .tag(1)

            FixturesOverviewView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("일정", systemImage: "calendar")
                }
                .tag(2)

            NewsView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("뉴스", systemImage: "newspaper.fill")
                }
                .tag(3)

            SettingsView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("설정", systemImage: "gearshape.fill")
                }
                .tag(4)
        }
        .accentColor(.blue)
        .environmentObject(favoriteService)
        // 검색 뷰를 시트로 표시
        .sheet(isPresented: $showingSearchView) {
            SearchView()
        }
    }
}

// 검색 버튼을 추가하는 ViewModifier
struct SearchToolbarModifier: ViewModifier {
    @Binding var isPresented: Bool

    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        isPresented = true
                    } label: {
                        Image(systemName: "magnifyingglass")
                    }
                }
            }
    }
}

// View 확장을 통해 쉽게 적용 가능하도록 함
extension View {
    func addSearchToolbar(isPresented: Binding<Bool>) -> some View {
        self.modifier(SearchToolbarModifier(isPresented: isPresented))
    }
}


// 더미 뷰 (추후 구현 예정)
struct CommunityView: View {
    var body: some View {
        NavigationView {
            Text("커뮤니티 화면")
                .navigationTitle("커뮤니티")
            // 검색 버튼 추가 (ViewModifier 사용)
            // .addSearchToolbar(isPresented: <#Binding<Bool>#>) // ContentView에서 바인딩 전달 필요
        }
    }
}

struct NewsView: View {
    var body: some View {
        NavigationView {
            Text("뉴스 화면")
                .navigationTitle("뉴스")
            // 검색 버튼 추가 (ViewModifier 사용)
            // .addSearchToolbar(isPresented: <#Binding<Bool>#>) // ContentView에서 바인딩 전달 필요
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
