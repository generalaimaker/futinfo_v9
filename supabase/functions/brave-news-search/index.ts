import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Brave Search API 설정
const BRAVE_API_KEY = Deno.env.get('BRAVE_SEARCH_API_KEY') || 'BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT'
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

interface SearchRequest {
  query: string
  type?: 'general' | 'transfer' | 'injury' | 'match'
  team?: string
  player?: string
  freshness?: 'day' | 'week' | 'month'
  count?: number
  offset?: number
  saveToDb?: boolean
}

interface BraveSearchResult {
  title: string
  url: string
  description: string
  age?: string
  page_age?: string
  meta_url?: {
    hostname: string
    favicon?: string
  }
  thumbnail?: {
    src: string
  }
}

// 축구 관련 도메인 신뢰도 매핑
const DOMAIN_TRUST_SCORES: Record<string, number> = {
  'skysports.com': 95,
  'bbc.com': 95,
  'bbc.co.uk': 95,
  'theguardian.com': 95,
  'theathletic.com': 95,
  'espn.com': 85,
  'goal.com': 75,
  'football365.com': 70,
  'transfermarkt.com': 90,
  'premierleague.com': 100,
  'uefa.com': 100,
  'fifa.com': 100,
  'manutd.com': 95,
  'liverpoolfc.com': 95,
  'chelseafc.com': 95,
  'arsenal.com': 95,
  'realmadrid.com': 95,
  'fcbarcelona.com': 95,
  'manchestereveningnews.co.uk': 80,
  'mirror.co.uk': 65,
  'dailymail.co.uk': 60,
  'thesun.co.uk': 55,
}

// 검색 쿼리 최적화
function buildSearchQuery(req: SearchRequest): string {
  const parts = []
  
  // 기본 쿼리
  if (req.query) {
    parts.push(req.query)
  }
  
  // 팀 필터
  if (req.team) {
    parts.push(`"${req.team}"`)
  }
  
  // 선수 필터
  if (req.player) {
    parts.push(`"${req.player}"`)
  }
  
  // 타입별 키워드 추가
  switch (req.type) {
    case 'transfer':
      parts.push('(transfer OR signing OR "done deal" OR medical OR "agreed terms")')
      break
    case 'injury':
      parts.push('(injury OR injured OR "out for" OR "return date" OR fitness)')
      break
    case 'match':
      parts.push('(lineup OR "starting XI" OR preview OR "match report" OR result)')
      break
  }
  
  // 축구 관련 키워드 추가
  parts.push('(football OR soccer OR "premier league" OR "champions league")')
  
  // 뉴스 필터
  parts.push('news')
  
  return parts.join(' ')
}

// 신뢰도 계산
function calculateTrustScore(result: BraveSearchResult): number {
  const hostname = result.meta_url?.hostname || ''
  const domain = hostname.replace('www.', '')
  
  // 도메인 기반 신뢰도
  let score = DOMAIN_TRUST_SCORES[domain] || 50
  
  // 최신성 보너스
  if (result.age) {
    if (result.age.includes('hour') || result.age.includes('minute')) {
      score += 10
    } else if (result.age.includes('1 day')) {
      score += 5
    }
  }
  
  // 공식 발표 키워드 보너스
  const title = result.title.toLowerCase()
  const description = result.description.toLowerCase()
  const text = title + ' ' + description
  
  if (text.includes('official') || text.includes('confirmed')) {
    score += 15
  }
  
  if (text.includes('breaking') || text.includes('exclusive')) {
    score += 10
  }
  
  // 루머 키워드 페널티
  if (text.includes('rumour') || text.includes('speculation') || text.includes('could')) {
    score -= 20
  }
  
  return Math.max(0, Math.min(100, score))
}

// 카테고리 분류
function categorizeArticle(result: BraveSearchResult): string {
  const text = (result.title + ' ' + result.description).toLowerCase()
  
  if (text.includes('transfer') || text.includes('signing') || text.includes('deal')) {
    return 'transfer'
  }
  
  if (text.includes('injury') || text.includes('injured') || text.includes('fitness')) {
    return 'injury'
  }
  
  if (text.includes('lineup') || text.includes('vs') || text.includes('result') || text.includes('goal')) {
    return 'match'
  }
  
  if (text.includes('analysis') || text.includes('tactical') || text.includes('opinion')) {
    return 'analysis'
  }
  
  return 'general'
}

