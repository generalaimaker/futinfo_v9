import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('🎯 선택적 실시간 업데이트 시작...')
    
    // 1. 관리자가 선택한 실시간 폴링 경기만 가져오기
    const { data: realtimeFixtures, error: fetchError } = await supabase
      .from('realtime_fixtures')
      .select('*')
      .eq('is_active', true)
    
    if (fetchError) {
      throw new Error(`Failed to fetch realtime fixtures: ${fetchError.message}`)
    }
    
    if (!realtimeFixtures || realtimeFixtures.length === 0) {
      console.log('ℹ️ 실시간 폴링이 활성화된 경기가 없습니다.')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active realtime fixtures',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`📊 ${realtimeFixtures.length}개의 선택된 경기 업데이트 중...`)
    
    const updatedMatches = []
    const events = []
    
    // 2. 각 선택된 경기에 대해 API 호출
    for (const fixture of realtimeFixtures) {
      try {
        // Football API에서 특정 경기 정보 가져오기
        const response = await fetch(
          `https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${fixture.fixture_id}`,
          {
            headers: {
              'x-rapidapi-key': footballApiKey,
              'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
            }
          }
        )
        
        const data = await response.json()
        const match = data.response?.[0]
        
        if (!match) {
          console.log(`⚠️ 경기 ${fixture.fixture_id} 데이터를 찾을 수 없음`)
          continue
        }
        
        // 3. 이전 상태 조회
        const { data: previousMatch } = await supabase
          .from('live_matches')
          .select('*')
          .eq('fixture_id', fixture.fixture_id)
          .single()
        
        // 4. 현재 상태 저장
        const currentMatch = {
          fixture_id: fixture.fixture_id,
          league_id: match.league.id,
          league_name: match.league.name,
          home_team_id: match.teams.home.id,
          home_team_name: match.teams.home.name,
          home_team_logo: match.teams.home.logo,
          away_team_id: match.teams.away.id,
          away_team_name: match.teams.away.name,
          away_team_logo: match.teams.away.logo,
          status: match.fixture.status.long,
          status_short: match.fixture.status.short,
          elapsed: match.fixture.status.elapsed,
          home_score: match.goals.home || 0,
          away_score: match.goals.away || 0,
          match_date: match.fixture.date,
          venue_name: match.fixture.venue?.name,
          venue_city: match.fixture.venue?.city,
          referee: match.fixture.referee,
          round: match.league.round,
          last_updated: new Date().toISOString()
        }
        
        // 5. 변경사항 감지 및 이벤트 처리
        if (previousMatch) {
          // 득점 변경 감지
          if (previousMatch.home_score !== currentMatch.home_score || 
              previousMatch.away_score !== currentMatch.away_score) {
            
            console.log(`⚽ 득점! ${fixture.home_team_name} ${currentMatch.home_score} - ${currentMatch.away_score} ${fixture.away_team_name}`)
            
            // 득점 이벤트 찾기
            const goalEvents = match.events?.filter((e: any) => 
              e.type === 'Goal' && 
              e.time.elapsed > (previousMatch.elapsed || 0)
            ) || []
            
            // 이벤트 저장
            for (const goalEvent of goalEvents) {
              const eventData = {
                fixture_id: fixture.fixture_id,
                time_elapsed: goalEvent.time.elapsed,
                time_extra: goalEvent.time.extra,
                team_id: goalEvent.team.id,
                team_name: goalEvent.team.name,
                player_id: goalEvent.player?.id,
                player_name: goalEvent.player?.name,
                assist_id: goalEvent.assist?.id,
                assist_name: goalEvent.assist?.name,
                type: 'Goal',
                detail: goalEvent.detail,
                comments: goalEvent.comments
              }
              
              await supabase
                .from('live_match_events')
                .insert(eventData)
              
              events.push(eventData)
              
              // Realtime 브로드캐스트
              await supabase
                .channel('match-updates')
                .send({
                  type: 'broadcast',
                  event: 'goal',
                  payload: {
                    fixture_id: fixture.fixture_id,
                    home_team: fixture.home_team_name,
                    away_team: fixture.away_team_name,
                    home_score: currentMatch.home_score,
                    away_score: currentMatch.away_score,
                    scorer: goalEvent.player?.name,
                    minute: goalEvent.time.elapsed,
                    team: goalEvent.team.name
                  }
                })
            }
          }
          
          // 카드 이벤트
          const cardEvents = match.events?.filter((e: any) => 
            e.type === 'Card' && 
            e.time.elapsed > (previousMatch.elapsed || 0)
          ) || []
          
          for (const cardEvent of cardEvents) {
            const eventData = {
              fixture_id: fixture.fixture_id,
              time_elapsed: cardEvent.time.elapsed,
              time_extra: cardEvent.time.extra,
              team_id: cardEvent.team.id,
              team_name: cardEvent.team.name,
              player_id: cardEvent.player?.id,
              player_name: cardEvent.player?.name,
              type: 'Card',
              detail: cardEvent.detail,
              comments: cardEvent.comments
            }
            
            await supabase
              .from('live_match_events')
              .insert(eventData)
            
            events.push(eventData)
            
            // Realtime 브로드캐스트
            await supabase
              .channel('match-updates')
              .send({
                type: 'broadcast',
                event: 'card',
                payload: {
                  fixture_id: fixture.fixture_id,
                  player: cardEvent.player?.name,
                  card_type: cardEvent.detail,
                  minute: cardEvent.time.elapsed,
                  team: cardEvent.team.name
                }
              })
          }
          
          // 상태 변경 (하프타임, 종료 등)
          if (previousMatch.status_short !== currentMatch.status_short) {
            console.log(`📢 상태 변경: ${fixture.fixture_id} - ${previousMatch.status_short} → ${currentMatch.status_short}`)
            
            await supabase
              .channel('match-updates')
              .send({
                type: 'broadcast',
                event: 'status_change',
                payload: {
                  fixture_id: fixture.fixture_id,
                  old_status: previousMatch.status_short,
                  new_status: currentMatch.status_short,
                  home_team: fixture.home_team_name,
                  away_team: fixture.away_team_name
                }
              })
          }
        }
        
        // 6. live_matches 테이블 업데이트
        await supabase
          .from('live_matches')
          .upsert(currentMatch)
        
        // 7. 통계 데이터 저장
        if (match.statistics && match.statistics.length > 0) {
          for (const teamStats of match.statistics) {
            await supabase
              .from('live_match_statistics')
              .upsert({
                fixture_id: fixture.fixture_id,
                team_id: teamStats.team.id,
                team_name: teamStats.team.name,
                statistics: teamStats.statistics
              })
          }
        }
        
        updatedMatches.push({
          fixture_id: fixture.fixture_id,
          home: `${fixture.home_team_name} ${currentMatch.home_score}`,
          away: `${currentMatch.away_score} ${fixture.away_team_name}`,
          status: currentMatch.status_short,
          elapsed: currentMatch.elapsed
        })
        
      } catch (error) {
        console.error(`Error updating fixture ${fixture.fixture_id}:`, error)
      }
    }
    
    console.log(`✅ 업데이트 완료: ${updatedMatches.length}개 경기, ${events.length}개 이벤트`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        updated_matches: updatedMatches.length,
        new_events: events.length,
        matches: updatedMatches,
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