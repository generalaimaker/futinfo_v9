'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Users, RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface LineupVisualizationProps {
  lineups: any[]
  events?: any[]
}

// 포메이션에 따른 선수 포지션 계산
function getPlayerPositions(formation: string) {
  const positions: { [key: string]: { x: number; y: number }[] } = {
    '4-3-3': {
      GK: [{ x: 50, y: 95 }],
      DEF: [{ x: 20, y: 75 }, { x: 40, y: 80 }, { x: 60, y: 80 }, { x: 80, y: 75 }],
      MID: [{ x: 30, y: 55 }, { x: 50, y: 50 }, { x: 70, y: 55 }],
      ATT: [{ x: 25, y: 25 }, { x: 50, y: 20 }, { x: 75, y: 25 }]
    },
    '4-4-2': {
      GK: [{ x: 50, y: 95 }],
      DEF: [{ x: 20, y: 75 }, { x: 40, y: 80 }, { x: 60, y: 80 }, { x: 80, y: 75 }],
      MID: [{ x: 20, y: 50 }, { x: 40, y: 55 }, { x: 60, y: 55 }, { x: 80, y: 50 }],
      ATT: [{ x: 35, y: 25 }, { x: 65, y: 25 }]
    },
    '4-2-3-1': {
      GK: [{ x: 50, y: 95 }],
      DEF: [{ x: 20, y: 75 }, { x: 40, y: 80 }, { x: 60, y: 80 }, { x: 80, y: 75 }],
      MID: [{ x: 35, y: 60 }, { x: 65, y: 60 }, { x: 25, y: 40 }, { x: 50, y: 35 }, { x: 75, y: 40 }],
      ATT: [{ x: 50, y: 20 }]
    },
    '3-5-2': {
      GK: [{ x: 50, y: 95 }],
      DEF: [{ x: 30, y: 80 }, { x: 50, y: 75 }, { x: 70, y: 80 }],
      MID: [{ x: 15, y: 50 }, { x: 35, y: 55 }, { x: 50, y: 60 }, { x: 65, y: 55 }, { x: 85, y: 50 }],
      ATT: [{ x: 35, y: 25 }, { x: 65, y: 25 }]
    },
    '3-4-3': {
      GK: [{ x: 50, y: 95 }],
      DEF: [{ x: 30, y: 80 }, { x: 50, y: 75 }, { x: 70, y: 80 }],
      MID: [{ x: 20, y: 55 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 80, y: 55 }],
      ATT: [{ x: 25, y: 25 }, { x: 50, y: 20 }, { x: 75, y: 25 }]
    },
    '5-3-2': {
      GK: [{ x: 50, y: 95 }],
      DEF: [{ x: 15, y: 75 }, { x: 32, y: 80 }, { x: 50, y: 82 }, { x: 68, y: 80 }, { x: 85, y: 75 }],
      MID: [{ x: 30, y: 55 }, { x: 50, y: 50 }, { x: 70, y: 55 }],
      ATT: [{ x: 35, y: 25 }, { x: 65, y: 25 }]
    }
  }

  // 기본 4-4-2 포메이션
  const defaultFormation = positions['4-4-2']
  
  // 포메이션 문자열 정규화 (예: "4-3-3" 형식으로 변환)
  const normalizedFormation = formation.replace(/\s/g, '').replace(/-/g, '-')
  
  return positions[normalizedFormation] || defaultFormation
}

// 포지션별 그룹화
function groupPlayersByPosition(players: any[]) {
  const groups: { [key: string]: any[] } = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  }
  
  players.forEach(player => {
    const pos = player.statistics?.[0]?.games?.position || ''
    if (pos === 'G') groups.GK.push(player)
    else if (pos === 'D') groups.DEF.push(player)
    else if (pos === 'M') groups.MID.push(player)
    else if (pos === 'F') groups.ATT.push(player)
  })
  
  return groups
}

