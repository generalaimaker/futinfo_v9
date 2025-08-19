'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import { footballAPIService } from '@/lib/supabase/football'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface H2HSimpleProps {
  homeTeam: any
  awayTeam: any
  currentFixture?: any
}

export function H2HSimple({ homeTeam, awayTeam, currentFixture }: H2HSimpleProps) {
  const [h2hData, setH2HData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'home' | 'away'>('all')
  
  useEffect(() => {
    const fetchH2H = async () => {
      if (!homeTeam?.id || !awayTeam?.id) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        const data = await footballAPIService.getH2H(homeTeam.id, awayTeam.id)
        console.log('[H2HSimple] H2H data received:', data)
        
        // 데이터가 배열인지 확인
        if (Array.isArray(data)) {
          setH2HData(data)
        } else {
          console.error('[H2HSimple] H2H data is not an array:', data)
          setH2HData([])
          setError('데이터 형식이 올바르지 않습니다.')
        }
      } catch (err) {
        console.error('Error fetching H2H:', err)
        setError('상대전적을 불러올 수 없습니다.')
        setH2HData([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchH2H()
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
  
  // 통계 계산
  let homeWins = 0
  let awayWins = 0
  let draws = 0
  let homeGoals = 0
  let awayGoals = 0
  
  const filteredData = viewMode === 'all' 
    ? h2hData 
    : h2hData.filter((fixture: any) => {
        const isHomeTeamHome = fixture?.teams?.home?.id === homeTeam.id
        if (viewMode === 'home') return isHomeTeamHome
        return !isHomeTeamHome
      })
  
  filteredData.forEach((fixture: any) => {
    if (!fixture?.teams || !fixture?.goals) return
    
    const isHomeTeamHome = fixture.teams.home?.id === homeTeam.id
    
    if (isHomeTeamHome) {
      homeGoals += fixture.goals.home || 0
      awayGoals += fixture.goals.away || 0
      
      if (fixture.teams.home?.winner) homeWins++
      else if (fixture.teams.away?.winner) awayWins++
      else if (fixture.fixture?.status?.short === 'FT') draws++
    } else {
      homeGoals += fixture.goals.away || 0
      awayGoals += fixture.goals.home || 0
      
      if (fixture.teams.away?.winner) homeWins++
      else if (fixture.teams.home?.winner) awayWins++
      else if (fixture.fixture?.status?.short === 'FT') draws++
    }
  })
  
  const total = homeWins + awayWins + draws
  const homeWinRate = total > 0 ? (homeWins / total) * 100 : 0
  const awayWinRate = total > 0 ? (awayWins / total) * 100 : 0
  const drawRate = total > 0 ? (draws / total) * 100 : 0
  
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 통계 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              전체 전적 ({total}경기)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 승부 기록 */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">{homeWins}</p>
                  <p className="text-xs text-gray-500">{homeTeam.name} 승</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-500">{draws}</p>
                  <p className="text-xs text-gray-500">무</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{awayWins}</p>
                  <p className="text-xs text-gray-500">{awayTeam.name} 승</p>
                </div>
              </div>
              
              {/* 승률 막대 */}
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
                <div 
                  className="bg-green-500 transition-all" 
                  style={{ width: `${homeWinRate}%` }}
                />
                <div 
                  className="bg-gray-400 transition-all" 
                  style={{ width: `${drawRate}%` }}
                />
                <div 
                  className="bg-red-500 transition-all" 
                  style={{ width: `${awayWinRate}%` }}
                />
              </div>
              
              {/* 골 통계 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">총 득점</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{homeGoals}</span>
                    <span className="text-gray-400">-</span>
                    <span className="font-bold">{awayGoals}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">평균 득점</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">
                      {total > 0 ? (homeGoals / total).toFixed(1) : '0.0'}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="font-bold">
                      {total > 0 ? (awayGoals / total).toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 최근 맞대결 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 맞대결</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredData.slice(0, 5).map((fixture: any, idx: number) => {
                if (!fixture?.fixture || !fixture?.teams || !fixture?.goals) return null
                
                const date = new Date(fixture.fixture.date)
                const isHomeTeamHome = fixture.teams.home?.id === homeTeam.id
                const homeScore = fixture.goals.home || 0
                const awayScore = fixture.goals.away || 0
                const isHomeWin = isHomeTeamHome 
                  ? fixture.teams.home?.winner 
                  : fixture.teams.away?.winner
                const isAwayWin = isHomeTeamHome 
                  ? fixture.teams.away?.winner 
                  : fixture.teams.home?.winner
                
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">
                        {format(date, 'yyyy.MM.dd')}
                      </span>
                      <span className="text-gray-400">
                        {fixture.league?.name || ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-semibold text-sm",
                          isHomeWin && "text-green-500"
                        )}>
                          {homeScore}
                        </span>
                      </div>
                      
                      <span className="text-gray-400">-</span>
                      
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-semibold text-sm",
                          isAwayWin && "text-green-500"
                        )}>
                          {awayScore}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isHomeWin && (
                        <Badge variant="default" className="bg-green-500 text-white text-xs">
                          {isHomeTeamHome ? 'H' : 'A'}
                        </Badge>
                      )}
                      {isAwayWin && (
                        <Badge variant="destructive" className="text-xs">
                          {isHomeTeamHome ? 'A' : 'H'}
                        </Badge>
                      )}
                      {!isHomeWin && !isAwayWin && (
                        <Badge variant="secondary" className="text-xs">
                          D
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}