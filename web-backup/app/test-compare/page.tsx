'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFixturesByDate } from '@/lib/supabase/football'

export default function TestComparePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const todayDate = new Date('2025-07-16')
  
  // Hook from main page
  const { data: hookData, error: hookError, isLoading: hookLoading, isError: hookIsError } = useFixturesByDate(todayDate)

  const testDirectCall = async () => {
    setLoading(true)
    
    try {
      // Method 1: Direct supabase.functions.invoke (working in test pages)
      console.log('[TestCompare] Method 1: Direct invoke')
      const { data: directData, error: directError } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: '2025-07-16' }
        }
      })
      
      // Method 2: Via callUnifiedAPI simulation
      console.log('[TestCompare] Method 2: Via service')
      const { data: serviceData, error: serviceError } = await supabase.functions.invoke('unified-football-api', {
        body: { 
          endpoint: 'fixtures', 
          params: { date: '2025-07-16' } 
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      setResult({
        directCall: {
          data: directData,
          error: directError,
          success: !directError
        },
        serviceCall: {
          data: serviceData,
          error: serviceError,
          success: !serviceError
        },
        hookCall: {
          data: hookData,
          error: hookError,
          isLoading: hookLoading,
          isError: hookIsError
        }
      })
    } catch (err: any) {
      console.error('[TestCompare] Error:', err)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Compare API Calls</h1>
      
      <button
        onClick={testDirectCall}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Compare All Methods'}
      </button>
      
      <div className="space-y-4">
        {/* Real-time Hook Status */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Real-time Hook Status (from main page)</h2>
          <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
            {JSON.stringify({
              isLoading: hookLoading,
              isError: hookIsError,
              error: hookError?.message || hookError,
              hasData: !!hookData,
              dataLength: hookData?.response?.length || 0
            }, null, 2)}
          </pre>
        </div>
        
        {/* Test Results */}
        {result && (
          <div className="border rounded p-4">
            <h2 className="text-lg font-semibold mb-2">API Call Comparison</h2>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}