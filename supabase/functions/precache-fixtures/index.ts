import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API 설정
const API_KEY = Deno.env.get('FOOTBALL_API_KEY') ?? ''
const API_HOST = Deno.env.get('FOOTBALL_API_HOST') ?? 'api-football-v1.p.rapidapi.com'

// 핵심 리그 정의 (우선순위 순)
const CORE_LEAGUES = [
  { id: 39, name: 'Premier League', priority: 1 },
  { id: 140, name: 'La Liga', priority: 1 },
  { id: 135, name: 'Serie A', priority: 1 },
  { id: 78, name: 'Bundesliga', priority: 1 },
  { id: 61, name: 'Ligue 1', priority: 1 },
  { id: 292, name: 'K League 1', priority: 2 },
  { id: 293, name: 'K League 2', priority: 3 },
  { id: 2, name: 'Champions League', priority: 2 },
  { id: 3, name: 'Europa League', priority: 2 },
]

// 캐시 TTL 설정 (초)
const CACHE_TTL = {
  LIVE: 60,           // 1분 - 라이브 경기
  TODAY: 1800,        // 30분 - 오늘 경기
  TOMORROW: 7200,     // 2시간 - 내일 경기
  FUTURE: 21600,      // 6시간 - 2-7일 후 경기
  PAST: 86400,        // 24시간 - 지난 경기
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { days_ahead = 7, force_refresh = false } = await req.json()
    
    console.log(`🎯 사전 캐싱 시작: 향후 ${days_ahead}일`)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dates = []
    for (let i = 0; i < days_ahead; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      cached: []
    }
    
    // Rate limit 관리
    const BATCH_SIZE = 5
    const DELAY_MS = 1000
    
    for (const dateStr of dates) {
      console.log(`\n📅 ${dateStr} 처리 중...`)
      
      // 리그를 배치로 처리
      for (let i = 0; i < CORE_LEAGUES.length; i += BATCH_SIZE) {
        const batch = CORE_LEAGUES.slice(i, i + BATCH_SIZE)
        
        await Promise.all(batch.map(async (league) => {
          const cacheKey = `fixtures_${dateStr}_${league.id}_current`
          
          try {
            // 캐시 확인
            if (!force_refresh) {
              const { data: existing } = await supabaseClient
                .from('api_cache')
                .select('expires_at')
                .eq('cache_key', cacheKey)
                .single()
              
              if (existing && new Date(existing.expires_at) > new Date()) {
                console.log(`  ⏭️  ${league.name}: 캐시 유효`)
                results.skipped++
                return
              }
            }
            
            // API 호출
            const season = getCurrentSeason(league.id)
            const apiUrl = `https://${API_HOST}/v3/fixtures?date=${dateStr}&league=${league.id}&season=${season}`
            
            const response = await fetch(apiUrl, {
              headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST,
              }
            })
            
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`)
            }
            
            const data = await response.json()
            
            // TTL 계산
            const ttl = calculateTTL(dateStr)
            const expiresAt = new Date(Date.now() + ttl * 1000)
            
            // 캐시 저장
            await supabaseClient
              .from('api_cache')
              .upsert({
                cache_key: cacheKey,
                endpoint: '/fixtures',
                parameters: {
                  date: dateStr,
                  league: league.id,
                  season: season
                },
                response: data,
                has_data: data.response && data.response.length > 0,
                is_error: false,
                ttl: ttl,
                expires_at: expiresAt.toISOString(),
                cached_at: new Date().toISOString()
              })
            
            console.log(`  ✅ ${league.name}: ${data.response?.length || 0}개 경기 캐싱`)
            results.success++
            results.cached.push({
              date: dateStr,
              league: league.name,
              count: data.response?.length || 0
            })
            
          } catch (error) {
            console.error(`  ❌ ${league.name}: ${error.message}`)
            results.failed++
          }
        }))
        
        // Rate limit 방지
        if (i + BATCH_SIZE < CORE_LEAGUES.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS))
        }
      }
    }
    
    // 통계 로그
    console.log('\n📊 캐싱 완료 통계:')
    console.log(`  성공: ${results.success}`)
    console.log(`  실패: ${results.failed}`)
    console.log(`  스킵: ${results.skipped}`)
    console.log(`  총 경기 수: ${results.cached.reduce((sum, r) => sum + r.count, 0)}`)
    
    // 캐싱 메타데이터 저장
    await supabaseClient
      .from('cache_metadata')
      .insert({
        type: 'precache_fixtures',
        executed_at: new Date().toISOString(),
        stats: results,
        days_ahead: days_ahead
      })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '사전 캐싱 완료',
        stats: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ 사전 캐싱 실패:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// 현재 시즌 계산
function getCurrentSeason(leagueId: number): number {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  // 여름 리그 (MLS, K리그 등)
  if ([253, 292, 293].includes(leagueId)) {
    return year
  }
  
  // 유럽 리그 (8월부터 새 시즌)
  if (month >= 8) {
    return year
  } else {
    return year - 1
  }
}

// TTL 계산
function calculateTTL(dateStr: string): number {
  const targetDate = new Date(dateStr)
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return CACHE_TTL.PAST
  } else if (diffDays === 0) {
    return CACHE_TTL.TODAY
  } else if (diffDays === 1) {
    return CACHE_TTL.TOMORROW
  } else {
    return CACHE_TTL.FUTURE
  }
}