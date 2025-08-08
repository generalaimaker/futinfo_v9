'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, MessageCircle, Heart, Clock, 
  Trash2, Loader2, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityComment } from '@/lib/types/community'
import { useSupabase } from '@/lib/supabase/provider'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function MyCommentsPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    loadMyComments()
  }, [user])

  const loadMyComments = async () => {
    try {
      setLoading(true)
      
      // Get user profile first
      const profile = await CommunityService.getCurrentUserProfile()
      if (!profile) {
        setError('사용자 프로필을 찾을 수 없습니다.')
        return
      }

      // Get user's comments with post info
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(*),
          post:posts(id, title, board_id)
        `)
        .eq('author_id', profile.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (data) {
        setComments(data)
      }
    } catch (err) {
      console.error('Error loading comments:', err)
      setError('댓글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)

      if (error) throw error

      setComments(comments.filter(c => c.id !== commentId))
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('댓글 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>돌아가기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">내 댓글</h1>
            </div>
            <Badge variant="secondary">
              {comments.length}개의 댓글
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">아직 작성한 댓글이 없습니다.</p>
              <Link href="/community">
                <Button>커뮤니티 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 댓글이 달린 게시글 정보 */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {comment.post?.board_id === 'all' ? '전체 게시판' : comment.post?.board_id?.replace('team_', '팀 ')}
                        </Badge>
                        <Link 
                          href={`/community/posts/${comment.post?.id}`}
                          className="flex items-center space-x-1 text-sm text-blue-600 hover:underline"
                        >
                          <span className="truncate max-w-md">{comment.post?.title}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      
                      {/* 댓글 내용 */}
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                      
                      {/* 댓글 메타 정보 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(comment.created_at), { 
                              addSuffix: true,
                              locale: ko 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>{comment.like_count}</span>
                        </div>
                        {comment.parent_id && (
                          <Badge variant="secondary" className="text-xs">
                            답글
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}