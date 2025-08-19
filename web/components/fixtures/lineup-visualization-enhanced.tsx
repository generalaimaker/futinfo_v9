'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Users, Star, Circle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface LineupVisualizationEnhancedProps {
  lineups: any[]
  events?: any[]
  players?: any[]
}

// 포메이션에 따른 선수 포지션 계산 (FOTMOB 스타일)
function getPlayerPositions(formation: string) {
  type PositionGroup = {
    GK: { x: number; y: number }[]
    DEF: { x: number; y: number }[]
    MID: { x: number; y: number }[]
    ATT: { x: number; y: number }[]
  }
  
  const positions: { [key: string]: PositionGroup } = {
    '4-3-3': {
      GK: [{ x: 50, y: 90 }],
      DEF: [{ x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 }],
      MID: [{ x: 30, y: 45 }, { x: 50, y: 40 }, { x: 70, y: 45 }],
      ATT: [{ x: 25, y: 18 }, { x: 50, y: 12 }, { x: 75, y: 18 }]
    },
    '4-4-2': {
      GK: [{ x: 50, y: 90 }],
      DEF: [{ x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 }],
      MID: [{ x: 15, y: 45 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 85, y: 45 }],
      ATT: [{ x: 35, y: 18 }, { x: 65, y: 18 }]
    },
    '4-2-3-1': {
      GK: [{ x: 50, y: 90 }],
      DEF: [{ x: 15, y: 70 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 85, y: 70 }],
      MID: [{ x: 35, y: 55 }, { x: 65, y: 55 }, { x: 20, y: 35 }, { x: 50, y: 30 }, { x: 80, y: 35 }],
      ATT: [{ x: 50, y: 12 }]
    },
    '3-5-2': {
      GK: [{ x: 50, y: 90 }],
      DEF: [{ x: 25, y: 72 }, { x: 50, y: 70 }, { x: 75, y: 72 }],
      MID: [{ x: 10, y: 45 }, { x: 30, y: 48 }, { x: 50, y: 50 }, { x: 70, y: 48 }, { x: 90, y: 45 }],
      ATT: [{ x: 35, y: 18 }, { x: 65, y: 18 }]
    },
    '3-4-3': {
      GK: [{ x: 50, y: 90 }],
      DEF: [{ x: 25, y: 72 }, { x: 50, y: 70 }, { x: 75, y: 72 }],
      MID: [{ x: 15, y: 48 }, { x: 38, y: 45 }, { x: 62, y: 45 }, { x: 85, y: 48 }],
      ATT: [{ x: 25, y: 18 }, { x: 50, y: 12 }, { x: 75, y: 18 }]
    },
    '5-3-2': {
      GK: [{ x: 50, y: 90 }],
      DEF: [{ x: 10, y: 70 }, { x: 30, y: 72 }, { x: 50, y: 73 }, { x: 70, y: 72 }, { x: 90, y: 70 }],
      MID: [{ x: 30, y: 45 }, { x: 50, y: 40 }, { x: 70, y: 45 }],
      ATT: [{ x: 35, y: 18 }, { x: 65, y: 18 }]
    }
  }

  const defaultFormation = positions['4-4-2']
  const normalizedFormation = formation.replace(/\s/g, '').replace(/-/g, '-')
  return positions[normalizedFormation] || defaultFormation
}

