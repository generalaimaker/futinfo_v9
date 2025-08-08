// Player related types

export interface PlayerProfile {
  player: PlayerInfo
  statistics: PlayerStatistics[]
}

export interface PlayerInfo {
  id: number
  name: string
  firstname: string
  lastname: string
  age: number
  birth: {
    date: string
    place: string
    country: string
  }
  nationality: string
  height: string
  weight: string
  injured: boolean
  photo: string
}

export interface PlayerStatistics {
  team: {
    id: number
    name: string
    logo: string
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string
    season: number
  }
  games: {
    appearences: number
    lineups: number
    minutes: number
    number: number | null
    position: string
    rating: string | null
    captain: boolean
  }
  substitutes: {
    in: number
    out: number
    bench: number
  }
  shots: {
    total: number | null
    on: number | null
  }
  goals: {
    total: number
    conceded: number | null
    assists: number | null
    saves: number | null
  }
  passes: {
    total: number | null
    key: number | null
    accuracy: number | null
  }
  tackles: {
    total: number | null
    blocks: number | null
    interceptions: number | null
  }
  duels: {
    total: number | null
    won: number | null
  }
  dribbles: {
    attempts: number | null
    success: number | null
    past: number | null
  }
  fouls: {
    drawn: number | null
    committed: number | null
  }
  cards: {
    yellow: number
    yellowred: number
    red: number
  }
  penalty: {
    won: number | null
    commited: number | null
    scored: number
    missed: number
    saved: number | null
  }
}

// Player Search
export interface PlayerSearchResult {
  id: number
  name: string
  firstname: string
  lastname: string
  age: number
  nationality: string
  photo: string
  team: {
    id: number
    name: string
    logo: string
  }
  position: string
}

// Player Favorite
export interface PlayerFavorite {
  id: string
  userId: string
  playerId: number
  createdAt: string
}

// Top Scorers
export interface TopScorer {
  player: {
    id: number
    name: string
    firstname: string
    lastname: string
    age: number
    birth: {
      date: string
      place: string
      country: string
    }
    nationality: string
    height: string
    weight: string
    injured: boolean
    photo: string
  }
  statistics: [{
    team: {
      id: number
      name: string
      logo: string
    }
    league: {
      id: number
      name: string
      country: string
      logo: string
      flag: string
      season: number
    }
    games: {
      appearences: number
      lineups: number
      minutes: number
      number: number | null
      position: string
      rating: string | null
      captain: boolean
    }
    goals: {
      total: number
      assists: number | null
    }
    penalty: {
      scored: number
      missed: number
    }
  }]
}

// Top Assists
export interface TopAssist {
  player: {
    id: number
    name: string
    firstname: string
    lastname: string
    age: number
    birth: {
      date: string
      place: string
      country: string
    }
    nationality: string
    height: string
    weight: string
    injured: boolean
    photo: string
  }
  statistics: [{
    team: {
      id: number
      name: string
      logo: string
    }
    league: {
      id: number
      name: string
      country: string
      logo: string
      flag: string
      season: number
    }
    games: {
      appearences: number
      lineups: number
      minutes: number
      number: number | null
      position: string
      rating: string | null
      captain: boolean
    }
    goals: {
      total: number
      assists: number
    }
  }]
}