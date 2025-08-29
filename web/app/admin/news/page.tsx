'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Newspaper, Search, X, Check, Loader2, ExternalLink, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: {
    id: string | null
    name: string
  }
  author: string | null
  content: string | null
}

export default function AdminNewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NewsArticle[]>([])
  const [selectedNews, setSelectedNews] = useState<NewsArticle[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // 기존 선택된 뉴스 불러오기
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
      
      if (data && data.length > 0) {
        setSelectedNews(data.map(item => ({
          id: item.news_id,
          title: item.title,
          description: item.description || '',
          url: item.url,
          urlToImage: item.image_url || '',
          publishedAt: item.published_at,
          source: {
            id: null,
            name: item.source || 'Unknown'
          },
          author: null,
          content: null
        })))
      }
    } catch (error) {
      console.error('Error loading featured news:', error)
      toast.error('선택된 뉴스를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const searchNews = async () => {
    if (!searchQuery.trim()) {
      toast.error('검색어를 입력해주세요')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/news/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('검색 실패')
      
      const data = await response.json()
      setSearchResults(data.articles || [])
      
      if (data.articles?.length === 0) {
        toast.info('검색 결과가 없습니다')
      }
    } catch (error) {
      console.error('Error searching news:', error)
      toast.error('뉴스 검색에 실패했습니다')
    } finally {
      setIsSearching(false)
    }
  }

  const loadLatestNews = async () => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/news/latest')
      if (!response.ok) throw new Error('최신 뉴스 로드 실패')
      
      const data = await response.json()
      setSearchResults(data.articles || [])
    } catch (error) {
      console.error('Error loading latest news:', error)
      toast.error('최신 뉴스를 불러오는데 실패했습니다')
    } finally {
      setIsSearching(false)
    }
  }

  const toggleNewsSelection = (article: NewsArticle) => {
    const isSelected = selectedNews.some(n => n.id === article.id)
    
    if (isSelected) {
      setSelectedNews(prev => prev.filter(n => n.id !== article.id))
    } else {
      if (selectedNews.length >= 5) {
        toast.error('최대 5개까지만 선택 가능합니다')
        return
      }
      setSelectedNews(prev => [...prev, article])
    }
  }

  const saveFeaturedNews = async () => {
    if (selectedNews.length === 0) {
      toast.error('선택된 뉴스가 없습니다')
      return
    }

    setIsSaving(true)
    try {
      // 기존 featured_news 비활성화
      await supabase
        .from('featured_news')
        .update({ is_active: false })
        .eq('is_active', true)

      // 새로운 뉴스 추가
      const newsToInsert = selectedNews.map((article, index) => ({
        news_id: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        image_url: article.urlToImage,
        source: article.source.name,
        published_at: article.publishedAt,
        display_order: index + 1,
        is_active: true
      }))

      const { error } = await supabase
        .from('featured_news')
        .insert(newsToInsert)

      if (error) throw error

      toast.success('주요 뉴스가 성공적으로 저장되었습니다')
    } catch (error) {
      console.error('Error saving featured news:', error)
      toast.error('뉴스 저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 text-white">
              <Newspaper className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              주요 뉴스 관리
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            홈페이지 상단 배너에 표시될 주요 뉴스를 선택하세요 (최대 5개)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 뉴스 검색 */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                뉴스 검색
              </h2>
              
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="검색어를 입력하세요 (예: 손흥민, 프리미어리그)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchNews()}
                  className="flex-1"
                />
                <Button 
                  onClick={searchNews}
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
                </Button>
                <Button 
                  onClick={loadLatestNews}
                  disabled={isSearching}
                  variant="outline"
                >
                  최신 뉴스
                </Button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {searchResults.map((article) => {
                  const isSelected = selectedNews.some(n => n.id === article.id)
                  
                  return (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                      onClick={() => toggleNewsSelection(article)}
                    >
                      <div className="flex gap-3">
                        {article.urlToImage && (
                          <img 
                            src={article.urlToImage} 
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold line-clamp-2 mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {article.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {article.source.name}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(article.publishedAt), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </span>
                            {isSelected && (
                              <Badge className="bg-green-600">선택됨</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* 오른쪽: 선택된 뉴스 */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  선택된 뉴스 ({selectedNews.length}/5)
                </h2>
                <Button
                  onClick={saveFeaturedNews}
                  disabled={isSaving || selectedNews.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  저장하기
                </Button>
              </div>

              {selectedNews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  왼쪽에서 뉴스를 선택해주세요
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedNews.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold line-clamp-2 mb-1">
                              {article.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{article.source.name}</span>
                              <Link href={article.url} target="_blank">
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleNewsSelection(article)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}