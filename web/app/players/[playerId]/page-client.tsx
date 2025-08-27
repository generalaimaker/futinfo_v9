'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, User, Activity, Users, Clock, AlertTriangle, ChevronDown, ChevronUp, TrendingUp, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

// Client component that receives data as props
export default function PlayerProfilePage({ 
  playerData,
  allSeasons,
  transfers,
  injuries,
  careerTotals
}: any) {
  const [expandedSeasons, setExpandedSeasons] = useState<Record<string, boolean>>({
    '25-26': true,
    '24-25': true
  })

  const toggleSeason = (season: string) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [season]: !prev[season]
    }))
  }

  if (!playerData) {
    return <div>선수 정보를 찾을 수 없습니다.</div>
  }

  const { player, statistics } = playerData

  // Get main statistics (most appearances)
  const currentStat = statistics?.reduce((prev: any, current: any) => 
    (current.games.appearences > prev.games.appearences) ? current : prev
  , statistics?.[0])

  return (
    <div className="min-h-screen lg:ml-64 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link 
          href="/fixtures"
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-black transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>경기 일정으로</span>
        </Link>
        
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Player image */}
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-1">
                <img 
                  src={player.photo} 
                  alt={player.name}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              {currentStat?.team && (
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white shadow-lg p-1">
                  <img 
                    src={currentStat.team.logo} 
                    alt={currentStat.team.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
            
            {/* Player info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                {player.firstname && player.lastname ? `${player.firstname} ${player.lastname}` : player.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {player.nationality}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {player.age}세 ({player.birth?.date})
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {player.height} · {player.weight}
                </span>
              </div>
              
              {currentStat && (
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <Badge className="bg-black text-white px-4 py-1.5">
                    {currentStat.team.name}
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-1.5">
                    {currentStat.games.position}
                  </Badge>
                  <Badge variant="outline" className="px-4 py-1.5">
                    #{currentStat.games.number || '-'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Career Stats */}
            <div className="ios-card p-6 backdrop-blur-xl bg-white/80 min-w-[200px]">
              <h3 className="font-semibold text-sm text-gray-600 mb-3">커리어 통계</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">총 출전</span>
                  <span className="font-bold">{careerTotals.appearances}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">총 득점</span>
                  <span className="font-bold text-green-600">{careerTotals.goals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">총 도움</span>
                  <span className="font-bold text-blue-600">{careerTotals.assists}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">경고/퇴장</span>
                  <span className="font-medium">
                    <span className="text-yellow-600">{careerTotals.yellowCards}</span>
                    {' / '}
                    <span className="text-red-600">{careerTotals.redCards}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Season by Season Performance */}
        <div className="space-y-4">
          {allSeasons.map(({ data, season }: any) => {
            if (!data?.statistics || data.statistics.length === 0) return null
            
            const isExpanded = expandedSeasons[season]
            const seasonTotals = {
              appearances: data.statistics.reduce((sum: number, s: any) => sum + (s.games.appearences || 0), 0),
              goals: data.statistics.reduce((sum: number, s: any) => sum + (s.goals.total || 0), 0),
              assists: data.statistics.reduce((sum: number, s: any) => sum + (s.goals.assists || 0), 0),
            }
            
            return (
              <Card key={season} className="backdrop-blur-xl bg-white/80 border-0 shadow-lg overflow-hidden">
                <button
                  onClick={() => toggleSeason(season)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">{season} 시즌</h2>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600">
                        출전 <span className="font-bold text-black">{seasonTotals.appearances}</span>
                      </span>
                      <span className="text-gray-600">
                        골 <span className="font-bold text-green-600">{seasonTotals.goals}</span>
                      </span>
                      <span className="text-gray-600">
                        도움 <span className="font-bold text-blue-600">{seasonTotals.assists}</span>
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <Separator className="mb-4" />
                    <div className="space-y-3">
                      {data.statistics.map((stat: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <img 
                              src={stat.league.logo} 
                              alt={stat.league.name}
                              className="w-10 h-10 object-contain"
                            />
                            <div>
                              <div className="font-medium">{stat.league.name}</div>
                              <div className="text-sm text-gray-500">{stat.team.name}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[50px]">
                              <div className="text-xs text-gray-500">출전</div>
                              <div className="font-bold">{stat.games.appearences}</div>
                              <div className="text-xs text-gray-400">({stat.games.lineups}선발)</div>
                            </div>
                            <div className="text-center min-w-[40px]">
                              <div className="text-xs text-gray-500">골</div>
                              <div className="font-bold text-green-600">{stat.goals.total}</div>
                            </div>
                            <div className="text-center min-w-[40px]">
                              <div className="text-xs text-gray-500">도움</div>
                              <div className="font-bold text-blue-600">{stat.goals.assists || 0}</div>
                            </div>
                            <div className="text-center min-w-[50px]">
                              <div className="text-xs text-gray-500">출전시간</div>
                              <div className="font-bold">{stat.games.minutes}'</div>
                            </div>
                            <div className="text-center min-w-[40px]">
                              <div className="text-xs text-gray-500">평점</div>
                              <div className="font-bold text-purple-600">{stat.games.rating ? parseFloat(stat.games.rating).toFixed(1) : '-'}</div>
                            </div>
                            {stat.cards && (stat.cards.yellow > 0 || stat.cards.red > 0) && (
                              <div className="text-center min-w-[40px]">
                                <div className="text-xs text-gray-500">카드</div>
                                <div className="flex items-center gap-1 justify-center">
                                  {stat.cards.yellow > 0 && <span className="text-yellow-500 font-bold">{stat.cards.yellow}</span>}
                                  {stat.cards.red > 0 && <span className="text-red-500 font-bold">{stat.cards.red}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}

          {/* Detailed Performance Stats for Current Season */}
          {playerData?.statistics && playerData.statistics.length > 0 && (
            <Card className="backdrop-blur-xl bg-white/80 border-0 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h2 className="text-xl font-bold">시즌 상세 기록</h2>
                <span className="text-sm text-gray-500">(전체 대회 합산)</span>
              </div>
              
              {(() => {
                // Calculate aggregated stats
                const aggregated = {
                  shots: { total: 0, on: 0 },
                  passes: { total: 0, key: 0, accuracy: 0 },
                  dribbles: { attempts: 0, success: 0 },
                  duels: { total: 0, won: 0 },
                  fouls: { drawn: 0, committed: 0 },
                  penalties: { won: 0, scored: 0, missed: 0 }
                }
                
                let accuracyCount = 0
                playerData.statistics.forEach((stat: any) => {
                  aggregated.shots.total += stat.shots?.total || 0
                  aggregated.shots.on += stat.shots?.on || 0
                  aggregated.passes.total += stat.passes?.total || 0
                  aggregated.passes.key += stat.passes?.key || 0
                  if (stat.passes?.accuracy) {
                    aggregated.passes.accuracy += parseInt(stat.passes.accuracy)
                    accuracyCount++
                  }
                  aggregated.dribbles.attempts += stat.dribbles?.attempts || 0
                  aggregated.dribbles.success += stat.dribbles?.success || 0
                  aggregated.duels.total += stat.duels?.total || 0
                  aggregated.duels.won += stat.duels?.won || 0
                  aggregated.fouls.drawn += stat.fouls?.drawn || 0
                  aggregated.fouls.committed += stat.fouls?.committed || 0
                  aggregated.penalties.won += stat.penalty?.won || 0
                  aggregated.penalties.scored += stat.penalty?.scored || 0
                  aggregated.penalties.missed += stat.penalty?.missed || 0
                })
                
                if (accuracyCount > 0) {
                  aggregated.passes.accuracy = Math.round(aggregated.passes.accuracy / accuracyCount)
                }
                
                const shootingAccuracy = aggregated.shots.total > 0 
                  ? Math.round((aggregated.shots.on / aggregated.shots.total) * 100) 
                  : 0
                const dribbleSuccess = aggregated.dribbles.attempts > 0
                  ? Math.round((aggregated.dribbles.success / aggregated.dribbles.attempts) * 100)
                  : 0
                const duelSuccess = aggregated.duels.total > 0
                  ? Math.round((aggregated.duels.won / aggregated.duels.total) * 100)
                  : 0
                
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Shooting */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <h3 className="font-semibold text-sm">슈팅</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">총 슈팅</span>
                          <span className="font-bold">{aggregated.shots.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">유효 슈팅</span>
                          <span className="font-bold text-green-600">{aggregated.shots.on}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">정확도</span>
                          <span className="font-bold">{shootingAccuracy}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Passing */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-sm">패스</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">총 패스</span>
                          <span className="font-bold">{aggregated.passes.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">키 패스</span>
                          <span className="font-bold text-blue-600">{aggregated.passes.key}</span>
                        </div>
                        {aggregated.passes.accuracy > 0 && (
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">정확도</span>
                            <span className="font-bold">{aggregated.passes.accuracy}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Dribbles */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <h3 className="font-semibold text-sm">드리블</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">시도</span>
                          <span className="font-bold">{aggregated.dribbles.attempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">성공</span>
                          <span className="font-bold text-purple-600">{aggregated.dribbles.success}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">성공률</span>
                          <span className="font-bold">{dribbleSuccess}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Duels & Fouls */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        <h3 className="font-semibold text-sm">경합</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">경합 승리</span>
                          <span className="font-bold">{aggregated.duels.won}/{aggregated.duels.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">승률</span>
                          <span className="font-bold text-orange-600">{duelSuccess}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">파울 유도</span>
                          <span className="font-bold">{aggregated.fouls.drawn}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Penalties if any */}
                    {(aggregated.penalties.won > 0 || aggregated.penalties.scored > 0 || aggregated.penalties.missed > 0) && (
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl col-span-2 md:col-span-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-red-600" />
                          <h3 className="font-semibold text-sm">페널티</h3>
                        </div>
                        <div className="flex gap-6">
                          <div className="flex gap-2">
                            <span className="text-xs text-gray-600">획득:</span>
                            <span className="font-bold">{aggregated.penalties.won}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs text-gray-600">성공:</span>
                            <span className="font-bold text-green-600">{aggregated.penalties.scored}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs text-gray-600">실패:</span>
                            <span className="font-bold text-red-600">{aggregated.penalties.missed}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </Card>
          )}

          {/* Transfers */}
          {transfers?.transfers && transfers.transfers.length > 0 && (
            <Card className="backdrop-blur-xl bg-white/80 border-0 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold">이적 기록</h2>
              </div>
              <div className="space-y-3">
                {transfers.transfers.slice(0, 5).map((transfer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={transfer.teams.out.logo} 
                        alt={transfer.teams.out.name}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="text-sm">{transfer.teams.out.name}</span>
                      <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                      <img 
                        src={transfer.teams.in.logo} 
                        alt={transfer.teams.in.name}
                        className="w-8 h-8 object-contain"
                      />
                      <span className="text-sm font-medium">{transfer.teams.in.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">{transfer.type || 'Transfer'}</div>
                      <div className="text-xs text-gray-500">{transfer.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Injuries */}
          {injuries && injuries.length > 0 && (
            <Card className="backdrop-blur-xl bg-white/80 border-0 shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-bold">최근 부상 기록</h2>
              </div>
              <div className="space-y-2">
                {injuries.slice(0, 5).map((injury: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="text-sm font-medium">{injury.player.reason}</div>
                        <div className="text-xs text-gray-500">{injury.team.name} · {injury.league.name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(injury.fixture.date).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}