// 개별 선수 카드 컴포넌트
function PlayerCard({ player, position, isHome, events = [], isSubstituted }: any) {
  const number = player.statistics?.[0]?.games?.number || player.number || '-'
  const rating = player.statistics?.[0]?.games?.rating || 0
  const goals = events.filter((e: any) => e.type === 'Goal' && e.player?.id === player.player.id).length
  const cards = events.filter((e: any) => e.type === 'Card' && e.player?.id === player.player.id)
  const yellowCards = cards.filter((c: any) => c.detail === 'Yellow Card').length
  const redCards = cards.filter((c: any) => c.detail === 'Red Card').length
  
  // 평점에 따른 색상
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500'
    if (rating >= 7) return 'text-blue-500'
    if (rating >= 6) return 'text-yellow-500'
    return 'text-red-500'
  }
  
  return (
    <div
      className={cn(
        "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 hover:z-10",
        isSubstituted && "opacity-60"
      )}
      style={{ 
        left: `${isHome ? position.x : 100 - position.x}%`, 
        top: `${isHome ? position.y : 100 - position.y}%` 
      }}
    >
      <div className="relative group cursor-pointer">
        {/* 선수 번호 원 */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2",
          isHome 
            ? "bg-blue-500 text-white border-blue-600" 
            : "bg-red-500 text-white border-red-600"
        )}>
          {number}
        </div>
        
        {/* 이벤트 뱃지 */}
        <div className="absolute -top-2 -right-2 flex gap-0.5">
          {goals > 0 && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">
              {goals}
            </div>
          )}
          {yellowCards > 0 && (
            <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
          )}
          {redCards > 0 && (
            <div className="w-4 h-4 bg-red-500 rounded-sm" />
          )}
        </div>
        
        {/* 호버 시 상세 정보 */}
        <div className={cn(
          "absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2",
          "bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 min-w-[140px]",
          "opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity",
          "z-50"
        )}>
          <p className="font-semibold text-xs truncate">{player.player.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{player.statistics?.[0]?.games?.position}</span>
            {rating > 0 && (
              <span className={cn("text-xs font-bold", getRatingColor(parseFloat(rating)))}>
                {parseFloat(rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 축구장 컴포넌트
function SoccerField({ team, formation, players, events, isHome }: any) {
  const positions = getPlayerPositions(formation)
  const groupedPlayers = groupPlayersByPosition(players)
  
  // 교체된 선수 ID 목록
  const substitutedPlayerIds = events
    ?.filter((e: any) => e.type === 'subst' && e.team.id === team.id)
    ?.map((e: any) => e.player?.id) || []
  
  return (
    <div className="relative w-full h-full">
      {/* 축구장 배경 */}
      <div className={cn(
        "absolute inset-0 rounded-lg",
        "bg-gradient-to-b from-green-500 to-green-600"
      )}>
        {/* 센터 라인 */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
        
        {/* 센터 서클 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/30 rounded-full" />
        
        {/* 골대 영역 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-12 border-2 border-b-0 border-white/30" />
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-12 border-2 border-t-0 border-white/30" />
      </div>
      
      {/* 선수 배치 */}
      <div className="relative w-full h-full">
        {/* 골키퍼 */}
        {groupedPlayers.GK.slice(0, 1).map((player, idx) => (
          <PlayerCard
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
          <PlayerCard
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
          <PlayerCard
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
          <PlayerCard
            key={player.player.id}
            player={player}
            position={positions.ATT[idx]}
            isHome={isHome}
            events={events}
            isSubstituted={substitutedPlayerIds.includes(player.player.id)}
          />
        ))}
      </div>
    </div>
  )
}

// 교체 선수 리스트
function SubstitutesList({ substitutes, team, events }: any) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">교체 선수</h4>
      <div className="grid grid-cols-2 gap-2">
        {substitutes.map((player: any) => {
          const subEvent = events?.find((e: any) => 
            e.type === 'subst' && e.assist?.id === player.player.id
          )
          const playedMinutes = subEvent ? `${subEvent.time.elapsed}'` : null
          
          return (
            <div
              key={player.player.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800",
                playedMinutes && "ring-2 ring-green-500/20"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                {player.number || '-'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{player.player.name}</p>
                <p className="text-xs text-gray-500">
                  {player.statistics?.[0]?.games?.position || 'SUB'}
                  {playedMinutes && ` • ${playedMinutes}`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LineupVisualization({ lineups, events = [] }: LineupVisualizationProps) {
  const [viewMode, setViewMode] = useState<'field' | 'list'>('field')
  
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
  
  return (
    <div className="space-y-6">
      {/* 뷰 모드 전환 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
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
        <Tabs defaultValue="combined" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="combined">전체</TabsTrigger>
            <TabsTrigger value="home">{homeTeam.team.name}</TabsTrigger>
            <TabsTrigger value="away">{awayTeam.team.name}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="combined" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {/* 홈팀 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{homeTeam.team.name}</span>
                    <Badge variant="outline">{homeTeam.formation}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="aspect-[3/4] relative">
                    <SoccerField
                      team={homeTeam.team}
                      formation={homeTeam.formation}
                      players={homeTeam.startXI.map((p: any) => p)}
                      events={events}
                      isHome={true}
                    />
                  </div>
                  <div className="mt-4">
                    <SubstitutesList
                      substitutes={homeTeam.substitutes}
                      team={homeTeam.team}
                      events={events}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* 원정팀 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{awayTeam.team.name}</span>
                    <Badge variant="outline">{awayTeam.formation}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="aspect-[3/4] relative">
                    <SoccerField
                      team={awayTeam.team}
                      formation={awayTeam.formation}
                      players={awayTeam.startXI.map((p: any) => p)}
                      events={events}
                      isHome={false}
                    />
                  </div>
                  <div className="mt-4">
                    <SubstitutesList
                      substitutes={awayTeam.substitutes}
                      team={awayTeam.team}
                      events={events}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="home" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{homeTeam.team.name}</span>
                  <Badge>{homeTeam.formation}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] relative max-w-2xl mx-auto">
                  <SoccerField
                    team={homeTeam.team}
                    formation={homeTeam.formation}
                    players={homeTeam.startXI.map((p: any) => p)}
                    events={events}
                    isHome={true}
                  />
                </div>
                <div className="mt-6 max-w-2xl mx-auto">
                  <SubstitutesList
                    substitutes={homeTeam.substitutes}
                    team={homeTeam.team}
                    events={events}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="away" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{awayTeam.team.name}</span>
                  <Badge>{awayTeam.formation}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] relative max-w-2xl mx-auto">
                  <SoccerField
                    team={awayTeam.team}
                    formation={awayTeam.formation}
                    players={awayTeam.startXI.map((p: any) => p)}
                    events={events}
                    isHome={false}
                  />
                </div>
                <div className="mt-6 max-w-2xl mx-auto">
                  <SubstitutesList
                    substitutes={awayTeam.substitutes}
                    team={awayTeam.team}
                    events={events}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* 리스트 뷰 구현 */
        <div className="grid grid-cols-2 gap-6">
          {[homeTeam, awayTeam].map((team, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{team.team.name}</span>
                  <Badge variant="outline">{team.formation}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">선발 라인업</h4>
                    <div className="space-y-1">
                      {team.startXI.map((player: any) => {
                        const stats = player.statistics?.[0]
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
                            {stats?.games?.rating && (
                              <Badge variant="outline">{parseFloat(stats.games.rating).toFixed(1)}</Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2">교체 선수</h4>
                    <div className="space-y-1">
                      {team.substitutes.map((player: any) => {
                        const stats = player.statistics?.[0]
                        return (
                          <div key={player.player.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                                {player.number || '-'}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{player.player.name}</p>
                                <p className="text-xs text-gray-500">{stats?.games?.position || 'SUB'}</p>
                              </div>
                            </div>
                            {stats?.games?.minutes && (
                              <Badge variant="secondary">{stats.games.minutes}'</Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}