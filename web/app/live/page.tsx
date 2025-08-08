'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Circle, RefreshCw, AlertCircle, Loader2,
  Timer, Goal, Users, TrendingUp
} from 'lucide-react'
import { useLiveFixtures } from '@/lib/supabase/football'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { cn } from '@/lib/utils'

export default function LivePage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const { data, isLoading, error, refetch } = useLiveFixtures()
  const { preferences } = useUserPreferences()
  
  const fixtures = data?.response || []
  
  // 리그별로 경기 그룹화
  const fixturesByLeague = fixtures.reduce((acc: Record<string, any[]>, fixture: any) => {
    const leagueKey = `${fixture.league.id}-${fixture.league.name}`
    if (!acc[leagueKey]) {
      acc[leagueKey] = []
    }
    acc[leagueKey].push(fixture)
    return acc
  }, {})

  // 모든 리그 목록
  const leagues = Object.keys(fixturesByLeague).map(key => {
    const [id, ...nameParts] = key.split('-')
    return {
      id: parseInt(id),
      name: nameParts.join('-'),
      count: fixturesByLeague[key].length
    }
  })

  // 필터링된 경기
  const filteredFixtures = selectedLeague
    ? fixtures.filter((f: any) => f.league.id === selectedLeague)
    : fixtures

  // 30초마다 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [refetch])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (isLoading && fixtures.length === 0) {
    return (
      <div className="min-h-screen lg:ml-64 p-4 lg:p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              라이브 경기
            </h1>
            <p className="text-muted-foreground">
              현재 진행 중인 모든 경기를 실시간으로 확인하세요
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn(
              "w-4 h-4",
              isRefreshing && "animate-spin"
            )} />
            새로고침
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">진행 중</p>
                <p className="text-2xl font-bold">{fixtures.length}</p>
              </div>
              <Circle className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전반전</p>
                <p className="text-2xl font-bold">
                  {fixtures.filter((f: any) => f.fixture.status.elapsed <= 45).length}
                </p>
              </div>
              <Timer className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">후반전</p>
                <p className="text-2xl font-bold">
                  {fixtures.filter((f: any) => f.fixture.status.elapsed > 45).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 득점</p>
                <p className="text-2xl font-bold">
                  {fixtures.reduce((sum: number, f: any) => 
                    sum + (f.goals.home || 0) + (f.goals.away || 0), 0
                  )}
                </p>
              </div>
              <Goal className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* League Filter */}
        {leagues.length > 1 && (
          <Card className="dark-card p-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Button
                variant={selectedLeague === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLeague(null)}
              >
                전체 ({fixtures.length})
              </Button>
              {leagues.map((league) => (
                <Button
                  key={league.id}
                  variant={selectedLeague === league.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLeague(league.id)}
                  className="whitespace-nowrap"
                >
                  {league.name} ({league.count})
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Live Matches */}
        {error ? (
          <Card className="dark-card p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">오류가 발생했습니다</h2>
            <p className="text-muted-foreground">{String(error)}</p>
          </Card>
        ) : filteredFixtures.length === 0 ? (
          <Card className="dark-card p-8 text-center">
            <Circle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">진행 중인 경기가 없습니다</h2>
            <p className="text-muted-foreground">곧 시작될 경기를 기다려주세요</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFixtures.map((fixture: any) => {
              const isFavoriteMatch = 
                preferences.favoriteTeamIds.includes(fixture.teams.home.id) ||
                preferences.favoriteTeamIds.includes(fixture.teams.away.id)
              
              return (
                <Link
                  key={fixture.fixture.id}
                  href={`/fixtures/${fixture.fixture.id}`}
                  className="block"
                >
                  <Card className={cn(
                    "dark-card p-4 hover:border-primary/50 transition-all",
                    isFavoriteMatch && "border-yellow-500/50 bg-yellow-500/5"
                  )}>
                    {/* League & Time */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {fixture.league.name}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <div className="live-indicator">
                          <Circle className="w-2 h-2 fill-current" />
                          {fixture.fixture.status.elapsed || 0}'
                        </div>
                      </div>
                    </div>

                    {/* Teams & Score */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Image
                            src={fixture.teams.home.logo}
                            alt={fixture.teams.home.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className={cn(
                            "font-medium",
                            preferences.favoriteTeamIds.includes(fixture.teams.home.id) && "text-yellow-500"
                          )}>
                            {fixture.teams.home.name}
                          </span>
                        </div>
                        <span className="text-2xl font-bold">
                          {fixture.goals.home ?? 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Image
                            src={fixture.teams.away.logo}
                            alt={fixture.teams.away.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className={cn(
                            "font-medium",
                            preferences.favoriteTeamIds.includes(fixture.teams.away.id) && "text-yellow-500"
                          )}>
                            {fixture.teams.away.name}
                          </span>
                        </div>
                        <span className="text-2xl font-bold">
                          {fixture.goals.away ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Stadium */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground text-center">
                        {fixture.fixture.venue.name}
                      </p>
                    </div>

                    {/* Match Events */}
                    {fixture.events && fixture.events.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {fixture.events.slice(-2).map((event: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {event.type === 'Goal' && (
                              <>
                                <Goal className="w-3 h-3 text-green-500" />
                                <span>{event.time.elapsed}' {event.player.name}</span>
                              </>
                            )}
                            {event.type === 'Card' && event.detail === 'Yellow Card' && (
                              <>
                                <div className="w-3 h-4 bg-yellow-500 rounded-sm" />
                                <span>{event.time.elapsed}' {event.player.name}</span>
                              </>
                            )}
                            {event.type === 'Card' && event.detail === 'Red Card' && (
                              <>
                                <div className="w-3 h-4 bg-red-500 rounded-sm" />
                                <span>{event.time.elapsed}' {event.player.name}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="text-center text-sm text-muted-foreground">
          자동으로 30초마다 새로고침됩니다
        </div>
      </div>
    </div>
  )
}