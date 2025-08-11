'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, MessageSquare, TrendingUp, Crown, Shield, Heart,
  ArrowRight, Sparkles, Trophy, Zap, Star, Flame, Clock,
  ChevronRight, BarChart3, Hash, Plus, Search, Filter,
  Eye, ThumbsUp, Bookmark, Share2, MessagesSquare, Activity
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
      {/* Hero Section - 개선된 디자인 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 animate-fade-in">
                FutInfo 커뮤니티
              </h1>
              <p className="text-xl text-white/90 mb-6">
                전 세계 축구 팬들과 함께 열정을 나누세요
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => router.push('/community/boards/all/write')}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  글쓰기
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-white border-white hover:bg-white/10"
                >
                  <Search className="mr-2 h-5 w-5" />
                  토론 검색
                </Button>
              </div>
            </div>
            
            {/* 오늘의 HOT 토픽 */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white lg:w-96">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <CardTitle className="text-lg">오늘의 HOT 토픽</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                  <p className="font-semibold mb-1">손흥민 2골 폭발!</p>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> 12.3K
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> 342
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                  <p className="font-semibold mb-1">첼시 vs 맨유 빅매치 프리뷰</p>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> 8.7K
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> 256
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 3단 레이아웃 */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 좌측 사이드바 - 리그/팀 필터 */}
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

            {/* 인기 리그 */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  인기 리그
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {popularLeagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeague(league.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                      selectedLeague === league.id 
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="text-xl">{league.icon}</span>
                    <span className="font-medium">{league.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* 인기 팀 게시판 */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  팀 게시판
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {popularTeams.slice(0, 5).map((team) => (
                  <Link
                    key={team.id}
                    href={`/community/boards/team_${team.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className="font-medium flex-1">{team.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {team.memberCount.toLocaleString()}
                    </Badge>
                  </Link>
                ))}
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

              <TabsContent value="all" className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <Link href={`/community/posts/${post.id}`}>
                          <div className="space-y-4">
                            {/* 작성자 정보 */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {post.author?.nickname?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{post.author?.nickname || '익명'}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(post.createdAt), { 
                                    addSuffix: true, 
                                    locale: ko 
                                  })}
                                </p>
                              </div>
                              {post.category && (
                                <Badge variant="outline">{post.category}</Badge>
                              )}
                            </div>

                            {/* 게시글 내용 */}
                            <div>
                              <h3 className="text-xl font-bold mb-2 hover:text-blue-600 transition-colors">
                                {post.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                                {post.content}
                              </p>
                            </div>

                            {/* 태그 */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* 상호작용 바 */}
                            <div className="flex items-center gap-6 pt-3 border-t">
                              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-sm">{post.likeCount}</span>
                              </button>
                              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-sm">{post.commentCount}</span>
                              </button>
                              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                                <Eye className="h-4 w-4" />
                                <span className="text-sm">{post.viewCount}</span>
                              </button>
                              <div className="flex-1" />
                              <button className="text-gray-500 hover:text-blue-600 transition-colors">
                                <Bookmark className="h-4 w-4" />
                              </button>
                              <button className="text-gray-500 hover:text-blue-600 transition-colors">
                                <Share2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
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
                  <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden">
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

          {/* 우측 사이드바 - 실시간 정보 */}
          <div className="lg:col-span-3 space-y-6">
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