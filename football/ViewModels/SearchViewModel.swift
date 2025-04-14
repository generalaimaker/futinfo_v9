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
    @Published var selectedLeagueIdForPlayerSearch: Int?
    @Published var selectedSearchType: SearchView.SearchType = .all
    
    // MARK: - Properties
    let currentSeason: Int
    
    // 인기 리그 목록 (선수 검색 시 사용)
    let popularLeagues: [LeagueInfo] = [
        LeagueInfo(id: 39, name: "프리미어리그", type: "League", logo: "https://media.api-sports.io/football/leagues/39.png"),
        LeagueInfo(id: 140, name: "라리가", type: "League", logo: "https://media.api-sports.io/football/leagues/140.png"),
        LeagueInfo(id: 135, name: "세리에 A", type: "League", logo: "https://media.api-sports.io/football/leagues/135.png"),
        LeagueInfo(id: 78, name: "분데스리가", type: "League", logo: "https://media.api-sports.io/football/leagues/78.png"),
        LeagueInfo(id: 61, name: "리그 1", type: "League", logo: "https://media.api-sports.io/football/leagues/61.png"),
        LeagueInfo(id: 2, name: "챔피언스리그", type: "Cup", logo: "https://media.api-sports.io/football/leagues/2.png")
    ]
    
    private var cancellables = Set<AnyCancellable>()
    private let service = FootballAPIService.shared
    private let searchDebounceSeconds: TimeInterval = 0.5
    
    // MARK: - Initialization
    init() {
        self.currentSeason = SearchViewModel.getCurrentSeason()
        self.selectedLeagueIdForPlayerSearch = 39 // 기본값: 프리미어리그
        setupSearchDebounce()
    }
    
    // MARK: - Private Methods
    private func setupSearchDebounce() {
        $searchText
            .debounce(for: .seconds(searchDebounceSeconds), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] query in
                guard let self = self, !query.isEmpty else {
                    self?.searchResults = []
                    self?.errorMessage = nil
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
        
        // 검색어 인코딩 (특수 문자 처리)
        let encodedQuery = sanitizeSearchQuery(trimmedQuery)
        
        // 선택된 검색 종류에 따라 다른 검색 수행
        switch selectedSearchType {
        case .all:
            // 모든 종류 검색
            await withTaskGroup(of: (Result<[SearchResultItem], Error>).self) { group in
                // 팀 검색
                group.addTask {
                    return await self.searchTeams(query: encodedQuery)
                }
                
                // 리그/컵 검색
                group.addTask {
                    return await self.searchLeagues(query: encodedQuery)
                }
                
                // 선수 검색
                group.addTask {
                    return await self.searchPlayers(query: encodedQuery)
                }
                
                // 감독 검색
                group.addTask {
                    return await self.searchCoaches(query: encodedQuery)
                }
                
                // 결과 처리
                for await result in group {
                    switch result {
                    case .success(let items):
                        combinedResults.append(contentsOf: items)
                    case .failure(let error):
                        print("⚠️ 검색 중 오류 발생 (무시됨): \(error.localizedDescription)")
                    }
                }
            }
            
        case .team:
            // 팀만 검색
            let result = await searchTeams(query: encodedQuery)
            if case .success(let items) = result {
                combinedResults.append(contentsOf: items)
            }
            
        case .player:
            // 선수만 검색
            let result = await searchPlayers(query: encodedQuery)
            if case .success(let items) = result {
                combinedResults.append(contentsOf: items)
            }
            
        case .league:
            // 리그만 검색
            let result = await searchLeagues(query: encodedQuery)
            if case .success(let items) = result {
                combinedResults.append(contentsOf: items)
            }
            
        case .coach:
            // 감독만 검색
            let result = await searchCoaches(query: encodedQuery)
            if case .success(let items) = result {
                combinedResults.append(contentsOf: items)
            }
        }
        
        // 결과 정렬 및 중복 제거
        let uniqueResults = Array(Set(combinedResults))
        searchResults = uniqueResults.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
        isLoading = false
        
        // 검색 결과가 없는 경우 메시지 표시
        if searchResults.isEmpty && !isLoading {
            errorMessage = "'\(trimmedQuery)'에 대한 검색 결과가 없습니다."
        }
    }
    
    // 검색어 정제 (특수 문자 처리)
    private func sanitizeSearchQuery(_ query: String) -> String {
        // 알파벳, 숫자, 공백만 허용하는 정규식
        let regex = try! NSRegularExpression(pattern: "[^a-zA-Z0-9\\s]", options: [])
        let range = NSRange(location: 0, length: query.utf16.count)
        let sanitized = regex.stringByReplacingMatches(in: query, options: [], range: range, withTemplate: "")
        
        // 공백이 2개 이상 연속된 경우 하나로 치환
        let multipleSpacesRegex = try! NSRegularExpression(pattern: "\\s{2,}", options: [])
        let sanitizedWithSingleSpaces = multipleSpacesRegex.stringByReplacingMatches(
            in: sanitized, options: [], range: NSRange(location: 0, length: sanitized.utf16.count), withTemplate: " "
        )
        
        return sanitizedWithSingleSpaces.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    // 팀 검색
    private func searchTeams(query: String) async -> Result<[SearchResultItem], Error> {
        do {
            let teams = try await service.searchTeams(query: query)
            return .success(teams.map { SearchResultItem.team($0) })
        } catch {
            print("❌ 팀 검색 오류: \(error.localizedDescription)")
            return .failure(error)
        }
    }
    
    // 리그 검색
    private func searchLeagues(query: String) async -> Result<[SearchResultItem], Error> {
        do {
            let leagues = try await service.searchLeagues(query: query)
            return .success(leagues.map { SearchResultItem.league($0) })
        } catch {
            print("❌ 리그 검색 오류: \(error.localizedDescription)")
            return .failure(error)
        }
    }
    
    // 선수 검색
    private func searchPlayers(query: String) async -> Result<[SearchResultItem], Error> {
        do {
            let defaultLeagueId = 39 // 프리미어리그
            let players = try await service.searchPlayers(
                query: query,
                leagueId: selectedLeagueIdForPlayerSearch ?? defaultLeagueId,
                season: currentSeason
            )
            return .success(players.map { SearchResultItem.player($0) })
        } catch {
            print("❌ 선수 검색 오류: \(error.localizedDescription)")
            return .failure(error)
        }
    }
    
    // 감독 검색
    private func searchCoaches(query: String) async -> Result<[SearchResultItem], Error> {
        do {
            let coaches = try await service.searchCoaches(query: query)
            return .success(coaches.map { SearchResultItem.coach($0) })
        } catch {
            print("❌ 감독 검색 오류: \(error.localizedDescription)")
            return .failure(error)
        }
    }
    
    // 현재 시즌 계산 (static 메서드로 변경)
    static func getCurrentSeason() -> Int {
        let calendar = Calendar.current
        let now = Date()
        let year = calendar.component(.year, from: now)
        let month = calendar.component(.month, from: now)
        return month < 7 ? year - 1 : year
    }
}
