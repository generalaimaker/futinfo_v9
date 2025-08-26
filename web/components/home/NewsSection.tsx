'use client'

import Link from 'next/link'
import { Newspaper, Clock, ExternalLink, ChevronRight, Globe, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { usePersonalizedNews } from '@/lib/supabase/cached-news'
import { motion, AnimatePresence } from 'framer-motion'
import { NewsItemCard } from './NewsItemCard'

interface NewsSectionProps {
  className?: string
}

export function NewsSection({ className }: NewsSectionProps) {
  // 실제 뉴스 데이터 가져오기 - 전체 카테고리만
  const { data, isLoading, error } = usePersonalizedNews({
    limit: 5 // 홈화면에는 5개만 표시
  })

  const articles = (data as any)?.articles || []

  return (
    <Card className={cn("relative overflow-hidden border-0 rounded-3xl shadow-2xl", className)}>
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-100/20 via-transparent to-transparent dark:from-green-900/10" />
      
      <div className="relative">
        {/* 헤더 */}
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-600 blur-xl opacity-40" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 text-white shadow-lg">
                <Newspaper className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              최신 축구 뉴스
            </h3>
          </div>
          <Link href="/news">
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

        {/* 뉴스 리스트 */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl animate-pulse" 
                  />
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 blur-xl opacity-30" />
                  <div className="relative p-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <Newspaper className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">뉴스를 불러오는 중 오류가 발생했습니다</p>
              </motion.div>
            ) : articles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 blur-xl opacity-30" />
                  <div className="relative p-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <Newspaper className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">표시할 뉴스가 없습니다</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                {articles.slice(0, 5).map((article: any, index: number) => (
                  <NewsItemCard 
                    key={article.id}
                    article={article}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}