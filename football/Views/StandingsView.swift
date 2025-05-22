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
                                Text("\(standing.rank)")
                                    .frame(width: 25, alignment: .center)
                                    .foregroundColor(standing.rank <= 4 ? Color(red: 65/255, green: 105/255, blue: 225/255) : .primary) // 로열 블루 #4169E1
                                
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
        }
        .padding(.horizontal, 8)
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
                            Text("\(standing.rank)")
                                .frame(width: 25, alignment: .center)
                                .foregroundColor(standing.rank <= 4 ? Color(red: 65/255, green: 105/255, blue: 225/255) : .primary) // 로열 블루 #4169E1
                            
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
        }
        .padding(.horizontal, 8)
    }
}
