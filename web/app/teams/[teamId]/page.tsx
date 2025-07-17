'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Building,
  Heart,
  Share2,
  ChevronLeft,
  Clock,
  Target,
  Shield,
  AlertCircle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import footballAPIService from '@/lib/supabase/football'
import { formatDate, getStatusDisplay, isLiveMatch, isFinishedMatch } from '@/lib/types/football'
import { TeamProfile, TeamStatistics } from '@/lib/types/team'
import { useSupabase } from '@/lib/supabase/provider'
import { useToast } from '@/components/ui/use-toast'
import { useFavorites } from '@/lib/services/favorites'
import { cn } from '@/lib/utils'

export default function TeamProfilePage() {
  const params = useParams()
  const teamId = Number(params.teamId)
  const { user } = useSupabase()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const { addTeam, removeTeam, isTeamFavorite } = useFavorites()

  // 팀 프로필 데이터
  const { data: teamProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['teamProfile', teamId],
    queryFn: () => footballAPIService.getTeamProfile(teamId),
    enabled: !!teamId
  })

  // 팀 통계 데이터 (현재 시즌)
  const currentSeason = new Date().getFullYear()
  const { data: teamStats, isLoading: statsLoading } = useQuery({
    queryKey: ['teamStats', teamId, currentSeason],
    queryFn: () => footballAPIService.getTeamStatistics(teamId, currentSeason, 39), // Premier League 예시
    enabled: !!teamId && !!teamProfile
  })

  // 팀 스쿼드
  const { data: squadData, isLoading: squadLoading } = useQuery({
    queryKey: ['teamSquad', teamId],
    queryFn: () => footballAPIService.getTeamSquad({ team: teamId }),
    enabled: !!teamId
  })

  // 최근 경기
  const { data: recentFixtures } = useQuery({
    queryKey: ['teamRecentFixtures', teamId],
    queryFn: () => footballAPIService.getTeamLastFixtures(teamId, 5),
    enabled: !!teamId
  })

  // 다음 경기
  const { data: nextFixtures } = useQuery({
    queryKey: ['teamNextFixtures', teamId],
    queryFn: () => footballAPIService.getTeamNextFixtures(teamId, 5),
    enabled: !!teamId
  })

  // 이적 정보
  const { data: transfers } = useQuery({
    queryKey: ['teamTransfers', teamId],
    queryFn: () => footballAPIService.getTransfers({ team: teamId }),
    enabled: !!teamId
  })

  // 즐겨찾기 토글
  const handleFavoriteToggle = async () => {
    if (!teamProfile) return
    
    const isFavorite = isTeamFavorite(teamId)
    
    if (isFavorite) {
      removeTeam(teamId)
      toast({
        title: "즐겨찾기 제거됨",
        description: `${teamProfile.team.name}이(가) 즐겨찾기에서 제거되었습니다.`
      })
    } else {
      addTeam({
        id: teamId,
        name: teamProfile.team.name,
        logo: teamProfile.team.logo
      })
      toast({
        title: "즐겨찾기 추가됨",
        description: `${teamProfile.team.name}이(가) 즐겨찾기에 추가되었습니다.`
      })
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  if (!teamProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">팀을 찾을 수 없습니다</h3>
              <p className="text-gray-600 mb-4">요청하신 팀 정보를 찾을 수 없습니다.</p>
              <Link href="/teams">
                <Button>팀 목록으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { team, venue } = teamProfile

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/teams">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  팀 목록
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold">팀 프로필</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleFavoriteToggle}
                className={isTeamFavorite(teamId) ? "text-red-500" : ""}
              >
                <Heart 
                  className={cn(
                    "h-5 w-5",
                    isTeamFavorite(teamId) && "fill-current"
                  )} 
                />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 팀 정보 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-6">
            <Image
              src={team.logo}
              alt={team.name}
              width={120}
              height={120}
              className="object-contain"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{team.country}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>창단: {team.founded}년</span>
                </div>
                {venue && (
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{venue.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="squad">스쿼드</TabsTrigger>
            <TabsTrigger value="fixtures">경기</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="transfers">이적</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 경기장 정보 */}
              {venue && (
                <Card>
                  <CardHeader>
                    <CardTitle>경기장 정보</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {venue.image && (
                        <Image
                          src={venue.image}
                          alt={venue.name}
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">이름</span>
                          <span className="font-medium">{venue.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">위치</span>
                          <span className="font-medium">{venue.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">수용인원</span>
                          <span className="font-medium">{venue.capacity?.toLocaleString()}명</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">잔디</span>
                          <span className="font-medium">{venue.surface}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 최근 폼 */}
              {teamStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>최근 폼</CardTitle>
                    <CardDescription>최근 5경기 결과</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      {teamStats.form?.split('').map((result, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            result === 'W' ? 'bg-green-500' :
                            result === 'D' ? 'bg-gray-500' :
                            'bg-red-500'
                          }`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">승</span>
                        <span className="font-medium">{teamStats.fixtures?.wins.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">무</span>
                        <span className="font-medium">{teamStats.fixtures?.draws.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">패</span>
                        <span className="font-medium">{teamStats.fixtures?.loses.total || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 다음 경기 */}
            {nextFixtures && nextFixtures.response.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>다음 경기</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nextFixtures.response.slice(0, 3).map((fixture) => {
                      const fixtureDate = new Date(fixture.fixture.date)
                      const isHome = fixture.teams.home.id === teamId

                      return (
                        <Link
                          key={fixture.fixture.id}
                          href={`/fixtures/${fixture.fixture.id}`}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <Image
                              src={isHome ? fixture.teams.away.logo : fixture.teams.home.logo}
                              alt={isHome ? fixture.teams.away.name : fixture.teams.home.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                            <div>
                              <div className="font-medium">
                                {isHome ? 'vs' : '@'} {isHome ? fixture.teams.away.name : fixture.teams.home.name}
                              </div>
                              <div className="text-xs text-gray-500">{fixture.league.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">{fixtureDate.toLocaleDateString('ko-KR')}</div>
                            <div className="text-xs text-gray-500">
                              {fixtureDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 스쿼드 탭 */}
          <TabsContent value="squad" className="space-y-6">
            {squadLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : squadData && squadData.response.length > 0 ? (
              <div className="grid gap-4">
                {['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'].map((position) => {
                  const players = squadData.response[0].players.filter(p => p.position === position)
                  if (players.length === 0) return null

                  return (
                    <Card key={position}>
                      <CardHeader>
                        <CardTitle className="text-lg">{position}s</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {players.map((player) => (
                            <Link
                              key={player.id}
                              href={`/players/${player.id}`}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <Image
                                src={player.photo}
                                alt={player.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{player.name}</div>
                                <div className="text-xs text-gray-500">
                                  {player.age}세 · {player.number ? `#${player.number}` : '번호 없음'}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  스쿼드 정보가 없습니다
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 경기 탭 */}
          <TabsContent value="fixtures" className="space-y-6">
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">최근 경기</TabsTrigger>
                <TabsTrigger value="upcoming">예정된 경기</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-3">
                {recentFixtures && recentFixtures.response.length > 0 ? (
                  recentFixtures.response.map((fixture) => {
                    const isHome = fixture.teams.home.id === teamId
                    const teamScore = isHome ? fixture.goals?.home : fixture.goals?.away
                    const opponentScore = isHome ? fixture.goals?.away : fixture.goals?.home
                    const opponent = isHome ? fixture.teams.away : fixture.teams.home
                    const result = (teamScore ?? 0) > (opponentScore ?? 0) ? 'W' : (teamScore ?? 0) < (opponentScore ?? 0) ? 'L' : 'D'

                    return (
                      <Link
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block"
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  result === 'W' ? 'bg-green-500' :
                                  result === 'D' ? 'bg-gray-500' :
                                  'bg-red-500'
                                }`}>
                                  {result}
                                </div>
                                <Image
                                  src={opponent.logo}
                                  alt={opponent.name}
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                />
                                <div>
                                  <div className="font-medium">
                                    {isHome ? 'vs' : '@'} {opponent.name}
                                  </div>
                                  <div className="text-xs text-gray-500">{fixture.league.name}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {teamScore} - {opponentScore}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(fixture.fixture.date).toLocaleDateString('ko-KR')}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      최근 경기가 없습니다
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-3">
                {nextFixtures && nextFixtures.response.length > 0 ? (
                  nextFixtures.response.map((fixture) => {
                    const isHome = fixture.teams.home.id === teamId
                    const opponent = isHome ? fixture.teams.away : fixture.teams.home
                    const fixtureDate = new Date(fixture.fixture.date)

                    return (
                      <Link
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block"
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Image
                                  src={opponent.logo}
                                  alt={opponent.name}
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                />
                                <div>
                                  <div className="font-medium">
                                    {isHome ? 'vs' : '@'} {opponent.name}
                                  </div>
                                  <div className="text-xs text-gray-500">{fixture.league.name}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">{fixtureDate.toLocaleDateString('ko-KR')}</div>
                                <div className="text-xs text-gray-500">
                                  {fixtureDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      예정된 경기가 없습니다
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* 통계 탭 */}
          <TabsContent value="stats" className="space-y-6">
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : teamStats ? (
              <div className="grid gap-6">
                {/* 득점 통계 */}
                <Card>
                  <CardHeader>
                    <CardTitle>득점 통계</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">득점</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">총 득점</span>
                            <span className="font-medium">{teamStats.goals?.for.total.total || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">홈 득점</span>
                            <span className="font-medium">{teamStats.goals?.for.total.home || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">원정 득점</span>
                            <span className="font-medium">{teamStats.goals?.for.total.away || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">실점</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">총 실점</span>
                            <span className="font-medium">{teamStats.goals?.against.total.total || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">홈 실점</span>
                            <span className="font-medium">{teamStats.goals?.against.total.home || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">원정 실점</span>
                            <span className="font-medium">{teamStats.goals?.against.total.away || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 클린시트 & 무득점 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">클린시트</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">총 클린시트</span>
                          <span className="font-medium">{teamStats.clean_sheet?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">홈</span>
                          <span className="font-medium">{teamStats.clean_sheet?.home || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">원정</span>
                          <span className="font-medium">{teamStats.clean_sheet?.away || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">무득점 경기</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">총 무득점</span>
                          <span className="font-medium">{teamStats.failed_to_score?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">홈</span>
                          <span className="font-medium">{teamStats.failed_to_score?.home || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">원정</span>
                          <span className="font-medium">{teamStats.failed_to_score?.away || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  통계 정보가 없습니다
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 이적 탭 */}
          <TabsContent value="transfers" className="space-y-6">
            {transfers && transfers.response.length > 0 ? (
              <div className="space-y-6">
                {transfers.response[0].transfers.map((transfer, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">이적일</div>
                            <div className="font-medium">{new Date(transfer.date).toLocaleDateString('ko-KR')}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="font-medium">{transfer.teams.out.name}</div>
                              <div className="text-xs text-gray-500">출발</div>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div>
                              <div className="font-medium">{transfer.teams.in.name}</div>
                              <div className="text-xs text-gray-500">도착</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={transfer.type === 'Free' ? 'secondary' : 'default'}>
                            {transfer.type}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  이적 정보가 없습니다
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}