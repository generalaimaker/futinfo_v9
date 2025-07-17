'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatDate } from '@/lib/types/football'

export default function APITestPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const fetchFixtures = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const formattedDate = formatDate(selectedDate)
      console.log('Fetching fixtures for date:', formattedDate)
      
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('unified-football-api', {
        body: { 
          endpoint: 'fixtures', 
          params: { date: formattedDate } 
        }
      })
      
      if (edgeError) {
        setError(edgeError.message)
      } else {
        setData(edgeData)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFixtures()
  }, [selectedDate])

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>API Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => changeDate(-1)}
          style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}
        >
          Previous Day
        </button>
        <span style={{ margin: '0 20px' }}>
          {selectedDate.toLocaleDateString()} ({formatDate(selectedDate)})
        </span>
        <button 
          onClick={() => changeDate(1)}
          style={{ padding: '8px 16px', marginLeft: '10px', cursor: 'pointer' }}
        >
          Next Day
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {data && (
        <div>
          <p>Results: {data.results || 0}</p>
          <p>Response length: {data.response?.length || 0}</p>
          
          {data.response && data.response.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h2>First 5 fixtures:</h2>
              {data.response.slice(0, 5).map((fixture: any, index: number) => (
                <div key={index} style={{ 
                  padding: '10px', 
                  margin: '10px 0', 
                  border: '1px solid #ddd',
                  borderRadius: '4px' 
                }}>
                  <p><strong>{fixture.league.name}</strong></p>
                  <p>{fixture.teams.home.name} vs {fixture.teams.away.name}</p>
                  <p>Score: {fixture.goals.home ?? '-'} - {fixture.goals.away ?? '-'}</p>
                  <p>Status: {fixture.fixture.status.long}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}