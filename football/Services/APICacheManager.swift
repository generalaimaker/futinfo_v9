import Foundation

/// API 캐시 항목
struct CacheEntry<T: Codable>: Codable {
    let data: T
    let timestamp: Date
    let ttl: TimeInterval
    
    var isExpired: Bool {
        Date().timeIntervalSince(timestamp) > ttl
    }
}

/// API 캐시 매니저
@MainActor
class APICacheManager {
    static let shared = APICacheManager()
    
    private var memoryCache: [String: Any] = [:]
    private let diskCacheDirectory: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    // 캐시 만료 시간 열거형 (기존 시스템과의 호환성을 위해)
    enum CacheExpiration {
        case never   // 만료되지 않음
        case short   // 30초
        case medium  // 5분
        case long    // 30분
        case hour    // 1시간
        case day     // 1일
        case custom(TimeInterval)
        
        var timeInterval: TimeInterval {
            switch self {
            case .never: return Double.greatestFiniteMagnitude
            case .short: return 30
            case .medium: return 5 * 60
            case .long: return 30 * 60
            case .hour: return 60 * 60
            case .day: return 24 * 60 * 60
            case .custom(let interval): return interval
            }
        }
    }
    
    // 캐시 TTL 프리셋
    enum CacheTTL {
        static let short: TimeInterval = 30 // 30초 - 라이브 데이터
        static let medium: TimeInterval = 5 * 60 // 5분 - 자주 변경되는 데이터
        static let long: TimeInterval = 30 * 60 // 30분 - 정적 데이터
        static let hour: TimeInterval = 60 * 60 // 1시간
        static let day: TimeInterval = 24 * 60 * 60 // 1일
    }
    
    // 엔드포인트별 기본 TTL
    private let endpointTTL: [String: TimeInterval] = [
        "fixtures": CacheTTL.short,
        "fixtures/events": CacheTTL.short,
        "fixtures/statistics": CacheTTL.short,
        "fixtures/lineups": CacheTTL.medium,
        "teams": CacheTTL.hour,
        "leagues": CacheTTL.day,
        "standings": CacheTTL.hour,
        "players": CacheTTL.hour
    ]
    
    private init() {
        // 디스크 캐시 디렉토리 설정
        let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
        diskCacheDirectory = cacheDir.appendingPathComponent("APICache")
        
        // 디렉토리 생성
        try? FileManager.default.createDirectory(at: diskCacheDirectory, withIntermediateDirectories: true)
        
        // 주기적 정리
        Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { _ in
            Task { @MainActor in
                self.cleanup()
            }
        }
    }
    
    /// 캐시에서 데이터 가져오기 (기존 시스템과의 호환성을 위한 메서드)
    func getCache<T: Codable>(_ type: T.Type, for key: String) -> T? {
        return get(type, key: key)
    }
    
    /// 캐시에서 Data 가져오기 (기존 시스템과의 호환성)
    func getCache(for endpoint: String, parameters: [String: String]? = nil) -> Data? {
        let key = cacheKey(for: endpoint, parameters: parameters)
        return get(Data.self, key: key)
    }
    
    /// 캐시 만료 확인
    func isCacheExpired(for endpoint: String, parameters: [String: String]? = nil) -> Bool {
        let key = cacheKey(for: endpoint, parameters: parameters)
        
        // 메모리 캐시 확인
        if let entry = memoryCache[key] {
            return (entry as? CacheEntry<Data>)?.isExpired ?? true
        }
        
        // 디스크 캐시 확인
        let fileURL = diskCacheDirectory.appendingPathComponent("\(key.hashValue).json")
        guard FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL),
              let entry = try? decoder.decode(CacheEntry<Data>.self, from: data) else {
            return true
        }
        
