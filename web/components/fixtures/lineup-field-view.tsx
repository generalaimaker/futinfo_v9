'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Star, Circle, TrendingDown, ChevronDown } from 'lucide-react'

interface LineupFieldViewProps {
  lineups: any[]
  events?: any[]
  players?: any[]
}

// 포메이션별 포지션 좌표 정의 (백분율) - 홈팀은 상반부 사용 (5-48%), 원정팀은 하반부 사용 (52-95%)
const FORMATION_POSITIONS: { [key: string]: { [key: string]: Array<{ x: number; y: number }> } } = {
  '3-4-2-1': {
    GK: [{ x: 50, y: 8 }],
    DEF: [
      { x: 25, y: 20 },
      { x: 50, y: 18 },
      { x: 75, y: 20 }
    ],
    MID: [
      { x: 15, y: 30 },
      { x: 38, y: 28 },
      { x: 62, y: 28 },
      { x: 85, y: 30 },
      { x: 35, y: 38 },
      { x: 65, y: 38 }
    ],
    ATT: [
      { x: 50, y: 46 }
    ]
  },
  '4-3-3': {
    GK: [{ x: 50, y: 8 }],
    DEF: [
      { x: 18, y: 20 },
      { x: 39, y: 18 },
      { x: 61, y: 18 },
      { x: 82, y: 20 }
    ],
    MID: [
      { x: 28, y: 32 },
      { x: 50, y: 30 },
      { x: 72, y: 32 }
    ],
    ATT: [
      { x: 25, y: 42 },
      { x: 50, y: 46 },
      { x: 75, y: 42 }
    ]
  },
  '4-4-2': {
    GK: [{ x: 50, y: 8 }],
    DEF: [
      { x: 18, y: 20 },
      { x: 39, y: 18 },
      { x: 61, y: 18 },
      { x: 82, y: 20 }
    ],
    MID: [
      { x: 12, y: 32 },
      { x: 37, y: 30 },
      { x: 63, y: 30 },
      { x: 88, y: 32 }
    ],
    ATT: [
      { x: 38, y: 44 },
      { x: 62, y: 44 }
    ]
  },
  '4-2-3-1': {
    GK: [{ x: 50, y: 8 }],
    DEF: [
      { x: 18, y: 20 },
      { x: 39, y: 18 },
      { x: 61, y: 18 },
      { x: 82, y: 20 }
    ],
    MID: [
      { x: 35, y: 28 },
      { x: 65, y: 28 },
      { x: 25, y: 38 },
      { x: 50, y: 36 },
      { x: 75, y: 38 }
    ],
    ATT: [
      { x: 50, y: 46 }
    ]
  },
  '3-5-2': {
    GK: [{ x: 50, y: 8 }],
    DEF: [
      { x: 28, y: 20 },
      { x: 50, y: 18 },
      { x: 72, y: 20 }
    ],
    MID: [
      { x: 12, y: 32 },
      { x: 32, y: 28 },
      { x: 50, y: 30 },
      { x: 68, y: 28 },
      { x: 88, y: 32 }
    ],
    ATT: [
      { x: 38, y: 44 },
      { x: 62, y: 44 }
    ]
  },
  '5-3-2': {
    GK: [{ x: 50, y: 8 }],
    DEF: [
      { x: 12, y: 20 },
      { x: 31, y: 18 },
      { x: 50, y: 17 },
      { x: 69, y: 18 },
      { x: 88, y: 20 }
    ],
    MID: [
      { x: 28, y: 32 },
      { x: 50, y: 30 },
      { x: 72, y: 32 }
    ],
    ATT: [
      { x: 38, y: 44 },
      { x: 62, y: 44 }
    ]
  }
}

