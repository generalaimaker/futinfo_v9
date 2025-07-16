import Foundation

// MARK: - Transfermarkt API Models
struct TransfermarktResponse: Codable {
    let share: TransfermarktShare?
    let rumours: [TransfermarktRumour]?
    
    // Alternative structure if API returns different format
    let transfers: [TransfermarktRumour]?
    let data: [TransfermarktRumour]?
}

struct TransfermarktShare: Codable {
    let title: String?
    let url: String?
    let description: String?
}

struct TransfermarktRumour: Codable {
    let id: String?
    let playerID: String?
    let playerName: String?
    let playerImage: String?
    let playerAge: String?
    let playerNationality: String?
    let playerPosition: String?
    let playerShirtNumber: String?
    let fromClubID: String?
    let fromClubName: String?
    let fromClubImage: String?
    let toClubID: String?
    let toClubName: String?
    let toClubImage: String?
    let transferSum: String?
    let transferCurrency: String?
    let marketValue: String?
    let marketValueCurrency: String?
    let date: String?
    let rumourProbability: String?
    let link: String?
    
    // Alternative field names
    let player_name: String?
    let from_club_name: String?
    let to_club_name: String?
    let transfer_sum: String?
    let transfer_fee: String?
}

// MARK: - Transfermarkt API Service
class TransfermarktAPIService {
    static let shared = TransfermarktAPIService()
    
    // Supabase Edge Function을 통해 API 호출
    private let supabaseURL = "https://uutmymaxkkytibuiiaax.supabase.co"
    private let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM"
    
    // 캐시 설정 (월 500건 제한을 고려)
    private var cache: [String: (data: TransfermarktResponse, timestamp: Date)] = [:]
    private let cacheExpiration: TimeInterval = 3600 * 24 // 24시간 캐싱
    
    // Rate Limit 관리
    private var lastRequestTime: Date?
    private let minRequestInterval: TimeInterval = 0.2 // 초당 5건 = 0.2초 간격
    
    private init() {}
    
