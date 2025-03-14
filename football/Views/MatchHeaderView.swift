import SwiftUI

struct MatchHeaderView: View {
    let fixture: Fixture
    let viewModel: FixtureDetailViewModel
    let service = FootballAPIService.shared
    // 경기 목록에서 사용하는 ViewModel 추가
    let fixturesViewModel = FixturesOverviewViewModel()
    
    private var isLive: Bool {
        ["1H", "2H", "HT", "ET", "P"].contains(fixture.fixture.status.short)
    }
    
    private var statusColor: Color {
        if isLive {
            return .red
        } else if fixture.fixture.status.short == "NS" {
            return .blue
        } else {
            return .gray
        }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // 리그 및 경기 상태
            VStack(spacing: 8) {
                HStack {
                    AsyncImage(url: URL(string: fixture.league.logo)) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .frame(width: 24, height: 24)
                    } placeholder: {
                        Image(systemName: "trophy.fill")
                            .foregroundColor(.gray)
                    }
                    
                    Text(fixture.league.name)
                        .font(.system(.subheadline, design: .rounded))
                        .fontWeight(.medium)
                }
                
                // 경기 상태
                HStack(spacing: 6) {
                    if isLive {
                        Circle()
                            .fill(Color.red)
                            .frame(width: 8, height: 8)
                    }
                    
                    Text(fixture.fixture.status.long)
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundColor(statusColor)
                        .fontWeight(.medium)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // 팀 정보와 스코어
            HStack(alignment: .center, spacing: 0) {
                // 홈팀
                TeamInfoView(team: fixture.teams.home, isWinner: fixture.teams.home.winner == true)
                    .frame(maxWidth: .infinity)
                
                // 스코어
                VStack(spacing: 8) {
                    if fixture.fixture.status.short == "NS" {
                        Text("VS")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(.blue)
                            .frame(width: 120)
                            .padding(.vertical, 12)
                    } else {
                        VStack(spacing: 6) {
                            VStack(spacing: 4) {
                                // 정규 시간 스코어
                                HStack(spacing: 20) {
                                    Text("\(fixture.goals?.home ?? 0)")
                                    Text("-")
                                    Text("\(fixture.goals?.away ?? 0)")
                                }
                                .font(.system(size: 44, weight: .bold, design: .rounded))
                                
                                // 합산 스코어 및 승부차기 결과 표시
                                VStack(spacing: 4) {
                                    // 합산 스코어 표시 개선 - 경기 목록에서 사용하는 방식 그대로 사용
                                    Group {
                                        if let fixture = viewModel.currentFixture, [2, 3].contains(fixture.league.id) {
                                            HStack(spacing: 8) {
                                                Text("합산")
                                                    .font(.system(.caption, design: .rounded))
                                                    .foregroundColor(.gray)
                                                
                                                // 경기 목록에서 사용하는 ViewModel 사용
                                                AggregateScoreView(fixture: fixture, fixturesViewModel: fixturesViewModel)
                                            }
                                            .padding(.vertical, 4)
                                        }
                                    }
                                    
                                    // 승부차기 결과 (있는 경우)
                                    if fixture.fixture.status.short == "PEN" {
                                        HStack(spacing: 8) {
                                            Text("승부차기")
                                                .font(.system(.caption, design: .rounded))
                                                .foregroundColor(.gray)
                                            
                                            // 임시 데이터 (실제로는 API에서 가져와야 함)
                                            let penaltyHome = 5
                                            let penaltyAway = 4
                                            
                                            Text("\(penaltyHome) - \(penaltyAway)")
                                                .font(.system(.caption, design: .rounded))
                                                .fontWeight(.bold)
                                                .foregroundColor(.red)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 2)
                                                .background(Color.red.opacity(0.1))
                                                .cornerRadius(4)
                                        }
                                    }
                                }
                            }
                            
                            // 경기 상태 표시 개선
                            if ["AET", "PEN"].contains(fixture.fixture.status.short) {
                                // 연장 종료 또는 승부차기 종료 표시
                                Text(fixture.fixture.status.short == "AET" ? "연장 종료" : "승부차기 종료")
                                    .font(.system(.callout, design: .rounded))
                                    .fontWeight(.medium)
                                    .foregroundColor(fixture.fixture.status.short == "AET" ? .orange : .red)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(
                                        (fixture.fixture.status.short == "AET" ? Color.orange : Color.red)
                                            .opacity(0.1)
                                    )
                                    .clipShape(Capsule())
                            } else if let elapsed = fixture.fixture.status.elapsed {
                                // 일반 경기 시간 표시
                                Text("\(elapsed)'")
                                    .font(.system(.callout, design: .rounded))
                                    .fontWeight(.medium)
                                    .foregroundColor(statusColor)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(statusColor.opacity(0.1))
                                    .clipShape(Capsule())
                            }
                        }
                        .frame(width: 120)
                        .padding(.vertical, 12)
                    }
                }
                .background(Color(.systemBackground))
                
                // 원정팀
                TeamInfoView(team: fixture.teams.away, isWinner: fixture.teams.away.winner == true)
                    .frame(maxWidth: .infinity)
            }
            .padding(.vertical, 20)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 8, y: 2)
            
