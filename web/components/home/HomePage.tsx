'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase/provider'
import Link from 'next/link'
import { MatchesSectionSimple } from './MatchesSectionSimple'
import { NewsSectionSimple } from './NewsSectionSimple'
import { StandingsSectionSimple } from './StandingsSectionSimple'
import { CommunitySection } from './CommunitySection'
import { BigMatchesSection } from './BigMatchesSection'
import { useFixturesByDate } from '@/lib/supabase/football'
import { FixturesResponse } from '@/lib/types/football'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const { user } = useSupabase()

  useEffect(() => {
    setMounted(true)
    console.log('[HomePage] Component mounted')
  }, [])

  // 오늘 날짜 테스트
  const today = new Date()
  
  const { data: fixturesData, isLoading, isError, error } = useFixturesByDate(today) as { 
    data: FixturesResponse | undefined; 
    isLoading: boolean; 
    isError: boolean;
    error: Error | null 
  }

  console.log('[HomePage] Render:', {
    mounted,
    user: !!user,
    isLoading,
    isError,
    error: error?.message,
    fixturesCount: fixturesData?.response?.length || 0
  })

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <main className="flex-1 pb-16 md:pb-0">
      <div className="container mx-auto p-4 space-y-6">
        <BigMatchesSection />
        <MatchesSectionSimple />
        <StandingsSectionSimple />
        <NewsSectionSimple />
        {user && <CommunitySection />}
        
        {/* 디버그 정보 */}
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p>Mounted: {mounted ? 'Yes' : 'No'}</p>
          <p>User: {user ? user.email : 'Not logged in'}</p>
          <p>Today: {today.toISOString().split('T')[0]}</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {isError ? error?.message : 'None'}</p>
          <p>Fixtures: {fixturesData?.response?.length || 0}</p>
        </div>
        
        {/* 테스트 링크들 */}
        <div className="mt-4 space-x-4">
          <Link href="/test-api" className="text-blue-600 hover:underline">
            API Test
          </Link>
          <Link href="/test-fixtures" className="text-blue-600 hover:underline">
            Fixtures Test
          </Link>
          <Link href="/query-test" className="text-blue-600 hover:underline">
            Query Test
          </Link>
        </div>
      </div>
    </main>
  )
}