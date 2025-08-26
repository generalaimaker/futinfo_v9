'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, Heart, Share2, MoreHorizontal, Info, Home, Plane,
  Trophy, Target, Shield, Activity, Users, Star, Award,
  MapPin, Calendar, Stadium, TrendingUp, TrendingDown,
  BarChart3, Zap, Circle, ChevronRight, Clock, Percent,
  Hash, ArrowUp, ArrowDown, Minus, AlertTriangle, Flag,
  DollarSign, ArrowRightLeft, UserPlus, UserMinus,
  MessageSquare, ThumbsUp, Eye, Send, Filter, Search,
  Shirt, PlayCircle, PauseCircle, CheckCircle, XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import footballAPIService from '@/lib/supabase/football'
import { useRouter } from 'next/navigation'

// 팀 최근 폼 표시 컴포넌트 - 리그 경기만 표시
function TeamFormDisplay({ teamId, form, leagueId }: { teamId: number, form: string, leagueId?: number }) {
  const router = useRouter()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  // 현재 시즌 계산
  const currentSeason = new Date().getFullYear()
  
  // 팀의 리그 경기만 가져오기
  const { data: leagueFixtures } = useQuery({
    queryKey: ['team-league-fixtures', teamId, leagueId, currentSeason],
    queryFn: async () => {
      if (!leagueId) return []
      
      try {
        // 팀의 해당 리그 경기만 가져오기
        const response = await footballAPIService.callUnifiedAPI('fixtures', {
          team: teamId,
          league: leagueId,
          season: currentSeason,
          last: 10 // 더 많이 가져와서 필터링
        })
        
        // 완료된 경기만 필터링하고 최근 5경기만 선택
        const completedFixtures = response?.response?.filter(
          (f: any) => f.fixture.status.short === 'FT'
        ).slice(-5) || []
        
        return completedFixtures
      } catch (error) {
        console.error('Failed to fetch league fixtures:', error)
        return []
      }
    },
    enabled: !!teamId && !!leagueId,
    staleTime: 5 * 60 * 1000,
  })
  
  const formArray = form?.split('').slice(-5) || []
  
  return (
    <div className="flex items-center justify-center gap-0.5 relative">
      {formArray.map((result: string, i: number) => {
        // 가장 오래된 경기부터 표시 (왼쪽이 과거, 오른쪽이 최근)
        const fixture = leagueFixtures?.[i]
        const isHome = fixture?.teams?.home?.id === teamId
        const opponent = isHome ? fixture?.teams?.away : fixture?.teams?.home
        const score = fixture?.goals || fixture?.score?.fulltime
        const date = fixture?.fixture?.date ? new Date(fixture.fixture.date).toLocaleDateString('ko-KR', { 
          month: 'short', 
          day: 'numeric' 
        }) : ''
        
        return (
          <div key={i} className="relative group">
            <div
              className={cn(
                "w-5 h-5 rounded text-xs font-bold flex items-center justify-center cursor-pointer transition-all",
                result === 'W' && "bg-green-500 text-white hover:bg-green-600",
                result === 'D' && "bg-gray-400 text-white hover:bg-gray-500",
                result === 'L' && "bg-red-500 text-white hover:bg-red-600",
                hoveredIndex === i && "scale-110 shadow-lg"
              )}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                if (fixture?.fixture?.id) {
                  router.push(`/fixtures/${fixture.fixture.id}`)
                }
              }}
            >
              {result}
            </div>
            
            {/* Hover Tooltip - 왼쪽에 표시 */}
            {fixture && hoveredIndex === i && (
              <div className="absolute top-1/2 right-full transform -translate-y-1/2 mr-2 z-50 pointer-events-none">
                <div className="bg-gray-900 text-white rounded-lg p-2 shadow-xl whitespace-nowrap">
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-yellow-400">{date}</div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs", isHome && "font-bold text-white")}>
                          {fixture.teams.home.name}
                        </span>
                        <span className="font-bold text-yellow-400">
                          {score?.home ?? '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs", !isHome && "font-bold text-white")}>
                          {fixture.teams.away.name}
                        </span>
                        <span className="font-bold text-yellow-400">
                          {score?.away ?? '-'}
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-400 text-[10px]">{fixture.league?.name || '리그'}</div>
                  </div>
                  {/* Arrow pointing right */}
                  <div className="absolute top-1/2 left-full transform -translate-y-1/2 -ml-1">
                    <div className="border-4 border-transparent border-l-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface AppleTeamProfileProps {
  teamId: number
  profileData: any
  statsData: any
  squadData: any
  nextFixtures: any
  lastFixtures: any
  standingsData: any
  transfersData: any
  injuriesData: any
  teamPosts: any
  isTeamFavorite: boolean
  onToggleFavorite: () => void
  onCreatePost: (data: any) => void
}

// Glass Morphism Card
function GlassCard({ children, className, ...props }: any) {
  return (
    <div 
      className={cn(
        "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl",
        "border border-white/20 dark:border-gray-800/20",
        "rounded-2xl shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// 스탯 카드 컴포넌트
function StatCard({ icon: Icon, label, value, subValue, color, trend }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "p-3 rounded-xl",
            color === 'blue' && "bg-blue-500/20",
            color === 'green' && "bg-green-500/20",
            color === 'yellow' && "bg-yellow-500/20",
            color === 'red' && "bg-red-500/20",
            color === 'purple' && "bg-purple-500/20"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              color === 'blue' && "text-blue-600",
              color === 'green' && "text-green-600",
              color === 'yellow' && "text-yellow-600",
              color === 'red' && "text-red-600",
              color === 'purple' && "text-purple-600"
            )} />
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : trend < 0 ? (
                <ArrowDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={cn(
                "text-xs font-medium",
                trend > 0 && "text-green-500",
                trend < 0 && "text-red-500",
                trend === 0 && "text-gray-400"
              )}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </p>
          {subValue && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {subValue}
            </p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

// 선수 카드 컴포넌트
function PlayerCard({ player }: any) {
  const playerData = player.player || player
  const stats = player.statistics?.[0]
  
  return (
    <Link href={`/players/${playerData.id}`}>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-pointer"
      >
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={playerData.photo || '/placeholder-player.png'}
                alt={playerData.name}
                width={60}
                height={60}
                className="rounded-full object-cover"
              />
              {playerData.injured && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{playerData.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {stats?.games?.position || playerData.position || 'N/A'}
                </Badge>
                {stats?.games?.number && (
                  <span className="text-xs text-gray-500">#{stats.games.number}</span>
                )}
                {playerData.age && (
                  <span className="text-xs text-gray-500">{playerData.age}세</span>
                )}
              </div>
              {stats && (
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{stats.games?.appearences || 0}경기</span>
                  <span>{stats.goals?.total || 0}골</span>
                  <span>{stats.goals?.assists || 0}도움</span>
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </GlassCard>
      </motion.div>
    </Link>
  )
}

// 경기 카드 컴포넌트
function FixtureCard({ fixture, teamId }: any) {
  const isHome = fixture.teams.home.id === teamId
  const opponent = isHome ? fixture.teams.away : fixture.teams.home
  const isWin = isHome ? 
    fixture.goals.home > fixture.goals.away : 
    fixture.goals.away > fixture.goals.home
  const isDraw = fixture.goals.home === fixture.goals.away
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="cursor-pointer"
      >
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-4 transition-all hover:bg-white/70 dark:hover:bg-gray-900/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={opponent.logo}
                alt={opponent.name}
                width={32}
                height={32}
                className="object-contain"
              />
              <div>
                <p className="text-sm font-medium">{opponent.name}</p>
                <p className="text-xs text-gray-500">
                  {isHome ? '홈' : '원정'} • {format(new Date(fixture.fixture.date), 'MM/dd')}
                </p>
              </div>
            </div>
            {fixture.fixture.status.short === 'FT' ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {isHome ? fixture.goals.home : fixture.goals.away}
                </span>
                <span className="text-gray-400">:</span>
                <span className="text-lg font-bold">
                  {isHome ? fixture.goals.away : fixture.goals.home}
                </span>
                <Badge className={cn(
                  "ml-2",
                  isWin && "bg-green-500/20 text-green-700",
                  isDraw && "bg-gray-500/20 text-gray-700",
                  !isWin && !isDraw && "bg-red-500/20 text-red-700"
                )}>
                  {isWin ? 'W' : isDraw ? 'D' : 'L'}
                </Badge>
              </div>
            ) : (
              <Badge variant="outline">예정</Badge>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// 이적 카드 컴포넌트
function TransferCard({ transfer, teamId }: any) {
  // 새로운 API 데이터 구조 파싱
  const isIn = transfer.direction === 'in'
  
  // 선수 정보
  const playerName = transfer.playerName || transfer.player?.name || '선수명 미상'
  const playerImage = transfer.playerImage || transfer.player?.photo || null
  
  // 클럽 정보
  const fromClub = transfer.fromClub || transfer.from?.name || '이전 팀'
  const toClub = transfer.toClub || transfer.to?.name || '이적 팀'
  
  // 날짜
  const transferDate = transfer.transferDate || transfer.date
  
  // 이적료 포맷팅
  const formatFee = () => {
    // 임대 체크
    if (transfer.onLoan || transfer.fee?.feeText?.includes('loan')) {
      return '임대'
    }
    
    // 무료 이적 체크
    if (transfer.fee?.feeText?.toLowerCase().includes('free')) {
      return '무료'
    }
    
    // 이적료 금액
    if (transfer.fee?.value && transfer.fee.value > 0) {
      const million = transfer.fee.value / 1000000
      if (million >= 1) {
        return `€${million.toFixed(1)}M`
      } else {
        return `€${(transfer.fee.value / 1000).toFixed(0)}K`
      }
    }
    
    // 기본값
    if (transfer.transfer_fee || transfer.transferFee) {
      return transfer.transfer_fee || transfer.transferFee
    }
    
    return '비공개'
  }
  
  // 이적 타입 결정
  const getTransferType = () => {
    if (transfer.onLoan || transfer.fee?.feeText?.includes('loan')) return '임대'
    if (transfer.fee?.feeText?.toLowerCase().includes('free')) return '자유계약'
    return '이적'
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="relative"
    >
      <div className={cn(
        "bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border rounded-xl p-4 transition-all",
        isIn ? "border-green-500/30 hover:border-green-500/50" : "border-red-500/30 hover:border-red-500/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 선수 사진 */}
            {playerImage && (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={playerImage}
                  alt={playerName}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            )}
            
            {/* 이적 방향 아이콘 */}
            <div className={cn(
              "p-2 rounded-lg",
              isIn ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {isIn ? (
                <ArrowRightLeft className="w-4 h-4 text-green-600 rotate-180" />
              ) : (
                <ArrowRightLeft className="w-4 h-4 text-red-600" />
              )}
            </div>
            
            {/* 선수 정보 */}
            <div>
              <p className="font-semibold text-sm">{playerName}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>
                  {isIn ? 
                    `${fromClub} → ${toClub}` : 
                    `${fromClub} → ${toClub}`
                  }
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {transferDate ? new Date(transferDate).toLocaleDateString('ko-KR') : '날짜 미상'}
              </p>
            </div>
          </div>
          
          {/* 이적료 및 타입 */}
          <div className="text-right">
            <p className={cn(
              "text-sm font-bold",
              isIn ? "text-green-600" : "text-red-600"
            )}>
              {formatFee()}
            </p>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs mt-1",
                getTransferType() === '임대' && "bg-blue-50 text-blue-600 border-blue-200"
              )}
            >
              {getTransferType()}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function AppleTeamProfile({
  teamId,
  profileData,
  statsData,
  squadData,
  nextFixtures,
  lastFixtures,
  standingsData,
  transfersData,
  injuriesData,
  teamPosts,
  isTeamFavorite,
  onToggleFavorite,
  onCreatePost
}: AppleTeamProfileProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isScrolled, setIsScrolled] = useState(false)
  const [transferFilter, setTransferFilter] = useState<'all' | 'in' | 'out'>('all')
  const [squadFilter, setSquadFilter] = useState<string>('all')
  const [newPostContent, setNewPostContent] = useState('')
  
  const team = profileData?.team
  const venue = profileData?.venue
  const stats = statsData
  
  // 스쿼드 데이터 처리
  let squad = []
  if (squadData?.response?.[0]?.players) {
    squad = squadData.response[0].players
  }
  
  // 포지션별 선수 그룹화
  const playersByPosition = squad.reduce((acc: any, player: any) => {
    const position = player.statistics?.[0]?.games?.position || 
                    player.player?.position || 'Unknown'
    if (!acc[position]) acc[position] = []
    acc[position].push(player)
    return acc
  }, {})
  
  // 팀 순위 정보
  const leagueId = standingsData?.response?.[0]?.league?.id || statsData?.league?.id
  const leagueStandings = standingsData?.response?.[0]?.league?.standings?.[0] || []
  const teamStanding = leagueStandings.find(
    (standing: any) => standing.team.id === teamId
  )
  
  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  if (!team) return null
  
  return (
    <div className="min-h-screen lg:ml-64 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 플로팅 헤더 */}
      <motion.header 
        className={cn(
          "fixed top-0 left-0 lg:left-64 right-0 z-30",
          "transition-all duration-500",
          isScrolled 
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-lg"
            : "bg-transparent"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/teams">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-xl transition-all",
                  isScrolled 
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "bg-white/20 backdrop-blur-xl"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            
            {isScrolled && (
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Image
                  src={team.logo}
                  alt={team.name}
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-semibold">{team.name}</span>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={`/community/boards/team_${teamId}`}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-xl transition-all flex items-center gap-2",
                  isScrolled 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    : "bg-white/20 backdrop-blur-xl hover:bg-white/30"
                )}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">라커룸</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className={cn(
                "rounded-xl transition-all",
                isScrolled 
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "bg-white/20 backdrop-blur-xl",
                isTeamFavorite && "text-red-500"
              )}
            >
              <Heart className={cn(
                "w-5 h-5",
                isTeamFavorite && "fill-current"
              )} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-xl transition-all",
                isScrolled 
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "bg-white/20 backdrop-blur-xl"
              )}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>
      
      {/* 히어로 섹션 */}
      <div className="relative pt-16 pb-8 overflow-hidden">
        {/* 배경 그라데이션 - 팀 컬러 기반 */}
        <div className="absolute inset-0">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            teamId === 33 && "from-red-500/10 via-transparent to-red-600/10", // Man United
            teamId === 50 && "from-blue-400/10 via-transparent to-blue-600/10", // Man City
            teamId === 40 && "from-blue-500/10 via-transparent to-white/10", // Liverpool
            teamId === 541 && "from-blue-900/10 via-transparent to-red-900/10", // Barcelona
            teamId === 529 && "from-white/10 via-transparent to-purple-900/10", // Real Madrid
            !teamId && "from-gray-400/10 via-transparent to-gray-600/10"
          )} />
        </div>
        
        <div className="relative container mx-auto px-6 py-12">
          <motion.div 
            className="flex flex-col md:flex-row items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* 팀 로고 */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-primary/20 rounded-3xl blur-2xl" />
              <div className="relative w-40 h-40 bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
                <Image
                  src={team.logo}
                  alt={team.name}
                  fill
                  className="object-contain p-4"
                />
              </div>
            </motion.div>
            
            {/* 팀 정보 */}
            <div className="flex-1 text-center md:text-left">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {team.name}
              </motion.h1>
              
              <motion.div 
                className="flex flex-wrap items-center gap-4 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="text-sm py-1 px-3">
                  <Flag className="w-3 h-3 mr-1" />
                  {team.country}
                </Badge>
                <Badge variant="outline" className="text-sm py-1 px-3">
                  <Calendar className="w-3 h-3 mr-1" />
                  창단 {team.founded}
                </Badge>
                {teamStanding && (
                  <Badge className={cn(
                    "text-sm py-1 px-3",
                    teamStanding.rank <= 4 && "bg-green-500/20 text-green-700",
                    teamStanding.rank > 4 && teamStanding.rank <= 6 && "bg-blue-500/20 text-blue-700",
                    teamStanding.rank > 15 && "bg-red-500/20 text-red-700"
                  )}>
                    <Trophy className="w-3 h-3 mr-1" />
                    {teamStanding.rank}위
                  </Badge>
                )}
              </motion.div>
              
              {venue && (
                <motion.div 
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{venue.name}</span>
                  {venue.capacity && (
                    <>
                      <span>•</span>
                      <span>{venue.capacity.toLocaleString()} 수용</span>
                    </>
                  )}
                  {venue.city && (
                    <>
                      <span>•</span>
                      <span>{venue.city}</span>
                    </>
                  )}
                </motion.div>
              )}
              
              {/* 최근 폼 */}
              {stats?.form && (
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-sm text-gray-500">최근 폼:</span>
                  <div className="scale-125 ml-2">
                    <TeamFormDisplay 
                      teamId={teamId}
                      form={stats.form}
                      leagueId={leagueId}
                    />
                  </div>
                </motion.div>
              )}
              
              {/* 액션 버튼들 */}
              <motion.div 
                className="flex items-center gap-3 mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href={`/community/boards/team_${teamId}`}>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl px-6 py-2.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-purple-500/25 transition-all flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    라커룸 입장하기
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="rounded-2xl px-6 py-2.5 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all flex items-center gap-2"
                  onClick={onToggleFavorite}
                >
                  <Heart className={cn(
                    "w-4 h-4",
                    isTeamFavorite && "fill-current text-red-500"
                  )} />
                  {isTeamFavorite ? '좋아하는 팀' : '좋아하는 팀 추가'}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* 주요 스탯 카드들 */}
      {stats && (
        <div className="container mx-auto px-6 -mt-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Target}
              label="득점"
              value={typeof stats.goals?.for?.total === 'object' ? stats.goals?.for?.total?.total || 0 : stats.goals?.for?.total || 0}
              subValue={`홈 ${typeof stats.goals?.for?.total === 'object' ? stats.goals?.for?.total?.home || 0 : 0} / 원정 ${typeof stats.goals?.for?.total === 'object' ? stats.goals?.for?.total?.away || 0 : 0}`}
              color="blue"
              trend={5}
            />
            <StatCard
              icon={Shield}
              label="실점"
              value={typeof stats.goals?.against?.total === 'object' ? stats.goals?.against?.total?.total || 0 : stats.goals?.against?.total || 0}
              subValue={`홈 ${typeof stats.goals?.against?.total === 'object' ? stats.goals?.against?.total?.home || 0 : 0} / 원정 ${typeof stats.goals?.against?.total === 'object' ? stats.goals?.against?.total?.away || 0 : 0}`}
              color="red"
              trend={-3}
            />
            <StatCard
              icon={Trophy}
              label="승리"
              value={typeof stats.fixtures?.wins === 'object' ? stats.fixtures?.wins?.total || 0 : stats.fixtures?.wins || 0}
              subValue={`홈 ${typeof stats.fixtures?.wins === 'object' ? stats.fixtures?.wins?.home || 0 : 0} / 원정 ${typeof stats.fixtures?.wins === 'object' ? stats.fixtures?.wins?.away || 0 : 0}`}
              color="green"
              trend={10}
            />
            <StatCard
              icon={Activity}
              label="승점"
              value={teamStanding?.points || 0}
              subValue={`${teamStanding?.all?.played || 0}경기`}
              color="purple"
              trend={0}
            />
          </div>
        </div>
      )}
      
      {/* 탭 콘텐츠 */}
      <div className="container mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="squad">스쿼드</TabsTrigger>
            <TabsTrigger value="fixtures">일정</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="transfers">이적</TabsTrigger>
            <TabsTrigger value="community">커뮤니티</TabsTrigger>
          </TabsList>
          
          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 다음 경기 */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  다음 경기
                </h3>
                <div className="space-y-3">
                  {nextFixtures?.response?.slice(0, 3).map((fixture: any) => (
                    <FixtureCard key={fixture.fixture.id} fixture={fixture} teamId={teamId} />
                  ))}
                </div>
              </GlassCard>
              
              {/* 최근 경기 결과 */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  최근 결과
                </h3>
                <div className="space-y-3">
                  {lastFixtures?.response?.slice(0, 3).map((fixture: any) => (
                    <FixtureCard key={fixture.fixture.id} fixture={fixture} teamId={teamId} />
                  ))}
                </div>
              </GlassCard>
              
              {/* 부상자 명단 */}
              {Array.isArray(injuriesData) && injuriesData.length > 0 && (
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    부상자 명단
                  </h3>
                  <div className="space-y-3">
                    {injuriesData.slice(0, 5).map((injury: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Image
                          src={injury.player.photo || '/placeholder-player.png'}
                          alt={injury.player.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{injury.player.name}</p>
                          <p className="text-xs text-gray-500">{injury.player.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>
            
            {/* 팀 통계 요약 */}
            {stats && (
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  시즌 통계
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">평균 득점</p>
                    <p className="text-2xl font-bold">
                      {(((typeof stats.goals?.for?.total === 'object' ? stats.goals?.for?.total?.total : stats.goals?.for?.total) || 0) / 
                        ((typeof stats.fixtures?.played === 'object' ? stats.fixtures?.played?.total : stats.fixtures?.played) || 1)).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">평균 실점</p>
                    <p className="text-2xl font-bold">
                      {(((typeof stats.goals?.against?.total === 'object' ? stats.goals?.against?.total?.total : stats.goals?.against?.total) || 0) / 
                        ((typeof stats.fixtures?.played === 'object' ? stats.fixtures?.played?.total : stats.fixtures?.played) || 1)).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">클린시트</p>
                    <p className="text-2xl font-bold">
                      {typeof stats.clean_sheet === 'object' ? stats.clean_sheet?.total || 0 : stats.clean_sheet || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">페널티 성공</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        if (!stats.penalty) return '0/0'
                        
                        const scored = typeof stats.penalty.scored === 'object' 
                          ? stats.penalty.scored?.total || stats.penalty.scored?.home || 0
                          : stats.penalty.scored || 0
                        
                        const total = typeof stats.penalty.total === 'object'
                          ? stats.penalty.total?.total || stats.penalty.total?.home || 0  
                          : stats.penalty.total || 0
                        
                        return `${scored}/${total}`
                      })()}
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}
            
            {/* 리그 순위 테이블 */}
            {leagueStandings && leagueStandings.length > 0 && (
              <GlassCard className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-sm" />
                    리그 순위
                  </h3>
                  <Badge variant="outline" className="text-xs backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                    실시간 업데이트
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left pb-4 pt-2 pr-2 font-semibold">순위</th>
                        <th className="text-left pb-4 pt-2 font-semibold">팀</th>
                        <th className="text-center pb-4 pt-2 font-medium">경기</th>
                        <th className="text-center pb-4 pt-2 font-medium">승</th>
                        <th className="text-center pb-4 pt-2 font-medium">무</th>
                        <th className="text-center pb-4 pt-2 font-medium">패</th>
                        <th className="text-center pb-4 pt-2 font-medium">득실</th>
                        <th className="text-center pb-4 pt-2 font-bold text-gray-700 dark:text-gray-300">승점</th>
                        <th className="text-center pb-4 pt-2 font-medium">최근</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leagueStandings.map((standing: any) => {
                        const isCurrentTeam = standing.team.id === teamId
                        const isChampionsLeague = standing.rank <= 4
                        const isEuropaLeague = standing.rank === 5
                        const isRelegation = standing.rank >= leagueStandings.length - 2
                        
                        return (
                          <motion.tr 
                            key={standing.team.id}
                            className={cn(
                              "border-b border-gray-100 dark:border-gray-800 transition-all",
                              isCurrentTeam && "bg-blue-50 dark:bg-blue-950/20"
                            )}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: standing.rank * 0.02 }}
                            whileHover={{ 
                              backgroundColor: isCurrentTeam ? undefined : "rgba(0,0,0,0.02)"
                            }}
                          >
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-semibold",
                                  isCurrentTeam && "text-blue-600 dark:text-blue-400",
                                  isChampionsLeague && !isCurrentTeam && "text-green-600 dark:text-green-400",
                                  isEuropaLeague && !isCurrentTeam && "text-orange-600 dark:text-orange-400",
                                  isRelegation && !isCurrentTeam && "text-red-600 dark:text-red-400"
                                )}>
                                  {standing.rank}
                                </span>
                                {standing.rank < standing.previous && (
                                  <ArrowUp className="w-3 h-3 text-green-500" />
                                )}
                                {standing.rank > standing.previous && (
                                  <ArrowDown className="w-3 h-3 text-red-500" />
                                )}
                                {standing.rank === standing.previous && standing.previous !== null && (
                                  <Minus className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            </td>
                            <td className="py-2">
                              <Link href={`/teams/${standing.team.id}`}>
                                <div className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                    <Image
                                      src={standing.team.logo}
                                      alt={standing.team.name}
                                      width={20}
                                      height={20}
                                      className="object-contain max-w-full max-h-full"
                                    />
                                  </div>
                                  <span className={cn(
                                    "text-sm",
                                    isCurrentTeam && "font-semibold text-blue-600 dark:text-blue-400"
                                  )}>
                                    {standing.team.name}
                                  </span>
                                </div>
                              </Link>
                            </td>
                            <td className="text-center text-sm py-2">{standing.all.played}</td>
                            <td className="text-center text-sm font-medium text-green-600 py-2">{standing.all.win}</td>
                            <td className="text-center text-sm text-gray-500 py-2">{standing.all.draw}</td>
                            <td className="text-center text-sm text-red-600 py-2">{standing.all.lose}</td>
                            <td className="text-center text-sm py-2">
                              <span className="text-green-600">{standing.all.goals.for}</span>
                              <span className="text-gray-400 mx-1">:</span>
                              <span className="text-red-600">{standing.all.goals.against}</span>
                              <span className="text-gray-500 ml-1">({standing.goalsDiff > 0 ? '+' : ''}{standing.goalsDiff})</span>
                            </td>
                            <td className={cn(
                              "text-center font-bold py-2",
                              isCurrentTeam && "text-blue-600 dark:text-blue-400"
                            )}>
                              {standing.points}
                            </td>
                            <td className="text-center py-2">
                              <TeamFormDisplay 
                                teamId={standing.team.id}
                                form={standing.form}
                                leagueId={leagueId}
                              />
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* 범례 */}
                <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">챔피언스리그</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">유로파리그</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">강등권</span>
                  </div>
                </div>
              </GlassCard>
            )}
          </TabsContent>
          
          {/* 스쿼드 탭 */}
          <TabsContent value="squad" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
            {/* 포지션 필터 */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={squadFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSquadFilter('all')}
              >
                전체
              </Button>
              {Object.keys(playersByPosition).map((position) => (
                <Button
                  key={position}
                  variant={squadFilter === position ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSquadFilter(position)}
                >
                  {position}
                </Button>
              ))}
            </div>
            
            {/* 선수 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(squadFilter === 'all' ? squad : playersByPosition[squadFilter] || []).map((player: any) => (
                <PlayerCard key={player.player?.id || player.id} player={player} />
              ))}
            </div>
          </TabsContent>
          
          {/* 일정 탭 */}
          <TabsContent value="fixtures" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
            <GlassCard className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-500" />
                  팀 일정
                </h3>
                <p className="text-sm text-gray-500 mt-1">최근 경기와 예정된 경기</p>
              </div>
              
              <div className="space-y-3">
                {/* 최근 완료된 경기 (오래된 순으로 표시) */}
                {lastFixtures?.response?.slice().reverse().slice(0, 5).map((fixture: any) => (
                  <motion.div
                    key={fixture.fixture.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="relative"
                  >
                    <FixtureCard fixture={fixture} teamId={teamId} />
                  </motion.div>
                ))}
                
                {/* 구분선 */}
                {lastFixtures?.response?.length > 0 && nextFixtures?.response?.length > 0 && (
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-gray-900 px-4 text-sm font-semibold text-gray-500">
                        현재
                      </span>
                    </div>
                  </div>
                )}
                
                {/* 예정된 경기 */}
                {nextFixtures?.response?.map((fixture: any, index: number) => {
                  const isNextMatch = index === 0 // 첫 번째 경기가 다음 경기
                  
                  return (
                    <motion.div
                      key={fixture.fixture.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.01 }}
                      className={cn(
                        "relative",
                        isNextMatch && "ring-2 ring-blue-500 ring-opacity-50 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20"
                      )}
                    >
                      {isNextMatch && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            다음 경기
                          </Badge>
                        </div>
                      )}
                      <FixtureCard fixture={fixture} teamId={teamId} />
                    </motion.div>
                  )
                })}
                
                {/* 데이터가 없을 때 */}
                {(!lastFixtures?.response?.length && !nextFixtures?.response?.length) && (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>경기 일정이 없습니다</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>
          
          {/* 통계 탭 */}
          <TabsContent value="stats" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 공격 통계 */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">공격</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">총 득점</span>
                      <span className="font-semibold">
                        {typeof stats.goals?.for?.total === 'object' ? stats.goals?.for?.total?.total || 0 : stats.goals?.for?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">평균 득점</span>
                      <span className="font-semibold">
                        {(((typeof stats.goals?.for?.total === 'object' ? stats.goals?.for?.total?.total : stats.goals?.for?.total) || 0) / 
                          ((typeof stats.fixtures?.played === 'object' ? stats.fixtures?.played?.total : stats.fixtures?.played) || 1)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">가장 많은 득점 시간대</span>
                      <span className="font-semibold">
                        {stats.goals?.for?.minute ? 
                          Object.entries(stats.goals.for.minute).reduce((max: any, [key, value]: any) => 
                            (typeof value === 'object' ? value.total : value) > (max.value || 0) ? 
                              {key, value: typeof value === 'object' ? value.total : value} : max, {}
                          ).key || 'N/A' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </GlassCard>
                
                {/* 수비 통계 */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">수비</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">총 실점</span>
                      <span className="font-semibold">
                        {typeof stats.goals?.against?.total === 'object' ? stats.goals?.against?.total?.total || 0 : stats.goals?.against?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">클린시트</span>
                      <span className="font-semibold">
                        {typeof stats.clean_sheet === 'object' ? stats.clean_sheet?.total || 0 : stats.clean_sheet || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">클린시트 비율</span>
                      <span className="font-semibold">
                        {(((typeof stats.clean_sheet === 'object' ? stats.clean_sheet?.total : stats.clean_sheet) || 0) / 
                          ((typeof stats.fixtures?.played === 'object' ? stats.fixtures?.played?.total : stats.fixtures?.played) || 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </TabsContent>
          
          {/* 이적 탭 */}
          <TabsContent value="transfers" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
            <GlassCard className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <ArrowRightLeft className="w-6 h-6 text-blue-500" />
                  이적 시장
                </h3>
                <p className="text-sm text-gray-500 mt-1">최근 이적 및 임대 현황</p>
              </div>
              
              {/* 필터 */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={transferFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransferFilter('all')}
                  className="rounded-full"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  전체
                </Button>
                <Button
                  variant={transferFilter === 'in' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransferFilter('in')}
                  className="rounded-full"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  영입
                </Button>
                <Button
                  variant={transferFilter === 'out' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransferFilter('out')}
                  className="rounded-full"
                >
                  <UserMinus className="w-3 h-3 mr-1" />
                  방출
                </Button>
              </div>
              
              {/* 이적 목록 */}
              <div className="space-y-3">
                {(() => {
                  // 새로운 API 응답 구조 처리
                  const transfers = transfersData?.response?.[0]?.transfers || 
                                   transfersData?.transfers || 
                                   transfersData || []
                  
                  console.log('[AppleTeamProfile] Raw transfers data:', transfers)
                  console.log('[AppleTeamProfile] Transfer filter:', transferFilter)
                  
                  if (!Array.isArray(transfers) || transfers.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>이적 정보가 없습니다</p>
                      </div>
                    )
                  }
                  
                  // 방향에 따라 필터링 (direction 필드 사용)
                  const filteredTransfers = transfers.filter((transfer: any) => {
                    if (transferFilter === 'all') return true
                    return transfer.direction === transferFilter
                  })
                  
                  console.log('[AppleTeamProfile] Filtered transfers:', filteredTransfers.length)
                  
                  if (filteredTransfers.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>해당하는 이적 정보가 없습니다</p>
                      </div>
                    )
                  }
                  
                  return filteredTransfers.map((transfer: any, idx: number) => (
                    <TransferCard 
                      key={`${transfer.player?.id || transfer.playerId || idx}-${transfer.transferDate || transfer.date || idx}`} 
                      transfer={transfer} 
                      teamId={teamId}
                    />
                  ))
                })()}
              </div>
              
              {/* 이적 통계 요약 */}
              {(() => {
                const transfers = transfersData?.response?.[0]?.transfers || transfersData?.transfers || []
                if (!transfers || transfers.length === 0) return null
                
                const inCount = transfers.filter((t: any) => t.direction === 'in').length
                const outCount = transfers.filter((t: any) => t.direction === 'out').length
                const loanCount = transfers.filter((t: any) => 
                  t.onLoan || t.fee?.feeText === 'on loan' || t.type?.toLowerCase().includes('loan')
                ).length
                
                return (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{inCount}</p>
                        <p className="text-xs text-gray-500">영입</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{outCount}</p>
                        <p className="text-xs text-gray-500">방출</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{loanCount}</p>
                        <p className="text-xs text-gray-500">임대</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </GlassCard>
          </TabsContent>
          
          {/* 커뮤니티 탭 */}
          <TabsContent value="community" className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
            {/* 글쓰기 영역 */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">새 글 작성</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="팀에 대한 생각을 공유해주세요..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      if (newPostContent.trim()) {
                        onCreatePost({ content: newPostContent })
                        setNewPostContent('')
                      }
                    }}
                    disabled={!newPostContent.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    게시
                  </Button>
                </div>
              </div>
            </GlassCard>
            
            {/* 게시글 목록 */}
            <div className="space-y-4">
              {Array.isArray(teamPosts) && teamPosts.map((post: any) => (
                <GlassCard key={post.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.user?.avatar} />
                        <AvatarFallback>{post.user?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{post.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-primary">
                      <ThumbsUp className="w-4 h-4" />
                      {post.likes || 0}
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary">
                      <MessageSquare className="w-4 h-4" />
                      {post.comments?.length || 0}
                    </button>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views || 0}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}