import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { parseFeed } from 'https://deno.land/x/rss@0.5.6/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BRAVE_API_KEY = Deno.env.get('BRAVE_SEARCH_API_KEY') || 'BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT'
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search'

// RSS 피드 소스
const RSS_FEEDS = [
  { url: 'https://www.skysports.com/rss/12040', source: 'Sky Sports' },
  { url: 'https://www.theguardian.com/football/rss', source: 'The Guardian' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN' },
  { url: 'https://www.football365.com/feed', source: 'Football365' },
  { url: 'https://www.bbc.com/sport/football/rss.xml', source: 'BBC Sport' },
  { url: 'https://talksport.com/football/feed/', source: 'talkSPORT' },
  { url: 'https://theathletic.com/football/feed/', source: 'The Athletic' },
]

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
  others: [
    'Ajax', 'PSV', 'Feyenoord', // 네덜란드
    'Porto', 'Benfica', 'Sporting', // 포르투갈
    'Celtic', 'Rangers', // 스코틀랜드
    'Galatasaray', 'Fenerbahce', // 터키
  ]
}

// 속보 키워드
const BREAKING_KEYWORDS = [
  'done deal', 'confirmed', 'signs for', 'medical completed',
  'official', 'announcement', 'agreement reached',
  'injury blow', 'ruled out', 'sidelined', 'surgery',
  'sacked', 'resigned', 'appointed', 'new manager',
  'red card', 'penalty', 'comeback', 'upset',
  'breaking', 'exclusive', 'update', 'latest'
]

// 카테고리 분류
function categorizeArticle(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase()
  
  if (text.match(/transfer|signing|deal|medical|loan|bid|offer/)) return 'transfer'
  if (text.match(/injury|injured|fitness|return|sidelined|out/)) return 'injury'
  if (text.match(/lineup|starting|xi|team news|squad/)) return 'lineup'
  if (text.match(/result|score|goal|win|lose|draw|defeat|victory/)) return 'match'
  if (text.match(/preview|prediction|vs|face|clash|meet/)) return 'preview'
  if (text.match(/analysis|tactical|opinion|column|view/)) return 'analysis'
  
  return 'general'
}

// 팀 추출
function extractTeamIds(text: string): number[] {
  const teamIds = new Set<number>()
  const lowerText = text.toLowerCase()
  
  const teamMappings: Record<string, number> = {
    // 프리미어리그
    'manchester united': 33,
    'man utd': 33,
    'liverpool': 40,
    'manchester city': 50,
    'man city': 50,
    'chelsea': 49,
    'arsenal': 42,
    'tottenham': 47,
    'spurs': 47,
    'newcastle': 34,
    'aston villa': 66,
    'brighton': 51,
    'west ham': 48,
    'fulham': 36,
    'brentford': 55,
    'everton': 45,
    'leicester': 46,
    'wolves': 39,
    'wolverhampton': 39,
    
    // 라리가
    'real madrid': 541,
    'barcelona': 529,
    'barca': 529,
    'atletico madrid': 530,
    'atletico': 530,
    'sevilla': 536,
    'real sociedad': 548,
    'valencia': 532,
    'villarreal': 533,
    'athletic bilbao': 531,
    'real betis': 543,
    
    // 세리에A
    'juventus': 496,
    'juve': 496,
    'inter milan': 505,
    'inter': 505,
    'ac milan': 489,
    'milan': 489,
    'napoli': 492,
    'roma': 497,
    'as roma': 497,
    'lazio': 487,
    'atalanta': 499,
    'fiorentina': 502,
    'bologna': 500,
    
    // 분데스리가
    'bayern munich': 157,
    'bayern': 157,
    'borussia dortmund': 165,
    'dortmund': 165,
    'bvb': 165,
    'bayer leverkusen': 168,
    'leverkusen': 168,
    'rb leipzig': 173,
    'leipzig': 173,
    'eintracht frankfurt': 169,
    'frankfurt': 169,
    'union berlin': 182,
    'wolfsburg': 161,
    'freiburg': 160,
    'stuttgart': 172,
    
    // 리그1
    'psg': 85,
    'paris saint-germain': 85,
    'paris': 85,
    'marseille': 81,
    'monaco': 91,
    'lille': 79,
    'lyon': 80,
    'nice': 84,
    'lens': 116,
    'rennes': 94,
    
    // 기타 유럽
    'ajax': 194,
    'psv': 197,
    'feyenoord': 195,
    'porto': 212,
    'benfica': 211,
    'sporting': 228,
    'sporting cp': 228,
    'celtic': 247,
    'rangers': 248,
    'galatasaray': 645,
    'fenerbahce': 611,
  }
  
  for (const [teamName, teamId] of Object.entries(teamMappings)) {
    if (lowerText.includes(teamName)) {
      teamIds.add(teamId)
    }
  }
  
  return Array.from(teamIds)
}

