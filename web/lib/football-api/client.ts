// Free API Live Football Data Client
// Better alternative to Transfermarket API with actual names included

const API_BASE = 'https://free-api-live-football-data.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4'
const RAPIDAPI_HOST = 'free-api-live-football-data.p.rapidapi.com'

// Rate limiting
let requestQueue: Promise<any> = Promise.resolve()
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 200 // 200ms between requests

async function rateLimitedFetch(url: string, options: RequestInit) {
  return new Promise((resolve, reject) => {
    requestQueue = requestQueue.then(async () => {
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime
      
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
      }
      
      lastRequestTime = Date.now()
      
      try {
        const response = await fetch(url, options)
        resolve(response)
      } catch (error) {
        reject(error)
      }
    })
  })
}

export async function fetchFootballData(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${API_BASE}${endpoint}`)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  console.log('[Football API] Request URL:', url.toString())

  const response = await rateLimitedFetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  }) as Response

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Football API] Error Response:', errorText)
    throw new Error(`Football API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  // Detailed logging for debugging
  console.log('[Football API] Endpoint:', endpoint)
  console.log('[Football API] Response type:', typeof data)
  console.log('[Football API] Is Array:', Array.isArray(data))
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    console.log('[Football API] Response keys:', Object.keys(data))
  }
  if (Array.isArray(data) && data.length > 0) {
    console.log('[Football API] First item:', data[0])
  } else if (data?.response && Array.isArray(data.response) && data.response.length > 0) {
    console.log('[Football API] First response item:', data.response[0])
  }
  
  return data
}

// Helper function to enrich transfers with team logos - DISABLED FOR NOW
async function enrichTransfersWithTeamLogos(transfers: any[]) {
  // Temporarily disabled to prevent server crashes
  // Will implement a better solution with server-side caching
  return transfers
}

// API Methods
export async function getAllTransfers(page = 1) {
  console.log('[getAllTransfers] Called with page:', page)
  
  try {
    const data = await fetchFootballData('/football-get-all-transfers', {
      page: page.toString(),
    })
    
    console.log('[getAllTransfers] Raw response:', JSON.stringify(data, null, 2))
    
    // Handle different response structures - prioritize response.transfers
    let transfers = []
    if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
      transfers = data.response.transfers
      console.log('[getAllTransfers] Found transfers in response.transfers:', transfers.length)
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response
      console.log('[getAllTransfers] Found transfers in response:', transfers.length)
    } else if (Array.isArray(data)) {
      transfers = data
      console.log('[getAllTransfers] Data is array:', transfers.length)
    } else if (data?.data && Array.isArray(data.data)) {
      transfers = data.data
      console.log('[getAllTransfers] Found transfers in data:', transfers.length)
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers
      console.log('[getAllTransfers] Found transfers in transfers:', transfers.length)
    } else {
      console.log('[getAllTransfers] No transfers found in response')
    }
    
    // Fetch team logos for all transfers
    const transfersWithLogos = await enrichTransfersWithTeamLogos(transfers)
    
    return {
      transfers: transfersWithLogos,
      pagination: data?.pagination || null,
      total: data?.total || transfers.length,
    }
  } catch (error) {
    console.error('[Football API] Error fetching all transfers:', error)
    return { transfers: [], pagination: null, total: 0 }
  }
}

export async function getTopTransfers(page = 1) {
  try {
    const data = await fetchFootballData('/football-get-top-transfers', {
      page: page.toString(),
    })
    
    // Handle different response structures - prioritize response.transfers
    let transfers = []
    if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
      transfers = data.response.transfers
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response
    } else if (Array.isArray(data)) {
      transfers = data
    } else if (data?.data && Array.isArray(data.data)) {
      transfers = data.data
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers
    }
    
    // Fetch team logos for all transfers
    const transfersWithLogos = await enrichTransfersWithTeamLogos(transfers)
    
    return {
      transfers: transfersWithLogos,
      pagination: data?.pagination || null,
      total: data?.total || transfers.length,
    }
  } catch (error) {
    console.error('[Football API] Error fetching top transfers:', error)
    return { transfers: [], pagination: null, total: 0 }
  }
}