            // 경기 정보
            HStack(spacing: 24) {
                if let venue = fixture.fixture.venue.name {
                    Label {
                        Text(venue)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.gray)
                    } icon: {
                        Image(systemName: "mappin.circle.fill")
                            .foregroundColor(.gray)
                    }
                }
                
                if let referee = fixture.fixture.referee {
                    Label {
                        Text(referee)
                            .font(.system(.caption, design: .rounded))
                            .foregroundColor(.gray)
                    } icon: {
                        Image(systemName: "whistle.fill")
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }
}

// 합산 스코어 표시를 위한 뷰
struct AggregateScoreView: View {
    let fixture: Fixture
    let fixturesViewModel: FixturesOverviewViewModel
    @State private var aggregateScore: (home: Int, away: Int)? = nil
    
    var body: some View {
        Group {
            if let score = aggregateScore {
                Text("\(score.home) - \(score.away)")
                    .font(.system(.subheadline, design: .rounded))
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(4)
            } else {
                Text("계산 중...")
                    .font(.system(.caption, design: .rounded))
                    .foregroundColor(.gray)
            }
        }
        .onAppear {
            loadAggregateScore()
        }
    }
    
    private func loadAggregateScore() {
        Task {
            if let score = await fixturesViewModel.calculateAggregateScore(fixture: fixture) {
                await MainActor.run {
                    self.aggregateScore = score
                    print("🏆 AggregateScoreView - 합산 결과 계산 완료: \(score.home)-\(score.away)")
                }
            }
        }
    }
}

struct TeamInfoView: View {
    let team: Team
    let isWinner: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // 팀 로고
            ZStack {
                Circle()
                    .fill(Color(.systemBackground))
                    .frame(width: 80, height: 80)
                    .shadow(color: isWinner ? Color.blue.opacity(0.2) : Color.black.opacity(0.05),
                           radius: isWinner ? 12 : 8)
                
                AsyncImage(url: URL(string: team.logo)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .saturation(isWinner ? 1.0 : 0.8)
                } placeholder: {
                    Image(systemName: "sportscourt.fill")
                        .font(.system(size: 30))
                        .foregroundColor(.gray)
                }
                .frame(width: 60, height: 60)
                
                if isWinner {
                    Circle()
                        .strokeBorder(Color.blue.opacity(0.3), lineWidth: 3)
                        .frame(width: 80, height: 80)
                }
            }
            
            VStack(spacing: 6) {
                // 팀 이름
                Text(team.name)
                    .font(.system(.callout, design: .rounded))
                    .fontWeight(isWinner ? .semibold : .medium)
                    .foregroundColor(isWinner ? .primary : .secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .frame(maxWidth: 130)
                
                // 승리 표시
                if isWinner {
                    Label("승리", systemImage: "checkmark.circle.fill")
                        .font(.system(.caption, design: .rounded))
                        .foregroundColor(.blue)
                        .imageScale(.small)
                }
            }
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}
