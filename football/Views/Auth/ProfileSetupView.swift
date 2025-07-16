import SwiftUI

struct ProfileSetupView: View {
    @StateObject private var supabaseCommunityService = SupabaseCommunityService.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var nickname = ""
    @State private var selectedTeamId: Int?
    @State private var showingTeamSelection = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    let isFirstTimeSetup: Bool
    
    var isValidForm: Bool {
        !nickname.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // 헤더
                    VStack(spacing: 12) {
                        Image(systemName: "person.crop.circle.badge.plus")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                        
                        Text("프로필 설정")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text(isFirstTimeSetup ? "커뮤니티에서 사용할 프로필을 설정해주세요" : "프로필 정보를 수정하세요")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 40)
                    
                    // 입력 폼
                    VStack(spacing: 20) {
                        // 닉네임
                        VStack(alignment: .leading, spacing: 8) {
                            Label("닉네임", systemImage: "person.fill")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                TextField("닉네임을 입력하세요", text: $nickname)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .font(.body)
                                    .onChange(of: nickname) { _, newValue in
                                        // 최대 10자로 제한
                                        if newValue.count > 10 {
                                            nickname = String(newValue.prefix(10))
                                        }
                                    }
                                
                                Text("\(nickname.count)/10")
                                    .font(.caption)
                                    .foregroundColor(nickname.count == 10 ? .orange : .secondary)
                            }
                            
                            Text("최대 10자까지 입력 가능")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        
                        // 응원 팀
                        VStack(alignment: .leading, spacing: 8) {
                            Label("응원하는 팀", systemImage: "sportscourt.fill")
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
                                        
                                        Text(getTeamName(teamId: teamId))
                                            .foregroundColor(.primary)
                                    } else {
                                        Image(systemName: "plus.circle")
                                            .foregroundColor(.blue)
                                        Text("팀 선택하기")
                                            .foregroundColor(.blue)
                                    }
                                    
                                    Spacer()
                                    
                                    Image(systemName: "chevron.right")
                                        .foregroundColor(.gray)
                                }
                                .padding()
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(12)
                            }
                            