// 속보 여부 확인
function isBreakingNews(article: any): boolean {
  const text = (article.title + ' ' + article.description).toLowerCase()
  
  // 키워드 체크
  const hasBreakingKeyword = BREAKING_KEYWORDS.some(keyword => 
    text.includes(keyword)
  )
  
  // 시간 체크 (2시간 이내)
  const publishedAt = new Date(article.published_at || article.pubDate)
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)
  const isRecent = hoursAgo < 2
  
  return hasBreakingKeyword && isRecent
}

// 중요도 점수 계산
function calculateImportanceScore(article: any): number {
  let score = 0
  
  // 카테고리별 기본 점수
  const categoryScores: Record<string, number> = {
    'transfer': 90,
    'injury': 85,
    'match': 80,
    'lineup': 75,
    'preview': 70,
    'analysis': 60,
    'general': 50
  }
  score += categoryScores[article.category] || 50
  
  // 팀 중요도
  const allPriorityTeams = Object.values(PRIORITY_TEAMS).flat()
  const articleTeams = extractTeamIds(article.title + ' ' + article.description)
  if (articleTeams.some(id => [33, 40, 50, 49, 42, 47].includes(id))) {
    score += 30 // 프리미어리그 빅6
  } else if (articleTeams.length > 0) {
    score += 20 // 기타 주요 팀
  }
  
  // 최신성
  const publishedAt = new Date(article.published_at || article.pubDate)
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)
  if (hoursAgo < 1) score += 25
  else if (hoursAgo < 3) score += 15
  else if (hoursAgo < 6) score += 10
  
  // 속보 여부
  if (article.is_breaking || isBreakingNews(article)) {
    score += 50
  }
  
  return Math.min(score, 200)
}

// RSS 피드 수집
async function collectRSSFeeds() {
  const articles = []
  
  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url)
      const xml = await response.text()
      const parsed = await parseFeed(xml)
      
      for (const item of parsed.entries || []) {
        articles.push({
          title: item.title?.value || '',
          description: item.description?.value || item.summary?.value || '',
          url: item.links?.[0]?.href || '',
          source: feed.source,
          published_at: item.published || new Date().toISOString(),
          image_url: item.enclosure?.url || null,
          category: categorizeArticle(
            item.title?.value || '', 
            item.description?.value || ''
          ),
          team_ids: extractTeamIds(
            item.title?.value + ' ' + item.description?.value
          ),
          is_from_search: false
        })
      }
    } catch (error) {
      console.error(`Error fetching RSS from ${feed.source}:`, error)
    }
  }
  
  return articles
}

// Brave Search로 뉴스 검색
async function searchBraveForNews(query: string, count: number = 20) {
  try {
    const searchParams = new URLSearchParams({
      q: query + ' football news',
      count: String(count),
      search_lang: 'en',
      freshness: 'day',
      safesearch: 'moderate',
    })
    
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
    
    return results.map((result: any) => ({
      title: result.title,
      description: result.description,
      url: result.url,
      source: result.meta_url?.hostname || 'Unknown',
      published_at: parseAge(result.age),
      image_url: result.thumbnail?.src || null,
      category: categorizeArticle(result.title, result.description),
      team_ids: extractTeamIds(result.title + ' ' + result.description),
      is_from_search: true
    }))
  } catch (error) {
    console.error('Brave search error:', error)
    return []
  }
}

// 나이 파싱
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
  }
  
  return now.toISOString()
}

// 중복 제거
async function deduplicateArticles(articles: any[]) {
  // 최근 24시간 URL 가져오기
  const { data: existing } = await supabase
    .from('news_articles')
    .select('url, title')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  
  const existingUrls = new Set(existing?.map(e => e.url) || [])
  const existingTitles = existing?.map(e => e.title.toLowerCase()) || []
  
  return articles.filter(article => {
    // URL 중복 체크
    if (existingUrls.has(article.url)) return false
    
    // 제목 유사도 체크 (80% 이상 유사하면 중복으로 간주)
    const articleTitle = article.title.toLowerCase()
    const isDuplicateTitle = existingTitles.some(existingTitle => {
      const similarity = calculateSimilarity(articleTitle, existingTitle)
      return similarity > 0.8
    })
    
    return !isDuplicateTitle
  })
}

