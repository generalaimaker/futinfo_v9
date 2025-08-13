'use client'

import { useState, useEffect } from 'react'
import { Flame, ArrowLeftRight, Activity, Radio, SlidersHorizontal, ExternalLink, Shield, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonalizedNews, type NewsFilters } from '@/lib/supabase/cached-news'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { SimpleTransferFilter } from '@/components/news/SimpleTransferFilter'
import { NewsSearchBar } from '@/components/news/NewsSearchBar'

type NewsTab = 'major' | 'transfer' | 'injury'

export default function NewsPage() {
  const [selectedTab, setSelectedTab] = useState<NewsTab>('major')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  
  // 필터 상태
  const [filters, setFilters] = useState<NewsFilters>({
    category: 'general'
  })
  
  // React Query로 뉴스 가져오기 (캐시된 뉴스 + 개인화)
  const { data, isLoading, error, refetch, dataUpdatedAt } = usePersonalizedNews(filters)

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

  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  ⚽ Football News
                </h1>
                {dataUpdatedAt && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(dataUpdatedAt), { 
                        addSuffix: true,
                        locale: ko 
                      })} 업데이트 • 5분마다 자동 새로고침
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  title="뉴스 검색"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <Radio className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {selectedTab === 'transfer' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowFilterSheet(!showFilterSheet)}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {(filters.onlyFeatured || filters.onlyBreaking) && (
                      <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="mt-4">
                <NewsSearchBar 
                  onSearch={(query) => console.log('Searching for:', query)}
                  className="w-full"
                />
              </div>
            )}

            {/* Tab Selector */}
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${selectedTab === tab.id 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <span className={selectedTab === tab.id ? 'text-white' : tab.color}>
                    {tab.icon}
                  </span>
                  {tab.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
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
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">표시할 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article: any) => (
              <article 
                key={article.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.open(article.url, '_blank')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <h3 className="text-lg font-semibold flex-1 hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {article.translations && Object.keys(article.translations).length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            번역됨
                          </span>
                        )}
                        {article.trust_score >= 80 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Shield className={`w-4 h-4 ${getTrustScoreColor(article.trust_score)}`} />
                            <span className={getTrustScoreColor(article.trust_score)}>
                              {article.trust_score}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {article.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-medium">{article.source}</span>
                      <span>•</span>
                      <span>
                        {article.published_at && formatDistanceToNow(new Date(article.published_at), { 
                          addSuffix: true,
                          locale: ko 
                        })}
                      </span>
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </div>
                  </div>
                  {article.image_url && (
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg ml-4"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
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