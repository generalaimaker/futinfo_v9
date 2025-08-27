'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FootballAPIService } from '@/lib/supabase/football'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface LeagueStandingsMiniProps {
  leagueId: number
  season: number
  homeTeamId: number
  awayTeamId: number
}

export function LeagueStandingsMini({ 
  leagueId, 
  season, 
  homeTeamId, 
  awayTeamId 
}: LeagueStandingsMiniProps) {
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const api = new FootballAPIService()
        const data = await api.getStandings({ 
          league: leagueId, 
          season: season 
        })
        
        if (data?.response?.[0]?.league?.standings?.[0]) {
          const standingsData = data.response[0].league.standings[0]
          setStandings(standingsData)
        }
      } catch (error) {
        console.error('Error fetching standings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStandings()
  }, [leagueId, season])
  
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }
  
  if (!standings.length) return null
  
  // Find teams positions
  const homeTeamData = standings.find((team: any) => team.team.id === homeTeamId)
  const awayTeamData = standings.find((team: any) => team.team.id === awayTeamId)
  
  // Get relevant portion of table (around the teams)
  const homeRank = homeTeamData?.rank || 0
  const awayRank = awayTeamData?.rank || 0
  const minRank = Math.min(homeRank, awayRank)
  const maxRank = Math.max(homeRank, awayRank)
  
  // Show top 3 + teams + surrounding teams when collapsed, all teams when expanded
  let displayStandings = []
  
  if (expanded) {
    // Show all teams when expanded
    displayStandings = [...standings]
  } else {
    // Always show top 3
    const top3 = standings.slice(0, 3)
    displayStandings.push(...top3)
    
    // Add teams and surrounding if not in top 3
    if (minRank > 3) {
      // Add separator if there's a gap
      if (minRank > 4) {
        displayStandings.push({ separator: true })
      }
      
      // Add surrounding teams
      const start = Math.max(3, minRank - 2)
      const end = Math.min(standings.length, maxRank + 2)
      const middleTeams = standings.slice(start, end)
      displayStandings.push(...middleTeams.filter((t: any) => !top3.includes(t)))
    }
    
    // Remove duplicates
    displayStandings = displayStandings.filter((item, index, self) =>
      item.separator || index === self.findIndex((t) => t.team?.id === item.team?.id)
    )
  }
  
  const getFormIcon = (result: string) => {
    switch(result) {
      case 'W': return <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">W</div>
      case 'D': return <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">D</div>
      case 'L': return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">L</div>
      default: return null
    }
  }
  
  const getTrendIcon = (team: any) => {
    // Mock trend - in real app, compare with previous week
    const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'same'
    
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left text-xs font-medium text-gray-500 pb-2">#</th>
            <th className="text-left text-xs font-medium text-gray-500 pb-2 pl-2">팀</th>
            <th className="text-center text-xs font-medium text-gray-500 pb-2">경기</th>
            <th className="text-center text-xs font-medium text-gray-500 pb-2">승</th>
            <th className="text-center text-xs font-medium text-gray-500 pb-2">무</th>
            <th className="text-center text-xs font-medium text-gray-500 pb-2">패</th>
            <th className="text-center text-xs font-medium text-gray-500 pb-2">득실</th>
            <th className="text-center text-xs font-medium text-gray-500 pb-2">승점</th>
            <th className="text-center text-xs font-medium text-gray-500 pb-2">폼</th>
          </tr>
        </thead>
        <tbody>
          {displayStandings.map((item: any, idx: number) => {
            if (item.separator) {
              return (
                <tr key={`sep-${idx}`}>
                  <td colSpan={9} className="py-1">
                    <div className="flex items-center justify-center">
                      <span className="text-gray-400">• • •</span>
                    </div>
                  </td>
                </tr>
              )
            }
            
            const isHomeTeam = item.team.id === homeTeamId
            const isAwayTeam = item.team.id === awayTeamId
            const isHighlighted = isHomeTeam || isAwayTeam
            
            return (
              <tr 
                key={item.team.id}
                className={cn(
                  "border-b border-gray-100 dark:border-gray-800 transition-colors",
                  isHighlighted && "bg-gradient-to-r",
                  isHomeTeam && "from-blue-50/50 to-transparent dark:from-blue-950/20",
                  isAwayTeam && "from-red-50/50 to-transparent dark:from-red-950/20"
                )}
              >
                <td className="py-2 text-sm font-medium">
                  <div className="flex items-center gap-1">
                    {item.rank <= 4 && (
                      <div className={cn(
                        "w-1 h-6 rounded-full",
                        item.rank <= 2 && "bg-blue-500", // Champions League
                        item.rank === 3 && "bg-blue-400", // Champions League Qualification
                        item.rank === 4 && "bg-orange-500" // Europa League
                      )} />
                    )}
                    <span className={cn(
                      isHighlighted && "font-bold"
                    )}>
                      {item.rank}
                    </span>
                  </div>
                </td>
                <td className="py-2 pl-2">
                  <Link href={`/teams/${item.team.id}`}>
                    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      {/* 리버풀(팀 ID 40)의 경우 로고 크기 조정 */}
                      <div className={cn(
                        "flex-shrink-0",
                        item.team.id === 40 ? "w-[18px] h-[18px]" : "w-5 h-5"
                      )}>
                        <Image
                          src={item.team.logo}
                          alt={item.team.name}
                          width={item.team.id === 40 ? 18 : 20}
                          height={item.team.id === 40 ? 18 : 20}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <span className={cn(
                        "text-sm truncate max-w-[120px]",
                        isHighlighted && "font-bold"
                      )}>
                        {item.team.name}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="text-center text-sm">{item.all.played}</td>
                <td className="text-center text-sm">{item.all.win}</td>
                <td className="text-center text-sm">{item.all.draw}</td>
                <td className="text-center text-sm">{item.all.lose}</td>
                <td className="text-center text-sm">
                  <span className="text-xs">{item.all.goals.for - item.all.goals.against > 0 && '+'}{item.all.goals.for - item.all.goals.against}</span>
                </td>
                <td className="text-center">
                  <span className={cn(
                    "text-sm font-bold",
                    isHighlighted && "text-lg"
                  )}>
                    {item.points}
                  </span>
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    {item.form?.split('').slice(-3).map((result: string, i: number) => (
                      <div key={i} className={cn(
                        "w-4 h-4 rounded-sm text-[10px] font-bold flex items-center justify-center",
                        result === 'W' && "bg-green-500 text-white",
                        result === 'D' && "bg-gray-400 text-white",
                        result === 'L' && "bg-red-500 text-white"
                      )}>
                        {result}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      
      {/* Expand/Collapse button */}
      {standings.length > displayStandings.length && !expanded && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            전체 순위 보기
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {expanded && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
            className="flex items-center gap-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            접기
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span>UCL</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded-sm" />
          <span>UEL</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-50 dark:bg-blue-950/20 rounded-sm border border-blue-200 dark:border-blue-800" />
          <span>홈팀</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-50 dark:bg-red-950/20 rounded-sm border border-red-200 dark:border-red-800" />
          <span>원정팀</span>
        </div>
      </div>
    </div>
  )
}