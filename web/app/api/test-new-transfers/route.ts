import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '1'
  
  try {
    const response = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-all-transfers?page=${page}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4',
          'X-RapidAPI-Host': 'free-api-live-football-data.p.rapidapi.com',
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
    
    // Log the structure
    console.log('[NEW TRANSFERS API] Full response:', JSON.stringify(data, null, 2))
    console.log('[NEW TRANSFERS API] Response type:', typeof data)
    console.log('[NEW TRANSFERS API] Is Array:', Array.isArray(data))
    
    if (data && typeof data === 'object') {
      console.log('[NEW TRANSFERS API] Response keys:', Object.keys(data))
    }
    
    // Try to find the transfers array in various places
    let transfers = []
    let sampleTransfer = null
    
    if (Array.isArray(data)) {
      transfers = data
      sampleTransfer = data[0]
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response
      sampleTransfer = data.response[0]
    } else if (data?.data && Array.isArray(data.data)) {
      transfers = data.data
      sampleTransfer = data.data[0]
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers
      sampleTransfer = data.transfers[0]
    }
    
    return NextResponse.json({
      success: true,
      page,
      fullResponse: data,
      transfersFound: transfers.length,
      sampleTransfer,
      responseStructure: {
        isArray: Array.isArray(data),
        hasResponse: !!data?.response,
        hasData: !!data?.data,
        hasTransfers: !!data?.transfers,
        keys: data && typeof data === 'object' ? Object.keys(data) : []
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}