import Foundation

// 앱 설정 관리
class AppConfiguration {
    static let shared = AppConfiguration()
    
    // Supabase Edge Functions 사용 여부
    var useSupabaseEdgeFunctions: Bool {
        get {
            return UserDefaults.standard.bool(forKey: "useSupabaseEdgeFunctions")
        }
        set {
            UserDefaults.standard.set(newValue, forKey: "useSupabaseEdgeFunctions")
        }
    }
    
    // Supabase Edge Functions URL
    let supabaseEdgeFunctionsURL = "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1"
    
    // 로컬 테스트 모드
    var isLocalTesting: Bool {
        #if DEBUG
        return UserDefaults.standard.bool(forKey: "useLocalSupabaseFunctions")
        #else
        return false
        #endif
    }
    
    // 현재 Supabase Edge Functions URL
    var currentSupabaseEdgeFunctionsURL: String {
        return supabaseEdgeFunctionsURL
    }
    
    // API 캐시 설정
    var apiCacheDuration: TimeInterval {
        return 3600 // 1시간
    }
    
    // 이미지 캐시 설정
    var imageCacheDuration: TimeInterval {
        return 86400 * 7 // 7일
    }
    
    private init() {
        // 기본값 설정
        if !UserDefaults.standard.bool(forKey: "hasSetDefaults") {
            UserDefaults.standard.set(true, forKey: "hasSetDefaults")
            UserDefaults.standard.set(true, forKey: "useSupabaseEdgeFunctions") // 기본적으로 Supabase Edge Functions 사용
        }
    }
}

// 개발자 설정 화면용 토글
extension AppConfiguration {
    func toggleSupabaseEdgeFunctions() {
        useSupabaseEdgeFunctions.toggle()
        print("Supabase Edge Functions 사용: \(useSupabaseEdgeFunctions)")
    }
    
    func toggleLocalTesting() {
        #if DEBUG
        UserDefaults.standard.set(!isLocalTesting, forKey: "useLocalSupabaseFunctions")
        print("로컬 Supabase Functions 사용: \(isLocalTesting)")
        #endif
    }
}