import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0 // "일정" 탭 기본 선택
    @StateObject private var favoriteService = FavoriteService.shared
    
    var body: some View {
        TabView(selection: $selectedTab) {
            FixturesOverviewView()
                .tabItem {
                    Label("일정", systemImage: "calendar")
                }
                .tag(0)
            
            HomeView()
                .tabItem {
                    Label("홈", systemImage: "house.fill")
                }
                .tag(1)
            
            LeaguesView()
                .tabItem {
                    Label("리그", systemImage: "trophy.fill")
                }
                .tag(2)
            
            TeamsView()
                .tabItem {
                    Label("팀", systemImage: "person.3.fill")
                }
                .tag(3)
            
            PlayersView()
                .tabItem {
                    Label("선수", systemImage: "sportscourt.fill")
                }
                .tag(4)
            
            FavoritesView()
                .tabItem {
                    Label("즐겨찾기", systemImage: "star.fill")
                }
                .tag(5)
        }
        .accentColor(.blue)
        .environmentObject(favoriteService)
    }
}

// 더미 뷰 (추후 구현 예정)
struct HomeView: View {
    var body: some View {
        NavigationView {
            Text("홈 화면")
                .navigationTitle("홈")
        }
    }
}

struct TeamsView: View {
    var body: some View {
        NavigationView {
            Text("팀 화면")
                .navigationTitle("팀")
        }
    }
}

struct PlayersView: View {
    var body: some View {
        NavigationView {
            Text("선수 화면")
                .navigationTitle("선수")
        }
    }
}
