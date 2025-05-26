import SwiftUI
import Combine
import Foundation

// 팀 이름을 3자 약어로 변환하는 함수
private func getTeamAbbreviation(for teamName: String) -> String {
    // 특수 케이스 처리
    let abbreviations: [String: String] = [
        // Premier League
        "Arsenal": "ARS",
        "Aston Villa": "AVL",
        "Bournemouth": "BOU",
        "Brentford": "BRE",
        "Brighton": "BHA",
        "Burnley": "BUR",
        "Chelsea": "CHE",
        "Crystal Palace": "CRY",
        "Everton": "EVE",
        "Fulham": "FUL",
        "Liverpool": "LIV",
        "Luton Town": "LUT",
        "Manchester City": "MCI",
        "Manchester United": "MUN",
        "Newcastle United": "NEW",
        "Nottingham Forest": "NFO",
        "Sheffield United": "SHU",
        "Tottenham Hotspur": "TOT",
        "West Ham United": "WHU",
        "Wolverhampton Wanderers": "WOL",
        // La Liga
        "Real Madrid": "RMA",
        "Barcelona": "BAR",
        "Atletico Madrid": "ATM",
        "Sevilla": "SEV",
        "Real Sociedad": "RSO",
        "Real Betis": "BET",
        "Villarreal": "VIL",
        "Valencia": "VAL",
        "Athletic Club": "ATH",
        "Getafe": "GET",
        "Osasuna": "OSA",
        "Celta Vigo": "CEL",
        "Almeria": "ALM",
        "Cadiz": "CAD",
        "Granada": "GRA",
        "Mallorca": "MLL",
        "Las Palmas": "LPA",
        "Girona": "GIR",
        // Serie A
        "Inter Milan": "INT",
        "AC Milan": "MIL",
        "Juventus": "JUV",
        "Napoli": "NAP",
        "Roma": "ROM",
        "Lazio": "LAZ",
        "Atalanta": "ATA",
        "Torino": "TOR",
        "Fiorentina": "FIO",
        "Bologna": "BOL",
        "Udinese": "UDI",
        "Sassuolo": "SAS",
        "Empoli": "EMP",
        "Genoa": "GEN",
        "Lecce": "LEC",
        "Cagliari": "CAG",
        "Monza": "MON",
        "Salernitana": "SAL",
        "Hellas Verona": "VER",
        // Bundesliga
        "Bayern Munich": "FCB",
        "Bayern München": "FCB",
        "Borussia Dortmund": "BVB",
        "RB Leipzig": "RBL",
        "Bayer Leverkusen": "LEV",
        "Union Berlin": "UNB",
        "Freiburg": "SCF",
        "Eintracht Frankfurt": "SGE",
        "Wolfsburg": "WOB",
        "Mainz": "M05",
        "Borussia Mönchengladbach": "BMG",
        "Cologne": "KOE",
        "Augsburg": "FCA",
        "FC Augsburg": "FCA",
        "Stuttgart": "VFB",
        "Werder Bremen": "SVW",
        "Bochum": "BOC",
        "Heidenheim": "FCH",
        "1. FC Heidenheim": "FCH",
        "1.FC Heidenheim": "FCH",
        "1 FC Heidenheim": "FCH",
        "FC Heidenheim": "FCH",
        "Darmstadt": "SVD",
        "Hoffenheim": "TSG",
        "1899 Hoffenheim": "TSG",
        "TSG 1899 Hoffenheim": "TSG",
        "TSG Hoffenheim": "TSG",
        "FC St. Pauli": "FCSP",
        "FC St Pauli": "FCSP",
        "St. Pauli": "FCSP",
        "St Pauli": "FCSP",
        // Ligue 1
        "Paris Saint-Germain": "PSG",
        "Paris Saint Germain": "PSG",
        "Marseille": "OM",
        "Lyon": "OL",
        "Olympique Lyonnais": "OL",
        "Monaco": "ASM",
        "Lille": "LIL",
        "Rennes": "REN",
        "Nice": "OGC",
        "Lens": "LEN",
        "Toulouse": "TOU",
        "Nantes": "FCN",
        "Strasbourg": "STR",
        "Montpellier": "MON",
        "Brest": "BRE",
        "Reims": "REI",
        "Metz": "MET",
        "Clermont": "CLE",
        "Le Havre": "HAC",
        "Lorient": "LOR",
        // European Competitions (UCL & UEL Regulars)
        "Benfica": "BEN",
        "Porto": "POR",
        "Sporting CP": "SCP",
        "Celtic": "CEL",
        "Rangers": "RAN",
        "Shakhtar Donetsk": "SHA",
        "Dynamo Kyiv": "DYN",
        "Red Star Belgrade": "RSB",
        "Olympiacos": "OLY",
        "Galatasaray": "GAL",
        "Fenerbahce": "FEN",
        "Besiktas": "BES",
        "Ajax": "AJA",
        "Feyenoord": "FEY",
        "PSV": "PSV",
        "Club Brugge": "CBR",
        "Anderlecht": "AND",
        "Basel": "BAS",
        "Young Boys": "YBO",
        "Dinamo Zagreb": "DZG",
        "Sheriff Tiraspol": "SHF",
        "Slavia Prague": "SLP",
        "Sparta Prague": "SPA",
        "Ludogorets": "LUD",
        "Ferencvaros": "FER"
    ]
    
    let normalized = teamName
        .replacingOccurrences(of: "-", with: " ")
        .trimmingCharacters(in: .whitespacesAndNewlines)
    
    return abbreviations[normalized] ?? String(teamName.prefix(3)).uppercased()
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
                    HStack(alignment: .center, spacing: 12) {
                        LeagueLogoView(logoUrl: fixture.league.logo, size: 36)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(fixture.league.name)
                                .font(.headline)
                            
                            Text("\(String(fixture.league.season).suffix(2))-\(String(fixture.league.season + 1).suffix(2)) 시즌")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        
                    }
                    .frame(maxWidth: .infinity, alignment: .leading) // 좌측 정렬
                    .padding(.horizontal, 16) // 좌우 패딩 추가
                    
                    // 순위표 (너비 제한 추가)
                    VStack(spacing: 0) {
                        // 스크롤 제거하고 화면 너비에 맞게 조정
                        // 헤더
                        HStack {
                            // HStack이 전체 너비를 차지하도록 설정
                            Spacer(minLength: 0)
                            Text("#")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("팀")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(minWidth: 75, maxWidth: .infinity, alignment: .leading)
                            
                            Text("경기")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 23, alignment: .center)
                            
                            Text("승")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 23, alignment: .center)
                            
                            Text("무")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 23, alignment: .center)
                            
                            Text("패")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 23, alignment: .center)
                            
                            Text("승점")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 23, alignment: .center)
                            
                            Text("득실")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 28, alignment: .center)
                                
                            Spacer(minLength: 0)
                        }
                        .frame(maxWidth: .infinity) // HStack이 전체 너비를 차지하도록 설정
                        .padding(.horizontal, 0) // 좌우 패딩 제거
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        
                        // 팀 순위
                        ForEach(viewModel.standings) { standing in
                            let qualificationInfo = getQualificationInfo(for: standing.rank)
                            let qualificationColor = getQualificationColor(for: qualificationInfo)
                            
                            NavigationLink(destination: TeamProfileView(teamId: standing.team.id, leagueId: fixture.league.id)) {
                                HStack {
                                    Spacer(minLength: 0)
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
                                    .frame(minWidth: 75, maxWidth: .infinity, alignment: .leading)
                                    
                                    Text("\(standing.all.played)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 23, alignment: .center)
                                        .lineLimit(1)
                                    
                                    Text("\(standing.all.win)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 23, alignment: .center)
                                        .lineLimit(1)
                                    
                                    Text("\(standing.all.draw)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 23, alignment: .center)
                                        .lineLimit(1)
                                    
                                    Text("\(standing.all.lose)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 23, alignment: .center)
                                        .lineLimit(1)
                                    
                                    Text("\(standing.points)")
                                        .font(.system(.body, design: .rounded))
                                        .fontWeight(.bold)
                                        .frame(width: 23, alignment: .center)
                                        .lineLimit(1)
                                    
                                    Text("\(standing.goalsDiff)")
                                        .font(.system(.body, design: .rounded))
                                        .foregroundColor(standing.goalsDiff >= 0 ? .blue : .red)
                                        .frame(width: 28, alignment: .center)
                                        .lineLimit(1) // 한 줄에 표시되도록 설정
                                        
                                    Spacer(minLength: 0)
                                }
                                .frame(maxWidth: .infinity) // HStack이 전체 너비를 차지하도록 설정
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
                    .frame(maxWidth: 380) // 테이블 전체 너비 제한
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
                                ForEach([QualificationInfo.championsLeague, .championsLeagueQualification, .europaLeague, .conferenceLeague, .relegation, .relegationPlayoff], id: \.self) { info in
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
                .padding(.vertical, 16) // 상하 패딩 유지
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading) // 화면 너비에 맞게 조정하고 좌측 정렬
        // .padding(.horizontal) 제거 - 화면 이동 문제 해결
        .navigationTitle("순위")
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
        case europaLeagueQualification
        case conferenceLeague
        case conferenceLeagueQualification
        case relegation
        case relegationPlayoff
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
            } else if rank == 12 {
                return .europaLeague // 12위: 유로파리그 진출
            } else if rank == 17 {
                return .championsLeague // 17위: 챔피언스리그 진출
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
            
        case 78: // 분데스리가
            if rank <= 4 {
                return .championsLeague
            } else if rank == 5 {
                return .europaLeague
            } else if rank == 6 {
                return .conferenceLeague
            } else if rank == 16 {
                return .relegationPlayoff // 16위: 강등 플레이오프
            } else if rank >= totalTeams - 2 && rank != 16 {
                return .relegation
            }
            
        case 135: // 세리에 A
            if rank <= 4 {
                return .championsLeague
            } else if rank == 5 {
                return .europaLeague
            } else if rank == 6 {
                return .conferenceLeagueQualification // 6위: 컨퍼런스리그 예선
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
                return .conferenceLeagueQualification // 6위: 컨퍼런스리그 예선
            } else if rank == 16 {
                return .relegationPlayoff // 16위: 강등 플레이오프
            } else if rank >= totalTeams - 2 && rank != 16 {
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
            // 챔피언스리그 진출 - 로열 블루
            return Color(red: 65/255, green: 105/255, blue: 225/255) // 로열 블루 #4169E1
        case .championsLeagueQualification:
            // 챔피언스리그 예선 - 밝은 하늘색
            return Color(red: 66/255, green: 165/255, blue: 245/255) // 밝은 하늘색
        case .europaLeague:
            return Color.orange
        case .europaLeagueQualification:
            // 유로파리그 예선 - 연한 오렌지색
            return Color(red: 255/255, green: 183/255, blue: 77/255) // 연한 오렌지색
        case .conferenceLeague:
            return Color.green
        case .conferenceLeagueQualification:
            // 컨퍼런스리그 예선 - 연한 녹색
            return Color(red: 129/255, green: 199/255, blue: 132/255) // 연한 녹색
        case .relegation:
            return Color.red
        case .relegationPlayoff:
            // 강등 플레이오프 - 연한 빨간색
            return Color(red: 255/255, green: 138/255, blue: 128/255) // 연한 빨간색
        case .knockout16Direct:
            // 리그 ID에 따라 다른 색상 적용
            if fixture.league.id == 2 { // 챔피언스리그
                return Color(red: 65/255, green: 105/255, blue: 225/255) // 로열 블루 #4169E1
            } else if fixture.league.id == 3 { // 유로파리그
                return Color(red: 255/255, green: 165/255, blue: 0/255) // 오렌지색 #FFA500
            }
            return Color(red: 255/255, green: 165/255, blue: 0/255) // 기본값: 오렌지색
            
        case .knockout16Playoff:
            // 리그 ID에 따라 다른 색상 적용
            if fixture.league.id == 2 { // 챔피언스리그
                return Color(red: 25/255, green: 25/255, blue: 112/255) // 미드나잇 블루 #191970
            } else if fixture.league.id == 3 { // 유로파리그
                return Color(red: 184/255, green: 115/255, blue: 51/255) // 카퍼색 #B87333
            }
            return Color(red: 184/255, green: 115/255, blue: 51/255) // 기본값: 카퍼색 #B87333
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
        case .europaLeagueQualification:
            return "유로파리그 예선"
        case .conferenceLeague:
            return "컨퍼런스리그"
        case .conferenceLeagueQualification:
            return "컨퍼런스리그 예선"
        case .relegation:
            return "강등권"
        case .relegationPlayoff:
            return "강등 플레이오프"
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
            return leagueId != 2 && leagueId != 3 || (leagueId == 2 && info == .championsLeague) // 챔피언스리그와 유로파리그가 아닌 리그에만 적용 (예외: 챔스 17위)
        case .championsLeagueQualification:
            return leagueId == 61 // 리그앙에만 적용
        case .europaLeague:
            return leagueId != 2 && leagueId != 3 || (leagueId == 2 && info == .europaLeague) // 챔피언스리그와 유로파리그가 아닌 리그에만 적용 (예외: 챔스 12위)
        case .europaLeagueQualification:
            return false // 현재 사용되지 않음
        case .conferenceLeague:
            return leagueId != 2 && leagueId != 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
        case .conferenceLeagueQualification:
            return leagueId == 61 || leagueId == 135 // 리그앙과 세리에 A에만 적용
        case .relegation:
            return leagueId != 2 && leagueId != 3 // 챔피언스리그와 유로파리그가 아닌 리그에만 적용
        case .relegationPlayoff:
            return leagueId == 61 || leagueId == 78 // 리그앙과 분데스리가에만 적용
        case .knockout16Direct:
            return leagueId == 2 || leagueId == 3 // 챔피언스리그와 유로파리그에만 적용
        case .knockout16Playoff:
            return leagueId == 2 || leagueId == 3 // 챔피언스리그와 유로파리그에만 적용
        case .none:
            return false
        }
    }
}
