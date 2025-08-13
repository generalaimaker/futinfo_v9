import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface BraveSearchParams {
  query: string
  type?: 'general' | 'transfer' | 'injury' | 'match'
  team?: string
  player?: string
  freshness?: 'day' | 'week' | 'month'
  count?: number
  offset?: number
  saveToDb?: boolean
}

export interface SearchResult {
  title: string
  description: string
  url: string
  source: string
  trust_score: number
  category: string
  team_ids: number[]
  image_url?: string
  published_at: string
  is_from_search: boolean
}

// Brave Search를 통한 뉴스 검색
export async function searchBraveNews(params: BraveSearchParams): Promise<{
  success: boolean
  articles: SearchResult[]
  total: number
  query: string
}> {
  // Edge Function 사용 (배포 완료)
  const { data, error } = await supabase.functions.invoke('brave-news-search', {
    body: params
  })
  
  if (error) {
    console.error('Edge function error, falling back to local API:', error)
    // 로컬 API 폴백
    const response = await fetch('/api/brave-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  }
  
  return data
}

// 뉴스 검색 Hook
export function useBraveNewsSearch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: searchBraveNews,
    onSuccess: (data) => {
      // 검색 결과를 캐시에 추가
      if (data.saveToDb) {
        queryClient.invalidateQueries({ queryKey: ['news'] })
      }
    }
  })
}

// 트렌딩 뉴스 검색 Hook
export function useTrendingNews(
  type?: 'transfer' | 'injury' | 'match',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['trending-news', type],
    queryFn: () => searchBraveNews({
      query: type ? `football ${type} breaking` : 'football breaking news',
      type,
      freshness: 'day',
      count: 10
    }),
    enabled,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
  })
}

// 팀별 최신 뉴스 검색
export function useTeamLatestNews(teamName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['team-latest-news', teamName],
    queryFn: () => searchBraveNews({
      query: `"${teamName}" latest news`,
      team: teamName,
      freshness: 'day',
      count: 5
    }),
    enabled: enabled && !!teamName,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 15 * 60 * 1000, // 15분
  })
}

// 이적 루머 검색
export function useTransferRumors(teamOrPlayer: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['transfer-rumors', teamOrPlayer],
    queryFn: () => searchBraveNews({
      query: `"${teamOrPlayer}" transfer rumor OR deal OR medical`,
      type: 'transfer',
      freshness: 'week',
      count: 10
    }),
    enabled: enabled && !!teamOrPlayer,
    staleTime: 15 * 60 * 1000, // 15분
    gcTime: 60 * 60 * 1000, // 1시간
  })
}

// 경기 프리뷰 검색
export function useMatchPreview(homeTeam: string, awayTeam: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['match-preview', homeTeam, awayTeam],
    queryFn: () => searchBraveNews({
      query: `"${homeTeam}" vs "${awayTeam}" preview lineup prediction`,
      type: 'match',
      freshness: 'week',
      count: 5
    }),
    enabled: enabled && !!homeTeam && !!awayTeam,
    staleTime: 30 * 60 * 1000, // 30분
    gcTime: 2 * 60 * 60 * 1000, // 2시간
  })
}

// 부상 소식 검색
export function useInjuryNews(player: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['injury-news', player],
    queryFn: () => searchBraveNews({
      query: `"${player}" injury update return fitness`,
      type: 'injury',
      freshness: 'week',
      count: 5
    }),
    enabled: enabled && !!player,
    staleTime: 30 * 60 * 1000, // 30분
    gcTime: 2 * 60 * 60 * 1000, // 2시간
  })
}

// 검색 히스토리 저장
export function useSaveSearchHistory() {
  return useMutation({
    mutationFn: async (query: string) => {
      const searches = JSON.parse(localStorage.getItem('search_history') || '[]')
      const updated = [query, ...searches.filter((q: string) => q !== query)].slice(0, 10)
      localStorage.setItem('search_history', JSON.stringify(updated))
      return updated
    }
  })
}

// 검색 히스토리 가져오기
export function useSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('search_history') || '[]')
}