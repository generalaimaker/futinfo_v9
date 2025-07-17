'use client'

import { useState } from 'react'

export default function TestDirectPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testDirect = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('[TestDirect] Testing direct Edge Function call...')
      
      const response = await fetch('https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/unified-football-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
        },
        body: JSON.stringify({
          endpoint: 'fixtures',
          params: { date: '2025-01-16' }
        })
      })
      
      const data = await response.json()
      console.log('[TestDirect] Response status:', response.status)
      console.log('[TestDirect] Response data:', data)
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      setResult(data)
    } catch (err: any) {
      console.error('[TestDirect] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Edge Function Test</h1>
      
      <button
        onClick={testDirect}
        disabled={loading}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Direct Call'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}