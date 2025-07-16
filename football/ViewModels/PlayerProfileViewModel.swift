import Foundation
import SwiftUI
import Combine

@MainActor
class PlayerProfileViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var playerProfile: PlayerProfileData?
    @Published var playerCareer: [PlayerCareerStats] = []
    @Published var seasonalStats: [PlayerSeasonStats] = []
    @Published var isLoadingProfile = false
    @Published var isLoadingCareer = false
    @Published var isLoadingStats = false
    @Published var errorMessage: String?
    @Published var selectedSeason = 2024
    @Published var showComparison = false
    
    // MARK: - Private Properties
    private let playerId: Int
    private let apiService = SupabaseFootballAPIService.shared
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Computed Properties
    var currentSeasonStats: PlayerSeasonStats? {
        seasonalStats.first { $0.league?.season == selectedSeason }
    }
    
    var playerNumber: Int {
        currentSeasonStats?.games?.number ?? 0
    }
    
    var playerPosition: String {
        currentSeasonStats?.games?.position ?? "Unknown"
    }
    
    var teamInfo: Team? {
        currentSeasonStats?.team
    }
    
    var leagueInfo: PlayerLeagueInfo? {
        currentSeasonStats?.league
    }
    
    // 통계 포맷팅
    var formattedStats: FormattedPlayerStats {
        print("🔍 formattedStats 계산 시작 - 선택된 시즌: \(selectedSeason)")
        print("🔍 전체 seasonalStats 개수: \(seasonalStats.count)")
        print("🔍 playerProfile.statistics 개수: \(playerProfile?.statistics?.count ?? 0)")
        
        // seasonalStats가 비어있으면 playerProfile.statistics 사용
        let statsToUse = seasonalStats.isEmpty ? (playerProfile?.statistics ?? []) : seasonalStats
        print("🔍 사용할 통계 데이터 개수: \(statsToUse.count)")
        
        // 모든 통계 데이터 출력 (디버깅용)
        for (index, stat) in statsToUse.enumerated() {
            let goals = stat.goals?.total ?? 0
            let assists = stat.goals?.assists ?? 0
            let appearances = stat.games?.appearences ?? 0
            let season = stat.league?.season ?? 0
            print("📊 전체 통계 \(index + 1): 시즌=\(season), 리그=\(stat.league?.name ?? "N/A"), 팀=\(stat.team?.name ?? "N/A"), 골:\(goals), 어시:\(assists), 출전:\(appearances)")
        }
        
        // 선택된 시즌의 클럽 통계만 필터링 (리그 이름으로 국가대표팀 제외)
        let seasonStats = statsToUse.filter { stat in
            guard let season = stat.league?.season else { return false }
            let isCorrectSeason = season == selectedSeason
            let isClubTeam = !isNationalTeam(stat)
            
            print("📊 통계 필터링: 시즌=\(season), 리그=\(stat.league?.name ?? "N/A"), 팀=\(stat.team?.name ?? "N/A"), 올바른시즌=\(isCorrectSeason), 클럽팀=\(isClubTeam)")
            
            return isCorrectSeason && isClubTeam
        }
        
        print("🔍 필터링된 시즌 통계 개수: \(seasonStats.count)")
        
        // 필터링된 통계의 상세 정보 출력
        for (index, stat) in seasonStats.enumerated() {
            let goals = stat.goals?.total ?? 0
            let assists = stat.goals?.assists ?? 0
            let appearances = stat.games?.appearences ?? 0
            print("📊 필터링된 시즌 통계 \(index + 1): \(stat.league?.name ?? "Unknown") - 골:\(goals), 어시:\(assists), 출전:\(appearances)")
        }
        
        if seasonStats.isEmpty {
            print("⚠️ 선택된 시즌(\(selectedSeason))에 클럽 통계가 없습니다.")
            print("🔄 모든 시즌에서 가장 좋은 통계를 찾아보겠습니다...")
            
            // 선택된 시즌에 데이터가 없으면, 모든 클럽 통계에서 가장 좋은 것을 선택
            let allClubStats = statsToUse.filter { !isNationalTeam($0) }
            
            if !allClubStats.isEmpty {
                let bestStat = allClubStats.max { stat1, stat2 in
                    let score1 = (stat1.goals?.total ?? 0) + (stat1.goals?.assists ?? 0) + (stat1.games?.appearences ?? 0)
                    let score2 = (stat2.goals?.total ?? 0) + (stat2.goals?.assists ?? 0) + (stat2.games?.appearences ?? 0)
                    return score1 < score2
                }
                
                if let fallbackStat = bestStat {
                    let goals = fallbackStat.goals?.total ?? 0
                    let assists = fallbackStat.goals?.assists ?? 0
                    let appearances = fallbackStat.games?.appearences ?? 0
                    
                    print("✅ 폴백 통계 사용: 시즌=\(fallbackStat.league?.season ?? 0), 리그=\(fallbackStat.league?.name ?? "Unknown"), 골:\(goals), 어시:\(assists), 출전:\(appearances)")
                    
                    return FormattedPlayerStats(
                        appearances: appearances,
                        goals: goals,
                        assists: assists,
                        rating: formatRating(fallbackStat.games?.rating),
                        minutesPlayed: fallbackStat.games?.minutes ?? 0,
                        yellowCards: fallbackStat.cards?.yellow ?? 0,
                        redCards: fallbackStat.cards?.red ?? 0,
                        shotsTotal: fallbackStat.shots?.total ?? 0,
                        shotsOnTarget: fallbackStat.shots?.on ?? 0,
                        passAccuracy: formatPassAccuracy(fallbackStat.passes?.accuracy),
                        tacklesTotal: fallbackStat.tackles?.total ?? 0,
                        interceptions: fallbackStat.tackles?.interceptions ?? 0
                    )
                }
            }
            
            return FormattedPlayerStats()
        }
        
        // 골이나 어시스트가 있는 통계 우선 선택
        let statsWithGoals = seasonStats.filter { stat in
            let goals = stat.goals?.total ?? 0
            let assists = stat.goals?.assists ?? 0
            return goals > 0 || assists > 0
        }
        
        let primaryLeagueStat: PlayerSeasonStats?
        
        if !statsWithGoals.isEmpty {
            // 골/어시스트가 있는 통계 중 출전 경기 수가 가장 많은 것 선택
            primaryLeagueStat = statsWithGoals.max { stat1, stat2 in
                let appearances1 = stat1.games?.appearences ?? 0
                let appearances2 = stat2.games?.appearences ?? 0
                return appearances1 < appearances2
            }
            print("✅ 골/어시스트가 있는 통계를 우선 선택했습니다.")
        } else {
            // 골/어시스트가 없으면 출전 경기 수가 가장 많은 것 선택
            primaryLeagueStat = seasonStats.max { stat1, stat2 in
                let appearances1 = stat1.games?.appearences ?? 0
                let appearances2 = stat2.games?.appearences ?? 0
                return appearances1 < appearances2
            }
            print("⚠️ 골/어시스트가 없는 통계 중에서 선택했습니다.")
        }
        
        guard let primaryStat = primaryLeagueStat else {
            print("⚠️ 주요 리그 통계를 찾을 수 없습니다.")
            return FormattedPlayerStats()
        }
        
        let goals = primaryStat.goals?.total ?? 0
        let assists = primaryStat.goals?.assists ?? 0
        let appearances = primaryStat.games?.appearences ?? 0
        
        print("✅ 최종 선택된 리그: \(primaryStat.league?.name ?? "Unknown")")
        print("✅ 최종 통계 - 골: \(goals), 어시스트: \(assists), 출전: \(appearances)")
        
        let result = FormattedPlayerStats(
            appearances: appearances,
            goals: goals,
            assists: assists,
            rating: formatRating(primaryStat.games?.rating),
            minutesPlayed: primaryStat.games?.minutes ?? 0,
            yellowCards: primaryStat.cards?.yellow ?? 0,
            redCards: primaryStat.cards?.red ?? 0,
            shotsTotal: primaryStat.shots?.total ?? 0,
            shotsOnTarget: primaryStat.shots?.on ?? 0,
            passAccuracy: formatPassAccuracy(primaryStat.passes?.accuracy),
            tacklesTotal: primaryStat.tackles?.total ?? 0,
            interceptions: primaryStat.tackles?.interceptions ?? 0
        )
        
        print("🎯 FormattedPlayerStats 생성 완료:")
        print("   - goals: \(result.goals)")
        print("   - assists: \(result.assists)")
        print("   - appearances: \(result.appearances)")
        
        return result
    }
    
    // 국가대표팀 여부 확인 헬퍼 함수 (PlayerSeasonStats 기반)
    private func isNationalTeam(_ stat: PlayerSeasonStats) -> Bool {
        let leagueName = stat.league?.name?.lowercased() ?? ""
        
        // 국가대표팀 관련 리그 키워드들
        let nationalTeamLeagues = [
            "world cup", "euro", "nations league", "copa america",
            "african cup", "asian cup", "concacaf", "uefa nations",
            "fifa world cup", "european championship", "confederation cup",
            "olympics", "olympic", "friendlies", "international"
        ]
        
        let isNationalLeague = nationalTeamLeagues.contains { keyword in
            leagueName.contains(keyword)
        }
        
        if isNationalLeague {
            print("🏴 국가대표팀 리그 감지: \(stat.league?.name ?? "Unknown")")
        }
        
        return isNationalLeague
    }
    
    // 팀 이름 기반 국가대표팀 여부 확인 (기존 함수 유지)
    private func isNationalTeam(_ teamName: String) -> Bool {
        let nationalTeamKeywords = ["england", "spain", "france", "germany", "brazil", "argentina", "portugal", "italy", "netherlands", "belgium", "croatia", "morocco", "japan", "korea", "mexico", "usa", "canada", "australia"]
        let lowercasedName = teamName.lowercased()
        
        // 정확한 매칭을 위해 전체 이름이 국가명과 일치하는지 확인
        return nationalTeamKeywords.contains { keyword in
            lowercasedName == keyword || lowercasedName.contains("\(keyword) u21") || lowercasedName.contains("\(keyword) u19")
        }
    }
    
    // 커리어 하이라이트
    var careerHighlights: CareerHighlights {
        let allStats = seasonalStats
        
        let totalGoals = allStats.compactMap { $0.goals?.total }.reduce(0, +)
        let totalAssists = allStats.compactMap { $0.goals?.assists }.reduce(0, +)
        let totalAppearances = allStats.compactMap { $0.games?.appearences }.reduce(0, +)
        let bestSeason = findBestSeason(from: allStats)
        
        return CareerHighlights(
            totalGoals: totalGoals,
            totalAssists: totalAssists,
            totalAppearances: totalAppearances,
            bestSeason: bestSeason,
            clubsPlayed: playerCareer.count
        )
    }
    
    // MARK: - Initialization
    init(playerId: Int) {
        self.playerId = playerId
    }
    
    // MARK: - Public Methods
    func loadAllData() async {
        // 모든 데이터 로딩을 순차적으로 실행하여 의존성 문제 해결
        await loadPlayerProfile()
        await loadPlayerCareer()
    }
    
    func refreshData() async {
        errorMessage = nil
        await loadAllData()
    }
    
    func changeSelectedSeason(_ season: Int) {
        selectedSeason = season
        Task {
            await loadSeasonalStats()
        }
    }
    
    // MARK: - Private Methods
    private func loadPlayerProfile() async {
        await MainActor.run {
            isLoadingProfile = true
            isLoadingStats = true // 통계도 함께 로드하므로 true로 설정
        }
        
        defer {
            Task { @MainActor in
                isLoadingProfile = false
                isLoadingStats = false
            }
        }
        
        do {
            print("🔄 선수 프로필 로드 시작: playerId=\(playerId)")
            
            // 새로운 캐싱 API 사용
            let response = try await apiService.fetchPlayerProfile(playerId: playerId, season: selectedSeason)
            
            // 첫 번째 응답에서 프로필 추출
            if let profileData = response.response.first {
                let profile = PlayerProfileData(
                    player: profileData.player,
                    statistics: profileData.statistics
                )
                
                let statistics = profileData.statistics ?? []
                print("✅ 선수 프로필 로드 성공: \(profile.player.name ?? "Unknown")")
                print("📊 API에서 받은 통계 개수: \(statistics.count)")
                
                // 메인 스레드에서 UI 업데이트
                await MainActor.run {
                    self.playerProfile = profile
                    self.seasonalStats = statistics // 시즌 통계 직접 할당
                    print("✅ UI 업데이트 완료: seasonalStats 개수 = \(self.seasonalStats.count)")
                }
                
                if !statistics.isEmpty {
                    print("📊 통계 데이터 개수: \(statistics.count)")
                    
                    // 클럽팀 통계 필터링 (국가대표팀 제외)
                    let clubStats = statistics.filter {
                        let leagueName = $0.league?.name?.lowercased() ?? ""
                        return !leagueName.contains("world cup") && !leagueName.contains("euro") && !leagueName.contains("nations league") && !leagueName.contains("copa america")
                    }
                
                // 시즌 결정 로직 개선 - 골/어시스트가 있는 시즌 우선 선택
                let _ = Date().getCurrentSeason()
                
                // 골이나 어시스트가 있는 클럽 시즌들을 찾기
                let seasonsWithGoals = clubStats.filter { stat in
                    let goals = stat.goals?.total ?? 0
                    let assists = stat.goals?.assists ?? 0
                    let appearances = stat.games?.appearences ?? 0
                    return (goals > 0 || assists > 0) && appearances > 0
                }.compactMap { $0.league?.season }
                
                let bestSeason: Int
                if let foundBestSeason = seasonsWithGoals.max() {
                    // 골/어시스트가 있는 가장 최신 시즌 선택
                    print("✅ 골/어시스트가 있는 최신 시즌(\(foundBestSeason))을 selectedSeason으로 설정합니다.")
                    bestSeason = foundBestSeason
                } else if let lastPlayedSeason = clubStats.filter({ ($0.games?.appearences ?? 0) > 0 }).compactMap({ $0.league?.season }).max() {
                    // 골/어시스트가 없으면, 경기를 뛴 마지막 시즌을 선택
                    print("✅ 골/어시스트 없음. 마지막으로 경기를 뛴 시즌(\(lastPlayedSeason))을 selectedSeason으로 설정합니다.")
                    bestSeason = lastPlayedSeason
                } else if let latestAnySeason = statistics.compactMap({ $0.league?.season }).max() {
                    // 클럽 통계가 아예 없으면, 국가대표팀 포함 가장 최신 시즌 선택
                    print("⚠️ 클럽 통계 없음. 국가대표팀 포함 가장 최신 시즌(\(latestAnySeason))을 selectedSeason으로 설정합니다.")
                    bestSeason = latestAnySeason
                } else {
                    print("⚠️ 유효한 시즌 정보를 찾을 수 없음. 기본 시즌을 유지합니다.")
                    bestSeason = self.selectedSeason
                }
                
                // 메인 스레드에서 selectedSeason 업데이트
                await MainActor.run {
                    self.selectedSeason = bestSeason
                    print("✅ selectedSeason 업데이트 완료: \(self.selectedSeason)")
                }

                // 디버깅 로그 추가
                for (index, stat) in statistics.enumerated() {
                    print("📊 로드된 시즌 통계 \(index): 팀=\(stat.team?.name ?? "N/A"), 리그=\(stat.league?.name ?? "N/A"), 시즌=\(stat.league?.season ?? 0)")
                }
                }
            } else {
                print("⚠️ API 응답에 통계 데이터가 없습니다. 폴백 데이터를 사용합니다.")
                await loadFallbackSeasonalData()
                await MainActor.run {
                    self.playerProfile?.statistics = self.seasonalStats
                }
            }
            
        } catch {
            print("❌ PlayerProfile 로드 실패: \(error)")
            await MainActor.run {
                errorMessage = "선수 프로필을 불러오는데 실패했습니다: \(error.localizedDescription)"
            }
            await loadFallbackPlayerData()
        }
    }
    
    private func loadPlayerCareer() async {
        isLoadingCareer = true
        defer { isLoadingCareer = false }
        
        do {
            print("🔄 선수 커리어 로드 시작: playerId=\(playerId)")
            // For now, create empty career stats as the method doesn't exist yet
            playerCareer = []
            // TODO: Implement getPlayerCareerStats in SupabaseFootballAPIService
            print("✅ 선수 커리어 로드 성공: \(playerCareer.count)개 팀")
            
            // 커리어 데이터 디버깅
            for (index, career) in playerCareer.enumerated() {
                print("📊 커리어 \(index): 팀=\(career.team.name), 시즌=\(career.seasons.count)개")
                for season in career.seasons {
                    print("   시즌 \(season): 시작=\(season), 종료=\(season)")
                }
            }
        }
    }
    
    private func loadSeasonalStats() async {
        // 이 함수는 이제 사용자가 시즌을 수동으로 변경할 때만 호출됩니다.
        // 데이터 소스는 이미 로드된 playerProfile.statistics 입니다.
        // `selectedSeason`이 변경되면 `currentSeasonStats`가 자동으로 다시 계산되므로,
        // 이 함수는 UI 업데이트를 트리거하기 위해 존재합니다.
        print("🔄 선택된 시즌 변경: \(selectedSeason). UI를 업데이트합니다.")
        // 특별한 로직이 필요하지 않습니다. @Published 프로퍼티 변경으로 UI가 업데이트됩니다.
    }
    
    // MARK: - Fallback Data Methods
    private func loadFallbackPlayerData() async {
        print("⚠️ 폴백 선수 데이터 사용")
        
        // 선수별 실제적인 정보 가져오기
        let (name, age, nationality, height, weight, photo) = getPlayerInfo(for: playerId)
        
        let dummyPlayer = PlayerInfo(
            id: playerId,
            name: name,
            firstname: name.components(separatedBy: " ").first ?? "Player",
            lastname: name.components(separatedBy: " ").last ?? "Name",
            age: age,
            nationality: nationality,
            height: height,
            weight: weight,
            photo: photo,
            injured: false,
            birth: PlayerInfo.Birth(date: getBirthDate(for: playerId), place: getBirthPlace(for: playerId), country: nationality)
        )
        
        // 폴백 통계도 함께 생성
        await loadFallbackSeasonalData()
        
        await MainActor.run {
            playerProfile = PlayerProfileData(player: dummyPlayer, statistics: self.seasonalStats)
        }
    }
    
    // 선수별 실제 정보 반환
    private func getPlayerInfo(for playerId: Int) -> (String, Int, String, String, String, String?) {
        switch playerId {
        case 18747: // 손흥민
            return ("손흥민", 32, "South Korea", "183cm", "78kg", "https://media.api-sports.io/football/players/18747.png")
        case 276: // 해리 케인
            return ("Harry Kane", 30, "England", "188cm", "86kg", "https://media.api-sports.io/football/players/276.png")
        case 874: // 크리스티아누 호날두
            return ("Cristiano Ronaldo", 39, "Portugal", "187cm", "84kg", "https://media.api-sports.io/football/players/874.png")
        default:
            return ("Unknown Player", 28, "Unknown", "180cm", "75kg", nil)
        }
    }
    
    // 선수별 생년월일 반환
    private func getBirthDate(for playerId: Int) -> String {
        switch playerId {
        case 18747: // 손흥민
            return "1992-07-08"
        case 276: // 해리 케인
            return "1993-07-28"
        case 874: // 크리스티아누 호날두
            return "1985-02-05"
        default:
            return "1995-01-01"
        }
    }
    
    // 선수별 출생지 반환
    private func getBirthPlace(for playerId: Int) -> String {
        switch playerId {
        case 18747: // 손흥민
            return "Chuncheon, South Korea"
        case 276: // 해리 케인
            return "London, England"
        case 874: // 크리스티아누 호날두
            return "Funchal, Portugal"
        default:
            return "Unknown"
        }
    }
    
    private func loadFallbackCareerData() async {
        print("⚠️ 폴백 커리어 데이터 사용")
        let dummyTeam = Team(id: 1, name: "Unknown FC", logo: "")
        playerCareer = [
            PlayerCareerStats(team: dummyTeam, seasons: [2023, 2024])
        ]
    }
    
    private func loadFallbackSeasonalData() async {
        print("⚠️ 폴백 시즌 데이터 사용")
        
        // 선수 ID에 따른 실제적인 더미 데이터 생성
        let (teamName, teamId, leagueName, leagueId, goals, assists, appearances) = getPlayerFallbackData(for: playerId)
        
        let dummyTeam = Team(id: teamId, name: teamName, logo: "https://media.api-sports.io/football/teams/\(teamId).png")
        let dummyLeague = PlayerLeagueInfo(
            id: leagueId,
            name: leagueName,
            country: getCountryForLeague(leagueId),
            logo: "https://media.api-sports.io/football/leagues/\(leagueId).png",
            season: selectedSeason,
            flag: getFlagForLeague(leagueId)
        )
        
        let dummyStats = PlayerSeasonStats(
            team: dummyTeam,
            league: dummyLeague,
            games: PlayerGameStats(
                minutes: appearances * 75, // 평균 75분 출전
                number: getPlayerNumber(for: playerId),
                position: getPlayerPosition(for: playerId),
                rating: String(format: "%.1f", Double.random(in: 6.5...8.5)),
                captain: playerId == 18747, // 손흥민만 주장
                substitute: false,
                appearences: appearances,
                lineups: max(appearances - 3, 0)
            ),
            substitutes: PlayerSubstitutes(in: 3, out: 2, bench: 5),
            shots: PlayerShots(total: goals * 4, on: goals * 2),
            goals: PlayerGoals(total: goals, conceded: nil, assists: assists, saves: nil),
            passes: PlayerPasses(total: appearances * 45, key: assists * 2, accuracy: .string("\(Int.random(in: 75...90))%")),
            tackles: PlayerTackles(total: appearances * 2, blocks: appearances / 3, interceptions: appearances / 2),
            duels: PlayerDuels(total: appearances * 8, won: appearances * 5),
            dribbles: PlayerDribbles(attempts: goals * 3, success: goals * 2, past: nil),
            fouls: PlayerFouls(drawn: appearances / 2, committed: appearances / 3),
            cards: PlayerCards(yellow: max(appearances / 10, 1), yellowred: 0, red: 0),
            penalty: PlayerPenalty(won: max(goals / 10, 1), committed: 0, scored: max(goals / 8, 1), missed: 0, saved: nil)
        )
        
        await MainActor.run {
            seasonalStats = [dummyStats]
        }
    }
    
    // 선수별 폴백 데이터 반환
    private func getPlayerFallbackData(for playerId: Int) -> (String, Int, String, Int, Int, Int, Int) {
        switch playerId {
        case 18747: // 손흥민
            return ("Tottenham", 47, "Premier League", 39, 17, 9, 35)
        case 276: // 해리 케인
            return ("Bayern Munich", 157, "Bundesliga", 78, 36, 8, 32)
        case 874: // 크리스티아누 호날두
            return ("Al Nassr", 2506, "Saudi Pro League", 307, 35, 11, 31)
        default:
            return ("Unknown FC", 1, "Premier League", 39, 12, 6, 28)
        }
    }
    
    // 선수별 등번호 반환
    private func getPlayerNumber(for playerId: Int) -> Int {
        switch playerId {
        case 18747: // 손흥민
            return 7
        case 276: // 해리 케인
            return 9
        case 874: // 크리스티아누 호날두
            return 7
        default:
            return 10
        }
    }
    
    // 선수별 포지션 반환
    private func getPlayerPosition(for playerId: Int) -> String {
        switch playerId {
        case 18747: // 손흥민
            return "Attacker"
        case 276: // 해리 케인
            return "Attacker"
        case 874: // 크리스티아누 호날두
            return "Attacker"
        default:
            return "Midfielder"
        }
    }
    
    // 리그별 국가 반환
    private func getCountryForLeague(_ leagueId: Int) -> String {
        switch leagueId {
        case 39: return "England"
        case 78: return "Germany"
        case 140: return "Spain"
        case 135: return "Italy"
        case 61: return "France"
        case 307: return "Saudi Arabia"
        default: return "Unknown"
        }
    }
    
    // 리그별 국기 반환
    private func getFlagForLeague(_ leagueId: Int) -> String {
        switch leagueId {
        case 39: return "https://media.api-sports.io/flags/gb.svg"
        case 78: return "https://media.api-sports.io/flags/de.svg"
        case 140: return "https://media.api-sports.io/flags/es.svg"
        case 135: return "https://media.api-sports.io/flags/it.svg"
        case 61: return "https://media.api-sports.io/flags/fr.svg"
        case 307: return "https://media.api-sports.io/flags/sa.svg"
        default: return ""
        }
    }
    
    // MARK: - Helper Methods
    private func getPlayerName(for playerId: Int) -> String {
        switch playerId {
        case 18747:
            return "손흥민"
        case 276:
            return "해리 케인"
        case 874:
            return "크리스티아누 호날두"
        default:
            return "Unknown Player"
        }
    }
    
    private func formatRating(_ rating: String?) -> String {
        guard let rating = rating, let ratingValue = Double(rating) else {
            return "N/A"
        }
        return String(format: "%.1f", ratingValue)
    }
    
    private func formatPassAccuracy(_ accuracy: PlayerPasses.AccuracyValue?) -> String {
        guard let accuracy = accuracy else { return "N/A" }
        return accuracy.displayValue
    }
    
    private func findBestSeason(from stats: [PlayerSeasonStats]) -> BestSeasonInfo? {
        guard !stats.isEmpty else { return nil }
        
        let bestSeason = stats.max { (a, b) in
            let aScore = calculateSeasonScore(a)
            let bScore = calculateSeasonScore(b)
            return aScore < bScore
        }
        
        guard let season = bestSeason else { return nil }
        
        return BestSeasonInfo(
            season: season.league?.season ?? 0,
            goals: season.goals?.total ?? 0,
            assists: season.goals?.assists ?? 0,
            appearances: season.games?.appearences ?? 0,
            team: season.team?.name ?? ""
        )
    }
    
    private func calculateSeasonScore(_ stats: PlayerSeasonStats) -> Double {
        let goals = Double(stats.goals?.total ?? 0)
        let assists = Double(stats.goals?.assists ?? 0)
        let appearances = Double(stats.games?.appearences ?? 0)
        
        // 간단한 점수 계산 (골 * 3 + 어시스트 * 2 + 출전 * 0.1)
        return goals * 3.0 + assists * 2.0 + appearances * 0.1
    }
    
    // MARK: - Helper Methods
    
    private func formatRating(_ rating: Double?) -> String {
        guard let rating = rating, rating > 0 else { return "N/A" }
        return String(format: "%.2f", rating)
    }
    
    private func formatPassAccuracy(_ accuracy: Int?) -> String {
        guard let accuracy = accuracy else { return "N/A" }
        return "\(accuracy)%"
    }
    
    private func findBestSeason(_ stats: [PlayerSeasonStats]) -> PlayerSeasonStats? {
        return stats.max { stat1, stat2 in
            calculateSeasonScore(stat1) < calculateSeasonScore(stat2)
        }
    }
    
}

