import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BRAVE_API_KEY = Deno.env.get('BRAVE_SEARCH_API_KEY') || 'BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT'

// 프리미어리그 빅6 + 주요 클럽 세부 쿼리
const PREMIER_LEAGUE_QUERIES = {
  // 일반 프리미어리그 뉴스 (가장 중요한 헤드라인)
  general: [
    'Premier League breaking news today',
    'Premier League latest news', 
    'Premier League news',
    'Premier League chairman resign',
    'Premier League owner resign',
    'Premier League board changes',
    'Premier League major announcement',
    'Premier League official statement',
    'Tottenham chairman Daniel Levy',
    'Premier League shock news',
    'Premier League bombshell'
  ],
  
  // 빅6 팀별 최신 뉴스 (다양한 키워드 조합)
  teams: {
    'Manchester United': [
      'Manchester United latest news',
      'Man Utd breaking news',
      'United transfer news today',
      'Ten Hag Manchester United',
      'Old Trafford news',
      'MUFC news',
      'Manchester United owner Glazer'
    ],
    'Liverpool': [
      'Liverpool FC latest news', 
      'Liverpool breaking news',
      'Klopp Liverpool today',
      'Anfield news',
      'LFC transfer news',
      'Liverpool injury update',
      'Liverpool owner FSG'
    ],
    'Manchester City': [
      'Manchester City latest news',
      'Man City breaking news', 
      'Guardiola Manchester City',
      'City transfer news',
      'MCFC news today',
      'Etihad Stadium news',
      'Manchester City owner Sheikh'
    ],
    'Chelsea': [
      'Chelsea FC latest news',
      'Chelsea breaking news',
      'Pochettino Chelsea',
      'Stamford Bridge news',
      'CFC transfer news',
      'Chelsea today',
      'Chelsea owner Boehly'
    ],
    'Arsenal': [
      'Arsenal latest news',
      'Arsenal breaking news',
      'Arteta Arsenal today',
      'Emirates Stadium news',
      'AFC transfer news',
      'Gunners news',
      'Arsenal owner Kroenke'
    ],
    'Tottenham': [
      'Tottenham Hotspur latest news',
      'Spurs breaking news',
      'Postecoglou Tottenham',
      'THFC transfer news',
      'Tottenham today',
      'Son Heung-min news',
      'Daniel Levy Tottenham chairman',
      'Tottenham chairman resign'
    ],
    'Newcastle': [
      'Newcastle United latest news',
      'NUFC breaking news',
      'Eddie Howe Newcastle',
      'St James Park news',
      'Newcastle Saudi owners'
    ],
  },
  
  // 주요 선수 뉴스
  players: [
    'Erling Haaland news',
    'Mohamed Salah latest',
    'Bukayo Saka news',
    'Bruno Fernandes news',
    'Son Heung-min latest',
    'Cole Palmer news',
    'Phil Foden news',
    'Marcus Rashford news',
    'Darwin Nunez news',
    'Martin Odegaard news'
  ],
  
  // 이적 및 루머 (실시간성 높음)
  transfers: [
    'Premier League transfer news breaking',
    'Premier League done deal today',
    'Premier League medical today',
    'Premier League signing confirmed',
    'January transfer window Premier League',
    'Premier League transfer latest'
  ],
  
  // 경기 관련 속보
  matches: [
    'Premier League live',
    'Premier League team news',
    'Premier League lineup today',
    'Premier League injury news',
    'Premier League match preview',
    'Premier League result'
  ]
}

// 더 정밀한 시간 필터링
function getTimeFilter() {
  const now = new Date()
  const hour = now.getHours()
  
  // 시간대별 다른 freshness 적용
  if (hour >= 6 && hour <= 23) {
    // 주간: 최근 3시간 내 뉴스 우선
    return 'pd3h' // past 3 hours
  } else {
    // 야간: 최근 24시간
    return 'pd1d' // past day
  }
}

