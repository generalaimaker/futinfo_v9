'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, Heart, Share2, MoreHorizontal, Info,
  Target, TrendingUp, Shield, Activity, Trophy, Star,
  MapPin, Calendar, Ruler, Weight, Flag, Users, Award,
  BarChart3, Zap, Circle, ChevronRight, Clock, Percent,
  Hash, ArrowUp, ArrowDown, Minus, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useFavorites } from '@/lib/services/favorites'

interface ApplePlayerProfileProps {
  playerProfile: any
  playerId: number
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
function StatCard({ icon: Icon, label, value, color, trend, className }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassCard className={cn("p-6", className)}>
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
          {trend && (
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
        </div>
      </GlassCard>
    </motion.div>
  )
}

// 능력치 바 컴포넌트
function SkillBar({ label, value, maxValue = 100, color = "blue" }: any) {
  const percentage = (value / maxValue) * 100
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            color === 'blue' && "bg-gradient-to-r from-blue-400 to-blue-600",
            color === 'green' && "bg-gradient-to-r from-green-400 to-green-600",
            color === 'yellow' && "bg-gradient-to-r from-yellow-400 to-yellow-600",
            color === 'red' && "bg-gradient-to-r from-red-400 to-red-600",
            color === 'purple' && "bg-gradient-to-r from-purple-400 to-purple-600"
          )}
        />
      </div>
    </div>
  )
}