export async function getTopMarketValueTransfers(page = 1) {
  try {
    const data = await fetchFootballData('/football-get-market-value-transfers', {
      page: page.toString(),
    })
    
    // Handle different response structures
    let transfers = []
    if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
      transfers = data.response.transfers
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response
    } else if (Array.isArray(data)) {
      transfers = data
    } else if (data?.data && Array.isArray(data.data)) {
      transfers = data.data
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers
    }
    
    // Fetch team logos for all transfers
    const transfersWithLogos = await enrichTransfersWithTeamLogos(transfers)
    
    return {
      transfers: transfersWithLogos,
      pagination: data?.pagination || null,
      total: data?.total || transfers.length,
    }
  } catch (error) {
    console.error('[Football API] Error fetching market value transfers:', error)
    return { transfers: [], pagination: null, total: 0 }
  }
}

export async function getTransfersByLeague(leagueId: string, page = 1) {
  try {
    console.log('[getTransfersByLeague] Fetching transfers for league:', leagueId)
    
    const data = await fetchFootballData('/football-get-league-transfers', {
      leagueid: leagueId, // Note: lowercase 'leagueid'
      // API doesn't support page parameter for league transfers
    })
    
    console.log('[getTransfersByLeague] Raw response type:', typeof data)
    console.log('[getTransfersByLeague] Response keys:', data ? Object.keys(data) : 'null')
    
    // Handle different response structures - prioritize response.transfers
    let transfers = []
    if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
      transfers = data.response.transfers
      console.log('[getTransfersByLeague] Found transfers in response.transfers:', transfers.length)
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response
      console.log('[getTransfersByLeague] Found transfers in response:', transfers.length)
    } else if (Array.isArray(data)) {
      transfers = data
      console.log('[getTransfersByLeague] Data is array:', transfers.length)
    } else if (data?.data && Array.isArray(data.data)) {
      transfers = data.data
      console.log('[getTransfersByLeague] Found transfers in data:', transfers.length)
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers
      console.log('[getTransfersByLeague] Found transfers in transfers:', transfers.length)
    } else {
      console.log('[getTransfersByLeague] No transfers found in response structure:', JSON.stringify(data).slice(0, 200))
    }
    
    // Fetch team logos for all transfers
    const transfersWithLogos = await enrichTransfersWithTeamLogos(transfers)
    
    return {
      transfers: transfersWithLogos,
      pagination: data?.pagination || null,
      total: data?.total || transfers.length,
    }
  } catch (error) {
    console.error('[Football API] Error fetching transfers by league:', error)
    return { transfers: [], pagination: null, total: 0 }
  }
}

export async function getTeamContractExtensions(teamId: string, page = 1) {
  try {
    const data = await fetchFootballData('/football-get-team-contract-extension', {
      teamid: teamId, // Note: lowercase 'teamid'
    })
    
    // Handle different response structures
    let extensions = []
    if (Array.isArray(data)) {
      extensions = data
    } else if (data?.response && Array.isArray(data.response)) {
      extensions = data.response
    } else if (data?.data && Array.isArray(data.data)) {
      extensions = data.data
    } else if (data?.extensions && Array.isArray(data.extensions)) {
      extensions = data.extensions
    }
    
    return {
      extensions,
      pagination: data?.pagination || null,
      total: data?.total || extensions.length,
    }
  } catch (error) {
    console.error('[Football API] Error fetching team contract extensions:', error)
    return { extensions: [], pagination: null, total: 0 }
  }
}

export async function getTeamPlayersInTransfers(teamId: string, page = 1) {
  try {
    const data = await fetchFootballData('/football-get-team-players-in-transfers', {
      teamid: teamId, // Note: lowercase 'teamid'
    })
    
    // Handle different response structures
    let transfers = []
    if (Array.isArray(data)) {
      transfers = data
    } else if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
      transfers = data.response.transfers
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response
    } else if (data?.data && Array.isArray(data.data)) {
      transfers = data.data
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers
    }
    
    return {
      transfers,
      pagination: data?.pagination || null,
      total: data?.total || transfers.length,
    }
  } catch (error) {
    console.error('[Football API] Error fetching team players in transfers:', error)
    return { transfers: [], pagination: null, total: 0 }
  }
}

export async function getTeamPlayersOutTransfers(teamId: string, page = 1) {
  try {
    const data = await fetchFootballData('/football-get-team-players-out-transfers', {
      teamid: teamId, // Note: lowercase 'teamid'
    })
    
    // Handle different response structures
    let transfers = []
    if (Array.isArray(data)) {
      transfers = data
    } else if (data?.response?.transfers && Array.isArray(data.response.transfers)) {
      transfers = data.response.transfers
    } else if (data?.response && Array.isArray(data.response)) {
      transfers = data.response
    } else if (data?.data && Array.isArray(data.data)) {
      transfers = data.data
    } else if (data?.transfers && Array.isArray(data.transfers)) {
      transfers = data.transfers
    }
    
    return {
      transfers,
      pagination: data?.pagination || null,
      total: data?.total || transfers.length,
    }
  } catch (error) {
    console.error('[Football API] Error fetching team players out transfers:', error)
    return { transfers: [], pagination: null, total: 0 }
  }
}

