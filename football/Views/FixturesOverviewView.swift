import SwiftUI

// MARK: - 배열 확장 (안전한 인덱스 접근)
extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

// MARK: - 경기 일정 로딩 뷰
struct FixturesLoadingView: View {
    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
                .scaleEffect(1.5)
            Text("경기 일정을 불러오는 중...")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - 경기 일정 에러 뷰
struct FixturesErrorView: View {
    let errorMessage: String
    let viewModel: FixturesOverviewViewModel
    let selectedDateIndex: Int
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.orange)
            
            Text(errorMessage)
                .font(.headline)
                .multilineTextAlignment(.center)
                .padding()
            
            // API 제한 오류인 경우 추가 설명 제공
            let isRateLimitError = errorMessage.contains("API 요청 제한") == true
            
            if isRateLimitError {
                VStack {
                    Text("API 서버에서 분당 요청 제한에 도달했습니다. 잠시 후 자동으로 재시도됩니다.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // 진행 상태 표시
                    ProgressView()
                        .padding()
                }
            }
            
            Button(action: {
                Task {
                    // 오류 메시지 초기화
                    viewModel.errorMessage = nil
                    // 현재 선택된 날짜만 다시 로드
                    if let selectedDate = viewModel.dateTabs[safe: selectedDateIndex]?.date {
                        await viewModel.loadFixturesForDate(selectedDate)
                    } else {
                        await viewModel.fetchFixtures()
                    }
                }
            }) {
                Label("다시 시도", systemImage: "arrow.clockwise")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.2), radius: 4, x: 0, y: 2)
            }
            .buttonStyle(PlainButtonStyle())
            .padding(.top, 8)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
        .padding()
    }
}

// MARK: - 경기 일정 날짜 탭 뷰
struct FixturesDateTabsView: View {
    let viewModel: FixturesOverviewViewModel
    @Binding var selectedDateIndex: Int
    
    var body: some View {
        ScrollViewReader { scrollProxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(0..<viewModel.dateTabs.count, id: \.self) { index in
                        Button(action: {
                            withAnimation {
                                selectedDateIndex = index
                                viewModel.selectedDate = viewModel.dateTabs[index].date
                                
                                // 선택된 날짜에 대한 경기 일정 로드
                                Task {
                                    await viewModel.loadFixturesForDate(viewModel.dateTabs[index].date)
                                }
                                
                                // 날짜 범위 업데이트 (필요한 경우)
                                let isNearStart = index < 3
                                let isNearEnd = index > viewModel.dateTabs.count - 4
                                
                                if isNearStart {
                                    // 왼쪽 끝에 가까워지면 과거 날짜 추가
                                    viewModel.extendDateRange(forward: false)
                                } else if isNearEnd {
                                    // 오른쪽 끝에 가까워지면 미래 날짜 추가
                                    viewModel.extendDateRange(forward: true)
                                }
                            }
                        }) {
                            VStack(spacing: 4) {
                                Text(viewModel.dateTabs[index].label)
                                    .font(.subheadline)
                                    .fontWeight(selectedDateIndex == index ? .bold : .regular)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .foregroundColor(selectedDateIndex == index ? .blue : .gray)
                                
                                // 선택 표시 막대
                                Rectangle()
                                    .fill(selectedDateIndex == index ? Color.blue : Color.clear)
                                    .frame(height: 3)
                                    .cornerRadius(1.5)
                            }
                        }
                        .id(index)
                        .overlay {
                            // 로딩 인디케이터
                            if viewModel.loadingDates.contains(viewModel.dateTabs[index].date) {
                                ProgressView()
                                    .scaleEffect(0.7)
                                    .padding(4)
                                    .background(Color(.systemBackground).opacity(0.7))
                                    .cornerRadius(8)
                                    .offset(y: 20)
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .onChange(of: selectedDateIndex) { oldIndex, newIndex in
                    // 선택된 날짜가 변경되면 해당 날짜로 스크롤
                    withAnimation {
                        scrollProxy.scrollTo(newIndex, anchor: .center)
                    }
                }
            }
            .background(Color(.systemBackground))
            .onAppear {
                // 초기 로드 시 오늘 날짜로 스크롤
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    withAnimation {
                        scrollProxy.scrollTo(selectedDateIndex, anchor: .center)
                    }
                }
            }
        }
    }
}

// MARK: - 경기 일정 페이지 탭 뷰
struct FixturesPageTabView: View {
    let viewModel: FixturesOverviewViewModel
    @Binding var selectedDateIndex: Int
    
