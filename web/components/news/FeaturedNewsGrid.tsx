'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ExternalLink, Newspaper, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface FeaturedNewsItem {
  id: string
  title: string
  description: string
  url: string
  image_url: string
  source: string
  published_at: string
  priority: number
  isTranslated?: boolean
  originalTitle?: string
  originalDescription?: string
}

export function FeaturedNewsGrid() {
  const [featuredNews, setFeaturedNews] = useState<FeaturedNewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadFeaturedNews()
  }, [])

  const loadFeaturedNews = async () => {
    try {
      // news_articles 테이블에서 featured 뉴스 가져오기 (priority 순서로)
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('display_type', 'featured')
        .order('priority', { ascending: true })
        .limit(5)

      if (error) throw error
      
      if (data) {
        // 한국어 번역 우선 사용
        const newsWithTranslations = data.map(article => {
          const translation = article.translations?.ko
          if (translation) {
            return {
              ...article,
              title: translation.title || article.title,
              description: translation.description || article.description,
              isTranslated: true,
              originalTitle: article.title,
              originalDescription: article.description
            }
          }
          return article
        })
        setFeaturedNews(newsWithTranslations)
      }
    } catch (error) {
      console.error('Error loading featured news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || featuredNews.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">주요 뉴스</h2>
          <Badge variant="secondary">Featured</Badge>
        </div>
        <Link href="/news" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          더보기
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 첫 번째 뉴스는 크게 표시 */}
        {featuredNews[0] && (
          <Card className="md:col-span-2 lg:col-span-2 overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={featuredNews[0].url} target="_blank">
              <div className="flex flex-col md:flex-row">
                {featuredNews[0].image_url && (
                  <div className="md:w-2/5 aspect-video md:aspect-[4/3]">
                    <img 
                      src={featuredNews[0].image_url} 
                      alt={featuredNews[0].title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      1위
                    </Badge>
                    {featuredNews[0].isTranslated && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        번역됨
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                    {featuredNews[0].title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {featuredNews[0].description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Newspaper className="w-3 h-3" />
                      {featuredNews[0].source}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(featuredNews[0].published_at), { 
                        addSuffix: true, 
                        locale: ko 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        )}

        {/* 나머지 뉴스들 */}
        {featuredNews.slice(1).map((news, index) => (
          <Card key={news.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={news.url} target="_blank">
              {news.image_url && (
                <div className="aspect-video">
                  <img 
                    src={news.image_url} 
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 2}위
                  </Badge>
                  {news.isTranslated && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      번역됨
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                  {news.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {news.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Newspaper className="w-3 h-3" />
                    {news.source}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(news.published_at), { 
                      addSuffix: true, 
                      locale: ko 
                    })}
                  </span>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}