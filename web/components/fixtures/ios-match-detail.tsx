'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, Share, Heart, Bell, MoreHorizontal,
  Activity, Users, BarChart3, Trophy, Clock, MapPin,
  TrendingUp, Shield, Target, Zap, Info, Calendar,
  ChevronDown, Star, Circle, ArrowUp, ArrowDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { LineupFieldView } from './lineup-field-view'
import { EventsTimeline } from './events-timeline'
import { H2HSimple } from './h2h-simple'
import { EnhancedStatistics } from './enhanced-statistics'
import { MatchDetailsInfo } from './match-details-info'
import { MatchPreviewEnhanced } from './match-preview-enhanced'

interface IOSMatchDetailProps {
  fixture: any
  isLive?: boolean
  onRefresh?: () => void
  onBack?: () => void
}

// iOS 스타일 헤더
function IOSHeader({ fixture, onBack, onShare, onFavorite }: any) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header 
      className={cn(
        "fixed top-0 left-0 lg:left-64 right-0 z-50 transition-all duration-300",
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
        scrolled && "shadow-sm border-b border-gray-200/50 dark:border-gray-800/50"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full -ml-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="rounded-full"
          >
            <Share className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFavorite}
            className="rounded-full"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  )
}

// iOS 스타일 스코어보드
function IOSScoreboard({ fixture, isLive }: any) {
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)
  const isUpcoming = ['TBD', 'NS'].includes(fixture.fixture.status.short)
  
  return (
    <motion.div 
      className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 px-6 pt-20 pb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* 리그 정보 */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {fixture.league.logo && (
          <Image
            src={fixture.league.logo}
            alt={fixture.league.name}
            width={24}
            height={24}
            className="object-contain"
          />
        )}
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {fixture.league.name} · {fixture.league.round}
        </span>
      </div>
      
      {/* 팀 & 스코어 */}
      <div className="flex items-center justify-between">
        {/* 홈팀 */}
        <motion.div 
          className="flex-1 text-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Image
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            width={80}
            height={80}
            className="mx-auto mb-3"
          />
          <p className="font-semibold text-gray-900 dark:text-white">
            {fixture.teams.home.name}
          </p>
          {fixture.teams.home.winner && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <Badge className="mt-2 bg-green-500/10 text-green-600 border-green-500/20">
                WIN
              </Badge>
            </motion.div>
          )}
        </motion.div>
        
        {/* 스코어 */}
        <div className="px-8">
          {isUpcoming ? (
            <motion.div 
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {format(new Date(fixture.fixture.date), 'HH:mm')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {format(new Date(fixture.fixture.date), 'M월 d일', { locale: ko })}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              className="text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-baseline gap-3">
                <motion.span 
                  className={cn(
                    "text-4xl font-bold",
                    fixture.goals.home > fixture.goals.away && "text-green-500"
                  )}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {fixture.goals.home ?? 0}
                </motion.span>
                <span className="text-2xl text-gray-400">-</span>
                <motion.span 
                  className={cn(
                    "text-4xl font-bold",
                    fixture.goals.away > fixture.goals.home && "text-green-500"
                  )}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {fixture.goals.away ?? 0}
                </motion.span>
              </div>
              {isLive && (
                <motion.div
                  className="mt-2 flex items-center justify-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                  <span className="text-sm font-semibold text-red-500">
                    {fixture.fixture.status.elapsed}'
                  </span>
                </motion.div>
              )}
              {fixture.score.penalty.home !== null && (
                <p className="text-sm text-gray-500 mt-2">
                  PK ({fixture.score.penalty.home} - {fixture.score.penalty.away})
                </p>
              )}
            </motion.div>
          )}
        </div>
        
        {/* 원정팀 */}
        <motion.div 
          className="flex-1 text-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Image
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            width={80}
            height={80}
            className="mx-auto mb-3"
          />
          <p className="font-semibold text-gray-900 dark:text-white">
            {fixture.teams.away.name}
          </p>
          {fixture.teams.away.winner && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <Badge className="mt-2 bg-green-500/10 text-green-600 border-green-500/20">
                WIN
              </Badge>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* 경기장 정보 */}
      {fixture.fixture.venue && (
        <motion.div 
          className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <MapPin className="w-4 h-4" />
          <span>{fixture.fixture.venue.name}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// iOS 스타일 탭 내비게이션
function IOSTabNavigation({ tabs, activeTab, onTabChange }: any) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab: any) => tab.id === activeTab)
    const activeTabRef = tabRefs.current[activeIndex]
    
    if (activeTabRef) {
      setIndicatorStyle({
        left: activeTabRef.offsetLeft,
        width: activeTabRef.offsetWidth
      })
    }
  }, [activeTab, tabs])
  
  return (
    <div className="sticky top-14 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="relative">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab: any, index: number) => (
            <button
              key={tab.id}
              ref={el => {
                tabRefs.current[index] = el
              }}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-shrink-0 px-6 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* 애니메이션 인디케이터 */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400"
          animate={indicatorStyle}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  )
}

