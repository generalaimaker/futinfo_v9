'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Calendar, Clock, Circle, Trophy, Star, 
  ChevronLeft, ChevronRight, Pause, Play,
  MapPin, Activity, Zap
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { formatMatchTime, formatRelativeTime, formatVenue } from '@/lib/utils/timezone'

interface HeroMatch {
  fixture: any
  teams: any
  goals: any
  league: any
  priority?: number
  reason?: string
}

interface HeroCarouselProps {
  matches: HeroMatch[]
  isLoading?: boolean
  autoPlayInterval?: number
}

export function HeroCarousel({ 
  matches = [], 
  isLoading = false,
  autoPlayInterval = 5000 
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  // 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying || matches.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % matches.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, matches.length, autoPlayInterval, isPaused])

  // 이전/다음 핸들러
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length)
    setIsAutoPlaying(false) // 수동 조작시 자동 재생 중지
  }, [matches.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % matches.length)
    setIsAutoPlaying(false) // 수동 조작시 자동 재생 중지
  }, [matches.length])

  // 인디케이터 클릭 핸들러
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }, [])

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="relative h-[320px] md:h-[380px] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">경기 정보 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  // 경기가 없을 때
  if (matches.length === 0) {
    return (
      <Card className="relative h-[320px] md:h-[380px] flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">오늘 예정된 주요 경기가 없습니다</h3>
          <p className="text-sm text-muted-foreground">곧 더 많은 경기가 업데이트됩니다</p>
        </div>
      </Card>
    )
  }

  const currentMatch = matches[currentIndex]
  const isLive = currentMatch?.fixture?.status?.short === 'LIVE' || 
                 currentMatch?.fixture?.status?.short === '1H' || 
                 currentMatch?.fixture?.status?.short === '2H' ||
                 currentMatch?.fixture?.status?.short === 'HT'
  const isFinished = currentMatch?.fixture?.status?.short === 'FT'

  return (
    <div className="relative">
      {/* 메인 캐러셀 */}
      <div className="relative h-[320px] md:h-[380px] rounded-2xl overflow-hidden group">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0">
          <div className={cn(
            "absolute inset-0 transition-all duration-500",
            isLive ? "bg-gradient-to-br from-red-900/90 via-slate-900/80 to-slate-800/70" :
            isFinished ? "bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-800/70" :
            "bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-primary/20"
          )} />
        </div>

        {/* 우선순위 표시 (왜 이 경기가 선택되었는지) */}
        {currentMatch.reason && (
          <div className="absolute top-4 left-4 z-20">
            <Badge className="bg-white/20 backdrop-blur text-white border-0">
              {currentMatch.reason}
            </Badge>
          </div>
        )}

        {/* 라이브 인디케이터 */}
        {isLive && (
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full animate-pulse">
              <Circle className="w-2 h-2 fill-current" />
              <span className="text-xs font-bold text-white">LIVE</span>
              <span className="text-xs text-white">{currentMatch.fixture.status.elapsed}'</span>
            </div>
          </div>
        )}

        {/* 경기 정보 */}
        <div className="relative h-full flex flex-col justify-center p-8 md:p-12">
          <div className="max-w-5xl mx-auto w-full">
            {/* 리그 정보 */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image
                src={currentMatch.league.logo}
                alt={currentMatch.league.name}
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-white/80 font-medium">{currentMatch.league.name}</span>
              {currentMatch.league.round && (
                <Badge variant="secondary" className="bg-white/10 text-white border-0">
                  {currentMatch.league.round}
                </Badge>
              )}
            </div>

            {/* 팀 정보 */}
            <div className="flex items-center justify-between mb-6">
              {/* 홈팀 */}
              <div className="flex-1 flex items-center gap-4">
                <div className="w-20 h-20 md:w-24 md:h-24 p-3 bg-white/10 backdrop-blur rounded-xl">
                  <Image
                    src={currentMatch.teams.home.logo}
                    alt={currentMatch.teams.home.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">
                    {currentMatch.teams.home.name}
                  </h3>
                  <p className="text-sm text-white/60">홈</p>
                </div>
              </div>

              {/* 점수 또는 시간 */}
              <div className="px-6 md:px-10 text-center">
                {isLive || isFinished ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl md:text-5xl font-bold text-white">
                        {currentMatch.goals?.home ?? 0}
                      </span>
                      <span className="text-2xl text-white/40">:</span>
                      <span className="text-4xl md:text-5xl font-bold text-white">
                        {currentMatch.goals?.away ?? 0}
                      </span>
                    </div>
                    {isFinished && (
                      <Badge className="mt-2 bg-white/20 text-white border-0">종료</Badge>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white">
                      {formatMatchTime(currentMatch.fixture.date)}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      {formatRelativeTime(currentMatch.fixture.date)}
                    </div>
                  </div>
                )}
              </div>

              {/* 원정팀 */}
              <div className="flex-1 flex items-center gap-4 justify-end">
                <div className="text-right">
                  <h3 className="text-xl md:text-2xl font-bold text-white">
                    {currentMatch.teams.away.name}
                  </h3>
                  <p className="text-sm text-white/60">원정</p>
                </div>
                <div className="w-20 h-20 md:w-24 md:h-24 p-3 bg-white/10 backdrop-blur rounded-xl">
                  <Image
                    src={currentMatch.teams.away.logo}
                    alt={currentMatch.teams.away.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* 경기장 정보 및 상세보기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{formatVenue(currentMatch.fixture.venue)}</span>
                </div>
                {currentMatch.fixture.venue?.city && (
                  <span>• {currentMatch.fixture.venue.city}</span>
                )}
              </div>
              <Link href={`/fixtures/${currentMatch.fixture.id}`}>
                <Button 
                  size="sm" 
                  className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0"
                >
                  경기 상세보기
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 좌우 네비게이션 버튼 */}
        {matches.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
              aria-label="이전 경기"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
              aria-label="다음 경기"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* 자동재생 토글 */}
        {matches.length > 1 && (
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            aria-label={isAutoPlaying ? "자동재생 중지" : "자동재생 시작"}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 인디케이터 및 미니 프리뷰 */}
      {matches.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {matches.map((match, index) => {
            const isActive = index === currentIndex
            const matchIsLive = ['LIVE', '1H', '2H', 'HT'].includes(match.fixture?.status?.short)
            
            return (
              <button
                key={match.fixture.id}
                onClick={() => goToSlide(index)}
                className={cn(
                  "relative group transition-all",
                  isActive ? "w-32" : "w-16"
                )}
                aria-label={`경기 ${index + 1}`}
              >
                <div className={cn(
                  "h-12 rounded-lg overflow-hidden transition-all",
                  isActive ? "ring-2 ring-primary ring-offset-2" : "opacity-60 hover:opacity-100"
                )}>
                  <div className="h-full px-2 flex items-center justify-center bg-secondary">
                    {isActive ? (
                      // 활성화된 슬라이드 - 더 많은 정보 표시
                      <div className="flex items-center gap-2">
                        <Image
                          src={match.teams.home.logo}
                          alt=""
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="text-xs font-medium">vs</span>
                        <Image
                          src={match.teams.away.logo}
                          alt=""
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      // 비활성 슬라이드 - 간단한 표시
                      <div className="flex items-center gap-1">
                        {matchIsLive && (
                          <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
                        )}
                        <span className="text-xs">{index + 1}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 툴팁 */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {match.teams.home.name} vs {match.teams.away.name}
                  {matchIsLive && <span className="ml-1 text-red-400">• LIVE</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}