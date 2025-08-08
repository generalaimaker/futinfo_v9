import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LIVE_UPDATER_URL = `${SUPABASE_URL}/functions/v1/live-matches-updater`

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers })
    }

    // 이 함수는 Supabase의 pg_cron 또는 외부 크론 서비스에서 호출됩니다
    // 15초마다 실행되도록 설정

    // 현재 라이브 경기가 있는지 확인
    const { data: liveMatches, error: checkError } = await supabase
      .from('live_matches')
      .select('fixture_id')
      .limit(1)

    if (checkError) {
      throw checkError
    }

    // 라이브 경기가 있거나, 최근 5분 이내에 라이브 경기가 있었다면 업데이트
    const shouldUpdate = liveMatches && liveMatches.length > 0

    if (shouldUpdate) {
      // live-matches-updater 함수 호출
      const response = await fetch(LIVE_UPDATER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      console.log('Live matches update result:', result)

      return new Response(JSON.stringify({
        success: true,
        updated: true,
        result
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    } else {
      // 라이브 경기가 없으면 덜 자주 확인 (5분마다)
      return new Response(JSON.stringify({
        success: true,
        updated: false,
        message: 'No live matches to update'
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Error in schedule-live-updates:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    })
  }
})