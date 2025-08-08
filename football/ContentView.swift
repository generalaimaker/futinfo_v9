import SwiftUI
import Kingfisher

struct ContentView: View {
    @State private var selectedTab = 2 // "일정" 탭 기본 선택
    @StateObject private var favoriteService = FavoriteService.shared
    @State private var showingSearchView = false // 검색 뷰 표시 상태

    var body: some View {
        TabView(selection: $selectedTab) {
            // 각 탭 뷰에 검색 버튼 추가
            NavigationStack {
                CommunityView()
            }
            .addSearchToolbar(isPresented: $showingSearchView)
            .tabItem {
                Label("락커룸", systemImage: "bubble.left.and.bubble.right.fill")
            }
            .tag(0)

            LeaguesView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("리그", systemImage: "trophy.fill")
                }
                .tag(1)

            FixturesOverviewView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("일정", systemImage: "calendar")
                }
                .tag(2)

            NewsView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("뉴스", systemImage: "newspaper.fill")
                }
                .tag(3)

            SettingsView()
                .addSearchToolbar(isPresented: $showingSearchView)
                .tabItem {
                    Label("설정", systemImage: "gearshape.fill")
                }
                .tag(4)
            
            // 디버그 탭 (개발 중에만)
            #if DEBUG
            NavigationView {
                DebugFixturesView()
            }
            .tabItem {
                Label("Debug", systemImage: "ladybug")
            }
            .tag(5)
            #endif
        }
        .accentColor(.blue)
        .environmentObject(favoriteService)
        // 검색 뷰를 시트로 표시
        .sheet(isPresented: $showingSearchView) {
            SearchView()
        }
    }
}

// 검색 버튼을 추가하는 ViewModifier
struct SearchToolbarModifier: ViewModifier {
    @Binding var isPresented: Bool

    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        isPresented = true
                    } label: {
                        Image(systemName: "magnifyingglass")
                    }
                }
            }
    }
}

// View 확장을 통해 쉽게 적용 가능하도록 함
extension View {
    func addSearchToolbar(isPresented: Binding<Bool>) -> some View {
        self.modifier(SearchToolbarModifier(isPresented: isPresented))
    }
}


// 커뮤니티 뷰는 이제 별도 파일에서 구현됨

// NewsView는 이제 별도 파일에서 구현됨

struct SettingsView: View {
    @EnvironmentObject var favoriteService: FavoriteService
    @StateObject private var communityService = SupabaseCommunityService.shared
    @State private var isInitializing = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var showingLogoutAlert = false
    @State private var showingAuth = false
    @State private var showingAccountAlert = false
    @State private var accountAlertTitle = ""
    @State private var accountAlertMessage = ""

