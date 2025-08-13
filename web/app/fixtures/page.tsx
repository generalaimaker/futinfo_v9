'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, 
  Tv, Filter as FilterIcon, Calendar, Clock, 
  Activity, TrendingUp, Star, Zap, Eye, EyeOff
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
  253: { name: 'MLS', country: 'USA', flag: '🇺🇸', priority: 11, color: 'from-blue-500/10 to-red-500/10' },
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
  if (isToday(date)) return '오늘'
  if (isTomorrow(date)) return '내일'
  if (isYesterday(date)) return '어제'
  
  return format(date, 'M월 d일 EEEE', { locale: ko })
}

// 시간 포맷
const formatTime = (date: Date): string => {
  return format(date, 'HH:mm')
}

// 경기 카드 컴포넌트 (컴팩트)
function CompactMatchCard({ fixture }: { fixture: any }) {
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
        "flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer",
        isFavoriteMatch && "bg-yellow-50/50 dark:bg-yellow-900/10"
      )}>
        {/* 시간/상태 */}
        <div className="w-16 text-center">
          {isLive ? (
            <div className="flex flex-col items-center">
              <span className="text-xs text-green-600 dark:text-green-400 font-bold animate-pulse">
                LIVE
              </span>
              <span className="text-xs text-gray-500">
                {fixture.fixture.status.elapsed}'
              </span>
            </div>
          ) : isFinished ? (
            <span className="text-sm text-gray-500">종료</span>
          ) : (
            <span className="text-sm font-medium">{time}</span>
          )}
        </div>
        
        {/* 팀 정보 */}
        <div className="flex-1 px-4">
          <div className="flex items-center justify-between">
            {/* 홈팀 */}
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={24}
                height={24}
                className="object-contain"
              />
              <span className={cn(
                "text-sm",
                isFinished && fixture.teams.home.winner && "font-bold",
                isFavoriteMatch && preferences?.favoriteTeamIds?.includes(fixture.teams.home.id) && "text-primary"
              )}>
                {fixture.teams.home.name}
              </span>
            </div>
            
            {/* 스코어 */}
            <div className="px-4 min-w-[60px] text-center">
              {(isLive || isFinished) ? (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-lg font-bold",
                    isFinished && fixture.teams.home.winner && "text-green-600 dark:text-green-400"
                  )}>
                    {fixture.goals.home ?? 0}
                  </span>
                  <span className="text-gray-400">-</span>
                  <span className={cn(
                    "text-lg font-bold",
                    isFinished && fixture.teams.away.winner && "text-green-600 dark:text-green-400"
                  )}>
                    {fixture.goals.away ?? 0}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400">vs</span>
              )}
            </div>
            
            {/* 원정팀 */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <span className={cn(
                "text-sm",
                isFinished && fixture.teams.away.winner && "font-bold",
                isFavoriteMatch && preferences?.favoriteTeamIds?.includes(fixture.teams.away.id) && "text-primary"
              )}>
                {fixture.teams.away.name}
              </span>
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* 즐겨찾기 표시 */}
        {isFavoriteMatch && (
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-2" />
        )}
      </div>
    </Link>
  )
}

