import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface MatchStandingsProps {
  leagueId: number
  season: number
}

export default function MatchStandings({ leagueId, season }: MatchStandingsProps) {
  const [standings, setStandings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data, error } = await supabase.functions.invoke('unified-football-api', {
          body: {
            endpoint: 'standings',
            params: {
              league: leagueId,
              season: season
            }
          }
        })
        
        if (error) throw error
        
        if (data?.response?.[0]?.league?.standings?.[0]) {
          setStandings(data.response[0].league.standings[0])
        }
      } catch (err) {
        console.error('Error fetching standings:', err)
        setError('순위표를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStandings()
  }, [leagueId, season])
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }
  
  if (error || !standings) {
    return (
      <div className="text-center py-8 text-gray-500">
        {error || '순위 정보가 없습니다.'}
      </div>
    )
  }
  
  // 순위 변동 아이콘
  const getFormIcon = (form: string) => {
    switch (form) {
      case 'W': return <div className="w-5 h-5 bg-green-500 rounded text-white text-xs font-bold flex items-center justify-center">W</div>
      case 'D': return <div className="w-5 h-5 bg-gray-400 rounded text-white text-xs font-bold flex items-center justify-center">D</div>
      case 'L': return <div className="w-5 h-5 bg-red-500 rounded text-white text-xs font-bold flex items-center justify-center">L</div>
      default: return null
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Trophy className="w-5 h-5 mr-2" />
          리그 순위
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">순위</th>
                <th className="text-left px-2 py-3 text-xs font-medium text-gray-600">팀</th>
                <th className="text-center px-2 py-3 text-xs font-medium text-gray-600">경기</th>
                <th className="text-center px-2 py-3 text-xs font-medium text-gray-600">승</th>
                <th className="text-center px-2 py-3 text-xs font-medium text-gray-600">무</th>
                <th className="text-center px-2 py-3 text-xs font-medium text-gray-600">패</th>
                <th className="text-center px-2 py-3 text-xs font-medium text-gray-600">득실</th>
                <th className="text-center px-2 py-3 text-xs font-medium text-gray-600">점수</th>
                <th className="text-center px-2 py-3 text-xs font-medium text-gray-600">폼</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team: any) => {
                const isChampionsLeague = team.rank <= 4
                const isEuropaLeague = team.rank === 5
                const isRelegation = team.rank >= standings.length - 2
                
                return (
                  <tr 
                    key={team.team.id} 
                    className={cn(
                      "border-b hover:bg-gray-50 transition-colors",
                      isChampionsLeague && "bg-blue-50/50",
                      isEuropaLeague && "bg-orange-50/50",
                      isRelegation && "bg-red-50/50"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-sm">{team.rank}</span>
                        {team.status === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {team.status === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {team.status === 'same' && <Minus className="w-3 h-3 text-gray-400" />}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Link 
                        href={`/teams/${team.team.id}`}
                        className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
                      >
                        <Image
                          src={team.team.logo}
                          alt={team.team.name}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="font-medium text-sm truncate max-w-[120px]">
                          {team.team.name}
                        </span>
                      </Link>
                    </td>
                    <td className="text-center px-2 py-3 text-sm">{team.all.played}</td>
                    <td className="text-center px-2 py-3 text-sm">{team.all.win}</td>
                    <td className="text-center px-2 py-3 text-sm">{team.all.draw}</td>
                    <td className="text-center px-2 py-3 text-sm">{team.all.lose}</td>
                    <td className="text-center px-2 py-3 text-sm">
                      <span className="text-xs">{team.goalsDiff}</span>
                    </td>
                    <td className="text-center px-2 py-3">
                      <span className="font-bold text-sm">{team.points}</span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-center space-x-0.5">
                        {team.form && team.form.split('').slice(-5).map((result: string, idx: number) => (
                          <div key={idx}>
                            {getFormIcon(result)}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* 범례 */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-200 rounded" />
              <span className="text-gray-600">챔피언스리그</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-200 rounded" />
              <span className="text-gray-600">유로파리그</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-200 rounded" />
              <span className="text-gray-600">강등</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}