    var body: some View {
        NavigationStack {
            List {
                // 계정 섹션 - 최상단에 배치
                Section {
                    if communityService.isAuthenticated {
                        // 로그인된 상태
                        HStack {
                            Image(systemName: "person.crop.circle.fill")
                                .font(.system(size: 50))
                                .foregroundColor(.blue)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(communityService.currentUser?.nickname ?? "사용자")
                                    .font(.headline)
                                Text(communityService.currentUser?.email ?? "")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                // 로그인 방법 표시
                                if let provider = communityService.currentUser?.authProvider {
                                    HStack(spacing: 4) {
                                        Image(systemName: getProviderIcon(provider))
                                            .font(.caption)
                                        Text(getProviderName(provider))
                                            .font(.caption)
                                    }
                                    .foregroundColor(.secondary)
                                }
                            }
                            
                            Spacer()
                        }
                        .padding(.vertical, 8)
                        
                        // 계정 전환 버튼 (현재 애플로 로그인한 경우 구글로 전환 테스트용)
                        if communityService.currentUser?.authProvider == "apple" {
                            Button {
                                accountAlertTitle = "계정 전환"
                                accountAlertMessage = "구글 계정으로 전환하시겠습니까? 현재 계정에서 로그아웃됩니다."
                                showingAccountAlert = true
                            } label: {
                                HStack {
                                    Image(systemName: "arrow.triangle.2.circlepath")
                                        .foregroundColor(.orange)
                                    Text("구글 계정으로 전환")
                                        .foregroundColor(.primary)
                                }
                            }
                        }
                        
                        Button {
                            showingLogoutAlert = true
                        } label: {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                    .foregroundColor(.red)
                                Text("로그아웃")
                                    .foregroundColor(.red)
                            }
                        }
                    } else {
                        // 로그인 안된 상태
                        Button {
                            showingAuth = true
                        } label: {
                            HStack {
                                Image(systemName: "person.crop.circle.badge.plus")
                                    .font(.title2)
                                    .foregroundColor(.blue)
                                
                                VStack(alignment: .leading) {
                                    Text("로그인하기")
                                        .font(.headline)
                                        .foregroundColor(.primary)
                                    Text("커뮤니티 이용을 위해 로그인하세요")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .foregroundColor(.secondary)
                            }
                            .padding(.vertical, 8)
                        }
                    }
                } header: {
                    Text("계정")
                }
                
                Section {
                    NavigationLink(destination: FavoritesView()) {
                        HStack {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                            Text("즐겨찾기")
                        }
                    }
                    
                    NavigationLink(destination: FollowedLeaguesView()) {
                        HStack {
                            Image(systemName: "trophy.fill")
                                .foregroundColor(.orange)
                            Text("팔로우 리그")
                        }
                    }
                    
                    NavigationLink(destination: FollowingTeamsView()) {
                        HStack {
                            Image(systemName: "person.3.fill")
                                .foregroundColor(.blue)
                            Text("팔로잉 팀")
                        }
                    }
                    
                    NavigationLink(destination: FollowingPlayersView()) {
                        HStack {
                            Image(systemName: "sportscourt.fill")
                                .foregroundColor(.green)
                            Text("팔로잉 선수")
                        }
                    }
                } header: {
                    Text("팔로잉")
                }
                
                Section {
                    Toggle("다크 모드", isOn: .constant(false))
                    Toggle("푸시 알림", isOn: .constant(true))
                    
                    NavigationLink(destination: LiveMatchNotificationSettingsView()) {
                        HStack {
                            Image(systemName: "bell.badge")
                                .foregroundColor(.orange)
                            Text("라이브 경기 알림")
                        }
                    }
                    
                    NavigationLink(destination: LanguageSettingsView()) {
                        HStack {
                            Image(systemName: "globe")
                                .foregroundColor(.blue)
                            Text("언어")
                        }
                    }
                    
                    Toggle("서버 캐싱 사용", isOn: Binding(
                        get: { AppConfiguration.shared.useSupabaseEdgeFunctions },
                        set: { newValue in
                            AppConfiguration.shared.useSupabaseEdgeFunctions = newValue
                        }
                    ))
                } header: {
                    Text("앱 설정")
                }
                
                // 개발자 옵션은 숨김
                #if DEBUG
                Section {
                    Button {
                        Task {
                            print("🔍 현재 세션 확인 중...")
                            do {
                                if let user = try await SupabaseService.shared.getCurrentUser() {
                                    print("✅ 로그인된 사용자: \(user.email ?? "이메일 없음")")
                                    print("✅ User ID: \(user.id)")
                                    print("✅ Provider: \(user.appMetadata["provider"] ?? "알 수 없음")")
                                } else {
                                    print("❌ 로그인된 사용자 없음")
                                }
                                
                                // Supabase Auth 세션 확인
                                do {
                                    let session = try await SupabaseService.shared.client.auth.session
                                    print("📱 세션 상태: 활성")
                                    print("🔑 Access Token: \(String(session.accessToken.prefix(20)))...")
                                } catch {
                                    print("📱 세션 상태: 비활성")
                                }
                            } catch {
                                print("❌ 세션 확인 오류: \(error)")
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: "person.crop.circle.badge.questionmark")
                                .foregroundColor(.blue)
                            Text("현재 세션 확인")
                        }
                    }
                    .foregroundColor(.primary)
                    
                    NavigationLink(destination: AdminToolsView()) {
                        HStack {
                            Image(systemName: "wrench.and.screwdriver.fill")
                                .foregroundColor(.purple)
                            Text("관리자 도구")
                        }
                    }
                    
                    Button {
                        Task {
                            // Kingfisher 이미지 캐시 삭제
                            KingfisherManager.shared.cache.clearMemoryCache()
                            await KingfisherManager.shared.cache.clearDiskCache()
                            await KingfisherManager.shared.cache.cleanExpiredDiskCache()
                            
                            // 캐시 초기화
                            NotificationCenter.default.post(
                                name: NSNotification.Name("ClearAllCache"),
                                object: nil
                            )
                            
                            // FixturesOverviewViewModel의 캐시도 초기화
                            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                               let window = windowScene.windows.first,
                               let _ = window.rootViewController?.view {
                                // ViewModel 접근을 위한 방법 - NotificationCenter 사용
                                NotificationCenter.default.post(
                                    name: NSNotification.Name("ClearFixturesCache"),
                                    object: nil
                                )
                            }
                            
                            await MainActor.run {
                                alertMessage = "모든 캐시가 초기화되었습니다."
                                showAlert = true
                            }
                        }
                    } label: {
                        HStack {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                            Text("캐시 초기화")
                        }
                    }
                    .foregroundColor(.primary)
                } header: {
                    Text("개발자 옵션")
                }
                #endif
                
                Section {
                    NavigationLink(destination: Text("앱 정보")) {
                        Text("앱 정보")
                    }
                    
                    NavigationLink(destination: Text("개인정보 처리방침")) {
                        Text("개인정보 처리방침")
                    }
                    
                    NavigationLink(destination: Text("이용약관")) {
                        Text("이용약관")
                    }
                } header: {
                    Text("정보")
                }
                
                #if DEBUG
                Section {
                    NavigationLink(destination: TestAPIView()) {
                        Text("API 테스트")
                    }
                    
                    NavigationLink(destination: TestFixturesAPIView()) {
                        HStack {
                            Image(systemName: "calendar.badge.exclamationmark")
                                .foregroundColor(.orange)
                            Text("Fixtures API 테스트")
                        }
                    }
                    
                    NavigationLink(destination: TestTeamIDsView()) {
                        HStack {
                            Image(systemName: "person.3.sequence.fill")
                                .foregroundColor(.purple)
                            Text("팀 ID 확인")
                        }
                    }
                    
                    NavigationLink(destination: VerifyTeamLogosView()) {
                        HStack {
                            Image(systemName: "photo.badge.checkmark.fill")
                                .foregroundColor(.green)
                            Text("팀 로고 검증")
                        }
                    }
                    
                    NavigationLink(destination: VerifyAndFixTeamsView()) {
                        HStack {
                            Image(systemName: "exclamationmark.shield.fill")
                                .foregroundColor(.red)
                            Text("팀 정보 검증 및 수정")
                        }
                    }
                    
                    NavigationLink(destination: TestTeamChangeView()) {
                        HStack {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .foregroundColor(.blue)
                            Text("팀 변경 테스트")
                        }
                    }
                } header: {
                    Text("API 테스트")
                }
                #endif
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("설정")
            .alert("알림", isPresented: $showAlert) {
                Button("확인", role: .cancel) { }
            } message: {
                Text(alertMessage)
            }
            .alert("로그아웃", isPresented: $showingLogoutAlert) {
                Button("취소", role: .cancel) { }
                Button("로그아웃", role: .destructive) {
                    Task {
                        do {
                            try await communityService.signOut()
                            alertMessage = "로그아웃되었습니다."
                            showAlert = true
                        } catch {
                            alertMessage = "로그아웃 실패: \(error.localizedDescription)"
                            showAlert = true
                        }
                    }
                }
            } message: {
                Text("정말 로그아웃하시겠습니까?")
            }
            .alert(accountAlertTitle, isPresented: $showingAccountAlert) {
                Button("취소", role: .cancel) { }
                Button("계속", role: .destructive) {
                    Task {
                        do {
                            // 먼저 로그아웃
                            try await communityService.signOut()
                            // 로그인 화면 표시
                            showingAuth = true
                        } catch {
                            alertMessage = "계정 전환 실패: \(error.localizedDescription)"
                            showAlert = true
                        }
                    }
                }
            } message: {
                Text(accountAlertMessage)
            }
            .sheet(isPresented: $showingAuth) {
                AuthView()
                    .onDisappear {
                        // AuthView가 닫힐 때 인증 상태 재확인
                        Task {
                            await communityService.checkAuthentication()
                        }
                    }
            }
            .onAppear {
                // 설정 화면이 나타날 때마다 인증 상태 확인
                Task {
                    await communityService.checkAuthentication()
                }
            }
        }
    }
    
