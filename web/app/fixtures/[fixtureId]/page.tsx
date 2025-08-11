'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useFixtureDetail } from '@/lib/supabase/football'
import { isFinishedMatch } from '@/lib/types/football'
import { useFixtureRealtime } from '@/hooks/useFixtureRealtime'
import { EnhancedMatchDetail } from '@/components/fixtures/EnhancedMatchDetail'
import MatchHeader from '@/components/fixtures/match-header'
import MatchTabs from '@/components/fixtures/match-tabs'
import MatchSummary from '@/components/fixtures/match-summary'
import MatchStatistics from '@/components/fixtures/match-statistics'
import MatchLineups from '@/components/fixtures/match-lineups'
import MatchStandings from '@/components/fixtures/match-standings'
import MatchH2H from '@/components/fixtures/match-h2h'
import MatchInfo from '@/components/fixtures/match-info'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function FixtureDetailPage() {
  const params = useParams()
  const fixtureId = params.fixtureId as string
  
  // fixtureId 유효성 검사
  const numericFixtureId = parseInt(fixtureId)
  const isValidId = !isNaN(numericFixtureId) && numericFixtureId > 0
  
  const { data, isLoading, error, refetch } = useFixtureDetail(numericFixtureId)
  
  const [activeTab, setActiveTab] = useState('summary')
  
  // 경기 상태에 따라 기본 탭 설정
  useEffect(() => {
    if (data?.response?.[0]) {
      const fixture = data.response[0]
      const isFinished = isFinishedMatch(fixture.fixture.status.short)
      setActiveTab(isFinished ? 'summary' : 'info')
    }
  }, [data])
  
  // 라이브 경기 상태 확인
  const isLive = data?.response?.[0] ? 
    ['1H', '2H', 'ET', 'P', 'HT', 'BT'].includes(data.response[0].fixture.status.short) : 
    false

  // Realtime 구독 (라이브 경기만)
  useFixtureRealtime({
    fixtureId: numericFixtureId,
    isLive,
    onUpdate: () => {
      console.log(`Fixture ${numericFixtureId} updated via realtime`)
      refetch()
    }
  })

  // 폴백: 라이브 경기인 경우 30초 간격 폴링
  useEffect(() => {
    if (!isLive) return
    
    const interval = setInterval(() => {
      refetch()
    }, 30000) // 30초마다 새로고침
    
    return () => clearInterval(interval)
  }, [isLive, refetch])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    )
  }
  
  if (!isValidId || error || !data?.response?.[0]) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">
            {!isValidId ? '잘못된 경기 ID입니다.' : '경기 정보를 불러오는데 실패했습니다.'}
          </p>
          <div className="space-x-2">
            <Link href="/fixtures">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-1" />
                경기 목록
              </Button>
            </Link>
            {isValidId && (
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                다시 시도
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  const fixture = data.response[0]
  const isFinished = isFinishedMatch(fixture.fixture.status.short)
  
  // 탭 설정
  const tabs = isFinished ? [
    { id: 'summary', label: '경기요약' },
    { id: 'statistics', label: '통계' },
    { id: 'lineups', label: '라인업' },
    { id: 'standings', label: '순위' },
    { id: 'h2h', label: '상대전적' }
  ] : [
    { id: 'info', label: '정보' },
    { id: 'standings', label: '순위' },
    { id: 'h2h', label: '상대전적' }
  ]
  
  // 개선된 UI 사용 여부 (토글 가능)
  const useEnhancedUI = true
  
  if (useEnhancedUI) {
    return (
      <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/fixtures">
                <Button variant="ghost">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  경기 목록
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">경기 상세</h1>
            </div>
            
            {isLive && (
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                새로고침
              </Button>
            )}
          </div>
          
          {/* 개선된 경기 상세 컴포넌트 */}
          <EnhancedMatchDetail 
            fixture={fixture} 
            isLive={isLive}
            onRefresh={refetch}
          />
        </div>
      </div>
    )
  }
  
  // 기존 UI (폴백)
  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/fixtures">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  경기 목록
                </Button>
              </Link>
              <h1 className="text-xl font-bold">경기 상세</h1>
            </div>
            
            {/* 라이브 경기 새로고침 버튼 */}
            {['1H', '2H', 'ET', 'P', 'HT', 'BT'].includes(fixture.fixture.status.short) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-red-600"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                새로고침
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* 컨텐츠 */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 경기 헤더 */}
          <MatchHeader fixture={fixture} />
          
          {/* 탭 네비게이션 */}
          <MatchTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          {/* 탭 컨텐츠 */}
          <div className="p-4">
            {activeTab === 'summary' && <MatchSummary fixture={fixture} />}
            {activeTab === 'statistics' && <MatchStatistics fixture={fixture} />}
            {activeTab === 'lineups' && <MatchLineups fixture={fixture} />}
            {activeTab === 'standings' && <MatchStandings leagueId={fixture.league.id} season={fixture.league.season} />}
            {activeTab === 'h2h' && <MatchH2H fixture={fixture} />}
            {activeTab === 'info' && <MatchInfo fixture={fixture} />}
          </div>
        </div>
      </main>
    </div>
  )
}