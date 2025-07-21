'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, MessageSquare, Plus, Users, Calendar, 
  Heart, MessageCircle, Eye, Loader2, Trophy,
  MapPin, Shield, TrendingUp, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommunityService } from '@/lib/supabase/community'
import { CommunityBoard, CommunityPost } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useSupabase } from '@/lib/supabase/provider'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useTeamProfile, useTeamStatistics, useTeamNextFixtures, useTeamLastFixtures } from '@/lib/supabase/football'
import { getCurrentSeason } from '@/lib/types/football'

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
  
  // 팀 정보 관련 상태
  const isTeamBoard = boardId.startsWith('team_')
  const teamId = isTeamBoard ? parseInt(boardId.replace('team_', '')) : null
  
  // 팀 기본 정보 맵핑 (API 로드 전 fallback)
  const getTeamBasicInfo = (teamId: number) => {
    const teamMap: { [key: number]: { name: string; country: string; founded: number; slogan: string; shortSlogan: string } } = {
      // Premier League
      33: { name: 'Manchester United', country: 'England', founded: 1878, slogan: 'Glory Glory Man United', shortSlogan: 'Red Devils' },
      40: { name: 'Liverpool', country: 'England', founded: 1892, slogan: "You'll Never Walk Alone", shortSlogan: 'YNWA' },
      50: { name: 'Manchester City', country: 'England', founded: 1880, slogan: 'Pride in Battle', shortSlogan: 'Citizens' },
      42: { name: 'Arsenal', country: 'England', founded: 1886, slogan: 'Victoria Concordia Crescit', shortSlogan: 'The Gunners' },
      47: { name: 'Tottenham', country: 'England', founded: 1882, slogan: 'To Dare Is To Do', shortSlogan: 'COYS' },
      49: { name: 'Chelsea', country: 'England', founded: 1905, slogan: 'Pride of London', shortSlogan: 'The Blues' },
      35: { name: 'Leicester City', country: 'England', founded: 1884, slogan: 'Foxes Never Quit', shortSlogan: 'The Foxes' },
      48: { name: 'West Ham', country: 'England', founded: 1895, slogan: "I'm Forever Blowing Bubbles", shortSlogan: 'The Hammers' },
      39: { name: 'Newcastle United', country: 'England', founded: 1892, slogan: 'Howay The Lads', shortSlogan: 'The Magpies' },
      45: { name: 'Everton', country: 'England', founded: 1878, slogan: 'Nil Satis Nisi Optimum', shortSlogan: 'The Toffees' },
      66: { name: 'Aston Villa', country: 'England', founded: 1874, slogan: 'Prepared', shortSlogan: 'The Villans' },
      
      // La Liga
      529: { name: 'Barcelona', country: 'Spain', founded: 1899, slogan: 'Més que un club', shortSlogan: 'Força Barça' },
      541: { name: 'Real Madrid', country: 'Spain', founded: 1902, slogan: '¡Hala Madrid!', shortSlogan: 'Los Blancos' },
      530: { name: 'Atletico Madrid', country: 'Spain', founded: 1903, slogan: 'Nunca dejes de creer', shortSlogan: 'Aúpa Atleti' },
      532: { name: 'Valencia', country: 'Spain', founded: 1919, slogan: 'Amunt Valencia', shortSlogan: 'Los Che' },
      531: { name: 'Athletic Bilbao', country: 'Spain', founded: 1898, slogan: 'Con cantera y afición, no hace falta importación', shortSlogan: 'Los Leones' },
      533: { name: 'Sevilla', country: 'Spain', founded: 1890, slogan: 'Nunca se rinde', shortSlogan: 'Los Nervionenses' },
      
      // Bundesliga
      157: { name: 'Bayern Munich', country: 'Germany', founded: 1900, slogan: 'Mia san mia', shortSlogan: 'FC Bayern' },
      165: { name: 'Borussia Dortmund', country: 'Germany', founded: 1909, slogan: 'Echte Liebe', shortSlogan: 'BVB' },
      169: { name: 'RB Leipzig', country: 'Germany', founded: 2009, slogan: 'Die Roten Bullen', shortSlogan: 'RB Leipzig' },
      172: { name: 'VfB Stuttgart', country: 'Germany', founded: 1893, slogan: 'Furchtlos und treu', shortSlogan: 'VfB' },
      168: { name: 'Bayer Leverkusen', country: 'Germany', founded: 1904, slogan: 'Werkself', shortSlogan: 'Die Werkself' },
      
      // Serie A
      489: { name: 'AC Milan', country: 'Italy', founded: 1899, slogan: 'Sempre Milan', shortSlogan: 'Forza Milan' },
      492: { name: 'Inter Milan', country: 'Italy', founded: 1908, slogan: 'Brothers of the World', shortSlogan: 'Forza Inter' },
      496: { name: 'Juventus', country: 'Italy', founded: 1897, slogan: 'Fino alla fine', shortSlogan: 'Forza Juve' },
      497: { name: 'Roma', country: 'Italy', founded: 1927, slogan: 'Roma non si discute, si ama', shortSlogan: 'La Lupa' },
      487: { name: 'Lazio', country: 'Italy', founded: 1900, slogan: 'Noi non siamo da meno a nessuno', shortSlogan: 'I Biancocelesti' },
      499: { name: 'Napoli', country: 'Italy', founded: 1926, slogan: 'Un giorno all\'improvviso', shortSlogan: 'I Partenopei' },
      
      // Ligue 1
      85: { name: 'Paris Saint Germain', country: 'France', founded: 1970, slogan: 'Ici c\'est Paris', shortSlogan: 'Paris est magique' },
      91: { name: 'Monaco', country: 'France', founded: 1924, slogan: 'Daghe Munegu', shortSlogan: 'ASM' },
      
      // Other European Leagues
      212: { name: 'Ajax', country: 'Netherlands', founded: 1900, slogan: 'Wij zijn Ajax', shortSlogan: 'Godenzonen' },
      215: { name: 'Porto', country: 'Portugal', founded: 1893, slogan: 'Há só um Porto', shortSlogan: 'Dragões' },
      228: { name: 'Benfica', country: 'Portugal', founded: 1904, slogan: 'E pluribus unum', shortSlogan: 'As Águias' },
      548: { name: 'Celtic', country: 'Scotland', founded: 1887, slogan: "You'll Never Walk Alone", shortSlogan: 'The Bhoys' },
      247: { name: 'Rangers', country: 'Scotland', founded: 1872, slogan: 'Ready', shortSlogan: 'The Gers' },
    }
    return teamMap[teamId] || { 
      name: `Team ${teamId}`, 
      country: 'Unknown', 
      founded: 0, 
      slogan: `우리는 Team ${teamId}!`, 
      shortSlogan: `함께하는 Team ${teamId}` 
    }
  }
  
  const teamBasicInfo = teamId ? getTeamBasicInfo(teamId) : null
  
  // 팀 정보 가져오기
  const { data: teamProfile } = useTeamProfile(teamId || 0, { enabled: !!teamId })
  const { data: nextFixtures } = useTeamNextFixtures(teamId || 0, { enabled: !!teamId })
  const { data: lastFixtures } = useTeamLastFixtures(teamId || 0, { enabled: !!teamId })
  
  // 팀 통계는 팀 프로필 로드 후 가져오기
  const { data: teamStats } = useTeamStatistics(
    teamId || 0, 
    getCurrentSeason(), 
    39, // 임시로 프리미어리그 ID 사용 (나중에 동적으로 변경)
    { enabled: !!teamId && !!teamProfile }
  )

  useEffect(() => {
    loadBoardData()
    
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
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [boardId])

  const loadBoardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 게시판 정보 가져오기
      if (boardId === 'all') {
        setBoard({
          id: 'all',
          name: '전체 게시판',
          description: '모든 축구 팬들이 자유롭게 소통하는 공간',
          type: 'all',
          memberCount: 0,
          postCount: 0
        })
      } else {
        const boardData = await CommunityService.getBoard(boardId)
        if (!boardData) {
          throw new Error('게시판을 찾을 수 없습니다')
        }
        setBoard(boardData)
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
        // 새 게시글 추가
        setPosts(prev => [newPost, ...prev])
        break
      case 'UPDATE':
        // 게시글 업데이트
        setPosts(prev => prev.map(post => 
          post.id === newPost.id ? newPost : post
        ))
        break
      case 'DELETE':
        // 게시글 삭제
        setPosts(prev => prev.filter(post => post.id !== oldPost.id))
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '게시판을 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.push('/community')}>
            커뮤니티로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/community">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  커뮤니티
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                {board.iconUrl && board.type === 'team' && (
                  <Image
                    src={board.iconUrl}
                    alt={board.name}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold">{board.name}</h1>
                  <p className="text-sm text-gray-600">{board.description}</p>
                </div>
              </div>
            </div>
            
            {user && (
              <Link href={`/community/boards/${boardId}/write`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  글쓰기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 팀 정보 섹션 (팀 게시판인 경우) */}
      {isTeamBoard && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-8">
            {/* 팀 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                  {teamProfile?.team?.logo ? (
                    <Image
                      src={teamProfile.team.logo}
                      alt={teamProfile.team.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <img 
                      src={`https://media.api-sports.io/football/teams/${teamId}.png`}
                      alt="Team Logo"
                      className="w-16 h-16 object-contain"
                    />
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {teamProfile?.team?.name || teamBasicInfo?.name || `팀 #${teamId}`} 
                    <span className="text-blue-200 ml-2">팬 게시판</span>
                  </h1>
                  <div className="flex items-center space-x-6 text-sm text-blue-100">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>창단 {teamProfile?.team?.founded || teamBasicInfo?.founded || '미정'}년</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{teamProfile?.team?.country || teamBasicInfo?.country || '국가 정보 없음'}</span>
                    </div>
                    {teamProfile?.venue && (
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4" />
                        <span>{teamProfile.venue.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-yellow-300 font-bold text-lg italic">
                      "{teamBasicInfo?.slogan || `우리는 ${teamProfile?.team?.name || teamBasicInfo?.name || '이 팀'}!`}"
                    </p>
                    <p className="text-blue-100 text-sm mt-1">
                      {teamProfile?.team?.name || teamBasicInfo?.name || '이 팀'} 팬들만이 모이는 특별한 공간입니다! 🔥
                    </p>
                  </div>
                </div>
              </div>
              <Badge className="bg-red-500 text-white border-none px-4 py-2 text-lg">
                <Heart className="w-5 h-5 mr-2 fill-current" />
                OFFICIAL FAN ZONE
              </Badge>
            </div>
            
            {/* 팀 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-yellow-300">
                  {teamStats?.fixtures?.played?.total || '0'}
                </div>
                <div className="text-sm text-blue-100 mt-1">시즌 경기수</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-green-300">
                  {teamStats?.fixtures?.wins?.total || '0'}
                </div>
                <div className="text-sm text-blue-100 mt-1">승리</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-gray-300">
                  {teamStats?.fixtures?.draws?.total || '0'}
                </div>
                <div className="text-sm text-blue-100 mt-1">무승부</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-red-300">
                  {teamStats?.fixtures?.loses?.total || '0'}
                </div>
                <div className="text-sm text-blue-100 mt-1">패배</div>
              </div>
            </div>
            
            {/* 팀 폼 상태 */}
            {teamStats && (
              <div className="bg-white/10 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>시즌 폼 상태</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">승률</span>
                        <span className="text-sm font-bold">
                          {teamStats.fixtures?.played?.total ? 
                            Math.round((teamStats.fixtures.wins.total / teamStats.fixtures.played.total) * 100) : 0
                          }%
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${teamStats.fixtures?.played?.total ? 
                              (teamStats.fixtures.wins.total / teamStats.fixtures.played.total) * 100 : 0
                            }%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-100">
                      홈: {teamStats.fixtures?.wins?.home || 0}승 | 
                      어웨이: {teamStats.fixtures?.wins?.away || 0}승
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">득점/실점</span>
                        <span className="text-sm font-bold">
                          {teamStats.goals?.for?.total?.total || 0} / {teamStats.goals?.against?.total?.total || 0}
                        </span>
                      </div>
                      <div className="text-sm text-blue-100">
                        평균 득점: {teamStats.goals?.for?.average?.total || '0.0'} | 
                        평균 실점: {teamStats.goals?.against?.average?.total || '0.0'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 최근 경기 및 다음 경기 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 최근 경기 */}
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6 text-yellow-300" />
                  <span>최근 경기 결과</span>
                </h3>
                {lastFixtures && lastFixtures.response && lastFixtures.response.length > 0 ? (
                  <div className="space-y-3">
                    {lastFixtures.response.slice(0, 3).map((fixture: any) => (
                      <Link 
                        key={fixture.fixture.id} 
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block"
                      >
                        <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Link 
                                href={`/teams/${fixture.teams.home.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="transition-transform hover:scale-110"
                              >
                                <Image
                                  src={fixture.teams.home.logo}
                                  alt={fixture.teams.home.name}
                                  width={24}
                                  height={24}
                                />
                              </Link>
                              <Link 
                                href={`/teams/${fixture.teams.home.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-medium hover:text-yellow-200 transition-colors"
                              >
                                {fixture.teams.home.name}
                              </Link>
                            </div>
                            <div className="text-lg font-bold text-yellow-300">
                              {fixture.goals.home} - {fixture.goals.away}
                            </div>
                            <div className="flex items-center space-x-3">
                              <Link 
                                href={`/teams/${fixture.teams.away.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm font-medium hover:text-yellow-200 transition-colors"
                              >
                                {fixture.teams.away.name}
                              </Link>
                              <Link 
                                href={`/teams/${fixture.teams.away.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="transition-transform hover:scale-110"
                              >
                                <Image
                                  src={fixture.teams.away.logo}
                                  alt={fixture.teams.away.name}
                                  width={24}
                                  height={24}
                                />
                              </Link>
                            </div>
                          </div>
                          <div className="text-xs text-blue-200 mt-2 text-center">
                            {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', { 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </div>
                          <div className="text-xs text-blue-300 mt-1 text-center opacity-75">
                            클릭하여 경기 상세 보기
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-200 text-center py-8">
                    최근 경기 정보를 불러오는 중입니다...
                  </p>
                )}
              </div>
              
              {/* 다음 경기 */}
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <Target className="h-6 w-6 text-green-300" />
                  <span>다음 경기 일정</span>
                </h3>
                {nextFixtures && nextFixtures.response && nextFixtures.response.length > 0 ? (
                  <div className="space-y-3">
                    {nextFixtures.response.slice(0, 3).map((fixture: any, index: number) => (
                      <Link 
                        key={fixture.fixture.id} 
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block"
                      >
                        <div className={`bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer ${index === 0 ? 'ring-2 ring-green-300' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Image
                                src={fixture.teams.home.logo}
                                alt={fixture.teams.home.name}
                                width={24}
                                height={24}
                              />
                              <span className="text-sm font-medium">{fixture.teams.home.name}</span>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-300">VS</div>
                              {index === 0 && <div className="text-xs text-green-300">NEXT</div>}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium">{fixture.teams.away.name}</span>
                              <Image
                                src={fixture.teams.away.logo}
                                alt={fixture.teams.away.name}
                                width={24}
                                height={24}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-blue-200 mt-2 text-center">
                            {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', { 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-xs text-blue-300 mt-1 text-center opacity-75">
                            클릭하여 경기 정보 보기
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-200 text-center py-8">
                    다음 경기 일정을 불러오는 중입니다...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게시판 통계 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">멤버</span>
              <span className="font-semibold">{board.memberCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">게시글</span>
              <span className="font-semibold">{posts.length.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <main className="container mx-auto px-4 py-6">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">아직 게시글이 없습니다.</p>
            {user ? (
              <Link href={`/community/boards/${boardId}/write`}>
                <Button>첫 번째 글 작성하기</Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button>로그인하고 글 작성하기</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href={`/community/posts/${post.id}`}>
                    <div className="space-y-3">
                      {/* 제목 */}
                      <div>
                        <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                          {post.title}
                        </h3>
                        {post.content && (
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {post.content}
                          </p>
                        )}
                      </div>
                      
                      {/* 메타 정보 */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs">
                                {post.author?.nickname?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <span className="text-gray-700">{post.author?.nickname || '익명'}</span>
                          </div>
                          <span className="text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { 
                              addSuffix: true,
                              locale: ko 
                            })}
                          </span>
                        </div>
                        
                        {/* 상호작용 정보 */}
                        <div className="flex items-center space-x-4 text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.viewCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likeCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.commentCount}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 태그 */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}