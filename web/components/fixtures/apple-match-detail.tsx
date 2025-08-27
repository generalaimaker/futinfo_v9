'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  ChevronLeft, Share2, Heart, Bell, MoreHorizontal,
  Activity, Users, BarChart3, Trophy, Clock, MapPin,
  TrendingUp, Shield, Target, Zap, Info, Calendar,
  ChevronDown, Star, Circle, ArrowUp, ArrowDown,
  RefreshCw, Wifi, WifiOff, Timer, Flag, Percent,
  Eye, MessageSquare, ThumbsUp, Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LineupHorizontal } from './lineup-horizontal'
import MatchStatistics from './match-statistics'
import { EventsTimeline } from './events-timeline'
import { H2HSimple } from './h2h-simple'
import { formatMatchTime, formatRelativeTime, formatVenue } from '@/lib/utils/timezone'
import { LiveMatchPulse, LiveStatsComparison, LiveMatchTimeline } from './live-match-pulse'
import { MatchPreviewComplete } from './match-preview-complete'
import { LeagueStandingsMini } from './league-standings-mini'

interface AppleMatchDetailProps {
  fixture: any
  isLive?: boolean
  onRefresh?: () => void
  onBack?: () => void
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

// 실시간 상태 인디케이터
function LiveIndicator({ status, elapsed }: any) {
  const isLive = ['1H', '2H', 'ET', 'HT'].includes(status)
  const isHalfTime = status === 'HT'
  
  if (!isLive) return null
  
  return (
    <motion.div 
      className="absolute top-4 right-4 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", delay: 0.2 }}
    >
      <div className="relative">
        <motion.div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "backdrop-blur-xl border",
            isHalfTime 
              ? "bg-orange-500/20 border-orange-500/30 text-orange-600"
              : "bg-red-500/20 border-red-500/30 text-red-600"
          )}
          animate={!isHalfTime ? { 
            scale: [1, 1.05, 1],
            opacity: [0.9, 1, 0.9]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {!isHalfTime && (
            <motion.div
              className="w-2 h-2 bg-red-500 rounded-full"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <span className="text-sm font-bold">
            {isHalfTime ? 'HALF TIME' : `LIVE ${elapsed}'`}
          </span>
          <Wifi className="w-4 h-4" />
        </motion.div>
        
        {/* 글로우 효과 */}
        {!isHalfTime && (
          <motion.div
            className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  )
}

// Apple 스타일 헤더
function AppleHeader({ fixture, onBack, isScrolled }: any) {
  return (
    <motion.header 
      className={cn(
        "fixed top-0 left-0 lg:left-64 right-0 z-40",
        "transition-all duration-500",
        isScrolled 
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl"
          : "bg-transparent"
      )}
    >
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className={cn(
              "rounded-xl transition-all",
              isScrolled 
                ? "bg-gray-100 dark:bg-gray-800"
                : "bg-white/20 backdrop-blur-xl"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          {isScrolled && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-2">
                <Link href={`/teams/${fixture.teams.home.id}`}>
                  <Image
                    src={fixture.teams.home.logo}
                    alt=""
                    width={24}
                    height={24}
                    className="object-contain cursor-pointer hover:scale-110 transition-transform"
                  />
                </Link>
                <span className="font-medium">vs</span>
                <Link href={`/teams/${fixture.teams.away.id}`}>
                  <Image
                    src={fixture.teams.away.logo}
                    alt=""
                    width={24}
                    height={24}
                    className="object-contain cursor-pointer hover:scale-110 transition-transform"
                  />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
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
            <Bell className="w-5 h-5" />
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
  )
}

// 히어로 섹션 (스코어보드)
function HeroSection({ fixture, isLive }: any) {
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)
  const isUpcoming = ['TBD', 'NS'].includes(fixture.fixture.status.short)
  
  return (
    <div className="relative min-h-[500px] overflow-hidden">
      {/* 배경 그라데이션 - 투명도 높여서 더 깔끔하게 */}
      <div className="absolute inset-0">
        <div className={cn(
          "absolute inset-0 transition-all duration-1000",
          isLive 
            ? "bg-gradient-to-br from-red-600/10 via-orange-500/5 to-transparent"
            : "bg-gradient-to-br from-blue-600/10 via-indigo-500/5 to-transparent"
        )} />
      </div>
      
      {/* 콘텐츠 */}
      <div className="relative pt-20 pb-12 px-6">
        {/* 리그 정보 - 위치 위로, 크기 증가 */}
        <motion.div 
          className="flex items-center justify-center gap-3 mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Image
            src={fixture.league.logo}
            alt={fixture.league.name}
            width={40}
            height={40}
            className="object-contain"
          />
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {fixture.league.name}
            </p>
            <p className="text-sm text-gray-500">{fixture.league.round}</p>
          </div>
        </motion.div>
        
        {/* 팀 & 스코어 */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 items-center">
            {/* 홈팀 */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* 경기 종료 후에만 Winner 표시 - 로고 위에 배치 */}
              {isFinished && fixture.teams.home.winner && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                  className="inline-flex items-center gap-1 px-3 py-1 mb-4 rounded-full bg-green-500/20 text-green-600"
                >
                  <span className="text-sm font-bold">Winner</span>
                </motion.div>
              )}
              <Link href={`/teams/${fixture.teams.home.id}`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                >
                  <div className="w-[140px] h-[140px] mx-auto mb-4 flex items-center justify-center">
                    <Image
                      src={fixture.teams.home.logo}
                      alt={fixture.teams.home.name}
                      width={140}
                      height={140}
                      className="object-contain max-h-[140px]"
                    />
                  </div>
                </motion.div>
              </Link>
              <Link href={`/teams/${fixture.teams.home.id}`}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-primary transition-colors cursor-pointer">
                  {fixture.teams.home.name}
                </h2>
              </Link>
              {/* 홈팀 득점자 표시 */}
              {fixture.events && (
                <div className="mt-2 space-y-1">
                  {fixture.events
                    .filter((e: any) => 
                      e.type === 'Goal' && 
                      e.team.id === fixture.teams.home.id &&
                      e.detail !== 'Missed Penalty'
                    )
                    .map((goal: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1"
                      >
                        <span>⚽</span>
                        <span className="font-medium">{goal.player?.name || 'Unknown'}</span>
                        <span className="text-gray-400">{goal.time.elapsed}'</span>
                        {goal.detail === 'Penalty' && <span className="text-orange-500">(P)</span>}
                        {goal.detail === 'Own Goal' && <span className="text-red-500">(OG)</span>}
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>
            
            {/* 스코어 */}
            <div className="text-center">
              {isUpcoming ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-8 py-6"
                >
                  <Clock className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatMatchTime(fixture.fixture.date)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatRelativeTime(fixture.fixture.date)}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-8 py-6"
                >
                  <div className="flex items-center justify-center gap-4">
                      <motion.span 
                        className={cn(
                          "text-6xl font-bold transition-colors",
                          fixture.goals.home > fixture.goals.away 
                            ? "text-green-500" 
                            : fixture.goals.home < fixture.goals.away
                            ? "text-gray-400"
                            : "text-gray-900 dark:text-white"
                        )}
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {fixture.goals.home ?? 0}
                      </motion.span>
                      <span className="text-3xl text-gray-400">:</span>
                      <motion.span 
                        className={cn(
                          "text-6xl font-bold transition-colors",
                          fixture.goals.away > fixture.goals.home 
                            ? "text-green-500" 
                            : fixture.goals.away < fixture.goals.home
                            ? "text-gray-400"
                            : "text-gray-900 dark:text-white"
                        )}
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {fixture.goals.away ?? 0}
                      </motion.span>
                    </div>
                    
                    {fixture.score.penalty.home !== null && (
                      <motion.div 
                        className="mt-3 text-sm text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        Penalties ({fixture.score.penalty.home} - {fixture.score.penalty.away})
                      </motion.div>
                    )}
                    
                    {isFinished && (
                      <motion.div 
                        className="mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <span className="px-3 py-1 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400">
                          Full Time
                        </span>
                      </motion.div>
                    )}
                </motion.div>
              )}
            </div>
            
            {/* 원정팀 */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* 경기 종료 후에만 Winner 표시 - 로고 위에 배치 */}
              {isFinished && fixture.teams.away.winner && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                  className="inline-flex items-center gap-1 px-3 py-1 mb-4 rounded-full bg-green-500/20 text-green-600"
                >
                  <span className="text-sm font-bold">Winner</span>
                </motion.div>
              )}
              <Link href={`/teams/${fixture.teams.away.id}`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                >
                  <div className="w-[140px] h-[140px] mx-auto mb-4 flex items-center justify-center">
                    <Image
                      src={fixture.teams.away.logo}
                      alt={fixture.teams.away.name}
                      width={140}
                      height={140}
                      className="object-contain max-h-[140px]"
                    />
                  </div>
                </motion.div>
              </Link>
              <Link href={`/teams/${fixture.teams.away.id}`}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-primary transition-colors cursor-pointer">
                  {fixture.teams.away.name}
                </h2>
              </Link>
              {/* 원정팀 득점자 표시 */}
              {fixture.events && (
                <div className="mt-2 space-y-1">
                  {fixture.events
                    .filter((e: any) => 
                      e.type === 'Goal' && 
                      e.team.id === fixture.teams.away.id &&
                      e.detail !== 'Missed Penalty'
                    )
                    .map((goal: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1"
                      >
                        <span>⚽</span>
                        <span className="font-medium">{goal.player?.name || 'Unknown'}</span>
                        <span className="text-gray-400">{goal.time.elapsed}'</span>
                        {goal.detail === 'Penalty' && <span className="text-orange-500">(P)</span>}
                        {goal.detail === 'Own Goal' && <span className="text-red-500">(OG)</span>}
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
        
        {/* 경기장 및 주심 정보 */}
        <motion.div 
          className="text-center mt-8 space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatVenue(fixture.fixture.venue)}
            </span>
          </div>
          
          {fixture.fixture.referee && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                주심: {fixture.fixture.referee}
              </span>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* 라이브 인디케이터 */}
      <LiveIndicator 
        status={fixture.fixture.status.short} 
        elapsed={fixture.fixture.status.elapsed}
      />
    </div>
  )
}

// 실시간 통계 카드
function LiveStatsCard({ icon: Icon, label, value, trend, color = "blue" }: any) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600",
    purple: "from-purple-500 to-purple-600"
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard className="p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br",
            colors[color]
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend > 0 
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </GlassCard>
    </motion.div>
  )
}

// 실시간 이벤트 피드
function LiveEventsFeed({ events, teams, isLive, isFinished }: any) {
  if (!events || events.length === 0) return null
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {isLive ? 'Live Events' : 'Events'}
        </h3>
        {isLive ? (
          <div className="flex items-center gap-2">
            <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
            <span className="text-sm text-red-500 font-medium">LIVE</span>
          </div>
        ) : isFinished ? (
          <span className="text-sm text-gray-500 font-medium">FT</span>
        ) : null}
      </div>
      
      <div className="space-y-4">
        {events.map((event: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="text-sm font-bold text-gray-500 w-12 text-center">
              {event.time.elapsed}'
            </div>
            
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg",
              event.type === 'Goal' && "bg-green-100 dark:bg-green-900/30",
              event.type === 'Card' && event.detail === 'Yellow Card' && "bg-yellow-100 dark:bg-yellow-900/30",
              event.type === 'Card' && event.detail === 'Red Card' && "bg-red-100 dark:bg-red-900/30",
              event.type === 'subst' && "bg-blue-100 dark:bg-blue-900/30"
            )}>
              {event.type === 'Goal' && '⚽'}
              {event.type === 'Card' && event.detail === 'Yellow Card' && '🟨'}
              {event.type === 'Card' && event.detail === 'Red Card' && '🟥'}
              {event.type === 'subst' && '🔄'}
            </div>
            
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {event.player?.name || 'Unknown Player'}
              </p>
              {event.assist?.name && (
                <p className="text-xs text-gray-500">Assist: {event.assist.name}</p>
              )}
            </div>
            
            <Image
              src={event.team.id === teams.home.id ? teams.home.logo : teams.away.logo}
              alt=""
              width={24}
              height={24}
              className="object-contain"
            />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

// 메인 컴포넌트
export function AppleMatchDetail({ 
  fixture, 
  isLive = false, 
  onRefresh, 
  onBack 
}: AppleMatchDetailProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // 실시간 업데이트 시간 추적
  useEffect(() => {
    if (isLive && onRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isLive, onRefresh])
  
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)
  const isUpcoming = ['TBD', 'NS'].includes(fixture.fixture.status.short)
  
  // 실시간 통계 계산
  const liveStats = useMemo(() => {
    if (!fixture.statistics || fixture.statistics.length === 0) return null
    
    const homeStats = fixture.statistics[0]?.statistics || []
    const awayStats = fixture.statistics[1]?.statistics || []
    
    const getStat = (type: string) => {
      const homeValue = homeStats.find((s: any) => s.type === type)?.value || 0
      const awayValue = awayStats.find((s: any) => s.type === type)?.value || 0
      
      // Ball Possession의 경우 % 제거
      if (type === 'Ball Possession') {
        const home = typeof homeValue === 'string' ? parseInt(homeValue.replace('%', '')) : homeValue
        const away = typeof awayValue === 'string' ? parseInt(awayValue.replace('%', '')) : awayValue
        return { home, away }
      }
      
      return { 
        home: typeof homeValue === 'string' ? parseInt(homeValue) || 0 : homeValue,
        away: typeof awayValue === 'string' ? parseInt(awayValue) || 0 : awayValue
      }
    }
    
    return {
      possession: getStat('Ball Possession'),
      shots: getStat('Total Shots'),
      shotsOnGoal: getStat('Shots on Goal'),
      corners: getStat('Corner Kicks'),
      fouls: getStat('Fouls'),
      yellowCards: getStat('Yellow Cards'),
      redCards: getStat('Red Cards'),
      passes: getStat('Total passes')
    }
  }, [fixture.statistics])
  
  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50/50 dark:bg-gray-950">
      {/* Apple 스타일 헤더 */}
      <AppleHeader 
        fixture={fixture}
        onBack={onBack || (() => window.history.back())}
        isScrolled={isScrolled}
      />
      
      {/* 히어로 섹션 */}
      <HeroSection fixture={fixture} isLive={isLive} />
      
      {/* 메인 콘텐츠 */}
      <div className="px-6 pb-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* 실시간 새로고침 바 */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        실시간 업데이트 중
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      마지막 업데이트: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                  <Button
                    onClick={onRefresh}
                    size="sm"
                    variant="ghost"
                    className="rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    새로고침
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
          
          {/* 실시간 타임라인 */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Match Progress</h3>
                <LiveMatchTimeline fixture={fixture} />
              </GlassCard>
            </motion.div>
          )}
          
          {/* 라인업 - Match Progress 바로 아래에 위치 */}
          {fixture.lineups && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <GlassCard className="p-6">
                <LineupHorizontal
                  lineups={fixture.lineups}
                  events={fixture.events}
                  fixture={fixture}
                />
              </GlassCard>
            </motion.div>
          )}
          
          {/* 경기 완료 후 상세 통계 */}
          {isFinished && fixture.statistics && fixture.statistics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <MatchStatistics
                statistics={fixture.statistics}
                fixture={fixture}
              />
            </motion.div>
          )}
          
          {/* 경기 완료 후 리그 순위 */}
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    경기 후 리그 순위
                  </h3>
                </div>
                <LeagueStandingsMini
                  leagueId={fixture.league.id}
                  season={fixture.league.season || new Date().getFullYear()}
                  homeTeamId={fixture.teams.home.id}
                  awayTeamId={fixture.teams.away.id}
                />
              </GlassCard>
            </motion.div>
          )}
          
          {/* 실시간 통계 그리드 */}
          {liveStats && (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <LiveStatsCard
                icon={Percent}
                label="Ball Possession"
                value={`${liveStats.possession.home}% - ${liveStats.possession.away}%`}
                color="blue"
              />
              <LiveStatsCard
                icon={Target}
                label="Shots on Goal"
                value={`${liveStats.shotsOnGoal.home} - ${liveStats.shotsOnGoal.away}`}
                color="green"
              />
              <LiveStatsCard
                icon={Flag}
                label="Corners"
                value={`${liveStats.corners.home} - ${liveStats.corners.away}`}
                color="yellow"
              />
              <LiveStatsCard
                icon={Activity}
                label="Total Passes"
                value={`${liveStats.passes.home} - ${liveStats.passes.away}`}
                color="purple"
              />
            </motion.div>
          )}
          
          {/* 예정 경기 상세 정보 */}
          {isUpcoming && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <MatchPreviewComplete fixture={fixture} />
            </motion.div>
          )}
          
          {/* 메인 콘텐츠 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 라이브 이벤트 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 이벤트 피드 */}
              {fixture.events && fixture.events.length > 0 && (
                <LiveEventsFeed 
                  events={fixture.events} 
                  teams={fixture.teams} 
                  isLive={isLive}
                  isFinished={isFinished}
                />
              )}
            </div>
            
            {/* 오른쪽: 상세 정보 */}
            <div className="space-y-6">
              {/* 실시간 펄스 */}
              {isLive && (
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Live Pulse
                  </h3>
                  <LiveMatchPulse fixture={fixture} />
                </GlassCard>
              )}
              
              {/* 실시간 통계 비교 */}
              {isLive && fixture.statistics && fixture.statistics.length > 0 && (
                <GlassCard className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Live Statistics
                  </h3>
                  <LiveStatsComparison fixture={fixture} />
                </GlassCard>
              )}
            </div>
          </div>
          
          {/* 하단 추가 정보 그리드 */}
          {!isUpcoming && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* 팀 폼 */}
              <GlassCard className="p-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                  Recent Form
                </h3>
                <div className="space-y-3">
                  {/* 홈팀 폼 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Image
                        src={fixture.teams.home.logo}
                        alt=""
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                      <span className="text-xs font-medium">{fixture.teams.home.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {['W', 'W', 'D', 'L', 'W'].map((result, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center",
                            result === 'W' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                            result === 'D' && "bg-gray-100 text-gray-600 dark:bg-gray-800",
                            result === 'L' && "bg-red-100 text-red-600 dark:bg-red-900/30"
                          )}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 원정팀 폼 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Image
                        src={fixture.teams.away.logo}
                        alt=""
                        width={18}
                        height={18}
                        className="object-contain"
                      />
                      <span className="text-xs font-medium">{fixture.teams.away.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {['L', 'W', 'W', 'W', 'D'].map((result, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center",
                            result === 'W' && "bg-green-100 text-green-600 dark:bg-green-900/30",
                            result === 'D' && "bg-gray-100 text-gray-600 dark:bg-gray-800",
                            result === 'L' && "bg-red-100 text-red-600 dark:bg-red-900/30"
                          )}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
              
              {/* 팬 인터랙션 */}
              <GlassCard className="p-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                  Fan Zone
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium">Live Chat</span>
                    </div>
                    <span className="text-xs text-gray-500">2.3k online</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium">Predictions</span>
                    </div>
                    <span className="text-xs text-gray-500">87% Home</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium">Heat Map</span>
                    </div>
                    <span className="text-xs text-gray-500">View</span>
                  </button>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}