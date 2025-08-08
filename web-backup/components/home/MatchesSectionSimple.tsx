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
  
  const [showDatePicker, setShowDatePicker] = useState(false)
  
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
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </span>
              <svg className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-4 z-50">
                <div className="grid grid-cols-7 gap-1 w-64">
                  {/* Month Navigation */}
                  <div className="col-span-7 flex items-center justify-between mb-2">
                    <button
                      onClick={() => {
                        const newDate = new Date(selectedDate)
                        newDate.setMonth(newDate.getMonth() - 1)
                        setSelectedDate(newDate)
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="font-semibold">
                      {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                    </span>
                    <button
                      onClick={() => {
                        const newDate = new Date(selectedDate)
                        newDate.setMonth(newDate.getMonth() + 1)
                        setSelectedDate(newDate)
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Weekday Headers */}
                  {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar Days */}
                  {(() => {
                    const year = selectedDate.getFullYear()
                    const month = selectedDate.getMonth()
                    const firstDay = new Date(year, month, 1).getDay()
                    const daysInMonth = new Date(year, month + 1, 0).getDate()
                    const days = []
                    
                    // Empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} />)
                    }
                    
                    // Days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day)
                      const isSelected = date.toDateString() === selectedDate.toDateString()
                      const isToday = date.toDateString() === new Date().toDateString()
                      
                      days.push(
                        <button
                          key={day}
                          onClick={() => {
                            const newDate = new Date(year, month, day)
                            newDate.setHours(12, 0, 0, 0)
                            setSelectedDate(newDate)
                            setShowDatePicker(false)
                          }}
                          className={`
                            p-2 text-sm rounded hover:bg-gray-100 transition-colors
                            ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                            ${isToday && !isSelected ? 'bg-gray-200' : ''}
                          `}
                        >
                          {day}
                        </button>
                      )
                    }
                    
                    return days
                  })()}
                </div>
                
                {/* Quick Actions */}
                <div className="mt-3 pt-3 border-t flex justify-center space-x-2">
                  <button
                    onClick={() => {
                      const today = new Date()
                      today.setHours(12, 0, 0, 0)
                      setSelectedDate(today)
                      setShowDatePicker(false)
                    }}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    오늘
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() + 1)
              setSelectedDate(newDate)
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center space-x-3">
                  {league.logo && (
                    <img 
                      src={league.logo} 
                      alt={league.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex items-center space-x-2">
                    {league.flag && (
                      <img 
                        src={league.flag} 
                        alt={league.country}
                        className="w-5 h-4 object-cover rounded-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <span className="font-semibold text-sm text-gray-700">{league.country}</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-sm text-gray-600">{league.name}</span>
                  </div>
                </div>
              </div>

              {/* Matches */}
              <div className="divide-y">
                {matches.map((fixture) => {
                  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)
                  const isLive = ['1H', '2H', 'ET', 'P', 'HT', 'BT'].includes(fixture.fixture.status.short)
                  const isScheduled = fixture.fixture.status.short === 'NS'
                  
                  return (
                    <div 
                      key={fixture.fixture.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/fixtures/${fixture.fixture.id}`)}
                    >
                      {/* Match Time/Status */}
                      <div className="text-center mb-3">
                        {isLive && (
                          <div className="inline-flex items-center space-x-2">
                            <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="text-red-500 font-semibold text-sm">
                              {fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : fixture.fixture.status.long}
                            </span>
                          </div>
                        )}
                        {isFinished && (
                          <span className="text-gray-600 text-sm font-medium">
                            {fixture.fixture.status.long}
                          </span>
                        )}
                        {isScheduled && (
                          <span className="text-gray-500 text-sm">
                            {new Date(fixture.fixture.date).toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      
                      {/* Teams and Score */}
                      <div className="flex items-center justify-between">
                        {/* Home Team */}
                        <div className="flex-1 flex items-center justify-end space-x-3">
                          <span className="font-medium text-right">{fixture.teams.home.name}</span>
                          <img 
                            src={fixture.teams.home.logo} 
                            alt={fixture.teams.home.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-team.svg'
                            }}
                          />
                        </div>
                        
                        {/* Score */}
                        <div className="px-6 min-w-[80px] text-center">
                          {(isFinished || isLive) ? (
                            <div className="flex items-center justify-center space-x-2">
                              <span className={`text-2xl font-bold ${fixture.goals.home > fixture.goals.away ? 'text-gray-900' : 'text-gray-400'}`}>
                                {fixture.goals.home ?? 0}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className={`text-2xl font-bold ${fixture.goals.away > fixture.goals.home ? 'text-gray-900' : 'text-gray-400'}`}>
                                {fixture.goals.away ?? 0}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-lg">vs</span>
                          )}
                        </div>
                        
                        {/* Away Team */}
                        <div className="flex-1 flex items-center space-x-3">
                          <img 
                            src={fixture.teams.away.logo} 
                            alt={fixture.teams.away.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-team.svg'
                            }}
                          />
                          <span className="font-medium">{fixture.teams.away.name}</span>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      {fixture.goals.extratime && (
                        <div className="text-center mt-2 text-xs text-gray-500">
                          연장 ({fixture.goals.extratime.home ?? 0} - {fixture.goals.extratime.away ?? 0})
                        </div>
                      )}
                      {fixture.goals.penalty && (
                        <div className="text-center mt-1 text-xs text-gray-500">
                          승부차기 ({fixture.goals.penalty.home ?? 0} - {fixture.goals.penalty.away ?? 0})
                        </div>
                      )}
                    </div>
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