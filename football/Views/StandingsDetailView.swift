import SwiftUI
import Combine

struct StandingsDetailView: View {
    let fixture: Fixture
    @ObservedObject var viewModel: FixtureDetailViewModel
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 24) {
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
                    // 리그 정보
                    HStack {
                        LeagueLogoView(logoUrl: fixture.league.logo, size: 30)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(fixture.league.name)
                                .font(.headline)
                            
                            Text("\(fixture.league.season) 시즌")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                    }
                    
                    // 순위표 (너비 제한 추가)
                    VStack(spacing: 0) {
                        // 스크롤 가능한 컨테이너로 감싸서 화면 너비를 초과하지 않도록 함
                        ScrollView(.horizontal, showsIndicators: false) {
                        // 헤더
                        HStack {
                            Text("#")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("팀")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            Text("경기")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("승")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("무")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("패")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("승점")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                            
                            Text("득실")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 30, alignment: .center)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        
                        // 팀 순위
                        ForEach(viewModel.standings) { standing in
                            let qualificationInfo = getQualificationInfo(for: standing.rank)
                            let qualificationColor = getQualificationColor(for: qualificationInfo)
                            
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
                                    TeamLogoView(logoUrl: standing.team.logo, size: 20)
                                    
                                    Text(TeamAbbreviations.abbreviation(for: standing.team.name))
                                        .font(.system(.body, design: .rounded))
                                        .fontWeight(.medium)
                                        .frame(width: 40)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                
                                Text("\(standing.all.played)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.all.win)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.all.draw)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.all.lose)")
                                    .font(.system(.body, design: .rounded))
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.points)")
                                    .font(.system(.body, design: .rounded))
                                    .fontWeight(.bold)
                                    .frame(width: 30, alignment: .center)
                                
                                Text("\(standing.goalsDiff)")
                                    .font(.system(.body, design: .rounded))
                                    .foregroundColor(standing.goalsDiff >= 0 ? .blue : .red)
                                    .frame(width: 30, alignment: .center)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(
                                standing.team.id == fixture.teams.home.id ? Color.blue.opacity(0.1) :
                                standing.team.id == fixture.teams.away.id ? Color.red.opacity(0.1) :
                                Color.clear
                            )
                        }
                        }
                    }
                    .cornerRadius(8)
                    .frame(maxWidth: .infinity) // 너비 제한
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
                    .padding(.top, 8)
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
            }
        }
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
    }
    
    // 리그별 진출권 정보
    private func getQualificationInfo(for rank: Int) -> QualificationInfo {
        let leagueId = fixture.league.id
        let totalTeams = viewModel.standings.count
        
        switch leagueId {
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
        case .championsLeague, .championsLeagueQualification:
            return Color.blue
        case .europaLeague:
            return Color.orange
        case .conferenceLeague:
            return Color.green
        case .relegation:
            return Color.red
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
        case .none:
            return ""
        }
    }
    
    // 해당 리그에 관련된 진출권 정보인지 확인
    private func isQualificationRelevant(for info: QualificationInfo) -> Bool {
        let leagueId = fixture.league.id
        
        switch info {
        case .championsLeague:
            return true // 모든 리그에 적용
        case .championsLeagueQualification:
            return leagueId == 61 // 리그앙에만 적용
        case .europaLeague:
            return true // 모든 리그에 적용
        case .conferenceLeague:
            return true // 모든 리그에 적용
        case .relegation:
            return true // 모든 리그에 적용
        case .none:
            return false
        }
    }
}