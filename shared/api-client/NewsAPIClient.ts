// Unified API Client with Caching Strategy

interface NewsAPIConfig {
  baseURL: string
  timeout?: number
  cacheEnabled?: boolean
  cacheDuration?: number // in seconds
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class NewsAPIClient {
  private config: NewsAPIConfig
  private cache: Map<string, CacheEntry<any>>
  private pendingRequests: Map<string, Promise<any>>

  constructor(config: NewsAPIConfig) {
    this.config = {
      timeout: 30000,
      cacheEnabled: true,
      cacheDuration: 300, // 5 minutes default
      ...config
    }
    this.cache = new Map()
    this.pendingRequests = new Map()
  }

  // Main API methods
  async getNews(params: {
    category?: string
    page?: number
    limit?: number
    forceRefresh?: boolean
  }): Promise<NewsResponse> {
    const cacheKey = this.getCacheKey('news', params)
    
    // Check cache first (unless force refresh)
    if (!params.forceRefresh && this.config.cacheEnabled) {
      const cached = this.getFromCache<NewsResponse>(cacheKey)
      if (cached) {
        console.log('📱 Cache hit:', cacheKey)
        return cached
      }
    }
    
    // Check if request is already pending (prevent duplicate requests)
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ Returning pending request:', cacheKey)
      return this.pendingRequests.get(cacheKey)!
    }
    
    // Make the request
    const requestPromise = this.makeRequest<NewsResponse>('/api/news', {
      params: {
        category: params.category,
        page: params.page || 1,
        limit: params.limit || 20
      }
    })
    
    // Store as pending
    this.pendingRequests.set(cacheKey, requestPromise)
    
    try {
      const response = await requestPromise
      
      // Cache the response
      if (this.config.cacheEnabled) {
        this.saveToCache(cacheKey, response)
      }
      
      return response
    } finally {
      // Remove from pending
      this.pendingRequests.delete(cacheKey)
    }
  }

  async getNewsDetail(id: string): Promise<NewsArticleDetail> {
    const cacheKey = `news-detail-${id}`
    
    const cached = this.getFromCache<NewsArticleDetail>(cacheKey)
    if (cached) return cached
    
    const response = await this.makeRequest<NewsArticleDetail>(`/api/news/${id}`)
    this.saveToCache(cacheKey, response, 600) // Cache for 10 minutes
    
    return response
  }

  // Cache management
  private getCacheKey(endpoint: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .filter(key => params[key] !== undefined)
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return `${endpoint}?${sortedParams}`
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  private saveToCache<T>(key: string, data: T, duration?: number): void {
    const now = Date.now()
    const cacheDuration = (duration || this.config.cacheDuration!) * 1000
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + cacheDuration
    })
    
    // Limit cache size
    if (this.cache.size > 100) {
      this.cleanupCache()
    }
  }

  private cleanupCache(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    })
    
    // If still too large, remove oldest entries
    if (this.cache.size > 80) {
      entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20)
        .forEach(([key]) => this.cache.delete(key))
    }
  }

  // Network request handler
  private async makeRequest<T>(endpoint: string, options?: any): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
    
    try {
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  // Cache control methods
  clearCache(): void {
    this.cache.clear()
  }

  clearCacheForCategory(category: string): void {
    const keysToDelete: string[] = []
    
    this.cache.forEach((_, key) => {
      if (key.includes(`category=${category}`)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  getCacheStats(): {
    size: number
    entries: Array<{ key: string; expiresIn: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, entry.expiresAt - now)
    }))
    
    return {
      size: this.cache.size,
      entries
    }
  }
}

// Platform-specific implementations

// iOS (React Native)
export class IOSNewsAPIClient extends NewsAPIClient {
  constructor() {
    super({
      baseURL: process.env.SUPABASE_URL + '/functions/v1',
      cacheEnabled: true,
      cacheDuration: 300
    })
  }
  
  // iOS specific: Save to AsyncStorage for offline support
  async persistCache(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default
      const cacheData = Array.from(this.cache.entries())
      await AsyncStorage.setItem('news_cache', JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to persist cache:', error)
    }
  }
  
  async loadPersistedCache(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default
      const cacheData = await AsyncStorage.getItem('news_cache')
      if (cacheData) {
        const entries = JSON.parse(cacheData)
        entries.forEach(([key, value]: [string, CacheEntry<any>]) => {
          if (Date.now() < value.expiresAt) {
            this.cache.set(key, value)
          }
        })
      }
    } catch (error) {
      console.error('Failed to load persisted cache:', error)
    }
  }
}

// Android (Kotlin coroutines wrapper would be needed)
export class AndroidNewsAPIClient extends NewsAPIClient {
  constructor() {
    super({
      baseURL: BuildConfig.SUPABASE_URL + '/functions/v1',
      cacheEnabled: true,
      cacheDuration: 300
    })
  }
}

// Web (with Service Worker support)
export class WebNewsAPIClient extends NewsAPIClient {
  constructor() {
    super({
      baseURL: process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1',
      cacheEnabled: true,
      cacheDuration: 300
    })
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker()
    }
  }
  
  private async registerServiceWorker(): Promise<void> {
    try {
      await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered')
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
  
  // Web specific: Use IndexedDB for larger cache
  async persistToIndexedDB(): Promise<void> {
    const db = await this.openDB()
    const tx = db.transaction('cache', 'readwrite')
    const store = tx.objectStore('cache')
    
    for (const [key, value] of this.cache.entries()) {
      await store.put({ key, ...value })
    }
  }
  
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NewsCache', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' })
        }
      }
    })
  }
}

// Response types
interface NewsResponse {
  data: NewsArticle[]
  meta: {
    total: number
    page: number
    hasMore: boolean
  }
}

interface NewsArticle {
  id: string
  title: string
  summary: string
  source: {
    name: string
    tier: string
    reliability: number
  }
  publishedAt: string
  category: string
  cluster?: {
    count: number
    sources: string[]
  }
  url: string
}

interface NewsArticleDetail extends NewsArticle {
  content?: string
  relatedArticles?: NewsArticle[]
}

// Export singleton instances
export const newsAPIClient = {
  ios: () => new IOSNewsAPIClient(),
  android: () => new AndroidNewsAPIClient(),
  web: () => new WebNewsAPIClient()
}