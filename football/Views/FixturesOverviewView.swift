import SwiftUI
#if canImport(TeamAbbreviations)
import TeamAbbreviations
#endif

// MARK: - 배열 확장 (안전한 인덱스 접근)
extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

// MARK: - 경기 일정 로딩 뷰
struct FixturesLoadingView: View {
    @State private var loadingText = "경기 일정을 불러오는 중"
    @State private var dotCount = 0
    
    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
                .scaleEffect(1.5)
            
            Text("\(loadingText)\(String(repeating: ".", count: dotCount))")
                .foregroundColor(.secondary)
                .animation(.easeInOut, value: dotCount)
                .onAppear {
                    // 로딩 애니메이션 시작
                    startLoadingAnimation()
                }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func startLoadingAnimation() {
        // 로딩 애니메이션 타이머
        let timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            withAnimation {
                dotCount = (dotCount + 1) % 4
            }
        }
        
        // 뷰가 사라질 때 타이머 정리
        RunLoop.current.add(timer, forMode: .common)
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
                                    // 1. 현재 선택된 날짜 로드 (오늘 날짜이거나 라이브 경기가 있는 경우 강제 새로고침)
                                    let today = Calendar.current.startOfDay(for: Date())
                                    let selectedDate = viewModel.dateTabs[index].date
                                    let isToday = Calendar.current.isDate(selectedDate, inSameDayAs: today)
                                    
                                    // 라이브 경기가 있는지 확인
                                    let hasLiveMatches = viewModel.fixtures[selectedDate]?.contains { fixture in
                                        ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"].contains(fixture.fixture.status.short)
                                    } ?? false
                                    
                                    // 오늘 날짜이거나 라이브 경기가 있는 경우 강제 새로고침
                                    let forceRefresh = isToday || hasLiveMatches
                                    
                                    print("📱 날짜 탭 선택 - 날짜: \(viewModel.formatDateForAPI(selectedDate)), 오늘 여부: \(isToday), 라이브 경기: \(hasLiveMatches), 강제 새로고침: \(forceRefresh)")
                                    
                                    // 선택된 날짜 로드
                                    await viewModel.loadFixturesForDate(selectedDate, forceRefresh: forceRefresh)
                                    
                                    // 2. 다음 날짜들의 경기 일정도 미리 로드 (UX 향상)
                                    if index + 1 < viewModel.dateTabs.count {
                                        // 다음 날짜 로드
                                        await viewModel.loadFixturesForDate(viewModel.dateTabs[index + 1].date)
                                        
                                        // 그 다음 날짜도 로드
                                        if index + 2 < viewModel.dateTabs.count {
                                            await viewModel.loadFixturesForDate(viewModel.dateTabs[index + 2].date)
                                        }
                                    }
                                    
                                    // 3. 이전 날짜도 미리 로드 (뒤로 가기 UX 향상)
                                    if index > 0 {
                                        await viewModel.loadFixturesForDate(viewModel.dateTabs[index - 1].date)
                                    }
                                }
                                
                                // 날짜 범위 업데이트 (필요한 경우)
                                let isNearStart = index < 3
                                let isNearEnd = index > viewModel.dateTabs.count - 4
                                
                                if isNearStart {
                                    // 왼쪽 끝에 가까워지면 과거 날짜 추가
                                    print("📱 FixturesDateTabsView - 과거 날짜 추가 (인덱스: \(index))")
                                    viewModel.extendDateRange(forward: false)
                                } else if isNearEnd {
                                    // 오른쪽 끝에 가까워지면 미래 날짜 추가
                                    print("📱 FixturesDateTabsView - 미래 날짜 추가 (인덱스: \(index))")
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
            // 날짜 범위 업데이트는 FixturesDateTabsView에서만 처리하도록 수정
            // 중복 호출 방지를 위해 이 부분 제거
            
            // 선택된 날짜가 변경되면 경기 일정 로드 (UX 향상)
            Task {
                // 1. 현재 선택된 날짜 로드 (오늘 날짜이거나 라이브 경기가 있는 경우 강제 새로고침)
                let today = Calendar.current.startOfDay(for: Date())
                let selectedDate = viewModel.dateTabs[newValue].date
                let isToday = Calendar.current.isDate(selectedDate, inSameDayAs: today)
                
                // 라이브 경기가 있는지 확인
                let hasLiveMatches = viewModel.fixtures[selectedDate]?.contains { fixture in
                    ["1H", "2H", "HT", "ET", "P", "BT", "LIVE"].contains(fixture.fixture.status.short)
                } ?? false
                
                // 오늘 날짜이거나 라이브 경기가 있는 경우 강제 새로고침
                let forceRefresh = isToday || hasLiveMatches
                
                print("📱 페이지 탭 변경 - 날짜: \(viewModel.formatDateForAPI(selectedDate)), 오늘 여부: \(isToday), 라이브 경기: \(hasLiveMatches), 강제 새로고침: \(forceRefresh)")
                
                // 선택된 날짜 로드
                await viewModel.loadFixturesForDate(selectedDate, forceRefresh: forceRefresh)
                
                // 2. 다음 날짜들의 경기 일정 미리 로드
                if newValue + 1 < viewModel.dateTabs.count {
                    // 다음 날짜 로드
                    await viewModel.loadFixturesForDate(viewModel.dateTabs[newValue + 1].date)
                    
                    // 그 다음 날짜도 로드
                    if newValue + 2 < viewModel.dateTabs.count {
                        await viewModel.loadFixturesForDate(viewModel.dateTabs[newValue + 2].date)
                    }
                }
                
                // 3. 이전 날짜도 미리 로드 (뒤로 가기 UX 향상)
                if newValue > 0 {
                    await viewModel.loadFixturesForDate(viewModel.dateTabs[newValue - 1].date)
                }
            }
        }
    }
}

