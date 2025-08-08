interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  key?: string
  forceRefresh?: boolean
}

class ApiCacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5분 기본 캐시
  
  // 캐시 키 생성
  private generateKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramString}`
  }
  
  // 캐시에서 데이터 가져오기
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // TTL 확인
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  // 캐시에 데이터 저장
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  // 캐시 래퍼 함수
  async withCache<T>(
    fetcher: () => Promise<T>,
    endpoint: string,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, key, forceRefresh = false } = options
    const cacheKey = key || this.generateKey(endpoint, options)
    
    // 강제 새로고침이 아니면 캐시 확인
    if (!forceRefresh) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached !== null) {
        console.log(`🎯 Cache hit: ${cacheKey}`)
        return cached
      }
    }
    
    // 캐시 미스 또는 강제 새로고침
    console.log(`🔄 Cache miss: ${cacheKey}`)
    const data = await fetcher()
    
    // 성공적인 응답만 캐싱
    if (data) {
      this.setCache(cacheKey, data, ttl)
    }
    
    return data
  }
  
  // 특정 패턴의 캐시 삭제
  clearPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }
  
  // 전체 캐시 삭제
  clearAll(): void {
    this.cache.clear()
  }
  
  // 캐시 상태 확인
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
  
  // 만료된 캐시 정리
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// 싱글톤 인스턴스
export const apiCache = new ApiCacheManager()

// 주기적인 정리 작업
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 60 * 1000) // 1분마다 정리
}

// 캐시 TTL 프리셋
export const CacheTTL = {
  SHORT: 30 * 1000,        // 30초 - 라이브 데이터
  MEDIUM: 5 * 60 * 1000,   // 5분 - 자주 변경되는 데이터
  LONG: 30 * 60 * 1000,    // 30분 - 정적 데이터
  HOUR: 60 * 60 * 1000,    // 1시간 - 거의 변경되지 않는 데이터
  DAY: 24 * 60 * 60 * 1000 // 1일 - 정적 리소스
}

// 엔드포인트별 캐시 설정
export const CacheConfig: Record<string, number> = {
  'fixtures': CacheTTL.SHORT,      // 라이브 경기
  'fixtures/events': CacheTTL.SHORT,
  'fixtures/statistics': CacheTTL.SHORT,
  'fixtures/lineups': CacheTTL.MEDIUM,
  'teams': CacheTTL.HOUR,
  'leagues': CacheTTL.DAY,
  'standings': CacheTTL.HOUR,
  'players': CacheTTL.HOUR,
  'news': CacheTTL.MEDIUM
}