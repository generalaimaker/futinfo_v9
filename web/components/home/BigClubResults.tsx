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
import { Trophy, ChevronRight, Calendar, Clock, Star, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTeamAbbreviation } from '@/lib/utils/team-abbreviations'

// 빅클럽 정의 - 각 리그별 상위 4팀
const BIG_CLUBS = {
  // 프리미어리그 빅6
  premier: {
    name: 'Premier League',
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    teams: [
      { id: 33, name: 'Manchester United' },
      { id: 40, name: 'Liverpool' },
      { id: 50, name: 'Manchester City' },
      { id: 49, name: 'Chelsea' },
      { id: 42, name: 'Arsenal' },
      { id: 47, name: 'Tottenham' }
    ]
  },
  // 라리가 상위 4팀
  laliga: {
    name: 'La Liga',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    teams: [
      { id: 541, name: 'Real Madrid' },
      { id: 529, name: 'Barcelona' },
      { id: 530, name: 'Atletico Madrid' },
      { id: 531, name: 'Sevilla' }
    ]
  },
  // 분데스리가 상위 4팀
  bundesliga: {
    name: 'Bundesliga',
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    teams: [
      { id: 157, name: 'Bayern Munich' },
      { id: 165, name: 'Borussia Dortmund' },
      { id: 168, name: 'Bayer Leverkusen' },
      { id: 173, name: 'RB Leipzig' }
    ]
  },
  // 세리에A 상위 4팀
  seriea: {
    name: 'Serie A',
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    teams: [
      { id: 496, name: 'Juventus' },
      { id: 505, name: 'Inter' },
      { id: 489, name: 'AC Milan' },
      { id: 492, name: 'Napoli' }
    ]
  },
  // 리그1 상위 4팀
  ligue1: {
    name: 'Ligue 1',
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    teams: [
      { id: 85, name: 'Paris Saint Germain' },
      { id: 81, name: 'Marseille' },
      { id: 91, name: 'Monaco' },
      { id: 79, name: 'Lille' }
    ]
  }
}

// 모든 빅클럽 ID 목록
const ALL_BIG_CLUB_IDS = Object.values(BIG_CLUBS).flatMap(league => 
  league.teams.map(team => team.id)
)

