import { supabase } from './client'
import { useQuery } from '@tanstack/react-query'
import { translateNewsArticles } from '@/lib/services/translation'

export interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: 'general' | 'transfer' | 'injury'
  trustScore: number
  imageUrl?: string
  originalTitle?: string
  originalDescription?: string
  isTranslated?: boolean
}

export interface NewsResponse {
  articles: NewsArticle[]
  count: number
  sources: number
}

export interface NewsFilters {
  category?: 'all' | 'general' | 'transfer' | 'injury'
  onlyTier1?: boolean
  minTrustScore?: number
}

// Supabase Edge Function을 통해 뉴스 가져오기
export async function fetchNews(
  filters: NewsFilters & { 
    translate?: boolean
    targetLang?: string 
  } = {}
): Promise<NewsResponse> {
  try {
    const params = new URLSearchParams()
    
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category)
    }
    if (filters.onlyTier1) {
      params.append('onlyTier1', 'true')
    }
    if (filters.minTrustScore) {
      params.append('minTrustScore', filters.minTrustScore.toString())
    }
    
    const { data, error } = await supabase.functions.invoke('football-news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        category: filters.category || 'general',
        onlyTier1: filters.onlyTier1,
        minTrustScore: filters.minTrustScore
      }
    })
    
    if (error) {
      console.error('Error fetching news:', error)
      throw error
    }
    
    const newsResponse = data as NewsResponse
    
    // 번역 옵션이 활성화되어 있으면 번역 적용
    if (filters.translate !== false && typeof window !== 'undefined') {
      try {
        const targetLang = filters.targetLang || 'ko' // 기본값 한국어
        const translatedArticles = await translateNewsArticles(
          newsResponse.articles,
          targetLang
        )
        return {
          ...newsResponse,
          articles: translatedArticles
        }
      } catch (translationError) {
        console.error('Translation failed, returning original:', translationError)
        return newsResponse
      }
    }
    
    return newsResponse
  } catch (error) {
    console.error('Error fetching news:', error)
    throw error
  }
}

// React Query hook for news (자동으로 사용자 언어 설정 적용)
export function useNews(filters: NewsFilters = {}) {
  // 브라우저에서만 언어 설정 가져오기
  const getUserLanguage = () => {
    if (typeof window === 'undefined') return 'ko'
    
    const settings = localStorage.getItem('language_settings')
    if (settings) {
      try {
        const parsed = JSON.parse(settings)
        return parsed.language || 'ko'
      } catch {
        return 'ko'
      }
    }
    return 'ko'
  }

  return useQuery({
    queryKey: ['news', filters, getUserLanguage()],
    queryFn: () => fetchNews({
      ...filters,
      targetLang: getUserLanguage()
    }),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
  })
}