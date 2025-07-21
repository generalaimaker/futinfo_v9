import { supabase } from './client'
import { useQuery } from '@tanstack/react-query'

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
export async function fetchNews(filters: NewsFilters = {}): Promise<NewsResponse> {
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
    
    return data as NewsResponse
  } catch (error) {
    console.error('Error fetching news:', error)
    throw error
  }
}

// React Query hook for news
export function useNews(filters: NewsFilters = {}) {
  return useQuery({
    queryKey: ['news', filters],
    queryFn: () => fetchNews(filters),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
  })
}