'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft, ExternalLink, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function NewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const newsId = params.id as string

  // 실제로는 뉴스 ID로 뉴스를 가져와야 하지만,
  // 현재는 외부 URL로 이동하는 방식이므로 리다이렉트 처리
  useEffect(() => {
    // URL 형식이면 외부 링크로 이동
    if (newsId && newsId.startsWith('http')) {
      window.location.href = decodeURIComponent(newsId)
    }
  }, [newsId])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">뉴스로 이동 중...</p>
          </div>
        </div>
      </div>
    </div>
  )
}