// 포메이션 문자열을 기반으로 포지션 할당
function assignPositionsByFormation(players: any[], formation: string) {
  const groups: { [key: string]: any[] } = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  }
  
  console.log('[LineupVisualization] Assigning positions for formation:', formation)
  console.log('[LineupVisualization] Players to assign:', players)
  
  // 포메이션 파싱 (예: "4-3-3", "3-4-2-1", "4-4-2" 등)
  const formationParts = formation.split('-').map(Number)
  let playerIndex = 0
  
  // 첫 번째 선수는 항상 골키퍼
  if (players[playerIndex]) {
    groups.GK.push(players[playerIndex])
    playerIndex++
  }
  
  // 수비수
  const defCount = formationParts[0] || 0
  for (let i = 0; i < defCount && playerIndex < players.length; i++) {
    groups.DEF.push(players[playerIndex])
    playerIndex++
  }
  
  // 미드필더 (포메이션에 따라 다르게 처리)
  if (formationParts.length === 3) {
    // 4-4-2, 4-3-3 등 3파트 포메이션
    const midCount = formationParts[1] || 0
    for (let i = 0; i < midCount && playerIndex < players.length; i++) {
      groups.MID.push(players[playerIndex])
      playerIndex++
    }
    
    // 공격수
    const attCount = formationParts[2] || 0
    for (let i = 0; i < attCount && playerIndex < players.length; i++) {
      groups.ATT.push(players[playerIndex])
      playerIndex++
    }
  } else if (formationParts.length === 4) {
    // 4-2-3-1, 3-4-2-1 등 4파트 포메이션
    const mid1Count = formationParts[1] || 0
    const mid2Count = formationParts[2] || 0
    
    // 수비형 미드필더
    for (let i = 0; i < mid1Count && playerIndex < players.length; i++) {
      groups.MID.push(players[playerIndex])
      playerIndex++
    }
    
    // 공격형 미드필더 (또는 두 번째 미드필더 라인)
    for (let i = 0; i < mid2Count && playerIndex < players.length; i++) {
      groups.MID.push(players[playerIndex])
      playerIndex++
    }
    
    // 공격수
    const attCount = formationParts[3] || 0
    for (let i = 0; i < attCount && playerIndex < players.length; i++) {
      groups.ATT.push(players[playerIndex])
      playerIndex++
    }
  }
  
  console.log('[LineupVisualization] Assigned groups:', groups)
  return groups
}

// 포지션별 그룹화 (포지션 정보가 있으면 사용, 없으면 포메이션 기반)
function groupPlayersByPosition(players: any[], formation?: string) {
  const groups: { [key: string]: any[] } = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  }
  
  console.log('[LineupVisualization] Grouping players:', players)
  
  // 먼저 포지션 정보가 있는지 확인
  let hasPositionInfo = false
  
  players.forEach((playerData, index) => {
    console.log(`[LineupVisualization] Player ${index}:`, playerData)
    
    const pos = playerData.statistics?.[0]?.games?.position || 
                playerData.position ||
                playerData.pos || ''
    
    if (pos) {
      hasPositionInfo = true
      const actualPlayer = playerData.player ? playerData : playerData
      
      if (pos === 'G' || pos === 'Goalkeeper') groups.GK.push(actualPlayer)
      else if (pos === 'D' || pos === 'Defender') groups.DEF.push(actualPlayer)
      else if (pos === 'M' || pos === 'Midfielder') groups.MID.push(actualPlayer)
      else if (pos === 'F' || pos === 'Forward' || pos === 'Attacker') groups.ATT.push(actualPlayer)
    }
  })
  
  // 포지션 정보가 없으면 포메이션 기반으로 할당
  if (!hasPositionInfo && formation) {
    console.log('[LineupVisualization] No position info found, using formation-based assignment')
    return assignPositionsByFormation(players, formation)
  }
  
  console.log('[LineupVisualization] Grouped players:', groups)
  return groups
}

