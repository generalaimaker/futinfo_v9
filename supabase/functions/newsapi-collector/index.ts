import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '6a7bf7af3cbf4ca7b5cd57e977173b89'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// News API 전략 (24시간 딜레이 무료 플랜)
const NEWS_API_STRATEGY = {
  monthly_limit: 1000,
  daily_limit: 33, // 월 1000 / 30일 = 33.3
  safe_daily: 30,   // 안전 마진
  
  // News API 특화 쿼리 (Brave와 차별화 - 심층 분석 중심)
  queries: {
    // 전날 주요 이벤트 분석 (24시간 딜레이 활용)
    matchAnalysis: [
      'Manchester United tactical analysis',
      'Liverpool match report analysis',
      'Real Madrid Barcelona El Clasico review',
      'Chelsea Arsenal derby analysis',
      'Bayern Munich Dortmund tactical review',
      'Manchester City performance analysis',
      'Tottenham Hotspur match review',
    ],
    
    // 감독 전술/팀 분석 (시간에 덜 민감)
    managerTactics: [
      'Pep Guardiola Manchester City tactics',
      'Jurgen Klopp Liverpool strategy',
      'Mikel Arteta Arsenal philosophy',
      'Erik ten Hag Manchester United system',
      'Ange Postecoglou Tottenham style',
      'Carlo Ancelotti Real Madrid tactics',
      'Xavi Barcelona philosophy',
      'Thomas Tuchel Bayern Munich strategy',
    ],
    
    // 선수 특집/심층 분석
    playerFeatures: [
      'Erling Haaland goal scoring statistics',
      'Jude Bellingham Real Madrid performance',
      'Son Heung-min Tottenham leadership',
      'Mohamed Salah Liverpool future',
      'Bukayo Saka Arsenal development',
      'Vinicius Junior Real Madrid impact',
      'Pedri Barcelona future star',
      'Lee Kang-in PSG adaptation',
      'Kim Min-jae Bayern Munich defense',
    ],
    
    // 리그 동향/통계 분석
    leagueAnalysis: [
      'Premier League title race analysis',
      'La Liga top scorers statistics',
      'Champions League group stage review',
      'Serie A tactical trends',
      'Bundesliga young talents',
      'Europa League predictions',
    ],
    
    // 이적 시장 심층 분석 (루머 아닌 확정/분석)
    transferAnalysis: [
      'Premier League transfer spending analysis',
      'January transfer window predictions',
      'Summer transfer market review',
      'Contract expiry players 2024',
      'Transfer market valuations update',
    ]
  },
  
  // 소스 우선순위 (신뢰할 수 있는 영어권 매체)
  domains: [
    'bbc.co.uk',
    'theguardian.com',
    'telegraph.co.uk',
    'independent.co.uk',
    'espn.com',
    'skysports.com',
    'theathletic.com',
    'football365.com',
    'fourfourtwo.com',
    'goal.com'
  ].join(',')
}

// News API 호출
async function searchNewsAPI(query: string, page: number = 1) {
  try {
    // 7일 전부터 검색 (더 많은 분석 기사 확보)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const fromDate = weekAgo.toISOString().split('T')[0]
    
    const url = `https://newsapi.org/v2/everything?` + 
      `q=${encodeURIComponent(query)}` +
      `&from=${fromDate}` +
      `&sortBy=relevancy` +
      `&language=en` +
      `&domains=${NEWS_API_STRATEGY.domains}` +
      `&pageSize=20` +
      `&page=${page}` +
      `&apiKey=${NEWS_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`News API error: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    return data.articles || []
  } catch (error) {
    console.error(`Error searching News API for "${query}":`, error)
    return null
  }
}