export function ApplePlayerProfile({ playerProfile, playerId }: ApplePlayerProfileProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isScrolled, setIsScrolled] = useState(false)
  const { toast } = useToast()
  const { addPlayer, removePlayer, isPlayerFavorite } = useFavorites()
  
  // 데이터 검증
  if (!playerProfile || !playerProfile.player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">선수 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }
  
  const { player, statistics } = playerProfile
  const currentStats = statistics?.[0] // 현재 시즌 통계
  
  // 스크롤 이벤트 리스너 추가
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // 나이 계산
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }
  
  // 즐겨찾기 토글
  const handleFavoriteToggle = () => {
    const isFavorite = isPlayerFavorite(playerId)
    
    if (isFavorite) {
      removePlayer(playerId)
      toast({
        title: "즐겨찾기에서 제거됨",
        description: `${player.firstname && player.lastname ? `${player.firstname} ${player.lastname}` : player.name}이(가) 즐겨찾기에서 제거되었습니다.`
      })
    } else {
      addPlayer({
        id: playerId,
        name: player.firstname && player.lastname ? `${player.firstname} ${player.lastname}` : player.name,
        photo: player.photo,
        teamId: currentStats?.team.id,
        teamName: currentStats?.team.name,
        position: currentStats?.games.position
      })
      toast({
        title: "즐겨찾기에 추가됨",
        description: `${player.firstname && player.lastname ? `${player.firstname} ${player.lastname}` : player.name}이(가) 즐겨찾기에 추가되었습니다.`
      })
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 헤더 */}
      <motion.header 
        className={cn(
          "fixed top-0 left-0 lg:left-64 right-0 z-40",
          "transition-all duration-500",
          isScrolled 
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-lg"
            : "bg-transparent"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/players">
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
                  src={player.photo}
                  alt={player.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="font-semibold">{player.firstname && player.lastname ? `${player.firstname} ${player.lastname}` : player.name}</span>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavoriteToggle}
              className={cn(
                "rounded-xl transition-all",
                isScrolled 
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "bg-white/20 backdrop-blur-xl",
                isPlayerFavorite(playerId) && "text-red-500"
              )}
            >
              <Heart className={cn(
                "w-5 h-5",
                isPlayerFavorite(playerId) && "fill-current"
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
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br",
            currentStats?.team.id === 33 && "from-red-500/10 via-transparent to-blue-500/10", // Man United
            currentStats?.team.id === 50 && "from-blue-400/10 via-transparent to-blue-600/10", // Man City
            !currentStats && "from-gray-400/10 via-transparent to-gray-600/10"
          )} />
        </div>
        
        <div className="relative container mx-auto px-6 py-12">
          <motion.div 
            className="flex flex-col md:flex-row items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* 선수 사진 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-primary/20 rounded-3xl blur-2xl" />
              <Image
                src={player.photo}
                alt={player.name}
                width={200}
                height={200}
                className="relative rounded-3xl shadow-2xl"
              />
              {player.injured && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
            </motion.div>
            
            {/* 선수 정보 */}
            <div className="flex-1 text-center md:text-left">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {player.firstname && player.lastname ? `${player.firstname} ${player.lastname}` : player.name}
              </motion.h1>
              
              {currentStats && (
                <motion.div 
                  className="flex flex-wrap items-center gap-4 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link href={`/teams/${currentStats.team.id}`}>
                    <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <Image
                        src={currentStats.team.logo}
                        alt={currentStats.team.name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                      <span className="text-lg font-semibold">{currentStats.team.name}</span>
                    </div>
                  </Link>
                  <Badge className="text-sm py-1 px-3">{currentStats.games.position}</Badge>
                  {currentStats.games.number && (
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      #{currentStats.games.number}
                    </Badge>
                  )}
                  {currentStats.games.captain && (
                    <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                      주장
                    </Badge>
                  )}
                </motion.div>
              )}
              
              <motion.div 
                className="flex flex-wrap gap-6 text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-gray-500" />
                  <span>{player.nationality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{calculateAge(player.birth.date)}세</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{player.birth.place}, {player.birth.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-gray-500" />
                  <span>{player.height}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-gray-500" />
                  <span>{player.weight}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* 주요 스탯 카드들 */}
      {currentStats && (
        <div className="container mx-auto px-6 -mt-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Target}
              label="득점"
              value={currentStats.goals.total || 0}
              color="blue"
              trend={5}
            />
            <StatCard
              icon={TrendingUp}
              label="도움"
              value={currentStats.goals.assists || 0}
              color="green"
              trend={-2}
            />
            <StatCard
              icon={Activity}
              label="출전"
              value={`${currentStats.games.appearences}경기`}
              color="purple"
              trend={0}
            />
            <StatCard
              icon={Star}
              label="평점"
              value={currentStats.games.rating ? parseFloat(currentStats.games.rating).toFixed(1) : '-'}
              color="yellow"
              trend={3}
            />
          </div>
        </div>
      )}
      
      {/* 탭 콘텐츠 */}
      <div className="container mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="stats">상세 통계</TabsTrigger>
            <TabsTrigger value="performance">퍼포먼스</TabsTrigger>
            <TabsTrigger value="career">경력</TabsTrigger>
          </TabsList>
          
          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 시즌 통계 */}
              {currentStats && (
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    시즌 통계
                  </h3>
                  <div className="space-y-4">
                    <SkillBar label="슈팅 정확도" value={currentStats.shots.on || 0} maxValue={currentStats.shots.total || 1} color="blue" />
                    <SkillBar label="패스 성공률" value={currentStats.passes.accuracy || 0} color="green" />
                    <SkillBar label="드리블 성공률" value={
                      currentStats.dribbles.attempts ? 
                      Math.round((currentStats.dribbles.success / currentStats.dribbles.attempts) * 100) : 0
                    } color="purple" />
                    <SkillBar label="공중볼 승률" value={
                      currentStats.duels.total ? 
                      Math.round((currentStats.duels.won / currentStats.duels.total) * 100) : 0
                    } color="yellow" />
                  </div>
                </GlassCard>
              )}
              
              {/* 최근 폼 */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  최근 폼
                </h3>
                <div className="flex gap-2 mb-4">
                  {[7.8, 8.2, 6.5, 7.0, 8.5].map((rating, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex-1 h-24 rounded-lg flex items-end justify-center pb-2",
                        rating >= 8 ? "bg-green-500/20" :
                        rating >= 7 ? "bg-blue-500/20" :
                        rating >= 6 ? "bg-yellow-500/20" :
                        "bg-red-500/20"
                      )}
                    >
                      <span className="text-xs font-bold">{rating}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">최근 5경기 평균: 7.6</p>
              </GlassCard>
            </div>
          </TabsContent>
          
          {/* 상세 통계 탭 */}
          <TabsContent value="stats" className="space-y-6">
            {currentStats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 공격 */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">공격</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 슈팅</span>
                      <span className="font-medium">{currentStats.shots.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">유효 슈팅</span>
                      <span className="font-medium">{currentStats.shots.on || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">골 전환율</span>
                      <span className="font-medium">
                        {currentStats.shots.total ? 
                          `${Math.round((currentStats.goals.total / currentStats.shots.total) * 100)}%` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">페널티 득점</span>
                      <span className="font-medium">
                        {currentStats.penalty.scored || 0} / {currentStats.penalty.won || 0}
                      </span>
                    </div>
                  </div>
                </GlassCard>
                
                {/* 패스 */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">패스</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">총 패스</span>
                      <span className="font-medium">{currentStats.passes.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">키 패스</span>
                      <span className="font-medium">{currentStats.passes.key || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">정확도</span>
                      <span className="font-medium">{currentStats.passes.accuracy || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">크로스</span>
                      <span className="font-medium">{currentStats.passes.total || 0}</span>
                    </div>
                  </div>
                </GlassCard>
                
                {/* 수비 */}
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4">수비</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">태클</span>
                      <span className="font-medium">{currentStats.tackles.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">인터셉트</span>
                      <span className="font-medium">{currentStats.tackles.interceptions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">파울</span>
                      <span className="font-medium">{currentStats.fouls.committed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">카드</span>
                      <span className="font-medium">
                        🟨 {currentStats.cards.yellow} 🟥 {currentStats.cards.red}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </TabsContent>
          
          {/* 퍼포먼스 탭 */}
          <TabsContent value="performance" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-6">포지션별 성과</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['FW', 'MF', 'DF', 'GK'].map((pos) => (
                  <div key={pos} className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{pos}</span>
                    </div>
                    <p className="text-sm text-gray-600">평점 7.5</p>
                  </div>
                ))}
              </div>
            </GlassCard>
            
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">히트맵</h3>
              <div className="aspect-[16/10] bg-gradient-to-b from-green-500/20 to-green-700/20 rounded-xl flex items-center justify-center">
                <p className="text-gray-500">히트맵 시각화</p>
              </div>
            </GlassCard>
          </TabsContent>
          
          {/* 경력 탭 */}
          <TabsContent value="career" className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">이적 기록</h3>
              <div className="space-y-4">
                {statistics.map((stat: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                      <Image
                        src={stat.team.logo}
                        alt={stat.team.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                      <div>
                        <p className="font-medium">{stat.team.name}</p>
                        <p className="text-sm text-gray-500">{stat.league.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{stat.league.season}</p>
                      <p className="text-sm text-gray-500">
                        {stat.games.appearences}경기 {stat.goals.total}골
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}