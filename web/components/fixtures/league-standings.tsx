'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FootballAPIService } from '@/lib/supabase/football'
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeagueStandingsProps {
  leagueId: number
  season?: number
  homeTeamId: number
  awayTeamId: number
  homeTeamName: string
  awayTeamName: string
}

export function LeagueStandings({ 
  leagueId, 
  season, 
  homeTeamId, 
  awayTeamId,
  homeTeamName,
  awayTeamName
}: LeagueStandingsProps) {
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState(0)
  
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const footballAPI = new FootballAPIService()
        const data = await footballAPI.getLeagueStandings(leagueId, season)
        console.log('[LeagueStandings] Fetched standings:', data)
        setStandings(data)
      } catch (error) {
        console.error('[LeagueStandings] Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStandings()
  }, [leagueId, season])
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        순위 데이터를 가져올 수 없습니다
      </div>
    )
  }
  
  // 여러 그룹이 있는 경우 (챔피언스리그 등)
  const hasMultipleGroups = standings.length > 1
  const currentStandings = standings[selectedGroup] || []
  
  // 순위 변동 아이콘
  const getFormIcon = (form: string) => {
    if (form === 'W') return <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">W</div>
    if (form === 'L') return <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">L</div>
    if (form === 'D') return <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>
    return null
  }
  
  // 순위 색상 (유럽 대회 진출권 등)
  const getRankColor = (rank: number, description?: string) => {
    if (!description) return ''
    
    const desc = description.toLowerCase()
    if (desc.includes('champions league')) return 'bg-blue-500'
    if (desc.includes('europa league')) return 'bg-orange-500'
    if (desc.includes('conference')) return 'bg-green-500'
    if (desc.includes('relegation')) return 'bg-red-500'
    if (desc.includes('playoff')) return 'bg-yellow-500'
    return ''
  }
  
  return (
    <div className="space-y-4">
      {/* 그룹 선택 (여러 그룹이 있는 경우) */}
      {hasMultipleGroups && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {standings.map((group, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedGroup(idx)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                selectedGroup === idx 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              그룹 {String.fromCharCode(65 + idx)}
            </button>
          ))}
        </div>
      )}
      
      {/* 순위 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-sm text-gray-600">
              <th className="text-left py-2 px-2 w-12">#</th>
              <th className="text-left py-2 px-2">팀</th>
              <th className="text-center py-2 px-1 w-10">경기</th>
              <th className="text-center py-2 px-1 w-10">승</th>
              <th className="text-center py-2 px-1 w-10">무</th>
              <th className="text-center py-2 px-1 w-10">패</th>
              <th className="text-center py-2 px-1 w-10">득실</th>
              <th className="text-center py-2 px-1 w-10 font-bold">승점</th>
              <th className="text-center py-2 px-2">최근</th>
            </tr>
          </thead>
          <tbody>
            {currentStandings.map((team: any) => {
              const isHomeTeam = team.team.id === homeTeamId
              const isAwayTeam = team.team.id === awayTeamId
              const isHighlighted = isHomeTeam || isAwayTeam
              
              return (
                <tr 
                  key={team.team.id} 
                  className={cn(
                    "border-b transition-colors",
                    isHighlighted && "bg-blue-50 dark:bg-blue-950/20",
                    "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  )}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "w-1 h-6 rounded-full mr-1",
                        getRankColor(team.rank, team.description)
                      )} />
                      <span className="font-medium text-sm">{team.rank}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src={team.team.logo}
                        alt={team.team.name}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className={cn(
                        "text-sm",
                        isHighlighted && "font-bold"
                      )}>
                        {team.team.name}
                        {isHomeTeam && (
                          <Badge variant="outline" className="ml-2 text-xs">홈</Badge>
                        )}
                        {isAwayTeam && (
                          <Badge variant="outline" className="ml-2 text-xs">원정</Badge>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-1 text-sm">{team.all.played}</td>
                  <td className="text-center py-3 px-1 text-sm">{team.all.win}</td>
                  <td className="text-center py-3 px-1 text-sm">{team.all.draw}</td>
                  <td className="text-center py-3 px-1 text-sm">{team.all.lose}</td>
                  <td className="text-center py-3 px-1 text-sm">
                    <span className="text-xs">
                      {team.goalsDiff > 0 && '+'}{team.goalsDiff}
                    </span>
                  </td>
                  <td className="text-center py-3 px-1">
                    <span className="font-bold">{team.points}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-0.5 justify-center">
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
      <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>챔피언스리그</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
          <span>유로파리그</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>컨퍼런스리그</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>강등</span>
        </div>
      </div>
    </div>
  )
}