// 문자열 유사도 계산
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/))
  const words2 = new Set(str2.split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const allArticles = []
    
    // 1. RSS 피드 수집
    console.log('Collecting RSS feeds...')
    const rssArticles = await collectRSSFeeds()
    allArticles.push(...rssArticles)
    console.log(`Collected ${rssArticles.length} RSS articles`)
    
    // 2. 시간대별 동적 검색 쿼리
    const hour = new Date().getHours()
    const day = new Date().getDay()
    let searchQueries = []
    
    // 주말 경기 시간 (유럽 경기가 많은 시간)
    if ((day === 0 || day === 6) && (hour >= 20 || hour <= 6)) {
      searchQueries = [
        'live score goal',
        'red card penalty',
        'match result final',
        'injury substitution'
      ]
    }
    // 이적 활발 시간 (유럽 오후)
    else if (hour >= 18 && hour <= 23) {
      searchQueries = [
        'transfer done deal',
        'medical completed',
        'agreement reached',
        'signing confirmed'
      ]
    }
    // 일반 시간
    else {
      searchQueries = [
        'transfer news',
        'injury update',
        'team news lineup',
        'preview prediction'
      ]
    }
    
    // 카테고리별 검색 실행
    for (const query of searchQueries) {
      const searchResults = await searchBraveForNews(query, 15)
      allArticles.push(...searchResults)
    }
    
    // 3. 리그별 검색 (각 리그 상위팀 위주)
    const leagueQueries = [
      'Premier League news',
      'La Liga news', 
      'Serie A news',
      'Bundesliga news',
      'Champions League news',
      'Europa League news'
    ]
    
    for (const query of leagueQueries) {
      const leagueNews = await searchBraveForNews(query, 10)
      allArticles.push(...leagueNews)
    }
    
    // 4. 주요 팀별 집중 검색 (빅6 + 빅3)
    const topPriorityTeams = [
      // 프리미어리그 빅6
      'Manchester United', 'Liverpool', 'Manchester City', 
      'Chelsea', 'Arsenal', 'Tottenham',
      // 라리가 빅3
      'Real Madrid', 'Barcelona', 'Atletico Madrid',
      // 기타 빅클럽
      'Bayern Munich', 'PSG', 'Juventus', 'Inter Milan'
    ]
    
    // 팀별로 최신 뉴스 검색
    for (const team of topPriorityTeams) {
      const teamNews = await searchBraveForNews(`"${team}" latest`, 5)
      allArticles.push(...teamNews)
    }
    
    console.log(`Total articles before deduplication: ${allArticles.length}`)
    
    // 4. 중복 제거
    const uniqueArticles = await deduplicateArticles(allArticles)
    console.log(`Unique articles after deduplication: ${uniqueArticles.length}`)
    
    // 5. 중요도 점수 계산 및 속보 표시
    const scoredArticles = uniqueArticles.map(article => ({
      ...article,
      importance_score: calculateImportanceScore(article),
      is_breaking: isBreakingNews(article),
      tags: []
    }))
    
    // 6. 중요도 순으로 정렬
    scoredArticles.sort((a, b) => b.importance_score - a.importance_score)
    
    // 7. DB에 저장 (상위 100개만)
    const articlesToSave = scoredArticles.slice(0, 100)
    
    if (articlesToSave.length > 0) {
      const { error } = await supabase
        .from('news_articles')
        .insert(articlesToSave)
      
      if (error) {
        console.error('Error saving articles:', error)
      } else {
        console.log(`Saved ${articlesToSave.length} articles to database`)
      }
    }
    
    // 8. API 사용량 추적
    const totalApiCalls = searchQueries.length + leagueQueries.length + topPriorityTeams.length
    await supabase.rpc('track_api_usage', {
      api_name: 'brave_search',
      count: totalApiCalls
    })
    
    console.log(`API calls made: ${totalApiCalls}`)
    
    return new Response(JSON.stringify({
      success: true,
      collected: allArticles.length,
      unique: uniqueArticles.length,
      saved: articlesToSave.length,
      breaking: articlesToSave.filter(a => a.is_breaking).length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
    
  } catch (error) {
    console.error('Error in news collector:', error)
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