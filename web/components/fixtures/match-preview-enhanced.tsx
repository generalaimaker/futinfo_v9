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
  ChevronRight, Star, Zap, ArrowUp, ArrowDown
} from 'lucide-react'

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
        
        // 1. 팀의 가장 최근 경기 가져오기
        const recentFixtures = await footballAPI.getTeamFixtures(teamId, 1)
        console.log('[LastMatchLineup] Recent fixtures:', recentFixtures)
        
        if (recentFixtures && recentFixtures.length > 0) {
          const lastFixture = recentFixtures[0]
          const fixtureDate = new Date(lastFixture.fixture.date)
          setLastMatchDate(format(fixtureDate, 'M월 d일', { locale: ko }))
          
          // 2. 해당 경기의 라인업 정보 가져오기
          try {
            const lineupData = await footballAPI.getFixtureLineups(lastFixture.fixture.id)
            console.log('[LastMatchLineup] Lineup data:', lineupData)
            
            if (lineupData && lineupData.length > 0) {
              // 해당 팀의 라인업 찾기
              const teamLineup = lineupData.find(
                (l: any) => l.team.id === teamId
              )
              
              if (teamLineup) {
                console.log('[LastMatchLineup] Team lineup found:', teamLineup)
                setFormation(teamLineup.formation)
                // 선발 선수만 필터링
                const startingXI = teamLineup.startXI
                setLineup(startingXI)
              } else {
                console.log('[LastMatchLineup] No lineup found for team:', teamId)
              }
            } else {
              // 라인업이 없으면 경기 상세 정보에서 찾기
              const fixtureDetails = await footballAPI.getFixtureDetails(lastFixture.fixture.id)
              console.log('[LastMatchLineup] Fixture details:', fixtureDetails)
              
              if (fixtureDetails?.lineups && fixtureDetails.lineups.length > 0) {
                const teamLineup = fixtureDetails.lineups.find(
                  (l: any) => l.team.id === teamId
                )
                
                if (teamLineup) {
                  setFormation(teamLineup.formation)
                  const startingXI = teamLineup.startXI
                  setLineup(startingXI)
                }
              }
            }
          } catch (lineupError) {
            console.error('[LastMatchLineup] Error fetching lineup:', lineupError)
          }
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
          {lineup.map((player: any, idx: number) => {
            // 간단한 그리드 배치 (실제로는 포메이션에 따라 위치 계산 필요)
            const positions = getFormationPositions(formation, idx)
            return (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${positions.x}%`,
                  top: `${positions.y}%`
                }}
              >
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-gray-800">
                    {player.player.number}
                  </span>
                </div>
                <p className="text-white text-xs mt-1 text-center font-medium whitespace-nowrap">
                  {player.player.name.split(' ').pop()}
                </p>
              </div>
            )
          })}
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

// 포메이션에 따른 선수 위치 계산 함수
function getFormationPositions(formation: string, index: number): { x: number, y: number } {
  const positions: { [key: string]: Array<{ x: number, y: number }> } = {
    '4-3-3': [
      { x: 50, y: 90 }, // GK
      { x: 20, y: 75 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 75 }, // DF
      { x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 }, // MF
      { x: 25, y: 25 }, { x: 50, y: 25 }, { x: 75, y: 25 } // FW
    ],
    '4-4-2': [
      { x: 50, y: 90 }, // GK
      { x: 20, y: 75 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 75 }, // DF
      { x: 20, y: 50 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 80, y: 50 }, // MF
      { x: 35, y: 25 }, { x: 65, y: 25 } // FW
    ],
    '4-2-3-1': [
      { x: 50, y: 90 }, // GK
      { x: 20, y: 75 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 75 }, // DF
      { x: 35, y: 60 }, { x: 65, y: 60 }, // DM
      { x: 20, y: 40 }, { x: 50, y: 40 }, { x: 80, y: 40 }, // AM
      { x: 50, y: 20 } // FW
    ],
    '3-5-2': [
      { x: 50, y: 90 }, // GK
      { x: 30, y: 75 }, { x: 50, y: 75 }, { x: 70, y: 75 }, // DF
      { x: 15, y: 50 }, { x: 35, y: 50 }, { x: 50, y: 50 }, { x: 65, y: 50 }, { x: 85, y: 50 }, // MF
      { x: 35, y: 25 }, { x: 65, y: 25 } // FW
    ],
    '5-3-2': [
      { x: 50, y: 90 }, // GK
      { x: 15, y: 75 }, { x: 35, y: 75 }, { x: 50, y: 75 }, { x: 65, y: 75 }, { x: 85, y: 75 }, // DF
      { x: 30, y: 50 }, { x: 50, y: 50 }, { x: 70, y: 50 }, // MF
      { x: 35, y: 25 }, { x: 65, y: 25 } // FW
    ],
    '3-4-3': [
      { x: 50, y: 90 }, // GK
      { x: 30, y: 75 }, { x: 50, y: 75 }, { x: 70, y: 75 }, // DF
      { x: 20, y: 50 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 80, y: 50 }, // MF
      { x: 25, y: 25 }, { x: 50, y: 25 }, { x: 75, y: 25 } // FW
    ]
  }
  
  // 포메이션이 정의되어 있으면 사용, 없으면 기본 4-3-3
  const formationPositions = positions[formation] || positions['4-3-3']
  
  // 인덱스가 범위를 벗어나면 기본 위치 반환
  if (index >= formationPositions.length) {
    return { x: 50, y: 50 }
  }
  
  return formationPositions[index]
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
        if (Array.isArray(data)) {
          setInjuries(data)
        }
      } catch (error) {
        console.error('Error fetching injuries:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchInjuries()
  }, [teamId])
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        {teamName} 부상/결장
      </h4>
      
      {injuries.length === 0 ? (
        <p className="text-sm text-gray-500">부상 선수 없음</p>
      ) : (
        <div className="space-y-2">
          {injuries.slice(0, 3).map((injury: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium">{injury.player?.name}</p>
                <p className="text-xs text-gray-500">{injury.player?.type}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {injury.player?.reason || '부상'}
              </Badge>
            </div>
          ))}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
          <TabsTrigger value="lineup">최근라인업</TabsTrigger>
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
        
        {/* 통계 탭 */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">홈팀 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamStatsCard 
                  teamId={fixture.teams.home.id}
                  teamName={fixture.teams.home.name}
                  season={fixture.league.season}
                  leagueId={fixture.league.id}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">원정팀 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamStatsCard 
                  teamId={fixture.teams.away.id}
                  teamName={fixture.teams.away.name}
                  season={fixture.league.season}
                  leagueId={fixture.league.id}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 최근 라인업 탭 */}
        <TabsContent value="lineup" className="space-y-6">
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
        </TabsContent>
        
        {/* 정보 탭 */}
        <TabsContent value="info">
          <MatchDetailsInfo fixture={fixture} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// MatchDetailsInfo import 필요
import { MatchDetailsInfo } from './match-details-info'