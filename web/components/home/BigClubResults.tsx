'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import footballAPIService from '@/lib/supabase/football'
import { Trophy, ChevronRight, Calendar, Clock, Star } from 'lucide-react'

// 빅클럽 정의
const BIG_CLUBS = {
  // 프리미어리그 빅6
  premier: {
    name: 'Premier League',
    teams: [
      { id: 33, name: 'Manchester United' },
      { id: 40, name: 'Liverpool' },
      { id: 50, name: 'Manchester City' },
      { id: 49, name: 'Chelsea' },
      { id: 42, name: 'Arsenal' },
      { id: 47, name: 'Tottenham' }
    ]
  },
  // 라리가 빅3
  laliga: {
    name: 'La Liga',
    teams: [
      { id: 541, name: 'Real Madrid' },
      { id: 529, name: 'Barcelona' },
      { id: 530, name: 'Atletico Madrid' }
    ]
  },
  // 분데스리가 상위 3팀
  bundesliga: {
    name: 'Bundesliga',
    teams: [
      { id: 157, name: 'Bayern Munich' },
      { id: 165, name: 'Borussia Dortmund' },
      { id: 168, name: 'Bayer Leverkusen' }
    ]
  },
  // 세리에A 상위 5팀
  seriea: {
    name: 'Serie A',
    teams: [
      { id: 496, name: 'Juventus' },
      { id: 505, name: 'Inter' },
      { id: 489, name: 'AC Milan' },
      { id: 492, name: 'Napoli' },
      { id: 497, name: 'Roma' }
    ]
  },
  // 리그1 PSG 등
  ligue1: {
    name: 'Ligue 1',
    teams: [
      { id: 85, name: 'Paris Saint Germain' },
      { id: 81, name: 'Marseille' },
      { id: 91, name: 'Monaco' }
    ]
  }
}

// 모든 빅클럽 ID 목록
const ALL_BIG_CLUB_IDS = Object.values(BIG_CLUBS).flatMap(league => 
  league.teams.map(team => team.id)
)

// 경기 결과 카드 컴포넌트
function MatchResultCard({ match, isBigMatch }: { match: any; isBigMatch: boolean }) {
  const isFinished = ['FT', 'AET', 'PEN'].includes(match.fixture.status.short)
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(match.fixture.status.short)
  const isUpcoming = ['TBD', 'NS'].includes(match.fixture.status.short)
  
  const homeWin = match.teams.home.winner
  const awayWin = match.teams.away.winner
  const isDraw = isFinished && !homeWin && !awayWin
  
  return (
    <Link
      href={`/fixtures/${match.fixture.id}`}
      className={cn(
        "block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all",
        isLive && "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900",
        isBigMatch && "ring-1 ring-yellow-400/50"
      )}
    >
      <div className="space-y-2">
        {/* 리그 & 시간 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {match.league.logo && (
              <Image
                src={match.league.logo}
                alt={match.league.name}
                width={16}
                height={16}
                className="object-contain"
              />
            )}
            <span className="text-gray-500">{match.league.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                LIVE {match.fixture.status.elapsed}'
              </Badge>
            )}
            {!isLive && (
              <span className="text-gray-500">
                {format(new Date(match.fixture.date), 'MM.dd HH:mm')}
              </span>
            )}
          </div>
        </div>
        
        {/* 팀 & 스코어 */}
        <div className="flex items-center justify-between gap-3">
          {/* 홈팀 */}
          <div className="flex items-center gap-2 flex-1">
            <Image
              src={match.teams.home.logo}
              alt={match.teams.home.name}
              width={24}
              height={24}
              className="object-contain"
            />
            <span className={cn(
              "text-sm font-medium truncate",
              homeWin && "text-green-600 dark:text-green-400 font-semibold"
            )}>
              {match.teams.home.name}
            </span>
          </div>
          
          {/* 스코어 */}
          <div className="text-center min-w-[60px]">
            {isFinished || isLive ? (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-lg font-bold",
                  homeWin && "text-green-600"
                )}>
                  {match.goals.home ?? 0}
                </span>
                <span className="text-gray-400">-</span>
                <span className={cn(
                  "text-lg font-bold",
                  awayWin && "text-green-600"
                )}>
                  {match.goals.away ?? 0}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">vs</span>
            )}
          </div>
          
          {/* 원정팀 */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className={cn(
              "text-sm font-medium truncate",
              awayWin && "text-green-600 dark:text-green-400 font-semibold"
            )}>
              {match.teams.away.name}
            </span>
            <Image
              src={match.teams.away.logo}
              alt={match.teams.away.name}
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
        </div>
        
        {/* 추가 정보 (페널티, 연장 등) */}
        {match.score.penalty.home !== null && (
          <div className="text-center text-xs text-gray-500">
            (PK {match.score.penalty.home} - {match.score.penalty.away})
          </div>
        )}
      </div>
    </Link>
  )
}

export function BigClubResults() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  
  useEffect(() => {
    const fetchBigClubMatches = async () => {
      try {
        setLoading(true)
        
        // 최근 7일간의 경기 가져오기
        const today = new Date()
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const promises = []
        
        // 날짜별로 경기 가져오기
        for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
          promises.push(
            footballAPIService.getFixturesByDate(new Date(d))
              .then(data => data.response || [])
              .catch(() => [])
          )
        }
        
        const results = await Promise.all(promises)
        const allMatches = results.flat()
        
        // 빅클럽 경기만 필터링
        const bigClubMatches = allMatches.filter(match => {
          const homeId = match.teams.home.id
          const awayId = match.teams.away.id
          return ALL_BIG_CLUB_IDS.includes(homeId) || ALL_BIG_CLUB_IDS.includes(awayId)
        })
        
        // 최신순 정렬
        bigClubMatches.sort((a, b) => 
          new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
        )
        
        setMatches(bigClubMatches)
      } catch (error) {
        console.error('Error fetching big club matches:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBigClubMatches()
  }, [])
  
  // 탭별 필터링
  const filteredMatches = useMemo(() => {
    if (activeTab === 'all') return matches.slice(0, 20)
    
    const leagueTeams = BIG_CLUBS[activeTab as keyof typeof BIG_CLUBS]?.teams.map(t => t.id) || []
    return matches.filter(match => {
      const homeId = match.teams.home.id
      const awayId = match.teams.away.id
      return leagueTeams.includes(homeId) || leagueTeams.includes(awayId)
    }).slice(0, 10)
  }, [matches, activeTab])
  
  // 빅매치 판별
  const isBigMatch = (match: any) => {
    const homeId = match.teams.home.id
    const awayId = match.teams.away.id
    
    // 같은 리그 빅클럽 간의 경기
    for (const league of Object.values(BIG_CLUBS)) {
      const teamIds = league.teams.map(t => t.id)
      if (teamIds.includes(homeId) && teamIds.includes(awayId)) {
        return true
      }
    }
    
    return false
  }
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            빅클럽 경기 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (matches.length === 0) {
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            빅클럽 경기 결과
          </CardTitle>
          <Link href="/fixtures">
            <Button variant="ghost" size="sm">
              전체보기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="premier">EPL</TabsTrigger>
            <TabsTrigger value="laliga">라리가</TabsTrigger>
            <TabsTrigger value="bundesliga">분데스</TabsTrigger>
            <TabsTrigger value="seriea">세리에A</TabsTrigger>
            <TabsTrigger value="ligue1">리그1</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredMatches.length > 0 ? (
                filteredMatches.map(match => (
                  <MatchResultCard
                    key={match.fixture.id}
                    match={match}
                    isBigMatch={isBigMatch(match)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  최근 경기가 없습니다
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}