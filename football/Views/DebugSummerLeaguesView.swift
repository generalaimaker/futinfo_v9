import SwiftUI

struct DebugSummerLeaguesView: View {
    @State private var results: String = "테스트 준비 중..."
    @State private var isLoading = false
    
    // 7월에 활동하는 리그들
    let summerLeagues = [
        (id: 253, name: "MLS"),
        (id: 71, name: "브라질 세리에 A"),
        (id: 307, name: "사우디 프로 리그"),
        (id: 292, name: "K리그 1"),
        (id: 293, name: "K리그 2"),
        (id: 94, name: "포르투갈 리그"),
        (id: 88, name: "네덜란드 에레디비시"),
        (id: 179, name: "스코틀랜드 프리미어십"),
        (id: 203, name: "터키 쉬페르 리그")
    ]
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("여름 리그 경기 확인")
                    .font(.largeTitle)
                    .bold()
                
                Text("2025년 7월 활동 중인 리그 경기 조회")
                    .foregroundColor(.secondary)
                
                HStack {
                    Button("오늘 경기 확인") {
                        Task {
                            await checkTodayFixtures()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    
                    Button("이번 주 경기 확인") {
                        Task {
                            await checkWeekFixtures()
                        }
                    }
                    .buttonStyle(.bordered)
                }
                .disabled(isLoading)
                
                if isLoading {
                    ProgressView()
                        .padding()
                }
                
                ScrollView {
                    Text(results)
                        .font(.system(.body, design: .monospaced))
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                }
                .frame(maxHeight: 600)
            }
            .padding()
        }
        .navigationTitle("여름 리그 디버그")
    }
    
    private func checkTodayFixtures() async {
        isLoading = true
        results = "오늘 경기 확인 중...\n\n"
        
        let service = SupabaseFootballAPIService.shared
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        
        for league in summerLeagues {
            do {
                let response = try await service.fetchFixtures(
                    date: today,
                    leagueId: league.id,
                    season: 2025
                )
                
                let fixtures = response.response
                results += "\(league.name) (ID: \(league.id)): \(fixtures.count)개 경기\n"
                
                if !fixtures.isEmpty {
                    for fixture in fixtures.prefix(3) {
                        results += "  - \(fixture.teams.home.name) vs \(fixture.teams.away.name)\n"
                    }
                }
                results += "\n"
                
            } catch {
                results += "\(league.name): 오류 - \(error.localizedDescription)\n\n"
            }
            
            // Rate limit 방지
            try? await Task.sleep(nanoseconds: 200_000_000) // 0.2초
        }
        
        isLoading = false
    }
    
    private func checkWeekFixtures() async {
        isLoading = true
        results = "이번 주 경기 확인 중...\n\n"
        
        let service = SupabaseFootballAPIService.shared
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        let calendar = Calendar.current
        let today = Date()
        
        for league in summerLeagues {
            var totalFixtures = 0
            
            for dayOffset in -3...3 {
                guard let date = calendar.date(byAdding: .day, value: dayOffset, to: today) else { continue }
                let dateString = formatter.string(from: date)
                
                do {
                    let response = try await service.fetchFixtures(
                        date: dateString,
                        leagueId: league.id,
                        season: 2025
                    )
                    
                    totalFixtures += response.response.count
                    
                } catch {
                    // 무시
                }
                
                // Rate limit 방지
                try? await Task.sleep(nanoseconds: 100_000_000) // 0.1초
            }
            
            results += "\\(league.name) (ID: \\(league.id)): 이번 주 총 \\(totalFixtures)개 경기\n"
        }
        
        isLoading = false
    }
}

#Preview {
    NavigationStack {
        DebugSummerLeaguesView()
    }
}