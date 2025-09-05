'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Newspaper, 
  Search, 
  X, 
  Check, 
  Loader2, 
  ExternalLink, 
  Globe, 
  RefreshCw,
  Languages,
  Shield,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  image_url?: string
  published_at: string
  source: string
  source_tier: number
  trust_score: number
  category: string
  tags: string[]
  translations?: any
  view_count: number
  is_featured: boolean
  is_breaking: boolean
}

export default function AdminNewsPage() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [bannerNews, setBannerNews] = useState<NewsArticle | null>(null)
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCollecting, setIsCollecting] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [apiUsage, setApiUsage] = useState<{
    brave: {
      today: number
      dailyLimit: number
      monthlyProjection: number
      monthlyLimit: number
    }
    newsapi: {
      today: number
      dailyLimit: number
      monthlyProjection: number
      monthlyLimit: number
    }
    combined: {
      todayTotal: number
      monthlyProjection: number
      monthlyLimit: number
    }
  }>({ 
    brave: { today: 0, dailyLimit: 53, monthlyProjection: 0, monthlyLimit: 2000 },
    newsapi: { today: 0, dailyLimit: 30, monthlyProjection: 0, monthlyLimit: 1000 },
    combined: { todayTotal: 0, monthlyProjection: 0, monthlyLimit: 3000 }
  })
  
  const supabase = createClient()
  const router = useRouter()

  // 인증 체크
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('로그인이 필요합니다')
        router.push('/login')
        return
      }

      // 관리자 권한 체크 (필요시 추가)
      // const { data: profile } = await supabase
      //   .from('profiles')
      //   .select('is_admin')
      //   .eq('id', user.id)
      //   .single()
      
      // if (!profile?.is_admin) {
      //   toast.error('관리자 권한이 필요합니다')
      //   router.push('/')
      //   return
      // }

      setUser(user)
      loadNewsArticles()
      loadApiUsage()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  // API 사용량 로드 (Brave + News API)
  const loadApiUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Brave Search 사용량
      const { data: braveData } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('api_name', 'brave_search')
        .eq('date', today)
        .maybeSingle()
      
      // News API 사용량
      const { data: newsapiData } = await supabase
        .from('api_usage_tracking')
        .select('*')
        .eq('api_name', 'newsapi')
        .eq('date', today)
        .maybeSingle()

      const braveUsage = {
        today: braveData?.requests_count || 0,
        dailyLimit: braveData?.daily_limit || 53,
        monthlyProjection: (braveData?.requests_count || 0) * 30,
        monthlyLimit: braveData?.monthly_limit || 2000
      }
      
      const newsapiUsage = {
        today: newsapiData?.requests_count || 0,
        dailyLimit: newsapiData?.daily_limit || 30,
        monthlyProjection: (newsapiData?.requests_count || 0) * 30,
        monthlyLimit: newsapiData?.monthly_limit || 1000
      }

      setApiUsage({
        brave: braveUsage,
        newsapi: newsapiUsage,
        combined: {
          todayTotal: braveUsage.today + newsapiUsage.today,
          monthlyProjection: braveUsage.monthlyProjection + newsapiUsage.monthlyProjection,
          monthlyLimit: 3000
        }
      })
    } catch (error) {
      console.log('No usage data for today yet')
    }
  }

  // RSS로 수집된 뉴스 불러오기
  const loadNewsArticles = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100)

      if (error) throw error
      
      setNewsArticles(data || [])
      setFilteredArticles(data || [])
      
      // 기존 배너 뉴스 불러오기
      const { data: bannerData } = await supabase
        .from('news_articles')
        .select('*')
        .eq('display_type', 'banner')
        .maybeSingle()
      
      if (bannerData) {
        setBannerNews(bannerData)
      }
      
      // 기존 주요 뉴스 불러오기
      const { data: featuredData } = await supabase
        .from('news_articles')
        .select('*')
        .eq('display_type', 'featured')
        .limit(5)
      
      if (featuredData) {
        setFeaturedNews(featuredData)
      }
    } catch (error) {
      console.error('Error loading news:', error)
      toast.error('뉴스를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // Brave Search 뉴스 수집 실행
  const collectBraveNews = async () => {
    setIsCollecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('brave-news-collector')
      
      if (error) throw error
      
      // 통계 표시 개선 - API 사용량 포함
      const stats = data?.stats
      if (stats) {
        const messages = []
        if (stats.saved > 0) messages.push(`${stats.saved}개 새로운 뉴스 저장`)
        if (stats.deleted_old > 0) messages.push(`${stats.deleted_old}개 오래된 뉴스 삭제`)
        if (stats.duplicates > 0) messages.push(`${stats.duplicates}개 중복`)
        
        // API 사용량 표시
        if (stats.api_usage) {
          messages.push(`API 사용: ${stats.api_usage.today}/${stats.api_usage.daily_limit}`)
        }
        
        toast.success(messages.join(', '))
      } else {
        toast.success('뉴스 수집이 완료되었습니다')
      }
      
      // 뉴스 목록 새로고침
      await loadNewsArticles()
      // API 사용량 새로고침
      await loadApiUsage()
    } catch (error) {
      console.error('Error collecting Brave news:', error)
      toast.error('Brave 뉴스 수집에 실패했습니다')
    } finally {
      setIsCollecting(false)
    }
  }

  // 프리미어리그 뉴스 집중 수집 (새로운 함수)
  const collectPremierLeagueNews = async () => {
    setIsCollecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('premier-league-news')
      
      if (error) throw error
      
      const stats = data?.stats
      if (stats) {
        toast.success(
          `프리미어리그 뉴스: ${stats.saved}개 저장 (${stats.unique_articles}개 고유 기사)`,
          {
            description: `상위 소스: ${stats.top_sources?.map((s: any) => s.source).join(', ')}`
          }
        )
      }
      
      await loadNewsArticles()
      await loadApiUsage()
    } catch (error) {
      console.error('Error collecting PL news:', error)
      toast.error('프리미어리그 뉴스 수집 실패')
    } finally {
      setIsCollecting(false)
    }
  }

  // News API 뉴스 수집 (심층 분석 기사)
  const collectNewsAPI = async () => {
    setIsCollecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('newsapi-collector')
      
      if (error) throw error
      
      const stats = data?.stats
      if (stats) {
        const messages = []
        if (stats.saved > 0) messages.push(`${stats.saved}개 새로운 뉴스 저장`)
        if (stats.duplicates > 0) messages.push(`${stats.duplicates}개 중복`)
        
        // API 사용량 표시
        if (stats.api_usage) {
          messages.push(`News API 사용: ${stats.api_usage.today}/${stats.api_usage.daily_limit}`)
        }
        
        toast.success(messages.join(', '))
      } else {
        toast.success('News API 수집이 완료되었습니다')
      }
      
      await loadNewsArticles()
      await loadApiUsage()
    } catch (error) {
      console.error('Error collecting News API:', error)
      toast.error('News API 수집에 실패했습니다')
    } finally {
      setIsCollecting(false)
    }
  }

  // RSS 뉴스 수집 실행 (백업용)
  const collectRSSNews = async () => {
    setIsCollecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('news-collector-rss')
      
      if (error) throw error
      
      const stats = data?.stats
      if (stats) {
        const messages = []
        if (stats.saved > 0) messages.push(`${stats.saved}개 새로운 뉴스 저장`)
        if (stats.deleted_old > 0) messages.push(`${stats.deleted_old}개 오래된 뉴스 삭제`)
        if (stats.duplicates > 0) messages.push(`${stats.duplicates}개 중복`)
        
        toast.success(messages.join(', '))
      } else {
        toast.success('뉴스 수집이 완료되었습니다')
      }
      
      await loadNewsArticles()
    } catch (error) {
      console.error('Error collecting RSS news:', error)
      toast.error('RSS 뉴스 수집에 실패했습니다')
    } finally {
      setIsCollecting(false)
    }
  }


  // 배너 뉴스 선택
  const selectBannerNews = (article: NewsArticle) => {
    setBannerNews(article)
    toast.success('배너 뉴스로 선택되었습니다')
  }

  // 주요 뉴스 토글
  const toggleFeaturedNews = (article: NewsArticle) => {
    const isSelected = featuredNews.some(n => n.id === article.id)
    
    if (isSelected) {
      setFeaturedNews(prev => prev.filter(n => n.id !== article.id))
    } else {
      if (featuredNews.length >= 5) {
        toast.error('주요 뉴스는 최대 5개까지 선택 가능합니다')
        return
      }
      setFeaturedNews(prev => [...prev, article])
    }
  }

  // 주요 뉴스 순서 변경
  const moveFeaturedNews = (index: number, direction: 'up' | 'down') => {
    const newFeatured = [...featuredNews]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= featuredNews.length) return
    
    // 순서 바꾸기
    [newFeatured[index], newFeatured[newIndex]] = [newFeatured[newIndex], newFeatured[index]]
    setFeaturedNews(newFeatured)
  }

  // 선택된 뉴스 번역
  const translateSelectedNews = async () => {
    const articlesToTranslate = [
      ...(bannerNews ? [bannerNews.id] : []),
      ...featuredNews.map(n => n.id)
    ]

    if (articlesToTranslate.length === 0) {
      toast.error('번역할 뉴스를 선택해주세요')
      return
    }

    setIsSaving(true)
    toast.info(`${articlesToTranslate.length}개 뉴스를 한국어로 번역 중입니다...`)
    
    try {
      const { data, error } = await supabase.functions.invoke('simple-translator', {
        body: { 
          articleIds: articlesToTranslate, 
          languages: ['ko']
        }
      })
      
      if (error) {
        console.error('Translation error:', error)
        toast.error('번역 중 오류가 발생했습니다')
      } else if (data?.success) {
        toast.success(`${data.results?.succeeded || 0}개 뉴스가 번역되었습니다`)
        await loadNewsArticles() // 번역된 내용 새로고침
      }
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('번역 서비스 연결 실패')
    } finally {
      setIsSaving(false)
    }
  }

  // 배너 & 주요 뉴스 저장 (자동 번역 포함)
  const saveSelectedNews = async () => {
    if (!bannerNews && featuredNews.length === 0) {
      toast.error('배너 또는 주요 뉴스를 선택해주세요')
      return
    }

    setIsSaving(true)
    try {
      // 기존 배너/주요 뉴스 해제
      await supabase
        .from('news_articles')
        .update({ display_type: null })
        .in('display_type', ['banner', 'featured'])

      // 배너 뉴스 설정
      if (bannerNews) {
        await supabase
          .from('news_articles')
          .update({ 
            display_type: 'banner',
            is_featured: true,
            priority: 10
          })
          .eq('id', bannerNews.id)
      }

      // 주요 뉴스 설정 (순서대로 priority 부여)
      if (featuredNews.length > 0) {
        for (let i = 0; i < featuredNews.length; i++) {
          await supabase
            .from('news_articles')
            .update({ 
              display_type: 'featured',
              is_featured: true,
              priority: i + 1  // 첫 번째가 1, 두 번째가 2, ... 
            })
            .eq('id', featuredNews[i].id)
        }
      }

      // 선택된 뉴스들 자동 번역 (무조건 실행)
      const articlesToTranslate = [
        ...(bannerNews ? [bannerNews.id] : []),
        ...featuredNews.map(n => n.id)
      ]

      if (articlesToTranslate.length > 0) {
        toast.info(`${articlesToTranslate.length}개 뉴스를 한국어로 번역 중입니다...`)
        console.log('Translating articles:', articlesToTranslate)
        
        try {
          const { data, error } = await supabase.functions.invoke('simple-translator', {
            body: { 
              articleIds: articlesToTranslate, 
              languages: ['ko'] // 한국어로 번역
            }
          })
          
          if (error) {
            console.error('Translation error:', error)
            toast.error('번역 중 오류가 발생했습니다. 다시 시도해주세요.')
          } else if (data?.success) {
            const succeeded = data.results?.succeeded || 0
            const failed = data.results?.failed || 0
            
            if (succeeded > 0) {
              toast.success(`${succeeded}개 뉴스가 한국어로 번역되었습니다`)
            }
            if (failed > 0) {
              toast.warning(`${failed}개 뉴스 번역에 실패했습니다`)
            }
            
            // 번역 후 뉴스 다시 로드
            await loadNewsArticles()
          }
        } catch (error) {
          console.error('Translation error:', error)
          toast.error('번역 서비스 연결 실패 - GPT API 키를 확인해주세요')
        }
      }

      toast.success('홈화면 뉴스가 성공적으로 저장되었습니다')
      await loadNewsArticles()
    } catch (error) {
      console.error('Error saving selected news:', error)
      toast.error('뉴스 저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  // 검색 및 필터링
  useEffect(() => {
    let filtered = newsArticles

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(article => article.category === categoryFilter)
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.source.toLowerCase().includes(query)
      )
    }

    setFilteredArticles(filtered)
  }, [searchQuery, categoryFilter, newsArticles])


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    )
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 text-white">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  뉴스 관리 시스템
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Brave Search + News API (월 3000회) · 스마트 뉴스 수집
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                <Shield className="w-3 h-3 mr-1" />
                관리자: {user.email}
              </Badge>
            </div>
          </div>
        </div>

        {/* API 사용량 대시보드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Brave Search API */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Brave Search</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">실시간 속보</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">오늘</span>
                <span className="font-bold">{apiUsage.brave.today} / {apiUsage.brave.dailyLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (apiUsage.brave.today / apiUsage.brave.dailyLimit) * 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                월 예상: {apiUsage.brave.monthlyProjection} / {apiUsage.brave.monthlyLimit}
              </p>
            </div>
          </Card>

          {/* News API */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-600 text-white">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">News API</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">심층 분석</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">오늘</span>
                <span className="font-bold">{apiUsage.newsapi.today} / {apiUsage.newsapi.dailyLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (apiUsage.newsapi.today / apiUsage.newsapi.dailyLimit) * 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                월 예상: {apiUsage.newsapi.monthlyProjection} / {apiUsage.newsapi.monthlyLimit}
              </p>
            </div>
          </Card>

          {/* 통합 사용량 */}
          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-600 text-white">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">통합 사용량</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">전체 API</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">오늘 합계</span>
                <span className="font-bold">{apiUsage.combined.todayTotal} / 83</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (apiUsage.combined.monthlyProjection / apiUsage.combined.monthlyLimit) * 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                월 예상: {apiUsage.combined.monthlyProjection} / {apiUsage.combined.monthlyLimit}
              </p>
            </div>
          </Card>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={collectBraveNews}
            disabled={isCollecting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCollecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Brave Search 뉴스
          </Button>

          <Button
            onClick={collectNewsAPI}
            disabled={isCollecting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isCollecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Newspaper className="w-4 h-4 mr-2" />
            )}
            News API 분석
          </Button>

          <Button
            onClick={collectRSSNews}
            disabled={isCollecting}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            {isCollecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            RSS 뉴스
          </Button>

          <Button
            onClick={collectPremierLeagueNews}
            disabled={isCollecting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {isCollecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            ⚡ 프리미어리그 속보
          </Button>

          <Button
            onClick={async () => {
              setIsCollecting(true)
              try {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/simple-rss-collector`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                    }
                  }
                )
                const data = await response.json()
                if (data.success) {
                  toast.success(`RSS 뉴스 수집 완료! ${data.saved}개 저장됨`)
                  await loadNewsArticles()
                } else {
                  toast.error('RSS 수집 실패')
                }
              } catch (error) {
                toast.error('RSS 수집 중 오류 발생')
              } finally {
                setIsCollecting(false)
              }
            }}
            disabled={isCollecting}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          >
            {isCollecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            📡 RSS 실시간 수집
          </Button>
          
          <Button
            onClick={translateSelectedNews}
            disabled={isSaving || (!bannerNews && featuredNews.length === 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            선택한 뉴스 번역
          </Button>
          
          <Button
            onClick={saveSelectedNews}
            disabled={isSaving || (!bannerNews && featuredNews.length === 0)}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            홈화면 뉴스 저장
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 뉴스 목록 (2/3) */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-[1400px] flex flex-col">
              <div className="flex-1 flex flex-col overflow-hidden">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  뉴스 목록 ({filteredArticles.length}개)
                </h2>
                
                {/* 필터 */}
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="뉴스 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-800"
                  >
                    <option value="all">전체</option>
                    <option value="general">일반</option>
                    <option value="transfer">이적</option>
                    <option value="injury">부상</option>
                    <option value="match">경기</option>
                  </select>
                </div>

                {/* 뉴스 리스트 */}
                <div className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
                  {filteredArticles.map((article) => {
                    const isBanner = bannerNews?.id === article.id
                    const isFeatured = featuredNews.some(n => n.id === article.id)
                    const hasKoreanTranslation = article.translations?.ko
                    
                    return (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl border transition-all ${
                          isBanner
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
                            : isFeatured
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex gap-3">
                          {article.image_url && (
                            <img 
                              src={article.image_url} 
                              alt=""
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm line-clamp-1 mb-0.5">
                              {hasKoreanTranslation ? article.translations.ko.title : article.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">
                              {hasKoreanTranslation ? article.translations.ko.description : article.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Globe className="w-3 h-3" />
                                {article.source}
                              </span>
                              <Badge variant={article.source_tier === 1 ? "default" : "secondary"} className="text-xs">
                                Tier {article.source_tier}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {article.category}
                              </Badge>
                              {hasKoreanTranslation && (
                                <Badge className="bg-blue-600 text-xs">
                                  번역됨
                                </Badge>
                              )}
                              {isBanner && (
                                <Badge className="bg-purple-600 text-xs">
                                  배너
                                </Badge>
                              )}
                              {isFeatured && (
                                <Badge className="bg-green-600 text-xs">
                                  주요
                                </Badge>
                              )}
                              <span className="text-gray-500 ml-auto">
                                {formatDistanceToNow(new Date(article.published_at), { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}
                              </span>
                            </div>
                            <div className="flex gap-1.5 mt-1.5">
                              <Button
                                size="sm"
                                variant={isBanner ? "default" : "outline"}
                                className="text-xs h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  selectBannerNews(article)
                                }}
                              >
                                배너
                              </Button>
                              <Button
                                size="sm"
                                variant={isFeatured ? "default" : "outline"}
                                className="text-xs h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFeaturedNews(article)
                                }}
                              >
                                {isFeatured ? '주요 ✓' : '주요'}
                              </Button>
                              <Link href={article.url} target="_blank" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* 오른쪽: 홈화면 뉴스 선택 (1/3) */}
          <div>
            <Card className="p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  홈화면 뉴스 선택
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBannerNews(null)
                    setFeaturedNews([])
                    toast.info('모든 선택이 해제되었습니다')
                  }}
                  className="text-xs text-red-600 hover:bg-red-50"
                >
                  <X className="w-3 h-3 mr-1" />
                  전체 해제
                </Button>
              </div>

              {/* 선택 현황 요약 */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">선택된 뉴스</span>
                  <div className="flex gap-3">
                    <span className={`font-semibold ${bannerNews ? 'text-purple-600' : 'text-gray-400'}`}>
                      배너: {bannerNews ? '1' : '0'}/1
                    </span>
                    <span className={`font-semibold ${featuredNews.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      주요: {featuredNews.length}/5
                    </span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full flex">
                    <div 
                      className="bg-purple-600 transition-all"
                      style={{ width: bannerNews ? '16.66%' : '0%' }}
                    />
                    <div 
                      className="bg-green-600 transition-all"
                      style={{ width: `${(featuredNews.length / 6) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 배너 뉴스 */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-purple-600">🎨 상단 배너 (1개)</h3>
                {bannerNews ? (
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-300">
                    <h4 className="text-sm font-semibold line-clamp-2 mb-1">
                      {bannerNews.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{bannerNews.source}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setBannerNews(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-gray-500">
                    배너 뉴스를 선택해주세요
                  </div>
                )}
              </div>

              {/* 주요 뉴스 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-green-600">📰 주요 뉴스 ({featuredNews.length}/5)</h3>
                  {featuredNews.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFeaturedNews([])
                        toast.info('주요 뉴스가 모두 해제되었습니다')
                      }}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3 mr-1" />
                      주요 뉴스만 해제
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {featuredNews.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2 flex-1">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white font-bold text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold line-clamp-2">
                              {article.title}
                            </h4>
                            <span className="text-xs text-gray-500">{article.source}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* 순서 변경 버튼 */}
                          <div className="flex flex-col">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-0 h-4"
                              onClick={() => moveFeaturedNews(index, 'up')}
                              disabled={index === 0}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 14l5-5 5 5z"/>
                              </svg>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-0 h-4"
                              onClick={() => moveFeaturedNews(index, 'down')}
                              disabled={index === featuredNews.length - 1}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 10l5 5 5-5z"/>
                              </svg>
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFeaturedNews(article)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {featuredNews.length < 5 && (
                    <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-gray-500">
                      {5 - featuredNews.length}개 더 선택 가능
                    </div>
                  )}
                </div>
              </div>

              {/* 통계 정보 */}
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>전체 뉴스:</span>
                    <span className="font-semibold">{newsArticles.length}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>번역된 뉴스:</span>
                    <span className="font-semibold">
                      {newsArticles.filter(a => a.translations?.ko).length}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>홈화면 뉴스:</span>
                    <span className="font-semibold text-green-600">{(bannerNews ? 1 : 0) + featuredNews.length}개</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}