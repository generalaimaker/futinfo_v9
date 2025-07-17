'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/types/football'

export default function TestTodayPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testToday = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const today = new Date()
      const formattedDate = formatDate(today)
      console.log('[TestToday] Testing with today\'s date:', formattedDate)
      console.log('[TestToday] Full date object:', today)
      
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: formattedDate }
        }
      })
      
      console.log('[TestToday] Response:', { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      setResult({
        date: formattedDate,
        totalFixtures: data?.results || 0,
        fixtures: data?.response || []
      })
    } catch (err: any) {
      console.error('[TestToday] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testSpecificDate = async (dateStr: string) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('[TestToday] Testing with specific date:', dateStr)
      
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: dateStr }
        }
      })
      
      console.log('[TestToday] Response:', { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      setResult({
        date: dateStr,
        totalFixtures: data?.results || 0,
        fixtures: data?.response || []
      })
    } catch (err: any) {
      console.error('[TestToday] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Today's Fixtures Test</h1>
      
      <div className="mb-4">
        <p className="text-gray-600">Today's date: {new Date().toLocaleDateString()}</p>
        <p className="text-gray-600">Formatted: {formatDate(new Date())}</p>
      </div>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testToday}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Today'}
        </button>
        
        <button
          onClick={() => testSpecificDate('2025-01-16')}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test 2025-01-16
        </button>
        
        <button
          onClick={() => testSpecificDate('2025-01-17')}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test 2025-01-17
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
            Results for {result.date}: {result.totalFixtures} fixtures
          </h2>
          
          {result.totalFixtures > 0 && (
            <div className="space-y-2 max-h-96 overflow-auto">
              {result.fixtures.slice(0, 10).map((fixture: any, index: number) => (
                <div key={index} className="p-2 bg-gray-100 rounded">
                  <div className="font-semibold">{fixture.league.name}</div>
                  <div>{fixture.teams.home.name} vs {fixture.teams.away.name}</div>
                  <div className="text-sm text-gray-600">{fixture.fixture.status.long}</div>
                </div>
              ))}
              {result.totalFixtures > 10 && (
                <p className="text-gray-500">... and {result.totalFixtures - 10} more fixtures</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}