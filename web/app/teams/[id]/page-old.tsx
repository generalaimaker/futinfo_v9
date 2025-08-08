'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, Calendar, Users, TrendingUp, 
  Star, StarOff, MapPin, Home, Plane,
  Trophy, Target, AlertCircle, Loader2,
  User, Shirt
} from 'lucide-react'
import { useTeamProfile, useTeamStatistics, useTeamSquad, useTeamNextFixtures, useTeamLastFixtures } from '@/lib/supabase/football'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { cn } from '@/lib/utils'

// 팀 ID와 리그 ID 매핑
const getLeagueIdByTeam = (teamId: number): number => {
  // 프리미어리그 팀들
  const premierLeagueTeams = [33, 40, 50, 49, 42, 47, 48, 45, 39, 35, 34, 51, 55, 66, 65, 44, 38, 71, 1359, 36]
  // 라리가 팀들
  const laLigaTeams = [541, 529, 530, 532, 531, 533, 543, 547, 546, 548, 540, 536, 538, 727, 720, 797, 798, 728, 723, 715]
  // 세리에A 팀들
  const serieATeams = [496, 489, 492, 497, 499, 487, 488, 500, 502, 494, 490, 498, 504, 505, 511, 515, 514, 867, 512, 523]
  // 분데스리가 팀들
  const bundesligaTeams = [157, 165, 173, 168, 169, 172, 167, 163, 164, 170, 159, 161, 162, 160, 166, 176, 188, 192]
  // 리그1 팀들
  const ligue1Teams = [85, 91, 81, 94, 79, 80, 82, 83, 84, 93, 95, 96, 97, 98, 99, 100, 106, 108]
  
  if (premierLeagueTeams.includes(teamId)) return 39
  if (laLigaTeams.includes(teamId)) return 140
  if (serieATeams.includes(teamId)) return 135
  if (bundesligaTeams.includes(teamId)) return 78
  if (ligue1Teams.includes(teamId)) return 61
  
  // 기본값으로 프리미어리그 반환
  return 39
}

