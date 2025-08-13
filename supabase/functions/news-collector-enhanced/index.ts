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

// 주요 팀 (유럽 5대 리그 + 확대)
const PRIORITY_TEAMS = {
  premier: [
    'Manchester United', 'Liverpool', 'Manchester City', 
    'Chelsea', 'Arsenal', 'Tottenham',
    'Newcastle', 'Aston Villa', 'Brighton',
    'West Ham', 'Fulham', 'Brentford'
  ],
  laliga: [
    'Real Madrid', 'Barcelona', 'Atletico Madrid',
    'Sevilla', 'Real Sociedad', 'Valencia',
    'Villarreal', 'Athletic Bilbao', 'Real Betis'
  ],
  seriea: [
    'Juventus', 'Inter Milan', 'AC Milan', 
    'Napoli', 'Roma', 'Lazio',
    'Atalanta', 'Fiorentina', 'Bologna'
  ],
  bundesliga: [
    'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen',
    'RB Leipzig', 'Eintracht Frankfurt', 'Union Berlin',
    'Wolfsburg', 'Freiburg', 'Stuttgart'
  ],
  ligue1: [
    'PSG', 'Marseille', 'Monaco',
    'Lille', 'Lyon', 'Nice',
    'Lens', 'Rennes', 'Toulouse'
  ],
  other: [
    'Ajax', 'PSV', 'Feyenoord', // Netherlands
    'Benfica', 'Porto', 'Sporting', // Portugal
    'Celtic', 'Rangers', // Scotland
    'Galatasaray', 'Fenerbahce', // Turkey
    'Olympiacos', 'Panathinaikos' // Greece
  ]
}

// 검색 쿼리 생성
function generateSearchQueries() {
  const queries = []
  const now = new Date()
  const timeRanges = ['1 hour ago', '3 hours ago', '6 hours ago']
  
  // 주요 팀별 쿼리
  Object.values(PRIORITY_TEAMS).flat().forEach(team => {
    queries.push(`${team} news`)
  })
  
  // 일반 카테고리 쿼리
  queries.push(
    'football transfer news',
    'premier league news',
    'champions league news',
    'football breaking news',
    'football injury news',
    'football match results'
  )
  
  return queries
}

// 날짜 파싱
function parsePublishDate(article: any) {
  if (article.page_age) {
    if (!article.page_age.includes('Z')) {
      return new Date(article.page_age + 'Z').toISOString()
    }
    return new Date(article.page_age).toISOString()
  }
  
  const timeStr = article.age
  if (!timeStr || typeof timeStr !== 'string') {
    return new Date().toISOString()
  }
  
  const now = new Date()
  const match = timeStr.match(/(\d+)\s*(hour|day|minute|second|week|month)s?\s*ago/i)
  
  if (match) {
    const [, amount, unit] = match
    const value = parseInt(amount)
    
    switch(unit.toLowerCase()) {
      case 'second':
        now.setSeconds(now.getSeconds() - value)
        break
      case 'minute':
        now.setMinutes(now.getMinutes() - value)
        break
      case 'hour':
        now.setHours(now.getHours() - value)
        break
      case 'day':
        now.setDate(now.getDate() - value)
        break
      case 'week':
        now.setDate(now.getDate() - (value * 7))
        break
      case 'month':
        now.setMonth(now.getMonth() - value)
        break
    }
  }
  
  return now.toISOString()
}

// 신뢰도 점수 계산
function calculateTrustScore(article: any) {
  let score = 50
  const source = (article.meta_url?.hostname || article.meta?.site || '').toLowerCase()
  
  const trustedSources: Record<string, number> = {
    'bbc.com': 95,
    'bbc.co.uk': 95,
    'skysports.com': 90,
    'espn.com': 85,
    'espn.co.uk': 85,
    'theathletic.com': 85,
    'theguardian.com': 80,
    'manchestereveningnews.co.uk': 80,
    'goal.com': 75,
    'transfermarkt': 75,
    'fabrizio romano': 90,
    'reuters.com': 90,
    'telegraph.co.uk': 80,
    'independent.co.uk': 75
  }
  
  for (const [key, value] of Object.entries(trustedSources)) {
    if (source.includes(key)) {
      score = value
      break
    }
  }
  
  return score
}

