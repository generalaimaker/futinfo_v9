// Football Data Types - iOS 앱과 동일한 구조 유지

// Common Types
export interface ResponseParameters {
  league?: string
  season?: string
  date?: string
  from?: string
  to?: string
  team?: string
  fixture?: string
  live?: string
  next?: string
  last?: string
}

export interface APIPaging {
  current: number
  total: number
}

// Fixture Types
export interface FixturesResponse {
  get: string
  parameters: ResponseParameters
  errors: any
  results: number
  paging: APIPaging
  response: Fixture[]
}

export interface Fixture {
  fixture: FixtureDetails
  league: LeagueFixtureInfo
  teams: Teams
  goals: Goals | null
}

export interface FixtureDetails {
  id: number
  date: string
  status: FixtureStatus
  venue: Venue
  timezone: string
  referee: string | null
}

export interface FixtureStatus {
  long: string
  short: string
  elapsed: number | null
}

export interface Venue {
  id: number | null
  name: string | null
  city: string | null
}

export interface LeagueFixtureInfo {
  id: number
  name: string
  country: string
  logo: string
  flag: string | null
  season: number
  round: string
  standings: boolean | null
}

export interface Teams {
  home: Team
  away: Team
}

export interface Team {
  id: number
  name: string
  logo: string
  winner: boolean | null
}

export interface Goals {
  home: number | null
  away: number | null
}

// League Types
export interface LeaguesResponse {
  get: string
  parameters: Parameters
  errors: string[]
  results: number
  paging: Paging
  response: LeagueDetails[]
}

export interface Parameters {
  league?: string
  season?: string
  current?: string
  live?: string
  next?: string
  from?: string
  to?: string
}

export interface Paging {
  current: number
  total: number
}

export interface LeagueDetails {
  league: LeagueInfo
  country: Country | null
  seasons: Season[] | null
}

export interface LeagueInfo {
  id: number
  name: string
  type: string
  logo: string
}

export interface Country {
  name: string
  code: string | null
  flag: string | null
}

export interface Season {
  year: number
  start: string
  end: string
  current: boolean
  coverage: Coverage | null
}

export interface Coverage {
  fixtures: FixtureCoverage | null
  standings: boolean | null
  players: boolean | null
  top_scorers: boolean | null
  top_assists: boolean | null
  top_cards: boolean | null
  injuries: boolean | null
  predictions: boolean | null
  odds: boolean | null
}

export interface FixtureCoverage {
  events: boolean | null
  lineups: boolean | null
  statistics_fixtures: boolean | null
  statistics_players: boolean | null
}

// Standings Types
export interface StandingsResponse {
  get: string
  parameters: ResponseParameters
  errors: any
  results: number
  paging: APIPaging
  response: StandingGroup[]
}

export interface StandingGroup {
  league: LeagueStandingInfo
}

export interface LeagueStandingInfo {
  id: number
  name: string
  country: string
  logo: string
  flag: string | null
  season: number
  standings: TeamStanding[][]
}

export interface TeamStanding {
  rank: number
  team: StandingTeam
  points: number
  goalsDiff: number
  group: string
  form: string | null
  status: string
  description: string | null
  all: StandingStats
  home: StandingStats
  away: StandingStats
  update: string
}

export interface StandingTeam {
  id: number
  name: string
  logo: string
}

export interface StandingStats {
  played: number
  win: number
  draw: number
  lose: number
  goals: {
    for: number
    against: number
  }
}

// Team Squad Types
export interface TeamSquadResponse {
  get: string
  parameters: ResponseParameters
  errors: any
  results: number
  paging: APIPaging
  response: SquadData[]
}

export interface SquadData {
  team: Team
  players: SquadPlayer[]
}

export interface SquadPlayer {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}

// Transfer Types
export interface TransfersResponse {
  get: string
  parameters: ResponseParameters
  errors: any
  results: number
  paging: APIPaging
  response: TransferData[]
}

export interface TransferData {
  player: TransferPlayer
  update: string
  transfers: Transfer[]
}

export interface TransferPlayer {
  id: number
  name: string
}

export interface Transfer {
  date: string
  type: string | null
  teams: TransferTeams
}

export interface TransferTeams {
  in: TransferTeam
  out: TransferTeam
}

export interface TransferTeam {
  id: number
  name: string
  logo: string
}

// Helper Constants (이제 아래에 새로운 정의가 있음)

export const getLeagueName = (id: number): string => {
  const leagueNames: Record<number, string> = {
    [SUPPORTED_LEAGUES.PREMIER_LEAGUE]: 'Premier League',
    [SUPPORTED_LEAGUES.LA_LIGA]: 'La Liga',
    [SUPPORTED_LEAGUES.SERIE_A]: 'Serie A',
    [SUPPORTED_LEAGUES.BUNDESLIGA]: 'Bundesliga',
    [SUPPORTED_LEAGUES.LIGUE_1]: 'Ligue 1',
    [SUPPORTED_LEAGUES.K_LEAGUE_1]: 'K League 1',
    [SUPPORTED_LEAGUES.K_LEAGUE_2]: 'K League 2',
    [SUPPORTED_LEAGUES.J1_LEAGUE]: 'J1 League',
    [SUPPORTED_LEAGUES.SAUDI_PRO_LEAGUE]: 'Saudi Pro League',
    [SUPPORTED_LEAGUES.AFC_CHAMPIONS_LEAGUE]: 'AFC Champions League',
    [SUPPORTED_LEAGUES.MLS]: 'MLS',
    [SUPPORTED_LEAGUES.BRAZIL_SERIE_A]: 'Brasileirão Série A',
    [SUPPORTED_LEAGUES.CHAMPIONS_LEAGUE]: 'Champions League',
    [SUPPORTED_LEAGUES.EUROPA_LEAGUE]: 'Europa League',
    [SUPPORTED_LEAGUES.CONFERENCE_LEAGUE]: 'Conference League',
    [SUPPORTED_LEAGUES.NATIONS_LEAGUE]: 'Nations League',
    [SUPPORTED_LEAGUES.WORLD_CUP]: 'World Cup',
    [SUPPORTED_LEAGUES.WORLD_CUP_QUAL_EUROPE]: 'World Cup Qualification - Europe',
    [SUPPORTED_LEAGUES.WORLD_CUP_QUAL_SOUTH_AMERICA]: 'World Cup Qualification - South America',
    [SUPPORTED_LEAGUES.WORLD_CUP_QUAL_ASIA]: 'World Cup Qualification - Asia',
    [SUPPORTED_LEAGUES.CLUB_WORLD_CUP]: 'Club World Cup'
  }
  return leagueNames[id] || '알 수 없는 리그'
}

