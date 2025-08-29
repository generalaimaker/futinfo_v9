'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Star, Trophy, Zap, Clock, Activity, 
  ChevronRight, ChevronLeft, Calendar, MapPin, Bell,
  TrendingUp, Users, Shield, AlertCircle, Timer,
  Flame, Eye, Heart, Share2, Tv, Radio,
  BarChart3, Info, Play, Pause
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTodayFixtures, useLiveMatches } from '@/lib/hooks/useFootballData'
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

// 주요 대회 정의 (그라데이션 + 애니메이션 추가)
const MAJOR_COMPETITIONS = {
  2: { 
    name: 'Champions League', 
    shortName: 'UCL',
    icon: '⭐', 
    priority: 1, 
    gradient: 'from-indigo-600 via-purple-600 to-purple-700',
    glowColor: 'purple',
    pattern: 'bg-[url("/patterns/ucl.svg")]'
  },
  3: { 
    name: 'Europa League', 
    shortName: 'UEL',
    icon: '🔥', 
    priority: 2, 
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    glowColor: 'orange',
    pattern: 'bg-[url("/patterns/uel.svg")]'
  },
  39: { // Premier League
    name: 'Premier League', 
    shortName: 'EPL',
    icon: '🦁', 
    priority: 4, 
    gradient: 'from-purple-600 via-pink-600 to-purple-700',
    glowColor: 'purple',
    pattern: 'bg-[url("/patterns/epl.svg")]'
  },
  140: { // La Liga
    name: 'La Liga', 
    shortName: 'LAL',
    icon: '🇪🇸', 
    priority: 4, 
    gradient: 'from-red-600 via-orange-600 to-yellow-600',
    glowColor: 'red',
    pattern: 'bg-[url("/patterns/laliga.svg")]'
  },
  135: { // Serie A
    name: 'Serie A', 
    shortName: 'SA',
    icon: '🇮🇹', 
    priority: 4, 
    gradient: 'from-blue-600 via-green-600 to-red-600',
    glowColor: 'green',
    pattern: 'bg-[url("/patterns/seriea.svg")]'
  },
  78: { // Bundesliga
    name: 'Bundesliga',
    shortName: 'BL',
    icon: '🇩🇪',
    priority: 4,
    gradient: 'from-red-600 via-gray-700 to-yellow-600',
    glowColor: 'red',
    pattern: 'bg-[url("/patterns/bundesliga.svg")]'
  },
  61: { // Ligue 1
    name: 'Ligue 1',
    shortName: 'L1',
    icon: '🇫🇷',
    priority: 4,
    gradient: 'from-blue-600 via-white to-red-600',
    glowColor: 'blue',
    pattern: 'bg-[url("/patterns/ligue1.svg")]'
  }
}

