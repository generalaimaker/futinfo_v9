'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import footballAPIService from '@/lib/supabase/football'
import { 
  Trophy, Calendar, TrendingUp, TrendingDown, 
  Home, Plane, Target, Shield, Users, Clock
} from 'lucide-react'

interface H2HComponentProps {
  homeTeam: any
  awayTeam: any
  currentFixture?: any
}

// 경기 결과 카드
function FixtureResultCard({ fixture, homeTeamId, awayTeamId }: any) {
  const isHomeWin = fixture.teams.home.winner
  const isAwayWin = fixture.teams.away.winner
  const isDraw = !isHomeWin && !isAwayWin && fixture.fixture.status.short === 'FT'
  
  // 현재 팀 기준으로 승/무/패 판단
  const getResultBadge = () => {
    if (fixture.teams.home.id === homeTeamId) {
      if (isHomeWin) return <Badge className="bg-green-500">승</Badge>
      if (isDraw) return <Badge className="bg-gray-500">무</Badge>
      return <Badge className="bg-red-500">패</Badge>
    } else {
      if (isAwayWin) return <Badge className="bg-green-500">승</Badge>
      if (isDraw) return <Badge className="bg-gray-500">무</Badge>
      return <Badge className="bg-red-500">패</Badge>
    }
  }
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {/* 날짜 & 대회 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">
          {format(new Date(fixture.fixture.date), 'yyyy.MM.dd', { locale: ko })}
        </p>
        <p className="text-xs font-medium truncate">
          {fixture.league.name}
        </p>
      </div>
      
      {/* 팀 & 스코어 */}
      <div className="flex items-center gap-4 px-4">
        <div className="flex items-center gap-2">
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={20}
            height={20}
            className="object-contain"
          />
          <span className={cn(
            "font-semibold text-sm",
            isHomeWin && "text-green-500"
          )}>
            {fixture.goals.home}
          </span>
        </div>
        
        <span className="text-gray-400">-</span>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold text-sm",
            isAwayWin && "text-green-500"
          )}>
            {fixture.goals.away}
          </span>
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={20}
            height={20}
            className="object-contain"
          />
        </div>
      </div>
      
      {/* 결과 */}
      <div className="flex-shrink-0">
        {getResultBadge()}
      </div>
    </div>
  )
}

