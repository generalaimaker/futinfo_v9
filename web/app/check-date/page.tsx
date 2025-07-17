'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/types/football'

export default function CheckDatePage() {
  const [dateInfo, setDateInfo] = useState<any>(null)

  useEffect(() => {
    const now = new Date()
    const info = {
      'new Date()': now.toString(),
      'toISOString()': now.toISOString(),
      'toLocaleDateString()': now.toLocaleDateString(),
      'formatDate()': formatDate(now),
      'getFullYear()': now.getFullYear(),
      'getMonth()': now.getMonth(),
      'getDate()': now.getDate(),
      'timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'locale': navigator.language
    }
    setDateInfo(info)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Date Check</h1>
      
      {dateInfo && (
        <div className="space-y-2">
          {Object.entries(dateInfo).map(([key, value]) => (
            <div key={key} className="font-mono text-sm">
              <span className="font-semibold">{key}:</span> {String(value)}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Expected vs Actual</h2>
        <p>Expected: 2025-01-16 (January 16, 2025)</p>
        <p>Actual: {dateInfo?.['formatDate()']}</p>
      </div>
    </div>
  )
}