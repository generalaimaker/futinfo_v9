'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, Calendar, TrendingUp, Users, 
  Star, StarOff, ChevronUp, ChevronDown,
  Minus, AlertCircle, Loader2, Clock,
  MapPin, Zap
} from 'lucide-react'
import { useLeagueDetails, useLeagueStandings, useLeagueFixtures } from '@/lib/supabase/football'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { cn } from '@/lib/utils'
import { 
  QualificationInfo,
  getQualificationInfo, 
  getQualificationColor, 
  getQualificationDescription,
  isQualificationRelevant 
} from '@/lib/utils/standings'

export default function LeaguePage() {
  const params = useParams()
  const leagueId = parseInt(params.id as string)
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  
  // 시즌 설정
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  // 유럽 리그는 8월에 시작하므로, 8월 이전이면 이전 시즌
  // K리그 등은 3월에 시작하므로 별도 처리 필요
  const isKoreanLeague = leagueId === 292 || leagueId === 293 // K League 1, 2
  const defaultSeason = isKoreanLeague 
    ? (currentMonth < 3 ? currentYear - 1 : currentYear)
    : (currentMonth < 8 ? currentYear - 1 : currentYear)
  
  const [selectedSeason, setSelectedSeason] = useState(defaultSeason)
  const [isChangingSeason, setIsChangingSeason] = useState(false)
  
  const { data: leagueData, isLoading: leagueLoading } = useLeagueDetails(leagueId)
  const { data: standingsData, isLoading: standingsLoading, refetch: refetchStandings } = useLeagueStandings(leagueId, selectedSeason)
  const { data: fixturesData, isLoading: fixturesLoading, refetch: refetchFixtures } = useLeagueFixtures(leagueId, selectedSeason)
  const { preferences, addFavoriteLeague, removeFavoriteLeague } = useUserPreferences()

  const isLoading = leagueLoading || standingsLoading || fixturesLoading
  const league = leagueData?.response?.[0]?.league
  const standings = standingsData?.response?.[0]?.league?.standings?.[0] || []
  const fixtures = fixturesData?.response || []

  const isLeagueFavorite = preferences.favoriteLeagueIds.includes(leagueId)

  // 시즌 변경 시 데이터 다시 불러오기
  useEffect(() => {
    if (selectedSeason) {
      setIsChangingSeason(true)
      Promise.all([refetchStandings(), refetchFixtures()]).finally(() => {
        setIsChangingSeason(false)
      })
    }
  }, [selectedSeason, refetchStandings, refetchFixtures])

  const toggleFavorite = async () => {
    if (isLeagueFavorite) {
      await removeFavoriteLeague(leagueId)
    } else {
      await addFavoriteLeague(leagueId)
    }
  }

  // 시즌 옵션 생성 함수
  const generateSeasonOptions = () => {
    const options = []
    const startYear = 2020
    
    // 현재 시즌까지만 표시 (미래 시즌 제외)
    const maxYear = currentYear
    
    for (let year = maxYear; year >= startYear; year--) {
      // 단일 연도 시즌 (K리그, MLS, J리그 등)
      if ([292, 293, 253, 98, 71].includes(leagueId)) {
        options.push({ year, label: `${year}` })
      } else {
        // 크로스 연도 시즌 (유럽 리그들)
        options.push({ year, label: `${year}/${(year + 1).toString().slice(-2)}` })
      }
    }
    
    return options
  }

  // 라운드별로 경기 그룹화
  const fixturesByRound = fixtures.reduce((acc: Record<string, any[]>, fixture: any) => {
    const round = fixture.league.round
    if (!acc[round]) acc[round] = []
    acc[round].push(fixture)
    return acc
  }, {})
  
  // 날짜별로 경기 정렬
  Object.keys(fixturesByRound).forEach(round => {
    fixturesByRound[round].sort((a: any, b: any) => 
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    )
  })

  // 라운드 정렬 - 숫자 기준으로 오름차순
  const rounds = Object.keys(fixturesByRound).sort((a, b) => {
    const aNum = parseInt(a.match(/\d+/)?.[0] || '0')
    const bNum = parseInt(b.match(/\d+/)?.[0] || '0')
    return aNum - bNum // 오름차순으로 변경 (1라운드부터)
  })

  // 현재 시점 기준으로 진행 중이거나 다음 라운드 찾기
  const now = new Date()
  let currentRound = null
  
  // 각 라운드를 순회하면서 현재 진행 중이거나 앞으로 예정된 라운드 찾기
  for (const round of rounds) {
    const roundFixtures = fixturesByRound[round]
    
    // 라운드의 모든 경기가 종료되지 않았으면 현재 라운드
    const hasUnfinishedMatch = roundFixtures.some((fixture: any) => {
      const matchDate = new Date(fixture.fixture.date)
      const status = fixture.fixture.status.short
      
      // 아직 시작 안 함 또는 진행 중
      return status === 'NS' || status === 'TBD' || 
             ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(status) ||
             matchDate > now
    })
    
    if (hasUnfinishedMatch) {
      currentRound = round
      break
    }
  }
  
  // 모든 라운드가 종료된 경우 마지막 라운드 표시
  if (!currentRound && rounds.length > 0) {
    currentRound = rounds[rounds.length - 1]
  }
  
  const displayRound = selectedRound || currentRound

  if (isLoading) {
    return (
      <div className="min-h-screen lg:ml-64 p-4 lg:p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!league) {
    return (
      <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="dark-card p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">리그를 찾을 수 없습니다</h2>
            <p className="text-muted-foreground mb-4">요청하신 리그 정보를 불러올 수 없습니다.</p>
            <Link href="/leagues">
              <Button>리그 목록으로 돌아가기</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* League Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl bg-white/10 p-4 flex items-center justify-center">
                <Image
                  src={league.logo}
                  alt={league.name}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{league.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{(league as any).country || ''}</span>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <span>시즌</span>
                    <select 
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                      className="bg-background/80 backdrop-blur border border-primary/50 rounded-md px-4 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-background/90 transition-all hover:border-primary"
                    >
                      {/* 사용 가능한 시즌 표시 */}
                      {generateSeasonOptions().map(({ year, label }) => (
                        <option key={year} value={year} className="bg-background text-foreground">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={toggleFavorite}
              variant="outline"
              className={cn(
                "gap-2",
                isLeagueFavorite && "border-yellow-500 text-yellow-500"
              )}
            >
              {isLeagueFavorite ? (
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
        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="standings">순위표</TabsTrigger>
            <TabsTrigger value="fixtures">일정</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
          </TabsList>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-4">
            {/* 미래 시즌 알림 */}
            {selectedSeason > currentYear && (
              <Card className="dark-card p-4 border-yellow-500/50">
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">아직 시작되지 않은 시즌입니다. 데이터가 없을 수 있습니다.</p>
                </div>
              </Card>
            )}
            
            {isChangingSeason ? (
              <Card className="dark-card p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">시즌 데이터를 불러오는 중...</p>
              </Card>
            ) : standings.length === 0 ? (
              <Card className="dark-card p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">순위 데이터 없음</h3>
                <p className="text-muted-foreground">
                  {selectedSeason > currentYear 
                    ? "아직 시작되지 않은 시즌입니다." 
                    : "이 시즌의 순위 데이터를 찾을 수 없습니다."}
                </p>
              </Card>
            ) : (
              <Card className="dark-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="border-b border-border">
                    <tr className="text-sm text-muted-foreground">
                      <th className="text-left p-4 font-medium">순위</th>
                      <th className="text-left p-4 font-medium">팀</th>
                      <th className="text-center p-4 font-medium">경기</th>
                      <th className="text-center p-4 font-medium">승</th>
                      <th className="text-center p-4 font-medium">무</th>
                      <th className="text-center p-4 font-medium">패</th>
                      <th className="text-center p-4 font-medium">득실</th>
                      <th className="text-center p-4 font-medium">득실차</th>
                      <th className="text-center p-4 font-medium">승점</th>
                      <th className="text-center p-4 font-medium hidden sm:table-cell">최근</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team: any, index: number) => {
                      const qualificationInfo = getQualificationInfo(team.rank, leagueId, standings.length)
                      const qualificationColor = getQualificationColor(qualificationInfo, leagueId)
                      
                      return (
                        <tr key={team.team.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {/* 진출권 색상 표시 */}
                              {qualificationInfo !== QualificationInfo.None && (
                                <div 
                                  className="w-1 h-8 rounded-full"
                                  style={{ backgroundColor: qualificationColor }}
                                />
                              )}
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-semibold",
                                  qualificationInfo !== QualificationInfo.None && "font-bold"
                                )}
                                style={{
                                  color: qualificationInfo !== QualificationInfo.None 
                                    ? qualificationColor 
                                    : undefined
                                }}>
                                  {team.rank}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {team.status === 'up' && <ChevronUp className="w-3 h-3 text-green-500" />}
                                  {team.status === 'down' && <ChevronDown className="w-3 h-3 text-red-500" />}
                                  {team.status === 'same' && <Minus className="w-3 h-3" />}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Link href={`/teams/${team.team.id}`} className="flex items-center gap-3 hover:underline">
                              <Image
                                src={team.team.logo}
                                alt={team.team.name}
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                              <span className="font-medium">
                                {team.team.name}
                                {/* 과거 시즌 1위 팀에 트로피 표시 */}
                                {(() => {
                                  // 단일 연도 시즌 (K리그, MLS, J리그 등)
                                  const isSingleYearLeague = [292, 293, 253, 98, 71].includes(leagueId)
                                  
                                  if (team.rank === 1) {
                                    if (isSingleYearLeague) {
                                      // 단일 연도 리그는 현재 연도보다 작으면 종료됨
                                      return selectedSeason < currentYear ? " 🏆" : ""
                                    } else {
                                      // 크로스 연도 리그 (예: 2024-25 시즌)
                                      // 2024-25 시즌은 2025년 5-6월에 종료
                                      // selectedSeason이 2024이고 현재가 2025년 6월 이후면 종료
                                      // selectedSeason이 2023 이하면 무조건 종료
                                      if (selectedSeason < currentYear - 1) {
                                        return " 🏆" // 2년 이상 지난 시즌
                                      } else if (selectedSeason === currentYear - 1 && currentMonth >= 6) {
                                        return " 🏆" // 작년 시즌이고 6월 이후 (시즌 종료)
                                      }
                                      return "" // 현재 진행 중인 시즌
                                    }
                                  }
                                  return ""
                                })()}
                              </span>
                            </Link>
                          </td>
                          <td className="text-center p-4">{team.all.played}</td>
                          <td className="text-center p-4">{team.all.win}</td>
                          <td className="text-center p-4">{team.all.draw}</td>
                          <td className="text-center p-4">{team.all.lose}</td>
                          <td className="text-center p-4">{team.all.goals.for}:{team.all.goals.against}</td>
                          <td className="text-center p-4">
                            <span className={cn(
                              team.goalsDiff > 0 && "text-green-500",
                              team.goalsDiff < 0 && "text-red-500"
                            )}>
                              {team.goalsDiff > 0 && '+'}{team.goalsDiff}
                            </span>
                          </td>
                          <td className="text-center p-4">
                            <span className="font-bold">{team.points}</span>
                          </td>
                          <td className="text-center p-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1 justify-center">
                              {team.form?.split('').slice(-5).map((result: string, i: number) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-5 h-5 rounded text-xs flex items-center justify-center font-medium",
                                    result === 'W' && "bg-green-500 text-white",
                                    result === 'D' && "bg-gray-500 text-white",
                                    result === 'L' && "bg-red-500 text-white"
                                  )}
                                >
                                  {result}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Legend */}
              <div className="p-4 border-t border-border">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">진출권 정보</h4>
                <div className="flex flex-wrap gap-3 text-xs">
                  {/* 챔피언스리그와 유로파리그는 다른 범례 표시 */}
                  {(leagueId === 2 || leagueId === 3) ? (
                    <>
                      {[QualificationInfo.Knockout16Direct, QualificationInfo.Knockout16Playoff].map((info) => {
                        if (getQualificationDescription(info) && isQualificationRelevant(info, leagueId)) {
                          return (
                            <div key={info} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: getQualificationColor(info, leagueId) }}
                              />
                              <span>{getQualificationDescription(info)}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </>
                  ) : (
                    <>
                      {/* 일반 리그 범례 */}
                      {[
                        QualificationInfo.ChampionsLeague,
                        QualificationInfo.ChampionsLeagueQualification,
                        QualificationInfo.EuropaLeague,
                        QualificationInfo.ConferenceLeague,
                        QualificationInfo.ConferenceLeagueQualification,
                        QualificationInfo.RelegationPlayoff,
                        QualificationInfo.Relegation
                      ].map((info) => {
                        if (getQualificationDescription(info) && isQualificationRelevant(info, leagueId)) {
                          return (
                            <div key={info} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: getQualificationColor(info, leagueId) }}
                              />
                              <span>{getQualificationDescription(info)}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </>
                  )}
                </div>
              </div>
            </Card>
            )}
          </TabsContent>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures" className="space-y-4">
            {/* 미래 시즌 알림 */}
            {selectedSeason > currentYear && (
              <Card className="dark-card p-4 border-yellow-500/50">
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">아직 시작되지 않은 시즌입니다. 일정이 확정되지 않았을 수 있습니다.</p>
                </div>
              </Card>
            )}
            
            {isChangingSeason ? (
              <Card className="dark-card p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">일정 데이터를 불러오는 중...</p>
              </Card>
            ) : fixtures.length === 0 ? (
              <Card className="dark-card p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">일정 데이터 없음</h3>
                <p className="text-muted-foreground">
                  {selectedSeason > currentYear 
                    ? "아직 일정이 확정되지 않았습니다." 
                    : "이 시즌의 일정을 찾을 수 없습니다."}
                </p>
              </Card>
            ) : (
              <>
                {/* Round Selector */}
                <Card className="dark-card p-4">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {rounds.map((round) => {
                      const isCurrentRound = round === currentRound && !selectedRound
                      const isSelectedRound = round === displayRound
                      
                      return (
                        <Button
                          key={round}
                          variant={isSelectedRound ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRound(round)}
                          className={cn(
                            "whitespace-nowrap relative",
                            isCurrentRound && !isSelectedRound && "border-primary"
                          )}
                        >
                          {round}
                          {isCurrentRound && !selectedRound && (
                            <Badge className="absolute -top-2 -right-2 text-[10px] px-1 py-0 h-4" variant="destructive">
                              현재
                            </Badge>
                          )}
                        </Button>
                      )
                    })}
              </div>
            </Card>

            {/* Fixtures List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{displayRound}</h3>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {displayRound && fixturesByRound[displayRound]?.length || 0} 경기
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {displayRound && fixturesByRound[displayRound]?.map((fixture: any) => {
                  const isFinished = fixture.fixture.status.short === 'FT'
                  const isLive = ['1H', '2H', 'HT'].includes(fixture.fixture.status.short)
                  const notStarted = fixture.fixture.status.short === 'NS'
                  
                  return (
                    <Link
                      key={fixture.fixture.id}
                      href={`/fixtures/${fixture.fixture.id}`}
                      className="block"
                    >
                      <Card className={cn(
                        "dark-card p-6 hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer",
                        isLive && "border-green-500/50 bg-green-500/5"
                      )}>
                        {/* Match Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', {
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'long'
                                })}
                              </span>
                            </div>
                            {fixture.fixture.venue?.name && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{fixture.fixture.venue.name}</span>
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={isFinished ? "secondary" : isLive ? "default" : "outline"}
                            className={cn(
                              isLive && "bg-green-500 text-white animate-pulse"
                            )}
                          >
                            {isLive && <Zap className="w-3 h-3 mr-1" />}
                            {fixture.fixture.status.short === 'FT' ? '종료' : 
                             fixture.fixture.status.short === 'NS' ? '예정' :
                             fixture.fixture.status.short === 'HT' ? '하프타임' :
                             fixture.fixture.status.short}
                          </Badge>
                        </div>
                        
                        {/* Match Content */}
                        <div className="flex items-center justify-between">
                          {/* Home Team */}
                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div>
                                <h4 className="font-semibold text-lg">{fixture.teams.home.name}</h4>
                                {fixture.teams.home.winner && (
                                  <Badge variant="default" className="mt-1 text-xs">
                                    승리
                                  </Badge>
                                )}
                              </div>
                              <Image
                                src={fixture.teams.home.logo}
                                alt={fixture.teams.home.name}
                                width={48}
                                height={48}
                                className="object-contain"
                              />
                            </div>
                          </div>
                          
                          {/* Score or Time */}
                          <div className="px-8 text-center">
                            {isFinished || isLive ? (
                              <div className="flex items-center gap-4">
                                <span className={cn(
                                  "text-3xl font-bold",
                                  fixture.teams.home.winner && "text-primary"
                                )}>
                                  {fixture.goals.home}
                                </span>
                                <span className="text-2xl text-muted-foreground">:</span>
                                <span className={cn(
                                  "text-3xl font-bold",
                                  fixture.teams.away.winner && "text-primary"
                                )}>
                                  {fixture.goals.away}
                                </span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <Clock className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                                <div className="text-lg font-semibold">
                                  {new Date(fixture.fixture.date).toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Away Team */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Image
                                src={fixture.teams.away.logo}
                                alt={fixture.teams.away.name}
                                width={48}
                                height={48}
                                className="object-contain"
                              />
                              <div>
                                <h4 className="font-semibold text-lg">{fixture.teams.away.name}</h4>
                                {fixture.teams.away.winner && (
                                  <Badge variant="default" className="mt-1 text-xs">
                                    승리
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Match Status Details */}
                        {isLive && fixture.fixture.status.elapsed && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center justify-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-green-500 font-medium">
                                {fixture.fixture.status.elapsed}'
                              </span>
                            </div>
                          </div>
                        )}
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
            </>
            )}
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Scorers */}
              <Card className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  득점 순위
                </h3>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p>득점 순위 데이터 준비 중</p>
                </div>
              </Card>

              {/* Top Assists */}
              <Card className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  도움 순위
                </h3>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p>도움 순위 데이터 준비 중</p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}