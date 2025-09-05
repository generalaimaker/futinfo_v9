import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 주요 RSS 피드들
const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport' },
  { url: 'https://www.skysports.com/rss/12040', source: 'Sky Sports' },
  { url: 'https://www.theguardian.com/football/rss', source: 'The Guardian' },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const allArticles = []
    
    for (const feed of RSS_FEEDS) {
      console.log(`Fetching ${feed.source}...`)
      
      try {
        const response = await fetch(feed.url)
        const xmlText = await response.text()
        
        // 간단한 정규식으로 RSS 파싱
        const itemRegex = /<item>([\s\S]*?)<\/item>/g
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/
        const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/
        const linkRegex = /<link>(.*?)<\/link>/
        const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/
        
        let match
        while ((match = itemRegex.exec(xmlText)) !== null) {
          const item = match[1]
          
          const title = item.match(titleRegex)?.[1] || ''
          const description = item.match(descRegex)?.[1] || ''
          const url = item.match(linkRegex)?.[1] || ''
          const pubDate = item.match(pubDateRegex)?.[1] || ''
          
          // Daniel Levy 관련 뉴스 필터링
          if (title && url && (
            title.toLowerCase().includes('levy') ||
            title.toLowerCase().includes('tottenham') ||
            title.toLowerCase().includes('spurs') ||
            description.toLowerCase().includes('levy') ||
            description.toLowerCase().includes('chairman')
          )) {
            const article = {
              title: title.substring(0, 500),
              description: description.substring(0, 2000),
              url: url,
              source: feed.source,
              source_tier: 1,
              trust_score: 95,
              published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              category: 'general',
              is_breaking: title.toLowerCase().includes('breaking'),
              is_featured: true,
              importance_score: 90,
              tags: ['premier-league', 'tottenham'],
              collected_at: new Date().toISOString()
            }
            
            allArticles.push(article)
            console.log(`Found relevant article: ${title}`)
          }
        }
      } catch (error) {
        console.error(`Error fetching ${feed.source}:`, error)
      }
    }
    
    // 데이터베이스에 저장
    let savedCount = 0
    for (const article of allArticles) {
      const { error } = await supabase
        .from('news_articles')
        .upsert(article, {
          onConflict: 'url',
          ignoreDuplicates: true
        })
      
      if (!error) {
        savedCount++
      } else {
        console.error('Save error:', error)
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        found: allArticles.length,
        saved: savedCount,
        articles: allArticles.map(a => ({ title: a.title, source: a.source }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})