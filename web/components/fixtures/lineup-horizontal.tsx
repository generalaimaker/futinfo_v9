'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Users, Star, TrendingUp, ChevronRight } from 'lucide-react'

interface LineupHorizontalProps {
  lineups: any[]
  events?: any[]
  players?: any[]
}

// 포메이션 문자열을 기반으로 포지션 할당
function assignPositionsByFormation(players: any[], formation: string) {
  const groups: { [key: string]: any[] } = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  }
  
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
    
    // 미드필더 전체
    for (let i = 0; i < mid1Count + mid2Count && playerIndex < players.length; i++) {
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
  
  return groups
}

// 선수 카드 컴포넌트
function PlayerCard({ player, events = [], isHome, positionLabel }: any) {
  const playerInfo = player.player || player
  const number = player.number || playerInfo.number || '-'
  const rating = player.statistics?.[0]?.games?.rating || null
  const playerName = playerInfo.name || 'Unknown'
  
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
    if (rating >= 8.5) return 'bg-purple-500 text-white'
    if (rating >= 8) return 'bg-green-500 text-white'
    if (rating >= 7) return 'bg-blue-500 text-white'
    if (rating >= 6) return 'bg-gray-600 text-white'
    if (rating >= 5) return 'bg-orange-500 text-white'
    return 'bg-red-500 text-white'
  }
  
  return (
    <div className={cn(
      "flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative",
      subOut && "opacity-70"
    )}>
      {/* 평점 */}
      {rating && (
        <div className={cn(
          "absolute -top-1 -right-1 z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg",
          getRatingColor(parseFloat(rating))
        )}>
          {parseFloat(rating).toFixed(1)}
        </div>
      )}
      
      {/* 포지션 라벨 */}
      <span className="text-xs text-gray-500 mb-1">{positionLabel}</span>
      
      {/* 선수 사진/번호 */}
      <div className="relative mb-2">
        {playerInfo.photo ? (
          <div className="relative">
            <Image
              src={playerInfo.photo}
              alt={playerName}
              width={56}
              height={56}
              className={cn(
                "rounded-full border-2",
                isHome ? "border-blue-500" : "border-red-500"
              )}
            />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
              isHome ? "bg-blue-600" : "bg-red-600"
            )}>
              {number}
            </div>
          </div>
        ) : (
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg",
            isHome ? "bg-blue-500" : "bg-red-500"
          )}>
            {number}
          </div>
        )}
      </div>
      
      {/* 이벤트 아이콘 */}
      <div className="flex gap-1 mb-1">
        {goals > 0 && (
          <span className="text-xs">⚽{goals > 1 && ` ${goals}`}</span>
        )}
        {assists > 0 && (
          <span className="text-xs">🅰️{assists > 1 && ` ${assists}`}</span>
        )}
        {yellowCards > 0 && (
          <span className="text-xs">🟨</span>
        )}
        {redCards > 0 && (
          <span className="text-xs">🟥</span>
        )}
        {subOut && (
          <span className="text-xs text-orange-500">{subOut.time.elapsed}'</span>
        )}
      </div>
      
      {/* 선수 이름 */}
      <p className="text-xs font-medium text-center truncate max-w-[80px]">
        {playerName.split(' ').pop()}
      </p>
    </div>
  )
}

