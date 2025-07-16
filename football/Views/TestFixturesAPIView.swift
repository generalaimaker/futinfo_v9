import SwiftUI

struct TestFixturesAPIView: View {
    @State private var testResults: [String] = []
    @State private var isLoading = false
    @State private var selectedDate = "2025-05-10"
    @State private var selectedLeague = 39 // EPL
    @State private var selectedSeason = 2024
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // 테스트 설정
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Test Configuration")
                            .font(.headline)
                        
                        HStack {
                            Text("Date:")
                            TextField("Date", text: $selectedDate)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        HStack {
                            Text("League:")
                            TextField("League", value: $selectedLeague, format: .number)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        HStack {
                            Text("Season:")
                            TextField("Season", value: $selectedSeason, format: .number)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                    
                    // 테스트 버튼들
                    VStack(spacing: 10) {
                        Button("Test Direct Supabase Edge Function") {
                            testDirectSupabaseAPI()
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button("Test SupabaseFootballAPIService") {
                            testSupabaseService()
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button("Test getFixturesWithServerCache") {
                            testServerCache()
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button("Clear Results") {
                            testResults.removeAll()
                        }
                        .foregroundColor(.red)
                    }
                    
                    if isLoading {
                        ProgressView()
                            .padding()
                    }
                    
                    // 결과 표시
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Test Results:")
                            .font(.headline)
                        
                        ForEach(testResults.indices, id: \.self) { index in
                            Text(testResults[index])
                                .font(.system(.caption, design: .monospaced))
                                .padding(5)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.gray.opacity(0.05))
                        }
                    }
                    .padding()
                }
                .padding()
            }
            .navigationTitle("Fixtures API Test")
        }
    }
    
    func testDirectSupabaseAPI() {
        isLoading = true
        testResults.append("\n=== Testing Direct Supabase Edge Function ===")
        
        Task {
            do {
                let urlString = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/fixtures-api/fixtures?date=\(selectedDate)&league=\(selectedLeague)&season=\(selectedSeason)"
                testResults.append("URL: \(urlString)")
                
                guard let url = URL(string: urlString) else {
                    testResults.append("❌ Invalid URL")
                    isLoading = false
                    return
                }
                
                var request = URLRequest(url: url)
                request.httpMethod = "GET"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
                request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
                request.setValue(anonKey, forHTTPHeaderField: "apikey")
                
                let (data, response) = try await URLSession.shared.data(for: request)
                
                if let httpResponse = response as? HTTPURLResponse {
                    testResults.append("Status Code: \(httpResponse.statusCode)")
                }
                
                if let jsonString = String(data: data, encoding: .utf8) {
                    testResults.append("Response Length: \(jsonString.count) characters")
                    
                    // Try to parse as FixturesResponse
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .iso8601
                    
                    do {
                        let fixturesResponse = try decoder.decode(FixturesResponse.self, from: data)
                        testResults.append("✅ Successfully parsed FixturesResponse")
                        testResults.append("Results: \(fixturesResponse.results)")
                        testResults.append("Fixtures Count: \(fixturesResponse.response.count)")
                        
                        if fixturesResponse.response.isEmpty {
                            testResults.append("⚠️ No fixtures returned")
                        } else {
                            for (index, fixture) in fixturesResponse.response.prefix(3).enumerated() {
                                testResults.append("\(index + 1). \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                            }
                        }
                    } catch {
                        testResults.append("❌ Failed to parse: \(error)")
                        testResults.append("Raw Response: \(String(jsonString.prefix(500)))")
                    }
                }
                
            } catch {
                testResults.append("❌ Error: \(error)")
            }
            
            isLoading = false
        }
    }
    
    func testSupabaseService() {
        isLoading = true
        testResults.append("\n=== Testing SupabaseFootballAPIService ===")
        
        Task {
            do {
                let service = SupabaseFootballAPIService.shared
                let response = try await service.fetchFixtures(
                    date: selectedDate,
                    leagueId: selectedLeague,
                    season: selectedSeason
                )
                
                testResults.append("✅ Success!")
                testResults.append("Results: \(response.results)")
                testResults.append("Fixtures Count: \(response.response.count)")
                
                if response.response.isEmpty {
                    testResults.append("⚠️ No fixtures returned")
                } else {
                    for (index, fixture) in response.response.prefix(3).enumerated() {
                        testResults.append("\(index + 1). \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                    }
                }
                
            } catch {
                testResults.append("❌ Error: \(error)")
            }
            
            isLoading = false
        }
    }
    
    func testServerCache() {
        isLoading = true
        testResults.append("\n=== Testing getFixturesWithServerCache ===")
        
        Task {
            do {
                let service = SupabaseFootballAPIService.shared
                let fixtures = try await service.getFixturesWithServerCache(
                    date: selectedDate,
                    leagueId: selectedLeague,
                    seasonYear: selectedSeason,
                    forceRefresh: true
                )
                
                testResults.append("✅ Success!")
                testResults.append("Fixtures Count: \(fixtures.count)")
                
                if fixtures.isEmpty {
                    testResults.append("⚠️ No fixtures returned")
                } else {
                    for (index, fixture) in fixtures.prefix(3).enumerated() {
                        testResults.append("\(index + 1). \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                    }
                }
                
            } catch {
                testResults.append("❌ Error: \(error)")
            }
            
            isLoading = false
        }
    }
}

#Preview {
    TestFixturesAPIView()
}