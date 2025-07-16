import Foundation

/// 스마트 캐시 매니저 - 동적 캐시 만료 시간 및 우선순위 기반 캐싱
class SmartCacheManager {
    static let shared = SmartCacheManager()
    
    private let cache = NSCache<NSString, CachedFixtures>()
    private var cacheMetadata: [String: CacheMetadata] = [:]
    private let metadataQueue = DispatchQueue(label: "com.futinfo.cache.metadata", attributes: .concurrent)
    
    private init() {
        cache.countLimit = 500 // 최대 500개 항목
        cache.totalCostLimit = 200 * 1024 * 1024 // 200MB
    }
    
    // MARK: - Cache Models
    
    private class CachedFixtures: NSObject {
        let fixtures: [Any] // Fixture 타입을 Any로 변경
        let metadata: CacheMetadata
        
        init(fixtures: [Any], metadata: CacheMetadata) {
            self.fixtures = fixtures
            self.metadata = metadata
        }
    }
    
    struct CacheMetadata {
        let date: Date
        let savedAt: Date
        let expiresAt: Date
        let priority: CachePriority
        let hasLiveMatches: Bool
        let isEmpty: Bool
    }
    
    enum CachePriority: Int {
        case live = 0      // 라이브 경기
        case today = 1     // 오늘 경기
        case upcoming = 2  // 예정된 경기
        case recent = 3    // 최근 경기
        case old = 4       // 오래된 경기
        case empty = 5     // 빈 응답
    }
    
    // MARK: - Public Methods
    
    /// 캐시에서 경기 데이터 조회
    func getFixtures(for dateString: String) -> [Any]? {
        guard let cached = cache.object(forKey: dateString as NSString) else { return nil }
        
        // 만료 확인
        if Date() > cached.metadata.expiresAt {
            cache.removeObject(forKey: dateString as NSString)
            removeMetadata(for: dateString)
            return nil
        }
        
        // 캐시 히트 기록
        recordCacheHit(for: dateString)
        
        return cached.fixtures
    }
    
    /// 캐시에 경기 데이터 저장
    func saveFixtures(_ fixtures: [Any], for dateString: String, date: Date, hasLiveMatches: Bool = false) {
        
        let priority = determinePriority(for: date, hasLiveMatches: hasLiveMatches, isEmpty: fixtures.isEmpty)
        let expirationTime = getExpirationTime(for: priority)
        
        let metadata = CacheMetadata(
            date: date,
            savedAt: Date(),
            expiresAt: Date().addingTimeInterval(expirationTime),
            priority: priority,
            hasLiveMatches: hasLiveMatches,
            isEmpty: fixtures.isEmpty
        )
        
        let cached = CachedFixtures(fixtures: fixtures, metadata: metadata)
        let cost = fixtures.count * 1024 // 예상 메모리 사용량
        
        cache.setObject(cached, forKey: dateString as NSString, cost: cost)
        saveMetadata(metadata, for: dateString)
        
        // 캐시 정리
        cleanupIfNeeded()
    }
    
    /// 캐시 유효성 확인 (만료되지 않았는지)
    func isCacheValid(for dateString: String) -> Bool {
        guard let metadata = getMetadata(for: dateString) else { return false }
        return Date() < metadata.expiresAt
    }
    
    /// 캐시 메타데이터 조회
    func getCacheAge(for dateString: String) -> TimeInterval? {
        guard let metadata = getMetadata(for: dateString) else { return nil }
        return Date().timeIntervalSince(metadata.savedAt)
    }
    
    /// 모든 캐시 삭제
    func clearAll() {
        cache.removeAllObjects()
        metadataQueue.async(flags: .barrier) {
            self.cacheMetadata.removeAll()
        }
    }
    
    // MARK: - Private Methods
    
    private func determinePriority(for date: Date, hasLiveMatches: Bool, isEmpty: Bool) -> CachePriority {
        if isEmpty { return .empty }
        
        let calendar = Calendar.current
        let now = Date()
        
        if hasLiveMatches { return .live }
        if calendar.isDateInToday(date) { return .today }
        if date > now { return .upcoming }
        
        let daysDifference = calendar.dateComponents([.day], from: date, to: now).day ?? 0
        if daysDifference <= 7 { return .recent }
        
        return .old
    }
    
    private func getExpirationTime(for priority: CachePriority) -> TimeInterval {
        switch priority {
        case .live:
            return 60 // 1분
        case .today:
            return 300 // 5분
        case .upcoming:
            return 1800 // 30분
        case .recent:
            return 3600 // 1시간
        case .old:
            return 21600 // 6시간
        case .empty:
            return 300 // 5분 (빈 응답은 짧게)
        }
    }
    
    private func saveMetadata(_ metadata: CacheMetadata, for key: String) {
        metadataQueue.async(flags: .barrier) {
            self.cacheMetadata[key] = metadata
        }
    }
    
    private func getMetadata(for key: String) -> CacheMetadata? {
        metadataQueue.sync {
            return cacheMetadata[key]
        }
    }
    
    private func removeMetadata(for key: String) {
        metadataQueue.async(flags: .barrier) {
            self.cacheMetadata.removeValue(forKey: key)
        }
    }
    
    private func recordCacheHit(for key: String) {
        // 캐시 히트율 통계 (향후 구현)
        #if DEBUG
        print("📊 캐시 히트: \(key)")
        #endif
    }
    
    private func cleanupIfNeeded() {
        metadataQueue.async(flags: .barrier) {
            // 만료된 항목 정리
            let now = Date()
            let expiredKeys = self.cacheMetadata.compactMap { key, metadata in
                metadata.expiresAt < now ? key : nil
            }
            
            for key in expiredKeys {
                self.cacheMetadata.removeValue(forKey: key)
                DispatchQueue.main.async {
                    self.cache.removeObject(forKey: key as NSString)
                }
            }
            
            // 우선순위가 낮은 항목부터 제거 (메모리 압박 시)
            if self.cacheMetadata.count > 300 {
                let sortedKeys = self.cacheMetadata.sorted { 
                    $0.value.priority.rawValue > $1.value.priority.rawValue 
                }
                
                let keysToRemove = sortedKeys.prefix(100).map { $0.key }
                for key in keysToRemove {
                    self.cacheMetadata.removeValue(forKey: key)
                    DispatchQueue.main.async {
                        self.cache.removeObject(forKey: key as NSString)
                    }
                }
            }
        }
    }
    
    // MARK: - Cache Statistics
    
    func getCacheStatistics() -> CacheStatistics {
        metadataQueue.sync {
            let totalItems = cacheMetadata.count
            let liveItems = cacheMetadata.values.filter { $0.priority == .live }.count
            let emptyItems = cacheMetadata.values.filter { $0.isEmpty }.count
            let validItems = cacheMetadata.values.filter { $0.expiresAt > Date() }.count
            
            return CacheStatistics(
                totalItems: totalItems,
                validItems: validItems,
                liveItems: liveItems,
                emptyItems: emptyItems,
                oldestItem: cacheMetadata.values.min(by: { $0.savedAt < $1.savedAt })?.savedAt
            )
        }
    }
}

struct CacheStatistics {
    let totalItems: Int
    let validItems: Int
    let liveItems: Int
    let emptyItems: Int
    let oldestItem: Date?
}