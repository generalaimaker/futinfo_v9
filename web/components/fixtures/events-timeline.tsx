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
  UserMinus, AlertTriangle, Flag, Timer, Circle,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown
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
      if (detail === 'Penalty') return '⚽'
      if (detail === 'Own Goal') return '⚽'
      return '⚽'
    case 'Card':
      if (detail === 'Yellow Card') return '🟨'
      if (detail === 'Red Card') return '🟥'
      return '📋'
    case 'subst':
      return '↔️'
    case 'Var':
      return '📺'
    default:
      return '📝'
  }
}

// 새로운 타임라인 이벤트 컴포넌트 (첨부 이미지 스타일)
function ModernTimelineEvent({ event, isHome, homeTeam, awayTeam }: any) {
  const time = event.time.elapsed
  const extraTime = event.time.extra
  const icon = getEventIcon(event.type, event.detail)
  
  // 교체 이벤트 처리
  const isSubstitution = event.type === 'subst'
  const playerOut = isSubstitution ? event.player?.name : null
  const playerIn = isSubstitution ? event.assist?.name : null
  
  return (
    <div className="flex items-center">
      {/* 홈팀 이벤트 (왼쪽) */}
      <div className={cn(
        "flex-1 pr-4",
        !isHome && "opacity-0 pointer-events-none"
      )}>
        {isHome && (
          <div className="text-right">
            {isSubstitution ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-end">
                  <ArrowDown className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">{playerIn}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <ArrowUp className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">{playerOut}</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">{event.player?.name}</p>
                {event.assist?.name && (
                  <p className="text-xs text-gray-500">assist by {event.assist.name}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 중앙 시간 및 아이콘 */}
      <div className="flex items-center gap-2 px-4 min-w-[100px] justify-center">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm",
          "bg-gray-100 dark:bg-gray-800"
        )}>
          {icon}
        </div>
        <div className="text-center">
          <div className="text-sm font-bold">
            {time}'
            {extraTime && <span className="text-xs text-gray-500">+{extraTime}</span>}
          </div>
        </div>
      </div>
      
      {/* 원정팀 이벤트 (오른쪽) */}
      <div className={cn(
        "flex-1 pl-4",
        isHome && "opacity-0 pointer-events-none"
      )}>
        {!isHome && (
          <div className="text-left">
            {isSubstitution ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">{playerIn}</span>
                  <ArrowDown className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 font-medium">{playerOut}</span>
                  <ArrowUp className="w-4 h-4 text-red-600" />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">{event.player?.name}</p>
                {event.assist?.name && (
                  <p className="text-xs text-gray-500">assist by {event.assist.name}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 시간대 구분선 컴포넌트
function PeriodDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center my-6">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <div className="px-4">
        <Badge variant="secondary" className="font-bold">
          {title}
        </Badge>
      </div>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

// 스코어 표시 컴포넌트
function ScoreDisplay({ homeScore, awayScore, period }: any) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-6 py-3">
        <div className="text-center text-xs text-gray-500 mb-1">{period}</div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold">{homeScore}</span>
          <span className="text-lg text-gray-400">-</span>
          <span className="text-2xl font-bold">{awayScore}</span>
        </div>
      </div>
    </div>
  )
}

export function EventsTimeline({ events, homeTeam, awayTeam }: EventsTimelineProps) {
  const [viewMode, setViewMode] = useState<'modern' | 'classic'>('modern')
  
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">경기 이벤트가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }
  
  // 시간순 정렬
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = a.time.elapsed + (a.time.extra || 0)
      const timeB = b.time.elapsed + (b.time.extra || 0)
      return timeA - timeB
    })
  }, [events])
  
  // 시간대별 이벤트 그룹화 및 스코어 계산
  const { firstHalf, secondHalf, extraTime, finalScore } = useMemo(() => {
    const firstHalf: any[] = []
    const secondHalf: any[] = []
    const extraTime: any[] = []
    
    let homeGoals = 0
    let awayGoals = 0
    let firstHalfHomeGoals = 0
    let firstHalfAwayGoals = 0
    
    sortedEvents.forEach(event => {
      const time = event.time.elapsed
      const isHome = event.team.id === homeTeam.id
      
      if (event.type === 'Goal') {
        if (isHome) homeGoals++
        else awayGoals++
        
        if (time <= 45) {
          if (isHome) firstHalfHomeGoals++
          else firstHalfAwayGoals++
        }
      }
      
      if (time <= 45) {
        firstHalf.push(event)
      } else if (time <= 90) {
        secondHalf.push(event)
      } else {
        extraTime.push(event)
      }
    })
    
    return {
      firstHalf,
      secondHalf,
      extraTime,
      finalScore: { home: homeGoals, away: awayGoals },
      firstHalfScore: { home: firstHalfHomeGoals, away: firstHalfAwayGoals }
    }
  }, [sortedEvents, homeTeam.id])
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Events</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'modern' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('modern')}
          >
            모던
          </Button>
          <Button
            variant={viewMode === 'classic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('classic')}
          >
            클래식
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {/* 팀 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {homeTeam.logo && (
                <Image
                  src={homeTeam.logo}
                  alt={homeTeam.name}
                  width={24}
                  height={24}
                />
              )}
              <span className="font-semibold">{homeTeam.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{awayTeam.name}</span>
              {awayTeam.logo && (
                <Image
                  src={awayTeam.logo}
                  alt={awayTeam.name}
                  width={24}
                  height={24}
                />
              )}
            </div>
          </div>
          
          {viewMode === 'modern' ? (
            <div>
              {/* 전반전 */}
              {firstHalf.length > 0 && (
                <>
                  {firstHalf.map((event, idx) => (
                    <ModernTimelineEvent
                      key={idx}
                      event={event}
                      isHome={event.team.id === homeTeam.id}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                    />
                  ))}
                  
                  {/* 추가 시간 표시 */}
                  {firstHalf.some(e => e.time.extra) && (
                    <div className="text-center my-4">
                      <Badge variant="outline" className="text-xs">
                        +{Math.max(...firstHalf.map(e => e.time.extra || 0))} minutes added
                      </Badge>
                    </div>
                  )}
                  
                  {/* 하프타임 스코어 */}
                  <ScoreDisplay
                    homeScore={firstHalf.filter(e => e.type === 'Goal' && e.team.id === homeTeam.id).length}
                    awayScore={firstHalf.filter(e => e.type === 'Goal' && e.team.id === awayTeam.id).length}
                    period="HT"
                  />
                </>
              )}
              
              {/* 후반전 */}
              {secondHalf.length > 0 && (
                <>
                  {firstHalf.length > 0 && <PeriodDivider title="Second Half" />}
                  
                  {secondHalf.map((event, idx) => (
                    <ModernTimelineEvent
                      key={idx}
                      event={event}
                      isHome={event.team.id === homeTeam.id}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                    />
                  ))}
                  
                  {/* 추가 시간 표시 */}
                  {secondHalf.some(e => e.time.extra) && (
                    <div className="text-center my-4">
                      <Badge variant="outline" className="text-xs">
                        +{Math.max(...secondHalf.map(e => e.time.extra || 0))} minutes added
                      </Badge>
                    </div>
                  )}
                  
                  {/* 풀타임 스코어 */}
                  <ScoreDisplay
                    homeScore={finalScore.home}
                    awayScore={finalScore.away}
                    period="FT"
                  />
                </>
              )}
              
              {/* 연장전 */}
              {extraTime.length > 0 && (
                <>
                  <PeriodDivider title="Extra Time" />
                  
                  {extraTime.map((event, idx) => (
                    <ModernTimelineEvent
                      key={idx}
                      event={event}
                      isHome={event.team.id === homeTeam.id}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            /* 클래식 뷰 - 기존 코드 유지 */
            <div className="space-y-4">
              {sortedEvents.map((event, idx) => {
                const isHome = event.team.id === homeTeam.id
                const icon = getEventIcon(event.type, event.detail)
                const time = event.time.elapsed + (event.time.extra || 0)
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="min-w-[50px] text-sm font-bold text-right">
                      {time}'
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.player?.name}</p>
                      {event.assist?.name && (
                        <p className="text-xs text-gray-500">Assist: {event.assist.name}</p>
                      )}
                    </div>
                    <Badge variant={isHome ? 'default' : 'destructive'}>
                      {isHome ? homeTeam.name : awayTeam.name}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}