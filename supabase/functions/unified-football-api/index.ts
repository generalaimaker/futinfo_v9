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

  console.log('[Edge Function] Request method:', req.method)
  const headers = Object.fromEntries(req.headers.entries())
  console.log('[Edge Function] Request headers:', headers)
  console.log('[Edge Function] Has Authorization:', !!headers.authorization)
  console.log('[Edge Function] Has apikey:', !!headers.apikey)

  const API_KEY = Deno.env.get('FOOTBALL_API_KEY')
  const API_HOST = 'api-football-v1.p.rapidapi.com'

  try {
    // API 키 확인
    if (!API_KEY) {
      console.error('[Edge Function] API key not found')
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
    console.log('[Edge Function] Request body:', body)
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
      case 'fixtures/events':
        apiPath = '/fixtures/events'
        break
      case 'fixtures/statistics':
        apiPath = '/fixtures/statistics'
        break
      case 'fixtures/h2h':
        apiPath = '/fixtures/h2h'
        break
      case 'leagues':
        apiPath = '/leagues'
        break
      case 'standings':
        apiPath = '/standings'
        break
      case 'teams':
        apiPath = '/teams'
        break
      case 'teams/statistics':
        apiPath = '/teams/statistics'
        break
      case 'players':
        apiPath = '/players'
        break
      case 'players/squads':
        apiPath = '/players/squads'
        break
      case 'transfers':
        apiPath = '/transfers'
        break
      case 'injuries':
        apiPath = '/injuries'
        break
      case 'predictions':
        apiPath = '/predictions'
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
    console.log(`API Request: ${apiUrl}`)

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
      console.error(`API Error: ${response.status}`, data)
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
    console.error('Edge Function Error:', error)
    
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
        errorType: error.name,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})