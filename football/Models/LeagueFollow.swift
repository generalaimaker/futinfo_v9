import Foundation

// 리그 팔로우 모델
struct LeagueFollow: Identifiable, Codable {
    let id: Int
    let name: String
    let logo: String
    let country: String?
    let isDefault: Bool // 기본 리그 여부
    
    var displayName: String {
        switch id {
        case 39: return "프리미어 리그"
        case 140: return "라리가"
        case 135: return "세리에 A"
        case 78: return "분데스리가"
        case 61: return "리그 1"
        case 2: return "챔피언스 리그"
        case 3: return "유로파 리그"
        case 4: return "컨퍼런스 리그"
        case 5: return "네이션스 리그"
        case 15: return "FIFA 클럽 월드컵"
        case 1: return "FIFA 월드컵"
        case 32: return "월드컵 예선 - 유럽"
        case 34: return "월드컵 예선 - 남미"
        case 29: return "월드컵 예선 - 아시아"
        case 253: return "MLS"
        case 292: return "K리그1"
        case 293: return "K리그2"
        case 848: return "아시안 챔피언스 리그"
        case 45: return "FA컵"
        case 143: return "코파 델 레이"
        case 137: return "코파 이탈리아"
        case 66: return "쿠프 드 프랑스"
        case 81: return "DFB 포칼"
        case 144: return "벨기에 프로 리그"
        case 88: return "에레디비시"
        case 94: return "프리메이라 리가"
        case 71: return "브라질 세리에 A"
        case 307: return "사우디 프로 리그"
        case 667: return "클럽 친선경기"
        default: return name
        }
    }
    
