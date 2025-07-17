import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const API_KEY = Deno.env.get('FOOTBALL_API_KEY')
  const API_HOST = 'api-football-v1.p.rapidapi.com'

  try {
    // API 키 확인
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          response: [],
          message: 'FOOTBALL_API_KEY environment variable is not set'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Request body 파싱
    const body = await req.json()
    const { endpoint, params } = body
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // API 엔드포인트 매핑
    let apiPath = ''
    switch (endpoint) {
      case 'fixtures':
        apiPath = '/fixtures'
        break
      case 'leagues':
        apiPath = '/leagues'
        break
      case 'standings':
        apiPath = '/standings'
        break
      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // API URL 구성
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const apiUrl = `https://${API_HOST}/v3${apiPath}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    console.log(`[No-Auth API] Request: ${apiUrl}`)

    // API 호출 with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      },
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId))

    const data = await response.json()

    if (!response.ok) {
      console.error(`[No-Auth API] Error: ${response.status}`, data)
      return new Response(
        JSON.stringify({ 
          error: data.message || 'API request failed',
          response: [],
          status: response.status
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[No-Auth Edge Function] Error:', error)
    
    // Handle timeout error
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          error: 'Request timeout - API took too long to respond',
          response: [],
          timeout: true
        }),
        { 
          status: 504, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Handle other errors
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        response: [],
        errorType: error.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}, { port: 54321 })