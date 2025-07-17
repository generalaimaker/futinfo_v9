'use client'

import { MatchesSectionSimple } from '@/components/home/MatchesSectionSimple'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">FutInfo Web</h1>
        
        {/* Main Content */}
        <main className="bg-white rounded-lg shadow h-[600px]">
          <MatchesSectionSimple />
        </main>
        
        {/* Test Links */}
        <div className="mt-4 space-x-4">
          <a href="/test-api" className="text-blue-600 hover:underline">
            API Test
          </a>
          <a href="/test-fixtures" className="text-blue-600 hover:underline">
            Fixtures Test
          </a>
          <a href="/test-edge-basic" className="text-blue-600 hover:underline">
            Basic Edge Test
          </a>
          <a href="/test-july" className="text-blue-600 hover:underline">
            July Test
          </a>
          <a href="/test-main-simple" className="text-blue-600 hover:underline">
            Simple Main Test
          </a>
          <a href="/test-compare" className="text-blue-600 hover:underline">
            Compare API Calls
          </a>
          <a href="/test-edge-direct" className="text-blue-600 hover:underline">
            Edge Direct Test
          </a>
          <a href="/test-same-as-main" className="text-blue-600 hover:underline">
            Same as Main Test
          </a>
        </div>
      </div>
    </div>
  )
}