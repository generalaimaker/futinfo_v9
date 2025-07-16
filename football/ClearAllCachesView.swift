import SwiftUI
import Kingfisher

struct ClearAllCachesView: View {
    @EnvironmentObject var fixturesViewModel: FixturesOverviewViewModel
    @State private var showingAlert = false
    @State private var isClearing = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("캐시 완전 삭제")
                .font(.largeTitle)
                .padding()
            
            Text("더미 데이터가 계속 표시되는 문제를 해결하기 위해\n모든 캐시를 완전히 삭제합니다.")
                .multilineTextAlignment(.center)
                .padding()
            
            if isClearing {
                ProgressView("캐시 삭제 중...")
                    .padding()
            } else {
                Button(action: clearAllCaches) {
                    Label("모든 캐시 삭제", systemImage: "trash.fill")
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.red)
                        .cornerRadius(10)
                }
            }
            
            Spacer()
        }
        .alert("캐시 삭제 완료", isPresented: $showingAlert) {
            Button("확인") {
                // 앱 재시작 권장
            }
        } message: {
            Text("모든 캐시가 삭제되었습니다.\n앱을 완전히 종료하고 다시 시작하세요.")
        }
    }
    
    private func clearAllCaches() {
        isClearing = true
        
        Task {
            // 1. Kingfisher 이미지 캐시 삭제
            KingfisherManager.shared.cache.clearMemoryCache()
            await KingfisherManager.shared.cache.clearDiskCache()
            await KingfisherManager.shared.cache.cleanExpiredDiskCache()
            
            // 2. ViewModel의 캐시 초기화
            await MainActor.run {
                fixturesViewModel.clearAllCaches()
            }
            
            // 3. 추가로 UserDefaults 완전 초기화
            let domain = Bundle.main.bundleIdentifier!
            UserDefaults.standard.removePersistentDomain(forName: domain)
            UserDefaults.standard.synchronize()
            
            // 4. 파일 시스템 캐시 삭제
            if let cacheURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first {
                try? FileManager.default.removeItem(at: cacheURL)
            }
            
            // 5. URLCache 초기화
            URLCache.shared.removeAllCachedResponses()
            
            // 6. 메모리 경고 시뮬레이션으로 메모리 캐시 정리
            NotificationCenter.default.post(
                name: UIApplication.didReceiveMemoryWarningNotification,
                object: nil
            )
            
            await MainActor.run {
                isClearing = false
                showingAlert = true
            }
        }
    }
}