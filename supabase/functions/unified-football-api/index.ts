import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Simple API key verification (optional)
  const headers = Object.fromEntries(req.headers.entries())
  const clientApiKey = headers['x-api-key']
  
  // Optional: Add your own API key for additional security
  const EDGE_FUNCTION_API_KEY = Deno.env.get('EDGE_FUNCTION_API_KEY')
  if (EDGE_FUNCTION_API_KEY && clientApiKey !== EDGE_FUNCTION_API_KEY) {
    console.log('[Edge Function] Invalid API key provided')
    // For now, just log but don't block (for backward compatibility)
  }

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
    console.log('[Edge Function] Request endpoint:', body.endpoint)
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
      case 'fixtures/lineups':
        apiPath = '/fixtures/lineups'
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
      case 'injuries':
        apiPath = '/injuries'
        break
      case 'predictions':
        apiPath = '/predictions'
        break
      case 'fixtures/players':
        apiPath = '/fixtures/players'
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
    console.log(`[Edge Function] API Request: ${apiUrl}`)

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
      console.error(`[Edge Function] API Error: ${response.status}`, data)
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

    // If this is a live fixtures request, store the data in Supabase
    if (endpoint === 'fixtures' && params?.live === 'all' && data.response) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Process each live match
        const liveMatches = data.response.map((fixture: any) => ({
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
          home_score: fixture.goals.home ?? 0,
          away_score: fixture.goals.away ?? 0,
          match_date: fixture.fixture.date,
          venue_name: fixture.fixture.venue.name,
          venue_city: fixture.fixture.venue.city,
          referee: fixture.fixture.referee,
          round: fixture.league.round,
          last_updated: new Date().toISOString()
        }))
        
        // Upsert live matches
        if (liveMatches.length > 0) {
          const { error } = await supabase
            .from('live_matches')
            .upsert(liveMatches, { onConflict: 'fixture_id' })
          
          if (error) {
            console.error('[Edge Function] Error storing live matches:', error)
          } else {
            console.log(`[Edge Function] Stored ${liveMatches.length} live matches`)
          }
        }
        
        // Also process events if any
        const allEvents = []
        for (const fixture of data.response) {
          if (fixture.events && fixture.events.length > 0) {
            const events = fixture.events.map((event: any) => ({
              fixture_id: fixture.fixture.id,
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
            allEvents.push(...events)
          }
        }
        
        if (allEvents.length > 0) {
          const { error } = await supabase
            .from('live_match_events')
            .upsert(allEvents, { onConflict: 'fixture_id,time_elapsed,type,detail' })
          
          if (error) {
            console.error('[Edge Function] Error storing match events:', error)
          } else {
            console.log(`[Edge Function] Stored ${allEvents.length} match events`)
          }
        }
      } catch (err) {
        console.error('[Edge Function] Error processing live matches:', err)
      }
    }

    console.log(`[Edge Function] Success: ${endpoint} returned ${data.results || 0} results`)
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Edge Function] Error:', error)
    
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
        errorType: error.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}, {
  // JWT 검증 비활성화 (읽기 전용 공개 API이므로)
  // 실제 API 키는 서버에만 있어서 안전함
})