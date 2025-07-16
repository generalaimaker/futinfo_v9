import SwiftUI

struct TestFixturesView: View {
    @State private var fixtures: [Fixture] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var selectedDate = Date()
    @State private var selectedLeague = 39 // Premier League
    
    let testDates = [
        "2025-05-15", // 시즌 막바지
        "2025-04-20", // 시즌 중
        "2025-03-15", // 시즌 중
        "2024-12-26", // Boxing Day
        "2024-11-15", // 시즌 중
        "2024-09-15"  // 시즌 초
    ]
    
    let leagues = [
        (id: 39, name: "Premier League"),
        (id: 140, name: "La Liga"),
        (id: 135, name: "Serie A"),
        (id: 78, name: "Bundesliga"),
        (id: 61, name: "Ligue 1"),
        (id: 292, name: "K League 1")
    ]
    
    var body: some View {
        NavigationView {
            VStack {
                // 리그 선택
                Picker("League", selection: $selectedLeague) {
                    ForEach(leagues, id: \.id) { league in
                        Text(league.name).tag(league.id)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                // 날짜 선택
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(testDates, id: \.self) { dateString in
                            Button(action: {
                                testFixtures(for: dateString)
                            }) {
                                Text(dateString)
                                    .padding()
                                    .background(Color.blue.opacity(0.2))
                                    .cornerRadius(8)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                
                if isLoading {
                    ProgressView("Loading...")
                        .padding()
                }
                
                if let error = errorMessage {
                    Text("Error: \(error)")
                        .foregroundColor(.red)
                        .padding()
                }
                
                List(fixtures) { fixture in
                    VStack(alignment: .leading) {
                        HStack {
                            Text(fixture.teams.home.name)
                            Text("vs")
                            Text(fixture.teams.away.name)
                        }
                        .font(.headline)
                        
                        Text("Date: \(fixture.fixture.date)")
                            .font(.caption)
                        
                        Text("Status: \(fixture.fixture.status.long)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Test Fixtures API")
        }
    }
    
    func testFixtures(for dateString: String) {
        isLoading = true
        errorMessage = nil
        fixtures = []
        
        Task {
            do {
                let season = getSeasonForDate(dateString)
                print("🧪 Testing fixtures for date: \(dateString), league: \(selectedLeague), season: \(season)")
                
                // Supabase Edge Function 직접 호출
                let apiService = SupabaseFootballAPIService.shared
                let response = try await apiService.fetchFixtures(
                    date: dateString,
                    leagueId: selectedLeague,
                    season: season
                )
                
                await MainActor.run {
                    self.fixtures = response.response
                    self.isLoading = false
                    print("✅ Loaded \(fixtures.count) fixtures")
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                    print("❌ Error: \(error)")
                }
            }
        }
    }
    
    func getSeasonForDate(_ dateString: String) -> Int {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        guard let date = formatter.date(from: dateString) else {
            return 2024
        }
        
        let calendar = Calendar.current
        let year = calendar.component(.year, from: date)
        let month = calendar.component(.month, from: date)
        
        // 축구 시즌 계산
        return month < 8 ? year - 1 : year
    }
}

#Preview {
    TestFixturesView()
}