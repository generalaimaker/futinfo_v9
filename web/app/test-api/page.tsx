'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestAPIPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    console.log('Testing API with Supabase client...')
    setLoading(true)
    setError('')
    
    try {
      const { data: result, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: '2025-01-16' }
        }
      })
      
      console.log('Supabase response:', { data: result, error: apiError })
      
      if (apiError) {
        throw new Error(apiError.message)
      }
      
      setData(result)
    } catch (err) {
      console.error('API Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('TestAPIPage mounted')
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test Page</h1>
      
      <button 
        onClick={testAPI}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#999' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Loading...' : 'Test API Call'}
      </button>
      
      {error && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fee', color: '#c00' }}>
          Error: {error}
        </div>
      )}
      
      {data && (
        <div style={{ marginTop: '20px' }}>
          <h2>Response:</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <p>개발자 도구의 Console 탭을 확인하세요.</p>
      </div>
    </div>
  )
}