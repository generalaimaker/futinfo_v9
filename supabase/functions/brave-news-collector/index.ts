import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BRAVE_API_KEY = Deno.env.get('BRAVE_API_KEY') || 'BSACH8X_R7GgJDDzfJhiilbYKnzCgeg'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 스마트 키워드 전략 (유럽 시간대 기반 + 축구팬 관심사)
const SEARCH_KEYWORDS = {
  // 핵심 리그 키워드 (항상 최우선)
  leagues: {
    priority: [
      'Premier League news today',
      'La Liga latest news',
      'Champions League news',
      'Serie A news today',
      'Bundesliga latest',
      'Europa League news',
      'Conference League news',
      'Ligue 1 news today',
    ],
    weekend: [
      'Premier League matchday live',
      'La Liga fixtures today',
      'Serie A results',
      'Bundesliga highlights',
      'Ligue 1 goals',
      'Championship playoffs',
    ]
  },
  
  // 빅클럽 (팬층이 가장 많은 팀들)
  topTeams: {
    england: [
      'Manchester United transfer news',
      'Liverpool FC latest',
      'Manchester City news today',
      'Arsenal transfer rumors',
      'Chelsea FC news',
      'Tottenham Hotspur news',
      'Newcastle United transfer',
      'Aston Villa news',
    ],
    spain: [
      'Real Madrid news today',
      'Barcelona transfer news',
      'Atletico Madrid latest',
      'Real Sociedad news',
      'Athletic Bilbao news',
    ],
    italy: [
      'Juventus transfer news',
      'AC Milan latest news',
      'Inter Milan transfer',
      'Napoli news today',
      'AS Roma transfer news',
    ],
    germany: [
      'Bayern Munich news',
      'Borussia Dortmund transfer',
      'Bayer Leverkusen news',
      'RB Leipzig transfer',
    ],
    france: [
      'PSG transfer news',
      'Marseille news today',
      'Monaco transfer news',
    ]
  },
  
  // 스타 플레이어 (인기 순위)
  starPlayers: {
    trending: [
      'Erling Haaland goals today',
      'Kylian Mbappe transfer news',
      'Jude Bellingham Real Madrid',
      'Vinicius Jr highlights',
      'Bukayo Saka Arsenal',
      'Pedri Barcelona news',
      'Gavi injury update',
      'Florian Wirtz transfer',
      'Jamal Musiala Bayern',
    ],
    korean: [
      'Son Heung-min Tottenham goal',
      '손흥민 토트넘 news',
      'Lee Kang-in PSG assist',
      '이강인 PSG news',
      'Kim Min-jae Bayern Munich',
      '김민재 바이에른 뮌헨',
    ],
    legends: [
      'Lionel Messi Inter Miami',
      'Cristiano Ronaldo Al Nassr',
      'Neymar Al Hilal injury',
    ]
  },
  
  // 시간대별 특화 키워드
  timeSpecific: {
    // 유럽 오전 (KST 오후 4-8시) - 전날 경기 리뷰
    euroMorning: [
      'last night football highlights',
      'match analysis premier league',
      'player ratings Champions League',
      'post match interview',
      'tactical analysis football',
    ],
    // 유럽 오후 (KST 저녁 8-12시) - 경기 프리뷰, 팀 소식
    euroAfternoon: [
      'tonight football preview',
      'starting lineup leaked',
      'team news premier league',
      'injury update Champions League',
      'press conference today',
    ],
    // 유럽 저녁 (KST 새벽 12-4시) - 실시간 경기
    euroEvening: [
      'live score Premier League',
      'goals video highlights',
      'red card controversy',
      'penalty decision VAR',
      'breaking football news',
    ],
    // 유럽 심야 (KST 오전 4-8시) - 경기 종료 직후
    euroNight: [
      'full time results',
      'manager press conference',
      'player of the match',
      'match statistics analysis',
      'post game reactions',
    ]
  },
  
  // 공신력 있는 기자/소스 (루머/이적 신뢰도 높음)
  trustedSources: [
    'Fabrizio Romano transfer news',
    'David Ornstein Arsenal news',
    'Gianluca Di Marzio transfer',
    'Florian Plettenberg Bayern news',
    'Matt Law Chelsea news',
    'Miguel Delaney Manchester',
    'James Ducker Manchester United',
    'Paul Joyce Liverpool news',
    'Sam Lee Manchester City',
  ],
  
  // 주요 이벤트/이슈 키워드
  hotTopics: [
    'transfer window deadline',
    'January transfer news',
    'contract extension news',
    'player injury update',
    'manager sacked news',
    'UEFA investigation',
    'Financial Fair Play news',
    'World Cup qualifier',
    'Euro 2024 news',
  ]
}

