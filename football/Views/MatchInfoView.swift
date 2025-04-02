import SwiftUI

struct MatchInfoView: View {
    let fixture: Fixture
    let viewModel: FixtureDetailViewModel
    
    var body: some View {
        VStack(spacing: 24) {
            // 기본 정보 (이미 구현 완료)
            VStack(spacing: 16) {
                Text("기본 정보")
                    .font(.headline)
                
                VStack(spacing: 12) {
                    // 리그 및 라운드
                    HStack {
                        Image(systemName: "trophy.fill")
                            .foregroundColor(.blue)
                        Text("\(fixture.league.name) - \(fixture.league.round)")
                            .font(.system(.body, design: .rounded))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    // 경기 장소
                    if let venue = fixture.fixture.venue.name {
                        HStack {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(.blue)
                            Text(venue)
                                .font(.system(.body, design: .rounded))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    
                    // 심판
                    if let referee = fixture.fixture.referee {
                        HStack {
                            Image(systemName: "whistle.fill")
                                .foregroundColor(.blue)
                            Text(referee)
                                .font(.system(.body, design: .rounded))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(.horizontal)
            }
            .frame(maxWidth: .infinity)
            .padding(16)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 10)
            
            // 팀 기록 (최근 5경기)
            VStack(spacing: 16) {
                Text("최근 5경기")
                    .font(.headline)
                
                HStack(spacing: 24) {
                    // 홈팀 최근 폼
                    VStack(spacing: 12) {
                        AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                        } placeholder: {
                            Image(systemName: "sportscourt.fill")
                                .foregroundColor(.gray)
                        }
                        .frame(width: 40, height: 40)
                        
                        Text(fixture.teams.home.name)
                            .font(.system(.subheadline, design: .rounded))
                            .fontWeight(.medium)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .frame(height: 40)
                        
                        if let form = viewModel.homeTeamForm {
                            HStack(spacing: 4) {
                                ForEach(form.results, id: \.self) { result in
                                    Circle()
                                        .fill(resultColor(result))
                                        .frame(width: 12, height: 12)
                                }
                            }
                        } else {
                            Text("정보 없음")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    
                    // 원정팀 최근 폼
                    VStack(spacing: 12) {
                        AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                        } placeholder: {
                            Image(systemName: "sportscourt.fill")
                                .foregroundColor(.gray)
                        }
                        .frame(width: 40, height: 40)
                        
                        Text(fixture.teams.away.name)
                            .font(.system(.subheadline, design: .rounded))
                            .fontWeight(.medium)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                            .frame(height: 40)
                        
                        if let form = viewModel.awayTeamForm {
                            HStack(spacing: 4) {
                                ForEach(form.results, id: \.self) { result in
                                    Circle()
                                        .fill(resultColor(result))
                                        .frame(width: 12, height: 12)
                                }
                            }
                        } else {
                            Text("정보 없음")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal)
            }
            .frame(maxWidth: .infinity)
            .padding(16)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 10)
            
            // 현재 순위 (리그면 리그순위, 토너먼트면 없음)
            if !viewModel.standings.isEmpty {
                VStack(spacing: 16) {
                    Text("현재 순위")
                        .font(.headline)
                    
                    VStack(spacing: 0) {
                        // 헤더
                        HStack {
                            Text("순위")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 40, alignment: .center)
                            
                            Text("팀")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            Text("경기")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 40, alignment: .center)
                            
                            Text("승점")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 40, alignment: .center)
                            
                            Text("득실")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .frame(width: 40, alignment: .center)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        
                        // 팀 순위
                        ForEach(viewModel.standings) { standing in
                            if standing.team.id == fixture.teams.home.id || standing.team.id == fixture.teams.away.id {
                                HStack {
                                    Text("\(standing.rank)")
                                        .font(.system(.body, design: .rounded))
                                        .fontWeight(.bold)
                                        .frame(width: 40, alignment: .center)
                                    
                                    HStack(spacing: 8) {
                                        AsyncImage(url: URL(string: standing.team.logo)) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                        } placeholder: {
                                            Image(systemName: "sportscourt.fill")
                                                .foregroundColor(.gray)
                                        }
                                        .frame(width: 20, height: 20)
                                        
                                        Text(standing.team.name)
                                            .font(.system(.body, design: .rounded))
                                            .lineLimit(1)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    
                                    Text("\(standing.all.played)")
                                        .font(.system(.body, design: .rounded))
                                        .frame(width: 40, alignment: .center)
                                    
                                    Text("\(standing.points)")
                                        .font(.system(.body, design: .rounded))
                                        .fontWeight(.bold)
                                        .frame(width: 40, alignment: .center)
                                    
                                    Text("\(standing.goalsDiff)")
                                        .font(.system(.body, design: .rounded))
                                        .foregroundColor(standing.goalsDiff >= 0 ? .blue : .red)
                                        .frame(width: 40, alignment: .center)
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
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(.systemGray5), lineWidth: 1)
                    )
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
            }
        }
        .padding(.horizontal)
        .onAppear {
            if viewModel.standings.isEmpty {
                Task {
                    await viewModel.loadStandings()
                }
            }
            
            if viewModel.homeTeamForm == nil || viewModel.awayTeamForm == nil {
                Task {
                    await viewModel.loadTeamForms()
                }
            }
        }
    }
    
    private func resultColor(_ result: TeamForm.MatchResult) -> Color {
        switch result {
        case .win:
            return .green
        case .draw:
            return .orange
        case .loss:
            return .red
        }
    }
}