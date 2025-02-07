import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            LeaguesView()
                .tabItem {
                    Label("리그", systemImage: "trophy")
                }
            
            FixturesView(leagueId: SupportedLeagues.allLeagues[0], leagueName: SupportedLeagues.getName(SupportedLeagues.allLeagues[0]))
                .tabItem {
                    Label("경기 일정", systemImage: "calendar")
                }
        }
    }
}
