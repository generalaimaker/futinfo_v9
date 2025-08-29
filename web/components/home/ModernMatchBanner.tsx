'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Clock, MapPin, TrendingUp, Users, 
  ChevronLeft, ChevronRight, Sparkles, Flame,
  Activity, Timer, Calendar, Star, Zap
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFeaturedMatches } from '@/lib/hooks/useFeaturedMatches'
import { format, differenceInMinutes, isAfter } from 'date-fns'
import { ko } from 'date-fns/locale'

// League gradient themes
const LEAGUE_THEMES = {
  39: { // Premier League
    gradient: 'from-purple-600 via-violet-600 to-indigo-700',
    accent: 'bg-purple-500',
    glow: 'shadow-purple-500/50'
  },
  140: { // La Liga
    gradient: 'from-orange-500 via-red-500 to-red-600',
    accent: 'bg-orange-500',
    glow: 'shadow-orange-500/50'
  },
  135: { // Serie A
    gradient: 'from-green-600 via-emerald-600 to-teal-700',
    accent: 'bg-green-500',
    glow: 'shadow-green-500/50'
  },
  78: { // Bundesliga
    gradient: 'from-red-600 via-red-700 to-gray-800',
    accent: 'bg-red-500',
    glow: 'shadow-red-500/50'
  },
  61: { // Ligue 1
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    accent: 'bg-blue-500',
    glow: 'shadow-blue-500/50'
  },
  2: { // Champions League
    gradient: 'from-slate-800 via-blue-900 to-slate-900',
    accent: 'bg-blue-600',
    glow: 'shadow-blue-600/50'
  },
  default: {
    gradient: 'from-gray-700 via-gray-800 to-gray-900',
    accent: 'bg-gray-600',
    glow: 'shadow-gray-600/50'
  }
}

// Get theme for league
function getLeagueTheme(leagueId: number) {
  return LEAGUE_THEMES[leagueId as keyof typeof LEAGUE_THEMES] || LEAGUE_THEMES.default
}

