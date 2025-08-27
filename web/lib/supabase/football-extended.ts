// Extended Football API methods for additional data fetching
import { FootballAPIService } from './football'

export class ExtendedFootballService extends FootballAPIService {
  // H2H 상대전적 가져오기 - 오버로딩 지원
  async getH2H(params: { team1Id: number; team2Id: number } | { h2h: string }): Promise<any> {
    let cacheKey: string
    let apiParams: any
    
    if ('h2h' in params) {
      cacheKey = `h2h_${params.h2h}`
      apiParams = { h2h: params.h2h, last: 10 }
    } else {
      const { team1Id, team2Id } = params
      cacheKey = `h2h_${team1Id}_${team2Id}`
      apiParams = { h2h: `${team1Id}-${team2Id}`, last: 10 }
    }
    
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/h2h', apiParams)
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching H2H:', error)
      throw error
    }
  }

  // 팀 현재 시즌 순위 가져오기
  async getTeamStanding(teamId: number, leagueId: number, season: number = new Date().getFullYear()): Promise<any> {
    const cacheKey = `standing_${teamId}_${leagueId}_${season}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const standings = await this.getStandings({ league: leagueId, season })
      
      // 팀 순위 찾기
      const teamStanding = standings?.response?.[0]?.league?.standings?.[0]?.find(
        (team: any) => team.team.id === teamId
      )
      
      const result = {
        standing: teamStanding,
        fullTable: standings?.response?.[0]?.league?.standings?.[0] || []
      }
      
      this.setCachedData(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error fetching team standing:', error)
      throw error
    }
  }

  // 경기 라인업 가져오기
  async getFixtureLineups(fixtureId: number): Promise<any> {
    const cacheKey = `lineups_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/lineups', {
        fixture: fixtureId
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching lineups:', error)
      return null // 라인업이 아직 없을 수 있음
    }
  }

  // 경기 이벤트 가져오기
  async getFixtureEvents(fixtureId: number): Promise<any> {
    const cacheKey = `events_${fixtureId}`
    // 실시간 이벤트는 짧은 캐시 (30초)
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data
    }

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/events', {
        fixture: fixtureId
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }

  // 경기 통계 가져오기
  async getFixtureStatistics(fixtureId: number): Promise<any> {
    const cacheKey = `statistics_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/statistics', {
        fixture: fixtureId
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching statistics:', error)
      return null // 통계가 아직 없을 수 있음
    }
  }

  // 선수 통계 가져오기
  async getFixturePlayers(fixtureId: number): Promise<any> {
    const cacheKey = `players_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/players', {
        fixture: fixtureId
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching players:', error)
      return null
    }
  }

  // 팀 폼 계산 (최근 5경기 결과)
  calculateTeamForm(fixtures: any[], teamId?: number): string[] {
    return fixtures.slice(0, 5).map(fixture => {
      // 팀 ID가 제공된 경우 해당 팀 기준으로 계산
      if (teamId) {
        const isHomeTeam = fixture.teams.home.id === teamId
        const homeWin = fixture.teams.home.winner
        const awayWin = fixture.teams.away.winner
        
        if (homeWin === null && awayWin === null) return 'D' // 무승부
        
        if (isHomeTeam) {
          return homeWin ? 'W' : 'L'
        } else {
          return awayWin ? 'W' : 'L'
        }
      }
      
      // 팀 ID가 없으면 홈팀 기준
      const isHome = fixture.teams.home.winner
      const isAway = fixture.teams.away.winner
      
      if (isHome === null && isAway === null) return 'D' // 무승부
      if (isHome) return 'W' // 승리
      if (isAway) return 'L' // 패배
      return 'D'
    }).reverse() // 오래된 경기부터 표시
  }

  // 팀 최근 경기 가져오기
  async getTeamLastFixtures(teamId: number, last: number = 5): Promise<any> {
    const cacheKey = `team_last_${teamId}_${last}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures', {
        team: teamId,
        last: last,
        status: 'FT'
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching team last fixtures:', error)
      throw error
    }
  }

  // 팀 통계 요약
  getTeamStatsSummary(fixtures: any[]): any {
    const stats = {
      played: fixtures.length,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0
    }

    fixtures.forEach(fixture => {
      const isHome = fixture.teams.home.winner
      const isAway = fixture.teams.away.winner
      
      if (isHome === null && isAway === null) {
        stats.draws++
      } else if (isHome) {
        stats.wins++
      } else {
        stats.losses++
      }
      
      stats.goalsFor += fixture.goals.home || 0
      stats.goalsAgainst += fixture.goals.away || 0
      
      if (fixture.goals.away === 0) {
        stats.cleanSheets++
      }
    })

    return stats
  }
}

// 싱글톤 인스턴스
export const extendedFootballService = new ExtendedFootballService()