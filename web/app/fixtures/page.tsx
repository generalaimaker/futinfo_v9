'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar, Clock, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFixturesByDate } from '@/lib/supabase/football'
import { formatDate, getStatusDisplay, isLiveMatch, isFinishedMatch, FixturesResponse } from '@/lib/types/football'
import { useFixturesRealtime } from '@/hooks/useFixturesRealtime'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import LiveMatchesSection from '@/components/LiveMatchesSection'

export default function FixturesPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const { data, isLoading, error, refetch } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined; 
    isLoading: boolean; 
    error: Error | null;
    refetch: () => void
  }
  
  // 날짜 변경 핸들러
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
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    }
    return date.toLocaleDateString('ko-KR', options)
  }
  
  // 리그별로 경기 그룹화 (유럽 주요 팀 친선경기 우선)
  const groupFixturesByLeague = () => {
    if (!data?.response) return {}
    
    const MAJOR_TEAMS = [33, 40, 50, 49, 42, 47, 541, 529, 530, 496, 505, 489, 157, 165, 85]
    
    // 유럽 주요 팀 친선경기와 그 외 분리
    const majorFriendlies: typeof data.response = []
    const otherFixtures: typeof data.response = []
    
    data.response.forEach(fixture => {
      if (fixture.league.id === 667 && 
          (MAJOR_TEAMS.includes(fixture.teams.home.id) || 
           MAJOR_TEAMS.includes(fixture.teams.away.id))) {
        majorFriendlies.push(fixture)
      } else {
        otherFixtures.push(fixture)
      }
    })
    
    const result: Record<number, { league: typeof data.response[0]['league'], fixtures: typeof data.response }> = {}
    
    // 유럽 주요 팀 친선경기를 별도 그룹으로
    if (majorFriendlies.length > 0) {
      result[-1] = {
        league: { ...majorFriendlies[0].league, name: '유럽 주요 팀 친선경기' },
        fixtures: majorFriendlies
      }
    }
    
    // 나머지 경기들 그룹화
    otherFixtures.forEach(fixture => {
      const leagueId = fixture.league.id
      if (!result[leagueId]) {
        result[leagueId] = {
          league: fixture.league,
          fixtures: []
        }
      }
      result[leagueId].fixtures.push(fixture)
    })
    
    return result
  }
  
  const groupedFixtures = groupFixturesByLeague()
  const hasFixtures = data?.response && data.response.length > 0

  // 라이브 경기 ID 목록 추출
  const liveFixtureIds = data?.response
    ?.filter(fixture => isLiveMatch(fixture.fixture.status.short))
    .map(fixture => fixture.fixture.id) || []

  // 실시간 업데이트 콜백
  const handleFixtureUpdate = useCallback((fixtureId: number) => {
    console.log(`Fixture ${fixtureId} updated, refetching list...`)
    refetch()
  }, [refetch])

  // Realtime 구독 (라이브 경기만)
  useFixturesRealtime({
    fixtureIds: liveFixtureIds,
    onUpdate: handleFixtureUpdate
  })

  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  홈
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">경기 일정</h1>
              </div>
            </div>
            
            {/* 날짜 네비게이션 */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="min-w-[200px]"
                onClick={goToToday}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {formatDisplayDate(selectedDate)}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="container mx-auto px-4 py-6">
        {/* 라이브 경기 섹션 */}
        <LiveMatchesSection />
        
        {isLoading ? (
          // 로딩 스켈레톤
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 space-y-3">
                <Skeleton className="h-6 w-48" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between p-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-12 w-12 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          // 에러 상태
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-red-600 mb-4">경기 정보를 불러오는데 실패했습니다.</p>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        ) : !hasFixtures ? (
          // 경기 없음
          <div className="bg-white rounded-lg p-8 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">예정된 경기가 없습니다</p>
            <p className="text-gray-500">다른 날짜를 선택해주세요</p>
          </div>
        ) : (
          // 경기 목록
          <div className="space-y-6">
            {Object.entries(groupedFixtures)
              .sort(([aId], [bId]) => {
                // 유럽 주요 팀 친선경기를 최상단에
                if (aId === '-1') return -1
                if (bId === '-1') return 1
                
                // 그 다음 주요 리그 우선순위
                const priorityLeagues = [39, 140, 135, 78, 61, 2] // EPL, La Liga, Serie A, etc
                const aIndex = priorityLeagues.indexOf(parseInt(aId))
                const bIndex = priorityLeagues.indexOf(parseInt(bId))
                
                if (aIndex === -1 && bIndex === -1) return 0
                if (aIndex === -1) return 1
                if (bIndex === -1) return -1
                return aIndex - bIndex
              })
              .map(([leagueId, { league, fixtures }]) => (
              <div key={league.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* 리그 헤더 */}
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex items-center space-x-3">
                    {league.logo && (
                      <Image
                        src={league.logo}
                        alt={league.name}
                        width={24}
                        height={24}
                        className="object-contain pointer-events-none"
                      />
                    )}
                    <div>
                      <h2 className="font-semibold">{league.name}</h2>
                      <p className="text-sm text-gray-600">{league.country}</p>
                    </div>
                  </div>
                </div>
                
                {/* 경기 목록 */}
                <div className="divide-y">
                  {fixtures.map((fixture) => {
                    const isLive = isLiveMatch(fixture.fixture.status.short)
                    const isFinished = isFinishedMatch(fixture.fixture.status.short)
                    const fixtureDate = new Date(fixture.fixture.date)
                    const timeString = fixtureDate.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    
                    return (
                      <a
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block w-full"
                      >
                        <div className="flex items-center justify-between p-4 hover:bg-blue-50 active:bg-blue-100 transition-all cursor-pointer border-b last:border-0">
                        {/* 홈팀 */}
                        <div className="flex items-center space-x-3 flex-1">
                          <Link 
                            href={`/teams/${fixture.teams.home.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="transition-transform hover:scale-110"
                          >
                            <Image
                              src={fixture.teams.home.logo}
                              alt={fixture.teams.home.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          </Link>
                          <Link 
                            href={`/teams/${fixture.teams.home.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium hover:text-blue-600 transition-colors"
                          >
                            {fixture.teams.home.name}
                          </Link>
                        </div>
                        
                        {/* 스코어/시간 */}
                        <div className="px-4 text-center min-w-[100px]">
                          {isFinished || isLive ? (
                            <div>
                              <div className="text-2xl font-bold">
                                {fixture.goals?.home ?? 0} - {fixture.goals?.away ?? 0}
                              </div>
                              <div className={`text-xs mt-1 ${isLive ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                {getStatusDisplay(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-lg font-medium">{timeString}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {getStatusDisplay(fixture.fixture.status.short, null)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 원정팀 */}
                        <div className="flex items-center space-x-3 flex-1 justify-end">
                          <Link 
                            href={`/teams/${fixture.teams.away.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium hover:text-blue-600 transition-colors"
                          >
                            {fixture.teams.away.name}
                          </Link>
                          <Link 
                            href={`/teams/${fixture.teams.away.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="transition-transform hover:scale-110"
                          >
                            <Image
                              src={fixture.teams.away.logo}
                              alt={fixture.teams.away.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          </Link>
                        </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}