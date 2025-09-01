import { cache } from 'react'
import { getEnhancedTeamTransfers } from '@/lib/football-api/team-transfers'

const MAJOR_TEAMS = [
  // Premier League
  { id: 33, name: 'Manchester United', league: 'Premier League' },
  { id: 50, name: 'Manchester City', league: 'Premier League' },
  { id: 49, name: 'Chelsea', league: 'Premier League' },
  { id: 42, name: 'Arsenal', league: 'Premier League' },
  { id: 40, name: 'Liverpool', league: 'Premier League' },
  { id: 47, name: 'Tottenham', league: 'Premier League' },
  
  // La Liga
  { id: 541, name: 'Real Madrid', league: 'La Liga' },
  { id: 529, name: 'Barcelona', league: 'La Liga' },
  { id: 530, name: 'Atletico Madrid', league: 'La Liga' },
  
  // Serie A
  { id: 496, name: 'Juventus', league: 'Serie A' },
  { id: 505, name: 'Inter', league: 'Serie A' },
  { id: 489, name: 'AC Milan', league: 'Serie A' },
  
  // Bundesliga
  { id: 157, name: 'Bayern Munich', league: 'Bundesliga' },
  { id: 165, name: 'Borussia Dortmund', league: 'Bundesliga' },
  
  // Ligue 1
  { id: 85, name: 'PSG', league: 'Ligue 1' },
]

// React cache를 사용한 요청 레벨 캐싱
export const getMajorTransfers = cache(async () => {
  console.log('[Server] Fetching major transfers...')
  
  try {
    const allTransfers = []
    
    // 배치 처리 (3개씩 나누어 처리)
    const batchSize = 3
    for (let i = 0; i < MAJOR_TEAMS.length; i += batchSize) {
      const batch = MAJOR_TEAMS.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (team) => {
        try {
          const data = await getEnhancedTeamTransfers(team.id)
          const transfers = [
            ...(data.in || []),
            ...(data.out || [])
          ].map(transfer => ({
            ...transfer,
            teamName: team.name,
            teamLeague: team.league
          }))
          return transfers
        } catch (error) {
          console.error(`[Server] Error fetching ${team.name}:`, error)
          return []
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      allTransfers.push(...batchResults.flat())
      
      // 배치 사이 짧은 딜레이 (API 부하 방지)
      if (i + batchSize < MAJOR_TEAMS.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // 2025년 6월 1일 이후 이적만 필터링 (여름 이적 시장)
    const seasonStartDate = new Date('2025-06-01')
    const currentSeasonTransfers = allTransfers.filter(t => {
      const transferDate = new Date(t.transferDate)
      return transferDate >= seasonStartDate
    })
    
    // 중복 제거 (선수명 + 날짜 + 이적료가 같으면 중복)
    const uniqueTransfers = currentSeasonTransfers.filter((transfer, index, self) => {
      return index === self.findIndex(t => 
        t.playerName === transfer.playerName && 
        t.transferDate === transfer.transferDate &&
        t.fee?.amount === transfer.fee?.amount
      )
    })
    
    // 이적료가 있는 것만 필터링하고 정렬
    const sortedTransfers = uniqueTransfers
      .filter(t => t.fee?.amount && t.fee.amount > 0)
      .sort((a, b) => (b.fee?.amount || 0) - (a.fee?.amount || 0))
      .slice(0, 50) // 충분한 데이터 확보 (50개)
    
    console.log(`[Server] Found ${sortedTransfers.length} unique transfers since June 2025 (from ${allTransfers.length} total)`)
    return sortedTransfers
  } catch (error) {
    console.error('[Server] Failed to fetch transfers:', error)
    return []
  }
})