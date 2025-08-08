interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  retryAfter?: number
}

interface RequestRecord {
  timestamp: number
  endpoint: string
}

class RateLimitManager {
  private requests: RequestRecord[] = []
  private queued: Array<() => void> = []
  private blocked = false
  private blockUntil = 0
  
  // 기본 설정: 분당 100개 요청
  private config: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1분
    retryAfter: 5000 // 5초 후 재시도
  }
  
  // 설정 업데이트
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  // 요청 가능 여부 확인
  canMakeRequest(): boolean {
    this.cleanOldRequests()
    
    // 차단 상태 확인
    if (this.blocked && Date.now() < this.blockUntil) {
      return false
    }
    
    // 차단 해제
    if (this.blocked && Date.now() >= this.blockUntil) {
      this.blocked = false
      this.processQueue()
    }
    
    return this.requests.length < this.config.maxRequests
  }
  
  // 요청 기록
  recordRequest(endpoint: string): void {
    this.requests.push({
      timestamp: Date.now(),
      endpoint
    })
  }
  
  // 오래된 요청 정리
  private cleanOldRequests(): void {
    const cutoff = Date.now() - this.config.windowMs
    this.requests = this.requests.filter(req => req.timestamp > cutoff)
  }
  
  // 대기열에 추가
  async waitForSlot(): Promise<void> {
    if (this.canMakeRequest()) {
      return
    }
    
    return new Promise(resolve => {
      this.queued.push(resolve)
    })
  }
  
  // 대기열 처리
  private processQueue(): void {
    while (this.queued.length > 0 && this.canMakeRequest()) {
      const resolve = this.queued.shift()
      if (resolve) resolve()
    }
  }
  
  // 레이트 리밋 에러 처리
  handleRateLimitError(retryAfter?: number): void {
    this.blocked = true
    this.blockUntil = Date.now() + (retryAfter || this.config.retryAfter!)
    
    console.warn(`⚠️ Rate limit hit. Blocked until ${new Date(this.blockUntil).toLocaleTimeString()}`)
  }
  
  // 현재 상태 가져오기
  getStatus(): {
    currentRequests: number
    maxRequests: number
    remainingRequests: number
    resetTime: Date
    blocked: boolean
  } {
    this.cleanOldRequests()
    
    return {
      currentRequests: this.requests.length,
      maxRequests: this.config.maxRequests,
      remainingRequests: Math.max(0, this.config.maxRequests - this.requests.length),
      resetTime: new Date(Date.now() + this.config.windowMs),
      blocked: this.blocked
    }
  }
  
  // 요청별 통계
  getEndpointStats(): Record<string, number> {
    this.cleanOldRequests()
    
    const stats: Record<string, number> = {}
    this.requests.forEach(req => {
      stats[req.endpoint] = (stats[req.endpoint] || 0) + 1
    })
    
    return stats
  }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimitManager()

// API 요청 래퍼
export async function withRateLimit<T>(
  request: () => Promise<T>,
  endpoint: string
): Promise<T> {
  // 요청 가능할 때까지 대기
  await rateLimiter.waitForSlot()
  
  // 요청 기록
  rateLimiter.recordRequest(endpoint)
  
  try {
    const result = await request()
    return result
  } catch (error: any) {
    // 429 에러 처리
    if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after']
      const retryMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined
      rateLimiter.handleRateLimitError(retryMs)
      
      // 에러 재발생
      throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`)
    }
    
    throw error
  }
}

// 배치 요청 관리
export class BatchRequestManager {
  private batch: Array<{
    request: () => Promise<any>
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []
  
  private batchSize = 5
  private batchDelay = 1000 // 1초
  private processing = false
  
  // 배치에 요청 추가
  add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ request, resolve, reject })
      
      if (!this.processing) {
        this.processBatch()
      }
    })
  }
  
  // 배치 처리
  private async processBatch(): Promise<void> {
    if (this.processing || this.batch.length === 0) return
    
    this.processing = true
    
    while (this.batch.length > 0) {
      // 배치 크기만큼 가져오기
      const currentBatch = this.batch.splice(0, this.batchSize)
      
      // 병렬 처리
      const promises = currentBatch.map(async ({ request, resolve, reject }) => {
        try {
          const result = await withRateLimit(request, 'batch')
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      await Promise.allSettled(promises)
      
      // 다음 배치 전 대기
      if (this.batch.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelay))
      }
    }
    
    this.processing = false
  }
}

export const batchManager = new BatchRequestManager()