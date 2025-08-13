import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface NewsFilters {
  category?: string
  teamIds?: number[]
  playerIds?: number[]
  leagueIds?: number[]
  language?: string
  limit?: number
  offset?: number
  searchQuery?: string
  fromDate?: string
  toDate?: string
}

interface UserPreferences {
  preferred_teams?: number[]
  preferred_players?: number[]
  preferred_leagues?: number[]
  preferred_categories?: string[]
  blocked_sources?: string[]
  language?: string
  auto_translate?: boolean
}

// 관련도 점수 계산
function calculateRelevanceScore(
  article: any,
  preferences: UserPreferences,
  filters: NewsFilters
): number {
  let score = 0
  
  // 기본 점수 (신뢰도 기반)
  score += (article.trust_score || 50) / 10
  
  // 카테고리 매칭
  if (preferences.preferred_categories?.includes(article.category)) {
    score += 20
  }
  
  // 팀 매칭
  const articleTeams = article.team_ids || []
  const preferredTeams = [...(preferences.preferred_teams || []), ...(filters.teamIds || [])]
  const matchingTeams = articleTeams.filter((id: number) => preferredTeams.includes(id))
  score += matchingTeams.length * 30
  
  // 선수 매칭
  const articlePlayers = article.player_ids || []
  const preferredPlayers = [...(preferences.preferred_players || []), ...(filters.playerIds || [])]
  const matchingPlayers = articlePlayers.filter((id: number) => preferredPlayers.includes(id))
  score += matchingPlayers.length * 25
  
  // 리그 매칭
  const articleLeagues = article.league_ids || []
  const preferredLeagues = [...(preferences.preferred_leagues || []), ...(filters.leagueIds || [])]
  const matchingLeagues = articleLeagues.filter((id: number) => preferredLeagues.includes(id))
  score += matchingLeagues.length * 15
  
  // 특별 플래그
  if (article.is_featured) score += 50
  if (article.is_breaking) score += 40
  
  // 최신성 (24시간 이내)
  const publishedAt = new Date(article.published_at)
  const now = new Date()
  const hoursAgo = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60)
  if (hoursAgo < 1) score += 30
  else if (hoursAgo < 6) score += 20
  else if (hoursAgo < 24) score += 10
  
  // 인기도 (조회수 기반)
  if (article.view_count > 1000) score += 15
  else if (article.view_count > 500) score += 10
  else if (article.view_count > 100) score += 5
  
  return score
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 인증 확인
    const authHeader = req.headers.get('Authorization')
    let userId: string | null = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        userId = user.id
      }
    }
    
    // 요청 파라미터 파싱
    const url = new URL(req.url)
    const filters: NewsFilters = {
      category: url.searchParams.get('category') || undefined,
      teamIds: url.searchParams.get('teamIds')?.split(',').map(Number),
      playerIds: url.searchParams.get('playerIds')?.split(',').map(Number),
      leagueIds: url.searchParams.get('leagueIds')?.split(',').map(Number),
      language: url.searchParams.get('language') || 'ko',
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
      searchQuery: url.searchParams.get('search') || undefined,
      fromDate: url.searchParams.get('fromDate') || undefined,
      toDate: url.searchParams.get('toDate') || undefined
    }
    
    // 사용자 선호도 가져오기
    let preferences: UserPreferences = {}
    if (userId) {
      const { data: userPrefs } = await supabase
        .from('user_news_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (userPrefs) {
        preferences = userPrefs
      }
    }
    
    // 기본 쿼리 구성
    let query = supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
    
    // 카테고리 필터
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }
    
    // 날짜 필터
    if (filters.fromDate) {
      query = query.gte('published_at', filters.fromDate)
    }
    if (filters.toDate) {
      query = query.lte('published_at', filters.toDate)
    }
    
    // 검색어 필터
    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    }
    
    // 팀 필터 (OR 조건)
    if (filters.teamIds && filters.teamIds.length > 0) {
      query = query.contains('team_ids', filters.teamIds)
    }
    
    // 차단된 소스 제외
    if (preferences.blocked_sources && preferences.blocked_sources.length > 0) {
      query = query.not('source', 'in', `(${preferences.blocked_sources.join(',')})`)
    }
    
    // 제한 없이 모든 기사 가져오기 (점수 계산 후 제한 적용)
    const { data: articles, error } = await query.limit(200) // 최대 200개
    
    if (error) throw error
    
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        articles: [],
        total: 0,
        language: filters.language
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
    
    // 관련도 점수 계산 및 정렬
    const scoredArticles = articles.map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(article, preferences, filters)
    }))
    
    // 점수순 정렬
    scoredArticles.sort((a, b) => {
      // 우선 관련도 점수로 정렬
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 5) {
        return b.relevanceScore - a.relevanceScore
      }
      // 점수가 비슷하면 최신순
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    })
    
    // 페이지네이션 적용
    const paginatedArticles = scoredArticles.slice(
      filters.offset || 0,
      (filters.offset || 0) + (filters.limit || 20)
    )
    
    // 사용자 언어에 맞는 번역 적용
    const translatedArticles = paginatedArticles.map(article => {
      const translations = article.translations || {}
      const userLang = filters.language || preferences.language || 'ko'
      
      if (translations[userLang]) {
        return {
          ...article,
          title: translations[userLang].title || article.title,
          description: translations[userLang].description || article.description,
          isTranslated: true,
          originalTitle: article.title,
          originalDescription: article.description
        }
      }
      
      return article
    })
    
    // 조회 기록 저장 (로그인 사용자만)
    if (userId && translatedArticles.length > 0) {
      // 상위 5개 기사만 조회 기록 저장
      const viewRecords = translatedArticles.slice(0, 5).map(article => ({
        article_id: article.id,
        user_id: userId,
        viewed_at: new Date().toISOString()
      }))
      
      // 중복 무시하고 삽입
      await supabase
        .from('news_views')
        .upsert(viewRecords, { onConflict: 'article_id,user_id' })
      
      // 조회수 증가
      const articleIds = translatedArticles.slice(0, 5).map(a => a.id)
      await supabase.rpc('increment_view_count', { article_ids: articleIds })
    }
    
    // 응답
    return new Response(JSON.stringify({
      articles: translatedArticles,
      total: scoredArticles.length,
      language: filters.language,
      hasMore: (filters.offset || 0) + (filters.limit || 20) < scoredArticles.length,
      preferences: userId ? {
        teams: preferences.preferred_teams,
        categories: preferences.preferred_categories
      } : null
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // 1분 캐시
      }
    })
    
  } catch (error) {
    console.error('Error in personalized-news:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      articles: [],
      total: 0
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})