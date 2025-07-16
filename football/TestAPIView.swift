import SwiftUI

struct TestAPIView: View {
    @State private var testResult = "테스트 중..."
    @State private var isLoading = true
    @State private var showDirectAPITest = false
    @State private var directAPIResult = ""
    
    var body: some View {
        VStack(spacing: 20) {
            Text("API 테스트")
                .font(.largeTitle)
                .padding()
            
            if isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
            } else {
                ScrollView {
                    Text(testResult)
                        .font(.system(.body, design: .monospaced))
                        .padding()
                }
            }
            
            HStack {
                Button("테스트 다시 실행") {
                    Task {
                        await runAPITest()
                    }
                }
                .padding()
                
                Button("직접 API 테스트") {
                    Task {
                        await runDirectAPITest()
                    }
                }
                .padding()
                .foregroundColor(.orange)
            }
        }
        .task {
            await runAPITest()
        }
    }
    
    private func runAPITest() async {
        isLoading = true
        var results = ""
        
        let service = FootballAPIService.shared
        
        // 1. API 상태 확인
        results += "🔑 API 테스트 시작\n"
        results += "Supabase Edge Functions: \(AppConfiguration.shared.useSupabaseEdgeFunctions ? "ON" : "OFF")\n"
        results += "API Key: \(service.apiKey.prefix(10))...\n"
        results += "API Host: \(service.apiHost)\n\n"
        
        // 2. 간단한 리그 조회
        do {
            results += "📊 프리미어리그 정보 조회 중...\n"
            let params = ["id": "39"]
            let response: LeaguesResponse = try await service.performRequest(
                endpoint: "/leagues",
                parameters: params,
                cachePolicy: .never,
                forceRefresh: true
            )
            
            if let league = response.response.first {
                results += "✅ API 작동 확인!\n"
                results += "리그: \(league.league.name)\n"
                results += "국가: \(league.country?.name ?? "N/A")\n"
                results += "시즌 수: \(league.seasons?.count ?? 0)\n\n"
            } else {
                results += "❌ 응답 없음\n\n"
            }
        } catch {
            results += "❌ API 오류: \(error)\n\n"
        }
        
        // 3. 클럽 월드컵 확인
        do {
            results += "🏆 클럽 월드컵 정보 조회 중...\n"
            let params = ["id": "15"]
            let response: LeaguesResponse = try await service.performRequest(
                endpoint: "/leagues",
                parameters: params,
                cachePolicy: .never,
                forceRefresh: true
            )
            
            if let league = response.response.first {
                results += "✅ 클럽 월드컵 발견!\n"
                results += "리그: \(league.league.name)\n"
                results += "타입: \(league.league.type)\n"
                if let seasons = league.seasons {
                    results += "시즌: \(seasons.map { $0.year }.sorted())\n\n"
                }
            } else {
                results += "❌ 클럽 월드컵 정보 없음\n\n"
            }
        } catch {
            results += "❌ 클럽 월드컵 오류: \(error)\n\n"
        }
        
        // 4. 2024년 12월 클럽 월드컵 경기 조회
        do {
            results += "📅 2024년 12월 클럽 월드컵 경기 조회 중...\n"
            let params = [
                "league": "15",
                "season": "2024",
                "from": "2024-12-01",
                "to": "2024-12-31"
            ]
            
            let response: FixturesResponse = try await service.performRequest(
                endpoint: "/fixtures",
                parameters: params,
                cachePolicy: .never,
                forceRefresh: true
            )
            
            results += "경기 수: \(response.response.count)개\n"
            if response.response.isEmpty {
                results += "⚠️ 빈 응답 받음 - 캐시 문제일 수 있습니다\n"
            }
            for fixture in response.response.prefix(5) {
                results += "\(fixture.fixture.date): \(fixture.teams.home.name) vs \(fixture.teams.away.name)\n"
            }
            results += "\n"
        } catch {
            results += "❌ 경기 조회 오류: \(error)\n\n"
        }
        
        // 5. 직접 API 호출 테스트
        results += "🔄 직접 API 호출 테스트...\n"
        do {
            var urlComponents = URLComponents(string: "https://api-football-v1.p.rapidapi.com/v3/fixtures")!
            urlComponents.queryItems = [
                URLQueryItem(name: "league", value: "15"),
                URLQueryItem(name: "season", value: "2024")
            ]
            
            var request = URLRequest(url: urlComponents.url!)
            request.setValue(service.apiKey, forHTTPHeaderField: "x-rapidapi-key")
            request.setValue(service.apiHost, forHTTPHeaderField: "x-rapidapi-host")
            
            let (data, _) = try await URLSession.shared.data(for: request)
            if String(data: data, encoding: .utf8) != nil {
                let jsonData = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                let responseArray = jsonData?["response"] as? [[String: Any]] ?? []
                results += "직접 API 응답: \(responseArray.count)개 경기\n"
                if responseArray.isEmpty {
                    results += "⚠️ 직접 API 호출도 빈 응답\n"
                }
            }
        } catch {
            results += "❌ 직접 API 호출 실패: \(error)\n"
        }
        results += "\n"
        
        // 5. 현재 날짜 확인
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        formatter.timeZone = TimeZone.current
        results += "⏰ 현재 시간: \(formatter.string(from: Date()))\n"
        results += "📍 시간대: \(TimeZone.current.identifier)\n"
        
        testResult = results
        isLoading = false
    }
    
    private func runDirectAPITest() async {
        isLoading = true
        showDirectAPITest = true
        
        do {
            let directService = DirectAPIService.shared
            directAPIResult = try await directService.testClubWorldCup()
        } catch {
            directAPIResult = "직접 API 테스트 실패: \(error)"
        }
        
        testResult += "\n\n" + directAPIResult
        isLoading = false
    }
}

#Preview {
    TestAPIView()
}