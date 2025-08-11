'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, MessageSquare, TrendingUp, Crown, Shield, Heart,
  ArrowRight, Sparkles, Trophy, Zap, Star, Flame, Clock,
  ChevronRight, BarChart3, Hash, Plus, Search, Filter,
  Eye, ThumbsUp, Bookmark, Share2, MessagesSquare, Activity,
  MoreHorizontal, Send, Repeat2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityPost } from '@/lib/types/community'
import { useSupabase } from '@/lib/supabase/provider'
import { FootballAPIService } from '@/lib/supabase/football'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { FanLevel, PostVisibility } from '@/lib/types/community'

// 인기 팀 데이터
const popularTeams = [
  { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png', memberCount: 2345, color: 'from-blue-600 to-blue-800' },
  { id: 33, name: 'Man United', logo: 'https://media.api-sports.io/football/teams/33.png', memberCount: 3456, color: 'from-red-600 to-red-800' },
  { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', memberCount: 3211, color: 'from-red-500 to-red-700' },
  { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', memberCount: 4567, color: 'from-purple-600 to-indigo-700' },
  { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', memberCount: 4321, color: 'from-blue-800 to-red-700' },
  { id: 157, name: 'Bayern', logo: 'https://media.api-sports.io/football/teams/157.png', memberCount: 2890, color: 'from-red-600 to-gray-800' },
]

// 인기 리그 데이터
const popularLeagues = [
  { id: 39, name: 'Premier League', icon: '🏴󐁧󐁢󐁥󐁮󐁧󐁿' },
  { id: 140, name: 'La Liga', icon: '🇪🇸' },
  { id: 78, name: 'Bundesliga', icon: '🇩🇪' },
  { id: 135, name: 'Serie A', icon: '🇮🇹' },
  { id: 61, name: 'Ligue 1', icon: '🇫🇷' },
  { id: 2, name: 'Champions', icon: '⭐' },
]

// 트렌딩 해시태그
const trendingTags = [
  { tag: '#손흥민', count: 1234, trend: 'up' },
  { tag: '#첼시우승', count: 987, trend: 'up' },
  { tag: '#맨유위기', count: 876, trend: 'down' },
  { tag: '#레알마드리드', count: 654, trend: 'up' },
  { tag: '#챔스결승', count: 543, trend: 'up' },
]

export default function CommunityPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [popularPosts, setPopularPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [mainTab, setMainTab] = useState<'all' | 'myteam' | 'rival' | 'matchday'>('all')
  const [userFanLevel, setUserFanLevel] = useState<FanLevel>(FanLevel.NONE)
  const [userTeamId, setUserTeamId] = useState<number | null>(49) // 기본값 Chelsea
  const [rivalTeamId, setRivalTeamId] = useState<number | null>(47) // Tottenham as default rival
  
  useEffect(() => {
    loadCommunityData()
    loadLiveMatches()
  }, [])

  const loadCommunityData = async () => {
    try {
      setIsLoading(true)
      
      // 인기 게시글 가져오기
      const popular = await CommunityService.getPopularPosts({ limit: 5 })
      setPopularPosts(popular)
      
      // 전체 게시글 가져오기
      const allPostsResponse = await CommunityService.getPosts('all')
      setPosts(allPostsResponse.data)
      
    } catch (error) {
      console.error('Error loading community data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLiveMatches = async () => {
    try {
      // 오늘 날짜의 경기 가져오기 (라이브 대신)
      const service = new FootballAPIService()
      const today = new Date().toISOString().split('T')[0]
      const data = await service.getFixtures({
        date: today
      })
      if (data?.response) {
        // 진행 중인 경기만 필터링
        const liveGames = data.response.filter((match: any) => 
          match.fixture.status.short === 'LIVE' || 
          match.fixture.status.short === '1H' || 
          match.fixture.status.short === '2H' ||
          match.fixture.status.short === 'HT'
        )
        setLiveMatches(liveGames.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading live matches:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 상단 탭 네비게이션 - 주요 구분 */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setMainTab('all')}
                className={cn(
                  "px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap",
                  mainTab === 'all'
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                )}
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  전체
                </span>
              </button>
              <button
                onClick={() => setMainTab('myteam')}
                className={cn(
                  "px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap",
                  mainTab === 'myteam'
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                )}
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  내 팀
                  {userTeamId === 49 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Chelsea</span>}
                </span>
              </button>
              <button
                onClick={() => setMainTab('rival')}
                className={cn(
                  "px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap",
                  mainTab === 'rival'
                    ? "text-red-600 border-red-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                )}
              >
                <span className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  라이벌
                </span>
              </button>
              <button
                onClick={() => setMainTab('matchday')}
                className={cn(
                  "px-6 py-4 font-semibold border-b-2 transition-all whitespace-nowrap",
                  mainTab === 'matchday'
                    ? "text-green-600 border-green-600"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                )}
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  매치데이
                  {liveMatches.length > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </span>
              </button>
            </div>
            
            {/* 글쓰기 버튼 */}
            <Button
              onClick={() => {
                if (mainTab === 'myteam' && userFanLevel < FanLevel.VERIFIED) {
                  alert('팀 게시판에 글을 쓰려면 팬 인증이 필요합니다.')
                  return
                }
                router.push(`/community/boards/${mainTab === 'myteam' ? `team_${userTeamId}` : 'all'}/write`)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              글쓰기
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section - 조건부 렌더링 */}
      {mainTab === 'all' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                🌍 전체 게시판
              </h1>
              <p className="text-sm text-white/80">
                모든 축구 팬들이 함께 소통하는 공간
              </p>
            </div>
          </div>
        </div>
      )}
      
      {mainTab === 'myteam' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src={`https://media.api-sports.io/football/teams/${userTeamId}.png`}
                  alt="Team Logo"
                  width={60}
                  height={60}
                  className="bg-white rounded-full p-2"
                />
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold mb-1">
                    💙 Chelsea 팬 게시판
                  </h1>
                  <p className="text-sm text-white/80">
                    우리만의 특별한 공간 #KTBFFH
                  </p>
                </div>
              </div>
              {userFanLevel >= FanLevel.VIP && (
                <Badge className="bg-yellow-500 text-black">
                  👑 VIP FAN
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
      
      {mainTab === 'rival' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                🔥 라이벌 대결
              </h1>
              <p className="text-sm text-white/80">
                Chelsea vs Tottenham - 건전한 경쟁이 시작됩니다
              </p>
            </div>
          </div>
        </div>
      )}
      
      {mainTab === 'matchday' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                ⚽ 매치데이 모드
                {liveMatches.length > 0 && <span className="text-xs bg-red-500 px-2 py-1 rounded-full animate-pulse">LIVE</span>}
              </h1>
              <p className="text-sm text-white/80">
                실시간 경기 토론과 응원
              </p>
            </div>
          </div>
        </div>
      )}
            

      {/* 3단 레이아웃 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 좌측 사이드바 - 리그/팀 통합 네비게이션 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 검색 바 */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="팀, 선수, 게시글 검색..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 리그 & 팀 아코디언 구조 */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  리그 & 팀 게시판
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Premier League */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedLeague(selectedLeague === 39 ? null : 39)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🏴󐁧󐁢󐁥󐁮󐁧󐁿</span>
                      <span className="font-medium">Premier League</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      selectedLeague === 39 ? "rotate-90" : ""
                    )} />
                  </button>
                  {selectedLeague === 39 && (
                    <div className="p-2 space-y-1 border-t">
                      {[49, 33, 40, 42, 50].map(teamId => {
                        const team = popularTeams.find(t => t.id === teamId)
                        if (!team) return null
                        return (
                          <Link
                            key={team.id}
                            href={`/community/boards/team_${team.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Image
                              src={team.logo}
                              alt={team.name}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                            <span className="text-sm flex-1">{team.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {team.memberCount.toLocaleString()}
                            </Badge>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* La Liga */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedLeague(selectedLeague === 140 ? null : 140)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇪🇸</span>
                      <span className="font-medium">La Liga</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      selectedLeague === 140 ? "rotate-90" : ""
                    )} />
                  </button>
                  {selectedLeague === 140 && (
                    <div className="p-2 space-y-1 border-t">
                      {[541, 529].map(teamId => {
                        const team = popularTeams.find(t => t.id === teamId)
                        if (!team) return null
                        return (
                          <Link
                            key={team.id}
                            href={`/community/boards/team_${team.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Image
                              src={team.logo}
                              alt={team.name}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                            <span className="text-sm flex-1">{team.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {team.memberCount.toLocaleString()}
                            </Badge>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Bundesliga */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedLeague(selectedLeague === 78 ? null : 78)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇩🇪</span>
                      <span className="font-medium">Bundesliga</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      selectedLeague === 78 ? "rotate-90" : ""
                    )} />
                  </button>
                  {selectedLeague === 78 && (
                    <div className="p-2 space-y-1 border-t">
                      {[157].map(teamId => {
                        const team = popularTeams.find(t => t.id === teamId)
                        if (!team) return null
                        return (
                          <Link
                            key={team.id}
                            href={`/community/boards/team_${team.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Image
                              src={team.logo}
                              alt={team.name}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                            <span className="text-sm flex-1">{team.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {team.memberCount.toLocaleString()}
                            </Badge>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 빠른 액션 버튼들 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  빠른 시작
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/community/boards/all/write')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  첫 게시글 작성하기
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/live')}
                >
                  <MessagesSquare className="h-4 w-4 mr-2" />
                  실시간 채팅 참여
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/predictions')}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  경기 예측하기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 중앙 메인 콘텐츠 - 게시글 피드 */}
          <div className="lg:col-span-6 space-y-6">
            {/* 탭 네비게이션 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="hot">인기</TabsTrigger>
                <TabsTrigger value="match">경기</TabsTrigger>
                <TabsTrigger value="transfer">이적</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-0">
                {/* 팬 인증 상태 표시 */}
                {mainTab === 'myteam' && userFanLevel === FanLevel.NONE && (
                  <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-bold text-lg">Chelsea 팬 인증이 필요합니다</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              팬 인증 후 글쓰기와 댓글 기능을 사용할 수 있습니다
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            간단 인증 (Level 1)
                          </Button>
                          <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                            정식 팬 인증 (Level 2)
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {mainTab === 'matchday' && liveMatches.length > 0 && (
                  <Card className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-600" />
                            실시간 매치 스레드 활성화!
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {liveMatches.length}개의 경기가 진행 중입니다. 실시간으로 함께 응원해요!
                          </p>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <MessagesSquare className="h-4 w-4 mr-2" />
                          라이브 채팅 참여
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 주요 CTA 섹션 */}
                {posts.length === 0 && (
                  <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold mb-2">커뮤니티에 참여하세요!</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            첫 게시글을 작성하고 다른 팬들과 소통을 시작해보세요.
                          </p>
                        </div>
                        <Button 
                          onClick={() => router.push('/community/boards/all/write')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          글쓰기
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <article key={post.id} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all hover-scale">
                      {/* 인스타그램 스타일 카드 */}
                      <div className="p-4">
                        {/* 헤더 - 프로필 & 더보기 */}
                        <div className="flex items-center justify-between mb-3">
                          <Link href={`/profile/${post.author?.id}`} className="flex items-center gap-3 group">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-full p-0.5 group-hover:scale-110 transition-transform">
                                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full p-0.5">
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {post.author?.nickname?.charAt(0) || 'U'}
                                  </div>
                                </div>
                              </div>
                              {/* 온라인 상태 표시 */}
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm dark:text-white">
                                {post.author?.nickname || '익명'}
                                {post.author?.favoriteTeamId && (
                                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                    ⚽ Team {post.author.favoriteTeamId}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(post.createdAt), { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}
                                {post.boardId && post.boardId.startsWith('team_') && ' · 팀 게시판'}
                              </p>
                            </div>
                          </Link>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>

                        {/* 콘텐츠 */}
                        <Link href={`/community/posts/${post.id}`}>
                          <div className="space-y-3">
                            {/* 이미지가 있다면 표시 */}
                            {post.imageUrls && post.imageUrls.length > 0 && (
                              <div className="relative -mx-4 aspect-square max-h-[500px] bg-gray-100 dark:bg-gray-800">
                                <img 
                                  src={post.imageUrls[0]} 
                                  alt="Post image"
                                  className="w-full h-full object-cover"
                                />
                                {post.imageUrls.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                                    +{post.imageUrls.length - 1}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* 텍스트 콘텐츠 */}
                            <div>
                              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                {post.content.length > 200 
                                  ? `${post.content.substring(0, 200)}...` 
                                  : post.content}
                              </p>
                              {post.content.length > 200 && (
                                <button className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                  더 보기
                                </button>
                              )}
                            </div>

                            {/* 해시태그 */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, idx) => (
                                  <Link 
                                    key={idx}
                                    href={`/community/tags/${tag}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                  >
                                    #{tag}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* 액션 버튼 - 인스타그램 스타일 */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <button className="group flex items-center gap-1.5 transition-transform hover:scale-110">
                                <Heart className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:text-red-500 transition-colors" />
                                <span className="text-sm font-semibold dark:text-gray-300">
                                  {post.likeCount > 0 && post.likeCount}
                                </span>
                              </button>
                              <button className="group flex items-center gap-1.5 transition-transform hover:scale-110">
                                <MessageSquare className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors" />
                                <span className="text-sm font-semibold dark:text-gray-300">
                                  {post.commentCount > 0 && post.commentCount}
                                </span>
                              </button>
                              <button className="group transition-transform hover:scale-110">
                                <Send className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors -rotate-12" />
                              </button>
                            </div>
                            <button className="group transition-transform hover:scale-110">
                              <Bookmark className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:text-yellow-500 transition-colors" />
                            </button>
                          </div>
                          
                          {/* 좋아요 & 조회수 정보 */}
                          {(post.likeCount > 0 || post.viewCount > 0) && (
                            <div className="mt-3 text-sm">
                              {post.likeCount > 0 && (
                                <p className="font-semibold dark:text-white">
                                  좋아요 {post.likeCount.toLocaleString()}개
                                </p>
                              )}
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                조회 {post.viewCount.toLocaleString()}회
                              </p>
                            </div>
                          )}
                          
                          {/* 댓글 미리보기 */}
                          {post.commentCount > 0 && (
                            <Link 
                              href={`/community/posts/${post.id}`}
                              className="text-gray-500 dark:text-gray-400 text-sm mt-2 block hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              댓글 {post.commentCount}개 모두 보기
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">아직 게시글이 없습니다</p>
                      <Button className="mt-4" onClick={() => router.push('/community/boards/all/write')}>
                        첫 게시글 작성하기
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="hot" className="space-y-4">
                {popularPosts.map((post, idx) => (
                  <Card key={post.id} className="hover:shadow-xl transition-all hover-scale cursor-pointer relative overflow-hidden border-2 hover:border-blue-200 dark:hover:border-blue-800">
                    {idx === 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                          <Crown className="h-3 w-3 mr-1" />
                          BEST
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <Link href={`/community/posts/${post.id}`}>
                        <div className="space-y-3">
                          <h3 className="text-lg font-bold hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-red-500" />
                              {post.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {post.commentCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.viewCount}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="match" className="space-y-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">경기 관련 게시글이 준비 중입니다</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">이적 관련 게시글이 준비 중입니다</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 우측 사이드바 - 실시간 정보 & 활동 스트림 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 실시간 활동 스트림 */}
            <Card className="border-purple-200 dark:border-purple-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  </div>
                  실시간 활동
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 실시간 댓글 */}
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">김민수</span>님이 
                        <span className="text-blue-600 dark:text-blue-400"> "손흥민 2골 폭발!"</span>에 댓글
                      </p>
                      <p className="text-xs text-gray-500 mt-1">방금 전</p>
                    </div>
                  </div>
                </div>
                
                {/* 새 게시글 */}
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-2">
                    <Plus className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">박지성팬</span>님이 새 글 작성
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        "첼시 vs 맨유 프리뷰"
                      </p>
                      <p className="text-xs text-gray-500 mt-1">2분 전</p>
                    </div>
                  </div>
                </div>
                
                {/* 좋아요 활동 */}
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">레알팬123</span>님 외 24명이 좋아요
                      </p>
                      <p className="text-xs text-gray-500 mt-1">5분 전</p>
                    </div>
                  </div>
                </div>
                
                {/* 팀 게시판 활동 */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">Chelsea</span> 게시판이 활발해요
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        15개의 새 게시글
                      </p>
                      <p className="text-xs text-gray-500 mt-1">10분 전</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 실시간 경기 */}
            {liveMatches.length > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="relative">
                      <Activity className="h-5 w-5 text-red-500" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    LIVE 경기
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {liveMatches.slice(0, 3).map((match) => (
                    <Link
                      key={match.fixture.id}
                      href={`/fixtures/${match.fixture.id}`}
                      className="block p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Image
                            src={match.teams.home.logo}
                            alt={match.teams.home.name}
                            width={20}
                            height={20}
                          />
                          <span className="font-medium">{match.teams.home.name}</span>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {match.goals.home} - {match.goals.away}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{match.teams.away.name}</span>
                          <Image
                            src={match.teams.away.logo}
                            alt={match.teams.away.name}
                            width={20}
                            height={20}
                          />
                        </div>
                      </div>
                      <div className="text-center text-xs text-gray-500 mt-2">
                        {match.fixture.status.elapsed}'
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 트렌딩 해시태그 */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5 text-purple-500" />
                  트렌딩 태그
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTags.map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                      <span className="font-medium">{item.tag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{item.count.toLocaleString()}</span>
                      {item.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* 인기 팀 랭킹 */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  팀 커뮤니티 랭킹
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {popularTeams.map((team, idx) => (
                  <Link
                    key={team.id}
                    href={`/community/boards/team_${team.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      idx === 0 && "bg-yellow-500",
                      idx === 1 && "bg-gray-400",
                      idx === 2 && "bg-orange-600",
                      idx > 2 && "bg-gray-600"
                    )}>
                      {idx + 1}
                    </div>
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-medium flex-1">{team.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{team.memberCount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">members</div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* 공지사항 */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  공지사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  🎉 새로운 팀 게시판이 오픈되었습니다!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  📱 모바일 앱이 곧 출시됩니다!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 플로팅 액션 버튼 - 모바일 */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => router.push('/community/boards/all/write')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}