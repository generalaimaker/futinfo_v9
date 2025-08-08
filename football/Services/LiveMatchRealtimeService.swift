import Foundation
import Combine
import Supabase

/// Supabase Realtime을 통한 라이브 경기 서비스
@MainActor
class LiveMatchRealtimeService: ObservableObject {
    static let shared = LiveMatchRealtimeService()
    private let supabase = SupabaseService.shared.client
    
    // 실시간 라이브 경기 데이터
    @Published var liveMatches: [LiveMatch] = []
    @Published var matchEvents: [Int: [LiveMatchEvent]] = [:] // fixtureId: events
    @Published var matchStatistics: [Int: [LiveMatchStatistics]] = [:] // fixtureId: stats
    
    // 연결 상태
    @Published var isConnected = false
    @Published var lastUpdateTime: Date?
    
    // RealtimeV2 채널
    private var channel: RealtimeChannelV2?
    
    private init() {
        // 앱 시작 시 자동으로 구독 시작
        Task {
            await startRealtimeSubscription()
        }
    }
    
    /// Realtime 구독 시작
    func startRealtimeSubscription() async {
        print("🔴 라이브 경기 Realtime 구독 시작")
        
        // 채널 생성
        channel = supabase.realtimeV2.channel("live_matches_channel")
        
        // PostgreSQL 변경 이벤트 구독
        Task {
            // INSERT 이벤트
            for await insertion in channel!.postgresChange(InsertAction.self, table: "live_matches") {
                do {
                    let match = try insertion.decodeRecord(as: LiveMatch.self, decoder: JSONDecoder())
                    handleMatchInsert(match)
                } catch {
                    print("❌ INSERT 디코딩 실패: \(error)")
                }
            }
        }
        
        Task {
            // UPDATE 이벤트
            for await update in channel!.postgresChange(UpdateAction.self, table: "live_matches") {
                do {
                    let match = try update.decodeRecord(as: LiveMatch.self, decoder: JSONDecoder())
                    handleMatchUpdate(match)
                } catch {
                    print("❌ UPDATE 디코딩 실패: \(error)")
                }
            }
        }
        
        Task {
            // DELETE 이벤트
            for await deletion in channel!.postgresChange(DeleteAction.self, table: "live_matches") {
                do {
                    struct Payload: Decodable {
                        let fixture_id: Int
                    }
                    let payload = try deletion.decodeOldRecord(as: Payload.self, decoder: JSONDecoder())
                    handleMatchDelete(payload.fixture_id)
                } catch {
                    print("❌ DELETE 디코딩 실패: \(error)")
                }
            }
        }
        
        // 채널 구독
        await channel!.subscribe()
        
        // 초기 데이터 로드
        await loadInitialLiveMatches()
        
        isConnected = true
        print("✅ 라이브 경기 Realtime 구독 성공")
    }
    
    /// Realtime 구독 중지
    func stopRealtimeSubscription() async {
        print("🔴 라이브 경기 Realtime 구독 중지")
        
        if let channel = channel {
            await channel.unsubscribe()
            await supabase.realtimeV2.removeChannel(channel)
        }
        
        channel = nil
        isConnected = false
    }
    
    /// 초기 라이브 경기 데이터 로드
    private func loadInitialLiveMatches() async {
        do {
            let matches: [LiveMatch] = try await supabase
                .from("live_matches")
                .select()
                .order("match_date", ascending: true)
                .execute()
                .value
            
            self.liveMatches = matches
            self.lastUpdateTime = Date()
            
            print("✅ 라이브 경기 로드: \(matches.count)개")
            
            // 각 경기의 이벤트와 통계도 로드
            for match in matches {
                await loadMatchEvents(fixtureId: match.fixtureId)
                await loadMatchStatistics(fixtureId: match.fixtureId)
            }
            
        } catch {
            print("❌ 라이브 경기 로드 실패: \(error)")
        }
    }
    
    // MARK: - 이벤트 핸들러
    