// 뉴스 정규화 (News API 형식)
function normalizeNewsAPIArticle(article: any, searchQuery: string) {
  try {
    const title = (article.title || '').toLowerCase()
    const description = (article.description || '').toLowerCase()
    const content = (article.content || '').toLowerCase()
    const combinedText = title + ' ' + description + ' ' + content
    
    // 카테고리 및 중요도 스코어링
    let category = 'analysis' // News API는 주로 분석/리뷰 콘텐츠
    let importance = 65 // 기본 중요도 (실시간성 낮음)
    
    // 이적 확정 뉴스
    if (combinedText.includes('confirmed') && combinedText.includes('transfer')) {
      category = 'transfer'
      importance = 85
    }
    // 심층 분석
    else if (combinedText.includes('analysis') || combinedText.includes('tactical')) {
      category = 'analysis'
      importance = 75
    }
    // 인터뷰/특집
    else if (combinedText.includes('interview') || combinedText.includes('exclusive')) {
      category = 'feature'
      importance = 70
    }
    // 경기 리뷰
    else if (combinedText.includes('match report') || combinedText.includes('player ratings')) {
      category = 'match'
      importance = 60
    }
    
    // 소스 신뢰도
    let trustScore = 80 // News API는 검증된 소스만
    const sourceName = (article.source?.name || '').toLowerCase()
    
    if (sourceName.includes('bbc') || sourceName.includes('guardian') || 
        sourceName.includes('athletic')) {
      trustScore = 95
    } else if (sourceName.includes('sky') || sourceName.includes('espn')) {
      trustScore = 90
    }
    
    // 날짜 조정 (24시간 전 기사들)
    const publishedDate = article.publishedAt ? 
      new Date(article.publishedAt) : new Date()
    
    return {
      id: crypto.randomUUID(),
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      source: article.source?.name || 'Unknown',
      source_tier: trustScore >= 90 ? 1 : 2,
      category: category,
      tags: extractTags(combinedText, searchQuery),
      image_url: article.urlToImage || '',
      published_at: publishedDate.toISOString(),
      trust_score: trustScore,
      importance_score: importance,
      view_count: 0,
      is_featured: false,
      is_breaking: false, // News API는 24시간 딜레이
      priority: Math.floor(importance / 10),
      translations: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error normalizing News API article:', error)
    return null
  }
}

// 태그 추출 함수
function extractTags(text: string, query: string): string[] {
  const tags = []
  
  // 리그 태그
  if (text.includes('premier league')) tags.push('PremierLeague')
  if (text.includes('la liga')) tags.push('LaLiga')
  if (text.includes('champions league')) tags.push('ChampionsLeague')
  if (text.includes('serie a')) tags.push('SerieA')
  if (text.includes('bundesliga')) tags.push('Bundesliga')
  
  // 분석 태그
  if (text.includes('analysis')) tags.push('Analysis')
  if (text.includes('tactical')) tags.push('Tactical')
  if (text.includes('interview')) tags.push('Interview')
  
  return [...new Set(tags)].slice(0, 5)
}

// 오늘 사용량 확인
async function getTodayUsage() {
  const today = new Date().toISOString().split('T')[0]
  
  const { data } = await supabase
    .from('api_usage_tracking')
    .select('*')
    .eq('api_name', 'newsapi')
    .eq('date', today)
    .single()
  
  return data
}

// 사용량 업데이트
async function updateUsage(requestsUsed: number, keywords: string[]) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()
  
  const existingUsage = await getTodayUsage()
  
  if (existingUsage) {
    await supabase
      .from('api_usage_tracking')
      .update({
        requests_count: existingUsage.requests_count + requestsUsed,
        last_search_time: now,
        keywords_searched: [...new Set([...existingUsage.keywords_searched, ...keywords])]
      })
      .eq('api_name', 'newsapi')
      .eq('date', today)
  } else {
    await supabase
      .from('api_usage_tracking')
      .insert({
        api_name: 'newsapi',
        date: today,
        requests_count: requestsUsed,
        last_search_time: now,
        keywords_searched: keywords,
        daily_limit: NEWS_API_STRATEGY.safe_daily,
        monthly_limit: NEWS_API_STRATEGY.monthly_limit
      })
  }
}

