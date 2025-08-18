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
          // 유럽 5대 리그, MLS, K리그, 유럽 대회만 필터링
          const ALLOWED_LEAGUES = [
            39,  // Premier League
            140, // La Liga
            135, // Serie A
            78,  // Bundesliga
            61,  // Ligue 1
            253, // MLS
            292, // K League 1
            293, // K League 2
            2,   // Champions League
            3,   // Europa League
            848, // Conference League
          ]
          
          const filteredMatches = data.response.filter((match: any) => 
            ALLOWED_LEAGUES.includes(match.league.id)
          )
          
          setMatches(filteredMatches)
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
        // getFixturesByDate를 사용하여 MAIN_LEAGUES 필터 적용 (친선경기 포함)
        const data = await service.getFixturesByDate(today)
        if (data?.response) {
          // MAJOR_EUROPEAN_TEAMS 가져오기
          const { MAJOR_EUROPEAN_TEAMS } = await import('@/lib/types/football')
          
          // 정렬 로직: 유럽 주요 팀 친선경기 > 주요 리그 > 기타
          const sorted = data.response.sort((a: any, b: any) => {
            // 1. 유럽 주요 팀의 친선경기 최우선
            const aIsMajorFriendly = a.league.id === 667 && 
              (MAJOR_EUROPEAN_TEAMS.includes(a.teams.home.id) || 
               MAJOR_EUROPEAN_TEAMS.includes(a.teams.away.id))
            const bIsMajorFriendly = b.league.id === 667 && 
              (MAJOR_EUROPEAN_TEAMS.includes(b.teams.home.id) || 
               MAJOR_EUROPEAN_TEAMS.includes(b.teams.away.id))
            
            if (aIsMajorFriendly && !bIsMajorFriendly) return -1
            if (!aIsMajorFriendly && bIsMajorFriendly) return 1
            
            // 2. 그 다음 주요 리그 우선순위
            const priorityLeagues = [39, 140, 135, 78, 61, 2] // EPL, La Liga, Serie A, Bundesliga, Ligue 1, Champions League
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

// 앞으로 7일간의 빅매치 데이터 훅
export function useUpcomingBigMatches() {
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUpcomingBigMatches = async () => {
      try {
        const service = new FootballAPIService()
        const today = new Date()
        
        // 다음 7일간의 경기 가져오기
        const promises = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
          promises.push(service.getFixturesByDate(date))
        }
        
        const results = await Promise.all(promises)
        const allMatches: any[] = []
        
        results.forEach(data => {
          if (data?.response) {
            allMatches.push(...data.response)
          }
        })
        
        // 빅팀 ID 목록
        const BIG_TEAMS = [
          // 프리미어리그 빅6
          33, 40, 50, 49, 42, 47,
          // 라리가 빅3
          541, 529, 530,
          // 세리에A 빅4
          496, 505, 489, 492,
          // 분데스리가 빅3
          157, 165, 168,
          // 리그1
          85, 81, 91
        ]
        
        // 빅매치 필터링 (빅팀 vs 빅팀, 또는 빅팀 경기)
        const bigMatches = allMatches.filter(match => {
          const homeId = match.teams.home.id
          const awayId = match.teams.away.id
          const bothBigTeams = BIG_TEAMS.includes(homeId) && BIG_TEAMS.includes(awayId)
          const oneBigTeam = BIG_TEAMS.includes(homeId) || BIG_TEAMS.includes(awayId)
          
          // 빅팀 vs 빅팀은 무조건 포함, 빅팀 경기는 주요 리그만
          const majorLeagues = [39, 140, 135, 78, 61, 2, 3]
          if (bothBigTeams) return true
          if (oneBigTeam && majorLeagues.includes(match.league.id)) return true
          return false
        })
        
        // 날짜 순으로 정렬
        bigMatches.sort((a, b) => {
          return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
        })
        
        setMatches(bigMatches.slice(0, 20)) // 최대 20개
      } catch (err) {
        setError('빅매치 일정을 불러올 수 없습니다')
        console.error('Error loading upcoming big matches:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUpcomingBigMatches()
  }, [])

  return { matches, isLoading, error }
}

// 커뮤니티 인기글 훅
export function usePopularPosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await CommunityService.getPopularPosts({ limit: 5 })
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
        
        // 오늘의 경기 수 (친선경기 포함)
        const todayData = await service.getFixturesByDate(new Date())
        
        // 라이브 경기 수
        const liveData = await service.getLiveFixtures()
        
        // 커뮤니티 통계
        const stats24h = await CommunityService.getStats24Hours()
        
        setStats({
          todayMatches: todayData?.response?.length || 0,
          liveMatches: liveData?.response?.length || 0,
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