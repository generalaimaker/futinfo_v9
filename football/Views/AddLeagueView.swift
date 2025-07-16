import SwiftUI

struct AddLeagueView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var leagueFollowService = LeagueFollowService.shared
    @State private var searchText = ""
    @State private var selectedCategory: LeagueCategory? = nil
    
    // 카테고리별로 그룹화된 리그
    private var groupedLeagues: [LeagueCategory: [AvailableLeague]] {
        leagueFollowService.getAvailableLeaguesGrouped()
    }
    
    // 정렬된 카테고리
    private var sortedCategories: [LeagueCategory] {
        groupedLeagues.keys.sorted { $0.order < $1.order }
    }
    
    // 검색 필터링된 리그
    private func filteredLeagues(for category: LeagueCategory) -> [AvailableLeague] {
        guard let leagues = groupedLeagues[category] else { return [] }
        
        if searchText.isEmpty {
            return leagues
        }
        
        return leagues.filter { league in
            league.displayName.localizedCaseInsensitiveContains(searchText) ||
            league.name.localizedCaseInsensitiveContains(searchText) ||
            (league.country?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // 검색 바
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("리그 검색", text: $searchText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                .padding()
                .background(Color(.systemGroupedBackground))
                
                // 리그 목록
                ScrollView {
                    LazyVStack(spacing: 20) {
                        ForEach(sortedCategories, id: \.self) { category in
                            let leagues = filteredLeagues(for: category)
                            
                            if !leagues.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    // 카테고리 헤더
                                    Text(category.rawValue)
                                        .font(.headline)
                                        .foregroundColor(.secondary)
                                        .padding(.horizontal)
                                    
                                    // 리그 목록
                                    ForEach(leagues, id: \.id) { league in
                                        Button(action: {
                                            leagueFollowService.followLeague(league)
                                            dismiss()
                                        }) {
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
                                                
                                                // 추가 아이콘
                                                Image(systemName: "plus.circle.fill")
                                                    .font(.title2)
                                                    .foregroundColor(.blue)
                                            }
                                            .padding()
                                            .background(Color(.systemBackground))
                                            .cornerRadius(12)
                                            .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
                                        }
                                        .buttonStyle(PlainButtonStyle())
                                        .padding(.horizontal)
                                    }
                                }
                            }
                        }
                        
                        // 모든 리그가 팔로우되었을 때 메시지
                        if groupedLeagues.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(.green)
                                
                                Text("모든 리그를 팔로우하고 있습니다")
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.top, 60)
                        }
                    }
                    .padding(.vertical)
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("리그 추가")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("취소") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// 프리뷰
struct AddLeagueView_Previews: PreviewProvider {
    static var previews: some View {
        AddLeagueView()
    }
}