import SwiftUI

struct DebugFixturesView: View {
    @StateObject private var viewModel = FixturesOverviewViewModel()
    @State private var testResults: [String] = []
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // 현재 상태
                    VStack(alignment: .leading) {
                        Text("Current Status")
                            .font(.headline)
                        
                        Text("Selected Date: \(viewModel.formatDateForAPI(viewModel.selectedDate))")
                        Text("Cached Fixtures Count: \(viewModel.cachedFixtures.count)")
                        Text("Visible Dates: \(viewModel.visibleDateRange.count)")
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                    
                    // 테스트 버튼
                    VStack(spacing: 10) {
                        Button("Test May 2025 EPL Fixtures") {
                            testSpecificDate(date: "2025-05-10", league: 39, season: 2024, name: "EPL")
                        }
                        
                        Button("Test April 2025 La Liga") {
                            testSpecificDate(date: "2025-04-15", league: 140, season: 2024, name: "La Liga")
                        }
                        
                        Button("Test December 2024 EPL") {
                            testSpecificDate(date: "2024-12-26", league: 39, season: 2024, name: "EPL Boxing Day")
                        }
                        
                        Button("Clear All Caches") {
                            clearCaches()
                        }
                        .foregroundColor(.red)
                    }
                    .padding()
                    
                    if isLoading {
                        ProgressView("Testing...")
                            .padding()
                    }
                    
                    // 결과 표시
                    if !testResults.isEmpty {
                        VStack(alignment: .leading) {
                            Text("Test Results:")
                                .font(.headline)
                            
                            ForEach(testResults, id: \.self) { result in
                                Text(result)
                                    .font(.system(.caption, design: .monospaced))
                                    .padding(5)
                            }
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(10)
                    }
                    
                    // 현재 경기 목록
                    VStack(alignment: .leading) {
                        Text("Current Fixtures")
                            .font(.headline)
                        
                        if let fixtures = viewModel.fixtures[viewModel.selectedDate] {
                            Text("Count: \(fixtures.count)")
                            
                            ForEach(fixtures.prefix(10)) { fixture in
                                HStack {
                                    Text("\(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                                        .font(.caption)
                                    Spacer()
                                    Text(fixture.fixture.status.short)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.vertical, 2)
                            }
                        } else {
                            Text("No fixtures for selected date")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                }
                .padding()
            }
            .navigationTitle("Debug Fixtures")
        }
    }
    
    func testSpecificDate(date: String, league: Int, season: Int, name: String) {
        isLoading = true
        
        Task {
            do {
                testResults.append("🧪 Testing \(name): \(date)")
                
                // 1. Supabase API 테스트
                let supabaseService = SupabaseFootballAPIService.shared
                let response = try await supabaseService.fetchFixtures(
                    date: date,
                    leagueId: league,
                    season: season
                )
                
                testResults.append("✅ Supabase API: \(response.response.count) fixtures")
                
                if response.response.isEmpty {
                    // 2. 직접 API 테스트
                    let formatter = DateFormatter()
                    formatter.dateFormat = "yyyy-MM-dd"
                    if let dateObj = formatter.date(from: date) {
                        let directService = FootballAPIService.shared
                        let fixtures = try await directService.getFixtures(
                            leagueId: league,
                            season: season,
                            from: dateObj,
                            to: dateObj
                        )
                        testResults.append("✅ Direct API: \(fixtures.count) fixtures")
                    }
                }
                
                // 첫 몇 개 경기 표시
                for (index, fixture) in response.response.prefix(3).enumerated() {
                    testResults.append("  \(index + 1). \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                }
                
            } catch {
                testResults.append("❌ Error: \(error.localizedDescription)")
            }
            
            isLoading = false
        }
    }
    
    func clearCaches() {
        // UserDefaults 캐시 클리어
        let domain = Bundle.main.bundleIdentifier!
        UserDefaults.standard.removePersistentDomain(forName: domain)
        UserDefaults.standard.synchronize()
        
        // ViewModel 캐시 클리어
        viewModel.cachedFixtures.removeAll()
        viewModel.fixtures.removeAll()
        
        testResults.append("🗑️ All caches cleared")
    }
}

#Preview {
    DebugFixturesView()
}