'use client'

import { useState } from 'react'
import { Trophy, ChevronLeft, ChevronRight, Calendar, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFixturesByDate } from '@/lib/supabase/football'
import { formatDate, getStatusDisplay, isFinishedMatch } from '@/lib/types/football'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

export default function ResultsPage() {
  // 어제 날짜로 시작
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const [selectedDate, setSelectedDate] = useState(yesterday)
  
  const { data, isLoading, error } = useFixturesByDate(selectedDate)
  
  // 날짜 변경 핸들러
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    // 미래 날짜는 선택 불가
    if (newDate <= new Date()) {
      setSelectedDate(newDate)
    }
  }
  
  // 어제로 이동
  const goToYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setSelectedDate(yesterday)
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
  
  // 완료된 경기만 필터링
  const finishedFixtures = data?.response?.filter(fixture => 
    isFinishedMatch(fixture.fixture.status.short)
  ) || []
  
  // 리그별로 경기 그룹화
  const groupFixturesByLeague = () => {
    return finishedFixtures.reduce((acc, fixture) => {
      const leagueId = fixture.league.id
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: fixture.league,
          fixtures: []
        }
      }
      acc[leagueId].fixtures.push(fixture)
      return acc
    }, {} as Record<number, { league: typeof finishedFixtures[0]['league'], fixtures: typeof finishedFixtures }>)
  }
  
  const groupedFixtures = groupFixturesByLeague()
  const hasResults = finishedFixtures.length > 0
  
  // 날짜가 오늘 이후인지 확인
  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const isFuture = selectedDate > new Date()

  return (
    <div className="min-h-screen bg-gray-50">
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
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold">경기 결과</h1>
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
                onClick={goToYesterday}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {formatDisplayDate(selectedDate)}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeDate(1)}
                disabled={isToday || isFuture}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          // 로딩 스켈레톤
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 space-y-3">
                <Skeleton className="h-6 w-48" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between p-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-12 w-12 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          // 에러 상태
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-red-600 mb-4">경기 결과를 불러오는데 실패했습니다.</p>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        ) : !hasResults ? (
          // 결과 없음
          <div className="bg-white rounded-lg p-8 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {isFuture ? '미래의 경기 결과는 볼 수 없습니다' : '완료된 경기가 없습니다'}
            </p>
            <p className="text-gray-500">
              {isFuture ? '이전 날짜를 선택해주세요' : '다른 날짜를 선택해주세요'}
            </p>
          </div>
        ) : (
          // 경기 결과 목록
          <div className="space-y-6">
            {Object.values(groupedFixtures).map(({ league, fixtures }) => (
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
                        className="object-contain"
                      />
                    )}
                    <div>
                      <h2 className="font-semibold">{league.name}</h2>
                      <p className="text-sm text-gray-600">{league.country}</p>
                    </div>
                  </div>
                </div>
                
                {/* 경기 결과 목록 */}
                <div className="divide-y">
                  {fixtures.map((fixture) => {
                    const homeWin = (fixture.goals.home ?? 0) > (fixture.goals.away ?? 0)
                    const awayWin = (fixture.goals.away ?? 0) > (fixture.goals.home ?? 0)
                    const draw = (fixture.goals.home ?? 0) === (fixture.goals.away ?? 0)
                    
                    return (
                      <Link
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        {/* 홈팀 */}
                        <div className="flex items-center space-x-3 flex-1">
                          <Image
                            src={fixture.teams.home.logo}
                            alt={fixture.teams.home.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className={`font-medium ${homeWin ? 'text-blue-600' : draw ? '' : 'text-gray-500'}`}>
                            {fixture.teams.home.name}
                          </span>
                        </div>
                        
                        {/* 스코어 */}
                        <div className="px-4 text-center min-w-[120px]">
                          <div className="text-2xl font-bold">
                            <span className={homeWin ? 'text-blue-600' : draw ? '' : 'text-gray-500'}>
                              {fixture.goals.home ?? 0}
                            </span>
                            <span className="mx-2">-</span>
                            <span className={awayWin ? 'text-blue-600' : draw ? '' : 'text-gray-500'}>
                              {fixture.goals.away ?? 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getStatusDisplay(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                          </div>
                        </div>
                        
                        {/* 원정팀 */}
                        <div className="flex items-center space-x-3 flex-1 justify-end">
                          <span className={`font-medium ${awayWin ? 'text-blue-600' : draw ? '' : 'text-gray-500'}`}>
                            {fixture.teams.away.name}
                          </span>
                          <Image
                            src={fixture.teams.away.logo}
                            alt={fixture.teams.away.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 빠른 링크 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">더 보기</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/fixtures">
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                오늘의 경기
              </Button>
            </Link>
            <Link href="/leagues">
              <Button variant="outline" className="w-full">
                <Trophy className="h-4 w-4 mr-2" />
                리그 순위
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="outline" className="w-full">
                <ChevronRight className="h-4 w-4 mr-2" />
                커뮤니티
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}