// iOS 스타일 콘텐츠 섹션
function IOSContentSection({ title, icon: Icon, children }: any) {
  return (
    <motion.div 
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      {title && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
          {Icon && <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </motion.div>
  )
}

// iOS 스타일 통계 바
function IOSStatBar({ label, homeValue, awayValue, homeTeam, awayTeam, isPercentage = false }: any) {
  const total = homeValue + awayValue
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900 dark:text-white">
          {isPercentage ? `${homeValue}%` : homeValue}
        </span>
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {isPercentage ? `${awayValue}%` : awayValue}
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <motion.div
          className="bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${homePercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="bg-red-500"
          initial={{ width: 0 }}
          animate={{ width: `${awayPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// 메인 컴포넌트
export function IOSMatchDetail({ 
  fixture, 
  isLive = false, 
  onRefresh, 
  onBack 
}: IOSMatchDetailProps) {
  const [activeTab, setActiveTab] = useState('summary')
  const [isFavorite, setIsFavorite] = useState(false)
  
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)
  const isUpcoming = ['TBD', 'NS'].includes(fixture.fixture.status.short)
  
  // 탭 구성 (iOS 스타일)
  const tabs = isUpcoming ? [
    { id: 'info', label: '정보' },
    { id: 'h2h', label: '맞대결' },
    { id: 'standings', label: '순위' }
  ] : [
    { id: 'summary', label: '요약' },
    { id: 'stats', label: '통계' },
    { id: 'lineup', label: '라인업' },
    { id: 'events', label: '이벤트' },
    { id: 'h2h', label: '맞대결' }
  ]
  
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
        text: `경기 결과: ${fixture.goals.home} - ${fixture.goals.away}`,
        url: window.location.href
      })
    }
  }
  
  // 경기 예정인 경우 개선된 프리뷰 컴포넌트 사용
  if (isUpcoming) {
    return (
      <div className="min-h-screen lg:ml-64 bg-gray-50 dark:bg-gray-950">
        <IOSHeader 
          fixture={fixture}
          onBack={onBack || (() => window.history.back())}
          onShare={handleShare}
          onFavorite={() => setIsFavorite(!isFavorite)}
        />
        
        <div className="px-4 py-6">
          <MatchPreviewEnhanced fixture={fixture} />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen lg:ml-64 bg-gray-50 dark:bg-gray-950">
      {/* iOS 스타일 헤더 */}
      <IOSHeader 
        fixture={fixture}
        onBack={onBack || (() => window.history.back())}
        onShare={handleShare}
        onFavorite={() => setIsFavorite(!isFavorite)}
      />
      
      {/* 스코어보드 */}
      <IOSScoreboard fixture={fixture} isLive={isLive} />
      
      {/* 탭 네비게이션 */}
      <IOSTabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* 콘텐츠 영역 */}
      <div className="px-4 py-6 space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* 주요 이벤트 */}
              {fixture.events && fixture.events.length > 0 && (
                <IOSContentSection title="주요 이벤트" icon={Activity}>
                  <div className="space-y-3">
                    {fixture.events.slice(0, 5).map((event: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 text-center text-sm font-medium text-gray-500">
                          {event.time.elapsed}'
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {event.type === 'Goal' && '⚽'}
                          {event.type === 'Card' && (event.detail === 'Yellow Card' ? '🟨' : '🟥')}
                          {event.type === 'subst' && '🔄'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {event.player?.name || 'Unknown'}
                          </p>
                          {event.assist?.name && (
                            <p className="text-xs text-gray-500">
                              어시스트: {event.assist.name}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.team.id === fixture.teams.home.id ? fixture.teams.home.name : fixture.teams.away.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </IOSContentSection>
              )}
              
              {/* 간단한 통계 */}
              {fixture.statistics && fixture.statistics.length > 0 && (
                <IOSContentSection title="주요 통계" icon={BarChart3}>
                  <div className="space-y-4">
                    {(() => {
                      // 통계 데이터 확인
                      console.log('[IOSMatchDetail] Statistics data:', fixture.statistics)
                      
                      // 모든 가능한 통계 타입
                      const statTypes = [
                        'Ball Possession',
                        'Total Shots', 
                        'Shots on Goal',
                        'Shots off Goal',
                        'Blocked Shots',
                        'Shots insidebox',
                        'Shots outsidebox',
                        'Corner Kicks',
                        'Offsides',
                        'Fouls',
                        'Yellow Cards',
                        'Red Cards',
                        'Goalkeeper Saves',
                        'Total passes',
                        'Passes accurate',
                        'Passes %'
                      ]
                      
                      const availableStats = []
                      
                      for (const statType of statTypes) {
                        const homeStat = fixture.statistics[0]?.statistics?.find((s: any) => s.type === statType)
                        const awayStat = fixture.statistics[1]?.statistics?.find((s: any) => s.type === statType)
                        
                        if (homeStat && awayStat) {
                          const homeValue = statType.includes('Possession') || statType.includes('%')
                            ? (parseInt(String(homeStat.value)?.replace('%', '') || '0') || 0)
                            : (parseInt(homeStat.value) || 0)
                          const awayValue = statType.includes('Possession') || statType.includes('%')
                            ? (parseInt(String(awayStat.value)?.replace('%', '') || '0') || 0)
                            : (parseInt(awayStat.value) || 0)
                          
                          availableStats.push({
                            type: statType,
                            homeValue,
                            awayValue,
                            isPercentage: statType.includes('Possession') || statType.includes('%')
                          })
                        }
                      }
                      
                      console.log('[IOSMatchDetail] Available stats:', availableStats)
                      
                      // 통계가 없는 경우
                      if (availableStats.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            통계 데이터가 아직 준비되지 않았습니다.
                          </div>
                        )
                      }
                      
                      // 최대 5개까지만 표시
                      return availableStats.slice(0, 5).map(stat => (
                        <IOSStatBar
                          key={stat.type}
                          label={stat.type}
                          homeValue={stat.homeValue}
                          awayValue={stat.awayValue}
                          homeTeam={fixture.teams.home}
                          awayTeam={fixture.teams.away}
                          isPercentage={stat.isPercentage}
                        />
                      ))
                    })()}
                  </div>
                </IOSContentSection>
              )}
            </motion.div>
          )}
          
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <IOSContentSection title="상세 통계" icon={BarChart3}>
                {fixture.statistics && fixture.statistics.length > 0 ? (
                  <EnhancedStatistics
                    statistics={fixture.statistics}
                    homeTeam={fixture.teams.home}
                    awayTeam={fixture.teams.away}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    통계 데이터가 없습니다.
                  </div>
                )}
              </IOSContentSection>
            </motion.div>
          )}
          
          {activeTab === 'lineup' && fixture.lineups && (
            <motion.div
              key="lineup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <IOSContentSection title="라인업" icon={Users}>
                <LineupFieldView
                  lineups={fixture.lineups}
                  events={fixture.events}
                  players={fixture.players}
                />
              </IOSContentSection>
            </motion.div>
          )}
          
          {activeTab === 'events' && fixture.events && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <IOSContentSection title="경기 이벤트" icon={Activity}>
                <EventsTimeline
                  events={fixture.events}
                  homeTeam={fixture.teams.home}
                  awayTeam={fixture.teams.away}
                />
              </IOSContentSection>
            </motion.div>
          )}
          
          {activeTab === 'h2h' && (
            <motion.div
              key="h2h"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <IOSContentSection title="상대 전적" icon={Trophy}>
                <H2HSimple
                  homeTeam={fixture.teams.home}
                  awayTeam={fixture.teams.away}
                  currentFixture={fixture}
                />
              </IOSContentSection>
            </motion.div>
          )}
          
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <IOSContentSection title="경기 정보" icon={Info}>
                <MatchDetailsInfo fixture={fixture} />
              </IOSContentSection>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Badge 컴포넌트 (iOS 스타일)
function Badge({ children, className }: any) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      className
    )}>
      {children}
    </span>
  )
}