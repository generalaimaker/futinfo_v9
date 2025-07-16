import Foundation
import SwiftUI

// MARK: - Brave Search 기반 실시간 이적 정보 서비스

@MainActor
class BraveTransferSearchService: ObservableObject {
    static let shared = BraveTransferSearchService()
    
    @Published var liveTransferNews: [BraveTransferResult] = []
    @Published var transferRumors: [BraveTransferResult] = []
    @Published var officialAnnouncements: [BraveTransferResult] = []
    @Published var isLoading = false
    @Published var lastUpdateTime: Date?
    @Published var searchProgress: String = ""
    
    private let searchQueries = [
        // 공식 발표
        "football transfer official announcement today confirmed",
        "soccer signing official statement club announcement",
        "player joins new club official confirmation",
        
        // 실시간 뉴스
        "football transfer news breaking today latest",
        "soccer transfer deadline day live updates",
        "player transfer completed today official",
        
        // 이적 루머
        "football transfer rumors latest news today",
        "soccer transfer gossip reliable sources",
        "player linked move transfer speculation",
        
        // 특정 리그
        "Premier League transfer news today official",
        "La Liga transfer signings latest news",
        "Serie A transfer market updates today",
        "Bundesliga transfer news official announcements",
        "Ligue 1 transfer signings today confirmed"
    ]
    
    private init() {
        print("🔍 Brave Search 이적 정보 서비스 초기화")
    }
    
    // MARK: - 실시간 이적 정보 수집
    
    func fetchLiveTransferUpdates() async {
        isLoading = true
        searchProgress = "검색 시작..."
        
        var allResults: [BraveTransferResult] = []
        
        for (index, query) in searchQueries.enumerated() {
            searchProgress = "검색 중... (\(index + 1)/\(searchQueries.count))"
            
            do {
                let results = try await searchBraveForTransfers(query: query)
                allResults.append(contentsOf: results)
                
                // 검색 간격 (API 제한 고려)
                try await Task.sleep(nanoseconds: 1_000_000_000) // 1초 대기
                
            } catch {
                print("⚠️ Brave 검색 실패 (\(query)): \(error)")
                continue
            }
        }
        
        // 결과 분류 및 정리
        let processedResults = processSearchResults(allResults)
        
        await MainActor.run {
            self.liveTransferNews = processedResults.news
            self.transferRumors = processedResults.rumors
            self.officialAnnouncements = processedResults.official
            self.lastUpdateTime = Date()
            self.isLoading = false
            self.searchProgress = "완료"
        }
        
        print("✅ Brave Search 이적 정보 업데이트 완료: \(allResults.count)개")
    }
    
    // MARK: - Brave Search 실행
    
    private func searchBraveForTransfers(query: String) async throws -> [BraveTransferResult] {
        print("🔍 Brave 검색: \(query)")
        
        // MCP Brave Search 도구 사용 시뮬레이션
        // 실제로는 MCP 서버를 통해 검색
        
        // 샘플 검색 결과 생성 (실제 구현에서는 MCP 도구 사용)
        return generateSampleBraveResults(for: query)
    }
    
    // MARK: - 검색 결과 처리
    
    private func processSearchResults(_ results: [BraveTransferResult]) -> (news: [BraveTransferResult], rumors: [BraveTransferResult], official: [BraveTransferResult]) {
        
        // 중복 제거
        let uniqueResults = removeDuplicates(from: results)
        
        // 신뢰도별 분류
        let official = uniqueResults.filter { $0.reliability >= 90 && $0.isOfficial }
        let news = uniqueResults.filter { $0.reliability >= 70 && !$0.isOfficial }
        let rumors = uniqueResults.filter { $0.reliability < 70 }
        
        // 날짜순 정렬
        let sortedOfficial = official.sorted { $0.publishedDate > $1.publishedDate }
        let sortedNews = news.sorted { $0.publishedDate > $1.publishedDate }
        let sortedRumors = rumors.sorted { $0.publishedDate > $1.publishedDate }
        
        return (
            news: Array(sortedNews.prefix(20)),
            rumors: Array(sortedRumors.prefix(15)),
            official: Array(sortedOfficial.prefix(10))
        )
    }
    
