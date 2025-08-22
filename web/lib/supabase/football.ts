import { getSupabaseClient } from '@/lib/supabase/client-singleton'
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
import { apiCache, CacheConfig, CacheTTL } from '../utils/api-cache-manager'
import { withRateLimit } from '../utils/rate-limit-manager'

class FootballAPIService {
  private supabase = null as ReturnType<typeof getSupabaseClient> | null
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.supabase = getSupabaseClient()
    }
  }
  protected cache = new Map<string, { data: any; timestamp: number }>()
  private CACHE_DURATION = 5 * 60 * 1000 // 5분 캐시
  private lastRequestTime = 0
  private REQUEST_DELAY = 200 // 200ms delay between API requests
  
  // 캐시 헬퍼
  protected getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T
    }
    return null
  }
  
  protected setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  // Edge Function 호출 헬퍼 (캐싱 및 레이트 리밋 적용)
  private async callEdgeFunction<T>(functionName: string, params: any): Promise<T> {
    // football-api 호출을 unified-football-api로 리다이렉트
    if (functionName === 'football-api' && params.endpoint) {
      return this.callUnifiedAPI<T>(params.endpoint, params.params || {})
    }
    
    // 캐시 키 생성
    const cacheKey = `${functionName}:${JSON.stringify(params)}`
    const endpoint = params.endpoint || functionName
    
    // 캐시 TTL 결정
    const ttl = CacheConfig[endpoint] || CacheTTL.MEDIUM
    
    // 라이브 데이터는 캐싱하지 않음
    const skipCache = endpoint === 'fixtures' && params.params?.live === 'all'
    
    return apiCache.withCache(
      async () => {
        // 레이트 리밋 적용
        return withRateLimit(async () => {
          const { data, error } = await this.supabase.functions.invoke(functionName, {
            body: params,
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          if (error) throw error
          return data as T
        }, endpoint)
      },
      endpoint,
      { 
        ttl: skipCache ? 0 : ttl,
        key: cacheKey,
        forceRefresh: skipCache
      }
    )
  }

  // 통합 API 호출
  protected async callUnifiedAPI<T>(endpoint: string, params: any): Promise<T> {
    // Rate limiting - ensure minimum delay between requests
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
    
    console.log(`[FootballAPI] Calling unified-football-api with endpoint: ${endpoint}`, params)
    
    try {
      // 직접 fetch 사용 (Supabase client의 body 전송 문제 해결)
      const functionName = 'unified-football-api'
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uutmymaxkkytibuiiaax.supabase.co'
      const url = `${supabaseUrl}/functions/v1/${functionName}`
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM'
      
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
        // 유럽 5대 리그, MLS, K리그, 유럽 대회만 필터링
        const ALLOWED_LEAGUES = [
          39,  // Premier League
          140, // La Liga
          135, // Serie A
          78,  // Bundesliga
          61,  // Ligue 1
          253, // MLS
          292, // K League 1
          293, // K League 2
          2,   // Champions League
          3,   // Europa League
          848, // Conference League
        ]
        
        const filteredFixtures = data.response.filter(fixture => 
          ALLOWED_LEAGUES.includes(fixture.league.id)
        )
        
        const filteredResponse: FixturesResponse = {
          ...data,
          results: filteredFixtures.length,
          response: filteredFixtures
        }
        
        console.log(`[FootballAPI] Got ${data.response.length} total fixtures, filtered to ${filteredFixtures.length} (Premier, LaLiga, SerieA, Bundesliga, Ligue1, MLS, K-League only)`)
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
      // 리그 API 호출
      const data = await this.callUnifiedAPI<LeaguesResponse>('leagues', params || {})
      
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
      const data = await this.callUnifiedAPI<StandingsResponse>('standings', params)
      
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
    const cacheKey = `squad_${params.team}_${new Date().getFullYear()}`
    const cached = this.getCachedData<TeamSquadResponse>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<TeamSquadResponse>('players/squads', {
        team: params.team
      })
      
      if (data) {
        this.setCachedData(cacheKey, data)
        return data
      }
      
      throw new Error('Team squad not found')
    } catch (error) {
      console.error('Error fetching team squad:', error)
      throw error
    }
  }

  // 이적 정보 가져오기 (최근 1년간)
  async getTransfers(params: {
    team: number
  }): Promise<TransfersResponse> {
    const currentYear = new Date().getFullYear()
    const cacheKey = `transfers_${params.team}_recent_1year`
    const cached = this.getCachedData<TransfersResponse>(cacheKey)
    if (cached) return cached

    try {
      // 현재 시즌과 이전 시즌의 이적 정보만 가져오기 (더 넓은 범위)
      const transferParams = {
        ...params
        // 시즌 제한 제거하여 더 많은 데이터 가져오기
      }
      
      const data = await this.callUnifiedAPI<TransfersResponse>('transfers', transferParams)
      
      // console.log(`[FootballAPI] Raw transfers data for team ${params.team}:`, JSON.stringify(data, null, 2))
      
      // 데이터를 날짜순으로 정렬 (최신순)
      if (data?.response && Array.isArray(data.response)) {
        data.response = data.response
          .map((transfer: any) => ({
            ...transfer,
            transfers: transfer.transfers
              ?.filter((t: any) => {
                if (!t.date) return false
                
                // 날짜 파싱 함수
                const parseTransferDate = (dateStr: string): Date => {
                  if (dateStr.includes('-')) {
                    return new Date(dateStr)
                  } else if (dateStr.length === 6) {
                    // YYMMDD 형식인 경우 (180801 = 2018년 8월 1일)
                    let year = parseInt(dateStr.substring(0, 2))
                    const month = dateStr.substring(2, 4)
                    const day = dateStr.substring(4, 6)
                    
                    // 년도 보정: 80년대 이후는 19xx, 그 이전은 20xx로 추정
                    if (year >= 80) {
                      year += 1900
                    } else {
                      year += 2000
                    }
                    
                    return new Date(`${year}-${month}-${day}`)
                  } else if (dateStr.length === 8) {
                    // YYYYMMDD 형식인 경우
                    const year = dateStr.substring(0, 4)
                    const month = dateStr.substring(4, 6)
                    const day = dateStr.substring(6, 8)
                    return new Date(`${year}-${month}-${day}`)
                  } else {
                    return new Date(dateStr)
                  }
                }
                
                const transferDate = parseTransferDate(t.date)
                const now = new Date()
                const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)) // 정확히 365일 전
                const isWithinOneYear = transferDate >= oneYearAgo
                // console.log(`[Transfer Filter] Player: ${transfer.player?.name}, Date: ${t.date}, Parsed: ${transferDate}, OneYearAgo: ${oneYearAgo}, Within 1 year: ${isWithinOneYear}`)
                return isWithinOneYear // 정확히 최근 1년
              })
              ?.sort((a: any, b: any) => {
                // 같은 날짜 파싱 함수 사용
                const parseTransferDate = (dateStr: string): Date => {
                  if (dateStr.includes('-')) {
                    return new Date(dateStr)
                  } else if (dateStr.length === 6) {
                    // YYMMDD 형식인 경우
                    let year = parseInt(dateStr.substring(0, 2))
                    const month = dateStr.substring(2, 4)
                    const day = dateStr.substring(4, 6)
                    
                    if (year >= 80) {
                      year += 1900
                    } else {
                      year += 2000
                    }
                    
                    return new Date(`${year}-${month}-${day}`)
                  } else if (dateStr.length === 8) {
                    const year = dateStr.substring(0, 4)
                    const month = dateStr.substring(4, 6)
                    const day = dateStr.substring(6, 8)
                    return new Date(`${year}-${month}-${day}`)
                  } else {
                    return new Date(dateStr)
                  }
                }
                return parseTransferDate(b.date).getTime() - parseTransferDate(a.date).getTime() // 최신순 정렬
              })
          }))
          .filter((transfer: any) => transfer.transfers && transfer.transfers.length > 0) // 빈 이적 기록 제거
      }
      
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
      const data = await this.callUnifiedAPI<FixturesResponse>('fixtures', { live: 'all' })
      
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
      const data = await this.callUnifiedAPI<FixturesResponse>('fixtures', {
        team: teamId,
        next: count
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
      const data = await this.callUnifiedAPI<FixturesResponse>('fixtures', {
        team: teamId,
        last: count
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
    console.log('[FootballAPI] getTeamProfile called with teamId:', teamId)
    const cacheKey = `team_profile_${teamId}`
    const cached = this.getCachedData<TeamProfile>(cacheKey)
    if (cached) {
      console.log('[FootballAPI] Returning cached team profile for:', teamId)
      return cached
    }

    try {
      console.log('[FootballAPI] Fetching team profile from API for:', teamId)
      const data = await this.callUnifiedAPI<{ response: TeamProfile[] }>('teams', { 
        id: teamId 
      })
      
      console.log('[FootballAPI] Team profile API response:', data)
      console.log('[FootballAPI] Team profile response structure:', {
        hasResponse: !!data?.response,
        responseLength: data?.response?.length,
        firstItem: data?.response?.[0]
      })
      
      if (data && data.response && data.response.length > 0) {
        const teamProfile = data.response[0] as TeamProfile
        console.log('[FootballAPI] Extracted team profile:', teamProfile)
        this.setCachedData(cacheKey, teamProfile)
        return teamProfile
      }
      
      throw new Error('Team not found')
    } catch (error) {
      console.error('[FootballAPI] Error fetching team profile for teamId', teamId, ':', error)
      throw error
    }
  }

  // 팀 통계 가져오기
  async getTeamStatistics(teamId: number, season: number, leagueId: number): Promise<TeamStatistics> {
    const cacheKey = `team_stats_${teamId}_${season}_${leagueId}`
    const cached = this.getCachedData<TeamStatistics>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<{ response: TeamStatistics }>('teams/statistics', {
        team: teamId,
        season: season,
        league: leagueId
      })
      
      if (data && data.response) {
        const teamStats = data.response as TeamStatistics
        this.setCachedData(cacheKey, teamStats)
        return teamStats
      }
      
      throw new Error('Team statistics not found')
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
      const data = await this.callUnifiedAPI<any>('players', {
        id: playerId,
        season: season
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
      const data = await this.callUnifiedAPI<any>('players/topscorers', {
        league: leagueId,
        season: season
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
      const data = await this.callUnifiedAPI<any>('players/topassists', {
        league: leagueId,
        season: season
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
      const data = await this.callUnifiedAPI<any>('teams', {
        search: query
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
      const data = await this.callUnifiedAPI<any>('players', {
        search: query
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error searching players:', error)
      throw error
    }
  }

  // 경기 상세 정보
  // 팀의 최근 경기 가져오기
  async getTeamFixtures(teamId: number, limit: number = 5): Promise<any> {
    try {
      const data = await this.callUnifiedAPI<any>('fixtures', {
        team: teamId,
        last: limit
      })
      
      if (data?.response && Array.isArray(data.response)) {
        // 각 경기에 대해 상세 정보 가져오기 (라인업 포함)
        const fixturesWithDetails = await Promise.all(
          data.response.map(async (fixture: any) => {
            // 경기가 이미 끝난 경우에만 라인업 가져오기
            if (['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)) {
              try {
                // fixtures 엔드포인트로 상세 정보 가져오기
                const detailData = await this.callUnifiedAPI<any>('fixtures', {
                  id: fixture.fixture.id
                })
                
                if (detailData?.response?.[0]) {
                  const fullFixture = detailData.response[0]
                  // 라인업이 포함된 전체 데이터 반환
                  console.log('[FootballAPI] Fixture data for', fixture.fixture.id, 'has lineups:', !!fullFixture.lineups)
                  return fullFixture
                }
              } catch (error) {
                console.log('[FootballAPI] Could not fetch details for fixture:', fixture.fixture.id)
              }
            }
            return fixture
          })
        )
        
        return fixturesWithDetails
      }
      
      return []
    } catch (error) {
      console.error('[FootballAPI] Error fetching team fixtures:', error)
      return []
    }
  }
  
  // 리그 순위 가져오기
  async getLeagueStandings(leagueId: number, season?: number): Promise<any> {
    try {
      const currentSeason = season || new Date().getFullYear()
      console.log('[FootballAPI] Fetching standings for league:', leagueId, 'season:', currentSeason)
      
      const data = await this.callUnifiedAPI<any>('standings', {
        league: leagueId,
        season: currentSeason
      })
      
      console.log('[FootballAPI] Standings response:', data)
      
      if (data?.response && Array.isArray(data.response) && data.response.length > 0) {
        return data.response[0].league.standings
      }
      
      return []
    } catch (error) {
      console.error('[FootballAPI] Error fetching standings:', error)
      return []
    }
  }

  // 상대전적 가져오기
  async getH2HFixtures(team1Id: number, team2Id: number, limit: number = 10): Promise<any> {
    try {
      console.log('[FootballAPI] Fetching H2H between teams:', team1Id, team2Id)
      
      const data = await this.callUnifiedAPI<any>('fixtures/headtohead', {
        h2h: `${team1Id}-${team2Id}`,
        last: limit
      })
      
      console.log('[FootballAPI] H2H response:', data)
      
      if (data?.response && Array.isArray(data.response)) {
        return data.response
      }
      
      return []
    } catch (error) {
      console.error('[FootballAPI] Error fetching H2H:', error)
      return []
    }
  }

  // 팀 부상 선수 정보 가져오기
  async getTeamInjuries(teamId: number): Promise<any> {
    try {
      console.log('[FootballAPI] Fetching injuries for team:', teamId)
      
      // injuries 엔드포인트 호출 (현재 시즌)
      const currentSeason = new Date().getFullYear()
      const data = await this.callUnifiedAPI<any>('injuries', {
        team: teamId,
        season: currentSeason
      })
      
      console.log('[FootballAPI] Injuries response:', data)
      
      if (data?.response && Array.isArray(data.response)) {
        // 현재 부상 중인 선수만 필터링 (최근 데이터)
        const currentDate = new Date()
        const activeInjuries = data.response.filter((injury: any) => {
          // fixture.date가 없거나 현재 날짜에 가까운 부상만 포함
          if (!injury.fixture?.date) return true
          
          const injuryDate = new Date(injury.fixture.date)
          const daysDiff = Math.floor((currentDate.getTime() - injuryDate.getTime()) / (1000 * 60 * 60 * 24))
          
          // 최근 30일 이내의 부상 정보만 표시
          return daysDiff <= 30
        })
        
        console.log('[FootballAPI] Active injuries found:', activeInjuries.length)
        return activeInjuries
      }
      
      return []
    } catch (error) {
      console.error('[FootballAPI] Error fetching team injuries:', error)
      
      // 대체 방법: 팀 스쿼드에서 부상 정보 확인
      try {
        console.log('[FootballAPI] Trying alternative: squad endpoint')
        const squadData = await this.callUnifiedAPI<any>('players/squads', {
          team: teamId
        })
        
        if (squadData?.response?.[0]?.players) {
          const injuredPlayers = squadData.response[0].players
            .filter((player: any) => player.injured === true)
            .map((player: any) => ({
              player: {
                id: player.id,
                name: player.name,
                photo: player.photo,
                type: 'Injured',
                reason: 'Injury',
                position: player.position
              }
            }))
          
          console.log('[FootballAPI] Injured players from squad:', injuredPlayers.length)
          return injuredPlayers
        }
      } catch (squadError) {
        console.error('[FootballAPI] Squad endpoint also failed:', squadError)
      }
      
      return []
    }
  }
  
  async getFixtureDetails(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_details_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      // fixtures 엔드포인트로 전체 정보 가져오기
      const data = await this.callUnifiedAPI<any>('fixtures', {
        id: fixtureId
      })
      
      if (!data?.response?.[0]) {
        throw new Error('No fixture data found')
      }
      
      const fixtureDetails = data.response[0]
      
      // 라인업 데이터를 Supabase에 캐싱
      if (fixtureDetails.lineups && fixtureDetails.lineups.length > 0) {
        this.cacheTeamLineups(fixtureDetails).catch(err => 
          console.error('[FootballAPI] Failed to cache lineups:', err)
        )
      }
      
      // 라인업이 없으면 players 엔드포인트도 시도
      if (!fixtureDetails.lineups || fixtureDetails.lineups.length === 0) {
        try {
          console.log('[FootballAPI] No lineups in fixture, trying players endpoint')
          const playersData = await this.callUnifiedAPI<any>('fixtures/players', {
            fixture: fixtureId
          })
          
          if (playersData?.response && Array.isArray(playersData.response)) {
            fixtureDetails.players = playersData.response
            
            // players 데이터에서 라인업 구성
            const lineups = playersData.response.map((team: any) => {
              const startingXI = team.players
                ?.filter((p: any) => 
                  p.statistics?.[0]?.games?.position && 
                  p.statistics?.[0]?.games?.position !== 'S' &&
                  p.statistics?.[0]?.games?.minutes > 0
                )
                .map((p: any) => ({
                  player: {
                    id: p.player.id,
                    name: p.player.name,
                    number: p.statistics?.[0]?.games?.number || 0,
                    pos: p.statistics?.[0]?.games?.position,
                    grid: p.player?.grid || null  // grid 정보 포함
                  }
                })) || []
              
              // 포메이션 추론
              let formation = '4-3-3'
              if (startingXI.length === 11) {
                const defenders = startingXI.filter((p: any) => p.player.pos === 'D').length
                const midfielders = startingXI.filter((p: any) => p.player.pos === 'M').length
                const forwards = startingXI.filter((p: any) => p.player.pos === 'F').length
                
                if (defenders && midfielders && forwards) {
                  formation = `${defenders}-${midfielders}-${forwards}`
                }
              }
              
              return {
                team: team.team,
                formation: formation,
                startXI: startingXI,
                substitutes: team.players
                  ?.filter((p: any) => p.statistics?.[0]?.games?.position === 'S')
                  .map((p: any) => ({
                    player: {
                      id: p.player.id,
                      name: p.player.name,
                      number: p.statistics?.[0]?.games?.number || 0,
                      pos: 'S'
                    }
                  })) || []
              }
            })
            
            if (lineups.length > 0 && lineups.some((l: any) => l.startXI.length > 0)) {
              fixtureDetails.lineups = lineups
              console.log('[FootballAPI] Lineups extracted from players data')
            }
          }
        } catch (playersError) {
          console.log('[FootballAPI] Could not fetch players data:', playersError)
        }
      }
      
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
      console.log('[FootballAPI] Fetching lineups for fixture:', fixtureId)
      
      // fixtures/lineups 엔드포인트 직접 호출
      try {
        const lineupData = await this.callUnifiedAPI<any>('fixtures/lineups', {
          fixture: fixtureId
        })
        
        console.log('[FootballAPI] Lineups API response:', lineupData)
        
        if (lineupData?.response && Array.isArray(lineupData.response)) {
          this.setCachedData(cacheKey, lineupData.response)
          return lineupData.response
        }
      } catch (lineupError) {
        console.log('[FootballAPI] Lineups endpoint not available, trying fixtures endpoint')
      }
      
      // Fallback: fixtures 엔드포인트에서 라인업 추출
      const fixtureData = await this.callUnifiedAPI<any>('fixtures', {
        id: fixtureId
      })
      
      console.log('[FootballAPI] Fixture data received, checking for lineups')
      
      if (fixtureData?.response?.[0]) {
        const fixture = fixtureData.response[0]
        
        // lineups 필드 확인
        if (fixture.lineups && Array.isArray(fixture.lineups)) {
          console.log('[FootballAPI] Found lineups in fixture:', fixture.lineups.length, 'teams')
          this.setCachedData(cacheKey, fixture.lineups)
          return fixture.lineups
        }
        
        // players 필드에서 라인업 추출 시도
        if (fixture.players && Array.isArray(fixture.players)) {
          console.log('[FootballAPI] Extracting lineups from players data')
          const lineups = fixture.players.map((team: any) => ({
            team: team.team,
            formation: null,
            startXI: team.players
              ?.filter((p: any) => p.statistics?.[0]?.games?.position !== 'S')
              ?.slice(0, 11)
              ?.map((p: any) => ({
                player: {
                  id: p.player.id,
                  name: p.player.name,
                  number: p.statistics?.[0]?.games?.number || 0,
                  pos: p.statistics?.[0]?.games?.position
                }
              })) || []
          }))
          
          if (lineups.length > 0 && lineups[0].startXI.length > 0) {
            this.setCachedData(cacheKey, lineups)
            return lineups
          }
        }
      }
      
      console.log('[FootballAPI] No lineup data available')
      return []
    } catch (error) {
      console.error('[FootballAPI] Error fetching fixture lineups:', error)
      return []
    }
  }

  // 경기 통계
  async getFixtureStatistics(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_statistics_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/statistics', {
        fixture: fixtureId
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
      const data = await this.callUnifiedAPI<any>('fixtures/events', {
        fixture: fixtureId
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error fetching fixture events:', error)
      throw error
    }
  }

  // H2H 상대전적 가져오기
  async getH2H(team1: number, team2: number): Promise<any> {
    const cacheKey = `h2h_${team1}_${team2}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/h2h', {
        h2h: `${team1}-${team2}`
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error fetching H2H:', error)
      throw error
    }
  }

  // 경기 선수 통계
  async getFixturePlayers(fixtureId: number): Promise<any> {
    const cacheKey = `fixture_players_${fixtureId}`
    const cached = this.getCachedData<any>(cacheKey)
    if (cached) return cached

    try {
      const data = await this.callUnifiedAPI<any>('fixtures/players', {
        fixture: fixtureId
      })
      
      this.setCachedData(cacheKey, data.response)
      return data.response
    } catch (error) {
      console.error('Error fetching fixture players:', error)
      throw error
    }
  }
  
  // 팀 라인업을 Supabase에 캐싱
  private async cacheTeamLineups(fixture: any): Promise<void> {
    if (!fixture.lineups || !Array.isArray(fixture.lineups)) return
    
    const client = createClientComponentClient()
    
    for (const teamLineup of fixture.lineups) {
      if (!teamLineup.team || !teamLineup.startXI) continue
      
      try {
        const lineupData = {
          team_id: teamLineup.team.id,
          team_name: teamLineup.team.name,
          fixture_id: fixture.fixture.id,
          fixture_date: fixture.fixture.date,
          formation: teamLineup.formation || 'Unknown',
          lineup: teamLineup.startXI,
          substitutes: teamLineup.substitutes || [],
          coach: teamLineup.coach || null,
          league_id: fixture.league?.id || null,
          league_name: fixture.league?.name || null,
          opponent_id: fixture.teams.home.id === teamLineup.team.id 
            ? fixture.teams.away.id 
            : fixture.teams.home.id,
          opponent_name: fixture.teams.home.id === teamLineup.team.id 
            ? fixture.teams.away.name 
            : fixture.teams.home.name,
          is_home: fixture.teams.home.id === teamLineup.team.id,
          updated_at: new Date().toISOString()
        }
        
        const { error } = await client
          .from('team_recent_lineups')
          .upsert(lineupData, {
            onConflict: 'team_id,fixture_id'
          })
          
        if (error) {
          console.error('[FootballAPI] Error caching lineup:', error)
        } else {
          console.log(`[FootballAPI] Cached lineup for ${teamLineup.team.name}`)
        }
      } catch (err) {
        console.error('[FootballAPI] Error processing lineup cache:', err)
      }
    }
  }
  
  // 캐시된 최근 라인업 가져오기
  async getCachedRecentLineup(teamId: number): Promise<any> {
    const client = createClientComponentClient()
    
    try {
      const { data, error } = await client
        .from('team_recent_lineups')
        .select('*')
        .eq('team_id', teamId)
        .order('fixture_date', { ascending: false })
        .limit(1)
        .single()
      
      if (error) {
        console.log('[FootballAPI] No cached lineup found:', error)
        return null
      }
      
      if (data) {
        console.log(`[FootballAPI] Found cached lineup for team ${teamId} from ${data.fixture_date}`)
        // 포메이션 정규화: 4-5-1을 4-2-3-1로 변환
        if (data.formation === '4-5-1' && data.lineup) {
          const defenders = data.lineup.filter((p: any) => 
            p.player?.pos === 'D' || p.pos === 'D'
          ).length
          const midfielders = data.lineup.filter((p: any) => 
            p.player?.pos === 'M' || p.pos === 'M'
          ).length
          const forwards = data.lineup.filter((p: any) => 
            p.player?.pos === 'F' || p.pos === 'F'
          ).length
          
          // 4명의 수비수, 5명의 미드필더, 1명의 공격수면 4-2-3-1로 변환
          if (defenders === 4 && midfielders === 5 && forwards === 1) {
            data.formation = '4-2-3-1'
          }
        }
        return data
      }
    } catch (err) {
      console.error('[FootballAPI] Error fetching cached lineup:', err)
    }
    
    return null
  }
}

// 싱글톤 인스턴스
const footballAPIService = new FootballAPIService()

// Export the class for direct use
export { FootballAPIService }

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

export const useTeamNextFixtures = (
  teamId: number,
  options?: UseQueryOptions<FixturesResponse>
) => {
  return useQuery({
    queryKey: ['teamNextFixtures', teamId],
    queryFn: () => footballAPIService.getTeamNextFixtures(teamId),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!teamId,
    ...options
  })
}

export const useTeamLastFixtures = (
  teamId: number,
  options?: UseQueryOptions<FixturesResponse>
) => {
  return useQuery({
    queryKey: ['teamLastFixtures', teamId],
    queryFn: () => footballAPIService.getTeamLastFixtures(teamId),
    staleTime: 60 * 60 * 1000, // 1시간
    enabled: !!teamId,
    ...options
  })
}

export const useTeamTransfers = (
  teamId: number,
  options?: UseQueryOptions<TransfersResponse>
) => {
  return useQuery({
    queryKey: ['teamTransfers', teamId],
    queryFn: () => footballAPIService.getTransfers({ team: teamId }),
    staleTime: 24 * 60 * 60 * 1000, // 24시간
    enabled: !!teamId,
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
      
      // 결과 병합 - response 배열만 추출
      const fixture = { ...fixtureData }
      
      if (statistics.status === 'fulfilled' && statistics.value?.response) {
        fixture.statistics = statistics.value.response
      }
      if (lineups.status === 'fulfilled' && lineups.value?.response) {
        fixture.lineups = lineups.value.response
      }
      if (events.status === 'fulfilled' && events.value?.response) {
        fixture.events = events.value.response
      }
      if (players.status === 'fulfilled' && players.value?.response) {
        fixture.players = players.value.response
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