// 팀 ID 추출
function extractTeamIds(text: string): number[] {
  const teamIds = new Set<number>()
  const lowerText = text.toLowerCase()
  
  const teamMappings: Record<string, number> = {
    'manchester united': 33,
    'man utd': 33,
    'liverpool': 40,
    'manchester city': 50,
    'man city': 50,
    'chelsea': 49,
    'arsenal': 42,
    'tottenham': 47,
    'spurs': 47,
    'real madrid': 541,
    'barcelona': 529,
    'barca': 529,
    'atletico madrid': 530,
    'juventus': 496,
    'inter milan': 505,
    'ac milan': 489,
    'bayern munich': 157,
    'bayern': 157,
    'borussia dortmund': 165,
    'dortmund': 165,
    'psg': 85,
    'paris saint-germain': 85,
  }
  
  for (const [teamName, teamId] of Object.entries(teamMappings)) {
    if (lowerText.includes(teamName)) {
      teamIds.add(teamId)
    }
  }
  
  return Array.from(teamIds)
}

// 날짜 파싱
function parseAge(age?: string): string {
  if (!age) return new Date().toISOString()
  
  const now = new Date()
  
  if (age.includes('minute')) {
    const minutes = parseInt(age.match(/\d+/)?.[0] || '0')
    now.setMinutes(now.getMinutes() - minutes)
  } else if (age.includes('hour')) {
    const hours = parseInt(age.match(/\d+/)?.[0] || '0')
    now.setHours(now.getHours() - hours)
  } else if (age.includes('day')) {
    const days = parseInt(age.match(/\d+/)?.[0] || '0')
    now.setDate(now.getDate() - days)
  } else if (age.includes('week')) {
    const weeks = parseInt(age.match(/\d+/)?.[0] || '0')
    now.setDate(now.getDate() - weeks * 7)
  } else if (age.includes('month')) {
    const months = parseInt(age.match(/\d+/)?.[0] || '0')
    now.setMonth(now.getMonth() - months)
  }
  
  return now.toISOString()
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: SearchRequest = await req.json()
    
    // 검색 쿼리 구성
    const searchQuery = buildSearchQuery(body)
    console.log('Search query:', searchQuery)
    
    // Brave Search API 호출
    const searchParams = new URLSearchParams({
      q: searchQuery,
      count: String(body.count || 20),
      offset: String(body.offset || 0),
      search_lang: 'en',
      safesearch: 'moderate',
    })
    
    if (body.freshness) {
      searchParams.append('freshness', body.freshness)
    }
    
    const response = await fetch(`${BRAVE_API_URL}?${searchParams}`, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`)
    }
    
    const data = await response.json()
    const results = data.web?.results || []
    
    console.log(`Found ${results.length} results`)
    
    // 결과 변환 및 필터링
    const articles = results.map((result: BraveSearchResult) => {
      const text = result.title + ' ' + result.description
      
      return {
        title: result.title,
        description: result.description,
        url: result.url,
        source: result.meta_url?.hostname || 'Unknown',
        trust_score: calculateTrustScore(result),
        category: categorizeArticle(result),
        team_ids: extractTeamIds(text),
        tags: [],
        image_url: result.thumbnail?.src,
        published_at: parseAge(result.age),
        is_from_search: true,
      }
    }).filter((article: any) => {
      // 축구 관련 뉴스만 필터링
      return article.trust_score > 30
    })
    
    // DB 저장 옵션
    if (body.saveToDb && articles.length > 0) {
      // 중복 체크
      const urls = articles.map((a: any) => a.url)
      const { data: existing } = await supabase
        .from('news_articles')
        .select('url')
        .in('url', urls)
      
      const existingUrls = new Set(existing?.map(e => e.url) || [])
      const newArticles = articles.filter((a: any) => !existingUrls.has(a.url))
      
      if (newArticles.length > 0) {
        const { error } = await supabase
          .from('news_articles')
          .insert(newArticles)
        
        if (error) {
          console.error('Error saving to DB:', error)
        } else {
          console.log(`Saved ${newArticles.length} new articles to DB`)
          
          // 번역 트리거
          const articleIds = newArticles.map((a: any) => a.id)
          await supabase.functions.invoke('news-translator', {
            body: { articleIds, priority: 'high' }
          })
        }
      }
    }
    
    // API 사용량 추적
    await supabase.rpc('track_api_usage', {
      api_name: 'brave_search',
      count: 1
    })
    
    return new Response(JSON.stringify({
      success: true,
      articles,
      total: articles.length,
      query: searchQuery,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
    
  } catch (error) {
    console.error('Error in brave-news-search:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})