export default function TeamPage() {
  const params = useParams()
  const teamId = parseInt(params.id as string)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { data: profileData, isLoading: profileLoading } = useTeamProfile(teamId)
  const currentSeason = new Date().getFullYear()
  const leagueId = getLeagueIdByTeam(teamId)
  const { data: statsData, isLoading: statsLoading } = useTeamStatistics(teamId, currentSeason, leagueId)
  const { data: squadData, isLoading: squadLoading } = useTeamSquad(teamId)
  const { data: nextFixtures, isLoading: nextLoading } = useTeamNextFixtures(teamId, 5)
  const { data: lastFixtures, isLoading: lastLoading } = useTeamLastFixtures(teamId, 5)
  const { preferences, addFavoriteTeam, removeFavoriteTeam } = useUserPreferences()

  const isLoading = profileLoading || statsLoading
  const team = profileData?.team
  const venue = profileData?.venue
  const stats = statsData
  const squad = squadData?.response || []

  const isTeamFavorite = preferences.favoriteTeamIds.includes(teamId)

  const toggleFavorite = async () => {
    if (isTeamFavorite) {
      await removeFavoriteTeam(teamId)
    } else {
      await addFavoriteTeam(teamId)
    }
  }

  // 포지션별로 선수 그룹화
  const playersByPosition = squad.reduce((acc: Record<string, any[]>, player: any) => {
    const position = player.statistics?.[0]?.games?.position || 'Unknown'
    if (!acc[position]) acc[position] = []
    acc[position].push(player)
    return acc
  }, {})

  const positionOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

  if (isLoading) {
    return (
      <div className="min-h-screen lg:ml-64 p-4 lg:p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="dark-card p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">팀을 찾을 수 없습니다</h2>
            <p className="text-muted-foreground mb-4">요청하신 팀 정보를 불러올 수 없습니다.</p>
            <Link href="/teams">
              <Button>팀 목록으로 돌아가기</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Team Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-xl bg-white/10 p-4 flex items-center justify-center">
                <Image
                  src={team.logo}
                  alt={team.name}
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span>{team.country}</span>
                  <span>•</span>
                  <span>창단 {team.founded}</span>
                </div>
                {venue && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{venue.name} ({venue.capacity?.toLocaleString()} 수용)</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={toggleFavorite}
              variant="outline"
              className={cn(
                "gap-2",
                isTeamFavorite && "border-yellow-500 text-yellow-500"
              )}
            >
              {isTeamFavorite ? (
                <>
                  <Star className="w-4 h-4 fill-current" />
                  팔로우 중
                </>
              ) : (
                <>
                  <StarOff className="w-4 h-4" />
                  팔로우
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="squad">스쿼드</TabsTrigger>
            <TabsTrigger value="fixtures">일정</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Form */}
              <Card className="dark-card p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">최근 경기 폼</h3>
                {stats?.form ? (
                  <div className="flex items-center gap-2 mb-6">
                    {stats.form.split('').slice(-10).map((result: string, i: number) => (
                      <div
                        key={i}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                          result === 'W' && "bg-green-500 text-white",
                          result === 'D' && "bg-gray-500 text-white",
                          result === 'L' && "bg-red-500 text-white"
                        )}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">폼 데이터 없음</p>
                )}

                {/* Last Fixtures */}
                <h4 className="font-medium mb-3">최근 경기 결과</h4>
                <div className="space-y-2">
                  {lastLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : lastFixtures?.response?.length > 0 ? (
                    lastFixtures.response.map((fixture: any) => (
                      <Link
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-sm",
                              fixture.teams.home.id === teamId && "font-semibold"
                            )}>
                              {fixture.teams.home.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold">{fixture.goals.home}</span>
                              <span className="text-muted-foreground">-</span>
                              <span className="font-bold">{fixture.goals.away}</span>
                            </div>
                            <span className={cn(
                              "text-sm",
                              fixture.teams.away.id === teamId && "font-semibold"
                            )}>
                              {fixture.teams.away.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(fixture.fixture.date).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">최근 경기 결과가 없습니다</p>
                  )}
                </div>
              </Card>

              {/* Team Info */}
              <div className="space-y-6">
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4">팀 정보</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">창단</span>
                      <span className="font-medium">{team.founded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">국가</span>
                      <span className="font-medium">{team.country}</span>
                    </div>
                    {venue && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">홈구장</span>
                          <span className="font-medium">{venue.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">수용인원</span>
                          <span className="font-medium">{venue.capacity?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">도시</span>
                          <span className="font-medium">{venue.city}</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Current Season Stats */}
                {stats?.league && (
                  <Card className="dark-card p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {stats.league.name} 시즌 통계
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">경기</span>
                        <span className="font-medium">{stats.fixtures.played.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">승/무/패</span>
                        <span className="font-medium">
                          {stats.fixtures.wins.total}/{stats.fixtures.draws.total}/{stats.fixtures.loses.total}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">득점</span>
                        <span className="font-medium">{stats.goals.for.total.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">실점</span>
                        <span className="font-medium">{stats.goals.against.total.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">클린시트</span>
                        <span className="font-medium">{stats.clean_sheet.total}</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Squad Tab */}
          <TabsContent value="squad" className="space-y-6">
            {squadLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="dark-card p-6">
                    <div className="h-64 bg-secondary/50 rounded-lg animate-pulse" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6">
                {positionOrder.map((position) => {
                  const players = playersByPosition[position] || []
                  if (players.length === 0) return null

                  return (
                    <Card key={position} className="dark-card p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-primary" />
                        {position === 'Goalkeeper' && '골키퍼'}
                        {position === 'Defender' && '수비수'}
                        {position === 'Midfielder' && '미드필더'}
                        {position === 'Attacker' && '공격수'}
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {players.map((player: any) => (
                          <Link
                            key={player.player.id}
                            href={`/players/${player.player.id}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                              {player.player.photo ? (
                                <Image
                                  src={player.player.photo}
                                  alt={player.player.name}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{player.player.name}</p>
                              <p className="text-sm text-muted-foreground">
                                #{player.player.number || '-'} • {player.player.age}세
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {player.statistics?.[0]?.games?.appearences || 0} 경기
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {player.statistics?.[0]?.goals?.total || 0} 골
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming Fixtures */}
              <Card className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4">다가오는 경기</h3>
                <div className="space-y-3">
                  {nextLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : nextFixtures?.response?.length > 0 ? (
                    nextFixtures.response.map((fixture: any) => (
                      <Link
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block match-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{fixture.league.name}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fixture.fixture.date).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {fixture.teams.home.id === teamId ? (
                              <Home className="w-4 h-4 text-primary" />
                            ) : (
                              <Plane className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className={cn(
                              "text-sm",
                              fixture.teams.home.id === teamId && "font-semibold"
                            )}>
                              {fixture.teams.home.name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">vs</span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm",
                              fixture.teams.away.id === teamId && "font-semibold"
                            )}>
                              {fixture.teams.away.name}
                            </span>
                            {fixture.teams.away.id === teamId ? (
                              <Home className="w-4 h-4 text-primary" />
                            ) : (
                              <Plane className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <span className="text-sm font-medium">
                            {new Date(fixture.fixture.date).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      예정된 경기가 없습니다
                    </p>
                  )}
                </div>
              </Card>

              {/* Past Results */}
              <Card className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4">최근 결과</h3>
                <div className="space-y-3">
                  {lastLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : lastFixtures?.response?.length > 0 ? (
                    lastFixtures.response.map((fixture: any) => {
                      const isHome = fixture.teams.home.id === teamId
                      const teamGoals = isHome ? fixture.goals.home : fixture.goals.away
                      const opponentGoals = isHome ? fixture.goals.away : fixture.goals.home
                      const isWin = teamGoals > opponentGoals
                      const isDraw = teamGoals === opponentGoals
                      
                      return (
                        <Link
                          key={fixture.fixture.id}
                          href={`/fixtures/${fixture.fixture.id}`}
                          className="block match-card"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{fixture.league.name}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(fixture.fixture.date).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isHome ? (
                                <Home className="w-4 h-4 text-primary" />
                              ) : (
                                <Plane className="w-4 h-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">
                                vs {isHome ? fixture.teams.away.name : fixture.teams.home.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-lg font-bold",
                                isWin && "text-green-500",
                                isDraw && "text-gray-500",
                                !isWin && !isDraw && "text-red-500"
                              )}>
                                {teamGoals} - {opponentGoals}
                              </span>
                              <Badge className={cn(
                                isWin && "bg-green-500",
                                isDraw && "bg-gray-500",
                                !isWin && !isDraw && "bg-red-500"
                              )}>
                                {isWin ? 'W' : isDraw ? 'D' : 'L'}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      최근 경기 결과가 없습니다
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            {stats ? (
              <div className="grid gap-6">
                {/* Goals Stats */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    골 통계
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <p className="text-3xl font-bold">{stats.goals.for.total.total}</p>
                      <p className="text-sm text-muted-foreground">총 득점</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <p className="text-3xl font-bold">{stats.goals.against.total.total}</p>
                      <p className="text-sm text-muted-foreground">총 실점</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <p className="text-3xl font-bold">
                        {parseFloat(stats.goals.for.average.total || "0").toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">평균 득점</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/50">
                      <p className="text-3xl font-bold">
                        {parseFloat(stats.goals.against.average.total || "0").toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">평균 실점</p>
                    </div>
                  </div>
                </Card>

                {/* Match Stats */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    경기 통계
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">홈 경기</span>
                        <span className="text-sm">
                          {stats.fixtures.wins.home}승 {stats.fixtures.draws.home}무 {stats.fixtures.loses.home}패
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${(stats.fixtures.wins.home / stats.fixtures.played.home) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">원정 경기</span>
                        <span className="text-sm">
                          {stats.fixtures.wins.away}승 {stats.fixtures.draws.away}무 {stats.fixtures.loses.away}패
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(stats.fixtures.wins.away / stats.fixtures.played.away) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="dark-card p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">통계 데이터가 없습니다</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}