'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestMLSKLeaguePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testLeagues = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Test today and tomorrow
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      const dates = [
        { label: 'Today', date: formatDate(today) },
        { label: 'Tomorrow', date: formatDate(tomorrow) }
      ]
      
      const results: any = {}
      
      for (const { label, date } of dates) {
        console.log(`[TestMLSKLeague] Testing ${label} (${date})...`)
        
        const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
          body: {
            endpoint: 'fixtures',
            params: { 
              date,
              league: '253,292' // MLS (253) and K League (292)
            }
          }
        })
        
        if (apiError) {
          console.error(`[TestMLSKLeague] Error for ${label}:`, apiError)
          results[label] = { error: apiError.message }
        } else {
          console.log(`[TestMLSKLeague] Success for ${label}:`, data)
          results[label] = {
            date,
            totalFixtures: data?.results || 0,
            fixtures: data?.response || [],
            leagues: {}
          }
          
          // Group by league
          if (data?.response) {
            data.response.forEach((fixture: any) => {
              const leagueId = fixture.league.id
              const leagueName = fixture.league.name
              if (!results[label].leagues[leagueId]) {
                results[label].leagues[leagueId] = {
                  name: leagueName,
                  fixtures: []
                }
              }
              results[label].leagues[leagueId].fixtures.push(fixture)
            })
          }
        }
      }
      
      setResult(results)
    } catch (err: any) {
      console.error('[TestMLSKLeague] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testAllMainLeagues = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const today = new Date()
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      const todayStr = formatDate(today)
      
      // Main leagues from iOS app
      const mainLeagues = [
        39, 140, 135, 78, 61, // European top 5
        307, // Saudi Pro League
        253, // MLS
        292  // K League
      ].join(',')
      
      console.log(`[TestMLSKLeague] Testing all main leagues for ${todayStr}...`)
      
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { 
            date: todayStr,
            league: mainLeagues
          }
        }
      })
      
      if (apiError) {
        throw apiError
      }
      
      console.log(`[TestMLSKLeague] Success:`, data)
      
      const groupedByLeague: any = {}
      if (data?.response) {
        data.response.forEach((fixture: any) => {
          const leagueId = fixture.league.id
          const leagueName = fixture.league.name
          if (!groupedByLeague[leagueId]) {
            groupedByLeague[leagueId] = {
              name: leagueName,
              fixtures: []
            }
          }
          groupedByLeague[leagueId].fixtures.push(fixture)
        })
      }
      
      setResult({
        'Main Leagues Today': {
          date: todayStr,
          totalFixtures: data?.results || 0,
          leagues: groupedByLeague
        }
      })
    } catch (err: any) {
      console.error('[TestMLSKLeague] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">MLS & K League Test</h1>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testLeagues}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test MLS & K League'}
        </button>
        
        <button
          onClick={testAllMainLeagues}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test All Main Leagues'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4 space-y-4">
          {Object.entries(result).map(([label, data]: [string, any]) => (
            <div key={label} className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">{label}</h2>
              
              {data.error ? (
                <p className="text-red-600">Error: {data.error}</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">
                    Date: {data.date} | Total: {data.totalFixtures} fixtures
                  </p>
                  
                  {Object.entries(data.leagues || {}).map(([leagueId, league]: [string, any]) => (
                    <div key={leagueId} className="mb-3">
                      <h3 className="font-medium">{league.name} ({league.fixtures.length} matches)</h3>
                      <div className="ml-4 space-y-1">
                        {league.fixtures.slice(0, 5).map((fixture: any, idx: number) => (
                          <div key={idx} className="text-sm text-gray-700">
                            {fixture.teams.home.name} vs {fixture.teams.away.name}
                            <span className="ml-2 text-gray-500">({fixture.fixture.status.long})</span>
                          </div>
                        ))}
                        {league.fixtures.length > 5 && (
                          <p className="text-sm text-gray-500">... and {league.fixtures.length - 5} more</p>
                        )}
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