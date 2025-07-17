import { supabase } from '@/lib/supabase/client'
import { 
  FixturesResponse, 
  LeaguesResponse, 
  StandingsResponse,
  TeamSquadResponse,
  TransfersResponse,
  getCurrentSeason,
  formatDate,
  SUPPORTED_LEAGUES,
  MAIN_LEAGUES
} from '@/lib/types/football'
import { TeamProfile, TeamStatistics } from '@/lib/types/team'
import { PlayerProfile, TopScorer, TopAssist } from '@/lib/types/player'
import { mockFixturesData } from './mockData'
import { largeMockFixturesData } from './largeMockData'

class FootballAPIService {
  private supabase = supabase
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
    // football-api 호출을 unified-football-api로 리다이렉트
    if (functionName === 'football-api' && params.endpoint) {
      return this.callUnifiedAPI<T>(params.endpoint, params.params || {})
    }
    
    const { data, error } = await this.supabase.functions.invoke(functionName, {
      body: params,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (error) {
      console.error(`Edge function error (${functionName}):`, error)
      throw new Error(error.message)
    }
    
    return data as T
  }

  // 통합 API 호출
  private async callUnifiedAPI<T>(endpoint: string, params: any): Promise<T> {
    console.log(`[FootballAPI] Calling unified-football-api with endpoint: ${endpoint}`, params)
    
    try {
      // 직접 fetch 사용 (Supabase client의 body 전송 문제 해결)
      const functionName = 'unified-football-api-fixed'
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30초 타임아웃
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify({ endpoint, params }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
      
      const data = await response.json()
      console.log(`[FootballAPI] Response status:`, response.status)
      
      if (!response.ok) {
        console.error(`[FootballAPI] API error (${endpoint}):`, data)
        throw new Error(data.error || 'API request failed')
      }
      
      // Check if response contains an error
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        console.error(`[FootballAPI] API returned error:`, data.error)
        throw new Error(data.error)
      }
      
      console.log(`[FootballAPI] API response for ${endpoint}: ${data.results || 0} results`)
      return data as T
    } catch (e: any) {
      // AbortError는 무시 (React Strict Mode로 인한 중복 요청 취소)
      if (e.name === 'AbortError') {
        console.log(`[FootballAPI] Request aborted for ${endpoint}`)
        throw e
      }
      console.error(`[FootballAPI] Exception calling ${endpoint}:`, e)
      throw e
    }
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
      const data = await this.callUnifiedAPI<FixturesResponse>('fixtures', params)
      
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching fixtures:', error)
      // 개발 환경에서는 mock 데이터 반환
      return mockFixturesData
    }
  }

