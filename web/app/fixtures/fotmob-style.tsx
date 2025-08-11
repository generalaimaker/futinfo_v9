'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  ChevronLeft, ChevronRight, Calendar, Filter as FilterIcon,
  ChevronDown, ChevronUp, Tv, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFixturesByDate } from '@/lib/supabase/football'
import { isLiveMatch, isFinishedMatch, FixturesResponse } from '@/lib/types/football'
import { useFixturesRealtime } from '@/hooks/useFixturesRealtime'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { format, addDays, subDays, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'

// 리그 우선순위 및 국가 플래그
const LEAGUE_INFO: Record<number, { name: string, country: string, flag: string, priority: number }> = {
  39: { name: 'Premier League', country: 'England', flag: '🏴󐁧󐁢󐁥󐁮󐁧󐁿', priority: 1 },
  140: { name: 'LaLiga', country: 'Spain', flag: '🇪🇸', priority: 2 },
  135: { name: 'Serie A', country: 'Italy', flag: '🇮🇹', priority: 3 },
  78: { name: 'Bundesliga', country: 'Germany', flag: '🇩🇪', priority: 4 },
  61: { name: 'Ligue 1', country: 'France', flag: '🇫🇷', priority: 5 },
  2: { name: 'Champions League', country: 'Europe', flag: '🇪🇺', priority: 6 },
  848: { name: 'K-League 1', country: 'South Korea', flag: '🇰🇷', priority: 7 },
  292: { name: 'K-League 2', country: 'South Korea', flag: '🇰🇷', priority: 8 },
  667: { name: 'Friendlies', country: 'World', flag: '🌍', priority: 99 }
}

// 날짜 포맷
const formatDateHeader = (date: Date): string => {
  if (isToday(date)) return 'Today'
  const dayName = format(date, 'EEEE', { locale: ko })
  const dateStr = format(date, 'MMMM d', { locale: ko })
  return `${dayName}, ${dateStr}`
}

// 시간 포맷 (AM/PM)
const formatTime = (date: Date): { time: string, period: string } => {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const time = `${displayHours}:${minutes.toString().padStart(2, '0')}`
  return { time, period }
}

// 경기 아이템 컴포넌트
function FixtureItem({ fixture }: { fixture: any }) {
  const isLive = isLiveMatch(fixture.fixture.status.short)
  const isFinished = isFinishedMatch(fixture.fixture.status.short)
  const fixtureDate = new Date(fixture.fixture.date)
  const { time, period } = formatTime(fixtureDate)
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
        {/* 시간/상태 */}
        <div className="w-16 text-center">
          {isLive ? (
            <div className="text-green-600 font-bold">
              {fixture.fixture.status.elapsed}'
            </div>
          ) : isFinished ? (
            <div className="text-gray-500 text-sm">FT</div>
          ) : (
            <div className="text-sm">
              <div className="font-medium">{time}</div>
              <div className="text-xs text-gray-500">{period}</div>
            </div>
          )}
        </div>
        
        {/* 팀 정보 */}
        <div className="flex-1 px-4">
          {/* 홈팀 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={20}
                height={20}
                className="object-contain"
              />
              <span className={cn(
                "text-sm",
                isFinished && fixture.teams.home.winner && "font-semibold"
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
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={20}
                height={20}
                className="object-contain"
              />
              <span className={cn(
                "text-sm",
                isFinished && fixture.teams.away.winner && "font-semibold"
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
        
        {/* TV 아이콘 (중계 있는 경우) */}
        <div className="w-8 flex justify-center">
          <Tv className="w-4 h-4 text-gray-400" />
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
    country: league.country, 
    flag: '⚽', 
    priority: 999 
  }
  
  return (
    <div className="border-b dark:border-gray-800 last:border-b-0">
      {/* 리그 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{leagueInfo.flag}</span>
          <div className="text-left">
            <div className="font-medium text-sm">
              {leagueInfo.country} - {leagueInfo.name}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {/* 경기 목록 */}
      {isExpanded && (
        <div>
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
  const [viewMode, setViewMode] = useState<'all' | 'onTv' | 'byTime'>('byTime')
  const { preferences } = useUserPreferences()
  
  const { data, isLoading, error, refetch } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined; 
    isLoading: boolean; 
    error: Error | null;
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
    const majorLeagues = [39, 140, 135, 78, 61, 848] // 주요 리그
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
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
          
          <button className="flex items-center gap-2 font-medium">
            {formatDateHeader(selectedDate)}
            <ChevronDown className="h-4 w-4" />
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
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('onTv')}
              className={cn(
                "text-sm font-medium pb-2 border-b-2 transition-colors",
                viewMode === 'onTv' 
                  ? "text-primary border-primary" 
                  : "text-gray-500 border-transparent"
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
                  : "text-gray-500 border-transparent"
              )}
            >
              By time
            </button>
          </div>
          
          <button className="flex items-center gap-1 text-sm text-gray-500">
            <FilterIcon className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>
      
      {/* 컨텐츠 */}
      <div className="pb-20">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-gray-500">
            경기 정보를 불러올 수 없습니다
          </div>
        ) : allFixturesByTime.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            예정된 경기가 없습니다
          </div>
        ) : (
          <>
            {viewMode === 'byTime' ? (
              // 시간순 보기
              <div>
                {allFixturesByTime.map((fixture: any) => (
                  <FixtureItem key={fixture.fixture.id} fixture={fixture} />
                ))}
              </div>
            ) : (
              // 리그별 보기
              <>
                {/* 전체 펼치기/접기 버튼 */}
                {sortedLeagues.length > 1 && (
                  <div className="px-4 py-2 border-b dark:border-gray-800">
                    <button
                      onClick={toggleAllLeagues}
                      className="text-xs text-primary font-medium"
                    >
                      {expandedLeagues.size === sortedLeagues.length ? 'Collapse all' : 'Expand all'}
                    </button>
                  </div>
                )}
                
                {/* 리그별 섹션 */}
                {sortedLeagues.map(([leagueId, data]) => (
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