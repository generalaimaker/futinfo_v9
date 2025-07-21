import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface RSSSource {
  name: string
  url: string
  category: 'general' | 'transfer' | 'injury'
  tier: number
  trustScore: number
}

// RSS 소스 정의 (iOS와 동일)
const RSS_SOURCES: RSSSource[] = [
  // 공식 소스
  { name: 'Premier League Official', url: 'https://www.premierleague.com/rss/news', category: 'general', tier: 1, trustScore: 100 },
  { name: 'UEFA Official', url: 'https://www.uefa.com/rssfeed/news/rss.xml', category: 'general', tier: 1, trustScore: 100 },
  
  // Tier 1 언론사
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', category: 'general', tier: 1, trustScore: 95 },
  { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', category: 'general', tier: 1, trustScore: 90 },
  { name: 'The Guardian', url: 'https://www.theguardian.com/football/rss', category: 'general', tier: 1, trustScore: 95 },
  
  // 이적 전문 소스
  { name: 'Sky Sports Transfer', url: 'https://www.skysports.com/rss/11671', category: 'transfer', tier: 1, trustScore: 90 },
  { name: 'Goal.com', url: 'https://www.goal.com/feeds/en/news', category: 'transfer', tier: 2, trustScore: 75 },
  { name: 'ESPN FC', url: 'https://www.espn.com/espn/rss/soccer/news', category: 'general', tier: 2, trustScore: 75 },
  
  // 부상 뉴스는 주로 공식 소스에서
  { name: 'PhysioRoom', url: 'https://www.physioroom.com/rss/rss.xml', category: 'injury', tier: 2, trustScore: 80 },
]

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  category: string
  trustScore: number
  imageUrl?: string
}

// XML 파싱 함수
function parseRSSFeed(xmlText: string, source: RSSSource): NewsArticle[] {
  const articles: NewsArticle[] = []
  
  // item 태그 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  const items = xmlText.match(itemRegex) || []
  
  for (const item of items.slice(0, 20)) { // 최대 20개 기사
    try {
      // 제목 추출
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)
      const title = titleMatch ? cleanText(titleMatch[1]) : ''
      
      // 설명 추출
      const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
      const description = descMatch ? cleanText(descMatch[1]) : ''
      
      // URL 추출
      const linkMatch = item.match(/<link>(.*?)<\/link>/)
      const url = linkMatch ? linkMatch[1].trim() : ''
      
      // 날짜 추출
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)
      const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString()
      
      // 이미지 URL 추출 (있는 경우)
      const imageMatch = item.match(/<media:content[^>]*url="([^"]+)"/) || 
                        item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/)
      const imageUrl = imageMatch ? imageMatch[1] : undefined
      
      if (title && url) {
        articles.push({
          id: crypto.randomUUID(),
          title,
          description,
          url,
          source: `${source.name} (Tier ${source.tier})`,
          publishedAt,
          category: source.category,
          trustScore: source.trustScore,
          imageUrl
        })
      }
    } catch (error) {
      console.error('Error parsing item:', error)
    }
  }
  
  return articles
}

// HTML 태그 제거 및 텍스트 정리
function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}

// 이적 뉴스 신뢰도 평가
function evaluateTransferNews(article: NewsArticle): NewsArticle {
  const text = `${article.title} ${article.description}`.toLowerCase()
  
  // 공식 발표 키워드
  const officialKeywords = ['official', 'confirmed', 'announcement', 'unveiled', 'signs', 'completed', 'done deal']
  const reliableKeywords = ['agreement reached', 'terms agreed', 'medical scheduled', 'advanced talks']
  const unreliableKeywords = ['rumour', 'speculation', 'could', 'might', 'interested', 'monitoring']
  
  let trustBonus = 0
  
  if (officialKeywords.some(keyword => text.includes(keyword))) {
    trustBonus = 20
  } else if (reliableKeywords.some(keyword => text.includes(keyword))) {
    trustBonus = 10
  } else if (unreliableKeywords.some(keyword => text.includes(keyword))) {
    trustBonus = -20
  }
  
  // 신뢰할 수 있는 기자 체크
  const trustedJournalists = ['fabrizio romano', 'david ornstein', 'simon stone']
  if (trustedJournalists.some(journalist => text.includes(journalist))) {
    trustBonus += 15
  }
  
  return {
    ...article,
    trustScore: Math.max(0, Math.min(100, article.trustScore + trustBonus))
  }
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || 'all'
    const onlyTier1 = url.searchParams.get('onlyTier1') === 'true'
    const minTrustScore = parseInt(url.searchParams.get('minTrustScore') || '0')
    
    // 카테고리별 RSS 소스 필터링
    let sources = RSS_SOURCES
    if (category !== 'all') {
      sources = sources.filter(source => source.category === category)
    }
    
    // Tier 1만 필터링
    if (onlyTier1) {
      sources = sources.filter(source => source.tier === 1)
    }
    
    // 모든 RSS 피드 가져오기
    const allArticles: NewsArticle[] = []
    
    for (const source of sources) {
      try {
        console.log(`Fetching from ${source.name}...`)
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FootballNewsBot/1.0)'
          }
        })
        
        if (response.ok) {
          const xmlText = await response.text()
          const articles = parseRSSFeed(xmlText, source)
          
          // 이적 뉴스는 추가 평가
          const evaluatedArticles = source.category === 'transfer' 
            ? articles.map(evaluateTransferNews)
            : articles
            
          allArticles.push(...evaluatedArticles)
        }
      } catch (error) {
        console.error(`Error fetching ${source.name}:`, error)
      }
    }
    
    // 신뢰도 필터링
    const filteredArticles = allArticles.filter(article => article.trustScore >= minTrustScore)
    
    // 중복 제거 (제목 기반)
    const uniqueArticles = filteredArticles.reduce((acc, article) => {
      const isDuplicate = acc.some(a => 
        a.title.toLowerCase() === article.title.toLowerCase() ||
        (a.title.length > 20 && article.title.length > 20 && 
         a.title.substring(0, 30).toLowerCase() === article.title.substring(0, 30).toLowerCase())
      )
      if (!isDuplicate) {
        acc.push(article)
      }
      return acc
    }, [] as NewsArticle[])
    
    // 날짜순 정렬 (최신순)
    uniqueArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    
    // 최대 50개까지만 반환
    const finalArticles = uniqueArticles.slice(0, 50)
    
    return new Response(JSON.stringify({
      articles: finalArticles,
      count: finalArticles.length,
      sources: sources.length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5분 캐시
      }
    })
    
  } catch (error) {
    console.error('Error in football-news function:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch news',
      details: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})