    // Helper 함수들
    private func getProviderIcon(_ provider: String) -> String {
        switch provider.lowercased() {
        case "apple":
            return "apple.logo"
        case "google":
            return "globe"
        case "email":
            return "envelope.fill"
        default:
            return "person.fill"
        }
    }
    
    private func getProviderName(_ provider: String) -> String {
        switch provider.lowercased() {
        case "apple":
            return "Apple로 로그인됨"
        case "google":
            return "Google로 로그인됨"
        case "email":
            return "이메일로 로그인됨"
        default:
            return provider
        }
    }
    
    func initializeSupabaseData() async {
        isInitializing = true
        
        // Supabase에서는 migration으로 초기 데이터가 이미 설정됨
        // 필요한 경우 여기서 추가 초기화 작업 수행
        
        await MainActor.run {
            alertMessage = "Supabase 초기 데이터가 성공적으로 생성되었습니다!"
            showAlert = true
            isInitializing = false
        }
    }
}

// 팔로잉 팀 화면
struct FollowingTeamsView: View {
    @EnvironmentObject var favoriteService: FavoriteService
    
    var body: some View {
        List {
            if favoriteService.teamFavorites.isEmpty {
                Text("팔로잉하는 팀이 없습니다.")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                ForEach(favoriteService.teamFavorites) { team in
                    NavigationLink(destination: TeamProfileView(teamId: team.entityId)) {
                        HStack {
                            AsyncImage(url: URL(string: team.imageUrl ?? "")) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                            } placeholder: {
                                Image(systemName: "sportscourt.fill")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 40, height: 40)
                            
                            VStack(alignment: .leading) {
                                Text(team.name)
                                    .font(.headline)
                                Text("팀 정보")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            .padding(.leading, 8)
                        }
                    }
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        let team = favoriteService.teamFavorites[index]
                        favoriteService.removeFavorite(type: .team, entityId: team.entityId)
                    }
                }
            }
        }
        .navigationTitle("팔로잉 팀")
        .toolbar {
            EditButton()
        }
    }
}

