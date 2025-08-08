'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestSyncPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    // 초기 데이터 로드
    fetchPosts()

    // 실시간 구독 설정
    const channel = supabase
      .channel('test-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('실시간 변경 감지:', payload)
          setLastUpdate(new Date())
          fetchPosts()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        console.log('실시간 구독 상태:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setPosts(data)
    }
  }

  const createTestPost = async () => {
    const response = await fetch('/api/test-post', {
      method: 'POST'
    })
    const result = await response.json()
    console.log('게시글 생성 결과:', result)
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>웹-앱 실시간 동기화 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? '실시간 연결됨' : '연결 중...'}
            </Badge>
            <span className="text-sm text-gray-500">
              마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
            </span>
          </div>
          
          <Button onClick={createTestPost}>
            테스트 게시글 생성
          </Button>

          <div className="text-sm text-gray-600">
            <p>이 페이지는 웹과 iOS 앱 간의 실시간 동기화를 테스트합니다.</p>
            <p>iOS 앱에서 게시글을 작성하면 이 페이지에 실시간으로 표시됩니다.</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">최근 게시글 ({posts.length})</h2>
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{post.content}</p>
                </div>
                <Badge variant="outline">
                  {post.board_id}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {new Date(post.created_at).toLocaleString('ko-KR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}