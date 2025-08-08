'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestEdgeFunctionPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testEdgeFunction = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('[TestEdgeFunction] Testing unified-football-api...')
      
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'leagues',
          params: { current: true }
        }
      })
      
      console.log('[TestEdgeFunction] Response:', { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      setResult(data)
    } catch (err) {
      console.error('[TestEdgeFunction] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edge Function Test</h1>
      
      <button
        onClick={testEdgeFunction}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Edge Function'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}