// 경기 결과 카드 컴포넌트 - Apple 스타일
function MatchResultCard({ match, isBigMatch, index }: { match: any; isBigMatch: boolean; index: number }) {
  const homeWin = match.teams.home.winner
  const awayWin = match.teams.away.winner
  
  // 팀명 약어 처리
  const homeAbbr = getTeamAbbreviation(match.teams.home.name)
  const awayAbbr = getTeamAbbreviation(match.teams.away.name)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        href={`/fixtures/${match.fixture.id}`}
        className="block"
      >
        <div className={cn(
          "group relative p-2 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-300",
          "bg-white/80 dark:bg-gray-800/40 backdrop-blur-xl",
          "border border-gray-200/50 dark:border-gray-700/30",
          "hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 dark:hover:from-orange-950/20 dark:hover:to-red-950/20",
          "hover:shadow-xl hover:shadow-orange-200/40 dark:hover:shadow-orange-900/20",
          "hover:border-orange-300/50 dark:hover:border-orange-700/30",
          "hover:-translate-y-1 hover:scale-[1.02]",
          isBigMatch && "bg-gradient-to-r from-yellow-50/90 via-white/80 to-yellow-50/90 dark:from-yellow-950/20 dark:via-gray-800/40 dark:to-yellow-950/20",
          isBigMatch && "border-yellow-400/30 dark:border-yellow-600/30"
        )}>
          {isBigMatch && (
            <div className="absolute -top-1.5 -right-1.5">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500 blur opacity-60 animate-pulse" />
                <div className="relative p-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 날짜 - 모바일에서 간소화 */}
            <div className="min-w-[45px] sm:min-w-[55px] px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                {format(new Date(match.fixture.date), 'MM.dd')}
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 text-center">종료</div>
            </div>
            
            {/* 홈팀 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end min-w-0">
              <div className="text-right min-w-0">
                <span className={cn(
                  "font-medium transition-colors sm:hidden text-xs",
                  "group-hover:text-primary",
                  homeWin && "font-bold text-green-600 dark:text-green-400"
                )}>
                  {homeAbbr}
                </span>
                <span className={cn(
                  "font-medium transition-colors hidden sm:inline text-sm truncate",
                  "group-hover:text-primary",
                  homeWin && "font-bold text-green-600 dark:text-green-400"
                )}>
                  {match.teams.home.name}
                </span>
              </div>
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 overflow-hidden flex-shrink-0">
                <Image
                  src={match.teams.home.logo}
                  alt={match.teams.home.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            {/* 스코어 */}
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-700/80 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-1 sm:gap-1.5 justify-center">
                  <span className={cn(
                    "text-sm sm:text-base font-bold",
                    homeWin ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {match.goals.home ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400">-</span>
                  <span className={cn(
                    "text-sm sm:text-base font-bold",
                    awayWin ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {match.goals.away ?? 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 원정팀 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 overflow-hidden flex-shrink-0">
                <Image
                  src={match.teams.away.logo}
                  alt={match.teams.away.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left min-w-0">
                <span className={cn(
                  "font-medium transition-colors sm:hidden text-xs",
                  "group-hover:text-primary",
                  awayWin && "font-bold text-green-600 dark:text-green-400"
                )}>
                  {awayAbbr}
                </span>
                <span className={cn(
                  "font-medium transition-colors hidden sm:inline text-sm truncate",
                  "group-hover:text-primary",
                  awayWin && "font-bold text-green-600 dark:text-green-400"
                )}>
                  {match.teams.away.name}
                </span>
              </div>
            </div>
            
            {/* 리그 표시 - 모바일에서 숨김 */}
            <div className="min-w-[20px] sm:min-w-[24px] hidden sm:block">
              {match.league.logo && (
                <div className="w-5 h-5 sm:w-6 sm:h-6 overflow-hidden">
                  <Image
                    src={match.league.logo}
                    alt={match.league.name}
                    width={24}
                    height={24}
                    className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                    title={match.league.name}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
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
        
        // 빅클럽 경기만 필터링 + 완료된 경기만 (FT, AET, PEN)
        const bigClubMatches = allMatches.filter(match => {
          const homeId = match.teams.home.id
          const awayId = match.teams.away.id
          const status = match.fixture?.status?.short
          
          // 완료된 경기만 포함 (FT: Full Time, AET: After Extra Time, PEN: Penalty)
          const isFinished = ['FT', 'AET', 'PEN'].includes(status)
          
          return isFinished && (ALL_BIG_CLUB_IDS.includes(homeId) || ALL_BIG_CLUB_IDS.includes(awayId))
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
  
  // 탭별 필터링 - 최대 10개만 표시
  const filteredMatches = useMemo(() => {
    if (activeTab === 'all') return matches.slice(0, 10)
    
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
      <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/20 via-transparent to-transparent dark:from-orange-900/10" />
        
        <div className="relative">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 blur-xl opacity-40" />
                <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                주요 경기 결과
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }
  
  if (matches.length === 0) {
    return null
  }
  
  return (
    <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/20 via-transparent to-transparent dark:from-orange-900/10" />
      
      <div className="relative">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 blur-xl opacity-40" />
                <div className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                주요 경기 결과
              </span>
            </CardTitle>
            <Link href="/fixtures">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-sm flex items-center gap-1.5 group"
              >
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">전체보기</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-3 sm:mb-4 overflow-x-auto">
              <TabsList className="w-full min-w-max h-auto p-1 sm:p-1.5 bg-gray-100/80 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl sm:rounded-2xl shadow-sm flex gap-0.5">
                <TabsTrigger 
                  value="all" 
                  className="px-2 sm:px-2.5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/30 dark:data-[state=active]:shadow-blue-500/20 transition-all duration-300 text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 data-[state=active]:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="premier" 
                  className="flex-1 px-1.5 sm:px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-purple-500/30 dark:data-[state=active]:shadow-purple-500/20 transition-all duration-300 text-[9px] sm:text-[11px] font-semibold flex items-center justify-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 data-[state=active]:text-white"
                >
                  <Image 
                    src={BIG_CLUBS.premier.logo} 
                    alt="EPL" 
                    width={14} 
                    height={14} 
                    className="object-contain flex-shrink-0"
                  />
                  <span className="whitespace-nowrap hidden sm:inline">Premier League</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="laliga" 
                  className="flex-1 px-1.5 sm:px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/30 dark:data-[state=active]:shadow-orange-500/20 transition-all duration-300 text-[9px] sm:text-[11px] font-semibold flex items-center justify-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 data-[state=active]:text-white"
                >
                  <Image 
                    src={BIG_CLUBS.laliga.logo} 
                    alt="La Liga" 
                    width={14} 
                    height={14} 
                    className="object-contain flex-shrink-0"
                  />
                  <span className="whitespace-nowrap hidden sm:inline">La Liga</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bundesliga" 
                  className="flex-1 px-1.5 sm:px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-red-500/30 dark:data-[state=active]:shadow-red-500/20 transition-all duration-300 text-[9px] sm:text-[11px] font-semibold flex items-center justify-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 data-[state=active]:text-white"
                >
                  <Image 
                    src={BIG_CLUBS.bundesliga.logo} 
                    alt="Bundesliga" 
                    width={14} 
                    height={14} 
                    className="object-contain flex-shrink-0"
                  />
                  <span className="whitespace-nowrap hidden sm:inline">Bundesliga</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="seriea" 
                  className="flex-1 px-1.5 sm:px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-600/30 dark:data-[state=active]:shadow-blue-600/20 transition-all duration-300 text-[9px] sm:text-[11px] font-semibold flex items-center justify-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 data-[state=active]:text-white"
                >
                  <Image 
                    src={BIG_CLUBS.seriea.logo} 
                    alt="Serie A" 
                    width={14} 
                    height={14} 
                    className="object-contain flex-shrink-0"
                  />
                  <span className="whitespace-nowrap hidden sm:inline">Serie A</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ligue1" 
                  className="flex-1 px-1.5 sm:px-2 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-yellow-500/30 dark:data-[state=active]:shadow-yellow-500/20 transition-all duration-300 text-[9px] sm:text-[11px] font-semibold flex items-center justify-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 data-[state=active]:text-white"
                >
                  <Image 
                    src={BIG_CLUBS.ligue1.logo} 
                    alt="Ligue 1" 
                    width={14} 
                    height={14} 
                    className="object-contain flex-shrink-0"
                  />
                  <span className="whitespace-nowrap hidden sm:inline">Ligue 1</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="mt-0">
              <AnimatePresence mode="wait">
                {filteredMatches.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {filteredMatches.map((match, index) => (
                      <MatchResultCard
                        key={match.fixture.id}
                        match={match}
                        isBigMatch={isBigMatch(match)}
                        index={index}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 blur-xl opacity-30" />
                      <div className="relative p-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                        <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">최근 경기가 없습니다</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </CardContent>
      </div>
    </Card>
  )
}