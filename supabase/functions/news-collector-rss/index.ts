import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 업데이트된 RSS 피드 목록 (2025년 1월 작동 확인)
const RSS_FEEDS = [
  // 영국 미디어 - 확인된 작동 피드
  { url: 'https://www.theguardian.com/football/rss', source: 'The Guardian', tier: 1 },
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport', tier: 1 },
  
  // 국제 미디어 - 확인된 작동 피드
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN', tier: 1 },
  { url: 'https://www.90min.com/posts.rss', source: '90min', tier: 2 },
  { url: 'https://talksport.com/football/feed/', source: 'talkSPORT', tier: 2 },
  
  // 추가 작동 피드들
  { url: 'https://www.fourfourtwo.com/rss', source: 'FourFourTwo', tier: 2 },
  { url: 'https://www.football.london/rss.xml', source: 'Football London', tier: 2 },
  { url: 'https://theathletic.com/soccer/rss/', source: 'The Athletic', tier: 1 },
  { url: 'https://www.independent.co.uk/sport/football/rss', source: 'The Independent', tier: 1 },
  { url: 'https://feeds.skysports.com/feeds/rss/football/0,20514,11661,00.xml', source: 'Sky Sports', tier: 1 },
  { url: 'https://www.mirror.co.uk/sport/football/rss.xml', source: 'Mirror Football', tier: 2 },
  { url: 'https://www.telegraph.co.uk/football/rss.xml', source: 'Telegraph Football', tier: 1 },
  
  // 전문 축구 사이트
  { url: 'https://www.whoscored.com/rss/feed', source: 'WhoScored', tier: 1 },
  { url: 'https://www.soccernews.com/feed', source: 'Soccer News', tier: 2 },
  { url: 'https://www.footballtransfers.com/en/feed', source: 'Football Transfers', tier: 2 },
]

// RSS 파싱 함수
async function parseRSSFeed(feedUrl: string, source: string, tier: number) {
  try {
    console.log(`Fetching RSS feed from ${source}: ${feedUrl}`)
    
    // 타임아웃 설정 (10초)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error(`Failed to fetch ${source}: ${response.status}`)
      return []
    }
    
    const text = await response.text()
    
    // XML이 아닌 경우 스킵
    if (!text.includes('<?xml') && !text.includes('<rss') && !text.includes('<feed')) {
      console.error(`Invalid RSS/XML format from ${source}`)
      return []
    }
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    
    if (!doc) {
      console.error(`Failed to parse XML from ${source}`)
      return []
    }
    
    // RSS 2.0과 Atom 피드 모두 지원
    const items = doc.querySelectorAll('item, entry')
    const articles = []
    
    for (const item of items) {
      // RSS와 Atom 호환성을 위한 선택자
      const title = item.querySelector('title')?.textContent || ''
      const description = item.querySelector('description, summary, content')?.textContent || ''
      const link = item.querySelector('link')?.textContent || 
                   item.querySelector('link')?.getAttribute('href') || ''
      const pubDate = item.querySelector('pubDate, published, updated')?.textContent || ''
      const guid = item.querySelector('guid, id')?.textContent || link
      
      // 빈 제목이나 링크는 스킵
      if (!title || !link) continue
      
      // 이미지 추출 (다양한 RSS 형식 지원)
      let imageUrl = ''
      const enclosure = item.querySelector('enclosure[type^="image"]')
      const mediaContent = item.querySelector('media\\:content, content')
      const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail')
      const image = item.querySelector('image')
      
      if (enclosure) {
        imageUrl = enclosure.getAttribute('url') || ''
      } else if (mediaContent) {
        imageUrl = mediaContent.getAttribute('url') || ''
      } else if (mediaThumbnail) {
        imageUrl = mediaThumbnail.getAttribute('url') || ''
      } else if (image) {
        imageUrl = image.querySelector('url')?.textContent || ''
      } else {
        // description에서 이미지 URL 추출 시도
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/)
        if (imgMatch) {
          imageUrl = imgMatch[1]
        }
      }
      
      // 카테고리 추출
      const categoryElements = item.querySelectorAll('category')
      const tags = Array.from(categoryElements).map(cat => cat.textContent || '').filter(Boolean)
      
      // 카테고리 분류 (개선된 키워드)
      let category = 'general'
      const titleLower = title.toLowerCase()
      const descLower = description.toLowerCase()
      const combinedText = titleLower + ' ' + descLower
      
      if (combinedText.includes('transfer') || combinedText.includes('signs') || 
          combinedText.includes('moves to') || combinedText.includes('joins') ||
          combinedText.includes('loan') || combinedText.includes('deal')) {
        category = 'transfer'
      } else if (combinedText.includes('injur') || combinedText.includes('sidelined') ||
                 combinedText.includes('out for') || combinedText.includes('recovery')) {
        category = 'injury'
      } else if (combinedText.includes('vs') || combinedText.includes('match') || 
                 combinedText.includes('win') || combinedText.includes('draw') || 
                 combinedText.includes('defeat') || combinedText.includes('beat') ||
                 combinedText.includes('score') || combinedText.includes('goal')) {
        category = 'match'
      } else if (combinedText.includes('premier league') || combinedText.includes('champions league') ||
                 combinedText.includes('europa league') || combinedText.includes('world cup')) {
        category = 'general'
      }
      
      // 날짜 파싱 개선 - 미래 날짜 방지
      let publishedDate
      try {
        if (pubDate) {
          const parsedDate = new Date(pubDate)
          const now = new Date()
          
          // 미래 날짜인 경우 현재 시간으로 교정
          if (parsedDate > now) {
            console.warn(`Future date detected from ${source}: ${pubDate} - using current time`)
            publishedDate = now.toISOString()
          } else {
            publishedDate = parsedDate.toISOString()
          }
        } else {
          publishedDate = new Date().toISOString()
        }
      } catch (e) {
        console.error(`Date parsing error from ${source}: ${pubDate}`)
        publishedDate = new Date().toISOString()
      }
      
      articles.push({
        title: cleanText(title),
        description: cleanText(description),
        url: link,
        source: source,
        source_tier: tier,
        guid: guid,
        category: category,
        tags: tags,
        image_url: imageUrl,
        published_at: publishedDate,
        trust_score: calculateTrustScore(source, tier)
      })
    }
    
    console.log(`✅ Parsed ${articles.length} articles from ${source}`)
    return articles
    
  } catch (error) {
    console.error(`❌ Error parsing RSS feed from ${source}:`, error.message || error)
    return []
  }
}

