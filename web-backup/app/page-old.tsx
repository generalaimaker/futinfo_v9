'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, TrendingUp, Users, 
  ChevronRight, Circle, Zap, Trophy,
  Star, AlertCircle, ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FootballAPIService } from '@/lib/supabase/football'
import { formatKoreanDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Featured match banner component
function FeaturedMatch() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
      <div className="relative p-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-primary text-white">Premier League</Badge>
            <span className="text-sm text-muted-foreground">Today, 08:30 PM</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Liverpool FC vs Manchester United</h2>
          <p className="text-muted-foreground mb-4">
            시즌 최고의 라이벌 매치! 실시간 채팅과 함께 즐기세요
          </p>
          <Button className="dark-button-primary">
            경기 상세보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-2 overflow-hidden">
                <Image
                  src="https://media.api-sports.io/football/teams/40.png"
                  alt="Liverpool"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold">Liverpool</span>
            </div>
            <div className="text-2xl font-bold">VS</div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-2 overflow-hidden">
                <Image
                  src="https://media.api-sports.io/football/teams/33.png"
                  alt="Man United"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <span className="font-semibold">Man United</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Live matches section
function LiveMatches() {
  const matches = [
    {
      id: 1,
      homeTeam: 'Napoli',
      awayTeam: 'Inter',
      homeScore: 2,
      awayScore: 1,
      minute: '78\'',
      league: 'Serie A',
      odds: { home: 2.10, draw: 3.40, away: 2.80 }
    },
    {
      id: 2,
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      homeScore: 1,
      awayScore: 1,
      minute: '45+2\'',
      league: 'La Liga',
      odds: { home: 1.85, draw: 3.60, away: 3.20 }
    },
  ]

  return (
    <Card className="dark-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          라이브 경기
        </h3>
        <Link href="/live" className="text-sm text-primary hover:underline">
          전체보기
        </Link>
      </div>
      
      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.id} className="match-card">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="text-xs">
                {match.league}
              </Badge>
              <div className="live-indicator">
                <Circle className="w-2 h-2 fill-current" />
                {match.minute}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{match.homeTeam}</span>
                  <span className="score-badge">{match.homeScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{match.awayTeam}</span>
                  <span className="score-badge">{match.awayScore}</span>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 ml-6">
                <Button size="sm" variant="outline" className="text-xs">
                  1 {match.odds.home}
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  X {match.odds.draw}
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  2 {match.odds.away}
                </Button>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                관전 중: 1.2K
              </span>
              <Button size="sm" className="h-7 text-xs">
                경기 보기
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Upcoming matches
function UpcomingMatches() {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFixtures = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const service = new FootballAPIService()
        const data = await service.getFixtures({ date: today })
        if (data?.response) {
          setFixtures(data.response)
        }
      } catch (error) {
        console.error('Error loading fixtures:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFixtures()
  }, [])

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
      ) : (
        <div className="space-y-3">
          {fixtures?.slice(0, 5).map((fixture: any) => (
            <Link
              key={fixture.fixture.id}
              href={`/fixtures/${fixture.fixture.id}`}
              className="block match-card group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <Image
                      src={fixture.teams.home.logo}
                      alt={fixture.teams.home.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{fixture.teams.home.name}</div>
                    <div className="text-sm text-muted-foreground">
                      vs {fixture.teams.away.name}
                    </div>
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
  const posts = [
    {
      id: 1,
      title: '손흥민 100호골 달성! 아시아 최초 EPL 100골',
      author: 'SpursFan',
      team: 'Tottenham',
      comments: 234,
      likes: 892,
      time: '10분 전'
    },
    {
      id: 2,
      title: '맨시티 vs 아스날 평점 및 경기 분석',
      author: 'TacticalMind',
      team: 'General',
      comments: 156,
      likes: 445,
      time: '1시간 전'
    },
  ]

  return (
    <Card className="dark-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">커뮤니티 인기글</h3>
        <Link href="/community" className="text-sm text-primary hover:underline">
          더보기
        </Link>
      </div>

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
                {post.team}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{post.author}</span>
              <span>💬 {post.comments}</span>
              <span>❤️ {post.likes}</span>
              <span className="ml-auto">{post.time}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

// Stats cards
function StatsCards() {
  const stats = [
    { label: '오늘의 경기', value: '24', icon: Trophy, trend: '+3' },
    { label: '라이브 경기', value: '8', icon: Zap, trend: 'LIVE' },
    { label: '활성 사용자', value: '2.4K', icon: Users, trend: '+12%' },
    { label: '새 게시글', value: '156', icon: TrendingUp, trend: '+23%' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="dark-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
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