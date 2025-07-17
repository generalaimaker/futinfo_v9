'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Users, MessageCircle, Trophy, Globe, Calendar, BarChart3, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useFixturesByDate } from '@/lib/supabase/football'
import { formatDate, getStatusDisplay, isLiveMatch, isFinishedMatch } from '@/lib/types/football'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { BoardList } from '@/components/community/board-list'

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { data: fixturesData, isLoading: fixturesLoading } = useFixturesByDate(selectedDate)
  
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
  
  // 주요 경기만 필터링 (상위 5개)
  const topFixtures = fixturesData?.response?.slice(0, 5) || []

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">FutInfo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/fixtures">
                <Button variant="ghost">전체 일정</Button>
              </Link>
              <Link href="/leagues">
                <Button variant="ghost">리그</Button>
              </Link>
              <Link href="/teams">
                <Button variant="ghost">팀</Button>
              </Link>
              <Link href="/community">
                <Button variant="ghost">커뮤니티</Button>
              </Link>
              <Link href="/auth/login">
                <Button>로그인</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 왼쪽: 오늘의 경기 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 경기 일정 헤더 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">오늘의 경기</h2>
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
                    className="min-w-[150px]"
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

              {/* 경기 목록 */}
              {fixturesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-10 w-10 rounded" />
                    </div>
                  ))}
                </div>
              ) : topFixtures.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>오늘 예정된 경기가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topFixtures.map((fixture) => {
                    const isLive = isLiveMatch(fixture.fixture.status.short)
                    const isFinished = isFinishedMatch(fixture.fixture.status.short)
                    const fixtureDate = new Date(fixture.fixture.date)
                    const timeString = fixtureDate.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    
                    return (
                      <Link
                        key={fixture.fixture.id}
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                          <div>
                            <div className="font-medium">{fixture.teams.home.name}</div>
                            <div className="text-xs text-gray-500">{fixture.league.name}</div>
                          </div>
                        </div>
                        
                        {/* 스코어/시간 */}
                        <div className="px-4 text-center min-w-[100px]">
                          {isFinished || isLive ? (
                            <div>
                              <div className="text-xl font-bold">
                                {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                              </div>
                              <div className={`text-xs mt-1 ${isLive ? 'text-red-600 font-semibold animate-pulse' : 'text-gray-500'}`}>
                                {getStatusDisplay(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">{timeString}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {getStatusDisplay(fixture.fixture.status.short, null)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 원정팀 */}
                        <div className="flex items-center space-x-3 flex-1 justify-end">
                          <div className="text-right">
                            <div className="font-medium">{fixture.teams.away.name}</div>
                            <div className="text-xs text-gray-500">{fixture.league.name}</div>
                          </div>
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
              )}

              {/* 더보기 버튼 */}
              <div className="mt-4 text-center">
                <Link href="/fixtures">
                  <Button variant="outline" className="w-full">
                    모든 경기 보기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* 빠른 링크 */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/results">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Clock className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-base">경기 결과</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">최근 완료된 경기 결과 확인</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/leagues">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle className="text-base">리그 순위</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">각 리그별 순위표 확인</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* 오른쪽: 커뮤니티 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">커뮤니티</h2>
                <Link href="/community">
                  <Button variant="ghost" size="sm">
                    전체보기
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <BoardList />
            </div>
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="mt-12 bg-blue-600 text-white rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            모바일에서도 즐기세요
          </h3>
          <p className="text-blue-100 mb-6">
            iOS와 Android 앱에서도 동일한 경험을 누릴 수 있습니다
          </p>
          <Link href="/download">
            <Button size="lg" variant="secondary">
              앱 다운로드
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">FutInfo</span>
            </div>
            <p className="text-gray-600">
              © 2024 FutInfo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}