  // 날짜별 모든 리그 경기 가져오기
  async getFixturesByDate(date: Date): Promise<FixturesResponse> {
    const formattedDate = formatDate(date)
    console.log('[FootballAPI] Fetching fixtures for date:', formattedDate)
    
    // 캐시 임시 비활성화
    // const cacheKey = `fixtures_date_${formattedDate}_all`
    // const cached = this.getCachedData<FixturesResponse>(cacheKey)
    // if (cached) {
    //   console.log('[FootballAPI] Returning cached data for date:', formattedDate)
    //   return cached
    // }

    console.log('[FootballAPI] Making API call for date:', formattedDate)
    
    try {
      // 날짜만으로 모든 경기 가져오기 (API가 다중 리그를 지원하지 않는 경우)
      const data = await this.callUnifiedAPI<FixturesResponse>('fixtures', { 
        date: formattedDate
      })
      
      if (data && data.response && Array.isArray(data.response)) {
        // 주요 리그만 필터링
        const filteredFixtures = data.response.filter(fixture => 
          MAIN_LEAGUES.includes(fixture.league.id)
        )
        
        const filteredResponse: FixturesResponse = {
          ...data,
          results: filteredFixtures.length,
          response: filteredFixtures
        }
        
        console.log(`[FootballAPI] Got ${data.response.length} total fixtures, filtered to ${filteredFixtures.length} from main leagues`)
        // this.setCachedData(cacheKey, filteredResponse) // 캐시 임시 비활성화
        return filteredResponse
      }
      
      // 결과가 없으면 빈 응답 반환
      console.log('[FootballAPI] No fixtures found for date:', formattedDate)
      const emptyResponse: FixturesResponse = {
        get: "fixtures",
        parameters: { date: formattedDate },
        errors: [],
        results: 0,
        paging: { current: 1, total: 1 },
        response: []
      }
      return emptyResponse
    } catch (error) {
      console.error('[FootballAPI] Error fetching fixtures by date:', error)
      console.error('[FootballAPI] Error stack:', (error as any).stack)
      console.error('[FootballAPI] Error details:', JSON.stringify(error, null, 2))
      
      // Re-throw the error to let React Query handle it
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
      // 리그 API는 football-api Edge Function 사용
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

  // 팀 프로필 가져오기
  async getTeamProfile(teamId: number): Promise<TeamProfile> {
    const cacheKey = `team_profile_${teamId}`
    const cached = this.getCachedData<TeamProfile>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'teams',
        params: { id: teamId }
      })
      
      const teamProfile = data.response[0] as TeamProfile
      this.setCachedData(cacheKey, teamProfile)
      return teamProfile
    } catch (error) {
      console.error('Error fetching team profile:', error)
      throw error
    }
  }

  // 팀 통계 가져오기
  async getTeamStatistics(teamId: number, season: number, leagueId: number): Promise<TeamStatistics> {
    const cacheKey = `team_stats_${teamId}_${season}_${leagueId}`
    const cached = this.getCachedData<TeamStatistics>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'teams/statistics',
        params: {
          team: teamId,
          season: season,
          league: leagueId
        }
      })
      
      const teamStats = data.response as TeamStatistics
      this.setCachedData(cacheKey, teamStats)
      return teamStats
    } catch (error) {
      console.error('Error fetching team statistics:', error)
      throw error
    }
  }

  // 선수 프로필 가져오기
  async getPlayerProfile(playerId: number, season: number): Promise<PlayerProfile> {
    const cacheKey = `player_profile_${playerId}_${season}`
    const cached = this.getCachedData<PlayerProfile>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'players',
        params: {
          id: playerId,
          season: season
        }
      })
      
      const playerProfile = data.response[0] as PlayerProfile
      this.setCachedData(cacheKey, playerProfile)
      return playerProfile
    } catch (error) {
      console.error('Error fetching player profile:', error)
      throw error
    }
  }

  // 득점왕 가져오기
  async getTopScorers(leagueId: number, season: number): Promise<TopScorer[]> {
    const cacheKey = `top_scorers_${leagueId}_${season}`
    const cached = this.getCachedData<TopScorer[]>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'players/topscorers',
        params: {
          league: leagueId,
          season: season
        }
      })
      
      const topScorers = data.response as TopScorer[]
      this.setCachedData(cacheKey, topScorers)
      return topScorers
    } catch (error) {
      console.error('Error fetching top scorers:', error)
      throw error
    }
  }

  // 도움왕 가져오기
  async getTopAssists(leagueId: number, season: number): Promise<TopAssist[]> {
    const cacheKey = `top_assists_${leagueId}_${season}`
    const cached = this.getCachedData<TopAssist[]>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'players/topassists',
        params: {
          league: leagueId,
          season: season
        }
      })
      
      const topAssists = data.response as TopAssist[]
      this.setCachedData(cacheKey, topAssists)
      return topAssists
    } catch (error) {
      console.error('Error fetching top assists:', error)
      throw error
    }
  }

  // 검색 - 팀
  async searchTeams(query: string): Promise<any[]> {
    const cacheKey = `search_teams_${query}`
    const cached = this.getCachedData<any[]>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'teams',
        params: { search: query }
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error searching teams:', error)
      throw error
    }
  }

  // 검색 - 선수
  async searchPlayers(query: string): Promise<any[]> {
    const cacheKey = `search_players_${query}`
    const cached = this.getCachedData<any[]>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'players',
        params: { search: query }
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error searching players:', error)
      throw error
    }
  }

  // 경기 상세 정보
  async getFixtureDetails(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_details_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'fixtures',
        params: { id: fixtureId }
      })
      
      const fixtureDetails = data.response[0]
      this.setCachedData(cacheKey, fixtureDetails)
      return fixtureDetails
    } catch (error) {
      console.error('Error fetching fixture details:', error)
      throw error
    }
  }

  // 경기 라인업
  async getFixtureLineups(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_lineups_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'fixtures/lineups',
        params: { fixture: fixtureId }
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error fetching fixture lineups:', error)
      throw error
    }
  }

  // 경기 통계
  async getFixtureStatistics(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_statistics_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'fixtures/statistics',
        params: { fixture: fixtureId }
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error fetching fixture statistics:', error)
      throw error
    }
  }

  // 경기 이벤트
  async getFixtureEvents(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_events_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'fixtures/events',
        params: { fixture: fixtureId }
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error fetching fixture events:', error)
      throw error
    }
  }

  // 경기 선수 통계
  async getFixturePlayers(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_players_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callEdgeFunction<any>('football-api', {
        endpoint: 'fixtures/players',
        params: { fixture: fixtureId }
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error fetching fixture players:', error)
      throw error
    }
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
  options?: any
) => {
  const query = useQuery({
    queryKey: ['fixtures', 'date', formatDate(date)],
    queryFn: async () => {
      const result = await footballAPIService.getFixturesByDate(date)
      return result
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시
    gcTime: 10 * 60 * 1000, // 10분 가비지 컬렉션
    retry: (failureCount, error: any) => {
      // AbortError는 재시도하지 않음
      if (error?.name === 'AbortError') return false
      // 다른 에러는 최대 1번만 재시도
      return failureCount < 1
    },
    retryDelay: 1000,
    ...options
  })
  
  return query
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

export const useTeamProfile = (
  teamId: number,
  options?: UseQueryOptions<TeamProfile>
) => {
  return useQuery({
    queryKey: ['teamProfile', teamId],
    queryFn: () => footballAPIService.getTeamProfile(teamId),
    staleTime: 24 * 60 * 60 * 1000, // 24시간
    enabled: !!teamId,
    ...options
  })
}

export const useTeamStatistics = (
  teamId: number,
  season: number,
  leagueId: number,
  options?: UseQueryOptions<TeamStatistics>
) => {
  return useQuery({
    queryKey: ['teamStats', teamId, season, leagueId],
    queryFn: () => footballAPIService.getTeamStatistics(teamId, season, leagueId),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!teamId && !!season && !!leagueId,
    ...options
  })
}

export const usePlayerProfile = (
  playerId: number,
  season: number,
  options?: UseQueryOptions<PlayerProfile>
) => {
  return useQuery({
    queryKey: ['playerProfile', playerId, season],
    queryFn: () => footballAPIService.getPlayerProfile(playerId, season),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!playerId && !!season,
    ...options
  })
}

export const useTopScorers = (
  leagueId: number,
  season: number,
  options?: UseQueryOptions<TopScorer[]>
) => {
  return useQuery({
    queryKey: ['topScorers', leagueId, season],
    queryFn: () => footballAPIService.getTopScorers(leagueId, season),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!leagueId && !!season,
    ...options
  })
}

export const useTopAssists = (
  leagueId: number,
  season: number,
  options?: UseQueryOptions<TopAssist[]>
) => {
  return useQuery({
    queryKey: ['topAssists', leagueId, season],
    queryFn: () => footballAPIService.getTopAssists(leagueId, season),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!leagueId && !!season,
    ...options
  })
}

export const useLeagueDetails = (
  leagueId: number,
  options?: UseQueryOptions<LeaguesResponse>
) => {
  return useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => footballAPIService.getLeagues({ id: leagueId }),
    staleTime: 24 * 60 * 60 * 1000, // 24시간
    enabled: !!leagueId,
    ...options
  })
}

export const useLeagueStandings = (
  leagueId: number,
  season: number,
  options?: UseQueryOptions<StandingsResponse>
) => {
  return useQuery({
    queryKey: ['standings', leagueId, season],
    queryFn: () => footballAPIService.getStandings({ league: leagueId, season }),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!leagueId && !!season,
    ...options
  })
}

export const useLeagueFixtures = (
  leagueId: number,
  season: number,
  options?: UseQueryOptions<FixturesResponse>
) => {
  return useQuery({
    queryKey: ['leagueFixtures', leagueId, season],
    queryFn: () => footballAPIService.getFixtures({ league: leagueId, season }),
    staleTime: 30 * 60 * 1000, // 30분
    enabled: !!leagueId && !!season,
    ...options
  })
}

export const useFixtureDetail = (
  fixtureId: number,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: ['fixtureDetail', fixtureId],
    queryFn: async () => {
      // 경기 상세 정보 가져오기
      const fixtureData = await footballAPIService.getFixtureDetails(fixtureId)
      
      // 추가 정보들을 병렬로 가져오기
      const [statistics, lineups, events, players] = await Promise.allSettled([
        footballAPIService.getFixtureStatistics(fixtureId),
        footballAPIService.getFixtureLineups(fixtureId),
        footballAPIService.getFixtureEvents(fixtureId),
        footballAPIService.getFixturePlayers(fixtureId)
      ])
      
      // 결과 병합
      const fixture = { ...fixtureData }
      
      if (statistics.status === 'fulfilled' && statistics.value) {
        fixture.statistics = statistics.value
      }
      if (lineups.status === 'fulfilled' && lineups.value) {
        fixture.lineups = lineups.value
      }
      if (events.status === 'fulfilled' && events.value) {
        fixture.events = events.value
      }
      if (players.status === 'fulfilled' && players.value) {
        fixture.players = players.value
      }
      
      return { 
        get: "fixtures",
        parameters: { id: fixtureId },
        errors: [],
        results: 1,
        paging: { current: 1, total: 1 },
        response: [fixture] 
      }
    },
    staleTime: 60 * 1000, // 1분 (라이브 경기를 위해 짧게 설정)
    enabled: !!fixtureId,
    ...options
  })
}

export default footballAPIService