'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Trophy, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStandings } from '@/lib/supabase/football'

// 주요 리그 설정 (우선순위 순)
const MAJOR_LEAGUES = [
  { 
    id: 39, 
    name: 'Premier League', 
    country: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    color: 'from-purple-600 to-indigo-600',
    season: 2025
  },
  { 
    id: 140, 
    name: 'La Liga', 
    country: 'Spain',
    flag: '🇪🇸',
    color: 'from-orange-500 to-red-600',
    season: 2025
  },
  { 
    id: 135, 
    name: 'Serie A', 
    country: 'Italy',
    flag: '🇮🇹',
    color: 'from-blue-500 to-blue-700',
    season: 2025
  },
  { 
    id: 78, 
    name: 'Bundesliga', 
    country: 'Germany',
    flag: '🇩🇪',
    color: 'from-red-500 to-gray-700',
    season: 2025
  },
  { 
    id: 61, 
    name: 'Ligue 1', 
    country: 'France',
    flag: '🇫🇷',
    color: 'from-blue-600 to-red-500',
    season: 2025
  },
  { 
    id: 2, 
    name: 'Champions League', 
    country: 'Europe',
    flag: '⭐',
    color: 'from-indigo-600 to-purple-700',
    season: 2025
  }
]

interface StandingsRowProps {
  team: any
  position: number
  showChange?: boolean
  isCompact?: boolean
}

function StandingsRow({ team, position, showChange = true, isCompact = false }: StandingsRowProps) {
  const getPositionColor = (pos: number, leagueId: number) => {
    if (leagueId === 2) return '' // Champions League는 별도 처리
    
    if (pos <= 4) return 'text-green-600' // UCL
    if (pos <= 6) return 'text-blue-600' // UEL
    if (pos <= 7) return 'text-purple-600' // UECL
    if (pos >= 18) return 'text-red-600' // Relegation
    return 'text-gray-700'
  }

  const getPositionBackground = (pos: number, leagueId: number) => {
    if (leagueId === 2) return '' // Champions League는 별도 처리
    
    if (pos <= 4) return 'bg-green-100' // UCL
    if (pos <= 6) return 'bg-blue-100' // UEL
    if (pos <= 7) return 'bg-purple-100' // UECL
    if (pos >= 18) return 'bg-red-100' // Relegation
    return 'bg-gray-50'
  }

  return (
    <div className={cn(
      "flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors",
      isCompact && "py-1.5"
    )}>
      {/* 순위 */}
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
        getPositionBackground(position, team.league?.id || 0),
        getPositionColor(position, team.league?.id || 0)
      )}>
        {position}
      </div>

      {/* 팀 로고 & 이름 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Image
          src={team.team?.logo || '/placeholder-team.svg'}
          alt={team.team?.name || ''}
          width={isCompact ? 20 : 24}
          height={isCompact ? 20 : 24}
          className="object-contain"
        />
        <span className={cn(
          "font-medium truncate",
          isCompact ? "text-sm" : "text-base"
        )}>
          {team.team?.name}
        </span>
      </div>

      {/* 경기수 */}
      <div className={cn(
        "text-center text-gray-500",
        isCompact ? "text-xs w-6" : "text-sm w-8"
      )}>
        {team.all?.played || 0}
      </div>

      {/* 승점 */}
      <div className={cn(
        "font-bold text-center",
        isCompact ? "text-sm w-8" : "text-base w-10"
      )}>
        {team.points || 0}
      </div>

      {/* 변화 (옵션) */}
      {showChange && (
        <div className="w-4">
          {/* 실제 순위 변화 데이터가 있다면 여기에 표시 */}
          {/* <TrendingUp className="w-3 h-3 text-green-500" /> */}
        </div>
      )}
    </div>
  )
}

export function StandingsSectionSimple() {
  const [currentLeagueIndex, setCurrentLeagueIndex] = useState(0)
  const currentLeague = MAJOR_LEAGUES[currentLeagueIndex]
  
  const { data: standings, isLoading, error } = useStandings({
    league: currentLeague.id, 
    season: currentLeague.season
  })

  const nextLeague = () => {
    setCurrentLeagueIndex((prev) => (prev + 1) % MAJOR_LEAGUES.length)
  }

  const prevLeague = () => {
    setCurrentLeagueIndex((prev) => (prev - 1 + MAJOR_LEAGUES.length) % MAJOR_LEAGUES.length)
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          리그 순위
        </h3>
        <p className="text-center text-gray-500 py-8">순위 데이터를 불러올 수 없습니다</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          리그 순위
        </h3>
        <Link href="/standings" className="text-sm text-primary hover:underline">
          전체보기
        </Link>
      </div>

      {/* 리그 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={prevLeague}
          className="p-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r text-white font-medium",
          currentLeague.color
        )}>
          <span className="text-lg">{currentLeague.flag}</span>
          <span className="text-sm">{currentLeague.name}</span>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={nextLeague}
          className="p-1"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 순위 테이블 */}
      <div className="space-y-1">
        {/* 헤더 */}
        <div className="flex items-center gap-3 py-2 px-3 text-sm text-gray-500 border-b border-gray-200">
          <div className="w-6 text-center">#</div>
          <div className="flex-1">팀</div>
          <div className="w-8 text-center">경기</div>
          <div className="w-10 text-center">승점</div>
          <div className="w-4"></div>
        </div>

        {isLoading ? (
          // 로딩 스켈레톤
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : standings?.response && standings.response.length > 0 ? (
          // 실제 순위 (상위 8팀만 표시)
          standings.response[0]?.league?.standings?.[0]?.slice(0, 8).map((team: any, index: number) => (
            <StandingsRow
              key={team.team?.id || index}
              team={team}
              position={team.rank || index + 1}
              isCompact={true}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            순위 데이터를 불러오는 중입니다...
          </div>
        )}
      </div>

      {/* 하단 인디케이터 */}
      <div className="flex justify-center mt-4 gap-1">
        {MAJOR_LEAGUES.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentLeagueIndex ? "bg-primary" : "bg-gray-300"
            )}
          />
        ))}
      </div>
    </Card>
  )
}