// 스마트 키워드 선택 (News API용 - 심층 분석 중심)
function selectNewsAPIKeywords(usage: any): string[] {
  const keywords: string[] = []
  const hour = new Date().getHours()
  const dayOfWeek = new Date().getDay()
  const searchedToday = usage?.keywords_searched || []
  
  // 하루 예산 확인
  const remainingBudget = usage ? 
    (NEWS_API_STRATEGY.safe_daily - usage.requests_count) : 
    NEWS_API_STRATEGY.safe_daily
  
  if (remainingBudget <= 0) {
    console.log('News API daily limit reached')
    return []
  }
  
  // 요일별 전략 (주말 = 경기 분석, 평일 = 팀/선수 분석)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  // 오전 (9-12시): 경기 분석
  if (hour >= 9 && hour <= 12) {
    if (isWeekend || dayOfWeek === 1) { // 주말 또는 월요일
      NEWS_API_STRATEGY.queries.matchAnalysis.forEach(keyword => {
        if (!searchedToday.includes(keyword) && keywords.length < 6) {
          keywords.push(keyword)
        }
      })
    } else {
      NEWS_API_STRATEGY.queries.leagueAnalysis.forEach(keyword => {
        if (!searchedToday.includes(keyword) && keywords.length < 4) {
          keywords.push(keyword)
        }
      })
    }
  }
  // 오후 (13-18시): 전술/감독 분석
  else if (hour >= 13 && hour <= 18) {
    NEWS_API_STRATEGY.queries.managerTactics.forEach(keyword => {
      if (!searchedToday.includes(keyword) && keywords.length < 5) {
        keywords.push(keyword)
      }
    })
  }
  // 저녁 (19-23시): 선수 특집
  else if (hour >= 19 && hour <= 23) {
    NEWS_API_STRATEGY.queries.playerFeatures.forEach(keyword => {
      if (!searchedToday.includes(keyword) && keywords.length < 5) {
        keywords.push(keyword)
      }
    })
    // 한국 선수 우선
    const koreanPlayers = NEWS_API_STRATEGY.queries.playerFeatures.filter(k => 
      k.includes('Son Heung-min') || k.includes('Lee Kang-in') || k.includes('Kim Min-jae')
    )
    koreanPlayers.forEach(keyword => {
      if (!searchedToday.includes(keyword) && !keywords.includes(keyword)) {
        keywords.unshift(keyword) // 최우선 순위
      }
    })
  }
  // 새벽/심야: 이적 시장 분석
  else {
    NEWS_API_STRATEGY.queries.transferAnalysis.forEach(keyword => {
      if (!searchedToday.includes(keyword) && keywords.length < 3) {
        keywords.push(keyword)
      }
    })
  }
  
  // 예산 내에서 제한
  return keywords.slice(0, Math.min(remainingBudget, 6))
}

// 중복 체크 및 저장
async function saveArticles(articles: any[]) {
  let savedCount = 0
  let duplicateCount = 0
  
  for (const article of articles) {
    if (!article || !article.url) continue
    
    // URL로 중복 체크
    const { data: existing } = await supabase
      .from('news_articles')
      .select('id')
      .eq('url', article.url)
      .single()
    
    if (existing) {
      duplicateCount++
      continue
    }
    
    // 저장
    const { error } = await supabase
      .from('news_articles')
      .insert(article)
    
    if (error) {
      console.error('Error saving News API article:', error)
      console.error('Article URL:', article.url)
    } else {
      savedCount++
    }
  }
  
  return { savedCount, duplicateCount }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    console.log('📰 Starting News API collection (24h delay plan)...')
    
    // 사용량 확인
    const usage = await getTodayUsage()
    const currentRequests = usage?.requests_count || 0
    
    // 키워드 선택
    const keywords = selectNewsAPIKeywords(usage)
    
    if (keywords.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No keywords or daily limit reached',
        stats: {
          daily_used: currentRequests,
          daily_limit: NEWS_API_STRATEGY.safe_daily,
          monthly_estimate: currentRequests * 30
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`📋 Selected ${keywords.length} keywords for News API`)
    
    // 뉴스 수집
    const allArticles: any[] = []
    let requestsUsed = 0
    
    for (const keyword of keywords) {
      console.log(`🔎 Searching News API: ${keyword}`)
      const results = await searchNewsAPI(keyword)
      requestsUsed++
      
      if (results && results.length > 0) {
        const normalized = results
          .map((article: any) => normalizeNewsAPIArticle(article, keyword))
          .filter(Boolean)
        
        allArticles.push(...normalized)
        console.log(`✅ Found ${normalized.length} articles`)
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 저장
    const { savedCount, duplicateCount } = await saveArticles(allArticles)
    
    // 사용량 업데이트
    await updateUsage(requestsUsed, keywords)
    
    const response = {
      success: true,
      message: `Collected ${allArticles.length} articles from News API`,
      stats: {
        collected: allArticles.length,
        saved: savedCount,
        duplicates: duplicateCount,
        api_usage: {
          today: currentRequests + requestsUsed,
          daily_limit: NEWS_API_STRATEGY.safe_daily,
          monthly_projection: (currentRequests + requestsUsed) * 30,
          monthly_limit: NEWS_API_STRATEGY.monthly_limit,
          remaining_today: NEWS_API_STRATEGY.safe_daily - (currentRequests + requestsUsed)
        },
        keywords_searched: keywords
      }
    }
    
    console.log('✅ News API collection completed:', response.stats)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Error in newsapi-collector:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})