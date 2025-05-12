import Foundation

class APICacheManager {
    static let shared = APICacheManager()
    
    private let memoryCache = NSCache<NSString, CacheEntry>()
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    
    // 캐시 항목 클래스
    class CacheEntry {
        let data: Data
        let timestamp: Date
        let expirationInterval: TimeInterval
        
        init(data: Data, expirationInterval: TimeInterval) {
            self.data = data
            self.timestamp = Date()
            self.expirationInterval = expirationInterval
        }
        
        var isExpired: Bool {
            return Date().timeIntervalSince(timestamp) > expirationInterval
        }
    }
    
    // 캐시 만료 시간 (초 단위)
    enum CacheExpiration {
        case veryShort  // 15분
        case short      // 30분
        case medium     // 1시간
        case long       // 6시간
        case veryLong   // 1일
        case never      // 만료 없음
        case custom(TimeInterval)  // 사용자 정의 시간(초)
        
        var timeInterval: TimeInterval {
            switch self {
            case .veryShort: return 15 * 60
            case .short:     return 30 * 60
            case .medium:    return 60 * 60
            case .long:      return 6 * 60 * 60
            case .veryLong:  return 24 * 60 * 60
            case .never:     return TimeInterval.greatestFiniteMagnitude
            case .custom(let seconds): return seconds
            }
        }
    }
    
    private init() {
        // 메모리 캐시 설정
        memoryCache.countLimit = 200 // 최대 200개 항목
        memoryCache.totalCostLimit = 100 * 1024 * 1024 // 100MB
        
        // 디스크 캐시 디렉토리 설정
        let cachesDirectory = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        cacheDirectory = cachesDirectory.appendingPathComponent("FootballAPICache")
        
        // 캐시 디렉토리 생성
        do {
            try fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        } catch {
            print("❌ Failed to create cache directory: \(error)")
        }
        
        // 만료된 캐시 정리 (앱 시작 시)
        cleanExpiredCache()
    }
    
    // 캐시 키 생성
    private func cacheKey(for endpoint: String, parameters: [String: String]? = nil) -> String {
        var key = endpoint
        
        if let parameters = parameters, !parameters.isEmpty {
            let sortedParams = parameters.sorted { $0.key < $1.key }
            let paramString = sortedParams.map { "\($0.key)=\($0.value)" }.joined(separator: "&")
            key += "?" + paramString
        }
        
        return key
    }
    
    // 디스크 캐시 파일 경로
    private func fileURL(for key: String) -> URL {
        let filename = key.sha256()
        return cacheDirectory.appendingPathComponent(filename)
    }
    
    // 캐시에 데이터 저장
    func setCache(data: Data, for endpoint: String, parameters: [String: String]? = nil, expiration: CacheExpiration = .medium) {
        let key = cacheKey(for: endpoint, parameters: parameters)
        let cacheEntry = CacheEntry(data: data, expirationInterval: expiration.timeInterval)
        
        // 메모리 캐시에 저장
        memoryCache.setObject(cacheEntry, forKey: key as NSString)
        
        // 디스크 캐시에 저장
        let fileURL = self.fileURL(for: key)
        
        do {
            // 캐시 메타데이터
            let metadata: [String: Any] = [
                "timestamp": cacheEntry.timestamp.timeIntervalSince1970,
                "expiration": cacheEntry.expirationInterval
            ]
            
            // 메타데이터와 데이터를 함께 저장
            let metadataData = try JSONSerialization.data(withJSONObject: metadata)
            
            // 메타데이터 크기 (4바이트 정수) + 메타데이터 + 실제 데이터
            var combinedData = Data()
            let metadataSize = UInt32(metadataData.count)
            withUnsafeBytes(of: metadataSize) { bytes in
                combinedData.append(contentsOf: bytes)
            }
            combinedData.append(metadataData)
            combinedData.append(data)
            
            try combinedData.write(to: fileURL)
            print("✅ Cached data for: \(key)")
        } catch {
            print("❌ Failed to write cache to disk: \(error)")
        }
    }
    
    // 캐시에서 데이터 가져오기
    func getCache(for endpoint: String, parameters: [String: String]? = nil) -> Data? {
        let key = cacheKey(for: endpoint, parameters: parameters)
        
        // 1. 메모리 캐시 확인
        if let cacheEntry = memoryCache.object(forKey: key as NSString) {
            if !cacheEntry.isExpired {
                print("✅ Memory cache hit for: \(key)")
                return cacheEntry.data
            } else {
                // 만료된 캐시 제거
                memoryCache.removeObject(forKey: key as NSString)
                print("⏰ Memory cache expired for: \(key)")
            }
        }
        
        // 2. 디스크 캐시 확인
        let fileURL = self.fileURL(for: key)
        
        if fileManager.fileExists(atPath: fileURL.path) {
            do {
                let data = try Data(contentsOf: fileURL)
                
                // 메타데이터 크기 읽기
                var metadataSize: UInt32 = 0
                data.withUnsafeBytes { bytes in
                    if bytes.count >= 4 {
                        metadataSize = bytes.load(fromByteOffset: 0, as: UInt32.self)
                    }
                }
                
                // 메타데이터 추출
                let metadataData = data.subdata(in: 4..<(4 + Int(metadataSize)))
                let metadata = try JSONSerialization.jsonObject(with: metadataData) as? [String: Any]
                
                // 실제 데이터 추출
                let actualData = data.subdata(in: (4 + Int(metadataSize))..<data.count)
                
                // 만료 확인
                if let timestamp = metadata?["timestamp"] as? TimeInterval,
                   let expiration = metadata?["expiration"] as? TimeInterval {
                    let cacheDate = Date(timeIntervalSince1970: timestamp)
                    let isExpired = Date().timeIntervalSince(cacheDate) > expiration
                    
                    if !isExpired {
                        // 메모리 캐시에도 저장
                        let cacheEntry = CacheEntry(data: actualData, expirationInterval: expiration)
                        memoryCache.setObject(cacheEntry, forKey: key as NSString)
                        
                        print("✅ Disk cache hit for: \(key)")
                        return actualData
                    } else {
                        // 만료된 캐시 파일 삭제
                        try? fileManager.removeItem(at: fileURL)
                        print("⏰ Disk cache expired for: \(key)")
                    }
                }
            } catch {
                print("❌ Failed to read cache from disk: \(error)")
            }
        }
        
        print("❌ No cache found for: \(key)")
        return nil
    }
    
