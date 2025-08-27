'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Users, List } from 'lucide-react'
import { getPosition } from './formation-positions'
import { getTeamColor } from '@/lib/data/team-colors'
import { getPlayerFullName, getPlayerShortName, getPlayerNumber, getPlayerPosition } from '@/lib/utils/player-helpers'

// 포지션별 선수 위치 계산 (pos 기반) - 홈팀은 왼쪽, 원정팀은 오른쪽
function getPositionByRole(pos: string, posIndex: number, totalInPosition: number, isHome: boolean) {
  // X 위치 설정 - 홈팀은 0-50, 원정팀은 50-100
  const xPositions: { [key: string]: number } = {
    'G': isHome ? 5 : 95,      // 골대 앞
    'D': isHome ? 18 : 82,     // 수비 라인
    'M': isHome ? 32 : 68,     // 미드필더 라인
    'F': isHome ? 44 : 56      // 공격수 라인 (센터라인 근처)
  }
  
  // Y 위치 계산 - 균등 간격으로 배치
  const calculateYPositions = (count: number): number[] => {
    if (count === 1) return [50] // 정중앙
    if (count === 2) return [40, 60] // 두 명
    if (count === 3) return [30, 50, 70] // 세 명
    if (count === 4) return [20, 40, 60, 80] // 네 명 - 균등 간격 (센터백들 더 중앙으로)
    if (count === 5) return [10, 30, 50, 70, 90] // 다섯 명
    
    // 6명 이상일 때
    const positions = []
    const margin = 10 // 상하 여백
    const availableSpace = 100 - (margin * 2)
    const spacing = availableSpace / (count - 1)
    
    for (let i = 0; i < count; i++) {
      positions.push(margin + (spacing * i))
    }
    return positions
  }
  
  const xPos = xPositions[pos] || xPositions['M']
  const yPositions = calculateYPositions(totalInPosition)
  const yPos = yPositions[posIndex] || 50
  
  return {
    x: xPos,
    y: yPos
  }
}

interface LineupHorizontalProps {
  lineups: any[]
  events?: any[]
}