    private func removeDuplicates(from results: [BraveTransferResult]) -> [BraveTransferResult] {
        var seen = Set<String>()
        
        return results.filter { result in
            let key = result.title.lowercased().trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
            
            if seen.contains(key) {
                return false
            } else {
                seen.insert(key)
                return true
            }
        }
    }
    
    // MARK: - 샘플 데이터 생성 (실제 MCP 구현 전까지)
    
    private func generateSampleBraveResults(for query: String) -> [BraveTransferResult] {
        let currentDate = Date()
        
        if query.contains("official") {
            return [
                BraveTransferResult(
                    title: "OFFICIAL: Jude Bellingham joins Real Madrid from Borussia Dortmund",
                    url: "https://www.realmadrid.com/en/news/2024/06/jude-bellingham-signs",
                    snippet: "Real Madrid have officially announced the signing of Jude Bellingham from Borussia Dortmund for a fee of €103 million.",
                    source: "Real Madrid Official",
                    publishedDate: currentDate.addingTimeInterval(-3600),
                    reliability: 95,
                    isOfficial: true,
                    transferType: .completed,
                    playerName: "Jude Bellingham",
                    fromClub: "Borussia Dortmund",
                    toClub: "Real Madrid",
                    transferFee: "€103 million"
                ),
                BraveTransferResult(
                    title: "Arsenal confirm Declan Rice signing from West Ham United",
                    url: "https://www.arsenal.com/news/declan-rice-signs",
                    snippet: "Arsenal have completed the signing of England midfielder Declan Rice from West Ham United for a club record fee.",
                    source: "Arsenal Official",
                    publishedDate: currentDate.addingTimeInterval(-7200),
                    reliability: 95,
                    isOfficial: true,
                    transferType: .completed,
                    playerName: "Declan Rice",
                    fromClub: "West Ham United",
                    toClub: "Arsenal",
                    transferFee: "£105 million"
                )
            ]
        } else if query.contains("rumors") {
            return [
                BraveTransferResult(
                    title: "Kylian Mbappé to Real Madrid: Transfer could happen in summer",
                    url: "https://www.marca.com/mbappe-real-madrid-transfer",
                    snippet: "Reports suggest Kylian Mbappé is considering a move to Real Madrid when his PSG contract expires.",
                    source: "Marca",
                    publishedDate: currentDate.addingTimeInterval(-1800),
                    reliability: 75,
                    isOfficial: false,
                    transferType: .rumor,
                    playerName: "Kylian Mbappé",
                    fromClub: "Paris Saint-Germain",
                    toClub: "Real Madrid",
                    transferFee: "Free Transfer"
                ),
                BraveTransferResult(
                    title: "Manchester United interested in Napoli striker Victor Osimhen",
                    url: "https://www.goal.com/osimhen-manchester-united",
                    snippet: "Manchester United are reportedly monitoring Napoli striker Victor Osimhen ahead of the summer transfer window.",
                    source: "Goal.com",
                    publishedDate: currentDate.addingTimeInterval(-5400),
                    reliability: 65,
                    isOfficial: false,
                    transferType: .interest,
                    playerName: "Victor Osimhen",
                    fromClub: "Napoli",
                    toClub: "Manchester United",
                    transferFee: "€120 million"
                )
            ]
        } else {
            return [
                BraveTransferResult(
                    title: "Mason Mount completes Manchester United move from Chelsea",
                    url: "https://www.manutd.com/mason-mount-signs",
                    snippet: "Manchester United have confirmed the signing of Mason Mount from Chelsea on a five-year contract.",
                    source: "Manchester United",
                    publishedDate: currentDate.addingTimeInterval(-10800),
                    reliability: 90,
                    isOfficial: true,
                    transferType: .completed,
                    playerName: "Mason Mount",
                    fromClub: "Chelsea",
                    toClub: "Manchester United",
                    transferFee: "£60 million"
                ),
                BraveTransferResult(
                    title: "Kai Havertz joins Arsenal from Chelsea in £65m deal",
                    url: "https://www.arsenal.com/kai-havertz-signs",
                    snippet: "Arsenal have completed the signing of Germany international Kai Havertz from Chelsea.",
                    source: "Arsenal Official",
                    publishedDate: currentDate.addingTimeInterval(-14400),
                    reliability: 95,
                    isOfficial: true,
                    transferType: .completed,
                    playerName: "Kai Havertz",
                    fromClub: "Chelsea",
                    toClub: "Arsenal",
                    transferFee: "£65 million"
                )
            ]
        }
    }
    
