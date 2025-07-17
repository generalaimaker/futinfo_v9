'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFixturesByDate } from '@/lib/supabase/football'
import { FixturesResponse } from '@/lib/types/football'

export function MatchesSectionSimple() {
  const router = useRouter()
  
  // Ensure we start with the correct date (July 16, 2025)
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date('2025-07-16T00:00:00')
    date.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    return date
  })
  
  // API 데이터 사용
  const { data: fixturesData, isLoading, error, isError, status, fetchStatus } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined; 
    isLoading: boolean; 
    error: Error | null;
    isError: boolean;
    status: string;
    fetchStatus: string;
  }
  const fixtures = fixturesData?.response || []
  
  console.log('[MatchesSectionSimple] Render:', {
    selectedDate: selectedDate.toISOString(),
    isLoading,
    isError,
    status,
    fetchStatus,
    error: error?.message || error,
    errorString: error?.toString(),
    fixturesCount: fixtures.length,
    fixturesData,
    hasData: !!fixturesData
  })
  
  // 리그별로 그룹화
  const matchesByLeague = fixtures.reduce((acc, fixture) => {
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
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() - 1)
              setSelectedDate(newDate)
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            이전
          </button>
          <h2 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 경기
          </h2>
          <button 
            onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() + 1)
              setSelectedDate(newDate)
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          >
            다음
          </button>
        </div>
        <p className="text-sm text-gray-500 text-center">총 {fixtures.length}개 경기</p>
      </div>

      {/* Matches Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">경기 일정을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">오류가 발생했습니다: {(error as Error).message}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-600">상세 정보</summary>
              <pre className="mt-2 text-xs text-left bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({
                  message: (error as Error).message,
                  stack: (error as Error).stack,
                  status,
                  fetchStatus,
                  selectedDate: selectedDate.toISOString()
                }, null, 2)}
              </pre>
            </details>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">오늘은 예정된 경기가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
          {Object.values(matchesByLeague).map(({ league, matches }) => (
            <div key={league.id} className="bg-white rounded-lg overflow-hidden">
              {/* League Header */}
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-sm">{league.country} - {league.name}</span>
                </div>
              </div>

              {/* Matches */}
              <div className="divide-y">
                {matches.map((fixture) => (
                  <div 
                    key={fixture.fixture.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/fixtures/${fixture.fixture.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <span className="font-medium">{fixture.teams.home.name}</span>
                      </div>
                      <div className="px-4">
                        <span className="text-lg font-bold">
                          {fixture.goals.home ?? '-'} : {fixture.goals.away ?? '-'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{fixture.teams.away.name}</span>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-sm text-gray-500">{fixture.fixture.status.long}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}