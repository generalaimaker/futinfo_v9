import SwiftUI
import Supabase
import AuthenticationServices

struct AuthView: View {
    @StateObject private var communityService = SupabaseCommunityService.shared
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var nickname = ""
    @State private var selectedTeamId: Int?
    @State private var showingTeamSelection = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var isValidForm: Bool {
        !email.isEmpty && !password.isEmpty && (isSignUp ? !nickname.isEmpty : true)
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // 로고
                    Image(systemName: "sportscourt.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.blue)
                        .padding(.top, 40)
                    
                    Text("FutInfo 커뮤니티")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text(isSignUp ? "새 계정 만들기" : "로그인")
                        .font(.title2)
                        .foregroundColor(.secondary)
                    
                    // 입력 폼
                    VStack(spacing: 16) {
                        // 이메일
                        VStack(alignment: .leading, spacing: 8) {
                            Text("이메일")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            TextField("이메일 주소", text: $email)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                        }
                        
                        // 비밀번호
                        VStack(alignment: .leading, spacing: 8) {
                            Text("비밀번호")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            SecureField("비밀번호", text: $password)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        // 회원가입시 추가 필드
                        if isSignUp {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("닉네임")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                TextField("닉네임", text: $nickname)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("응원하는 팀")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                Button {
                                    showingTeamSelection = true
                                } label: {
                                    HStack {
                                        if let teamId = selectedTeamId {
                                            AsyncImage(url: URL(string: "https://media.api-sports.io/football/teams/\(teamId).png")) { image in
                                                image
                                                    .resizable()
                                                    .scaledToFit()
                                            } placeholder: {
                                                Circle()
                                                    .fill(Color.gray.opacity(0.3))
                                            }
                                            .frame(width: 30, height: 30)
                                            
                                            Text("팀 ID: \(teamId)")
                                                .foregroundColor(.primary)
                                        } else {
                                            Image(systemName: "plus.circle")
                                                .foregroundColor(.gray)
                                            Text("팀 선택하기")
                                                .foregroundColor(.gray)
                                        }
                                        
                                        Spacer()
                                        
                                        Image(systemName: "chevron.right")
                                            .foregroundColor(.gray)
                                    }
                                    .padding()
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(8)
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // 에러 메시지
                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(.horizontal)
                    }
                    
                    // 액션 버튼
                    VStack(spacing: 12) {
                        // 이메일 로그인/가입 버튼
                        Button {
                            performAuth()
                        } label: {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text(isSignUp ? "가입하기" : "로그인")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isValidForm ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .disabled(!isValidForm || isLoading)
                        
                        // 구분선
                        HStack {
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(height: 1)
                            
                            Text("또는")
                                .font(.caption)
                                .foregroundColor(.gray)
                                .padding(.horizontal, 8)
                            
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(height: 1)
                        }
                        .padding(.vertical, 8)
                        
                        // 구글 로그인 버튼
                        Button {
                            performGoogleSignIn()
                        } label: {
                            HStack {
                                Image(systemName: "globe")
                                    .font(.system(size: 20))
                                Text("Google로 계속하기")
                                    .fontWeight(.medium)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white)
                            .foregroundColor(.black)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                            .cornerRadius(12)
                        }
                        .disabled(isLoading)
                        
                        // 애플 로그인 버튼
                        SignInWithAppleButton(
                            .signIn,
                            onRequest: { request in
                                print("🍎 Apple Sign In 요청 시작")
                                request.requestedScopes = [.fullName, .email]
                            },
                            onCompletion: { result in
                                print("🍎 Apple Sign In 결과: \(result)")
                                switch result {
                                case .success(let authorization):
                                    print("🍎 성공 - Authorization: \(authorization)")
                                    performAppleSignIn(authorization: authorization)
                                case .failure(let error):
                                    print("🍎 실패 - Error: \(error)")
                                    print("🍎 Error Domain: \((error as NSError).domain)")
                                    print("🍎 Error Code: \((error as NSError).code)")
                                    errorMessage = error.localizedDescription
                                }
                            }
                        )
                        .signInWithAppleButtonStyle(.black)
                        .frame(height: 50)
                        .cornerRadius(12)
                        .disabled(isLoading)
                        
                        Button {
                            withAnimation {
                                isSignUp.toggle()
                                errorMessage = nil
                            }
                        } label: {
                            Text(isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 가입하기")
                                .font(.subheadline)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.horizontal)
                    
                    Spacer(minLength: 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingTeamSelection) {
                TeamSelectionForAuthView(selectedTeamId: $selectedTeamId)
            }
        }
        .onChange(of: communityService.isAuthenticated) { oldValue, newValue in
            // 로그인 성공 시 자동으로 닫기
            if newValue && !communityService.needsProfileSetup {
                dismiss()
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("AuthStateChanged"))) { _ in
            // 인증 상태 변경 알림을 받으면 확인
            if communityService.isAuthenticated && !communityService.needsProfileSetup {
                dismiss()
            }
        }
        .onChange(of: scenePhase) { oldPhase, newPhase in
            // 앱이 백그라운드에서 포그라운드로 돌아올 때 (Google 로그인 후)
            if oldPhase == .background && newPhase == .active {
                Task {
                    // 인증 상태 재확인
                    await communityService.checkAuthentication()
                    
                    // 로그인되었으면 창 닫기
                    if communityService.isAuthenticated && !communityService.needsProfileSetup {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func performAuth() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                if isSignUp {
                    try await communityService.signUp(
                        email: email,
                        password: password,
                        nickname: nickname
                    )
                } else {
                    try await communityService.signIn(
                        email: email,
                        password: password
                    )
                }
                
                // Sync favorites after successful login
                await FavoriteService.shared.syncFromServerToLocal()
                
                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }
    
    private func performGoogleSignIn() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Supabase OAuth 로그인
                let redirectURL = URL(string: "futinfo://auth-callback")!
                
                try await SupabaseService.shared.client.auth.signInWithOAuth(
                    provider: .google,
                    redirectTo: redirectURL,
                    scopes: "profile email",
                    queryParams: [
                        (name: "access_type", value: "offline"),
                        (name: "prompt", value: "consent")
                    ]
                )
                
                // OAuth가 시작되면 브라우저로 이동하므로 로딩 상태 해제
                await MainActor.run {
                    isLoading = false
                }
                
                // OAuth 완료 후 처리는 footballApp.swift의 onOpenURL에서 처리
                
                // 3초마다 인증 상태 확인 (최대 10회)
                for _ in 0..<10 {
                    try? await Task.sleep(nanoseconds: 3_000_000_000) // 3초 대기
                    
                    // 인증 상태 확인
                    await communityService.checkAuthentication()
                    
                    // 로그인되었으면 창 닫기
                    if communityService.isAuthenticated && !communityService.needsProfileSetup {
                        await MainActor.run {
                            dismiss()
                        }
                        break
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Google 로그인 실패: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
    
    private func performAppleSignIn(authorization: ASAuthorization) {
        isLoading = true
        errorMessage = nil
        
        guard let appleCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let identityToken = appleCredential.identityToken,
              let tokenString = String(data: identityToken, encoding: .utf8) else {
            errorMessage = "Apple 로그인 정보를 가져올 수 없습니다"
            isLoading = false
            return
        }
        
        Task {
            do {
                // 네이티브 Apple Sign In 사용
                try await SupabaseService.shared.client.auth.signInWithIdToken(
                    credentials: .init(
                        provider: .apple,
                        idToken: tokenString
                    )
                )
                
                // 성공 시 사용자 정보 저장
                if let user = try? await SupabaseService.shared.client.auth.session.user {
                    print("🍎 로그인 성공! User ID: \(user.id)")
                    
                    // 프로필이 없을 수도 있으므로 별도 처리
                    _ = await SupabaseCommunityService.shared.checkAuthentication()
                }
                
                // 프로필 정보 업데이트 (최초 로그인시)
                if let fullName = appleCredential.fullName {
                    let displayName = [fullName.givenName, fullName.familyName]
                        .compactMap { $0 }
                        .joined(separator: " ")
                    
                    if !displayName.isEmpty {
                        // 닉네임 업데이트 로직 추가 필요
                    }
                }
                
                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Apple 로그인 실패: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
}

// 팀 선택 뷰 (인증용)
struct TeamSelectionForAuthView: View {
    @Binding var selectedTeamId: Int?
    @Environment(\.dismiss) private var dismiss
    @State private var selectedLeague = 39  // 기본값: 프리미어리그
    @State private var teams: [Team] = []
    @State private var isLoading = false
    
    let leagues = [
        (id: 39, name: "프리미어리그"),
        (id: 140, name: "라리가"),
        (id: 78, name: "분데스리가"),
        (id: 135, name: "세리에 A"),
        (id: 61, name: "리그 1")
    ]
    
    var body: some View {
        NavigationStack {
            VStack {
                // 리그 선택
                Picker("리그 선택", selection: $selectedLeague) {
                    ForEach(leagues, id: \.id) { league in
                        Text(league.name).tag(league.id)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding()
                
                // 팀 목록
                if isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else {
                    List {
                        ForEach(teams, id: \.id) { team in
                        Button {
                            selectedTeamId = team.id
                            dismiss()
                        } label: {
                            HStack {
                                AsyncImage(url: URL(string: team.logo)) { image in
                                    image
                                        .resizable()
                                        .scaledToFit()
                                } placeholder: {
                                    Circle()
                                        .fill(Color.gray.opacity(0.3))
                                }
                                .frame(width: 40, height: 40)
                                
                                Text(team.name)
                                    .foregroundColor(.primary)
                                
                                Spacer()
                                
                                if selectedTeamId == team.id {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.blue)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                        }
                    }
                }
            }
            .navigationTitle("팀 선택")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                loadTeams()
            }
            .onChange(of: selectedLeague) { oldValue, newValue in
                loadTeams()
            }
        }
    }
    
    private func loadTeams() {
        isLoading = true
        Task {
            do {
                // 순위 정보에서 팀 목록 추출
                let currentSeason = Calendar.current.component(.year, from: Date())
                let standings = try await FootballAPIService.shared.getStandings(leagueId: selectedLeague, season: currentSeason)
                let fetchedTeams = standings.map { standing in
                    Team(
                        id: standing.team.id,
                        name: standing.team.name,
                        logo: standing.team.logo,
                        winner: nil,
                        colors: nil
                    )
                }
                await MainActor.run {
                    self.teams = fetchedTeams
                    self.isLoading = false
                }
            } catch {
                print("Failed to load teams: \(error)")
                await MainActor.run {
                    self.teams = []
                    self.isLoading = false
                    
                    // 에러 발생 시 더미 데이터로 팀 목록 표시 (게시판과 동일한 팀 및 순서)
                    if selectedLeague == 39 { // 프리미어리그 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 33, name: "맨체스터 유나이티드", logo: "https://media.api-sports.io/football/teams/33.png", winner: nil, colors: nil),
                            Team(id: 40, name: "리버풀", logo: "https://media.api-sports.io/football/teams/40.png", winner: nil, colors: nil),
                            Team(id: 42, name: "아스널", logo: "https://media.api-sports.io/football/teams/42.png", winner: nil, colors: nil),
                            Team(id: 49, name: "첼시", logo: "https://media.api-sports.io/football/teams/49.png", winner: nil, colors: nil),
                            Team(id: 50, name: "맨체스터 시티", logo: "https://media.api-sports.io/football/teams/50.png", winner: nil, colors: nil),
                            Team(id: 47, name: "토트넘", logo: "https://media.api-sports.io/football/teams/47.png", winner: nil, colors: nil),
                            Team(id: 34, name: "뉴캐슬", logo: "https://media.api-sports.io/football/teams/34.png", winner: nil, colors: nil),
                            Team(id: 66, name: "아스톤 빌라", logo: "https://media.api-sports.io/football/teams/66.png", winner: nil, colors: nil),
                            Team(id: 48, name: "웨스트햄", logo: "https://media.api-sports.io/football/teams/48.png", winner: nil, colors: nil),
                            Team(id: 51, name: "브라이튼", logo: "https://media.api-sports.io/football/teams/51.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 140 { // 라리가 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 541, name: "레알 마드리드", logo: "https://media.api-sports.io/football/teams/541.png", winner: nil, colors: nil),
                            Team(id: 529, name: "바르셀로나", logo: "https://media.api-sports.io/football/teams/529.png", winner: nil, colors: nil),
                            Team(id: 530, name: "아틀레티코 마드리드", logo: "https://media.api-sports.io/football/teams/530.png", winner: nil, colors: nil),
                            Team(id: 536, name: "세비야", logo: "https://media.api-sports.io/football/teams/536.png", winner: nil, colors: nil),
                            Team(id: 532, name: "발렌시아", logo: "https://media.api-sports.io/football/teams/532.png", winner: nil, colors: nil),
                            Team(id: 533, name: "비야레알", logo: "https://media.api-sports.io/football/teams/533.png", winner: nil, colors: nil),
                            Team(id: 548, name: "레알 소시에다드", logo: "https://media.api-sports.io/football/teams/548.png", winner: nil, colors: nil),
                            Team(id: 543, name: "레알 베티스", logo: "https://media.api-sports.io/football/teams/543.png", winner: nil, colors: nil),
                            Team(id: 531, name: "아틀레틱 빌바오", logo: "https://media.api-sports.io/football/teams/531.png", winner: nil, colors: nil),
                            Team(id: 538, name: "셀타 비고", logo: "https://media.api-sports.io/football/teams/538.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 78 { // 분데스리가 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 157, name: "바이에른 뮌헨", logo: "https://media.api-sports.io/football/teams/157.png", winner: nil, colors: nil),
                            Team(id: 165, name: "보루시아 도르트문트", logo: "https://media.api-sports.io/football/teams/165.png", winner: nil, colors: nil),
                            Team(id: 168, name: "바이어 레버쿠젠", logo: "https://media.api-sports.io/football/teams/168.png", winner: nil, colors: nil),
                            Team(id: 173, name: "RB 라이프치히", logo: "https://media.api-sports.io/football/teams/173.png", winner: nil, colors: nil),
                            Team(id: 163, name: "보루시아 묀헨글라드바흐", logo: "https://media.api-sports.io/football/teams/163.png", winner: nil, colors: nil),
                            Team(id: 169, name: "아인트라흐트 프랑크푸르트", logo: "https://media.api-sports.io/football/teams/169.png", winner: nil, colors: nil),
                            Team(id: 161, name: "VfL 볼프스부르크", logo: "https://media.api-sports.io/football/teams/161.png", winner: nil, colors: nil),
                            Team(id: 172, name: "VfB 슈투트가르트", logo: "https://media.api-sports.io/football/teams/172.png", winner: nil, colors: nil),
                            Team(id: 178, name: "베르더 브레멘", logo: "https://media.api-sports.io/football/teams/178.png", winner: nil, colors: nil),
                            Team(id: 182, name: "우니온 베를린", logo: "https://media.api-sports.io/football/teams/182.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 135 { // 세리에 A - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 496, name: "유벤투스", logo: "https://media.api-sports.io/football/teams/496.png", winner: nil, colors: nil),
                            Team(id: 505, name: "인터", logo: "https://media.api-sports.io/football/teams/505.png", winner: nil, colors: nil),
                            Team(id: 489, name: "AC 밀란", logo: "https://media.api-sports.io/football/teams/489.png", winner: nil, colors: nil),
                            Team(id: 492, name: "나폴리", logo: "https://media.api-sports.io/football/teams/492.png", winner: nil, colors: nil),
                            Team(id: 497, name: "로마", logo: "https://media.api-sports.io/football/teams/497.png", winner: nil, colors: nil),
                            Team(id: 487, name: "라치오", logo: "https://media.api-sports.io/football/teams/487.png", winner: nil, colors: nil),
                            Team(id: 499, name: "아탈란타", logo: "https://media.api-sports.io/football/teams/499.png", winner: nil, colors: nil),
                            Team(id: 502, name: "피오렌티나", logo: "https://media.api-sports.io/football/teams/502.png", winner: nil, colors: nil),
                            Team(id: 503, name: "토리노", logo: "https://media.api-sports.io/football/teams/503.png", winner: nil, colors: nil),
                            Team(id: 495, name: "제노아", logo: "https://media.api-sports.io/football/teams/495.png", winner: nil, colors: nil)
                        ]
                    } else if selectedLeague == 61 { // 리그 1 - 명문팀 우선 정렬
                        self.teams = [
                            Team(id: 85, name: "파리 생제르맹", logo: "https://media.api-sports.io/football/teams/85.png", winner: nil, colors: nil),
                            Team(id: 80, name: "리옹", logo: "https://media.api-sports.io/football/teams/80.png", winner: nil, colors: nil),
                            Team(id: 81, name: "마르세유", logo: "https://media.api-sports.io/football/teams/81.png", winner: nil, colors: nil),
                            Team(id: 91, name: "모나코", logo: "https://media.api-sports.io/football/teams/91.png", winner: nil, colors: nil),
                            Team(id: 79, name: "릴", logo: "https://media.api-sports.io/football/teams/79.png", winner: nil, colors: nil),
                            Team(id: 84, name: "니스", logo: "https://media.api-sports.io/football/teams/84.png", winner: nil, colors: nil),
                            Team(id: 1063, name: "생테티엔", logo: "https://media.api-sports.io/football/teams/1063.png", winner: nil, colors: nil),
                            Team(id: 78, name: "보르도", logo: "https://media.api-sports.io/football/teams/78.png", winner: nil, colors: nil),
                            Team(id: 83, name: "낭트", logo: "https://media.api-sports.io/football/teams/83.png", winner: nil, colors: nil),
                            Team(id: 112, name: "스트라스부르", logo: "https://media.api-sports.io/football/teams/112.png", winner: nil, colors: nil)
                        ]
                    }
                }
            }
        }
    }
}