// HTML 태그 제거 및 텍스트 정리
function cleanText(text: string): string {
  // CDATA 제거
  text = text.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
  // HTML 태그 제거
  text = text.replace(/<[^>]*>/g, '')
  // HTML 엔티티 디코딩
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
  // 여러 공백을 하나로
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

// 신뢰도 점수 계산
function calculateTrustScore(source: string, tier: number): number {
  const baseTrustScores: Record<number, number> = {
    1: 90,  // Tier 1: 매우 신뢰할 수 있는 소스
    2: 75,  // Tier 2: 신뢰할 수 있는 소스
    3: 60   // Tier 3: 일반 소스
  }
  
  let score = baseTrustScores[tier] || 50
  
  // 특정 소스에 대한 보정
  const trustedSources: Record<string, number> = {
    'BBC Sport': 95,
    'Sky Sports': 92,
    'The Guardian': 90,
    'ESPN': 88,
    'Transfermarkt': 90,
    'Manchester United': 85,
    'Arsenal': 85,
    'Chelsea FC': 85,
    'Manchester City': 85,
    'Tottenham': 85,
  }
  
  if (trustedSources[source]) {
    score = trustedSources[source]
  }
  
  return score  // 0-100 정수로 반환
}

// 중복 체크 및 DB 저장
async function saveArticles(articles: any[]) {
  let savedCount = 0
  let duplicateCount = 0
  let errorCount = 0
  
  for (const article of articles) {
    try {
      // URL 또는 GUID로 중복 체크
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .or(`url.eq.${article.url},guid.eq.${article.guid}`)
        .limit(1)
        .single()
      
      if (existing) {
        duplicateCount++
        continue
      }
      
      // 새 기사 저장
      const { error } = await supabase
        .from('news_articles')
        .insert({
          ...article,
          id: crypto.randomUUID(),
          view_count: 0,
          is_featured: false,
          is_breaking: false,
          priority: 0,
          translations: {},
          team_ids: [],
          player_ids: [],
          league_ids: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Error saving article:', error.message)
        errorCount++
      } else {
        savedCount++
      }
      
    } catch (error) {
      // 중복이 아닌 다른 에러
      if (!error.message?.includes('duplicate')) {
        console.error('Error processing article:', error.message)
        errorCount++
      } else {
        duplicateCount++
      }
    }
  }
  
  return { savedCount, duplicateCount, errorCount }
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting RSS news collection...')
    console.log(`📡 Processing ${RSS_FEEDS.length} RSS feeds`)
    
    // 1. 먼저 6일 이상 된 뉴스 자동 삭제 (featured 제외)
    console.log('🗑️ Cleaning up old news articles...')
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
    
    let deletedCount = 0
    const { error: deleteError, count } = await supabase
      .from('news_articles')
      .delete()
      .lt('published_at', sixDaysAgo.toISOString())
      .eq('is_featured', false)
    
    if (deleteError) {
      console.error('Error deleting old news:', deleteError)
    } else {
      deletedCount = count || 0
      console.log(`✅ Deleted ${deletedCount} old news articles`)
    }
    
    // 2. RSS 피드 수집
    // 모든 RSS 피드 병렬 처리 (Promise.allSettled로 에러 처리 개선)
    const feedPromises = RSS_FEEDS.map(feed => 
      parseRSSFeed(feed.url, feed.source, feed.tier)
    )
    
    const feedResults = await Promise.allSettled(feedPromises)
    
    // 성공한 피드만 필터링
    const successfulFeeds = feedResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as any).value)
    
    const failedFeeds = feedResults.filter(result => result.status === 'rejected').length
    
    const allArticles = successfulFeeds.flat()
    
    console.log(`📊 Collection summary:`)
    console.log(`   - Successful feeds: ${successfulFeeds.length}`)
    console.log(`   - Failed feeds: ${failedFeeds}`)
    console.log(`   - Total articles collected: ${allArticles.length}`)
    
    if (allArticles.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No articles collected from any feed',
        stats: {
          feeds_total: RSS_FEEDS.length,
          feeds_successful: successfulFeeds.length,
          feeds_failed: failedFeeds,
          collected: 0,
          saved: 0,
          duplicates: 0,
          errors: 0
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
    
    // DB에 저장
    console.log('💾 Saving articles to database...')
    const { savedCount, duplicateCount, errorCount } = await saveArticles(allArticles)
    
    // 응답
    const response = {
      success: true,
      message: `Collected ${allArticles.length} articles, saved ${savedCount} new articles, deleted ${deletedCount || 0} old articles`,
      stats: {
        feeds_total: RSS_FEEDS.length,
        feeds_successful: successfulFeeds.length,
        feeds_failed: failedFeeds,
        collected: allArticles.length,
        saved: savedCount,
        duplicates: duplicateCount,
        errors: errorCount,
        deleted_old: deletedCount || 0
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ RSS collection completed:', response.stats)
    
    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('❌ Error in news-collector-rss:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})