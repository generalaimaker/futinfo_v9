'use client'

import { useState, useEffect, useMemo } from 'react'
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
  usePopularPosts, 
  useHomeStats 
} from '@/lib/hooks/useFootballData'
import { useUserPreferences, usePersonalizedFixtures } from '@/lib/hooks/useUserPreferences'
import { usePopularNews } from '@/lib/supabase/cached-news'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

// 개선된 컴포넌트들
import { EnhancedHeroCarousel, HeroSlide } from '@/components/home/EnhancedHeroCarousel'
import { PersonalizedSection } from '@/components/home/PersonalizedSection'
import { NewsSection } from '@/components/home/NewsSection'

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
  // 라리가 주요 팀
  laliga_top: {
    teams: [541, 529, 530], // 레알, 바르샤, 아틀레티코
    priority: 95,
    rivalries: [
      [541, 529], // 엘 클래시코
      [541, 530], // 마드리드 더비
    ]
  },
  // 세리에A 주요 팀
  seriea_top: {
    teams: [496, 505, 489, 492], // 유벤투스, 인터, AC밀란, 나폴리
    priority: 90,
    rivalries: [
      [505, 489], // 밀라노 더비
      [505, 496], // 인터 vs 유벤투스
    ]
  },
  // 분데스리가 주요 팀
  bundesliga_top: {
    teams: [157, 165, 168], // 바이에른, 도르트문트, 레버쿠젠
    priority: 85,
    rivalries: [
      [157, 165], // 데어 클래시커
    ]
  },
  // 리그1 주요 팀
  ligue1_top: {
    teams: [85, 81, 91], // PSG, 마르세유, 모나코
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
// Secondary Matches - 주요 경기 목록 (대폭 개선)
// ============================================
function SecondaryMatches({ matches, title = "주요 경기" }: { matches: any[], title?: string }) {
  if (matches.length === 0) return null

  // 리그별로 그룹화
  const groupedMatches = matches.reduce((acc, match) => {
    const leagueId = match.league.id
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: match.league,
        matches: [],
        priority: match.priority || 0
      }
    }
    acc[leagueId].matches.push(match)
    return acc
  }, {} as Record<number, { league: any, matches: any[], priority: number }>)

  // 리그 우선순위로 정렬
  const sortedGroups = (Object.values(groupedMatches) as { league: any, matches: any[], priority: number }[])
    .sort((a, b) => {
      const leaguePriority = { 39: 1, 140: 2, 135: 3, 78: 4, 61: 5, 2: 0 }
      return (leaguePriority[a.league.id as keyof typeof leaguePriority] || 99) - 
             (leaguePriority[b.league.id as keyof typeof leaguePriority] || 99)
    })

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h4 className="font-semibold text-lg">{title}</h4>
          <Badge variant="secondary" className="text-xs">
            {matches.length}개 경기
          </Badge>
        </div>
        <Link href="/fixtures" className="text-sm text-primary hover:underline flex items-center gap-1">
          전체보기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* 리그별 경기 표시 */}
      <div className="space-y-6">
        {sortedGroups.slice(0, 3).map(({ league, matches: leagueMatches }) => {
          const getLeagueStyle = (leagueId: number) => {
            const styles: Record<number, { bg: string, border: string, flag: string }> = {
              39: { bg: 'bg-purple-50', border: 'border-purple-200', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
              140: { bg: 'bg-orange-50', border: 'border-orange-200', flag: '🇪🇸' },
              135: { bg: 'bg-blue-50', border: 'border-blue-200', flag: '🇮🇹' },
              78: { bg: 'bg-red-50', border: 'border-red-200', flag: '🇩🇪' },
              61: { bg: 'bg-blue-50', border: 'border-blue-200', flag: '🇫🇷' },
              2: { bg: 'bg-indigo-50', border: 'border-indigo-200', flag: '⭐' },
            }
            return styles[leagueId] || { bg: 'bg-gray-50', border: 'border-gray-200', flag: '⚽' }
          }

          const style = getLeagueStyle(league.id)

          return (
            <div key={league.id}>
              {/* 리그 헤더 */}
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-t-lg border-b",
                style.bg, style.border
              )}>
                <span className="text-lg">{style.flag}</span>
                <span className="font-semibold text-sm">{league.name}</span>
                <Badge variant="outline" className="text-xs">
                  {leagueMatches.length}경기
                </Badge>
              </div>

              {/* 경기 목록 */}
              <div className={cn("border-l border-r border-b rounded-b-lg", style.border)}>
                {leagueMatches.slice(0, 4).map((match, index) => {
                  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)
                  const isFinished = match.fixture?.status?.short === 'FT'
                  const homeId = match.teams.home.id
                  const awayId = match.teams.away.id
                  
                  // 빅6 팀 확인
                  const premierBig6 = [33, 40, 50, 49, 42, 47]
                  const isBig6Match = premierBig6.includes(homeId) || premierBig6.includes(awayId)
                  
                  // 라이벌전 확인
                  const isRivalry = ALL_RIVALRIES.some(([t1, t2]) => 
                    (homeId === t1 && awayId === t2) || (homeId === t2 && awayId === t1)
                  )
                  
                  return (
                    <Link
                      key={match.fixture.id}
                      href={`/fixtures/${match.fixture.id}`}
                      className={cn(
                        "block p-4 transition-all relative",
                        index < leagueMatches.slice(0, 4).length - 1 && "border-b border-gray-100",
                        isLive && "bg-red-50/50",
                        isBig6Match && "bg-yellow-50/30",
                        isRivalry && "bg-red-50/30",
                        "hover:bg-white/80"
                      )}
                    >
                      {/* 특별 경기 표시 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-1">
                          {isLive && (
                            <Badge variant="destructive" className="text-xs px-2 py-0 animate-pulse">
                              LIVE
                            </Badge>
                          )}
                          {isRivalry && (
                            <Badge className="text-xs px-2 py-0 bg-red-100 text-red-700">
                              🔥 라이벌전
                            </Badge>
                          )}
                          {isBig6Match && league.id === 39 && (
                            <Badge className="text-xs px-2 py-0 bg-purple-100 text-purple-700">
                              ⚡ 빅6
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {match.priority ? `우선도: ${Math.round(match.priority)}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        {/* 홈팀 */}
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className={cn(
                            "text-sm font-medium truncate max-w-[120px] text-right",
                            (isBig6Match || isRivalry) && "font-semibold"
                          )}>
                            {match.teams.home.name}
                          </span>
                          <Image
                            src={match.teams.home.logo}
                            alt=""
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                        </div>
                        
                        {/* 점수 또는 시간 */}
                        <div className="min-w-[100px] text-center">
                          {isLive || isFinished ? (
                            <div>
                              <div className="text-xl font-bold">
                                {match.goals?.home ?? 0} - {match.goals?.away ?? 0}
                              </div>
                              {isLive && (
                                <span className="text-xs text-red-600 font-medium">
                                  {match.fixture.status.elapsed}'
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-base font-semibold">
                                {new Date(match.fixture.date).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(match.fixture.date).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 원정팀 */}
                        <div className="flex items-center gap-2 flex-1">
                          <Image
                            src={match.teams.away.logo}
                            alt=""
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                          <span className={cn(
                            "text-sm font-medium truncate max-w-[120px]",
                            (isBig6Match || isRivalry) && "font-semibold"
                          )}>
                            {match.teams.away.name}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

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

// ============================================
// 5. Trending Community - 인기 커뮤니티 (개선)
// ============================================
function TrendingCommunity() {
  const { posts, isLoading } = usePopularPosts()

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-secondary rounded w-1/3" />
          <div className="h-20 bg-secondary rounded" />
        </div>
      </Card>
    )
  }

  if (posts.length === 0) return null

  // 가장 인기있는 포스트 1개만 표시
  const topPost = posts[0]

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">커뮤니티 인기글</h3>
        </div>
        <Link href="/community" className="text-sm text-primary hover:underline">
          더보기
        </Link>
      </div>
      
      <Link href={`/community/posts/${topPost.id}`} className="block group">
        <h4 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {topPost.title}
        </h4>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{topPost.author?.username || '익명'}</span>
            <span>💬 {topPost.comment_count}</span>
            <span>❤️ {topPost.like_count}</span>
          </div>
          <span>
            {formatDistanceToNow(new Date(topPost.created_at), { 
              addSuffix: true, 
              locale: ko 
            })}
          </span>
        </div>
      </Link>
    </Card>
  )
}

// ============================================
// Main HomePage Component (개선)
// ============================================
export default function HomePage() {
  const { preferences, isAuthenticated } = useUserPreferences()
  const { matches: liveMatches, isLoading: liveLoading } = useLiveMatches()
  const { fixtures: todayFixtures, isLoading: fixturesLoading } = useTodayFixtures()
  const { fixtures: personalizedFixtures } = usePersonalizedFixtures()
  const { posts: popularPosts } = usePopularPosts()
  const { data: popularNewsData } = usePopularNews(10)
  
  // 빅팀 판별 함수 (프리미어리그 빅6, 라리가 빅3 등)
  const isBigTeamMatch = (match: any) => {
    const homeId = match.teams.home.id
    const awayId = match.teams.away.id
    
    // 프리미어리그 빅6
    const premierBig6 = [33, 40, 50, 49, 42, 47]
    // 라리가 빅3
    const laLigaBig3 = [541, 529, 530]
    // 세리에A 빅4
    const serieABig4 = [496, 505, 489, 492]
    // 분데스리가 빅2
    const bundesligaBig2 = [157, 165]
    // 리그1 빅2
    const ligue1Big2 = [85, 81]
    
    const allBigTeams = [...premierBig6, ...laLigaBig3, ...serieABig4, ...bundesligaBig2, ...ligue1Big2]
    
    return allBigTeams.includes(homeId) || allBigTeams.includes(awayId)
  }
  
  // 다양한 타입의 히어로 슬라이드 생성
  const heroSlides = useMemo(() => {
    const slides: HeroSlide[] = []
    
    // 1. 실시간 빅매치 (최우선) - 주요 팀의 라이브 경기만 표시
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
      .slice(0, 3) // 상위 3개까지
    
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
    
    // 3. 오늘의 빅매치 경기 (프리미어리그 빅6, 라리가 빅3 등 우선)
    const todayBigTeamMatches = todayFixtures
      .filter(match => isBigTeamMatch(match)) // 빅팀 경기만 필터링
      .map(f => ({
        fixture: f,
        ...calculateMatchPriority(f, isAuthenticated ? preferences : null)
      }))
      .sort((a, b) => b.priority - a.priority) // 우선순위 순 정렬
    
    // 빅팀 경기를 슬라이드에 추가
    todayBigTeamMatches.slice(0, 3).forEach((match, index) => {
      if (slides.length < 5) {
        slides.push({
          id: `bigmatch-${match.fixture.fixture.id}`,
          type: 'match',
          priority: 800 + (todayBigTeamMatches.length - index) * 10, // 더 높은 우선순위일수록 앞에
          data: match.fixture
        })
      }
    })
    
    // 빅팀 경기가 없으면 일반 경기 중 우선순위 높은 것 표시
    if (todayBigTeamMatches.length === 0 && todayFixtures.length > 0) {
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
    
    // 4. 주요 뉴스 (실제 뉴스 데이터 사용)
    if (slides.length < 5 && popularNewsData && popularNewsData.length > 0) {
      // 상위 3개 뉴스만 가져와서 필요한 형식으로 변환
      const topNews = popularNewsData.slice(0, 3).map((article: any) => ({
        id: article.id,
        title: article.title,
        description: article.description,
        image: article.image_url || '/images/news-placeholder.jpg',
        category: article.category === 'transfer' ? '이적시장' : 
                  article.category === 'injury' ? '부상' : '뉴스',
        source: article.source,
        publishedAt: article.published_at
      }))
      
      slides.push({
        id: 'news-main',
        type: 'news',
        priority: 700,
        data: topNews
      })
    }
    
    // 5. 리그 순위 통계
    if (slides.length < 5) {
      slides.push({
        id: 'stats-premier',
        type: 'stats',
        priority: 600,
        data: {
          league: { id: 39, name: '프리미어 리그' },
          standings: [
            { team: { id: 40, name: '리버풀', logo: 'https://media.api-sports.io/football/teams/40.png' }, all: { played: 20 }, points: 45, goalsDiff: 28 },
            { team: { id: 50, name: '맨체스터 시티', logo: 'https://media.api-sports.io/football/teams/50.png' }, all: { played: 20 }, points: 43, goalsDiff: 25 },
            { team: { id: 42, name: '아스널', logo: 'https://media.api-sports.io/football/teams/42.png' }, all: { played: 20 }, points: 40, goalsDiff: 22 },
            { team: { id: 47, name: '토트넘', logo: 'https://media.api-sports.io/football/teams/47.png' }, all: { played: 20 }, points: 39, goalsDiff: 18 },
            { team: { id: 49, name: '첼시', logo: 'https://media.api-sports.io/football/teams/49.png' }, all: { played: 20 }, points: 35, goalsDiff: 15 }
          ]
        }
      })
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
    
    // 최대 5개로 제한하고 우선순위로 정렬 (빅매치 우선)
    return slides
      .sort((a, b) => {
        // 실시간 경기가 가장 우선
        if (a.priority >= 1000 && b.priority < 1000) return -1
        if (b.priority >= 1000 && a.priority < 1000) return 1
        
        // 개인화 콘텐츠가 다음 우선
        if (a.priority >= 900 && a.priority < 1000 && b.priority < 900) return -1
        if (b.priority >= 900 && b.priority < 1000 && a.priority < 900) return 1
        
        // 빅매치가 다음 우선 (800~899)
        if (a.priority >= 800 && a.priority < 900 && b.priority < 800) return -1
        if (b.priority >= 800 && b.priority < 900 && a.priority < 800) return 1
        
        // 동일 범위 내에서는 높은 우선순위 순
        return b.priority - a.priority
      })
      .slice(0, 5)
  }, [liveMatches, todayFixtures, personalizedFixtures, preferences, isAuthenticated, popularNewsData, isBigTeamMatch])
  
  // 하위 경기 목록을 위한 데이터 (빅팀 경기 우선)
  const allMatches = [...liveMatches, ...todayFixtures]
  const uniqueMatches = allMatches.filter((match, index, self) =>
    index === self.findIndex((m) => m.fixture.id === match.fixture.id)
  )
  
  // 빅팀 경기와 일반 경기 분리
  const bigTeamMatches = uniqueMatches.filter(match => isBigTeamMatch(match))
  const otherMatches = uniqueMatches.filter(match => !isBigTeamMatch(match))
  
  // 각각 우선순위 계산 후 정렬
  const sortedBigTeamMatches = bigTeamMatches
    .map(match => {
      const { priority, reason } = calculateMatchPriority(match, isAuthenticated ? preferences : null)
      return { ...match, priority: priority + 500, reason } // 빅팀 보너스
    })
    .sort((a, b) => b.priority - a.priority)
  
  const sortedOtherMatches = otherMatches
    .map(match => {
      const { priority, reason } = calculateMatchPriority(match, isAuthenticated ? preferences : null)
      return { ...match, priority, reason }
    })
    .sort((a, b) => b.priority - a.priority)
  
  // 빅팀 경기를 먼저, 그 다음 일반 경기
  const secondaryMatches = [...sortedBigTeamMatches, ...sortedOtherMatches]
    .slice(5, 20) // 더 많은 경기 표시

  const hasPersonalizedContent = isAuthenticated && 
    (preferences.favoriteTeamIds.length > 0 || preferences.favoriteLeagueIds.length > 0)

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Enhanced Hero Carousel - 다양한 콘텐츠 5개 */}
        <EnhancedHeroCarousel 
          slides={heroSlides} 
          isLoading={liveLoading || fixturesLoading}
          autoPlayInterval={5000}
          onSlideChange={(index) => console.log('현재 슬라이드:', index)}
        />
        
        {/* Secondary Matches - 캐러셀 아래 경기 목록 */}
        {secondaryMatches.length > 0 && (
          <SecondaryMatches matches={secondaryMatches} title="다른 경기" />
        )}
        
        {/* Quick Stats - 간단한 통계 */}
        <QuickStats />
        
        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personalized Content for logged-in users */}
            {hasPersonalizedContent && <PersonalizedSection />}
            
            {/* News Section */}
            <NewsSection />
          </div>
          
          {/* Right Column - Secondary Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions />
            
            {/* Trending Community */}
            <TrendingCommunity />
            
            {/* Mobile App Promo */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent">
              <h3 className="font-semibold mb-2">📱 모바일 앱</h3>
              <p className="text-sm text-muted-foreground mb-3">
                언제 어디서나 실시간 축구 정보
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled className="text-xs">
                  iOS 준비중
                </Button>
                <Button size="sm" variant="outline" disabled className="text-xs">
                  Android 준비중
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}