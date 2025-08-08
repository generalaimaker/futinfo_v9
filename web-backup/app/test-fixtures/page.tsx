'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/types/football'

export default function TestFixturesPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const testFixtures = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const formattedDate = formatDate(selectedDate)
      console.log('[TestFixtures] Testing with date:', formattedDate)
      
      // 직접 API 호출
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: formattedDate }
        }
      })
      
      console.log('[TestFixtures] Response:', { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      setResult(data)
    } catch (err: any) {
      console.error('[TestFixtures] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testWithLeague = async (leagueId: number, leagueName: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const formattedDate = formatDate(selectedDate)
      console.log(`[TestFixtures] Testing ${leagueName} with date:`, formattedDate)
      
      // 특정 리그로 API 호출
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { 
            date: formattedDate,
            league: leagueId
          }
        }
      })
      
      console.log(`[TestFixtures] ${leagueName} Response:`, { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      setResult(data)
    } catch (err: any) {
      console.error(`[TestFixtures] ${leagueName} Error:`, err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Fixtures API Test</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Select Date:</label>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="px-3 py-2 border rounded"
        />
        <p className="text-sm text-gray-600 mt-1">
          Formatted: {formatDate(selectedDate)}
        </p>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={testFixtures}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
        >
          {loading ? 'Loading...' : 'Test All Fixtures'}
        </button>
        
        <button
          onClick={() => testWithLeague(39, 'Premier League')}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 mr-2"
        >
          Test Premier League
        </button>
        
        <button
          onClick={() => testWithLeague(292, 'K League')}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 mr-2"
        >
          Test K League
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
            Result: {result.results || 0} fixtures found
          </h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}