    // 캐시 만료 여부 확인
    func isCacheExpired(for endpoint: String, parameters: [String: String]? = nil) -> Bool {
        let key = cacheKey(for: endpoint, parameters: parameters)
        
        // 1. 메모리 캐시 확인
        if let cacheEntry = memoryCache.object(forKey: key as NSString) {
            return cacheEntry.isExpired
        }
        
        // 2. 디스크 캐시 확인
        let fileURL = self.fileURL(for: key)
        
        if fileManager.fileExists(atPath: fileURL.path) {
            do {
                let data = try Data(contentsOf: fileURL)
                
                // 메타데이터 크기 읽기
                var metadataSize: UInt32 = 0
                data.withUnsafeBytes { bytes in
                    if bytes.count >= 4 {
                        metadataSize = bytes.load(fromByteOffset: 0, as: UInt32.self)
                    }
                }
                
                // 메타데이터 추출
                let metadataData = data.subdata(in: 4..<(4 + Int(metadataSize)))
                let metadata = try JSONSerialization.jsonObject(with: metadataData) as? [String: Any]
                
                // 만료 확인
                if let timestamp = metadata?["timestamp"] as? TimeInterval,
                   let expiration = metadata?["expiration"] as? TimeInterval {
                    let cacheDate = Date(timeIntervalSince1970: timestamp)
                    return Date().timeIntervalSince(cacheDate) > expiration
                }
            } catch {
                print("❌ Failed to read cache from disk: \(error)")
            }
        }
        
        // 캐시가 없으면 만료된 것으로 간주
        return true
    }
    
    // 특정 캐시 항목 삭제
    func removeCache(for endpoint: String, parameters: [String: String]? = nil) {
        let key = cacheKey(for: endpoint, parameters: parameters)
        
        // 메모리 캐시에서 제거
        memoryCache.removeObject(forKey: key as NSString)
        
        // 디스크 캐시에서 제거
        let fileURL = self.fileURL(for: key)
        if fileManager.fileExists(atPath: fileURL.path) {
            do {
                try fileManager.removeItem(at: fileURL)
                print("✅ Removed cache for: \(key)")
            } catch {
                print("❌ Failed to remove cache file: \(error)")
            }
        }
    }
    
    // 모든 캐시 삭제
    func clearAllCache() {
        // 메모리 캐시 비우기
        memoryCache.removeAllObjects()
        
        // 디스크 캐시 비우기
        do {
            let cacheFiles = try fileManager.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: nil)
            for file in cacheFiles {
                try fileManager.removeItem(at: file)
            }
            print("✅ Cleared all cache")
        } catch {
            print("❌ Failed to clear disk cache: \(error)")
        }
    }
    
    // 만료된 캐시 정리
    func cleanExpiredCache() {
        DispatchQueue.global(qos: .background).async { [weak self] in
            guard let self = self else { return }
            
            do {
                let cacheFiles = try self.fileManager.contentsOfDirectory(at: self.cacheDirectory, includingPropertiesForKeys: nil)
                
                for file in cacheFiles {
                    do {
                        let data = try Data(contentsOf: file)
                        
                        // 메타데이터 크기 읽기
                        var metadataSize: UInt32 = 0
                        data.withUnsafeBytes { bytes in
                            if bytes.count >= 4 {
                                metadataSize = bytes.load(fromByteOffset: 0, as: UInt32.self)
                            }
                        }
                        
                        // 메타데이터 추출
                        let metadataData = data.subdata(in: 4..<(4 + Int(metadataSize)))
                        let metadata = try JSONSerialization.jsonObject(with: metadataData) as? [String: Any]
                        
                        // 만료 확인
                        if let timestamp = metadata?["timestamp"] as? TimeInterval,
                           let expiration = metadata?["expiration"] as? TimeInterval {
                            let cacheDate = Date(timeIntervalSince1970: timestamp)
                            let isExpired = Date().timeIntervalSince(cacheDate) > expiration
                            
                            if isExpired {
                                try self.fileManager.removeItem(at: file)
                                print("🧹 Removed expired cache file: \(file.lastPathComponent)")
                            }
                        }
                    } catch {
                        print("❌ Failed to process cache file: \(error)")
                    }
                }
            } catch {
                print("❌ Failed to list cache files: \(error)")
            }
        }
    }
}

// String 확장으로 SHA256 해시 생성 (캐시 키 중복 방지)
extension String {
    func sha256() -> String {
        if let data = self.data(using: .utf8) {
            var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
            data.withUnsafeBytes {
                _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &digest)
            }
            return digest.map { String(format: "%02x", $0) }.joined()
        }
        return self
    }
}

// CommonCrypto 프레임워크 임포트
import CommonCrypto
