import { createClient } from '@/lib/supabase/client'
import { 
  FixturesResponse, 
  LeaguesResponse, 
  StandingsResponse,
  TeamSquadResponse,
  TransfersResponse,
  getCurrentSeason,
  formatDate,
  SUPPORTED_LEAGUES
} from '@/lib/types/football'

class FootballAPIService {
  private supabase = createClient()
  private cache = new Map<string, { data: any; timestamp: number }>()
  private CACHE_DURATION = 5 * 60 * 1000 // 5분 캐시
  
  // 캐시 헬퍼
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T
    }
    return null
  }
  
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // Edge Function 호출 헬퍼
  private async callEdgeFunction<T>(functionName: string, params: any): Promise<T> {
    const { data, error } = await this.supabase.functions.invoke(functionName, {
      body: params
    })
    
    if (error) {
      console.error(`Edge function error (${functionName}):`, error)
      throw new Error(error.message)
    }
    
    return data as T
  }

  // 경기 일정 가져오기
  async getFixtures(params: {
    date?: string
    league?: number
    season?: number
    team?: number
    last?: number
    next?: number
    from?: string
    to?: string
  }): Promise<FixturesResponse> {
    const cacheKey = `fixtures_${JSON.stringify(params)}`
    const cached = this.getCachedData<FixturesResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<FixturesResponse>('football-api', {
        endpoint: 'fixtures',
        params
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching fixtures:', error)
      throw error
    }
  }

  // 날짜별 모든 리그 경기 가져오기
  async getFixturesByDate(date: Date): Promise<FixturesResponse> {
    const formattedDate = formatDate(date)
    const cacheKey = `fixtures_date_${formattedDate}`
    const cached = this.getCachedData<FixturesResponse>(cacheKey)
    if (cached) return cached

    try {
      // 모든 지원 리그의 경기를 가져옴
      const allLeagues = Object.values(SUPPORTED_LEAGUES)
      const promises = allLeagues.map(leagueId => 
        this.getFixtures({ 
          date: formattedDate,
          league: leagueId,
          season: getCurrentSeason(leagueId)
        }).catch(() => ({ response: [] } as FixturesResponse))
      )
      
      const results = await Promise.all(promises)
      
      // 모든 결과 병합
      const mergedResponse: FixturesResponse = {
        get: 'fixtures',
        parameters: { date: formattedDate },
        errors: [],
        results: 0,
        paging: { current: 1, total: 1 },
        response: []
      }
      
      results.forEach(result => {
        if (result.response && result.response.length > 0) {
          mergedResponse.response.push(...result.response)
          mergedResponse.results += result.response.length
        }
      })
      
      // 시간순으로 정렬
      mergedResponse.response.sort((a, b) => 
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      )
      
      this.setCachedData(cacheKey, mergedResponse)
      return mergedResponse
    } catch (error) {
      console.error('Error fetching fixtures by date:', error)
      throw error
    }
  }

  // 리그 정보 가져오기
  async getLeagues(params?: {
    id?: number
    current?: boolean
    season?: number
  }): Promise<LeaguesResponse> {
    const cacheKey = `leagues_${JSON.stringify(params || {})}`
    const cached = this.getCachedData<LeaguesResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<LeaguesResponse>('football-api', {
        endpoint: 'leagues',
        params: params || {}
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching leagues:', error)
      throw error
    }
  }

  // 순위표 가져오기
  async getStandings(params: {
    league: number
    season: number
  }): Promise<StandingsResponse> {
    const cacheKey = `standings_${params.league}_${params.season}`
    const cached = this.getCachedData<StandingsResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<StandingsResponse>('football-api', {
        endpoint: 'standings',
        params
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching standings:', error)
      throw error
    }
  }

  // 팀 스쿼드 가져오기
  async getTeamSquad(params: {
    team: number
  }): Promise<TeamSquadResponse> {
    const cacheKey = `squad_${params.team}`
    const cached = this.getCachedData<TeamSquadResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<TeamSquadResponse>('football-api', {
        endpoint: 'players/squads',
        params
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching team squad:', error)
      throw error
    }
  }

  // 이적 정보 가져오기
  async getTransfers(params: {
    team: number
  }): Promise<TransfersResponse> {
    const cacheKey = `transfers_${params.team}`
    const cached = this.getCachedData<TransfersResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<TransfersResponse>('football-api', {
        endpoint: 'transfers',
        params
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching transfers:', error)
      throw error
    }
  }

  // 실시간 경기 가져오기
  async getLiveFixtures(): Promise<FixturesResponse> {
    const cacheKey = 'fixtures_live'
    // 실시간 경기는 짧은 캐시 시간 사용 (30초)
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data as FixturesResponse
    }

    try {
      const data = await this.callEdgeFunction<FixturesResponse>('football-api', {
        endpoint: 'fixtures',
        params: { live: 'all' }
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching live fixtures:', error)
      throw error
    }
  }

  // 팀 다음 경기 가져오기
  async getTeamNextFixtures(teamId: number, count: number = 5): Promise<FixturesResponse> {
    const cacheKey = `fixtures_next_${teamId}_${count}`
    const cached = this.getCachedData<FixturesResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<FixturesResponse>('football-api', {
        endpoint: 'fixtures',
        params: {
          team: teamId,
          next: count
        }
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching team next fixtures:', error)
      throw error
    }
  }

  // 팀 최근 경기 가져오기
  async getTeamLastFixtures(teamId: number, count: number = 5): Promise<FixturesResponse> {
    const cacheKey = `fixtures_last_${teamId}_${count}`
    const cached = this.getCachedData<FixturesResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<FixturesResponse>('football-api', {
        endpoint: 'fixtures',
        params: {
          team: teamId,
          last: count
        }
      })
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching team last fixtures:', error)
      throw error
    }
  }

  // 캐시 클리어
  clearCache(): void {
    this.cache.clear()
  }

  // 특정 캐시 키 삭제
  clearCacheByKey(pattern: string): void {
    Array.from(this.cache.keys())
      .filter(key => key.includes(pattern))
      .forEach(key => this.cache.delete(key))
  }
}

// 싱글톤 인스턴스
const footballAPIService = new FootballAPIService()

// React Query 훅
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

export const useFixtures = (
  params: Parameters<typeof footballAPIService.getFixtures>[0],
  options?: UseQueryOptions<FixturesResponse>
) => {
  return useQuery({
    queryKey: ['fixtures', params],
    queryFn: () => footballAPIService.getFixtures(params),
    staleTime: 5 * 60 * 1000, // 5분
    ...options
  })
}

export const useFixturesByDate = (
  date: Date,
  options?: UseQueryOptions<FixturesResponse>
) => {
  return useQuery({
    queryKey: ['fixtures', 'date', formatDate(date)],
    queryFn: () => footballAPIService.getFixturesByDate(date),
    staleTime: 5 * 60 * 1000, // 5분
    ...options
  })
}

export const useLeagues = (
  params?: Parameters<typeof footballAPIService.getLeagues>[0],
  options?: UseQueryOptions<LeaguesResponse>
) => {
  return useQuery({
    queryKey: ['leagues', params],
    queryFn: () => footballAPIService.getLeagues(params),
    staleTime: 24 * 60 * 60 * 1000, // 24시간
    ...options
  })
}

export const useStandings = (
  params: Parameters<typeof footballAPIService.getStandings>[0],
  options?: UseQueryOptions<StandingsResponse>
) => {
  return useQuery({
    queryKey: ['standings', params],
    queryFn: () => footballAPIService.getStandings(params),
    staleTime: 60 * 60 * 1000, // 1시간
    ...options
  })
}

export const useLiveFixtures = (
  options?: UseQueryOptions<FixturesResponse>
) => {
  return useQuery({
    queryKey: ['fixtures', 'live'],
    queryFn: () => footballAPIService.getLiveFixtures(),
    staleTime: 30 * 1000, // 30초
    refetchInterval: 30 * 1000, // 30초마다 자동 갱신
    ...options
  })
}

export const useTeamSquad = (
  teamId: number,
  options?: UseQueryOptions<TeamSquadResponse>
) => {
  return useQuery({
    queryKey: ['squad', teamId],
    queryFn: () => footballAPIService.getTeamSquad({ team: teamId }),
    staleTime: 24 * 60 * 60 * 1000, // 24시간
    enabled: !!teamId,
    ...options
  })
}

export const useTransfers = (
  teamId: number,
  options?: UseQueryOptions<TransfersResponse>
) => {
  return useQuery({
    queryKey: ['transfers', teamId],
    queryFn: () => footballAPIService.getTransfers({ team: teamId }),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!teamId,
    ...options
  })
}

export default footballAPIService