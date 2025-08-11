'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, 
  Tv, Filter as FilterIcon, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFixturesByDate } from '@/lib/supabase/football'
import { isLiveMatch, isFinishedMatch, FixturesResponse } from '@/lib/types/football'
import { useFixturesRealtime } from '@/hooks/useFixturesRealtime'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ko } from 'date-fns/locale'

// 리그 정보 (플래그 및 우선순위)
const LEAGUE_INFO: Record<number, { name: string, country: string, flag: string, priority: number }> = {
  39: { name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 1 },
  140: { name: 'LaLiga', country: 'Spain', flag: '🇪🇸', priority: 2 },
  135: { name: 'Serie A', country: 'Italy', flag: '🇮🇹', priority: 3 },
  78: { name: 'Bundesliga', country: 'Germany', flag: '🇩🇪', priority: 4 },
  61: { name: 'Ligue 1', country: 'France', flag: '🇫🇷', priority: 5 },
  2: { name: 'Champions League', country: 'Europe', flag: '🇪🇺', priority: 6 },
  3: { name: 'Europa League', country: 'Europe', flag: '🇪🇺', priority: 7 },
  848: { name: 'K League 1', country: 'South Korea', flag: '🇰🇷', priority: 8 },
  292: { name: 'K League 2', country: 'South Korea', flag: '🇰🇷', priority: 9 },
  253: { name: 'MLS', country: 'USA', flag: '🇺🇸', priority: 10 },
  71: { name: 'Campeonato Brasileiro', country: 'Brazil', flag: '🇧🇷', priority: 11 },
  128: { name: 'Liga Profesional', country: 'Argentina', flag: '🇦🇷', priority: 12 },
  667: { name: 'Friendlies Clubs', country: 'World', flag: '🌍', priority: 99 }
}

// 날짜 포맷
const formatDateHeader = (date: Date): string => {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  
  const dayName = format(date, 'EEEE')
  const dateStr = format(date, 'MMMM d')
  return `${dayName}, ${dateStr}`
}

// 시간 포맷 (12시간 형식)
const formatTime = (date: Date): { time: string, period: string } => {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const time = `${displayHours}:${minutes.toString().padStart(2, '0')}`
  return { time, period }
}

