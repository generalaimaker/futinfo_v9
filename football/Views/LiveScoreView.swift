import SwiftUI
import Combine

/// 실시간으로 업데이트되는 스코어 뷰
struct LiveScoreView: View {
    let fixture: Fixture
    @StateObject private var liveData = LiveScoreData()
    
    var body: some View {
        HStack {
            // 홈팀 스코어
            Text("\(liveData.homeScore)")
                .font(.title3.bold())
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.trailing, 10)
                .animation(.easeInOut(duration: 0.3), value: liveData.homeScore)
            
            // 중앙 구분자
            Text(":")
                .font(.title3.bold())
            
            // 원정팀 스코어
            Text("\(liveData.awayScore)")
                .font(.title3.bold())
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 10)
                .animation(.easeInOut(duration: 0.3), value: liveData.awayScore)
        }
        .onAppear {
            liveData.startObserving(fixture: fixture)
        }
        .onDisappear {
            liveData.stopObserving()
        }
    }
}

/// 라이브 스코어 데이터 관리
@MainActor
class LiveScoreData: ObservableObject {
    @Published var homeScore: Int = 0
    @Published var awayScore: Int = 0
    @Published var status: String = ""
    @Published var elapsed: Int? = nil
    
    private var fixture: Fixture?
    private var cancellables = Set<AnyCancellable>()
    
    func startObserving(fixture: Fixture) {
        self.fixture = fixture
        
        // 초기값 설정
        self.homeScore = fixture.goals?.home ?? 0
        self.awayScore = fixture.goals?.away ?? 0
        self.status = fixture.fixture.status.short
        self.elapsed = fixture.fixture.status.elapsed
        
        // 라이브 경기인 경우에만 옵저버 등록
        guard isLiveMatch() else { return }
        
        // LiveMatchRealtimeService의 변경사항 구독
        let realtimeService = LiveMatchRealtimeService.shared
        
        // 경기 업데이트 감지
        realtimeService.$liveMatches
            .compactMap { matches in
                matches.first { $0.fixtureId == fixture.fixture.id }
            }
            .sink { [weak self] liveMatch in
                self?.updateFromLiveMatch(liveMatch)
            }
            .store(in: &cancellables)
        
        // 경기 업데이트 알림 구독
        NotificationCenter.default.publisher(for: Notification.Name("LiveMatchUpdated"))
            .compactMap { $0.userInfo?["match"] as? LiveMatch }
            .filter { $0.fixtureId == fixture.fixture.id }
            .sink { [weak self] liveMatch in
                self?.updateFromLiveMatch(liveMatch)
            }
            .store(in: &cancellables)
        
        // 골 이벤트 알림 구독
        NotificationCenter.default.publisher(for: Notification.Name("LiveMatchGoal"))
            .compactMap { $0.userInfo?["match"] as? LiveMatch }
            .filter { $0.fixtureId == fixture.fixture.id }
            .sink { [weak self] liveMatch in
                self?.updateFromLiveMatch(liveMatch)
                // 골 애니메이션 효과를 위한 진동
                #if os(iOS)
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                #endif
            }
            .store(in: &cancellables)
    }
    
    func stopObserving() {
        cancellables.removeAll()
    }
    
    private func isLiveMatch() -> Bool {
        guard let fixture = fixture else { return false }
        return ["1H", "2H", "HT", "ET", "P", "BT"].contains(fixture.fixture.status.short)
    }
    
    private func updateFromLiveMatch(_ liveMatch: LiveMatch) {
        // 메인 스레드에서 UI 업데이트
        DispatchQueue.main.async { [weak self] in
            // 애니메이션과 함께 스코어 업데이트
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                self?.homeScore = liveMatch.homeScore
                self?.awayScore = liveMatch.awayScore
            }
            
            self?.status = liveMatch.statusShort
            self?.elapsed = liveMatch.elapsed
            
            print("⚽ LiveScoreView 업데이트: \(liveMatch.homeTeamName) \(liveMatch.homeScore) - \(liveMatch.awayScore) \(liveMatch.awayTeamName)")
        }
    }
}