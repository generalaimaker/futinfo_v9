import { NextResponse } from 'next/server'

export async function GET() {
  const endpoints = [
    {
      name: 'All Transfers',
      url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-all-transfers?page=1'
    },
    {
      name: 'Top Transfers',
      url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-top-transfers?page=1'
    },
    {
      name: 'Transfers by League (Premier League)',
      url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-league-transfers?leagueid=47'
    },
    {
      name: 'Team Players Out (Man City)',
      url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-team-players-out-transfers?teamid=8650'
    },
    {
      name: 'Team Players In (Man City)',
      url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-team-players-in-transfers?teamid=8650'
    },
    {
      name: 'Team Contract Extension',
      url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-team-contract-extension?teamid=8650'
    },
    {
      name: 'Market Value Transfers',
      url: 'https://free-api-live-football-data.p.rapidapi.com/football-get-market-value-transfers?page=1'
    }
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4',
          'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
        }
      })
      
      const text = await response.text()
      let data
      
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
      
      // Extract transfer data from various possible locations
      let transfers = []
      let sampleTransfer = null
      
      // First check for nested response.transfers structure
      if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
        transfers = data.response.transfers
        sampleTransfer = data.response.transfers[0]
      } else if (Array.isArray(data)) {
        transfers = data
        sampleTransfer = data[0]
      } else if (data && typeof data === 'object') {
        // Check various possible keys
        const possibleKeys = ['response', 'data', 'transfers', 'results', 'items']
        for (const key of possibleKeys) {
          if (data[key] && Array.isArray(data[key])) {
            transfers = data[key]
            sampleTransfer = data[key][0]
            break
          }
        }
      }
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        ok: response.ok,
        dataType: typeof data,
        isArray: Array.isArray(data),
        keys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [],
        transfersFound: transfers.length,
        sampleTransfer,
        hasPlayerNames: sampleTransfer?.name || sampleTransfer?.player?.name || sampleTransfer?.playerName || false,
        hasClubNames: (sampleTransfer?.transferText && Array.isArray(sampleTransfer.transferText)) ||
                     (sampleTransfer?.from?.name && sampleTransfer?.to?.name) || 
                     (sampleTransfer?.fromClubName && sampleTransfer?.toClubName) || false
      })
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  return NextResponse.json({ 
    results,
    summary: {
      totalTested: results.length,
      successful: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok || r.error).length,
      withData: results.filter(r => r.transfersFound > 0).length
    }
  })
}