// Brave + News API 조합 전략 (월 3000회)
const QUERY_STRATEGY = {
  brave: {
    monthly_limit: 2000,
    daily_safe: 53,     // 월 2000 / 30일 보수적
    distribution: {
      weekday: 40,      // 평일 (News API와 분담)
      weekend: 60,      // 주말 (실시간 중요)
      matchday: 70,     // 경기일 (실시간 최우선)
    },
    focus: 'realtime'   // 실시간 속보 위주
  },
  newsapi: {
    monthly_limit: 1000,
    daily_safe: 30,     // 월 1000 / 30일
    focus: 'analysis'   // 분석/심층 기사 위주
  },
  combined: {
    total_monthly: 3000,
    daily_total: 83,    // 53 + 30
  },
  hourly: {
    peak: 5,        // 피크 시간 (유럽 저녁)
    normal: 3,      // 일반 시간
    quiet: 1,       // 조용한 시간
  }
}

// 사용량 추적
interface UsageTracking {
  date: string
  requests_count: number
  last_search_time: string
  keywords_searched: string[]
}

// Brave Search API 호출
async function searchBraveNews(query: string, count: number = 10) {
  try {
    // 유럽 시간 기반 freshness 설정
    const now = new Date()
    const euroHour = (now.getUTCHours() + 1) % 24 // CET/CEST
    
    let freshness = 'pd' // 기본 24시간
    if (euroHour >= 19 && euroHour <= 23) {
      freshness = 'ph' // 경기 시간: 1시간 이내
    } else if (euroHour >= 7 && euroHour <= 10) {
      freshness = 'pd' // 경기 후 아침: 24시간
    }
    
    const url = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=${count}&search_lang=en&freshness=${freshness}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    })

    if (!response.ok) {
      console.error(`Brave API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error(`Error searching Brave news for "${query}":`, error)
    return null
  }
}

// 뉴스 데이터 정규화 및 스코어링
function normalizeNewsArticle(article: any, searchQuery: string) {
  try {
    const title = (article.title || '').toLowerCase()
    const description = (article.description || '').toLowerCase()
    const combinedText = title + ' ' + description
    
    // 카테고리 및 중요도 스코어링
    let category = 'general'
    let importance = 50
    
    // 이적 뉴스 (최고 관심사)
    if (combinedText.includes('transfer') || combinedText.includes('signs') || 
        combinedText.includes('joins') || combinedText.includes('deal')) {
      category = 'transfer'
      importance = 90
    }
    // 경기 결과/하이라이트
    else if (combinedText.includes('goal') || combinedText.includes('score') ||
             combinedText.includes('win') || combinedText.includes('defeat')) {
      category = 'match'
      importance = 85
    }
    // 부상 소식
    else if (combinedText.includes('injur') || combinedText.includes('sidelined')) {
      category = 'injury'
      importance = 75
    }
    // 전술/분석
    else if (combinedText.includes('analysis') || combinedText.includes('tactics')) {
      category = 'analysis'
      importance = 70
    }

    // 신뢰도 점수 (소스 기반)
    let trustScore = 70
    const source = article.meta_url?.hostname || ''
    
    // Tier 1 소스
    if (source.includes('skysports') || source.includes('bbc') || 
        source.includes('guardian') || source.includes('athletic')) {
      trustScore = 95
    }
    // Tier 2 소스  
    else if (source.includes('espn') || source.includes('goal.com') ||
             source.includes('transfermarkt') || source.includes('football365')) {
      trustScore = 85
    }
    // Tier 3 소스
    else if (source.includes('mirror') || source.includes('sun') ||
             source.includes('dailymail')) {
      trustScore = 60
    }

    return {
      id: crypto.randomUUID(),
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      source: article.meta_url?.hostname?.replace('www.', '') || 'Unknown',
      source_tier: trustScore >= 85 ? 1 : trustScore >= 70 ? 2 : 3,
      category: category,
      tags: extractTags(combinedText, searchQuery),
      image_url: article.thumbnail?.src || '',
      published_at: article.page_age ? new Date(article.page_age).toISOString() : new Date().toISOString(),
      trust_score: trustScore,
      importance_score: importance,
      view_count: 0,
      is_featured: false,
      is_breaking: importance >= 85,
      priority: Math.floor(importance / 10),
      translations: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error normalizing article:', error)
    return null
  }
}

// 태그 추출
function extractTags(text: string, query: string): string[] {
  const tags = []
  
  // 리그 태그
  if (text.includes('premier league')) tags.push('PremierLeague')
  if (text.includes('la liga')) tags.push('LaLiga')
  if (text.includes('champions league')) tags.push('ChampionsLeague')
  if (text.includes('serie a')) tags.push('SerieA')
  if (text.includes('bundesliga')) tags.push('Bundesliga')
  
  // 팀 태그
  const teams = ['manchester united', 'liverpool', 'chelsea', 'arsenal', 
                 'real madrid', 'barcelona', 'bayern', 'psg']
  teams.forEach(team => {
    if (text.includes(team)) tags.push(team.replace(' ', ''))
  })
  
  // 쿼리 기반 태그
  const queryWords = query.split(' ').filter(w => w.length > 3)
  tags.push(...queryWords.slice(0, 2))
  
  return [...new Set(tags)].slice(0, 5)
}

// 오늘 사용량 확인
async function getTodayUsage(): Promise<UsageTracking | null> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('api_usage_tracking')
    .select('*')
    .eq('api_name', 'brave_search')
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching usage:', error)
  }

  return data
}

// 사용량 업데이트
async function updateUsage(requestsUsed: number, keywords: string[]) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  const existingUsage = await getTodayUsage()

  if (existingUsage) {
    const { error } = await supabase
      .from('api_usage_tracking')
      .update({
        requests_count: existingUsage.requests_count + requestsUsed,
        last_search_time: now,
        keywords_searched: [...new Set([...existingUsage.keywords_searched, ...keywords])]
      })
      .eq('api_name', 'brave_search')
      .eq('date', today)

    if (error) console.error('Error updating usage:', error)
  } else {
    const { error } = await supabase
      .from('api_usage_tracking')
      .insert({
        api_name: 'brave_search',
        date: today,
        requests_count: requestsUsed,
        last_search_time: now,
        keywords_searched: keywords,
        daily_limit: QUERY_STRATEGY.brave.daily_safe,
        monthly_limit: QUERY_STRATEGY.brave.monthly_limit
      })

    if (error) console.error('Error creating usage record:', error)
  }
}

// 중복 체크 및 저장
async function saveArticles(articles: any[]) {
  let savedCount = 0
  let duplicateCount = 0

  // 중요도 순으로 정렬
  articles.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))

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
      console.error('Error saving article:', error)
      console.error('Article data:', JSON.stringify(article, null, 2))
    } else {
      savedCount++
    }
  }

  return { savedCount, duplicateCount }
}

// 스마트 키워드 선택 (유럽 시간대 + 중요도 기반)
function selectKeywords(usage: UsageTracking | null): string[] {
  const keywords: string[] = []
  const now = new Date()
  const dayOfWeek = now.getDay()
  const euroHour = (now.getUTCHours() + 1) % 24 // CET/CEST
  const kstHour = (now.getUTCHours() + 9) % 24 // KST
  
  // 일일 예산 계산 (Brave Search 전용)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isMatchDay = dayOfWeek === 2 || dayOfWeek === 3 // 화/수 챔스
  
  let dailyBudget = QUERY_STRATEGY.brave.distribution.weekday
  if (isWeekend) dailyBudget = QUERY_STRATEGY.brave.distribution.weekend
  if (isMatchDay) dailyBudget = QUERY_STRATEGY.brave.distribution.matchday
  
  const remainingBudget = usage ? (dailyBudget - usage.requests_count) : dailyBudget
  
  if (remainingBudget <= 0) {
    console.log('Daily limit reached')
    return []
  }

  const searchedToday = usage?.keywords_searched || []
  
  // 시간대별 쿼리 수 결정
  let queryCount = QUERY_STRATEGY.hourly.normal
  if (euroHour >= 19 && euroHour <= 23) {
    queryCount = QUERY_STRATEGY.hourly.peak // 유럽 경기 시간
  } else if (euroHour >= 0 && euroHour <= 6) {
    queryCount = QUERY_STRATEGY.hourly.quiet // 유럽 새벽
  }
  
  // 1. 리그 키워드 (항상 포함)
  const leagueKeywords = isWeekend ? 
    SEARCH_KEYWORDS.leagues.weekend : SEARCH_KEYWORDS.leagues.priority
  
  leagueKeywords.forEach(keyword => {
    if (!searchedToday.includes(keyword) && keywords.length < queryCount) {
      keywords.push(keyword)
    }
  })
  
  // 2. 시간대별 특화 키워드
  let timeKeywords: string[] = []
  if (euroHour >= 7 && euroHour <= 12) {
    timeKeywords = SEARCH_KEYWORDS.timeSpecific.euroMorning
  } else if (euroHour >= 13 && euroHour <= 18) {
    timeKeywords = SEARCH_KEYWORDS.timeSpecific.euroAfternoon
  } else if (euroHour >= 19 && euroHour <= 23) {
    timeKeywords = SEARCH_KEYWORDS.timeSpecific.euroEvening
  } else {
    timeKeywords = SEARCH_KEYWORDS.timeSpecific.euroNight
  }
  
  timeKeywords.forEach(keyword => {
    if (!searchedToday.includes(keyword) && keywords.length < queryCount * 2) {
      keywords.push(keyword)
    }
  })
  
  // 3. 팀/선수 키워드 (로테이션)
  const teamKeywords = [
    ...SEARCH_KEYWORDS.topTeams.england,
    ...SEARCH_KEYWORDS.topTeams.spain,
    ...SEARCH_KEYWORDS.topTeams.italy,
    ...SEARCH_KEYWORDS.topTeams.germany,
    ...SEARCH_KEYWORDS.topTeams.france
  ]
  
  // 한국 시청자를 위한 한국 선수 키워드 (한국 시간 저녁 - 최우선)
  if (kstHour >= 18 && kstHour <= 23) {
    keywords.unshift(...SEARCH_KEYWORDS.starPlayers.korean.filter(k => !searchedToday.includes(k)))
  }
  
  // 공신력 있는 기자 키워드 (이적 시장 기간 중요)
  const currentMonth = new Date().getMonth()
  if (currentMonth === 0 || currentMonth === 7) { // 1월, 8월 이적시장
    const trustedKeywords = SEARCH_KEYWORDS.trustedSources.filter(k => !searchedToday.includes(k))
    keywords.push(...trustedKeywords.slice(0, 3))
  }
  
  // 미검색 팀 키워드 추가
  const unsearchedTeams = teamKeywords.filter(k => !searchedToday.includes(k))
  keywords.push(...unsearchedTeams.slice(0, Math.max(0, queryCount - keywords.length)))
  
  // 4. 스타 플레이어 (남은 예산)
  if (keywords.length < remainingBudget) {
    const playerKeywords = [
      ...SEARCH_KEYWORDS.starPlayers.trending,
      ...SEARCH_KEYWORDS.starPlayers.legends
    ]
    const unsearchedPlayers = playerKeywords.filter(k => !searchedToday.includes(k))
    keywords.push(...unsearchedPlayers.slice(0, Math.max(0, queryCount - keywords.length)))
  }
  
  // 5. 핫토픽 (남은 예산 활용)
  if (keywords.length < remainingBudget) {
    const hotTopics = SEARCH_KEYWORDS.hotTopics.filter(k => !searchedToday.includes(k))
    keywords.push(...hotTopics.slice(0, Math.max(0, remainingBudget - keywords.length)))
  }
  
  // 최종 제한
  return keywords.slice(0, Math.min(queryCount * 2, remainingBudget))
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type = 'auto', forceSearch = false } = await req.json().catch(() => ({}))
    
    console.log('🔍 Starting Smart Brave Search news collection...')
    
    // 6일 이상된 뉴스 자동 삭제
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
    
    const { count: deletedCount } = await supabase
      .from('news_articles')
      .delete()
      .lt('published_at', sixDaysAgo.toISOString())
      .eq('is_featured', false)
    
    console.log(`🗑️ Deleted ${deletedCount || 0} old articles`)

    // 사용량 확인
    const usage = await getTodayUsage()
    const currentRequests = usage?.requests_count || 0
    
    // 스마트 키워드 선택
    const keywords = selectKeywords(usage)
    
    if (keywords.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No keywords to search or daily limit reached',
        stats: {
          daily_used: currentRequests,
          daily_limit: QUERY_STRATEGY.brave.daily_safe,
          monthly_estimate: currentRequests * 30
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`📋 Smart search: ${keywords.length} keywords selected`)
    console.log('Keywords:', keywords)

    // 뉴스 수집
    const allArticles: any[] = []
    let requestsUsed = 0

    for (const keyword of keywords) {
      console.log(`🔎 Searching: ${keyword}`)
      const results = await searchBraveNews(keyword, 10)
      requestsUsed++

      if (results && results.length > 0) {
        const normalized = results
          .map((article: any) => normalizeNewsArticle(article, keyword))
          .filter(Boolean)
        
        allArticles.push(...normalized)
        console.log(`✅ Found ${normalized.length} articles for "${keyword}"`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`📊 Total articles collected: ${allArticles.length}`)

    // 저장
    const { savedCount, duplicateCount } = await saveArticles(allArticles)

    // 사용량 업데이트
    await updateUsage(requestsUsed, keywords)

    const response = {
      success: true,
      message: `Collected ${allArticles.length} articles, saved ${savedCount} new`,
      stats: {
        collected: allArticles.length,
        saved: savedCount,
        duplicates: duplicateCount,
        deleted_old: deletedCount || 0,
        api_usage: {
          today: currentRequests + requestsUsed,
          daily_limit: QUERY_STRATEGY.brave.daily_safe,
          monthly_projection: (currentRequests + requestsUsed) * 30,
          monthly_limit: QUERY_STRATEGY.brave.monthly_limit,
          remaining_today: QUERY_STRATEGY.brave.daily_safe - (currentRequests + requestsUsed)
        },
        keywords_searched: keywords,
        time_info: {
          euro_hour: (new Date().getUTCHours() + 1) % 24,
          kst_hour: (new Date().getUTCHours() + 9) % 24,
          is_peak_time: (new Date().getUTCHours() + 1) % 24 >= 19 && (new Date().getUTCHours() + 1) % 24 <= 23
        }
      },
      timestamp: new Date().toISOString()
    }

    console.log('✅ Smart Brave news collection completed:', response.stats)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Error in brave-news-collector:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})