import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransfermarktRequest {
  endpoint: string
  teamId?: number
  competitionIds?: string
  sort?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { endpoint, teamId, competitionIds, sort } = await req.json() as TransfermarktRequest

    // Get API key from Supabase secrets
    const TRANSFERMARKT_API_KEY = Deno.env.get('TRANSFERMARKT_API_KEY')
    const TRANSFERMARKT_API_HOST = 'transfermarket.p.rapidapi.com'
    
    if (!TRANSFERMARKT_API_KEY) {
      throw new Error('Transfermarkt API key not configured')
    }

    // Map team ID to competition ID
    const getCompetitionId = (teamId: number): string => {
      // Premier League teams
      if ([33, 40, 42, 47, 49, 50, 34, 48, 51, 66].includes(teamId)) return 'GB1'
      // La Liga teams
      if ([541, 529, 530].includes(teamId)) return 'ES1'
      // Bundesliga teams
      if ([157, 165, 168].includes(teamId)) return 'L1'
      // Serie A teams
      if ([496, 505, 489, 492].includes(teamId)) return 'IT1'
      // Ligue 1 teams
      if ([85, 91, 81].includes(teamId)) return 'FR1'
      return 'GB1' // default
    }

    let url = `https://transfermarket.p.rapidapi.com${endpoint}`
    
    // Build URL based on endpoint
    if (endpoint === '/transfers/list-rumors') {
      const competition = competitionIds || (teamId ? getCompetitionId(teamId) : 'GB1')
      const sortParam = sort || 'date_desc'
      url = `${url}?competitionIds=${competition}&sort=${sortParam}&domain=com`
    }

    console.log('Fetching from Transfermarkt:', url)

    // Make request to Transfermarkt API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': TRANSFERMARKT_API_KEY,
        'x-rapidapi-host': TRANSFERMARKT_API_HOST,
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Transfermarkt API rate limit exceeded')
      }
      throw new Error(`Transfermarkt API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter rumors for specific team if teamId provided
    if (teamId && data.rumours) {
      const teamIdMapping: { [key: number]: string } = {
        47: '148',    // Tottenham
        49: '631',    // Chelsea
        50: '281',    // Manchester City
        42: '11',     // Arsenal
        40: '31',     // Liverpool
        33: '985',    // Manchester United
        34: '762',    // Newcastle
        48: '379',    // West Ham
        51: '1237',   // Brighton
        66: '405',    // Aston Villa
        541: '418',   // Real Madrid
        529: '131',   // Barcelona
        530: '13',    // Atletico Madrid
        157: '27',    // Bayern Munich
        165: '16',    // Borussia Dortmund
        168: '15',    // Bayer Leverkusen
        496: '506',   // Juventus
        505: '46',    // Inter
        489: '5',     // AC Milan
        492: '6195',  // Napoli
        85: '583',    // PSG
        91: '162',    // Monaco
        81: '244'     // Marseille
      }

      const transfermarktClubId = teamIdMapping[teamId]
      if (transfermarktClubId) {
        data.rumours = data.rumours.filter((rumour: any) => 
          rumour.fromClubID === transfermarktClubId || 
          rumour.toClubID === transfermarktClubId
        )
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})