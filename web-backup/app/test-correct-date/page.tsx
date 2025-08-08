'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestCorrectDatePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testDate = async (dateStr: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`[TestCorrectDate] Testing with date: ${dateStr}`)
      
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: dateStr }
        }
      })
      
      console.log(`[TestCorrectDate] Response:`, { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      // Filter for MLS and K League
      let filteredFixtures = []
      if (data?.response && Array.isArray(data.response)) {
        filteredFixtures = data.response.filter((fixture: any) => 
          fixture.league.id === 253 || // MLS
          fixture.league.id === 292    // K League
        )
      }
      
      setResult({
        date: dateStr,
        totalFixtures: data?.results || 0,
        mlsKLeagueFixtures: filteredFixtures.length,
        fixtures: filteredFixtures
      })
    } catch (err: any) {
      console.error('[TestCorrectDate] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Correct Date</h1>
      
      <div className="mb-4">
        <p className="text-gray-600">Testing fixtures for specific dates</p>
      </div>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={() => testDate('2025-01-16')}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test 2025-01-16
        </button>
        
        <button
          onClick={() => testDate('2025-01-17')}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test 2025-01-17
        </button>
        
        <button
          onClick={() => testDate('2024-12-01')}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test 2024-12-01 (Past)
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">
            Results for {result.date}
          </h2>
          <p className="text-gray-600">
            Total fixtures: {result.totalFixtures}
          </p>
          <p className="text-gray-600">
            MLS & K League fixtures: {result.mlsKLeagueFixtures}
          </p>
          
          {result.fixtures.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.fixtures.map((fixture: any, index: number) => (
                <div key={index} className="p-3 bg-gray-100 rounded">
                  <div className="font-semibold">{fixture.league.name}</div>
                  <div>{fixture.teams.home.name} vs {fixture.teams.away.name}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(fixture.fixture.date).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}