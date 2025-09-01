import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const teamId = params.id

  try {
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/transfers?team=${teamId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4',
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[API Route] Transfers for team ${teamId}:`, data.results)

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Route] Error fetching transfers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}