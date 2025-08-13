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
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

// 개선된 컴포넌트들
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { PersonalizedSection } from '@/components/home/PersonalizedSection'
import { NewsSection } from '@/components/home/NewsSection'

// 주요 팀 ID (유럽 빅클럽)
const MAJOR_TEAMS = {
  premier: [33, 40, 50, 49, 42, 47], // 맨유, 리버풀, 맨시티, 첼시, 아스널, 토트넘
  laliga: [541, 529, 530], // 레알, 바르샤, 아틀레티코
  seriea: [496, 505, 489], // 유벤투스, 인터, AC밀란
  bundesliga: [157, 165], // 바이에른, 도르트문트
  ligue1: [85], // PSG
}

const ALL_MAJOR_TEAMS = Object.values(MAJOR_TEAMS).flat()

// ============================================
// 경기 우선순위 계산 함수
// ============================================
function calculateMatchPriority(match: any, userPreferences?: any) {
  let priority = 0
  let reason = ''

  // 1. 실시간 경기 (최우선)
  if (['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)) {
    priority += 1000
    reason = '🔴 실시간 경기'
    
    // 실시간 + 빅매치
    if (ALL_MAJOR_TEAMS.includes(match.teams.home.id) || ALL_MAJOR_TEAMS.includes(match.teams.away.id)) {
      priority += 500
      reason = '⚡ 실시간 빅매치'
    }
  }

  // 2. 사용자 관심 팀 (로그인 시)
  if (userPreferences) {
    const isFavoriteTeam = userPreferences.favoriteTeamIds?.includes(match.teams.home.id) ||
                           userPreferences.favoriteTeamIds?.includes(match.teams.away.id)
    const isFavoriteLeague = userPreferences.favoriteLeagueIds?.includes(match.league.id)
    
    if (isFavoriteTeam) {
      priority += 800
      reason = reason || '⭐ 내 팀 경기'
    } else if (isFavoriteLeague) {
      priority += 400
      reason = reason || '🏆 관심 리그'
    }
  }

  // 3. 주요 대회
  const majorCompetitions = [2, 3, 1] // 챔스, 유로파, 월드컵
  if (majorCompetitions.includes(match.league.id)) {
    priority += 600
    reason = reason || '🏆 주요 대회'
  }

  // 4. 빅매치 (라이벌전)
  const homeId = match.teams.home.id
  const awayId = match.teams.away.id
  const rivalries = [
    [33, 40], // 맨유 vs 리버풀
    [529, 541], // 바르샤 vs 레알
    [505, 489], // 인터 vs AC밀란
    [157, 165], // 바이에른 vs 도르트문트
  ]
  
  if (rivalries.some(([t1, t2]) => 
    (homeId === t1 && awayId === t2) || (homeId === t2 && awayId === t1)
  )) {
    priority += 700
    reason = reason || '🔥 라이벌전'
  }

  // 5. 유럽 빅클럽 경기
  if (ALL_MAJOR_TEAMS.includes(homeId) || ALL_MAJOR_TEAMS.includes(awayId)) {
    priority += 300
    reason = reason || '✨ 빅클럽 경기'
  }

  // 6. 주요 리그
  const majorLeagues = [39, 140, 135, 78, 61] // EPL, 라리가, 세리에A, 분데스, 리그1
  if (majorLeagues.includes(match.league.id)) {
    priority += 200
    reason = reason || '📍 주요 리그'
  }

  // 7. 시간 임박도 (앞으로 2시간 이내)
  const matchTime = new Date(match.fixture.date).getTime()
  const now = Date.now()
  const hoursUntil = (matchTime - now) / (1000 * 60 * 60)
  
  if (hoursUntil > 0 && hoursUntil <= 2) {
    priority += 100
    reason = reason || '⏰ 곧 시작'
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
// Secondary Matches - 하위 경기 목록 (개선)
// ============================================
function SecondaryMatches({ matches, title = "기타 경기" }: { matches: any[], title?: string }) {
  if (matches.length === 0) return null

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-lg">{title}</h4>
        <Link href="/fixtures" className="text-sm text-primary hover:underline">
          전체보기
        </Link>
      </div>
      
      <div className="space-y-3">
        {matches.slice(0, 8).map((match) => {
          const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)
          const isFinished = match.fixture?.status?.short === 'FT'
          
          return (
            <Link
              key={match.fixture.id}
              href={`/fixtures/${match.fixture.id}`}
              className="block p-4 rounded-lg hover:bg-secondary/50 transition-all border border-border/50 hover:border-border"
            >
              <div className="flex items-center justify-center gap-4">
                {/* 홈팀 */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm font-medium truncate max-w-[120px] text-right">
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
                
                {/* 점수 또는 시간 (중앙) */}
                <div className="min-w-[100px] text-center">
                  {isLive || isFinished ? (
                    <div>
                      <div className="text-xl font-bold">
                        {match.goals?.home ?? 0} - {match.goals?.away ?? 0}
                      </div>
                      {isLive && (
                        <Badge variant="destructive" className="text-xs px-2 py-0 animate-pulse mt-1">
                          {match.fixture.status.elapsed}'
                        </Badge>
                      )}
                      {isFinished && (
                        <span className="text-xs text-muted-foreground">종료</span>
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
                        {match.league.name}
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
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {match.teams.away.name}
                  </span>
                </div>
              </div>
              
              {/* 우선순위 이유 표시 */}
              {match.reason && (
                <div className="mt-2 text-center">
                  <Badge variant="secondary" className="text-xs">
                    {match.reason}
                  </Badge>
                </div>
              )}
            </Link>
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
  
  // 모든 경기를 우선순위에 따라 정렬
  const prioritizedMatches = useMemo(() => {
    const allMatches = [...liveMatches, ...todayFixtures, ...personalizedFixtures]
    
    // 중복 제거
    const uniqueMatches = allMatches.filter((match, index, self) =>
      index === self.findIndex((m) => m.fixture.id === match.fixture.id)
    )
    
    // 우선순위 계산 및 정렬
    const matchesWithPriority = uniqueMatches.map(match => {
      const { priority, reason } = calculateMatchPriority(match, isAuthenticated ? preferences : null)
      return { ...match, priority, reason }
    })
    
    return matchesWithPriority.sort((a, b) => b.priority - a.priority)
  }, [liveMatches, todayFixtures, personalizedFixtures, preferences, isAuthenticated])

  // 상위 5개는 캐러셀, 나머지는 리스트
  const heroMatches = prioritizedMatches.slice(0, 5)
  const secondaryMatches = prioritizedMatches.slice(5, 15)

  const hasPersonalizedContent = isAuthenticated && 
    (preferences.favoriteTeamIds.length > 0 || preferences.favoriteLeagueIds.length > 0)

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Hero Carousel - 주요 경기 5개 */}
        <HeroCarousel 
          matches={heroMatches} 
          isLoading={liveLoading || fixturesLoading}
          autoPlayInterval={7000}
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