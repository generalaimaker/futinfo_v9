import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API 설정
const API_KEY = Deno.env.get('FOOTBALL_API_KEY') ?? ''
const API_HOST = Deno.env.get('FOOTBALL_API_HOST') ?? 'api-football-v1.p.rapidapi.com'

// 캐시 TTL 설정 (초) - 최적화된 값
const CACHE_TTL = {
  LIVE: 60,           // 1분 (라이브 경기)
  TODAY: 1800,        // 30분 (오늘 경기)
  TOMORROW: 7200,     // 2시간 (내일 경기)  
  FUTURE: 21600,      // 6시간 (2-7일 후) - 크게 증가
  PAST: 86400,        // 24시간 (과거 경기) - 크게 증가
  EMPTY: 3600,        // 1시간 (빈 데이터) - 증가
  ERROR: 300          // 5분 (오류)
}

// Rate limiting - Rapid API 제한을 고려하여 더 보수적으로 설정
const MAX_REQUESTS_PER_MINUTE = 200 // 안전 마진을 더 크게 확보
const requestCounts = new Map<string, number>()

// Rate limit 체크 함수 개선
let globalRequestCount = 0
let lastResetTime = Date.now()

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const endpoint = url.pathname.split('/').pop()
  
  // Supabase 클라이언트
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Rate limiting 체크
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ errors: ['Rate limit exceeded'], response: [] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const params = Object.fromEntries(url.searchParams)
    const forceRefresh = params.forceRefresh === 'true'
    
    let apiEndpoint = ''
    let cacheKey = ''
    
    // 엔드포인트 매핑
    switch (endpoint) {
      case 'fixtures':
        apiEndpoint = '/fixtures'
        cacheKey = `fixtures_${params.date}_${params.league || 'all'}_${params.season || 'current'}`
        break
      case 'standings':
        apiEndpoint = '/standings'
        cacheKey = `standings_${params.league}_${params.season}`
        break
      case 'statistics':
        apiEndpoint = '/fixtures/statistics'
        cacheKey = `statistics_${params.fixture}`
        break
      case 'events':
        apiEndpoint = '/fixtures/events'
        cacheKey = `events_${params.fixture}`
        break
      case 'h2h':
        apiEndpoint = '/fixtures/headtohead'
        cacheKey = `h2h_${params.h2h}`
        break
      case 'injuries':
        apiEndpoint = '/injuries'
        cacheKey = `injuries_${params.team || 'all'}_${params.season || 'current'}`
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown endpoint' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // 캐시 우선 전략 - 항상 캐시 먼저 확인
    const { data: cachedData } = await supabaseClient
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .single()

    // 캐시가 있고 유효한 경우 즉시 반환
    if (cachedData && new Date(cachedData.expires_at) > new Date() && !forceRefresh) {
      console.log(`✅ Cache hit for ${cacheKey}`)
      
      // 캐시 히트 통계 기록
      await supabaseClient
        .from('cache_stats')
        .insert({
          cache_key: cacheKey,
          hit_type: 'hit',
          timestamp: new Date().toISOString()
        })
      
      return new Response(
        JSON.stringify(cachedData.response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // 캐시가 만료되었지만 데이터가 있는 경우, 일단 반환하고 백그라운드 갱신
    if (cachedData && !forceRefresh) {
      console.log(`🔄 Stale cache, returning old data and refreshing`)
      
      // 기존 데이터 즉시 반환
      const response = new Response(
        JSON.stringify(cachedData.response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
      
      // 백그라운드에서 갱신 (비동기)
      refreshCacheInBackground(cacheKey, apiEndpoint, params, supabaseClient)
      
      return response
    }

    // API 호출
    console.log(`API call for ${cacheKey}`)
    const apiUrl = `https://${API_HOST}/v3${apiEndpoint}?${url.searchParams}`
    
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      }
    })

    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.status}`)
    }

    const data = await apiResponse.json()
    
    // 스마트 TTL 계산
    let ttl = calculateSmartTTL(params.date, data)
    
    // 빈 응답 체크
    const hasData = data.response && data.response.length > 0
    if (!hasData) {
      ttl = CACHE_TTL.EMPTY
    }
    
    // 라이브 경기가 있는지 확인
    const hasLiveMatch = data.response?.some((match: any) => 
      ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(match.fixture?.status?.short)
    )
    if (hasLiveMatch) {
      ttl = CACHE_TTL.LIVE
    }

    // 캐시 저장
    const expiresAt = new Date(Date.now() + ttl * 1000)
    
    await supabaseClient
      .from('api_cache')
      .upsert({
        cache_key: cacheKey,
        endpoint: apiEndpoint,
        parameters: params,
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
    console.error('Error:', error)
    
    // 오류 캐싱
    const errorResponse = {
      errors: [error.message],
      response: [],
      meta: { isError: true, message: error.message }
    }
    
    const expiresAt = new Date(Date.now() + CACHE_TTL.ERROR * 1000)
    
    await supabaseClient
      .from('api_cache')
      .upsert({
        cache_key: `error_${Date.now()}`,
        endpoint: url.pathname,
        parameters: Object.fromEntries(url.searchParams),
        response: errorResponse,
        has_data: false,
        is_error: true,
        ttl: CACHE_TTL.ERROR,
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// 스마트 TTL 계산 함수
function calculateSmartTTL(dateStr: string | undefined, data: any): number {
  if (!dateStr) return CACHE_TTL.TODAY
  
  const requestDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  requestDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.floor((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return CACHE_TTL.PAST  // 과거 경기 - 24시간
  } else if (diffDays === 0) {
    return CACHE_TTL.TODAY  // 오늘 경기 - 30분
  } else if (diffDays === 1) {
    return CACHE_TTL.TOMORROW  // 내일 경기 - 2시간
  } else {
    return CACHE_TTL.FUTURE  // 미래 경기 - 6시간
  }
}

// 백그라운드 캐시 갱신 함수
async function refreshCacheInBackground(
  cacheKey: string, 
  apiEndpoint: string, 
  params: any,
  supabaseClient: any
) {
  try {
    const apiUrl = `https://${API_HOST}/v3${apiEndpoint}?${new URLSearchParams(params)}`
    
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      }
    })
    
    if (apiResponse.ok) {
      const data = await apiResponse.json()
      const ttl = calculateSmartTTL(params.date, data)
      const expiresAt = new Date(Date.now() + ttl * 1000)
      
      await supabaseClient
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          endpoint: apiEndpoint,
          parameters: params,
          response: data,
          has_data: data.response && data.response.length > 0,
          is_error: false,
          ttl: ttl,
          expires_at: expiresAt.toISOString(),
          cached_at: new Date().toISOString()
        })
      
      console.log(`✅ Background cache refresh completed for ${cacheKey}`)
    }
  } catch (error) {
    console.error(`❌ Background refresh failed for ${cacheKey}:`, error)
  }
}

// Rate limiting 함수
function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const minute = Math.floor(now / 60000)
  const key = `${clientId}_${minute}`
  
  const count = requestCounts.get(key) || 0
  if (count >= MAX_REQUESTS_PER_MINUTE) {
    return false
  }
  
  requestCounts.set(key, count + 1)
  
  // 오래된 엔트리 정리
  for (const [k, _] of requestCounts) {
    const [_, m] = k.split('_')
    if (parseInt(m) < minute - 1) {
      requestCounts.delete(k)
    }
  }
  
  return true
}