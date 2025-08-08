import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clubId = searchParams.get('clubId') || '11' // Test with club ID 11
  
  try {
    // Get club profile to see actual club name
    const response = await fetch(
      `https://transfermarket.p.rapidapi.com/clubs/get-profile?id=${clubId}&domain=de`,
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
    
    // Log to see the actual structure
    console.log('[TEST CLUB INFO] Response for club', clubId, ':', JSON.stringify(data, null, 2))
    
    // Try various possible field names
    const clubName = data?.clubName || 
                    data?.name || 
                    data?.club?.name || 
                    data?.share?.title ||
                    data?.club?.[0]?.name ||
                    'Unknown'
    
    return NextResponse.json({
      success: true,
      clubId,
      data,
      clubName,
      allKeys: Object.keys(data || {}),
      // Include first level values to understand structure
      firstLevelData: Object.entries(data || {}).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'object' ? Object.keys(value) : value
        return acc
      }, {} as any)
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}