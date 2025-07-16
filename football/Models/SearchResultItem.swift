import Foundation

// 검색 결과 항목을 나타내는 enum
enum SearchResultItem: Identifiable, Hashable {
    case team(TeamProfile)
    case league(LeagueDetails)
    case player(PlayerProfileData)
    case coach(CoachInfo)
    // case country(Country) // 필요 시 추가
    // case venue(VenueInfo) // 필요 시 추가

    var id: String {
        switch self {
        case .team(let teamProfile):
            return "team-\(teamProfile.team.id)"
        case .league(let leagueDetails):
            return "league-\(leagueDetails.league.id)"
        case .player(let playerProfileData):
            return "player-\(playerProfileData.player.id ?? 0)"
        case .coach(let coachInfo):
            return "coach-\(coachInfo.id)"
        }
    }

    // Hashable 준수
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    // Equatable 준수 (Hashable은 Equatable을 요구)
    static func == (lhs: SearchResultItem, rhs: SearchResultItem) -> Bool {
        lhs.id == rhs.id
    }

    // 표시될 이름
    var name: String {
        switch self {
        case .team(let teamProfile):
            return teamProfile.team.name
        case .league(let leagueDetails):
            return leagueDetails.league.name
        case .player(let playerProfileData):
            return playerProfileData.player.name ?? "Unknown Player"
        case .coach(let coachInfo):
            return coachInfo.name
        }
    }

    // 표시될 로고 URL (옵셔널)
    var logoURL: URL? {
        switch self {
        case .team(let teamProfile):
            return URL(string: teamProfile.team.logo)
        case .league(let leagueDetails):
            return URL(string: leagueDetails.league.logo)
        case .player(let playerProfileData):
            if let photo = playerProfileData.player.photo {
                return URL(string: photo)
            }
            return nil
        case .coach(let coachInfo):
            return URL(string: coachInfo.photo)
        }
    }

    // 항목 유형 (UI 구분에 사용)
    var type: String {
        switch self {
        case .team: return "팀"
        case .league: return "리그/컵"
        case .player: return "선수"
        case .coach: return "감독"
        }
    }

    // 상세 정보 (예: 리그의 국가, 선수의 현재 팀)
    var detail: String? {
        switch self {
        case .league(let leagueDetails):
            return leagueDetails.country?.name
        case .player(let playerProfileData):
            // 선수의 현재 팀 정보 표시 (첫 번째 통계 항목 기준)
            return playerProfileData.statistics?.first?.team?.name
        case .coach(let coachInfo):
            // 감독의 현재 팀 정보 표시
            return coachInfo.career?.first?.team.name
        default:
            return nil
        }
    }
}

// 검색 API 응답을 위한 통합 모델 (필요 시 사용)
struct FootballSearchResponse: Decodable {
    let teams: [TeamProfile]
    let leagues: [LeagueDetails]
    let players: [PlayerProfileData]
    let coaches: [CoachInfo]
}
