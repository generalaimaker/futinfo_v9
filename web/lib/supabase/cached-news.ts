import { supabase } from './client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface CachedNewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  source_tier: number
  trust_score: number
  category: string
  tags: string[]
  team_ids: number[]
  player_ids: number[]
  league_ids: number[]
  translations: {
    [key: string]: {
      title: string
      description: string
      translated_at: string
    }
  }
  image_url?: string
  published_at: string
  view_count: number
  is_featured: boolean
  is_breaking: boolean
  priority: number
}

export interface NewsFilters {
  category?: 'all' | 'general' | 'transfer' | 'injury' | 'match' | 'analysis'
  teamIds?: number[]
  playerIds?: number[]
  leagueIds?: number[]
  onlyFeatured?: boolean
  onlyBreaking?: boolean
  searchQuery?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

// 개인화된 뉴스 가져오기
export async function fetchPersonalizedNews(filters: NewsFilters = {}): Promise<{
  articles: CachedNewsArticle[]
  total: number
  hasMore: boolean
}> {
  try {
    // Supabase Edge Function 호출
    const { data, error } = await supabase.functions.invoke('personalized-news', {
      body: filters
    })
    
    if (error) throw error
    
    // Edge Function이 번역을 반환하지 않을 수 있으므로 여기서도 번역 적용
    const userLanguage = getUserLanguage()
    if (data?.articles) {
      data.articles = data.articles.map((article: any) => {
        // 한국어 번역 우선 적용
        const hasKoreanTranslation = article.translations?.ko || 
                                     article.translations?.['ko'] ||
                                     article.translations?.['ko-KR']
        
        if (userLanguage === 'ko' && hasKoreanTranslation) {
          const koreanData = article.translations.ko || 
                            article.translations['ko'] || 
                            article.translations['ko-KR']
          return {
            ...article,
            title: koreanData.title || article.title,
            description: koreanData.description || article.description,
            isTranslated: true,
            originalTitle: article.title,
            originalDescription: article.description
          }
        } else if (article.translations?.[userLanguage]) {
          return {
            ...article,
            title: article.translations[userLanguage].title || article.title,
            description: article.translations[userLanguage].description || article.description,
            isTranslated: true,
            originalTitle: article.title,
            originalDescription: article.description
          }
        }
        return article
      })
    }
    
    return data
  } catch (error) {
    console.error('Error fetching personalized news:', error)
    // 에러 시 DB에서 직접 가져오기
    return fetchNewsFromDB(filters)
  }
}

// DB에서 직접 뉴스 가져오기 (폴백)
async function fetchNewsFromDB(filters: NewsFilters = {}): Promise<{
  articles: CachedNewsArticle[]
  total: number
  hasMore: boolean
}> {
  let query = supabase
    .from('news_articles')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
  
  // 필터 적용
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  
  if (filters.onlyFeatured) {
    query = query.eq('is_featured', true)
  }
  
  if (filters.onlyBreaking) {
    query = query.eq('is_breaking', true)
  }
  
  if (filters.searchQuery) {
    query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
  }
  
  if (filters.teamIds && filters.teamIds.length > 0) {
    query = query.contains('team_ids', filters.teamIds)
  }
  
  if (filters.fromDate) {
    query = query.gte('published_at', filters.fromDate)
  }
  
  if (filters.toDate) {
    query = query.lte('published_at', filters.toDate)
  }
  
  // 페이지네이션
  const limit = filters.limit || 20
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)
  
  const { data, count, error } = await query
  
  if (error) throw error
  
  // 사용자 언어 설정 가져오기
  const userLanguage = getUserLanguage()
  
  // 번역 적용 - 한국어 번역 우선, 없으면 원문 사용
  const translatedArticles = (data || []).map(article => {
    // 한국어 번역이 있는지 확인
    const hasKoreanTranslation = article.translations?.ko || 
                                  article.translations?.['ko'] ||
                                  article.translations?.['ko-KR']
    
    if (userLanguage === 'ko' && hasKoreanTranslation) {
      const koreanData = article.translations.ko || 
                        article.translations['ko'] || 
                        article.translations['ko-KR']
      return {
        ...article,
        title: koreanData.title || article.title,
        description: koreanData.description || article.description,
        isTranslated: true,
        originalTitle: article.title,
        originalDescription: article.description
      }
    } else if (article.translations?.[userLanguage]) {
      // 다른 언어 번역 적용
      return {
        ...article,
        title: article.translations[userLanguage].title || article.title,
        description: article.translations[userLanguage].description || article.description,
        isTranslated: true,
        originalTitle: article.title,
        originalDescription: article.description
      }
    }
    
    // 번역이 없으면 원문 그대로
    return article
  })
  
