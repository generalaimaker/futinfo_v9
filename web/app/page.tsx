'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, TrendingUp, Users, 
  ChevronRight, Circle, Zap, Trophy,
  Star, AlertCircle, ArrowRight, RefreshCw,
  Loader2
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

// Featured match banner component
function FeaturedMatch() {
  const { fixtures, isLoading } = useTodayFixtures()
  
  // 오늘의 빅매치 찾기 (유럽 주요 팀 친선경기 우선)
  const bigMatch = fixtures.find(f => {
    // 1. 먼저 유럽 주요 팀의 친선경기 찾기
    if (f.league.id === 667) {
      const MAJOR_TEAMS = [33, 40, 50, 49, 42, 47, 541, 529, 530, 496, 505, 489, 157, 165, 85]
      return MAJOR_TEAMS.includes(f.teams.home.id) || MAJOR_TEAMS.includes(f.teams.away.id)
    }
    // 2. 없으면 주요 리그 경기
    return [39, 140, 135, 78, 61, 2].includes(f.league.id) && f.teams.home.id && f.teams.away.id
  }) || fixtures[0]

  if (!bigMatch || isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 p-8">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-white/20 rounded mb-4" />
          <div className="h-8 w-64 bg-white/20 rounded mb-2" />
          <div className="h-4 w-48 bg-white/20 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
      <div className="relative p-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary text-white">{bigMatch.league.name}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(bigMatch.fixture.date).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {bigMatch.teams.home.name} vs {bigMatch.teams.away.name}
          </h2>
          <p className="text-muted-foreground mb-4">
            {bigMatch.fixture.venue.name} | {bigMatch.fixture.venue.city}
          </p>
          <Link href={`/fixtures/${bigMatch.fixture.id}`}>
            <Button className="dark-button-primary">
              경기 상세보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-2 p-3">
                <Image
                  src={bigMatch.teams.home.logo}
                  alt={bigMatch.teams.home.name}
                  width={56}
                  height={56}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
              <span className="font-semibold text-sm">{bigMatch.teams.home.name}</span>
            </div>
            <div className="text-2xl font-bold">VS</div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-2 p-3">
                <Image
                  src={bigMatch.teams.away.logo}
                  alt={bigMatch.teams.away.name}
                  width={56}
                  height={56}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
              <span className="font-semibold text-sm">{bigMatch.teams.away.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Live matches section
function LiveMatches() {
  const { matches, isLoading, error } = useLiveMatches()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <Card className="dark-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          라이브 경기
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Link href="/live" className="text-sm text-primary hover:underline">
            전체보기
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Circle className="w-8 h-8 mx-auto mb-2" />
          <p>현재 진행 중인 경기가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.fixture.id} className="match-card">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="text-xs">
                  {match.league.name}
                </Badge>
                <div className="live-indicator">
                  <Circle className="w-2 h-2 fill-current" />
                  {match.fixture.status.elapsed || 0}'
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={match.teams.home.logo}
                        alt={match.teams.home.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      <span className="font-medium text-sm">{match.teams.home.name}</span>
                    </div>
                    <span className="score-badge">{match.goals.home ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={match.teams.away.logo}
                        alt={match.teams.away.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      <span className="font-medium text-sm">{match.teams.away.name}</span>
                    </div>
                    <span className="score-badge">{match.goals.away ?? 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{match.fixture.venue.name}</span>
                </div>
                <Link href={`/fixtures/${match.fixture.id}`}>
                  <Button size="sm" className="h-7 text-xs">
                    상세보기
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// Upcoming matches
function UpcomingMatches() {
  const { fixtures, isLoading, error } = useTodayFixtures()

  return (
    <Card className="dark-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">오늘의 경기</h3>
        <Link href="/fixtures" className="text-sm text-primary hover:underline">
          전체 일정
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : fixtures.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p>오늘 예정된 경기가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fixtures.slice(0, 5).map((fixture) => (
            <Link
              key={fixture.fixture.id}
              href={`/fixtures/${fixture.fixture.id}`}
              className="block match-card group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Image
                      src={fixture.teams.home.logo}
                      alt={fixture.teams.home.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-medium text-sm">{fixture.teams.home.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <div className="flex items-center gap-2">
                    <Image
                      src={fixture.teams.away.logo}
                      alt={fixture.teams.away.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-medium text-sm">{fixture.teams.away.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(fixture.fixture.date).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fixture.league.name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

// Community highlights
function CommunityHighlights() {
  const { posts, isLoading, error } = usePopularPosts()

  return (
    <Card className="dark-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">커뮤니티 인기글</h3>
        <Link href="/community" className="text-sm text-primary hover:underline">
          더보기
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2" />
          <p>아직 게시글이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/posts/${post.id}`}
              className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium line-clamp-1 flex-1">{post.title}</h4>
                <Badge variant="outline" className="ml-2 shrink-0">
                  {post.board?.name || 'General'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{post.author?.username || '익명'}</span>
                <span>💬 {post.comment_count}</span>
                <span>❤️ {post.like_count}</span>
                <span className="ml-auto">
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: ko 
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

// Personalized matches for users with favorite teams
function PersonalizedMatches() {
  const { preferences } = useUserPreferences()
  const { fixtures, isLoading } = usePersonalizedFixtures()

  // 좋아하는 팀이 없으면 표시하지 않음
  if (preferences.favoriteTeamIds.length === 0 && preferences.favoriteLeagueIds.length === 0) {
    return null
  }

  return (
    <Card className="dark-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          내 팀 경기
        </h3>
        <Link href="/follow" className="text-sm text-primary hover:underline">
          팀 관리
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : fixtures.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p>다음 7일간 예정된 경기가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fixtures.map((fixture) => {
            const isFavoriteTeam = preferences.favoriteTeamIds.includes(fixture.teams.home.id) || 
                                   preferences.favoriteTeamIds.includes(fixture.teams.away.id)
            
            return (
              <Link
                key={fixture.fixture.id}
                href={`/fixtures/${fixture.fixture.id}`}
                className={cn(
                  "block match-card group",
                  isFavoriteTeam && "border-yellow-500/30 bg-yellow-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {fixture.league.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Image
                        src={fixture.teams.home.logo}
                        alt={fixture.teams.home.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className={cn(
                        "font-medium text-sm",
                        preferences.favoriteTeamIds.includes(fixture.teams.home.id) && "text-yellow-500"
                      )}>
                        {fixture.teams.home.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <div className="flex items-center gap-2">
                      <Image
                        src={fixture.teams.away.logo}
                        alt={fixture.teams.away.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className={cn(
                        "font-medium text-sm",
                        preferences.favoriteTeamIds.includes(fixture.teams.away.id) && "text-yellow-500"
                      )}>
                        {fixture.teams.away.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(fixture.fixture.date).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// Stats cards
function StatsCards() {
  const { stats, isLoading } = useHomeStats()

  const statItems = [
    { label: '오늘의 경기', value: stats.todayMatches, icon: Trophy, trend: null },
    { label: '라이브 경기', value: stats.liveMatches, icon: Zap, trend: 'LIVE' },
    { label: '활성 사용자', value: stats.activeUsers, icon: Users, trend: null },
    { label: '새 게시글', value: stats.newPosts, icon: TrendingUp, trend: null },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <Card key={index} className="dark-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stat.value
                )}
              </p>
              {stat.trend && (
                <p className={cn(
                  "text-xs mt-1",
                  stat.trend === 'LIVE' ? "text-red-500" : "text-green-500"
                )}>
                  {stat.trend}
                </p>
              )}
            </div>
            <stat.icon className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Featured Match */}
        <FeaturedMatch />

        {/* Stats */}
        <StatsCards />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PersonalizedMatches />
            <LiveMatches />
            <UpcomingMatches />
          </div>
          <div className="space-y-6">
            <CommunityHighlights />
            
            {/* Quick Actions */}
            <Card className="dark-card p-6">
              <h3 className="text-lg font-semibold mb-4">빠른 메뉴</h3>
              <div className="space-y-3">
                <Link href="/standings" className="block">
                  <Button variant="outline" className="w-full justify-start h-12 text-left">
                    <Trophy className="mr-3 h-5 w-5" />
                    <div>
                      <div className="font-medium">리그 순위표</div>
                      <div className="text-xs text-muted-foreground">주요 리그 순위 확인</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/follow" className="block">
                  <Button variant="outline" className="w-full justify-start h-12 text-left">
                    <Star className="mr-3 h-5 w-5" />
                    <div>
                      <div className="font-medium">팀 팔로우 설정</div>
                      <div className="text-xs text-muted-foreground">좋아하는 팀 관리</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/notifications" className="block">
                  <Button variant="outline" className="w-full justify-start h-12 text-left">
                    <AlertCircle className="mr-3 h-5 w-5" />
                    <div>
                      <div className="font-medium">경기 알림 설정</div>
                      <div className="text-xs text-muted-foreground">실시간 알림 관리</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}