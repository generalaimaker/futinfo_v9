'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FootballAPIService } from '@/lib/supabase/football'
import { Trophy, Calendar, MapPin, Target, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface H2HEnhancedProps {
  homeTeam: any
  awayTeam: any
}

export function H2HEnhanced({ homeTeam, awayTeam }: H2HEnhancedProps) {
  const [h2hFixtures, setH2hFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGames: 0,
    homeWins: 0,
    awayWins: 0,
    draws: 0,
    homeGoals: 0,
    awayGoals: 0
  })
  
  useEffect(() => {
    const fetchH2H = async () => {
      try {
        const footballAPI = new FootballAPIService()
        const data = await footballAPI.getH2HFixtures(homeTeam.id, awayTeam.id, 10)
        console.log('[H2HEnhanced] H2H data:', data)
        
        if (data && Array.isArray(data)) {
          setH2hFixtures(data)
          
          // 통계 계산
          let homeWins = 0
          let awayWins = 0
          let draws = 0
          let homeGoals = 0
          let awayGoals = 0
          
          data.forEach((fixture: any) => {
            const isHomeTeamHome = fixture.teams.home.id === homeTeam.id
            const homeScore = fixture.goals.home || 0
            const awayScore = fixture.goals.away || 0
            
            if (isHomeTeamHome) {
              homeGoals += homeScore
              awayGoals += awayScore
              if (homeScore > awayScore) homeWins++
              else if (awayScore > homeScore) awayWins++
              else draws++
            } else {
              homeGoals += awayScore
              awayGoals += homeScore
              if (awayScore > homeScore) homeWins++
              else if (homeScore > awayScore) awayWins++
              else draws++
            }
          })
          
          setStats({
            totalGames: data.length,
            homeWins,
            awayWins,
            draws,
            homeGoals,
            awayGoals
          })
        }
      } catch (error) {
        console.error('[H2HEnhanced] Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchH2H()
  }, [homeTeam.id, awayTeam.id])
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-100 rounded-lg mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (h2hFixtures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        상대전적 데이터가 없습니다
      </div>
    )
  }
  
  const winRate = {
    home: stats.totalGames > 0 ? Math.round((stats.homeWins / stats.totalGames) * 100) : 0,
    away: stats.totalGames > 0 ? Math.round((stats.awayWins / stats.totalGames) * 100) : 0,
    draw: stats.totalGames > 0 ? Math.round((stats.draws / stats.totalGames) * 100) : 0
  }
  
  return (
    <div className="space-y-6">
      {/* 상대전적 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            상대전적 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 전체 전적 */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">최근 {stats.totalGames}경기</p>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <Image
                    src={homeTeam.logo}
                    alt={homeTeam.name}
                    width={48}
                    height={48}
                    className="mx-auto mb-2"
                  />
                  <p className="text-2xl font-bold text-blue-500">{stats.homeWins}</p>
                  <p className="text-xs text-gray-500">승</p>
                </div>
                
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-gray-400">{stats.draws}</p>
                  <p className="text-xs text-gray-500">무</p>
                </div>
                
                <div className="text-center flex-1">
                  <Image
                    src={awayTeam.logo}
                    alt={awayTeam.name}
                    width={48}
                    height={48}
                    className="mx-auto mb-2"
                  />
                  <p className="text-2xl font-bold text-red-500">{stats.awayWins}</p>
                  <p className="text-xs text-gray-500">승</p>
                </div>
              </div>
            </div>
            
            {/* 승률 바 */}
            <div className="space-y-2">
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                <div 
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${winRate.home}%` }}
                />
                <div 
                  className="bg-gray-400 transition-all duration-500"
                  style={{ width: `${winRate.draw}%` }}
                />
                <div 
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${winRate.away}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{winRate.home}%</span>
                <span>{winRate.draw}%</span>
                <span>{winRate.away}%</span>
              </div>
            </div>
            
            {/* 득실 통계 */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">평균 득점</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-blue-500">
                    {stats.totalGames > 0 ? (stats.homeGoals / stats.totalGames).toFixed(1) : '0.0'}
                  </span>
                  <span className="text-gray-400">vs</span>
                  <span className="text-lg font-bold text-red-500">
                    {stats.totalGames > 0 ? (stats.awayGoals / stats.totalGames).toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">총 득실</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold">{stats.homeGoals}</span>
                  <span className="text-gray-400">-</span>
                  <span className="text-lg font-bold">{stats.awayGoals}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 최근 맞대결 상세 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            최근 맞대결
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {h2hFixtures.slice(0, 5).map((fixture: any, idx: number) => {
              const isHomeTeamHome = fixture.teams.home.id === homeTeam.id
              const homeScore = fixture.goals.home || 0
              const awayScore = fixture.goals.away || 0
              const matchDate = new Date(fixture.fixture.date)
              
              let homeResult = 'draw'
              let awayResult = 'draw'
              
              if (homeScore > awayScore) {
                homeResult = isHomeTeamHome ? 'win' : 'lose'
                awayResult = isHomeTeamHome ? 'lose' : 'win'
              } else if (awayScore > homeScore) {
                homeResult = isHomeTeamHome ? 'lose' : 'win'
                awayResult = isHomeTeamHome ? 'win' : 'lose'
              }
              
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  {/* 날짜 & 대회 */}
                  <div className="flex-shrink-0 w-24">
                    <p className="text-xs text-gray-500">
                      {format(matchDate, 'yyyy.MM.dd')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fixture.league.name}
                    </p>
                  </div>
                  
                  {/* 팀 & 스코어 */}
                  <div className="flex items-center gap-4 flex-1 justify-center">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        isHomeTeamHome && homeResult === 'win' && "text-blue-500",
                        !isHomeTeamHome && awayResult === 'win' && "text-blue-500"
                      )}>
                        {isHomeTeamHome ? homeTeam.name : awayTeam.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded">
                      <span className={cn(
                        "font-bold",
                        homeResult === 'win' && isHomeTeamHome && "text-blue-500",
                        homeResult === 'lose' && isHomeTeamHome && "text-gray-400",
                        awayResult === 'win' && !isHomeTeamHome && "text-blue-500",
                        awayResult === 'lose' && !isHomeTeamHome && "text-gray-400"
                      )}>
                        {isHomeTeamHome ? homeScore : awayScore}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className={cn(
                        "font-bold",
                        homeResult === 'win' && !isHomeTeamHome && "text-red-500",
                        homeResult === 'lose' && !isHomeTeamHome && "text-gray-400",
                        awayResult === 'win' && isHomeTeamHome && "text-red-500",
                        awayResult === 'lose' && isHomeTeamHome && "text-gray-400"
                      )}>
                        {isHomeTeamHome ? awayScore : homeScore}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        !isHomeTeamHome && homeResult === 'win' && "text-red-500",
                        isHomeTeamHome && awayResult === 'win' && "text-red-500"
                      )}>
                        {isHomeTeamHome ? awayTeam.name : homeTeam.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* 경기장 */}
                  <div className="flex-shrink-0 w-20 text-right">
                    {fixture.fixture.venue && (
                      <p className="text-xs text-gray-400 truncate">
                        {fixture.fixture.venue.name}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          {h2hFixtures.length > 5 && (
            <p className="text-xs text-gray-500 text-center mt-4">
              최근 5경기 표시 (총 {h2hFixtures.length}경기)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}