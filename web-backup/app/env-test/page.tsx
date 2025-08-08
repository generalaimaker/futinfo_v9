'use client'

import { useState } from 'react'

export default function EnvTestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const testEnv = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-env`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({})
        }
      )
      
      const data = await response.json()
      console.log('Env test response:', data)
      setResult(data)
    } catch (err) {
      console.error('Env test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Variables Test</h1>
      
      <button 
        onClick={testEnv}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#999' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Test Environment Variables'}
      </button>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '20px', 
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          <h2>Result:</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}