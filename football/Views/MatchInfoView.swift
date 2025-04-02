import SwiftUI

struct MatchInfoView: View {
    let fixture: Fixture
    let viewModel: FixtureDetailViewModel
    @State private var isDataLoaded = false
    @State private var retryCount = 0
    
    // Timer를 별도의 프로퍼티로 분리
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        mainContentView
        .padding(.horizontal)
        .onAppear {
            loadData()
        }
        // onChange 대신 onReceive를 사용하여 타이머 이벤트마다 데이터 로드 상태 확인
        .onReceive(timer) { _ in
            // 데이터가 로드되지 않았고 재시도 횟수가 3회 미만이면 재시도
            if !isDataLoaded && retryCount < 3 {
                retryCount += 1
                print("⏱️ MatchInfoView - 타이머 재시도 #\(retryCount)")
                loadData()
            }
        }
    }
    
    private func loadData() {
        Task {
            print("🔄 MatchInfoView - 데이터 로드 시작 (시도 #\(retryCount + 1))")
            
            // 팀 폼 데이터 로드 (항상 로드)
            await viewModel.loadTeamForms()
            
            // 순위 정보 로드 (항상 로드)
            await viewModel.loadStandings()
            
            // 데이터 로드 상태 확인
            checkDataLoaded()
            
            print("✅ MatchInfoView - 데이터 로드 완료 (시도 #\(retryCount + 1))")
        }
    }
    
    private func checkDataLoaded() {
        // 데이터가 모두 로드되었는지 확인
        if viewModel.homeTeamForm != nil && viewModel.awayTeamForm != nil && !viewModel.standings.isEmpty {
            isDataLoaded = true
            print("✅ MatchInfoView - 모든 데이터 로드됨")
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
    
    // MARK: - UI Components
    
    // 메인 컨텐츠 뷰
    private var mainContentView: some View {
        VStack(spacing: 24) {
            basicInfoSection
            recentFormSection
            standingsSection
        }
    }
    
    // 기본 정보 섹션
    private var basicInfoSection: some View {
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
    }
    
    // 최근 폼 섹션
    private var recentFormSection: some View {
        VStack(spacing: 16) {
            Text("최근 5경기")
                .font(.headline)
            
            if viewModel.isLoadingForm {
                ProgressView()
                    .padding()
            } else {
                HStack(spacing: 24) {
                    teamFormView(team: fixture.teams.home, form: viewModel.homeTeamForm)
                    teamFormView(team: fixture.teams.away, form: viewModel.awayTeamForm)
                }
                .padding(.horizontal)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
    
    // 팀 폼 뷰
    private func teamFormView(team: Team, form: TeamForm?) -> some View {
        VStack(spacing: 12) {
            AsyncImage(url: URL(string: team.logo)) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt.fill")
                    .foregroundColor(.gray)
            }
            .frame(width: 40, height: 40)
            
            Text(team.name)
                .font(.system(.subheadline, design: .rounded))
                .fontWeight(.medium)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(height: 40)
            
            if let form = form {
                HStack(spacing: 4) {
                    // 각 결과에 고유 ID 부여
                    ForEach(Array(form.results.enumerated()), id: \.offset) { index, result in
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
    
    // 순위 섹션
    private var standingsSection: some View {
        VStack(spacing: 16) {
            Text("현재 순위")
                .font(.headline)
            
            if viewModel.isLoadingStandings {
                ProgressView()
                    .padding()
            } else if !viewModel.standings.isEmpty {
                standingsTableView
            } else {
                Text("순위 정보가 없습니다")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding()
            }
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10)
    }
    
    // 순위 테이블 뷰
    private var standingsTableView: some View {
        VStack(spacing: 0) {
            // 헤더
            standingsTableHeader
            
            // 팀 순위
            ForEach(viewModel.standings) { standing in
                if standing.team.id == fixture.teams.home.id || standing.team.id == fixture.teams.away.id {
                    standingRow(standing: standing)
                }
            }
        }
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color(.systemGray5), lineWidth: 1)
        )
    }
    
    // 순위 테이블 헤더
    private var standingsTableHeader: some View {
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
    }
    
    // 순위 행
    private func standingRow(standing: Standing) -> some View {
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