    var body: some View {
        TabView(selection: $selectedDateIndex) {
            ForEach(0..<viewModel.dateTabs.count, id: \.self) { index in
                FixturePageView(
                    date: viewModel.dateTabs[index].date,
                    viewModel: viewModel,
                    index: index,
                    selectedIndex: selectedDateIndex
                )
                .tag(index)
            }
        }
        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        .onChange(of: selectedDateIndex) { oldValue, newValue in
            // 날짜 범위 업데이트 (필요한 경우)
            if newValue < 3 {
                // 왼쪽 끝에 가까워지면 과거 날짜 추가
                viewModel.extendDateRange(forward: false)
            } else if newValue > viewModel.dateTabs.count - 4 {
                // 오른쪽 끝에 가까워지면 미래 날짜 추가
                viewModel.extendDateRange(forward: true)
            }
        }
    }
}

// MARK: - 경기 일정 컨텐츠 뷰
struct FixturesMainContentView: View {
    let viewModel: FixturesOverviewViewModel
    @Binding var selectedDateIndex: Int
    @State private var isInitialLoad = true
    
    var body: some View {
        ZStack {
            if let errorMessage = viewModel.errorMessage {
                // 에러 상태
                FixturesErrorView(
                    errorMessage: errorMessage,
                    viewModel: viewModel,
                    selectedDateIndex: selectedDateIndex
                )
            } else {
                // 경기 일정 표시
                FixturesPageTabView(
                    viewModel: viewModel,
                    selectedDateIndex: $selectedDateIndex
                )
                .onAppear {
                    // 메인 컨텐츠 뷰가 나타날 때 현재 선택된 날짜에 데이터가 있는지 확인
                    if let selectedDate = viewModel.dateTabs[safe: selectedDateIndex]?.date {
                        let hasData = viewModel.fixtures[selectedDate]?.isEmpty == false
                        
                        let dateFormatter = DateFormatter()
                        dateFormatter.dateFormat = "yyyy-MM-dd"
                        dateFormatter.timeZone = TimeZone.current
                        
                        print("📱 메인 컨텐츠 뷰 등장 - 선택된 날짜: \(dateFormatter.string(from: selectedDate)), 데이터 있음: \(hasData)")
                        
                        // 데이터가 없으면 ViewModel에서 데이터 로드 요청
                        if !hasData {
                            print("📱 메인 컨텐츠 뷰 - 데이터 없음, 데이터 로드 요청")
                            Task {
                                await viewModel.loadFixturesForDate(selectedDate)
                            }
                        }
                        
                        // 초기 로드 완료
                        isInitialLoad = false
                    }
                }
            }
            
            // 로딩 오버레이 (초기 로드 중에만 표시)
            if viewModel.isLoading && isInitialLoad {
                FixturesLoadingView()
                    .background(Color(.systemBackground).opacity(0.8))
                    .transition(.opacity)
            }
        }
    }
}

struct FixturesOverviewView: View {
    @StateObject private var viewModel = FixturesOverviewViewModel()
    @State private var selectedDateIndex = 7 // "오늘" 기본 선택 (14일 중 중앙)
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(.systemGroupedBackground)
                    .edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 0) {
                    // 상단 날짜 탭 (고정)
                    FixturesDateTabsView(viewModel: viewModel, selectedDateIndex: $selectedDateIndex)
                    
                    // 경기 일정 스크롤 뷰
                    FixturesMainContentView(viewModel: viewModel, selectedDateIndex: $selectedDateIndex)
                }
            }
            .navigationTitle("일정")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        Task {
                            await viewModel.fetchFixtures()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
        }
        .task {
            // 선택된 날짜 인덱스 설정 (오늘 날짜에 해당하는 인덱스)
            let todayLabel = "오늘"
            let todayIndex = viewModel.dateTabs.firstIndex { tab in
                viewModel.getLabelForDate(tab.date) == todayLabel
            }
            
            if let todayIndex = todayIndex {
                // 오늘 날짜 정보 확인
                let today = viewModel.dateTabs[todayIndex].date
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                dateFormatter.timeZone = TimeZone.current
                
                print("📱 View Task - 오늘 날짜: \(dateFormatter.string(from: today))")
                print("📱 View Task - 오늘 인덱스: \(todayIndex), 선택된 인덱스: \(selectedDateIndex)")
                
                // 선택된 인덱스 설정 (중요: 데이터 로드 전에 설정)
                selectedDateIndex = todayIndex
                print("📱 View Task - 선택된 인덱스를 오늘로 설정: \(todayIndex)")
                
                // 데이터 상태 확인
                let hasData = viewModel.fixtures[today]?.isEmpty == false
                print("📱 View Task - 오늘 날짜 데이터 상태: \(hasData ? "데이터 있음" : "데이터 없음")")
                
                if hasData {
                    print("📱 View Task - 오늘 날짜 데이터 있음: \(viewModel.fixtures[today]?.count ?? 0)개")
                } else {
                    // 데이터가 없는 경우에만 로드 요청 (ViewModel의 init에서 이미 처리했을 가능성이 높음)
                    print("📱 View Task - 오늘 날짜 데이터 없음, 데이터 로드 요청")
                    await viewModel.loadFixturesForDate(today)
                }
            }
            
            // 다른 날짜들의 데이터 로드는 백그라운드에서 진행
            Task {
                await viewModel.fetchFixtures()
            }
        }
    }
}