    private func handleMatchInsert(_ match: LiveMatch) {
        print("⚡ 새 라이브 경기: \(match.homeTeamName) vs \(match.awayTeamName)")
        
        liveMatches.append(match)
        liveMatches.sort { $0.matchDate < $1.matchDate }
        lastUpdateTime = Date()
        
        // 알림 발송
        NotificationCenter.default.post(
            name: Notification.Name("LiveMatchStarted"),
            object: nil,
            userInfo: ["match": match]
        )
    }
    
    private func handleMatchUpdate(_ match: LiveMatch) {
        print("🔄 라이브 경기 업데이트: \(match.homeTeamName) \(match.homeScore)-\(match.awayScore) \(match.awayTeamName) (\(match.statusShort))")
        
        if let index = liveMatches.firstIndex(where: { $0.fixtureId == match.fixtureId }) {
            let oldMatch = liveMatches[index]
            liveMatches[index] = match
            lastUpdateTime = Date()
            
            // 골 알림
            if match.homeScore != oldMatch.homeScore || match.awayScore != oldMatch.awayScore {
                NotificationCenter.default.post(
                    name: Notification.Name("LiveMatchGoal"),
                    object: nil,
                    userInfo: ["match": match, "oldMatch": oldMatch]
                )
            }
            
            // 상태 변경 알림
            if match.statusShort != oldMatch.statusShort {
                NotificationCenter.default.post(
                    name: Notification.Name("LiveMatchStatusChanged"),
                    object: nil,
                    userInfo: ["match": match, "oldStatus": oldMatch.statusShort]
                )
            }
        }
    }
    
    private func handleMatchDelete(_ fixtureId: Int) {
        print("🏁 라이브 경기 종료: ID \(fixtureId)")
        
        if let index = liveMatches.firstIndex(where: { $0.fixtureId == fixtureId }) {
            let match = liveMatches[index]
            liveMatches.remove(at: index)
            
            // 관련 이벤트와 통계 제거
            matchEvents.removeValue(forKey: fixtureId)
            matchStatistics.removeValue(forKey: fixtureId)
            
            // 종료 알림
            NotificationCenter.default.post(
                name: Notification.Name("LiveMatchEnded"),
                object: nil,
                userInfo: ["match": match]
            )
        }
    }
    
    private func handleEventInsert(_ event: LiveMatchEvent) {
        print("⚽ 새 이벤트: \(event.type) - \(event.playerName ?? "Unknown") (\(event.timeElapsed)')")
        
        if matchEvents[event.fixtureId] == nil {
            matchEvents[event.fixtureId] = []
        }
        matchEvents[event.fixtureId]?.append(event)
        matchEvents[event.fixtureId]?.sort { $0.timeElapsed < $1.timeElapsed }
        
        // 이벤트 알림
        NotificationCenter.default.post(
            name: Notification.Name("LiveMatchEvent"),
            object: nil,
            userInfo: ["event": event]
        )
    }
    
    private func handleStatisticsUpdate(_ stats: LiveMatchStatistics) {
        if matchStatistics[stats.fixtureId] == nil {
            matchStatistics[stats.fixtureId] = []
        }
        
        // 팀별로 업데이트
        if let index = matchStatistics[stats.fixtureId]?.firstIndex(where: { $0.teamId == stats.teamId }) {
            matchStatistics[stats.fixtureId]?[index] = stats
        } else {
            matchStatistics[stats.fixtureId]?.append(stats)
        }
    }
    
    // MARK: - 데이터 로드 메서드
    
    private func loadMatchEvents(fixtureId: Int) async {
        do {
            let events: [LiveMatchEvent] = try await supabase
                .from("live_match_events")
                .select()
                .eq("fixture_id", value: fixtureId)
                .order("time_elapsed", ascending: true)
                .execute()
                .value
            
            matchEvents[fixtureId] = events
            
        } catch {
            print("❌ 이벤트 로드 실패: \(error)")
        }
    }
    
