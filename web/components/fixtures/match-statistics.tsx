'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, Target, Shield, Zap, BarChart, TrendingUp, Users, Percent, Trophy, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface MatchStatisticsProps {
  statistics: any[]
  fixture?: any
}

interface StatCategory {
  title: string
  icon: any
  stats: string[]
  color: string
  gradient: string
}

// Glass Morphism Card (Apple 스타일)
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

export default function MatchStatistics({ statistics, fixture }: MatchStatisticsProps) {
  // statistics prop을 우선 사용, 없으면 fixture.statistics 사용
  const statsData = statistics || fixture?.statistics
  
  if (!statsData || statsData.length < 2) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          통계 정보가 아직 없습니다.
        </div>
      </Card>
    )
  }
  
  const homeStats = statsData[0]?.statistics || []
  const awayStats = statsData[1]?.statistics || []
  const homeTeam = statsData[0]?.team || fixture?.teams?.home
  const awayTeam = statsData[1]?.team || fixture?.teams?.away
  
  // 통계 값 가져오기
  const getStatValue = (stats: any[], type: string): any => {
    const stat = stats.find((s: any) => s.type === type)
    return stat?.value ?? 0
  }
  
  // 퍼센트 계산
  const calculatePercentage = (value: any): number => {
    if (typeof value === 'string' && value.includes('%')) {
      return parseInt(value)
    }
    return value
  }
  
  // 통계 카테고리 - Apple 스타일 그라데이션 추가
  const categories: StatCategory[] = [
    {
      title: '주요 지표',
      icon: Trophy,
      stats: ['Ball Possession', 'expected_goals', 'Total Shots', 'Shots on Goal'],
      color: 'text-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: '슈팅 분석',
      icon: Target,
      stats: ['Total Shots', 'Shots on Goal', 'Shots off Goal', 'Blocked Shots', 'Shots insidebox', 'Shots outsidebox'],
      color: 'text-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    {
      title: '패스 & 빌드업',
      icon: Activity,
      stats: ['Total passes', 'Passes accurate', 'Passes %'],
      color: 'text-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: '수비 활동',
      icon: Shield,
      stats: ['Fouls', 'Yellow Cards', 'Red Cards', 'Offsides', 'Total Tackles', 'Interceptions'],
      color: 'text-yellow-500',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      title: '세트피스',
      icon: Zap,
      stats: ['Corner Kicks', 'Free Kicks', 'Throw-ins'],
      color: 'text-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: '골키퍼',
      icon: Users,
      stats: ['Goalkeeper Saves', 'Punches', 'Saves inside box'],
      color: 'text-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  ]
  
  // Apple 스타일 통계 바
  const AppleStatBar = ({ homeStat, awayStat, label, isHighlight = false }: { 
    homeStat: any, 
    awayStat: any, 
    label: string,
    isHighlight?: boolean 
  }) => {
    const homeValue = calculatePercentage(homeStat) || 0
    const awayValue = calculatePercentage(awayStat) || 0
    const total = Math.max(homeValue + awayValue, 1)
    const homePercent = (homeValue / total) * 100
    const awayPercent = (awayValue / total) * 100
    
    // 우세한 팀 확인
    const homeWinning = homeValue > awayValue
    const awayWinning = awayValue > homeValue
    
    return (
      <motion.div 
        className={cn(
          "relative",
          isHighlight && "p-4 bg-gradient-to-r from-blue-50/50 to-red-50/50 dark:from-blue-900/10 dark:to-red-900/10 rounded-xl"
        )}
        whileHover={{ scale: isHighlight ? 1.02 : 1 }}
      >
        {/* 라벨과 값 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-lg font-bold",
              homeWinning ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
            )}>
              {homeStat ?? 0}
            </span>
            {homeWinning && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            )}
          </div>
          
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          
          <div className="flex items-center gap-2">
            {awayWinning && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
            )}
            <span className={cn(
              "text-lg font-bold",
              awayWinning ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
            )}>
              {awayStat ?? 0}
            </span>
          </div>
        </div>
        
        {/* 프로그레스 바 */}
        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${homePercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-400 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${awayPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* 중앙선 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 -translate-x-1/2" />
        </div>
        
        {/* 퍼센티지 표시 (주요 지표만) */}
        {isHighlight && (
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{homePercent.toFixed(0)}%</span>
            <span>{awayPercent.toFixed(0)}%</span>
          </div>
        )}
      </motion.div>
    )
  }
  
  // 통계 이름 한글화 - 더 많은 항목 추가
  const translateStatName = (statName: string): string => {
    const translations: Record<string, string> = {
      // 주요 지표
      'Ball Possession': '점유율',
      'expected_goals': '기대 득점(xG)',
      
      // 슈팅
      'Total Shots': '전체 슈팅',
      'Shots on Goal': '유효 슈팅',
      'Shots off Goal': '빗나간 슈팅',
      'Blocked Shots': '차단된 슈팅',
      'Shots insidebox': '박스 안 슈팅',
      'Shots outsidebox': '박스 밖 슈팅',
      
      // 패스
      'Total passes': '전체 패스',
      'Passes accurate': '정확한 패스',
      'Passes %': '패스 성공률',
      
      // 수비
      'Fouls': '파울',
      'Yellow Cards': '경고',
      'Red Cards': '퇴장',
      'Offsides': '오프사이드',
      'Total Tackles': '태클',
      'Interceptions': '인터셉트',
      
      // 세트피스
      'Corner Kicks': '코너킥',
      'Free Kicks': '프리킥',
      'Throw-ins': '스로인',
      
      // 골키퍼
      'Goalkeeper Saves': '골키퍼 선방',
      'Punches': '펀칭',
      'Saves inside box': '박스 내 선방'
    }
    return translations[statName] || statName
  }
  
  return (
    <div className="space-y-6">
      {/* 팀 정보 헤더 - Apple 스타일 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {homeTeam?.logo && (
                <motion.img 
                  src={homeTeam.logo} 
                  alt={homeTeam.name} 
                  className="w-12 h-12"
                  whileHover={{ scale: 1.1 }}
                />
              )}
              <div>
                <div className="font-bold text-xl text-gray-900 dark:text-white">
                  {homeTeam?.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">홈</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl">
                <BarChart className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Match Stats</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-bold text-xl text-gray-900 dark:text-white">
                  {awayTeam?.name}
                </div>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400">원정</span>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
              </div>
              {awayTeam?.logo && (
                <motion.img 
                  src={awayTeam.logo} 
                  alt={awayTeam.name} 
                  className="w-12 h-12"
                  whileHover={{ scale: 1.1 }}
                />
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>
      
      {/* 통계 카테고리별 표시 - Apple 스타일 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, idx) => {
          const categoryStats = category.stats.filter(statName => 
            homeStats.some((s: any) => s.type === statName) ||
            awayStats.some((s: any) => s.type === statName)
          )
          
          if (categoryStats.length === 0) return null
          
          const isMainCategory = category.title === '주요 지표'
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                isMainCategory && "md:col-span-2"
              )}
            >
              <GlassCard className="p-6 h-full">
                {/* 카테고리 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl bg-gradient-to-br",
                      category.gradient
                    )}>
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {category.title}
                      </h3>
                      {isMainCategory && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Key Performance Indicators
                        </span>
                      )}
                    </div>
                  </div>
                  {isMainCategory && (
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full">
                      핵심 지표
                    </span>
                  )}
                </div>
                
                {/* 통계 리스트 */}
                <div className="space-y-4">
                  {categoryStats.map((statName, statIdx) => (
                    <AppleStatBar
                      key={statName}
                      homeStat={getStatValue(homeStats, statName)}
                      awayStat={getStatValue(awayStats, statName)}
                      label={translateStatName(statName)}
                      isHighlight={isMainCategory && statIdx < 2}
                    />
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
      
      {/* 추가 통계가 있으면 표시 - Apple 스타일 */}
      {homeStats.length > 20 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  세부 통계
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Additional Statistics
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {homeStats
                .filter((stat: any) => 
                  !categories.some(cat => cat.stats.includes(stat.type))
                )
                .slice(0, 6) // 최대 6개만 표시
                .map((stat: any) => {
                  const awayValue = getStatValue(awayStats, stat.type)
                  const homeWin = (stat.value || 0) > (awayValue || 0)
                  const awayWin = (awayValue || 0) > (stat.value || 0)
                  
                  return (
                    <motion.div 
                      key={stat.type} 
                      className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {stat.type}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-lg font-bold",
                          homeWin ? "text-blue-600" : "text-gray-600 dark:text-gray-400"
                        )}>
                          {stat.value || 0}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className={cn(
                          "text-lg font-bold",
                          awayWin ? "text-red-600" : "text-gray-600 dark:text-gray-400"
                        )}>
                          {awayValue || 0}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}