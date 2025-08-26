'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Users, Trophy, Flame, Star, Activity,
  TrendingUp, Calendar, Bell, BellOff, Share2,
  ChevronRight, Heart, Sparkles, Zap, Crown
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { FanLevel } from '@/lib/types/community'

interface TeamBoardHeaderProps {
  teamId: number
  teamName: string
  teamLogo: string
  teamColor?: string
  memberCount: number
  postCount: number
  todayPosts: number
  activeUsers: number
  userFanLevel?: FanLevel
  isFollowing: boolean
  nextMatch?: {
    opponent: string
    opponentLogo: string
    date: Date
    isHome: boolean
  }
  onFollow: () => void
  onStartQuiz: () => void
}

export function TeamBoardHeader({
  teamId,
  teamName,
  teamLogo,
  teamColor = 'from-blue-600 to-purple-600',
  memberCount,
  postCount,
  todayPosts,
  activeUsers,
  userFanLevel = FanLevel.NONE,
  isFollowing,
  nextMatch,
  onFollow,
  onStartQuiz
}: TeamBoardHeaderProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleFollow = () => {
    setIsAnimating(true)
    onFollow()
    setTimeout(() => setIsAnimating(false), 1000)
  }

  const getFanLevelBadge = () => {
    switch (userFanLevel) {
      case FanLevel.VIP:
        return {
          icon: <Crown className="w-4 h-4" />,
          label: 'VIP 팬',
          color: 'bg-gradient-to-r from-purple-600 to-pink-600'
        }
      case FanLevel.VERIFIED:
        return {
          icon: <Shield className="w-4 h-4" />,
          label: '인증된 팬',
          color: 'bg-gradient-to-r from-blue-600 to-cyan-600'
        }
      case FanLevel.BASIC:
        return {
          icon: <Star className="w-4 h-4" />,
          label: '일반 팬',
          color: 'bg-gradient-to-r from-green-600 to-emerald-600'
        }
      default:
        return null
    }
  }

  const fanLevelBadge = getFanLevelBadge()
  const matchCountdown = nextMatch ? 
    Math.floor((nextMatch.date.getTime() - currentTime.getTime()) / 1000 / 60 / 60) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Background with Team Colors */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-10 rounded-3xl",
        teamColor
      )} />
      
      <Card className="relative overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative p-8">
          {/* Top Section */}
          <div className="flex items-start justify-between mb-8">
            {/* Team Info */}
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-700 p-2 shadow-lg">
                  <img src={teamLogo} alt={teamName} className="w-full h-full object-contain" />
                </div>
                {/* Activity Indicator */}
                <div className="absolute -top-2 -right-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
                    <div className="relative bg-green-500 rounded-full p-1">
                      <Activity className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {teamName} 팬 게시판
                </h1>
                <div className="flex items-center gap-3">
                  {fanLevelBadge && (
                    <Badge className={cn("text-white", fanLevelBadge.color)}>
                      {fanLevelBadge.icon}
                      <span className="ml-1">{fanLevelBadge.label}</span>
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-mono">
                    <Users className="w-3 h-3 mr-1" />
                    {memberCount.toLocaleString()} 팬
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Activity className="w-3 h-3 mr-1" />
                    {activeUsers} 접속중
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {userFanLevel === FanLevel.NONE && (
                <Button
                  onClick={onStartQuiz}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  팬 인증하기
                </Button>
              )}
              
              <AnimatePresence>
                <motion.div
                  animate={isAnimating ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                >
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <BellOff className="w-4 h-4 mr-2" />
                        알림 끄기
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        알림 받기
                      </>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>

              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              icon={<Trophy className="w-5 h-5 text-yellow-500" />}
              label="전체 게시글"
              value={postCount.toLocaleString()}
              trend="+12%"
            />
            <StatsCard
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              label="오늘 게시글"
              value={todayPosts}
              trend="+24%"
              highlight
            />
            <StatsCard
              icon={<Users className="w-5 h-5 text-blue-500" />}
              label="활성 팬"
              value={`${Math.round((activeUsers / memberCount) * 100)}%`}
            />
            <StatsCard
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              label="팬 랭킹"
              value="#3"
              badge="상승"
            />
          </div>

          {/* Next Match Card */}
          {nextMatch && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        다음 경기
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={teamLogo} alt={teamName} className="w-8 h-8" />
                      <span className="font-bold text-gray-900 dark:text-white">VS</span>
                      <img src={nextMatch.opponentLogo} alt={nextMatch.opponent} className="w-8 h-8" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {nextMatch.opponent}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {matchCountdown > 0 && matchCountdown < 48 && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                        <Zap className="w-3 h-3 mr-1" />
                        {matchCountdown}시간 후
                      </Badge>
                    )}
                    <Button size="sm" variant="outline">
                      매치데이 입장
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Hot Topics */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                인기 토픽
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['#승리', '#MOTM', '#전술분석', '#이적루머', '#라인업예상'].map((topic) => (
                <Badge
                  key={topic}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// Stats Card Component
function StatsCard({ icon, label, value, trend, badge, highlight }: any) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all",
      highlight 
        ? "border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-800" 
        : "border-gray-200 dark:border-gray-700"
    )}>
      <div className="flex items-start justify-between mb-2">
        {icon}
        {badge && (
          <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {label}
      </p>
      {trend && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          {trend}
        </p>
      )}
    </div>
  )
}