import SwiftUI

struct FollowedLeaguesView: View {
    @StateObject private var leagueFollowService = LeagueFollowService.shared
    @State private var showingAddLeague = false
    @State private var editMode: EditMode = .inactive
    
    var body: some View {
        NavigationStack {
            List {
                // 팔로우한 리그 목록
                ForEach(leagueFollowService.followedLeagues) { league in
                    HStack {
                        // 리그 로고
                        AsyncImage(url: URL(string: league.logo)) { image in
                            image
                                .resizable()
                                .scaledToFit()
                        } placeholder: {
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.3))
                        }
                        .frame(width: 40, height: 40)
                        
                        // 리그 정보
                        VStack(alignment: .leading, spacing: 4) {
                            Text(league.displayName)
                                .font(.body)
                                .foregroundColor(.primary)
                            
                            if let country = league.country {
                                Text(country)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Spacer()
                        
                        // 기본 리그 표시
                        if league.isDefault {
                            Text("기본")
                                .font(.caption)
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.blue)
                                .cornerRadius(4)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .onDelete { indexSet in
                    // 기본 리그가 아닌 경우에만 삭제 가능
                    for index in indexSet {
                        let league = leagueFollowService.followedLeagues[index]
                        if !league.isDefault {
                            leagueFollowService.unfollowLeague(leagueId: league.id)
                        }
                    }
                }
                .onMove { source, destination in
                    leagueFollowService.moveLeague(from: source, to: destination)
                }
                
                // 리그 추가 버튼
                Button(action: {
                    showingAddLeague = true
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.blue)
                        
                        Text("리그 추가")
                            .font(.headline)
                            .foregroundColor(.blue)
                        
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
            }
            .listStyle(InsetGroupedListStyle())
            .navigationTitle("팔로우 리그 관리")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    EditButton()
                }
            }
            .environment(\.editMode, $editMode)
        }
        .sheet(isPresented: $showingAddLeague) {
            AddLeagueView()
        }
    }
}

// 프리뷰
struct FollowedLeaguesView_Previews: PreviewProvider {
    static var previews: some View {
        FollowedLeaguesView()
    }
}