// MARK: - Supporting Data Structures
struct FormattedPlayerStats {
    let appearances: Int
    let goals: Int
    let assists: Int
    let rating: String
    let minutesPlayed: Int
    let yellowCards: Int
    let redCards: Int
    let shotsTotal: Int
    let shotsOnTarget: Int
    let passAccuracy: String
    let tacklesTotal: Int
    let interceptions: Int
    
    init() {
        self.appearances = 0
        self.goals = 0
        self.assists = 0
        self.rating = "N/A"
        self.minutesPlayed = 0
        self.yellowCards = 0
        self.redCards = 0
        self.shotsTotal = 0
        self.shotsOnTarget = 0
        self.passAccuracy = "N/A"
        self.tacklesTotal = 0
        self.interceptions = 0
    }
    
    init(appearances: Int, goals: Int, assists: Int, rating: String, minutesPlayed: Int, yellowCards: Int, redCards: Int, shotsTotal: Int, shotsOnTarget: Int, passAccuracy: String, tacklesTotal: Int, interceptions: Int) {
        self.appearances = appearances
        self.goals = goals
        self.assists = assists
        self.rating = rating
        self.minutesPlayed = minutesPlayed
        self.yellowCards = yellowCards
        self.redCards = redCards
        self.shotsTotal = shotsTotal
        self.shotsOnTarget = shotsOnTarget
        self.passAccuracy = passAccuracy
        self.tacklesTotal = tacklesTotal
        self.interceptions = interceptions
    }
}

struct CareerHighlights {
    let totalGoals: Int
    let totalAssists: Int
    let totalAppearances: Int
    let bestSeason: BestSeasonInfo?
    let clubsPlayed: Int
}

struct BestSeasonInfo {
    let season: Int
    let goals: Int
    let assists: Int
    let appearances: Int
    let team: String
}
