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
                        
                        Button("Run Comprehensive API Test") {
                            runComprehensiveTest()
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button("Test Club Friendlies (667)") {
                            testClubFriendlies()
                        }
                        .buttonStyle(.bordered)
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
    
    func runComprehensiveTest() {
        isLoading = true
        testResults.removeAll()
        
        Task {
            testResults.append("=== Comprehensive API Test ===")
            testResults.append("Date: \(Date())")
            
            let service = SupabaseFootballAPIService.shared
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
            
            let today = dateFormatter.string(from: Date())
            testResults.append("Today string: \(today)")
            
            // Test 1: Direct fetchFixtures call
            testResults.append("\n1. Testing fetchFixtures directly...")
            do {
                let response = try await service.fetchFixtures(date: today)
                testResults.append("✅ fetchFixtures success: \(response.results) results")
                if response.results > 0 {
                    testResults.append("   First fixture: \(response.response[0].teams.home.name) vs \(response.response[0].teams.away.name)")
                }
            } catch {
                testResults.append("❌ fetchFixtures error: \(error)")
            }
            
            // Test 2: getFixturesWithServerCache
            testResults.append("\n2. Testing getFixturesWithServerCache...")
            do {
                let fixtures = try await service.getFixturesWithServerCache(
                    date: today,
                    leagueId: 667,  // Club friendlies
                    seasonYear: 2025,
                    forceRefresh: true
                )
                testResults.append("✅ getFixturesWithServerCache success: \(fixtures.count) fixtures")
                if fixtures.count > 0 {
                    testResults.append("   First fixture: \(fixtures[0].teams.home.name) vs \(fixtures[0].teams.away.name)")
                }
            } catch {
                testResults.append("❌ getFixturesWithServerCache error: \(error)")
            }
            
            // Test 3: SupabaseEdgeFunctionsService
            testResults.append("\n3. Testing SupabaseEdgeFunctionsService...")
            do {
                let edgeService = SupabaseEdgeFunctionsService.shared
                let fixtures = try await edgeService.fetchFixtures(
                    date: today,
                    leagueId: 667,
                    seasonYear: 2025,
                    forceRefresh: true
                )
                testResults.append("✅ SupabaseEdgeFunctionsService success: \(fixtures.count) fixtures")
                if fixtures.count > 0 {
                    testResults.append("   First fixture: \(fixtures[0].teams.home.name) vs \(fixtures[0].teams.away.name)")
                }
            } catch {
                testResults.append("❌ SupabaseEdgeFunctionsService error: \(error)")
            }
            
            // Test 4: LiveMatchService
            testResults.append("\n4. Testing LiveMatchService...")
            do {
                let liveService = LiveMatchService.shared
                let liveMatches = try await liveService.getLiveMatches()
                testResults.append("✅ LiveMatchService success: \(liveMatches.count) live matches")
                if liveMatches.count > 0 {
                    testResults.append("   First live match: \(liveMatches[0].teams.home.name) vs \(liveMatches[0].teams.away.name)")
                }
            } catch {
                testResults.append("❌ LiveMatchService error: \(error)")
            }
            
            testResults.append("\n=== Test Complete ===")
            isLoading = false
        }
    }
    
    func testClubFriendlies() {
        isLoading = true
        testResults.removeAll()
        
        Task {
            testResults.append("=== Testing Club Friendlies (667) ===")
            
            let service = SupabaseFootballAPIService.shared
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
            
            let today = dateFormatter.string(from: Date())
            
            // Test with different methods
            do {
                // Method 1: Direct API call with league 667
                let fixtures = try await service.getFixturesWithServerCache(
                    date: today,
                    leagueId: 667,
                    seasonYear: 2025,
                    forceRefresh: true
                )
                testResults.append("✅ Found \(fixtures.count) club friendlies for today")
                
                // Show major European teams
                let majorTeams = [33, 40, 50, 47, 42, 49, 529, 541, 530, 489, 505, 496, 157, 165, 85]
                let majorTeamFriendlies = fixtures.filter { fixture in
                    majorTeams.contains(fixture.teams.home.id) || majorTeams.contains(fixture.teams.away.id)
                }
                
                testResults.append("✅ Major European team friendlies: \(majorTeamFriendlies.count)")
                for fixture in majorTeamFriendlies.prefix(5) {
                    testResults.append("   \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                }
                
            } catch {
                testResults.append("❌ Error: \(error)")
            }
            
            isLoading = false
        }
    }
}

#Preview {
    DebugFixturesView()
}