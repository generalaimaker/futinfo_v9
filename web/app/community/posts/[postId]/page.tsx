'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Heart, MessageSquare, Share2, Bookmark, 
  MoreVertical, Edit, Trash2, Flag, Loader2, Eye,
  Clock, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityPost, CommunityComment } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useSupabase } from '@/lib/supabase/provider'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string
  const { user, supabase } = useSupabase()
  
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    loadPostData()
    // 조회수 증가
    CommunityService.incrementViewCount(postId)
  }, [postId])

  const loadPostData = async () => {
    try {
      setLoading(true)
      const [postData, commentsData] = await Promise.all([
        CommunityService.getPost(postId),
        CommunityService.getComments(postId)
      ])
      
      if (!postData) {
        throw new Error('게시글을 찾을 수 없습니다')
      }
      
      setPost(postData)
      setComments(commentsData)
    } catch (err) {
      console.error('Error loading post:', err)
      setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !commentContent.trim()) return

    setSubmittingComment(true)
    try {
      const newComment = await CommunityService.createComment({
        postId,
        content: commentContent.trim(),
        userId: user.id  // user ID 직접 전달
      }, supabase)
      setComments([...comments, newComment])
      setCommentContent('')
    } catch (err) {
      console.error('Error submitting comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      await CommunityService.deletePost(postId)
      router.push(`/community/boards/${post?.boardId}`)
    } catch (err) {
      console.error('Error deleting post:', err)
      alert('게시글 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.push('/community')}>
            커뮤니티로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/community/boards/${post.boardId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                게시판으로
              </Button>
            </Link>
            
            {user && user.id === post.authorId && (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDeletePost}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 게시글 내용 */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* 제목 및 메타 정보 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  {/* 작성자 정보 */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {post.author?.avatarUrl ? (
                        <img 
                          src={post.author.avatarUrl} 
                          alt={post.author.nickname}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <span className="font-medium">{post.author?.nickname || '익명'}</span>
                  </div>
                  
                  {/* 작성 시간 */}
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), { 
                        addSuffix: true,
                        locale: ko 
                      })}
                    </span>
                  </div>
                  
                  {/* 조회수 */}
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.viewCount}회</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 태그 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 본문 */}
            <div className="prose prose-gray max-w-none mb-6">
              <div className="whitespace-pre-wrap">{post.content}</div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  좋아요 {post.likeCount}
                </Button>
                <Button variant="ghost" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  북마크
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </Button>
              </div>
              
              <Button variant="ghost" size="sm">
                <Flag className="h-4 w-4 mr-2" />
                신고
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 댓글 섹션 */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              댓글 {comments.length}개
            </h2>

            {/* 댓글 작성 */}
            {user ? (
              <div className="mb-6">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!commentContent.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    댓글 작성
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 mb-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">로그인하기</Button>
                </Link>
              </div>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {comment.author?.avatarUrl ? (
                        <img 
                          src={comment.author.avatarUrl} 
                          alt={comment.author.nickname}
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.author?.nickname || '익명'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { 
                            addSuffix: true,
                            locale: ko 
                          })}
                        </span>
                      </div>
                      
                      <p className="text-gray-700">{comment.content}</p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          좋아요 {comment.likeCount}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          답글
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}