import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'

// Supabase 클라이언트
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// RSS 소스 정의
const RSS_SOURCES = [
  // Official
  { url: 'https://www.premierleague.com/rss/news', name: 'Premier League', tier: 'official', trustScore: 100 },
  { url: 'https://www.uefa.com/rssfeed/news/rss.xml', name: 'UEFA', tier: 'official', trustScore: 100 },
  { url: 'https://www.fifa.com/rss/index.xml', name: 'FIFA', tier: 'official', trustScore: 100 },
  
  // Tier 1 Media
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', name: 'BBC Sport', tier: 'tier1', trustScore: 95 },
  { url: 'https://www.skysports.com/rss/12040', name: 'Sky Sports', tier: 'tier1', trustScore: 95 },
  { url: 'https://www.theguardian.com/football/rss', name: 'The Guardian', tier: 'tier1', trustScore: 95 },
  { url: 'https://theathletic.com/soccer/rss/', name: 'The Athletic', tier: 'tier1', trustScore: 95 },
  
  // Transfer specialists
  { url: 'https://www.transfermarkt.com/rss/news', name: 'Transfermarkt', tier: 'transfer', trustScore: 85 },
  { url: 'https://www.goal.com/feeds/en/news', name: 'Goal.com', tier: 'transfer', trustScore: 75 },
  
  // Add more sources as needed...
]

interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: Date
  guid: string
}

interface NewsArticle {
  id: string
  title: string
  summary: string
  source_name: string
  source_tier: string
  trust_score: number
  url: string
  published_at: string
  category: string
  cluster_id?: string
  duplicate_count: number
  duplicate_sources: string[]
}

serve(async (req) => {
  try {
    // CORS 헤더
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers })
    }

    // 1. 모든 RSS 소스에서 뉴스 수집
    console.log('📡 Fetching news from all RSS sources...')
    const allNews = await fetchAllNews()
    console.log(`✅ Fetched ${allNews.length} articles from ${RSS_SOURCES.length} sources`)

    // 2. 중복 제거 및 클러스터링
    console.log('🔍 Deduplicating news...')
    const deduplicatedNews = await deduplicateAndCluster(allNews)
    console.log(`✅ Reduced to ${deduplicatedNews.length} unique articles`)

    // 3. 카테고리 분류
    const categorizedNews = categorizeNews(deduplicatedNews)

    // 4. 데이터베이스에 저장
    console.log('💾 Saving to database...')
    await saveToDatabase(categorizedNews)

    // 5. 실시간 업데이트 브로드캐스트
    await broadcastUpdate(categorizedNews.length)

    return new Response(
      JSON.stringify({
        success: true,
        articlesProcessed: allNews.length,
        uniqueArticles: categorizedNews.length,
        timestamp: new Date().toISOString()
      }),
      { headers }
    )
  } catch (error) {
    console.error('Error in news aggregator:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// RSS 뉴스 수집
async function fetchAllNews(): Promise<NewsArticle[]> {
  const allNews: NewsArticle[] = []
  
  // 병렬로 모든 소스에서 가져오기
  const promises = RSS_SOURCES.map(source => fetchFromSource(source))
  const results = await Promise.allSettled(promises)
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allNews.push(...result.value)
    } else {
      console.error(`Failed to fetch from ${RSS_SOURCES[index].name}:`, result.reason)
    }
  })
  
  return allNews
}

// 개별 RSS 소스에서 뉴스 가져오기
async function fetchFromSource(source: typeof RSS_SOURCES[0]): Promise<NewsArticle[]> {
  const response = await fetch(source.url)
  const text = await response.text()
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  
  const items = doc.querySelectorAll('item')
  const articles: NewsArticle[] = []
  
  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent || ''
    const description = item.querySelector('description')?.textContent || ''
    const link = item.querySelector('link')?.textContent || ''
    const pubDateStr = item.querySelector('pubDate')?.textContent || ''
    const guid = item.querySelector('guid')?.textContent || link
    
    if (title && link) {
      articles.push({
        id: generateHash(guid),
        title: cleanText(title),
        summary: cleanText(description).substring(0, 500),
        source_name: source.name,
        source_tier: source.tier,
        trust_score: source.trustScore,
        url: link,
        published_at: parseDate(pubDateStr).toISOString(),
        category: 'general', // 나중에 분류
        duplicate_count: 0,
        duplicate_sources: []
      })
    }
  })
  
  return articles
}

