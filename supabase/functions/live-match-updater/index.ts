import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}

interface LiveMatch {
  fixture_id: number
  home_team_id: number
  away_team_id: number
  home_score: number
  away_score: number
  status: string
  elapsed: number
  events: any[]
  last_updated: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const footballApiKey = Deno.env.get('FOOTBALL_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 5초마다 실행되는 함수
    const updateLiveMatches = async () => {
      console.log('🔄 라이브 경기 업데이트 시작...')
      
      // 1. Football API에서 라이브 경기 가져오기
      const response = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', {
        headers: {
          'x-rapidapi-key': footballApiKey,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      })
      
      const data = await response.json()
      const liveMatches = data.response || []
      
      console.log(`📊 ${liveMatches.length}개의 라이브 경기 발견`)
      
      // 2. 각 경기 처리
      for (const match of liveMatches) {
        const fixtureId = match.fixture.id
        
        // 이전 상태 조회
        const { data: previousMatch } = await supabase
          .from('live_matches')
          .select('*')
          .eq('fixture_id', fixtureId)
          .single()
        
        // 현재 상태
        const currentMatch: LiveMatch = {
          fixture_id: fixtureId,
          home_team_id: match.teams.home.id,
          away_team_id: match.teams.away.id,
          home_score: match.goals.home || 0,
          away_score: match.goals.away || 0,
          status: match.fixture.status.short,
          elapsed: match.fixture.status.elapsed || 0,
          events: match.events || [],
          last_updated: new Date().toISOString()
        }
        
        // 3. 변경사항 감지
        const changes: string[] = []
        
        if (previousMatch) {
          // 득점 변경
          if (previousMatch.home_score !== currentMatch.home_score || 
              previousMatch.away_score !== currentMatch.away_score) {
            changes.push('goal')
            
            // 득점 이벤트 찾기
            const goalEvents = match.events?.filter((e: any) => 
              e.type === 'Goal' && 
              e.time.elapsed > (previousMatch.elapsed || 0)
            ) || []
            
            // 실시간 브로드캐스트
            for (const goalEvent of goalEvents) {
              await supabase.realtime.broadcast('live_matches_updates', {
                type: 'broadcast',
                event: 'match_update',
                payload: {
                  type: 'goal',
                  match_id: fixtureId,
                  home_goals: currentMatch.home_score,
                  away_goals: currentMatch.away_score,
                  scorer_name: goalEvent.player?.name || 'Unknown',
                  minute: goalEvent.time.elapsed,
                  team: goalEvent.team.name,
                  assist: goalEvent.assist?.name
                }
              })
            }
          }
          
          // 상태 변경 (킥오프, 하프타임 등)
          if (previousMatch.status !== currentMatch.status) {
            changes.push('status_change')
            
            await supabase.realtime.broadcast('live_matches_updates', {
              type: 'broadcast', 
              event: 'match_update',
              payload: {
                type: 'status_change',
                match_id: fixtureId,
                old_status: previousMatch.status,
                new_status: currentMatch.status
              }
            })
          }
          
          // 카드 이벤트
          const newCards = match.events?.filter((e: any) => 
            (e.type === 'Card') && 
            e.time.elapsed > (previousMatch.elapsed || 0)
          ) || []
          
          for (const cardEvent of newCards) {
            changes.push('card')
            
            await supabase.realtime.broadcast('live_matches_updates', {
              type: 'broadcast',
              event: 'match_update', 
              payload: {
                type: 'card',
                match_id: fixtureId,
                player_name: cardEvent.player?.name || 'Unknown',
                card_type: cardEvent.detail,
                minute: cardEvent.time.elapsed,
                team: cardEvent.team.name
              }
            })
          }
        }
        
        // 4. 데이터베이스 업데이트
        await supabase
          .from('live_matches')
          .upsert(currentMatch)
        
        // 5. 중요 이벤트는 따로 저장
        if (changes.includes('goal')) {
          await supabase
            .from('match_events')
            .insert({
              fixture_id: fixtureId,
              event_type: 'goal',
              minute: currentMatch.elapsed,
              home_score: currentMatch.home_score,
              away_score: currentMatch.away_score,
              timestamp: new Date().toISOString()
            })
        }
        
        if (changes.length > 0) {
          console.log(`✅ 경기 ${fixtureId}: ${changes.join(', ')} 업데이트`)
        }
      }
      
      // 6. 종료된 경기 정리
      const { data: activeLiveMatches } = await supabase
        .from('live_matches')
        .select('fixture_id')
        .in('status', ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'])
      
      const activeIds = activeLiveMatches?.map(m => m.fixture_id) || []
      const liveIds = liveMatches.map((m: any) => m.fixture.id)
      const endedIds = activeIds.filter(id => !liveIds.includes(id))
      
      if (endedIds.length > 0) {
        await supabase
          .from('live_matches')
          .update({ status: 'FT', last_updated: new Date().toISOString() })
          .in('fixture_id', endedIds)
          
        console.log(`🏁 ${endedIds.length}개 경기 종료됨`)
      }
      
      return { updated: liveMatches.length, ended: endedIds.length }
    }

    // 실행
    const result = await updateLiveMatches()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        ...result,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// 이 함수는 Supabase Dashboard에서 5초마다 실행되도록 Cron Job으로 설정해야 합니다.
// 또는 별도의 백그라운드 워커로 실행할 수 있습니다.