// Get player logo/image
export async function getPlayerLogo(playerId: number) {
  try {
    const data = await fetchFootballData('/football-get-player-logo', {
      playerid: playerId.toString(),
    })
    return data
  } catch (error) {
    console.error('[Football API] Error fetching player logo:', error)
    return null
  }
}

// Get team logo
export async function getTeamLogo(teamId: number) {
  try {
    const data = await fetchFootballData('/football-team-logo', {
      teamid: teamId.toString(),
    })
    console.log('[getTeamLogo] Raw response for team', teamId, ':', data)
    
    // Handle different possible response structures
    if (data?.response?.url) {
      return { response: { url: data.response.url } }
    } else if (data?.url) {
      return { response: { url: data.url } }
    } else if (typeof data === 'string' && data.includes('http')) {
      return { response: { url: data } }
    } else if (data?.response && typeof data.response === 'string') {
      return { response: { url: data.response } }
    }
    
    console.log('[getTeamLogo] No URL found in response')
    return null
  } catch (error) {
    console.error('[Football API] Error fetching team logo:', error)
    return null
  }
}

// Batch get player logos - process multiple players at once
export async function getPlayerLogos(playerIds: number[]) {
  const results: Record<number, string | null> = {}
  
  // Process in chunks to avoid too many concurrent requests
  const chunkSize = 5
  for (let i = 0; i < playerIds.length; i += chunkSize) {
    const chunk = playerIds.slice(i, i + chunkSize)
    const promises = chunk.map(async (playerId) => {
      try {
        const data = await getPlayerLogo(playerId)
        return { playerId, url: data?.response?.url || null }
      } catch {
        return { playerId, url: null }
      }
    })
    
    const chunkResults = await Promise.all(promises)
    chunkResults.forEach(result => {
      results[result.playerId] = result.url
    })
  }
  
  return results
}

// Batch get team logos - process multiple teams at once
export async function getTeamLogos(teamIds: number[]) {
  const results: Record<number, string | null> = {}
  
  // Process in chunks to avoid too many concurrent requests
  const chunkSize = 5
  for (let i = 0; i < teamIds.length; i += chunkSize) {
    const chunk = teamIds.slice(i, i + chunkSize)
    const promises = chunk.map(async (teamId) => {
      try {
        const data = await getTeamLogo(teamId)
        return { teamId, url: data?.response?.url || null }
      } catch {
        return { teamId, url: null }
      }
    })
    
    const chunkResults = await Promise.all(promises)
    chunkResults.forEach(result => {
      results[result.teamId] = result.url
    })
  }
  
  return results
}

// Get transfers by team ID using API Football v3
export async function getTransfersByTeamId(teamId: number) {
  try {
    const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/transfers?team=${teamId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch transfers: ${response.status}`)
    }

    const data = await response.json()
    console.log('[getTransfersByTeamId] Response for team', teamId, ':', data)
    
    // API Football v3 returns transfers in response array
    if (data?.response && Array.isArray(data.response)) {
      return {
        transfers: data.response,
        total: data.response.length
      }
    }
    
    return { transfers: [], total: 0 }
  } catch (error) {
    console.error('[getTransfersByTeamId] Error:', error)
    return { transfers: [], total: 0 }
  }
}

// Cache implementation
const CACHE_KEY_PREFIX = 'football_api_cache_'
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

function getCacheKey(endpoint: string, params?: Record<string, string>): string {
  const paramStr = params ? JSON.stringify(params) : ''
  return `${CACHE_KEY_PREFIX}${endpoint}_${paramStr}`
}

export function getCachedData<T>(endpoint: string, params?: Record<string, string>): T | null {
  if (typeof window === 'undefined') return null
  
  const cacheKey = getCacheKey(endpoint, params)
  const cached = localStorage.getItem(cacheKey)
  
  if (!cached) return null
  
  try {
    const { data, timestamp } = JSON.parse(cached)
    
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey)
      return null
    }
    
    return data
  } catch {
    return null
  }
}

export function setCachedData<T>(endpoint: string, data: T, params?: Record<string, string>) {
  if (typeof window === 'undefined') return
  
  const cacheKey = getCacheKey(endpoint, params)
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now(),
  }))
}