'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, 
  Tv, Filter as FilterIcon, Calendar, Clock, 
  Activity, TrendingUp, Star, Zap, Eye, EyeOff,
  Timer, ListFilter
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
import { ko, enUS } from 'date-fns/locale'

// 리그 정보 (플래그 및 우선순위)
const LEAGUE_INFO: Record<number, { name: string, country: string, flag: string, priority: number, color: string }> = {
  // 주요 리그
  39: { name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 1, color: 'from-purple-500/10 to-purple-600/10' },
  140: { name: 'LaLiga', country: 'Spain', flag: '🇪🇸', priority: 2, color: 'from-orange-500/10 to-red-600/10' },
  135: { name: 'Serie A', country: 'Italy', flag: '🇮🇹', priority: 3, color: 'from-blue-500/10 to-blue-600/10' },
  78: { name: 'Bundesliga', country: 'Germany', flag: '🇩🇪', priority: 4, color: 'from-red-500/10 to-gray-600/10' },
  61: { name: 'Ligue 1', country: 'France', flag: '🇫🇷', priority: 5, color: 'from-blue-400/10 to-red-400/10' },
  
  // 유럽 대회
  2: { name: 'Champions League', country: 'Europe', flag: '🇪🇺', priority: 6, color: 'from-indigo-500/10 to-indigo-600/10' },
  3: { name: 'Europa League', country: 'Europe', flag: '🇪🇺', priority: 7, color: 'from-orange-400/10 to-orange-500/10' },
  848: { name: 'Conference League', country: 'Europe', flag: '🇪🇺', priority: 8, color: 'from-green-400/10 to-green-500/10' },
  
  // 한국 리그
  292: { name: 'K League 1', country: 'South Korea', flag: '🇰🇷', priority: 9, color: 'from-red-500/10 to-blue-500/10' },
  293: { name: 'K League 2', country: 'South Korea', flag: '🇰🇷', priority: 10, color: 'from-red-400/10 to-blue-400/10' },
  
  // 기타 주요 리그
  253: { name: 'Major League Soccer', country: 'United States', flag: '🇺🇸', priority: 11, color: 'from-blue-500/10 to-red-500/10' },
  307: { name: 'Pro League', country: 'Saudi Arabia', flag: '🇸🇦', priority: 12, color: 'from-green-500/10 to-white/10' },
  94: { name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹', priority: 13, color: 'from-green-500/10 to-red-500/10' },
  88: { name: 'Eredivisie', country: 'Netherlands', flag: '🇳🇱', priority: 14, color: 'from-orange-500/10 to-orange-600/10' },
  203: { name: 'Süper Lig', country: 'Turkey', flag: '🇹🇷', priority: 15, color: 'from-red-500/10 to-red-600/10' },
  71: { name: 'Campeonato Brasileiro', country: 'Brazil', flag: '🇧🇷', priority: 16, color: 'from-green-500/10 to-yellow-500/10' },
  128: { name: 'Liga Profesional', country: 'Argentina', flag: '🇦🇷', priority: 17, color: 'from-sky-400/10 to-sky-500/10' },
  
  // 컵 대회
  45: { name: 'FA Cup', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 20, color: 'from-red-500/10 to-white/10' },
  48: { name: 'EFL Cup', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 21, color: 'from-blue-500/10 to-white/10' },
  143: { name: 'Copa del Rey', country: 'Spain', flag: '🇪🇸', priority: 22, color: 'from-purple-500/10 to-white/10' },
  137: { name: 'Coppa Italia', country: 'Italy', flag: '🇮🇹', priority: 23, color: 'from-green-500/10 to-white/10' },
  81: { name: 'DFB Pokal', country: 'Germany', flag: '🇩🇪', priority: 24, color: 'from-black/10 to-white/10' },
  66: { name: 'Coupe de France', country: 'France', flag: '🇫🇷', priority: 25, color: 'from-blue-500/10 to-white/10' },
  
  // 친선경기
  667: { name: 'Friendlies Clubs', country: 'World', flag: '🌍', priority: 99, color: 'from-gray-400/10 to-gray-500/10' }
}

// 날짜 포맷
const formatDateHeader = (date: Date): string => {
  const dayOfWeek = format(date, 'EEEE', { locale: enUS })
  const monthDay = format(date, 'MMMM d', { locale: enUS })
  
  if (isToday(date)) return `Today, ${monthDay}`
  if (isTomorrow(date)) return `Tomorrow, ${monthDay}`
  if (isYesterday(date)) return `Yesterday, ${monthDay}`
  
  return `${dayOfWeek}, ${monthDay}`
}

// 시간 포맷
const formatTime = (date: Date): string => {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')}\n${period}`
}

// 모던한 경기 카드 컴포넌트
function ModernMatchCard({ fixture }: { fixture: any }) {
  const isLive = isLiveMatch(fixture.fixture.status.short)
  const isFinished = isFinishedMatch(fixture.fixture.status.short)
  const fixtureDate = new Date(fixture.fixture.date)
  const time = formatTime(fixtureDate)
  const { preferences } = useUserPreferences()
  
  const isFavoriteMatch = 
    preferences?.favoriteTeamIds?.includes(fixture.teams.home.id) ||
    preferences?.favoriteTeamIds?.includes(fixture.teams.away.id)
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <div className={cn(
        "flex items-center justify-between px-4 py-4 transition-all cursor-pointer relative",
        "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20",
        "hover:scale-[1.01] hover:px-5",
        isFavoriteMatch && "bg-gradient-to-r from-yellow-50/30 via-transparent to-transparent dark:from-yellow-900/10"
      )}>
        {/* 즐겨찾기 인디케이터 */}
        {isFavoriteMatch && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500" />
        )}
        
        {/* 홈팀 - 오른쪽 정렬 */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <p className={cn(
            "text-sm font-medium truncate",
            isFinished && fixture.teams.home.winner && "text-gray-900 dark:text-white font-semibold",
            isFinished && !fixture.teams.home.winner && "text-gray-400 dark:text-gray-500",
            !isFinished && "text-gray-700 dark:text-gray-300"
          )}>
            {fixture.teams.home.name}
          </p>
          <div className="w-9 h-9 flex-shrink-0 overflow-hidden">
            <Image
              src={fixture.teams.home.logo}
              alt={fixture.teams.home.name}
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* 시간/스코어 - 중앙 */}
        <div className="px-3 min-w-[75px]">
          {isLive ? (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-1 border border-green-200/50 dark:border-green-700/30">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {fixture.goals.home ?? 0}
                </span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 animate-pulse">
                    {fixture.fixture.status.elapsed}'
                  </span>
                </div>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {fixture.goals.away ?? 0}
                </span>
              </div>
            </div>
          ) : isFinished ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-center gap-2">
                <span className={cn(
                  "text-lg font-bold",
                  fixture.teams.home.winner ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
                )}>
                  {fixture.goals.home ?? 0}
                </span>
                <span className="text-xs text-gray-400">:</span>
                <span className={cn(
                  "text-lg font-bold",
                  fixture.teams.away.winner ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
                )}>
                  {fixture.goals.away ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1.5 border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center whitespace-nowrap">
                {time}
              </p>
            </div>
          )}
        </div>
        
        {/* 원정팀 - 왼쪽 정렬 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 overflow-hidden">
            <Image
              src={fixture.teams.away.logo}
              alt={fixture.teams.away.name}
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
          <p className={cn(
            "text-sm font-medium truncate",
            isFinished && fixture.teams.away.winner && "text-gray-900 dark:text-white font-semibold",
            isFinished && !fixture.teams.away.winner && "text-gray-400 dark:text-gray-500",
            !isFinished && "text-gray-700 dark:text-gray-300"
          )}>
            {fixture.teams.away.name}
          </p>
        </div>
      </div>
    </Link>
  )
}

// 리그 그룹 컴포넌트 (애플 스타일)
function AppleStyleLeagueGroup({ 
  leagueId, 
  leagueName, 
  fixtures,
  defaultExpanded = false 
}: { 
  leagueId: number
  leagueName: string
  fixtures: any[]
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const leagueInfo = LEAGUE_INFO[leagueId]
  const liveCount = fixtures.filter(f => isLiveMatch(f.fixture.status.short)).length
  
  return (
    <div className="mb-6 bg-white/60 dark:bg-gray-800/30 rounded-2xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* 리그 헤더 - 카드 내부 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-800/90 dark:to-gray-750/90 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30 hover:from-gray-100/90 hover:to-gray-150/90 dark:hover:from-gray-750/90 dark:hover:to-gray-700/90 transition-all"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <span className="text-lg">{leagueInfo?.flag || '⚽'}</span>
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {leagueInfo?.country || 'World'} - {leagueName}
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              {fixtures.length}경기
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {liveCount} LIVE
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform",
          !isExpanded && "-rotate-90"
        )} />
      </button>
      
      {/* 경기 목록 - 카드 내부 컨텐츠 */}
      {isExpanded && (
        <div className="bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/20 dark:to-gray-800/10">
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {fixtures.map((fixture) => (
              <ModernMatchCard key={fixture.fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Following 섹션 (접기 가능)
function FollowingSection({ fixtures }: { fixtures: any[] }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (fixtures.length === 0) return null
  
  const liveCount = fixtures.filter(f => isLiveMatch(f.fixture.status.short)).length
  
  return (
    <div className="mb-6 bg-gradient-to-r from-yellow-50/60 to-orange-50/60 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl border border-yellow-200/50 dark:border-yellow-700/30 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-yellow-50/90 to-orange-50/90 dark:from-gray-800/90 dark:to-gray-750/90 backdrop-blur-sm border-b border-yellow-200/30 dark:border-yellow-700/30 hover:from-yellow-100/90 hover:to-orange-100/90 dark:hover:from-gray-750/90 dark:hover:to-gray-700/90 transition-all"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-sm">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              팔로잉 팀 경기
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
              {fixtures.length}경기
            </span>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {liveCount} LIVE
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform",
          !isExpanded && "-rotate-90"
        )} />
      </button>
      
      {isExpanded && (
        <div className="bg-gradient-to-b from-yellow-50/30 to-white/50 dark:from-gray-800/20 dark:to-gray-800/10">
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {fixtures.map((fixture: any) => (
              <ModernMatchCard key={fixture.fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 스켈레톤 로딩
function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <Skeleton className="h-8 w-48 mb-2" />
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4">
            <div className="space-y-4">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// 빈 상태
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {message}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Try selecting a different date
      </p>
    </div>
  )
}

export default function AppleStyleFixturesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'tv' | 'time'>('time')
  const [showFilter, setShowFilter] = useState(false)
  
  const { data, isLoading, error, refetch } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined
    isLoading: boolean
    error: Error | null
    refetch: () => void
  }
  
  const { preferences } = useUserPreferences()
  
  // 날짜 변경
  const changeDate = (days: number) => {
    setSelectedDate(prev => days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days)))
  }
  
  // 경기 데이터 처리
  const allFixtures = data?.response || []
  
  // Following 경기 필터링
  const followingFixtures = allFixtures.filter((fixture: any) => 
    preferences?.favoriteTeamIds?.includes(fixture.teams.home.id) ||
    preferences?.favoriteTeamIds?.includes(fixture.teams.away.id)
  )
  
  // 리그별로 그룹화 (Following 제외)
  const fixturesByLeague = allFixtures
    .filter((fixture: any) => 
      !preferences?.favoriteTeamIds?.includes(fixture.teams.home.id) &&
      !preferences?.favoriteTeamIds?.includes(fixture.teams.away.id)
    )
    .reduce((acc: any, fixture: any) => {
      const leagueId = fixture.league.id
      if (!acc[leagueId]) {
        acc[leagueId] = {
          leagueId,
          leagueName: fixture.league.name,
          fixtures: []
        }
      }
      acc[leagueId].fixtures.push(fixture)
      return acc
    }, {})
  
  // 리그 정렬 (우선순위 기반)
  const sortedLeagues = Object.values(fixturesByLeague).sort((a: any, b: any) => {
    const aPriority = LEAGUE_INFO[a.leagueId]?.priority || 999
    const bPriority = LEAGUE_INFO[b.leagueId]?.priority || 999
    return aPriority - bPriority
  })
  
  // TV 모드 필터링
  const tvFixtures = viewMode === 'tv' 
    ? allFixtures.filter((f: any) => [39, 140, 135, 78, 61, 2, 3].includes(f.league.id))
    : allFixtures
  
  // 시간순 정렬
  if (viewMode === 'time') {
    allFixtures.sort((a: any, b: any) => 
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    )
  }
  
  // 라이브 경기 추출
  const liveFixtures = allFixtures.filter((f: any) => isLiveMatch(f.fixture.status.short))
  
  // 라이브 경기 실시간 업데이트
  const liveFixtureIds = liveFixtures.map((f: any) => f.fixture.id)
  useFixturesRealtime({
    fixtureIds: liveFixtureIds,
    onUpdate: () => refetch()
  })
  
  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="font-semibold text-base text-gray-900 dark:text-white px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-w-[200px]"
          >
            {formatDateHeader(selectedDate)}
            <ChevronDown className="w-4 h-4 inline-block ml-1 text-gray-400" />
          </button>
          
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* 필터 탭 */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => setViewMode('tv')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              viewMode === 'tv' 
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            On TV
          </button>
          <button
            onClick={() => setViewMode('time')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              viewMode === 'time' 
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            By time
          </button>
          
          <div className="flex-1" />
          
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ListFilter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>
      
      {/* 컨텐츠 */}
      <div className="p-4 pb-20">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <EmptyState message="Unable to load fixtures" />
        ) : allFixtures.length === 0 ? (
          <EmptyState message="No fixtures scheduled" />
        ) : viewMode === 'tv' && tvFixtures.length === 0 ? (
          <EmptyState message="No televised fixtures today" />
        ) : (
          <div>
            {/* Following 섹션 */}
            {followingFixtures.length > 0 && (
              <FollowingSection fixtures={followingFixtures} />
            )}
            
            {/* 리그별 경기 */}
            {viewMode === 'time' ? (
              // By time 모드: 리그별 그룹화
              sortedLeagues.map((league: any) => (
                <AppleStyleLeagueGroup
                  key={league.leagueId}
                  leagueId={league.leagueId}
                  leagueName={league.leagueName}
                  fixtures={league.fixtures}
                  defaultExpanded={LEAGUE_INFO[league.leagueId]?.priority <= 5}
                />
              ))
            ) : (
              // TV 모드: 필터링된 경기만 표시
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {tvFixtures.map((fixture: any) => (
                    <ModernMatchCard key={fixture.fixture.id} fixture={fixture} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}