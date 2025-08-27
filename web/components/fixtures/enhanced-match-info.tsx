'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MapPin, Calendar, Clock, Users, Trophy, TrendingUp, 
  Shield, Activity, AlertTriangle, Tv, Cloud, Wind,
  Target, BarChart3, UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { extendedFootballService } from '@/lib/supabase/football-extended'
import { useQuery } from '@tanstack/react-query'

interface EnhancedMatchInfoProps {
  fixture: any
}

// 포메이션 시각화 컴포넌트
function FormationDisplay({ formation, players, teamColor }: any) {
  if (!formation || !players) return null
  
  const rows = formation.split('-').map(Number)
  
  return (
    <div className="relative bg-gradient-to-b from-green-500/10 to-green-600/5 rounded-lg p-4 min-h-[300px]">
      {/* 골키퍼 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold",
          "bg-white dark:bg-gray-800 shadow-md",
          teamColor === 'home' ? 'text-blue-500 border-2 border-blue-500' : 'text-red-500 border-2 border-red-500'
        )}>
          GK
        </div>
      </div>
      
      {/* 필드 플레이어 */}
      {rows.map((count, rowIndex) => (
        <div 
          key={rowIndex}
          className="absolute left-0 right-0 flex justify-around"
          style={{ 
            bottom: `${25 + (rowIndex + 1) * (65 / rows.length)}%`
          }}
        >
          {Array.from({ length: count }).map((_, playerIndex) => (
            <div 
              key={playerIndex}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold",
                "bg-white dark:bg-gray-800 shadow-md",
                teamColor === 'home' ? 'text-blue-500 border-2 border-blue-500' : 'text-red-500 border-2 border-red-500'
              )}
            >
              {playerIndex + 1}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// 최근 경기 폼 표시
function TeamFormDisplay({ form, teamName }: { form: string[], teamName: string }) {
  return (
    <div className="flex items-center gap-1">
      {form.map((result, idx) => (
        <div
          key={idx}
          className={cn(
            "w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center",
            result === 'W' && "bg-green-500 text-white",
            result === 'D' && "bg-gray-400 text-white",
            result === 'L' && "bg-red-500 text-white"
          )}
        >
          {result}
        </div>
      ))}
    </div>
  )
}

export function EnhancedMatchInfo({ fixture }: EnhancedMatchInfoProps) {
  const fixtureDate = new Date(fixture.fixture.date)
  const homeTeamId = fixture.teams.home.id
  const awayTeamId = fixture.teams.away.id
  const leagueId = fixture.league.id
  const season = fixture.league.season
  
  // 최근 5경기 데이터 가져오기
  const { data: homeLastFixtures, isLoading: homeLoading } = useQuery({
    queryKey: ['teamLastFixtures', homeTeamId],
    queryFn: () => extendedFootballService.getTeamLastFixtures(homeTeamId, 5),
    staleTime: 5 * 60 * 1000
  })
  
  const { data: awayLastFixtures, isLoading: awayLoading } = useQuery({
    queryKey: ['teamLastFixtures', awayTeamId],
    queryFn: () => extendedFootballService.getTeamLastFixtures(awayTeamId, 5),
    staleTime: 5 * 60 * 1000
  })
  
  // H2H 상대전적 가져오기
  const { data: h2hData, isLoading: h2hLoading } = useQuery({
    queryKey: ['h2h', homeTeamId, awayTeamId],
    queryFn: () => extendedFootballService.getH2H({ team1Id: homeTeamId, team2Id: awayTeamId }),
    staleTime: 10 * 60 * 1000
  })
  
  // 팀 순위 가져오기
  const { data: homeStanding } = useQuery({
    queryKey: ['teamStanding', homeTeamId, leagueId, season],
    queryFn: () => extendedFootballService.getTeamStanding(homeTeamId, leagueId, season),
    staleTime: 30 * 60 * 1000
  })
  
  const { data: awayStanding } = useQuery({
    queryKey: ['teamStanding', awayTeamId, leagueId, season],
    queryFn: () => extendedFootballService.getTeamStanding(awayTeamId, leagueId, season),
    staleTime: 30 * 60 * 1000
  })
  
  // 라인업 가져오기
  const { data: lineups } = useQuery({
    queryKey: ['lineups', fixture.fixture.id],
    queryFn: () => extendedFootballService.getFixtureLineups(fixture.fixture.id),
    staleTime: 5 * 60 * 1000,
    enabled: fixture.fixture.status.short === 'NS' // 예정된 경기만
  })
  
  // 팀 폼 계산
  const homeForm = homeLastFixtures?.response 
    ? extendedFootballService.calculateTeamForm(homeLastFixtures.response, homeTeamId)
    : []
  
  const awayForm = awayLastFixtures?.response
    ? extendedFootballService.calculateTeamForm(awayLastFixtures.response, awayTeamId)
    : []
  
  // H2H 통계 계산
  const h2hStats = {
    homeWins: 0,
    draws: 0,
    awayWins: 0,
    matches: h2hData?.response || []
  }
  
  h2hData?.response?.forEach((match: any) => {
    if (match.teams.home.winner === true) {
      if (match.teams.home.id === homeTeamId) h2hStats.homeWins++
      else h2hStats.awayWins++
    } else if (match.teams.away.winner === true) {
      if (match.teams.away.id === homeTeamId) h2hStats.homeWins++
      else h2hStats.awayWins++
    } else {
      h2hStats.draws++
    }
  })
  
  return (
    <div className="space-y-6">
      {/* 경기 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            경기 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 날짜 및 시간 */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {format(fixtureDate, 'yyyy년 M월 d일 EEEE', { locale: ko })}
                </div>
                <div className="text-sm text-muted-foreground">
                  킥오프: {format(fixtureDate, 'HH:mm')}
                </div>
              </div>
            </div>
            
            {/* 경기장 */}
            {fixture.fixture.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{fixture.fixture.venue.name}</div>
                  {fixture.fixture.venue.city && (
                    <div className="text-sm text-muted-foreground">{fixture.fixture.venue.city}</div>
                  )}
                  {fixture.fixture.venue.capacity && (
                    <div className="text-sm text-muted-foreground">
                      수용인원: {fixture.fixture.venue.capacity.toLocaleString()}명
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 대회 정보 */}
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{fixture.league.name}</div>
                {fixture.league.round && (
                  <div className="text-sm text-muted-foreground">{fixture.league.round}</div>
                )}
              </div>
            </div>
            
            {/* 주심 */}
            {fixture.fixture.referee && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">주심</div>
                  <div className="text-sm text-muted-foreground">{fixture.fixture.referee}</div>
                </div>
              </div>
            )}
            
            {/* 중계 정보 */}
            <div className="flex items-start gap-3">
              <Tv className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">중계 방송</div>
                <div className="text-sm text-muted-foreground">
                  SPOTV, Coupang Play (예정)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 최근 5경기 폼 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            최근 5경기 폼
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 홈팀 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Image
                    src={fixture.teams.home.logo}
                    alt={fixture.teams.home.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.home.name}</span>
                </div>
                {homeLoading ? (
                  <Skeleton className="h-7 w-40" />
                ) : (
                  <TeamFormDisplay form={homeForm} teamName={fixture.teams.home.name} />
                )}
              </div>
              
              {/* 최근 경기 상세 */}
              {!homeLoading && homeLastFixtures?.response && (
                <div className="space-y-2 text-sm">
                  {homeLastFixtures.response.slice(0, 3).map((match: any, idx: number) => {
                    const isHome = match.teams.home.id === homeTeamId
                    const opponent = isHome ? match.teams.away : match.teams.home
                    const goalsFor = isHome ? match.goals.home : match.goals.away
                    const goalsAgainst = isHome ? match.goals.away : match.goals.home
                    const result = goalsFor > goalsAgainst ? '승' : goalsFor < goalsAgainst ? '패' : '무'
                    
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-muted-foreground">
                          {isHome ? 'vs' : '@'} {opponent.name}
                        </span>
                        <span className={cn(
                          "font-medium",
                          result === '승' && "text-green-600",
                          result === '패' && "text-red-600"
                        )}>
                          {goalsFor}-{goalsAgainst} {result}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* 원정팀 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Image
                    src={fixture.teams.away.logo}
                    alt={fixture.teams.away.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.away.name}</span>
                </div>
                {awayLoading ? (
                  <Skeleton className="h-7 w-40" />
                ) : (
                  <TeamFormDisplay form={awayForm} teamName={fixture.teams.away.name} />
                )}
              </div>
              
              {/* 최근 경기 상세 */}
              {!awayLoading && awayLastFixtures?.response && (
                <div className="space-y-2 text-sm">
                  {awayLastFixtures.response.slice(0, 3).map((match: any, idx: number) => {
                    const isHome = match.teams.home.id === awayTeamId
                    const opponent = isHome ? match.teams.away : match.teams.home
                    const goalsFor = isHome ? match.goals.home : match.goals.away
                    const goalsAgainst = isHome ? match.goals.away : match.goals.home
                    const result = goalsFor > goalsAgainst ? '승' : goalsFor < goalsAgainst ? '패' : '무'
                    
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-muted-foreground">
                          {isHome ? 'vs' : '@'} {opponent.name}
                        </span>
                        <span className={cn(
                          "font-medium",
                          result === '승' && "text-green-600",
                          result === '패' && "text-red-600"
                        )}>
                          {goalsFor}-{goalsAgainst} {result}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 현재 순위 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            현재 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* 홈팀 순위 */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              {homeStanding ? (
                <>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {homeStanding.standing?.rank || '-'}위
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium">{fixture.teams.home.name}</div>
                    <div className="mt-1">승점 {homeStanding.standing?.points || 0}</div>
                    <div className="text-xs mt-1">
                      {homeStanding.standing?.all?.win || 0}승 {homeStanding.standing?.all?.draw || 0}무 {homeStanding.standing?.all?.lose || 0}패
                    </div>
                  </div>
                </>
              ) : (
                <Skeleton className="h-20 w-full" />
              )}
            </div>
            
            {/* 원정팀 순위 */}
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {awayStanding ? (
                <>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {awayStanding.standing?.rank || '-'}위
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium">{fixture.teams.away.name}</div>
                    <div className="mt-1">승점 {awayStanding.standing?.points || 0}</div>
                    <div className="text-xs mt-1">
                      {awayStanding.standing?.all?.win || 0}승 {awayStanding.standing?.all?.draw || 0}무 {awayStanding.standing?.all?.lose || 0}패
                    </div>
                  </div>
                </>
              ) : (
                <Skeleton className="h-20 w-full" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 상대전적 (H2H) */}
      {h2hData && h2hStats.matches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              상대전적 (최근 {h2hStats.matches.length}경기)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 전적 요약 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {h2hStats.homeWins}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fixture.teams.home.name} 승
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {h2hStats.draws}
                </div>
                <div className="text-xs text-muted-foreground">무승부</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {h2hStats.awayWins}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fixture.teams.away.name} 승
                </div>
              </div>
            </div>
            
            {/* 최근 맞대결 상세 */}
            <div className="space-y-2">
              {h2hStats.matches.slice(0, 5).map((match: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {format(new Date(match.fixture.date), 'yyyy.MM.dd')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {match.league.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      match.teams.home.winner && "font-bold"
                    )}>
                      {match.teams.home.name}
                    </span>
                    <span className="font-bold">
                      {match.goals.home} - {match.goals.away}
                    </span>
                    <span className={cn(
                      match.teams.away.winner && "font-bold"
                    )}>
                      {match.teams.away.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 예상 라인업 */}
      {lineups?.response && lineups.response.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              예상 라인업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* 홈팀 포메이션 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Image
                    src={fixture.teams.home.logo}
                    alt={fixture.teams.home.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.home.name}</span>
                  <Badge variant="outline">{lineups.response[0]?.formation || '4-3-3'}</Badge>
                </div>
                <FormationDisplay 
                  formation={lineups.response[0]?.formation}
                  players={lineups.response[0]?.startXI}
                  teamColor="home"
                />
              </div>
              
              {/* 원정팀 포메이션 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Image
                    src={fixture.teams.away.logo}
                    alt={fixture.teams.away.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.away.name}</span>
                  <Badge variant="outline">{lineups.response[1]?.formation || '4-3-3'}</Badge>
                </div>
                <FormationDisplay 
                  formation={lineups.response[1]?.formation}
                  players={lineups.response[1]?.startXI}
                  teamColor="away"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 팀 뉴스 / 부상자 정보 (추후 구현) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            팀 뉴스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            부상자 및 출장정지 정보는 추후 업데이트 예정입니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}