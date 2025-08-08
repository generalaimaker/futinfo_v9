import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test with the exact example from the user
    const response = await fetch(
      'https://free-api-live-football-data.p.rapidapi.com/football-get-team-players-out-transfers?teamid=8650',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4',
          'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
        }
      }
    )
    
    const text = await response.text()
    let data
    
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : []
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}