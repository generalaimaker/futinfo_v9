'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestJulyPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testJulyDates = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const dates = [
        '2025-07-16', // 오늘
        '2025-07-17', // 내일
        '2025-07-18', // 모레
        '2025-07-19', // 3일 후
        '2025-07-20'  // 4일 후 (주말)
      ]
      
      const results: any = {}
      
      for (const date of dates) {
        console.log(`[TestJuly] Testing date: ${date}`)
        
        const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
          body: {
            endpoint: 'fixtures',
            params: { date }
          }
        })
        
        if (apiError) {
          console.error(`[TestJuly] Error for ${date}:`, apiError)
          results[date] = { error: apiError.message }
        } else {
          console.log(`[TestJuly] Success for ${date}:`, data)
          
          // 리그별로 그룹화
          const leagueGroups: any = {}
          if (data?.response) {
            data.response.forEach((fixture: any) => {
              const leagueId = fixture.league.id
              const leagueName = fixture.league.name
              if (!leagueGroups[leagueId]) {
                leagueGroups[leagueId] = {
                  name: leagueName,
                  count: 0,
                  fixtures: []
                }
              }
              leagueGroups[leagueId].count++
              if (leagueGroups[leagueId].fixtures.length < 3) { // 각 리그당 최대 3경기만 저장
                leagueGroups[leagueId].fixtures.push(fixture)
              }
            })
          }
          
          results[date] = {
            total: data?.results || 0,
            leagues: leagueGroups,
            mlsCount: leagueGroups[253]?.count || 0,
            kLeagueCount: leagueGroups[292]?.count || 0
          }
        }
      }
      
      setResult(results)
    } catch (err: any) {
      console.error('[TestJuly] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">July Fixtures Test</h1>
      
      <button
        onClick={testJulyDates}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Test July 16-20 Fixtures'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4 space-y-4">
          {Object.entries(result).map(([date, data]: [string, any]) => (
            <div key={date} className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">{date}</h2>
              
              {data.error ? (
                <p className="text-red-600">Error: {data.error}</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">
                    Total: {data.total} fixtures | MLS: {data.mlsCount} | K League: {data.kLeagueCount}
                  </p>
                  
                  {Object.values(data.leagues || {}).map((league: any) => (
                    <div key={league.name} className="mb-2">
                      <h3 className="font-medium">{league.name} ({league.count} matches)</h3>
                      <div className="ml-4 text-sm text-gray-700">
                        {league.fixtures.map((fixture: any, idx: number) => (
                          <div key={idx}>
                            {fixture.teams.home.name} vs {fixture.teams.away.name}
                          </div>
                        ))}
                        {league.count > 3 && <p className="text-gray-500">... +{league.count - 3} more</p>}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}