'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FavoriteTeam {
  id: number
  name: string
  logo: string
  leagueId?: number
  leagueName?: string
}

export interface FavoritePlayer {
  id: number
  name: string
  photo: string
  teamId?: number
  teamName?: string
  position?: string
}

export interface FavoriteLeague {
  id: number
  name: string
  logo: string
  country?: string
}

interface FavoritesState {
  teams: FavoriteTeam[]
  players: FavoritePlayer[]
  leagues: FavoriteLeague[]
  
  // Team actions
  addTeam: (team: FavoriteTeam) => void
  removeTeam: (teamId: number) => void
  isTeamFavorite: (teamId: number) => boolean
  
  // Player actions
  addPlayer: (player: FavoritePlayer) => void
  removePlayer: (playerId: number) => void
  isPlayerFavorite: (playerId: number) => boolean
  
  // League actions
  addLeague: (league: FavoriteLeague) => void
  removeLeague: (leagueId: number) => void
  isLeagueFavorite: (leagueId: number) => boolean
  
  // Clear all
  clearAll: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      teams: [],
      players: [],
      leagues: [],
      
      // Team actions
      addTeam: (team) => set((state) => {
        if (state.teams.some(t => t.id === team.id)) return state
        return { teams: [...state.teams, team] }
      }),
      
      removeTeam: (teamId) => set((state) => ({
        teams: state.teams.filter(t => t.id !== teamId)
      })),
      
      isTeamFavorite: (teamId) => {
        return get().teams.some(t => t.id === teamId)
      },
      
      // Player actions
      addPlayer: (player) => set((state) => {
        if (state.players.some(p => p.id === player.id)) return state
        return { players: [...state.players, player] }
      }),
      
      removePlayer: (playerId) => set((state) => ({
        players: state.players.filter(p => p.id !== playerId)
      })),
      
      isPlayerFavorite: (playerId) => {
        return get().players.some(p => p.id === playerId)
      },
      
      // League actions
      addLeague: (league) => set((state) => {
        if (state.leagues.some(l => l.id === league.id)) return state
        return { leagues: [...state.leagues, league] }
      }),
      
      removeLeague: (leagueId) => set((state) => ({
        leagues: state.leagues.filter(l => l.id !== leagueId)
      })),
      
      isLeagueFavorite: (leagueId) => {
        return get().leagues.some(l => l.id === leagueId)
      },
      
      // Clear all
      clearAll: () => set({ teams: [], players: [], leagues: [] })
    }),
    {
      name: 'futinfo-favorites',
      skipHydration: true
    }
  )
)

// Hook to handle hydration
export const useFavorites = () => {
  const store = useFavoritesStore()
  
  // Hydrate on mount
  if (typeof window !== 'undefined') {
    useFavoritesStore.persist.rehydrate()
  }
  
  return store
}