export const getCurrentSeason = (leagueId: number): number => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  // K리그, MLS, J리그 등은 단일 연도 시즌
  if ([SUPPORTED_LEAGUES.K_LEAGUE_1, SUPPORTED_LEAGUES.K_LEAGUE_2, SUPPORTED_LEAGUES.MLS, 
       SUPPORTED_LEAGUES.J1_LEAGUE, SUPPORTED_LEAGUES.BRAZIL_SERIE_A].includes(leagueId)) {
    return month <= 2 ? year - 1 : year
  }
  
  // 대부분의 유럽 리그는 8월~5월 시즌
  return month >= 8 ? year : year - 1
}

// Date Helper
export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Status Helpers
export const isLiveMatch = (status: string): boolean => {
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE']
  return liveStatuses.includes(status)
}

export const isFinishedMatch = (status: string): boolean => {
  const finishedStatuses = ['FT', 'AET', 'PEN']
  return finishedStatuses.includes(status)
}

export const getStatusDisplay = (status: string, elapsed: number | null): string => {
  switch (status) {
    case 'TBD': return '일정 미정'
    case 'NS': return '시작 전'
    case '1H': return elapsed ? `전반 ${elapsed}'` : '전반'
    case 'HT': return '하프타임'
    case '2H': return elapsed ? `후반 ${elapsed}'` : '후반'
    case 'ET': return '연장전'
    case 'P': return '승부차기'
    case 'FT': return '종료'
    case 'AET': return '연장 종료'
    case 'PEN': return '승부차기 종료'
    case 'PST': return '연기'
    case 'CANC': return '취소'
    case 'ABD': return '중단'
    case 'AWD': return '몰수'
    case 'WO': return '부전승'
    case 'LIVE': return '진행중'
    default: return status
  }
}

// iOS와 동일한 주요 리그 설정
export const SUPPORTED_LEAGUES = {
  // 유럽 5대 리그
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  
  // 아시아
  K_LEAGUE_1: 292,
  K_LEAGUE_2: 293,
  J1_LEAGUE: 98,
  SAUDI_PRO_LEAGUE: 307,
  AFC_CHAMPIONS_LEAGUE: 848,
  
  // 아메리카
  MLS: 253,
  BRAZIL_SERIE_A: 71,
  
  // UEFA 대회
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
  CONFERENCE_LEAGUE: 4,
  NATIONS_LEAGUE: 5,
  
  // 월드컵
  WORLD_CUP: 1,
  WORLD_CUP_QUAL_EUROPE: 32,
  WORLD_CUP_QUAL_SOUTH_AMERICA: 34,
  WORLD_CUP_QUAL_ASIA: 29,
  
  // 기타
  CLUB_WORLD_CUP: 15,
}

// 기본 팔로우 리그 (iOS와 동일)
export const DEFAULT_LEAGUES = [
  SUPPORTED_LEAGUES.PREMIER_LEAGUE,
  SUPPORTED_LEAGUES.LA_LIGA,
  SUPPORTED_LEAGUES.SERIE_A,
  SUPPORTED_LEAGUES.BUNDESLIGA,
  SUPPORTED_LEAGUES.LIGUE_1,
  SUPPORTED_LEAGUES.K_LEAGUE_1,
]

// 모든 주요 리그 (날짜별 경기 조회용)
export const MAIN_LEAGUES = [
  // 유럽 5대 리그
  SUPPORTED_LEAGUES.PREMIER_LEAGUE,
  SUPPORTED_LEAGUES.LA_LIGA,
  SUPPORTED_LEAGUES.SERIE_A,
  SUPPORTED_LEAGUES.BUNDESLIGA,
  SUPPORTED_LEAGUES.LIGUE_1,
  
  // 아시아 주요 리그
  SUPPORTED_LEAGUES.K_LEAGUE_1,
  SUPPORTED_LEAGUES.J1_LEAGUE,
  SUPPORTED_LEAGUES.SAUDI_PRO_LEAGUE,
  
  // 아메리카
  SUPPORTED_LEAGUES.MLS,
  SUPPORTED_LEAGUES.BRAZIL_SERIE_A,
  
  // UEFA 대회
  SUPPORTED_LEAGUES.CHAMPIONS_LEAGUE,
  SUPPORTED_LEAGUES.EUROPA_LEAGUE,
  
  // 월드컵 예선 (현재 진행중인 경우)
  SUPPORTED_LEAGUES.WORLD_CUP_QUAL_EUROPE,
  SUPPORTED_LEAGUES.WORLD_CUP_QUAL_SOUTH_AMERICA,
  SUPPORTED_LEAGUES.WORLD_CUP_QUAL_ASIA,
]