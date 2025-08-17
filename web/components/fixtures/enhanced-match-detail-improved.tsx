'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { 
  Trophy, Users, Clock, MapPin, AlertCircle, 
  TrendingUp, Target, Shield, Activity, BarChart3,
  ChevronRight, Star, Zap, ArrowUp, ArrowDown,
  RefreshCw, Share2, Bell, Heart, MessageCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ToastNotification, useToastNotification } from '@/components/ui/toast-notification'
import { EnhancedStatistics } from './enhanced-statistics'
import { EnhancedMatchInfo } from './enhanced-match-info'
import { LineupVisualization } from './lineup-visualization'
import { EventsTimeline } from './events-timeline'
import { H2HComponent } from './h2h-component'
import { MatchDetailsInfo } from './match-details-info'
import { useSwipeable } from 'react-swipeable'
import { animated, useSpring } from '@react-spring/web'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

interface EnhancedMatchDetailImprovedProps {
  fixture: any
  isLive?: boolean
  onRefresh?: () => void
}

// 개선된 선수 평점 카드
function ImprovedPlayerRatingCard({ player, team, isMOTM = false }: any) {
  const rating = parseFloat(player.statistics?.[0]?.games?.rating || 0)
  const position = player.statistics?.[0]?.games?.position || 'SUB'
  const goals = player.statistics?.[0]?.goals?.total || 0
  const assists = player.statistics?.[0]?.goals?.assists || 0
  const yellowCards = player.statistics?.[0]?.cards?.yellow || 0
  const redCards = player.statistics?.[0]?.cards?.red || 0
  
  // 평점별 색상 및 그라데이션
  const getRatingStyle = (rating: number) => {
    if (rating >= 9) return { 
      color: 'text-purple-500', 
      bg: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/30'
    }
    if (rating >= 8) return { 
      color: 'text-green-500', 
      bg: 'from-green-500/20 to-green-600/10',
      border: 'border-green-500/30'
    }
    if (rating >= 7) return { 
      color: 'text-blue-500', 
      bg: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30'
    }
    if (rating >= 6) return { 
      color: 'text-yellow-500', 
      bg: 'from-yellow-500/20 to-yellow-600/10',
      border: 'border-yellow-500/30'
    }
    return { 
      color: 'text-red-500', 
      bg: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/30'
    }
  }
  
  const ratingStyle = getRatingStyle(rating)
  
  // 애니메이션
  const cardSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 200, friction: 20 }
  })
  
  return (
    <animated.div style={cardSpring}>
      <div className={cn(
        "relative rounded-xl border-2 p-4 transition-all hover:shadow-lg cursor-pointer group",
        "bg-gradient-to-br",
        ratingStyle.bg,
        ratingStyle.border,
        isMOTM && "ring-2 ring-yellow-400 ring-offset-2"
      )}>
        {/* MOTM 뱃지 */}
        {isMOTM && (
          <div className="absolute -top-2 -right-2 z-10">
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold px-2 py-1">
              <Star className="w-3 h-3 mr-1" />
              MOTM
            </Badge>
          </div>
        )}
        
        {/* 선수 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 등번호 */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl",
              "bg-white dark:bg-gray-800 shadow-md",
              team === 'home' ? 'text-blue-500' : 'text-red-500'
            )}>
              {player.statistics?.[0]?.games?.number || '-'}
            </div>
            
            {/* 이름 & 포지션 */}
            <div>
              <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                {player.player.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {position}
              </p>
            </div>
          </div>
          
          {/* 평점 */}
          <div className="text-right">
            <p className={cn("text-2xl font-bold", ratingStyle.color)}>
              {rating.toFixed(1)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    i < Math.floor(rating / 2) ? ratingStyle.color.replace('text-', 'bg-') : 'bg-gray-300 dark:bg-gray-600'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* 스탯 뱃지 */}
        <div className="flex items-center gap-2 mt-3">
          {goals > 0 && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400">
              ⚽ {goals}
            </Badge>
          )}
          {assists > 0 && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 dark:text-blue-400">
              🅰️ {assists}
            </Badge>
          )}
          {yellowCards > 0 && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              🟨
            </Badge>
          )}
          {redCards > 0 && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-600 dark:text-red-400">
              🟥
            </Badge>
          )}
        </div>
        
        {/* 주요 스탯 (호버 시 표시) */}
        <div className="grid grid-cols-3 gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">패스</p>
            <p className="text-sm font-medium">
              {player.statistics?.[0]?.passes?.accuracy || 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">드리블</p>
            <p className="text-sm font-medium">
              {player.statistics?.[0]?.dribbles?.success || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">태클</p>
            <p className="text-sm font-medium">
              {player.statistics?.[0]?.tackles?.total || 0}
            </p>
          </div>
        </div>
      </div>
    </animated.div>
  )
}

