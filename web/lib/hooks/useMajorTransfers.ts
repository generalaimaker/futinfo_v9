// Hook for fetching major transfers with server-side caching
import { useQuery } from '@tanstack/react-query'
import React from 'react'

export interface MajorTransfer {
  id: string
  playerName: string
  playerId: number
  fromClub: {
    id: number
    name: string
    logo?: string
  }
  toClub: {
    id: number
    name: string
    logo?: string
  }
  fee: {
    amount?: number
    text: string
  }
  marketValue?: number
  transferDate: string
  transferType: 'transfer' | 'loan' | 'free'
  position?: string
  teamName: string
  teamLeague: string
  direction: 'in' | 'out'
}

export function useMajorTransfers() {
  return useQuery({
    queryKey: ['major-transfers'],
    queryFn: async () => {
      console.log('[MajorTransfers] Starting fetch from cached API...')
      
      try {
        // 서버사이드 캐시된 API 엔드포인트 호출
        const response = await fetch('/api/transfers/major')
        console.log('[MajorTransfers] Response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transfers: ${response.status}`)
        }
        
        const data = await response.json()
        console.log(`[MajorTransfers] Received ${data.transfers?.length || 0} transfers from cache`)
        console.log('[MajorTransfers] Sample data:', data.transfers?.slice(0, 2))
        
        return data.transfers || []
      } catch (error) {
        console.error('[MajorTransfers] Error fetching:', error)
        // 에러 시 빈 배열 반환 (화면이 깨지지 않도록)
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5분으로 줄임
    gcTime: 15 * 60 * 1000, // 15분으로 줄임
    retry: 1, // 1번만 재시도
    refetchOnWindowFocus: false, // 포커스 시 재요청 안함
    enabled: true, // 명시적으로 활성화
  })
}

// Hook for banner transfers (top fees and recent transfers)
export function useBannerTransfers() {
  const { data: allTransfers, isLoading } = useMajorTransfers()
  
  // 로딩 중이거나 데이터가 없으면 빈 배열 반환
  const topFees = React.useMemo(() => {
    if (!allTransfers || allTransfers.length === 0) return []
    
    // Top 5 by fee amount (이미 정렬되어 있음)
    return allTransfers
      .slice(0, 5)
      .map((transfer, index) => ({
        ...transfer,
        rank: index + 1
      }))
  }, [allTransfers])
  
  const recentTransfers = React.useMemo(() => {
    if (!allTransfers || allTransfers.length === 0) return []
    
    // 중복 제거 (선수명 + 날짜가 같으면 중복으로 간주)
    const uniqueTransfers = [...allTransfers].filter((transfer, index, self) => {
      return index === self.findIndex(t => 
        t.playerName === transfer.playerName && 
        t.transferDate === transfer.transferDate
      )
    })
    
    // 날짜순으로 정렬 후 Top 5
    return uniqueTransfers
      .sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime())
      .slice(0, 5)
      .map((transfer, index) => ({
        ...transfer,
        rank: index + 1
      }))
  }, [allTransfers])
  
  return {
    topFees,
    recentTransfers,
    isLoading
  }
}

// Hook for transfer highlights section (interesting transfers)
export function useTransferHighlights() {
  const { data: allTransfers, isLoading } = useMajorTransfers()
  
  // 상위 8개 반환
  const highlights = React.useMemo(() => {
    if (!allTransfers || allTransfers.length === 0) return []
    return allTransfers.slice(0, 8)
  }, [allTransfers])
  
  return {
    data: highlights,
    isLoading
  }
}