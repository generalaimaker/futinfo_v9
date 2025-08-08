import { NextResponse } from 'next/server'

export async function GET() {
  const endpoints = [
    '/football-get-all-transfers',
    '/football-get-top-transfers',
    '/football-get-transfers-by-league-id?league_id=39',
    '/football-get-team-players-out-transfers?teamid=8650',
    '/football-get-team-players-in-transfers?teamid=8650',
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(
        `https://free-api-live-football-data.p.rapidapi.com${endpoint}`,
        {
          headers: {
            'X-RapidAPI-Key': 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4',
            'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
          },
        }
      )
      
      const data = await response.json()
      
      results.push({
        endpoint,
        status: response.status,
        ok: response.ok,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        keys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [],
        sampleData: Array.isArray(data) ? data[0] : data?.response?.[0] || data?.data?.[0] || data?.transfers?.[0] || null,
        totalItems: Array.isArray(data) ? data.length : data?.response?.length || data?.data?.length || data?.transfers?.length || 0
      })
    } catch (error) {
      results.push({
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return NextResponse.json({ results })
}