import SwiftUI
import Combine
import Foundation

// 팀 이름을 3자 약어로 변환하는 함수
private func getTeamAbbreviation(for teamName: String) -> String {
    // 특수 케이스 처리
    let specialCases: [String: String] = [
        "Manchester United": "MUN",
        "Manchester City": "MCI",
        "Liverpool": "LIV",
        "Chelsea": "CHE",
        "Arsenal": "ARS",
        "Tottenham Hotspur": "TOT",
        "Leicester City": "LEI",
        "West Ham United": "WHU",
        "Everton": "EVE",
        "Newcastle United": "NEW",
        "Aston Villa": "AVL",
        "Southampton": "SOU",
        "Crystal Palace": "CRY",
        "Brighton & Hove Albion": "BHA",
        "Wolverhampton Wanderers": "WOL",
        "Burnley": "BUR",
        "Leeds United": "LEE",
        "Watford": "WAT",
        "Norwich City": "NOR",
        "Brentford": "BRE",
        "Real Madrid": "RMA",
        "Barcelona": "BAR",
        "Atletico Madrid": "ATM",
        "Sevilla": "SEV",
        "Valencia": "VAL",
        "Villarreal": "VIL",
        "Athletic Club": "ATH",
        "Real Sociedad": "RSO",
        "Real Betis": "BET",
        "Juventus": "JUV",
        "Inter Milan": "INT",
        "AC Milan": "MIL",
        "Napoli": "NAP",
        "Roma": "ROM",
        "Lazio": "LAZ",
        "Atalanta": "ATA",
        "Bayern Munich": "BAY",
        "Borussia Dortmund": "DOR",
        "RB Leipzig": "RBL",
        "Bayer Leverkusen": "LEV",
        "Borussia Monchengladbach": "BMG",
        "Paris Saint-Germain": "PSG",
        "Olympique Lyonnais": "LYO",
        "Olympique Marseille": "MAR",
        "AS Monaco": "MON",
        "Ajax": "AJX",
        "PSV Eindhoven": "PSV",
        "Feyenoord": "FEY",
        "FC Porto": "POR",
        "Benfica": "BEN",
        "Sporting CP": "SCP"
    ]
    
    // 특수 케이스에 있으면 해당 약어 반환
    if let abbreviation = specialCases[teamName] {
        return abbreviation
    }
    
    // 특수 케이스에 없으면 첫 3글자 반환 (공백 제거)
    let words = teamName.components(separatedBy: " ")
    if words.count > 1 {
        // 여러 단어인 경우 각 단어의 첫 글자 조합
        let abbreviation = words.prefix(3).compactMap { $0.first }.map { String($0) }.joined()
        return abbreviation.uppercased()
    } else {
        // 한 단어인 경우 첫 3글자
        let index = teamName.index(teamName.startIndex, offsetBy: min(3, teamName.count))
        return teamName[..<index].uppercased()
    }
}

