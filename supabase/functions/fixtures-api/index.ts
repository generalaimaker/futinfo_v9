import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API 설정
const API_KEY = Deno.env.get('FOOTBALL_API_KEY')
const API_HOST = 'api-football-v1.p.rapidapi.com'

// API 키 확인
if (!API_KEY) {
  console.error('FOOTBALL_API_KEY is not set in environment variables')
}

// 캐시 TTL 설정 (초)
const CACHE_TTL = {
  DEFAULT: 3600,      // 1시간
  FUTURE: 1800,       // 30분 (미래 날짜)
  PAST: 10800,        // 3시간 (과거 날짜)
  EMPTY: 300,         // 5분 (빈 데이터 - 10분에서 단축)
  ERROR: 300,         // 5분 (오류)
  LIVE: 60,           // 1분 (라이브 경기)
  TODAY: 300          // 5분 (오늘 경기)
}

// Rate limiting - Rapid API 제한을 고려
const MAX_REQUESTS_PER_MINUTE = 200 // 분당 200개로 제한 (보수적)
const requestTimestamps: number[] = []

function checkRateLimit(): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  
  // 1분 이상 된 요청 제거
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift()
  }
  
  // 현재 분당 요청 수 확인
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    console.log(`Rate limit reached: ${requestTimestamps.length} requests in the last minute`)
    return false
  }
  
  // 새 요청 기록
  requestTimestamps.push(now)
  return true
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Supabase 클라이언트
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
          details: 'FOOTBALL_API_KEY environment variable is not set'
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
          error: 'Rate limit exceeded. Please try again later.',
          response: [] 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams)
    const forceRefresh = params.forceRefresh === 'true'
    
    // 캐시 키 생성
    const cacheKey = `fixtures_${params.date || 'all'}_${params.league || 'all'}_${params.season || 'current'}_${params.team || 'all'}`
    
    // 캐시 확인 (강제 새로고침이 아닌 경우)
    if (!forceRefresh) {
      const { data: cachedData } = await supabaseClient
        .from('api_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single()

      if (cachedData && new Date(cachedData.expires_at) > new Date()) {
        console.log(`Cache hit for ${cacheKey}`)
        return new Response(
          JSON.stringify(cachedData.response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    // API URL 구성
    let apiUrl = `https://${API_HOST}/v3/fixtures`
    const queryParams = new URLSearchParams()
    
    // 파라미터 처리
    if (params.date) queryParams.append('date', params.date)
    if (params.league) queryParams.append('league', params.league)
    if (params.season) queryParams.append('season', params.season)
    if (params.team) queryParams.append('team', params.team)
    if (params.last) queryParams.append('last', params.last)
    if (params.next) queryParams.append('next', params.next)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)
    if (params.round) queryParams.append('round', params.round)
    if (params.status) queryParams.append('status', params.status)
    
    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`
    }
    
    console.log(`API Request: ${apiUrl}`)
    
    // API 호출
    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      },
    })
    
    // Rate limit 헤더 로깅
    const dailyLimit = response.headers.get('x-ratelimit-requests-limit') || 'unknown'
    const dailyRemaining = response.headers.get('x-ratelimit-requests-remaining') || 'unknown'
    const minuteLimit = response.headers.get('x-ratelimit-limit') || 'unknown'
    const minuteRemaining = response.headers.get('x-ratelimit-remaining') || 'unknown'
    
    console.log(`Rate Limits - Daily: ${dailyRemaining}/${dailyLimit}, Minute: ${minuteRemaining}/${minuteLimit}`)
    
    // 경고 로그
    if (parseInt(dailyRemaining) < 1000 || parseInt(minuteRemaining) < 10) {
      console.warn(`⚠️ Low API quota - Daily: ${dailyRemaining}, Minute: ${minuteRemaining}`)
    }
    
    const data = await response.json()
    
    // API 에러 처리
    if (!response.ok) {
      console.error(`API Error: ${response.status}`, data)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'API rate limit exceeded',
            response: [] 
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          error: data.message || 'API request failed',
          response: [] 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // TTL 계산
    let ttl = CACHE_TTL.DEFAULT
    if (params.date) {
      const requestDate = new Date(params.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (requestDate > today) {
        ttl = CACHE_TTL.FUTURE
      } else if (requestDate < today) {
        ttl = CACHE_TTL.PAST
      }
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
        endpoint: '/fixtures',
        parameters: params,
        response: data,
        has_data: hasData,
        is_error: false,
        ttl: ttl,
        expires_at: expiresAt.toISOString()
      })
    
    console.log(`Cache saved for ${cacheKey}, TTL: ${ttl}s`)
    
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