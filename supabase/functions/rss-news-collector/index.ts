import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { parseStringPromise } from 'https://esm.sh/xml2js@0.6.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS 피드 목록
const RSS_FEEDS = [
  { name: 'The Guardian', url: 'https://www.theguardian.com/football/rss' },
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
  { name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040' },
  { name: 'ESPN FC', url: 'https://www.espn.com/espn/rss/soccer/news' },
  { name: 'Goal.com', url: 'https://www.goal.com/feeds/en/news' },
]

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 스케줄러 호출인지 확인
    const authHeader = req.headers.get('Authorization')
    const isScheduled = authHeader?.includes('scheduler') || req.headers.get('x-scheduled') === 'true'

    // 스케줄 호출이 아니면 캐시된 데이터만 반환
    if (!isScheduled) {
      const { data: cachedNews, error } = await supabase
        .from('cached_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify({ news: cachedNews, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // RSS 피드 수집 (스케줄 실행시)
    console.log('🔄 RSS 피드 수집 시작...')
    const allNews: any[] = []

    for (const feed of RSS_FEEDS) {
      try {
        const response = await fetch(feed.url)
        const xmlText = await response.text()
        
        // XML 파싱
        const result = await parseStringPromise(xmlText, {
          explicitArray: false,
          ignoreAttrs: true
        })

        const items = result.rss?.channel?.item || []
        const newsItems = Array.isArray(items) ? items : [items]

        for (const item of newsItems.slice(0, 10)) { // 각 피드에서 최대 10개
          // 축구 관련 뉴스만 필터링
          if (isFootballRelated(item.title + ' ' + (item.description || ''))) {
            allNews.push({
              title: cleanText(item.title),
              summary: cleanText(item.description || '').substring(0, 500),
              url: item.link,
              source: feed.name,
              published_at: new Date(item.pubDate || Date.now()).toISOString(),
              image_url: extractImageUrl(item),
            })
          }
        }

        console.log(`✅ ${feed.name}: ${newsItems.length}개 수집`)
      } catch (error) {
        console.error(`❌ ${feed.name} 수집 실패:`, error)
      }
    }

    // 중복 제거
    const uniqueNews = removeDuplicates(allNews)
    console.log(`📊 총 ${uniqueNews.length}개의 고유한 뉴스 수집`)

    // 기존 뉴스 삭제 (24시간 이상 된 것)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('cached_news')
      .delete()
      .lt('published_at', yesterday)

    // 새 뉴스 저장
    if (uniqueNews.length > 0) {
      const { error: insertError } = await supabase
        .from('cached_news')
        .upsert(uniqueNews, { 
          onConflict: 'url',
          ignoreDuplicates: true 
        })

      if (insertError) {
        console.error('뉴스 저장 실패:', insertError)
        throw insertError
      }
    }

    // 최신 뉴스 반환
    const { data: latestNews, error: fetchError } = await supabase
      .from('cached_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50)

    if (fetchError) throw fetchError

    return new Response(
      JSON.stringify({ 
        news: latestNews, 
        collected: uniqueNews.length,
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('오류 발생:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// 축구 관련 뉴스 필터링
function isFootballRelated(text: string): boolean {
  const keywords = [
    'football', 'soccer', 'premier league', 'champions league',
    'transfer', 'goal', 'match', 'player', 'manager', 'club',
    'uefa', 'fifa', 'world cup', 'euro', 'la liga', 'serie a',
    'bundesliga', 'ligue 1', 'chelsea', 'manchester', 'liverpool',
    'arsenal', 'real madrid', 'barcelona', 'bayern', 'psg'
  ]

  const lowerText = text.toLowerCase()
  return keywords.some(keyword => lowerText.includes(keyword))
}

// 텍스트 정리
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // HTML 태그 제거
    .replace(/&[^;]+;/g, ' ') // HTML 엔티티 제거
    .replace(/\s+/g, ' ') // 여러 공백을 하나로
    .trim()
}

// 이미지 URL 추출
function extractImageUrl(item: any): string | null {
  // enclosure 태그에서 이미지 찾기
  if (item.enclosure?.$ && item.enclosure.$.type?.includes('image')) {
    return item.enclosure.$.url
  }
  
  // media:content에서 찾기
  if (item['media:content']?.$ && item['media:content'].$.url) {
    return item['media:content'].$.url
  }
  
  // media:thumbnail에서 찾기
  if (item['media:thumbnail']?.$ && item['media:thumbnail'].$.url) {
    return item['media:thumbnail'].$.url
  }
  
  return null
}

// 중복 제거
function removeDuplicates(news: any[]): any[] {
  const seen = new Set<string>()
  return news.filter(item => {
    // URL 기반 중복 체크
    if (seen.has(item.url)) return false
    
    // 유사 제목 체크
    const titleKey = item.title.toLowerCase().replace(/\s+/g, '').substring(0, 50)
    if (seen.has(titleKey)) return false
    
    seen.add(item.url)
    seen.add(titleKey)
    return true
  })
}