import { NextRequest, NextResponse } from 'next/server'

const BRAVE_API_KEY = process.env.NEXT_PUBLIC_BRAVE_SEARCH_API_KEY || 'BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT'
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

interface SearchRequest {
  query: string
  type?: 'general' | 'transfer' | 'injury' | 'match'
  team?: string
  player?: string
  freshness?: 'day' | 'week' | 'month'
  count?: number
  offset?: number
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
function calculateTrustScore(result: any): number {
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
function categorizeArticle(result: any): string {
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

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    
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
      const errorText = await response.text()
      console.error('Brave API error:', response.status, errorText)
      throw new Error(`Brave API error: ${response.status}`)
    }
    
    const data = await response.json()
    const results = data.web?.results || []
    
    console.log(`Found ${results.length} results`)
    
    // 결과 변환 및 필터링
    const articles = results.map((result: any) => {
      const text = result.title + ' ' + result.description
      
      return {
        title: result.title,
        description: result.description,
        url: result.url,
        source: result.meta_url?.hostname || 'Unknown',
        trust_score: calculateTrustScore(result),
        category: categorizeArticle(result),
        image_url: result.thumbnail?.src,
        published_at: parseAge(result.age),
        is_from_search: true,
      }
    }).filter((article: any) => {
      // 축구 관련 뉴스만 필터링
      return article.trust_score > 30
    })
    
    return NextResponse.json({
      success: true,
      articles,
      total: articles.length,
      query: searchQuery,
    })
    
  } catch (error: any) {
    console.error('Error in brave-search:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    )
  }
}