'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestDebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDirectAPI = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/unified-football-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token || (await supabase.auth.getSession()).data.session?.access_token || ''}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0MzE1NDYsImV4cCI6MjA1MjAwNzU0Nn0.7V9cnAvuXBPoiKZrcY7Dl5wOOApgBdZLYqF76F1NquQ'
        },
        body: JSON.stringify({
          endpoint: 'fixtures',
          params: { date: '2025-07-16' }
        })
      })
      
      const text = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', text)
      
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        data = { raw: text }
      }
      
      setResult({
        status: response.status,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      })
    } catch (err: any) {
      console.error('Error:', err)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseClient = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('unified-football-api', {
        body: {
          endpoint: 'fixtures',
          params: { date: '2025-07-16' }
        }
      })
      
      console.log('Supabase response:', { data, error })
      
      setResult({
        method: 'Supabase Client',
        data,
        error
      })
    } catch (err: any) {
      console.error('Error:', err)
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug API Test</h1>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testDirectAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Direct API
        </button>
        
        <button
          onClick={testSupabaseClient}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Supabase Client
        </button>
      </div>
      
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