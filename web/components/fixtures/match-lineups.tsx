import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, User, ArrowUpDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatchLineupsProps {
  fixture: any // TODO: Add proper type
}

export default function MatchLineups({ fixture }: MatchLineupsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home')
  
  if (!fixture.lineups || fixture.lineups.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        라인업 정보가 아직 없습니다.
      </div>
    )
  }
  
  const homeLineup = fixture.lineups[0]
  const awayLineup = fixture.lineups[1]
  const currentLineup = activeTeam === 'home' ? homeLineup : awayLineup
  
  // 포메이션을 그리드로 변환
  const getFormationGrid = (formation: string) => {
    const parts = formation.split('-').map(Number)
    const grid: number[][] = []
    
    // 골키퍼
    grid.push([1])
    
    // 나머지 라인
    parts.forEach(count => {
      grid.push(Array(count).fill(0))
    })
    
    return grid
  }
  
  // 선수 통계 가져오기
  const getPlayerStats = (playerId: number) => {
    if (!fixture.players) return null
    
    const teamPlayers = fixture.players.find((team: any) => 
      team.team.id === (activeTeam === 'home' ? fixture.teams.home.id : fixture.teams.away.id)
    )
    
    if (!teamPlayers) return null
    
    return teamPlayers.players.find((p: any) => p.player.id === playerId)
  }
  
  // 포지션별 선수 배치
  const getPlayerByPosition = (gridIndex: number, posIndex: number) => {
    let playerIndex = 0
    
    for (let i = 0; i < gridIndex; i++) {
      const grid = getFormationGrid(currentLineup.formation)
      playerIndex += grid[i].length
    }
    
    playerIndex += posIndex
    
    return currentLineup.startXI[playerIndex]
  }
  
  const formationGrid = getFormationGrid(currentLineup.formation)
  
  return (
    <div className="space-y-6">
      {/* 팀 선택 탭 */}
      <div className="flex rounded-lg overflow-hidden border">
        <button
          onClick={() => setActiveTeam('home')}
          className={cn(
            "flex-1 py-3 font-medium transition-colors",
            activeTeam === 'home' 
              ? "bg-blue-500 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <Image
              src={fixture.teams.home.logo}
              alt={fixture.teams.home.name}
              width={20}
              height={20}
              className="object-contain"
            />
            <span>{fixture.teams.home.name}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTeam('away')}
          className={cn(
            "flex-1 py-3 font-medium transition-colors",
            activeTeam === 'away' 
              ? "bg-red-500 text-white" 
              : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <Image
              src={fixture.teams.away.logo}
              alt={fixture.teams.away.name}
              width={20}
              height={20}
              className="object-contain"
            />
            <span>{fixture.teams.away.name}</span>
          </div>
        </button>
      </div>
      
      {/* 포메이션 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              포메이션: {currentLineup.formation}
            </div>
            <div className="text-sm font-normal text-gray-600">
              감독: {currentLineup.coach?.name || '정보 없음'}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 축구장 뷰 */}
          <div className={cn(
            "relative bg-gradient-to-b from-green-400 to-green-600 rounded-lg p-4 mb-6",
            "min-h-[400px]",
            activeTeam === 'away' && "rotate-180"
          )}>
            {/* 필드 라인 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-white/30" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-white/30 border-t-0 rounded-b-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-white/30 border-b-0 rounded-t-full" />
            
            {/* 선수 배치 */}
            <div className="relative h-full flex flex-col justify-between py-8">
              {formationGrid.map((line, gridIndex) => (
                <div key={gridIndex} className="flex justify-around">
                  {line.map((_, posIndex) => {
                    const player = getPlayerByPosition(gridIndex, posIndex)
                    if (!player) return null
                    
                    const playerStats = getPlayerStats(player.player.id)
                    const rating = playerStats?.statistics?.[0]?.games?.rating
                    
                    return (
                      <button
                        key={posIndex}
                        onClick={() => setSelectedPlayer(player)}
                        className={cn(
                          "relative group",
                          activeTeam === 'away' && "rotate-180"
                        )}
                      >
                        {/* 선수 아이콘 */}
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          "bg-white shadow-lg group-hover:scale-110 transition-transform",
                          "border-2",
                          activeTeam === 'home' ? "border-blue-500" : "border-red-500"
                        )}>
                          <span className="font-bold text-sm">
                            {player.player.number}
                          </span>
                        </div>
                        
                        {/* 선수 이름 */}
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {player.player.name}
                            {rating && (
                              <span className="ml-1 text-yellow-400">
                                {rating}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* 주장 표시 */}
                        {playerStats?.statistics?.[0]?.games?.captain && (
                          <div className="absolute -top-2 -right-2">
                            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">C</span>
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* 교체 선수 */}
          <div className="mt-6">
            <h4 className="font-medium mb-3 flex items-center">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              교체 선수
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {currentLineup.substitutes.map((sub: any) => {
                const playerStats = getPlayerStats(sub.player.id)
                
                return (
                  <button
                    key={sub.player.id}
                    onClick={() => setSelectedPlayer(sub)}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {sub.player.number}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{sub.player.name}</div>
                      <div className="text-xs text-gray-600">{sub.player.pos}</div>
                    </div>
                    {playerStats?.statistics?.[0]?.games?.minutes && (
                      <div className="text-xs text-gray-500">
                        {playerStats.statistics[0].games.minutes}'
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 선수 상세 정보 모달 */}
      {selectedPlayer && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                선수 정보
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {selectedPlayer.player.number}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{selectedPlayer.player.name}</h3>
                <p className="text-gray-600">{selectedPlayer.player.pos}</p>
                
                {/* 선수 통계 */}
                {(() => {
                  const stats = getPlayerStats(selectedPlayer.player.id)
                  if (!stats?.statistics?.[0]) return null
                  
                  const gameStats = stats.statistics[0]
                  
                  return (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {gameStats.games?.rating && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">평점</span>
                          <span className="font-medium flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow-500" />
                            {gameStats.games.rating}
                          </span>
                        </div>
                      )}
                      {gameStats.games?.minutes && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">출전 시간</span>
                          <span className="font-medium">{gameStats.games.minutes}'</span>
                        </div>
                      )}
                      {gameStats.goals?.total !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">득점</span>
                          <span className="font-medium">{gameStats.goals.total}</span>
                        </div>
                      )}
                      {gameStats.goals?.assists !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">도움</span>
                          <span className="font-medium">{gameStats.goals.assists}</span>
                        </div>
                      )}
                      {gameStats.passes?.total && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">패스</span>
                          <span className="font-medium">
                            {gameStats.passes.total} ({gameStats.passes.accuracy}%)
                          </span>
                        </div>
                      )}
                      {gameStats.cards?.yellow !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">경고</span>
                          <span className="font-medium">{gameStats.cards.yellow}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}