// 소스 신뢰도 체크 (프리미어리그 전문 매체 우선)
function calculateTrustScore(article: any) {
  const source = (article.meta_url?.hostname || '').toLowerCase()
  
  const premierLeagueSources: Record<string, number> = {
    // 공식
    'premierleague.com': 100,
    
    // Tier 1 - 프리미어리그 전문
    'skysports.com': 95,
    'bbc.com': 95,
    'bbc.co.uk': 95,
    'theathletic.com': 95,
    'telegraph.co.uk': 90,
    'theguardian.com': 90,
    
    // 팀 공식 사이트
    'manutd.com': 100,
    'liverpoolfc.com': 100,
    'mancity.com': 100,
    'chelseafc.com': 100,
    'arsenal.com': 100,
    'tottenhamhotspur.com': 100,
    
    // Tier 2
    'espn.com': 85,
    'football.london': 85,
    'manchestereveningnews.co.uk': 85,
    'liverpool.com': 85,
    'standard.co.uk': 80,
    
    // Transfer specialists
    'fabrizio romano': 95, // Twitter/X
    'david ornstein': 95,
    'transfermarkt': 85,
    
    // Tier 3
    'goal.com': 75,
    '90min.com': 70,
    'mirror.co.uk': 65,
    'dailymail.co.uk': 60,
    'thesun.co.uk': 55,
    'express.co.uk': 55
  }
  
  // 소스별 점수 반환
  for (const [key, value] of Object.entries(premierLeagueSources)) {
    if (source.includes(key)) {
      return value
    }
  }
  
  return 50 // 기본 점수
}

