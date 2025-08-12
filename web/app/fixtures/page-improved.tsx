'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, 
  Tv, Filter as FilterIcon, Calendar, Clock, 
  Activity, TrendingUp, Star, Zap
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
const LEAGUE_INFO: Record<number, { name: string, country: string, flag: string, priority: number, color: string }> = {
  39: { name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', priority: 1, color: 'from-purple-500/10 to-purple-600/10' },
  140: { name: 'LaLiga', country: 'Spain', flag: '🇪🇸', priority: 2, color: 'from-orange-500/10 to-red-600/10' },
  135: { name: 'Serie A', country: 'Italy', flag: '🇮🇹', priority: 3, color: 'from-blue-500/10 to-blue-600/10' },
  78: { name: 'Bundesliga', country: 'Germany', flag: '🇩🇪', priority: 4, color: 'from-red-500/10 to-gray-600/10' },
  61: { name: 'Ligue 1', country: 'France', flag: '🇫🇷', priority: 5, color: 'from-blue-400/10 to-red-400/10' },
  2: { name: 'Champions League', country: 'Europe', flag: '🇪🇺', priority: 6, color: 'from-indigo-500/10 to-indigo-600/10' },
  3: { name: 'Europa League', country: 'Europe', flag: '🇪🇺', priority: 7, color: 'from-orange-400/10 to-orange-500/10' },
  848: { name: 'K League 1', country: 'South Korea', flag: '🇰🇷', priority: 8, color: 'from-red-500/10 to-blue-500/10' },
  292: { name: 'K League 2', country: 'South Korea', flag: '🇰🇷', priority: 9, color: 'from-red-400/10 to-blue-400/10' },
  253: { name: 'MLS', country: 'USA', flag: '🇺🇸', priority: 10, color: 'from-blue-500/10 to-red-500/10' },
  71: { name: 'Campeonato Brasileiro', country: 'Brazil', flag: '🇧🇷', priority: 11, color: 'from-green-500/10 to-yellow-500/10' },
  128: { name: 'Liga Profesional', country: 'Argentina', flag: '🇦🇷', priority: 12, color: 'from-sky-400/10 to-sky-500/10' },
  667: { name: 'Friendlies Clubs', country: 'World', flag: '🌍', priority: 99, color: 'from-gray-400/10 to-gray-500/10' }
}

// 날짜 포맷
const formatDateHeader = (date: Date): string => {
  if (isToday(date)) return '오늘'
  if (isTomorrow(date)) return '내일'
  if (isYesterday(date)) return '어제'
  
  return format(date, 'M월 d일 EEEE', { locale: ko })
}

// 시간 포맷 개선
const formatTime = (date: Date): string => {
  return format(date, 'HH:mm')
}

// 라이브 경기 카드 컴포넌트
function LiveMatchCard({ fixture }: { fixture: any }) {
  const elapsed = fixture.fixture.status.elapsed
  const progress = Math.min((elapsed / 90) * 100, 100)
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <div className="relative bg-gradient-to-br from-green-500/10 via-green-600/5 to-transparent dark:from-green-400/20 dark:via-green-500/10 rounded-xl p-4 border border-green-500/20 dark:border-green-400/30 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-500/10 group cursor-pointer">
        {/* LIVE 뱃지 */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-500 dark:bg-green-400 text-white dark:text-gray-900 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
          <Activity className="w-3 h-3" />
          <span>{elapsed}'</span>
        </div>
        
        {/* 리그 정보 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{LEAGUE_INFO[fixture.league.id]?.flag || '⚽'}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">{fixture.league.name}</span>
        </div>
        
        {/* 팀 & 스코어 */}
        <div className="space-y-3">
          {/* 홈팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={32}
                height={32}
                className="object-contain"
              />
              <span className={cn(
                "font-medium",
                fixture.goals.home > fixture.goals.away && "text-green-600 dark:text-green-400"
              )}>
                {fixture.teams.home.name}
              </span>
            </div>
            <span className="text-2xl font-bold">{fixture.goals.home}</span>
          </div>
          
          {/* 원정팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={32}
                height={32}
                className="object-contain"
              />
              <span className={cn(
                "font-medium",
                fixture.goals.away > fixture.goals.home && "text-green-600 dark:text-green-400"
              )}>
                {fixture.teams.away.name}
              </span>
            </div>
            <span className="text-2xl font-bold">{fixture.goals.away}</span>
          </div>
        </div>
        
        {/* 진행률 바 */}
        <div className="mt-4">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

// 일반 경기 카드 컴포넌트
function MatchCard({ fixture, size = 'normal' }: { fixture: any, size?: 'normal' | 'compact' }) {
  const isLive = isLiveMatch(fixture.fixture.status.short)
  const isFinished = isFinishedMatch(fixture.fixture.status.short)
  const fixtureDate = new Date(fixture.fixture.date)
  const time = formatTime(fixtureDate)
  const { preferences } = useUserPreferences()
  const leagueInfo = LEAGUE_INFO[fixture.league.id]
  
  const isFavoriteMatch = 
    preferences.favoriteTeamIds.includes(fixture.teams.home.id) ||
    preferences.favoriteTeamIds.includes(fixture.teams.away.id)
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <div className={cn(
        "relative bg-white dark:bg-gray-800 rounded-xl border transition-all hover:shadow-lg group cursor-pointer",
        isFavoriteMatch && "ring-2 ring-yellow-400/50 bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-900/20",
        !isFavoriteMatch && "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        leagueInfo && `bg-gradient-to-br ${leagueInfo.color}`,
        size === 'compact' ? 'p-3' : 'p-4'
      )}>
        {/* 즐겨찾기 표시 */}
        {isFavoriteMatch && (
          <Star className="absolute top-2 right-2 w-4 h-4 text-yellow-500 fill-yellow-500" />
        )}
        
        {/* 리그 정보 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>{leagueInfo?.flag || '⚽'}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{fixture.league.name}</span>
          </div>
          {fixture.fixture.status.short === 'PST' && (
            <span className="text-xs font-medium text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
              연기됨
            </span>
          )}
        </div>
        
        {/* 메인 콘텐츠 */}
        <div className="space-y-2">
          {/* 홈팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={size === 'compact' ? 24 : 28}
                height={size === 'compact' ? 24 : 28}
                className="object-contain"
              />
              <span className={cn(
                "truncate",
                size === 'compact' ? 'text-sm' : 'text-base',
                isFinished && fixture.teams.home.winner && "font-bold",
                isFavoriteMatch && preferences.favoriteTeamIds.includes(fixture.teams.home.id) && "text-primary"
              )}>
                {fixture.teams.home.name}
              </span>
            </div>
            {(isLive || isFinished) && (
              <span className={cn(
                "font-bold min-w-[24px] text-center",
                size === 'compact' ? 'text-lg' : 'text-xl',
                isFinished && fixture.teams.home.winner && "text-green-600 dark:text-green-400"
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
                width={size === 'compact' ? 24 : 28}
                height={size === 'compact' ? 24 : 28}
                className="object-contain"
              />
              <span className={cn(
                "truncate",
                size === 'compact' ? 'text-sm' : 'text-base',
                isFinished && fixture.teams.away.winner && "font-bold",
                isFavoriteMatch && preferences.favoriteTeamIds.includes(fixture.teams.away.id) && "text-primary"
              )}>
                {fixture.teams.away.name}
              </span>
            </div>
            {(isLive || isFinished) && (
              <span className={cn(
                "font-bold min-w-[24px] text-center",
                size === 'compact' ? 'text-lg' : 'text-xl',
                isFinished && fixture.teams.away.winner && "text-green-600 dark:text-green-400"
              )}>
                {fixture.goals.away ?? 0}
              </span>
            )}
          </div>
        </div>
        
        {/* 시간/상태 */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          {isFinished ? (
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">종료</span>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{time}</span>
            </div>
          )}
          
          {/* TV 중계 */}
          {[39, 140, 135, 78, 61, 2, 3].includes(fixture.league.id) && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Tv className="w-3.5 h-3.5" />
              <span>중계</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// 빠른 필터 칩
function FilterChip({ 
  label, 
  icon: Icon, 
  active, 
  onClick, 
  count 
}: { 
  label: string
  icon?: any
  active: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        active 
          ? "bg-primary text-primary-foreground shadow-md" 
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 rounded-full text-xs",
          active 
            ? "bg-primary-foreground/20 text-primary-foreground" 
            : "bg-gray-200 dark:bg-gray-700"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

// 개선된 스켈레톤 로딩
function ImprovedSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* 라이브 섹션 스켈레톤 */}
      <div>
        <Skeleton className="h-8 w-32 mb-3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
      
      {/* 일반 경기 스켈레톤 */}
      <div>
        <Skeleton className="h-8 w-32 mb-3" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

// 빈 상태 일러스트레이션
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-2xl">⚽</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {message}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        다른 날짜를 선택하거나 필터를 변경해보세요
      </p>
    </div>
  )
}

export default function ImprovedFixturesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'favorite' | 'major'>('all')
  const [showCalendar, setShowCalendar] = useState(false)
  
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
  
  // 경기 필터링
  const allFixtures = data?.response || []
  const liveFixtures = allFixtures.filter((f: any) => isLiveMatch(f.fixture.status.short))
  const favoriteFixtures = allFixtures.filter((f: any) => 
    preferences.favoriteTeamIds.includes(f.teams.home.id) ||
    preferences.favoriteTeamIds.includes(f.teams.away.id)
  )
  const majorFixtures = allFixtures.filter((f: any) => 
    [39, 140, 135, 78, 61, 2, 3, 848].includes(f.league.id)
  )
  
  // 필터에 따른 경기 목록
  let filteredFixtures = allFixtures
  switch (activeFilter) {
    case 'live':
      filteredFixtures = liveFixtures
      break
    case 'favorite':
      filteredFixtures = favoriteFixtures
      break
    case 'major':
      filteredFixtures = majorFixtures
      break
  }
  
  // 시간순 정렬
  const sortedFixtures = [...filteredFixtures].sort((a: any, b: any) => {
    // 라이브 경기 우선
    const aLive = isLiveMatch(a.fixture.status.short)
    const bLive = isLiveMatch(b.fixture.status.short)
    if (aLive && !bLive) return -1
    if (!aLive && bLive) return 1
    
    // 시간순
    return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  })
  
  // 라이브와 일반 경기 분리
  const liveMatches = sortedFixtures.filter((f: any) => isLiveMatch(f.fixture.status.short))
  const upcomingMatches = sortedFixtures.filter((f: any) => !isLiveMatch(f.fixture.status.short))
  
  // 라이브 경기 실시간 업데이트
  const liveFixtureIds = liveMatches.map((f: any) => f.fixture.id)
  useFixturesRealtime({
    fixtureIds: liveFixtureIds,
    onUpdate: () => refetch()
  })
  
  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b dark:border-gray-800">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 font-semibold text-base hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Calendar className="h-4 w-4 text-primary" />
            {formatDateHeader(selectedDate)}
            <ChevronDown className={cn(
              "h-4 w-4 text-gray-500 transition-transform",
              showCalendar && "rotate-180"
            )} />
          </button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(1)}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* 필터 칩 */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <FilterChip
              label="전체"
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
              count={allFixtures.length}
            />
            <FilterChip
              label="LIVE"
              icon={Zap}
              active={activeFilter === 'live'}
              onClick={() => setActiveFilter('live')}
              count={liveFixtures.length}
            />
            <FilterChip
              label="내 팀"
              icon={Star}
              active={activeFilter === 'favorite'}
              onClick={() => setActiveFilter('favorite')}
              count={favoriteFixtures.length}
            />
            <FilterChip
              label="주요리그"
              icon={TrendingUp}
              active={activeFilter === 'major'}
              onClick={() => setActiveFilter('major')}
              count={majorFixtures.length}
            />
          </div>
        </div>
        
        {/* 간단한 통계 */}
        {sortedFixtures.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800">
            <div className="flex items-center gap-4 text-xs">
              {liveMatches.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {liveMatches.length}개 경기 진행 중
                  </span>
                </div>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                총 {sortedFixtures.length}개 경기
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* 컨텐츠 */}
      <div className="p-4 pb-20">
        {isLoading ? (
          <ImprovedSkeleton />
        ) : error ? (
          <EmptyState message="경기 정보를 불러올 수 없습니다" />
        ) : sortedFixtures.length === 0 ? (
          <EmptyState message="예정된 경기가 없습니다" />
        ) : (
          <div className="space-y-6">
            {/* 라이브 경기 섹션 */}
            {liveMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-green-500 animate-pulse" />
                  <h2 className="text-lg font-bold">실시간 경기</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({liveMatches.length})
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveMatches.map((fixture: any) => (
                    <LiveMatchCard key={fixture.fixture.id} fixture={fixture} />
                  ))}
                </div>
              </section>
            )}
            
            {/* 일반 경기 섹션 */}
            {upcomingMatches.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-3">
                  {isFinishedMatch(upcomingMatches[0]?.fixture.status.short) ? '종료된 경기' : '예정된 경기'}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingMatches.map((fixture: any) => (
                    <MatchCard 
                      key={fixture.fixture.id} 
                      fixture={fixture}
                      size={upcomingMatches.length > 6 ? 'compact' : 'normal'}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}