                            if selectedTeamId != nil {
                                Text("선택한 팀의 전용 게시판에 참여할 수 있습니다")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
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
                    
                    Spacer(minLength: 40)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if !isFirstTimeSetup {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("취소") {
                            dismiss()
                        }
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        saveProfile()
                    } label: {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                        } else {
                            Text("완료")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(!isValidForm || isLoading)
                }
            }
            .interactiveDismissDisabled(isFirstTimeSetup)
            .sheet(isPresented: $showingTeamSelection) {
                TeamSelectionForProfileView(selectedTeamId: $selectedTeamId)
            }
            .onAppear {
                loadCurrentProfile()
            }
        }
    }
    
    private func loadCurrentProfile() {
        if let currentUser = supabaseCommunityService.currentUser {
            nickname = currentUser.nickname
            selectedTeamId = currentUser.favoriteTeamId
        }
    }
    
    private func saveProfile() {
        print("💾 프로필 저장 시작 - 닉네임: \(nickname), 팀ID: \(selectedTeamId ?? -1)")
        isLoading = true
        errorMessage = nil
        
        // 닉네임 유효성 검사
        guard CommunityValidator.isValidNickname(nickname) else {
            errorMessage = "닉네임은 2-20자의 한글, 영문, 숫자만 사용 가능합니다"
            isLoading = false
            return
        }
        
        Task {
            do {
                guard let userId = supabaseCommunityService.currentUser?.userId else {
                    throw SupabaseError.authError("사용자 정보를 찾을 수 없습니다")
                }
                
                // 프로필 업데이트
                let profileUpdate = ProfileUpdate(
                    nickname: nickname,
                    avatarUrl: nil,
                    favoriteTeamId: selectedTeamId,
                    favoriteTeamName: selectedTeamId != nil ? getTeamName(teamId: selectedTeamId!) : nil,
                    language: nil
                )
                
                try await SupabaseService.shared.updateProfile(userId: userId, updates: profileUpdate)
                
                // 팀 선택한 경우 팔로우
                if let teamId = selectedTeamId {
                    let teamName = getTeamName(teamId: teamId)
                    let teamImageUrl = "https://media.api-sports.io/football/teams/\(teamId).png"
                    print("🏆 팀 변경: \(teamId) - \(teamName)")
                    try await supabaseCommunityService.selectFavoriteTeam(
                        teamId: teamId,
                        teamName: teamName,
                        teamImageUrl: teamImageUrl
                    )
                    print("✅ 팀 변경 완료")
                }
                
                // 프로필 정보 새로고침
                await supabaseCommunityService.checkAuthentication()
                
                await MainActor.run {
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    errorMessage = "프로필 저장 실패: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
    
    private func getTeamName(teamId: Int) -> String {
        // 실제로는 API에서 가져와야 하지만, 임시로 주요 팀 이름 매핑
        let teamNames: [Int: String] = [
            // Premier League
            33: "Manchester United",
            40: "Liverpool",
            50: "Manchester City",
            47: "Tottenham",
            42: "Arsenal",
            49: "Chelsea",
            // La Liga
            529: "Barcelona",
            541: "Real Madrid",
            530: "Atletico Madrid",
            // Serie A
            489: "AC Milan",
            505: "Inter",
            496: "Juventus",
            // Bundesliga
            157: "Bayern Munich",
            165: "Borussia Dortmund",
            // Ligue 1
            85: "Paris Saint Germain"
        ]
        
        return teamNames[teamId] ?? "Team \(teamId)"
    }
}

// 팀 선택 뷰 (프로필용)
struct TeamSelectionForProfileView: View {
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
                // 즉시 기본 팀 목록 표시
                teams = getDefaultTeams(for: selectedLeague)
                // API에서 최신 데이터 로드 시도
                loadTeams()
            }
            .onChange(of: selectedLeague) {
                // 즉시 기본 팀 목록 표시
                teams = getDefaultTeams(for: selectedLeague)
                // API에서 최신 데이터 로드 시도
                loadTeams()
            }
        }
    }
    
    private func loadTeams() {
        isLoading = true
        Task {
            do {
                // 순위 정보에서 팀 목록 추출
                let standings = try await FootballAPIService.shared.getStandings(leagueId: selectedLeague, season: 2024)
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
                    // API 실패 시 기본 팀 목록 표시
                    self.teams = getDefaultTeams(for: selectedLeague)
                    self.isLoading = false
                }
            }
        }
    }
    
    private func getDefaultTeams(for leagueId: Int) -> [Team] {
        switch leagueId {
        case 39: // 프리미어리그
            return [
                Team(id: 33, name: "Manchester United", logo: "https://media.api-sports.io/football/teams/33.png", winner: nil, colors: nil),
                Team(id: 40, name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", winner: nil, colors: nil),
                Team(id: 50, name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png", winner: nil, colors: nil),
                Team(id: 47, name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png", winner: nil, colors: nil),
                Team(id: 42, name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", winner: nil, colors: nil),
                Team(id: 49, name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png", winner: nil, colors: nil),
                Team(id: 48, name: "West Ham", logo: "https://media.api-sports.io/football/teams/48.png", winner: nil, colors: nil),
                Team(id: 34, name: "Newcastle", logo: "https://media.api-sports.io/football/teams/34.png", winner: nil, colors: nil),
                Team(id: 66, name: "Aston Villa", logo: "https://media.api-sports.io/football/teams/66.png", winner: nil, colors: nil),
                Team(id: 51, name: "Brighton", logo: "https://media.api-sports.io/football/teams/51.png", winner: nil, colors: nil)
            ]
        case 140: // 라리가
            return [
                Team(id: 541, name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png", winner: nil, colors: nil),
                Team(id: 529, name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png", winner: nil, colors: nil),
                Team(id: 530, name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png", winner: nil, colors: nil),
                Team(id: 531, name: "Athletic Bilbao", logo: "https://media.api-sports.io/football/teams/531.png", winner: nil, colors: nil),
                Team(id: 548, name: "Real Sociedad", logo: "https://media.api-sports.io/football/teams/548.png", winner: nil, colors: nil),
                Team(id: 532, name: "Valencia", logo: "https://media.api-sports.io/football/teams/532.png", winner: nil, colors: nil),
                Team(id: 536, name: "Sevilla", logo: "https://media.api-sports.io/football/teams/536.png", winner: nil, colors: nil),
                Team(id: 543, name: "Real Betis", logo: "https://media.api-sports.io/football/teams/543.png", winner: nil, colors: nil),
                Team(id: 533, name: "Villarreal", logo: "https://media.api-sports.io/football/teams/533.png", winner: nil, colors: nil),
                Team(id: 538, name: "Celta Vigo", logo: "https://media.api-sports.io/football/teams/538.png", winner: nil, colors: nil)
            ]
        case 78: // 분데스리가
            return [
                Team(id: 157, name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png", winner: nil, colors: nil),
                Team(id: 165, name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png", winner: nil, colors: nil),
                Team(id: 168, name: "Bayer Leverkusen", logo: "https://media.api-sports.io/football/teams/168.png", winner: nil, colors: nil),
                Team(id: 172, name: "VfB Stuttgart", logo: "https://media.api-sports.io/football/teams/172.png", winner: nil, colors: nil),
                Team(id: 169, name: "RB Leipzig", logo: "https://media.api-sports.io/football/teams/169.png", winner: nil, colors: nil),
                Team(id: 160, name: "Eintracht Frankfurt", logo: "https://media.api-sports.io/football/teams/160.png", winner: nil, colors: nil),
                Team(id: 167, name: "VfL Wolfsburg", logo: "https://media.api-sports.io/football/teams/167.png", winner: nil, colors: nil),
                Team(id: 173, name: "Borussia M.Gladbach", logo: "https://media.api-sports.io/football/teams/173.png", winner: nil, colors: nil),
                Team(id: 182, name: "Union Berlin", logo: "https://media.api-sports.io/football/teams/182.png", winner: nil, colors: nil),
                Team(id: 162, name: "Werder Bremen", logo: "https://media.api-sports.io/football/teams/162.png", winner: nil, colors: nil)
            ]
        case 135: // 세리에 A
            return [
                Team(id: 496, name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png", winner: nil, colors: nil),
                Team(id: 505, name: "Inter", logo: "https://media.api-sports.io/football/teams/505.png", winner: nil, colors: nil),
                Team(id: 489, name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png", winner: nil, colors: nil),
                Team(id: 492, name: "Napoli", logo: "https://media.api-sports.io/football/teams/492.png", winner: nil, colors: nil),
                Team(id: 497, name: "Roma", logo: "https://media.api-sports.io/football/teams/497.png", winner: nil, colors: nil),
                Team(id: 487, name: "Lazio", logo: "https://media.api-sports.io/football/teams/487.png", winner: nil, colors: nil),
                Team(id: 499, name: "Atalanta", logo: "https://media.api-sports.io/football/teams/499.png", winner: nil, colors: nil),
                Team(id: 502, name: "Fiorentina", logo: "https://media.api-sports.io/football/teams/502.png", winner: nil, colors: nil),
                Team(id: 503, name: "Torino", logo: "https://media.api-sports.io/football/teams/503.png", winner: nil, colors: nil),
                Team(id: 495, name: "Genoa", logo: "https://media.api-sports.io/football/teams/495.png", winner: nil, colors: nil)
            ]
        case 61: // 리그 1
            return [
                Team(id: 85, name: "Paris Saint Germain", logo: "https://media.api-sports.io/football/teams/85.png", winner: nil, colors: nil),
                Team(id: 80, name: "Lyon", logo: "https://media.api-sports.io/football/teams/80.png", winner: nil, colors: nil),
                Team(id: 81, name: "Marseille", logo: "https://media.api-sports.io/football/teams/81.png", winner: nil, colors: nil),
                Team(id: 91, name: "Monaco", logo: "https://media.api-sports.io/football/teams/91.png", winner: nil, colors: nil),
                Team(id: 79, name: "Lille", logo: "https://media.api-sports.io/football/teams/79.png", winner: nil, colors: nil),
                Team(id: 84, name: "Nice", logo: "https://media.api-sports.io/football/teams/84.png", winner: nil, colors: nil),
                Team(id: 106, name: "Lens", logo: "https://media.api-sports.io/football/teams/106.png", winner: nil, colors: nil),
                Team(id: 94, name: "Rennes", logo: "https://media.api-sports.io/football/teams/94.png", winner: nil, colors: nil),
                Team(id: 83, name: "Nantes", logo: "https://media.api-sports.io/football/teams/83.png", winner: nil, colors: nil),
                Team(id: 96, name: "Strasbourg", logo: "https://media.api-sports.io/football/teams/96.png", winner: nil, colors: nil)
            ]
        default:
            return []
        }
    }
}

#Preview {
    ProfileSetupView(isFirstTimeSetup: true)
}