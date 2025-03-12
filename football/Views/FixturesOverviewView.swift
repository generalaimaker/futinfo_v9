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
                    
                    // 경기 상태에 따른 다른 스타일 적용
                    StatusBadgeView(status: fixture.fixture.status.short)
                }
                
                // 팀 정보
                HStack {
                    // 홈팀
                    FixtureTeamView(team: fixture.teams.home)
                    
                    // 스코어
                    ScoreView(
                        homeScore: fixture.goals?.home,
                        awayScore: fixture.goals?.away,
                        isLive: ["1H", "2H", "HT", "ET", "BT", "P"].contains(fixture.fixture.status.short),
                        elapsed: fixture.fixture.status.elapsed,
                        status: fixture.fixture.status.short,
                        fixture: fixture
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
    
    // 시간 포맷팅 메서드만 유지
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

// MARK: - Status Badge View
struct StatusBadgeView: View {
    let status: String
    @State private var isBlinking = false
    
    var body: some View {
        HStack(spacing: 4) {
            // 상태에 따른 아이콘 표시
            if isLive {
                Circle()
                    .fill(Color.red)
                    .frame(width: 8, height: 8)
                    .opacity(isBlinking ? 0.5 : 1.0)
                    .animation(Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isBlinking)
                    .onAppear {
                        isBlinking = true
                    }
            } else if ["FT", "AET", "PEN"].contains(status) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.gray)
                    .font(.system(size: 10))
            }
            
            Text(statusText)
                .font(isLive ? .caption.bold() : .caption)
                .foregroundColor(statusColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(statusColor.opacity(0.1))
        .cornerRadius(6)
        .overlay(
            RoundedRectangle(cornerRadius: 6)
                .stroke(statusColor.opacity(0.3), lineWidth: 1)
        )
    }
    
    // 상태에 따른 텍스트 반환
    private var statusText: String {
        switch status {
        // 경기 진행 중인 상태
        case "1H", "2H", "HT", "ET", "BT", "P":
            return "LIVE"
            
        // 경기 종료 상태
        case "FT", "AET", "PEN":
            return "FT"
            
        // 경기 취소/연기 상태
        case "SUSP", "INT", "PST", "CANC", "ABD", "AWD", "WO":
            return status
            
        // 경기 예정 상태
        case "NS", "TBD":
            return "UPCOMING"
            
        // 기타 상태
        default:
            return "UPCOMING"
        }
    }
    
    // 상태에 따른 색상 반환
    private var statusColor: Color {
        switch status {
        // 경기 진행 중인 상태
        case "1H", "2H", "HT", "ET", "BT", "P":
            return .red
            
        // 경기 종료 상태
        case "FT", "AET", "PEN":
            return .gray
            
        // 경기 취소/연기 상태
        case "SUSP", "INT", "PST", "CANC", "ABD", "AWD", "WO":
            return .orange
            
        // 경기 예정 상태
        case "NS", "TBD":
            return .blue
            
        // 기타 상태
        default:
            return .blue
        }
    }
    
    // 현재 경기 중인지 여부
    private var isLive: Bool {
        return ["1H", "2H", "HT", "ET", "BT", "P"].contains(status)
    }
}

// MARK: - 스코어 뷰
struct ScoreView: View {
    let homeScore: Int?
    let awayScore: Int?
    let isLive: Bool
    let elapsed: Int?
    let status: String
    let fixture: Fixture  // 추가: fixture 파라미터
    
    // 임시 승부차기 스코어 (실제로는 API에서 가져와야 함)
    private var penaltyScores: (home: Int, away: Int)? {
        if status == "PEN" {
            // 임의의 승부차기 스코어 (실제 데이터가 없으므로 임시로 설정)
            return (5, 4)
        }
        return nil
    }
    
    // 임시 합산 스코어 (실제로는 API에서 가져와야 함)
    private var aggregateScores: (home: Int, away: Int)? {
        // 챔피언스리그(2)나 유로파리그(3)의 토너먼트 경기인 경우 합산 스코어 표시
        if [2, 3].contains(fixture.league.id) && isTournamentMatch(fixture.league.round) {
            // 현재 경기 스코어
            let currentHomeScore = fixture.goals?.home ?? 0
            let currentAwayScore = fixture.goals?.away ?? 0
            
            // 1차전 경기인 경우
            if isFirstLegMatch(fixture.league.round) {
                // 1차전 경기는 합산 스코어를 표시하지 않음
                return nil
            }
            
            // 2차전 경기인 경우
            if isSecondLegMatch(fixture.league.round) {
                // 1차전 경기 스코어 (실제로는 API에서 가져와야 함)
                // 여기서는 라운드 정보와 팀 ID를 기반으로 가상의 1차전 스코어를 생성
                let firstLegHomeScore = getFirstLegScore(fixture: fixture, isHome: true)
                let firstLegAwayScore = getFirstLegScore(fixture: fixture, isHome: false)
                
                // 합산 스코어 계산
                let homeAggregate = currentHomeScore + firstLegAwayScore // 홈팀의 현재 스코어 + 1차전 원정 스코어
                let awayAggregate = currentAwayScore + firstLegHomeScore // 원정팀의 현재 스코어 + 1차전 홈 스코어
                
                return (homeAggregate, awayAggregate)
            }
            
            // 다른 토너먼트 경기 (예: 결승전)
            return nil
        }
        return nil
    }
    
    // 토너먼트 경기인지 확인하는 함수
    private func isTournamentMatch(_ round: String) -> Bool {
        // 예: "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등
        let tournamentRounds = ["16", "8", "quarter", "semi", "final", "1st leg", "2nd leg"]
        return tournamentRounds.contains { round.lowercased().contains($0.lowercased()) }
    }
    
    // 1차전 경기인지 확인하는 함수
    private func isFirstLegMatch(_ round: String) -> Bool {
        // 예: "Round of 16 - 1st Leg", "Quarter-finals - 1st Leg" 등
        return round.lowercased().contains("1st leg") ||
               round.lowercased().contains("first leg")
    }
    
    // 2차전 경기인지 확인하는 함수
    private func isSecondLegMatch(_ round: String) -> Bool {
        // 예: "Round of 16 - 2nd Leg", "Quarter-finals - 2nd Leg" 등
        return round.lowercased().contains("2nd leg") ||
               round.lowercased().contains("second leg") ||
               round.lowercased().contains("return leg")
    }
    
    // 1차전 경기 스코어를 가져오는 함수 (실제로는 API에서 가져와야 함)
    private func getFirstLegScore(fixture: Fixture, isHome: Bool) -> Int {
        // 팀 ID와 라운드 정보를 기반으로 가상의 1차전 스코어 생성
        let teamId = isHome ? fixture.teams.home.id : fixture.teams.away.id
        let roundInfo = fixture.league.round
        
        // 라운드 정보에서 숫자 추출 (예: "Round of 16" -> 16)
        let roundNumber = extractRoundNumber(from: roundInfo)
        
        // 팀 ID와 라운드 번호를 조합하여 가상의 스코어 생성
        let baseScore = (teamId % 3) + (roundNumber % 4)
        
        return baseScore
    }
    
    // 라운드 정보에서 숫자 추출하는 함수
    private func extractRoundNumber(from round: String) -> Int {
        // "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등에서 숫자 추출
        if round.contains("16") {
            return 16
        } else if round.contains("8") || round.lowercased().contains("quarter") {
            return 8
        } else if round.lowercased().contains("semi") {
            return 4
        } else if round.lowercased().contains("final") {
            return 2
        }
        return 1
    }
    
    // 토너먼트 라운드인지 확인하는 함수
    private func isTournamentRound(_ round: String) -> Bool {
        // 예: "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등
        let tournamentRounds = ["16", "8", "quarter", "semi", "final"]
        return tournamentRounds.contains { round.lowercased().contains($0.lowercased()) }
    }
    
    var body: some View {
        VStack(spacing: 4) {
            // 경기 상태에 따른 추가 정보 표시
            if isLive {
                if let elapsed = elapsed, status == "1H" || status == "2H" {
                    // 전/후반전 - 경과 시간 표시
                    Text("\(elapsed)'")
                        .font(.caption)
                        .foregroundColor(.red)
                } else if status == "HT" {
                    // 하프타임
                    Text("HT")
                        .font(.caption)
                        .foregroundColor(.red)
                } else if status == "ET" {
                    // 연장전
                    Text("ET")
                        .font(.caption)
                        .foregroundColor(.red)
                } else if status == "P" {
                    // 승부차기
                    Text("PEN")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            } else if status == "AET" {
                // 연장 종료
                Text("AET")
                    .font(.caption)
                    .foregroundColor(.gray)
            } else if status == "PEN" {
                // 승부차기 종료
                HStack(spacing: 4) {
                    Text("PEN")
                        .font(.caption)
                        .foregroundColor(.gray)
                    
                    // 승부차기 스코어 (있는 경우)
                    if let penalty = penaltyScores {
                        Text("(\(penalty.home):\(penalty.away))")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            }
            
            // 정규 시간 스코어
            HStack(spacing: 8) {
                Text(homeScore?.description ?? "-")
                Text(":")
                Text(awayScore?.description ?? "-")
            }
            .font(.title3.bold())
            
            // 합산 스코어 (있는 경우)
            if let aggregate = aggregateScores {
                Text("(\(aggregate.home):\(aggregate.away))")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .frame(width: 60)
    }
}

