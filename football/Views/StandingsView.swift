import SwiftUI

struct StandingsView: View {
    let leagueId: Int
    let leagueName: String
    @StateObject private var viewModel = StandingsViewModel()
    @State private var selectedSeason: Int = 2024
    @State private var selectedTab = 0 // 0: 기록, 1: 최근 폼
    
    let seasons = [2024, 2023, 2022, 2021, 2020]
    
    private func formatSeason(_ year: Int) -> String {
        let nextYear = (year + 1) % 100
        return "\(year)/\(nextYear)"
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // 리그 정보
            VStack(spacing: 16) {
                AsyncImage(url: URL(string: "https://media.api-sports.io/football/leagues/\(leagueId).png")) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "sportscourt")
                        .foregroundColor(.gray)
                }
                .frame(width: 80, height: 80)
                
                Text(leagueName)
                    .font(.title)
                    .bold()
            }
            .padding(.vertical, 20)
            
            // 시즌 선택
            HStack {
                Menu {
                    ForEach(seasons, id: \.self) { season in
                        Button(formatSeason(season)) {
                            selectedSeason = season
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(formatSeason(selectedSeason))
                        Image(systemName: "chevron.down")
                    }
                    .font(.system(size: 15))
                    .foregroundColor(.primary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
                
                Spacer()
            }
            .padding(.horizontal)
            .padding(.bottom, 24)
            
            // 탭 선택
            Picker("보기 모드", selection: $selectedTab) {
                Text("기록").tag(0)
                Text("최근 폼").tag(1)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            .padding(.bottom)
            
            if viewModel.isLoading {
                Spacer()
                ProgressView()
                    .scaleEffect(1.5)
                Spacer()
            } else {
                ScrollView {
                    VStack(spacing: 0) {
                        if selectedTab == 0 {
                            // 기록 탭
                            RecordView(standings: viewModel.getSortedStandings(), leagueId: leagueId)
                        } else {
                            // 최근 폼 탭
                            RecentFormView(standings: viewModel.getSortedStandings(), leagueId: leagueId)
                        }
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: selectedSeason) { oldValue, newValue in
            viewModel.loadStandings(leagueId: leagueId, season: selectedSeason)
        }
        .onAppear {
            viewModel.loadStandings(leagueId: leagueId, season: selectedSeason)
        }
    }
}

// MARK: - 진출권 정보 열거형
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

// MARK: - Record View
struct RecordView: View {
    let standings: [Standing]
    let leagueId: Int
    
    var body: some View {
        VStack(spacing: 0) {
            // 헤더
            HStack(spacing: 0) {
                Text("#")
                    .frame(width: 25, alignment: .center)
                Text("팀")
                    .frame(width: 180, alignment: .leading)
                Text("경기")
                    .frame(width: 35, alignment: .center)
                Text("승")
                    .frame(width: 25, alignment: .center)
                Text("무")
                    .frame(width: 25, alignment: .center)
                Text("패")
                    .frame(width: 25, alignment: .center)
                Text("+/-")
                    .frame(width: 35, alignment: .center)
                Text("승점")
                    .frame(width: 35, alignment: .center)
            }
            .font(.system(size: 12))
            .foregroundColor(.gray)
            .padding(.vertical, 10)
            
            Divider()
            
            // 순위 목록
            ForEach(standings) { standing in
                VStack(spacing: 0) {
                        NavigationLink(destination: TeamProfileView(teamId: standing.team.id, leagueId: leagueId)) {
                            HStack(spacing: 0) {
                                // 순위 및 진출권 표시
                                let qualificationInfo = getQualificationInfo(for: standing.rank, leagueId: leagueId, totalTeams: standings.count)
                                let qualificationColor = getQualificationColor(for: qualificationInfo, leagueId: leagueId)
                                
                                HStack(spacing: 0) {
                                    // 진출권 색상 띠
                                    Rectangle()
                                        .fill(qualificationColor)
                                        .frame(width: 3)
                                    
                                    Text("\(standing.rank)")
                                        .font(.system(.body, design: .rounded))
                                        .fontWeight(.bold)
                                        .foregroundColor(qualificationInfo != .none ? qualificationColor : .primary)
                                        .frame(width: 22, alignment: .center)
                                }
                                .frame(width: 25)
                                
                                HStack(spacing: 8) {
                                    AsyncImage(url: URL(string: standing.team.logo)) { image in
                                        image
                                            .resizable()
                                            .scaledToFit()
                                    } placeholder: {
                                        Image(systemName: "sportscourt")
                                            .foregroundColor(.gray)
                                    }
                                    .frame(width: 20, height: 20)
                                    
                                    Text(standing.team.name)
                                        .lineLimit(1)
                                        .font(.system(size: 13))
                                }
                                .frame(width: 180, alignment: .leading)
                                
                                Text("\(standing.all.played)")
                                    .frame(width: 35, alignment: .center)
                                Text("\(standing.all.win)")
                                    .frame(width: 25, alignment: .center)
                                Text("\(standing.all.draw)")
                                    .frame(width: 25, alignment: .center)
                                Text("\(standing.all.lose)")
                                    .frame(width: 25, alignment: .center)
                                
                                Text(standing.goalsDiff > 0 ? "+\(standing.goalsDiff)" : "\(standing.goalsDiff)")
                                    .frame(width: 35, alignment: .center)
                                    .foregroundColor(standing.goalsDiff > 0 ? .green : (standing.goalsDiff < 0 ? .red : .primary))
                                
                                Text("\(standing.points)")
                                    .frame(width: 35, alignment: .center)
                                    .bold()
                            }
                            .foregroundColor(.primary)
                        }
                    .font(.system(size: 13))
                    .padding(.vertical, 10)
                    
                    Divider()
                }
            }
            
            // 범례
            VStack(alignment: .leading, spacing: 8) {
                Text("진출권 정보")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.bottom, 4)
                    .padding(.top, 12)
                
                // 챔피언스리그와 유로파리그는 다른 범례 표시
                if leagueId == 2 || leagueId == 3 {
                    // 유럽 대항전 범례
                    ForEach([QualificationInfo.knockout16Direct, .knockout16Playoff], id: \.self) { info in
                        if getQualificationDescription(for: info) != "" && isQualificationRelevant(for: info, leagueId: leagueId) {
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(getQualificationColor(for: info, leagueId: leagueId))
                                    .frame(width: 12, height: 12)
                                
                                Text(getQualificationDescription(for: info))
                                    .font(.caption)
                            }
                        }
                    }
                } else {
                    // 일반 리그 범례
                    ForEach([QualificationInfo.championsLeague, .championsLeagueQualification, .europaLeague, .conferenceLeague, .conferenceLeagueQualification, .relegationPlayoff, .relegation], id: \.self) { info in
                        if getQualificationDescription(for: info) != "" && isQualificationRelevant(for: info, leagueId: leagueId) {
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(getQualificationColor(for: info, leagueId: leagueId))
                                    .frame(width: 12, height: 12)
                                
                                Text(getQualificationDescription(for: info))
                                    .font(.caption)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 8)
        }
        .padding(.horizontal, 8)
    }
    
    // 리그별 진출권 정보
    private func getQualificationInfo(for rank: Int, leagueId: Int, totalTeams: Int) -> QualificationInfo {
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
    private func getQualificationColor(for info: QualificationInfo, leagueId: Int) -> Color {
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
            if leagueId == 2 { // 챔피언스리그
                return Color(red: 65/255, green: 105/255, blue: 225/255) // 로열 블루 #4169E1
            } else if leagueId == 3 { // 유로파리그
                return Color(red: 255/255, green: 165/255, blue: 0/255) // 오렌지색 #FFA500
            }
            return Color(red: 255/255, green: 165/255, blue: 0/255) // 기본값: 오렌지색
            
        case .knockout16Playoff:
            // 리그 ID에 따라 다른 색상 적용
            if leagueId == 2 { // 챔피언스리그
                return Color(red: 25/255, green: 25/255, blue: 112/255) // 미드나잇 블루 #191970
            } else if leagueId == 3 { // 유로파리그
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
    private func isQualificationRelevant(for info: QualificationInfo, leagueId: Int) -> Bool {
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

// MARK: - Form Results View
struct FormResultsView: View {
    let form: String
    
    private func getFormColor(_ result: Character) -> Color {
        switch result {
        case "W": return .green
        case "D": return .gray
        case "L": return .red
        default: return .clear
        }
    }
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(Array(form.reversed().prefix(5)), id: \.self) { result in
                Text(String(result))
                    .font(.caption)
                    .foregroundColor(.white)
                    .frame(width: 24, height: 24)
                    .background(getFormColor(result))
                    .cornerRadius(4)
            }
        }
    }
}

// MARK: - Recent Form View
struct RecentFormView: View {
    let standings: [Standing]
    let leagueId: Int
    
    var body: some View {
        VStack(spacing: 0) {
            // 헤더
            HStack(spacing: 0) {
                Text("#")
                    .frame(width: 25, alignment: .center)
                Text("팀")
                    .frame(width: 180, alignment: .leading)
                Text("최근 5경기")
                    .frame(width: 150, alignment: .center)
            }
            .font(.system(size: 12))
            .foregroundColor(.gray)
            .padding(.vertical, 10)
            
            Divider()
            
            // 순위 목록
            ForEach(standings) { standing in
                VStack(spacing: 0) {
                    NavigationLink(destination: TeamProfileView(teamId: standing.team.id, leagueId: leagueId)) {
                        HStack(spacing: 0) {
                            // 순위 및 진출권 표시
                            let qualificationInfo = getQualificationInfo(for: standing.rank, leagueId: leagueId, totalTeams: standings.count)
                            let qualificationColor = getQualificationColor(for: qualificationInfo, leagueId: leagueId)
                            
                            HStack(spacing: 0) {
                                // 진출권 색상 띠
                                Rectangle()
                                    .fill(qualificationColor)
                                    .frame(width: 3)
                                
                                Text("\(standing.rank)")
                                    .font(.system(.body, design: .rounded))
                                    .fontWeight(.bold)
                                    .foregroundColor(qualificationInfo != .none ? qualificationColor : .primary)
                                    .frame(width: 22, alignment: .center)
                            }
                            .frame(width: 25)
                            
                            HStack(spacing: 8) {
                                AsyncImage(url: URL(string: standing.team.logo)) { image in
                                    image
                                        .resizable()
                                        .scaledToFit()
                                } placeholder: {
                                    Image(systemName: "sportscourt")
                                        .foregroundColor(.gray)
                                }
                                .frame(width: 20, height: 20)
                                
                                Text(standing.team.name)
                                    .lineLimit(1)
                                    .font(.system(size: 13))
                            }
                            .frame(width: 180, alignment: .leading)
                            
                            // 최근 5경기
                            FormResultsView(form: standing.form ?? "")
                                .frame(width: 150)
                        }
                        .foregroundColor(.primary)
                    }
                    .font(.system(size: 13))
                    .padding(.vertical, 10)
                    
                    Divider()
                }
            }
            
            // 범례
            VStack(alignment: .leading, spacing: 8) {
                Text("진출권 정보")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.bottom, 4)
                    .padding(.top, 12)
                
                // 챔피언스리그와 유로파리그는 다른 범례 표시
                if leagueId == 2 || leagueId == 3 {
                    // 유럽 대항전 범례
                    ForEach([QualificationInfo.knockout16Direct, .knockout16Playoff], id: \.self) { info in
                        if getQualificationDescription(for: info) != "" && isQualificationRelevant(for: info, leagueId: leagueId) {
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(getQualificationColor(for: info, leagueId: leagueId))
                                    .frame(width: 12, height: 12)
                                
                                Text(getQualificationDescription(for: info))
                                    .font(.caption)
                            }
                        }
                    }
                } else {
                    // 일반 리그 범례
                    ForEach([QualificationInfo.championsLeague, .championsLeagueQualification, .europaLeague, .conferenceLeague, .conferenceLeagueQualification, .relegationPlayoff, .relegation], id: \.self) { info in
                        if getQualificationDescription(for: info) != "" && isQualificationRelevant(for: info, leagueId: leagueId) {
                            HStack(spacing: 8) {
                                Rectangle()
                                    .fill(getQualificationColor(for: info, leagueId: leagueId))
                                    .frame(width: 12, height: 12)
                                
                                Text(getQualificationDescription(for: info))
                                    .font(.caption)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 8)
        }
        .padding(.horizontal, 8)
    }
    
    // 리그별 진출권 정보
    private func getQualificationInfo(for rank: Int, leagueId: Int, totalTeams: Int) -> QualificationInfo {
        switch leagueId {
        case 2: // 챔피언스리그
            if rank <= 8 {
                return .knockout16Direct // 1위~8위: 16강 직행
            } else if rank <= 24 {
                return .knockout16Playoff // 9위~24위: 16강 플레이오프
            } else if rank == 12 {
                return .europaLeague // 12위: 유로파리그 진출
            } else if rank == 17 {
                return .championsLeague // 17위: 챔피언스리그 진출
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
    private func getQualificationColor(for info: QualificationInfo, leagueId: Int) -> Color {
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
            if leagueId == 2 { // 챔피언스리그
                return Color(red: 65/255, green: 105/255, blue: 225/255) // 로열 블루 #4169E1
            } else if leagueId == 3 { // 유로파리그
                return Color(red: 255/255, green: 165/255, blue: 0/255) // 오렌지색 #FFA500
            }
            return Color(red: 255/255, green: 165/255, blue: 0/255) // 기본값: 오렌지색
            
        case .knockout16Playoff:
            // 리그 ID에 따라 다른 색상 적용
            if leagueId == 2 { // 챔피언스리그
                return Color(red: 25/255, green: 25/255, blue: 112/255) // 미드나잇 블루 #191970
            } else if leagueId == 3 { // 유로파리그
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
    private func isQualificationRelevant(for info: QualificationInfo, leagueId: Int) -> Bool {
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
