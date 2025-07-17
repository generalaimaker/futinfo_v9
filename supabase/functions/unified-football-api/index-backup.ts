import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// API 설정
const API_KEY = Deno.env.get('FOOTBALL_API_KEY')
const API_HOST = 'api-football-v1.p.rapidapi.com'

// 캐시 TTL 설정 (초)
const CACHE_TTL = {
  DEFAULT: 3600,      // 1시간
  FUTURE: 1800,       // 30분 (미래 날짜)
  PAST: 10800,        // 3시간 (과거 날짜)
  EMPTY: 300,         // 5분 (빈 데이터)
  ERROR: 300,         // 5분 (오류)
  LIVE: 60,           // 1분 (라이브 경기)
}

// Rate limiting
const MAX_REQUESTS_PER_MINUTE = 200
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
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // API 키 확인
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          response: [],
          message: 'FOOTBALL_API_KEY environment variable is not set. Please set it in Supabase Dashboard > Edge Functions > Settings'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Rate limiting 체크
    if (!checkRateLimit()) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: [] 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Request body 파싱
    const { endpoint, params } = await req.json()
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 캐시 키 생성
    const cacheKey = `${endpoint}_${JSON.stringify(params || {})}`
    
    // 캐시 확인
    if (!params?.forceRefresh) {
      const { data: cachedData } = await supabaseClient
        .from('api_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single()

      if (cachedData && new Date(cachedData.expires_at) > new Date()) {
        console.log(`Cache hit: ${cacheKey}`)
        return new Response(
          JSON.stringify(cachedData.response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
      case 'players/topscorers':
        apiPath = '/players/topscorers'
        break
      case 'players/topassists':
        apiPath = '/players/topassists'
        break
      case 'transfers':
        apiPath = '/transfers'
        break
      case 'fixtures/lineups':
        apiPath = '/fixtures/lineups'
        break
      case 'fixtures/statistics':
        apiPath = '/fixtures/statistics'
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
        if (value !== undefined && value !== null && key !== 'forceRefresh') {
          queryParams.append(key, String(value))
        }
      })
    }

    const apiUrl = `https://${API_HOST}/v3${apiPath}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    console.log(`API Request: ${apiUrl}`)

    // API 호출
    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      },
    })

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

    // TTL 계산
    let ttl = CACHE_TTL.DEFAULT
    if (params?.date) {
      const requestDate = new Date(params.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (requestDate > today) {
        ttl = CACHE_TTL.FUTURE
      } else if (requestDate < today) {
        ttl = CACHE_TTL.PAST
      }
    }
    
    if (params?.live) {
      ttl = CACHE_TTL.LIVE
    }
    
    // 빈 응답 체크
    const hasData = data.response && data.response.length > 0
    if (!hasData) {
      ttl = CACHE_TTL.EMPTY
    }

    // 캐시 저장
    const expiresAt = new Date(Date.now() + ttl * 1000)
    
    await supabaseClient
      .from('api_cache')
      .upsert({
        cache_key: cacheKey,
        endpoint: endpoint,
        parameters: params || {},
        response: data,
        has_data: hasData,
        is_error: false,
        ttl: ttl,
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        response: [] 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})