'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, MessageSquare, Plus, Users, Calendar, 
  Heart, MessageCircle, Eye, Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityBoard, CommunityPost } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useSupabase } from '@/lib/supabase/provider'
import { RealtimeChannel } from '@supabase/supabase-js'

export default function BoardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.boardId as string
  const { supabase, user } = useSupabase()
  
  const [board, setBoard] = useState<CommunityBoard | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    loadBoardData()
    
    // 실시간 구독 설정
    const channel = supabase
      .channel(`board_${boardId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'community_posts',
          filter: `boardId=eq.${boardId}`
        },
        handlePostChanges
      )
      .subscribe()
    
    setRealtimeChannel(channel)
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [boardId])

  const loadBoardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 게시판 정보 가져오기
      if (boardId === 'all') {
        setBoard({
          id: 'all',
          name: '전체 게시판',
          description: '모든 축구 팬들이 자유롭게 소통하는 공간',
          type: 'general',
          memberCount: 0,
          postCount: 0,
          createdAt: new Date().toISOString()
        })
      } else {
        const boardData = await CommunityService.getBoard(boardId)
        if (!boardData) {
          throw new Error('게시판을 찾을 수 없습니다')
        }
        setBoard(boardData)
      }
      
      // 게시글 목록 가져오기
      const postsData = await CommunityService.getPosts({ boardId })
      setPosts(postsData)
    } catch (err) {
      console.error('Error loading board:', err)
      setError(err instanceof Error ? err.message : '게시판을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePostChanges = (payload: any) => {
    const { eventType, new: newPost, old: oldPost } = payload
    
    switch (eventType) {
      case 'INSERT':
        // 새 게시글 추가
        setPosts(prev => [newPost, ...prev])
        break
      case 'UPDATE':
        // 게시글 업데이트
        setPosts(prev => prev.map(post => 
          post.id === newPost.id ? newPost : post
        ))
        break
      case 'DELETE':
        // 게시글 삭제
        setPosts(prev => prev.filter(post => post.id !== oldPost.id))
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '게시판을 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.push('/community')}>
            커뮤니티로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/community">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  커뮤니티
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                {board.iconUrl && board.type === 'team' && (
                  <Image
                    src={board.iconUrl}
                    alt={board.name}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold">{board.name}</h1>
                  <p className="text-sm text-gray-600">{board.description}</p>
                </div>
              </div>
            </div>
            
            {user && (
              <Link href={`/community/boards/${boardId}/write`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  글쓰기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 게시판 통계 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">멤버</span>
              <span className="font-semibold">{board.memberCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">게시글</span>
              <span className="font-semibold">{posts.length.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <main className="container mx-auto px-4 py-6">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">아직 게시글이 없습니다.</p>
            {user ? (
              <Link href={`/community/boards/${boardId}/write`}>
                <Button>첫 번째 글 작성하기</Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button>로그인하고 글 작성하기</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href={`/community/posts/${post.id}`}>
                    <div className="space-y-3">
                      {/* 제목 */}
                      <div>
                        <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        {post.content && (
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {post.content}
                          </p>
                        )}
                      </div>
                      
                      {/* 메타 정보 */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs">
                                {post.authorName?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <span className="text-gray-700">{post.authorName || '익명'}</span>
                          </div>
                          <span className="text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { 
                              addSuffix: true,
                              locale: ko 
                            })}
                          </span>
                        </div>
                        
                        {/* 상호작용 정보 */}
                        <div className="flex items-center space-x-4 text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.viewCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likeCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.commentCount}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 태그 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}