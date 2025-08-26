import Foundation

// Test harness for debugging fixture loading
@MainActor
class TestFixtureLoader {
    static let shared = TestFixtureLoader()
    private let service = SupabaseFootballAPIService.shared
    
    func testFixtureLoading() async {
        print("🧪 === 경기 일정 로딩 테스트 시작 ===")
        
        // 1. 오늘 날짜 테스트
        let today = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        let todayString = dateFormatter.string(from: today)
        
        print("\n1️⃣ 오늘 날짜 테스트: \(todayString)")
        do {
            let response = try await service.fetchFixtures(date: todayString)
            print("✅ 성공: \(response.response.count)개 경기 로드")
            
            // 주요 리그별 경기 수 출력
            var leagueCount: [Int: Int] = [:]
            for fixture in response.response {
                leagueCount[fixture.league.id, default: 0] += 1
            }
            
            for (leagueId, count) in leagueCount.sorted(by: { $0.key < $1.key }).prefix(5) {
                if let league = response.response.first(where: { $0.league.id == leagueId })?.league {
                    print("  - \(league.name): \(count)개")
                }
            }
        } catch {
            print("❌ 실패: \(error)")
        }
        
        // 2. 특정 리그 테스트 (프리미어리그)
        print("\n2️⃣ 프리미어리그 테스트")
        do {
            let response = try await service.fetchFixtures(date: todayString, leagueId: 39)
            print("✅ 성공: \(response.response.count)개 경기")
            
            for fixture in response.response.prefix(3) {
                print("  - \(fixture.teams.home.name) vs \(fixture.teams.away.name)")
            }
        } catch {
            print("❌ 실패: \(error)")
        }
        
        // 3. 배치 요청 테스트
        print("\n3️⃣ 배치 요청 테스트 (주요 리그)")
        do {
            let mainLeagues = [39, 140, 135, 78, 61] // 5대 리그
            let response = try await service.fetchFixturesBatchOptimized(
                date: todayString,
                leagueIds: mainLeagues
            )
            print("✅ 성공: \(response.response.count)개 경기")
            
            // 리그별 분류
            var leagueFixtures: [Int: [Fixture]] = [:]
            for fixture in response.response {
                leagueFixtures[fixture.league.id, default: []].append(fixture)
            }
            
            for leagueId in mainLeagues {
                let count = leagueFixtures[leagueId]?.count ?? 0
                if count > 0 {
                    if let league = leagueFixtures[leagueId]?.first?.league {
                        print("  - \(league.name): \(count)개")
                    }
                }
            }
        } catch {
            print("❌ 실패: \(error)")
        }
        
        // 4. 캐시 테스트
        print("\n4️⃣ 캐시 테스트")
        do {
            // 첫 번째 호출 (캐시 없음)
            let start1 = Date()
            _ = try await service.fetchFixtures(date: todayString, leagueId: 292) // K리그
            let time1 = Date().timeIntervalSince(start1)
            print("  첫 번째 호출: \(String(format: "%.2f", time1))초")
            
            // 두 번째 호출 (캐시 있음)
            let start2 = Date()
            _ = try await service.fetchFixtures(date: todayString, leagueId: 292)
            let time2 = Date().timeIntervalSince(start2)
            print("  두 번째 호출: \(String(format: "%.2f", time2))초")
            
            if time2 < time1 * 0.5 {
                print("✅ 캐시 효과 확인됨")
            } else {
                print("⚠️ 캐시 효과 미미")
            }
        } catch {
            print("❌ 캐시 테스트 실패: \(error)")
        }
        
        // 5. Rate Limit 테스트
        print("\n5️⃣ Rate Limit 상태")
        await MainActor.run {
            let manager = RateLimitManager.shared
            let status = manager.getStatus()
            print("  - 현재 요청 수: \(status.current)/\(status.max)")
            print("  - 남은 요청: \(status.remaining)")
            print("  - 리셋 시간: \(status.resetTime)")
            print("  - 제한 여부: \(manager.canMakeRequest() ? "정상" : "제한됨")")
        }
        
        print("\n✅ === 테스트 완료 ===")
    }
    
    // 특정 날짜 범위 테스트
    func testDateRange(from startDate: Date, to endDate: Date) async {
        print("📅 날짜 범위 테스트")
        
        let calendar = Calendar.current
        var currentDate = startDate
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        
        while currentDate <= endDate {
            let dateString = dateFormatter.string(from: currentDate)
            print("\n테스트 날짜: \(dateString)")
            
            do {
                let response = try await service.fetchFixtures(date: dateString)
                print("  ✅ \(response.response.count)개 경기")
            } catch {
                print("  ❌ 오류: \(error)")
            }
            
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate)!
        }
    }
}