    // 기본 리그 목록 (최소화하여 Rate Limit 방지)
    static let defaultLeagues: [LeagueFollow] = [
        // 5대 리그만 기본으로 설정
        LeagueFollow(id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png", country: "England", isDefault: true),
        LeagueFollow(id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Spain", isDefault: true),
        LeagueFollow(id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png", country: "Italy", isDefault: true),
        LeagueFollow(id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png", country: "Germany", isDefault: true),
        LeagueFollow(id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png", country: "France", isDefault: true),
        
        // K리그 (한국 사용자를 위해)
        LeagueFollow(id: 292, name: "K League 1", logo: "https://media.api-sports.io/football/leagues/292.png", country: "South Korea", isDefault: true)
    ]
}

// 추가 가능한 리그 목록
struct AvailableLeague {
    let id: Int
    let name: String
    let displayName: String
    let logo: String
    let country: String?
    let category: LeagueCategory
}

enum LeagueCategory: String, CaseIterable {
    case europe = "유럽 리그"
    case uefa = "UEFA 대회"
    case worldCup = "월드컵"
    case asia = "아시아"
    case americas = "아메리카"
    case africa = "아프리카"
    case cup = "컵 대회"
    
    var order: Int {
        switch self {
        case .europe: return 0
        case .uefa: return 1
        case .worldCup: return 2
        case .asia: return 3
        case .americas: return 4
        case .africa: return 5
        case .cup: return 6
        }
    }
}

// 추가 가능한 전체 리그 목록
extension AvailableLeague {
    static let allLeagues: [AvailableLeague] = [
        // 친선경기
        AvailableLeague(id: 667, name: "Club Friendlies", displayName: "클럽 친선경기", logo: "https://media.api-sports.io/football/leagues/667.png", country: nil, category: .europe),
        
        // 유럽 리그
        AvailableLeague(id: 4, name: "Euro Championship", displayName: "유로 챔피언십", logo: "https://media.api-sports.io/football/leagues/4.png", country: nil, category: .europe),
        AvailableLeague(id: 88, name: "Eredivisie", displayName: "에레디비시", logo: "https://media.api-sports.io/football/leagues/88.png", country: "Netherlands", category: .europe),
        AvailableLeague(id: 94, name: "Primeira Liga", displayName: "프리메이라 리가", logo: "https://media.api-sports.io/football/leagues/94.png", country: "Portugal", category: .europe),
        AvailableLeague(id: 144, name: "Jupiler Pro League", displayName: "벨기에 프로 리그", logo: "https://media.api-sports.io/football/leagues/144.png", country: "Belgium", category: .europe),
        AvailableLeague(id: 179, name: "Premiership", displayName: "스코틀랜드 프리미어십", logo: "https://media.api-sports.io/football/leagues/179.png", country: "Scotland", category: .europe),
        AvailableLeague(id: 103, name: "Eliteserien", displayName: "노르웨이 엘리테세리엔", logo: "https://media.api-sports.io/football/leagues/103.png", country: "Norway", category: .europe),
        AvailableLeague(id: 113, name: "Allsvenskan", displayName: "스웨덴 알스벤스칸", logo: "https://media.api-sports.io/football/leagues/113.png", country: "Sweden", category: .europe),
        
        // UEFA 대회
        AvailableLeague(id: 5, name: "Nations League", displayName: "네이션스 리그", logo: "https://media.api-sports.io/football/leagues/5.png", country: nil, category: .uefa),
        
        // 월드컵
        AvailableLeague(id: 1, name: "World Cup", displayName: "FIFA 월드컵", logo: "https://media.api-sports.io/football/leagues/1.png", country: nil, category: .worldCup),
        
        // 아시아
        AvailableLeague(id: 293, name: "K League 2", displayName: "K리그2", logo: "https://media.api-sports.io/football/leagues/293.png", country: "South Korea", category: .asia),
        AvailableLeague(id: 848, name: "AFC Champions League", displayName: "아시안 챔피언스 리그", logo: "https://media.api-sports.io/football/leagues/848.png", country: nil, category: .asia),
        AvailableLeague(id: 98, name: "J1 League", displayName: "J1 리그", logo: "https://media.api-sports.io/football/leagues/98.png", country: "Japan", category: .asia),
        AvailableLeague(id: 169, name: "Super League", displayName: "중국 슈퍼리그", logo: "https://media.api-sports.io/football/leagues/169.png", country: "China", category: .asia),
        AvailableLeague(id: 307, name: "Pro League", displayName: "사우디 프로 리그", logo: "https://media.api-sports.io/football/leagues/307.png", country: "Saudi Arabia", category: .asia),
        AvailableLeague(id: 11, name: "Asian Cup", displayName: "아시안컵", logo: "https://media.api-sports.io/football/leagues/11.png", country: nil, category: .asia),
        AvailableLeague(id: 302, name: "FA Cup", displayName: "KFA FA컵", logo: "https://media.api-sports.io/football/leagues/302.png", country: "South Korea", category: .asia),
        
        // 아메리카
        AvailableLeague(id: 71, name: "Serie A", displayName: "브라질 세리에 A", logo: "https://media.api-sports.io/football/leagues/71.png", country: "Brazil", category: .americas),
        AvailableLeague(id: 253, name: "MLS", displayName: "메이저 리그 사커", logo: "https://media.api-sports.io/football/leagues/253.png", country: "USA", category: .americas),
        AvailableLeague(id: 128, name: "Liga Profesional", displayName: "아르헨티나 리가 프로페시오날", logo: "https://media.api-sports.io/football/leagues/128.png", country: "Argentina", category: .americas),
        AvailableLeague(id: 9, name: "Copa America", displayName: "코파 아메리카", logo: "https://media.api-sports.io/football/leagues/9.png", country: nil, category: .americas),
        AvailableLeague(id: 13, name: "Copa Libertadores", displayName: "코파 리베르타도레스", logo: "https://media.api-sports.io/football/leagues/13.png", country: nil, category: .americas),
        
        // 아프리카
        AvailableLeague(id: 12, name: "CAF Champions League", displayName: "CAF 챔피언스 리그", logo: "https://media.api-sports.io/football/leagues/12.png", country: nil, category: .africa),
        AvailableLeague(id: 6, name: "Africa Cup of Nations", displayName: "아프리카 네이션스컵", logo: "https://media.api-sports.io/football/leagues/6.png", country: nil, category: .africa),
        
        // 컵 대회 (5대 리그 컵 대회들은 기본으로 이미 추가되어 있음)
        AvailableLeague(id: 48, name: "League Cup", displayName: "EFL 컵", logo: "https://media.api-sports.io/football/leagues/48.png", country: "England", category: .cup),
        AvailableLeague(id: 556, name: "Super Cup", displayName: "UEFA 슈퍼컵", logo: "https://media.api-sports.io/football/leagues/556.png", country: nil, category: .cup),
        AvailableLeague(id: 528, name: "Community Shield", displayName: "커뮤니티 실드", logo: "https://media.api-sports.io/football/leagues/528.png", country: "England", category: .cup),
        AvailableLeague(id: 531, name: "Supercopa", displayName: "수페르코파", logo: "https://media.api-sports.io/football/leagues/531.png", country: "Spain", category: .cup),
        AvailableLeague(id: 547, name: "Super Cup", displayName: "슈퍼코파 이탈리아", logo: "https://media.api-sports.io/football/leagues/547.png", country: "Italy", category: .cup),
        AvailableLeague(id: 529, name: "Super Cup", displayName: "DFL 슈퍼컵", logo: "https://media.api-sports.io/football/leagues/529.png", country: "Germany", category: .cup),
        AvailableLeague(id: 526, name: "Trophee des Champions", displayName: "트로페 데 샹피온", logo: "https://media.api-sports.io/football/leagues/526.png", country: "France", category: .cup)
    ]
}