'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, MessageSquare, Plus, Users, Calendar, 
  Heart, MessageCircle, Eye, Loader2, Trophy,
  MapPin, Shield, TrendingUp, Target, Flame,
  Star, Activity, Zap, Crown, Sparkles, ChevronRight,
  Bell, BellOff, Share2, Filter, Search, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityBoard, CommunityPost, FanLevel } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useSupabase } from '@/lib/supabase/provider'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useTeamProfile, useTeamStatistics, useTeamNextFixtures, useTeamLastFixtures } from '@/lib/supabase/football'
import { getCurrentSeason } from '@/lib/types/football'
import { motion, AnimatePresence } from 'framer-motion'
import { TeamBoardHeader } from '@/components/community/enhanced/TeamBoardHeader'
import { InteractivePost } from '@/components/community/enhanced/InteractivePost'
import FanAuthModal from './FanAuthModal'
import { cn } from '@/lib/utils'

export default function BoardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.boardId as string
  const { supabase, user } = useSupabase()
  
  const [board, setBoard] = useState<CommunityBoard | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null)
  const [canWrite, setCanWrite] = useState<boolean>(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'top'>('hot')
  const [searchQuery, setSearchQuery] = useState('')
  const [userFanLevel, setUserFanLevel] = useState<FanLevel>(FanLevel.NONE)
  const [activeUsers, setActiveUsers] = useState(Math.floor(Math.random() * 50) + 10)
  
  // 팀 정보 관련 상태
  const isTeamBoard = boardId.startsWith('team_')
  const teamId = isTeamBoard ? parseInt(boardId.replace('team_', '')) : null
  
  // 팀 정보 가져오기 - 팀 게시판일 때만 호출
  const { data: teamProfile } = useTeamProfile(teamId || 0)
  const { data: nextFixtures } = useTeamNextFixtures(teamId || 0)
  const { data: lastFixtures } = useTeamLastFixtures(teamId || 0)
  const { data: teamStats } = useTeamStatistics(
    teamId || 0, 
    isTeamBoard ? getCurrentSeason(39) : 0,
    isTeamBoard ? 39 : 0
  )

  useEffect(() => {
    loadBoardData()
    checkWritePermission()
    checkUserFanLevel()
    
    // 실시간 구독 설정
    const channel = supabase
      .channel(`board_${boardId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'posts',
          filter: `board_id=eq.${boardId}`
        },
        handlePostChanges
      )
      .subscribe()
    
    setRealtimeChannel(channel)
    
    // 활성 사용자 수 시뮬레이션
    const interval = setInterval(() => {
      setActiveUsers(prev => Math.max(10, prev + Math.floor(Math.random() * 11) - 5))
    }, 10000)
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      clearInterval(interval)
    }
  }, [boardId, user])

  const checkUserFanLevel = async () => {
    if (!user || !isTeamBoard) return
    
    // 여기서는 시뮬레이션으로 팬 레벨 설정
    // 실제로는 DB에서 가져와야 함
    const levels = [FanLevel.NONE, FanLevel.BASIC, FanLevel.VERIFIED, FanLevel.VIP]
    setUserFanLevel(levels[Math.floor(Math.random() * levels.length)])
  }

  const checkWritePermission = async () => {
    if (!user) {
      setCanWrite(false)
      return
    }
    
    try {
      const profile = await CommunityService.getUserProfile(user.id)
      setUserProfile(profile)
      
      const hasPermission = await CommunityService.canWriteToTeamBoard(user.id, boardId)
      setCanWrite(hasPermission)
    } catch (error) {
      console.error('Error checking write permission:', error)
      setCanWrite(false)
    }
  }

  const loadBoardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 게시판 정보 설정
      if (boardId === 'all') {
        setBoard({
          id: 'all',
          name: '전체 게시판',
          description: '모든 축구 팬들이 자유롭게 소통하는 공간',
          type: 'all',
          memberCount: 1234,
          postCount: 5678
        })
      } else if (isTeamBoard && teamId) {
        setBoard({
          id: boardId,
          name: `${teamProfile?.team?.name || `Team ${teamId}`} 팬 게시판`,
          description: `열정적인 팬들이 모여 응원하고 소통하는 공간`,
          type: 'team',
          teamId: teamId,
          iconUrl: `https://media.api-sports.io/football/teams/${teamId}.png`,
          memberCount: Math.floor(Math.random() * 10000) + 1000,
          postCount: Math.floor(Math.random() * 5000) + 500
        })
      }
      
      // 게시글 목록 가져오기
      const postsResponse = await CommunityService.getPosts(boardId)
      setPosts(postsResponse.data)
    } catch (err) {
      console.error('Error loading board:', err)
      setError(err instanceof Error ? err.message : '게시판을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePostChanges = (payload: any) => {
    const { eventType, new: newPost, old: oldPost } = payload
    
    switch (eventType) {
      case 'INSERT':
        setPosts(prev => [newPost, ...prev])
        break
      case 'UPDATE':
        setPosts(prev => prev.map(post => 
          post.id === newPost.id ? newPost : post
        ))
        break
      case 'DELETE':
        setPosts(prev => prev.filter(post => post.id !== oldPost.id))
        break
    }
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const handleStartQuiz = () => {
    setShowAuthModal(true)
  }

  const handleReaction = (postId: string, reaction: any) => {
    // 리액션 처리 로직
    console.log(`Reacted with ${reaction} to post ${postId}`)
  }

  const handleVote = (postId: string, optionIndex: number) => {
    // 투표 처리 로직
    console.log(`Voted option ${optionIndex} in post ${postId}`)
  }

  // 게시글 필터링 및 정렬
  const filteredAndSortedPosts = posts
    .filter(post => {
      if (!searchQuery) return true
      return post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             post.content?.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      switch (activeTab) {
        case 'hot':
          return (b.likeCount + b.commentCount * 2) - (a.likeCount + a.commentCount * 2)
        case 'new':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'top':
          return b.viewCount - a.viewCount
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-blue-600" />
        </motion.div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '게시판을 찾을 수 없습니다.'}</p>
            <Button onClick={() => router.push('/community')}>
              커뮤니티로 돌아가기
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // 다음 경기 정보
  const nextMatch = nextFixtures?.response?.[0] ? {
    opponent: nextFixtures.response[0].teams.home.id === teamId 
      ? nextFixtures.response[0].teams.away.name
      : nextFixtures.response[0].teams.home.name,
    opponentLogo: nextFixtures.response[0].teams.home.id === teamId
      ? nextFixtures.response[0].teams.away.logo
      : nextFixtures.response[0].teams.home.logo,
    date: new Date(nextFixtures.response[0].fixture.date),
    isHome: nextFixtures.response[0].teams.home.id === teamId
  } : undefined

  return (
    <div className="min-h-screen lg:ml-64 bg-gradient-to-b from-gray-50 via-white to-gray-50/50 dark:from-black dark:via-gray-950 dark:to-black">
      {/* Apple-style 헤더 */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-gray-200/30 dark:border-gray-800/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link href="/community">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
              </Link>
              <div className="hidden md:flex items-center gap-2 ml-2">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {board.name}
                </h1>
                <Badge className="ml-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50">
                  <Users className="h-3 w-3 mr-1" />
                  {activeUsers} 활동중
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFollowing(!isFollowing)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isFollowing 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                )}
              >
                {isFollowing ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all"
              >
                <Share2 className="h-5 w-5" />
              </motion.button>
              
              {user && canWrite ? (
                <Link href={`/community/boards/${boardId}/write`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    새 글
                  </motion.button>
                </Link>
              ) : user && !canWrite && isTeamBoard ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartQuiz}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-medium transition-all flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  팬 인증
                </motion.button>
              ) : !user ? (
                <Link href="/auth/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-medium transition-all"
                  >
                    로그인
                  </motion.button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* 팀 보드 헤더 (팀 게시판인 경우) */}
      {isTeamBoard && teamId && (
        <div className="container mx-auto px-4 py-6">
          <TeamBoardHeader
            teamId={teamId}
            teamName={teamProfile?.team?.name || `Team ${teamId}`}
            teamLogo={`https://media.api-sports.io/football/teams/${teamId}.png`}
            teamColor="from-blue-600 to-purple-600"
            memberCount={board.memberCount || 0}
            postCount={posts.length}
            todayPosts={Math.floor(Math.random() * 50) + 10}
            activeUsers={activeUsers}
            userFanLevel={userFanLevel}
            isFollowing={isFollowing}
            nextMatch={nextMatch}
            onFollow={handleFollow}
            onStartQuiz={handleStartQuiz}
          />
        </div>
      )}

      {/* Apple-style 검색 및 필터 바 */}
      <div className="container mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200/50 dark:border-gray-800/50 p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 바 */}
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="게시글, 작성자, 태그 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>
            </div>
            
            {/* Apple-style Segmented Control */}
            <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-1.5 flex gap-1">
              {[
                { value: 'hot', label: '인기', icon: Flame },
                { value: 'new', label: '최신', icon: Sparkles },
                { value: 'top', label: '조회순', icon: TrendingUp }
              ].map((tab) => (
                <motion.button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2",
                    activeTab === tab.value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </motion.button>
              ))}
            </div>
            
            {/* 필터 버튼 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all"
            >
              <Filter className="h-5 w-5" />
            </motion.button>
          </div>
          
          {/* 활성 태그 */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">인기 태그:</span>
            {['전술분석', '이적루머', '경기리뷰', '선수토론'].map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 transition-all"
              >
                #{tag}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 게시글 목록 */}
      <main className="container mx-auto px-6 pb-8">
        {filteredAndSortedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200/50 dark:border-gray-800/50 p-12"
          >
            <div className="text-center max-w-md mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl mb-6"
              >
                <MessageSquare className="h-12 w-12 text-gray-400" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchQuery ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {searchQuery ? '다른 키워드로 검색해보세요' : '첫 번째 글을 작성해서 대화를 시작해보세요!'}
              </p>
              {user && canWrite && !searchQuery && (
                <Link href={`/community/boards/${boardId}/write`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/25 transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    첫 게시글 작성하기
                  </motion.button>
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="group"
                >
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-200/50 dark:border-gray-800/50 overflow-hidden transition-all duration-300">
                    <div className="p-6">
                      {/* 상단 작성자 정보 */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                              {post.author?.nickname?.[0] || 'U'}
                            </div>
                            {userFanLevel >= FanLevel.VERIFIED && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Star className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {post.author?.nickname || '익명'}
                              </h4>
                              {post.author?.fanLevel && (
                                <Badge className="text-xs" variant="secondary">
                                  Lv.{post.author.fanLevel}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MoreHorizontal className="h-5 w-5 text-gray-400" />
                        </motion.button>
                      </div>
                      
                      {/* 본문 내용 */}
                      <Link href={`/community/posts/${post.id}`}>
                        <div className="cursor-pointer">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {post.title}
                          </h3>
                          {post.content && (
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                              {post.content}
                            </p>
                          )}
                        </div>
                      </Link>
                      
                      {/* 태그 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full text-sm text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* 하단 액션 버튼 */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => console.log('like', post.id)}
                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group/like"
                          >
                            <Heart className="h-5 w-5 text-gray-400 group-hover/like:text-red-500 transition-colors" />
                          </motion.button>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {post.likeCount || 0}
                          </span>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(`/community/posts/${post.id}`)}
                            className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group/comment ml-2"
                          >
                            <MessageCircle className="h-5 w-5 text-gray-400 group-hover/comment:text-blue-500 transition-colors" />
                          </motion.button>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {post.commentCount || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Eye className="h-4 w-4" />
                            <span>{post.viewCount || 0}</span>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => console.log('share', post.id)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Share2 className="h-5 w-5 text-gray-400" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* 팬 인증 모달 */}
      {showAuthModal && (
        <FanAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          teamId={teamId || 0}
          teamName={teamProfile?.team?.name || ''}
          currentLevel={userFanLevel}
          onLevelUp={(newLevel) => {
            setUserFanLevel(newLevel)
            setCanWrite(true)
          }}
        />
      )}
    </div>
  )
}