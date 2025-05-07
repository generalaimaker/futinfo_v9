import Foundation
import Combine
import SwiftUI

// MARK: - SearchViewModel
@MainActor
class SearchViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var searchText: String = ""
    @Published var searchResults: [SearchResultItem] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var selectedSearchType: SearchView.SearchType = .all

    // MARK: - Properties
    let currentSeason: Int

    // 선수 검색 시 병렬 호출할 주요 리그 ID 목록
    private let majorLeagueIdsForPlayerSearch = [39, 140, 135, 78, 61] // 예: PL, LaLiga, SerieA, Bundesliga, Ligue1

    private var cancellables = Set<AnyCancellable>()
    private let service = FootballAPIService.shared
    private let searchDebounceSeconds: TimeInterval = 0.5

    // MARK: - Initialization
    init() {
        self.currentSeason = SearchViewModel.getCurrentSeason()
        setupSearchDebounce()
    }

    // MARK: - Private Methods
    private func setupSearchDebounce() {
        $searchText
            .debounce(for: .seconds(searchDebounceSeconds), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] query in
                guard let self = self, !query.isEmpty else {
                    // 검색어가 비면 결과 초기화
                    self?.searchResults = []
                    self?.errorMessage = nil
                    self?.isLoading = false // 로딩 상태도 해제
                    return
                }

                Task {
                    await self.performSearch(query: query)
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Search Methods
    func performSearch(query: String) async {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else {
            searchResults = []
            errorMessage = nil
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil
        var combinedResults: [SearchResultItem] = []

        // 검색어 처리: 마지막 단어 추출 (API 제약 우회)
        let words = trimmedQuery.split { $0.isWhitespace } // 공백 기준 분리
        // 마지막 단어 추출 후 특수문자 처리, 없으면 전체 쿼리 사용 (특수문자 처리)
        let searchQuery = words.last.map { sanitizeSearchQuery(String($0)) } ?? sanitizeSearchQuery(trimmedQuery)

        // 검색할 쿼리가 비어있으면 중단 (sanitize 후 비어있을 수 있음)
        guard !searchQuery.isEmpty else {
            searchResults = []
            errorMessage = "'\(trimmedQuery)'에 대한 검색 결과가 없습니다." // 원본 검색어로 메시지 표시
            isLoading = false
            return
        }

        print("🧠 최종 검색 쿼리 (마지막 단어 또는 전체): \(searchQuery)")

        // 선택된 검색 종류에 따라 다른 검색 수행
        switch selectedSearchType {
        case .all:
            // 모든 종류 검색 (팀 + 선수) - 추출된 단일 쿼리 사용
            await withTaskGroup(of: (Result<[SearchResultItem], Error>).self) { group in
                // 팀 검색 Task 추가
                group.addTask {
                    print("  -> Task: 팀 검색 (\(searchQuery))")
                    return await self.searchTeams(query: searchQuery)
                }
                // 선수 검색 Task 추가 (주요 리그 병렬)
                group.addTask {
                    print("  -> Task: 선수 검색 (\(searchQuery))")
                    return await self.searchPlayersInMajorLeagues(query: searchQuery)
                }

                // 결과 처리 (TaskGroup)
                for await result in group {
                    switch result {
                    case .success(let items):
                        combinedResults.append(contentsOf: items)
                    case .failure(let error):
                        print("⚠️ '전체' 검색 중 오류 발생 (무시됨): \(error.localizedDescription)")
                    }
                }
            }

        case .team:
            // 팀만 검색 - 추출된 단일 쿼리 사용
            let teamResult = await searchTeams(query: searchQuery)
            if case .success(let items) = teamResult {
                combinedResults.append(contentsOf: items)
            } else if case .failure(let error) = teamResult {
                 print("⚠️ 팀 검색 중 오류 발생 (무시됨): \(error.localizedDescription)")
            }

        case .player:
            // 선수만 검색 (여러 리그 병렬 호출) - 추출된 단일 쿼리 사용
            let playerResult = await searchPlayersInMajorLeagues(query: searchQuery)
            if case .success(let items) = playerResult {
                combinedResults.append(contentsOf: items)
            } else if case .failure(let error) = playerResult {
                 print("⚠️ 선수 검색 중 오류 발생 (무시됨): \(error.localizedDescription)")
            }
        }

        // 결과 정렬 및 중복 제거
        let uniqueResults = Array(Set(combinedResults))
        
        // 인기 팀 목록 정의 (ID 기준)
        let popularTeamIds = [
            33,   // 맨체스터 유나이티드
            50,   // 맨체스터 시티
            40,   // 리버풀
            49,   // 첼시
            42,   // 아스날
            47,   // 토트넘
            541,  // 레알 마드리드
            529,  // 바르셀로나
            530,  // 아틀레티코 마드리드
            157,  // 바이에른 뮌헨
            165,  // 도르트문트
            505,  // 인터 밀란
            489,  // AC 밀란
            496,  // 유벤투스
            85    // 파리 생제르맹
        ]
        
        // 인기 팀 이름 목록 (이름 기준)
        let popularTeamNames = [
            // 영문 이름
            "manchester united", "man united", "man utd", "united",
            "manchester city", "man city", "city",
            "liverpool",
            "chelsea",
            "arsenal",
            "tottenham", "spurs",
            "real madrid", "real",
            "barcelona", "barca",
            "atletico madrid", "atletico",
            "bayern munich", "bayern",
            "borussia dortmund", "dortmund",
            "inter", "inter milan",
            "ac milan", "milan",
            "juventus", "juve",
            "paris saint-germain", "psg", "paris",
            
            // 한글 이름 및 별명
            "맨유", "맨시티", "리버풀", "첼시", "아스날", "토트넘",
            "레알", "바르셀로나", "바르샤", "아틀레티코", "알레띠",
            "바이에른", "뮌헨", "바이언", "도르트문트", "돌문",
            "인터밀란", "인테르", "밀란", "유벤투스", "파리"
        ]
        
        // 이름 유사도 기반 정렬 추가 (검색어 정확 일치 우선, 인기 팀 우선, 시작 문자열 일치 우선)
        searchResults = uniqueResults.sorted { item1, item2 in
            let name1 = item1.name.lowercased()
            let name2 = item2.name.lowercased()
            let queryLower = trimmedQuery.lowercased() // 정렬 시에는 원본 검색어 사용
            
            // 검색어-팀 이름 매핑 (한글 검색어 -> 영문 팀 이름)
            let searchToTeamMapping: [String: String] = [
                "맨유": "manchester united",
                "맨시티": "manchester city",
                "레알": "real madrid",
                "바르샤": "barcelona",
                "알레띠": "atletico madrid",
                "아틀레티코": "atletico madrid",
                "돌문": "borussia dortmund",
                "바이언": "bayern munich"
            ]
            
            // 검색어에 해당하는 영문 팀 이름 (있는 경우)
            let mappedTeamName = searchToTeamMapping[queryLower]
            
            // 악센트 부호 제거 함수
            func removeAccents(_ text: String) -> String {
                return text.folding(options: .diacriticInsensitive, locale: .current)
            }
            
            // 검색어 정확 일치 여부 확인 (최우선 정렬 기준)
            let isExactMatch1 = item1.type == "팀" && (
                name1 == queryLower || // 영문 이름이 검색어와 정확히 일치
                (mappedTeamName != nil && removeAccents(name1) == removeAccents(mappedTeamName!)) || // 매핑된 영문 이름과 정확히 일치 (악센트 무시)
                (mappedTeamName != nil && removeAccents(name1).contains(removeAccents(mappedTeamName!))) // 매핑된 영문 이름이 팀 이름에 포함됨 (악센트 무시)
            )
            
            let isExactMatch2 = item2.type == "팀" && (
                name2 == queryLower ||
                (mappedTeamName != nil && removeAccents(name2) == removeAccents(mappedTeamName!)) ||
                (mappedTeamName != nil && removeAccents(name2).contains(removeAccents(mappedTeamName!)))
            )
            
            // 검색어 정확 일치가 있으면 최우선 정렬
            if isExactMatch1 != isExactMatch2 {
                return isExactMatch1 && !isExactMatch2
            }
            
            // 인기 팀 여부 확인 (ID 기준)
            let isPopular1: Bool
            let isPopular2: Bool
            
            // 팀 ID 추출 및 인기 팀 확인
            if case .team(let teamProfile) = item1 {
                isPopular1 = popularTeamIds.contains(teamProfile.team.id)
            } else {
                isPopular1 = false
            }
            
            if case .team(let teamProfile) = item2 {
                isPopular2 = popularTeamIds.contains(teamProfile.team.id)
            } else {
                isPopular2 = false
            }
            
            // 인기 팀 이름 포함 여부 확인 (이름 기준)
            let nameContainsPopular1 = item1.type == "팀" && popularTeamNames.contains { teamName in
                name1.contains(teamName)
            }
            
            let nameContainsPopular2 = item2.type == "팀" && popularTeamNames.contains { teamName in
                name2.contains(teamName)
            }
            
            // 인기 팀 점수 (낮을수록 좋음): 인기 팀(0), 인기 팀 이름 포함(1), 일반 팀(2)
            let popularScore1 = isPopular1 ? 0 : (nameContainsPopular1 ? 1 : 2)
            let popularScore2 = isPopular2 ? 0 : (nameContainsPopular2 ? 1 : 2)
            
            // 인기 팀 점수가 다르면 인기 팀 우선
            if popularScore1 != popularScore2 {
                return popularScore1 < popularScore2
            }

            // 점수 계산: 시작 일치(0), 포함(1), 불일치(2)
            let score1 = name1.hasPrefix(queryLower) ? 0 : (name1.contains(queryLower) ? 1 : 2)
            let score2 = name2.hasPrefix(queryLower) ? 0 : (name2.contains(queryLower) ? 1 : 2)

            // 마지막 단어 기준 점수 추가 (더 정확한 매칭 우선)
            let lastWordLower = words.last.map { String($0).lowercased() } ?? queryLower
            let score1LastWord = name1.contains(lastWordLower) ? 0 : 1
            let score2LastWord = name2.contains(lastWordLower) ? 0 : 1

            // 최종 점수 (낮을수록 좋음)
            let finalScore1 = score1 * 2 + score1LastWord
            let finalScore2 = score2 * 2 + score2LastWord

            if finalScore1 != finalScore2 {
                return finalScore1 < finalScore2 // 점수가 낮을수록 (더 유사할수록) 앞으로
            }
            
            // 점수가 같으면 이름순 정렬
            return name1.localizedCaseInsensitiveCompare(name2) == .orderedAscending
        }
        isLoading = false

        // 검색 결과가 없는 경우 메시지 표시
        if searchResults.isEmpty && !isLoading {
            errorMessage = "'\(trimmedQuery)'에 대한 검색 결과가 없습니다."
        }
    }

    // 검색어 정제 (특수 문자 처리 완화)
    private func sanitizeSearchQuery(_ query: String) -> String {
        // 허용할 문자: 영어/숫자/공백/하이픈/작은따옴표/한글
        let pattern = "[^a-zA-Z0-9\\s\\-'.가-힣]"
        
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else {
            return query
        }
        
        let range = NSRange(location: 0, length: query.utf16.count)
        let sanitized = regex.stringByReplacingMatches(in: query, options: [], range: range, withTemplate: "")
        
        // 공백 2개 이상 → 1개로 축소
        let multipleSpacesRegex = try? NSRegularExpression(pattern: "\\s{2,}", options: [])
        let condensed = multipleSpacesRegex?.stringByReplacingMatches(
            in: sanitized, options: [], range: NSRange(location: 0, length: sanitized.utf16.count),
            withTemplate: " "
        ) ?? sanitized
        
        return condensed.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // 팀 검색 (API 서비스 호출)
    private func searchTeams(query: String) async -> Result<[SearchResultItem], Error> {
        guard !query.isEmpty else { return .success([]) }
        do {
            let teams = try await service.searchTeams(query: query) // 서비스 함수는 공백 제거 안 함
            return .success(teams.map { SearchResultItem.team($0) })
        } catch {
            print("❌ 팀 검색 오류: \(error.localizedDescription)")
            return .failure(error)
        }
    }

    // 선수 검색 (단일 리그 - 내부 사용, API 서비스 호출)
    private func searchPlayers(query: String, leagueId: Int) async -> Result<[SearchResultItem], Error> {
        guard !query.isEmpty else { return .success([]) } // 빈 쿼리 방지
        do {
            let players = try await service.searchPlayers(
                query: query, // ViewModel에서 처리된 쿼리 전달
                leagueId: leagueId,
                season: currentSeason
            )
            return .success(players.map { SearchResultItem.player($0) })
        } catch {
            print("❌ 선수 검색 오류 (리그: \(leagueId)): \(error.localizedDescription)")
            return .failure(error)
        }
    }

    // 주요 리그에서 선수 병렬 검색 (API 서비스 호출)
    private func searchPlayersInMajorLeagues(query: String) async -> Result<[SearchResultItem], Error> {
        guard !query.isEmpty else { return .success([]) } // 빈 쿼리 방지

        var combinedPlayerResults: [SearchResultItem] = []
        var lastError: Error?

        await withTaskGroup(of: (Result<[SearchResultItem], Error>).self) { group in
            for leagueId in majorLeagueIdsForPlayerSearch {
                group.addTask {
                    // 각 리그에 대해 searchPlayers 호출 (ViewModel에서 처리된 쿼리 전달)
                    return await self.searchPlayers(query: query, leagueId: leagueId)
                }
            }

            // 결과 처리
            for await result in group {
                switch result {
                case .success(let items):
                    combinedPlayerResults.append(contentsOf: items)
                case .failure(let error):
                    print("⚠️ 주요 리그 선수 검색 중 오류 발생: \(error.localizedDescription)")
                    lastError = error // 마지막 에러 저장
                }
            }
        }

        // 성공한 결과가 있으면 반환, 없으면 마지막 에러 반환
        if !combinedPlayerResults.isEmpty {
            return .success(combinedPlayerResults)
        } else if let error = lastError {
            return .failure(error)
        } else {
            // 오류도 없고 결과도 없는 경우 (모든 리그에서 결과 못 찾음)
            return .success([])
        }
    }

    // 현재 시즌 계산 (static 메서드)
    static func getCurrentSeason() -> Int {
        let calendar = Calendar.current
        let now = Date()
        let year = calendar.component(.year, from: now)
        let month = calendar.component(.month, from: now)
        return month < 7 ? year - 1 : year
    }
}
