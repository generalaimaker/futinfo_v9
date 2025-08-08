// React Query hooks for Football API

import { useQuery } from '@tanstack/react-query'
import { 
  getAllTransfers, 
  getTopTransfers,
  getTopMarketValueTransfers,
  getTransfersByLeague,
  getTeamContractExtensions,
  getTeamPlayersInTransfers,
  getTeamPlayersOutTransfers
} from './client'

export function useFootballTransfers(page = 1) {
  return useQuery({
    queryKey: ['football-transfers', 'all', page],
    queryFn: () => getAllTransfers(page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

export function useFootballTopTransfers(page = 1) {
  return useQuery({
    queryKey: ['football-transfers', 'top', page],
    queryFn: () => getTopTransfers(page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

export function useFootballTopMarketValueTransfers(page = 1) {
  return useQuery({
    queryKey: ['football-transfers', 'top-market-value', page],
    queryFn: () => getTopMarketValueTransfers(page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

export function useFootballTransfersByLeague(leagueId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['football-transfers', 'by-league', leagueId, page],
    queryFn: () => getTransfersByLeague(leagueId, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    enabled,
  })
}

export function useFootballTeamContractExtensions(teamId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['football-transfers', 'contract-extensions', teamId, page],
    queryFn: () => getTeamContractExtensions(teamId, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    enabled,
  })
}

export function useFootballTeamPlayersIn(teamId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['football-transfers', 'team-players-in', teamId, page],
    queryFn: () => getTeamPlayersInTransfers(teamId, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    enabled,
  })
}

export function useFootballTeamPlayersOut(teamId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: ['football-transfers', 'team-players-out', teamId, page],
    queryFn: () => getTeamPlayersOutTransfers(teamId, page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    enabled,
  })
}