// 포지션 그룹 컴포넌트
function PositionGroup({ players, label, events, isHome, bgColor }: any) {
  if (players.length === 0) return null
  
  return (
    <div className={cn("flex flex-col", bgColor)}>
      <div className="text-xs font-bold text-center text-gray-600 dark:text-gray-400 mb-2 px-2">
        {label}
      </div>
      <div className="flex flex-col gap-1">
        {players.map((player: any, idx: number) => (
          <PlayerCard
            key={idx}
            player={player}
            events={events}
            isHome={isHome}
            positionLabel={`${label} ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// 교체 선수 섹션
function SubstitutesSection({ substitutes, events, isHome }: any) {
  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">교체 선수</h4>
      <div className="flex flex-wrap gap-2">
        {substitutes.map((player: any, idx: number) => {
          const playerInfo = player.player || player
          const number = player.number || playerInfo.number || '-'
          const rating = player.statistics?.[0]?.games?.rating || null
          const subEvent = events?.find((e: any) => 
            e.type === 'subst' && e.assist?.id === playerInfo.id
          )
          
          return (
            <div 
              key={idx}
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800",
                subEvent && "ring-1 ring-green-500/50"
              )}
            >
              <span className={cn(
                "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white",
                isHome ? "bg-blue-500" : "bg-red-500"
              )}>
                {number}
              </span>
              <span className="text-xs font-medium">{playerInfo.name?.split(' ').pop()}</span>
              {subEvent && (
                <span className="text-xs text-green-600">
                  {subEvent.time.elapsed}'
                </span>
              )}
              {rating && (
                <Badge variant="outline" className="text-xs h-5">
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

export function LineupHorizontal({ lineups, events = [], players = [] }: LineupHorizontalProps) {
  const [showSubstitutes, setShowSubstitutes] = useState(false)
  
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
  
  // 포지션별로 선수 그룹화
  const homeGroups = assignPositionsByFormation(homeTeam.startXI, homeTeam.formation)
  const awayGroups = assignPositionsByFormation(awayTeam.startXI, awayTeam.formation)
  
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          라인업
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSubstitutes(!showSubstitutes)}
        >
          {showSubstitutes ? '선발 라인업' : '교체 선수 보기'}
        </Button>
      </div>
      
      {/* 메인 라인업 카드 */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {homeTeam.team.logo && (
                <Image
                  src={homeTeam.team.logo}
                  alt={homeTeam.team.name}
                  width={24}
                  height={24}
                />
              )}
              <span className="font-bold text-sm">{homeTeam.team.name}</span>
              <Badge variant="outline" className="text-xs">{homeTeam.formation}</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{awayTeam.formation}</Badge>
              <span className="font-bold text-sm">{awayTeam.team.name}</span>
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
        </CardHeader>
        
        <CardContent className="p-0">
          {!showSubstitutes ? (
            // 선발 라인업 가로 뷰
            <div className="relative">
              {/* 배경 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-green-50 to-red-50 dark:from-blue-950/20 dark:via-green-950/20 dark:to-red-950/20" />
              
              {/* 라인업 컨테이너 */}
              <div className="relative flex overflow-x-auto">
                {/* 홈팀 (왼쪽부터) */}
                <div className="flex border-r-2 border-gray-300 dark:border-gray-700">
                  {/* 홈팀 공격수 */}
                  <PositionGroup 
                    players={homeGroups.ATT}
                    label="FW"
                    events={events}
                    isHome={true}
                    bgColor="bg-blue-50/50 dark:bg-blue-950/20"
                  />
                  
                  {/* 홈팀 미드필더 */}
                  <PositionGroup 
                    players={homeGroups.MID}
                    label="MF"
                    events={events}
                    isHome={true}
                    bgColor="bg-blue-50/30 dark:bg-blue-950/10"
                  />
                  
                  {/* 홈팀 수비수 */}
                  <PositionGroup 
                    players={homeGroups.DEF}
                    label="DF"
                    events={events}
                    isHome={true}
                    bgColor="bg-blue-50/20 dark:bg-blue-950/10"
                  />
                  
                  {/* 홈팀 골키퍼 */}
                  <PositionGroup 
                    players={homeGroups.GK}
                    label="GK"
                    events={events}
                    isHome={true}
                    bgColor="bg-blue-50/10 dark:bg-blue-950/5"
                  />
                </div>
                
                {/* 중앙 구분선 */}
                <div className="flex items-center justify-center px-4 bg-gradient-to-b from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-950/10">
                  <div className="text-2xl font-bold text-gray-400">VS</div>
                </div>
                
                {/* 원정팀 (오른쪽으로) */}
                <div className="flex border-l-2 border-gray-300 dark:border-gray-700">
                  {/* 원정팀 골키퍼 */}
                  <PositionGroup 
                    players={awayGroups.GK}
                    label="GK"
                    events={events}
                    isHome={false}
                    bgColor="bg-red-50/10 dark:bg-red-950/5"
                  />
                  
                  {/* 원정팀 수비수 */}
                  <PositionGroup 
                    players={awayGroups.DEF}
                    label="DF"
                    events={events}
                    isHome={false}
                    bgColor="bg-red-50/20 dark:bg-red-950/10"
                  />
                  
                  {/* 원정팀 미드필더 */}
                  <PositionGroup 
                    players={awayGroups.MID}
                    label="MF"
                    events={events}
                    isHome={false}
                    bgColor="bg-red-50/30 dark:bg-red-950/10"
                  />
                  
                  {/* 원정팀 공격수 */}
                  <PositionGroup 
                    players={awayGroups.ATT}
                    label="FW"
                    events={events}
                    isHome={false}
                    bgColor="bg-red-50/50 dark:bg-red-950/20"
                  />
                </div>
              </div>
              
              {/* 포메이션 시각화 힌트 */}
              <div className="flex justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <ChevronRight className="w-4 h-4" />
                  <span>홈팀 공격 방향</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>원정팀 공격 방향</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </div>
              </div>
            </div>
          ) : (
            // 교체 선수 뷰
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    {homeTeam.team.logo && (
                      <Image
                        src={homeTeam.team.logo}
                        alt={homeTeam.team.name}
                        width={20}
                        height={20}
                      />
                    )}
                    {homeTeam.team.name}
                  </h4>
                  <SubstitutesSection
                    substitutes={homeTeam.substitutes}
                    events={events}
                    isHome={true}
                  />
                </div>
                
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    {awayTeam.team.logo && (
                      <Image
                        src={awayTeam.team.logo}
                        alt={awayTeam.team.name}
                        width={20}
                        height={20}
                      />
                    )}
                    {awayTeam.team.name}
                  </h4>
                  <SubstitutesSection
                    substitutes={awayTeam.substitutes}
                    events={events}
                    isHome={false}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 코치 정보 */}
      <div className="flex justify-between px-4">
        <div className="text-sm">
          <span className="text-gray-500">감독: </span>
          <span className="font-medium">{homeTeam.coach?.name || 'Unknown'}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">감독: </span>
          <span className="font-medium">{awayTeam.coach?.name || 'Unknown'}</span>
        </div>
      </div>
    </div>
  )
}