// 경기 모멘텀 그래프
function MomentumGraph({ events }: { events: any[] }) {
  const momentumData = useMemo(() => {
    if (!events || events.length === 0) return []
    
    let homeMomentum = 50
    let awayMomentum = 50
    const data = [{ minute: 0, home: 50, away: 50 }]
    
    events.forEach((event) => {
      const minute = event.time.elapsed
      
      // 이벤트에 따른 모멘텀 변화
      if (event.type === 'Goal') {
        if (event.team.id === events[0].team.id) {
          homeMomentum = Math.min(80, homeMomentum + 15)
          awayMomentum = Math.max(20, awayMomentum - 15)
        } else {
          awayMomentum = Math.min(80, awayMomentum + 15)
          homeMomentum = Math.max(20, homeMomentum - 15)
        }
      } else if (event.type === 'Card') {
        if (event.detail === 'Red Card') {
          if (event.team.id === events[0].team.id) {
            homeMomentum = Math.max(30, homeMomentum - 20)
            awayMomentum = Math.min(70, awayMomentum + 20)
          } else {
            awayMomentum = Math.max(30, awayMomentum - 20)
            homeMomentum = Math.min(70, homeMomentum + 20)
          }
        }
      }
      
      data.push({ minute, home: homeMomentum, away: awayMomentum })
    })
    
    return data
  }, [events])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          경기 모멘텀
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={momentumData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="minute" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px' 
              }} 
            />
            <Area type="monotone" dataKey="home" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            <Area type="monotone" dataKey="away" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function EnhancedMatchDetailImproved({ 
  fixture, 
  isLive = false, 
  onRefresh 
}: EnhancedMatchDetailImprovedProps) {
  const [activeTab, setActiveTab] = useState(fixture?.fixture?.status?.short === 'NS' ? 'info' : 'overview')
  const { events, showToast, removeToast } = useToastNotification()
  const [lastEventCount, setLastEventCount] = useState(0)
  
  // 탭 리스트 참조
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabs = ['info', 'overview', 'statistics', 'lineups', 'events', 'h2h']
  
  // 스와이프 제스처 설정
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = tabs.indexOf(activeTab)
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1])
      }
    },
    onSwipedRight: () => {
      const currentIndex = tabs.indexOf(activeTab)
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1])
      }
    },
    trackMouse: false
  })
  
  // 라이브 이벤트 감지 및 토스트 알림
  useEffect(() => {
    if (!isLive || !fixture.events) return
    
    const newEvents = fixture.events.slice(lastEventCount)
    newEvents.forEach((event: any) => {
      if (event.type === 'Goal' || event.type === 'Card' || event.type === 'subst') {
        showToast({
          type: event.type === 'Goal' ? 'goal' : 
                event.type === 'Card' ? 'card' : 'substitution',
          team: event.team,
          player: event.player?.name,
          assist: event.assist?.name,
          minute: event.time.elapsed,
          detail: event.detail
        })
      }
    })
    
    setLastEventCount(fixture.events.length)
  }, [fixture.events, isLive, lastEventCount, showToast])
  
  const matchDate = new Date(fixture.fixture.date)
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)
  const isUpcoming = ['TBD', 'NS'].includes(fixture.fixture.status.short)
  
  return (
    <div className="space-y-6" {...handlers}>
      {/* 토스트 알림 렌더링 */}
      {events.map((event) => (
        <ToastNotification
          key={event.id}
          event={event}
          onClose={() => removeToast(event.id)}
        />
      ))}
      
      {/* 향상된 헤더 */}
      <Card className={cn(
        "overflow-hidden",
        isLive && "border-2 border-green-500/50 shadow-green-500/20 shadow-xl"
      )}>
        {/* 라이브 인디케이터 */}
        {isLive && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="font-bold">LIVE</span>
                <span className="text-sm opacity-90">{fixture.fixture.status.elapsed}'</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                className="text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* 팀 정보 & 스코어 */}
        <div className="p-6">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* 홈팀 */}
            <div className="text-center">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={80}
                height={80}
                className="mx-auto mb-3"
              />
              <p className="font-bold">{fixture.teams.home.name}</p>
              {fixture.teams.home.winner && (
                <Badge className="mt-2 bg-green-500 text-white">WIN</Badge>
              )}
            </div>
            
            {/* 스코어/시간 */}
            <div className="text-center">
              {isUpcoming ? (
                <div>
                  <p className="text-3xl font-bold">{format(matchDate, 'HH:mm')}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {format(matchDate, 'M월 d일', { locale: ko })}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-5xl font-bold">
                    <span className={cn(
                      fixture.goals.home > fixture.goals.away && "text-green-500"
                    )}>
                      {fixture.goals.home ?? 0}
                    </span>
                    <span className="mx-2">-</span>
                    <span className={cn(
                      fixture.goals.away > fixture.goals.home && "text-green-500"
                    )}>
                      {fixture.goals.away ?? 0}
                    </span>
                  </p>
                  {fixture.score.penalty.home !== null && (
                    <p className="text-sm text-muted-foreground mt-2">
                      (PK {fixture.score.penalty.home} - {fixture.score.penalty.away})
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* 원정팀 */}
            <div className="text-center">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={80}
                height={80}
                className="mx-auto mb-3"
              />
              <p className="font-bold">{fixture.teams.away.name}</p>
              {fixture.teams.away.winner && (
                <Badge className="mt-2 bg-green-500 text-white">WIN</Badge>
              )}
            </div>
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-1" />
              알림
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4 mr-1" />
              즐겨찾기
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              공유
            </Button>
          </div>
        </div>
      </Card>
      
      {/* 스와이프 가능한 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList ref={tabsRef} className="grid w-full grid-cols-6">
          <TabsTrigger value="info">정보</TabsTrigger>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="statistics">통계</TabsTrigger>
          <TabsTrigger value="lineups">라인업</TabsTrigger>
          <TabsTrigger value="events">이벤트</TabsTrigger>
          <TabsTrigger value="h2h">H2H</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="mt-6">
          <MatchDetailsInfo fixture={fixture} />
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-6">
          {/* 모멘텀 그래프 */}
          {fixture.events && fixture.events.length > 0 && (
            <MomentumGraph events={fixture.events} />
          )}
          
          {/* 주요 선수 평점 */}
          {fixture.players && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">선수 평점</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 홈팀 선수 (상위 3명) */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {fixture.teams.home.name}
                    </p>
                    <div className="space-y-2">
                      {fixture.players
                        .find((p: any) => p.team.id === fixture.teams.home.id)
                        ?.players.slice(0, 3)
                        .map((player: any, index: number) => (
                          <ImprovedPlayerRatingCard
                            key={player.player.id}
                            player={player}
                            team="home"
                            isMOTM={index === 0}
                          />
                        ))}
                    </div>
                  </div>
                  
                  {/* 원정팀 선수 (상위 3명) */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {fixture.teams.away.name}
                    </p>
                    <div className="space-y-2">
                      {fixture.players
                        .find((p: any) => p.team.id === fixture.teams.away.id)
                        ?.players.slice(0, 3)
                        .map((player: any) => (
                          <ImprovedPlayerRatingCard
                            key={player.player.id}
                            player={player}
                            team="away"
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="statistics">
          {fixture.statistics && (
            <EnhancedStatistics
              statistics={fixture.statistics}
              homeTeam={fixture.teams.home}
              awayTeam={fixture.teams.away}
            />
          )}
        </TabsContent>
        
        <TabsContent value="lineups">
          {fixture.lineups && fixture.lineups.length > 0 ? (
            <LineupVisualization 
              lineups={fixture.lineups} 
              events={fixture.events}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">라인업 정보가 없습니다.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="events">
          {fixture.events && fixture.events.length > 0 ? (
            <EventsTimeline 
              events={fixture.events}
              homeTeam={fixture.teams.home}
              awayTeam={fixture.teams.away}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">경기 이벤트가 없습니다.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="h2h">
          <H2HComponent
            homeTeam={fixture.teams.home}
            awayTeam={fixture.teams.away}
            currentFixture={fixture}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}