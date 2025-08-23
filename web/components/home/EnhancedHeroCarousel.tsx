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
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToPrevious}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 dark:hover:bg-gray-900/30 z-10 shadow-lg"
              aria-label="이전"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={goToNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 dark:hover:bg-gray-900/30 z-10 shadow-lg"
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
  
  // 빅매치 및 라이벌전 확인
  const homeId = data.teams.home.id
  const awayId = data.teams.away.id
  const premierBig6 = [33, 40, 50, 49, 42, 47]
  const isBig6Match = premierBig6.includes(homeId) || premierBig6.includes(awayId)
  
  const rivalries = [
    [33, 40], // 맨유 vs 리버풀
    [42, 47], // 아스널 vs 토트넘
    [49, 42], // 첼시 vs 아스널
    [49, 47], // 첼시 vs 토트넘
    [541, 529], // 레알 vs 바르샤
    [489, 505], // AC밀란 vs 인터
  ]
  const isRivalry = rivalries.some(([t1, t2]) => 
    (homeId === t1 && awayId === t2) || (homeId === t2 && awayId === t1)
  )

  return (
    <div className="absolute inset-0">
      {/* 그라디언트 배경 - 더 모던하고 깔끔하게 */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/95 via-green-700/90 to-teal-800/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      
      {/* 라이브 인디케이터 - 더 세련되게 */}
      {isLive && (
        <div className="absolute top-6 left-6 z-20">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/90 backdrop-blur-xl rounded-2xl shadow-lg"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-bold text-white">LIVE</span>
            <span className="text-sm text-white/90">{data.fixture.status.elapsed}'</span>
          </motion.div>
        </div>
      )}

      {/* 빅매치 표시 - 더 깔끔하게 */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 items-end">
        {isRivalry && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl backdrop-blur-xl shadow-lg"
          >
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Flame className="w-3 h-3" /> 라이벌전
            </span>
          </motion.div>
        )}
        {isBig6Match && data.league.id === 39 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl backdrop-blur-xl shadow-lg"
          >
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <Zap className="w-3 h-3" /> 빅매치
            </span>
          </motion.div>
        )}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-xl shadow-lg"
        >
          <span className="text-xs font-medium text-white">{data.league.name}</span>
        </motion.div>
      </div>

      {/* 경기 정보 */}
      <div className="relative h-full flex flex-col justify-center p-8 md:p-12">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            {/* 홈팀 - 더 크고 선명하게 */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center mb-4">
                <Image
                  src={data.teams.home.logo}
                  alt={data.teams.home.name}
                  width={144}
                  height={144}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-1">
                {data.teams.home.name}
              </h3>
              <Badge className="bg-white/20 backdrop-blur text-white text-xs border-0">홈</Badge>
            </motion.div>

            {/* 점수/시간 - 더 크고 아름답게 */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="px-8 text-center"
            >
              {isLive || isFinished ? (
                <div>
                  <div className="flex items-center gap-4 justify-center">
                    <motion.span 
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-6xl md:text-7xl font-black text-white drop-shadow-2xl"
                    >
                      {data.goals?.home ?? 0}
                    </motion.span>
                    <span className="text-4xl text-white/30">:</span>
                    <motion.span 
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-6xl md:text-7xl font-black text-white drop-shadow-2xl"
                    >
                      {data.goals?.away ?? 0}
                    </motion.span>
                  </div>
                  {isFinished && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Badge className="mt-4 px-4 py-1.5 bg-white/25 backdrop-blur-xl text-white text-sm font-bold border-0 shadow-lg">
                        종료
                      </Badge>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-white drop-shadow-2xl"
                  >
                    {new Date(data.fixture.date).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </motion.div>
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg text-white/70 mt-3 font-medium"
                  >
                    {formatDistanceToNow(new Date(data.fixture.date), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </motion.div>
                </div>
              )}
            </motion.div>

            {/* 원정팀 - 더 크고 선명하게 */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center mb-4">
                <Image
                  src={data.teams.away.logo}
                  alt={data.teams.away.name}
                  width={144}
                  height={144}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-1">
                {data.teams.away.name}
              </h3>
              <Badge className="bg-white/20 backdrop-blur text-white text-xs border-0">원정</Badge>
            </motion.div>
          </div>

          {/* 경기장 정보 및 상세보기 - 더 세련되게 */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between mt-8"
          >
            <div className="flex items-center gap-2 text-sm text-white/80 font-medium">
              <MapPin className="w-4 h-4" />
              <span>{data.fixture.venue?.name || '경기장 정보 없음'}</span>
            </div>
            <Link href={`/fixtures/${data.fixture.id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }} 
                className="px-5 py-2.5 bg-white/25 backdrop-blur-xl hover:bg-white/35 text-white rounded-2xl font-semibold text-sm shadow-lg transition-all flex items-center gap-2"
              >
                <span>경기 상세보기</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
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
      {/* 모던한 블루 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 via-indigo-700/90 to-purple-800/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      
      {/* 뉴스 라벨 - 더 세련되게 */}
      <div className="absolute top-6 left-6 z-20">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl rounded-2xl shadow-lg"
        >
          <Newspaper className="w-4 h-4 text-white" />
          <span className="text-sm font-bold text-white">주요 뉴스</span>
        </motion.div>
      </div>

      {/* 뉴스 목록 - 3개만 표시, 컴팩트 디자인 */}
      <div className="relative h-full flex items-center p-4 md:p-6">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-base md:text-lg font-bold text-white mb-3">
            주요 뉴스
          </h2>
          
          <div className="grid gap-2.5">
            {newsItems.slice(0, 3).map((item: any, index: number) => (
              <Link 
                key={item.id || index} 
                href={`/news/${item.id || index}`}
                className="block group"
              >
                <div className="bg-white/10 backdrop-blur rounded-lg p-3 hover:bg-white/20 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    {index === 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        HOT
                      </Badge>
                    )}
                    <span className="text-[10px] text-white/50 uppercase">{item.source}</span>
                    {item.publishedAt && (
                      <span className="text-[10px] text-white/40">
                        • {formatDistanceToNow(new Date(item.publishedAt), {
                          addSuffix: true,
                          locale: ko
                        })}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-white/60 line-clamp-1 mt-1">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-3 text-center">
            <Link href="/news">
              <Button 
                size="sm" 
                className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0 h-7 text-xs px-3 py-1 whitespace-nowrap flex items-center gap-1"
              >
                <span>모든 뉴스 보기</span>
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
              </Button>
            </Link>
          </div>
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