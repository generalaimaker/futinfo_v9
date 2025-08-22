'use client'

import Link from 'next/link'
import { Users, MessageCircle, Heart, Clock, ChevronRight, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { usePopularPosts } from '@/lib/hooks/useFootballData'
import { motion } from 'framer-motion'

export function TrendingCommunity() {
  const { posts, isLoading } = usePopularPosts()

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
        <div className="relative p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl w-1/3" />
            <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl" />
          </div>
        </div>
      </Card>
    )
  }

  if (posts.length === 0) return null

  // 가장 인기있는 포스트 1개만 표시
  const topPost = posts[0]

  return (
    <Card className="relative overflow-hidden border-0 rounded-3xl shadow-2xl">
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-100/20 via-transparent to-transparent dark:from-purple-900/10" />
      
      <div className="relative">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 blur-xl opacity-40" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              커뮤니티 인기글
            </h3>
          </div>
          <Link href="/community">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-sm flex items-center gap-1.5 group"
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">더보기</span>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </Link>
        </div>
        
        <div className="px-6 pb-6">
          <Link href={`/community/posts/${topPost.id}`} className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-lg hover:shadow-gray-200/30 dark:hover:shadow-black/20 transition-all group"
            >
              <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {topPost.title}
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {topPost.author?.username || '익명'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <MessageCircle className="w-3 h-3" />
                      {topPost.comment_count}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Heart className="w-3 h-3" />
                      {topPost.like_count}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(topPost.created_at), { 
                      addSuffix: true, 
                      locale: ko 
                    })}
                  </span>
                </div>
              </div>
              
              {/* 호버 시 나타나는 장식 요소 */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 blur opacity-60" />
                  <Sparkles className="relative w-3 h-3 text-white" />
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </Card>
  )
}