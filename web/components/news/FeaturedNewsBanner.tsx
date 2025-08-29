'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, ExternalLink, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FeaturedNews {
  id: string
  news_id: string
  title: string
  description: string
  url: string
  image_url: string
  source: string
  published_at: string
  display_order: number
}

export function FeaturedNewsBanner() {
  const [featuredNews, setFeaturedNews] = useState<FeaturedNews[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadFeaturedNews()
  }, [])

  const loadFeaturedNews = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_news')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      
      // 사용자 언어 설정 가져오기
      const userLanguage = localStorage.getItem('user_language') || 'ko'
      
      // 번역 적용
      const translatedNews = (data || []).map(item => {
        const translation = item.translations?.[userLanguage]
        if (translation) {
          return {
            ...item,
            title: translation.title || item.title,
            description: translation.description || item.description,
            isTranslated: true,
            originalTitle: item.title,
            originalDescription: item.description
          }
        }
        return item
      })
      
      setFeaturedNews(translatedNews)
    } catch (error) {
      console.error('Error loading featured news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredNews.length) % featuredNews.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredNews.length)
  }

  // 자동 슬라이드
  useEffect(() => {
    if (featuredNews.length > 1) {
      const interval = setInterval(() => {
        handleNext()
      }, 5000) // 5초마다 자동 전환
      
      return () => clearInterval(interval)
    }
  }, [featuredNews.length, currentIndex])

  if (isLoading || featuredNews.length === 0) {
    return null
  }

  const currentNews = featuredNews[currentIndex]

  return (
    <div className="mb-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-0 shadow-xl">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 blur-xl opacity-40" />
                <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
                  <Star className="w-5 h-5" />
                </div>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                주요 뉴스
              </h2>
              <Badge className="bg-red-500 text-white">HOT</Badge>
            </div>
            
            {/* 페이지 인디케이터 */}
            <div className="flex items-center gap-2">
              {featuredNews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex 
                      ? "w-8 bg-gradient-to-r from-green-500 to-blue-600" 
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNews.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col md:flex-row gap-6 p-6"
            >
              {/* 이미지 */}
              {currentNews.image_url && (
                <div className="relative md:w-1/3 aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src={currentNews.image_url} 
                    alt={currentNews.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
                      #{currentIndex + 1}
                    </Badge>
                  </div>
                </div>
              )}

              {/* 텍스트 콘텐츠 */}
              <div className="flex-1 flex flex-col justify-center">
                <Link href={currentNews.url} target="_blank" className="group">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {currentNews.title}
                    {currentNews.isTranslated && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        번역됨
                      </span>
                    )}
                  </h3>
                </Link>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {currentNews.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Newspaper className="w-4 h-4" />
                    {currentNews.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDistanceToNow(new Date(currentNews.published_at), { 
                      addSuffix: true, 
                      locale: ko 
                    })}
                  </span>
                  <Link 
                    href={currentNews.url} 
                    target="_blank"
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    전체 기사 보기
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* 네비게이션 버튼 */}
          {featuredNews.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}