// 빅클럽 정의 (팀 컬러 + 패턴 추가)
const BIG_CLUBS = {
  // Premier League
  33: { name: 'Manchester United', rivalry: [40], color: '#DA020E', gradient: 'from-red-600 to-red-800', pattern: '⚡' },
  40: { name: 'Liverpool', rivalry: [33, 47], color: '#C8102E', gradient: 'from-red-500 to-red-700', pattern: '🔴' },
  50: { name: 'Manchester City', rivalry: [33], color: '#6CABDD', gradient: 'from-sky-400 to-blue-600', pattern: '🔵' },
  49: { name: 'Chelsea', rivalry: [42, 47], color: '#034694', gradient: 'from-blue-600 to-blue-800', pattern: '💙' },
  42: { name: 'Arsenal', rivalry: [47, 49], color: '#EF0107', gradient: 'from-red-500 to-red-600', pattern: '🔴' },
  47: { name: 'Tottenham', rivalry: [42, 49], color: '#132257', gradient: 'from-slate-700 to-slate-900', pattern: '⚪' },
  
  // La Liga
  541: { name: 'Real Madrid', rivalry: [529, 530], color: '#FFFFFF', gradient: 'from-gray-100 to-gray-300', pattern: '👑' },
  529: { name: 'Barcelona', rivalry: [541, 532], color: '#A50044', gradient: 'from-red-600 to-blue-700', pattern: '🔵🔴' },
  530: { name: 'Atletico Madrid', rivalry: [541, 529], color: '#CE3524', gradient: 'from-red-600 to-red-800', pattern: '🔴⚪' },
  
  // Serie A
  489: { name: 'AC Milan', rivalry: [505, 496], color: '#FB090B', gradient: 'from-red-600 to-black', pattern: '🔴⚫' },
  505: { name: 'Inter Milan', rivalry: [489, 496], color: '#0068A8', gradient: 'from-blue-600 to-black', pattern: '🔵⚫' },
  496: { name: 'Juventus', rivalry: [489, 505], color: '#000000', gradient: 'from-gray-800 to-black', pattern: '⚫⚪' },
  
  // Bundesliga
  157: { name: 'Bayern Munich', rivalry: [165], color: '#DC052D', gradient: 'from-red-600 to-red-800', pattern: '🔴' },
  165: { name: 'Borussia Dortmund', rivalry: [157], color: '#FDE100', gradient: 'from-yellow-400 to-yellow-600', pattern: '🟡' },
  
  // Ligue 1
  85: { name: 'PSG', rivalry: [81], color: '#004170', gradient: 'from-blue-700 to-red-600', pattern: '🔵🔴' },
  81: { name: 'Marseille', rivalry: [85], color: '#2FAEE0', gradient: 'from-sky-400 to-sky-600', pattern: '🔵' },
}

// 라이벌전 매칭
const RIVALRY_MATCHES = [
  { teams: [33, 40], name: 'North West Derby', intensity: 'LEGENDARY', emoji: '🔥' },
  { teams: [529, 541], name: 'El Clásico', intensity: 'LEGENDARY', emoji: '👑' },
  { teams: [42, 47], name: 'North London Derby', intensity: 'EPIC', emoji: '⚔️' },
  { teams: [489, 505], name: 'Derby della Madonnina', intensity: 'EPIC', emoji: '🏛️' },
  { teams: [85, 81], name: 'Le Classique', intensity: 'EPIC', emoji: '🇫🇷' },
  { teams: [157, 165], name: 'Der Klassiker', intensity: 'EPIC', emoji: '🇩🇪' },
  { teams: [49, 50], name: 'Manchester Derby', intensity: 'EPIC', emoji: '🏙️' },
  { teams: [40, 47], name: 'Merseyside Derby', intensity: 'HIGH', emoji: '⚓' },
]

// 파티클 효과 컴포넌트
function ParticleEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{ 
            x: Math.random() * 100 + '%',
            y: 100 + Math.random() * 20 + '%',
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: -20,
            x: Math.random() * 100 + '%',
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
}

