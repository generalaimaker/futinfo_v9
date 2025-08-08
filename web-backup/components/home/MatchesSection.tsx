'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Filter,
  Clock,
  Tv
} from 'lucide-react'
import { useFixturesByDate } from '@/lib/supabase/football'
import { formatDate, getStatusDisplay, isLiveMatch, isFinishedMatch, FixturesResponse } from '@/lib/types/football'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function MatchesSection() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('all')
  const { data: fixturesData, isLoading, error } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined; 
    isLoading: boolean; 
    error: Error | null 
  }

  // Debug logging
  console.log('[MatchesSection] Component rendered')
  console.log('[MatchesSection] Selected date:', selectedDate)
  console.log('[MatchesSection] Fixtures data:', fixturesData)
  console.log('[MatchesSection] Loading:', isLoading)
  console.log('[MatchesSection] Error:', error)

  // 날짜 변경
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  // 오늘로 이동
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // 날짜 포맷
  const formatDisplayDate = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    if (targetDate.getTime() === today.getTime()) {
      return 'Today'
    }

    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    }
    return date.toLocaleDateString('en-US', options)
  }

  // 진행중인 경기 필터
  const ongoingMatches = fixturesData?.response?.filter(fixture => 
    isLiveMatch(fixture.fixture.status.short)
  ) || []

  // TV 중계 경기 필터 (mock)
  const tvMatches = fixturesData?.response?.slice(0, 3) || []

  const displayedMatches = activeTab === 'ongoing' ? ongoingMatches :
                          activeTab === 'tv' ? tvMatches :
                          fixturesData?.response || []

  // 리그별로 그룹화
  const matchesByLeague = displayedMatches.reduce((acc, fixture) => {
    const leagueKey = `${fixture.league.id}-${fixture.league.name}`
    if (!acc[leagueKey]) {
      acc[leagueKey] = {
        league: fixture.league,
        matches: []
      }
    }
    acc[leagueKey].matches.push(fixture)
    return acc
  }, {} as Record<string, { league: any, matches: any[] }>)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Date Navigation */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeDate(-1)}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={goToToday}
                className={cn(
                  "h-8 px-3 font-medium",
                  formatDisplayDate(selectedDate) === 'Today' && "bg-gray-100"
                )}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {formatDisplayDate(selectedDate)}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeDate(1)}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-10 bg-transparent border-b-0 p-0 space-x-6">
              <TabsTrigger 
                value="all" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="ongoing" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Ongoing
                {ongoingMatches.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                    {ongoingMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="tv" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                On TV
              </TabsTrigger>
              <TabsTrigger 
                value="time" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                By time
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Matches Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium mb-2">Error loading fixtures</p>
            <p className="text-red-500 text-sm">{(error as Error).message}</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <Skeleton key={j} className="h-16" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : displayedMatches.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No matches scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(matchesByLeague).map(({ league, matches }) => (
              <div key={league.id} className="bg-white rounded-lg overflow-hidden">
                {/* League Header */}
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <Link 
                    href={`/leagues/${league.id}`}
                    className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={league.flag || league.logo}
                      alt={league.country}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                    <span className="font-medium text-sm">{league.country} - {league.name}</span>
                  </Link>
                </div>

                {/* Matches */}
                <div className="divide-y">
                  {matches.map((fixture) => {
                    const isLive = isLiveMatch(fixture.fixture.status.short)
                    const isFinished = isFinishedMatch(fixture.fixture.status.short)
                    const fixtureDate = new Date(fixture.fixture.date)
                    const timeString = fixtureDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })

                    return (
                      <Link
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block hover:bg-gray-50 transition-colors"
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-center">
                            {/* Time/Status */}
                            <div className="w-16 text-center">
                              {isFinished ? (
                                <div className="text-xs">
                                  <div className="font-medium">FT</div>
                                </div>
                              ) : isLive ? (
                                <div className="text-xs">
                                  <Badge variant="destructive" className="px-1.5 h-5">
                                    {fixture.fixture.status.elapsed}'
                                  </Badge>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600">{timeString}</div>
                              )}
                            </div>

                            {/* Teams and Score */}
                            <div className="flex-1 px-4">
                              {/* Home Team */}
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-3">
                                  <Image
                                    src={fixture.teams.home.logo}
                                    alt={fixture.teams.home.name}
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                  />
                                  <span className={cn(
                                    "text-sm",
                                    fixture.teams.home.winner && "font-semibold"
                                  )}>
                                    {fixture.teams.home.name}
                                  </span>
                                </div>
                                {(isFinished || isLive) && (
                                  <span className={cn(
                                    "text-sm font-medium",
                                    fixture.teams.home.winner && "font-bold"
                                  )}>
                                    {fixture.goals?.home ?? 0}
                                  </span>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Image
                                    src={fixture.teams.away.logo}
                                    alt={fixture.teams.away.name}
                                    width={20}
                                    height={20}
                                    className="object-contain"
                                  />
                                  <span className={cn(
                                    "text-sm",
                                    fixture.teams.away.winner && "font-semibold"
                                  )}>
                                    {fixture.teams.away.name}
                                  </span>
                                </div>
                                {(isFinished || isLive) && (
                                  <span className={cn(
                                    "text-sm font-medium",
                                    fixture.teams.away.winner && "font-bold"
                                  )}>
                                    {fixture.goals?.away ?? 0}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* TV Icon */}
                            {activeTab === 'tv' && (
                              <div className="w-8">
                                <Tv className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}