// 통계 요약
function H2HStats({ fixtures, homeTeamId, awayTeamId }: any) {
  const stats = useMemo(() => {
    let homeWins = 0
    let awayWins = 0
    let draws = 0
    let homeGoals = 0
    let awayGoals = 0
    
    fixtures.forEach((fixture: any) => {
      const isHomeTeamHome = fixture.teams.home.id === homeTeamId
      
      if (isHomeTeamHome) {
        homeGoals += fixture.goals.home || 0
        awayGoals += fixture.goals.away || 0
        
        if (fixture.teams.home.winner) homeWins++
        else if (fixture.teams.away.winner) awayWins++
        else if (fixture.fixture.status.short === 'FT') draws++
      } else {
        homeGoals += fixture.goals.away || 0
        awayGoals += fixture.goals.home || 0
        
        if (fixture.teams.away.winner) homeWins++
        else if (fixture.teams.home.winner) awayWins++
        else if (fixture.fixture.status.short === 'FT') draws++
      }
    })
    
    const total = homeWins + awayWins + draws
    const homeWinRate = total > 0 ? (homeWins / total) * 100 : 0
    const awayWinRate = total > 0 ? (awayWins / total) * 100 : 0
    const drawRate = total > 0 ? (draws / total) * 100 : 0
    
    return {
      homeWins,
      awayWins,
      draws,
      total,
      homeGoals,
      awayGoals,
      homeWinRate,
      awayWinRate,
      drawRate,
      avgGoalsPerMatch: total > 0 ? (homeGoals + awayGoals) / total : 0
    }
  }, [fixtures, homeTeamId, awayTeamId])
  
  return (
    <div className="space-y-6">
      {/* 승부 기록 */}
      <div>
        <h4 className="text-sm font-semibold mb-3">전체 전적 ({stats.total}경기)</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-500">{stats.homeWins}</p>
            <p className="text-xs text-gray-500">승</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-500">{stats.draws}</p>
            <p className="text-xs text-gray-500">무</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{stats.awayWins}</p>
            <p className="text-xs text-gray-500">패</p>
          </div>
        </div>
        
        {/* 승률 막대 */}
        <div className="mt-4 space-y-2">
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
            <div 
              className="bg-green-500 transition-all" 
              style={{ width: `${stats.homeWinRate}%` }}
            />
            <div 
              className="bg-gray-400 transition-all" 
              style={{ width: `${stats.drawRate}%` }}
            />
            <div 
              className="bg-red-500 transition-all" 
              style={{ width: `${stats.awayWinRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{stats.homeWinRate.toFixed(0)}%</span>
            <span>{stats.drawRate.toFixed(0)}%</span>
            <span>{stats.awayWinRate.toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      {/* 골 통계 */}
      <div>
        <h4 className="text-sm font-semibold mb-3">골 통계</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">총 득점</span>
            <div className="flex items-center gap-4">
              <span className="font-bold">{stats.homeGoals}</span>
              <span className="text-gray-400">-</span>
              <span className="font-bold">{stats.awayGoals}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">평균 득점</span>
            <div className="flex items-center gap-4">
              <span className="font-bold">
                {stats.total > 0 ? (stats.homeGoals / stats.total).toFixed(1) : '0.0'}
              </span>
              <span className="text-gray-400">-</span>
              <span className="font-bold">
                {stats.total > 0 ? (stats.awayGoals / stats.total).toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">경기당 평균 골</span>
            <span className="font-bold">{stats.avgGoalsPerMatch.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 최근 폼 분석
function FormAnalysis({ fixtures, teamId }: any) {
  const recentForm = useMemo(() => {
    const recent = fixtures.slice(0, 5)
    const form: string[] = []
    
    recent.forEach((fixture: any) => {
      const isHome = fixture.teams.home.id === teamId
      const homeWin = fixture.teams.home.winner
      const awayWin = fixture.teams.away.winner
      
      if (isHome) {
        if (homeWin) form.push('W')
        else if (awayWin) form.push('L')
        else form.push('D')
      } else {
        if (awayWin) form.push('W')
        else if (homeWin) form.push('L')
        else form.push('D')
      }
    })
    
    return form
  }, [fixtures, teamId])
  
  const getFormColor = (result: string) => {
    switch(result) {
      case 'W': return 'bg-green-500 text-white'
      case 'L': return 'bg-red-500 text-white'
      case 'D': return 'bg-gray-500 text-white'
      default: return 'bg-gray-300'
    }
  }
  
  return (
    <div className="flex items-center gap-1">
      {recentForm.map((result, idx) => (
        <div
          key={idx}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
            getFormColor(result)
          )}
        >
          {result}
        </div>
      ))}
    </div>
  )
}

export function H2HComponent({ homeTeam, awayTeam, currentFixture }: H2HComponentProps) {
  const [h2hData, setH2HData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'home' | 'away'>('all')
  
  useEffect(() => {
    const fetchH2H = async () => {
      try {
        setLoading(true)
        const data = await footballAPIService.getH2H(homeTeam.id, awayTeam.id)
        console.log('[H2HComponent] H2H data received:', data)
        
        // data가 배열인지 확인하고, 아니면 빈 배열로 설정
        if (Array.isArray(data)) {
          setH2HData(data)
        } else {
          console.error('[H2HComponent] H2H data is not an array:', data)
          setH2HData([])
        }
      } catch (err) {
        console.error('Error fetching H2H:', err)
        setError('상대전적을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    if (homeTeam?.id && awayTeam?.id) {
      fetchH2H()
    }
  }, [homeTeam?.id, awayTeam?.id])
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error || !h2hData || h2hData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            {error || '상대전적 데이터가 없습니다.'}
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // 장소별 경기 필터링
  const filteredFixtures = useMemo(() => {
    if (!h2hData || !Array.isArray(h2hData)) return []
    if (viewMode === 'all') return h2hData
    
    return h2hData.filter((fixture: any) => {
      const isHomeTeamHome = fixture.teams.home.id === homeTeam.id
      if (viewMode === 'home') return isHomeTeamHome
      return !isHomeTeamHome
    })
  }, [h2hData, viewMode, homeTeam?.id])
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          상대 전적
        </h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            전체
          </Button>
          <Button
            variant={viewMode === 'home' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('home')}
          >
            홈
          </Button>
          <Button
            variant={viewMode === 'away' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('away')}
          >
            원정
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 통계 요약 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>통계</span>
              <Badge variant="outline">{viewMode === 'all' ? '전체' : viewMode === 'home' ? '홈' : '원정'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <H2HStats
              fixtures={filteredFixtures}
              homeTeamId={homeTeam.id}
              awayTeamId={awayTeam.id}
            />
          </CardContent>
        </Card>
        
        {/* 최근 맞대결 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">최근 맞대결</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredFixtures.slice(0, 10).map((fixture: any, idx: number) => (
                <FixtureResultCard
                  key={idx}
                  fixture={fixture}
                  homeTeamId={homeTeam.id}
                  awayTeamId={awayTeam.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 팀별 최근 폼 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image
                src={homeTeam.logo}
                alt={homeTeam.name}
                width={20}
                height={20}
                className="object-contain"
              />
              {homeTeam.name} 최근 폼
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormAnalysis
              fixtures={h2hData.filter((f: any) => 
                f.teams.home.id === homeTeam.id || f.teams.away.id === homeTeam.id
              )}
              teamId={homeTeam.id}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Image
                src={awayTeam.logo}
                alt={awayTeam.name}
                width={20}
                height={20}
                className="object-contain"
              />
              {awayTeam.name} 최근 폼
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormAnalysis
              fixtures={h2hData.filter((f: any) => 
                f.teams.home.id === awayTeam.id || f.teams.away.id === awayTeam.id
              )}
              teamId={awayTeam.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}