// 팔로잉 선수 화면
struct FollowingPlayersView: View {
    @EnvironmentObject var favoriteService: FavoriteService
    
    var body: some View {
        List {
            if favoriteService.playerFavorites.isEmpty {
                Text("팔로잉하는 선수가 없습니다.")
                    .foregroundColor(.gray)
                    .padding()
            } else {
                ForEach(favoriteService.playerFavorites) { player in
                    NavigationLink(destination: PlayerProfileView(playerId: player.entityId)) {
                        HStack {
                            AsyncImage(url: URL(string: player.imageUrl ?? "")) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 40, height: 40)
                            } placeholder: {
                                Image(systemName: "person.fill")
                                    .foregroundColor(.gray)
                            }
                            .frame(width: 40, height: 40)
                            
                            VStack(alignment: .leading) {
                                Text(player.name)
                                    .font(.headline)
                                Text("선수 정보")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                            }
                            .padding(.leading, 8)
                        }
                    }
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        let player = favoriteService.playerFavorites[index]
                        favoriteService.removeFavorite(type: .player, entityId: player.entityId)
                    }
                }
            }
        }
        .navigationTitle("팔로잉 선수")
        .toolbar {
            EditButton()
        }
    }
}

// Supabase에서는 migration으로 초기 데이터를 설정하므로 이 클래스는 더 이상 필요하지 않습니다.
// 필요한 경우 SupabaseService를 통해 데이터를 초기화할 수 있습니다.