// Brave Search API 호출 (개선된 버전)
async function searchBraveNews(query: string, options: any = {}) {
  try {
    const timeFilter = options.timeFilter || getTimeFilter()
    const count = options.count || 20 // 더 많은 결과 가져오기
    
    // Web search와 News search 둘 다 시도
    const endpoints = [
      `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=${count}&freshness=${timeFilter}`,
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' news')}&count=${count}&freshness=${timeFilter}`
    ]
    
    const results = []
    
    for (const url of endpoints) {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.results) {
          results.push(...data.results)
        } else if (data.web?.results) {
          results.push(...data.web.results)
        }
      }
    }
    
    return results
  } catch (error) {
    console.error(`Error searching for "${query}":`, error)
    return []
  }
}

// 중복 제거 및 품질 필터링
function deduplicateAndFilter(articles: any[]) {
  const seen = new Map()
  const filtered = []
  
  for (const article of articles) {
    // URL 기반 중복 체크
    if (!article.url || seen.has(article.url)) continue
    
    // 제목 기반 유사도 체크 (비슷한 제목 제거)
    const titleKey = article.title?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50)
    if (seen.has(titleKey)) continue
    
    // 품질 체크
    if (!article.title || article.title.length < 20) continue
    if (article.title.includes('Cookie') || article.title.includes('Privacy')) continue
    
    seen.set(article.url, true)
    seen.set(titleKey, true)
    filtered.push(article)
  }
  
  // 신뢰도 점수로 정렬
  return filtered.sort((a, b) => {
    const scoreA = calculateTrustScore(a)
    const scoreB = calculateTrustScore(b)
    return scoreB - scoreA
  })
}

// 메인 수집 함수
async function collectPremierLeagueNews() {
  console.log('⚽ Starting Premier League news collection...')
  const allArticles = []
  let apiCalls = 0
  
  // 1. 일반 프리미어리그 헤드라인 우선 수집 (가장 중요)
  console.log('🔴 Collecting general Premier League headlines...')
  for (const query of PREMIER_LEAGUE_QUERIES.general) {
    const results = await searchBraveNews(query, { 
      timeFilter: 'pd3h', // 최근 3시간 - 더 실시간성 높게
      count: 25 // 더 많은 결과
    })
    allArticles.push(...results)
    apiCalls++
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 400))
  }
  
  // 2. 팀별 뉴스 수집
  for (const [team, queries] of Object.entries(PREMIER_LEAGUE_QUERIES.teams)) {
    console.log(`📰 Collecting news for ${team}...`)
    
    for (const query of queries) {
      const results = await searchBraveNews(query, { 
        timeFilter: 'pd6h', // 최근 6시간
        count: 15 
      })
      allArticles.push(...results)
      apiCalls++
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // 2. 선수 뉴스 수집
  console.log('👤 Collecting player news...')
  for (const query of PREMIER_LEAGUE_QUERIES.players) {
    const results = await searchBraveNews(query, { 
      timeFilter: 'pd12h',
      count: 10
    })
    allArticles.push(...results)
    apiCalls++
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 3. 이적 뉴스 수집 (가장 실시간성 높음)
  console.log('💼 Collecting transfer news...')
  for (const query of PREMIER_LEAGUE_QUERIES.transfers) {
    const results = await searchBraveNews(query, {
      timeFilter: 'pd3h', // 최근 3시간
      count: 20
    })
    allArticles.push(...results) 
    apiCalls++
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 4. 경기 관련 뉴스
  console.log('⚡ Collecting match news...')
  for (const query of PREMIER_LEAGUE_QUERIES.matches) {
    const results = await searchBraveNews(query, {
      timeFilter: 'pd1h', // 최근 1시간
      count: 15
    })
    allArticles.push(...results)
    apiCalls++
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 중복 제거 및 필터링
  const uniqueArticles = deduplicateAndFilter(allArticles)
  console.log(`✅ Collected ${uniqueArticles.length} unique articles from ${allArticles.length} total`)
  
  // 데이터베이스에 저장
  const saved = await saveToDatabase(uniqueArticles)
  
  return {
    success: true,
    stats: {
      total_collected: allArticles.length,
      unique_articles: uniqueArticles.length,
      saved: saved,
      api_calls: apiCalls,
      top_sources: getTopSources(uniqueArticles)
    }
  }
}

// 데이터베이스 저장
async function saveToDatabase(articles: any[]) {
  let saved = 0
  
  for (const article of articles) {
    try {
      const newsData = {
        title: article.title?.substring(0, 500),
        description: article.description?.substring(0, 2000),
        url: article.url,
        source: article.meta_url?.hostname || 'Unknown',
        source_tier: calculateTrustScore(article) >= 80 ? 1 : 2,
        trust_score: calculateTrustScore(article),
        published_at: article.page_age || new Date().toISOString(),
        image_url: article.thumbnail?.src || article.meta?.image,
        category: detectCategory(article),
        is_breaking: isBreakingNews(article),
        is_featured: calculateTrustScore(article) >= 90,
        importance_score: calculateImportance(article),
        tags: extractTags(article),
        collected_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('news_articles')
        .upsert(newsData, {
          onConflict: 'url',
          ignoreDuplicates: true
        })
      
      if (!error) saved++
    } catch (err) {
      console.error('Error saving article:', err)
    }
  }
  
  return saved
}

// 카테고리 감지
function detectCategory(article: any) {
  const title = (article.title || '').toLowerCase()
  const desc = (article.description || '').toLowerCase()
  const combined = title + ' ' + desc
  
  if (combined.includes('transfer') || combined.includes('signing') || 
      combined.includes('deal') || combined.includes('medical')) {
    return 'transfer'
  }
  if (combined.includes('injury') || combined.includes('injured') || 
      combined.includes('fitness')) {
    return 'injury'
  }
  if (combined.includes('lineup') || combined.includes('starting') || 
      combined.includes('match') || combined.includes('vs')) {
    return 'match'
  }
  
  return 'general'
}

// 속보 여부 판단
function isBreakingNews(article: any) {
  const title = (article.title || '').toLowerCase()
  return title.includes('breaking') || 
         title.includes('official') || 
         title.includes('confirmed') ||
         title.includes('exclusive')
}

// 중요도 점수 계산
function calculateImportance(article: any) {
  let score = 50
  const title = (article.title || '').toLowerCase()
  
  // 속보/공식 발표
  if (isBreakingNews(article)) score += 30
  
  // 신뢰도 높은 소스
  const trustScore = calculateTrustScore(article)
  if (trustScore >= 90) score += 20
  else if (trustScore >= 80) score += 10
  
  // 빅6 팀 관련
  const big6 = ['manchester united', 'liverpool', 'manchester city', 'chelsea', 'arsenal', 'tottenham']
  if (big6.some(team => title.includes(team))) score += 15
  
  return Math.min(score, 100)
}

// 태그 추출
function extractTags(article: any) {
  const tags = []
  const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase()
  
  // 팀 태그
  const teams = ['manchester-united', 'liverpool', 'manchester-city', 'chelsea', 'arsenal', 'tottenham']
  teams.forEach(team => {
    if (text.includes(team.replace('-', ' '))) tags.push(team)
  })
  
  // 카테고리 태그
  tags.push(detectCategory(article))
  
  // 속보 태그
  if (isBreakingNews(article)) tags.push('breaking')
  
  return tags
}

// 상위 소스 통계
function getTopSources(articles: any[]) {
  const sources: Record<string, number> = {}
  
  articles.forEach(article => {
    const source = article.meta_url?.hostname || 'Unknown'
    sources[source] = (sources[source] || 0) + 1
  })
  
  return Object.entries(sources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }))
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const result = await collectPremierLeagueNews()
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})