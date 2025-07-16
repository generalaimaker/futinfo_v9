import SwiftUI

struct AddSpecificLeaguesView: View {
    @StateObject private var leagueFollowService = LeagueFollowService.shared
    @State private var message = ""
    @State private var isComplete = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("리그 추가 도구")
                .font(.largeTitle)
                .bold()
            
            Text(message)
                .font(.body)
                .foregroundColor(isComplete ? .green : .primary)
                .multilineTextAlignment(.center)
                .padding()
            
            Button(action: addSpecificLeagues) {
                Text("MLS, 사우디 프로 리그, K리그2 추가")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .disabled(isComplete)
            
            if !leagueFollowService.followedLeagues.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text("현재 팔로우 중인 리그:")
                        .font(.headline)
                        .padding(.top)
                    
                    ForEach(leagueFollowService.followedLeagues, id: \.id) { league in
                        HStack {
                            AsyncImage(url: URL(string: league.logo)) { image in
                                image
                                    .resizable()
                                    .scaledToFit()
                            } placeholder: {
                                ProgressView()
                            }
                            .frame(width: 30, height: 30)
                            
                            Text(league.displayName)
                                .font(.body)
                            
                            Spacer()
                        }
                        .padding(.horizontal)
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .onAppear {
            checkCurrentLeagues()
        }
    }
    
    private func checkCurrentLeagues() {
        let followedIds = leagueFollowService.followedLeagueIds
        
        var status = "현재 상태:\n"
        status += "MLS (253): \(followedIds.contains(253) ? "✅ 팔로우 중" : "❌ 미팔로우")\n"
        status += "사우디 프로 리그 (307): \(followedIds.contains(307) ? "✅ 팔로우 중" : "❌ 미팔로우")\n"
        status += "K리그2 (293): \(followedIds.contains(293) ? "✅ 팔로우 중" : "❌ 미팔로우")"
        
        message = status
    }
    
    private func addSpecificLeagues() {
        var addedLeagues: [String] = []
        
        // MLS 추가
        if !leagueFollowService.isFollowing(leagueId: 253) {
            let mls = LeagueFollow(
                id: 253,
                name: "MLS",
                logo: "https://media.api-sports.io/football/leagues/253.png",
                country: "USA",
                isDefault: false
            )
            leagueFollowService.followLeague(mls)
            addedLeagues.append("MLS")
        }
        
        // 사우디 프로 리그 추가
        if !leagueFollowService.isFollowing(leagueId: 307) {
            let saudiLeague = LeagueFollow(
                id: 307,
                name: "Pro League",
                logo: "https://media.api-sports.io/football/leagues/307.png",
                country: "Saudi Arabia",
                isDefault: false
            )
            leagueFollowService.followLeague(saudiLeague)
            addedLeagues.append("사우디 프로 리그")
        }
        
        // K리그2 추가
        if !leagueFollowService.isFollowing(leagueId: 293) {
            let kLeague2 = LeagueFollow(
                id: 293,
                name: "K League 2",
                logo: "https://media.api-sports.io/football/leagues/293.png",
                country: "South Korea",
                isDefault: false
            )
            leagueFollowService.followLeague(kLeague2)
            addedLeagues.append("K리그2")
        }
        
        if addedLeagues.isEmpty {
            message = "모든 리그가 이미 팔로우되어 있습니다."
        } else {
            message = "다음 리그가 추가되었습니다:\n" + addedLeagues.joined(separator: ", ")
            
            // 일정 화면 새로고침 알림
            NotificationCenter.default.post(
                name: NSNotification.Name("LeagueFollowUpdated"),
                object: nil,
                userInfo: ["action": "follow"]
            )
        }
        
        isComplete = true
    }
}

struct AddSpecificLeaguesView_Previews: PreviewProvider {
    static var previews: some View {
        AddSpecificLeaguesView()
    }
}