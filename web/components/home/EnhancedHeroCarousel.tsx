'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, Circle, Trophy, Star, 
  ChevronLeft, ChevronRight, Pause, Play,
  MapPin, Activity, Zap, Newspaper, TrendingUp,
  Users, BarChart3, Heart, Bell
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

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
      <div className="relative h-[320px] md:h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-transparent animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">콘텐츠 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 슬라이드가 없을 때
  if (slides.length === 0) {
    return (
      <Card className="relative h-[320px] md:h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">표시할 콘텐츠가 없습니다</h3>
          <p className="text-sm text-muted-foreground">곧 업데이트됩니다</p>
        </div>
      </Card>
    )
  }

  const currentSlide = slides[currentIndex]

  return (
    <div className="relative">
      {/* 메인 캐러셀 */}
      <div 
        className="relative h-[320px] md:h-[400px] rounded-2xl overflow-hidden group"
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

        {/* 네비게이션 버튼 */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-10"
              aria-label="이전"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-10"
              aria-label="다음"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* 자동재생 토글 */}
        {slides.length > 1 && (
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 z-10"
            aria-label={isAutoPlaying ? "일시정지" : "재생"}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 인디케이터 */}
      {slides.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all",
                index === currentIndex 
                  ? "w-8 h-2 bg-primary rounded-full" 
                  : "w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400"
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
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-slate-900/80 to-slate-800/70" />
      
      {/* 라이브 인디케이터 */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full animate-pulse">
            <Circle className="w-2 h-2 fill-current" />
            <span className="text-xs font-bold text-white">LIVE</span>
            <span className="text-xs text-white">{data.fixture.status.elapsed}'</span>
          </div>
        </div>
      )}

      {/* 빅매치 표시 */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {isRivalry && (
          <Badge className="bg-red-500/90 backdrop-blur text-white border-0">
            🔥 라이벌전
          </Badge>
        )}
        {isBig6Match && data.league.id === 39 && (
          <Badge className="bg-purple-500/90 backdrop-blur text-white border-0">
            ⚡ 프리미어 빅6
          </Badge>
        )}
        <Badge className="bg-black/50 backdrop-blur text-white border-0">
          {data.league.name}
        </Badge>
      </div>

      {/* 경기 정보 */}
      <div className="relative h-full flex flex-col justify-center p-8 md:p-12">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            {/* 홈팀 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-24 h-24 md:w-32 md:h-32 p-3 bg-white/10 backdrop-blur rounded-xl mb-3">
                <Image
                  src={data.teams.home.logo}
                  alt={data.teams.home.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white text-center">
                {data.teams.home.name}
              </h3>
              <p className="text-sm text-white/60">홈</p>
            </div>

            {/* 점수/시간 */}
            <div className="px-8 text-center">
              {isLive || isFinished ? (
                <div>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl md:text-6xl font-bold text-white">
                      {data.goals?.home ?? 0}
                    </span>
                    <span className="text-3xl text-white/40">:</span>
                    <span className="text-5xl md:text-6xl font-bold text-white">
                      {data.goals?.away ?? 0}
                    </span>
                  </div>
                  {isFinished && (
                    <Badge className="mt-3 bg-white/20 text-white border-0">종료</Badge>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-white">
                    {new Date(data.fixture.date).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="text-lg text-white/60 mt-2">
                    {formatDistanceToNow(new Date(data.fixture.date), {
                      addSuffix: true,
                      locale: ko
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 원정팀 */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-24 h-24 md:w-32 md:h-32 p-3 bg-white/10 backdrop-blur rounded-xl mb-3">
                <Image
                  src={data.teams.away.logo}
                  alt={data.teams.away.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white text-center">
                {data.teams.away.name}
              </h3>
              <p className="text-sm text-white/60">원정</p>
            </div>
          </div>

          {/* 경기장 정보 및 상세보기 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin className="w-4 h-4" />
              <span>{data.fixture.venue?.name || '경기장 정보 없음'}</span>
            </div>
            <Link href={`/fixtures/${data.fixture.id}`}>
              <Button 
                size="sm" 
                className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0"
              >
                경기 상세보기
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/80 to-slate-800/70" />
      
      {/* 뉴스 라벨 */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 rounded-full">
          <Newspaper className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white">주요 뉴스</span>
        </div>
      </div>

      {/* 뉴스 목록 - 3개만 표시, 컴팩트 디자인 */}
      <div className="relative h-full flex items-center p-4 md:p-6">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-base md:text-lg font-bold text-white mb-3">
            주요 뉴스
          </h2>
          
          <div className="space-y-2">
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
                className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0 h-7 text-xs px-3 py-1"
              >
                모든 뉴스 보기
                <ChevronRight className="ml-1 h-3 w-3" />
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
                  className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0"
                >
                  팀 정보 보기
                  <ChevronRight className="ml-2 h-4 w-4" />
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
          
          <div className="space-y-2">
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
                className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0"
              >
                전체 순위 보기
                <ChevronRight className="ml-2 h-4 w-4" />
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