// 메인 히어로 배너 컴포넌트
function MainMatchHero({ fixture, matchInfo }: any) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)
  const isFinished = fixture.fixture?.status?.short === 'FT'
  const fixtureDate = new Date(fixture.fixture.date)
  
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-100, 100], [5, -5])
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5])
  
  // 마우스 이동 추적
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }
  
  // 남은 시간 업데이트
  useEffect(() => {
    if (!isLive && !isFinished) {
      const timer = setInterval(() => {
        const now = new Date()
        const diff = fixtureDate.getTime() - now.getTime()
        const minutes = differenceInMinutes(fixtureDate, now)
        
        if (minutes < 0) {
          setTimeLeft('경기 시작됨')
        } else if (minutes < 60) {
          setTimeLeft(`${minutes}분 후`)
        } else if (minutes < 1440) {
          const hours = Math.floor(minutes / 60)
          setTimeLeft(`${hours}시간 후`)
        } else {
          const days = Math.floor(minutes / 1440)
          setTimeLeft(`${days}일 후`)
        }
      }, 60000)
      return () => clearInterval(timer)
    }
  }, [fixtureDate, isLive, isFinished])

  // 팀 정보
  const homeTeam = BIG_CLUBS[fixture.teams.home.id as keyof typeof BIG_CLUBS]
  const awayTeam = BIG_CLUBS[fixture.teams.away.id as keyof typeof BIG_CLUBS]
  const competition = MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS]
  const rivalry = RIVALRY_MATCHES.find(r => 
    r.teams.includes(fixture.teams.home.id) && 
    r.teams.includes(fixture.teams.away.id)
  )
  
  // 배경 그라데이션 결정
  const getBackgroundGradient = () => {
    if (rivalry?.intensity === 'LEGENDARY') {
      return 'from-red-600 via-orange-600 to-yellow-600'
    }
    if (rivalry) {
      return 'from-red-500 via-purple-600 to-blue-600'
    }
    if (competition) {
      return competition.gradient
    }
    return 'from-green-600 via-green-700 to-green-800'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative"
      >
        {/* 다층 배경 효과 */}
        <div className="absolute inset-0">
          {/* 그라데이션 베이스 */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-90",
            getBackgroundGradient()
          )} />
          
          {/* 패턴 오버레이 */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
          
          {/* 글로우 효과 */}
          {isLive && (
            <>
              <div className="absolute inset-0 bg-red-500 opacity-10 animate-pulse" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-shimmer" />
            </>
          )}
          
          {/* 파티클 효과 */}
          {(isLive || rivalry) && <ParticleEffect />}
        </div>
        
        <div className="relative p-6 md:p-10 text-white">
          {/* 상단 정보 바 */}
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-3">
              {/* 대회/매치 타입 배지 */}
              <div className="flex flex-wrap gap-2">
                {rivalry && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Badge className="bg-gradient-to-r from-red-500/30 to-orange-500/30 backdrop-blur-md border-red-400/50 text-white px-3 py-1.5">
                      <Flame className="w-4 h-4 mr-1.5 animate-pulse" />
                      <span className="font-bold">{rivalry.name}</span>
                      <span className="ml-1.5">{rivalry.emoji}</span>
                    </Badge>
                  </motion.div>
                )}
                {competition && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-white/20 backdrop-blur-md border-white/30 text-white px-3 py-1.5">
                      <span className="mr-1">{competition.icon}</span>
                      <span className="font-medium">{competition.name}</span>
                    </Badge>
                  </motion.div>
                )}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="bg-white/10 backdrop-blur-md border-white/20 text-white/90 px-3 py-1.5">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-sm">{fixture.fixture.venue?.name || fixture.league.name}</span>
                  </Badge>
                </motion.div>
              </div>
              
              {/* 리그 정보 */}
              <motion.div 
                className="flex items-center gap-3"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 blur-xl" />
                  <Image
                    src={fixture.league.logo}
                    alt={fixture.league.name}
                    width={32}
                    height={32}
                    className="relative object-contain"
                  />
                </div>
                <div>
                  <div className="text-white/90 text-sm font-medium">{fixture.league.name}</div>
                  <div className="text-white/60 text-xs">{fixture.league.round}</div>
                </div>
              </motion.div>
            </div>
            
            {/* 라이브/시간 상태 */}
            <motion.div 
              className="text-right"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {isLive ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-3xl font-bold tabular-nums">
                      {fixture.fixture.status.elapsed}'
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 rounded-full animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <span className="text-sm font-bold uppercase">Live</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-end text-sm">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">2.3M</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Tv className="w-4 h-4" />
                      <span className="font-medium">HD</span>
                    </span>
                  </div>
                </div>
              ) : isFinished ? (
                <Badge className="bg-gray-500/30 backdrop-blur-md border-gray-400/50 text-white px-4 py-2 text-base">
                  <Clock className="w-4 h-4 mr-2" />
                  종료
                </Badge>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl font-bold tabular-nums">
                    {format(fixtureDate, 'HH:mm')}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Timer className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white/70 font-medium">{timeLeft}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* 팀 정보 - 중앙 정렬 */}
          <div className="flex items-center justify-between gap-4 md:gap-8 my-8 md:my-12">
            {/* 홈팀 */}
            <motion.div 
              className="flex-1 flex flex-col items-center gap-4"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <motion.div 
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* 글로우 효과 */}
                <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* 팀 로고 */}
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <Image
                    src={fixture.teams.home.logo}
                    alt={fixture.teams.home.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
                
                {/* 팀 패턴 */}
                {homeTeam && (
                  <div className="absolute -bottom-2 -right-2 text-2xl">
                    {homeTeam.pattern}
                  </div>
                )}
              </motion.div>
              
              <div className="text-center space-y-1">
                <div className="text-lg md:text-xl font-bold">
                  {fixture.teams.home.name}
                </div>
                {(isLive || isFinished) && (
                  <motion.div 
                    className="text-5xl md:text-6xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    {fixture.goals.home ?? 0}
                  </motion.div>
                )}
                {homeTeam && (
                  <div className="text-xs text-white/60 uppercase tracking-wider">
                    Home
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* VS 또는 스코어 구분선 */}
            <div className="flex flex-col items-center gap-2">
              {isLive || isFinished ? (
                <motion.div 
                  className="text-2xl md:text-3xl font-bold text-white/80"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <div className="relative">
                    <span className="relative z-10">VS</span>
                    {isLive && (
                      <div className="absolute inset-0 bg-white/20 blur-xl animate-pulse" />
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  className="relative"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <div className="text-xl md:text-2xl font-bold text-white/60 relative z-10">
                    VS
                  </div>
                  <div className="absolute inset-0 bg-white/10 blur-2xl scale-150" />
                </motion.div>
              )}
              
              {/* 매치 통계 미니 버튼 */}
              {isLive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setShowStats(!showStats)}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* 원정팀 */}
            <motion.div 
              className="flex-1 flex flex-col items-center gap-4"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <motion.div 
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* 글로우 효과 */}
                <div className="absolute inset-0 bg-white/30 blur-3xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* 팀 로고 */}
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <Image
                    src={fixture.teams.away.logo}
                    alt={fixture.teams.away.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
                
                {/* 팀 패턴 */}
                {awayTeam && (
                  <div className="absolute -bottom-2 -right-2 text-2xl">
                    {awayTeam.pattern}
                  </div>
                )}
              </motion.div>
              
              <div className="text-center space-y-1">
                <div className="text-lg md:text-xl font-bold">
                  {fixture.teams.away.name}
                </div>
                {(isLive || isFinished) && (
                  <motion.div 
                    className="text-5xl md:text-6xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    {fixture.goals.away ?? 0}
                  </motion.div>
                )}
                {awayTeam && (
                  <div className="text-xs text-white/60 uppercase tracking-wider">
                    Away
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* 실시간 통계 (라이브 경기만) */}
          <AnimatePresence>
            {showStats && isLive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">65%</div>
                    <div className="text-xs text-white/70">점유율</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-xs text-white/70">슈팅</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-xs text-white/70">코너킥</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 하단 액션 버튼들 */}
          <motion.div 
            className="flex items-center justify-center gap-2 md:gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link href={`/fixtures/${fixture.fixture.id}`}>
              <Button 
                size="lg"
                className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white group"
              >
                <Activity className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                경기 상세
              </Button>
            </Link>
            
            <Button 
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 group"
            >
              <Bell className="w-4 h-4 mr-2 group-hover:animate-bounce" />
              알림
            </Button>
            
            <Button 
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10 group"
            >
              <TrendingUp className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              분석
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// 서브 매치 카드 (개선된 디자인)
function SubMatchCard({ fixture, type, index }: any) {
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)
  const isFinished = fixture.fixture?.status?.short === 'FT'
  const fixtureDate = new Date(fixture.fixture.date)
  const competition = MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS]
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className={cn(
          "relative p-4 rounded-2xl backdrop-blur-md transition-all cursor-pointer group",
          "bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-800/50 dark:to-gray-900/50",
          "border border-white/10 dark:border-gray-700/50",
          isLive && "border-red-400/50 shadow-lg shadow-red-500/20",
          !isLive && "hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/10"
        )}
      >
        {/* 배경 그라데이션 */}
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity",
          competition && `bg-gradient-to-br ${competition.gradient}`
        )} />
        
        {/* 라이브 인디케이터 */}
        {isLive && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-bold text-white">LIVE</span>
            </div>
          </div>
        )}
        
        {/* 경기 정보 */}
        <div className="relative space-y-3">
          {/* 리그 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {competition && (
                <span className="text-sm">{competition.icon}</span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {fixture.league.name}
              </span>
            </div>
            {!isLive && !isFinished && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(fixtureDate, 'HH:mm')}
              </span>
            )}
          </div>
          
          {/* 팀 정보 */}
          <div className="space-y-2">
            {/* 홈팀 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Image
                  src={fixture.teams.home.logo}
                  alt={fixture.teams.home.name}
                  width={20}
                  height={20}
                  className="object-contain flex-shrink-0"
                />
                <span className="text-sm font-medium truncate">
                  {fixture.teams.home.name}
                </span>
              </div>
              {(isLive || isFinished) && (
                <span className="font-bold text-lg ml-2">
                  {fixture.goals.home ?? 0}
                </span>
              )}
            </div>
            
            {/* 원정팀 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Image
                  src={fixture.teams.away.logo}
                  alt={fixture.teams.away.name}
                  width={20}
                  height={20}
                  className="object-contain flex-shrink-0"
                />
                <span className="text-sm font-medium truncate">
                  {fixture.teams.away.name}
                </span>
              </div>
              {(isLive || isFinished) && (
                <span className="font-bold text-lg ml-2">
                  {fixture.goals.away ?? 0}
                </span>
              )}
            </div>
          </div>
          
          {/* 하단 정보 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200/10 dark:border-gray-700/50">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {fixture.fixture.venue?.name}
            </span>
            {isLive ? (
              <span className="text-xs text-red-500 font-bold">
                {fixture.fixture.status.elapsed}'
              </span>
            ) : isFinished ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                종료
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                예정
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// 메인 컴포넌트
export function EnhancedBigMatchBanner() {
  const { matches: liveMatches } = useLiveMatches()
  const { fixtures: todayFixtures } = useTodayFixtures()
  const [selectedTab, setSelectedTab] = useState<'all' | 'live' | 'upcoming'>('all')
  const [currentMainIndex, setCurrentMainIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)

  // 빅매치 분류 및 우선순위 계산
  const bigMatches = useMemo(() => {
    const allMatches = [...liveMatches, ...todayFixtures]
    const uniqueMatches = allMatches.filter((match, index, self) =>
      index === self.findIndex((m) => m.fixture.id === match.fixture.id)
    )

    const bigMatchesData = uniqueMatches
      .map(fixture => {
        let type: 'rivalry' | 'big_club' | 'major_competition' = 'big_club'
        let priority = 50

        const homeId = fixture.teams.home.id
        const awayId = fixture.teams.away.id

        // 1. 라이벌전 확인 (최우선)
        const rivalry = RIVALRY_MATCHES.find(r => 
          (r.teams.includes(homeId) && r.teams.includes(awayId))
        )
        if (rivalry) {
          type = 'rivalry'
          priority = rivalry.intensity === 'LEGENDARY' ? 100 : 90
        }

        // 2. 주요 대회 확인
        if (MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS]) {
          type = 'major_competition'
          priority = Math.max(priority, 80)
        }

        // 3. 빅클럽 참여 확인
        const isBigClub = BIG_CLUBS[homeId as keyof typeof BIG_CLUBS] || 
                          BIG_CLUBS[awayId as keyof typeof BIG_CLUBS]
        if (isBigClub && type === 'big_club') {
          priority = 60
        }

        // 4. 실시간 경기에 보너스
        if (['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)) {
          priority += 20
        }

        // 빅매치 조건을 만족하는지 확인
        const isBigMatch = rivalry || 
          MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS] || 
          isBigClub

        return isBigMatch ? { fixture, type, priority } : null
      })
      .filter(Boolean)
      .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))

    return bigMatchesData as { fixture: any; type: string; priority: number }[]
  }, [liveMatches, todayFixtures])

  // 탭 필터링
  const filteredMatches = useMemo(() => {
    if (selectedTab === 'live') {
      return bigMatches.filter(m => 
        ['LIVE', '1H', '2H', 'HT'].includes(m.fixture.fixture?.status?.short)
      )
    }
    if (selectedTab === 'upcoming') {
      return bigMatches.filter(m => 
        m.fixture.fixture?.status?.short === 'NS'
      )
    }
    return bigMatches
  }, [bigMatches, selectedTab])

  // 자동 로테이션
  useEffect(() => {
    if (autoRotate && filteredMatches.length > 1) {
      const timer = setInterval(() => {
        setCurrentMainIndex(prev => (prev + 1) % Math.min(3, filteredMatches.length))
      }, 10000) // 10초마다 변경
      return () => clearInterval(timer)
    }
  }, [autoRotate, filteredMatches.length])

  if (bigMatches.length === 0) {
    return null
  }

  const mainMatches = filteredMatches.slice(0, 3)
  const mainMatch = mainMatches[currentMainIndex] || mainMatches[0]
  const subMatches = filteredMatches.slice(3, 7)

  return (
    <div className="space-y-6">
      {/* 메인 배너 섹션 */}
      {mainMatch && (
        <div className="relative">
          {/* 배너 네비게이션 (3개 이상일 때) */}
          {mainMatches.length > 1 && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {/* 인디케이터 */}
              <div className="flex gap-1.5">
                {mainMatches.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentMainIndex(index)
                      setAutoRotate(false)
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentMainIndex 
                        ? "w-8 bg-white" 
                        : "bg-white/40 hover:bg-white/60"
                    )}
                  />
                ))}
              </div>
              
              {/* 재생/일시정지 버튼 */}
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setAutoRotate(!autoRotate)}
              >
                {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          )}
          
          {/* 메인 히어로 배너 */}
          <MainMatchHero 
            fixture={mainMatch.fixture} 
            matchInfo={mainMatch}
          />
        </div>
      )}
      
      {/* 서브 매치들 */}
      {subMatches.length > 0 && (
        <div className="space-y-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <motion.h3 
              className="font-bold text-xl flex items-center gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                다른 주요 경기
              </span>
            </motion.h3>
            
            {/* 탭 필터 */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {['all', 'live', 'upcoming'].map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={selectedTab === tab ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab(tab as any)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md transition-all",
                    selectedTab === tab && "shadow-sm"
                  )}
                >
                  {tab === 'all' && '전체'}
                  {tab === 'live' && (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1.5" />
                      라이브
                    </>
                  )}
                  {tab === 'upcoming' && '예정'}
                </Button>
              ))}
            </div>
          </div>
          
          {/* 서브 매치 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {subMatches.map(({ fixture, type }, index) => (
                <SubMatchCard
                  key={fixture.fixture.id}
                  fixture={fixture}
                  type={type}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* 모든 경기 보기 링크 */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/fixtures">
          <Button 
            variant="outline" 
            size="lg"
            className="group border-2"
          >
            <Calendar className="w-4 h-4 mr-2" />
            모든 경기 일정 보기
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}