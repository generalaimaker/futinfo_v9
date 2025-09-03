'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Newspaper, Clock, ExternalLink, ChevronRight, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface NewsSectionProps {
  className?: string
}

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  image_url: string
  source: string
  published_at: string
  display_type?: string
  priority?: number
  translations?: any
}

export function NewsSection({ className }: NewsSectionProps) {
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      // 주요 뉴스 5개 가져오기
      const { data: featuredData, error: featuredError } = await supabase
        .from('news_articles')
        .select('*')
        .eq('display_type', 'featured')
        .order('priority', { ascending: true })
        .limit(5)

      if (featuredError) throw featuredError

      // 주요 뉴스 설정 (한국어 번역 우선)
      if (featuredData) {
        const newsWithTranslations = featuredData.map(article => {
          const translation = article.translations?.ko
          return {
            ...article,
            title: translation?.title || article.title,
            description: translation?.description || article.description
          }
        })
        setFeaturedNews(newsWithTranslations)
      }
    } catch (error) {
      console.error('Error loading news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("relative overflow-hidden border-0 rounded-3xl shadow-2xl", className)}>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("relative overflow-hidden border-0 rounded-3xl shadow-2xl", className)}>
      {/* 배경 그라디언트 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-100/20 via-transparent to-transparent dark:from-green-900/10" />
      
      <div className="relative">
        {/* 헤더 */}
        <div className="px-3 sm:px-6 py-3 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-600 blur-xl opacity-40" />
              <div className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 text-white shadow-lg">
                <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              주요 축구 뉴스
            </h3>
          </div>
          <Link href="/news">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all shadow-sm flex items-center gap-1.5 group"
            >
              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">더보기</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </Link>
        </div>

        {/* 주요 뉴스 리스트 */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-6">
          <AnimatePresence mode="wait">
            {featuredNews.length === 0 ? (
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
                className="space-y-3"
              >
                {featuredNews.map((article: NewsArticle, index: number) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={article.url} target="_blank">
                      <Card className="p-2.5 sm:p-4 hover:shadow-lg transition-all hover:scale-[1.02] border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                        <div className="flex gap-3 sm:gap-4">
                          {article.image_url && (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                              {article.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 hidden sm:block">
                              {article.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Newspaper className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="truncate max-w-[80px] sm:max-w-none">{article.source}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="truncate">{formatDistanceToNow(new Date(article.published_at), { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}