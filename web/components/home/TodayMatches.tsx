'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, ChevronRight, Calendar, Filter,
  Activity, Tv, Clock, Trophy, Star, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { formatMatchTime } from '@/lib/utils/timezone'
import { getTeamAbbreviation } from '@/lib/utils/team-abbreviations'
import { getLeagueAbbreviation } from '@/lib/utils/league-abbreviations'

interface MatchData {
  fixture: any
  teams: any
  goals: any
  league: any
  score?: any
}

interface TodayMatchesProps {
  initialMatches?: MatchData[]
  onDateChange?: (date: Date) => void
}

// 경기 카드 컴포넌트 - Apple 스타일
function MatchCard({ match, index }: { match: any; index: number }) {
  const isLive = match.fixture?.status?.short === '1H' || 
                 match.fixture?.status?.short === '2H' || 
                 match.fixture?.status?.short === 'HT' ||
                 match.fixture?.status?.short === 'ET' ||
                 match.fixture?.status?.short === 'BT'
  const isFinished = match.fixture?.status?.short === 'FT' || 
                     match.fixture?.status?.short === 'AET' || 
                     match.fixture?.status?.short === 'PEN'
  // 사용자 위치 기반 시간 표시
  const matchTime = formatMatchTime(match.fixture.date)
  
  // 팀명 약어 처리
  const homeAbbr = getTeamAbbreviation(match.teams.home.name)
  const awayAbbr = getTeamAbbreviation(match.teams.away.name)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link 
        href={`/fixtures/${match.fixture.id}`}
        className="block"
      >
        <div className={cn(
          "group relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300",
          "bg-white/80 dark:bg-gray-800/40 backdrop-blur-xl",
          "border border-gray-200/50 dark:border-gray-700/30",
          "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20",
          "hover:shadow-xl hover:shadow-blue-200/40 dark:hover:shadow-blue-900/20",
          "hover:border-blue-300/50 dark:hover:border-blue-700/30",
          "hover:-translate-y-1 hover:scale-[1.02]",
          isLive && "bg-gradient-to-r from-green-50/90 via-white/80 to-green-50/90 dark:from-green-950/30 dark:via-gray-800/40 dark:to-green-950/30",
          isLive && "border-green-400/30 dark:border-green-600/30"
        )}>
          {/* Live 인디케이터 */}
          {isLive && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-md opacity-60 animate-pulse" />
                <Badge className="relative bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2.5 py-0.5 font-semibold shadow-md">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE {match.fixture.status.elapsed}'
                  </span>
                </Badge>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 홈팀 - 오른쪽 정렬 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end min-w-0">
              <div className="text-right min-w-0">
                <p className={cn(
                  "font-semibold sm:hidden text-xs",
                  "group-hover:text-primary transition-colors",
                  isFinished && match.teams.home.winner && "text-green-600 dark:text-green-400"
                )}>
                  {homeAbbr}
                </p>
                <p className={cn(
                  "font-semibold hidden sm:block text-sm truncate",
                  "group-hover:text-primary transition-colors",
                  isFinished && match.teams.home.winner && "text-green-600 dark:text-green-400"
                )}>
                  {match.teams.home.name}
                </p>
              </div>
              <div className="relative w-7 h-7 sm:w-9 sm:h-9 overflow-hidden flex-shrink-0">
                <Image
                  src={match.teams.home.logo}
                  alt={match.teams.home.name}
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            {/* 스코어/시간 - 중앙 */}
            <div className="flex-shrink-0">
              {isFinished || isLive ? (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-700/80 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                    <span className={cn(
                      "text-sm sm:text-base font-bold",
                      match.teams.home.winner ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                    )}>
                      {match.goals.home ?? 0}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-400">-</span>
                    <span className={cn(
                      "text-sm sm:text-base font-bold",
                      match.teams.away.winner ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                    )}>
                      {match.goals.away ?? 0}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-700/80 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-[11px] sm:text-sm font-semibold text-gray-700 dark:text-gray-300 text-center whitespace-nowrap">
                    {matchTime}
                  </p>
                </div>
              )}
            </div>
            
            {/* 원정팀 - 왼쪽 정렬 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <div className="relative w-7 h-7 sm:w-9 sm:h-9 overflow-hidden flex-shrink-0">
                <Image
                  src={match.teams.away.logo}
                  alt={match.teams.away.name}
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left min-w-0">
                <p className={cn(
                  "font-semibold sm:hidden text-xs",
                  "group-hover:text-primary transition-colors",
                  isFinished && match.teams.away.winner && "text-green-600 dark:text-green-400"
                )}>
                  {awayAbbr}
                </p>
                <p className={cn(
                  "font-semibold hidden sm:block text-sm truncate",
                  "group-hover:text-primary transition-colors",
                  isFinished && match.teams.away.winner && "text-green-600 dark:text-green-400"
                )}>
                  {match.teams.away.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function TodayMatches({ initialMatches = [], onDateChange }: TodayMatchesProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [matches, setMatches] = useState<MatchData[]>(initialMatches)
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'scheduled'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set())

  // 날짜 변경 핸들러
  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setIsLoading(true)
    onDateChange?.(date)
    // 로딩 상태를 빠르게 해제
    setTimeout(() => setIsLoading(false), 300)
  }

  // 리그 접기/펼치기 토글
  const toggleLeague = (leagueKey: string) => {
    setCollapsedLeagues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leagueKey)) {
        newSet.delete(leagueKey)
      } else {
        newSet.add(leagueKey)
      }
      return newSet
    })
  }

  // 이전/다음 날짜 이동
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = addDays(selectedDate, direction === 'next' ? 1 : -1)
    handleDateChange(newDate)
  }

  // 오늘로 이동
  const goToToday = () => {
    handleDateChange(new Date())
  }

  // 날짜 포맷팅
  const formatDateHeader = (date: Date) => {
    const today = new Date()
    
    if (isSameDay(date, today)) {
      return '오늘'
    } else if (isSameDay(date, addDays(today, -1))) {
      return '어제'
    } else if (isSameDay(date, addDays(today, 1))) {
      return '내일'
    }
    
    return format(date, 'M월 d일 (EEE)', { locale: ko })
  }

  // 리그별로 경기 그룹화
  const matchesByLeague = useMemo(() => {
    const grouped: Record<string, MatchData[]> = {}
    
    const filteredMatches = matches.filter(match => {
      // K리그 2 제외 (league id: 293)
      if (match.league.id === 293) {
        return false
      }
      
      const status = match.fixture?.status?.short
      
      if (filter === 'ongoing') {
        return ['LIVE', '1H', '2H', 'HT', 'ET', 'P'].includes(status)
      } else if (filter === 'scheduled') {
        return status === 'NS' || status === 'TBD'
      }
      
      return true // 'all'
    })
    
    filteredMatches.forEach(match => {
      const leagueKey = `${match.league.id}_${match.league.name}`
      if (!grouped[leagueKey]) {
        grouped[leagueKey] = []
      }
      grouped[leagueKey].push(match)
    })
    
    // 각 리그 내에서 시간순 정렬
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        // 진행 중인 경기 우선
        const aLive = ['LIVE', '1H', '2H', 'HT'].includes(a.fixture?.status?.short)
        const bLive = ['LIVE', '1H', '2H', 'HT'].includes(b.fixture?.status?.short)
        
        if (aLive && !bLive) return -1
        if (!aLive && bLive) return 1
        
        // 시간순 정렬
        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
      })
    })
    
    return grouped
  }, [matches, filter])

  // 주요 리그 우선순위
  const LEAGUE_PRIORITY: Record<number, number> = {
    2: 1,    // Champions League
    3: 2,    // Europa League
    848: 3,  // Conference League
    39: 10,  // Premier League
    140: 11, // La Liga
    135: 12, // Serie A
    78: 13,  // Bundesliga
    61: 14,  // Ligue 1
    292: 20, // K League 1
  }

  // 리그 정렬
  const sortedLeagues = Object.keys(matchesByLeague).sort((a, b) => {
    const aId = parseInt(a.split('_')[0])
    const bId = parseInt(b.split('_')[0])
    
    const aPriority = LEAGUE_PRIORITY[aId] || 999
    const bPriority = LEAGUE_PRIORITY[bId] || 999
    
    return aPriority - bPriority
  })

  // initialMatches 업데이트 시 matches 상태 업데이트
  useEffect(() => {
    setMatches(initialMatches)
  }, [initialMatches])

  return (
    <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10" />
      
      <div className="relative">
        {/* 헤더 */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 blur-xl opacity-40" />
                <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                경기 일정
              </h2>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">로딩중...</span>
              </div>
            )}
          </div>
        </div>

        {/* 날짜 네비게이션 - Apple 스타일 */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateDate('prev')}
              className="p-2.5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            
            <motion.div 
              key={selectedDate.toISOString()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800/80 dark:to-gray-700/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
            >
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {formatDateHeader(selectedDate)}
              </h3>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateDate('next')}
              className="p-2.5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>


        {/* 경기 목록 */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-16"
              >
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse" />
                    <div className="relative w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mx-auto" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">경기 정보를 불러오는 중...</p>
                </div>
              </motion.div>
            ) : sortedLeagues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 blur-xl opacity-30" />
                  <div className="relative p-5 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">선택한 날짜에 경기가 없습니다</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">다른 날짜를 선택해 주세요</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {sortedLeagues.map((leagueKey, leagueIndex) => {
                  const [leagueId, ...leagueNameParts] = leagueKey.split('_')
                  const leagueName = leagueNameParts.join('_')
                  const leagueAbbr = getLeagueAbbreviation(leagueName)
                  const leagueMatches = matchesByLeague[leagueKey]
                  const firstMatch = leagueMatches[0]
                  const isCollapsed = collapsedLeagues.has(leagueKey)
                  
                  return (
                    <motion.div
                      key={leagueKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: leagueIndex * 0.05 }}
                      className="bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* 리그 헤더 - 카드 내부 헤더로 변경 */}
                      <motion.button
                        whileHover={{ scale: 1.002 }}
                        whileTap={{ scale: 0.998 }}
                        onClick={() => toggleLeague(leagueKey)}
                        className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-800/90 dark:to-gray-750/90 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30 hover:from-gray-100/90 hover:to-gray-150/90 dark:hover:from-gray-750/90 dark:hover:to-gray-700/90 transition-all group"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3.5">
                          {firstMatch.league.logo && (
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden">
                              <Image
                                src={firstMatch.league.logo}
                                alt={leagueName}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 sm:hidden">
                                {leagueAbbr}
                              </span>
                              <span className="font-bold text-base text-gray-900 dark:text-gray-100 hidden sm:block">
                                {leagueName}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {leagueMatches.filter(m => ['LIVE', '1H', '2H', 'HT'].includes(m.fixture?.status?.short)).length > 0 && (
                                <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                  {leagueMatches.filter(m => ['LIVE', '1H', '2H', 'HT'].includes(m.fixture?.status?.short)).length} LIVE
                                </span>
                              )}
                            </span>
                          </div>
                          <Badge className="ml-1 sm:ml-2 px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/30">
                            {leagueMatches.length}
                          </Badge>
                        </div>
                        <motion.div
                          animate={{ rotate: isCollapsed ? 0 : 180 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="p-2 rounded-xl bg-gray-100/50 dark:bg-gray-700/30 group-hover:bg-gray-200/50 dark:group-hover:bg-gray-600/30"
                        >
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </motion.div>
                      </motion.button>
                      
                      {/* 경기 목록 - 카드 내부 컨텐츠로 변경 */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/20 dark:to-gray-800/10">
                              {leagueMatches.map((match, index) => (
                                <MatchCard key={match.fixture.id} match={match} index={index} />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}