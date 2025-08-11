'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Activity, MessageSquare, Users, Trophy, Clock, 
  TrendingUp, Send, Heart, Shield, Sparkles,
  ChevronRight, Bell, Volume2, VolumeX
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSupabase } from '@/lib/supabase/provider'
import { FootballAPIService } from '@/lib/supabase/football'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityPost } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function MatchdayPage() {
  const router = useRouter()
  const { user } = useSupabase()
  const [userTeamId] = useState<number>(49) // Chelsea as default
  const [liveMatch, setLiveMatch] = useState<any>(null)
  const [upcomingMatch, setUpcomingMatch] = useState<any>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState<'match' | 'board' | 'chat'>('match')

  useEffect(() => {
    loadMatchData()
    loadMatchdayPosts()
    // 실시간 구독 설정
    const interval = setInterval(loadMatchData, 30000) // 30초마다 업데이트
    return () => clearInterval(interval)
  }, [userTeamId])

  const loadMatchData = async () => {
    try {
      const service = new FootballAPIService()
      const today = new Date().toISOString().split('T')[0]
      
      // 오늘 경기 확인
      const todayFixtures = await service.getFixtures({
        date: today,
        team: userTeamId
      })

      if (todayFixtures?.response?.length > 0) {
        const match = todayFixtures.response[0]
        if (['LIVE', '1H', '2H', 'HT'].includes(match.fixture.status.short)) {
          setLiveMatch(match)
          setUpcomingMatch(null)
        } else if (['NS', 'TBD'].includes(match.fixture.status.short)) {
          setUpcomingMatch(match)
          setLiveMatch(null)
        }
      } else {
        // 다음 경기 확인
        const nextFixtures = await service.getFixtures({
          team: userTeamId,
          next: 1
        })
        if (nextFixtures?.response?.length > 0) {
          setUpcomingMatch(nextFixtures.response[0])
        }
      }
    } catch (error) {
      console.error('Error loading match data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMatchdayPosts = async () => {
    try {
      // 매치데이 카테고리 게시글 가져오기
      const response = await CommunityService.getPosts('all')
      const matchdayPosts = response.data.filter(post => 
        post.category === 'matchday' || 
        post.tags?.includes('매치데이') ||
        post.tags?.includes('라이브')
      )
      setPosts(matchdayPosts)
    } catch (error) {
      console.error('Error loading matchday posts:', error)
    }
  }

  const sendChatMessage = () => {
    if (!newMessage.trim() || !user) return

    const message = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.email?.split('@')[0] || 'User',
      content: newMessage,
      timestamp: new Date(),
      teamId: userTeamId
    }

    setChatMessages([...chatMessages, message])
    setNewMessage('')
    
    // 사운드 재생
    if (soundEnabled) {
      // 메시지 전송 사운드
    }
  }

  const currentMatch = liveMatch || upcomingMatch

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">매치데이 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">오늘은 경기가 없습니다</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                다음 경기 일정을 확인해보세요
              </p>
              <Button onClick={() => router.push('/fixtures')}>
                경기 일정 보기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isLive = liveMatch !== null
  const isHome = currentMatch.teams.home.id === userTeamId

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* 매치 헤더 */}
      <div className={cn(
        "relative overflow-hidden text-white",
        isLive 
          ? "bg-gradient-to-r from-green-600 via-emerald-600 to-green-700"
          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
      )}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-6">
          {/* 경기 정보 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className={cn(
                "text-white border-white",
                isLive && "bg-red-500 animate-pulse"
              )}>
                {isLive ? (
                  <>
                    <Activity className="h-3 w-3 mr-1" />
                    LIVE {currentMatch.fixture.status.elapsed}'
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(currentMatch.fixture.date).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </>
                )}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-white/20"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>

            {/* 팀 정보 */}
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center">
                <Image
                  src={currentMatch.teams.home.logo}
                  alt={currentMatch.teams.home.name}
                  width={80}
                  height={80}
                  className="mx-auto mb-2"
                />
                <p className={cn(
                  "font-bold",
                  isHome && "text-yellow-300"
                )}>
                  {currentMatch.teams.home.name}
                </p>
                {isHome && <Badge className="mt-1 bg-yellow-500 text-black">우리팀</Badge>}
              </div>

              <div className="text-center">
                {isLive ? (
                  <div className="text-4xl font-bold">
                    {currentMatch.goals.home} - {currentMatch.goals.away}
                  </div>
                ) : (
                  <div className="text-3xl font-bold">VS</div>
                )}
                <p className="text-sm mt-2 text-white/80">
                  {currentMatch.league.name}
                </p>
              </div>

              <div className="text-center">
                <Image
                  src={currentMatch.teams.away.logo}
                  alt={currentMatch.teams.away.name}
                  width={80}
                  height={80}
                  className="mx-auto mb-2"
                />
                <p className={cn(
                  "font-bold",
                  !isHome && "text-yellow-300"
                )}>
                  {currentMatch.teams.away.name}
                </p>
                {!isHome && <Badge className="mt-1 bg-yellow-500 text-black">우리팀</Badge>}
              </div>
            </div>

            {/* 경기 이벤트 (라이브인 경우) */}
            {isLive && currentMatch.events && currentMatch.events.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm font-semibold mb-2">주요 이벤트</p>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {currentMatch.events.slice(-3).map((event: any, idx: number) => (
                    <div key={idx} className="text-xs text-white/80">
                      {event.time.elapsed}' - {event.player.name} ({event.type})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="match">
              <Trophy className="h-4 w-4 mr-2" />
              경기 정보
            </TabsTrigger>
            <TabsTrigger value="board">
              <MessageSquare className="h-4 w-4 mr-2" />
              실시간 게시판
              {posts.length > 0 && (
                <Badge className="ml-2" variant="secondary">{posts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat">
              <Users className="h-4 w-4 mr-2" />
              라이브 채팅
              {chatMessages.length > 0 && (
                <Badge className="ml-2" variant="secondary">{chatMessages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 경기 정보 탭 */}
          <TabsContent value="match" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* 라인업 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">예상 라인업</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    {isLive ? "라인업 정보를 불러오는 중..." : "경기 시작 전 공개됩니다"}
                  </div>
                </CardContent>
              </Card>

              {/* 팀 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">시즌 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">최근 5경기</span>
                      <div className="flex gap-1">
                        {['W', 'W', 'D', 'L', 'W'].map((result, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                              result === 'W' && "bg-green-100 text-green-700",
                              result === 'D' && "bg-gray-100 text-gray-700",
                              result === 'L' && "bg-red-100 text-red-700"
                            )}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 실시간 게시판 탭 */}
          <TabsContent value="board" className="space-y-4">
            {/* 글쓰기 영역 */}
            {user && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="경기 응원 메시지를 남겨주세요..."
                      className="flex-1"
                    />
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 게시글 목록 */}
            {posts.length > 0 ? (
              posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {post.author?.nickname?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{post.author?.nickname || '익명'}</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                            <Heart className="h-4 w-4" />
                            {post.likeCount > 0 && post.likeCount}
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500">
                            <MessageSquare className="h-4 w-4" />
                            {post.commentCount > 0 && post.commentCount}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">첫 번째 응원 메시지를 남겨주세요!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 라이브 채팅 탭 */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    실시간 채팅
                    <Badge variant="secondary">{chatMessages.length}명 참여중</Badge>
                  </CardTitle>
                  <Badge className="bg-green-500">
                    <Activity className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {msg.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{msg.userName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(msg.timestamp), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{msg.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">채팅을 시작해보세요!</p>
                  </div>
                )}
              </CardContent>

              {/* 채팅 입력 */}
              <div className="border-t p-4">
                {user ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="메시지를 입력하세요..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendChatMessage}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">채팅 참여는 로그인이 필요합니다</p>
                    <Button onClick={() => router.push('/auth/login')} size="sm">
                      로그인
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}