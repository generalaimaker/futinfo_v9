import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || 'Chelsea'
  
  try {
    const response = await fetch(
      `https://transfermarket.p.rapidapi.com/search?query=${encodeURIComponent(query)}&domain=de`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'transfermarket.p.rapidapi.com',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        error: `API Error: ${response.status}`,
        details: errorText,
      }, { status: response.status })
    }

    const data = await response.json()
    
    // Extract club info
    const clubs = data?.clubs || []
    const clubMappings: Record<string, string> = {}
    
    clubs.forEach((club: any) => {
      if (club.id && club.name) {
        clubMappings[club.id] = club.name
      }
    })
    
    return NextResponse.json({
      success: true,
      query,
      clubs,
      clubMappings,
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}