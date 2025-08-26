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
    staleTime: 0, // 항상 새로운 데이터 가져오기
    gcTime: 0, // 캐시 즉시 삭제
    retry: 1,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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