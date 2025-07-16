import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { parseStringPromise } from 'https://esm.sh/xml2js@0.6.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS Feeds
const RSS_FEEDS = {
  'bbc': 'https://feeds.bbci.co.uk/sport/football/rss.xml',
  'guardian': 'https://www.theguardian.com/football/rss',
  'espn': 'https://www.espn.com/espn/rss/soccer/news',
  'skysports': 'https://www.skysports.com/rss/12040'
}

async function fetchRSSFeed(feedUrl: string, sourceName: string) {
  try {
    const response = await fetch(feedUrl)
    const xmlText = await response.text()
    
    const result = await parseStringPromise(xmlText, {
      explicitArray: false,
      ignoreAttrs: true
    })
    
    const items = result.rss?.channel?.item || []
    const newsItems = Array.isArray(items) ? items : [items]
    
    return newsItems.slice(0, 10).map(item => ({
      source: { name: sourceName },
      title: item.title || '',
      description: item.description || '',
      url: item.link || '',
      publishedAt: item.pubDate || new Date().toISOString()
    }))
  } catch (error) {
    console.error(`Error fetching ${sourceName}:`, error)
    return []
  }
}

// Mock Brave search results
const mockBraveResults = {
  results: [
    {
      title: "Liverpool signs new midfielder from Serie A",
      url: "https://www.football-news.com/liverpool-transfer",
      description: "Liverpool have completed the signing of a talented midfielder from Serie A.",
      age: "2 hours ago",
      source: "Football News"
    }
  ]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { source } = await req.json()
    
    let responseData;
    
    switch (source) {
      case 'newsapi':
        // Fetch real RSS feeds
        const [bbc, guardian, espn, sky] = await Promise.all([
          fetchRSSFeed(RSS_FEEDS.bbc, 'BBC Sport'),
          fetchRSSFeed(RSS_FEEDS.guardian, 'The Guardian'),
          fetchRSSFeed(RSS_FEEDS.espn, 'ESPN'),
          fetchRSSFeed(RSS_FEEDS.skysports, 'Sky Sports')
        ])
        
        responseData = {
          articles: [...bbc, ...guardian, ...espn, ...sky]
        }
        break
        
      case 'brave':
        // Return mock Brave search data for now
        responseData = mockBraveResults
        break
        
      default:
        // Default to fetching RSS feeds
        const defaultFeeds = await Promise.all([
          fetchRSSFeed(RSS_FEEDS.bbc, 'BBC Sport'),
          fetchRSSFeed(RSS_FEEDS.guardian, 'The Guardian')
        ])
        
        responseData = {
          articles: defaultFeeds.flat()
        }
    }
    
    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Error in news-proxy:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})