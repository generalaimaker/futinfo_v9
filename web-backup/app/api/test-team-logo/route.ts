import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const teamId = '33' // Manchester United
    const url = `https://free-api-live-football-data.p.rapidapi.com/football-team-logo?teamid=${teamId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4',
        'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
      },
    })

    const data = await response.json()
    
    console.log('Team Logo API Response:', JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      teamId,
      rawResponse: data,
      url: data?.response?.url || data?.url || data,
    })
  } catch (error) {
    console.error('Error testing team logo API:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}