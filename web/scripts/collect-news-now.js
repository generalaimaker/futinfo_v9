// 즉시 뉴스 수집하는 스크립트
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

const SUPABASE_URL = 'https://uutmymaxkkytibuiiaax.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM'
const BRAVE_API_KEY = 'BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 주요 팀과 검색어
const SEARCH_QUERIES = [
  'Manchester United news',
  'Liverpool FC news', 
  'Manchester City news',
  'Arsenal news',
  'Chelsea FC news',
  'Real Madrid news',
  'Barcelona news',
  'Bayern Munich news',
  'PSG news',
  'football transfer news',
  'premier league news',
  'champions league news',
  'football breaking news'
]

async function searchBraveNews(query) {
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

function parseRelativeTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return new Date().toISOString()
  }
  
  // 이미 ISO 형식인 경우
  if (timeStr.includes('T') && timeStr.includes('Z')) {
    return timeStr
  }
  
  const now = new Date()
  const match = timeStr.match(/(\d+)\s*(hour|day|minute|second)s?\s*ago/i)
  
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
    }
  }
  
  return now.toISOString()
}

function calculateTrustScore(article) {
  let score = 50
  const source = (article.meta_url?.hostname || article.meta?.site || '').toLowerCase()
  
  // 신뢰할 수 있는 소스
  const trustedSources = {
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

async function collectNews() {
  console.log('Starting news collection...')
  const allArticles = new Map()
  let apiCalls = 0
  
  // 모든 검색어에 대해 뉴스 수집
  for (const query of SEARCH_QUERIES) {
    const results = await searchBraveNews(query)
    apiCalls++
    
    for (const article of results) {
      if (article.url && !allArticles.has(article.url)) {
        allArticles.set(article.url, {
          title: article.title?.substring(0, 500),
          description: article.description?.substring(0, 2000),
          url: article.url,
          source: article.meta_url?.hostname || article.meta?.site || 'Unknown',
          source_tier: calculateTrustScore(article) >= 80 ? 1 : 2,
          published_at: parseRelativeTime(article.age || article.page_age),
          image_url: article.thumbnail?.src || article.meta?.image,
          category: query.includes('transfer') ? 'transfer' : 'general',
          trust_score: calculateTrustScore(article),
          importance_score: 50,
          is_breaking: article.title?.toLowerCase().includes('breaking') || false,
          tags: [query.split(' ')[0].toLowerCase()],
          team_ids: [],
          collected_at: new Date().toISOString()
        })
      }
    }
    
    // API 제한 방지를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\nCollected ${allArticles.size} unique articles from ${apiCalls} API calls`)
  
  // 데이터베이스에 저장
  if (allArticles.size > 0) {
    const articlesToSave = Array.from(allArticles.values())
    console.log('\nSaving to database...')
    
    // 배치로 저장 (한 번에 50개씩)
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
    
    console.log(`\n✅ Successfully saved ${saved} articles to database`)
    
    // API 사용량 기록
    await supabase
      .from('api_usage')
      .upsert({
        api_name: 'brave_search',
        usage_date: new Date().toISOString().split('T')[0],
        usage_count: apiCalls
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
  
  console.log('\n🎉 News collection complete!')
}

// 실행
collectNews().catch(console.error)