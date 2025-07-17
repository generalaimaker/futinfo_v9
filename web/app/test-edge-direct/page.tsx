'use client'

import { useState } from 'react'

export default function TestEdgeDirectPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testEdgeFunction = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/unified-football-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0MzE1NDYsImV4cCI6MjA1MjAwNzU0Nn0.7V9cnAvuXBPoiKZrcY7Dl5wOOApgBdZLYqF76F1NquQ'
        },
        body: JSON.stringify({
          endpoint: 'fixtures',
          params: { date: '2025-07-16' }
        })
      })
      
      const text = await response.text()
      console.log('Raw response:', text)
      console.log('Status:', response.status)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))
      
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        data = { raw: text }
      }
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        raw: text
      })
    } catch (err: any) {
      console.error('Error:', err)
      setResult({ error: err.message, stack: err.stack })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Edge Function Test</h1>
      
      <button
        onClick={testEdgeFunction}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Test Edge Function Directly'}
      </button>
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}