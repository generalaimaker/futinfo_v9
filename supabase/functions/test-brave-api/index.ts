import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 환경 변수 확인
    const apiKey = Deno.env.get('BRAVE_SEARCH_API_KEY')
    console.log('BRAVE_SEARCH_API_KEY exists:', !!apiKey)
    console.log('API Key first 10 chars:', apiKey?.substring(0, 10))
    
    // 직접 Brave API 호출
    const query = 'Daniel Levy Tottenham'
    const url = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=5&freshness=pd7d`
    
    console.log('Fetching URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey || 'BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT'
      }
    })
    
    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    console.log('Response body:', responseText.substring(0, 500))
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      data = { error: 'Failed to parse response', raw: responseText }
    }
    
    // Web search도 시도
    const webUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`
    const webResponse = await fetch(webUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey || 'BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT'
      }
    })
    
    const webData = await webResponse.json()
    console.log('Web search status:', webResponse.status)
    console.log('Web search results:', webData?.web?.results?.length || 0)
    
    return new Response(
      JSON.stringify({
        newsApiResponse: {
          status: response.status,
          resultCount: data?.results?.length || 0,
          error: data?.error,
          firstResult: data?.results?.[0]
        },
        webApiResponse: {
          status: webResponse.status,
          resultCount: webData?.web?.results?.length || 0,
          firstResult: webData?.web?.results?.[0]
        },
        apiKeyInfo: {
          exists: !!apiKey,
          prefix: apiKey?.substring(0, 10)
        }
      }, null, 2),
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