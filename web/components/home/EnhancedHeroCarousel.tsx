'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, Circle, Trophy, Star, 
  ChevronLeft, ChevronRight, Pause, Play,
  MapPin, Activity, Zap, Newspaper, TrendingUp,
  Users, BarChart3, Heart, Bell, Sparkles, Flame
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { formatMatchTime, formatRelativeTime, formatVenue, getTimezoneAbbreviation } from '@/lib/utils/timezone'
import { getTeamColor } from '@/lib/data/team-colors'

// 슬라이드 콘텐츠 타입
export type SlideType = 'match' | 'news' | 'team' | 'stats' | 'promotion'

export interface HeroSlide {
  id: string
  type: SlideType
  priority: number
  data: any
}

interface EnhancedHeroCarouselProps {
  slides: HeroSlide[]
  isLoading?: boolean
  autoPlayInterval?: number
  onSlideChange?: (index: number) => void
}

export function EnhancedHeroCarousel({ 
  slides = [], 
  isLoading = false,
  autoPlayInterval = 5000,
  onSlideChange
}: EnhancedHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 자동 슬라이드 기능 개선
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % slides.length
        onSlideChange?.(nextIndex)
        return nextIndex
      })
    }, autoPlayInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoPlaying, slides.length, autoPlayInterval, isPaused, onSlideChange])

  // 마우스 호버 시 일시정지
  const handleMouseEnter = () => setIsPaused(true)
  const handleMouseLeave = () => setIsPaused(false)

  // 네비게이션
  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false)
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length
    setCurrentIndex(prevIndex)
    onSlideChange?.(prevIndex)
  }, [currentIndex, slides.length, onSlideChange])

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false)
    const nextIndex = (currentIndex + 1) % slides.length
    setCurrentIndex(nextIndex)
    onSlideChange?.(nextIndex)
  }, [currentIndex, slides.length, onSlideChange])

  const goToSlide = useCallback((index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
    onSlideChange?.(index)
  }, [onSlideChange])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="relative h-[380px] md:h-[450px] lg:h-[480px] rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse" />
              <div className="relative h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">콘텐츠 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 슬라이드가 없을 때
  if (slides.length === 0) {
    return (
      <Card className="relative h-[380px] md:h-[450px] lg:h-[480px] border-0 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        <div className="relative flex items-center justify-center h-full">
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 blur-xl opacity-30" />
              <div className="relative p-5 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <h3 className="mt-6 text-xl font-bold text-gray-700 dark:text-gray-300">표시할 콘텐츠가 없습니다</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">곧 업데이트됩니다</p>
          </div>
        </div>
      </Card>
    )
  }

  const currentSlide = slides[currentIndex]

  return (
    <div className="relative">
      {/* 메인 캐러셀 - Apple 스타일 */}
      <Card 
        className="relative h-[420px] md:h-[480px] lg:h-[520px] border-0 rounded-2xl overflow-hidden group shadow-2xl bg-gradient-to-br from-gray-900 to-black"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 슬라이드별 렌더링 */}
        {currentSlide.type === 'match' && (
          <MatchSlide data={currentSlide.data} />
        )}
        {currentSlide.type === 'news' && (
          <NewsSlide data={currentSlide.data} />
        )}
        {currentSlide.type === 'team' && (
          <TeamSlide data={currentSlide.data} />
        )}
        {currentSlide.type === 'stats' && (
          <StatsSlide data={currentSlide.data} />
        )}
        {currentSlide.type === 'promotion' && (
          <PromotionSlide data={currentSlide.data} />
        )}

        {/* 네비게이션 버튼 - Apple 스타일 */}
        {slides.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1, y: '-50%' }}
              whileTap={{ scale: 0.9, y: '-50%' }}
              initial={{ y: '-50%' }}
              onClick={goToPrevious}
              className="absolute left-6 top-1/2 p-3 rounded-2xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 dark:hover:bg-gray-900/30 z-10 shadow-lg"
              aria-label="이전"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, y: '-50%' }}
              whileTap={{ scale: 0.9, y: '-50%' }}
              initial={{ y: '-50%' }}
              onClick={goToNext}
              className="absolute right-6 top-1/2 p-3 rounded-2xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 dark:hover:bg-gray-900/30 z-10 shadow-lg"
              aria-label="다음"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </>
        )}

        {/* 자동재생 토글 - Apple 스타일 */}
        {slides.length > 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-6 right-6 p-2.5 rounded-2xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 dark:hover:bg-gray-900/30 z-10 shadow-lg"
            aria-label={isAutoPlaying ? "일시정지" : "재생"}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </motion.button>
        )}
      </Card>

      {/* 인디케이터 - Apple 스타일 */}
      {slides.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {slides.map((slide, index) => (
            <motion.button
              key={slide.id}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all duration-300",
                index === currentIndex 
                  ? "w-10 h-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/30" 
                  : "w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500"
              )}
              aria-label={`슬라이드 ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// 경기 슬라이드
// ============================================
function MatchSlide({ data }: { data: any }) {
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(data.fixture?.status?.short)
  const isFinished = data.fixture?.status?.short === 'FT'
  
  // 팀 컬러 가져오기
  const homeTeamColors = getTeamColor(data.teams?.home?.id, data.teams?.home?.name)
  const awayTeamColors = getTeamColor(data.teams?.away?.id, data.teams?.away?.name)

  return (
    <div className="absolute inset-0">
      {/* 프리미엄 다크 그라데이션 배경 - 팀 컬러 액센트 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            ${homeTeamColors.primary}20 0%, 
            rgba(20,25,35,0.98) 30%, 
            rgba(15,20,30,0.98) 50%, 
            rgba(20,25,35,0.98) 70%, 
            ${awayTeamColors.primary}20 100%)`,
        }}
      />
      {/* 서브틀한 라이트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
      
      {/* 팀 컬러 오브 - 더 밝고 선명한 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 홈팀 컬러 오브 - 세련된 효과 */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full"
          style={{ 
            background: `radial-gradient(circle at 30% 30%, ${homeTeamColors.primary}40, ${homeTeamColors.primary}20, transparent)`,
            filter: 'blur(80px)',
            mixBlendMode: 'screen',
            opacity: 0.6
          }}
        />
        
        {/* 원정팀 컬러 오브 - 세련된 효과 */}
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{ 
            background: `radial-gradient(circle at 70% 70%, ${awayTeamColors.primary}40, ${awayTeamColors.primary}20, transparent)`,
            filter: 'blur(80px)',
            mixBlendMode: 'screen',
            opacity: 0.6
          }}
        />
        
        {/* 중앙 스포트라이트 효과 */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08), transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        
        {/* 상단 서브틀 하이라이트 */}
        <div 
          className="absolute top-0 left-0 right-0 h-[200px]"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)',
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* 팀 컬러 액센트 라인 */}
        <div 
          className="absolute top-0 left-0 w-full h-1"
          style={{
            background: `linear-gradient(90deg, ${homeTeamColors.primary}60, transparent 30%, transparent 70%, ${awayTeamColors.primary}60)`,
            boxShadow: `0 0 20px ${homeTeamColors.primary}40, 0 0 20px ${awayTeamColors.primary}40`,
          }}
        />
      </div>
      
      {/* 프리미엄 그리드 패턴 */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.5,
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)'
        }}
      />
      
      {/* Liquid Glass 라이브 인디케이터 */}
      {isLive && (
        <div className="absolute top-6 left-6 z-20">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{ type: "spring" }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,0,0,0.3), rgba(255,0,0,0.2))',
              backdropFilter: 'blur(20px)',
              boxShadow: `
                inset 0 1px 2px rgba(255,255,255,0.3),
                0 8px 20px -4px rgba(255,0,0,0.4)
              `,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <motion.div 
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
              style={{
                boxShadow: '0 0 10px rgba(255,255,255,0.8)',
              }}
            />
            <span className="text-sm font-bold text-white">LIVE</span>
            <span className="text-sm text-white/90">{data.fixture.status.elapsed}'</span>
          </motion.div>
        </div>
      )}

      {/* 리그 표시 - 중앙 상단, 여백 더 증가 */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-xl rounded-full shadow-xl border border-white/20"
        >
          {/* 리그 로고 */}
          {data.league.logo && (
            <div className="relative w-6 h-6">
              <Image
                src={data.league.logo}
                alt={data.league.name}
                fill
                className="object-contain"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {data.league.name}
            </span>
            {data.league.round && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-xs text-white/70">
                  {data.league.round}
                </span>
              </>
            )}
          </div>
          {/* 트로피 아이콘 (컵 대회인 경우) */}
          {(data.league.name.includes('Cup') || 
            data.league.name.includes('컵') || 
            data.league.name.includes('FA') ||
            data.league.name.includes('Champions') ||
            data.league.name.includes('Europa')) && (
            <Trophy className="w-4 h-4 text-yellow-400/80" />
          )}
        </motion.div>
      </div>

      {/* 경기 정보 - 중앙 정렬로 균형잡힌 레이아웃 */}
      <div className="relative h-full flex flex-col justify-center pt-24 pb-16 px-8 md:px-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between gap-8">
            {/* 홈팀 - 팀 컬러 네온 글로우 효과 */}
            <motion.div 
              initial={{ x: -100, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="relative mb-4">
                {/* Liquid Glass 팀 로고 컨테이너 */}
                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  {/* 소프트 글로우 */}
                  <div 
                    className="absolute -inset-4 rounded-[32px] opacity-50"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${homeTeamColors.primary}40, transparent 60%)`,
                      filter: 'blur(40px)',
                    }}
                  />
                  
                  {/* Glass Container with Depth */}
                  <div className="relative w-32 h-32 md:w-40 md:h-40 group">
                    {/* Back Glass Layer */}
                    <div 
                      className="absolute inset-0 rounded-[28px] backdrop-blur-2xl"
                      style={{
                        background: `linear-gradient(135deg, 
                          rgba(255,255,255,0.1), 
                          rgba(255,255,255,0.05))`,
                        boxShadow: `
                          inset 0 1px 2px rgba(255,255,255,0.3),
                          inset 0 -1px 2px rgba(0,0,0,0.2),
                          0 20px 40px -10px ${homeTeamColors.primary}30,
                          0 10px 20px -5px rgba(0,0,0,0.3)
                        `,
                        border: '1px solid rgba(255,255,255,0.18)',
                      }}
                    />
                    
                    {/* Team Color Accent */}
                    <div 
                      className="absolute inset-0 rounded-[28px] opacity-30"
                      style={{
                        background: `linear-gradient(135deg, ${homeTeamColors.primary}20, transparent)`,
                      }}
                    />
                    
                    {/* Logo */}
                    <div className="absolute inset-0 p-6 flex items-center justify-center">
                      <Image
                        src={data.teams.home.logo}
                        alt={data.teams.home.name}
                        fill
                        className="object-contain p-6 drop-shadow-lg"
                      />
                    </div>
                    
                    {/* Glass Shine Effect */}
                    <div 
                      className="absolute inset-0 rounded-[28px] opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                      }}
                    />
                  </div>
                </motion.div>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white text-center tracking-tight">
                {data.teams.home.name}
              </h3>
            </motion.div>

            {/* 중앙 점수/VS 표시 - 네온 스타일 */}
            <motion.div 
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="px-8 text-center"
            >
              {isLive || isFinished ? (
                <div className="relative">
                  {/* Liquid Glass Score Container */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="relative px-8 py-4 rounded-[32px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                      backdropFilter: 'blur(20px)',
                      boxShadow: `
                        inset 0 2px 4px rgba(255,255,255,0.1),
                        inset 0 -2px 4px rgba(0,0,0,0.2),
                        0 20px 40px -10px rgba(0,0,0,0.4)
                      `,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="flex items-center gap-6 justify-center">
                      <motion.span 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-7xl md:text-8xl font-black"
                        style={{ 
                          background: `linear-gradient(135deg, ${homeTeamColors.primary}, ${homeTeamColors.primary}80, rgba(255,255,255,0.9))`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 4px 8px ${homeTeamColors.primary}40)`,
                        }}
                      >
                        {data.goals?.home ?? 0}
                      </motion.span>
                      
                      <div className="flex flex-col items-center gap-2">
                        <span 
                          className="text-2xl font-light"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          :
                        </span>
                        {isLive && (
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="px-3 py-1 rounded-full backdrop-blur-xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,0,0,0.5), rgba(255,0,0,0.3))',
                              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}
                          >
                            <span className="text-xs font-bold text-white">{data.fixture.status.elapsed}'</span>
                          </motion.div>
                        )}
                      </div>
                      
                      <motion.span 
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-7xl md:text-8xl font-black"
                        style={{ 
                          background: `linear-gradient(135deg, ${awayTeamColors.primary}, ${awayTeamColors.primary}80, rgba(255,255,255,0.9))`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: `drop-shadow(0 4px 8px ${awayTeamColors.primary}40)`,
                        }}
                      >
                        {data.goals?.away ?? 0}
                      </motion.span>
                    </div>
                  </motion.div>
                  {isFinished && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4"
                    >
                      <div 
                        className="inline-block px-4 py-1.5 rounded-full backdrop-blur-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 12px -2px rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        <span className="text-sm font-semibold text-white/90">종료</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Liquid Glass VS 디스플레이 - 위치 조정 */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="relative mt-12"
                  >
                    <div 
                      className="text-6xl md:text-7xl font-black tracking-widest"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 20px rgba(255,255,255,0.2)',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      }}
                    >
                      VS
                    </div>
                  </motion.div>
                  
                  {/* 시간 및 경기장 정보 - 아래로 이동 */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 space-y-2"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-white">
                      {formatMatchTime(data.fixture.date)}
                    </div>
                    <div className="text-sm text-white/60">
                      {new Date(data.fixture.date).toLocaleDateString('ko-KR', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <MapPin className="w-3 h-3 text-white/60" />
                      <span className="text-xs text-white/60">
                        {formatVenue(data.fixture.venue)}
                      </span>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>

            {/* 원정팀 - 팀 컬러 네온 글로우 효과 */}
            <motion.div 
              initial={{ x: 100, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="relative mb-4">
                {/* Liquid Glass 팀 로고 컨테이너 */}
                <motion.div
                  whileHover={{ scale: 1.05, rotateY: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  {/* 소프트 글로우 */}
                  <div 
                    className="absolute -inset-4 rounded-[32px] opacity-50"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${awayTeamColors.primary}40, transparent 60%)`,
                      filter: 'blur(40px)',
                    }}
                  />
                  
                  {/* Glass Container with Depth */}
                  <div className="relative w-32 h-32 md:w-40 md:h-40 group">
                    {/* Back Glass Layer */}
                    <div 
                      className="absolute inset-0 rounded-[28px] backdrop-blur-2xl"
                      style={{
                        background: `linear-gradient(135deg, 
                          rgba(255,255,255,0.1), 
                          rgba(255,255,255,0.05))`,
                        boxShadow: `
                          inset 0 1px 2px rgba(255,255,255,0.3),
                          inset 0 -1px 2px rgba(0,0,0,0.2),
                          0 20px 40px -10px ${awayTeamColors.primary}30,
                          0 10px 20px -5px rgba(0,0,0,0.3)
                        `,
                        border: '1px solid rgba(255,255,255,0.18)',
                      }}
                    />
                    
                    {/* Team Color Accent */}
                    <div 
                      className="absolute inset-0 rounded-[28px] opacity-30"
                      style={{
                        background: `linear-gradient(135deg, ${awayTeamColors.primary}20, transparent)`,
                      }}
                    />
                    
                    {/* Logo */}
                    <div className="absolute inset-0 p-6 flex items-center justify-center">
                      <Image
                        src={data.teams.away.logo}
                        alt={data.teams.away.name}
                        fill
                        className="object-contain p-6 drop-shadow-lg"
                      />
                    </div>
                    
                    {/* Glass Shine Effect */}
                    <div 
                      className="absolute inset-0 rounded-[28px] opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                      }}
                    />
                  </div>
                </motion.div>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white text-center tracking-tight">
                {data.teams.away.name}
              </h3>
            </motion.div>
          </div>

          {/* 상세보기 버튼 */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center mt-14"
          >
            <Link href={`/fixtures/${data.fixture.id}`}>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                {/* Liquid Glass Button */}
                <div 
                  className="px-6 py-3 rounded-2xl backdrop-blur-2xl flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                    boxShadow: `
                      inset 0 1px 2px rgba(255,255,255,0.3),
                      inset 0 -1px 1px rgba(0,0,0,0.1),
                      0 10px 30px -5px rgba(0,0,0,0.5),
                      0 5px 15px -3px rgba(255,255,255,0.1)
                    `,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <span className="text-sm font-semibold text-white">경기 상세보기</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="h-4 w-4 text-white/80" />
                  </motion.div>
                </div>
                
                {/* Hover Glow */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.1), transparent)',
                    filter: 'blur(10px)',
                  }}
                />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 뉴스 슬라이드
// ============================================
function NewsSlide({ data }: { data: any }) {
  // data가 배열이 아닌 경우 배열로 변환
  const newsItems = Array.isArray(data) ? data : [data]
  
  return (
    <div className="absolute inset-0">
      {/* Liquid Glass 스타일 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-950/90 to-indigo-950/95" />
      
      {/* 부드러운 컬러 오브 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.3), rgba(59,130,246,0.1), transparent)',
            filter: 'blur(80px)',
            mixBlendMode: 'screen'
          }}
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.3), rgba(99,102,241,0.1), transparent)',
            filter: 'blur(80px)',
            mixBlendMode: 'screen'
          }}
        />
      </div>
      
      {/* 상단 하이라이트 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
      
      {/* 뉴스 콘텐츠 영역 - 더 컴팩트한 레이아웃 */}
      <div className="relative h-full flex flex-col justify-center py-4 px-6 md:px-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* 헤더 영역 - 크기 더 축소 */}
          <div className="flex items-center justify-between mb-3">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg font-bold text-white"
            >
              Top News
            </motion.h2>
            
            {/* 우측 상단 뉴스 아이콘 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Newspaper className="w-3.5 h-3.5 text-white/60" />
              <span className="text-[10px] text-white/60">Football News</span>
            </motion.div>
          </div>
          
          <div className="grid gap-2.5">
            {newsItems.slice(0, 3).map((item: any, index: number) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Link 
                  href={`/news/${item.id || index}`}
                  className="block group"
                >
                  <motion.div 
                    whileHover={{ scale: 1.01, x: 3 }}
                    className="relative p-2.5 rounded-xl transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                      backdropFilter: 'blur(20px)',
                      boxShadow: `
                        inset 0 1px 2px rgba(255,255,255,0.1),
                        0 10px 30px -5px rgba(0,0,0,0.3)
                      `,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* 뉴스 순위 표시 - 모두 동일한 스타일 */}
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <span className="text-white">{index + 1}</span>
                      </div>
                      
                      {/* 뉴스 콘텐츠 */}
                      <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-white/50 font-medium">{item.source}</span>
                        {item.publishedAt && (
                          <span className="text-[10px] text-white/40">
                            {formatDistanceToNow(new Date(item.publishedAt), {
                              addSuffix: true,
                              locale: ko
                            })}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm md:text-base font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      
                      <p className="text-xs text-white/60 line-clamp-2">
                        {item.description}
                      </p>
                      </div>
                    </div>
                    
                    {/* Hover Glow Effect */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at center, rgba(59,130,246,0.1), transparent)',
                        filter: 'blur(20px)',
                      }}
                    />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* 하단 버튼 영역 - 중앙 정렬, 크기 축소 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex justify-center"
          >
            <Link href="/news">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="relative group inline-block"
              >
                <div 
                  className="px-4 py-2 rounded-xl backdrop-blur-2xl flex items-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                    boxShadow: `
                      inset 0 1px 2px rgba(255,255,255,0.3),
                      inset 0 -1px 1px rgba(0,0,0,0.1),
                      0 10px 30px -5px rgba(0,0,0,0.4)
                    `,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <span className="text-xs font-semibold text-white">모든 뉴스 보기</span>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-white/80" />
                  </motion.div>
                </div>
                
                {/* Hover Glow */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.1), transparent)',
                    filter: 'blur(10px)',
                  }}
                />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 팀 정보 슬라이드 (개인화)
// ============================================
function TeamSlide({ data }: { data: any }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-slate-900/80 to-slate-800/70" />
      
      {/* 내 팀 라벨 */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500 rounded-full">
          <Heart className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white">내 팀</span>
        </div>
      </div>

      {/* 팀 정보 */}
      <div className="relative h-full flex items-center p-8 md:p-12">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-8 mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 p-4 bg-white/10 backdrop-blur rounded-xl">
              <Image
                src={data.team.logo}
                alt={data.team.name}
                width={160}
                height={160}
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {data.team.name}
              </h2>
              <Badge className="bg-white/20 text-white border-0">
                {data.league.name}
              </Badge>
            </div>
          </div>

          {/* 다음 경기 정보 */}
          {data.nextMatch && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">다음 경기</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={data.nextMatch.opponent.logo}
                    alt={data.nextMatch.opponent.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <div>
                    <p className="text-white font-medium">{data.nextMatch.opponent.name}</p>
                    <p className="text-xs text-white/60">{data.nextMatch.isHome ? '홈' : '원정'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    {new Date(data.nextMatch.date).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-white/60">
                    {new Date(data.nextMatch.date).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 최근 폼 */}
          {data.recentForm && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-2">최근 5경기</p>
                <div className="flex gap-1">
                  {data.recentForm.split('').map((result: string, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center text-xs font-bold",
                        result === 'W' && "bg-green-500 text-white",
                        result === 'D' && "bg-gray-500 text-white",
                        result === 'L' && "bg-red-500 text-white"
                      )}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
              
              <Link href={`/teams/${data.team.id}`}>
                <Button 
                  size="sm" 
                  className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0 whitespace-nowrap flex items-center gap-1"
                >
                  <span>팀 정보 보기</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// 통계/순위 슬라이드
// ============================================
function StatsSlide({ data }: { data: any }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 via-slate-900/80 to-slate-800/70" />
      
      {/* 순위 라벨 */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 rounded-full">
          <Trophy className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white">리그 순위</span>
        </div>
      </div>

      {/* 순위 정보 - 패딩 및 간격 조정 */}
      <div className="relative h-full flex items-center p-6 md:p-8">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4">
            {data.league.name} 상위 5팀
          </h2>
          
          <div className="grid gap-2.5">
            {data.standings.slice(0, 5).map((team: any, index: number) => (
              <div
                key={team.team.id}
                className="flex items-center justify-between bg-white/10 backdrop-blur rounded-lg p-2 md:p-3"
              >
                <div className="flex items-center gap-2 md:gap-3 flex-1">
                  <div className={cn(
                    "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center font-bold text-xs",
                    index === 0 && "bg-yellow-500 text-white",
                    index === 1 && "bg-gray-400 text-white",
                    index === 2 && "bg-orange-600 text-white",
                    index > 2 && "bg-white/20 text-white"
                  )}>
                    {index + 1}
                  </div>
                  <Image
                    src={team.team.logo}
                    alt={team.team.name}
                    width={24}
                    height={24}
                    className="object-contain w-6 h-6 md:w-7 md:h-7"
                  />
                  <span className="text-white font-medium text-sm md:text-base truncate">{team.team.name}</span>
                </div>
                
                <div className="flex items-center gap-3 md:gap-5 text-white">
                  <div className="text-center hidden sm:block">
                    <p className="text-[10px] md:text-xs text-white/60">경기</p>
                    <p className="font-bold text-xs md:text-sm">{team.all.played}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs text-white/60">승점</p>
                    <p className="font-bold text-sm md:text-base">{team.points}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs text-white/60">득실</p>
                    <p className="font-bold text-xs md:text-sm">{team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/standings">
              <Button 
                size="sm" 
                className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0 whitespace-nowrap flex items-center gap-1"
              >
                <span>전체 순위 보기</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 프로모션 슬라이드
// ============================================
function PromotionSlide({ data }: { data: any }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/90 via-purple-900/80 to-slate-800/70" />
      
      {/* 프로모션 내용 */}
      <div className="relative h-full flex items-center justify-center p-8 md:p-12">
        <div className="text-center max-w-3xl">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
            <Bell className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {data.title}
          </h2>
          
          <p className="text-xl text-white/80 mb-8">
            {data.description}
          </p>
          
          {data.features && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {data.features.map((feature: any, index: number) => (
                <div key={index} className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <feature.icon className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-sm text-white">{feature.label}</p>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90"
          >
            {data.buttonText || '자세히 알아보기'}
          </Button>
        </div>
      </div>
    </div>
  )
}