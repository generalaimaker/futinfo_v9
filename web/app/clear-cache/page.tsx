'use client'

import { useState } from 'react'
import footballAPIService from '@/lib/supabase/football'

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false)

  const clearCache = () => {
    footballAPIService.clearCache()
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clear API Cache</h1>
      
      <button
        onClick={clearCache}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Clear All Cache
      </button>
      
      {cleared && (
        <p className="mt-4 text-green-600">Cache cleared successfully!</p>
      )}
      
      <p className="mt-4 text-sm text-gray-600">
        Click the button above to clear all cached API data and force fresh API calls.
      </p>
    </div>
  )
}