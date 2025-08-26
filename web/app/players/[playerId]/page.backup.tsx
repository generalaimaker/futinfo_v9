'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { usePlayerProfile } from '@/lib/supabase/football'
import { ApplePlayerProfile } from '@/components/players/apple-player-profile'

export default function PlayerProfilePage() {
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  
  // 컴포넌트 마운트 확인
  useEffect(() => {
    console.log('[PlayerProfilePage] Component mounting...')
    setMounted(true)
    return () => {
      console.log('[PlayerProfilePage] Component unmounting...')
    }
  }, [])
  
  const playerId = Number(params.playerId)
  
  // 즉시 로그 출력
  console.log('[PlayerProfilePage] Render - playerId:', playerId, 'mounted:', mounted)
  
  // playerId 유효성 검사
  if (!playerId || isNaN(playerId)) {
    console.log('[PlayerProfilePage] Invalid playerId:', params.playerId)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">잘못된 선수 ID</h3>
              <p className="text-gray-600 mb-4">선수 ID가 올바르지 않습니다.</p>
              <Link href="/players">
                <Button>선수 목록으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const currentSeason = new Date().getFullYear()
  
  // React Query hook
  const { data: playerProfile, isLoading, error } = usePlayerProfile(playerId, currentSeason)
  
  // 디버깅 로그
  console.log('[PlayerProfilePage] Query state:', {
    playerId,
    currentSeason,
    isLoading,
    hasData: !!playerProfile,
    error
  })

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen lg:ml-64 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center mb-4">선수 정보를 불러오는 중...</p>
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    console.error('[PlayerProfilePage] Query error:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">오류 발생</h3>
              <p className="text-gray-600 mb-4">선수 정보를 불러오는 중 오류가 발생했습니다.</p>
              <p className="text-sm text-gray-500 mb-4">{String(error)}</p>
              <Link href="/players">
                <Button>선수 목록으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 데이터 없음
  if (!playerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">선수를 찾을 수 없습니다</h3>
              <p className="text-gray-600 mb-4">요청하신 선수 정보를 찾을 수 없습니다.</p>
              <Link href="/players">
                <Button>선수 목록으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 정상 렌더링
  console.log('[PlayerProfilePage] Rendering ApplePlayerProfile with data:', playerProfile)
  return <ApplePlayerProfile playerProfile={playerProfile} playerId={playerId} />
}