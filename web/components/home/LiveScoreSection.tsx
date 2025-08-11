'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Circle, RefreshCw, Zap, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLiveMatches } from '@/lib/hooks/useFootballData'
import { supabase } from '@/lib/supabase/client'

interface LiveScoreSectionProps {
  className?: string
  compact?: boolean
}

export function LiveScoreSection({ className, compact = false }: LiveScoreSectionProps) {
  const { matches, isLoading, error } = useLiveMatches()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [realtimeMatches, setRealtimeMatches] = useState<any[]>([])

  useEffect(() => {
    // Supabase Realtime 구독 설정
    const channel = supabase
      .channel('live-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches'
        },
        (payload) => {
          console.log('Live match update:', payload)
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      setRealtimeMatches(prev => {
        const index = prev.findIndex(m => m.fixture.id === payload.new.fixture_id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = {
            ...updated[index],
            goals: {
              home: payload.new.home_score,
              away: payload.new.away_score
            },
            fixture: {
              ...updated[index].fixture,
              status: {
                ...updated[index].fixture.status,
                elapsed: payload.new.elapsed_time
              }
            }
          }
          return updated
        }
        return prev
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // 강제 리프레시 로직
    try {
      const { data } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { live: 'all' }
        }
      })
      if (data?.response) {
        setRealtimeMatches(data.response)
      }
    } catch (error) {
      console.error('Error refreshing live matches:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  // 실시간 업데이트된 데이터와 기본 데이터 병합
  const displayMatches = realtimeMatches.length > 0 ? realtimeMatches : matches

  if (error) {
    return (
      <Card className={cn("dark-card p-6", className)}>
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>라이브 경기를 불러올 수 없습니다</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("dark-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="relative">
            <Zap className="w-5 h-5 text-red-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          실시간 경기
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
          {!compact && (
            <Link href="/live" className="text-sm text-primary hover:underline">
              전체보기
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : displayMatches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Circle className="w-8 h-8 mx-auto mb-2" />
          <p>현재 진행 중인 경기가 없습니다</p>
          <p className="text-xs mt-2">곧 시작하는 경기를 확인해보세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayMatches.slice(0, compact ? 3 : 5).map((match) => (
            <Link
              key={match.fixture.id}
              href={`/fixtures/${match.fixture.id}`}
              className="block p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/30 hover:border-green-500/50 transition-all"
            >
              {/* 리그 및 시간 정보 */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="text-xs">
                  {match.league.name}
                </Badge>
                <div className="flex items-center gap-2">
                  <div className="live-indicator">
                    <Circle className="w-2 h-2 fill-current" />
                  </div>
                  <span className="text-sm font-bold text-green-500">
                    {match.fixture.status.elapsed || 0}'
                  </span>
                </div>
              </div>
              
              {/* 팀 정보 및 스코어 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Image
                      src={match.teams.home.logo}
                      alt={match.teams.home.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-medium text-sm">{match.teams.home.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{match.goals.home ?? 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Image
                      src={match.teams.away.logo}
                      alt={match.teams.away.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-medium text-sm">{match.teams.away.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{match.goals.away ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* 경기 이벤트 표시 (골, 카드 등) */}
              {match.events && match.events.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {match.events.slice(-3).map((event: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1">
                        {event.type === 'Goal' && '⚽'}
                        {event.type === 'Card' && (event.detail === 'Yellow Card' ? '🟨' : '🟥')}
                        <span>{event.time.elapsed}'</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 경기장 정보 */}
              {!compact && match.fixture.venue && (
                <div className="mt-3 text-xs text-muted-foreground">
                  📍 {match.fixture.venue.name}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* 자동 새로고침 표시 */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          실시간 자동 업데이트 중
        </div>
      </div>
    </Card>
  )
}