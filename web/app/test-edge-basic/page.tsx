'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestEdgeBasicPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  
  const testSimpleAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('test-simple-api', {
        body: { test: true }
      })
      
      if (error) {
        setError(error)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }
  
  const testDebugAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('unified-football-api-debug', {
        body: { 
          endpoint: 'fixtures',
          params: { date: '2025-07-16' }
        }
      })
      
      if (error) {
        setError(error)
      } else {
        setResult(data)
      }
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }
  
  const testDirectFetch = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      // Supabase anon key 직접 사용
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const response = await fetch(
        'https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/test-simple-api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey
          },
          body: JSON.stringify({ test: true })
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        setError({ status: response.status, data })
      } else {
        setResult(data)
      }
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Basic Edge Function Test</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testSimpleAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Simple API (Supabase Client)
          </button>
          
          <button
            onClick={testDebugAPI}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Debug API
          </button>
          
          <button
            onClick={testDirectFetch}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Direct Fetch
          </button>
        </div>
        
        {loading && <div className="text-gray-600">Loading...</div>}
        
        {error && (
          <div className="border border-red-400 rounded p-4 bg-red-50">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Error</h2>
            <pre className="p-2 bg-white rounded text-sm overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
        
        {result && (
          <div className="border rounded p-4">
            <h2 className="text-lg font-semibold mb-2">Result</h2>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}