// MARK: - 경기 페이지 뷰
struct FixturePageView: View {
    let date: Date
    let viewModel: FixturesOverviewViewModel
    let index: Int
    let selectedIndex: Int
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                // 즐겨찾기 팀 일정
                let favoriteFixtures: [Fixture] = {
                    guard let fixturesForDate = viewModel.fixtures[date] else { return [] }
                    
                    // 팀 즐겨찾기 필터링
                    let teamFavorites = FavoriteService.shared.getFavorites(type: .team)
                    
                    return fixturesForDate.filter { fixture in
                        teamFavorites.contains { favorite in
                            favorite.entityId == fixture.teams.home.id || favorite.entityId == fixture.teams.away.id
                        }
                    }
                }()
                
                if !favoriteFixtures.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                            Text("팔로잉")
                                .font(.headline)
                        }
                        .padding(.top, 16)
                        
                        ForEach(favoriteFixtures) { fixture in
                            FixtureCardView(fixture: fixture, viewModel: viewModel)
                                .padding(.vertical, 4)
                        }
                    }
                    
                    Divider()
                        .padding(.vertical, 8)
                }
                
                // 리그별 일정 (우선순위 순서대로)
                let prioritizedLeagues = [39, 140, 135, 78, 2, 3]
                ForEach(prioritizedLeagues, id: \.self) { leagueId in
                    let leagueFixtures: [Fixture] = {
                        guard let fixturesForDate = viewModel.fixtures[date] else { return [] }
                        
                        // 즐겨찾기 팀 경기는 제외
                        let nonFavoriteFixtures = fixturesForDate.filter { fixture in
                            !favoriteFixtures.contains(fixture)
                        }
                        
                        // 특정 리그의 경기만 필터링
                        return nonFavoriteFixtures.filter { $0.league.id == leagueId }
                    }()
                    
                    if !leagueFixtures.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "trophy")
                                    .foregroundColor(.blue)
                                // 리그 이름 표시
                                let leagueName: String = {
                                    switch leagueId {
                                    case 39: return "프리미어 리그"
                                    case 140: return "라리가"
                                    case 135: return "세리에 A"
                                    case 78: return "분데스리가"
                                    case 2: return "챔피언스 리그"
                                    case 3: return "유로파 리그"
                                    default: return "리그 \(leagueId)"
                                    }
                                }()
                                
                                Text(leagueName)
                                    .font(.headline)
                            }
                            .padding(.top, 8)
                            
                            ForEach(leagueFixtures) { fixture in
                                FixtureCardView(fixture: fixture, viewModel: viewModel)
                                    .padding(.vertical, 4)
                            }
                        }
                        
                        Divider()
                            .padding(.vertical, 8)
                    }
                }
                
                // 경기 일정 표시 로직 개선
                let hasFixtures = !(viewModel.fixtures[date]?.isEmpty ?? true)
                let isLoading = viewModel.loadingDates.contains(date)
                
                if !hasFixtures {
                    if isLoading {
                        // 로딩 중
                        VStack(spacing: 12) {
                            ProgressView()
                                .scaleEffect(1.2)
                            Text("경기 일정을 불러오는 중...")
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 50)
                    } else {
                        // 경기 없음
                        VStack(spacing: 12) {
                            Image(systemName: "calendar.badge.exclamationmark")
                                .font(.system(size: 40))
                                .foregroundColor(.gray)
                                .padding(.bottom, 8)
                            
                            Text("경기 일정이 없습니다")
                                .font(.headline)
                                .foregroundColor(.gray)
                            
                            Button(action: {
                                Task {
                                    await viewModel.loadFixturesForDate(date)
                                }
                            }) {
                                Text("새로고침")
                                    .font(.subheadline)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                            .padding(.top, 12)
                        }
                        .padding(.top, 50)
                        .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .onAppear {
            // 현재 페이지가 선택된 경우에만 데이터 로드 시도
            if index == selectedIndex {
                // 데이터가 없거나 비어있는 경우에만 로드
                let hasData = viewModel.fixtures[date]?.isEmpty == false
                let isLoading = viewModel.loadingDates.contains(date)
                
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                dateFormatter.timeZone = TimeZone.current
                
                print("📱 페이지 등장 - 날짜: \(dateFormatter.string(from: date)), 인덱스: \(index), 선택된 인덱스: \(selectedIndex)")
                print("📱 페이지 등장 - 데이터 있음: \(hasData), 로딩 중: \(isLoading)")
                
                // 데이터가 없는 경우 처리
                if !hasData {
                    if !isLoading {
                        print("📱 페이지 등장 시 데이터 로드: \(dateFormatter.string(from: date))")
                        Task {
                            // 실제 API에서 데이터 로드
                            await viewModel.loadFixturesForDate(date)
                            
                            // 데이터 로드 후 상태 확인
                            await MainActor.run {
                                let hasDataAfterLoad = viewModel.fixtures[date]?.isEmpty == false
                                print("📱 페이지 등장 - 데이터 로드 후 상태: \(hasDataAfterLoad ? "데이터 있음" : "데이터 없음")")
                                
                                // 데이터 로드 후에도 데이터가 없으면 영어 팀명으로 테스트 데이터 생성
                                if !hasDataAfterLoad {
                                    print("📱 페이지 등장 - 데이터 로드 후에도 데이터 없음, 영어 팀명으로 테스트 데이터 생성")
                                    let testFixtures = viewModel.createEnglishTeamTestFixtures(for: date)
                                    viewModel.fixtures[date] = testFixtures
                                }
                            }
                        }
                    } else {
                        print("📱 페이지 등장: 로딩 중 - \(dateFormatter.string(from: date))")
                        
                        // 로딩 중이지만 데이터가 없는 경우, 잠시 대기 후 확인
                        Task {
                            // 잠시 대기 후 데이터 확인
                            try? await Task.sleep(nanoseconds: 500_000_000) // 0.5초 대기
                            
                            await MainActor.run {
                                if viewModel.fixtures[date] == nil || viewModel.fixtures[date]!.isEmpty {
                                    print("📱 페이지 등장 - 로딩 중이지만 데이터 없음, 영어 팀명으로 테스트 데이터 생성")
                                    let testFixtures = viewModel.createEnglishTeamTestFixtures(for: date)
                                    viewModel.fixtures[date] = testFixtures
                                }
                            }
                        }
                    }
                } else {
                    print("📱 페이지 등장: 이미 데이터 있음 - \(dateFormatter.string(from: date))")
                }
            }
        }
    }
}


// MARK: - 경기 카드 뷰
struct FixtureCardView: View {
    let fixture: Fixture
    let viewModel: FixturesOverviewViewModel
    
    var body: some View {
        NavigationLink(destination: FixtureDetailView(fixture: fixture)) {
            VStack(spacing: 12) {
                // 시간과 상태
                HStack {
                    // 시간 포맷팅
                    Text(formatTime(fixture.fixture.date))
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    Spacer()
                    
                    // 경기 상태 텍스트
                    Text(getMatchStatus(fixture.fixture.status))
                        .font(.caption)
                        .foregroundColor(getStatusColor(fixture.fixture.status.short))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(getStatusColor(fixture.fixture.status.short).opacity(0.1))
                        .cornerRadius(4)
                }
                
                // 팀 정보
                HStack {
                    // 홈팀
                    FixtureTeamView(team: fixture.teams.home)
                    
                    // 스코어
                    ScoreView(
                        homeScore: fixture.goals?.home,
                        awayScore: fixture.goals?.away,
                        isLive: fixture.fixture.status.short == "1H" || fixture.fixture.status.short == "2H",
                        elapsed: fixture.fixture.status.elapsed
                    )
                    
                    // 원정팀
                    FixtureTeamView(team: fixture.teams.away)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }
    
    // 시간 포맷팅 메서드
    private func formatTime(_ dateString: String) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
        
        guard let date = dateFormatter.date(from: dateString) else {
            return dateString
        }
        
        dateFormatter.dateFormat = "HH:mm"
        return dateFormatter.string(from: date)
    }
    
    // 경기 상태 텍스트 메서드
    private func getMatchStatus(_ status: FixtureStatus) -> String {
        switch status.short {
        case "1H":
            return "전반전 \(status.elapsed ?? 0)'"
        case "2H":
            return "후반전 \(status.elapsed ?? 0)'"
        case "HT":
            return "하프타임"
        case "ET":
            return "연장전"
        case "P":
            return "승부차기"
        case "FT":
            return "경기 종료"
        case "NS":
            return "경기 예정"
        default:
            return status.long
        }
    }
    
    private func getStatusColor(_ status: String) -> Color {
        switch status {
        case "1H", "2H", "HT":
            return Color.red
        case "FT":
            return Color.green
        case "NS":
            return Color.blue
        default:
            return Color.gray
        }
    }
}

// MARK: - 팀 정보 뷰 (간소화 버전)
struct FixtureTeamView: View {
    let team: Team
    
    var body: some View {
        VStack(spacing: 8) {
            AsyncImage(url: URL(string: team.logo)) { image in
                image
                    .resizable()
                    .scaledToFit()
            } placeholder: {
                Image(systemName: "sportscourt")
                    .foregroundColor(.gray)
            }
            .frame(width: 30, height: 30)
            
            Text(team.name)
                .font(.caption)
                .lineLimit(1)
                .frame(width: 100)
        }
    }
}

// MARK: - 스코어 뷰
struct ScoreView: View {
    let homeScore: Int?
    let awayScore: Int?
    let isLive: Bool
    let elapsed: Int?
    
    var body: some View {
        VStack(spacing: 4) {
            if isLive, let elapsed = elapsed {
                Text("\(elapsed)'")
                    .font(.caption)
                    .foregroundColor(.red)
            }
            
            HStack(spacing: 8) {
                Text(homeScore?.description ?? "-")
                Text(":")
                Text(awayScore?.description ?? "-")
            }
            .font(.title3.bold())
        }
        .frame(width: 60)
    }
}