// 향상된 선수 카드 컴포넌트 (FOTMOB 스타일)
function EnhancedPlayerCard({ player, position, isHome, events = [], isSubstituted }: any) {
  // player 데이터 구조 처리
  const playerInfo = player.player || player
  const number = player.statistics?.[0]?.games?.number || player.number || playerInfo.number || '-'
  const rating = player.statistics?.[0]?.games?.rating || null
  const playerName = playerInfo.name ? playerInfo.name.split(' ').pop() : 'Unknown' // 성만 표시
  
  // 이벤트 정보
  const playerId = playerInfo.id || player.player?.id
  const goals = playerId ? events.filter((e: any) => e.type === 'Goal' && e.player?.id === playerId).length : 0
  const assists = playerId ? events.filter((e: any) => e.type === 'Goal' && e.assist?.id === playerId).length : 0
  const cards = playerId ? events.filter((e: any) => e.type === 'Card' && e.player?.id === playerId) : []
  const yellowCards = cards.filter((c: any) => c.detail === 'Yellow Card').length
  const redCards = cards.filter((c: any) => c.detail === 'Red Card').length
  const subIn = playerId ? events.find((e: any) => e.type === 'subst' && e.assist?.id === playerId) : null
  const subOut = playerId ? events.find((e: any) => e.type === 'subst' && e.player?.id === playerId) : null
  
  // 평점에 따른 색상 및 스타일
  const getRatingStyle = (rating: number) => {
    if (rating >= 8.5) return { bg: 'bg-purple-500', star: true }
    if (rating >= 8) return { bg: 'bg-green-500', star: false }
    if (rating >= 7) return { bg: 'bg-blue-500', star: false }
    if (rating >= 6) return { bg: 'bg-gray-600', star: false }
    if (rating >= 5) return { bg: 'bg-orange-500', star: false }
    return { bg: 'bg-red-500', star: false }
  }
  
  const ratingStyle = rating ? getRatingStyle(parseFloat(rating)) : null
  
  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 hover:z-20",
        isSubstituted && "opacity-70"
      )}
      style={{ 
        left: `${isHome ? position.x : 100 - position.x}%`, 
        top: `${isHome ? position.y : 100 - position.y}%` 
      }}
    >
      <div className="relative group">
        {/* 평점 배지 */}
        {rating && (
          <div className={cn(
            "absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg",
            ratingStyle?.bg
          )}>
            {ratingStyle?.star && <Star className="w-4 h-4 fill-white" />}
            {!ratingStyle?.star && parseFloat(rating).toFixed(1)}
          </div>
        )}
        
        {/* 선수 사진/번호 */}
        <div className="relative">
          {playerInfo.photo ? (
            <div className="relative">
              <Image
                src={playerInfo.photo}
                alt={playerInfo.name || 'Player'}
                width={48}
                height={48}
                className={cn(
                  "rounded-full border-2 shadow-lg",
                  isHome ? "border-blue-500" : "border-red-500"
                )}
              />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow",
                isHome ? "bg-blue-600" : "bg-red-600"
              )}>
                {number}
              </div>
            </div>
          ) : (
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2",
              isHome 
                ? "bg-blue-500 border-blue-600" 
                : "bg-red-500 border-red-600"
            )}>
              {number}
            </div>
          )}
        </div>
        
        {/* 이벤트 아이콘 */}
        <div className="absolute -top-2 -right-2 flex flex-col gap-0.5">
          {goals > 0 && (
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs text-white font-bold shadow">
              {goals > 1 ? goals : '⚽'}
            </div>
          )}
          {assists > 0 && (
            <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center text-xs text-white font-bold shadow">
              {assists}
            </div>
          )}
          {yellowCards > 0 && (
            <div className="w-5 h-4 bg-yellow-400 rounded-sm shadow" />
          )}
          {redCards > 0 && (
            <div className="w-5 h-4 bg-red-500 rounded-sm shadow" />
          )}
          {subOut && (
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white shadow">
              <TrendingDown className="w-3 h-3" />
            </div>
          )}
        </div>
        
        {/* 선수 이름 */}
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <p className="text-xs font-semibold text-white bg-black/60 px-1.5 py-0.5 rounded">
            {playerName}
          </p>
        </div>
        
        {/* 교체 시간 */}
        {subOut && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <p className="text-xs text-orange-400 font-bold">
              {subOut.time.elapsed}'
            </p>
          </div>
        )}
        
        {/* 호버 시 상세 정보 */}
        <div className={cn(
          "absolute bottom-full mb-8 left-1/2 transform -translate-x-1/2",
          "bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 min-w-[160px]",
          "opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity",
          "z-50"
        )}>
          <p className="font-bold text-sm">{playerInfo.name || 'Unknown'}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {player.statistics?.[0]?.games?.position} • #{number}
            </span>
            {rating && (
              <span className={cn("text-sm font-bold", ratingStyle?.bg && "text-white px-1 rounded")}>
                {parseFloat(rating).toFixed(1)}
              </span>
            )}
          </div>
          {(goals > 0 || assists > 0) && (
            <div className="text-xs mt-2 space-y-1">
              {goals > 0 && <p>⚽ 골: {goals}</p>}
              {assists > 0 && <p>🅰️ 어시스트: {assists}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 향상된 축구장 컴포넌트
function EnhancedSoccerField({ team, formation, players, events, isHome }: any) {
  console.log('[EnhancedSoccerField] Team:', team)
  console.log('[EnhancedSoccerField] Formation:', formation)
  console.log('[EnhancedSoccerField] Players:', players)
  console.log('[EnhancedSoccerField] IsHome:', isHome)
  
  const positions = getPlayerPositions(formation)
  const groupedPlayers = groupPlayersByPosition(players, formation)
  
  console.log('[EnhancedSoccerField] Positions:', positions)
  console.log('[EnhancedSoccerField] Grouped Players:', groupedPlayers)
  
  // 교체된 선수 ID 목록
  const substitutedPlayerIds = events
    ?.filter((e: any) => e.type === 'subst' && e.team.id === team.id)
    ?.map((e: any) => e.player?.id) || []
  
  return (
    <div className="relative w-full h-full">
      {/* 축구장 배경 (FOTMOB 스타일) */}
      <div className={cn(
        "absolute inset-0 rounded-xl overflow-hidden",
        "bg-gradient-to-b from-green-500 via-green-600 to-green-500"
      )}>
        {/* 잔디 패턴 */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-full h-[10%]",
                i % 2 === 0 ? "bg-green-600/30" : "bg-transparent"
              )}
              style={{ top: `${i * 10}%` }}
            />
          ))}
        </div>
        
        {/* 센터 라인 */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50" />
        
        {/* 센터 서클 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-24 h-24 border-2 border-white/50 rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full" />
        </div>
        
        {/* 페널티 박스 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
          <div className="w-44 h-16 border-2 border-b-0 border-white/50" />
          <div className="w-28 h-8 border-2 border-b-0 border-white/50 mt-[-2px] ml-8" />
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          <div className="w-44 h-16 border-2 border-t-0 border-white/50" />
          <div className="w-28 h-8 border-2 border-t-0 border-white/50 mb-[-2px] ml-8" />
        </div>
      </div>
      
      {/* 선수 배치 */}
      <div className="relative w-full h-full">
        {/* 골키퍼 */}
        {groupedPlayers.GK.slice(0, 1).map((player, idx) => (
          <EnhancedPlayerCard
            key={player.player.id}
            player={player}
            position={positions.GK[idx]}
            isHome={isHome}
            events={events}
            isSubstituted={substitutedPlayerIds.includes(player.player.id)}
          />
        ))}
        
        {/* 수비수 */}
        {groupedPlayers.DEF.slice(0, positions.DEF.length).map((player, idx) => (
          <EnhancedPlayerCard
            key={player.player.id}
            player={player}
            position={positions.DEF[idx]}
            isHome={isHome}
            events={events}
            isSubstituted={substitutedPlayerIds.includes(player.player.id)}
          />
        ))}
        
        {/* 미드필더 */}
        {groupedPlayers.MID.slice(0, positions.MID.length).map((player, idx) => (
          <EnhancedPlayerCard
            key={player.player.id}
            player={player}
            position={positions.MID[idx]}
            isHome={isHome}
            events={events}
            isSubstituted={substitutedPlayerIds.includes(player.player.id)}
          />
        ))}
        
        {/* 공격수 */}
        {groupedPlayers.ATT.slice(0, positions.ATT.length).map((player, idx) => (
          <EnhancedPlayerCard
            key={player.player.id}
            player={player}
            position={positions.ATT[idx]}
            isHome={isHome}
            events={events}
            isSubstituted={substitutedPlayerIds.includes(player.player.id)}
          />
        ))}
      </div>
      
      {/* 포메이션 표시 */}
      <div className="absolute top-2 left-2">
        <Badge variant="secondary" className="bg-black/60 text-white border-0">
          {formation}
        </Badge>
      </div>
    </div>
  )
}

