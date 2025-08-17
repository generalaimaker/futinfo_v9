'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { 
  Activity, Clock, Target, Square, ArrowUpDown, 
  UserMinus, AlertTriangle, Flag, Timer, Circle
} from 'lucide-react'

interface EventsTimelineProps {
  events: any[]
  homeTeam: any
  awayTeam: any
}

// 이벤트 타입별 아이콘과 색상
const getEventIcon = (type: string, detail?: string) => {
  switch (type) {
    case 'Goal':
      if (detail === 'Penalty') return { icon: '⚽', color: 'text-green-500', bg: 'bg-green-500/10' }
      if (detail === 'Own Goal') return { icon: '⚽', color: 'text-red-500', bg: 'bg-red-500/10' }
      return { icon: '⚽', color: 'text-green-500', bg: 'bg-green-500/10' }
    case 'Card':
      if (detail === 'Yellow Card') return { icon: '🟨', color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
      if (detail === 'Red Card') return { icon: '🟥', color: 'text-red-500', bg: 'bg-red-500/10' }
      return { icon: '📋', color: 'text-gray-500', bg: 'bg-gray-500/10' }
    case 'subst':
      return { icon: '🔄', color: 'text-blue-500', bg: 'bg-blue-500/10' }
    case 'Var':
      return { icon: '📺', color: 'text-purple-500', bg: 'bg-purple-500/10' }
    default:
      return { icon: '📝', color: 'text-gray-500', bg: 'bg-gray-500/10' }
  }
}

// 이벤트 카드 컴포넌트
function EventCard({ event, isHome }: { event: any; isHome: boolean }) {
  const eventStyle = getEventIcon(event.type, event.detail)
  const time = event.time.elapsed + (event.time.extra || 0)
  
  return (
    <div className={cn(
      "flex items-start gap-3",
      isHome ? "flex-row" : "flex-row-reverse"
    )}>
      {/* 시간 */}
      <div className={cn(
        "min-w-[50px] text-sm font-bold",
        isHome ? "text-right" : "text-left"
      )}>
        {time}'
        {event.time.extra > 0 && (
          <span className="text-xs text-gray-500 ml-1">+{event.time.extra}</span>
        )}
      </div>
      
      {/* 이벤트 아이콘 */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-lg",
        eventStyle.bg
      )}>
        {eventStyle.icon}
      </div>
      
      {/* 이벤트 내용 */}
      <div className={cn(
        "flex-1 space-y-1",
        isHome ? "text-left" : "text-right"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          !isHome && "flex-row-reverse"
        )}>
          <p className="font-semibold text-sm">{event.player?.name || 'Unknown'}</p>
          {event.type === 'Goal' && event.detail && (
            <Badge variant="outline" className="text-xs">
              {event.detail}
            </Badge>
          )}
        </div>
        
        {event.assist?.name && (
          <p className="text-xs text-gray-500">
            Assist: {event.assist.name}
          </p>
        )}
        
        {event.type === 'subst' && (
          <p className="text-xs text-gray-500">
            {isHome ? '➡️' : '⬅️'} {event.assist?.name || 'Substitute'}
          </p>
        )}
        
        {event.comments && (
          <p className="text-xs text-gray-600 italic">{event.comments}</p>
        )}
      </div>
    </div>
  )
}

// 경기 시간대별 그룹화
function TimelineSection({ title, events, homeTeam, awayTeam }: any) {
  if (events.length === 0) return null
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
        <Badge variant="outline">{title}</Badge>
        <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
      </div>
      
      <div className="space-y-4">
        {events.map((event: any, idx: number) => {
          const isHome = event.team.id === homeTeam.id
          return (
            <EventCard key={idx} event={event} isHome={isHome} />
          )
        })}
      </div>
    </div>
  )
}