    // MARK: - 특정 선수 이적 정보 검색
    
    func searchPlayerTransfer(playerName: String) async -> [BraveTransferResult] {
        let query = "\(playerName) transfer news latest official announcement"
        
        do {
            let results = try await searchBraveForTransfers(query: query)
            return results.filter { $0.playerName.lowercased().contains(playerName.lowercased()) }
        } catch {
            print("❌ 선수 검색 실패: \(error)")
            return []
        }
    }
    
    // MARK: - 클럽별 이적 정보 검색
    
    func searchClubTransfers(clubName: String) async -> [BraveTransferResult] {
        let query = "\(clubName) transfer signings latest news official"
        
        do {
            let results = try await searchBraveForTransfers(query: query)
            return results.filter { 
                $0.toClub.lowercased().contains(clubName.lowercased()) || 
                $0.fromClub.lowercased().contains(clubName.lowercased()) 
            }
        } catch {
            print("❌ 클럽 검색 실패: \(error)")
            return []
        }
    }
}

// MARK: - Brave Search 이적 결과 모델

struct BraveTransferResult: Identifiable, Codable {
    var id = UUID()
    let title: String
    let url: String
    let snippet: String
    let source: String
    let publishedDate: Date
    let reliability: Int // 0-100
    let isOfficial: Bool
    let transferType: BraveTransferType
    let playerName: String
    let fromClub: String
    let toClub: String
    let transferFee: String
    
    var reliabilityBadge: String {
        switch reliability {
        case 90...100: return "🟢 매우 신뢰"
        case 70...89: return "🔵 신뢰"
        case 50...69: return "🟡 보통"
        default: return "🔴 낮음"
        }
    }
    
    var reliabilityColor: Color {
        switch reliability {
        case 90...100: return .green
        case 70...89: return .blue
        case 50...69: return .orange
        default: return .red
        }
    }
    
    var typeIcon: String {
        switch transferType {
        case .completed: return "checkmark.circle.fill"
        case .inProgress: return "clock.fill"
        case .rumor: return "questionmark.circle.fill"
        case .interest: return "eye.fill"
        case .rejected: return "xmark.circle.fill"
        }
    }
    
    var formattedDate: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: publishedDate, relativeTo: Date())
    }
}

enum BraveTransferType: String, Codable, CaseIterable {
    case completed = "completed"
    case inProgress = "in_progress"
    case rumor = "rumor"
    case interest = "interest"
    case rejected = "rejected"
    
    var displayName: String {
        switch self {
        case .completed: return "✅ 완료"
        case .inProgress: return "🔄 진행중"
        case .rumor: return "💭 루머"
        case .interest: return "👀 관심"
        case .rejected: return "❌ 무산"
        }
    }
}

// MARK: - MCP Brave Search 통합 함수

extension BraveTransferSearchService {
    
    // 실제 MCP Brave Search 도구 사용
    func performMCPBraveSearch(query: String) async throws -> [BraveTransferResult] {
        // 실제 구현에서는 MCP 서버의 brave_web_search 도구 사용
        /*
        let mcpResult = await MCPServer.braveSearch.search(
            query: query,
            count: 20,
            offset: 0
        )
        
        return parseBraveSearchResults(mcpResult)
        */
        
        // 현재는 샘플 데이터 반환
        return generateSampleBraveResults(for: query)
    }
    
    private func parseBraveSearchResults(_ searchResults: Any) -> [BraveTransferResult] {
        // MCP 검색 결과를 BraveTransferResult로 변환
        // 실제 구현에서는 검색 결과 JSON을 파싱
        return []
    }
}