// Main match card component
function MainMatchCard({ match, isActive }: { match: any; isActive: boolean }) {
  const [timeLeft, setTimeLeft] = useState('')
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)
  const isFinished = match.fixture?.status?.short === 'FT'
  const matchDate = new Date(match.fixture.date)
  const theme = getLeagueTheme(match.league.id)

  useEffect(() => {
    if (!isLive && !isFinished) {
      const updateTime = () => {
        const now = new Date()
        const minutes = differenceInMinutes(matchDate, now)
        
        if (minutes < 0) {
          setTimeLeft('경기 시작')
        } else if (minutes < 60) {
          setTimeLeft(`${minutes}분 후`)
        } else if (minutes < 1440) {
          const hours = Math.floor(minutes / 60)
          setTimeLeft(`${hours}시간 후`)
        } else {
          const days = Math.floor(minutes / 1440)
          setTimeLeft(`${days}일 후`)
        }
      }
      
      updateTime()
      const timer = setInterval(updateTime, 60000)
      return () => clearInterval(timer)
    }
  }, [matchDate, isLive, isFinished])

  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full h-[400px] rounded-3xl overflow-hidden"
    >
      {/* Dynamic gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        theme.gradient
      )}>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Floating orbs animation */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
        </div>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-8">
        {/* Top section - League and status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "absolute inset-0 blur-xl",
                theme.accent,
                "opacity-50"
              )} />
              <Image
                src={match.league.logo}
                alt={match.league.name}
                width={40}
                height={40}
                className="relative rounded-lg bg-white/10 p-1"
              />
            </div>
            <div>
              <p className="text-white/90 font-medium">{match.league.name}</p>
              <p className="text-white/60 text-sm">{match.league.round}</p>
            </div>
          </div>

          {/* Status badge */}
          {isLive ? (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white font-bold text-sm">LIVE {match.fixture.status.elapsed}'</span>
            </motion.div>
          ) : (
            <div className="text-right">
              <p className="text-white text-2xl font-bold">
                {format(matchDate, 'HH:mm')}
              </p>
              <p className="text-white/70 text-sm">{timeLeft}</p>
            </div>
          )}
        </div>

        {/* Middle section - Teams */}
        <div className="flex items-center justify-center gap-8 my-8">
          {/* Home team */}
          <motion.div 
            className="flex flex-col items-center gap-3"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src={match.teams.home.logo}
                alt={match.teams.home.name}
                width={100}
                height={100}
                className="relative drop-shadow-2xl"
              />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{match.teams.home.name}</p>
              {(isLive || isFinished) && (
                <p className="text-white text-4xl font-bold mt-2">
                  {match.goals.home ?? 0}
                </p>
              )}
            </div>
          </motion.div>

          {/* VS Divider */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/40 text-2xl font-bold">VS</span>
            {isLive && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-0.5 bg-white/30"
              />
            )}
          </div>

          {/* Away team */}
          <motion.div 
            className="flex flex-col items-center gap-3"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src={match.teams.away.logo}
                alt={match.teams.away.name}
                width={100}
                height={100}
                className="relative drop-shadow-2xl"
              />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{match.teams.away.name}</p>
              {(isLive || isFinished) && (
                <p className="text-white text-4xl font-bold mt-2">
                  {match.goals.away ?? 0}
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom section - Venue and action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{match.fixture.venue?.name || 'Stadium'}</span>
          </div>
          
          <Link href={`/fixtures/${match.fixture.id}`}>
            <Button 
              className={cn(
                "bg-white/20 backdrop-blur-md border border-white/30",
                "hover:bg-white/30 text-white group"
              )}
            >
              <Activity className="w-4 h-4 mr-2" />
              경기 상세
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// Sub match card
function SubMatchCard({ match, index }: { match: any; index: number }) {
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)
  const matchDate = new Date(match.fixture.date)
  const theme = getLeagueTheme(match.league.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/fixtures/${match.fixture.id}`}>
        <Card className={cn(
          "relative overflow-hidden p-4 cursor-pointer",
          "bg-white/5 backdrop-blur-lg border-white/10",
          "hover:bg-white/10 transition-all duration-300",
          isLive && "border-red-500/50"
        )}>
          {/* Gradient accent */}
          <div className={cn(
            "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
            theme.gradient
          )} />

          {/* Content */}
          <div className="space-y-3">
            {/* League and time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={match.league.logo}
                  alt={match.league.name}
                  width={20}
                  height={20}
                  className="opacity-70"
                />
                <span className="text-xs text-gray-400">
                  {match.league.name}
                </span>
              </div>
              
              {isLive ? (
                <Badge variant="destructive" className="text-xs">
                  LIVE
                </Badge>
              ) : (
                <span className="text-xs text-gray-400">
                  {format(matchDate, 'HH:mm')}
                </span>
              )}
            </div>

            {/* Teams */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src={match.teams.home.logo}
                    alt={match.teams.home.name}
                    width={20}
                    height={20}
                  />
                  <span className="text-sm font-medium">
                    {match.teams.home.name}
                  </span>
                </div>
                {isLive && (
                  <span className="font-bold">{match.goals.home ?? 0}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image
                    src={match.teams.away.logo}
                    alt={match.teams.away.name}
                    width={20}
                    height={20}
                  />
                  <span className="text-sm font-medium">
                    {match.teams.away.name}
                  </span>
                </div>
                {isLive && (
                  <span className="font-bold">{match.goals.away ?? 0}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}

// Main banner component
export function ModernMatchBanner() {
  const { data: featuredMatches, isLoading } = useFeaturedMatches()
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Debug logging
  console.log('[ModernMatchBanner] Data:', {
    isLoading,
    featuredMatches: featuredMatches?.length || 0,
    matches: featuredMatches
  })

  // Auto-rotate main matches
  useEffect(() => {
    if (!featuredMatches || featuredMatches.length <= 1) return

    const mainMatches = featuredMatches.slice(0, 3)
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % mainMatches.length)
    }, 8000)

    return () => clearInterval(timer)
  }, [featuredMatches])

  if (isLoading) {
    return (
      <div className="w-full h-[400px] rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
    )
  }

  if (!featuredMatches || featuredMatches.length === 0) {
    return null
  }

  const mainMatches = featuredMatches.slice(0, 3)
  const subMatches = featuredMatches.slice(3, 7)

  return (
    <div className="space-y-6">
      {/* Main banner */}
      <div className="relative">
        {/* Navigation dots */}
        {mainMatches.length > 1 && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {mainMatches.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex 
                    ? "w-8 bg-white" 
                    : "bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        )}

        {/* Navigation arrows */}
        {mainMatches.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + mainMatches.length) % mainMatches.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % mainMatches.length)}
              className="absolute right-16 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Main match cards */}
        <AnimatePresence mode="wait">
          {mainMatches.map((match, index) => (
            <MainMatchCard
              key={match.fixture.id}
              match={match}
              isActive={index === currentIndex}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Sub matches */}
      {subMatches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-lg">다른 주요 경기</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subMatches.map((match, index) => (
              <SubMatchCard
                key={match.fixture.id}
                match={match}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}