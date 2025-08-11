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
  const [canWrite, setCanWrite] = useState<boolean>(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  
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
  const { data: teamProfile } = useTeamProfile(teamId || 0)
  const { data: nextFixtures } = useTeamNextFixtures(teamId || 0)
  const { data: lastFixtures } = useTeamLastFixtures(teamId || 0)
  
  // 팀 통계는 팀 프로필 로드 후 가져오기
  const { data: teamStats } = useTeamStatistics(
    teamId || 0, 
    getCurrentSeason(39), // 프리미어리그 ID로 시즌 가져오기
    39 // 임시로 프리미어리그 ID 사용 (나중에 동적으로 변경)
  )

  useEffect(() => {
    loadBoardData()
    checkWritePermission()
    
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
  }, [boardId, user])

  const checkWritePermission = async () => {
    if (!user) {
      setCanWrite(false)
      return
    }
    
    try {
      // 프로필 정보 가져오기
      const profile = await CommunityService.getUserProfile(user.id)
      setUserProfile(profile)
      
      // 권한 체크
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
      } else if (isTeamBoard && teamId) {
        // 팀 게시판인 경우
        const teamInfo = getTeamBasicInfo(teamId)
        setBoard({
          id: boardId,
          name: `${teamInfo.name} 팬 게시판`,
          description: `${teamInfo.name} 팬들이 모여 소통하는 공간`,
          type: 'team',
          teamId: teamId,
          iconUrl: `https://media.api-sports.io/football/teams/${teamId}.png`,
          memberCount: 0, // 기본값 설정
          postCount: 0
        })
      } else {
        const boardData = await CommunityService.getBoard(boardId)
        if (!boardData) {
          throw new Error('게시판을 찾을 수 없습니다')
        }
        // memberCount가 없으면 기본값 설정
        setBoard({
          ...boardData,
          memberCount: boardData.memberCount || 0,
          postCount: boardData.postCount || 0
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
            
            {user && canWrite ? (
              <Link href={`/community/boards/${boardId}/write`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  글쓰기
                </Button>
              </Link>
            ) : user && !canWrite && isTeamBoard ? (
              <Button 
                variant="outline" 
                disabled
                title={`${userProfile?.favoriteTeamName || '다른 팀'} 팬입니다`}
              >
                <Shield className="h-4 w-4 mr-2" />
                팬 전용
              </Button>
            ) : !user ? (
              <Link href="/auth/login">
                <Button variant="outline">
                  로그인
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* 팀 정보 섹션 (팀 게시판인 경우) */}
      {isTeamBoard && (
        <div className="relative overflow-hidden">
          {/* 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90" />
          
          {/* 애니메이션 배경 효과 */}
          <div className="absolute inset-0">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
          </div>
          
          <div className="relative container mx-auto px-4 py-12">
            {/* 팀 헤더 - 개선된 레이아웃 */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 mb-10">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 flex-1">
                {/* 팀 로고 컨테이너 */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform">
                    {teamProfile?.team?.logo ? (
                      <Image
                        src={teamProfile.team.logo}
                        alt={teamProfile.team.name}
                        width={72}
                        height={72}
                        className="rounded-full p-2"
                      />
                    ) : (
                      <img 
                        src={`https://media.api-sports.io/football/teams/${teamId}.png`}
                        alt="Team Logo"
                        className="w-20 h-20 object-contain p-2"
                      />
                    )}
                  </div>
                </div>
                
                {/* 팀 정보 */}
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
                    {teamProfile?.team?.name || teamBasicInfo?.name || `팀 #${teamId}`}
                  </h1>
                  <p className="text-xl lg:text-2xl text-yellow-300 font-medium mb-4">
                    공식 팬 커뮤니티
                  </p>
                  
                  {/* 팀 메타 정보 */}
                  <div className="flex flex-wrap items-center gap-4 text-white/90 mb-4">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Since {teamProfile?.team?.founded || teamBasicInfo?.founded || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{teamProfile?.team?.country || teamBasicInfo?.country || 'Unknown'}</span>
                    </div>
                    {teamProfile?.venue && (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm">{teamProfile.venue.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 팀 슬로건 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-xl">
                    <p className="text-lg font-bold text-yellow-300 italic mb-2">
                      "{teamBasicInfo?.slogan || `우리는 ${teamProfile?.team?.name || teamBasicInfo?.name}!`}"
                    </p>
                    <p className="text-sm text-white/80">
                      열정적인 팬들이 모여 응원하고 소통하는 공간입니다 ⚽️
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 액션 버튼 그룹 */}
              <div className="flex flex-col gap-3">
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-none px-6 py-3 text-lg shadow-lg">
                  <Heart className="w-5 h-5 mr-2 fill-current animate-pulse" />
                  OFFICIAL FAN ZONE
                </Badge>
                <Button 
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
                  onClick={() => router.push(`/teams/${teamId}`)}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  팀 정보 보기
                </Button>
              </div>
            </div>
            
            {/* 팀 통계 - 개선된 디자인 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {teamStats?.fixtures?.played?.total || '0'}
                </div>
                <div className="text-sm text-white/70">경기</div>
                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 w-full" />
                </div>
              </div>
              
              <div className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="absolute top-2 right-2">
                  <Trophy className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {teamStats?.fixtures?.wins?.total || '0'}
                </div>
                <div className="text-sm text-white/70">승리</div>
                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all"
                    style={{ 
                      width: `${teamStats?.fixtures?.played?.total ? 
                        (teamStats.fixtures.wins.total / teamStats.fixtures.played.total) * 100 : 0
                      }%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full" />
                </div>
                <div className="text-4xl font-bold text-gray-300 mb-2">
                  {teamStats?.fixtures?.draws?.total || '0'}
                </div>
                <div className="text-sm text-white/70">무승부</div>
                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-400 transition-all"
                    style={{ 
                      width: `${teamStats?.fixtures?.played?.total ? 
                        (teamStats.fixtures.draws.total / teamStats.fixtures.played.total) * 100 : 0
                      }%` 
                    }}
                  />
                </div>
              </div>
              
              <div className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="absolute top-2 right-2">
                  <div className="w-4 h-4 bg-red-400 rounded" />
                </div>
                <div className="text-4xl font-bold text-red-400 mb-2">
                  {teamStats?.fixtures?.loses?.total || '0'}
                </div>
                <div className="text-sm text-white/70">패배</div>
                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-400 transition-all"
                    style={{ 
                      width: `${teamStats?.fixtures?.played?.total ? 
                        (teamStats.fixtures.loses.total / teamStats.fixtures.played.total) * 100 : 0
                      }%` 
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* 팀 폼 상태 - 개선된 디자인 */}
            {teamStats && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                  <div className="p-2 bg-yellow-400/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-yellow-400" />
                  </div>
                  <span>시즌 퍼포먼스</span>
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* 승률 차트 */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-white/60 text-sm mb-1">승률</p>
                          <p className="text-3xl font-bold text-white">
                            {teamStats.fixtures?.played?.total ? 
                              Math.round((teamStats.fixtures.wins.total / teamStats.fixtures.played.total) * 100) : 0
                            }%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60">W-D-L</p>
                          <p className="text-sm font-medium text-white">
                            {teamStats.fixtures?.wins?.total || 0}-
                            {teamStats.fixtures?.draws?.total || 0}-
                            {teamStats.fixtures?.loses?.total || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${teamStats.fixtures?.played?.total ? 
                              (teamStats.fixtures.wins.total / teamStats.fixtures.played.total) * 100 : 0
                            }%` 
                          }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 text-sm">
                      <div className="flex-1 bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-xs mb-1">홈 승리</p>
                        <p className="text-lg font-bold text-green-400">{teamStats.fixtures?.wins?.home || 0}</p>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-lg p-3">
                        <p className="text-white/60 text-xs mb-1">원정 승리</p>
                        <p className="text-lg font-bold text-blue-400">{teamStats.fixtures?.wins?.away || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 득점/실점 통계 */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-white/60 text-sm mb-1">득점력</p>
                          <p className="text-3xl font-bold text-white">
                            {teamStats.goals?.for?.total?.total || 0}
                            <span className="text-lg font-normal text-white/60 ml-2">골</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60">평균</p>
                          <p className="text-sm font-medium text-white">
                            {teamStats.goals?.for?.average?.total || '0.0'} / 경기
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/60 w-12">득점</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full" 
                                 style={{width: `${Math.min((teamStats.goals?.for?.total?.total || 0) * 2, 100)}%`}} />
                          </div>
                          <span className="text-sm font-medium text-white w-10 text-right">
                            {teamStats.goals?.for?.total?.total || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white/60 w-12">실점</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-400 to-pink-500 rounded-full" 
                                 style={{width: `${Math.min((teamStats.goals?.against?.total?.total || 0) * 2, 100)}%`}} />
                          </div>
                          <span className="text-sm font-medium text-white w-10 text-right">
                            {teamStats.goals?.against?.total?.total || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-white/60 text-xs mb-1">득실차</p>
                      <p className={`text-lg font-bold ${
                        (teamStats.goals?.for?.total?.total || 0) - (teamStats.goals?.against?.total?.total || 0) > 0 
                          ? 'text-green-400' 
                          : (teamStats.goals?.for?.total?.total || 0) - (teamStats.goals?.against?.total?.total || 0) < 0 
                            ? 'text-red-400' 
                            : 'text-gray-400'
                      }`}>
                        {(teamStats.goals?.for?.total?.total || 0) - (teamStats.goals?.against?.total?.total || 0) > 0 ? '+' : ''}
                        {(teamStats.goals?.for?.total?.total || 0) - (teamStats.goals?.against?.total?.total || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 최근 경기 및 다음 경기 - 개선된 디자인 */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 최근 경기 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                  <div className="p-2 bg-orange-400/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                  </div>
                  <span>최근 경기 결과</span>
                </h3>
                {lastFixtures && lastFixtures.response && lastFixtures.response.length > 0 ? (
                  <div className="space-y-3">
                    {lastFixtures.response.slice(0, 3).map((fixture: any, index: number) => {
                      const isWin = fixture.teams.home.id === teamId 
                        ? fixture.goals.home > fixture.goals.away
                        : fixture.goals.away > fixture.goals.home
                      const isDraw = fixture.goals.home === fixture.goals.away
                      const resultColor = isWin ? 'bg-green-400/20 border-green-400/30' : isDraw ? 'bg-gray-400/20 border-gray-400/30' : 'bg-red-400/20 border-red-400/30'
                      const resultText = isWin ? 'W' : isDraw ? 'D' : 'L'
                      const resultTextColor = isWin ? 'text-green-400' : isDraw ? 'text-gray-400' : 'text-red-400'
                      
                      return (
                        <Link 
                          key={fixture.fixture.id} 
                          href={`/fixtures/${fixture.fixture.id}`}
                          className="block group"
                        >
                          <div className={`relative ${resultColor} border rounded-xl p-4 hover:bg-white/10 transition-all group-hover:scale-[1.02]`}>
                            {/* 결과 표시 */}
                            <div className={`absolute -top-2 -right-2 w-8 h-8 ${resultColor} rounded-full flex items-center justify-center font-bold ${resultTextColor} border border-white/20`}>
                              {resultText}
                            </div>
                            
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <Image
                                  src={fixture.teams.home.logo}
                                  alt={fixture.teams.home.name}
                                  width={28}
                                  height={28}
                                  className="drop-shadow-lg"
                                />
                                <span className={`text-sm font-medium text-white ${fixture.teams.home.id === teamId ? 'font-bold' : ''}`}>
                                  {fixture.teams.home.name}
                                </span>
                              </div>
                              
                              <div className="px-4 py-2 bg-black/20 rounded-lg">
                                <div className="text-xl font-bold text-white text-center">
                                  {fixture.goals.home} - {fixture.goals.away}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 flex-1 justify-end">
                                <span className={`text-sm font-medium text-white ${fixture.teams.away.id === teamId ? 'font-bold' : ''}`}>
                                  {fixture.teams.away.name}
                                </span>
                                <Image
                                  src={fixture.teams.away.logo}
                                  alt={fixture.teams.away.name}
                                  width={28}
                                  height={28}
                                  className="drop-shadow-lg"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/60">
                                  {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    weekday: 'short'
                                  })}
                                </span>
                                <span className="text-xs text-white/60">
                                  {fixture.league.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                      <Trophy className="h-8 w-8 text-white/40" />
                    </div>
                    <p className="text-white/60">최근 경기 정보를 불러오는 중...</p>
                  </div>
                )}
              </div>
              
              {/* 다음 경기 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-5 flex items-center gap-3 text-white">
                  <div className="p-2 bg-green-400/20 rounded-lg">
                    <Target className="h-5 w-5 text-green-400" />
                  </div>
                  <span>다음 경기 일정</span>
                </h3>
                {nextFixtures && nextFixtures.response && nextFixtures.response.length > 0 ? (
                  <div className="space-y-3">
                    {nextFixtures.response.slice(0, 3).map((fixture: any, index: number) => (
                      <Link 
                        key={fixture.fixture.id} 
                        href={`/fixtures/${fixture.fixture.id}`}
                        className="block group"
                      >
                        <div className={`relative bg-white/5 border ${index === 0 ? 'border-green-400/50 bg-green-400/10' : 'border-white/10'} rounded-xl p-4 hover:bg-white/10 transition-all group-hover:scale-[1.02]`}>
                          {index === 0 && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-xs font-bold text-white rounded-full">
                                NEXT MATCH
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <Image
                                src={fixture.teams.home.logo}
                                alt={fixture.teams.home.name}
                                width={28}
                                height={28}
                                className="drop-shadow-lg"
                              />
                              <span className={`text-sm font-medium text-white ${fixture.teams.home.id === teamId ? 'font-bold' : ''}`}>
                                {fixture.teams.home.name}
                              </span>
                            </div>
                            
                            <div className="px-4 py-2">
                              <div className={`text-lg font-bold ${index === 0 ? 'text-green-400' : 'text-white/80'}`}>
                                VS
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <span className={`text-sm font-medium text-white ${fixture.teams.away.id === teamId ? 'font-bold' : ''}`}>
                                {fixture.teams.away.name}
                              </span>
                              <Image
                                src={fixture.teams.away.logo}
                                alt={fixture.teams.away.name}
                                width={28}
                                height={28}
                                className="drop-shadow-lg"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60">
                                {new Date(fixture.fixture.date).toLocaleDateString('ko-KR', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </span>
                              <span className={`text-xs font-medium ${index === 0 ? 'text-green-400' : 'text-white/60'}`}>
                                {new Date(fixture.fixture.date).toLocaleTimeString('ko-KR', { 
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="text-xs text-white/60">
                                {fixture.league.name}
                              </span>
                            </div>
                            {index === 0 && (
                              <div className="mt-2 text-center">
                                <span className="text-xs text-green-400">
                                  D-{Math.ceil((new Date(fixture.fixture.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-white/40" />
                    </div>
                    <p className="text-white/60">다음 경기 일정을 불러오는 중...</p>
                  </div>
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
              <span className="font-semibold">{(board.memberCount || 0).toLocaleString()}</span>
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