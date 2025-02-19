import SwiftUI

struct HeadToHeadView: View {
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
                            .frame(width: 60, height: 60)
                            
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
                            .frame(width: 60, height: 60)
                            
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
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
                
                // 득실 통계
                VStack(spacing: 16) {
                    Text("득실 통계")
                        .font(.headline)
                    
                    HStack(spacing: 40) {
                        // 팀1
                        VStack(spacing: 12) {
                            Text("\(team1Stats.goalsFor)")
                                .font(.title.bold())
                                .foregroundColor(.blue)
                            
                            Text("득점")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        
                        // 팀2
                        VStack(spacing: 12) {
                            Text("\(team2Stats.goalsFor)")
                                .font(.title.bold())
                                .foregroundColor(.red)
                            
                            Text("득점")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    HStack(spacing: 40) {
                        // 팀1
                        VStack(spacing: 12) {
                            Text("\(team1Stats.goalsAgainst)")
                                .font(.title.bold())
                                .foregroundColor(.blue)
                            
                            Text("실점")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        
                        // 팀2
                        VStack(spacing: 12) {
                            Text("\(team2Stats.goalsAgainst)")
                                .font(.title.bold())
                                .foregroundColor(.red)
                            
                            Text("실점")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    HStack(spacing: 40) {
                        // 팀1
                        VStack(spacing: 12) {
                            Text("\(team1Stats.goalDifference)")
                                .font(.title.bold())
                                .foregroundColor(.blue)
                            
                            Text("득실차")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                        
                        // 팀2
                        VStack(spacing: 12) {
                            Text("\(team2Stats.goalDifference)")
                                .font(.title.bold())
                                .foregroundColor(.red)
                            
                            Text("득실차")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
                
                // 최근 경기
                VStack(spacing: 16) {
                    Text("최근 경기")
                        .font(.headline)
                    
                    ForEach(fixtures.prefix(5)) { fixture in
                        HeadToHeadMatchRow(fixture: fixture)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.05), radius: 10)
            }
            .padding()
        }
    }
}

struct HeadToHeadMatchRow: View {
    let fixture: Fixture
    
    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        return formatter
    }
    
    private var displayFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy.MM.dd"
        return formatter
    }
    
    private var formattedDate: String {
        guard let date = dateFormatter.date(from: fixture.fixture.date) else { return "" }
        return displayFormatter.string(from: date)
    }
    
    var body: some View {
        HStack {
            // 날짜
            Text(formattedDate)
                .font(.caption)
                .foregroundColor(.gray)
                .frame(width: 70, alignment: .leading)
            
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
                    .font(.caption)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            
            // 스코어
            HStack(spacing: 8) {
                Text("\(fixture.goals?.home ?? 0)")
                Text("-")
                Text("\(fixture.goals?.away ?? 0)")
            }
            .font(.callout.bold())
            .frame(width: 60)
            
            // 원정팀
            HStack(spacing: 8) {
                Text(fixture.teams.away.name)
                    .font(.caption)
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
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 8)
    }
}
