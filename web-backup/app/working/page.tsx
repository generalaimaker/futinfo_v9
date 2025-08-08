'use client'

import { useState } from 'react'
import { largeMockFixturesData } from '@/lib/supabase/largeMockData'

export default function WorkingPage() {
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  
  // 리그별로 그룹화
  const leagues = Array.from(
    new Set(largeMockFixturesData.response.map(f => f.league.id))
  ).map(leagueId => {
    const league = largeMockFixturesData.response.find(f => f.league.id === leagueId)!.league
    return league
  })

  const filteredFixtures = selectedLeague 
    ? largeMockFixturesData.response.filter(f => f.league.id === selectedLeague)
    : largeMockFixturesData.response

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">FUTINFO - 축구 일정</h1>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen p-4">
          <h2 className="font-semibold text-gray-700 mb-4">리그 필터</h2>
          <button
            onClick={() => setSelectedLeague(null)}
            className={`w-full text-left px-3 py-2 rounded mb-2 ${
              !selectedLeague ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            전체 리그
          </button>
          {leagues.map(league => (
            <button
              key={league.id}
              onClick={() => setSelectedLeague(league.id)}
              className={`w-full text-left px-3 py-2 rounded mb-2 ${
                selectedLeague === league.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
              }`}
            >
              {league.name}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {selectedLeague 
                ? leagues.find(l => l.id === selectedLeague)?.name 
                : '모든 경기'} ({filteredFixtures.length}개)
            </h2>
          </div>

          <div className="grid gap-4">
            {filteredFixtures.map((fixture) => (
              <div key={fixture.fixture.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {fixture.league.name} • {fixture.league.country}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    fixture.fixture.status.short === 'FT' ? 'bg-gray-200' :
                    fixture.fixture.status.short === 'NS' ? 'bg-blue-100' :
                    'bg-green-100'
                  }`}>
                    {fixture.fixture.status.long}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-right">
                    <p className="font-semibold">{fixture.teams.home.name}</p>
                  </div>
                  <div className="px-6">
                    <p className="text-2xl font-bold">
                      {fixture.goals?.home ?? '-'} : {fixture.goals?.away ?? '-'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{fixture.teams.away.name}</p>
                  </div>
                </div>

                <div className="mt-2 text-center text-sm text-gray-500">
                  {fixture.fixture.venue?.name || 'Stadium'} • {fixture.fixture.venue?.city || 'City'}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}