    private func loadMatchStatistics(fixtureId: Int) async {
        do {
            let stats: [LiveMatchStatistics] = try await supabase
                .from("live_match_statistics")
                .select()
                .eq("fixture_id", value: fixtureId)
                .execute()
                .value
            
            matchStatistics[fixtureId] = stats
            
        } catch {
            print("❌ 통계 로드 실패: \(error)")
        }
    }
}

// MARK: - 데이터 모델

struct LiveMatch: Identifiable, Codable {
    let fixtureId: Int
    let leagueId: Int
    let leagueName: String
    let homeTeamId: Int
    let homeTeamName: String
    let homeTeamLogo: String?
    let awayTeamId: Int
    let awayTeamName: String
    let awayTeamLogo: String?
    let status: String
    let statusShort: String
    let elapsed: Int?
    let homeScore: Int
    let awayScore: Int
    let matchDate: Date
    let venueName: String?
    let venueCity: String?
    let referee: String?
    let round: String
    
    var id: Int { fixtureId }
    
    enum CodingKeys: String, CodingKey {
        case fixtureId = "fixture_id"
        case leagueId = "league_id"
        case leagueName = "league_name"
        case homeTeamId = "home_team_id"
        case homeTeamName = "home_team_name"
        case homeTeamLogo = "home_team_logo"
        case awayTeamId = "away_team_id"
        case awayTeamName = "away_team_name"
        case awayTeamLogo = "away_team_logo"
        case status
        case statusShort = "status_short"
        case elapsed
        case homeScore = "home_score"
        case awayScore = "away_score"
        case matchDate = "match_date"
        case venueName = "venue_name"
        case venueCity = "venue_city"
        case referee
        case round
    }
}

struct LiveMatchEvent: Identifiable, Codable {
    let fixtureId: Int
    let timeElapsed: Int
    let timeExtra: Int?
    let teamId: Int
    let teamName: String
    let playerId: Int?
    let playerName: String?
    let assistId: Int?
    let assistName: String?
    let type: String
    let detail: String?
    let comments: String?
    
    var id: String { "\(fixtureId)_\(timeElapsed)_\(type)_\(playerId ?? 0)" }
    
    enum CodingKeys: String, CodingKey {
        case fixtureId = "fixture_id"
        case timeElapsed = "time_elapsed"
        case timeExtra = "time_extra"
        case teamId = "team_id"
        case teamName = "team_name"
        case playerId = "player_id"
        case playerName = "player_name"
        case assistId = "assist_id"
        case assistName = "assist_name"
        case type
        case detail
        case comments
    }
}

struct LiveMatchStatistics: Identifiable, Codable {
    let fixtureId: Int
    let teamId: Int
    let teamName: String
    let statistics: [String: Any]
    
    var id: String { "\(fixtureId)_\(teamId)" }
    
    enum CodingKeys: String, CodingKey {
        case fixtureId = "fixture_id"
        case teamId = "team_id"
        case teamName = "team_name"
        case statistics
    }
    
    init(fixtureId: Int, teamId: Int, teamName: String, statistics: [String: Any]) {
        self.fixtureId = fixtureId
        self.teamId = teamId
        self.teamName = teamName
        self.statistics = statistics
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        fixtureId = try container.decode(Int.self, forKey: .fixtureId)
        teamId = try container.decode(Int.self, forKey: .teamId)
        teamName = try container.decode(String.self, forKey: .teamName)
        
        // JSON 디코딩
        if let data = try? container.decode(Data.self, forKey: .statistics),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            statistics = json
        } else {
            statistics = [:]
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(fixtureId, forKey: .fixtureId)
        try container.encode(teamId, forKey: .teamId)
        try container.encode(teamName, forKey: .teamName)
        
        // JSON 인코딩
        if let data = try? JSONSerialization.data(withJSONObject: statistics) {
            try container.encode(data, forKey: .statistics)
        }
    }
}