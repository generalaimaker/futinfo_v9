import { useState, useEffect } from 'react'
import { FootballAPIService } from '@/lib/supabase/football'
import { CommunityService } from '@/lib/supabase/community'

// 라이브 경기 데이터 훅
export function useLiveMatches() {
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLiveMatches = async () => {
      try {
        const service = new FootballAPIService()
        const data = await service.getLiveFixtures()
        if (data?.response) {
          setMatches(data.response.slice(0, 5))
        }
      } catch (err) {
        setError('라이브 경기를 불러올 수 없습니다')
        console.error('Error loading live matches:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLiveMatches()
    const interval = setInterval(loadLiveMatches, 30000) // 30초마다 업데이트
    return () => clearInterval(interval)
  }, [])

  return { matches, isLoading, error }
}

// 오늘의 경기 데이터 훅
export function useTodayFixtures() {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFixtures = async () => {
      try {
        const today = new Date()
        const service = new FootballAPIService()
        const data = await service.getFixtures({ 
          date: today.toISOString().split('T')[0] 
        })
        if (data?.response) {
          // 주요 리그 우선 정렬
          const priorityLeagues = [39, 140, 135, 78, 61, 2] // EPL, La Liga, Serie A, etc
          const sorted = data.response.sort((a: any, b: any) => {
            const aIndex = priorityLeagues.indexOf(a.league.id)
            const bIndex = priorityLeagues.indexOf(b.league.id)
            if (aIndex === -1 && bIndex === -1) return 0
            if (aIndex === -1) return 1
            if (bIndex === -1) return -1
            return aIndex - bIndex
          })
          setFixtures(sorted.slice(0, 10))
        }
      } catch (err) {
        setError('경기 일정을 불러올 수 없습니다')
        console.error('Error loading fixtures:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadFixtures()
  }, [])

  return { fixtures, isLoading, error }
}

// 커뮤니티 인기글 훅
export function usePopularPosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const service = new CommunityService()
        const data = await service.getPopularPosts({ limit: 5 })
        setPosts(data || [])
      } catch (err) {
        setError('인기글을 불러올 수 없습니다')
        console.error('Error loading popular posts:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPosts()
  }, [])

  return { posts, isLoading, error }
}

// 통계 데이터 훅
export function useHomeStats() {
  const [stats, setStats] = useState({
    todayMatches: 0,
    liveMatches: 0,
    activeUsers: 0,
    newPosts: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const service = new FootballAPIService()
        const communityService = new CommunityService()
        
        // 오늘의 경기 수
        const todayData = await service.getFixtures({ 
          date: new Date().toISOString().split('T')[0] 
        })
        
        // 라이브 경기 수
        const liveData = await service.getLiveFixtures()
        
        // 커뮤니티 통계
        const stats24h = await communityService.getStats24Hours()
        
        setStats({
          todayMatches: todayData?.results || 0,
          liveMatches: liveData?.results || 0,
          activeUsers: stats24h?.activeUsers || 0,
          newPosts: stats24h?.newPosts || 0
        })
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadStats()
    const interval = setInterval(loadStats, 60000) // 1분마다 업데이트
    return () => clearInterval(interval)
  }, [])

  return { stats, isLoading }
}