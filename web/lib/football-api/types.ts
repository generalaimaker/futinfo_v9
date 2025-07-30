// Types for Free API Live Football Data

export interface FootballPlayer {
  id: number
  name: string
  photo: string | null
  position: string | null
  age: number | null
  nationality: string | null
  market_value?: string | null
}

export interface FootballTeam {
  id: number
  name: string
  logo: string | null
  league?: string | null
  country?: string | null
}

export interface FootballTransfer {
  // New API structure based on actual response
  name: string
  playerId: number
  position?: {
    label: string
    key: string
  } | null
  transferDate: string
  transferText?: (string | null)[] // Often contains nulls
  
  // Club information
  fromClub?: string
  fromClubId?: number
  toClub?: string
  toClubId?: number
  
  // Fee information
  fee?: {
    feeText: string // e.g., "free transfer", "loan", "$10M"
    localizedFeeText: string
    value?: number
  }
  
  // Transfer details
  transferType?: {
    text: string
    localizationKey: string
  }
  contractExtension?: boolean
  onLoan?: boolean
  fromDate?: string
  toDate?: string
  marketValue?: number
  
  // Images (added dynamically)
  playerImageUrl?: string
  fromClubLogoUrl?: string
  toClubLogoUrl?: string
  
  // Legacy fields for compatibility
  player?: FootballPlayer
  from?: FootballTeam
  to?: FootballTeam
  date?: string
  type?: string // 'Transfer' | 'Loan' | 'Free' | 'End of loan' etc.
  market_value?: string | null
  transfer_fee?: string | null
  contract_until?: string | null
}

export interface FootballTransfersResponse {
  transfers: FootballTransfer[]
  pagination: {
    current: number
    total: number
    per_page: number
  } | null
  total: number
}

export interface FootballContractExtension {
  player: FootballPlayer
  team: FootballTeam
  date: string
  new_contract_until: string
  previous_contract_until?: string
}

export interface FootballContractExtensionsResponse {
  extensions: FootballContractExtension[]
  pagination: {
    current: number
    total: number
    per_page: number
  } | null
  total: number
}

// League ID mapping for new API
// Note: These IDs might be different - need to verify with API
export const FOOTBALL_API_LEAGUE_IDS: Record<string, string> = {
  'PREMIER_LEAGUE': '47',  // Updated based on API example
  'LA_LIGA': '87',
  'SERIE_A': '71',
  'BUNDESLIGA': '54',
  'LIGUE_1': '53',
  'K_LEAGUE_1': '292',
}