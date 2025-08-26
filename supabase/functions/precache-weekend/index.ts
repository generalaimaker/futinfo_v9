import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API 설정
const API_KEY = Deno.env.get('FOOTBALL_API_KEY') ?? ''
const API_HOST = Deno.env.get('FOOTBALL_API_HOST') ?? 'api-football-v1.p.rapidapi.com'

// 주요 리그 ID
const MAJOR_LEAGUES = [
  39,  // 프리미어리그
  140, // 라리가
  135, // 세리에 A
  78,  // 분데스리가
  61,  // 리그 1
  2,   // 챔피언스리그
  3    // 유로파리그
]

// 캐시 TTL (주말 경기는 더 길게)
const WEEKEND_CACHE_TTL = 7200 // 2시간

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
    console.log('🏆 주말 경기 사전 캐싱 시작')
    
    // 현재 날짜 기준으로 이번 주 금,토,일 계산
    const today = new Date()
    const dayOfWeek = today.getDay()
    
    // 이번 주 금요일 계산
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7
    const friday = new Date(today)
    friday.setDate(today.getDate() + (daysUntilFriday === 0 && today.getDay() !== 5 ? 7 : daysUntilFriday))
    
    // 금,토,일 날짜 생성
    const weekendDates = []
    for (let i = 0; i < 3; i++) {
      const date = new Date(friday)
      date.setDate(friday.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      weekendDates.push(dateStr)
    }
    
    console.log('📅 캐싱할 날짜:', weekendDates)
    
    const cacheResults = []
    
    // 각 날짜별로 처리
    for (const dateStr of weekendDates) {
      console.log(`\n📆 ${dateStr} 처리 중...`)
      
      // 각 리그별로 경기 데이터 가져오기
      for (const leagueId of MAJOR_LEAGUES) {
        const cacheKey = `fixtures_${dateStr}_${leagueId}_current`
        
        try {
          // 기존 캐시 확인
          const { data: existingCache } = await supabaseClient
            .from('api_cache')
            .select('*')
            .eq('cache_key', cacheKey)
            .single()
          
          // 캐시가 유효하면 건너뛰기
          if (existingCache && new Date(existingCache.expires_at) > new Date()) {
            console.log(`  ✅ 리그 ${leagueId}: 캐시 유효`)
            continue
          }
          
          // API 호출
          const season = getCurrentSeason(leagueId, new Date(dateStr))
          const apiUrl = `https://${API_HOST}/v3/fixtures?date=${dateStr}&league=${leagueId}&season=${season}`
          
          console.log(`  🔄 리그 ${leagueId}: API 호출`)
          
          const apiResponse = await fetch(apiUrl, {
            headers: {
              'x-rapidapi-key': API_KEY,
              'x-rapidapi-host': API_HOST,
            }
          })
          
          if (!apiResponse.ok) {
            console.log(`  ❌ 리그 ${leagueId}: API 오류 ${apiResponse.status}`)
            continue
          }
          
          const data = await apiResponse.json()
          
          // 캐시 저장 (주말은 더 긴 TTL)
          const expiresAt = new Date(Date.now() + WEEKEND_CACHE_TTL * 1000)
          
          await supabaseClient
            .from('api_cache')
            .upsert({
              cache_key: cacheKey,
              endpoint: '/fixtures',
              parameters: {
                date: dateStr,
                league: leagueId,
                season: season
              },
              response: data,
              has_data: data.response && data.response.length > 0,
              is_error: false,
              ttl: WEEKEND_CACHE_TTL,
              expires_at: expiresAt.toISOString()
            })
          
          console.log(`  ✅ 리그 ${leagueId}: ${data.response?.length || 0}개 경기 캐싱됨`)
          
          cacheResults.push({
            date: dateStr,
            league: leagueId,
            count: data.response?.length || 0
          })
          
          // Rate limit 방지를 위한 지연
          await new Promise(resolve => setTimeout(resolve, 200))
          
        } catch (error) {
          console.log(`  ❌ 리그 ${leagueId}: 오류 - ${error.message}`)
        }
      }
    }
    
    // 요약 통계
    const totalCached = cacheResults.reduce((sum, r) => sum + r.count, 0)
    console.log(`\n✅ 주말 캐싱 완료: 총 ${totalCached}개 경기`)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '주말 경기 사전 캐싱 완료',
        dates: weekendDates,
        totalFixtures: totalCached,
        details: cacheResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('❌ 오류:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// 리그별 현재 시즌 계산
function getCurrentSeason(leagueId: number, date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  
  // 챔피언스리그, 유로파리그
  if ([2, 3].includes(leagueId)) {
    return month >= 7 ? year : year - 1
  }
  
  // 일반 유럽 리그 (8월-5월)
  return month >= 8 ? year : year - 1
}