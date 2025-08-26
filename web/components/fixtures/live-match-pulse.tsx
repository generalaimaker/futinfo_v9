'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, TrendingUp, Users, BarChart3, 
  Zap, Target, Shield, Flag, Timer
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveMatchPulseProps {
  fixture: any
  className?: string
}

// 실시간 펄스 애니메이션 컴포넌트
export function LiveMatchPulse({ fixture, className }: LiveMatchPulseProps) {
  const [pulseData, setPulseData] = useState<any[]>([])
  const [momentum, setMomentum] = useState<'home' | 'away' | 'neutral'>('neutral')
  
  // 모멘텀 계산
  useEffect(() => {
    if (!fixture.statistics || fixture.statistics.length === 0) return
    
    const homeStats = fixture.statistics[0]?.statistics || []
    const awayStats = fixture.statistics[1]?.statistics || []
    
    // 점유율 기반 모멘텀
    const homePossession = parseInt(
      homeStats.find((s: any) => s.type === 'Ball Possession')?.value?.replace('%', '') || '50'
    )
    const awayPossession = 100 - homePossession
    
    // 슈팅 기반 모멘텀
    const homeShots = parseInt(homeStats.find((s: any) => s.type === 'Total Shots')?.value || '0')
    const awayShots = parseInt(awayStats.find((s: any) => s.type === 'Total Shots')?.value || '0')
    
    // 모멘텀 계산
    const homeMomentum = homePossession * 0.3 + (homeShots * 10)
    const awayMomentum = awayPossession * 0.3 + (awayShots * 10)
    
    if (homeMomentum > awayMomentum * 1.2) {
      setMomentum('home')
    } else if (awayMomentum > homeMomentum * 1.2) {
      setMomentum('away')
    } else {
      setMomentum('neutral')
    }
  }, [fixture.statistics])
  
  // 실시간 이벤트 펄스
  useEffect(() => {
    if (!fixture.events || fixture.events.length === 0) return
    
    const recentEvents = fixture.events
      .filter((e: any) => {
        const elapsed = parseInt(e.time.elapsed)
        const currentElapsed = parseInt(fixture.fixture.status.elapsed || '0')
        return currentElapsed - elapsed <= 5 // 최근 5분 이벤트
      })
      .map((e: any) => ({
        type: e.type,
        team: e.team.id === fixture.teams.home.id ? 'home' : 'away',
        time: e.time.elapsed
      }))
    
    setPulseData(recentEvents)
  }, [fixture.events, fixture.fixture.status.elapsed])
  
  return (
    <div className={cn("relative", className)}>
      {/* 모멘텀 인디케이터 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Match Momentum</span>
          <span className="text-xs text-gray-500">
            {momentum === 'home' && fixture.teams.home.name}
            {momentum === 'away' && fixture.teams.away.name}
            {momentum === 'neutral' && 'Balanced'}
          </span>
        </div>
        
        <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "absolute h-full rounded-full",
              momentum === 'home' && "bg-blue-500",
              momentum === 'away' && "bg-red-500",
              momentum === 'neutral' && "bg-gray-400"
            )}
            initial={{ width: '50%', left: '25%' }}
            animate={{
              width: momentum === 'neutral' ? '50%' : '75%',
              left: momentum === 'home' ? '0%' : momentum === 'away' ? '25%' : '25%'
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
          
          {/* 펄스 애니메이션 */}
          <AnimatePresence>
            {momentum !== 'neutral' && (
              <motion.div
                className={cn(
                  "absolute h-full rounded-full",
                  momentum === 'home' && "bg-blue-400",
                  momentum === 'away' && "bg-red-400"
                )}
                initial={{ width: '0%', opacity: 0 }}
                animate={{ 
                  width: '100%', 
                  opacity: [0, 0.5, 0],
                  left: momentum === 'home' ? '0%' : momentum === 'away' ? '0%' : '25%'
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* 실시간 활동 펄스 */}
      <div className="grid grid-cols-3 gap-2">
        {/* 공격 강도 */}
        <motion.div
          className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
          animate={momentum === 'home' ? { 
            backgroundColor: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.1)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-xs font-medium">Attack</p>
          <p className="text-lg font-bold">
            {fixture.statistics?.[0]?.statistics?.find((s: any) => s.type === 'Total Shots')?.value || 0}
          </p>
        </motion.div>
        
        {/* 중앙 통제 */}
        <motion.div
          className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
          animate={momentum === 'neutral' ? { 
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Shield className="w-5 h-5 mx-auto mb-1 text-gray-500" />
          <p className="text-xs font-medium">Control</p>
          <p className="text-lg font-bold">
            {fixture.statistics?.[0]?.statistics?.find((s: any) => s.type === 'Ball Possession')?.value || '50%'}
          </p>
        </motion.div>
        
        {/* 공격 강도 (원정) */}
        <motion.div
          className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
          animate={momentum === 'away' ? { 
            backgroundColor: ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-5 h-5 mx-auto mb-1 text-red-500" />
          <p className="text-xs font-medium">Attack</p>
          <p className="text-lg font-bold">
            {fixture.statistics?.[1]?.statistics?.find((s: any) => s.type === 'Total Shots')?.value || 0}
          </p>
        </motion.div>
      </div>
      
      {/* 실시간 이벤트 알림 */}
      <AnimatePresence>
        {pulseData.length > 0 && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {pulseData.map((event, idx) => (
              <motion.div
                key={idx}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg text-xs",
                  event.team === 'home' ? "bg-blue-50 dark:bg-blue-900/20" : "bg-red-50 dark:bg-red-900/20"
                )}
                initial={{ x: event.team === 'home' ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Activity className="w-4 h-4" />
                <span className="font-medium">
                  {event.type} at {event.time}'
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 실시간 통계 비교 차트
export function LiveStatsComparison({ fixture }: { fixture: any }) {
  const stats = [
    { 
      type: 'Ball Possession', 
      icon: Shield, 
      color: 'blue',
      isPercentage: true 
    },
    { 
      type: 'Total Shots', 
      icon: Target, 
      color: 'green',
      isPercentage: false 
    },
    { 
      type: 'Shots on Goal', 
      icon: Zap, 
      color: 'yellow',
      isPercentage: false 
    },
    { 
      type: 'Corner Kicks', 
      icon: Flag, 
      color: 'purple',
      isPercentage: false 
    },
    { 
      type: 'Fouls', 
      icon: Activity, 
      color: 'red',
      isPercentage: false 
    }
  ]
  
  const getStatValue = (teamIdx: number, statType: string) => {
    if (!fixture.statistics || !fixture.statistics[teamIdx]) return 0
    
    const stat = fixture.statistics[teamIdx].statistics?.find((s: any) => s.type === statType)
    if (!stat) return 0
    
    if (statType === 'Ball Possession') {
      return parseInt(stat.value?.replace('%', '') || '0')
    }
    return parseInt(stat.value || '0')
  }
  
  return (
    <div className="space-y-4">
      {stats.map((stat) => {
        const homeValue = getStatValue(0, stat.type)
        const awayValue = getStatValue(1, stat.type)
        const total = stat.isPercentage ? 100 : (homeValue + awayValue) || 1
        const homePercent = stat.isPercentage ? homeValue : (homeValue / total) * 100
        const awayPercent = stat.isPercentage ? awayValue : (awayValue / total) * 100
        
        return (
          <div key={stat.type} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-blue-500">
                {stat.isPercentage ? `${homeValue}%` : homeValue}
              </span>
              <div className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{stat.type}</span>
              </div>
              <span className="font-bold text-red-500">
                {stat.isPercentage ? `${awayValue}%` : awayValue}
              </span>
            </div>
            
            <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${homePercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute right-0 h-full bg-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${awayPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              />
              
              {/* 중앙선 */}
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/50" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 실시간 경기 타임라인
export function LiveMatchTimeline({ fixture }: { fixture: any }) {
  const currentMinute = parseInt(fixture.fixture.status.elapsed || '0')
  const isHalfTime = fixture.fixture.status.short === 'HT'
  
  // 주요 이벤트 시간
  const importantEvents = fixture.events?.filter((e: any) => 
    e.type === 'Goal' || 
    (e.type === 'Card' && e.detail === 'Red Card') ||
    e.type === 'Penalty'
  ) || []
  
  return (
    <div className="relative">
      {/* 타임라인 바 컨테이너 - overflow visible로 변경 */}
      <div className="relative h-8 flex items-center">
        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
          {/* 진행 상황 */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((currentMinute / 90) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
          
          {/* 하프타임 마커 */}
          <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/50" />
          
          {/* 이벤트 마커 - 위치 조정 */}
          {importantEvents.map((event: any, idx: number) => {
            const position = Math.min((parseInt(event.time.elapsed) / 90) * 100, 100)
            return (
              <motion.div
                key={idx}
                className={cn(
                  "absolute w-3 h-3 rounded-full border-2 border-white shadow-sm",
                  event.type === 'Goal' && "bg-green-500",
                  event.type === 'Card' && "bg-red-500",
                  event.type === 'Penalty' && "bg-yellow-500"
                )}
                style={{ 
                  left: `${position}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
              />
            )
          })}
          
          {/* 현재 위치 펄스 */}
          {!isHalfTime && currentMinute > 0 && (
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-lg"
              style={{ 
                left: `${Math.min((currentMinute / 90) * 100, 100)}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </div>
      
      {/* 시간 라벨 */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>0'</span>
        <span>45'</span>
        <span>90'</span>
      </div>
      
      {/* 현재 상태 */}
      <div className="text-center mt-4">
        {isHalfTime ? (
          <span className="text-sm font-medium text-orange-500">Half Time</span>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{currentMinute}'</span>
          </div>
        )}
      </div>
    </div>
  )
}