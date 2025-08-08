import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const FOOTBALL_API_KEY = Deno.env.get('FOOTBALL_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 라이브 경기 상태
const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE']

interface LiveMatch {
  fixture_id: number
  league_id: number
  league_name: string
  home_team_id: number
  home_team_name: string
  home_team_logo: string
  away_team_id: number
  away_team_name: string
  away_team_logo: string
  status: string
  status_short: string
  elapsed: number | null
  home_score: number
  away_score: number
  match_date: string
  venue_name: string | null
  venue_city: string | null
  referee: string | null
  round: string
  last_updated: string
}

serve(async (req) => {
  try {
    // CORS 헤더
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers })
    }

    // 1. API-Football에서 라이브 경기 가져오기
    const apiResponse = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
      headers: {
        'x-rapidapi-key': FOOTBALL_API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    })

    const data = await apiResponse.json()
    
    if (!data.response || data.response.length === 0) {
      console.log('No live matches found')
      // 라이브 경기가 없으면 테이블 비우기
      await supabase.from('live_matches').delete().neq('fixture_id', 0)
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No live matches',
        count: 0 
      }), { headers: { ...headers, 'Content-Type': 'application/json' } })
    }

    console.log(`Found ${data.response.length} live matches`)

    // 2. 라이브 경기 데이터 변환
    const liveMatches: LiveMatch[] = data.response.map((fixture: any) => ({
      fixture_id: fixture.fixture.id,
      league_id: fixture.league.id,
      league_name: fixture.league.name,
      home_team_id: fixture.teams.home.id,
      home_team_name: fixture.teams.home.name,
      home_team_logo: fixture.teams.home.logo,
      away_team_id: fixture.teams.away.id,
      away_team_name: fixture.teams.away.name,
      away_team_logo: fixture.teams.away.logo,
      status: fixture.fixture.status.long,
      status_short: fixture.fixture.status.short,
      elapsed: fixture.fixture.status.elapsed,
      home_score: fixture.goals.home || 0,
      away_score: fixture.goals.away || 0,
      match_date: fixture.fixture.date,
      venue_name: fixture.fixture.venue.name,
      venue_city: fixture.fixture.venue.city,
      referee: fixture.fixture.referee,
      round: fixture.league.round,
      last_updated: new Date().toISOString()
    }))

    // 3. 현재 저장된 라이브 경기 목록 가져오기
    const { data: existingMatches } = await supabase
      .from('live_matches')
      .select('fixture_id')

    const existingIds = existingMatches?.map(m => m.fixture_id) || []
    const currentIds = liveMatches.map(m => m.fixture_id)

    // 4. 종료된 경기 삭제
    const endedMatches = existingIds.filter(id => !currentIds.includes(id))
    if (endedMatches.length > 0) {
      await supabase
        .from('live_matches')
        .delete()
        .in('fixture_id', endedMatches)
      
      console.log(`Removed ${endedMatches.length} ended matches`)
    }

    // 5. 라이브 경기 업데이트 또는 삽입
    for (const match of liveMatches) {
      const { error } = await supabase
        .from('live_matches')
        .upsert(match, { 
          onConflict: 'fixture_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error(`Error upserting match ${match.fixture_id}:`, error)
      }
    }

    // 6. 이벤트 업데이트 (골, 카드 등)
    for (const fixture of data.response) {
      if (fixture.events && fixture.events.length > 0) {
        await updateMatchEvents(fixture.fixture.id, fixture.events)
      }
    }

    // 7. 통계 업데이트
    for (const fixture of data.response) {
      if (fixture.statistics && fixture.statistics.length > 0) {
        await updateMatchStatistics(fixture.fixture.id, fixture.statistics)
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: liveMatches.length,
      updated: new Date().toISOString()
    }), { 
      headers: { ...headers, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Error updating live matches:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    })
  }
})

async function updateMatchEvents(fixtureId: number, events: any[]) {
  // 기존 이벤트 삭제
  await supabase
    .from('live_match_events')
    .delete()
    .eq('fixture_id', fixtureId)

  // 새 이벤트 삽입
  const matchEvents = events.map(event => ({
    fixture_id: fixtureId,
    time_elapsed: event.time.elapsed,
    time_extra: event.time.extra,
    team_id: event.team.id,
    team_name: event.team.name,
    player_id: event.player?.id,
    player_name: event.player?.name,
    assist_id: event.assist?.id,
    assist_name: event.assist?.name,
    type: event.type,
    detail: event.detail,
    comments: event.comments
  }))

  if (matchEvents.length > 0) {
    const { error } = await supabase
      .from('live_match_events')
      .insert(matchEvents)

    if (error) {
      console.error(`Error inserting events for match ${fixtureId}:`, error)
    }
  }
}

async function updateMatchStatistics(fixtureId: number, statistics: any[]) {
  // 통계 업데이트 (팀별로)
  for (const teamStats of statistics) {
    const { error } = await supabase
      .from('live_match_statistics')
      .upsert({
        fixture_id: fixtureId,
        team_id: teamStats.team.id,
        team_name: teamStats.team.name,
        statistics: teamStats.statistics,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'fixture_id,team_id'
      })

    if (error) {
      console.error(`Error updating statistics for match ${fixtureId}:`, error)
    }
  }
}