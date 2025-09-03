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
        const response = await fetch('/api/transfers/major', {
          // 캐시 헤더 추가로 브라우저 캐시 활용
          headers: {
            'Cache-Control': 'max-age=1800', // 30분
          }
        })
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
    staleTime: 30 * 60 * 1000, // 30분
    gcTime: 60 * 60 * 1000, // 1시간 캐시 유지
    retry: 2, // 2번 재시도
    refetchOnWindowFocus: false, // 포커스 시 재요청 안함
    enabled: true, // 명시적으로 활성화
    refetchInterval: false, // 자동 리페치 비활성화
    // SSR 지원을 위한 초기 데이터 설정 (있으면 사용)
    initialData: typeof window === 'undefined' ? undefined : (() => {
      // 로컬 스토리지에서 초기 데이터 확인
      try {
        const cached = localStorage.getItem('react_query_major_transfers')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
            return parsed.data
          }
        }
      } catch (e) {}
      return undefined
    })(),
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