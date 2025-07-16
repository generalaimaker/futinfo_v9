import SwiftUI

struct FixturesCacheDebugView: View {
    @StateObject private var viewModel = FixturesOverviewViewModel()
    @State private var selectedDate = Date()
    @State private var showDatePicker = false
    @State private var cacheInfo = ""
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // 날짜 선택
                    VStack(alignment: .leading, spacing: 10) {
                        Text("날짜 선택")
                            .font(.headline)
                        
                        Button(action: { showDatePicker.toggle() }) {
                            HStack {
                                Image(systemName: "calendar")
                                Text(formatDate(selectedDate))
                                Spacer()
                                Image(systemName: "chevron.down")
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                        }
                        
                        if showDatePicker {
                            DatePicker("", selection: $selectedDate, displayedComponents: .date)
                                .datePickerStyle(GraphicalDatePickerStyle())
                                .padding()
                        }
                    }
                    .padding(.horizontal)
                    
                    // 캐시 정보
                    VStack(alignment: .leading, spacing: 10) {
                        Text("캐시 정보")
                            .font(.headline)
                        
                        Text(cacheInfo.isEmpty ? "캐시 정보 없음" : cacheInfo)
                            .font(.system(.caption, design: .monospaced))
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                    }
                    .padding(.horizontal)
                    
                    // 액션 버튼들
                    VStack(spacing: 10) {
                        Button(action: checkCache) {
                            Label("캐시 확인", systemImage: "magnifyingglass")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        
                        Button(action: forceRefresh) {
                            Label("강제 새로고침", systemImage: "arrow.clockwise")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        
                        Button(action: clearCache) {
                            Label("캐시 초기화", systemImage: "trash")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        
                        Button(action: clearDateCache) {
                            Label("선택한 날짜 캐시만 삭제", systemImage: "xmark.circle")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                    }
                    .padding(.horizontal)
                    .disabled(isLoading)
                    
                    if isLoading {
                        ProgressView()
                            .padding()
                    }
                    
                    // 경기 목록
                    if let fixtures = viewModel.fixtures[Calendar.current.startOfDay(for: selectedDate)] {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("경기 목록 (\(fixtures.count)개)")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ForEach(fixtures) { fixture in
                                VStack(alignment: .leading) {
                                    Text("\(fixture.teams.home.name) vs \(fixture.teams.away.name)")
                                        .font(.subheadline)
                                    Text("리그: \(fixture.league.name)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text("상태: \(fixture.fixture.status.short)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding()
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                                .padding(.horizontal)
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("일정 캐시 디버그")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd (E)"
        formatter.locale = Locale(identifier: "ko_KR")
        return formatter.string(from: date)
    }
    
    private func checkCache() {
        let dateString = viewModel.formatDateForAPI(selectedDate)
        let startOfDay = Calendar.current.startOfDay(for: selectedDate)
        
        var info = "날짜: \(dateString)\n"
        
        // 메모리 캐시 확인
        if let cachedFixtures = UserDefaults.standard.dictionary(forKey: "cachedFixtures") as? [String: Data],
           let cacheData = cachedFixtures[dateString] {
            info += "메모리 캐시: 있음 (\(cacheData.count) bytes)\n"
            
            // 캐시 날짜 확인
            if let cacheDates = UserDefaults.standard.dictionary(forKey: "cacheDates") as? [String: Date],
               let cacheDate = cacheDates[dateString] {
                let age = Date().timeIntervalSince(cacheDate) / 60
                info += "캐시 생성: \(Int(age))분 전\n"
                
                // 캐시 만료 시간 계산
                let calendar = Calendar.current
                let today = calendar.startOfDay(for: Date())
                let isPastDay = startOfDay < today
                
                let expirationMinutes: Double = isPastDay ? 360 : 15 // 과거: 6시간, 기타: 15분
                let isExpired = age > expirationMinutes
                
                info += "캐시 만료 시간: \(Int(expirationMinutes))분\n"
                info += "캐시 상태: \(isExpired ? "만료됨" : "유효함")\n"
            }
            
            // 경기 수 확인  
            if let fixtures = try? JSONDecoder().decode([Fixture].self, from: cacheData) {
                info += "캐시된 경기 수: \(fixtures.count)개\n"
                
                if fixtures.isEmpty {
                    info += "⚠️ 빈 캐시가 저장되어 있습니다!\n"
                }
            }
        } else {
            info += "메모리 캐시: 없음\n"
        }
        
        // 현재 로드된 데이터 확인
        if let fixtures = viewModel.fixtures[startOfDay] {
            info += "\n현재 로드된 경기: \(fixtures.count)개"
        } else {
            info += "\n현재 로드된 경기: 없음"
        }
        
        cacheInfo = info
    }
    
    private func forceRefresh() {
        isLoading = true
        cacheInfo = "강제 새로고침 중..."
        
        Task {
            await viewModel.loadFixturesForDate(Calendar.current.startOfDay(for: selectedDate), forceRefresh: true)
            
            await MainActor.run {
                isLoading = false
                checkCache()
            }
        }
    }
    
    private func clearCache() {
        viewModel.clearAllCaches()
        cacheInfo = "전체 캐시가 초기화되었습니다."
        
        // 초기화 후 재로드
        forceRefresh()
    }
    
    private func clearDateCache() {
        let dateString = viewModel.formatDateForAPI(selectedDate)
        viewModel.clearCacheForDate(Calendar.current.startOfDay(for: selectedDate))
        
        cacheInfo = "\(dateString) 날짜의 캐시가 삭제되었습니다."
        
        // 삭제 후 재로드
        forceRefresh()
    }
}

#Preview {
    FixturesCacheDebugView()
}