// MARK: - 경기 일정 컨텐츠 뷰
struct FixturesMainContentView: View {
    let viewModel: FixturesOverviewViewModel
    @Binding var selectedDateIndex: Int
    @State private var isInitialLoad = true
    @State private var showSkeleton = false
    
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
                        
                        // 데이터가 없으면 스켈레톤 UI 표시
                        if !hasData {
                            showSkeleton = true
                            
                            // ViewModel에서 데이터 로드 요청
                            Task {
                                await viewModel.loadFixturesForDate(selectedDate)
                                // 데이터 로드 완료 후 스켈레톤 UI 숨김
                                showSkeleton = false
                            }
                        }
                        
                        // 초기 로드 완료
                        isInitialLoad = false
                    }
                    
                    // 경기 일정 로딩 완료 알림 관찰자 등록
                    _ = NotificationCenter.default.addObserver(
                        forName: NSNotification.Name("FixturesLoadingCompleted"),
                        object: nil,
                        queue: .main
                    ) { notification in
                        if let userInfo = notification.userInfo,
                           let loadedDate = userInfo["date"] as? Date {
                            // 날짜 포맷팅은 로그에서 생략 (MainActor 격리 문제 해결)
                            print("📣 FixturesMainContentView - 경기 일정 로딩 완료 알림 수신")
                            
                            // 강제 업데이트 플래그 확인
                            let forceUpdate = userInfo["forceUpdate"] as? Bool ?? false
                            let hasError = userInfo["error"] as? Bool ?? false
                            
                            print("📣 알림 세부 정보 - 강제 업데이트: \(forceUpdate), 오류: \(hasError)")
                            
                            // 현재 선택된 날짜와 동일한 경우 스켈레톤 UI 숨김
                            // MainActor 격리 문제를 해결하기 위해 Task 내에서 처리
                            Task { @MainActor in
                                if let selectedDate = viewModel.dateTabs[safe: selectedDateIndex]?.date,
                                   Calendar.current.isDate(loadedDate, inSameDayAs: selectedDate) {
                                    withAnimation {
                                        showSkeleton = false
                                    }
                                    
                                    // Pull-to-Refresh, 앱 포그라운드, 초기 로드 플래그 확인
                                    let isPullToRefresh = userInfo["pullToRefresh"] as? Bool ?? false
                                    let isAppForeground = userInfo["appForeground"] as? Bool ?? false
                                    let isInitialLoad = userInfo["initialLoad"] as? Bool ?? false
                                    
                                    // 강제 업데이트, Pull-to-Refresh, 앱 포그라운드 또는 초기 로드인 경우 UI 새로고침 트리거
                                    if forceUpdate || isPullToRefresh || isAppForeground || isInitialLoad {
                                        print("🔄 강제 UI 업데이트 트리거 (forceUpdate: \(forceUpdate), pullToRefresh: \(isPullToRefresh), appForeground: \(isAppForeground), initialLoad: \(isInitialLoad))")
                                        // 지연 시간 단축 및 UI 업데이트 메커니즘 개선
                                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                                            // 임시 변수를 사용하여 강제 UI 업데이트
                                            let tempDate = selectedDate
                                            viewModel.selectedDate = Calendar.current.date(byAdding: .second, value: 1, to: tempDate) ?? tempDate
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                                                viewModel.selectedDate = tempDate
                                                // 추가 UI 새로고침 트리거
                                                viewModel.objectWillChange.send()
                                                
                                                // Pull-to-Refresh, 앱 포그라운드 또는 초기 로드인 경우 추가 처리
                                                if isPullToRefresh || isAppForeground || isInitialLoad {
                                                    print("🔄 Pull-to-Refresh/앱 포그라운드/초기 로드 완료 - 추가 UI 업데이트")
                                                    // 현재 표시된 경기 목록 강제 새로고침
                                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                                        viewModel.objectWillChange.send()
                                                        
                                                        // 앱 포그라운드 또는 초기 로드인 경우 추가 지연 업데이트 (데이터가 완전히 로드될 때까지 기다림)
                                                        if isAppForeground || isInitialLoad {
                                                            print("🔄 앱 포그라운드/초기 로드 - 추가 지연 업데이트")
                                                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                                                                viewModel.objectWillChange.send()
                                                                
                                                                // 알림 발송 (UI 업데이트를 위해)
                                                                NotificationCenter.default.post(
                                                                    name: NSNotification.Name("FixturesLoadingCompleted"),
                                                                    object: nil,
                                                                    userInfo: ["date": selectedDate, "forceUpdate": true]
                                                                )
                                                                
                                                                // 초기 로드인 경우 추가 지연 업데이트 (더 긴 지연)
                                                                if isInitialLoad {
                                                                    print("🔄 초기 로드 - 추가 지연 업데이트 (더 긴 지연)")
                                                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                                                                        viewModel.objectWillChange.send()
                                                                        
                                                                        // 알림 발송 (UI 업데이트를 위해)
                                                                        NotificationCenter.default.post(
                                                                            name: NSNotification.Name("FixturesLoadingCompleted"),
                                                                            object: nil,
                                                                            userInfo: ["date": selectedDate, "forceUpdate": true]
                                                                        )
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // 관찰자 정리를 위해 onDisappear에서 사용할 수 있도록 저장
                    Task { @MainActor in
                        // 이 뷰에 대한 관찰자 저장 (구현 필요)
                        // 여기서는 간단히 로그만 출력
                        print("📣 경기 일정 로딩 완료 알림 관찰자 등록 완료")
                    }
                }
                .onDisappear {
                    // 알림 관찰자 제거
                    NotificationCenter.default.removeObserver(
                        self,
                        name: NSNotification.Name("FixturesLoadingCompleted"),
                        object: nil
                    )
                }
                .onChange(of: selectedDateIndex) { oldValue, newValue in
                    // 날짜 변경 시 데이터 확인
                    if let selectedDate = viewModel.dateTabs[safe: newValue]?.date {
                        let hasData = viewModel.fixtures[selectedDate]?.isEmpty == false
                        
                        // 데이터가 없으면 스켈레톤 UI 표시
                        if !hasData {
                            showSkeleton = true
                            
                            // ViewModel에서 데이터 로드 요청
                            Task {
                                await viewModel.loadFixturesForDate(selectedDate)
                                // 데이터 로드 완료 후 스켈레톤 UI 숨김
                                showSkeleton = false
                            }
                        }
                    }
                }
            }
            
            // 로딩 오버레이 (초기 로드 중이거나 스켈레톤 UI 표시 중일 때만 표시)
            if (viewModel.isLoading && isInitialLoad) || showSkeleton {
                // 스켈레톤 UI로 대체하여 더 나은 사용자 경험 제공
                ZStack {
                    FixtureSkeletonView()
                        .padding(.horizontal)
                        .background(Color(.systemBackground).opacity(0.9))
                        .transition(.opacity)
                    
                    // 5초 이상 로딩 중이면 메시지 표시
                    if showSkeleton {
                        VStack {
                            Spacer()
                            Text("데이터를 불러오는 중입니다...")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding()
                                .background(Color(.systemBackground).opacity(0.8))
                                .cornerRadius(8)
                                .padding(.bottom, 20)
                        }
                        .transition(.opacity)
                    }
                }
                .onAppear {
                    // 스켈레톤 UI가 표시된 후 5초 이상 지속되면 메시지 표시
                    DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                        withAnimation {
                            if showSkeleton {
                                print("⏱️ 스켈레톤 UI 5초 타임아웃 - 메시지 표시")
                            }
                        }
                    }
                    
                    // 스켈레톤 UI가 표시된 후 7초 이상 지속되면 자동으로 숨김 처리 (10초에서 7초로 단축)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 7) {
                        withAnimation {
                            if showSkeleton {
                                print("⏱️ 스켈레톤 UI 자동 숨김 처리 (10초 타임아웃)")
                                showSkeleton = false
                                
                                // 빈 응답 메시지 설정 (API 응답이 없는 경우)
                                if let selectedDate = viewModel.dateTabs[safe: selectedDateIndex]?.date,
                                   viewModel.fixtures[selectedDate]?.isEmpty ?? true,
                                   viewModel.emptyDates[selectedDate] == nil {
                                    viewModel.emptyDates[selectedDate] = "해당일에 예정된 경기가 없습니다"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

struct FixturesOverviewView: View {
    @StateObject private var viewModel = FixturesOverviewViewModel()
    @State private var selectedDateIndex = 5 // "오늘" 기본 선택 (10일 중 중앙)
    @State private var navigateToTeamProfile: Bool = false
    @State private var selectedTeamId: Int = 0
    @State private var selectedTeamLeagueId: Int = 0
    
    // 선수 프로필 네비게이션 상태
    @State private var navigateToPlayerProfile: Bool = false
    @State private var selectedPlayerId: Int = 0
    
    var body: some View {
        NavigationStack {
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
                    HStack(spacing: 16) {
                        // 검색 버튼
                        NavigationLink(destination: SearchView()) {
                            Image(systemName: "magnifyingglass")
                        }
                        
                        // 새로고침 버튼
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
        }
        .task {
            // 선택된 날짜 인덱스 설정 (오늘 날짜에 해당하는 인덱스)
            let todayLabel = "오늘"
            let todayIndex = viewModel.dateTabs.firstIndex { tab in
                viewModel.getLabelForDate(tab.date) == todayLabel
            }
            
            // 1. 라이브 경기 데이터 강제 새로고침 (앱 시작 시 최우선)
            print("📱 View Task - 라이브 경기 데이터 강제 새로고침")
            NotificationCenter.default.post(
                name: NSNotification.Name("StartLivePolling"),
                object: nil,
                userInfo: ["forceRefresh": true]
            )
            
            // 2. 오늘 날짜 데이터 처리
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
                
                // 항상 최신 데이터로 강제 새로고침 (라이브 경기 포함)
                print("📱 View Task - 앱 시작 시 최신 데이터로 강제 새로고침")
                await viewModel.loadFixturesForDate(today, forceRefresh: true)
                
                // 3. 강제 UI 업데이트 트리거
                DispatchQueue.main.async {
                    // 임시 변수를 사용하여 강제 UI 업데이트
                    let tempDate = today
                    viewModel.selectedDate = Calendar.current.date(byAdding: .second, value: 1, to: tempDate) ?? tempDate
                    
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                        viewModel.selectedDate = tempDate
                        // 추가 UI 새로고침 트리거
                        viewModel.objectWillChange.send()
                        
                        // 알림 발송 (UI 업데이트를 위해)
                        NotificationCenter.default.post(
                            name: NSNotification.Name("FixturesLoadingCompleted"),
                            object: nil,
                            userInfo: ["date": today, "forceUpdate": true, "initialLoad": true]
                        )
                        
                        print("🔄 앱 시작 시 강제 UI 업데이트 트리거")
                    }
                }
            }
            
            // 다른 날짜들의 데이터 로드는 백그라운드에서 진행
            Task {
                await viewModel.fetchFixtures()
            }
        }
        .onAppear {
            // LiveMatchService 폴링 재시작 알림 발송 (탭 전환 시 데이터 업데이트를 위해)
            print("📱 FixturesOverviewView - 화면에 나타남, LiveMatchService 폴링 재시작 알림 발송")
            NotificationCenter.default.post(
                name: NSNotification.Name("StartLivePolling"),
                object: nil
            )
            
            // 현재 선택된 날짜 데이터 강제 새로고침
            Task {
                if let selectedDate = viewModel.dateTabs[safe: selectedDateIndex]?.date {
                    print("📱 FixturesOverviewView - 현재 선택된 날짜 데이터 강제 새로고침")
                    await viewModel.loadFixturesForDate(selectedDate, forceRefresh: true)
                }
            }
            
            // NotificationCenter 관찰자 등록
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ShowTeamProfile"), object: nil, queue: .main) { notification in
                if let userInfo = notification.userInfo,
                   let teamId = userInfo["teamId"] as? Int,
                   let leagueId = userInfo["leagueId"] as? Int {
                    print("📣 FixturesOverviewView - 팀 프로필 알림 수신: 팀 ID \(teamId), 리그 ID \(leagueId)")
                    selectedTeamId = teamId
                    selectedTeamLeagueId = leagueId
                    navigateToTeamProfile = true
                }
            }
            
            // 선수 프로필 알림 관찰자 등록
            NotificationCenter.default.addObserver(forName: NSNotification.Name("ShowPlayerProfile"), object: nil, queue: .main) { notification in
                if let userInfo = notification.userInfo,
                   let playerId = userInfo["playerId"] as? Int {
                    print("📣 FixturesOverviewView - 선수 프로필 알림 수신: 선수 ID \(playerId)")
                    selectedPlayerId = playerId
                    navigateToPlayerProfile = true
                }
            }
            
            // 날짜 범위 확장 알림 관찰자 등록
            NotificationCenter.default.addObserver(forName: NSNotification.Name("DateRangeExtended"), object: nil, queue: .main) { notification in
                if let userInfo = notification.userInfo,
                   let newIndex = userInfo["newSelectedIndex"] as? Int {
                    print("📣 FixturesOverviewView - 날짜 범위 확장 알림 수신: 새 인덱스 \(newIndex)")
                    
                    // 선택된 날짜 인덱스 업데이트
                    withAnimation {
                        selectedDateIndex = newIndex
                    }
                }
            }
        }
        .onDisappear {
            // NotificationCenter 관찰자 제거
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("ShowTeamProfile"), object: nil)
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("ShowPlayerProfile"), object: nil)
            NotificationCenter.default.removeObserver(self, name: NSNotification.Name("DateRangeExtended"), object: nil)
        }
        .navigationDestination(isPresented: $navigateToTeamProfile) {
            TeamProfileView(teamId: selectedTeamId, leagueId: selectedTeamLeagueId)
        }
        .navigationDestination(isPresented: $navigateToPlayerProfile) {
            PlayerProfileView(playerId: selectedPlayerId)
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
                                .padding(.vertical, 2) // 4 -> 2로 줄임
                        }
                    }
                    
                    Divider()
                        .padding(.vertical, 8)
                }
                
                // 리그별 일정 (우선순위 순서대로)
                let prioritizedLeagues = [
                    // 주요 리그
                    39, 140, 135, 78, 61, // 프리미어 리그, 라리가, 세리에 A, 분데스리가, 리그 1
                    
                    // UEFA 대회
                    2, 3, 4, 5, // 챔피언스 리그, 유로파 리그, 컨퍼런스 리그, 유로 챔피언십
                    
                    // 국제대회 - 월드컵 및 예선
                    1, 31, 32, 33, 34, 35, 36, // 월드컵, 유럽/아시아/아프리카/북중미/남미/오세아니아 예선
                    
                    // 국제대회 - 대륙별 대회
                    9, 10, 11, 12, 13, // 유럽/남미/아시아/아프리카/북중미 챔피언십
                    
                    // 주요 컵 대회
                    45, 143, 137, 66, 81, // FA컵, 코파 델 레이, 코파 이탈리아, 쿠프 드 프랑스, DFB 포칼
                    
                    // 기타 리그
                    144, 88, 94, 71, 848, 207 // 벨기에, 네덜란드, 포르투갈, 브라질, ACL, K리그
                ]
                
                // 리그별 경기 그룹화
                let fixturesByLeague: [Int: [Fixture]] = {
                    guard let fixturesForDate = viewModel.fixtures[date] else { return [:] }
                    
                    // 즐겨찾기 팀 경기는 제외
                    let nonFavoriteFixtures = fixturesForDate.filter { fixture in
                        !favoriteFixtures.contains(fixture)
                    }
                    
                    // 리그별로 그룹화
                    var result: [Int: [Fixture]] = [:]
                    for fixture in nonFavoriteFixtures {
                        let leagueId = fixture.league.id
                        if result[leagueId] == nil {
                            result[leagueId] = []
                        }
                        result[leagueId]?.append(fixture)
                    }
                    return result
                }()
                
                // 우선순위 순서대로 리그 표시
                ForEach(prioritizedLeagues, id: \.self) { leagueId in
                    if let leagueFixtures = fixturesByLeague[leagueId], !leagueFixtures.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            // 리그 배너 헤더
                            let leagueName: String = {
                                switch leagueId {
                                // 주요 리그
                                case 39: return "프리미어 리그"
                                case 140: return "라리가"
                                case 135: return "세리에 A"
                                case 78: return "분데스리가"
                                case 61: return "리그 1"
                                // UEFA 대회
                                case 2: return "챔피언스 리그"
                                case 3: return "유로파 리그"
                                case 4: return "컨퍼런스 리그"
                                case 5: return "유로 챔피언십"
                                // 국제대회 - 월드컵 및 예선
                                case 1: return "FIFA 월드컵"
                                case 31: return "유럽 월드컵 예선"
                                case 32: return "아시아 월드컵 예선"
                                case 33: return "아프리카 월드컵 예선"
                                case 34: return "북중미 월드컵 예선"
                                case 35: return "남미 월드컵 예선"
                                case 36: return "오세아니아 월드컵 예선"
                                // 국제대회 - 대륙별 대회
                                case 9: return "유럽 챔피언십"
                                case 10: return "코파 아메리카"
                                case 11: return "아시안컵"
                                case 12: return "아프리카컵"
                                case 13: return "골드컵"
                                // 주요 컵 대회
                                case 45: return "FA컵"
                                case 143: return "코파 델 레이"
                                case 137: return "코파 이탈리아"
                                case 66: return "쿠프 드 프랑스"
                                case 81: return "DFB 포칼"
                                // 기타 리그
                                case 144: return "벨기에 프로 리그"
                                case 88: return "에레디비시"
                                case 94: return "프리메이라 리가"
                                case 71: return "브라질 세리에 A"
                                case 848: return "아시안 챔피언스 리그"
                                case 207: return "K리그"
                                default: return "리그 \(leagueId)"
                                }
                            }()

                            HStack(alignment: .center, spacing: 12) {
                                ZStack {
                                    Color.white
                                    if let leagueLogo = leagueFixtures.first?.league.logo, let logoURL = URL(string: leagueLogo) {
                                        CachedImageView(url: logoURL, placeholder: Image(systemName: "trophy"), contentMode: .fit)
                                            .frame(width: 36, height: 36) // 로고 크기 조정 (32x32 -> 36x36)
                                    }
                                }
                                .frame(width: 50, height: 40) // 프레임 크기 조정 (46x36 -> 50x40)
                                .clipShape(RoundedRectangle(cornerRadius: 8))

                                Text(leagueName)
                                    .font(.system(size: 14, weight: .bold)) // 폰트 크기 축소 (16 -> 14)
                                    .foregroundColor(.white)
                                    .frame(maxHeight: .infinity, alignment: .center)
                                    .padding(.leading, 4)

                                Spacer()
                            }
                            .frame(maxWidth: .infinity, alignment: .center) // 가운데 정렬로 변경
                            .padding(.leading, 10)
                            .padding(.trailing, 6)
                            .padding(.vertical, 4) // 상하 패딩 축소 (6 -> 4)
                            .background(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        self.leagueColor(for: leagueId).opacity(0.8),
                                        self.leagueColor(for: leagueId).opacity(0.95),
                                        self.leagueColor(for: leagueId)
                                    ]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            )
                            .padding(.top, 4) // 8 -> 4로 줄임
                            .padding(.bottom, 2) // 4 -> 2로 줄임

                            ForEach(leagueFixtures) { fixture in
                                FixtureCardView(fixture: fixture, viewModel: viewModel)
                                    .padding(.vertical, 2) // 4 -> 2로 줄임
                            }
                        }
                        Divider()
                            .padding(.vertical, 8)
                    }
                }
                
                // 경기 일정 표시 로직 개선
                let fixtures = viewModel.fixtures[date] ?? []
                let isLoading = viewModel.loadingDates.contains(date)
                
                // 데이터가 없는 경우 처리
                if fixtures.isEmpty {
                    // 빈 응답 메시지가 있는지 확인
                    if let emptyMessage = viewModel.emptyDates[date] {
                        // 빈 응답 메시지 표시
                        VStack(spacing: 12) {
                            Image(systemName: "calendar.badge.exclamationmark")
                                .font(.system(size: 40))
                                .foregroundColor(.secondary)
                            Text(emptyMessage)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    } else if isLoading {
                        // 로딩 중인 경우 스켈레톤 UI 표시
                        FixtureSkeletonView()
                            .padding(.horizontal)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 20)
                    } else {
                        // 데이터가 없고 로딩 중이 아니면 메시지 표시 및 데이터 로드 시도
                        VStack(spacing: 12) {
                            Image(systemName: "calendar.badge.exclamationmark")
                                .font(.system(size: 40))
                                .foregroundColor(.secondary)
                            Text("해당일에 예정된 경기가 없습니다")
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .onAppear {
                                    // 데이터 로드 시도
                                    if !isLoading {
                                        Task {
                                            await viewModel.loadFixturesForDate(date, forceRefresh: true)
                                        }
                                    }
                                }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
            .frame(maxWidth: .infinity, alignment: .center) // 가운데 정렬 추가
        }
        .refreshable {
            // 현재 선택된 날짜 데이터 강제 새로고침
            print("📱 Pull-to-Refresh 실행 - 날짜: \(viewModel.formatDateForAPI(date))")
            
            // 강제 새로고침으로 데이터 로드
            await viewModel.loadFixturesForDate(date, forceRefresh: true)
            
            // 강제 UI 업데이트 트리거
            DispatchQueue.main.async {
                // 임시 변수를 사용하여 강제 UI 업데이트
                let tempDate = date
                viewModel.selectedDate = Calendar.current.date(byAdding: .second, value: 1, to: tempDate) ?? tempDate
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                    viewModel.selectedDate = tempDate
                    // 추가 UI 새로고침 트리거
                    viewModel.objectWillChange.send()
                    
                    // 알림 발송 (UI 업데이트를 위해)
                    NotificationCenter.default.post(
                        name: NSNotification.Name("FixturesLoadingCompleted"),
                        object: nil,
                        userInfo: ["date": date, "forceUpdate": true, "pullToRefresh": true]
                    )
                    
                    print("🔄 Pull-to-Refresh 완료 - 강제 UI 업데이트 트리거")
                }
            }
        }
        .task {
            // 현재 날짜가 선택된 날짜인 경우에만 데이터 로드
            if Calendar.current.isDate(date, inSameDayAs: viewModel.selectedDate) &&
               (viewModel.fixtures[date]?.isEmpty ?? true) {
                await viewModel.loadFixturesForDate(date)
            }
        }
        .onAppear {
            // 모든 페이지에 대해 데이터 로드 시도 (선택된 페이지가 아니더라도)
            let fixtures = viewModel.fixtures[date] ?? []
            let isLoading = viewModel.loadingDates.contains(date)
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            dateFormatter.timeZone = TimeZone.current
            
            print("📱 페이지 등장 - 날짜: \(dateFormatter.string(from: date)), 인덱스: \(index), 선택된 인덱스: \(selectedIndex)")
            
            // 데이터가 없고 로딩 중이 아니면 데이터 로드 시도
            if fixtures.isEmpty && !isLoading {
                print("📱 페이지 등장 시 데이터 로드: \(dateFormatter.string(from: date))")
                Task {
                    // 더미 데이터 생성 요청 (forceRefresh: false로 설정하여 캐시 활용)
                    await viewModel.loadFixturesForDate(date, forceRefresh: false)
                }
            }
            
            // 선택된 페이지인 경우 주변 날짜도 미리 로드
            if index == selectedIndex {
                print("📱 선택된 페이지 - 주변 날짜 미리 로드")
                
                // 다음 3일 미리 로드
                Task {
                    for i in 1...3 {
                        if index + i < viewModel.dateTabs.count {
                            let nextDate = viewModel.dateTabs[index + i].date
                            if viewModel.fixtures[nextDate]?.isEmpty ?? true {
                                await viewModel.loadFixturesForDate(nextDate, forceRefresh: false)
                            }
                        }
                    }
                }
                
                // 이전 3일 미리 로드
                Task {
                    for i in 1...3 {
                        if index - i >= 0 {
                            let prevDate = viewModel.dateTabs[index - i].date
                            if viewModel.fixtures[prevDate]?.isEmpty ?? true {
                                await viewModel.loadFixturesForDate(prevDate, forceRefresh: false)
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 리그별 컬러 반환 함수
    private func leagueColor(for id: Int) -> Color {
        switch id {
        case 39: return Color(red: 72 / 255, green: 15 / 255, blue: 117 / 255) // Premier League: Deep Purple
        case 140: return Color(red: 232 / 255, green: 52 / 255, blue: 52 / 255) // La Liga: Vibrant Red
        case 135: return Color(red: 0 / 255, green: 25 / 255, blue: 165 / 255) // Serie A: Royal Blue
        case 78: return Color(red: 238 / 255, green: 0 / 255, blue: 0 / 255) // Bundesliga: Official Red
        case 61: return Color(red: 49 / 255, green: 108 / 255, blue: 244 / 255) // Ligue 1: Clean Blue
        case 2: return Color(red: 0 / 255, green: 51 / 255, blue: 153 / 255) // Champions League: Deep Blue
        case 3: return Color(red: 255 / 255, green: 102 / 255, blue: 0 / 255) // Europa League: Orange
        default: return Color.gray
        }
    }
}


// MARK: - 로딩 텍스트 뷰
struct LoadingTextView: View {
    let baseText: String
    @State private var dotCount = 0
    
    var body: some View {
        Text("\(baseText)\(String(repeating: ".", count: dotCount))")
            .animation(.easeInOut, value: dotCount)
            .onAppear {
                // 로딩 애니메이션 시작
                startLoadingAnimation()
            }
    }
    
    private func startLoadingAnimation() {
        // 로딩 애니메이션 타이머
        let timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            withAnimation {
                dotCount = (dotCount + 1) % 4
            }
        }
        
        // 뷰가 사라질 때 타이머 정리
        RunLoop.current.add(timer, forMode: .common)
    }
}

// MARK: - 경기 카드 뷰
struct FixtureCardView: View {
    let fixture: Fixture
    let viewModel: FixturesOverviewViewModel
    
    var body: some View {
        return NavigationLink(destination: FixtureDetailView(fixture: fixture)) {
            ZStack(alignment: .topTrailing) {
                VStack(spacing: 0) {
                    // 팀 정보와 스코어를 포함한 중앙 컨텐츠
                    HStack(alignment: .center, spacing: 8) {
                        // 홈팀
                        FixtureTeamView(team: fixture.teams.home, isHome: true)
                        
                        // 스코어 또는 경기 시간 - 중앙에 배치
                        FixtureCell.ScoreView(
                            homeScore: fixture.goals?.home,
                            awayScore: fixture.goals?.away,
                            isLive: ["1H", "2H", "HT", "ET", "BT", "P"].contains(fixture.fixture.status.short),
                            elapsed: fixture.fixture.status.elapsed,
                            status: fixture.fixture.status.short,
                            fixture: fixture
                        )
                        .frame(width: 70) // 너비 증가 (50 -> 70)
                        
                        // 원정팀
                        FixtureTeamView(team: fixture.teams.away, isHome: false)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity) // 수직 중앙 정렬을 위해 최대 높이 설정
                    .padding(.vertical, 10) // 팀 정보 주변에 패딩 추가
                }
                .padding(.vertical, 10) // 전체 패딩 조정
                .padding(.horizontal, 10)
                .background(Color(.systemBackground))
                .cornerRadius(10)
                .frame(maxWidth: .infinity, alignment: .center) // 가운데 정렬로 변경
                
                // 상태 뱃지 (우상단 귀퉁이에 배치) - 경기 예정이 아닌 경우에만 표시
                if !["NS", "TBD"].contains(fixture.fixture.status.short) {
                    FixtureCell.MiniStatusBadgeView(status: fixture.fixture.status.short)
                        .padding(6)
                }
            }
            .shadow(color: Color.black.opacity(0.1), radius: 3, x: 0, y: 1)
        }
        
        
        // 시간 포맷팅 메서드
        func formatTime(_ dateString: String) -> String {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
            dateFormatter.timeZone = TimeZone(identifier: "Asia/Seoul")
            
            guard let date = dateFormatter.date(from: dateString) else {
                return dateString
            }
            
            dateFormatter.dateFormat = "HH:mm"
            return dateFormatter.string(from: date)
        }
        
        
        // MARK: - 팀 정보 뷰 (간소화 버전)
        struct FixtureTeamView: View {
            let team: Team
            let isHome: Bool
        
            var body: some View {
                HStack(spacing: 3) {
                    if isHome {
                        teamNameText
                        teamLogoView
                    } else {
                        teamLogoView
                        teamNameText
                    }
                }
                .frame(width: 130) // 전체 너비 고정
            }
        
            private var teamLogoView: some View {
                ZStack {
                    Circle()
                        .fill(Color(.systemBackground))
                        .frame(width: 36, height: 36) // 배경 크기 증가 (32x32 -> 36x36)
                    CachedImageView(
                        url: URL(string: team.logo),
                        placeholder: Image(systemName: "sportscourt.fill"),
                        failureImage: Image(systemName: "sportscourt.fill"),
                        contentMode: .fit
                    )
                    .frame(width: 28, height: 28) // 로고 크기 증가 (24x24 -> 28x28)
                }
                .frame(width: 36) // 로고 영역 너비 증가 (32 -> 36)
            }
        
            private var teamNameText: some View {
                Text(TeamAbbreviations.shortenedName(for: team.name))
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                    .frame(width: 95, alignment: isHome ? .trailing : .leading) // 너비 조정
                    .foregroundColor(.primary)
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
                            .frame(width: 6, height: 6) // 8 -> 6으로 축소
                            .opacity(isBlinking ? 0.5 : 1.0)
                            .animation(Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: isBlinking)
                            .onAppear {
                                isBlinking = true
                            }
                    } else if ["FT", "AET", "PEN"].contains(status) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.gray)
                            .font(.system(size: 8)) // 10 -> 8로 축소
                    }
                    
                    Text(statusText)
                        .font(isLive ? .caption2.bold() : .caption2)
                        .foregroundColor(statusColor)
                }
                .padding(.horizontal, 5) // 6 -> 5로 축소
                .padding(.vertical, 1) // 2 -> 1로 축소
                .background(statusColor.opacity(0.1))
                .cornerRadius(4)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(statusColor.opacity(0.3), lineWidth: 0.5)
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
        
        /* MARK: - 스코어 뷰 (FixtureCell의 ScoreView를 사용하므로 주석 처리)
         struct ScoreView: View {
         let homeScore: Int?
         let awayScore: Int?
         let isLive: Bool
         let elapsed: Int?
         let status: String
         let fixture: Fixture  // 추가: fixture 파라미터
         let viewModel: FixturesOverviewViewModel  // 추가: viewModel 파라미터
         
         // 임시 승부차기 스코어 (실제로는 API에서 가져와야 함)
         private var penaltyScores: (home: Int, away: Int)? {
         if status == "PEN" {
         // 임의의 승부차기 스코어 (실제 데이터가 없으므로 임시로 설정)
         return (5, 4)
         }
         return nil
         }
         
         // 합산 스코어 계산 로직 - ViewModel 사용
         @State private var aggregateScores: (home: Int, away: Int)?
         @State private var isLoadingAggregateScore: Bool = false
         
         // 합산 스코어 계산 함수
         private func calculateAggregateScore() {
         // 챔피언스리그(2)나 유로파리그(3)의 경기인 경우에만 합산 스코어 표시
         if [2, 3].contains(fixture.league.id) {
         print("🏆 ScoreView - 챔피언스/유로파 경기 감지: \(fixture.league.id), 이름: \(fixture.league.name), 라운드: \(fixture.league.round)")
         
         // 로딩 상태 설정
         isLoadingAggregateScore = true
         aggregateScores = nil
         
         // 비동기로 정확한 합산 스코어 계산
         Task {
         print("🏆 ScoreView - 합산 스코어 계산 시작: \(fixture.fixture.id)")
         
         if let calculatedScores = await viewModel.calculateAggregateScore(fixture: fixture) {
         // UI 스레드에서 업데이트
         await MainActor.run {
         print("🏆 ScoreView - 정확한 합산 스코어 계산 결과: \(calculatedScores.home)-\(calculatedScores.away)")
         aggregateScores = calculatedScores
         isLoadingAggregateScore = false
         }
         } else {
         await MainActor.run {
         print("🏆 ScoreView - 합산 스코어 계산 실패")
         isLoadingAggregateScore = false
         }
         }
         }
         }
         }
         
         // 토너먼트 경기인지 확인하는 함수
         private func isTournamentMatch(_ round: String) -> Bool {
         // 예: "Round of 16", "Quarter-finals", "Semi-finals", "Final" 등
         let tournamentRounds = ["16", "8", "quarter", "semi", "final", "1st leg", "2nd leg"]
         let isMatch = tournamentRounds.contains { round.lowercased().contains($0.lowercased()) }
         print("🏆 isTournamentMatch: \(round) -> \(isMatch)")
         return isMatch
         }
         
         // 1차전 경기인지 확인하는 함수
         private func isFirstLegMatch(_ round: String) -> Bool {
         // 예: "Round of 16 - 1st Leg", "Quarter-finals - 1st Leg" 등
         let isFirstLeg = round.lowercased().contains("1st leg") ||
         round.lowercased().contains("first leg")
         print("🏆 isFirstLegMatch: \(round) -> \(isFirstLeg)")
         return isFirstLeg
         }
         
         // 2차전 경기인지 확인하는 함수
         private func isSecondLegMatch(_ round: String) -> Bool {
         // 예: "Round of 16 - 2nd Leg", "Quarter-finals - 2nd Leg" 등
         let isSecondLeg = round.lowercased().contains("2nd leg") ||
         round.lowercased().contains("second leg") ||
         round.lowercased().contains("return leg")
         print("🏆 isSecondLegMatch: \(round) -> \(isSecondLeg)")
         return isSecondLeg
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
         
         // 합산 스코어 표시
         Group {
         if isLoadingAggregateScore {
         // 로딩 중 표시
         Text("합산 계산 중...")
         .font(.caption)
         .foregroundColor(.gray)
         .padding(.horizontal, 4)
         .padding(.vertical, 2)
         } else if let aggregate = aggregateScores {
         // 합산 스코어 표시 (계산 완료)
         Text("합산 \(aggregate.home):\(aggregate.away)")
         .font(.caption)
         .fontWeight(.bold)
         .foregroundColor(.white)
         .padding(.horizontal, 6)
         .padding(.vertical, 3)
         .background(Color.blue)
         .cornerRadius(4)
         .overlay(
         RoundedRectangle(cornerRadius: 4)
         .stroke(Color.white, lineWidth: 1)
         )
         .shadow(color: Color.black.opacity(0.2), radius: 2, x: 0, y: 1)
         }
         }
         }
         .frame(width: 70)
         .onAppear {
         // 합산 스코어 계산 시작
         if [2, 3].contains(fixture.league.id) {
         print("🏆 ScoreView onAppear - 리그 ID: \(fixture.league.id), 라운드: \(fixture.league.round)")
         calculateAggregateScore()
         }
         }
         }
         }
         */
    }
    
}

