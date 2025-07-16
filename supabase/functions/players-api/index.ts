import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API 설정
const API_KEY = Deno.env.get('FOOTBALL_API_KEY') ?? ''
const API_HOST = 'api-football-v1.p.rapidapi.com'

// Rate limiting
const MAX_REQUESTS_PER_MINUTE = 400
const requestTimestamps: number[] = []

function checkRateLimit(): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift()
  }
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false
  }
  
  requestTimestamps.push(now)
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!checkRateLimit()) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', response: [] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const endpoint = pathParts[pathParts.length - 1]
    const params = Object.fromEntries(url.searchParams)
    
    let apiUrl = `https://${API_HOST}/v3`
    
    // 엔드포인트별 처리
    switch (endpoint) {
      case 'player':
        apiUrl += `/players?id=${params.id}&season=${params.season}`
        break
      case 'statistics':
        apiUrl += `/players?id=${params.id}&season=${params.season}`
        break
      case 'transfers':
        apiUrl += `/transfers?player=${params.player}`
        break
      case 'trophies':
        apiUrl += `/trophies?player=${params.player}`
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown endpoint' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
    
    console.log(`API Request: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.message || 'API request failed', response: [] }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, response: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})