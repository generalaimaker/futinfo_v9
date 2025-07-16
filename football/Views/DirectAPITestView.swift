import SwiftUI

struct DirectAPITestView: View {
    @State private var responseText = ""
    @State private var isLoading = false
    @State private var selectedDate = "2025-05-10"
    @State private var selectedLeague = "39"
    @State private var selectedSeason = "2024"
    
    let testDates = [
        "2025-05-10",
        "2025-04-15", 
        "2025-03-20",
        "2024-12-26",
        "2024-09-14"
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // 날짜 선택
                    VStack(alignment: .leading) {
                        Text("Select Date:")
                            .font(.headline)
                        Picker("Date", selection: $selectedDate) {
                            ForEach(testDates, id: \.self) { date in
                                Text(date).tag(date)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    .padding()
                    
                    // 리그 입력
                    VStack(alignment: .leading) {
                        Text("League ID:")
                            .font(.headline)
                        TextField("League ID", text: $selectedLeague)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.numberPad)
                    }
                    .padding(.horizontal)
                    
                    // 시즌 입력
                    VStack(alignment: .leading) {
                        Text("Season:")
                            .font(.headline)
                        TextField("Season", text: $selectedSeason)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.numberPad)
                    }
                    .padding(.horizontal)
                    
                    // 테스트 버튼들
                    VStack(spacing: 10) {
                        Button(action: testSupabaseAPI) {
                            Label("Test Supabase Edge Function", systemImage: "cloud")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        
                        Button(action: testDirectAPI) {
                            Label("Test Direct API", systemImage: "network")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        
                        Button(action: testCURL) {
                            Label("Show cURL Command", systemImage: "terminal")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    .padding(.horizontal)
                    
                    if isLoading {
                        ProgressView()
                            .padding()
                    }
                    
                    // 응답 표시
                    if !responseText.isEmpty {
                        VStack(alignment: .leading) {
                            Text("Response:")
                                .font(.headline)
                            ScrollView {
                                Text(responseText)
                                    .font(.system(.caption, design: .monospaced))
                                    .padding()
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(10)
                            }
                            .frame(maxHeight: 400)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Direct API Test")
        }
    }
    
    func testSupabaseAPI() {
        isLoading = true
        responseText = ""
        
        Task {
            do {
                let service = SupabaseFootballAPIService.shared
                let response = try await service.fetchFixtures(
                    date: selectedDate,
                    leagueId: Int(selectedLeague),
                    season: Int(selectedSeason)
                )
                
                await MainActor.run {
                    responseText = """
                    ✅ Success!
                    Total fixtures: \(response.response.count)
                    
                    Fixtures:
                    \(response.response.prefix(5).map { fixture in
                        "\(fixture.teams.home.name) vs \(fixture.teams.away.name) - \(fixture.fixture.date)"
                    }.joined(separator: "\n"))
                    
                    \(response.response.count > 5 ? "... and \(response.response.count - 5) more" : "")
                    """
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    responseText = "❌ Error: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
    
    func testDirectAPI() {
        isLoading = true
        responseText = ""
        
        Task {
            do {
                // 날짜를 Date 객체로 변환
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                guard let date = formatter.date(from: selectedDate) else {
                    throw FootballAPIError.invalidDateFormat
                }
                
                let service = FootballAPIService.shared
                let fixtures = try await service.getFixtures(
                    leagueId: Int(selectedLeague) ?? 39,
                    season: Int(selectedSeason) ?? 2024,
                    from: date,
                    to: date
                )
                
                await MainActor.run {
                    responseText = """
                    ✅ Direct API Success!
                    Total fixtures: \(fixtures.count)
                    
                    Fixtures:
                    \(fixtures.prefix(5).map { fixture in
                        "\(fixture.teams.home.name) vs \(fixture.teams.away.name) - \(fixture.fixture.date)"
                    }.joined(separator: "\n"))
                    
                    \(fixtures.count > 5 ? "... and \(fixtures.count - 5) more" : "")
                    """
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    responseText = "❌ Direct API Error: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
    
    func testCURL() {
        responseText = """
        # Supabase Edge Function:
        curl -X GET "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/fixtures-api/fixtures?date=\(selectedDate)&league=\(selectedLeague)&season=\(selectedSeason)" \\
          -H "Authorization: Bearer YOUR_ANON_KEY" \\
          -H "Content-Type: application/json"
        
        # Direct Rapid API:
        curl -X GET "https://api-football-v1.p.rapidapi.com/v3/fixtures?date=\(selectedDate)&league=\(selectedLeague)&season=\(selectedSeason)" \\
          -H "x-rapidapi-key: YOUR_API_KEY" \\
          -H "x-rapidapi-host: api-football-v1.p.rapidapi.com"
        """
    }
}

#Preview {
    DirectAPITestView()
}