struct StandingsDetailView: View {
    let fixture: Fixture
    @ObservedObject var viewModel: FixtureDetailViewModel
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 24) {
            // 전체 뷰를 중앙 정렬하고 너비 제한
            if isLoading {
                ProgressView()
                    .padding()
            } else if viewModel.standings.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "list.number")
                        .font(.system(size: 48))
                        .foregroundColor(.gray.opacity(0.5))
                    
                    Text("순위 정보가 없습니다")
                        .font(.headline)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity)
                .padding(32)
            } else {
                VStack(spacing: 16) {
                    // 리그 정보 (좌측 정렬)
                    HStack(alignment: .center) {
                        LeagueLogoView(logoUrl: fixture.league.logo, size: 30)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(fixture.league.name)
                                .font(.headline)
                            
                            Text("\(fixture.league.season) 시즌")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        
                    }
                    .padding(.horizontal, 0) // 좌우 패딩 제거
                    
                    // 순위표 (너비 제한 추가)
                    VStack(spacing: 0) {
                        // 스크롤 제거하고 화면 너비에 맞게 조정
                        // 헤더
                        HStack {
                            Text("#")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("팀")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 120, alignment: .leading)
                            
                            Text("경기")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 25, alignment: .center)
                            
                            Text("승")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 25, alignment: .center)
                            
                            Text("무")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 25, alignment: .center)
                            
                            Text("패")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 25, alignment: .center)
                            
                            Text("승점")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 25, alignment: .center)
                            
                            Text("득실")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 25, alignment: .center)
                        }
                        .padding(.horizontal, 0) // 좌우 패딩 제거
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        
                        // 팀 순위
                        ForEach(viewModel.standings) { standing in
                            let qualificationInfo = getQualificationInfo(for: standing.rank)
                            let qualificationColor = getQualificationColor(for: qualificationInfo)
                            
                            NavigationLink(destination: TeamProfileView(teamId: standing.team.id, leagueId: fixture.league.id)) {
                                HStack {
                                    // 순위 및 진출권 표시
                                    HStack(spacing: 0) {
                                        // 진출권 색상 띠
                                        Rectangle()
                                            .fill(qualificationColor)
                                            .frame(width: 3)
                                        
                                        Text("\(standing.rank)")
                                            .font(.system(.body, design: .rounded))
                                            .fontWeight(.bold)
                                            .foregroundColor(qualificationInfo != .none ? qualificationColor : .primary)
                                            .frame(width: 27, alignment: .center)
                                    }
                                    .frame(width: 30)
                                    
                                    HStack(spacing: 8) {
                                        HStack(spacing: 8) {
                                            TeamLogoView(logoUrl: standing.team.logo, size: 20)
                                            
                                            Text(getTeamAbbreviation(for: standing.team.name))
                                                .font(.system(.body, design: .rounded))
                                                .fontWeight(.medium)
                                                .lineLimit(1)
                                                .foregroundColor(.primary)
                                        }
                                    }
                                    .frame(width: 120, alignment: .leading)
                                    
                                    Text("\(standing.all.played)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 25, alignment: .center)
                                    
                                    Text("\(standing.all.win)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 25, alignment: .center)
                                    
                                    Text("\(standing.all.draw)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 25, alignment: .center)
                                    
                                    Text("\(standing.all.lose)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 25, alignment: .center)
                                    
                                    Text("\(standing.points)")
                                        .font(.system(.body, design: .rounded))
                                        .fontWeight(.bold)
                                        .frame(width: 25, alignment: .center)
                                    
                                    Text("\(standing.goalsDiff)")
                                        .font(.system(.body, design: .rounded))
                                        .foregroundColor(standing.goalsDiff >= 0 ? .blue : .red)
                                        .frame(width: 25, alignment: .center)
                                }
                                .padding(.horizontal, 0) // 좌우 패딩 제거
                                .padding(.vertical, 12)
                                .background(
                                    standing.team.id == fixture.teams.home.id ? Color.blue.opacity(0.1) :
                                    standing.team.id == fixture.teams.away.id ? Color.red.opacity(0.1) :
                                    Color.clear
                                )
                            }
                            .buttonStyle(PlainButtonStyle()) // 기본 버튼 스타일 제거
                        }
                        }
                    // 스크롤 뷰의 닫는 괄호 제거
                    .cornerRadius(8)
                    .frame(maxWidth: .infinity) // 화면 너비에 맞게 조정
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(.systemGray5), lineWidth: 1)
                    )
                    
                    // 범례
                    VStack(spacing: 8) {
                        HStack(spacing: 16) {
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(Color.blue.opacity(0.1))
                                    .frame(width: 12, height: 12)
                                
                                Text(fixture.teams.home.name)
                                    .font(.caption)
                            }
                            
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(Color.red.opacity(0.1))
                                    .frame(width: 12, height: 12)
                                
                                Text(fixture.teams.away.name)
                                    .font(.caption)
                            }
                        }
                        
                        // 진출권 범례 표시
                        VStack(alignment: .leading, spacing: 8) {
                            Text("진출권 정보")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.bottom, 4)
                            
                            // 챔피언스리그와 유로파리그는 다른 범례 표시
                            if fixture.league.id == 2 || fixture.league.id == 3 {
                                // 유럽 대항전 범례
                                ForEach([QualificationInfo.knockout16Direct, .knockout16Playoff], id: \.self) { info in
                                    if getQualificationDescription(for: info) != "" && isQualificationRelevant(for: info) {
                                        HStack(spacing: 8) {
                                            Rectangle()
                                                .fill(getQualificationColor(for: info))
                                                .frame(width: 12, height: 12)
                                            
                                            Text(getQualificationDescription(for: info))
                                                .font(.caption)
                                        }
                                    }
                                }
                            } else {
                                // 일반 리그 범례
                                ForEach([QualificationInfo.championsLeague, .championsLeagueQualification, .europaLeague, .conferenceLeague, .relegation], id: \.self) { info in
                                    if getQualificationDescription(for: info) != "" && isQualificationRelevant(for: info) {
                                        HStack(spacing: 8) {
                                            Rectangle()
                                                .fill(getQualificationColor(for: info))
                                                .frame(width: 12, height: 12)
                                            
                                            Text(getQualificationDescription(for: info))
                                                .font(.caption)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.top, 8)
                }
                .frame(maxWidth: .infinity, alignment: .leading) // 좌측 정렬로 변경
                .padding(.vertical, 16) // 좌우 패딩 제거, 상하 패딩만 유지
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading) // 화면 너비에 맞게 조정하고 좌측 정렬
        // .padding(.horizontal) 제거 - 화면 이동 문제 해결
        .onAppear {
            loadStandings()
        }
    }
    
    private func loadStandings() {
        isLoading = true
        Task {
            await viewModel.loadStandings()
            await MainActor.run {
                isLoading = false
            }
        }
    }
    
    // 진출권 정보 열거형
    enum QualificationInfo: Int, CaseIterable {
        case championsLeague
        case championsLeagueQualification
        case europaLeague
        case conferenceLeague
        case relegation
        case none
        case knockout16Direct      // 16강 직행 (챔피언스리그, 유로파리그)
        case knockout16Playoff     // 16강 플레이오프 (챔피언스리그, 유로파리그)
    }
    
    // 리그별 진출권 정보
    private func getQualificationInfo(for rank: Int) -> QualificationInfo {
        let leagueId = fixture.league.id
        let totalTeams = viewModel.standings.count
        
        switch leagueId {
        case 2: // 챔피언스리그
            if rank <= 8 {
                return .knockout16Direct // 1위~8위: 16강 직행
            } else if rank <= 24 {
                return .knockout16Playoff // 9위~24위: 16강 플레이오프
            }
            
        case 3: // 유로파리그
            if rank <= 8 {
                return .knockout16Direct // 1위~8위: 16강 직행
            } else if rank <= 24 {
                return .knockout16Playoff // 9위~24위: 16강 플레이오프
            }
            
        case 39: // 프리미어 리그
            if rank <= 5 {
                return .championsLeague
            } else if rank == 6 {
                return .europaLeague
            } else if rank == 7 {
                return .conferenceLeague
            } else if rank >= totalTeams - 2 {
                return .relegation
            }
            
        case 140: // 라리가
            if rank <= 5 {
                return .championsLeague
            } else if rank == 6 || rank == 7 {
                return .europaLeague
            } else if rank == 8 {
                return .conferenceLeague
            } else if rank >= totalTeams - 2 {
                return .relegation
            }
            
        case 78, 135: // 분데스리가, 세리에 A
            if rank <= 4 {
                return .championsLeague
            } else if rank == 5 {
                return .europaLeague
            } else if rank == 6 {
                return .conferenceLeague
            } else if rank >= totalTeams - 2 {
                return .relegation
            }
            
        case 61: // 리그앙
            if rank <= 3 {
                return .championsLeague
            } else if rank == 4 {
                return .championsLeagueQualification
            } else if rank == 5 {
                return .europaLeague
            } else if rank == 6 {
                return .conferenceLeague
            } else if rank >= totalTeams - 2 {
                return .relegation
            }
            
        default:
            if rank <= 4 {
                return .championsLeague
            } else if rank == 5 || rank == 6 {
                return .europaLeague
            } else if rank >= totalTeams - 2 {
                return .relegation
            }
        }
        return .none
    }
    
    // 진출권 정보에 따른 색상
    private func getQualificationColor(for info: QualificationInfo) -> Color {
        switch info {
        case .championsLeague:
            // 챔피언스리그 진출 - 더 진한 네이비 블루
            return Color(red: 0/255, green: 32/255, blue: 96/255) // 더 진한 네이비 블루
        case .championsLeagueQualification:
            // 챔피언스리그 예선 - 옅은 하늘색
            return Color(red: 66/255, green: 165/255, blue: 245/255) // 밝은 하늘색
        case .europaLeague:
            return Color.orange
        case .conferenceLeague:
            return Color.green
        case .relegation:
            return Color.red
        case .knockout16Direct:
            // 리그 ID에 따라 다른 색상 적용
            if fixture.league.id == 2 { // 챔피언스리그
                return Color(red: 19/255, green: 34/255, blue: 87/255) // 네이비색 #132257
            } else if fixture.league.id == 3 { // 유로파리그
                return Color(red: 255/255, green: 165/255, blue: 0/255) // 오렌지색 #FFA500
            }
            return Color(red: 255/255, green: 165/255, blue: 0/255) // 기본값: 오렌지색
            
        case .knockout16Playoff:
            // 리그 ID에 따라 다른 색상 적용
            if fixture.league.id == 2 { // 챔피언스리그
                return Color(red: 255/255, green: 165/255, blue: 0/255) // 오렌지색 #FFA500
            } else if fixture.league.id == 3 { // 유로파리그
                return Color(red: 109/255, green: 159/255, blue: 113/255) // 올리브 그린 #6D9F71
            }
            return Color(red: 109/255, green: 159/255, blue: 113/255) // 기본값: 올리브 그린
        case .none:
            return Color.clear
        }
    }
    
    // 진출권 정보에 따른 설명
    private func getQualificationDescription(for info: QualificationInfo) -> String {
        switch info {
        case .championsLeague:
            return "챔피언스리그"
        case .championsLeagueQualification:
            return "챔피언스리그 예선"
        case .europaLeague:
            return "유로파리그"
        case .conferenceLeague:
            return "컨퍼런스리그"
        case .relegation:
            return "강등권"
        case .knockout16Direct:
            return "16강 직행"
        case .knockout16Playoff:
            return "16강 플레이오프"
        case .none:
            return ""
        }
    }
    
    // 해당 리그에 관련된 진출권 정보인지 확인
    private func isQualificationRelevant(for info: QualificationInfo) -> Bool {
        let leagueId = fixture.league.id
        
        switch info {
        case .championsLeague:
            return leagueId != 2 && leagueId != 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
        case .championsLeagueQualification:
            return leagueId == 61 // 리그앙에만 적용
        case .europaLeague:
            return leagueId != 2 && leagueId != 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
        case .conferenceLeague:
            return leagueId != 2 && leagueId != 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
        case .relegation:
            return leagueId != 2 && leagueId != 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
        case .knockout16Direct:
            return leagueId == 2 || leagueId == 3 // 챔피언스리그와 유로파리그에만 적용
        case .knockout16Playoff:
            return leagueId == 2 || leagueId == 3 // 챔피언스리그와 유로파리그에만 적용
        case .none:
            return false
        }
    }
}