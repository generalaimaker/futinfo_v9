'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestMainSimplePage() {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date('2025-07-16'))

  const fetchFixtures = async (date: Date) => {
    setLoading(true)
    setError(null)
    
    try {
      const formattedDate = date.toISOString().split('T')[0]
      console.log('[TestMainSimple] Fetching fixtures for:', formattedDate)
      
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: formattedDate }
        }
      })
      
      console.log('[TestMainSimple] Response:', { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      if (data?.response) {
        // Filter for main leagues
        const MAIN_LEAGUES = [39, 140, 135, 78, 61, 308, 253, 292, 2, 3]
        const filtered = data.response.filter((fixture: any) => 
          MAIN_LEAGUES.includes(fixture.league.id)
        )
        setFixtures(filtered)
      } else {
        setFixtures([])
      }
    } catch (err: any) {
      console.error('[TestMainSimple] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFixtures(selectedDate)
  }, [selectedDate])

  // Group by league
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
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">경기 일정을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">오류가 발생했습니다: {error}</p>
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
                    <div key={fixture.fixture.id} className="p-4">
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