'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, ExternalLink, Newspaper } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

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
  isTranslated?: boolean
  originalTitle?: string
  originalDescription?: string
  translations?: any
}

export function FeaturedNewsBanner() {
  const [featuredNews, setFeaturedNews] = useState<FeaturedNews | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadFeaturedNews()
  }, [])

  const loadFeaturedNews = async () => {
    try {
      // news_articles 테이블에서 배너 뉴스 가져오기
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('display_type', 'banner')
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        // 한국어 번역 우선 사용
        const translation = data.translations?.ko
        if (translation) {
          setFeaturedNews({
            ...data,
            news_id: data.id,
            display_order: 1,
            title: translation.title || data.title,
            description: translation.description || data.description,
            isTranslated: true,
            originalTitle: data.title,
            originalDescription: data.description
          })
        } else {
          setFeaturedNews({
            ...data,
            news_id: data.id,
            display_order: 1
          })
        }
      }
    } catch (error) {
      console.error('Error loading featured news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !featuredNews) {
    return null
  }

  return (
    <div className="mb-4 md:mb-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-0 shadow-lg md:shadow-xl">
        {/* 헤더 */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 blur-xl opacity-40" />
                <div className="relative p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
                  <Star className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                주요 뉴스
              </h2>
              <Badge className="bg-red-500 text-white text-[10px] md:text-xs py-0.5 px-1.5">HOT</Badge>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6">
          {/* 이미지 */}
          {featuredNews.image_url && (
            <div className="relative w-full md:w-1/3 aspect-video md:aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg">
              <img 
                src={featuredNews.image_url} 
                alt={featuredNews.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          {/* 텍스트 콘텐츠 */}
          <div className="flex-1 flex flex-col justify-center">
            <Link href={featuredNews.url} target="_blank" className="group">
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                {featuredNews.title}
                {featuredNews.isTranslated && (
                  <span className="ml-2 inline-flex items-center px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium bg-green-100 text-green-800">
                    번역됨
                  </span>
                )}
              </h3>
            </Link>
            
            <p className="text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">
              {featuredNews.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm text-gray-500">
              <span className="flex items-center gap-0.5 md:gap-1">
                <Newspaper className="w-3 h-3 md:w-4 md:h-4" />
                {featuredNews.source}
              </span>
              <span className="flex items-center gap-0.5 md:gap-1">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                {formatDistanceToNow(new Date(featuredNews.published_at), { 
                  addSuffix: true, 
                  locale: ko 
                })}
              </span>
              <Link 
                href={featuredNews.url} 
                target="_blank"
                className="flex items-center gap-0.5 md:gap-1 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">전체 기사 보기</span>
                <span className="sm:hidden">자세히</span>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}