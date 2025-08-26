'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Home, Search, PlusSquare, Users, ChevronRight,
  TrendingUp, Shield, Star, Activity, Globe,
  Hash, UserCheck, Bell, Settings, ArrowRight,
  Sparkles, Zap, Crown, Flame, ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityPost } from '@/lib/types/community'
import { useSupabase } from '@/lib/supabase/provider'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// 인기 팀 데이터
const popularTeams = [
  { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png', members: '12.3K', color: 'from-blue-500/20 to-blue-600/20', border: 'from-blue-400 to-blue-600', gradient: 'from-blue-600 to-blue-800' },
  { id: 33, name: 'Man United', logo: 'https://media.api-sports.io/football/teams/33.png', members: '15.2K', color: 'from-red-500/20 to-red-600/20', border: 'from-red-400 to-red-600', gradient: 'from-red-600 to-red-800' },
  { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', members: '14.8K', color: 'from-red-400/20 to-red-500/20', border: 'from-red-300 to-red-500', gradient: 'from-red-500 to-red-700' },
  { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', members: '18.5K', color: 'from-purple-500/20 to-indigo-600/20', border: 'from-purple-400 to-indigo-600', gradient: 'from-purple-600 to-indigo-700' },
  { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', members: '17.9K', color: 'from-blue-600/20 to-red-500/20', border: 'from-blue-500 to-red-500', gradient: 'from-blue-800 to-red-700' },
  { id: 157, name: 'Bayern', logo: 'https://media.api-sports.io/football/teams/157.png', members: '11.2K', color: 'from-red-600/20 to-gray-600/20', border: 'from-red-500 to-gray-600', gradient: 'from-red-600 to-gray-800' },
]

// 게시판 카테고리
const boardCategories = [
  { id: 'all', name: '전체 게시판', icon: Globe, description: '모든 축구 팬들이 모이는 자유 게시판', color: 'from-emerald-400 to-teal-600', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20' },
  { id: 'hot', name: '인기 게시판', icon: Flame, description: '실시간 인기글 모음', color: 'from-orange-400 to-red-600', bg: 'from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20' },
  { id: 'match', name: '경기 게시판', icon: Activity, description: '경기 분석 및 토론', color: 'from-blue-400 to-indigo-600', bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20' },
  { id: 'transfer', name: '이적시장', icon: UserCheck, description: '이적 소식 및 루머', color: 'from-purple-400 to-pink-600', bg: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20' },
]

export default function CommunityPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'boards' | 'teams'>('boards')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const response = await CommunityService.getPosts('all')
      setPosts(response.data)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50/50 dark:from-black dark:via-gray-950 dark:to-black lg:ml-64">
      {/* Apple-style Header with Blur */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-gray-200/30 dark:border-gray-800/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight"
              >
                Community
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {posts.length} Posts
                </Badge>
              </motion.div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </Button>
              {user && (
                <Link href="/community/boards/all/write">
                  <Button className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/25">
                    <PlusSquare className="h-4 w-4 mr-2" />
                    새 글 작성
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 카테고리 섹션 - Apple Card Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
            >
              {/* Gradient Header */}
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
                      <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      게시판 둘러보기
                    </h2>
                  </div>
                  
                  {/* Apple-style Segmented Control */}
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-1 shadow-inner">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedCategory('boards')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          selectedCategory === 'boards'
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        게시판
                      </button>
                      <button
                        onClick={() => setSelectedCategory('teams')}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          selectedCategory === 'teams'
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        팀별
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {selectedCategory === 'boards' ? (
                    <motion.div
                      key="boards"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {boardCategories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onHoverStart={() => setHoveredCard(category.id)}
                          onHoverEnd={() => setHoveredCard(null)}
                        >
                          <Link href={`/community/boards/${category.id}`}>
                            <div className={cn(
                              "relative overflow-hidden rounded-2xl transition-all duration-300",
                              "bg-gradient-to-br shadow-lg hover:shadow-xl",
                              category.bg,
                              hoveredCard === category.id && "ring-2 ring-blue-500/50"
                            )}>
                              {/* Animated Background Pattern */}
                              <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent dark:from-black" />
                              </div>
                              
                              <div className="relative p-6">
                                <div className="flex items-start gap-4">
                                  <motion.div 
                                    className={cn(
                                      "p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg",
                                      category.color
                                    )}
                                    animate={hoveredCard === category.id ? { rotate: [0, -5, 5, 0] } : {}}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <category.icon className="h-6 w-6" />
                                  </motion.div>
                                  
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                      {category.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                      {category.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                          <Users className="h-3.5 w-3.5" />
                                          <span className="font-medium">1.2K</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                          <Activity className="h-3.5 w-3.5" />
                                          <span className="font-medium">활발</span>
                                        </div>
                                      </div>
                                      <motion.div
                                        animate={hoveredCard === category.id ? { x: 5 } : { x: 0 }}
                                      >
                                        <ArrowUpRight className="h-4 w-4 text-gray-400" />
                                      </motion.div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="teams"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                    >
                      {popularTeams.map((team, index) => (
                        <motion.div
                          key={team.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ y: -8 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link href={`/community/boards/team_${team.id}`}>
                            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-800/50">
                              {/* Gradient Background */}
                              <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                                team.color
                              )} />
                              
                              {/* Team Color Bar */}
                              <div className={cn(
                                "h-1 bg-gradient-to-r",
                                team.gradient
                              )} />
                              
                              <div className="p-5">
                                <div className="flex flex-col items-center text-center">
                                  {/* Logo with Glow Effect */}
                                  <div className="relative mb-4">
                                    <div className={cn(
                                      "absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br",
                                      team.border
                                    )} />
                                    <Image
                                      src={team.logo}
                                      alt={team.name}
                                      width={56}
                                      height={56}
                                      className="relative z-10 drop-shadow-xl"
                                    />
                                  </div>
                                  
                                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {team.name}
                                  </h3>
                                  
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="font-medium">{team.members}</span>
                                    <span>팬</span>
                                  </div>
                                  
                                  <Badge className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50">
                                    <Zap className="h-3 w-3 mr-1" />
                                    활발
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 인기 게시글 - Apple Card Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
            >
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
                      <Flame className="h-5 w-5 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      실시간 인기글
                    </h2>
                  </div>
                  <Link href="/community/boards/hot">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50">
                      전체보기
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-3 border-gray-300 border-t-blue-500 rounded-full mx-auto"
                    />
                  </div>
                ) : (
                  posts.slice(0, 5).map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 10 }}
                      className="group relative hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all cursor-pointer"
                      onClick={() => router.push(`/community/posts/${post.id}`)}
                    >
                      {/* Hover Indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-red-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                      
                      <div className="p-5 pl-8 flex items-start gap-4">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-lg",
                            index === 0 && "bg-gradient-to-br from-yellow-400 to-orange-500 text-white",
                            index === 1 && "bg-gradient-to-br from-gray-300 to-gray-400 text-white",
                            index === 2 && "bg-gradient-to-br from-orange-400 to-orange-600 text-white",
                            index > 2 && "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300"
                          )}>
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {post.content}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {post.author?.nickname?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {post.author?.nickname || '익명'}
                              </span>
                            </div>
                            
                            <span className="text-gray-400">•</span>
                            
                            <span className="text-gray-500">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
                            </span>
                            
                            <div className="flex items-center gap-3 ml-auto">
                              <div className="flex items-center gap-1 text-gray-500">
                                <Heart className="h-3.5 w-3.5" />
                                <span className="font-medium">{post.likeCount}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span className="font-medium">{post.commentCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* 사이드바 - Apple Widget Style */}
          <div className="space-y-6">
            {/* 공지사항 Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-20 translate-x-20" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16" />
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">공지사항</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <h4 className="font-medium mb-1">커뮤니티 가이드라인</h4>
                    <p className="text-sm opacity-90">건전한 토론 문화를 만들어가요</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <h4 className="font-medium mb-1">새 기능 출시</h4>
                    <p className="text-sm opacity-90">실시간 채팅 기능이 추가되었습니다</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 최근 활동 Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">최근 활동</h3>
                </div>
                
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {posts.slice(0, 4).map((post) => (
                      <motion.div
                        key={post.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer"
                        onClick={() => router.push(`/community/posts/${post.id}`)}
                      >
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          "{post.content?.slice(0, 60)}..."
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Avatar className="w-4 h-4">
                            <AvatarFallback className="text-[8px]">U</AvatarFallback>
                          </Avatar>
                          <span className="text-gray-500">{post.author?.nickname || '익명'}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-400">방금 전</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>

            {/* 트렌딩 태그 Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">트렌딩</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['프리미어리그', '챔스', '손흥민', '이강인', '맨시티', '아스날'].map((tag, index) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge 
                        className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 cursor-pointer transition-all"
                      >
                        #{tag}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - Apple Style */}
      {user && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Link href="/community/boards/all/write">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl shadow-purple-500/50 flex items-center justify-center backdrop-blur-sm"
            >
              <PlusSquare className="h-6 w-6" />
            </motion.button>
          </Link>
        </motion.div>
      )}
    </div>
  )
}