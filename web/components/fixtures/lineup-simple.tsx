'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

interface LineupSimpleProps {
  lineups: any[]
  events?: any[]
}

// 간단한 라인업 표시 컴포넌트
export function LineupSimple({ lineups, events = [] }: LineupSimpleProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home')
  
  if (!lineups || lineups.length < 2) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">라인업 정보가 없습니다</p>
      </Card>
    )
  }
  
  const homeTeam = lineups[0]
  const awayTeam = lineups[1]
  const activeTeam = activeTab === 'home' ? homeTeam : awayTeam
  
  // 포메이션 파싱 (예: "4-3-3" -> [4, 3, 3])
  const parseFormation = (formation: string) => {
    return formation.split('-').map(Number)
  }
  
  // 선수를 라인별로 그룹화
  const groupPlayersByLines = (players: any[], formation: string) => {
    const lines = parseFormation(formation)
    const grouped: any[][] = []
    let playerIndex = 0
    
    // GK
    grouped.push([players[playerIndex]])
    playerIndex++
    
    // 각 라인별로 선수 할당
    lines.forEach(count => {
      const line = []
      for (let i = 0; i < count && playerIndex < players.length; i++) {
        line.push(players[playerIndex])
        playerIndex++
      }
      grouped.push(line)
    })
    
    return grouped
  }
  
  // 선수 카드
  const PlayerCard = ({ player, isSmall = false }: any) => {
    const playerInfo = player.player || player
    const number = player.number || playerInfo.number || '?'
    const name = playerInfo.name || 'Unknown'
    const playerId = playerInfo.id
    
    // 이벤트 체크
    const goals = events.filter((e: any) => e.type === 'Goal' && e.player?.id === playerId).length
    const yellowCards = events.filter((e: any) => e.type === 'Card' && e.detail === 'Yellow Card' && e.player?.id === playerId).length
    const redCards = events.filter((e: any) => e.type === 'Card' && e.detail === 'Red Card' && e.player?.id === playerId).length
    const isSubstituted = events.some((e: any) => e.type === 'subst' && e.player?.id === playerId)
    
    return (
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
        isSubstituted && "opacity-60"
      )}>
        {/* 번호 */}
        <div className={cn(
          "flex items-center justify-center rounded-full text-white font-bold",
          isSmall ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm",
          activeTab === 'home' ? "bg-blue-600" : "bg-red-600"
        )}>
          {number}
        </div>
        
        {/* 이름 */}
        <div className="flex-1">
          <p className={cn(
            "font-medium",
            isSmall ? "text-xs" : "text-sm"
          )}>
            {name}
          </p>
        </div>
        
        {/* 이벤트 아이콘 */}
        <div className="flex gap-1">
          {goals > 0 && <span className="text-sm">⚽</span>}
          {yellowCards > 0 && <span className="text-sm">🟨</span>}
          {redCards > 0 && <span className="text-sm">🟥</span>}
          {isSubstituted && <span className="text-sm">↔️</span>}
        </div>
      </div>
    )
  }
  
  const playerLines = groupPlayersByLines(activeTeam.startXI, activeTeam.formation)
  
  return (
    <div className="space-y-4">
      {/* 팀 선택 탭 */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'home' ? 'default' : 'outline'}
          onClick={() => setActiveTab('home')}
          className="flex-1"
        >
          <div className="flex items-center gap-2">
            {homeTeam.team.logo && (
              <Image
                src={homeTeam.team.logo}
                alt={homeTeam.team.name}
                width={20}
                height={20}
              />
            )}
            <span>{homeTeam.team.name}</span>
            <Badge variant="secondary">{homeTeam.formation}</Badge>
          </div>
        </Button>
        
        <Button
          variant={activeTab === 'away' ? 'default' : 'outline'}
          onClick={() => setActiveTab('away')}
          className="flex-1"
        >
          <div className="flex items-center gap-2">
            {awayTeam.team.logo && (
              <Image
                src={awayTeam.team.logo}
                alt={awayTeam.team.name}
                width={20}
                height={20}
              />
            )}
            <span>{awayTeam.team.name}</span>
            <Badge variant="secondary">{awayTeam.formation}</Badge>
          </div>
        </Button>
      </div>
      
      {/* 라인업 표시 */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* 포메이션 시각화 */}
          <div className="bg-gradient-to-b from-green-600 to-green-500 rounded-lg p-4">
            <div className="space-y-3">
              {playerLines.map((line, lineIndex) => (
                <div 
                  key={lineIndex}
                  className={cn(
                    "flex justify-around items-center",
                    lineIndex === 0 && "pb-3 border-b border-white/20" // GK 구분선
                  )}
                >
                  {line.map((player, playerIndex) => {
                    const playerInfo = player.player || player
                    const number = player.number || playerInfo.number || '?'
                    const name = playerInfo.name || 'Unknown'
                    
                    return (
                      <div
                        key={playerIndex}
                        className="flex flex-col items-center gap-1 group"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold shadow-lg transition-transform group-hover:scale-110",
                          activeTab === 'home' ? "text-blue-600" : "text-red-600"
                        )}>
                          {number}
                        </div>
                        <p className="text-xs text-white/90 font-medium max-w-[60px] truncate">
                          {name.split(' ').pop()}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* 선수 리스트 */}
          <div>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              선발 라인업
            </h3>
            <div className="space-y-1">
              {activeTeam.startXI.map((player: any, idx: number) => (
                <PlayerCard key={idx} player={player} />
              ))}
            </div>
          </div>
          
          {/* 교체 선수 */}
          {activeTeam.substitutes && activeTeam.substitutes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-2">교체 선수</h3>
              <div className="space-y-1">
                {activeTeam.substitutes.map((player: any, idx: number) => (
                  <PlayerCard key={idx} player={player} isSmall />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}