    // MARK: - 팀별 이적 루머 가져오기 (Supabase Edge Function 사용)
    func getTransferRumours(for teamId: Int) async throws -> [TransfermarktRumour] {
        // 캐시 확인
        let cacheKey = "rumours_\(teamId)"
        if let cached = cache[cacheKey],
           Date().timeIntervalSince(cached.timestamp) < cacheExpiration {
            print("✅ Transfermarkt 캐시 사용: \(teamId)")
            let rumours = cached.data.rumours ?? cached.data.transfers ?? cached.data.data ?? []
            return rumours
        }
        
        // Rate Limit 확인
        await enforceRateLimit()
        
        // Supabase Edge Function 호출
        let urlString = "\(supabaseURL)/functions/v1/transfermarkt-api"
        
        guard let url = URL(string: urlString) else {
            throw FootballAPIError.invalidRequest
        }
        
        // 요청 본문 생성
        let requestBody: [String: Any] = [
            "endpoint": "/transfers/list-rumors",
            "teamId": teamId,
            "sort": "date_desc"
        ]
        
        guard let bodyData = try? JSONSerialization.data(withJSONObject: requestBody) else {
            throw FootballAPIError.invalidRequest
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = bodyData
        request.timeoutInterval = 10.0
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw FootballAPIError.invalidResponse
            }
            
            if httpResponse.statusCode == 429 {
                print("❌ Transfermarkt API Rate Limit 초과")
                throw FootballAPIError.rateLimitExceeded
            }
            
            guard httpResponse.statusCode == 200 else {
                throw FootballAPIError.httpError(httpResponse.statusCode)
            }
            
            // 디버그용 응답 출력
            if let jsonString = String(data: data, encoding: .utf8) {
                print("📱 Transfermarkt Edge Function 응답:")
                print(jsonString.prefix(500)) // 첫 500자만 출력
            }
            
            let decoder = JSONDecoder()
            
            do {
                let transfermarktResponse = try decoder.decode(TransfermarktResponse.self, from: data)
                
                // 캐시 저장
                cache[cacheKey] = (transfermarktResponse, Date())
                
                // 여러 가능한 필드명 확인
                let rumours = transfermarktResponse.rumours ?? 
                             transfermarktResponse.transfers ?? 
                             transfermarktResponse.data ?? 
                             []
                
                print("✅ Transfermarkt Edge Function 호출 성공: \(rumours.count)개 루머")
                
                return rumours
            } catch {
                print("❌ JSON 디코딩 실패: \(error)")
                // 더미 데이터로 폴백
                return []
            }
            
        } catch {
            print("❌ Transfermarkt Edge Function 오류: \(error)")
            throw error
        }
    }
    
    // MARK: - Helper Methods
    
    private func enforceRateLimit() async {
        if let lastTime = lastRequestTime {
            let timeSinceLastRequest = Date().timeIntervalSince(lastTime)
            if timeSinceLastRequest < minRequestInterval {
                let waitTime = minRequestInterval - timeSinceLastRequest
                try? await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000_000))
            }
        }
        lastRequestTime = Date()
    }
    
    // Edge Function이 이미 팀별로 필터링해주므로 별도 필터링 불필요
    
    private func mapToTransfermarktClubId(_ teamId: Int) -> String? {
        // Football API ID를 Transfermarkt Club ID로 매핑
        let mapping: [Int: String] = [
            // Premier League
            47: "148",    // Tottenham
            49: "631",    // Chelsea
            50: "281",    // Manchester City
            42: "11",     // Arsenal
            40: "31",     // Liverpool
            33: "985",    // Manchester United
            34: "762",    // Newcastle
            48: "379",    // West Ham
            51: "1237",   // Brighton
            66: "405",    // Aston Villa
            
            // La Liga
            541: "418",   // Real Madrid
            529: "131",   // Barcelona
            530: "13",    // Atletico Madrid
            
            // Bundesliga
            157: "27",    // Bayern Munich
            165: "16",    // Borussia Dortmund
            168: "15",    // Bayer Leverkusen
            
            // Serie A
            496: "506",   // Juventus
            505: "46",    // Inter
            489: "5",     // AC Milan
            492: "6195",  // Napoli
            
            // Ligue 1
            85: "583",    // PSG
            91: "162",    // Monaco
            81: "244"     // Marseille
        ]
        
        return mapping[teamId]
    }
    
    private func getCompetitionId(for teamId: Int) -> String {
        // 팀 ID로 리그 판별
        switch teamId {
        case 33, 40, 42, 47, 49, 50, 34, 48, 51, 66:
            return "GB1" // Premier League
        case 541, 529, 530:
            return "ES1" // La Liga
        case 157, 165, 168:
            return "L1"  // Bundesliga
        case 496, 505, 489, 492:
            return "IT1" // Serie A
        case 85, 91, 81:
            return "FR1" // Ligue 1
        default:
            return "GB1" // 기본값
        }
    }
    
    // MARK: - Convert to App Model
    func convertToTransfer(_ rumour: TransfermarktRumour, for teamId: Int) -> Transfer? {
        // 필수 필드 확인
        let playerName = rumour.playerName ?? rumour.player_name ?? "Unknown Player"
        let fromClub = rumour.fromClubName ?? rumour.from_club_name ?? "Unknown Club"
        let toClub = rumour.toClubName ?? rumour.to_club_name ?? "미정"
        
        let clubId = mapToTransfermarktClubId(teamId) ?? ""
        let isIncoming = rumour.toClubID == clubId
        
        // 날짜 파싱
        let date: Date
        if let dateString = rumour.date {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            date = dateFormatter.date(from: dateString) ?? Date()
        } else {
            date = Date()
        }
        
        // 이적료 포맷
        var transferFee = rumour.transferSum ?? rumour.transfer_sum ?? rumour.transfer_fee ?? "협상중"
        if let currency = rumour.transferCurrency {
            transferFee = "\(currency)\(transferFee)"
        }
        
        // 확률 정보
        let probability = rumour.rumourProbability
        
        return Transfer(
            playerName: playerName,
            fromClub: fromClub,
            toClub: toClub,
            transferFee: transferFee,
            date: date,
            type: isIncoming ? .incoming : .outgoing,
            isRumour: true,  // Transfermarkt는 모두 루머
            probability: probability != nil ? "\(probability!)%" : nil
        )
    }
}