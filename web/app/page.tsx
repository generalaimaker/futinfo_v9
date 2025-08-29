'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, TrendingUp, Users, 
  ChevronRight, Circle, Trophy, Star,
  Activity, Loader2, Sparkles, ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  useLiveMatches, 
  useTodayFixtures,
  useUpcomingBigMatches, 
  usePopularPosts, 
  useHomeStats 
} from '@/lib/hooks/useFootballData'
import { useStandings } from '@/lib/supabase/football'
import { useUserPreferences, usePersonalizedFixtures } from '@/lib/hooks/useUserPreferences'
import { usePopularNews } from '@/lib/supabase/cached-news'
import { formatDistanceToNow, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { adminService } from '@/lib/supabase/admin'
import { FootballAPIService } from '@/lib/supabase/football'

// 개선된 컴포넌트들
import { EnhancedHeroCarousel, HeroSlide } from '@/components/home/EnhancedHeroCarousel'
import { PersonalizedSection } from '@/components/home/PersonalizedSection'
import { NewsSection } from '@/components/home/NewsSection'
import { BigClubResults } from '@/components/home/BigClubResults'
import { TodayMatches } from '@/components/home/TodayMatches'
import { TrendingCommunity } from '@/components/home/TrendingCommunity'
import { MobileAppSection } from '@/components/home/MobileAppSection'

// 주요 팀 ID 및 우선순위 (높을수록 우선)
const MAJOR_TEAMS = {
  // 프리미어리그 빅6 (최고 우선순위)
  premier_big6: {
    teams: [33, 40, 50, 49, 42, 47], // 맨유, 리버풀, 맨시티, 첼시, 아스널, 토트넘
    priority: 100,
    rivalries: [
      [33, 40], // 맨유 vs 리버풀
      [42, 47], // 아스널 vs 토트넘
      [49, 42], // 첼시 vs 아스널
      [49, 47], // 첼시 vs 토트넘
    ]
  },
  // 라리가 상위 4팀
  laliga_top: {
    teams: [541, 529, 530, 531], // 레알, 바르샤, 아틀레티코, 세비야
    priority: 95,
    rivalries: [
      [541, 529], // 엘 클래시코
      [541, 530], // 마드리드 더비
    ]
  },
  // 세리에A 상위 4팀
  seriea_top: {
    teams: [496, 505, 489, 492], // 유벤투스, 인터, AC밀란, 나폴리
    priority: 90,
    rivalries: [
      [505, 489], // 밀라노 더비
      [505, 496], // 인터 vs 유벤투스
    ]
  },
  // 분데스리가 상위 4팀
  bundesliga_top: {
    teams: [157, 165, 168, 173], // 바이에른, 도르트문트, 레버쿠젠, 라이프치히
    priority: 85,
    rivalries: [
      [157, 165], // 데어 클래시커
    ]
  },
  // 리그1 상위 4팀
  ligue1_top: {
    teams: [85, 81, 91, 79], // PSG, 마르세유, 모나코, 릴
    priority: 80,
    rivalries: [
      [85, 81], // 클래시크
    ]
  }
}

const ALL_MAJOR_TEAMS = Object.values(MAJOR_TEAMS).flatMap(group => group.teams)
const ALL_RIVALRIES = Object.values(MAJOR_TEAMS).flatMap(group => group.rivalries || [])

// ============================================
// 경기 우선순위 계산 함수 (강화된 버전)
// ============================================
function calculateMatchPriority(match: any, userPreferences?: any) {
  let priority = 0
  let reason = ''
  const homeId = match.teams.home.id
  const awayId = match.teams.away.id

  // 1. 실시간 경기 (최우선)
  if (['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)) {
    priority += 2000
    reason = '🔴 실시간 경기'
  }

  // 2. 사용자 관심 팀 (로그인 시)
  if (userPreferences) {
    const isFavoriteTeam = userPreferences.favoriteTeamIds?.includes(homeId) ||
                           userPreferences.favoriteTeamIds?.includes(awayId)
    const isFavoriteLeague = userPreferences.favoriteLeagueIds?.includes(match.league.id)
    
    if (isFavoriteTeam) {
      priority += 1500
      reason = reason || '⭐ 내 팀 경기'
    } else if (isFavoriteLeague) {
      priority += 600
      reason = reason || '🏆 관심 리그'
    }
  }

  // 3. 라이벌전 확인 (최고 우선순위)
  const isRivalryMatch = ALL_RIVALRIES.some(([t1, t2]) => 
    (homeId === t1 && awayId === t2) || (homeId === t2 && awayId === t1)
  )
  if (isRivalryMatch) {
    priority += 1200
    reason = reason || '🔥 라이벌전'
  }

  // 4. 팀별 우선순위 (프리미어리그 빅6 최우선)
  let teamPriority = 0
  for (const [groupName, group] of Object.entries(MAJOR_TEAMS)) {
    const homeInGroup = group.teams.includes(homeId)
    const awayInGroup = group.teams.includes(awayId)
    
    if (homeInGroup && awayInGroup) {
      // 같은 그룹 내 경기 (예: 빅6 vs 빅6)
      teamPriority = Math.max(teamPriority, group.priority + 200)
      if (groupName === 'premier_big6') {
        reason = reason || '⚡ 프리미어 빅6 매치'
      }
    } else if (homeInGroup || awayInGroup) {
      // 한 팀만 해당 그룹
      teamPriority = Math.max(teamPriority, group.priority)
      if (groupName === 'premier_big6') {
        reason = reason || '✨ 프리미어 빅6'
      }
    }
  }
  priority += teamPriority

  // 5. 주요 대회
  const competitionPriority: Record<number, number> = {
    2: 800,    // Champions League
    3: 700,    // Europa League
    848: 600,  // Conference League
    1: 900,    // World Cup
    4: 850,    // Euro Championship
  }
  if (competitionPriority[match.league.id]) {
    priority += competitionPriority[match.league.id]
    reason = reason || '🏆 주요 대회'
  }

  // 6. 리그별 우선순위
  const leaguePriority: Record<number, number> = {
    39: 500,   // Premier League
    140: 450,  // La Liga
    135: 400,  // Serie A
    78: 350,   // Bundesliga
    61: 300,   // Ligue 1
    292: 200,  // K League 1
    293: 150,  // K League 2
  }
  if (leaguePriority[match.league.id]) {
    priority += leaguePriority[match.league.id]
    reason = reason || '📍 주요 리그'
  }

  // 7. 시간 임박도
  const matchTime = new Date(match.fixture.date).getTime()
  const now = Date.now()
  const hoursUntil = (matchTime - now) / (1000 * 60 * 60)
  
  if (hoursUntil > 0 && hoursUntil <= 2) {
    priority += 150
    reason = reason || '⏰ 곧 시작'
  } else if (hoursUntil > 0 && hoursUntil <= 6) {
    priority += 50
  }

  // 8. 주말 프라임타임 보너스
  const matchDate = new Date(match.fixture.date)
  const isWeekend = matchDate.getDay() === 0 || matchDate.getDay() === 6
  const hour = matchDate.getHours()
  if (isWeekend && (hour >= 14 && hour <= 22)) {
    priority += 100
  }

  return { priority, reason }
}

// ============================================
// 2. Quick Stats - 간단한 통계 (개선)
// ============================================
function QuickStats() {
  const { stats, isLoading } = useHomeStats()

  const items = [
    { 
      label: '라이브', 
      value: stats.liveMatches, 
      icon: Activity, 
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    { 
      label: '오늘 경기', 
      value: stats.todayMatches, 
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: '활성 유저', 
      value: stats.activeUsers, 
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: '새 글', 
      value: stats.newPosts, 
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item, idx) => (
        <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold mt-1">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  item.value?.toLocaleString() || 0
                )}
              </p>
            </div>
            <div className={cn("p-2 rounded-lg", item.bgColor)}>
              <item.icon className={cn("h-5 w-5", item.color)} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ============================================
// Secondary Matches - 제거됨 (TodayMatches로 대체)
// ============================================

// ============================================
// 4. Quick Actions - 빠른 액세스 (개선)
// ============================================
function QuickActions() {
  const { isAuthenticated } = useUserPreferences()
  
  const actions = [
    { 
      icon: Trophy, 
      label: '리그 순위', 
      href: '/standings',
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      icon: TrendingUp, 
      label: '이적시장', 
      href: '/transfer',
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      icon: Users, 
      label: '커뮤니티', 
      href: '/community',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: Star, 
      label: isAuthenticated ? '내 팀' : '로그인',
      href: isAuthenticated ? '/follow' : '/auth/login',
      color: 'from-green-500 to-teal-500'
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, idx) => (
        <Link key={idx} href={action.href}>
          <Card className="p-4 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
            <div className={cn(
              "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
              action.color
            )}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <p className="font-medium text-sm group-hover:text-primary transition-colors">
              {action.label}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// TrendingCommunity component is now imported from @/components/home/TrendingCommunity

// ============================================
// Main HomePage Component (개선)
// ============================================
export default function HomePage() {
  const { preferences, isAuthenticated } = useUserPreferences()
  const { matches: liveMatches, isLoading: liveLoading } = useLiveMatches()
  const { fixtures: todayFixtures, isLoading: fixturesLoading } = useTodayFixtures()
  const { matches: upcomingBigMatches, isLoading: bigMatchesLoading } = useUpcomingBigMatches()
  const { fixtures: personalizedFixtures } = usePersonalizedFixtures()
  const { posts: popularPosts } = usePopularPosts()
  const { data: popularNewsData } = usePopularNews(10)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateFixtures, setDateFixtures] = useState<any[]>(todayFixtures || [])
  const [fixturesCache, setFixturesCache] = useState<Map<string, any[]>>(new Map())
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false)
  const [featuredMatches, setFeaturedMatches] = useState<any[]>([])
  const [curatedNews, setCuratedNews] = useState<any[]>([])
  const [realFeaturedMatchData, setRealFeaturedMatchData] = useState<any[]>([])
  
  // 관리자가 선택한 추천 콘텐츠 가져오기
  useEffect(() => {
    const loadFeaturedContent = async () => {
      try {
        const [matches, news] = await Promise.all([
          adminService.getFeaturedMatches(),
          adminService.getCuratedNews()
        ])
        
        if (matches) {
          const featuredMatchList = matches.filter(m => m.is_featured)
          setFeaturedMatches(featuredMatchList)
          
          // 실제 경기 데이터 가져오기
          if (featuredMatchList.length > 0) {
            const footballAPI = new FootballAPIService()
            const realMatchDataPromises = featuredMatchList.map(async (match) => {
              try {
                // fixture ID로 실제 경기 데이터 가져오기
                const response = await footballAPI.getFixtureById(match.fixture_id)
                if (response?.response?.[0]) {
                  return {
                    ...match,
                    realData: response.response[0]
                  }
                }
              } catch (error) {
                console.error(`Error fetching fixture ${match.fixture_id}:`, error)
              }
              return match
            })
            
            const realMatchData = await Promise.all(realMatchDataPromises)
            setRealFeaturedMatchData(realMatchData)
          }
        }
        if (news) {
          setCuratedNews(news.filter(n => n.is_featured))
        }
      } catch (error) {
        console.error('Error loading featured content:', error)
      }
    }
    
    loadFeaturedContent()
    // 30초마다 업데이트
    const interval = setInterval(loadFeaturedContent, 30000)
    return () => clearInterval(interval)
  }, [])
  
  // 날짜별 경기 가져오기 (캐싱 포함)
  const fetchFixturesByDate = useCallback(async (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]
    
    // 캐시 확인
    if (fixturesCache.has(dateKey)) {
      setDateFixtures(fixturesCache.get(dateKey) || [])
      return
    }
    
    setIsLoadingFixtures(true)
    try {
      const footballAPIService = (await import('@/lib/supabase/football')).default
      const response = await footballAPIService.getFixturesByDate(date)
      
      if (response?.response) {
        setDateFixtures(response.response)
        // 캐시에 저장
        setFixturesCache(prev => new Map(prev).set(dateKey, response.response))
      }
    } catch (error) {
      console.error('Error fetching fixtures by date:', error)
      setDateFixtures([])
    } finally {
      setIsLoadingFixtures(false)
    }
  }, [fixturesCache])
  
  // 날짜 변경 시 경기 불러오기
  useEffect(() => {
    // 오늘이 선택된 날짜인 경우 이미 불러온 데이터 사용
    const today = new Date()
    if (selectedDate.toDateString() === today.toDateString() && todayFixtures.length > 0) {
      setDateFixtures(todayFixtures)
      // 오늘 날짜도 캐시에 저장 - 함수형 업데이트 사용
      const todayKey = today.toISOString().split('T')[0]
      if (!fixturesCache.has(todayKey)) {
        setFixturesCache(prev => new Map(prev).set(todayKey, todayFixtures))
      }
    } else {
      fetchFixturesByDate(selectedDate)
    }
    
    // 인접한 날짜 미리 가져오기 (프리페치)
    const prefetchAdjacentDates = async () => {
      const prevDate = addDays(selectedDate, -1)
      const nextDate = addDays(selectedDate, 1)
      const prevKey = prevDate.toISOString().split('T')[0]
      const nextKey = nextDate.toISOString().split('T')[0]
      
      // 이전 날짜 프리페치
      if (!fixturesCache.has(prevKey)) {
        try {
          const footballAPIService = (await import('@/lib/supabase/football')).default
          const response = await footballAPIService.getFixturesByDate(prevDate)
          if (response?.response) {
            setFixturesCache(prev => new Map(prev).set(prevKey, response.response))
          }
        } catch (error) {
          console.error('Error prefetching previous date:', error)
        }
      }
      
      // 다음 날짜 프리페치
      if (!fixturesCache.has(nextKey)) {
        try {
          const footballAPIService = (await import('@/lib/supabase/football')).default
          const response = await footballAPIService.getFixturesByDate(nextDate)
          if (response?.response) {
            setFixturesCache(prev => new Map(prev).set(nextKey, response.response))
          }
        } catch (error) {
          console.error('Error prefetching next date:', error)
        }
      }
    }
    
    // 100ms 딜레이 후 프리페치 시작
    const timer = setTimeout(prefetchAdjacentDates, 100)
    
    return () => clearTimeout(timer)
  }, [selectedDate, fetchFixturesByDate, todayFixtures, fixturesCache])
  
  // 여러 리그 순위 데이터 가져오기 (25-26 시즌)
  const { data: premierStandings } = useStandings({ league: 39, season: 2025 })
  const { data: laLigaStandings } = useStandings({ league: 140, season: 2025 })
  const { data: serieAStandings } = useStandings({ league: 135, season: 2025 })
  
  // 빅팀 판별 함수 (프리미어리그 빅6, 라리가 빅3 등)
  const isBigTeamMatch = (match: any) => {
    const homeId = match.teams.home.id
    const awayId = match.teams.away.id
    
    // 프리미어리그 빅6
    const premierBig6 = [33, 40, 50, 49, 42, 47]
    // 라리가 상위 4팀
    const laLigaBig4 = [541, 529, 530, 531]
    // 세리에A 상위 4팀
    const serieABig4 = [496, 505, 489, 492]
    // 분데스리가 상위 4팀
    const bundesligaBig4 = [157, 165, 168, 173]
    // 리그1 상위 4팀
    const ligue1Big4 = [85, 81, 91, 79]
    
    const allBigTeams = [...premierBig6, ...laLigaBig4, ...serieABig4, ...bundesligaBig4, ...ligue1Big4]
    
    return allBigTeams.includes(homeId) || allBigTeams.includes(awayId)
  }
  
  // 다양한 타입의 히어로 슬라이드 생성
  const heroSlides = useMemo(() => {
    const slides: HeroSlide[] = []
    
    // 관리자가 선택한 콘텐츠가 있으면 그것만 표시
    const hasAdminContent = featuredMatches.length > 0 || curatedNews.length > 0
    
    // 0. 관리자가 선택한 추천 경기 (최최우선)
    if (realFeaturedMatchData.length > 0) {
      realFeaturedMatchData
        .sort((a, b) => a.priority - b.priority) // 우선순위대로 정렬
        .slice(0, 3) // 상위 3개만
        .forEach((match, index) => {
          // 실제 경기 데이터가 있으면 그것을 사용, 없으면 저장된 데이터 사용
          const matchData = match.realData || {
            fixture: {
              id: match.fixture_id,
              date: match.match_date,
              status: { short: 'NS', long: 'Not Started', elapsed: null },
              venue: null
            },
            teams: match.teams_info,
            league: match.league_info,
            goals: { home: null, away: null }
          }
          
          slides.push({
            id: `featured-${match.fixture_id}`,
            type: 'match',
            priority: 2000 - index, // 가장 높은 우선순위
            data: matchData
          })
        })
    } else if (featuredMatches.length > 0) {
      // realFeaturedMatchData가 아직 로드되지 않았을 때 기본 데이터 사용
      featuredMatches
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3)
        .forEach((match, index) => {
          slides.push({
            id: `featured-${match.fixture_id}`,
            type: 'match',
            priority: 2000 - index,
            data: {
              fixture: {
                id: match.fixture_id,
                date: match.match_date,
                status: { short: 'NS', long: 'Not Started', elapsed: null },
                venue: null
              },
              teams: match.teams_info,
              league: match.league_info,
              goals: { home: null, away: null }
            }
          })
        })
    }
    
    // 관리자 콘텐츠가 있으면 자동 콘텐츠는 추가하지 않음
    if (!hasAdminContent) {
      // 1. 실시간 빅매치 (관리자 콘텐츠가 없을 때만)
      // 라이브 경기 중 빅팀 경기만 필터링
      const liveBigMatches = liveMatches
      .filter(match => {
        // 빅팀 경기인지 확인
        if (!isBigTeamMatch(match)) return false
        
        // 실시간 상태인지 확인
        const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)
        return isLive
      })
      .map(match => ({
        match,
        ...calculateMatchPriority(match, isAuthenticated ? preferences : null)
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 2) // 상위 2개까지로 줄임
    
    // 빅매치가 없으면 모든 라이브 경기 중 우선순위 높은 것 표시
    if (liveBigMatches.length === 0 && liveMatches.length > 0) {
      const topLiveMatches = liveMatches
        .map(match => ({
          match,
          ...calculateMatchPriority(match, isAuthenticated ? preferences : null)
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 2)
      
      topLiveMatches.forEach(({ match }, index) => {
        slides.push({
          id: `live-${match.fixture.id}`,
          type: 'match',
          priority: 900 + index, // 일반 라이브 경기는 낮은 우선순위
          data: match
        })
      })
    } else {
      // 빅매치가 있으면 빅매치만 표시
      liveBigMatches.forEach(({ match }, index) => {
        slides.push({
          id: `live-big-${match.fixture.id}`,
          type: 'match',
          priority: 1000 + (liveBigMatches.length - index), // 라이브 빅매치 최우선
          data: match
        })
      })
    }
    
      // 2. 개인화 콘텐츠 (로그인 사용자)
      if (isAuthenticated && preferences.favoriteTeamIds.length > 0) {
      // 관심 팀의 다음 경기
      const favoriteTeamMatch = personalizedFixtures.find(f => 
        preferences.favoriteTeamIds.includes(f.teams.home.id) ||
        preferences.favoriteTeamIds.includes(f.teams.away.id)
      )
      
      if (favoriteTeamMatch) {
        // 팀 정보 슬라이드
        slides.push({
          id: `team-${favoriteTeamMatch.teams.home.id}`,
          type: 'team',
          priority: 900,
          data: {
            team: favoriteTeamMatch.teams.home,
            league: favoriteTeamMatch.league,
            nextMatch: {
              opponent: favoriteTeamMatch.teams.away,
              date: favoriteTeamMatch.fixture.date,
              isHome: true
            },
            recentForm: 'WWDLW' // TODO: 실제 데이터로 교체
          }
        })
      }
    }
    
      // 3. 예정된 빅매치 (7일간의 빅매치)
      if (upcomingBigMatches && upcomingBigMatches.length > 0) {
      // 라이벌전 찾기
      const rivalryMatches = upcomingBigMatches.filter(match => {
        const homeId = match.teams.home.id
        const awayId = match.teams.away.id
        return ALL_RIVALRIES.some(([t1, t2]) => 
          (homeId === t1 && awayId === t2) || (homeId === t2 && awayId === t1)
        )
      })
      
      // 라이벌전이 있으면 최우선
      if (rivalryMatches.length > 0) {
        rivalryMatches.slice(0, 2).forEach((match, index) => {
          slides.push({
            id: `rivalry-${match.fixture.id}`,
            type: 'match',
            priority: 950 - index * 10,
            data: match
          })
        })
      }
      
      // 일반 빅매치 추가
      const regularBigMatches = upcomingBigMatches
        .filter(match => !rivalryMatches.includes(match))
        .slice(0, 3)
      
      regularBigMatches.forEach((match, index) => {
        if (slides.length < 5) {
          slides.push({
            id: `bigmatch-${match.fixture.id}`,
            type: 'match',
            priority: 850 - index * 10,
            data: match
          })
        }
      })
    }
    
      // 빅매치가 적으면 오늘의 일반 경기 중 우선순위 높은 것 표시
      if (slides.length < 3 && todayFixtures.length > 0) {
      const topMatches = todayFixtures
        .map(f => ({
          fixture: f,
          ...calculateMatchPriority(f, isAuthenticated ? preferences : null)
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 2)
      
      topMatches.forEach((match, index) => {
        if (slides.length < 5) {
          slides.push({
            id: `match-${match.fixture.fixture.id}`,
            type: 'match',
            priority: 700 + index,
            data: match.fixture
          })
        }
      })
    }
    } // if (!hasAdminContent) 종료
    
    // 4. 주요 뉴스 (관리자 선택 뉴스 우선)
    if (curatedNews.length > 0) {
        const adminNews = curatedNews
          .sort((a, b) => a.priority - b.priority)
          .slice(0, 3)
          .map((news: any) => ({
            id: news.id,
            title: news.title,
            description: news.description,
            image: news.image_url || '/images/news-placeholder.jpg',
            category: news.category || '뉴스',
            source: news.source_name,
            publishedAt: news.created_at
          }))
        
        slides.push({
          id: 'news-curated',
          type: 'news',
          priority: 1500, // 관리자 선택 뉴스는 높은 우선순위
          data: adminNews
        })
    } else if (!hasAdminContent && popularNewsData && popularNewsData.length > 0) {
        // 관리자 콘텐츠가 없을 때만 인기 뉴스 사용
        const topNews = popularNewsData.slice(0, 3).map((article: any) => {
          // 한국어 번역 우선 적용
          const hasKoreanTranslation = article.translations?.ko || 
                                       article.translations?.['ko'] ||
                                       article.translations?.['ko-KR']
          
          const title = hasKoreanTranslation 
            ? (article.translations.ko?.title || article.translations['ko']?.title || article.translations['ko-KR']?.title || article.title)
            : article.title
          
          const description = hasKoreanTranslation
            ? (article.translations.ko?.description || article.translations['ko']?.description || article.translations['ko-KR']?.description || article.description)
            : article.description
          
          return {
            id: article.id,
            title: title,
            description: description,
            image: article.image_url || '/images/news-placeholder.jpg',
            category: article.category === 'transfer' ? '이적시장' : 
                      article.category === 'injury' ? '부상' : '뉴스',
            source: article.source,
            publishedAt: article.published_at
          }
        })
      
        slides.push({
          id: 'news-main',
          type: 'news',
          priority: 700,
          data: topNews
        })
    }
    
    // 5. 리그 순위 통계 (관리자 콘텐츠가 없을 때만)
    if (!hasAdminContent) {
    const standingsSlides = []
    
    // 프리미어리그 순위
    if (premierStandings?.response?.[0]?.league?.standings?.[0]) {
      const topTeams = premierStandings.response[0].league.standings[0].slice(0, 5)
      standingsSlides.push({
        id: 'stats-premier',
        type: 'stats',
        priority: 650,
        data: {
          league: { id: 39, name: '프리미어 리그', logo: 'https://media.api-sports.io/football/leagues/39.png' },
          standings: topTeams
        }
      })
    }
    
    // 라리가 순위
    if (laLigaStandings?.response?.[0]?.league?.standings?.[0]) {
      const topTeams = laLigaStandings.response[0].league.standings[0].slice(0, 5)
      standingsSlides.push({
        id: 'stats-laliga',
        type: 'stats',
        priority: 640,
        data: {
          league: { id: 140, name: '라 리가', logo: 'https://media.api-sports.io/football/leagues/140.png' },
          standings: topTeams
        }
      })
    }
    
    // 세리에A 순위
    if (serieAStandings?.response?.[0]?.league?.standings?.[0]) {
      const topTeams = serieAStandings.response[0].league.standings[0].slice(0, 5)
      standingsSlides.push({
        id: 'stats-seriea',
        type: 'stats',
        priority: 630,
        data: {
          league: { id: 135, name: '세리에 A', logo: 'https://media.api-sports.io/football/leagues/135.png' },
          standings: topTeams
        }
      })
    }
    
      // 순위 슬라이드 중 하나를 랜덤하게 선택하거나 순차적으로 추가
      if (standingsSlides.length > 0 && slides.length < 5) {
        // 가장 높은 우선순위의 순위 슬라이드 추가
        slides.push(standingsSlides[0])
      }
    
      // 6. 프로모션/앱 홍보
      if (slides.length < 5 && !isAuthenticated) {
        slides.push({
          id: 'promo-app',
          type: 'promotion',
          priority: 500,
          data: {
            title: '모든 축구 정보를 한 곳에서',
            description: '로그인하고 좋아하는 팀을 팔로우하여 개인화된 콘텐츠를 받아보세요',
            buttonText: '지금 시작하기',
            features: [
              { icon: Activity, label: '실시간 경기' },
              { icon: TrendingUp, label: '이적시장' },
              { icon: Users, label: '커뮤니티' }
            ]
          }
        })
      }
    } // if (!hasAdminContent) for stats and promo
    
    // 최대 6개로 제한하고 우선순위로 정렬
    // 우선순위: 라이브 빅매치(1000+) > 라이벌전(950) > 예정 빅매치(850) > 순위(650) > 뉴스(700) > 프로모션(500)
    return slides
      .sort((a, b) => {
        // 실시간 경기가 가장 우선
        if (a.priority >= 1000 && b.priority < 1000) return -1
        if (b.priority >= 1000 && a.priority < 1000) return 1
        
        // 라이벌전/개인화 콘텐츠가 다음 우선
        if (a.priority >= 900 && a.priority < 1000 && b.priority < 900) return -1
        if (b.priority >= 900 && b.priority < 1000 && a.priority < 900) return 1
        
        // 빅매치가 다음 우선 (800~899)
        if (a.priority >= 800 && a.priority < 900 && b.priority < 800) return -1
        if (b.priority >= 800 && b.priority < 900 && a.priority < 800) return 1
        
        // 동일 범위 내에서는 높은 우선순위 순
        return b.priority - a.priority
      })
      .slice(0, 6)
  }, [liveMatches, todayFixtures, upcomingBigMatches, personalizedFixtures, preferences, isAuthenticated, 
      popularNewsData, premierStandings, laLigaStandings, serieAStandings, featuredMatches, curatedNews, realFeaturedMatchData])
  
  // 오늘의 경기 목록 (실시간, 예정, 완료)
  const todayMatches = useMemo(() => {
    // 라이브 경기와 오늘 경기를 합침
    const allTodayMatches = [...liveMatches, ...todayFixtures]
    
    // 중복 제거
    const uniqueMatches = allTodayMatches.filter((match, index, self) =>
      index === self.findIndex((m) => m.fixture.id === match.fixture.id)
    )
    
    // 우선순위 계산 및 정렬
    return uniqueMatches
      .map(match => {
        const { priority, reason } = calculateMatchPriority(match, isAuthenticated ? preferences : null)
        return { ...match, priority, reason }
      })
      .sort((a, b) => {
        // 라이브 경기 최우선
        const aLive = ['LIVE', '1H', '2H', 'HT'].includes(a.fixture?.status?.short)
        const bLive = ['LIVE', '1H', '2H', 'HT'].includes(b.fixture?.status?.short)
        if (aLive && !bLive) return -1
        if (!aLive && bLive) return 1
        
        // 그 다음 우선순위로 정렬
        return b.priority - a.priority
      })
      .slice(0, 20) // 최대 20경기만 표시
  }, [liveMatches, todayFixtures, preferences, isAuthenticated])

  const hasPersonalizedContent = isAuthenticated && 
    (preferences.favoriteTeamIds.length > 0 || preferences.favoriteLeagueIds.length > 0)

  return (
    <div className="min-h-screen lg:ml-64">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Enhanced Hero Carousel - 다양한 콘텐츠 6개 */}
        <EnhancedHeroCarousel 
          slides={heroSlides} 
          isLoading={liveLoading || fixturesLoading || bigMatchesLoading}
          autoPlayInterval={5000}
          onSlideChange={(index) => console.log('현재 슬라이드:', index)}
        />
        
        {/* 오늘의 경기 (실시간/예정/진행) - FotMob 스타일 */}
        <TodayMatches 
          initialMatches={dateFixtures}
          onDateChange={(date) => {
            setSelectedDate(date)
          }}
        />
        
        {/* 빅클럽 경기 결과 섹션 - 그 다음 배치 */}
        <BigClubResults />
        
        {/* Quick Stats - 간단한 통계 - 제거 */}
        {/* <QuickStats /> */}
        
        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Personalized Content for logged-in users */}
          {hasPersonalizedContent && <PersonalizedSection />}
          
          {/* News Section */}
          <NewsSection />
          
          {/* Trending Community - 전체 너비 */}
          <TrendingCommunity />
          
          {/* Mobile App Section - 전체 너비 */}
          <MobileAppSection />
        </div>
      </div>
    </div>
  )
}