        return entry.isExpired
    }
    
    /// 캐시에 Data 저장 (기존 시스템과의 호환성)
    func setCache(data: Data, for endpoint: String, parameters: [String: String]? = nil, expiration: CacheExpiration) {
        let key = cacheKey(for: endpoint, parameters: parameters)
        set(data, key: key, ttl: expiration.timeInterval)
    }
    
    /// 캐시 키 생성
    private func cacheKey(for endpoint: String, parameters: [String: String]? = nil) -> String {
        var key = endpoint
        if let parameters = parameters, !parameters.isEmpty {
            let sortedParams = parameters.sorted { $0.key < $1.key }
            let paramString = sortedParams.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
            key += ":\(paramString)"
        }
        return key
    }
    
    /// 캐시에서 데이터 가져오기
    func get<T: Codable>(_ type: T.Type, key: String) -> T? {
        // 메모리 캐시 확인
        if let entry = memoryCache[key] as? CacheEntry<T> {
            if !entry.isExpired {
                print("🎯 Memory cache hit: \(key)")
                return entry.data
            } else {
                memoryCache.removeValue(forKey: key)
            }
        }
        
        // 디스크 캐시 확인
        let fileURL = diskCacheDirectory.appendingPathComponent("\(key.hashValue).json")
        
        guard FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL),
              let entry = try? decoder.decode(CacheEntry<T>.self, from: data) else {
            return nil
        }
        
        if !entry.isExpired {
            print("💾 Disk cache hit: \(key)")
            // 메모리 캐시에 복원
            memoryCache[key] = entry
            return entry.data
        } else {
            // 만료된 캐시 삭제
            try? FileManager.default.removeItem(at: fileURL)
        }
        
        return nil
    }
    
    /// 캐시에 데이터 저장
    func set<T: Codable>(_ data: T, key: String, ttl: TimeInterval? = nil) {
        let endpoint = key.components(separatedBy: ":").first ?? ""
        let cacheTTL = ttl ?? endpointTTL[endpoint] ?? CacheTTL.medium
        
        let entry = CacheEntry(data: data, timestamp: Date(), ttl: cacheTTL)
        
        // 메모리 캐시에 저장
        memoryCache[key] = entry
        
        // 디스크 캐시에 저장 (백그라운드)
        Task.detached {
            let fileURL = self.diskCacheDirectory.appendingPathComponent("\(key.hashValue).json")
            if let encoded = try? self.encoder.encode(entry) {
                try? encoded.write(to: fileURL)
            }
        }
    }
    
    /// 캐시 래퍼 함수
    func withCache<T: Codable>(
        _ type: T.Type,
        key: String,
        ttl: TimeInterval? = nil,
        forceRefresh: Bool = false,
        fetcher: () async throws -> T
    ) async throws -> T {
        // 강제 새로고침이 아니면 캐시 확인
        if !forceRefresh, let cached = get(type, key: key) {
            return cached
        }
        
        // 캐시 미스 - 데이터 가져오기
        print("🔄 Cache miss: \(key)")
        let data = try await fetcher()
        
        // 캐시에 저장
        set(data, key: key, ttl: ttl)
        
        return data
    }
    
    /// 특정 패턴의 캐시 삭제
    func clearPattern(_ pattern: String) {
        // 메모리 캐시 정리
        let keysToRemove = memoryCache.keys.filter { $0.contains(pattern) }
        keysToRemove.forEach { memoryCache.removeValue(forKey: $0) }
        
        // 디스크 캐시 정리
        if let files = try? FileManager.default.contentsOfDirectory(at: diskCacheDirectory, includingPropertiesForKeys: nil) {
            files.forEach { url in
                if url.lastPathComponent.contains(pattern) {
                    try? FileManager.default.removeItem(at: url)
                }
            }
        }
    }
    
    /// 전체 캐시 삭제
    func clearAll() {
        memoryCache.removeAll()
        
        if let files = try? FileManager.default.contentsOfDirectory(at: diskCacheDirectory, includingPropertiesForKeys: nil) {
            files.forEach { url in
                try? FileManager.default.removeItem(at: url)
            }
        }
    }
    
    /// 전체 캐시 삭제 (기존 시스템과의 호환성)
    func clearAllCache() {
        clearAll()
    }
    
    /// 특정 캐시 삭제 (기존 시스템과의 호환성)
    func removeCache(for endpoint: String, parameters: [String: String]? = nil) {
        let key = cacheKey(for: endpoint, parameters: parameters)
        
        // 메모리 캐시에서 삭제
        memoryCache.removeValue(forKey: key)
        
        // 디스크 캐시에서 삭제
        let fileURL = diskCacheDirectory.appendingPathComponent("\(key.hashValue).json")
        try? FileManager.default.removeItem(at: fileURL)
    }
    
    /// 만료된 캐시 정리
    private func cleanup() {
        // 메모리 캐시 정리
        let expiredKeys = memoryCache.compactMap { key, value -> String? in
            // 타입에 관계없이 만료 확인
            if let entry = value as? CacheEntry<Data> {
                return entry.isExpired ? key : nil
            }
            // 다른 타입의 CacheEntry도 확인 (동적 타입 체크)
            let mirror = Mirror(reflecting: value)
            if mirror.subjectType == CacheEntry<Data>.self {
                return nil // 이미 위에서 체크함
            }
            // 만료 여부를 확인할 수 없는 경우 보수적으로 유지
            return nil
        }
        
        expiredKeys.forEach { memoryCache.removeValue(forKey: $0) }
        
        // 디스크 캐시 정리는 접근 시 수행
    }
    
    /// 캐시 상태 가져오기
    func getStats() -> (memoryCount: Int, diskSize: Int) {
        let diskSize = (try? FileManager.default.contentsOfDirectory(at: diskCacheDirectory, includingPropertiesForKeys: [.fileSizeKey])
            .reduce(0) { total, url in
                let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
                return total + size
            }) ?? 0
        
        return (memoryCache.count, diskSize)
    }
}