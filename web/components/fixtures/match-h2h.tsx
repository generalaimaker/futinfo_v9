import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Trophy } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface MatchH2HProps {
  fixture: any // TODO: Add proper type
}

export default function MatchH2H({ fixture }: MatchH2HProps) {
  const [h2hData, setH2hData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchH2H = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data, error } = await supabase.functions.invoke('unified-football-api', {
          body: {
            endpoint: 'fixtures/headtohead',
            params: {
              h2h: `${fixture.teams.home.id}-${fixture.teams.away.id}`,
              last: 10
            }
          }
        })
        
        if (error) throw error
        
        if (data?.response) {
          setH2hData(data.response)
        }
      } catch (err) {
        console.error('Error fetching H2H:', err)
        setError('상대전적을 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchH2H()
  }, [fixture])
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }
  
  if (error || !h2hData || h2hData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {error || '상대전적 정보가 없습니다.'}
      </div>
    )
  }
  
  // 통계 계산
  const calculateStats = () => {
    const stats = {
      home: { wins: 0, draws: 0, losses: 0, goals: 0 },
      away: { wins: 0, draws: 0, losses: 0, goals: 0 }
    }
    
    h2hData.forEach((match: any) => {
      const isHomeTeam = match.teams.home.id === fixture.teams.home.id
      const homeGoals = match.goals.home || 0
      const awayGoals = match.goals.away || 0
      
      if (isHomeTeam) {
        stats.home.goals += homeGoals
        stats.away.goals += awayGoals
        
        if (homeGoals > awayGoals) {
          stats.home.wins++
          stats.away.losses++
        } else if (homeGoals < awayGoals) {
          stats.home.losses++
          stats.away.wins++
        } else {
          stats.home.draws++
          stats.away.draws++
        }
      } else {
        stats.home.goals += awayGoals
        stats.away.goals += homeGoals
        
        if (awayGoals > homeGoals) {
          stats.home.wins++
          stats.away.losses++
        } else if (awayGoals < homeGoals) {
          stats.home.losses++
          stats.away.wins++
        } else {
          stats.home.draws++
          stats.away.draws++
        }
      }
    })
    
    return stats
  }
  
  const stats = calculateStats()
  const totalGames = h2hData.length
  
  return (
    <div className="space-y-6">
      {/* 전체 전적 요약 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            상대전적 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">최근 {totalGames}경기</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* 홈팀 */}
            <div className="text-center">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={48}
                height={48}
                className="object-contain mx-auto mb-2"
              />
              <h3 className="font-medium text-sm mb-2">{fixture.teams.home.name}</h3>
              <div className="text-2xl font-bold text-green-600">{stats.home.wins}</div>
              <div className="text-sm text-gray-600">승리</div>
            </div>
            
            {/* 무승부 */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-600 mb-1">{stats.home.draws}</div>
              <div className="text-sm text-gray-600">무승부</div>
              <div className="mt-4 text-sm">
                <div className="font-medium">총 득점</div>
                <div className="text-lg">
                  {stats.home.goals} - {stats.away.goals}
                </div>
              </div>
            </div>
            
            {/* 원정팀 */}
            <div className="text-center">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={48}
                height={48}
                className="object-contain mx-auto mb-2"
              />
              <h3 className="font-medium text-sm mb-2">{fixture.teams.away.name}</h3>
              <div className="text-2xl font-bold text-green-600">{stats.away.wins}</div>
              <div className="text-sm text-gray-600">승리</div>
            </div>
          </div>
          
          {/* 승률 바 */}
          <div className="mt-6">
            <div className="flex h-4 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(stats.home.wins / totalGames) * 100}%` }}
              />
              <div 
                className="bg-gray-300 transition-all duration-500"
                style={{ width: `${(stats.home.draws / totalGames) * 100}%` }}
              />
              <div 
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${(stats.away.wins / totalGames) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{((stats.home.wins / totalGames) * 100).toFixed(0)}%</span>
              <span>{((stats.home.draws / totalGames) * 100).toFixed(0)}%</span>
              <span>{((stats.away.wins / totalGames) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 최근 경기 결과 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            최근 맞대결
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {h2hData.slice(0, 10).map((match: any) => {
              const matchDate = new Date(match.fixture.date)
              const isHomeTeam = match.teams.home.id === fixture.teams.home.id
              const homeGoals = match.goals.home || 0
              const awayGoals = match.goals.away || 0
              
              let result: 'W' | 'D' | 'L'
              if (isHomeTeam) {
                result = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D'
              } else {
                result = awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D'
              }
              
              return (
                <div key={match.fixture.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded text-white font-bold flex items-center justify-center text-sm",
                      result === 'W' && "bg-green-500",
                      result === 'D' && "bg-gray-400",
                      result === 'L' && "bg-red-500"
                    )}>
                      {result}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {match.league.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {matchDate.toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {isHomeTeam ? match.teams.home.name : match.teams.away.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {isHomeTeam ? '홈' : '원정'}
                      </div>
                    </div>
                    <div className="text-lg font-bold px-3">
                      {homeGoals} - {awayGoals}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {isHomeTeam ? match.teams.away.name : match.teams.home.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {isHomeTeam ? '원정' : '홈'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}