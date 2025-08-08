'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Shield, Calendar, Users, TrendingUp, 
  Star, StarOff, MapPin, Home, Plane,
  Trophy, Target, AlertCircle, Loader2,
  User, Shirt, MessageSquare, BarChart3,
  Clock, Share2, Heart, Eye, Pin,
  TrendingDown, Activity, Award
} from 'lucide-react'
import { useTeamProfile, useTeamStatistics, useTeamSquad, useTeamNextFixtures, useTeamLastFixtures, useStandings, useTeamTransfers } from '@/lib/supabase/football'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { teamCommunityService, TeamPost } from '@/lib/supabase/teams'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCategory, setNewPostCategory] = useState<TeamPost['category']>('general')
  const [transferFilter, setTransferFilter] = useState<'in' | 'out'>('in')
  
  const { data: profileData, isLoading: profileLoading } = useTeamProfile(teamId)
  const [selectedSeason, setSelectedSeason] = useState(2024) // 2024 시즌을 기본값으로
  const leagueId = getLeagueIdByTeam(teamId)
  const { data: statsData, isLoading: statsLoading } = useTeamStatistics(teamId, selectedSeason, leagueId)
  const { data: squadData, isLoading: squadLoading } = useTeamSquad(teamId)
  const { data: nextFixtures, isLoading: nextLoading } = useTeamNextFixtures(teamId, 5)
  const { data: lastFixtures, isLoading: lastLoading } = useTeamLastFixtures(teamId, 5)
  const { data: standingsData } = useStandings({ league: leagueId, season: selectedSeason })
  const { preferences, addFavoriteTeam, removeFavoriteTeam } = useUserPreferences()
  const { data: transfersData, isLoading: transfersLoading, error: transfersError } = useTeamTransfers(teamId)

  // 커뮤니티 데이터
  const { data: teamPosts, isLoading: postsLoading, error: postsError } = useQuery({
    queryKey: ['teamPosts', teamId, selectedCategory],
    queryFn: async () => {
      console.log('[TeamProfile] Fetching posts for team:', teamId, 'category:', selectedCategory);
      const result = await teamCommunityService.getTeamPosts(
        teamId, 
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      console.log('[TeamProfile] Posts result:', result);
      return result;
    },
    enabled: activeTab === 'community' && !!teamId
  })
  
  // React Query v5에서는 useEffect로 에러와 성공 처리
  useEffect(() => {
    if (postsError) {
      console.error('[TeamPage] Error fetching posts:', postsError)
    }
  }, [postsError])
  
  useEffect(() => {
    if (teamPosts) {
      console.log('[TeamPage] Posts fetched:', teamPosts)
    }
  }, [teamPosts])

  // 게시글 작성 mutation
  const createPostMutation = useMutation({
    mutationFn: (data: { title: string; content: string; category: TeamPost['category'] }) => 
      teamCommunityService.createPost({ ...data, team_id: teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamPosts', teamId] })
      setNewPostTitle('')
      setNewPostContent('')
    }
  })

  const isLoading = profileLoading || statsLoading
  const team = profileData?.team
  const venue = profileData?.venue
  const stats = statsData
  
  // 스쿼드 데이터 디버깅
  console.log('[TeamPage] squadData:', squadData)
  console.log('[TeamPage] squadData structure:', {
    hasResponse: !!squadData?.response,
    responseType: Array.isArray(squadData?.response) ? 'array' : typeof squadData?.response,
    responseLength: squadData?.response?.length,
    firstItem: squadData?.response?.[0],
    hasPlayers: !!squadData?.response?.[0]?.players,
    playersLength: squadData?.response?.[0]?.players?.length
  })
  
  // API 응답 구조에 따라 스쿼드 데이터 추출
  let squad = []
  if (squadData?.response && squadData.response[0]?.players && Array.isArray(squadData.response[0].players)) {
    // response[0].players가 있는 경우 (가장 일반적인 경우)
    squad = squadData.response[0].players
  } else if (squadData?.response && squadData.response.players && Array.isArray(squadData.response.players)) {
    // response.players가 배열인 경우
    squad = squadData.response.players
  } else if (squadData?.response && Array.isArray(squadData.response)) {
    // response가 배열인 경우
    squad = squadData.response
  } else if (squadData && Array.isArray(squadData)) {
    // squadData 자체가 배열인 경우
    squad = squadData
  }
  
  console.log('[TeamPage] Extracted squad:', squad?.length, 'players')
  if (squad?.length > 0) {
    console.log('[TeamPage] First player structure:', squad[0])
    console.log('[TeamPage] Player data fields:', {
      player: squad[0]?.player,
      statistics: squad[0]?.statistics,
      directFields: Object.keys(squad[0] || {})
    })
    // 시장 가치와 주장 정보 찾기
    squad.slice(0, 3).forEach((player: any, idx: number) => {
      const playerData = player.player || player
      console.log(`[TeamPage] Player ${idx}:`, {
        name: playerData.name || playerData.player_name,
        captain: playerData.captain,
        market_value: playerData.market_value,
        marketValue: playerData.marketValue,
        value: playerData.value,
        statistics: player.statistics?.[0]
      })
    })
  }
  
  // 리그 순위에서 팀의 현재 순위 찾기
  const teamStanding = standingsData?.response?.[0]?.league?.standings?.[0]?.find(
    (standing: any) => standing.team.id === teamId
  )


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
    // 포지션 정보가 여러 위치에 있을 수 있음
    const position = player.statistics?.[0]?.games?.position || 
                    player.position ||
                    player.player?.position ||
                    'Unknown'
    console.log(`[TeamPage] Player ${player.player?.name || player.name} position: ${position}`)
    if (!acc[position]) acc[position] = []
    acc[position].push(player)
    return acc
  }, {})
  
  console.log('[TeamPage] Players by position:', Object.keys(playersByPosition))

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
        {/* Enhanced Team Header */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm p-4 flex items-center justify-center shadow-xl">
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={100}
                    height={100}
                    className="object-contain drop-shadow-lg"
                    priority
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <h1 className="text-4xl font-bold mb-1">{team.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{team.country}</span>
                      <span>•</span>
                      <span>창단 {team.founded}</span>
                      {teamStanding && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="gap-1">
                            <Trophy className="w-3 h-3" />
                            {teamStanding.rank}위
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {venue && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{venue.name}</span>
                      <span className="text-muted-foreground">({venue.capacity?.toLocaleString()} 수용)</span>
                    </div>
                  )}
                  {stats?.form && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">최근 폼:</span>
                      <div className="flex items-center gap-1">
                        {stats.form.split('').slice(-5).map((result: string, i: number) => (
                          <div
                            key={i}
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                              result === 'W' && "bg-green-500 text-white",
                              result === 'D' && "bg-gray-500 text-white",
                              result === 'L' && "bg-red-500 text-white"
                            )}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={toggleFavorite}
                  variant="outline"
                  className={cn(
                    "gap-2 rounded-full",
                    isTeamFavorite && "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
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
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">개요</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">이적</span>
            </TabsTrigger>
            <TabsTrigger value="squad" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">스쿼드</span>
            </TabsTrigger>
            <TabsTrigger value="fixtures" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">일정</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">통계</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">커뮤니티</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="dark-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">리그 순위</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      {teamStanding?.rank || '-'}
                      <span className="text-sm font-normal text-muted-foreground">위</span>
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-primary/50" />
                </div>
              </Card>
              <Card className="dark-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">승점</p>
                    <p className="text-2xl font-bold">{teamStanding?.points || 0}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500/50" />
                </div>
              </Card>
              <Card className="dark-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">골득실</p>
                    <p className="text-2xl font-bold">{teamStanding?.goalsDiff || 0}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500/50" />
                </div>
              </Card>
              <Card className="dark-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">승률</p>
                    <p className="text-2xl font-bold">
                      {stats?.fixtures.played.total > 0 
                        ? Math.round((stats.fixtures.wins.total / stats.fixtures.played.total) * 100)
                        : 0}%
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500/50" />
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Matches & Next Match */}
              <div className="lg:col-span-2 space-y-6">
                {/* Next Match Highlight */}
                {nextFixtures?.response?.[0] && (
                  <Card className="dark-card p-6 border-primary/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">다음 경기</h3>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(nextFixtures.response[0].fixture.date).toLocaleDateString('ko-KR')}
                      </Badge>
                    </div>
                    <Link href={`/fixtures/${nextFixtures.response[0].fixture.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent hover:from-primary/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <Image
                            src={nextFixtures.response[0].teams.home.logo}
                            alt={nextFixtures.response[0].teams.home.name}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                          <div>
                            <p className={cn(
                              "font-medium",
                              nextFixtures.response[0].teams.home.id === teamId && "text-primary"
                            )}>
                              {nextFixtures.response[0].teams.home.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {nextFixtures.response[0].teams.home.id === teamId ? '홈' : '원정'}
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">VS</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(nextFixtures.response[0].fixture.date).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={cn(
                              "font-medium",
                              nextFixtures.response[0].teams.away.id === teamId && "text-primary"
                            )}>
                              {nextFixtures.response[0].teams.away.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {nextFixtures.response[0].teams.away.id === teamId ? '홈' : '원정'}
                            </p>
                          </div>
                          <Image
                            src={nextFixtures.response[0].teams.away.logo}
                            alt={nextFixtures.response[0].teams.away.name}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </Link>
                  </Card>
                )}

                {/* Recent Results */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4">최근 경기 결과</h3>
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
                        const opponent = isHome ? fixture.teams.away : fixture.teams.home
                        
                        return (
                          <Link
                            key={fixture.fixture.id}
                            href={`/fixtures/${fixture.fixture.id}`}
                            className="block"
                          >
                            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                              <div className="flex items-center gap-3">
                                <Badge className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                                  isWin && "bg-green-500",
                                  isDraw && "bg-gray-500",
                                  !isWin && !isDraw && "bg-red-500"
                                )}>
                                  {isWin ? 'W' : isDraw ? 'D' : 'L'}
                                </Badge>
                                <div>
                                  <p className="font-medium flex items-center gap-2">
                                    {isHome ? (
                                      <Home className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <Plane className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    vs {opponent.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {fixture.league.name}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">
                                  {teamGoals} - {opponentGoals}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(fixture.fixture.date).toLocaleDateString('ko-KR')}
                                </p>
                              </div>
                            </div>
                          </Link>
                        )
                      })
                    ) : (
                      <p className="text-muted-foreground text-center py-8">최근 경기 결과가 없습니다</p>
                    )}
                  </div>
                </Card>

              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Team Performance */}
                {stats && (
                  <Card className="dark-card p-6">
                    <h3 className="text-lg font-semibold mb-4">시즌 성과</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">승률</span>
                          <span className="text-sm font-medium">
                            {Math.round((stats.fixtures.wins.total / stats.fixtures.played.total) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(stats.fixtures.wins.total / stats.fixtures.played.total) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">홈 승률</span>
                          <span className="text-sm font-medium">
                            {Math.round((stats.fixtures.wins.home / stats.fixtures.played.home) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(stats.fixtures.wins.home / stats.fixtures.played.home) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">원정 승률</span>
                          <span className="text-sm font-medium">
                            {Math.round((stats.fixtures.wins.away / stats.fixtures.played.away) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(stats.fixtures.wins.away / stats.fixtures.played.away) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Team Details */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4">팀 정보</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        창단
                      </span>
                      <span className="font-medium">{team.founded}</span>
                    </div>
                    {venue && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            홈구장
                          </span>
                          <span className="font-medium text-right">{venue.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            수용인원
                          </span>
                          <span className="font-medium">{venue.capacity?.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Goal Stats */}
                {stats && (
                  <Card className="dark-card p-6">
                    <h3 className="text-lg font-semibold mb-4">골 통계</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-2xl font-bold text-green-500">{stats.goals.for.total.total}</p>
                        <p className="text-sm text-muted-foreground">득점</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-2xl font-bold text-red-500">{stats.goals.against.total.total}</p>
                        <p className="text-sm text-muted-foreground">실점</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-blue-500/10">
                        <p className="text-2xl font-bold text-blue-500">
                          {parseFloat(stats.goals.for.average.total || "0").toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground">평균 득점</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-orange-500/10">
                        <p className="text-2xl font-bold text-orange-500">{stats.clean_sheet.total}</p>
                        <p className="text-sm text-muted-foreground">클린시트</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Transfers Tab */}
          <TabsContent value="transfers" className="space-y-6">
            {transfersLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="dark-card p-6">
                    <div className="h-64 bg-secondary/50 rounded-lg animate-pulse" />
                  </Card>
                ))}
              </div>
            ) : transfersError ? (
              <Card className="dark-card p-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">이적 정보 임시 이용불가</h3>
                  <p className="text-muted-foreground mb-4">
                    이적 정보 API가 현재 업데이트 중입니다.<br />
                    빠른 시일 내에 서비스를 재개하겠습니다.
                  </p>
                  <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground">
                    💡 이적 시장이 열리는 기간(1월, 7-8월)에는 더 많은 이적 정보를 제공할 예정입니다.
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Transfer Filter Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex bg-secondary/20 rounded-lg p-1">
                    <button
                      onClick={() => setTransferFilter('in')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        transferFilter === 'in'
                          ? 'bg-green-500/20 text-green-500 shadow-sm'
                          : 'text-muted-foreground hover:text-green-500/80'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 inline mr-2" />
                      IN (영입)
                    </button>
                    <button
                      onClick={() => setTransferFilter('out')}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        transferFilter === 'out'
                          ? 'bg-red-500/20 text-red-500 shadow-sm'
                          : 'text-muted-foreground hover:text-red-500/80'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4 inline mr-2" />
                      OUT (방출)
                    </button>
                  </div>
                </div>
                {/* Transfer List */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {transferFilter === 'in' ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        영입 선수
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        방출 선수
                      </>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {transfersData?.response?.filter((transfer: any) => 
                      transferFilter === 'in' 
                        ? transfer.transfers.some((t: any) => t.teams.in.id === teamId)
                        : transfer.transfers.some((t: any) => t.teams.out.id === teamId)
                    ).length > 0 ? (
                      transfersData.response
                        .filter((transfer: any) => 
                          transferFilter === 'in'
                            ? transfer.transfers.some((t: any) => t.teams.in.id === teamId)
                            : transfer.transfers.some((t: any) => t.teams.out.id === teamId)
                        )
                        .sort((a: any, b: any) => {
                          // 각 이적의 가장 최근 날짜를 찾아서 정렬
                          const aTransfer = a.transfers.find((t: any) => 
                            transferFilter === 'in' 
                              ? t.teams.in.id === teamId
                              : t.teams.out.id === teamId
                          )
                          const bTransfer = b.transfers.find((t: any) => 
                            transferFilter === 'in' 
                              ? t.teams.in.id === teamId
                              : t.teams.out.id === teamId
                          )
                          // 날짜 파싱 함수 (백엔드와 동일한 로직)
                          const parseTransferDate = (dateStr: string): Date => {
                            if (!dateStr) return new Date(0)
                            if (dateStr.includes('-')) {
                              return new Date(dateStr)
                            } else if (dateStr.length === 6) {
                              // YYMMDD 형식인 경우
                              let year = parseInt(dateStr.substring(0, 2))
                              const month = dateStr.substring(2, 4)
                              const day = dateStr.substring(4, 6)
                              
                              if (year >= 80) {
                                year += 1900
                              } else {
                                year += 2000
                              }
                              
                              return new Date(`${year}-${month}-${day}`)
                            } else if (dateStr.length === 8) {
                              const year = dateStr.substring(0, 4)
                              const month = dateStr.substring(4, 6)
                              const day = dateStr.substring(6, 8)
                              return new Date(`${year}-${month}-${day}`)
                            } else {
                              return new Date(dateStr)
                            }
                          }
                          
                          const aDate = parseTransferDate(aTransfer?.date || '').getTime()
                          const bDate = parseTransferDate(bTransfer?.date || '').getTime()
                          return bDate - aDate // 최신순 정렬 (내림차순)
                        })
                        .slice(0, 10) // 최대 10개만 표시
                        .map((transfer: any) => {
                          const recentTransfer = transfer.transfers.find((t: any) => 
                            transferFilter === 'in' 
                              ? t.teams.in.id === teamId
                              : t.teams.out.id === teamId
                          )
                          // 같은 파싱 함수 사용 (통일된 로직)
                          const parseTransferDate = (dateStr: string): Date => {
                            if (!dateStr) return new Date(0)
                            if (dateStr.includes('-')) {
                              return new Date(dateStr)
                            } else if (dateStr.length === 6) {
                              // YYMMDD 형식인 경우
                              let year = parseInt(dateStr.substring(0, 2))
                              const month = dateStr.substring(2, 4)
                              const day = dateStr.substring(4, 6)
                              
                              if (year >= 80) {
                                year += 1900
                              } else {
                                year += 2000
                              }
                              
                              return new Date(`${year}-${month}-${day}`)
                            } else if (dateStr.length === 8) {
                              const year = dateStr.substring(0, 4)
                              const month = dateStr.substring(4, 6)
                              const day = dateStr.substring(6, 8)
                              return new Date(`${year}-${month}-${day}`)
                            } else {
                              return new Date(dateStr)
                            }
                          }
                          
                          const transferDate = parseTransferDate(recentTransfer?.date || '')
                          const oneYearAgo = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000))
                          const isRecent = transferDate >= oneYearAgo // 1년 이내
                          const isIncoming = transferFilter === 'in'
                          
                          return (
                            <div key={transfer.player.id} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                isIncoming 
                                  ? (isRecent ? 'bg-green-500/20' : 'bg-green-500/10')
                                  : (isRecent ? 'bg-red-500/20' : 'bg-red-500/10')
                              }`}>
                                {isIncoming ? (
                                  <TrendingUp className={`w-6 h-6 ${isRecent ? 'text-green-500' : 'text-green-400'}`} />
                                ) : (
                                  <TrendingDown className={`w-6 h-6 ${isRecent ? 'text-red-500' : 'text-red-400'}`} />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{transfer.player.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {recentTransfer?.teams.out.name} → {recentTransfer?.teams.in.name}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {recentTransfer?.type && (
                                    (() => {
                                      const typeValue = recentTransfer.type;
                                      // 가격 정보인지 확인 (€, $, M, K 등이 포함된 경우)
                                      const isPriceInfo = /[€$£¥₩]|[0-9]+[KkMm]|million|Million|thousand|Thousand/.test(typeValue);
                                      
                                      if (isPriceInfo) {
                                        return (
                                          <p className="text-xs font-medium text-green-600">
                                            {typeValue}
                                          </p>
                                        );
                                      } else {
                                        return (
                                          <p className="text-xs text-muted-foreground/80 capitalize">
                                            {typeValue}
                                          </p>
                                        );
                                      }
                                    })()
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-medium ${
                                  isIncoming 
                                    ? (isRecent ? 'text-green-500' : 'text-green-400')
                                    : (isRecent ? 'text-red-500' : 'text-red-400')
                                }`}>
                                  {isIncoming ? '영입' : '방출'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(() => {
                                    // 동일한 날짜 파싱 함수 사용
                                    const dateStr = recentTransfer?.date
                                    // console.log('Original date string:', dateStr)
                                    
                                    if (!dateStr) return '날짜 없음'
                                    
                                    let parsedDate: Date
                                    if (dateStr.includes('-')) {
                                      parsedDate = new Date(dateStr)
                                    } else if (dateStr.length === 6) {
                                      // YYMMDD 형식인 경우
                                      let year = parseInt(dateStr.substring(0, 2))
                                      const month = dateStr.substring(2, 4)
                                      const day = dateStr.substring(4, 6)
                                      
                                      if (year >= 80) {
                                        year += 1900
                                      } else {
                                        year += 2000
                                      }
                                      
                                      parsedDate = new Date(`${year}-${month}-${day}`)
                                    } else if (dateStr.length === 8) {
                                      // YYYYMMDD 형식인 경우
                                      const year = dateStr.substring(0, 4)
                                      const month = dateStr.substring(4, 6)
                                      const day = dateStr.substring(6, 8)
                                      parsedDate = new Date(`${year}-${month}-${day}`)
                                    } else {
                                      parsedDate = new Date(dateStr)
                                    }
                                    
                                    // console.log('Parsed date:', parsedDate)
                                    
                                    if (isNaN(parsedDate.getTime())) {
                                      return dateStr // 파싱 실패시 원본 반환
                                    }
                                    
                                    return parsedDate.toLocaleDateString('ko-KR', { 
                                      year: 'numeric', 
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  })()}
                                </p>
                                {isRecent && (
                                  <Badge variant="secondary" className="text-xs mt-1">최신</Badge>
                                )}
                              </div>
                            </div>
                          )
                        })
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        최근 1년간 {transferFilter === 'in' ? '영입한' : '방출한'} 선수가 없습니다
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            )}
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
                        {players.map((player: any, idx: number) => {
                          // 선수 데이터가 player 객체 안에 있을 수도 있고, 직접 있을 수도 있음
                          const playerData = player.player || player
                          const playerId = playerData.id || playerData.player_id || idx
                          const playerName = playerData.name || playerData.player_name || 'Unknown'
                          const playerPhoto = playerData.photo || playerData.player_photo
                          const playerNumber = playerData.number || playerData.player_number
                          const playerAge = playerData.age || playerData.player_age
                          
                          return (
                            <Link
                              key={playerId}
                              href={`/players/${playerId}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                            >
                              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                {playerPhoto ? (
                                  <Image
                                    src={playerPhoto}
                                    alt={playerName}
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{playerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  #{playerNumber || '-'} • {playerAge || '-'}세
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
                          )
                        })}
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
            {/* Season Selector */}
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-lg font-semibold">시즌 선택</h3>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="px-4 py-2 rounded-lg bg-secondary text-sm font-medium"
              >
                <option value={2024}>2024-25</option>
                <option value={2023}>2023-24</option>
                <option value={2022}>2022-23</option>
                <option value={2021}>2021-22</option>
                <option value={2020}>2020-21</option>
              </select>
              {statsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
            
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

                {/* Win/Draw/Loss Distribution */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    경기 결과 분포
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-3xl font-bold text-green-500">{stats.fixtures.wins.total}</p>
                        <p className="text-sm text-muted-foreground">승리</p>
                        <p className="text-xs mt-1">
                          {Math.round((stats.fixtures.wins.total / stats.fixtures.played.total) * 100)}%
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                        <p className="text-3xl font-bold text-gray-500">{stats.fixtures.draws.total}</p>
                        <p className="text-sm text-muted-foreground">무승부</p>
                        <p className="text-xs mt-1">
                          {Math.round((stats.fixtures.draws.total / stats.fixtures.played.total) * 100)}%
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-3xl font-bold text-red-500">{stats.fixtures.loses.total}</p>
                        <p className="text-sm text-muted-foreground">패배</p>
                        <p className="text-xs mt-1">
                          {Math.round((stats.fixtures.loses.total / stats.fixtures.played.total) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="relative h-8 rounded-full overflow-hidden bg-secondary">
                      <div 
                        className="absolute left-0 top-0 h-full bg-green-500"
                        style={{ width: `${(stats.fixtures.wins.total / stats.fixtures.played.total) * 100}%` }}
                      />
                      <div 
                        className="absolute top-0 h-full bg-gray-500"
                        style={{ 
                          left: `${(stats.fixtures.wins.total / stats.fixtures.played.total) * 100}%`,
                          width: `${(stats.fixtures.draws.total / stats.fixtures.played.total) * 100}%` 
                        }}
                      />
                      <div 
                        className="absolute right-0 top-0 h-full bg-red-500"
                        style={{ width: `${(stats.fixtures.loses.total / stats.fixtures.played.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>

                {/* Performance Trends */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    성과 지표
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-purple-500/10">
                      <p className="text-2xl font-bold text-purple-500">
                        {stats.biggest.wins.home ? `${stats.biggest.wins.home.split('-')[0]}-${stats.biggest.wins.home.split('-')[1]}` : '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">최대 홈 승리</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-indigo-500/10">
                      <p className="text-2xl font-bold text-indigo-500">
                        {stats.biggest.wins.away ? `${stats.biggest.wins.away.split('-')[0]}-${stats.biggest.wins.away.split('-')[1]}` : '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">최대 원정 승리</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                      <p className="text-2xl font-bold text-yellow-500">
                        {stats.biggest.streak?.wins || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">최다 연승</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-cyan-500/10">
                      <p className="text-2xl font-bold text-cyan-500">
                        {stats.penalty?.scored?.total || 0}/{stats.penalty?.total || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">페널티 성공</p>
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

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            {/* Post Categories Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                className="rounded-full"
              >
                전체
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'general' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('general')}
                className="rounded-full"
              >
                일반
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'match' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('match')}
                className="rounded-full"
              >
                경기
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'transfer' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('transfer')}
                className="rounded-full"
              >
                이적
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'news' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('news')}
                className="rounded-full"
              >
                뉴스
              </Button>
              <Button
                size="sm"
                variant={selectedCategory === 'discussion' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('discussion')}
                className="rounded-full"
              >
                토론
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Posts List */}
              <div className="lg:col-span-2 space-y-4">
                {/* New Post Form */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4">새 게시글 작성</h3>
                  <div className="space-y-4">
                    <Input
                      placeholder="제목을 입력하세요"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="내용을 입력하세요"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value as TeamPost['category'])}
                        className="px-3 py-2 rounded-md bg-secondary text-sm"
                      >
                        <option value="general">일반</option>
                        <option value="match">경기</option>
                        <option value="transfer">이적</option>
                        <option value="news">뉴스</option>
                        <option value="discussion">토론</option>
                      </select>
                      <Button
                        onClick={() => {
                          if (newPostTitle && newPostContent) {
                            createPostMutation.mutate({
                              title: newPostTitle,
                              content: newPostContent,
                              category: newPostCategory
                            })
                          }
                        }}
                        disabled={!newPostTitle || !newPostContent || createPostMutation.isPending}
                        className="ml-auto"
                      >
                        {createPostMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '게시하기'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Posts */}
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="dark-card p-6">
                        <div className="h-32 bg-secondary/50 rounded-lg animate-pulse" />
                      </Card>
                    ))}
                  </div>
                ) : (console.log('[TeamProfile] Posts check:', { teamPosts, length: teamPosts?.length, isArray: Array.isArray(teamPosts) }), teamPosts?.length > 0) ? (
                  <div className="space-y-4">
                    {teamPosts.map((post: TeamPost) => (
                      <Card key={post.id} className="dark-card p-6 hover:border-primary/50 transition-all cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {post.is_pinned && (
                                <Pin className="w-4 h-4 text-primary" />
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {post.category === 'general' && '일반'}
                                {post.category === 'match' && '경기'}
                                {post.category === 'transfer' && '이적'}
                                {post.category === 'news' && '뉴스'}
                                {post.category === 'discussion' && '토론'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                            <h4 className="font-semibold mb-2">{post.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                <Heart className={cn("w-4 h-4", post.is_liked && "fill-current text-red-500")} />
                                {post.likes}
                              </button>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {post.comments?.length || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {post.views}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="dark-card p-8 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      아직 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!
                    </p>
                  </Card>
                )}
              </div>

              {/* Community Sidebar */}
              <div className="space-y-6">
                {/* Next Match Prediction */}
                {nextFixtures?.response?.[0] && (
                  <Card className="dark-card p-6">
                    <h3 className="text-lg font-semibold mb-4">경기 예측</h3>
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(nextFixtures.response[0].fixture.date).toLocaleDateString('ko-KR')}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">
                          {nextFixtures.response[0].teams.home.name}
                        </span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-medium">
                          {nextFixtures.response[0].teams.away.name}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="rounded-full">
                        홈 승
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full">
                        무승부
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full">
                        원정 승
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Community Stats */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4">커뮤니티 통계</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">전체 게시글</span>
                      <span className="font-medium">{teamPosts?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">오늘 게시글</span>
                      <span className="font-medium">
                        {teamPosts?.filter((post: TeamPost) => 
                          new Date(post.created_at).toDateString() === new Date().toDateString()
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">활동 멤버</span>
                      <span className="font-medium">
                        {new Set(teamPosts?.map((post: TeamPost) => post.user_id)).size || 0}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Popular Topics */}
                <Card className="dark-card p-6">
                  <h3 className="text-lg font-semibold mb-4">인기 토픽</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">#이적루머</Badge>
                    <Badge variant="secondary">#다음경기</Badge>
                    <Badge variant="secondary">#선수분석</Badge>
                    <Badge variant="secondary">#전술토론</Badge>
                    <Badge variant="secondary">#응원</Badge>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}