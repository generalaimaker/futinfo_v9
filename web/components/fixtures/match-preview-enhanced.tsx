'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FootballAPIService } from '@/lib/supabase/football'
import { 
  Trophy, Calendar, MapPin, Users, Clock, TrendingUp, 
  AlertTriangle, Shield, Target, Activity, Info,
  ChevronRight, Star, Zap, ArrowUp, ArrowDown, BarChart3
} from 'lucide-react'
import { arrangePlayersByPosition, normalizeFormation, PlayerPosition } from './lineup-utils'

interface MatchPreviewEnhancedProps {
  fixture: any
}

// 최근 5경기 폼 컴포넌트
function RecentForm({ teamId, teamName, teamLogo }: any) {
  const [form, setForm] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const footballAPI = new FootballAPIService()
        const data = await footballAPI.getTeamFixtures(teamId, 5)
        
        if (data && Array.isArray(data)) {
          const formArray = data.map((fixture: any) => {
            const isHome = fixture.teams.home.id === teamId
            const homeWin = fixture.teams.home.winner
            const awayWin = fixture.teams.away.winner
            
            if (isHome) {
              if (homeWin) return 'W'
              if (awayWin) return 'L'
              return 'D'
            } else {
              if (awayWin) return 'W'
              if (homeWin) return 'L'
              return 'D'
            }
          })
          setForm(formArray)
        }
      } catch (error) {
        console.error('Error fetching team form:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchForm()
  }, [teamId])
  
  const getFormColor = (result: string) => {
    switch(result) {
      case 'W': return 'bg-green-500 text-white'
      case 'L': return 'bg-red-500 text-white'
      case 'D': return 'bg-gray-500 text-white'
      default: return 'bg-gray-300'
    }
  }
  
  const winRate = form.length > 0 
    ? Math.round((form.filter(f => f === 'W').length / form.length) * 100)
    : 0
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {teamLogo && (
          <Image
            src={teamLogo}
            alt={teamName}
            width={32}
            height={32}
            className="object-contain"
          />
        )}
        <div className="flex-1">
          <p className="font-semibold">{teamName}</p>
          <p className="text-sm text-gray-500">최근 5경기</p>
        </div>
      </div>
      
      {loading ? (
        <div className="animate-pulse flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-8 h-8 bg-gray-200 rounded-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {form.map((result, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                  getFormColor(result)
                )}
              >
                {result}
              </div>
            ))}
          </div>
          
          {/* 승률 표시 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">승률</span>
            <div className="flex items-center gap-2">
              <Progress value={winRate} className="w-20 h-2" />
              <span className="font-medium">{winRate}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 팀 통계 카드
function TeamStatsCard({ teamId, teamName, season, leagueId }: any) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const footballAPI = new FootballAPIService()
        const currentSeason = season || new Date().getFullYear()
        // 리그 ID가 없으면 Premier League를 기본값으로 사용
        const defaultLeagueId = leagueId || 39
        const data = await footballAPI.getTeamStatistics(teamId, currentSeason, defaultLeagueId)
        setStats(data)
      } catch (error) {
        console.error('Error fetching team statistics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [teamId, season, leagueId])
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    )
  }
  
  if (!stats) return null
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{teamName} 시즌 통계</h4>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">
            {stats.fixtures?.wins?.total || 0}
          </p>
          <p className="text-xs text-gray-500">승</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-500">
            {stats.fixtures?.draws?.total || 0}
          </p>
          <p className="text-xs text-gray-500">무</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">
            {stats.fixtures?.loses?.total || 0}
          </p>
          <p className="text-xs text-gray-500">패</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
        <div>
          <p className="text-xs text-gray-500">득점</p>
          <p className="font-bold">{stats.goals?.for?.total?.total || 0}</p>
          <p className="text-xs text-gray-400">
            평균 {stats.goals?.for?.average?.total || '0.0'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">실점</p>
          <p className="font-bold">{stats.goals?.against?.total?.total || 0}</p>
          <p className="text-xs text-gray-400">
            평균 {stats.goals?.against?.average?.total || '0.0'}
          </p>
        </div>
      </div>
    </div>
  )
}

// 최근 경기 라인업 컴포넌트
function LastMatchLineup({ teamId, teamName }: any) {
  const [lineup, setLineup] = useState<any>(null)
  const [formation, setFormation] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [lastMatchDate, setLastMatchDate] = useState<string>('')
  
  useEffect(() => {
    const fetchLastLineup = async () => {
      try {
        const footballAPI = new FootballAPIService()
        
        // 1. 팀의 가장 최근 완료된 경기들 가져오기 (더 많이 가져와서 라인업 있는 것 찾기)
        const recentFixtures = await footballAPI.getTeamFixtures(teamId, 10)
        console.log('[LastMatchLineup] Recent fixtures:', recentFixtures)
        
        if (recentFixtures && recentFixtures.length > 0) {
          // 완료된 경기 중에서 라인업이 있는 첫 번째 경기 찾기
          for (const fixture of recentFixtures) {
            // 경기가 완료된 경우만 체크 (FT, AET, PEN 등)
            const status = fixture.fixture?.status?.short
            if (!status || !['FT', 'AET', 'PEN', 'SUSP', 'AWD', 'WO'].includes(status)) {
              console.log(`[LastMatchLineup] Skipping fixture ${fixture.fixture?.id} with status: ${status}`)
              continue
            }
            
            console.log('[LastMatchLineup] Checking fixture:', fixture.fixture.id)
            
            // fixtures 엔드포인트로 상세 정보 가져오기 (라인업 포함)
            try {
              const fixtureDetails = await footballAPI.getFixtureDetails(fixture.fixture.id)
              console.log('[LastMatchLineup] Fixture details:', fixtureDetails)
              
              if (fixtureDetails?.lineups && Array.isArray(fixtureDetails.lineups) && fixtureDetails.lineups.length > 0) {
                const teamLineup = fixtureDetails.lineups.find((l: any) => l.team.id === teamId)
                console.log('[LastMatchLineup] Full team lineup data:', JSON.stringify(teamLineup, null, 2))
                
                if (teamLineup && teamLineup.startXI && Array.isArray(teamLineup.startXI) && teamLineup.startXI.length > 0) {
                  const fixtureDate = new Date(fixture.fixture.date)
                  setLastMatchDate(format(fixtureDate, 'M월 d일', { locale: ko }))
                  
                  // 포메이션 정규화
                  const normalizedFormation = normalizeFormation(teamLineup.formation || '4-3-3')
                  setFormation(normalizedFormation)
                  
                  // startXI 구조 확인 및 정리
                  const lineupWithPositions = teamLineup.startXI.map((playerData: any, idx: number) => {
                    // API 응답 구조에 따라 데이터 추출
                    let player = playerData.player || playerData
                    let grid = player.grid || playerData.grid || null
                    let pos = player.pos || playerData.position || null
                    
                    // 첫 번째 선수는 항상 골키퍼
                    if (idx === 0 && !pos) {
                      pos = 'G'
                    }
                    
                    console.log(`[LastMatchLineup] Player ${idx}: ${player.name}, grid: ${grid}, pos: ${pos}`)
                    
                    return {
                      player: {
                        id: player.id,
                        name: player.name,
                        number: player.number || idx + 1,
                        grid: grid,
                        pos: pos
                      }
                    }
                  })
                  
                  setLineup(lineupWithPositions)
                  console.log('[LastMatchLineup] Processed lineup:', lineupWithPositions)
                  setLoading(false)
                  return // 라인업을 찾았으면 종료
                }
              }
              
              // players 데이터에서 라인업 추출 시도
              if (fixtureDetails?.players && Array.isArray(fixtureDetails.players) && fixtureDetails.players.length > 0) {
                const teamPlayers = fixtureDetails.players.find((p: any) => p.team.id === teamId)
                console.log('[LastMatchLineup] Team players found:', teamPlayers)
                
                if (teamPlayers?.players) {
                  // 선발 선수만 필터링 (grid가 있는 선수들)
                  const startingXI = teamPlayers.players
                    .filter((p: any) => p.statistics?.[0]?.games?.position && p.statistics?.[0]?.games?.position !== 'S')
                    .map((p: any) => ({
                      player: {
                        id: p.player.id,
                        name: p.player.name,
                        number: p.statistics?.[0]?.games?.number || 0,
                        pos: p.statistics?.[0]?.games?.position
                      }
                    }))
                  
                  if (startingXI.length > 0) {
                    const fixtureDate = new Date(fixture.fixture.date)
                    setLastMatchDate(format(fixtureDate, 'M월 d일', { locale: ko }))
                    
                    // 포메이션 추론 (GK 제외한 필드 플레이어 수로)
                    const fieldPlayers = startingXI.filter((p: any) => p.player.pos !== 'G').length
                    let inferredFormation = '4-3-3' // 기본값
                    if (fieldPlayers === 10) {
                      const defenders = startingXI.filter((p: any) => p.player.pos === 'D').length
                      const midfielders = startingXI.filter((p: any) => p.player.pos === 'M').length
                      const forwards = startingXI.filter((p: any) => p.player.pos === 'F').length
                      
                      if (defenders && midfielders && forwards) {
                        inferredFormation = `${defenders}-${midfielders}-${forwards}`
                      }
                    }
                    
                    setFormation(inferredFormation)
                    setLineup(startingXI)
                    console.log('[LastMatchLineup] Lineup extracted from players data:', {
                      formation: inferredFormation,
                      players: startingXI.length
                    })
                    setLoading(false)
                    return
                  }
                }
              }
            } catch (error) {
              console.error('[LastMatchLineup] Error fetching fixture details:', error)
            }
          }
          
          console.log('[LastMatchLineup] No lineup data found in recent fixtures')
        } else {
          console.log('[LastMatchLineup] No recent fixtures found for team:', teamId)
        }
      } catch (error) {
        console.error('[LastMatchLineup] Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLastLineup()
  }, [teamId])
  
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="bg-gray-100 rounded-lg aspect-[3/4]" />
        </div>
      </div>
    )
  }
  
  if (!lineup || lineup.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{teamName}</h4>
        <div className="bg-gray-100 rounded-lg p-4 aspect-[3/4] flex items-center justify-center">
          <p className="text-gray-500 text-sm text-center">
            최근 경기 라인업 정보를 가져올 수 없습니다
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{teamName}</h4>
        {formation && (
          <Badge variant="outline" className="text-xs">
            {formation}
          </Badge>
        )}
      </div>
      
      <div className="bg-gradient-to-b from-green-600 to-green-500 rounded-lg p-4 aspect-[3/4] relative">
        {/* 포메이션에 따른 선수 배치 */}
        <div className="absolute inset-0 p-4">
          {(() => {
            // 선수들을 포지션별로 정렬하고 위치 할당
            const arrangedPlayers = arrangePlayersByPosition(lineup, formation)
            console.log('[LastMatchLineup] Arranged players:', arrangedPlayers)
            
            return arrangedPlayers.map((player: any, idx: number) => {
              const position = player.fieldPosition
              
              return (
                <div
                  key={idx}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-gray-200">
                    <span className="text-sm font-bold text-gray-900">
                      {player.player.number || idx + 1}
                    </span>
                  </div>
                  <p className="text-white text-xs mt-1.5 text-center font-semibold whitespace-nowrap drop-shadow-md">
                    {player.player.name.split(' ').pop()}
                  </p>
                  {/* 디버그용: 포지션 표시 */}
                  {player.player.pos && (
                    <p className="text-white text-[10px] opacity-70">
                      {player.player.pos}
                    </p>
                  )}
                </div>
              )
            })
          })()}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        * {lastMatchDate} 경기 선발 라인업
      </div>
      
      {/* 선발 선수 리스트 */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h5 className="text-xs font-medium text-gray-600 mb-2">선발 명단</h5>
        <div className="grid grid-cols-2 gap-1">
          {lineup.map((player: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-500">
                {player.player.number}
              </span>
              <span className="text-gray-700">{player.player.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// 부상/결장 선수 정보
function InjuriesCard({ teamId, teamName }: any) {
  const [injuries, setInjuries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchInjuries = async () => {
      try {
        const footballAPI = new FootballAPIService()
        const data = await footballAPI.getTeamInjuries(teamId)
        console.log('[InjuriesCard] Raw injuries data for', teamName, ':', data)
        
        if (Array.isArray(data) && data.length > 0) {
          // response 형식에 따라 처리
          const processedInjuries = data.map((item: any) => {
            // API 응답 구조에 따라 조정
            if (item.player) {
              return {
                id: item.player.id,
                name: item.player.name,
                photo: item.player.photo,
                type: item.player.type || 'Injured',
                reason: item.player.reason || 'Unknown',
                position: item.player.position || 'Player',
                fixture: item.fixture
              }
            }
            // 다른 형식의 데이터 처리
            return {
              id: item.id || Math.random(),
              name: item.name || 'Unknown Player',
              photo: item.photo || null,
              type: item.type || 'Injured',
              reason: item.reason || 'Unknown',
              position: item.position || 'Player',
              fixture: item.fixture
            }
          })
          
          // 중복 제거
          const uniqueInjuries = processedInjuries.filter((injury, index, self) =>
            index === self.findIndex((i) => i.name === injury.name)
          )
          
          console.log('[InjuriesCard] Processed injuries:', uniqueInjuries)
          setInjuries(uniqueInjuries)
        } else {
          console.log('[InjuriesCard] No injuries found for team:', teamId)
        }
      } catch (error) {
        console.error('[InjuriesCard] Error fetching injuries:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInjuries()
  }, [teamId, teamName])
  
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Image
            src={`https://media.api-sports.io/football/teams/${teamId}.png`}
            alt={teamName}
            width={24}
            height={24}
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <h4 className="font-medium">{teamName}</h4>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Image
          src={`https://media.api-sports.io/football/teams/${teamId}.png`}
          alt={teamName}
          width={24}
          height={24}
          className="object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <h4 className="font-medium">{teamName}</h4>
      </div>
      
      {injuries.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            전 선수 출전 가능
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {injuries.slice(0, 5).map((injury: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
              <div className="flex items-center gap-3">
                {injury.photo && (
                  <Image
                    src={injury.photo}
                    alt={injury.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{injury.name}</p>
                  <p className="text-xs text-gray-500">
                    {injury.position || '선수'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="destructive" className="text-xs">
                  {injury.type === 'Doubtful' ? '출전 의심' :
                   injury.type === 'Injured' ? '부상' :
                   injury.type === 'Suspended' ? '출장 정지' :
                   injury.type || '부상'}
                </Badge>
                {injury.reason && injury.reason !== injury.type && (
                  <p className="text-xs text-gray-500 mt-1">
                    {injury.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {injuries.length > 5 && (
            <p className="text-xs text-gray-500 text-center">
              +{injuries.length - 5}명 추가 부상/결장
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function MatchPreviewEnhanced({ fixture }: MatchPreviewEnhancedProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const matchDate = new Date(fixture.fixture.date)
  
  return (
    <div className="space-y-6">
      {/* 경기 헤더 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* 홈팀 */}
            <div className="text-center">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={80}
                height={80}
                className="mx-auto mb-3"
              />
              <p className="font-bold">{fixture.teams.home.name}</p>
            </div>
            
            {/* 경기 시간 */}
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <p className="text-2xl font-bold">
                  {format(matchDate, 'HH:mm')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {format(matchDate, 'M월 d일', { locale: ko })}
                </p>
              </div>
              
              {/* 리그 정보 */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {fixture.league.logo && (
                  <Image
                    src={fixture.league.logo}
                    alt={fixture.league.name}
                    width={20}
                    height={20}
                  />
                )}
                <span className="text-xs text-gray-500">
                  {fixture.league.name}
                </span>
              </div>
            </div>
            
            {/* 원정팀 */}
            <div className="text-center">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={80}
                height={80}
                className="mx-auto mb-3"
              />
              <p className="font-bold">{fixture.teams.away.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="lineup">라인업</TabsTrigger>
          <TabsTrigger value="standings">순위</TabsTrigger>
          <TabsTrigger value="h2h">상대전적</TabsTrigger>
          <TabsTrigger value="info">정보</TabsTrigger>
        </TabsList>
        
        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 최근 폼 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                최근 경기 폼
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RecentForm 
                teamId={fixture.teams.home.id}
                teamName={fixture.teams.home.name}
                teamLogo={fixture.teams.home.logo}
              />
              <div className="border-t pt-4">
                <RecentForm 
                  teamId={fixture.teams.away.id}
                  teamName={fixture.teams.away.name}
                  teamLogo={fixture.teams.away.logo}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 부상/결장 선수 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">팀 소식</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InjuriesCard 
                teamId={fixture.teams.home.id}
                teamName={fixture.teams.home.name}
              />
              <div className="border-t pt-4">
                <InjuriesCard 
                  teamId={fixture.teams.away.id}
                  teamName={fixture.teams.away.name}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 순위 탭 */}
        <TabsContent value="standings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                리그 순위
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeagueStandings 
                leagueId={fixture.league.id}
                season={fixture.league.season}
                homeTeamId={fixture.teams.home.id}
                awayTeamId={fixture.teams.away.id}
                homeTeamName={fixture.teams.home.name}
                awayTeamName={fixture.teams.away.name}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 상대전적 탭 */}
        <TabsContent value="h2h" className="space-y-6">
          <H2HSimple 
            homeTeam={fixture.teams.home}
            awayTeam={fixture.teams.away}
            currentFixture={fixture}
          />
        </TabsContent>
        
        {/* 최근 라인업 탭 */}
        <TabsContent value="lineup" className="space-y-6">
          {/* 라인업 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                최근 경기 라인업
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LastMatchLineup 
                  teamId={fixture.teams.home.id}
                  teamName={fixture.teams.home.name}
                />
                <LastMatchLineup 
                  teamId={fixture.teams.away.id}
                  teamName={fixture.teams.away.name}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 부상/결장 선수 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                부상/결장 선수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InjuriesCard 
                  teamId={fixture.teams.home.id}
                  teamName={fixture.teams.home.name}
                />
                <InjuriesCard 
                  teamId={fixture.teams.away.id}
                  teamName={fixture.teams.away.name}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 정보 탭 */}
        <TabsContent value="info">
          <MatchDetailsInfo fixture={fixture} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 컴포넌트 imports
import { MatchDetailsInfo } from './match-details-info'
import { LeagueStandings } from './league-standings'
import { H2HSimple } from './h2h-simple'