// 경기 아이템 컴포넌트
function FixtureItem({ fixture, showLeague = false }: { fixture: any, showLeague?: boolean }) {
  const isLive = isLiveMatch(fixture.fixture.status.short)
  const isFinished = isFinishedMatch(fixture.fixture.status.short)
  const fixtureDate = new Date(fixture.fixture.date)
  const { time, period } = formatTime(fixtureDate)
  const { preferences } = useUserPreferences()
  
  const isFavoriteMatch = 
    preferences.favoriteTeamIds.includes(fixture.teams.home.id) ||
    preferences.favoriteTeamIds.includes(fixture.teams.away.id)
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <div className={cn(
        "flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer",
        isFavoriteMatch && "bg-yellow-50/50 dark:bg-yellow-900/10"
      )}>
        {/* 시간/상태 */}
        <div className="w-14 text-center shrink-0">
          {isLive ? (
            <div className="space-y-0.5">
              <div className="text-green-600 dark:text-green-400 font-bold text-sm">
                {fixture.fixture.status.elapsed}'
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                LIVE
              </div>
            </div>
          ) : isFinished ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              FT
            </div>
          ) : fixture.fixture.status.short === 'PST' ? (
            <div className="text-red-500 text-xs font-medium">
              연기
            </div>
          ) : (
            <div>
              <div className="font-medium text-sm">{time}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{period}</div>
            </div>
          )}
        </div>
        
        {/* 팀 정보 */}
        <div className="flex-1 min-w-0 px-3">
          {/* 리그 정보 (시간순 보기에서만) */}
          {showLeague && (
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-xs">{LEAGUE_INFO[fixture.league.id]?.flag || '⚽'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {fixture.league.name}
              </span>
            </div>
          )}
          
          {/* 홈팀 */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={20}
                height={20}
                className="object-contain shrink-0"
              />
              <span className={cn(
                "text-sm truncate",
                isFinished && fixture.teams.home.winner && "font-semibold",
                isFavoriteMatch && preferences.favoriteTeamIds.includes(fixture.teams.home.id) && "text-primary"
              )}>
                {fixture.teams.home.name}
              </span>
            </div>
            {(isLive || isFinished) && (
              <span className={cn(
                "text-sm font-semibold min-w-[20px] text-right",
                isFinished && fixture.teams.home.winner && "text-black dark:text-white"
              )}>
                {fixture.goals.home ?? 0}
              </span>
            )}
          </div>
          
          {/* 원정팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={20}
                height={20}
                className="object-contain shrink-0"
              />
              <span className={cn(
                "text-sm truncate",
                isFinished && fixture.teams.away.winner && "font-semibold",
                isFavoriteMatch && preferences.favoriteTeamIds.includes(fixture.teams.away.id) && "text-primary"
              )}>
                {fixture.teams.away.name}
              </span>
            </div>
            {(isLive || isFinished) && (
              <span className={cn(
                "text-sm font-semibold min-w-[20px] text-right",
                isFinished && fixture.teams.away.winner && "text-black dark:text-white"
              )}>
                {fixture.goals.away ?? 0}
              </span>
            )}
          </div>
        </div>
        
        {/* TV/중계 아이콘 */}
        <div className="w-6 flex justify-center shrink-0">
          {/* 주요 경기에만 TV 아이콘 표시 (예시) */}
          {[39, 140, 135, 78, 61, 2, 3].includes(fixture.league.id) && (
            <Tv className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </div>
    </Link>
  )
}

// 리그 섹션 컴포넌트
function LeagueSection({ 
  league, 
  fixtures, 
  isExpanded, 
  onToggle 
}: { 
  league: any, 
  fixtures: any[], 
  isExpanded: boolean, 
  onToggle: () => void 
}) {
  const leagueInfo = LEAGUE_INFO[league.id] || { 
    name: league.name, 
    country: league.country || 'World', 
    flag: '⚽', 
    priority: 999 
  }
  
  // 라이브 경기 수
  const liveCount = fixtures.filter(f => isLiveMatch(f.fixture.status.short)).length
  
  return (
    <div className="border-b dark:border-gray-800 last:border-b-0">
      {/* 리그 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{leagueInfo.flag}</span>
          <div className="text-left">
            <div className="font-medium text-sm dark:text-gray-100">
              {leagueInfo.country} - {leagueInfo.name}
            </div>
            {liveCount > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                {liveCount} LIVE
              </div>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      
      {/* 경기 목록 */}
      {isExpanded && (
        <div className="bg-gray-50/50 dark:bg-gray-900/50">
          {fixtures.map((fixture) => (
            <FixtureItem key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FotMobStyleFixturesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'onTv' | 'byTime'>('byTime')
  const [showFilter, setShowFilter] = useState(false)
  
  const { data, isLoading, error, refetch } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }
  
  // 날짜 변경
  const changeDate = (days: number) => {
    setSelectedDate(prev => days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days)))
  }
  
  // 리그별 그룹화
  const groupedFixtures = data?.response?.reduce((acc: Record<number, any>, fixture: any) => {
    const leagueId = fixture.league.id
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: fixture.league,
        fixtures: []
      }
    }
    acc[leagueId].fixtures.push(fixture)
    return acc
  }, {}) || {}
  
  // 리그 정렬 (우선순위)
  const sortedLeagues = Object.entries(groupedFixtures)
    .sort(([aId], [bId]) => {
      const aPriority = LEAGUE_INFO[parseInt(aId)]?.priority || 999
      const bPriority = LEAGUE_INFO[parseInt(bId)]?.priority || 999
      return aPriority - bPriority
    })
  
  // 시간순 정렬된 모든 경기
  const allFixturesByTime = data?.response?.sort((a: any, b: any) => {
    return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  }) || []
  
  // TV 중계 경기만 필터링 (주요 리그)
  const tvFixtures = viewMode === 'onTv' 
    ? allFixturesByTime.filter((f: any) => [39, 140, 135, 78, 61, 2, 3, 848].includes(f.league.id))
    : allFixturesByTime
  
  // 리그 토글
  const toggleLeague = (leagueId: number) => {
    const newExpanded = new Set(expandedLeagues)
    if (newExpanded.has(leagueId)) {
      newExpanded.delete(leagueId)
    } else {
      newExpanded.add(leagueId)
    }
    setExpandedLeagues(newExpanded)
  }
  
  // 모든 리그 펼치기/접기
  const toggleAllLeagues = () => {
    if (expandedLeagues.size === sortedLeagues.length) {
      setExpandedLeagues(new Set())
    } else {
      setExpandedLeagues(new Set(sortedLeagues.map(([id]) => parseInt(id))))
    }
  }
  
  // 처음 로드시 주요 리그 자동 펼치기
  useEffect(() => {
    const majorLeagues = [39, 140, 135, 78, 61, 848, 2, 3] // 주요 리그
    const leaguesInData = Object.keys(groupedFixtures).map(id => parseInt(id))
    const leaguesToExpand = leaguesInData.filter(id => majorLeagues.includes(id))
    setExpandedLeagues(new Set(leaguesToExpand))
  }, [data])
  
  // 라이브 경기 실시간 업데이트
  const liveFixtureIds = data?.response
    ?.filter((fixture: any) => isLiveMatch(fixture.fixture.status.short))
    .map((fixture: any) => fixture.fixture.id) || []
    
  useFixturesRealtime({
    fixtureIds: liveFixtureIds,
    onUpdate: () => refetch()
  })
  
  // 통계
  const stats = {
    total: data?.response?.length || 0,
    live: data?.response?.filter((f: any) => isLiveMatch(f.fixture.status.short)).length || 0
  }
  
  return (
    <div className="min-h-screen lg:ml-64 bg-white dark:bg-gray-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(-1)}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <button className="flex items-center gap-2 font-medium text-sm sm:text-base">
            <Calendar className="h-4 w-4 text-gray-500" />
            {formatDateHeader(selectedDate)}
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(1)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* 뷰 모드 탭 */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex gap-6">
            <button
              onClick={() => setViewMode('onTv')}
              className={cn(
                "text-sm font-medium pb-2 border-b-2 transition-colors",
                viewMode === 'onTv' 
                  ? "text-primary border-primary" 
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              On TV
            </button>
            <button
              onClick={() => setViewMode('byTime')}
              className={cn(
                "text-sm font-medium pb-2 border-b-2 transition-colors",
                viewMode === 'byTime' 
                  ? "text-primary border-primary" 
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              By time
            </button>
          </div>
          
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
        
        {/* 통계 바 */}
        {stats.total > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                Total: <span className="font-medium text-gray-900 dark:text-gray-100">{stats.total}</span>
              </span>
              {stats.live > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  Live: <span className="font-medium">{stats.live}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 컨텐츠 */}
      <div className="pb-20">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>경기 정보를 불러올 수 없습니다</p>
            <Button onClick={() => refetch()} className="mt-4">
              다시 시도
            </Button>
          </div>
        ) : tvFixtures.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium mb-2">예정된 경기가 없습니다</p>
            <p className="text-sm">다른 날짜를 선택해보세요</p>
          </div>
        ) : (
          <>
            {viewMode === 'byTime' ? (
              // 시간순 보기
              <div>
                {tvFixtures.map((fixture: any) => (
                  <FixtureItem key={fixture.fixture.id} fixture={fixture} showLeague={true} />
                ))}
              </div>
            ) : (
              // On TV (리그별 보기)
              <>
                {/* 전체 펼치기/접기 버튼 */}
                {sortedLeagues.length > 1 && (
                  <div className="px-4 py-2 border-b dark:border-gray-800">
                    <button
                      onClick={toggleAllLeagues}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {expandedLeagues.size === sortedLeagues.length ? 'Collapse all' : 'Expand all'}
                    </button>
                  </div>
                )}
                
                {/* 리그별 섹션 */}
                {sortedLeagues
                  .filter(([leagueId]) => 
                    viewMode === 'onTv' ? [39, 140, 135, 78, 61, 2, 3, 848].includes(parseInt(leagueId)) : true
                  )
                  .map(([leagueId, data]) => (
                    <LeagueSection
                      key={leagueId}
                      league={data.league}
                      fixtures={data.fixtures}
                      isExpanded={expandedLeagues.has(parseInt(leagueId))}
                      onToggle={() => toggleLeague(parseInt(leagueId))}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}