'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, TrendingUp, Users, 
  ChevronRight, Circle, Zap, Trophy,
  Star, AlertCircle, ArrowRight, RefreshCw,
  Loader2, Sparkles, Shield, Activity,
  Play, Info, ChevronLeft, ChevronDown
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
import { PersonalizedSection } from '@/components/home/PersonalizedSection'
import { LiveScoreSection } from '@/components/home/LiveScoreSection'
import { NewsSection } from '@/components/home/NewsSection'

// ============================================
// 1. Hero Section - 주요 경기 하이라이트 (개선)
// ============================================
function HeroSection() {
  const { fixtures, isLoading } = useTodayFixtures()
  const { matches: liveMatches } = useLiveMatches()
  
  // 우선순위: 라이브 > 빅매치 > 오늘 경기
  const heroMatch = liveMatches[0] || fixtures.find(f => {
    const MAJOR_TEAMS = [33, 40, 50, 49, 42, 47, 541, 529, 530, 496, 505, 489, 157, 165, 85]
    return MAJOR_TEAMS.includes(f.teams.home.id) || MAJOR_TEAMS.includes(f.teams.away.id)
  }) || fixtures[0]

  if (!heroMatch || isLoading) {
    return (
      <div className="relative h-[280px] md:h-[320px] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const isLive = heroMatch.fixture?.status?.short === 'LIVE' || 
                 heroMatch.fixture?.status?.short === '1H' || 
                 heroMatch.fixture?.status?.short === '2H'

  return (
    <div className="relative h-[280px] md:h-[320px] rounded-2xl overflow-hidden group">
      {/* Background with team colors gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20" />
      
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full animate-pulse">
            <Circle className="w-2 h-2 fill-current" />
            <span className="text-xs font-bold text-white">LIVE</span>
            <span className="text-xs text-white">{heroMatch.fixture.status.elapsed}'</span>
          </div>
        </div>
      )}

      {/* League badge */}
      <div className="absolute top-4 right-4 z-20">
        <Badge className="bg-black/50 backdrop-blur text-white border-0 px-3 py-1">
          {heroMatch.league.name}
        </Badge>
      </div>

      {/* Match content */}
      <div className="relative h-full flex flex-col justify-center p-8 md:p-12">
        <div className="max-w-4xl mx-auto w-full">
          {/* Teams */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 flex items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 p-2 bg-white/10 backdrop-blur rounded-xl">
                <Image
                  src={heroMatch.teams.home.logo}
                  alt={heroMatch.teams.home.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {heroMatch.teams.home.name}
                </h3>
                <p className="text-sm text-white/60">홈</p>
              </div>
            </div>

            {/* Score or Time */}
            <div className="px-6 md:px-8 text-center">
              {isLive || heroMatch.fixture.status.short === 'FT' ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    {heroMatch.goals?.home ?? 0}
                  </span>
                  <span className="text-2xl text-white/40">:</span>
                  <span className="text-4xl md:text-5xl font-bold text-white">
                    {heroMatch.goals?.away ?? 0}
                  </span>
                </div>
              ) : (
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {new Date(heroMatch.fixture.date).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-sm text-white/60 mt-1">
                    {new Date(heroMatch.fixture.date).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 flex items-center gap-4 justify-end">
              <div className="text-right">
                <h3 className="text-xl md:text-2xl font-bold text-white">
                  {heroMatch.teams.away.name}
                </h3>
                <p className="text-sm text-white/60">원정</p>
              </div>
              <div className="w-16 h-16 md:w-20 md:h-20 p-2 bg-white/10 backdrop-blur rounded-xl">
                <Image
                  src={heroMatch.teams.away.logo}
                  alt={heroMatch.teams.away.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Stadium info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              📍 {heroMatch.fixture.venue.name}, {heroMatch.fixture.venue.city}
            </p>
            <Link href={`/fixtures/${heroMatch.fixture.id}`}>
              <Button 
                size="sm" 
                className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0"
              >
                경기 상세보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
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
// 3. Live & Upcoming Matches (통합 및 개선)
// ============================================
function MatchesSection() {
  const { matches: liveMatches, isLoading: liveLoading } = useLiveMatches()
  const { fixtures: upcomingMatches, isLoading: upcomingLoading } = useTodayFixtures()
  const { preferences } = useUserPreferences()
  const [viewMode, setViewMode] = useState<'live' | 'upcoming'>('live')

  const hasLiveMatches = liveMatches.length > 0
  const displayMatches = viewMode === 'live' ? liveMatches : upcomingMatches
  const isLoading = viewMode === 'live' ? liveLoading : upcomingLoading

  return (
    <Card className="p-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">경기</h3>
          {hasLiveMatches && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 rounded-full">
              <Circle className="w-2 h-2 fill-red-500 text-red-500" />
              <span className="text-xs font-medium text-red-500">{liveMatches.length} LIVE</span>
            </div>
          )}
        </div>
        
        {/* Toggle buttons */}
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'live' ? 'default' : 'ghost'}
            onClick={() => setViewMode('live')}
            className="h-7 px-3"
          >
            라이브
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'upcoming' ? 'default' : 'ghost'}
            onClick={() => setViewMode('upcoming')}
            className="h-7 px-3"
          >
            예정
          </Button>
        </div>
      </div>

      {/* Matches list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {viewMode === 'live' ? '진행 중인 경기가 없습니다' : '오늘 예정된 경기가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayMatches.slice(0, 5).map((match) => {
            const isFavorite = preferences.favoriteTeamIds.includes(match.teams.home.id) ||
                              preferences.favoriteTeamIds.includes(match.teams.away.id)
            
            return (
              <Link
                key={match.fixture.id}
                href={`/fixtures/${match.fixture.id}`}
                className={cn(
                  "block p-4 rounded-lg transition-all hover:bg-secondary",
                  isFavorite && "bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-500/20"
                )}
              >
                <div className="flex items-center justify-between">
                  {/* Teams */}
                  <div className="flex-1 flex items-center gap-3">
                    <Image
                      src={match.teams.home.logo}
                      alt=""
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-medium text-sm">{match.teams.home.name}</span>
                    
                    {/* Score or VS */}
                    <div className="px-3 text-center">
                      {viewMode === 'live' || match.fixture.status.short === 'FT' ? (
                        <span className="font-bold">
                          {match.goals?.home ?? 0} - {match.goals?.away ?? 0}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">vs</span>
                      )}
                    </div>
                    
                    <span className="font-medium text-sm">{match.teams.away.name}</span>
                    <Image
                      src={match.teams.away.logo}
                      alt=""
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>

                  {/* Status/Time */}
                  <div className="text-right ml-4">
                    {viewMode === 'live' ? (
                      <Badge variant="destructive" className="animate-pulse">
                        {match.fixture.status.elapsed}'
                      </Badge>
                    ) : (
                      <div>
                        <div className="text-sm font-medium">
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
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* View all link */}
      {displayMatches.length > 5 && (
        <div className="mt-4 pt-4 border-t">
          <Link href="/fixtures" className="flex items-center justify-center text-sm text-primary hover:underline">
            전체 경기 보기
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      )}
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
  const hasPersonalizedContent = isAuthenticated && 
    (preferences.favoriteTeamIds.length > 0 || preferences.favoriteLeagueIds.length > 0)

  return (
    <div className="min-h-screen">
      {/* Remove sidebar margin for full width */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Hero Section - 주요 경기 */}
        <HeroSection />
        
        {/* Quick Stats - 간단한 통계 */}
        <QuickStats />
        
        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personalized Content for logged-in users */}
            {hasPersonalizedContent && <PersonalizedSection />}
            
            {/* Matches Section - Live & Upcoming */}
            <MatchesSection />
            
            {/* News Section */}
            <NewsSection />
          </div>
          
          {/* Right Column - Secondary Content */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions />
            
            {/* Trending Community */}
            <TrendingCommunity />
            
            {/* Mobile App Promo (simplified) */}
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