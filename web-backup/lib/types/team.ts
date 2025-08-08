// Team related types

export interface TeamProfile {
  team: TeamInfo
  venue: VenueInfo
}

export interface TeamInfo {
  id: number
  name: string
  code: string
  country: string
  founded: number
  national: boolean
  logo: string
}

export interface VenueInfo {
  id: number
  name: string
  address: string
  city: string
  capacity: number
  surface: string
  image: string
}

export interface TeamStatistics {
  league: LeagueInfo
  team: TeamInfo
  form: string
  fixtures: FixtureStats
  goals: GoalStats
  biggest: BiggestStats
  clean_sheet: CleanSheetStats
  failed_to_score: FailedToScoreStats
  penalty: PenaltyStats
  lineups: LineupInfo[]
  cards: CardStats
}

interface LeagueInfo {
  id: number
  name: string
  country: string
  logo: string
  flag: string
  season: number
}

interface FixtureStats {
  played: StatsBreakdown
  wins: StatsBreakdown
  draws: StatsBreakdown
  loses: StatsBreakdown
}

interface StatsBreakdown {
  home: number
  away: number
  total: number
}

interface GoalStats {
  for: GoalBreakdown
  against: GoalBreakdown
}

interface GoalBreakdown {
  total: StatsBreakdown
  average: {
    home: string
    away: string
    total: string
  }
  minute: Record<string, {
    total: number | null
    percentage: string | null
  }>
}

interface BiggestStats {
  streak: {
    wins: number
    draws: number
    loses: number
  }
  wins: {
    home: string
    away: string
  }
  loses: {
    home: string
    away: string
  }
  goals: {
    for: {
      home: number
      away: number
    }
    against: {
      home: number
      away: number
    }
  }
}

interface CleanSheetStats {
  home: number
  away: number
  total: number
}

interface FailedToScoreStats {
  home: number
  away: number
  total: number
}

interface PenaltyStats {
  scored: {
    total: number
    percentage: string
  }
  missed: {
    total: number
    percentage: string
  }
  total: number
}

interface LineupInfo {
  formation: string
  played: number
}

interface CardStats {
  yellow: Record<string, {
    total: number | null
    percentage: string | null
  }>
  red: Record<string, {
    total: number | null
    percentage: string | null
  }>
}

// Team News
export interface TeamNews {
  id: string
  teamId: number
  title: string
  content: string
  summary?: string
  imageUrl?: string
  source: string
  publishedAt: string
  createdAt: string
}

// Team Favorite
export interface TeamFavorite {
  id: string
  userId: string
  teamId: number
  createdAt: string
}