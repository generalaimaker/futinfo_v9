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
  MoreHorizontal, Send, Repeat2, Globe
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
  // Premier League
  { id: 49, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png', memberCount: 2345, color: 'from-blue-600 to-blue-800' },
  { id: 33, name: 'Man United', logo: 'https://media.api-sports.io/football/teams/33.png', memberCount: 3456, color: 'from-red-600 to-red-800' },
  { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', memberCount: 3211, color: 'from-red-500 to-red-700' },
  { id: 50, name: 'Man City', logo: 'https://media.api-sports.io/football/teams/50.png', memberCount: 2987, color: 'from-sky-500 to-sky-700' },
  { id: 42, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', memberCount: 2765, color: 'from-red-600 to-red-800' },
  { id: 47, name: 'Tottenham', logo: 'https://media.api-sports.io/football/teams/47.png', memberCount: 1987, color: 'from-gray-100 to-blue-900' },
  { id: 34, name: 'Newcastle', logo: 'https://media.api-sports.io/football/teams/34.png', memberCount: 1654, color: 'from-gray-900 to-gray-700' },
  { id: 51, name: 'Brighton', logo: 'https://media.api-sports.io/football/teams/51.png', memberCount: 987, color: 'from-blue-600 to-white' },
  { id: 39, name: 'Wolves', logo: 'https://media.api-sports.io/football/teams/39.png', memberCount: 876, color: 'from-yellow-600 to-gray-900' },
  { id: 48, name: 'West Ham', logo: 'https://media.api-sports.io/football/teams/48.png', memberCount: 1543, color: 'from-red-800 to-blue-900' },
  
  // La Liga
  { id: 541, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', memberCount: 4567, color: 'from-purple-600 to-indigo-700' },
  { id: 529, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', memberCount: 4321, color: 'from-blue-800 to-red-700' },
  { id: 530, name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png', memberCount: 2123, color: 'from-red-600 to-white' },
  { id: 532, name: 'Valencia', logo: 'https://media.api-sports.io/football/teams/532.png', memberCount: 1234, color: 'from-orange-600 to-black' },
  { id: 533, name: 'Villarreal', logo: 'https://media.api-sports.io/football/teams/533.png', memberCount: 987, color: 'from-yellow-500 to-yellow-700' },
  { id: 531, name: 'Athletic Bilbao', logo: 'https://media.api-sports.io/football/teams/531.png', memberCount: 1123, color: 'from-red-600 to-white' },
  { id: 543, name: 'Real Betis', logo: 'https://media.api-sports.io/football/teams/543.png', memberCount: 876, color: 'from-green-600 to-white' },
  { id: 536, name: 'Sevilla', logo: 'https://media.api-sports.io/football/teams/536.png', memberCount: 1456, color: 'from-red-600 to-white' },
  { id: 548, name: 'Real Sociedad', logo: 'https://media.api-sports.io/football/teams/548.png', memberCount: 765, color: 'from-blue-600 to-white' },
  { id: 727, name: 'Osasuna', logo: 'https://media.api-sports.io/football/teams/727.png', memberCount: 543, color: 'from-red-600 to-blue-900' },
  
  // Bundesliga
  { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', memberCount: 2890, color: 'from-red-600 to-gray-800' },
  { id: 165, name: 'Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png', memberCount: 2345, color: 'from-yellow-500 to-black' },
  { id: 173, name: 'RB Leipzig', logo: 'https://media.api-sports.io/football/teams/173.png', memberCount: 1234, color: 'from-red-600 to-white' },
  { id: 168, name: 'Leverkusen', logo: 'https://media.api-sports.io/football/teams/168.png', memberCount: 987, color: 'from-red-600 to-black' },
  { id: 161, name: 'Wolfsburg', logo: 'https://media.api-sports.io/football/teams/161.png', memberCount: 765, color: 'from-green-600 to-white' },
  { id: 163, name: 'Frankfurt', logo: 'https://media.api-sports.io/football/teams/163.png', memberCount: 876, color: 'from-red-600 to-black' },
  { id: 160, name: 'SC Freiburg', logo: 'https://media.api-sports.io/football/teams/160.png', memberCount: 654, color: 'from-red-600 to-white' },
  { id: 159, name: 'Hertha', logo: 'https://media.api-sports.io/football/teams/159.png', memberCount: 543, color: 'from-blue-600 to-white' },
  { id: 162, name: 'Union Berlin', logo: 'https://media.api-sports.io/football/teams/162.png', memberCount: 432, color: 'from-red-600 to-yellow-500' },
  { id: 172, name: 'Stuttgart', logo: 'https://media.api-sports.io/football/teams/172.png', memberCount: 567, color: 'from-white to-red-600' },
  
  // Serie A
  { id: 489, name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png', memberCount: 2456, color: 'from-red-600 to-black' },
  { id: 505, name: 'Inter', logo: 'https://media.api-sports.io/football/teams/505.png', memberCount: 2345, color: 'from-blue-600 to-black' },
  { id: 496, name: 'Juventus', logo: 'https://media.api-sports.io/football/teams/496.png', memberCount: 3456, color: 'from-black to-white' },
  { id: 492, name: 'Napoli', logo: 'https://media.api-sports.io/football/teams/492.png', memberCount: 1876, color: 'from-blue-600 to-white' },
  { id: 497, name: 'Roma', logo: 'https://media.api-sports.io/football/teams/497.png', memberCount: 1765, color: 'from-red-800 to-yellow-600' },
  { id: 487, name: 'Lazio', logo: 'https://media.api-sports.io/football/teams/487.png', memberCount: 1234, color: 'from-sky-400 to-white' },
  { id: 499, name: 'Atalanta', logo: 'https://media.api-sports.io/football/teams/499.png', memberCount: 987, color: 'from-blue-600 to-black' },
  { id: 502, name: 'Fiorentina', logo: 'https://media.api-sports.io/football/teams/502.png', memberCount: 876, color: 'from-purple-600 to-white' },
  { id: 503, name: 'Torino', logo: 'https://media.api-sports.io/football/teams/503.png', memberCount: 654, color: 'from-red-800 to-white' },
  { id: 488, name: 'Sassuolo', logo: 'https://media.api-sports.io/football/teams/488.png', memberCount: 432, color: 'from-green-600 to-black' },
  
  // Ligue 1
  { id: 85, name: 'PSG', logo: 'https://media.api-sports.io/football/teams/85.png', memberCount: 3456, color: 'from-blue-900 to-red-600' },
  { id: 91, name: 'Monaco', logo: 'https://media.api-sports.io/football/teams/91.png', memberCount: 1234, color: 'from-red-600 to-white' },
  { id: 81, name: 'Marseille', logo: 'https://media.api-sports.io/football/teams/81.png', memberCount: 1876, color: 'from-sky-400 to-white' },
  { id: 84, name: 'Nice', logo: 'https://media.api-sports.io/football/teams/84.png', memberCount: 876, color: 'from-red-600 to-black' },
  { id: 80, name: 'Lyon', logo: 'https://media.api-sports.io/football/teams/80.png', memberCount: 1543, color: 'from-blue-600 to-red-600' },
  { id: 79, name: 'Lille', logo: 'https://media.api-sports.io/football/teams/79.png', memberCount: 987, color: 'from-red-600 to-white' },
  { id: 94, name: 'Rennes', logo: 'https://media.api-sports.io/football/teams/94.png', memberCount: 765, color: 'from-red-600 to-black' },
  { id: 83, name: 'Nantes', logo: 'https://media.api-sports.io/football/teams/83.png', memberCount: 543, color: 'from-yellow-500 to-green-600' },
  { id: 82, name: 'Montpellier', logo: 'https://media.api-sports.io/football/teams/82.png', memberCount: 432, color: 'from-blue-900 to-orange-600' },
  { id: 93, name: 'Reims', logo: 'https://media.api-sports.io/football/teams/93.png', memberCount: 321, color: 'from-red-600 to-white' },
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
  const [mainTab, setMainTab] = useState<'all' | 'myteam' | 'matchday'>('all')
  const [userFanLevel, setUserFanLevel] = useState<FanLevel>(FanLevel.NONE)
  const [userTeamId, setUserTeamId] = useState<number | null>(49) // 기본값 Chelsea
  const [rivalTeamId, setRivalTeamId] = useState<number | null>(47) // Tottenham as default rival
  const [currentMatch, setCurrentMatch] = useState<any>(null)
  const [upcomingMatch, setUpcomingMatch] = useState<any>(null)
  const [matchdayPosts, setMatchdayPosts] = useState<CommunityPost[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [matchdayTab, setMatchdayTab] = useState<'match' | 'board' | 'chat'>('match')
  const [isMatchdayLoading, setIsMatchdayLoading] = useState(true)
  
  useEffect(() => {
    loadCommunityData()
    loadLiveMatches()
    // 매치데이 데이터 미리 로드
    if (userTeamId) {
      setIsMatchdayLoading(true)
      loadMatchdayData().finally(() => setIsMatchdayLoading(false))
    }
  }, [])

  const loadCommunityData = async (boardId?: string) => {
    try {
      setIsLoading(true)
      
      // 인기 게시글 가져오기 (첫 로드시만)
      if (!boardId) {
        const popular = await CommunityService.getPopularPosts({ limit: 5 })
        setPopularPosts(popular)
      }
      
      // 해당 게시판의 게시글 가져오기
      const targetBoardId = boardId || (mainTab === 'myteam' ? `team_${userTeamId}` : 'all')
      const postsResponse = await CommunityService.getPosts(targetBoardId)
      setPosts(postsResponse.data)
      
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

  const loadMatchdayData = async () => {
    // 로딩 상태를 유지하면서 데이터 로드
    try {
      const service = new FootballAPIService()
      const today = new Date().toISOString().split('T')[0]
      
      // 오늘 경기 확인
      const todayFixtures = await service.getFixtures({
        date: today,
        team: userTeamId || 49
      })

      let matchFound = false
      
      if (todayFixtures?.response?.length > 0) {
        const match = todayFixtures.response[0]
        if (['LIVE', '1H', '2H', 'HT'].includes(match.fixture.status.short)) {
          setCurrentMatch(match)
          setUpcomingMatch(null)
          matchFound = true
        } else if (['NS', 'TBD'].includes(match.fixture.status.short)) {
          setUpcomingMatch(match)
          setCurrentMatch(null)
          matchFound = true
        }
      }
      
      if (!matchFound) {
        // 다음 경기 확인
        const nextFixtures = await service.getFixtures({
          team: userTeamId || 49,
          next: 1
        })
        if (nextFixtures?.response?.length > 0) {
          setUpcomingMatch(nextFixtures.response[0])
          setCurrentMatch(null)
        }
      }

      // 매치데이 게시글 가져오기
      const response = await CommunityService.getPosts('all')
      const matchdayFiltered = response.data.filter(post => 
        post.category === 'matchday' || 
        post.tags?.includes('매치데이') ||
        post.tags?.includes('라이브')
      )
      setMatchdayPosts(matchdayFiltered)
    } catch (error) {
      console.error('Error loading matchday data:', error)
    } finally {
      // 로딩 상태는 별도로 관리
      setTimeout(() => setIsLoading(false), 300) // 최소 로딩 시간 보장
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
                onClick={() => {
                  setMainTab('all')
                  loadCommunityData('all')
                }}
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
                onClick={() => {
                  setMainTab('myteam')
                  loadCommunityData(`team_${userTeamId}`)
                }}
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
                onClick={() => {
                  setMainTab('matchday')
                  if (!currentMatch && !upcomingMatch) {
                    setIsMatchdayLoading(true)
                    loadMatchdayData().finally(() => setIsMatchdayLoading(false))
                  }
                }}
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

      {mainTab === 'matchday' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                ⚽ 매치데이
              </h1>
              <p className="text-sm text-white/80">
                경기와 함께하는 실시간 소통
              </p>
            </div>
          </div>
        </div>
      )}
            

      {/* 3단 레이아웃 - 매치데이가 아닐 때만 표시 */}
      {mainTab !== 'matchday' ? (
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

            {/* 팀 라커룸 */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  팀 라커룸
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
                      <span className="text-xl">🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
                      <span className="font-medium">Premier League</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      selectedLeague === 39 ? "rotate-90" : ""
                    )} />
                  </button>
                  {selectedLeague === 39 && (
                    <div className="p-2 space-y-1 border-t">
                      {[49, 33, 40, 50, 42, 47, 34, 51, 39, 48].map(teamId => {
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
                      {[541, 529, 530, 532, 533, 531, 543, 536, 548, 727].map(teamId => {
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
                      {[157, 165, 173, 168, 161, 163, 160, 159, 162, 172].map(teamId => {
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

                {/* Serie A */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedLeague(selectedLeague === 135 ? null : 135)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇮🇹</span>
                      <span className="font-medium">Serie A</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      selectedLeague === 135 ? "rotate-90" : ""
                    )} />
                  </button>
                  {selectedLeague === 135 && (
                    <div className="p-2 space-y-1 border-t">
                      {[489, 505, 496, 492, 497, 487, 499, 502, 503, 488].map(teamId => {
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

                {/* Ligue 1 */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedLeague(selectedLeague === 61 ? null : 61)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇫🇷</span>
                      <span className="font-medium">Ligue 1</span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      selectedLeague === 61 ? "rotate-90" : ""
                    )} />
                  </button>
                  {selectedLeague === 61 && (
                    <div className="p-2 space-y-1 border-t">
                      {[85, 91, 81, 84, 80, 79, 94, 83, 82, 93].map(teamId => {
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

            {/* 빠른 시작 */}
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
                  size="sm"
                  onClick={() => router.push(`/community/boards/${mainTab === 'myteam' ? `team_${userTeamId}` : 'all'}/write`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 글 작성
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMainTab('matchday')
                    loadMatchdayData()
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  매치데이
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/fixtures')}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  경기 일정
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
                
                {liveMatches.length > 0 && (
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
                          <div className="flex items-center gap-3 group cursor-pointer">
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
                          </div>
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
                                  <span 
                                    key={idx}
                                    className="text-blue-600 dark:text-blue-400 text-sm cursor-pointer hover:underline"
                                  >
                                    #{tag}
                                  </span>
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
      ) : (
        /* 매치데이 콘텐츠 */
        <MatchdayContent 
          currentMatch={currentMatch || upcomingMatch}
          matchdayPosts={matchdayPosts}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          matchdayTab={matchdayTab}
          setMatchdayTab={setMatchdayTab}
          userTeamId={userTeamId || 49}
          user={user}
          router={router}
          isLoading={isMatchdayLoading}
          setMainTab={setMainTab}
        />
      )}

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

// 매치데이 콘텐츠 컴포넌트
function MatchdayContent({ 
  currentMatch, 
  matchdayPosts, 
  chatMessages, 
  setChatMessages, 
  matchdayTab, 
  setMatchdayTab, 
  userTeamId, 
  user, 
  router,
  isLoading,
  setMainTab 
}: any) {
  const [newMessage, setNewMessage] = useState('')
  const [h2hData, setH2hData] = useState<any[]>([])
  const [lineups, setLineups] = useState<any>(null)
  const [isLoadingH2H, setIsLoadingH2H] = useState(false)
  
  const isLive = currentMatch && ['LIVE', '1H', '2H', 'HT'].includes(currentMatch.fixture?.status?.short)
  const isHome = currentMatch?.teams?.home?.id === userTeamId
  
  // 상대전적 데이터 로드
  useEffect(() => {
    if (currentMatch && !isLive) {
      loadH2HData()
    }
  }, [currentMatch])
  
  const loadH2HData = async () => {
    try {
      setIsLoadingH2H(true)
      const service = new FootballAPIService()
      // H2H API가 없으면 샘플 데이터 사용
      // const h2h = await service.getH2H({
      //   h2h: `${currentMatch.teams.home.id}-${currentMatch.teams.away.id}`
      // })
      // if (h2h?.response) {
      //   setH2hData(h2h.response.slice(0, 5))
      // }
      
      // 샘플 H2H 데이터
      setH2hData([
        {
          fixture: { date: '2024-01-15' },
          teams: { home: currentMatch.teams.home, away: currentMatch.teams.away },
          goals: { home: 2, away: 1 }
        },
        {
          fixture: { date: '2023-09-23' },
          teams: { home: currentMatch.teams.away, away: currentMatch.teams.home },
          goals: { home: 0, away: 0 }
        },
        {
          fixture: { date: '2023-04-10' },
          teams: { home: currentMatch.teams.home, away: currentMatch.teams.away },
          goals: { home: 1, away: 2 }
        }
      ])
    } catch (error) {
      console.error('Error loading H2H:', error)
    } finally {
      setIsLoadingH2H(false)
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
  }

  // 로딩 중일 때 스켈레톤 UI
  if (isLoading || (isLoadingH2H && !currentMatch)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6">
          {/* 스켈레톤 메인 카드 */}
          <Card className="mb-6 overflow-hidden shadow-2xl border-0">
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse">
              <div className="relative p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex flex-col items-center p-6">
                    <div className="h-6 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                    <div className="h-12 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-3" />
                    <div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
                    <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded mx-auto" />
                  </div>
                  <div className="text-center">
                    <div className="h-10 w-16 bg-gray-300 dark:bg-gray-600 rounded mx-auto" />
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
                    <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <div className="text-center">
            <p className="text-gray-500">경기 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl">
            <CardContent className="py-16 text-center">
              <div className="mb-6">
                <Trophy className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">현재 예정된 경기가 없습니다</h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  다음 경기 일정을 확인해보세요
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => router.push('/fixtures')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  경기 일정 보기
                </Button>
                <Button 
                  onClick={() => setMainTab('all')}
                  variant="outline"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  전체 게시판으로
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* 경기 정보 메인 카드 */}
        <Card className="mb-6 overflow-hidden shadow-2xl border-0">
          <div className={cn(
            "relative overflow-hidden",
            isLive 
              ? "bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700"
              : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
          )}>
            {/* 배경 패턴 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full" />
            </div>
            
            {/* 콘텐츠 */}
            <div className="relative p-8">
              {/* 리그 및 경기장 정보 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="text-white font-medium text-sm">
                      {currentMatch.league.name}
                    </span>
                  </div>
                  {currentMatch.league.round && (
                    <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                      <span className="text-white/90 text-xs">
                        {currentMatch.league.round}
                      </span>
                    </div>
                  )}
                </div>
                {currentMatch.fixture.venue?.name && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm">{currentMatch.fixture.venue.name}</span>
                  </div>
                )}
              </div>

              {/* 경기 시간 정보 - 크고 명확하게 */}
              {!isLive ? (
                <div className="text-center mb-8">
                  <div className="inline-flex flex-col items-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                    <p className="text-white/90 text-sm font-medium mb-2">
                      {new Date(currentMatch.fixture.date).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </p>
                    <p className="text-5xl font-bold text-white mb-3">
                      {new Date(currentMatch.fixture.date).toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-white/80" />
                      <span className="text-white/90 text-sm">
                        킥오프까지 {Math.floor((new Date(currentMatch.fixture.date).getTime() - Date.now()) / (1000 * 60 * 60))}시간 {Math.floor(((new Date(currentMatch.fixture.date).getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60))}분
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <Badge className="bg-red-500 text-white px-4 py-2 text-lg animate-pulse">
                    <Activity className="h-5 w-5 mr-2 inline" />
                    LIVE {currentMatch.fixture.status.elapsed}'
                  </Badge>
                </div>
              )}

              {/* 팀 정보 - 크고 시각적으로 */}
              <div className="grid grid-cols-3 items-center gap-8">
                {/* 홈팀 */}
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                    <Image
                      src={currentMatch.teams.home.logo}
                      alt={currentMatch.teams.home.name}
                      width={100}
                      height={100}
                      className="relative bg-white rounded-full p-3 shadow-xl"
                    />
                    {isHome && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <Badge className="bg-yellow-400 text-black font-bold px-3 py-1">
                          ⭐ OUR TEAM
                        </Badge>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {currentMatch.teams.home.name}
                  </h3>
                  <p className="text-white/70 text-sm">HOME</p>
                </div>

                {/* 스코어 / VS */}
                <div className="text-center">
                  {isLive ? (
                    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-5xl font-bold text-white">
                        {currentMatch.goals?.home || 0}
                        <span className="mx-3 text-white/50">:</span>
                        {currentMatch.goals?.away || 0}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="text-4xl font-bold text-white/90">VS</div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                          ⚽ 경기 예정
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 어웨이팀 */}
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                    <Image
                      src={currentMatch.teams.away.logo}
                      alt={currentMatch.teams.away.name}
                      width={100}
                      height={100}
                      className="relative bg-white rounded-full p-3 shadow-xl"
                    />
                    {!isHome && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <Badge className="bg-yellow-400 text-black font-bold px-3 py-1">
                          ⭐ OUR TEAM
                        </Badge>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {currentMatch.teams.away.name}
                  </h3>
                  <p className="text-white/70 text-sm">AWAY</p>
                </div>
              </div>

              {/* 경기 이벤트 (LIVE일 때) */}
              {isLive && currentMatch.events && currentMatch.events.length > 0 && (
                <div className="mt-6 p-4 bg-black/20 backdrop-blur-sm rounded-xl">
                  <p className="text-white/90 text-sm font-semibold mb-3">🔥 주요 이벤트</p>
                  <div className="space-y-2">
                    {currentMatch.events.slice(-3).map((event: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 text-white/80">
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          {event.time.elapsed}'
                        </span>
                        <span className="text-sm">
                          {event.type === 'Goal' && '⚽'}
                          {event.type === 'Card' && '📋'}
                          {event.player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

      {/* 매치데이 탭 */}
      <Tabs value={matchdayTab} onValueChange={(v) => setMatchdayTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="match">경기 정보</TabsTrigger>
          <TabsTrigger value="board">
            실시간 게시판
            {matchdayPosts.length > 0 && (
              <Badge className="ml-2" variant="secondary">{matchdayPosts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat">
            라이브 채팅
            {chatMessages.length > 0 && (
              <Badge className="ml-2" variant="secondary">{chatMessages.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* 예상 라인업 */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  예상 라인업
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {!isLive ? (
                  <div className="space-y-4">
                    {/* 홈팀 */}
                    <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Image
                          src={currentMatch.teams.home.logo}
                          alt={currentMatch.teams.home.name}
                          width={24}
                          height={24}
                        />
                        <p className="font-semibold">{currentMatch.teams.home.name}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">4-3-3</span>
                          <Badge variant="outline" className="text-xs">
                            포메이션
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• 공격적인 전술 예상</p>
                          <p>• 측면 공격 중심</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        🕒 경기 1시간 전 공개
                      </p>
                    </div>
                    
                    {/* 어웨이팀 */}
                    <div className="border rounded-lg p-3 bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Image
                          src={currentMatch.teams.away.logo}
                          alt={currentMatch.teams.away.name}
                          width={24}
                          height={24}
                        />
                        <p className="font-semibold">{currentMatch.teams.away.name}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-red-600 dark:text-red-400">4-2-3-1</span>
                          <Badge variant="outline" className="text-xs">
                            포메이션
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• 수비 중심 전술</p>
                          <p>• 역습 위주 전략</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        🕒 경기 1시간 전 공개
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">라인업 정보를 불러오는 중...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 최근 맞대결 */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  상대 전적 (H2H)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingH2H ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
                    <p className="text-gray-500">맞대결 기록을 불러오는 중...</p>
                  </div>
                ) : h2hData.length > 0 ? (
                  <div className="space-y-2">
                    {h2hData.map((match: any, idx: number) => {
                      const homeWin = match.goals.home > match.goals.away
                      const awayWin = match.goals.away > match.goals.home
                      const draw = match.goals.home === match.goals.away
                      
                      return (
                        <div key={idx} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {new Date(match.fixture.date).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={match.teams.home.logo}
                                  alt={match.teams.home.name}
                                  width={20}
                                  height={20}
                                />
                                <span className={cn(
                                  "text-sm font-medium",
                                  homeWin && "text-green-600 dark:text-green-400"
                                )}>
                                  {match.teams.home.name.substring(0, 3)}
                                </span>
                              </div>
                              
                              <div className={cn(
                                "px-3 py-1 rounded-lg font-bold",
                                draw && "bg-gray-200 dark:bg-gray-600",
                                homeWin && "bg-green-100 dark:bg-green-900",
                                awayWin && "bg-red-100 dark:bg-red-900"
                              )}>
                                {match.goals.home} - {match.goals.away}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-medium",
                                  awayWin && "text-green-600 dark:text-green-400"
                                )}>
                                  {match.teams.away.name.substring(0, 3)}
                                </span>
                                <Image
                                  src={match.teams.away.logo}
                                  alt={match.teams.away.name}
                                  width={20}
                                  height={20}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">상대 전적 데이터가 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 팀 폼 & 통계 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  최근 5경기 폼
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* 홈팀 폼 */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src={currentMatch.teams.home.logo}
                          alt={currentMatch.teams.home.name}
                          width={24}
                          height={24}
                        />
                        <span className="font-medium">{currentMatch.teams.home.name}</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        HOME
                      </Badge>
                    </div>
                    <div className="flex gap-1.5">
                      {['W', 'W', 'D', 'L', 'W'].map((result, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex-1 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm",
                            result === 'W' && "bg-gradient-to-b from-green-400 to-green-500 text-white",
                            result === 'D' && "bg-gradient-to-b from-gray-300 to-gray-400 text-white",
                            result === 'L' && "bg-gradient-to-b from-red-400 to-red-500 text-white"
                          )}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">승률 60%</p>
                  </div>
                  
                  {/* 어웨이팀 폼 */}
                  <div className="p-3 bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src={currentMatch.teams.away.logo}
                          alt={currentMatch.teams.away.name}
                          width={24}
                          height={24}
                        />
                        <span className="font-medium">{currentMatch.teams.away.name}</span>
                      </div>
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                        AWAY
                      </Badge>
                    </div>
                    <div className="flex gap-1.5">
                      {['L', 'W', 'W', 'W', 'D'].map((result, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex-1 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm",
                            result === 'W' && "bg-gradient-to-b from-green-400 to-green-500 text-white",
                            result === 'D' && "bg-gradient-to-b from-gray-300 to-gray-400 text-white",
                            result === 'L' && "bg-gradient-to-b from-red-400 to-red-500 text-white"
                          )}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">승률 60%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  경기 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">⚑</span>
                      </div>
                      <span className="text-sm font-medium">심판</span>
                    </div>
                    <span className="text-sm font-bold">{currentMatch.fixture.referee || 'TBD'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">경기장</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{currentMatch.fixture.venue?.name || 'TBD'}</p>
                      {currentMatch.fixture.venue?.city && (
                        <p className="text-xs text-gray-500">{currentMatch.fixture.venue.city}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">리그</span>
                    </div>
                    <span className="text-sm font-bold">{currentMatch.league.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">R</span>
                      </div>
                      <span className="text-sm font-medium">라운드</span>
                    </div>
                    <span className="text-sm font-bold">{currentMatch.league.round || 'Regular Season'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="board" className="space-y-4">
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

          {matchdayPosts.length > 0 ? (
            matchdayPosts.map((post) => (
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
                chatMessages.map((msg: any) => (
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