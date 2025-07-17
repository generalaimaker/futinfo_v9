'use client'

import { formatDate } from '@/lib/types/football'

export default function DebugDatePage() {
  const today = new Date()
  const dates = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    { label: 'Yesterday', date: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
    { label: '2025-01-16', date: new Date('2025-01-16') },
    { label: '2025-01-17', date: new Date('2025-01-17') },
    { label: '2025-07-16', date: new Date('2025-07-16') },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Date Debug Page</h1>
      
      <div className="space-y-2">
        {dates.map(({ label, date }) => (
          <div key={label} className="p-4 bg-gray-100 rounded">
            <div className="font-semibold">{label}</div>
            <div>Date object: {date.toString()}</div>
            <div>toISOString: {date.toISOString()}</div>
            <div>toLocaleDateString: {date.toLocaleDateString()}</div>
            <div className="text-blue-600 font-mono">formatDate: {formatDate(date)}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h2 className="font-semibold mb-2">Current Time Info:</h2>
        <div>Browser Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
        <div>Date.now(): {new Date().toString()}</div>
      </div>
    </div>
  )
}