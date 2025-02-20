import SwiftUI

struct HeadToHeadView: View {
    @ObservedObject var viewModel: FixtureDetailViewModel
    let fixtures: [Fixture]
    let team1Stats: HeadToHeadStats
    let team2Stats: HeadToHeadStats
    let team1: Team
    let team2: Team
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // 상대전적 요약
                VStack(spacing: 16) {
                    Text("상대전적 요약")
                        .font(.headline)
                    
                    HStack(spacing: 0) {
                        // 팀1
                        VStack(spacing: 12) {
                            AsyncImage(url: URL(string: team1.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 50, height: 50)
                            
                            Text(team1.name)
                                .font(.callout)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        
                        // 전적
                        VStack(spacing: 8) {
                            Text("\(fixtures.count)경기")
                                .font(.title3.bold())
                            
                            HStack(spacing: 16) {
                                Text("\(team1Stats.wins)")
                                    .foregroundColor(.blue)
                                Text("무\(team1Stats.draws)")
                                    .foregroundColor(.gray)
                                Text("\(team1Stats.losses)")
                                    .foregroundColor(.red)
                            }
                            .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        
                        // 팀2
                        VStack(spacing: 12) {
                            AsyncImage(url: URL(string: team2.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                Image(systemName: "sportscourt")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 50, height: 50)
                            
                            Text(team2.name)
                                .font(.callout)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    
                    // 승률 차트
                    VStack(spacing: 8) {
                        Text("승률")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                // 배경
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(Color.gray.opacity(0.1))
                                    .frame(height: 12)
                                
                                // 팀1 승률
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(LinearGradient(
                                        gradient: Gradient(colors: [.blue.opacity(0.8), .blue.opacity(0.4)]),
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    ))
                                    .frame(width: geometry.size.width * CGFloat(team1Stats.winRate / 100), height: 12)
                            }
                        }
                        .frame(height: 12)
                        
                        HStack {
                            Text(String(format: "%.1f%%", team1Stats.winRate))
                                .foregroundColor(.blue)
                            
                            Spacer()
                            
                            Text(String(format: "%.1f%%", team2Stats.winRate))
                                .foregroundColor(.red)
                        }
                        .font(.caption)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
                
                // 득실 통계
                VStack(spacing: 16) {
                    Text("득실 통계")
                        .font(.headline)
                    
                    Grid(horizontalSpacing: 24, verticalSpacing: 16) {
                        GridRow {
                            Text("\(team1Stats.goalsFor)")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(.blue)
                            
                            Text("득점")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            Text("\(team2Stats.goalsFor)")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(.red)
                        }
                        
                        GridRow {
                            Text("\(team1Stats.goalsAgainst)")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(.blue)
                            
                            Text("실점")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            Text("\(team2Stats.goalsAgainst)")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(.red)
                        }
                        
                        GridRow {
                            Text("\(team1Stats.goalDifference)")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(.blue)
                            
                            Text("득실차")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                            
                            Text("\(team2Stats.goalDifference)")
                                .font(.system(size: 36, weight: .bold))
                                .foregroundColor(.red)
                        }
                    }
                    .padding(.vertical, 8)
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
                
                // 최근 경기
                VStack(spacing: 16) {
                    Text("최근 경기")
                        .font(.headline)
                    
                    VStack(spacing: 0) {
                        ForEach(Array(fixtures.sorted { $0.fixture.date > $1.fixture.date }.prefix(5).enumerated()), id: \.element.id) { index, fixture in
                            VStack(spacing: 8) {
                                Text(formattedDate(from: fixture.fixture.date))
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                    .padding(.top, 12)
                                
                                HStack(spacing: 12) {
                                    // 홈팀
                                    HStack(spacing: 8) {
                                        AsyncImage(url: URL(string: fixture.teams.home.logo)) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                        } placeholder: {
                                            Image(systemName: "sportscourt")
                                                .foregroundColor(.gray)
                                        }
                                        .frame(width: 20, height: 20)
                                        
                                        Text(fixture.teams.home.name)
                                            .font(.system(.body, design: .rounded))
                                            .lineLimit(1)
                                    }
                                    .frame(width: 80, alignment: .trailing)
                                    
                                    // 스코어
                                    Text("\(fixture.goals?.home ?? 0) - \(fixture.goals?.away ?? 0)")
                                        .font(.system(.title3, design: .rounded, weight: .bold))
                                        .frame(width: 50, alignment: .center)
                                    
                                    // 원정팀
                                    HStack(spacing: 8) {
                                        Text(fixture.teams.away.name)
                                            .font(.system(.body, design: .rounded))
                                            .lineLimit(1)
                                        
                                        AsyncImage(url: URL(string: fixture.teams.away.logo)) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                        } placeholder: {
                                            Image(systemName: "sportscourt")
                                                .foregroundColor(.gray)
                                        }
                                        .frame(width: 20, height: 20)
                                    }
                                    .frame(width: 80, alignment: .leading)
                                }
                                .padding(.bottom, 12)
                            }
                            
                            if index < fixtures.prefix(5).count - 1 {
                                Divider()
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
                
                // 현재 시즌 리그 순위
                if !viewModel.standings.isEmpty {
                    VStack(spacing: 16) {
                        HStack {
                            Text("시즌순위")
                                .font(.headline)
                            
                            Spacer()
                            
                            HStack(spacing: 16) {
                                Text("경기")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .frame(width: 25, alignment: .trailing)
                                Text("승점")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .frame(width: 25, alignment: .trailing)
                                Text("득/실")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .frame(width: 25, alignment: .trailing)
                            }
                        }
                        
                        ForEach(viewModel.standings) { standing in
                            if standing.team.id == team1.id || standing.team.id == team2.id {
                                HStack(spacing: 12) {
                                    HStack(spacing: 8) {
                                        // 순위
                                        Text("\(standing.rank)")
                                            .font(.system(.body, design: .rounded))
                                            .fontWeight(.bold)
                                            .frame(width: 25, alignment: .center)
                                        
                                        // 팀 로고
                                        AsyncImage(url: URL(string: standing.team.logo)) { image in
                                            image
                                                .resizable()
                                                .scaledToFit()
                                        } placeholder: {
                                            Image(systemName: "sportscourt")
                                                .foregroundColor(.gray)
                                        }
                                        .frame(width: 20, height: 20)
                                        
                                        // 팀 이름
                                        Text(standing.team.name)
                                            .font(.system(.body, design: .rounded))
                                            .lineLimit(1)
                                    }
                                    .frame(width: 140, alignment: .leading)
                                    
                                    Spacer()
                                    
                                    HStack(spacing: 16) {
                                        // 경기 수
                                        Text("\(standing.all.played)")
                                            .font(.system(.body, design: .rounded))
                                            .foregroundColor(.gray)
                                            .frame(width: 25, alignment: .trailing)
                                        
                                        // 승점
                                        Text("\(standing.points)")
                                            .font(.system(.body, design: .rounded))
                                            .fontWeight(.bold)
                                            .frame(width: 25, alignment: .trailing)
                                        
                                        // 득실차
                                        Text("\(standing.goalsDiff)")
                                            .font(.system(.body, design: .rounded))
                                            .foregroundColor(standing.goalsDiff >= 0 ? .blue : .red)
                                            .frame(width: 25, alignment: .trailing)
                                    }
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color(.systemGray6).opacity(0.5))
                                .cornerRadius(8)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(16)
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                    .shadow(color: Color.black.opacity(0.05), radius: 10)
                }
            }
            .frame(maxWidth: 400)
            .padding(.horizontal)
        }
    }
    
    private func formattedDate(from dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        
        guard let date = formatter.date(from: dateString) else { return "" }
        
        formatter.dateFormat = "yyyy.MM.dd"
        return formatter.string(from: date)
    }
}
