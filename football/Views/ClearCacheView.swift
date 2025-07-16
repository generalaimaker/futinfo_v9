import SwiftUI

struct ClearCacheView: View {
    @State private var showingAlert = false
    @State private var cacheCleared = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("캐시 관리")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("이전에 저장된 뉴스 캐시에 축구 외 다른 스포츠 뉴스가 포함되어 있을 수 있습니다.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Button(action: {
                showingAlert = true
            }) {
                Label("모든 캐시 삭제", systemImage: "trash")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding(.horizontal)
            
            if cacheCleared {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("캐시가 성공적으로 삭제되었습니다")
                        .foregroundColor(.green)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .alert("캐시 삭제", isPresented: $showingAlert) {
            Button("취소", role: .cancel) { }
            Button("삭제", role: .destructive) {
                clearAllCache()
            }
        } message: {
            Text("모든 뉴스 캐시를 삭제하시겠습니까? 앱이 새로운 뉴스를 다시 가져올 것입니다.")
        }
    }
    
    private func clearAllCache() {
        // 모든 캐시 삭제
        EnhancedNewsCacheManager.shared.clearAllCache()
        
        // UserDefaults에서 뉴스 관련 모든 데이터 삭제
        let userDefaults = UserDefaults.standard
        let keys = userDefaults.dictionaryRepresentation().keys
        
        for key in keys {
            if key.contains("news_") || key.contains("cache_") {
                userDefaults.removeObject(forKey: key)
            }
        }
        
        userDefaults.synchronize()
        
        withAnimation {
            cacheCleared = true
        }
        
        // 3초 후 메시지 숨기기
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            withAnimation {
                cacheCleared = false
            }
        }
    }
}

struct ClearCacheView_Previews: PreviewProvider {
    static var previews: some View {
        ClearCacheView()
    }
}