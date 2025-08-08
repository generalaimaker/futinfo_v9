'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Eye, Heart, Clock, TrendingUp, User } from 'lucide-react'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityPost } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export function RecentPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentPosts()
  }, [])

  const loadRecentPosts = async () => {
    try {
      // Load posts from all board
      const { data } = await CommunityService.getPosts('all', 1, 5)
      setPosts(data)
    } catch (error) {
      console.error('Error loading recent posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>최신 게시글</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>최신 게시글</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>아직 게시글이 없습니다.</p>
            <Link href="/community/boards/all/write" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              첫 게시글 작성하기
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>최신 게시글</span>
          </CardTitle>
          <Link href="/community/boards/all" className="text-sm text-blue-600 hover:underline">
            전체보기
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              href={`/community/posts/${post.id}`}
              className="block hover:bg-gray-50 -mx-4 px-4 py-3 rounded-lg transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1 truncate">
                    {post.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{post.author?.nickname || '익명'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), { 
                          addSuffix: true,
                          locale: ko 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-500 ml-4">
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
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{post.tags.length - 3}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}