// 간단한 타임라인 뷰
function SimpleTimeline({ events, homeTeam, awayTeam }: any) {
  return (
    <div className="relative">
      {/* 중앙 라인 */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      {/* 이벤트들 */}
      <div className="space-y-6">
        {events.map((event: any, idx: number) => {
          const isHome = event.team.id === homeTeam.id
          const eventStyle = getEventIcon(event.type, event.detail)
          const time = event.time.elapsed + (event.time.extra || 0)
          
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-4",
                isHome ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* 왼쪽/오른쪽 컨텐츠 */}
              <div className={cn(
                "flex-1",
                isHome ? "text-right pr-4" : "text-left pl-4"
              )}>
                {isHome ? (
                  <div>
                    <p className="font-semibold">{event.player?.name}</p>
                    <p className="text-xs text-gray-500">
                      {event.type === 'Goal' ? 'Goal' : 
                       event.type === 'Card' ? event.detail : 
                       event.type === 'subst' ? 'Substitution' : event.type}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    {!isHome && <p className="text-sm">{time}'</p>}
                  </div>
                )}
              </div>
              
              {/* 중앙 아이콘 */}
              <div className="relative z-10">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white dark:bg-gray-800 border-4",
                  isHome ? "border-blue-500" : "border-red-500"
                )}>
                  {eventStyle.icon}
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-500">
                  {time}'
                </div>
              </div>
              
              {/* 반대쪽 컨텐츠 */}
              <div className={cn(
                "flex-1",
                !isHome ? "text-left pl-4" : "text-right pr-4"
              )}>
                {!isHome ? (
                  <div>
                    <p className="font-semibold">{event.player?.name}</p>
                    <p className="text-xs text-gray-500">
                      {event.type === 'Goal' ? 'Goal' : 
                       event.type === 'Card' ? event.detail : 
                       event.type === 'subst' ? 'Substitution' : event.type}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    {isHome && <p className="text-sm">{time}'</p>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 경기 스탯 요약
function EventsSummary({ events, homeTeam, awayTeam }: any) {
  const stats = useMemo(() => {
    const homeStats = {
      goals: 0,
      yellowCards: 0,
      redCards: 0,
      substitutions: 0,
      penalties: 0
    }
    const awayStats = { ...homeStats }
    
    events.forEach((event: any) => {
      const isHome = event.team.id === homeTeam.id
      const target = isHome ? homeStats : awayStats
      
      if (event.type === 'Goal') {
        target.goals++
        if (event.detail === 'Penalty') target.penalties++
      } else if (event.type === 'Card') {
        if (event.detail === 'Yellow Card') target.yellowCards++
        else if (event.detail === 'Red Card') target.redCards++
      } else if (event.type === 'subst') {
        target.substitutions++
      }
    })
    
    return { home: homeStats, away: awayStats }
  }, [events, homeTeam.id, awayTeam.id])
  
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* 홈팀 스탯 */}
      <div className="text-center">
        <p className="font-semibold mb-2">{homeTeam.name}</p>
        <div className="space-y-1">
          <Badge variant="outline" className="w-full justify-center">
            ⚽ {stats.home.goals}
          </Badge>
          <Badge variant="outline" className="w-full justify-center">
            🟨 {stats.home.yellowCards}
          </Badge>
          {stats.home.redCards > 0 && (
            <Badge variant="destructive" className="w-full justify-center">
              🟥 {stats.home.redCards}
            </Badge>
          )}
        </div>
      </div>
      
      {/* VS */}
      <div className="flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-400">VS</div>
      </div>
      
      {/* 원정팀 스탯 */}
      <div className="text-center">
        <p className="font-semibold mb-2">{awayTeam.name}</p>
        <div className="space-y-1">
          <Badge variant="outline" className="w-full justify-center">
            ⚽ {stats.away.goals}
          </Badge>
          <Badge variant="outline" className="w-full justify-center">
            🟨 {stats.away.yellowCards}
          </Badge>
          {stats.away.redCards > 0 && (
            <Badge variant="destructive" className="w-full justify-center">
              🟥 {stats.away.redCards}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export function EventsTimeline({ events, homeTeam, awayTeam }: EventsTimelineProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'grouped' | 'simple'>('timeline')
  
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">경기 이벤트가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }
  
  // 시간대별 이벤트 그룹화
  const groupedEvents = useMemo(() => {
    const groups = {
      firstHalf: [] as any[],
      secondHalf: [] as any[],
      extraTime: [] as any[],
      penalties: [] as any[]
    }
    
    events.forEach(event => {
      const time = event.time.elapsed
      if (time <= 45) groups.firstHalf.push(event)
      else if (time <= 90) groups.secondHalf.push(event)
      else if (time <= 120) groups.extraTime.push(event)
      else groups.penalties.push(event)
    })
    
    return groups
  }, [events])
  
  // 시간순 정렬
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = a.time.elapsed + (a.time.extra || 0)
      const timeB = b.time.elapsed + (b.time.extra || 0)
      return timeA - timeB
    })
  }, [events])
  
  return (
    <div className="space-y-6">
      {/* 헤더 & 뷰 모드 선택 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          경기 이벤트
        </h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            타임라인
          </Button>
          <Button
            variant={viewMode === 'grouped' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grouped')}
          >
            시간대별
          </Button>
          <Button
            variant={viewMode === 'simple' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('simple')}
          >
            간단히
          </Button>
        </div>
      </div>
      
      {/* 이벤트 요약 */}
      <EventsSummary events={events} homeTeam={homeTeam} awayTeam={awayTeam} />
      
      {/* 뷰 모드에 따른 렌더링 */}
      <Card>
        <CardContent className="p-6">
          {viewMode === 'timeline' && (
            <div className="space-y-6">
              <TimelineSection
                title="전반전 (1-45')"
                events={groupedEvents.firstHalf}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
              <TimelineSection
                title="후반전 (46-90')"
                events={groupedEvents.secondHalf}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
              {groupedEvents.extraTime.length > 0 && (
                <TimelineSection
                  title="연장전"
                  events={groupedEvents.extraTime}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              )}
              {groupedEvents.penalties.length > 0 && (
                <TimelineSection
                  title="승부차기"
                  events={groupedEvents.penalties}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              )}
            </div>
          )}
          
          {viewMode === 'grouped' && (
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="goals">골</TabsTrigger>
                <TabsTrigger value="cards">카드</TabsTrigger>
                <TabsTrigger value="substitutions">교체</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6 space-y-4">
                {sortedEvents.map((event, idx) => {
                  const isHome = event.team.id === homeTeam.id
                  return <EventCard key={idx} event={event} isHome={isHome} />
                })}
              </TabsContent>
              
              <TabsContent value="goals" className="mt-6 space-y-4">
                {sortedEvents
                  .filter(e => e.type === 'Goal')
                  .map((event, idx) => {
                    const isHome = event.team.id === homeTeam.id
                    return <EventCard key={idx} event={event} isHome={isHome} />
                  })}
              </TabsContent>
              
              <TabsContent value="cards" className="mt-6 space-y-4">
                {sortedEvents
                  .filter(e => e.type === 'Card')
                  .map((event, idx) => {
                    const isHome = event.team.id === homeTeam.id
                    return <EventCard key={idx} event={event} isHome={isHome} />
                  })}
              </TabsContent>
              
              <TabsContent value="substitutions" className="mt-6 space-y-4">
                {sortedEvents
                  .filter(e => e.type === 'subst')
                  .map((event, idx) => {
                    const isHome = event.team.id === homeTeam.id
                    return <EventCard key={idx} event={event} isHome={isHome} />
                  })}
              </TabsContent>
            </Tabs>
          )}
          
          {viewMode === 'simple' && (
            <SimpleTimeline
              events={sortedEvents}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}