/**
 * Free API Live Football Data Service
 * https://free-api-live-football-data.p.rapidapi.com
 * 
 * 월 20,000건 요청 가능, rate limit 없음
 * 더 상세한 경기 통계 제공
 */

export class FreeFootballAPIService {
  private baseURL = 'https://free-api-live-football-data.p.rapidapi.com'
  private headers = {
    'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4',
    'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
  }
  
  // 캐시 저장소
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5분

  /**
   * API 호출 기본 메서드
   */
  private async callAPI<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const queryString = params ? 
        '?' + Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&') : ''
      const url = `${this.baseURL}/${endpoint}${queryString}`
      
      // 캐시 확인
      const cacheKey = url
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('[FreeFootballAPI] Returning cached data for:', endpoint)
        return cached.data
      }
      
      console.log('[FreeFootballAPI] Calling:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 캐시 저장
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      
      return data as T
    } catch (error) {
      console.error('[FreeFootballAPI] Error:', error)
      throw error
    }
  }

  /**
   * 경기 상세 통계 가져오기
   * 더 많은 통계 정보 제공 (패스 성공률, 점유율, xG 등)
   */
  async getMatchEventAllStats(eventId: number) {
    return this.callAPI('football-get-match-event-all-stats', { eventid: eventId })
  }

  /**
   * 실시간 경기 목록
   */
  async getLiveMatches() {
    return this.callAPI('football-live-matches-list')
  }

  /**
   * 오늘 경기 목록
   */
  async getTodayMatches() {
    return this.callAPI('football-today-matches')
  }

  /**
   * 날짜별 경기 목록
   * @param date YYYY-MM-DD 형식
   */
  async getMatchesByDate(date: string) {
    return this.callAPI('football-matches-by-date', { date })
  }

  /**
   * 리그별 경기 목록
   */
  async getLeagueMatches(leagueId: number, season?: number) {
    const params: any = { leagueid: leagueId }
    if (season) params.season = season
    return this.callAPI('football-league-matches', params)
  }

  /**
   * 팀 상세 정보
   */
  async getTeamDetails(teamId: number) {
    return this.callAPI('football-team-details', { teamid: teamId })
  }

  /**
   * 팀 스쿼드 정보
   */
  async getTeamSquad(teamId: number) {
    return this.callAPI('football-team-squad', { teamid: teamId })
  }

  /**
   * 선수 상세 정보
   */
  async getPlayerDetails(playerId: number) {
    return this.callAPI('football-player-details', { playerid: playerId })
  }

  /**
   * 선수 통계
   */
  async getPlayerStatistics(playerId: number, season?: number) {
    const params: any = { playerid: playerId }
    if (season) params.season = season
    return this.callAPI('football-player-statistics', params)
  }

  /**
   * 리그 순위표
   */
  async getLeagueStandings(leagueId: number, season?: number) {
    const params: any = { leagueid: leagueId }
    if (season) params.season = season
    return this.callAPI('football-league-standings', params)
  }

  /**
   * 리그 득점왕
   */
  async getLeagueTopScorers(leagueId: number, season?: number) {
    const params: any = { leagueid: leagueId }
    if (season) params.season = season
    return this.callAPI('football-league-top-scorers', params)
  }

  /**
   * H2H 상대전적
   */
  async getHeadToHead(team1Id: number, team2Id: number) {
    return this.callAPI('football-head-to-head', {
      team1id: team1Id,
      team2id: team2Id
    })
  }

  /**
   * 경기 라인업
   */
  async getMatchLineups(eventId: number) {
    return this.callAPI('football-match-lineups', { eventid: eventId })
  }

  /**
   * 경기 이벤트 (골, 카드, 교체 등)
   */
  async getMatchEvents(eventId: number) {
    return this.callAPI('football-match-events', { eventid: eventId })
  }

  /**
   * 경기 예측
   */
  async getMatchPrediction(eventId: number) {
    return this.callAPI('football-match-prediction', { eventid: eventId })
  }

  /**
   * 팀 최근 경기
   */
  async getTeamRecentMatches(teamId: number, limit: number = 10) {
    return this.callAPI('football-team-recent-matches', {
      teamid: teamId,
      limit
    })
  }

  /**
   * 팀 다음 경기
   */
  async getTeamNextMatches(teamId: number, limit: number = 5) {
    return this.callAPI('football-team-next-matches', {
      teamid: teamId,
      limit
    })
  }

  /**
   * 리그 목록
   */
  async getLeagues(countryCode?: string) {
    const params = countryCode ? { country: countryCode } : {}
    return this.callAPI('football-leagues-list', params)
  }

  /**
   * 국가 목록
   */
  async getCountries() {
    return this.callAPI('football-countries-list')
  }

  /**
   * 시즌별 리그 정보
   */
  async getLeagueSeasons(leagueId: number) {
    return this.callAPI('football-league-seasons', { leagueid: leagueId })
  }

  /**
   * 팀 통계 (홈/원정 분리)
   */
  async getTeamStatistics(teamId: number, season?: number) {
    const params: any = { teamid: teamId }
    if (season) params.season = season
    return this.callAPI('football-team-statistics', params)
  }

  /**
   * 경기 통계 비교
   */
  async getMatchStatisticsComparison(eventId: number) {
    return this.callAPI('football-match-statistics-comparison', { eventid: eventId })
  }

  /**
   * 베팅 오즈
   */
  async getMatchOdds(eventId: number) {
    return this.callAPI('football-match-odds', { eventid: eventId })
  }

  /**
   * 경기 하이라이트 영상
   */
  async getMatchHighlights(eventId: number) {
    return this.callAPI('football-match-highlights', { eventid: eventId })
  }

  /**
   * 팀 뉴스
   */
  async getTeamNews(teamId: number) {
    return this.callAPI('football-team-news', { teamid: teamId })
  }

  /**
   * 이적 시장 정보
   */
  async getTransferNews(teamId?: number) {
    const params = teamId ? { teamid: teamId } : {}
    return this.callAPI('football-transfer-news', params)
  }

  /**
   * 부상자 명단
   */
  async getTeamInjuries(teamId: number) {
    return this.callAPI('football-team-injuries', { teamid: teamId })
  }

  /**
   * 리그 라운드별 경기
   */
  async getLeagueRoundMatches(leagueId: number, round: number, season?: number) {
    const params: any = { leagueid: leagueId, round }
    if (season) params.season = season
    return this.callAPI('football-league-round-matches', params)
  }

  /**
   * xG (기대 득점) 통계
   */
  async getMatchXGStats(eventId: number) {
    return this.callAPI('football-match-xg-stats', { eventid: eventId })
  }

  /**
   * 히트맵 데이터
   */
  async getMatchHeatmap(eventId: number, teamId: number) {
    return this.callAPI('football-match-heatmap', {
      eventid: eventId,
      teamid: teamId
    })
  }

  /**
   * 패스맵 데이터
   */
  async getMatchPassmap(eventId: number, teamId: number) {
    return this.callAPI('football-match-passmap', {
      eventid: eventId,
      teamid: teamId
    })
  }

  /**
   * 슈팅맵 데이터
   */
  async getMatchShotmap(eventId: number) {
    return this.callAPI('football-match-shotmap', { eventid: eventId })
  }

  /**
   * 포메이션 분석
   */
  async getMatchFormationAnalysis(eventId: number) {
    return this.callAPI('football-match-formation-analysis', { eventid: eventId })
  }

  /**
   * 심판 정보 및 통계
   */
  async getRefereeStatistics(refereeId: number, season?: number) {
    const params: any = { refereeid: refereeId }
    if (season) params.season = season
    return this.callAPI('football-referee-statistics', params)
  }

  /**
   * VAR 결정 통계
   */
  async getMatchVARDecisions(eventId: number) {
    return this.callAPI('football-match-var-decisions', { eventid: eventId })
  }

  /**
   * 선수 히트맵
   */
  async getPlayerHeatmap(eventId: number, playerId: number) {
    return this.callAPI('football-player-heatmap', {
      eventid: eventId,
      playerid: playerId
    })
  }

  /**
   * 팀 폼 분석 (최근 N경기)
   */
  async getTeamFormAnalysis(teamId: number, matches: number = 10) {
    return this.callAPI('football-team-form-analysis', {
      teamid: teamId,
      matches
    })
  }

  /**
   * 경기별 선수 평점
   */
  async getMatchPlayerRatings(eventId: number) {
    return this.callAPI('football-match-player-ratings', { eventid: eventId })
  }
}

// 싱글톤 인스턴스
export const freeFootballAPI = new FreeFootballAPIService()