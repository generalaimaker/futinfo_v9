'use client'

import React, { useState, useEffect } from 'react'
import { Flame, ArrowLeftRight, Activity, Radio, SlidersHorizontal, ExternalLink, Shield, Search, Newspaper, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonalizedNews, type NewsFilters } from '@/lib/supabase/cached-news'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { SimpleTransferFilter } from '@/components/news/SimpleTransferFilter'
import { NewsArticleCard } from '@/components/news/NewsArticleCard'
import { FeaturedNewsBanner } from '@/components/news/FeaturedNewsBanner'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type NewsTab = 'major' | 'transfer' | 'injury'

export default function NewsPage() {
  const [selectedTab, setSelectedTab] = useState<NewsTab>('major')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [bannerNews, setBannerNews] = useState<any>(null)
  const [featuredNews, setFeaturedNews] = useState<any[]>([])
  const [newsSectionLoading, setNewsSectionLoading] = useState(true)
  
  const supabase = createClient()
  
  // 필터 상태
  const [filters, setFilters] = useState<NewsFilters>({
    category: 'general'
  })
  
  // React Query로 뉴스 가져오기 (캐시된 뉴스 + 개인화)
  const { data, isLoading, error, refetch, dataUpdatedAt } = usePersonalizedNews(filters)
  
  // 배너와 주요뉴스 로드 (홈화면과 동일)
  useEffect(() => {
    loadFeaturedContent()
  }, [])
  
  const loadFeaturedContent = async () => {
    try {
      // 배너 뉴스 가져오기
      const { data: bannerData } = await supabase
        .from('news_articles')
        .select('*')
        .eq('display_type', 'banner')
        .single()
      
      if (bannerData) {
        const translation = bannerData.translations?.ko
        setBannerNews({
          ...bannerData,
          title: translation?.title || bannerData.title,
          description: translation?.description || bannerData.description
        })
      }
      
      // 주요 뉴스 5개 가져오기
      const { data: featuredData } = await supabase
        .from('news_articles')
        .select('*')
        .eq('display_type', 'featured')
        .order('priority', { ascending: true })
        .limit(5)
      
      if (featuredData) {
        const newsWithTranslations = featuredData.map((article: any) => {
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
      console.error('Error loading featured content:', error)
    } finally {
      setNewsSectionLoading(false)
    }
  }

  const tabs: { id: NewsTab; title: string; icon: React.ReactNode; color: string }[] = [
    { 
      id: 'major', 
      title: '주요뉴스', 
      icon: <Flame className="w-4 h-4" />,
      color: 'text-red-500'
    },
    { 
      id: 'transfer', 
      title: '이적시장', 
      icon: <ArrowLeftRight className="w-4 h-4" />,
      color: 'text-orange-500'
    },
    { 
      id: 'injury', 
      title: '부상뉴스', 
      icon: <Activity className="w-4 h-4" />,
      color: 'text-purple-500'
    }
  ]

  // 탭 변경 시 카테고리 필터 업데이트
  useEffect(() => {
    const categoryMap: Record<NewsTab, NewsFilters['category']> = {
      major: 'general',
      transfer: 'transfer',
      injury: 'injury'
    }
    
    setFilters(prev => ({
      ...prev,
      category: categoryMap[selectedTab]
    }))
  }, [selectedTab])

  const handleTabChange = (tab: NewsTab) => {
    setSelectedTab(tab)
  }

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: Partial<NewsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // 수동 새로고침
  const handleRefresh = () => {
    refetch()
  }

  // 기사의 신뢰도에 따른 색상
  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const articles = (data as any)?.articles || []
  
  // 배너와 주요뉴스 제외한 일반 기사만 필터링
  const generalArticles = articles.filter((article: any) => 
    article.display_type !== 'banner' && article.display_type !== 'featured'
  )

  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="px-4 md:container md:mx-auto">
          <div className="py-3 md:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 md:mb-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  ⚽ Football News
                </h1>
                {dataUpdatedAt && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs md:text-sm text-gray-500">
                      {formatDistanceToNow(new Date(dataUpdatedAt), { 
                        addSuffix: true,
                        locale: ko 
                      })} 업데이트
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 md:h-9 md:w-9"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <Radio className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {selectedTab === 'transfer' && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9 relative"
                    onClick={() => setShowFilterSheet(!showFilterSheet)}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {(filters.onlyFeatured || filters.onlyBreaking) && (
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full absolute top-0.5 right-0.5 md:-top-1 md:-right-1" />
                    )}
                  </Button>
                )}
              </div>
            </div>


            {/* Tab Selector */}
            <div className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-all text-xs md:text-sm whitespace-nowrap
                    ${selectedTab === tab.id 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <span className={selectedTab === tab.id ? 'text-white' : tab.color}>
                    {React.cloneElement(tab.icon as React.ReactElement, { className: "w-3.5 h-3.5 md:w-4 md:h-4" })}
                  </span>
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:container md:mx-auto py-4 md:py-6">
        {/* 배너 뉴스 (홈화면과 동일) */}
        {bannerNews && (
          <div className="mb-6">
            <FeaturedNewsBanner />
          </div>
        )}
        
        {/* 주요 뉴스 섹션 (홈화면과 동일한 스타일) */}
        {featuredNews.length > 0 && (
          <Card className="mb-6 p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg">
                  <Newspaper className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  주요 뉴스
                </h2>
              </div>
            </div>
            
            <div className="space-y-3">
              {featuredNews.map((article: any, index: number) => (
                <Link key={article.id} href={article.url} target="_blank">
                  <Card className="p-3 md:p-4 hover:shadow-lg transition-all hover:scale-[1.01] border-0 bg-white/80 dark:bg-gray-800/80">
                    <div className="flex gap-3 md:gap-4">
                      {article.image_url && (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Newspaper className="w-3 h-3" />
                            {article.source}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(article.published_at), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        )}
        
        {/* 일반 뉴스 리스트 */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">최신 뉴스</h3>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-500">뉴스를 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">뉴스를 불러오는 중 오류가 발생했습니다.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="mt-4"
              >
                다시 시도
              </Button>
            </div>
          ) : generalArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">표시할 뉴스가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {generalArticles.map((article: any, index: number) => (
                <NewsArticleCard 
                  key={article.id}
                  article={article}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Transfer News Filter Modal */}
      {showFilterSheet && selectedTab === 'transfer' && (
        <SimpleTransferFilter
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilterSheet(false)}
        />
      )}
    </div>
  )
}