// 중복 제거 및 클러스터링
async function deduplicateAndCluster(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const clusters: Map<string, NewsArticle[]> = new Map()
  
  // 유사도 기반 클러스터링
  articles.forEach(article => {
    let addedToCluster = false
    
    // 기존 클러스터와 비교
    for (const [clusterId, clusterArticles] of clusters.entries()) {
      const representative = clusterArticles[0]
      if (isSimilar(article, representative)) {
        clusterArticles.push(article)
        addedToCluster = true
        break
      }
    }
    
    // 새 클러스터 생성
    if (!addedToCluster) {
      const clusterId = generateHash(article.title + Date.now())
      clusters.set(clusterId, [article])
    }
  })
  
  // 각 클러스터에서 최고의 기사 선택
  const deduplicatedNews: NewsArticle[] = []
  
  clusters.forEach((clusterArticles, clusterId) => {
    const bestArticle = selectBestArticle(clusterArticles)
    const duplicateSources = clusterArticles
      .filter(a => a.id !== bestArticle.id)
      .map(a => `${a.source_name} [${a.source_tier}]`)
      .sort((a, b) => {
        // 신뢰도 순으로 정렬
        const scoreA = getSourceScore(a)
        const scoreB = getSourceScore(b)
        return scoreB - scoreA
      })
    
    deduplicatedNews.push({
      ...bestArticle,
      cluster_id: clusterId,
      duplicate_count: clusterArticles.length - 1,
      duplicate_sources: duplicateSources
    })
  })
  
  return deduplicatedNews
}

// 유사도 검사
function isSimilar(article1: NewsArticle, article2: NewsArticle): boolean {
  // 시간 차이 확인 (4시간 이내)
  const timeDiff = Math.abs(
    new Date(article1.published_at).getTime() - 
    new Date(article2.published_at).getTime()
  )
  if (timeDiff > 4 * 60 * 60 * 1000) return false
  
  // 제목 유사도
  const similarity = calculateSimilarity(article1.title, article2.title)
  if (similarity > 0.85) return true
  
  // 키워드 매칭
  const keywords1 = extractKeywords(article1.title + ' ' + article1.summary)
  const keywords2 = extractKeywords(article2.title + ' ' + article2.summary)
  const commonKeywords = keywords1.filter(k => keywords2.includes(k))
  
  const keywordOverlap = commonKeywords.length / Math.min(keywords1.length, keywords2.length)
  return keywordOverlap > 0.7 && similarity > 0.5
}

// 최적 기사 선택
function selectBestArticle(articles: NewsArticle[]): NewsArticle {
  return articles.reduce((best, current) => {
    const bestScore = calculateArticleScore(best)
    const currentScore = calculateArticleScore(current)
    return currentScore > bestScore ? current : best
  })
}

// 기사 점수 계산
function calculateArticleScore(article: NewsArticle): number {
  let score = 0
  
  // 소스 신뢰도 (40점)
  score += (article.trust_score / 100) * 40
  
  // 콘텐츠 품질 (30점)
  const summaryLength = article.summary.length
  if (summaryLength > 100 && summaryLength < 500) {
    score += 20
  } else if (summaryLength > 50) {
    score += 10
  }
  
  // 최신성 (20점)
  const hoursAgo = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60)
  score += Math.max(0, 20 - hoursAgo * 2)
  
  // 제목 품질 (10점)
  if (article.title.length > 30 && article.title.length < 120) {
    score += 5
  }
  if (/\d+/.test(article.title)) { // 숫자 포함
    score += 5
  }
  
  return score
}

// 카테고리 분류
function categorizeNews(articles: NewsArticle[]): NewsArticle[] {
  return articles.map(article => {
    const text = `${article.title} ${article.summary}`.toLowerCase()
    
    let category = 'general'
    
    if (text.includes('transfer') || text.includes('signing') || 
        text.includes('deal') || text.includes('medical')) {
      category = 'transfer'
    } else if (text.includes('injury') || text.includes('injured') || 
               text.includes('return') || text.includes('fitness')) {
      category = 'injury'
    } else if (text.includes('match') || text.includes('vs') || 
               text.includes('goal') || text.includes('score')) {
      category = 'match'
    }
    
    return { ...article, category }
  })
}

// 데이터베이스 저장
async function saveToDatabase(articles: NewsArticle[]) {
  // 기존 뉴스 확인
  const existingUrls = await supabase
    .from('news_articles')
    .select('url')
    .in('url', articles.map(a => a.url))
  
  const existingUrlSet = new Set(existingUrls.data?.map(item => item.url) || [])
  
  // 새 뉴스만 필터링
  const newArticles = articles.filter(article => !existingUrlSet.has(article.url))
  
  if (newArticles.length > 0) {
    // 배치 삽입
    const { error } = await supabase
      .from('news_articles')
      .insert(newArticles)
    
    if (error) throw error
    
    console.log(`✅ Saved ${newArticles.length} new articles`)
  }
}

// 실시간 업데이트
async function broadcastUpdate(newArticleCount: number) {
  if (newArticleCount > 0) {
    await supabase
      .from('news_updates')
      .insert({
        type: 'new_articles',
        count: newArticleCount,
        timestamp: new Date().toISOString()
      })
  }
}

// 유틸리티 함수들
function generateHash(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function parseDate(dateStr: string): Date {
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? new Date() : date
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'])
  
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

function getSourceScore(sourceName: string): number {
  if (sourceName.includes('[official]')) return 100
  if (sourceName.includes('[tier1]')) return 95
  if (sourceName.includes('[transfer]')) return 85
  return 50
}