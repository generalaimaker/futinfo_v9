import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface NewsSource {
  id: string
  name: string
  url: string
  feed_type: string
  category: string
  tier: number
  trust_score: number
}

interface NewsArticle {
  title: string
  description: string
  url: string
  source: string
  source_tier: number
  trust_score: number
  category: string
  tags: string[]
  team_ids: number[]
  player_ids: number[]
  league_ids: number[]
  image_url?: string
  published_at: string
}

// XML 파싱 함수
function parseRSSFeed(xmlText: string, source: NewsSource): Partial<NewsArticle>[] {
  const articles: Partial<NewsArticle>[] = []
  
  // item 태그 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  const items = xmlText.match(itemRegex) || []
  
  for (const item of items.slice(0, 20)) { // 소스당 최대 20개
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
      const published_at = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString()
      
      // 이미지 URL 추출
      const imageMatch = item.match(/<media:content[^>]*url="([^"]+)"/) || 
                        item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/)
      const image_url = imageMatch ? imageMatch[1] : undefined
      
      if (title && url) {
        articles.push({
          title,
          description,
          url,
          source: source.name,
          source_tier: source.tier,
          trust_score: source.trust_score,
          category: source.category,
          image_url,
          published_at,
          tags: extractTags(title + ' ' + description),
          team_ids: extractTeamIds(title + ' ' + description),
          player_ids: [],
          league_ids: extractLeagueIds(title + ' ' + description)
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

// 태그 추출
function extractTags(text: string): string[] {
  const tags = new Set<string>()
  const lowerText = text.toLowerCase()
  
  // 리그 태그
  if (lowerText.includes('premier league')) tags.add('Premier League')
  if (lowerText.includes('la liga')) tags.add('La Liga')
  if (lowerText.includes('serie a')) tags.add('Serie A')
  if (lowerText.includes('bundesliga')) tags.add('Bundesliga')
  if (lowerText.includes('ligue 1')) tags.add('Ligue 1')
  if (lowerText.includes('champions league')) tags.add('Champions League')
  if (lowerText.includes('europa league')) tags.add('Europa League')
  
  // 카테고리 태그
  if (lowerText.includes('transfer')) tags.add('Transfer')
  if (lowerText.includes('injury') || lowerText.includes('injured')) tags.add('Injury')
  if (lowerText.includes('match') || lowerText.includes('vs')) tags.add('Match')
  if (lowerText.includes('goal')) tags.add('Goal')
  
  return Array.from(tags)
}

// 팀 ID 추출 (주요 팀만)
function extractTeamIds(text: string): number[] {
  const teamIds = new Set<number>()
  const lowerText = text.toLowerCase()
  
  // Premier League
  if (lowerText.includes('manchester united') || lowerText.includes('man utd')) teamIds.add(33)
  if (lowerText.includes('liverpool')) teamIds.add(40)
  if (lowerText.includes('manchester city') || lowerText.includes('man city')) teamIds.add(50)
  if (lowerText.includes('chelsea')) teamIds.add(49)
  if (lowerText.includes('arsenal')) teamIds.add(42)
  if (lowerText.includes('tottenham') || lowerText.includes('spurs')) teamIds.add(47)
  
  // La Liga
  if (lowerText.includes('real madrid')) teamIds.add(541)
  if (lowerText.includes('barcelona') || lowerText.includes('barca')) teamIds.add(529)
  if (lowerText.includes('atletico madrid')) teamIds.add(530)
  
  // Serie A
  if (lowerText.includes('juventus')) teamIds.add(496)
  if (lowerText.includes('inter milan') || lowerText.includes('inter')) teamIds.add(505)
  if (lowerText.includes('ac milan') || lowerText.includes('milan')) teamIds.add(489)
  
  // Bundesliga
  if (lowerText.includes('bayern munich') || lowerText.includes('bayern')) teamIds.add(157)
  if (lowerText.includes('borussia dortmund') || lowerText.includes('dortmund')) teamIds.add(165)
  
  // Ligue 1
  if (lowerText.includes('psg') || lowerText.includes('paris saint')) teamIds.add(85)
  
  return Array.from(teamIds)
}

// 리그 ID 추출
function extractLeagueIds(text: string): number[] {
  const leagueIds = new Set<number>()
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('premier league')) leagueIds.add(39)
  if (lowerText.includes('la liga')) leagueIds.add(140)
  if (lowerText.includes('serie a')) leagueIds.add(135)
  if (lowerText.includes('bundesliga')) leagueIds.add(78)
  if (lowerText.includes('ligue 1')) leagueIds.add(61)
  if (lowerText.includes('champions league')) leagueIds.add(2)
  if (lowerText.includes('europa league')) leagueIds.add(3)
  
  return Array.from(leagueIds)
}

// 중복 제거
async function deduplicateArticles(articles: Partial<NewsArticle>[]): Promise<Partial<NewsArticle>[]> {
  const uniqueUrls = new Set<string>()
  const uniqueArticles: Partial<NewsArticle>[] = []
  
  // 기존 URL 체크
  const existingUrls = await supabase
    .from('news_articles')
    .select('url')
    .in('url', articles.map(a => a.url!))
  
  const existingUrlSet = new Set(existingUrls.data?.map(item => item.url) || [])
  
  for (const article of articles) {
    if (!existingUrlSet.has(article.url!) && !uniqueUrls.has(article.url!)) {
      uniqueUrls.add(article.url!)
      uniqueArticles.push(article)
    }
  }
  
  return uniqueArticles
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting news collection...')
    
    // 1. 활성 소스 가져오기
    const { data: sources, error: sourcesError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true })
    
    if (sourcesError) throw sourcesError
    if (!sources || sources.length === 0) {
      throw new Error('No active news sources found')
    }
    
    console.log(`Found ${sources.length} active sources`)
    
    // 2. 모든 RSS 피드 수집 (병렬 처리)
    const allArticles: Partial<NewsArticle>[] = []
    
    const fetchPromises = sources.map(async (source) => {
      try {
        console.log(`Fetching from ${source.name}...`)
        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FutInfoBot/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        })
        
        if (response.ok) {
          const xmlText = await response.text()
          const articles = parseRSSFeed(xmlText, source)
          console.log(`Fetched ${articles.length} articles from ${source.name}`)
          
          // 소스 마지막 수집 시간 업데이트
          await supabase
            .from('news_sources')
            .update({ last_fetched_at: new Date().toISOString() })
            .eq('id', source.id)
          
          return articles
        } else {
          console.error(`Failed to fetch ${source.name}: ${response.status}`)
          return []
        }
      } catch (error) {
        console.error(`Error fetching ${source.name}:`, error)
        return []
      }
    })
    
    const results = await Promise.all(fetchPromises)
    results.forEach(articles => allArticles.push(...articles))
    
    console.log(`Total articles collected: ${allArticles.length}`)
    
    // 3. 중복 제거
    const uniqueArticles = await deduplicateArticles(allArticles)
    console.log(`Unique articles after deduplication: ${uniqueArticles.length}`)
    
    // 4. DB에 저장
    if (uniqueArticles.length > 0) {
      const { data: insertedArticles, error: insertError } = await supabase
        .from('news_articles')
        .insert(uniqueArticles)
        .select('id, title, url')
      
      if (insertError) {
        console.error('Error inserting articles:', insertError)
        // URL 중복 에러는 무시 (이미 존재하는 기사)
        if (!insertError.message.includes('duplicate key')) {
          throw insertError
        }
      }
      
      console.log(`Successfully saved ${insertedArticles?.length || 0} new articles`)
      
      // 5. 번역 큐에 추가 (별도 함수 호출)
      if (insertedArticles && insertedArticles.length > 0) {
        // 번역 함수 트리거
        const translateResponse = await supabase.functions.invoke('news-translator', {
          body: { 
            articleIds: insertedArticles.map(a => a.id),
            priority: 'high'
          }
        })
        
        if (translateResponse.error) {
          console.error('Error triggering translation:', translateResponse.error)
        } else {
          console.log('Translation triggered successfully')
        }
      }
    }
    
    // 6. 응답
    const response = {
      success: true,
      collected: allArticles.length,
      unique: uniqueArticles.length,
      saved: uniqueArticles.length,
      sources: sources.length,
      timestamp: new Date().toISOString()
    }
    
    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('Error in news-collector:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})