// 리그별 그룹 컴포넌트
function LeagueGroup({ 
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
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* 리그 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{leagueInfo?.flag || '⚽'}</span>
          <div className="flex flex-col items-start">
            <span className="font-medium">{leagueName}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {fixtures.length}경기
            </span>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-5 h-5 text-gray-400 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>
      
      {/* 경기 목록 */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {fixtures.map((fixture) => (
            <CompactMatchCard key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
    </div>
  )
}

// 스켈레톤 로딩
function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map(j => (
              <div key={j} className="flex items-center justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 빈 상태
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {message}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        다른 날짜를 선택해보세요
      </p>
    </div>
  )
}

export default function ImprovedFixturesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showFollowingOnly, setShowFollowingOnly] = useState(false)
  
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
  
  // 오늘로 이동
  const goToToday = () => {
    setSelectedDate(new Date())
  }
  
  // 경기 데이터 처리
  const allFixtures = data?.response || []
  
  // 리그별로 그룹화
  const fixturesByLeague = allFixtures.reduce((acc: any, fixture: any) => {
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
  
  // 팔로우 팀/리그 필터링
  const followedLeagueIds = preferences?.favoriteLeagueIds || []
  const favoriteTeamIds = preferences?.favoriteTeamIds || []
  
  // 리그 정렬 (우선순위 기반)
  const sortedLeagues = Object.values(fixturesByLeague).sort((a: any, b: any) => {
    // 팔로우한 팀이 있는 리그 우선
    const aHasFavorite = a.fixtures.some((f: any) => 
      favoriteTeamIds.includes(f.teams.home.id) || favoriteTeamIds.includes(f.teams.away.id)
    )
    const bHasFavorite = b.fixtures.some((f: any) => 
      favoriteTeamIds.includes(f.teams.home.id) || favoriteTeamIds.includes(f.teams.away.id)
    )
    
    if (aHasFavorite && !bHasFavorite) return -1
    if (!aHasFavorite && bHasFavorite) return 1
    
    // 팔로우한 리그 우선
    const aFollowed = followedLeagueIds.includes(a.leagueId)
    const bFollowed = followedLeagueIds.includes(b.leagueId)
    
    if (aFollowed && !bFollowed) return -1
    if (!aFollowed && bFollowed) return 1
    
    // 리그 우선순위
    const aPriority = LEAGUE_INFO[a.leagueId]?.priority || 999
    const bPriority = LEAGUE_INFO[b.leagueId]?.priority || 999
    
    return aPriority - bPriority
  })
  
  // 필터링 적용
  let displayLeagues = sortedLeagues
  if (showFollowingOnly) {
    displayLeagues = sortedLeagues.filter((league: any) => {
      const isFollowedLeague = followedLeagueIds.includes(league.leagueId)
      const hasFavoriteTeam = league.fixtures.some((f: any) => 
        favoriteTeamIds.includes(f.teams.home.id) || favoriteTeamIds.includes(f.teams.away.id)
      )
      return isFollowedLeague || hasFavoriteTeam
    })
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
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b dark:border-gray-800">
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
          
          <div className="flex items-center gap-2">
            <button 
              onClick={goToToday}
              className="font-semibold text-base hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              {formatDateHeader(selectedDate)}
            </button>
            {!isToday(selectedDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-xs"
              >
                오늘
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeDate(1)}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* 필터 바 */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            {liveFixtures.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>{liveFixtures.length} LIVE</span>
              </div>
            )}
            <span className="text-sm text-gray-500">
              총 {allFixtures.length}경기
            </span>
          </div>
          
          <button
            onClick={() => setShowFollowingOnly(!showFollowingOnly)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              showFollowingOnly 
                ? "bg-primary text-primary-foreground" 
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {showFollowingOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{showFollowingOnly ? 'Following' : '전체'}</span>
          </button>
        </div>
      </div>
      
      {/* 컨텐츠 */}
      <div className="pb-20">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <EmptyState message="경기 정보를 불러올 수 없습니다" />
        ) : displayLeagues.length === 0 ? (
          <EmptyState message={showFollowingOnly ? "팔로우한 리그/팀의 경기가 없습니다" : "예정된 경기가 없습니다"} />
        ) : (
          <div className="space-y-3 p-4">
            {displayLeagues.map((league: any, index: number) => {
              const hasFavoriteTeam = league.fixtures.some((f: any) => 
                favoriteTeamIds.includes(f.teams.home.id) || favoriteTeamIds.includes(f.teams.away.id)
              )
              const isFollowedLeague = followedLeagueIds.includes(league.leagueId)
              const isMajorLeague = LEAGUE_INFO[league.leagueId]?.priority <= 8
              
              return (
                <LeagueGroup
                  key={league.leagueId}
                  leagueId={league.leagueId}
                  leagueName={league.leagueName}
                  fixtures={league.fixtures}
                  defaultExpanded={hasFavoriteTeam || isFollowedLeague || (index === 0 && isMajorLeague)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}