// 포메이션 문자열을 기반으로 포지션 할당
function assignPositionsByFormation(players: any[], formation: string) {
  const groups: { [key: string]: any[] } = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  }
  
  console.log('[LineupFieldView] Assigning positions for formation:', formation)
  console.log('[LineupFieldView] Players to assign:', players.length, 'players')
  
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
  
  // 미드필더와 공격수 처리
  if (formationParts.length === 3) {
    // 3파트 포메이션 (예: 4-3-3, 4-4-2)
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
    // 4파트 포메이션 (예: 3-4-2-1, 4-2-3-1)
    const mid1Count = formationParts[1] || 0
    const mid2Count = formationParts[2] || 0
    
    // 모든 미드필더를 MID 그룹에 추가
    const totalMidCount = mid1Count + mid2Count
    for (let i = 0; i < totalMidCount && playerIndex < players.length; i++) {
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
  
  console.log('[LineupFieldView] Assigned groups:', {
    GK: groups.GK.length,
    DEF: groups.DEF.length,
    MID: groups.MID.length,
    ATT: groups.ATT.length
  })
  
  return groups
}

// 선수 카드 컴포넌트
function PlayerOnField({ 
  player, 
  position, 
  isHome, 
  events = [], 
  isSubstituted,
  showDetails = true 
}: any) {
  const playerInfo = player.player || player
  const number = player.number || playerInfo.number || '-'
  const rating = player.statistics?.[0]?.games?.rating || null
  const playerName = playerInfo.name ? playerInfo.name.split(' ').pop() : 'Unknown'
  
  // 이벤트 정보
  const playerId = playerInfo.id
  const goals = playerId ? events.filter((e: any) => e.type === 'Goal' && e.player?.id === playerId).length : 0
  const assists = playerId ? events.filter((e: any) => e.type === 'Goal' && e.assist?.id === playerId).length : 0
  const cards = playerId ? events.filter((e: any) => e.type === 'Card' && e.player?.id === playerId) : []
  const yellowCards = cards.filter((c: any) => c.detail === 'Yellow Card').length
  const redCards = cards.filter((c: any) => c.detail === 'Red Card').length
  const subOut = playerId ? events.find((e: any) => e.type === 'subst' && e.player?.id === playerId) : null
  
  // 평점에 따른 색상
  const getRatingColor = (rating: number) => {
    if (rating >= 8.5) return 'bg-purple-500'
    if (rating >= 8) return 'bg-green-500'
    if (rating >= 7) return 'bg-blue-500'
    if (rating >= 6.5) return 'bg-gray-600'
    if (rating >= 6) return 'bg-yellow-600'
    return 'bg-orange-500'
  }
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 hover:z-50"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`
      }}
    >
      <div className="relative group">
        {/* 선수 사진/번호 */}
        <div className="relative">
          {playerInfo.photo ? (
            <div className="relative">
              <Image
                src={playerInfo.photo}
                alt={playerName}
                width={40}
                height={40}
                className="rounded-full border-2 border-white shadow-lg"
              />
              {/* 번호 뱃지 */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center shadow">
                {number}
              </div>
            </div>
          ) : (
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-white",
              isHome ? "bg-blue-600" : "bg-red-600"
            )}>
              {number}
            </div>
          )}
        </div>
        
        {/* 평점 뱃지 */}
        {rating && (
          <div className={cn(
            "absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow",
            getRatingColor(parseFloat(rating))
          )}>
            {parseFloat(rating).toFixed(1)}
          </div>
        )}
        
        {/* 이벤트 아이콘 */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          {goals > 0 && <span className="text-xs">⚽</span>}
          {assists > 0 && <span className="text-xs">🅰️</span>}
          {yellowCards > 0 && <span className="text-xs">🟨</span>}
          {redCards > 0 && <span className="text-xs">🟥</span>}
          {subOut && <span className="text-xs">↔️</span>}
        </div>
        
        {/* 선수 이름 (항상 표시) */}
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <p className="text-xs font-medium text-white bg-black/70 px-1.5 py-0.5 rounded">
            {playerName}
          </p>
        </div>
        
        {/* 교체 시간 */}
        {subOut && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <p className="text-xs text-orange-400 font-bold bg-black/70 px-1 rounded">
              {subOut.time.elapsed}'
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// 축구장 컴포넌트
function SoccerField({ homeTeam, awayTeam, events }: any) {
  const [selectedView, setSelectedView] = useState<'both' | 'home' | 'away'>('both')
  
  // 포메이션 포지션 가져오기
  const getPositions = (formation: string) => {
    const normalizedFormation = formation.replace(/\s/g, '')
    
    // 포메이션이 정의되어 있으면 사용
    if (FORMATION_POSITIONS[normalizedFormation]) {
      return FORMATION_POSITIONS[normalizedFormation]
    }
    
    // 정의되지 않은 포메이션의 경우 동적으로 생성
    const parts = normalizedFormation.split('-').map(Number)
    const positions: any = {
      GK: [{ x: 50, y: 5 }],
      DEF: [],
      MID: [],
      ATT: []
    }
    
    // 수비수 위치
    const defCount = parts[0] || 0
    for (let i = 0; i < defCount; i++) {
      const spacing = 70 / (defCount + 1)
      positions.DEF.push({
        x: 15 + spacing * (i + 1),
        y: 20
      })
    }
    
    // 미드필더 위치
    if (parts.length === 3) {
      const midCount = parts[1] || 0
      for (let i = 0; i < midCount; i++) {
        const spacing = 80 / (midCount + 1)
        positions.MID.push({
          x: 10 + spacing * (i + 1),
          y: 40
        })
      }
      
      // 공격수 위치
      const attCount = parts[2] || 0
      for (let i = 0; i < attCount; i++) {
        const spacing = 60 / (attCount + 1)
        positions.ATT.push({
          x: 20 + spacing * (i + 1),
          y: 70
        })
      }
    } else if (parts.length === 4) {
      // 4파트 포메이션
      const mid1Count = parts[1] || 0
      const mid2Count = parts[2] || 0
      const totalMid = mid1Count + mid2Count
      
      // 수비형 미드필더
      for (let i = 0; i < mid1Count; i++) {
        const spacing = 60 / (mid1Count + 1)
        positions.MID.push({
          x: 20 + spacing * (i + 1),
          y: 35
        })
      }
      
      // 공격형 미드필더
      for (let i = 0; i < mid2Count; i++) {
        const spacing = 60 / (mid2Count + 1)
        positions.MID.push({
          x: 20 + spacing * (i + 1),
          y: 55
        })
      }
      
      // 공격수 위치
      const attCount = parts[3] || 0
      for (let i = 0; i < attCount; i++) {
        const spacing = 40 / (attCount + 1)
        positions.ATT.push({
          x: 30 + spacing * (i + 1),
          y: 75
        })
      }
    }
    
    return positions
  }
  
  // 홈팀과 원정팀 포지션 및 선수 그룹화
  const homePositions = getPositions(homeTeam.formation)
  const awayPositions = getPositions(awayTeam.formation)
  
  const homeGroups = assignPositionsByFormation(homeTeam.startXI, homeTeam.formation)
  const awayGroups = assignPositionsByFormation(awayTeam.startXI, awayTeam.formation)
  
  // 전체 필드에 팀 렌더링하는 함수 (양팀이 마주보는 형태)
  const renderTeamOnField = (groups: any, positions: any, isHome: boolean, substitutedIds: string[]) => {
    const renderGroup = (groupName: string) => {
      const players = groups[groupName] || []
      const groupPositions = positions[groupName] || []
      
      return players.map((player: any, idx: number) => {
        let position = groupPositions[idx] || {
          x: 50 + (idx - Math.floor(players.length / 2)) * 20,
          y: groupName === 'GK' ? 8 : 
             groupName === 'DEF' ? 20 : 
             groupName === 'MID' ? 32 : 44
        }
        
        // 홈팀은 상반부 (y: 8-46)
        // 원정팀은 하반부 (y: 54-92) - y축 반전하고 하반부로 이동
        if (!isHome) {
          // 원정팀: 상반부 좌표를 반전시켜 하반부로 매핑
          // GK(8) -> 92, DEF(20) -> 80, MID(32) -> 68, ATT(44) -> 56
          position = {
            x: position.x,
            y: 100 - position.y
          }
        }
        
        return (
          <PlayerOnField
            key={`${isHome ? 'home' : 'away'}-${groupName.toLowerCase()}-${idx}`}
            player={player}
            position={position}
            isHome={isHome}
            events={events}
            isSubstituted={substitutedIds.includes(player.player?.id)}
          />
        )
      })
    }
    
    return (
      <>
        {renderGroup('GK')}
        {renderGroup('DEF')}
        {renderGroup('MID')}
        {renderGroup('ATT')}
      </>
    )
  }
  
  // 포지션이 없는 경우를 대비한 안전한 렌더링 함수 (기존 함수 유지)
  const renderPlayers = (groups: any, positions: any, isHome: boolean, substitutedIds: string[], flipY: boolean = false) => {
    const renderGroup = (groupName: string) => {
      const players = groups[groupName] || []
      const groupPositions = positions[groupName] || []
      
      return players.map((player: any, idx: number) => {
        // 포지션이 없는 경우 기본 위치 생성
        let position = groupPositions[idx] || {
          x: 50 + (idx - Math.floor(players.length / 2)) * 20,
          y: groupName === 'GK' ? 5 : 
             groupName === 'DEF' ? 20 : 
             groupName === 'MID' ? 40 : 60
        }
        
        // 원정팀의 경우 y축 반전
        if (flipY) {
          position = {
            x: position.x,
            y: 100 - position.y
          }
        }
        
        return (
          <PlayerOnField
            key={`${isHome ? 'home' : 'away'}-${groupName.toLowerCase()}-${idx}`}
            player={player}
            position={position}
            isHome={isHome}
            events={events}
            isSubstituted={substitutedIds.includes(player.player?.id)}
          />
        )
      })
    }
    
    return (
      <>
        {renderGroup('GK')}
        {renderGroup('DEF')}
        {renderGroup('MID')}
        {renderGroup('ATT')}
      </>
    )
  }
  
  // 원정팀 포지션을 반대로 변환 (y축 반전)
  const flipPositions = (positions: any) => {
    const flipped: any = {}
    Object.keys(positions).forEach(key => {
      flipped[key] = positions[key].map((pos: any) => ({
        x: pos.x,
        y: 100 - pos.y
      }))
    })
    return flipped
  }
  
  const flippedAwayPositions = flipPositions(awayPositions)
  
  // 교체된 선수 ID 목록
  const homeSubstitutedIds = events
    ?.filter((e: any) => e.type === 'subst' && e.team.id === homeTeam.team.id)
    ?.map((e: any) => e.player?.id) || []
    
  const awaySubstitutedIds = events
    ?.filter((e: any) => e.type === 'subst' && e.team.id === awayTeam.team.id)
    ?.map((e: any) => e.player?.id) || []
  
  return (
    <div className="relative w-full">
      {/* 뷰 선택 탭 */}
      <div className="flex justify-center gap-2 mb-4">
        <Button
          variant={selectedView === 'both' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('both')}
        >
          전체
        </Button>
        <Button
          variant={selectedView === 'home' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('home')}
        >
          {homeTeam.team.name}
        </Button>
        <Button
          variant={selectedView === 'away' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedView('away')}
        >
          {awayTeam.team.name}
        </Button>
      </div>
      
      {/* 축구장 */}
      <div className="relative aspect-[2/3] min-h-[700px] bg-gradient-to-b from-green-600 via-green-500 to-green-600 rounded-lg overflow-hidden shadow-2xl">
        {/* 잔디 패턴 */}
        <div className="absolute inset-0">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-full h-[10%]",
                i % 2 === 0 ? "bg-green-600/20" : "bg-transparent"
              )}
              style={{ top: `${i * 10}%` }}
            />
          ))}
        </div>
        
        {/* 필드 라인 */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* 외곽선 */}
          <rect x="5" y="2" width="90" height="96" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          
          {/* 센터 라인 */}
          <line x1="5" y1="50" x2="95" y2="50" stroke="white" strokeWidth="0.5" opacity="0.8" />
          
          {/* 센터 서클 */}
          <circle cx="50" cy="50" r="9" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <circle cx="50" cy="50" r="0.5" fill="white" opacity="0.5" />
          
          {/* 상단 페널티 박스 (홈팀) */}
          <rect x="30" y="2" width="40" height="16" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <rect x="40" y="2" width="20" height="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          
          {/* 하단 페널티 박스 (원정팀) */}
          <rect x="30" y="82" width="40" height="16" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <rect x="40" y="90" width="20" height="8" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
        </svg>
        
        {/* 홈팀 선수 배치 - 전체 필드 사용 */}
        {(selectedView === 'both' || selectedView === 'home') && 
          renderTeamOnField(homeGroups, homePositions, true, homeSubstitutedIds)
        }
        
        {/* 원정팀 선수 배치 - 전체 필드 사용 (반대 방향) */}
        {(selectedView === 'both' || selectedView === 'away') && 
          renderTeamOnField(awayGroups, awayPositions, false, awaySubstitutedIds)
        }
        
        {/* 팀 정보 표시 */}
        <div className="absolute top-2 left-2 right-2 flex flex-col gap-1">
          {/* 홈팀 정보 - 상단 */}
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white">
              홈 {homeTeam.formation}
            </Badge>
            <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
              {homeTeam.team.name}
            </span>
          </div>
        </div>
        
        {/* 원정팀 정보 - 하단 */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
          <Badge className="bg-red-600 text-white">
            원정 {awayTeam.formation}
          </Badge>
          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
            {awayTeam.team.name}
          </span>
        </div>
      </div>
      
      {/* 팀 정보 */}
      <div className="flex justify-between items-center mt-4 px-4">
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
        <div className="flex items-center gap-2">
          <span className="font-bold">{awayTeam.team.name}</span>
          {awayTeam.team.logo && (
            <Image
              src={awayTeam.team.logo}
              alt={awayTeam.team.name}
              width={24}
              height={24}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// 교체 선수 리스트
function SubstitutesList({ team, substitutes, events, isHome }: any) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">교체 선수</h4>
      <div className="grid grid-cols-2 gap-2">
        {substitutes.map((player: any) => {
          const playerInfo = player.player || player
          const number = player.number || playerInfo.number || '-'
          const rating = player.statistics?.[0]?.games?.rating || null
          const subEvent = events?.find((e: any) => 
            e.type === 'subst' && e.assist?.id === playerInfo.id
          )
          
          return (
            <div 
              key={playerInfo.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50",
                subEvent && "ring-1 ring-green-500/30"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                isHome ? "bg-blue-500" : "bg-red-500"
              )}>
                {number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{playerInfo.name}</p>
                {subEvent && (
                  <p className="text-xs text-green-600">
                    {subEvent.time.elapsed}' ↔️
                  </p>
                )}
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

export function LineupFieldView({ lineups, events = [], players = [] }: LineupFieldViewProps) {
  const [activeTab, setActiveTab] = useState<'field' | 'list'>('field')
  
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
      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="field">필드 뷰</TabsTrigger>
          <TabsTrigger value="list">리스트</TabsTrigger>
        </TabsList>
        
        <TabsContent value="field" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <SoccerField 
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                events={events}
              />
              
              {/* 교체 선수 섹션 */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                <SubstitutesList
                  team={homeTeam.team}
                  substitutes={homeTeam.substitutes}
                  events={events}
                  isHome={true}
                />
                <SubstitutesList
                  team={awayTeam.team}
                  substitutes={awayTeam.substitutes}
                  events={events}
                  isHome={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 홈팀 리스트 */}
            <Card>
              <CardHeader className="pb-2">
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
                  <Badge variant="outline">{homeTeam.formation}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {homeTeam.startXI.map((player: any) => {
                    const playerInfo = player.player || player
                    const number = player.number || playerInfo.number || '-'
                    const rating = player.statistics?.[0]?.games?.rating || null
                    
                    return (
                      <div key={playerInfo.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                            {number}
                          </div>
                          <span className="text-sm">{playerInfo.name}</span>
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
              </CardContent>
            </Card>
            
            {/* 원정팀 리스트 */}
            <Card>
              <CardHeader className="pb-2">
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
                  <Badge variant="outline">{awayTeam.formation}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {awayTeam.startXI.map((player: any) => {
                    const playerInfo = player.player || player
                    const number = player.number || playerInfo.number || '-'
                    const rating = player.statistics?.[0]?.games?.rating || null
                    
                    return (
                      <div key={playerInfo.id} className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                            {number}
                          </div>
                          <span className="text-sm">{playerInfo.name}</span>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}