// Brave News API로 검색
async function searchBraveNews(query: string) {
  try {
    console.log(`Searching for: ${query}`)
    const response = await fetch(
      `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=10&freshness=day`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        }
      }
    )
    
    if (!response.ok) {
      console.error(`Brave API error for "${query}": ${response.status}`)
      return []
    }
    
    const data = await response.json()
    console.log(`Found ${data.results?.length || 0} results for "${query}"`)
    return data.results || []
  } catch (error) {
    console.error(`Error searching for "${query}":`, error)
    return []
  }
}

// 메인 수집 함수
async function collectNews() {
  console.log('Starting news collection...')
  const allArticles = new Map()
  let apiCalls = 0
  
  const queries = generateSearchQueries()
  
  // 병렬 처리를 위한 배치
  const batchSize = 5
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(query => searchBraveNews(query))
    )
    
    apiCalls += batch.length
    
    // 결과 처리
    for (const articles of results) {
      for (const article of articles) {
        if (article.url && !article.url.includes('example.com') && !allArticles.has(article.url)) {
          allArticles.set(article.url, {
            title: article.title?.substring(0, 500),
            description: article.description?.substring(0, 2000),
            url: article.url,
            source: article.meta_url?.hostname || article.meta?.site || 'Unknown',
            source_tier: calculateTrustScore(article) >= 80 ? 1 : 2,
            published_at: parsePublishDate(article),
            image_url: article.thumbnail?.src || article.meta?.image,
            category: article.title?.toLowerCase().includes('transfer') ? 'transfer' : 
                     article.title?.toLowerCase().includes('injury') ? 'injury' : 'general',
            trust_score: calculateTrustScore(article),
            importance_score: 50,
            is_breaking: article.title?.toLowerCase().includes('breaking') || false,
            tags: [],
            team_ids: [],
            collected_at: new Date().toISOString()
          })
        }
      }
    }
    
    // API 제한 방지
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log(`Collected ${allArticles.size} unique articles from ${apiCalls} API calls`)
  
  // 데이터베이스에 저장
  if (allArticles.size > 0) {
    const articlesToSave = Array.from(allArticles.values())
    console.log('Saving to database...')
    
    const batchSize = 50
    let saved = 0
    
    for (let i = 0; i < articlesToSave.length; i += batchSize) {
      const batch = articlesToSave.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('news_articles')
        .upsert(batch, {
          onConflict: 'url',
          ignoreDuplicates: true
        })
        .select()
      
      if (error) {
        console.error('Error saving batch:', error)
      } else {
        saved += data?.length || 0
        console.log(`Saved batch ${Math.floor(i/batchSize) + 1}: ${data?.length || 0} articles`)
      }
    }
    
    console.log(`Successfully saved ${saved} articles`)
    
    // API 사용량 기록
    await supabase
      .from('api_usage')
      .upsert({
        api_name: 'brave_search',
        usage_date: new Date().toISOString().split('T')[0],
        usage_count: apiCalls,
        details: { articles_collected: allArticles.size, articles_saved: saved }
      }, {
        onConflict: 'api_name,usage_date'
      })
    
    // 수집 로그 기록
    await supabase
      .from('collection_logs')
      .insert({
        collected_at: new Date().toISOString(),
        total_articles: allArticles.size,
        unique_articles: allArticles.size,
        saved_articles: saved,
        api_calls: apiCalls
      })
  }
  
  return { success: true, collected: allArticles.size, apiCalls }
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const result = await collectNews()
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in news collection:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})