export function LineupHorizontal({ lineups, events = [], fixture }: LineupHorizontalProps & { fixture?: any }) {
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual')
  const [recentLineups, setRecentLineups] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // 최근 경기 라인업 가져오기
  useEffect(() => {
    if ((!lineups || lineups.length < 2) && fixture) {
      const fetchRecentLineups = async () => {
        setLoading(true)
        try {
          const { ExtendedFootballService } = await import('@/lib/supabase/football-extended')
          const api = new ExtendedFootballService()
          
          // 각 팀의 최근 경기 가져오기
          const [homeFixtures, awayFixtures] = await Promise.all([
            api.getTeamLastFixtures(fixture.teams.home.id, 1),
            api.getTeamLastFixtures(fixture.teams.away.id, 1)
          ])
          
          if (homeFixtures?.response?.[0] && awayFixtures?.response?.[0]) {
            // 각 팀의 최근 경기 라인업 가져오기
            const [homeLineup, awayLineup] = await Promise.all([
              api.getFixtureLineups(homeFixtures.response[0].fixture.id),
              api.getFixtureLineups(awayFixtures.response[0].fixture.id)
            ])
            
            // 각 팀의 라인업 찾기
            const homeTeamLineup = homeLineup?.response?.find((l: any) => 
              l.team.id === fixture.teams.home.id
            )
            const awayTeamLineup = awayLineup?.response?.find((l: any) => 
              l.team.id === fixture.teams.away.id
            )
            
            if (homeTeamLineup && awayTeamLineup) {
              // 팀 정보 업데이트
              homeTeamLineup.team = fixture.teams.home
              awayTeamLineup.team = fixture.teams.away
              setRecentLineups([homeTeamLineup, awayTeamLineup])
            }
          }
        } catch (error) {
          console.error('Error fetching recent lineups:', error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchRecentLineups()
    }
  }, [lineups, fixture])
  
  // 실제 라인업이 있으면 사용, 없으면 최근 라인업 사용
  const displayLineups = lineups && lineups.length >= 2 ? lineups : recentLineups
  const isRecentLineup = !lineups || lineups.length < 2
  
  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">라인업 정보를 불러오는 중...</p>
      </Card>
    )
  }
  
  if (!displayLineups || displayLineups.length < 2) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">라인업 정보가 없습니다</p>
      </Card>
    )
  }
  
  const homeTeam = displayLineups[0]
  const awayTeam = displayLineups[1]
  
  // 포지션별 선수 카운팅 (pos 기반 배치를 위해)
  const countPlayersByPosition = (team: any) => {
    const counts: { [key: string]: number } = { 'G': 0, 'D': 0, 'M': 0, 'F': 0 }
    team.startXI?.forEach((player: any) => {
      const pos = player.player?.pos
      if (pos && counts[pos] !== undefined) {
        counts[pos]++
      }
    })
    return counts
  }
  
  const homePositionCounts = countPlayersByPosition(homeTeam)
  const awayPositionCounts = countPlayersByPosition(awayTeam)
  
  
  // 팀 컬러 가져오기
  const homeTeamColor = getTeamColor(homeTeam.team.id, homeTeam.team.name)
  const awayTeamColor = getTeamColor(awayTeam.team.id, awayTeam.team.name)
  
  // 선수 마커 컴포넌트 (비주얼 뷰)
  const PlayerMarker = ({ player, isHome, formation, teamColor, index, positionCounts, team }: any) => {
    // API 데이터 구조: startXI 배열 요소는 {player: {id, name, number, grid, pos}}
    const playerInfo = player.player || player
    const number = getPlayerNumber(player)
    const name = getPlayerFullName(player)
    const playerId = playerInfo.id
    const pos = getPlayerPosition(player)
    
    // grid 값 찾기 - API-Football의 경우 player 객체 안에 grid가 있음
    // grid 형식: "row:col" (예: "1:1" for GK, "2:1" for LB)
    const grid = playerInfo.grid || player.grid
    const rating = player.statistics?.[0]?.games?.rating || playerInfo.rating
    
    // 이벤트 체크
    const goals = events.filter((e: any) => e.type === 'Goal' && e.player?.id === playerId).length
    const assists = events.filter((e: any) => e.type === 'Goal' && e.assist?.id === playerId).length
    const yellowCards = events.filter((e: any) => e.type === 'Card' && e.detail === 'Yellow Card' && e.player?.id === playerId).length
    const redCards = events.filter((e: any) => e.type === 'Card' && e.detail === 'Red Card' && e.player?.id === playerId).length
    const isSubstituted = events.some((e: any) => e.type === 'subst' && e.player?.id === playerId)
    const substitutionTime = events.find((e: any) => e.type === 'subst' && e.player?.id === playerId)?.time?.elapsed
    
    // 포지션별 인덱스 계산
    const getPosIndex = () => {
      let posIndex = 0
      for (let i = 0; i < index; i++) {
        const p = team.startXI?.[i]?.player
        if (p?.pos === pos) {
          posIndex++
        }
      }
      return posIndex
    }
    
    // 포지션 계산 - grid가 있으면 정확한 위치, 없으면 pos 기반 또는 인덱스 기반 폴백
    let position = { x: isHome ? 25 : 75, y: 50 }
    
    if (grid && formation) {
      // grid 값이 있으면 정확한 포지션 계산
      position = getPosition(grid, isHome, formation)
      
      // 포지션 미세 조정 (선수 겹침 방지)
      const samePositionPlayers = team.startXI?.filter((p: any, i: number) => {
        if (i >= index) return false
        const pGrid = p.player?.grid || p.grid
        if (!pGrid) return false
        const pPos = getPosition(pGrid, isHome, formation)
        // 같은 위치에 있는 선수 확인 (오차 범위 5% 이내)
        return Math.abs(pPos.x - position.x) < 5 && Math.abs(pPos.y - position.y) < 5
      })
      
      // 겹치는 선수가 있으면 살짝 위치 조정
      if (samePositionPlayers && samePositionPlayers.length > 0) {
        position.y += (samePositionPlayers.length * 3) * (index % 2 === 0 ? 1 : -1)
      }
    } else if (pos && positionCounts) {
      // grid가 없지만 pos가 있을 때 포지션별 배치
      const posIndex = getPosIndex()
      const totalInPosition = positionCounts[pos] || 1
      position = getPositionByRole(pos, posIndex, totalInPosition, isHome)
    } else if (index !== undefined && formation) {
      // formation만 있을 때 인덱스 기반 폴백
      const formationParts = formation.split('-').map(Number)
      
      // GK
      if (index === 0) {
        position = { x: isHome ? 5 : 95, y: 50 }
      } else {
        // 필드 플레이어 - 라인별로 구분
        let currentIndex = 1
        let lineIndex = -1
        let posInLine = 0
        
        for (let i = 0; i < formationParts.length; i++) {
          const lineSize = formationParts[i]
          if (index < currentIndex + lineSize) {
            lineIndex = i
            posInLine = index - currentIndex
            break
          }
          currentIndex += lineSize
        }
        
        if (lineIndex >= 0) {
          const lineSize = formationParts[lineIndex]
          
          // X 포지션 (전진 정도)
          const xPositions = isHome ? [15, 26, 36, 44] : [85, 74, 64, 56]
          const xPos = xPositions[Math.min(lineIndex, xPositions.length - 1)]
          
          // Y 포지션 (좌우 배치)
          let yPos = 50
          if (lineSize === 1) {
            yPos = 50
          } else if (lineSize === 2) {
            yPos = posInLine === 0 ? 35 : 65
          } else if (lineSize === 3) {
            yPos = [25, 50, 75][posInLine] || 50
          } else if (lineSize === 4) {
            yPos = [12, 35, 65, 88][posInLine] || 50
          } else if (lineSize === 5) {
            yPos = [5, 28, 50, 72, 95][posInLine] || 50
          }
          
          position = { x: xPos, y: yPos }
        }
      }
    }
    
    // 이름 줄이기 (성만 표시)
    const shortName = name.split(' ').pop() || name
    
    return (
      <Link href={`/players/${playerId}`}>
        <div
          className="absolute group cursor-pointer"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
        <div className="flex flex-col items-center gap-0.5 transition-all duration-200 hover:scale-110 hover:z-10">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white transition-all hover:shadow-2xl hover:border-yellow-400 hover:scale-110"
            style={{
              backgroundColor: teamColor.primary,
              color: teamColor.text,
              boxShadow: `0 4px 16px ${teamColor.primary}60, 0 2px 8px rgba(0,0,0,0.2)`
            }}
          >
            {number}
          </div>
          <div className="text-[11px] font-bold bg-black/90 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg backdrop-blur-sm hover:bg-black hover:scale-105 transition-all">
            {shortName}
          </div>
          <div className="flex gap-0.5 items-center">
            {goals > 0 && (
              <div className="flex items-center">
                {Array.from({ length: goals }).map((_, i) => (
                  <span key={i} className="text-[11px]">⚽</span>
                ))}
              </div>
            )}
            {assists > 0 && (
              <div className="flex items-center">
                {Array.from({ length: assists }).map((_, i) => (
                  <span key={i} className="text-[11px]">🅰️</span>
                ))}
              </div>
            )}
            {yellowCards > 0 && <span className="text-[11px]">🟨</span>}
            {redCards > 0 && <span className="text-[11px]">🟥</span>}
            {isSubstituted && (
              <div className="flex items-center gap-0.5">
                <span className="text-[11px]">↔️</span>
                {substitutionTime && (
                  <span className="text-[9px] text-red-600 font-bold">{substitutionTime}'</span>
                )}
              </div>
            )}
          </div>
          {rating && (
            <div className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md",
              rating >= 8 ? "bg-green-500 text-white" :
              rating >= 7 ? "bg-blue-500 text-white" :
              rating >= 6 ? "bg-yellow-500 text-black" :
              "bg-red-500 text-white"
            )}>
              {rating.toFixed(1)}
            </div>
          )}
        </div>
        </div>
      </Link>
    )
  }
  
  // 리스트 아이템 컴포넌트 (리스트 뷰)
  const PlayerListItem = ({ player, isHome, teamColor }: any) => {
    const playerInfo = player.player || player
    const number = getPlayerNumber(player)
    const name = getPlayerFullName(player)
    const playerId = playerInfo.id
    const pos = getPlayerPosition(player)
    const rating = playerInfo.rating || player.statistics?.[0]?.games?.rating
    
    // 이벤트 체크
    const goals = events.filter((e: any) => e.type === 'Goal' && e.player?.id === playerId).length
    const assists = events.filter((e: any) => e.type === 'Goal' && e.assist?.id === playerId).length
    const yellowCards = events.filter((e: any) => e.type === 'Card' && e.detail === 'Yellow Card' && e.player?.id === playerId).length
    const redCards = events.filter((e: any) => e.type === 'Card' && e.detail === 'Red Card' && e.player?.id === playerId).length
    const isSubstituted = events.some((e: any) => e.type === 'subst' && e.player?.id === playerId)
    const substitutionTime = events.find((e: any) => e.type === 'subst' && e.player?.id === playerId)?.time?.elapsed
    
    return (
      <Link href={`/players/${playerId}`}>
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        )}>
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
            style={{
              backgroundColor: teamColor.primary,
              color: teamColor.text
            }}
          >
            {number}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm hover:text-primary">{name}</p>
            {pos && <p className="text-xs text-gray-500">{pos}</p>}
          </div>
        {rating && (
          <div className={cn(
            "text-xs font-bold px-2 py-1 rounded",
            rating >= 8 ? "bg-green-500 text-white" :
            rating >= 7 ? "bg-blue-500 text-white" :
            rating >= 6 ? "bg-yellow-500 text-black" :
            "bg-red-500 text-white"
          )}>
            {rating.toFixed(1)}
          </div>
        )}
        <div className="flex gap-1 items-center">
          {goals > 0 && (
            <div className="flex items-center">
              {Array.from({ length: goals }).map((_, i) => (
                <span key={i} className="text-sm">⚽</span>
              ))}
            </div>
          )}
          {assists > 0 && (
            <div className="flex items-center">
              {Array.from({ length: assists }).map((_, i) => (
                <span key={i} className="text-sm">🅰️</span>
              ))}
            </div>
          )}
          {yellowCards > 0 && <span className="text-sm">🟨</span>}
          {redCards > 0 && <span className="text-sm">🟥</span>}
          {isSubstituted && (
            <div className="flex items-center gap-1">
              <span className="text-sm">↔️</span>
              {substitutionTime && (
                <span className="text-xs text-red-600 font-semibold">{substitutionTime}'</span>
              )}
            </div>
          )}
        </div>
        </div>
      </Link>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 최근 경기 라인업 안내 */}
      {isRecentLineup && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            ℹ️ 아직 라인업이 발표되지 않았습니다. 각 팀의 최근 경기에서 사용한 포메이션과 라인업을 표시합니다.
          </p>
        </div>
      )}
      
      {/* 뷰 모드 전환 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          {isRecentLineup ? '예상 라인업 (최근 경기 기준)' : '라인업'}
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={viewMode === 'visual' ? 'default' : 'outline'}
            onClick={() => setViewMode('visual')}
          >
            <Users className="h-4 w-4 mr-1" />
            비주얼
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'visual' ? 'outline' : 'default'}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            리스트
          </Button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        /* 비주얼 뷰 */
        <div className="w-full space-y-2">
          {/* 팀 정보 - 축구장 위에 배치 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
                style={{
                  backgroundColor: homeTeamColor.primary,
                  color: homeTeamColor.text
                }}
              >
                {homeTeam.team.name}
              </div>
              {homeTeam.formation && (
                <span className="text-sm text-muted-foreground">{homeTeam.formation}</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              {awayTeam.formation && (
                <span className="text-sm text-muted-foreground">{awayTeam.formation}</span>
              )}
              <div 
                className="px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
                style={{
                  backgroundColor: awayTeamColor.primary,
                  color: awayTeamColor.text
                }}
              >
                {awayTeam.team.name}
              </div>
            </div>
          </div>

          {/* 경기장 */}
          <Card className="relative bg-gradient-to-b from-green-500 via-green-600 to-green-500 overflow-hidden shadow-2xl border-2 border-green-600">
            {/* 잔디 패턴 - 더 선명하게 */}
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full" style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.15) 40px, rgba(0,0,0,0.15) 80px)`
              }} />
            </div>
            
            {/* 조명 효과 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
            </div>

            {/* 경기장 라인 */}
            <div className="absolute inset-8">
              {/* 외곽 라인 */}
              <div className="absolute inset-0 border-2 border-white/60 rounded-sm" />
              
              {/* 센터 라인 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60" />
              
              {/* 센터 서클 */}
              <div className="absolute left-1/2 top-1/2 w-24 h-24 -ml-12 -mt-12 border-2 border-white/60 rounded-full" />
              <div className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 bg-white/80 rounded-full" />
              
              {/* 홈팀 페널티 박스 */}
              <div className="absolute left-0 top-1/2 w-20 h-32 -mt-16 border-t-2 border-r-2 border-b-2 border-white/40" />
              <div className="absolute left-0 top-1/2 w-10 h-20 -mt-10 border-t-2 border-r-2 border-b-2 border-white/40" />
              
              {/* 홈팀 골대 */}
              <div className="absolute -left-0.5 top-1/2 w-1.5 h-12 -mt-6 bg-white/60" />
              
              {/* 홈팀 페널티 스팟 */}
              <div className="absolute left-14 top-1/2 w-1.5 h-1.5 -mt-0.75 bg-white/60 rounded-full" />
              
              {/* 홈팀 페널티 아크 */}
              <div className="absolute left-16 top-1/2 w-8 h-16 -mt-8 border-r-2 border-white/40 rounded-r-full" />
              
              {/* 원정팀 페널티 박스 */}
              <div className="absolute right-0 top-1/2 w-20 h-32 -mt-16 border-t-2 border-l-2 border-b-2 border-white/40" />
              <div className="absolute right-0 top-1/2 w-10 h-20 -mt-10 border-t-2 border-l-2 border-b-2 border-white/40" />
              
              {/* 원정팀 골대 */}
              <div className="absolute -right-0.5 top-1/2 w-1.5 h-12 -mt-6 bg-white/60" />
              
              {/* 원정팀 페널티 스팟 */}
              <div className="absolute right-14 top-1/2 w-1.5 h-1.5 -mt-0.75 bg-white/60 rounded-full" />
              
              {/* 원정팀 페널티 아크 */}
              <div className="absolute right-16 top-1/2 w-8 h-16 -mt-8 border-l-2 border-white/40 rounded-l-full" />
              
              {/* 코너 아크 */}
              <div className="absolute left-0 top-0 w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br-full" />
              <div className="absolute left-0 bottom-0 w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr-full" />
              <div className="absolute right-0 top-0 w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl-full" />
              <div className="absolute right-0 bottom-0 w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl-full" />
            </div>

            {/* 선수 배치 컨테이너 - 상하 여백 증가 */}
            <div className="relative h-[28rem] py-12">
              {homeTeam.startXI?.map((player: any, idx: number) => (
                <PlayerMarker
                  key={idx}
                  player={player}
                  isHome={true}
                  formation={homeTeam.formation}
                  teamColor={homeTeamColor}
                  index={idx}
                  positionCounts={homePositionCounts}
                  team={homeTeam}
                />
              ))}
              
              {/* 선수 배치 - 원정팀 (오른쪽) */}
              {awayTeam.startXI?.map((player: any, idx: number) => (
                <PlayerMarker
                  key={idx}
                  player={player}
                  isHome={false}
                  formation={awayTeam.formation}
                  teamColor={awayTeamColor}
                  index={idx}
                  positionCounts={awayPositionCounts}
                  team={awayTeam}
                />
              ))}
            </div>
          </Card>
          
          {/* 벤치 선수 표시 */}
          {(homeTeam.substitutes?.length > 0 || awayTeam.substitutes?.length > 0) && (
            <Card className="mt-4 p-5 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">벤치 & 교체 선수</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Substitutes & Bench Players</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ↑ 들어온 선수 | ↓ 나간 선수
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 홈팀 벤치 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="font-semibold text-sm">{homeTeam.team.name}</span>
                  </div>
                  <div className="space-y-2">
                    {homeTeam.substitutes?.map((player: any, idx: number) => {
                      const playerInfo = player.player || player
                      const number = getPlayerNumber(player)
                      const name = getPlayerFullName(player)
                      const playerId = playerInfo.id
                      const pos = getPlayerPosition(player)
                      
                      // 교체 이벤트 확인
                      const substitutionEvent = events?.find((e: any) => 
                        e.type === 'subst' && e.assist?.id === playerId
                      )
                      const substitutedFor = substitutionEvent?.player
                      const substitutionTime = substitutionEvent?.time?.elapsed
                      
                      // 교체되지 않은 벤치 선수인지 확인
                      const isUnused = !substitutionEvent
                      
                      return (
                        <div key={idx} className={cn(
                          "flex items-center justify-between p-2 rounded-lg transition-all",
                          isUnused ? "bg-gray-100/50 dark:bg-gray-800/30 opacity-75" : "bg-white/50 dark:bg-gray-800/50"
                        )}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: isUnused ? `${homeTeamColor.primary}80` : homeTeamColor.primary,
                                color: homeTeamColor.text
                              }}
                            >
                              {number}
                            </div>
                            <Link href={`/players/${playerId}`} className="flex-1">
                              <p className={cn("text-sm font-medium hover:text-primary cursor-pointer", isUnused && "text-gray-600 dark:text-gray-400")}>
                                {name}
                              </p>
                              {pos && <p className="text-xs text-gray-500">{pos}</p>}
                            </Link>
                          </div>
                          {substitutionEvent ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-green-600 text-xs font-bold">IN</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{substitutionTime}'</span>
                              </div>
                              {substitutedFor && (
                                <span className="text-xs text-gray-500">↔️ {getPlayerShortName(substitutedFor)}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">미사용</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* 원정팀 벤치 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="font-semibold text-sm">{awayTeam.team.name}</span>
                  </div>
                  <div className="space-y-2">
                    {awayTeam.substitutes?.map((player: any, idx: number) => {
                      const playerInfo = player.player || player
                      const number = getPlayerNumber(player)
                      const name = getPlayerFullName(player)
                      const playerId = playerInfo.id
                      const pos = getPlayerPosition(player)
                      
                      // 교체 이벤트 확인
                      const substitutionEvent = events?.find((e: any) => 
                        e.type === 'subst' && e.assist?.id === playerId
                      )
                      const substitutedFor = substitutionEvent?.player
                      const substitutionTime = substitutionEvent?.time?.elapsed
                      
                      // 교체되지 않은 벤치 선수인지 확인
                      const isUnused = !substitutionEvent
                      
                      return (
                        <div key={idx} className={cn(
                          "flex items-center justify-between p-2 rounded-lg transition-all",
                          isUnused ? "bg-gray-100/50 dark:bg-gray-800/30 opacity-75" : "bg-white/50 dark:bg-gray-800/50"
                        )}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: isUnused ? `${awayTeamColor.primary}80` : awayTeamColor.primary,
                                color: awayTeamColor.text
                              }}
                            >
                              {number}
                            </div>
                            <Link href={`/players/${playerId}`} className="flex-1">
                              <p className={cn("text-sm font-medium hover:text-primary cursor-pointer", isUnused && "text-gray-600 dark:text-gray-400")}>
                                {name}
                              </p>
                              {pos && <p className="text-xs text-gray-500">{pos}</p>}
                            </Link>
                          </div>
                          {substitutionEvent ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-green-600 text-xs font-bold">IN</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{substitutionTime}'</span>
                              </div>
                              {substitutedFor && (
                                <span className="text-xs text-gray-500">↔️ {getPlayerShortName(substitutedFor)}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">미사용</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* 리스트 뷰 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 홈팀 리스트 */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              {homeTeam.team.logo && (
                <Image
                  src={homeTeam.team.logo}
                  alt={homeTeam.team.name}
                  width={24}
                  height={24}
                />
              )}
              <h4 className="font-bold">{homeTeam.team.name}</h4>
              {homeTeam.formation && (
                <span className="text-sm text-muted-foreground">({homeTeam.formation})</span>
              )}
            </div>
            {homeTeam.startXI?.map((player: any, idx: number) => (
              <PlayerListItem key={idx} player={player} isHome={true} teamColor={homeTeamColor} />
            ))}
            {homeTeam.substitutes && homeTeam.substitutes.length > 0 && (
              <>
                <div className="mt-4 mb-2 text-sm font-semibold text-muted-foreground">교체 선수</div>
                {homeTeam.substitutes.map((player: any, idx: number) => (
                  <PlayerListItem key={idx} player={player} isHome={true} teamColor={homeTeamColor} />
                ))}
              </>
            )}
          </Card>

          {/* 원정팀 리스트 */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              {awayTeam.team.logo && (
                <Image
                  src={awayTeam.team.logo}
                  alt={awayTeam.team.name}
                  width={24}
                  height={24}
                />
              )}
              <h4 className="font-bold">{awayTeam.team.name}</h4>
              {awayTeam.formation && (
                <span className="text-sm text-muted-foreground">({awayTeam.formation})</span>
              )}
            </div>
            {awayTeam.startXI?.map((player: any, idx: number) => (
              <PlayerListItem key={idx} player={player} isHome={false} teamColor={awayTeamColor} />
            ))}
            {awayTeam.substitutes && awayTeam.substitutes.length > 0 && (
              <>
                <div className="mt-4 mb-2 text-sm font-semibold text-muted-foreground">교체 선수</div>
                {awayTeam.substitutes.map((player: any, idx: number) => (
                  <PlayerListItem key={idx} player={player} isHome={false} teamColor={awayTeamColor} />
                ))}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}