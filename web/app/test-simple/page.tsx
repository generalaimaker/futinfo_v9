'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestSimplePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testSimple = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('[TestSimple] Testing simple edge function...')
      
      const { data, error: apiError } = await supabase.functions.invoke('simple-test', {
        body: {
          test: 'hello',
          timestamp: new Date().toISOString()
        }
      })
      
      console.log('[TestSimple] Response:', { data, error: apiError })
      
      if (apiError) {
        throw apiError
      }
      
      setResult(data)
    } catch (err: any) {
      console.error('[TestSimple] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testUnifiedAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('[TestSimple] Testing unified-football-api...')
      
      const { data, error: apiError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: '2025-01-16' }
        }
      })
      
      console.log('[TestSimple] Unified API Response:', { data, error: apiError })
      
      if (apiError) {
        console.error('[TestSimple] API Error details:', apiError)
        // Even if there's an error, show the data if available
        if (data) {
          setResult({ error: apiError.message, data: data })
        } else {
          throw apiError
        }
      } else {
        setResult(data)
      }
    } catch (err: any) {
      console.error('[TestSimple] Error:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Edge Function Test</h1>
      
      <div className="space-x-2">
        <button
          onClick={testSimple}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Simple Function'}
        </button>
        
        <button
          onClick={testUnifiedAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Unified API'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}