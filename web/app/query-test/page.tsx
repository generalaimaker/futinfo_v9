'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export default function QueryTestPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('[QueryTest] Component mounted')
  }, [])

  const { data, isLoading, isError, error, status } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      console.log('[QueryTest] Query function executing...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { message: 'Query successful!', time: new Date().toISOString() }
    },
    enabled: mounted,
  })

  console.log('[QueryTest] Render:', { mounted, status, isLoading, isError, data })

  if (!mounted) {
    return <div>Mounting...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>React Query Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p>Status: {status}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {isError ? 'Yes' : 'No'}</p>
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      </div>

      {data && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f0f0f0',
          borderRadius: '4px'
        }}>
          <p>Message: {data.message}</p>
          <p>Time: {data.time}</p>
        </div>
      )}

      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reload Page
      </button>
    </div>
  )
}