// 교체 선수 리스트 (향상된 버전)
function EnhancedSubstitutesList({ substitutes, team, events }: any) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">교체 선수</h4>
      <div className="grid grid-cols-1 gap-1.5">
        {substitutes.map((player: any) => {
          const subEvent = events?.find((e: any) => 
            e.type === 'subst' && e.assist?.id === player.player.id
          )
          const playedMinutes = subEvent ? subEvent.time.elapsed : null
          const rating = player.statistics?.[0]?.games?.rating
          
          return (
            <div
              key={player.player.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                playedMinutes && "ring-1 ring-green-500/30 bg-green-50/50 dark:bg-green-900/20"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                  {player.number || '-'}
                </div>
                {player.player.photo && (
                  <Image
                    src={player.player.photo}
                    alt={player.player.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.player.name}</p>
                <p className="text-xs text-gray-500">
                  {player.statistics?.[0]?.games?.position || 'SUB'}
                  {playedMinutes && (
                    <span className="text-green-600 font-semibold ml-2">
                      {playedMinutes}' <TrendingUp className="w-3 h-3 inline" />
                    </span>
                  )}
                </p>
              </div>
              {rating && (
                <Badge variant="outline" className="text-xs">
                  {parseFloat(rating).toFixed(1)}
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LineupVisualizationEnhanced({ lineups, events = [], players = [] }: LineupVisualizationEnhancedProps) {
  const [viewMode, setViewMode] = useState<'field' | 'list'>('field')
  
  console.log('[LineupVisualizationEnhanced] Lineups:', lineups)
  console.log('[LineupVisualizationEnhanced] Events:', events)
  console.log('[LineupVisualizationEnhanced] Players:', players)
  
  if (!lineups || lineups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">라인업 정보가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }
  
  const homeTeam = lineups[0]
  const awayTeam = lineups[1]
  
  console.log('[LineupVisualizationEnhanced] Home Team:', homeTeam)
  console.log('[LineupVisualizationEnhanced] Away Team:', awayTeam)
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          라인업
        </h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'field' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('field')}
          >
            필드 뷰
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            리스트 뷰
          </Button>
        </div>
      </div>
      
      {viewMode === 'field' ? (
        <div className="space-y-6">
          {/* 전체 필드 뷰 */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                {/* 홈팀 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {homeTeam.team.logo && (
                        <Image
                          src={homeTeam.team.logo}
                          alt={homeTeam.team.name}
                          width={24}
                          height={24}
                        />
                      )}
                      <span className="font-bold">{homeTeam.team.name}</span>
                    </div>
                    <Badge variant="outline">{homeTeam.formation}</Badge>
                  </div>
                  <div className="aspect-[3/4] relative">
                    <EnhancedSoccerField
                      team={homeTeam.team}
                      formation={homeTeam.formation}
                      players={homeTeam.startXI}
                      events={events}
                      isHome={true}
                    />
                  </div>
                  <EnhancedSubstitutesList
                    substitutes={homeTeam.substitutes}
                    team={homeTeam.team}
                    events={events}
                  />
                </div>
                
                {/* 원정팀 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {awayTeam.team.logo && (
                        <Image
                          src={awayTeam.team.logo}
                          alt={awayTeam.team.name}
                          width={24}
                          height={24}
                        />
                      )}
                      <span className="font-bold">{awayTeam.team.name}</span>
                    </div>
                    <Badge variant="outline">{awayTeam.formation}</Badge>
                  </div>
                  <div className="aspect-[3/4] relative">
                    <EnhancedSoccerField
                      team={awayTeam.team}
                      formation={awayTeam.formation}
                      players={awayTeam.startXI}
                      events={events}
                      isHome={false}
                    />
                  </div>
                  <EnhancedSubstitutesList
                    substitutes={awayTeam.substitutes}
                    team={awayTeam.team}
                    events={events}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* 리스트 뷰 */
        <div className="grid grid-cols-2 gap-6">
          {[homeTeam, awayTeam].map((team, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {team.team.logo && (
                      <Image
                        src={team.team.logo}
                        alt={team.team.name}
                        width={24}
                        height={24}
                      />
                    )}
                    <span>{team.team.name}</span>
                  </div>
                  <Badge variant="outline">{team.formation}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold mb-2">선발 라인업</h4>
                    <div className="space-y-1">
                      {team.startXI.map((player: any) => {
                        const stats = player.statistics?.[0]
                        const playerEvents = events?.filter((e: any) => 
                          e.player?.id === player.player.id || e.assist?.id === player.player.id
                        )
                        
                        return (
                          <div key={player.player.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                                {player.number || '-'}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{player.player.name}</p>
                                <p className="text-xs text-gray-500">{stats?.games?.position || ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {playerEvents?.map((e: any, i: number) => (
                                <span key={i} className="text-xs">
                                  {e.type === 'Goal' && '⚽'}
                                  {e.type === 'Card' && e.detail === 'Yellow Card' && '🟨'}
                                  {e.type === 'Card' && e.detail === 'Red Card' && '🟥'}
                                </span>
                              ))}
                              {stats?.games?.rating && (
                                <Badge variant="outline" className="text-xs">
                                  {parseFloat(stats.games.rating).toFixed(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold mb-2">교체 선수</h4>
                    <div className="space-y-1">
                      {team.substitutes.map((player: any) => {
                        const stats = player.statistics?.[0]
                        const subEvent = events?.find((e: any) => 
                          e.type === 'subst' && e.assist?.id === player.player.id
                        )
                        
                        return (
                          <div key={player.player.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                                {player.number || '-'}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{player.player.name}</p>
                                <p className="text-xs text-gray-500">
                                  {stats?.games?.position || 'SUB'}
                                  {subEvent && (
                                    <span className="text-green-600 ml-2">
                                      {subEvent.time.elapsed}'
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {stats?.games?.rating && (
                              <Badge variant="outline" className="text-xs">
                                {parseFloat(stats.games.rating).toFixed(1)}
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}</div>
      )}
    </div>
  )
}