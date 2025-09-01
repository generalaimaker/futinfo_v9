'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { adminService, FeaturedMatch, CuratedNews } from '@/lib/supabase/admin'
import { FootballAPIService } from '@/lib/supabase/football'
import { getAnalytics } from '@/lib/supabase/analytics'
import { createClient } from '@/lib/supabase/client'
import UsageMonitor from './UsageMonitor'
import RealtimePollingManager from './RealtimePollingManager'
import { 
  Shield, Trophy, Newspaper, Settings, Plus, Edit, Trash2, Save, X, 
  Calendar, Star, Eye, EyeOff, MoveUp, MoveDown, RefreshCw, Search,
  TrendingUp, Users, BarChart3, Activity, Clock, Filter, ChevronRight,
  Home, Image as ImageIcon, Link, AlertCircle, CheckCircle, Loader2,
  Database, Globe, Bell, Zap, Layout, Palette, Code, Monitor, Languages
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import Image from 'next/image'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// 통계 카드 컴포넌트
function StatsCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br", color,
        "shadow-lg hover:shadow-xl transition-all"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">{trend}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-white/20 rounded-xl">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
    </motion.div>
  )
}

// 빠른 액션 버튼
function QuickAction({ icon: Icon, label, onClick, color = "blue" }: any) {
  const colors = {
    blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    green: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    orange: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl",
        "bg-gradient-to-br", colors[color],
        "text-white shadow-lg hover:shadow-xl transition-all"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<Date>(new Date())
  
  // 데이터 상태
  const [featuredMatches, setFeaturedMatches] = useState<FeaturedMatch[]>([])
  const [curatedNews, setCuratedNews] = useState<CuratedNews[]>([])
  const [todayMatches, setTodayMatches] = useState<any[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalViews: 0,
    activeUsers: 0,
    featuredContent: 0,
    engagement: 0
  })
  
  // 필터 상태
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [showOnlyBigMatches, setShowOnlyBigMatches] = useState(false)
  
  // 뉴스 관련 상태
  const [newsSearchQuery, setNewsSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedNews, setSelectedNews] = useState<any[]>([])
  const [isSearchingNews, setIsSearchingNews] = useState(false)
  const [isSavingNews, setIsSavingNews] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationStatus, setTranslationStatus] = useState<{
    dailyLimit: number
    translatedToday: number
    remainingToday: number
  }>({ dailyLimit: 5, translatedToday: 0, remainingToday: 5 })
  
  // 배너 미리보기 상태
  const [previewMode, setPreviewMode] = useState(false)
  
  // 주요 리그와 팀
  const MAJOR_LEAGUES = [
    { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png' },
    { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
    { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png' },
    { id: 78, name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png' },
    { id: 61, name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png' },
    { id: 2, name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' }
  ]

  const BIG_TEAMS = {
    premier: [
      { id: 33, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png' },
      { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
      { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
      { id: 47, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png' }
    ],
    laliga: [
      { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      { id: 530, name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png' }
    ]
  }

  // 관리자 권한 체크
  useEffect(() => {
    checkAdminAccess()
  }, [])

  // 기존 선택된 뉴스 로드 및 뉴스 탭 활성화 시 최신 뉴스 로드
  useEffect(() => {
    if (isAdmin) {
      loadFeaturedNews()
      checkTranslationStatus()
    }
  }, [isAdmin])

  // 뉴스 탭 활성화 시 최신 뉴스 자동 로드
  useEffect(() => {
    if (activeTab === 'news' && searchResults.length === 0) {
      loadLatestNews()
    }
  }, [activeTab])

  const loadFeaturedNews = async () => {
    try {
      const supabase = createClient()
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
    }
  }

  const checkAdminAccess = async () => {
    try {
      const hasAccess = await adminService.checkAdminAccess()
      if (!hasAccess) {
        toast.error('관리자 권한이 없습니다')
        router.push('/')
        return
      }
      setIsAdmin(true)
      await loadData()
      await loadStats()
    } catch (error) {
      console.error('Admin access error:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [featured, news] = await Promise.all([
        adminService.getFeaturedMatches(),
        adminService.getCuratedNews()
      ])
      
      setFeaturedMatches(featured || [])
      setCuratedNews(news || [])
      
      await loadMatches()
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('데이터 로드 실패')
    }
  }

  const loadStats = async () => {
    try {
      // 실제 데이터 기반 통계
      const [featured, news, analyticsStats] = await Promise.all([
        adminService.getFeaturedMatches(),
        adminService.getCuratedNews(),
        getAnalytics().getStats()
      ])
      
      setStats({
        totalViews: analyticsStats.totalViews,
        activeUsers: analyticsStats.activeUsers,
        featuredContent: (featured?.length || 0) + (news?.length || 0),
        engagement: analyticsStats.engagement
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      setStats({
        totalViews: 0,
        activeUsers: 0,
        featuredContent: 0,
        engagement: 0
      })
    }
  }

  const loadMatches = async () => {
    try {
      const service = new FootballAPIService()
      const today = new Date()
      
      // 오늘부터 7일간의 경기 로드
      const promises = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
        promises.push(service.getFixturesByDate(date))
      }
      
      const results = await Promise.all(promises)
      const allMatches: any[] = []
      
      results.forEach(data => {
        if (data?.response) {
          allMatches.push(...data.response)
        }
      })
      
      // 오늘 경기와 다음 경기 분리
      const todayStr = today.toISOString().split('T')[0]
      const todayGames = allMatches.filter(m => 
        m.fixture.date.split('T')[0] === todayStr
      )
      const upcomingGames = allMatches.filter(m => 
        m.fixture.date.split('T')[0] !== todayStr
      )
      
      setTodayMatches(todayGames)
      setUpcomingMatches(upcomingGames)
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  // 필터링된 경기
  const filteredMatches = [...todayMatches, ...upcomingMatches].filter(match => {
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const homeTeam = match.teams.home.name.toLowerCase()
      const awayTeam = match.teams.away.name.toLowerCase()
      const league = match.league.name.toLowerCase()
      
      if (!homeTeam.includes(query) && !awayTeam.includes(query) && !league.includes(query)) {
        return false
      }
    }
    
    // 리그 필터
    if (selectedLeague && match.league.id !== selectedLeague) {
      return false
    }
    
    // 팀 필터
    if (selectedTeam) {
      if (match.teams.home.id !== selectedTeam && match.teams.away.id !== selectedTeam) {
        return false
      }
    }
    
    // 빅매치 필터
    if (showOnlyBigMatches) {
      const allBigTeams = [
        ...BIG_TEAMS.premier.map(t => t.id),
        ...BIG_TEAMS.laliga.map(t => t.id)
      ]
      const isBigMatch = allBigTeams.includes(match.teams.home.id) || 
                         allBigTeams.includes(match.teams.away.id)
      if (!isBigMatch) return false
    }
    
    return true
  })

  // 추천 경기 추가
  const addFeaturedMatch = async (match: any) => {
    try {
      // 이미 추가된 경기인지 확인
      if (featuredMatches.some(f => f.fixture_id === match.fixture.id)) {
        toast.warning('이미 추천 목록에 있습니다')
        return
      }
      
      // 최대 5개까지만
      if (featuredMatches.length >= 5) {
        toast.error('최대 5개까지만 추가 가능합니다')
        return
      }
      
      const featuredMatch: Omit<FeaturedMatch, 'id' | 'created_at'> = {
        fixture_id: match.fixture.id,
        match_date: match.fixture.date.split('T')[0],
        teams_info: match.teams,
        league_info: match.league,
        priority: featuredMatches.length,
        is_featured: true,
        featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      await adminService.addFeaturedMatch(featuredMatch)
      toast.success('추천 경기로 추가되었습니다')
      await loadData()
    } catch (error) {
      console.error('Error adding featured match:', error)
      toast.error('추천 경기 추가 실패')
    }
  }

  // 추천 경기 제거
  const removeFeaturedMatch = async (id: string) => {
    try {
      await adminService.removeFeaturedMatch(id)
      toast.success('추천 경기가 제거되었습니다')
      await loadData()
    } catch (error) {
      console.error('Error removing featured match:', error)
      toast.error('추천 경기 제거 실패')
    }
  }

  // 우선순위 변경
  const updatePriority = async (id: string, type: 'match' | 'news', direction: 'up' | 'down') => {
    try {
      const items = type === 'match' ? featuredMatches : curatedNews
      const currentIndex = items.findIndex(item => item.id === id)
      
      if ((direction === 'up' && currentIndex === 0) || 
          (direction === 'down' && currentIndex === items.length - 1)) {
        return
      }
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const updatedItems = [...items]
      const temp = updatedItems[currentIndex]
      updatedItems[currentIndex] = updatedItems[newIndex]
      updatedItems[newIndex] = temp
      
      // 우선순위 업데이트
      for (let i = 0; i < updatedItems.length; i++) {
        if (type === 'match') {
          await adminService.updateFeaturedMatch(updatedItems[i].id!, { priority: i })
        } else {
          await adminService.updateCuratedNews(updatedItems[i].id!, { priority: i })
        }
      }
      
      toast.success('우선순위가 변경되었습니다')
      await loadData()
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('우선순위 변경 실패')
    }
  }

  // 일괄 작업
  const clearAllFeatured = async () => {
    if (!confirm('모든 추천 경기를 삭제하시겠습니까?')) return
    
    try {
      for (const match of featuredMatches) {
        await adminService.removeFeaturedMatch(match.id!)
      }
      toast.success('모든 추천 경기가 삭제되었습니다')
      await loadData()
    } catch (error) {
      console.error('Error clearing featured:', error)
      toast.error('삭제 실패')
    }
  }

  const autoSelectBigMatches = async () => {
    try {
      const bigTeamIds = [
        ...BIG_TEAMS.premier.map(t => t.id),
        ...BIG_TEAMS.laliga.map(t => t.id)
      ]
      
      const bigMatches = filteredMatches
        .filter(match => {
          const homeId = match.teams.home.id
          const awayId = match.teams.away.id
          return bigTeamIds.includes(homeId) && bigTeamIds.includes(awayId)
        })
        .slice(0, 5)
      
      for (const match of bigMatches) {
        await addFeaturedMatch(match)
      }
      
      toast.success(`${bigMatches.length}개의 빅매치가 자동 선택되었습니다`)
    } catch (error) {
      console.error('Error auto selecting:', error)
      toast.error('자동 선택 실패')
    }
  }

  // 뉴스 검색 - Supabase에서 직접 검색
  const searchNews = async () => {
    if (!newsSearchQuery.trim()) {
      toast.error('검색어를 입력해주세요')
      return
    }

    setIsSearchingNews(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .or(`title.ilike.%${newsSearchQuery}%,description.ilike.%${newsSearchQuery}%`)
        .order('published_at', { ascending: false })
        .limit(30)
      
      if (error) throw error
      
      // API 형식에 맞게 변환
      const formattedArticles = (data || []).map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.image_url,
        publishedAt: article.published_at,
        source: {
          id: null,
          name: article.source
        }
      }))
      
      setSearchResults(formattedArticles)
      
      if (formattedArticles.length === 0) {
        toast.info('검색 결과가 없습니다')
      }
    } catch (error) {
      console.error('Error searching news:', error)
      toast.error('뉴스 검색에 실패했습니다')
    } finally {
      setIsSearchingNews(false)
    }
  }

  // 최신 뉴스 로드 - Supabase에서 직접 가져오기
  const loadLatestNews = async () => {
    setIsSearchingNews(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(30)
      
      if (error) throw error
      
      // API 형식에 맞게 변환
      const formattedArticles = (data || []).map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.image_url,
        publishedAt: article.published_at,
        source: {
          id: null,
          name: article.source
        }
      }))
      
      setSearchResults(formattedArticles)
    } catch (error) {
      console.error('Error loading latest news:', error)
      toast.error('최신 뉴스를 불러오는데 실패했습니다')
    } finally {
      setIsSearchingNews(false)
    }
  }

  // 뉴스 선택/해제
  const toggleNewsSelection = (article: any) => {
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

  // 선택된 뉴스 저장
  // 번역 상태 확인
  const checkTranslationStatus = async () => {
    try {
      const response = await fetch('/api/translate-featured', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTranslationStatus(data)
      }
    } catch (error) {
      console.error('Failed to check translation status:', error)
    }
  }

  // Featured News 번역
  const translateFeaturedNews = async () => {
    if (translationStatus.remainingToday === 0) {
      toast.error(`일일 번역 한도(${translationStatus.dailyLimit}개)에 도달했습니다`)
      return
    }

    setIsTranslating(true)
    try {
      const response = await fetch('/api/translate-featured', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`${data.translated}개 뉴스 번역 완료 (오늘 남은 횟수: ${data.remainingToday})`)
        setTranslationStatus({
          dailyLimit: data.dailyLimit,
          translatedToday: data.dailyLimit - data.remainingToday,
          remainingToday: data.remainingToday
        })
      } else {
        toast.error(data.error || '번역 중 오류가 발생했습니다')
      }
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('번역 중 오류가 발생했습니다')
    } finally {
      setIsTranslating(false)
    }
  }

  const saveFeaturedNews = async () => {
    if (selectedNews.length === 0) {
      toast.error('선택된 뉴스가 없습니다')
      return
    }

    setIsSavingNews(true)
    try {
      const supabase = createClient()
      
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
      await loadData()
    } catch (error) {
      console.error('Error saving featured news:', error)
      toast.error('뉴스 저장에 실패했습니다')
    } finally {
      setIsSavingNews(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-lg">관리자 대시보드 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-[1920px] mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  관리자 대시보드
                </h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                  {format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant={previewMode ? "default" : "outline"}
                className="gap-2"
                size="sm"
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">미리보기</span>
              </Button>
              <Button
                onClick={loadData}
                variant="outline"
                className="gap-2"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">새로고침</span>
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="gap-2"
                size="sm"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">홈으로</span>
              </Button>
            </div>
          </div>
        </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="총 조회수"
          value={stats.totalViews > 0 ? stats.totalViews.toLocaleString() : '-'}
          icon={Eye}
          trend={null}
          color="from-blue-500 to-blue-600"
        />
        <StatsCard
          title="활성 사용자"
          value={stats.activeUsers > 0 ? stats.activeUsers.toLocaleString() : '-'}
          icon={Users}
          trend={null}
          color="from-green-500 to-green-600"
        />
        <StatsCard
          title="추천 콘텐츠"
          value={stats.featuredContent}
          icon={Star}
          color="from-purple-500 to-purple-600"
        />
        <StatsCard
          title="참여율"
          value={stats.engagement > 0 ? `${stats.engagement}%` : '-'}
          icon={Activity}
          trend={null}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* 빠른 액션 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction
            icon={Zap}
            label="빅매치 자동선택"
            onClick={autoSelectBigMatches}
            color="purple"
          />
          <QuickAction
            icon={Trash2}
            label="전체 초기화"
            onClick={clearAllFeatured}
            color="orange"
          />
          <QuickAction
            icon={Database}
            label="데이터 동기화"
            onClick={loadData}
            color="green"
          />
          <QuickAction
            icon={Bell}
            label="알림 설정"
            onClick={() => toast.info('알림 설정 기능 준비중')}
            color="blue"
          />
        </div>
      </div>

      {/* 메인 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex min-w-full lg:min-w-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border shadow-lg">
            <TabsTrigger value="overview" className="gap-2 whitespace-nowrap">
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">대시보드</span>
              <span className="sm:hidden">대시</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2 whitespace-nowrap">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">경기 관리</span>
              <span className="sm:hidden">경기</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2 whitespace-nowrap">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">뉴스 관리</span>
              <span className="sm:hidden">뉴스</span>
            </TabsTrigger>
            <TabsTrigger value="banner" className="gap-2 whitespace-nowrap">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">배너 설정</span>
              <span className="sm:hidden">배너</span>
            </TabsTrigger>
            <TabsTrigger value="realtime" className="gap-2 whitespace-nowrap">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">실시간 폴링</span>
              <span className="sm:hidden">폴링</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 whitespace-nowrap">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">분석</span>
              <span className="sm:hidden">분석</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2 whitespace-nowrap">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">모니터링</span>
              <span className="sm:hidden">모니터</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 대시보드 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 현재 추천 콘텐츠 */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                현재 추천 콘텐츠
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <span className="text-sm font-medium">추천 경기</span>
                  <span className="text-2xl font-bold text-blue-600">{featuredMatches.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <span className="text-sm font-medium">큐레이션 뉴스</span>
                  <span className="text-2xl font-bold text-green-600">{curatedNews.length}</span>
                </div>
              </div>
            </Card>

            {/* 실시간 상태 */}
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                실시간 상태
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">서버 상태</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">정상</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">API 응답시간</span>
                  <span className="text-sm font-medium">125ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">캐시 적중률</span>
                  <span className="text-sm font-medium">94.2%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* 배너 미리보기 */}
          {previewMode && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <h3 className="text-lg font-semibold mb-4">배너 미리보기</h3>
              <div className="aspect-[16/9] bg-white dark:bg-gray-900 rounded-xl shadow-inner p-8">
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-2" />
                    <p>실시간 배너 미리보기</p>
                    <p className="text-sm mt-2">선택된 콘텐츠가 여기에 표시됩니다</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* 경기 관리 탭 */}
        <TabsContent value="matches" className="space-y-6">
          {/* 필터 바 */}
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="팀, 리그 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select
                value={selectedLeague || ''}
                onChange={(e) => setSelectedLeague(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800"
              >
                <option value="">모든 리그</option>
                {MAJOR_LEAGUES.map(league => (
                  <option key={league.id} value={league.id}>{league.name}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={showOnlyBigMatches}
                  onCheckedChange={setShowOnlyBigMatches}
                />
                <Label>빅매치만</Label>
              </div>
            </div>
          </Card>

          {/* 현재 추천 경기 */}
          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                추천 경기 ({featuredMatches.length}/5)
              </h3>
              {featuredMatches.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearAllFeatured}
                >
                  전체 삭제
                </Button>
              )}
            </div>
            
            <AnimatePresence>
              {featuredMatches.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-500"
                >
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>추천 경기가 없습니다</p>
                  <p className="text-sm mt-2">아래에서 경기를 선택해주세요</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {featuredMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl"
                    >
                      <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                      
                      <div className="flex-1 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Image
                            src={match.teams_info.home.logo}
                            alt={match.teams_info.home.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className="font-medium">{match.teams_info.home.name}</span>
                        </div>
                        
                        <span className="text-gray-500">vs</span>
                        
                        <div className="flex items-center gap-2">
                          <Image
                            src={match.teams_info.away.logo}
                            alt={match.teams_info.away.name}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                          <span className="font-medium">{match.teams_info.away.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(match.match_date), 'MM/dd')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updatePriority(match.id!, 'match', 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updatePriority(match.id!, 'match', 'down')}
                          disabled={index === featuredMatches.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFeaturedMatch(match.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </Card>

          {/* 경기 선택 */}
          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-4">경기 선택</h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredMatches.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>표시할 경기가 없습니다</p>
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const isAdded = featuredMatches.some(f => f.fixture_id === match.fixture.id)
                  const matchDate = new Date(match.fixture.date)
                  const isToday = matchDate.toDateString() === new Date().toDateString()
                  
                  return (
                    <motion.div
                      key={match.fixture.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        "hover:shadow-lg hover:scale-[1.02]",
                        isAdded ? "bg-green-50 dark:bg-green-950/30 border-green-300" : "bg-white dark:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {isToday && (
                          <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            오늘
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Image
                            src={match.teams.home.logo}
                            alt={match.teams.home.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                          <span className="text-sm font-medium">{match.teams.home.name}</span>
                        </div>
                        
                        <span className="text-xs text-gray-500">vs</span>
                        
                        <div className="flex items-center gap-2">
                          <Image
                            src={match.teams.away.logo}
                            alt={match.teams.away.name}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                          <span className="text-sm font-medium">{match.teams.away.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-500">
                          <div>{match.league.name}</div>
                          <div>{format(matchDate, 'MM/dd HH:mm')}</div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={isAdded ? "secondary" : "default"}
                          onClick={() => !isAdded && addFeaturedMatch(match)}
                          disabled={isAdded || featuredMatches.length >= 5}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              추가됨
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              추가
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )
                }))
              }
            </div>
          </Card>
        </TabsContent>

        {/* 뉴스 관리 탭 */}
        <TabsContent value="news" className="space-y-6">
          {/* 필터 바 */}
          <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="뉴스 검색 (예: 손흥민, 프리미어리그)..."
                    value={newsSearchQuery}
                    onChange={(e) => setNewsSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchNews()}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                onClick={searchNews}
                disabled={isSearchingNews}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSearchingNews ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-2">검색</span>
              </Button>
              
              <Button
                onClick={loadLatestNews}
                disabled={isSearchingNews}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                최신 뉴스
              </Button>
            </div>
          </Card>

          {/* 현재 선택된 뉴스 */}
          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            {/* 번역 상태 정보 카드 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 mb-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    오늘의 번역 현황
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">
                    사용: <span className="font-bold text-purple-600">{translationStatus.translatedToday}</span>/{translationStatus.dailyLimit}
                  </span>
                  <span className="text-gray-600">
                    남은 횟수: <span className="font-bold text-blue-600">{translationStatus.remainingToday}개</span>
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(translationStatus.translatedToday / translationStatus.dailyLimit) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 주요 뉴스 5개만 제목과 설명을 한국어로 번역합니다 (일일 한도 제한)
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                선택된 뉴스 ({selectedNews.length}/5)
              </h3>
              <div className="flex gap-2">
                {selectedNews.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedNews([])
                      toast.success('선택이 초기화되었습니다')
                    }}
                  >
                    전체 해제
                  </Button>
                )}
                <Button
                  onClick={saveFeaturedNews}
                  disabled={isSavingNews || selectedNews.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingNews ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  저장하기
                </Button>
                <Button
                  onClick={translateFeaturedNews}
                  disabled={isTranslating || translationStatus.remainingToday === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                  title={`일일 번역 한도: ${translationStatus.translatedToday}/${translationStatus.dailyLimit}`}
                >
                  {isTranslating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Languages className="w-4 h-4 mr-2" />
                  )}
                  번역 ({translationStatus.remainingToday}개 가능)
                </Button>
              </div>
            </div>
            
            <AnimatePresence>
              {selectedNews.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-gray-500"
                >
                  <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>선택된 뉴스가 없습니다</p>
                  <p className="text-sm mt-2">아래에서 뉴스를 선택해주세요</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {selectedNews.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl"
                    >
                      <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                      
                      {article.urlToImage && (
                        <img 
                          src={article.urlToImage} 
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">{article.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{article.source.name}</p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => toggleNewsSelection(article)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </Card>

          {/* 뉴스 선택 */}
          <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
            <h3 className="text-lg font-semibold mb-4">뉴스 선택</h3>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>표시할 뉴스가 없습니다</p>
                  <p className="text-sm mt-2">검색하거나 최신 뉴스를 불러와주세요</p>
                </div>
              ) : (
                searchResults.map((article) => {
                  const isSelected = selectedNews.some(n => n.id === article.id)
                  
                  return (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                        "hover:shadow-lg hover:scale-[1.02]",
                        isSelected ? "bg-green-50 dark:bg-green-950/30 border-green-300" : "bg-white dark:bg-gray-800"
                      )}
                      onClick={() => toggleNewsSelection(article)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {article.urlToImage && (
                          <img 
                            src={article.urlToImage} 
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        
                        <div className="flex-1">
                          <h4 className="font-medium line-clamp-2 mb-1">{article.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {article.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {article.source.name}
                            </span>
                            <span>
                              {format(new Date(article.publishedAt), 'MM/dd HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant={isSelected ? "secondary" : "default"}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleNewsSelection(article)
                        }}
                        disabled={!isSelected && selectedNews.length >= 5}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            선택됨
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            선택
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )
                }))
              }
            </div>
          </Card>
        </TabsContent>

        {/* 배너 설정 탭 */}
        <TabsContent value="banner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                표시 설정
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>자동 로테이션</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>로테이션 간격</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="5" className="w-20" />
                    <span className="text-sm text-gray-500">초</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>최대 표시 개수</Label>
                  <Input type="number" defaultValue="5" className="w-20" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                디자인 설정
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>그라디언트 효과</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>애니메이션 효과</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>다크모드 지원</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 분석 탭 */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">인기 콘텐츠</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">맨유 vs 리버풀</span>
                  <span className="text-sm font-bold">3,421 views</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">손흥민 재계약 뉴스</span>
                  <span className="text-sm font-bold">2,856 views</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm">바르셀로나 vs 레알</span>
                  <span className="text-sm font-bold">2,234 views</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">사용자 행동</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">평균 체류시간</span>
                  <span className="text-sm font-bold">4분 32초</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">클릭률</span>
                  <span className="text-sm font-bold">32.4%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">이탈률</span>
                  <span className="text-sm font-bold">12.8%</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 모니터링 탭 */}
        <TabsContent value="monitoring" className="space-y-6">
          <UsageMonitor />
        </TabsContent>

        {/* 실시간 폴링 탭 */}
        <TabsContent value="realtime" className="space-y-6">
          <RealtimePollingManager />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

// 뉴스 편집 카드 컴포넌트
function NewsEditCard({ news, index, onUpdate, onDelete, onPriorityChange, isFirst, isLast }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedNews, setEditedNews] = useState(news)

  const handleSave = () => {
    onUpdate(editedNews)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <Input
            value={editedNews.title}
            onChange={(e) => setEditedNews({ ...editedNews, title: e.target.value })}
            placeholder="제목"
          />
          <Textarea
            value={editedNews.description || ''}
            onChange={(e) => setEditedNews({ ...editedNews, description: e.target.value })}
            placeholder="설명"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={editedNews.source_url || ''}
              onChange={(e) => setEditedNews({ ...editedNews, source_url: e.target.value })}
              placeholder="URL"
            />
            <Input
              value={editedNews.source_name || ''}
              onChange={(e) => setEditedNews({ ...editedNews, source_name: e.target.value })}
              placeholder="출처"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border"
    >
      <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
      
      <div className="flex-1">
        <h4 className="font-medium">{news.title}</h4>
        {news.description && (
          <p className="text-sm text-gray-500 mt-1">{news.description}</p>
        )}
        {news.source_name && (
          <p className="text-xs text-gray-400 mt-1">출처: {news.source_name}</p>
        )}
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPriorityChange('up')}
          disabled={isFirst}
        >
          <MoveUp className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPriorityChange('down')}
          disabled={isLast}
        >
          <MoveDown className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onUpdate({ is_featured: !news.is_featured })}
        >
          {news.is_featured ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}