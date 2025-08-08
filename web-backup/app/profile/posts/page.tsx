'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, MessageSquare, Eye, Heart, Clock, 
  Edit, Trash2, Loader2, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityPost } from '@/lib/types/community'
import { useSupabase } from '@/lib/supabase/provider'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function MyPostsPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    loadMyPosts()
  }, [user])

  const loadMyPosts = async () => {
    try {
      setLoading(true)
      
      // Get user profile first
      const profile = await CommunityService.getCurrentUserProfile()
      if (!profile) {
        setError('사용자 프로필을 찾을 수 없습니다.')
        return
      }

      // Get user's posts from all boards
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          board:boards(*)
        `)
        .eq('author_id', profile.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (data) {
        setPosts(data.map(CommunityService.transformPost))
      }
    } catch (err) {
      console.error('Error loading posts:', err)
      setError('게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      await CommunityService.deletePost(postId)
      setPosts(posts.filter(p => p.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      alert('게시글 삭제에 실패했습니다.')
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
              <h1 className="text-lg font-semibold">내 게시글</h1>
            </div>
            <Badge variant="secondary">
              {posts.length}개의 게시글
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">아직 작성한 게시글이 없습니다.</p>
              <Link href="/community">
                <Button>커뮤니티 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {post.boardId === 'all' ? '전체 게시판' : post.boardId.replace('team_', '팀 ')}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(post.createdAt), { 
                              addSuffix: true,
                              locale: ko 
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <Link href={`/community/posts/${post.id}`}>
                        <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors mb-2">
                          {post.title}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.viewCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>{post.likeCount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/community/posts/${post.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
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