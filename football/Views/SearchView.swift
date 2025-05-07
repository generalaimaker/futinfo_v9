import SwiftUI

struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()
    @Environment(\.dismiss) var dismiss // 화면 닫기
    
    // 검색 종류 열거형 (리그, 감독 제거)
    enum SearchType: String, CaseIterable {
        case all = "전체"
        case team = "팀"
        case player = "선수"
        // case league = "리그" // 제거
        // case coach = "감독" // 제거
    }

    // 선택된 검색 종류 (기본값 .all 유지)
    @State private var selectedSearchType: SearchType = .all

    var body: some View {
        NavigationView {
            VStack {
                // 검색 종류 선택 세그먼트 컨트롤
                Picker("검색 종류", selection: $selectedSearchType) {
                    ForEach(SearchType.allCases, id: \.self) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                .padding(.top, 8)
                .onChange(of: selectedSearchType) { oldValue, newValue in
                    viewModel.selectedSearchType = newValue
                    // 검색어가 있으면 새로운 검색 종류로 다시 검색
                    if !viewModel.searchText.isEmpty {
                        Task {
                            await viewModel.performSearch(query: viewModel.searchText)
                        }
                    }
                }
                
                // 선수 검색 시 리그 선택 옵션 제거
                // if selectedSearchType == .player {
                //     leagueSelectionView
                // }

                // 검색 결과 목록
                List {
                    // 검색 결과가 있을 때만 섹션 표시
                    if !viewModel.searchResults.isEmpty {
                        searchResultsSection
                    } else if viewModel.isLoading {
                        // 로딩 중 표시
                        ProgressView("검색 중...")
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else if let errorMessage = viewModel.errorMessage {
                        // 에러 메시지 또는 결과 없음 메시지 표시
                        Text(errorMessage)
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else if viewModel.searchText.isEmpty {
                        // 초기 상태 또는 검색어 없을 때 안내 메시지
                        Text("팀, 선수, 리그, 감독 이름을 검색해보세요.")
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity, alignment: .center)
                    }
                }
                .listStyle(.plain) // 기본 List 스타일 사용
            }
            .navigationTitle("검색")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $viewModel.searchText, prompt: "검색어 입력")
            .toolbar {
                // 닫기 버튼 추가
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("닫기") {
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            // 초기 검색 종류 설정
            viewModel.selectedSearchType = selectedSearchType
        }
    }

    // 리그 선택 뷰 제거
    // private var leagueSelectionView: some View { ... }

    // 검색 결과 섹션
    private var searchResultsSection: some View {
        ForEach(groupResultsByType(viewModel.searchResults), id: \.type) { section in
            Section(header: Text(section.type).font(.headline)) {
                ForEach(section.items) { item in
                    NavigationLink(destination: destinationView(for: item)) {
                        SearchResultRow(item: item)
                    }
                }
            }
        }
    }

    // 검색 결과를 타입별로 그룹화하는 함수
    private func groupResultsByType(_ results: [SearchResultItem]) -> [(type: String, items: [SearchResultItem])] {
        let grouped = Dictionary(grouping: results) { $0.type }
        return grouped.map { (type: $0.key, items: $0.value) }.sorted { $0.type < $1.type } // 타입 이름 순으로 정렬
    }

    // 검색 결과 항목에 따른 목적지 뷰 반환
    @ViewBuilder
    private func destinationView(for item: SearchResultItem) -> some View {
        switch item {
        case .team(let teamProfile):
            // TeamProfileView로 이동 (리그 ID는 임시값 또는 nil 전달)
            TeamProfileView(teamId: teamProfile.team.id, leagueId: nil)
        case .league(let leagueDetails):
            // 리그 프로필 뷰로 이동
            Text("리그 정보: \(leagueDetails.league.name)")
        case .player(let playerProfileData):
            // PlayerProfileView로 이동 (playerId가 nil이 아닐 경우에만)
            if let playerId = playerProfileData.player.id {
                PlayerProfileView(playerId: playerId)
            } else {
                // playerId가 nil인 경우 에러 또는 대체 뷰 표시
                Text("선수 정보를 불러올 수 없습니다.")
            }
        case .coach(let coachInfo):
            // 감독 정보 뷰로 이동
            Text("감독 정보: \(coachInfo.name)")
        }
    }
}

// 검색 결과 행 뷰
struct SearchResultRow: View {
    let item: SearchResultItem

    var body: some View {
        HStack(spacing: 12) {
            // 로고 이미지
            CachedImageView(url: item.logoURL, placeholder: placeholderImage, failureImage: placeholderImage, contentMode: SwiftUI.ContentMode.fit)
                .frame(width: 40, height: 40)
                .clipShape(Circle()) // 원형 클리핑

            // 이름 및 상세 정보
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.headline)
                if let detail = item.detail {
                    Text(detail)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
            }

            Spacer()

            // 타입 배지
            Text(item.type)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(6)
        }
        .padding(.vertical, 8)
    }

    // 플레이스홀더 이미지
    private var placeholderImage: Image {
        switch item {
        case .team: return Image(systemName: "shield.lefthalf.filled")
        case .player: return Image(systemName: "person.fill")
        case .league: return Image(systemName: "trophy.fill")
        case .coach: return Image(systemName: "person.text.rectangle.fill")
        }
    }
}

struct SearchView_Previews: PreviewProvider {
    static var previews: some View {
        SearchView()
    }
}
