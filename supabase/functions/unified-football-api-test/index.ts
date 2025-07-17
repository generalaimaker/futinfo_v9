import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Mock data for testing
const mockFixtures = {
  "get": "fixtures",
  "parameters": {
    "date": "2025-07-16"
  },
  "errors": [],
  "results": 3,
  "paging": {
    "current": 1,
    "total": 1
  },
  "response": [
    {
      "fixture": {
        "id": 1001,
        "referee": null,
        "timezone": "UTC",
        "date": "2025-07-16T19:00:00+00:00",
        "timestamp": 1752692400,
        "periods": {
          "first": null,
          "second": null
        },
        "venue": {
          "id": 1,
          "name": "Inter Miami Stadium",
          "city": "Miami"
        },
        "status": {
          "long": "Not Started",
          "short": "NS",
          "elapsed": null
        }
      },
      "league": {
        "id": 253,
        "name": "MLS",
        "country": "USA",
        "logo": "https://media.api-sports.io/football/leagues/253.png",
        "flag": "https://media.api-sports.io/flags/us.svg",
        "season": 2025,
        "round": "Regular Season - 23"
      },
      "teams": {
        "home": {
          "id": 1595,
          "name": "Inter Miami",
          "logo": "https://media.api-sports.io/football/teams/1595.png",
          "winner": null
        },
        "away": {
          "id": 1596,
          "name": "LA Galaxy",
          "logo": "https://media.api-sports.io/football/teams/1596.png",
          "winner": null
        }
      },
      "goals": {
        "home": null,
        "away": null
      },
      "score": {
        "halftime": {
          "home": null,
          "away": null
        },
        "fulltime": {
          "home": null,
          "away": null
        },
        "extratime": {
          "home": null,
          "away": null
        },
        "penalty": {
          "home": null,
          "away": null
        }
      }
    },
    {
      "fixture": {
        "id": 1002,
        "referee": null,
        "timezone": "UTC",
        "date": "2025-07-16T10:00:00+00:00",
        "timestamp": 1752660000,
        "periods": {
          "first": null,
          "second": null
        },
        "venue": {
          "id": 2,
          "name": "Seoul World Cup Stadium",
          "city": "Seoul"
        },
        "status": {
          "long": "Not Started",
          "short": "NS",
          "elapsed": null
        }
      },
      "league": {
        "id": 292,
        "name": "K League 1",
        "country": "South Korea",
        "logo": "https://media.api-sports.io/football/leagues/292.png",
        "flag": "https://media.api-sports.io/flags/kr.svg",
        "season": 2025,
        "round": "Regular Season - 15"
      },
      "teams": {
        "home": {
          "id": 2748,
          "name": "FC Seoul",
          "logo": "https://media.api-sports.io/football/teams/2748.png",
          "winner": null
        },
        "away": {
          "id": 2749,
          "name": "Jeonbuk Motors",
          "logo": "https://media.api-sports.io/football/teams/2749.png",
          "winner": null
        }
      },
      "goals": {
        "home": null,
        "away": null
      },
      "score": {
        "halftime": {
          "home": null,
          "away": null
        },
        "fulltime": {
          "home": null,
          "away": null
        },
        "extratime": {
          "home": null,
          "away": null
        },
        "penalty": {
          "home": null,
          "away": null
        }
      }
    },
    {
      "fixture": {
        "id": 1003,
        "referee": null,
        "timezone": "UTC",
        "date": "2025-07-16T23:00:00+00:00",
        "timestamp": 1752706800,
        "periods": {
          "first": null,
          "second": null
        },
        "venue": {
          "id": 3,
          "name": "Red Bull Arena",
          "city": "New York"
        },
        "status": {
          "long": "Not Started",
          "short": "NS",
          "elapsed": null
        }
      },
      "league": {
        "id": 253,
        "name": "MLS",
        "country": "USA",
        "logo": "https://media.api-sports.io/football/leagues/253.png",
        "flag": "https://media.api-sports.io/flags/us.svg",
        "season": 2025,
        "round": "Regular Season - 23"
      },
      "teams": {
        "home": {
          "id": 1602,
          "name": "New York Red Bulls",
          "logo": "https://media.api-sports.io/football/teams/1602.png",
          "winner": null
        },
        "away": {
          "id": 1604,
          "name": "Portland Timbers",
          "logo": "https://media.api-sports.io/football/teams/1604.png",
          "winner": null
        }
      },
      "goals": {
        "home": null,
        "away": null
      },
      "score": {
        "halftime": {
          "home": null,
          "away": null
        },
        "fulltime": {
          "home": null,
          "away": null
        },
        "extratime": {
          "home": null,
          "away": null
        },
        "penalty": {
          "home": null,
          "away": null
        }
      }
    }
  ]
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('[Test Edge Function] Request received')

  try {
    const body = await req.json()
    console.log('[Test Edge Function] Request body:', body)
    const { endpoint, params } = body
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not specified' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return mock data for fixtures endpoint
    if (endpoint === 'fixtures') {
      console.log('[Test Edge Function] Returning mock fixtures data')
      return new Response(
        JSON.stringify(mockFixtures),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Test Edge Function] Error:', error)
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