  return {
    articles: translatedArticles,
    total: count || 0,
    hasMore: offset + limit < (count || 0)
  }
}

// 사용자 언어 설정 가져오기 - 항상 한국어 우선
function getUserLanguage(): string {
  // 서버 사이드 렌더링 시 한국어 반환
  if (typeof window === 'undefined') return 'ko'
  
  // localStorage에서 명시적으로 설정된 언어만 확인
  try {
    const preferences = localStorage.getItem('user_preferences')
    if (preferences) {
      const parsed = JSON.parse(preferences)
      // news_language가 명시적으로 설정된 경우만 사용, 아니면 무조건 ko
      if (parsed.news_language && parsed.news_language !== 'ko') {
        return parsed.news_language
      }
    }
  } catch (error) {
    console.log('Error reading language preference, defaulting to Korean')
  }
  
  // 기본값은 항상 한국어
  return 'ko'
}

// React Query Hook - 개인화된 뉴스
export function usePersonalizedNews(filters: NewsFilters = {}) {
  return useQuery({
    queryKey: ['news', 'personalized', filters, getUserLanguage()],
    queryFn: () => fetchPersonalizedNews(filters),
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
  })
}

// React Query Hook - 인기 뉴스
export function usePopularNews(limit: number = 10) {
  return useQuery({
    queryKey: ['news', 'popular', limit, getUserLanguage()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popular_news')
        .select('*')
        .limit(limit)
      
      if (error) throw error
      
      const userLanguage = getUserLanguage()
      return (data || []).map(article => {
        // 한국어 번역 우선 확인
        const hasKoreanTranslation = article.translations?.ko || 
                                     article.translations?.['ko'] ||
                                     article.translations?.['ko-KR']
        
        if (userLanguage === 'ko' && hasKoreanTranslation) {
          const koreanData = article.translations.ko || 
                            article.translations['ko'] || 
                            article.translations['ko-KR']
          return {
            ...article,
            title: koreanData.title || article.title,
            description: koreanData.description || article.description,
            isTranslated: true,
            originalTitle: article.title,
            originalDescription: article.description
          }
        } else if (article.translations?.[userLanguage]) {
          return {
            ...article,
            title: article.translations[userLanguage].title || article.title,
            description: article.translations[userLanguage].description || article.description,
            isTranslated: true,
            originalTitle: article.title,
            originalDescription: article.description
          }
        }
        return article
      })
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// React Query Hook - 팀별 뉴스
export function useTeamNews(teamId: number, limit: number = 10) {
  return useQuery({
    queryKey: ['news', 'team', teamId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_team_news', { 
          team_id: teamId, 
          limit_count: limit 
        })
      
      if (error) throw error
      
      const userLanguage = getUserLanguage()
      return (data || []).map(article => {
        if (article.translations?.[userLanguage]) {
          return {
            ...article,
            title: article.translations[userLanguage].title || article.title,
            description: article.translations[userLanguage].description || article.description,
            isTranslated: true
          }
        }
        return article
      })
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// 뉴스 조회수 증가
export async function incrementViewCount(articleId: string) {
  const { error } = await supabase
    .rpc('increment_view_count', { 
      article_ids: [articleId] 
    })
  
  if (error) {
    console.error('Error incrementing view count:', error)
  }
}

// 사용자 뉴스 선호도 업데이트
export function useUpdateNewsPreferences() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (preferences: {
      preferred_teams?: number[]
      preferred_players?: number[]
      preferred_leagues?: number[]
      preferred_categories?: string[]
      blocked_sources?: string[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('user_news_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      // 뉴스 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['news'] })
    }
  })
}

// 수동 뉴스 수집 트리거 (관리자용)
export async function triggerNewsCollection() {
  const { data, error } = await supabase.functions.invoke('news-collector')
  
  if (error) throw error
  return data
}

// 수동 번역 트리거 (관리자용)
export async function triggerNewsTranslation(articleIds?: string[]) {
  const { data, error } = await supabase.functions.invoke('news-translator', {
    body: { 
      articleIds,
      priority: 'high'
    }
  })
  
  if (error) throw error
  return data
}