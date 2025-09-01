'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, Sparkles, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useFixturesByDate } from '@/lib/supabase/football'

export function UltraModernBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // 실제 경기 데이터 가져오기
  const today = new Date()
  const { data: fixturesData, isLoading } = useFixturesByDate(today)
  
  // 주요 경기만 필터링 (주요 리그)
  const majorLeagues = [39, 140, 135, 78, 61] // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
  const matches = (fixturesData as any)?.response?.filter((match: any) => 
    majorLeagues.includes(match.league.id)
  ).slice(0, 5) || []
  
  // 디버깅: 데이터 구조 확인
  useEffect(() => {
    if (matches.length > 0) {
      console.log('[UltraModernBanner] Matches data:', matches)
      matches.forEach((match, index) => {
        console.log(`Match ${index + 1}:`, {
          status: match.fixture?.status,
          goals: match.goals,
          score: match.score,
          teams: match.teams
        })
      })
    }
  }, [matches])
  
  // 데이터가 없으면 폴백 데이터 사용
  const fallbackMatches = [
    {
      fixture: {
        id: 1,
        date: new Date().toISOString(),
        venue: { name: 'Stadium' },
        status: { short: 'FT', long: 'Match Finished' }
      },
      teams: {
        home: {
          id: 40,
          name: 'Liverpool',
          logo: 'https://media.api-sports.io/football/teams/40.png'
        },
        away: {
          id: 42,
          name: 'Arsenal',
          logo: 'https://media.api-sports.io/football/teams/42.png'
        }
      },
      league: {
        id: 39,
        name: 'Premier League',
        logo: 'https://media.api-sports.io/football/leagues/39.png',
        round: 'Regular Season'
      },
      goals: { home: 2, away: 1 }
    }
  ]
  
  const displayMatches = matches.length > 0 ? matches : fallbackMatches

  // 자동 슬라이드
  useEffect(() => {
    if (displayMatches.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayMatches.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [displayMatches.length])

  const currentMatch = displayMatches[currentIndex]
  
  if (isLoading || !currentMatch) {
    return (
      <div className="w-full h-[500px] rounded-[32px] bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">경기 정보를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 메인 배너 - 완전히 새로운 디자인 */}
      <div className="relative h-[500px] rounded-[32px] overflow-hidden bg-black">
        {/* 애니메이션 배경 */}
        <div className="absolute inset-0">
          {/* 그라데이션 메쉬 */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600 rounded-full filter blur-[150px] animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full filter blur-[150px] animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-600 rounded-full filter blur-[120px] animate-pulse delay-1000" />
          </div>

          {/* 그리드 패턴 */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* 콘텐츠 */}
        <div className="relative h-full flex items-center justify-center p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-4xl"
            >
              {/* 상단 리그 정보 */}
              <div className="flex justify-center mb-8">
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20"
                >
                  <Image
                    src={currentMatch.league.logo}
                    alt={currentMatch.league.name}
                    width={24}
                    height={24}
                  />
                  <span className="text-white font-medium">{currentMatch.league.name}</span>
                  <span className="text-white/60 text-sm">•</span>
                  <span className="text-white/60 text-sm">{currentMatch.league.round}</span>
                </motion.div>
              </div>

              {/* 팀 대결 */}
              <div className="grid grid-cols-3 gap-8 items-center">
                {/* 홈팀 */}
                <motion.div 
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-full blur-2xl scale-150" />
                    <div className="relative w-32 h-32 mx-auto p-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                      <Image
                        src={currentMatch.teams.home.logo}
                        alt={currentMatch.teams.home.name}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold">{currentMatch.teams.home.name}</h3>
                  <p className="text-white/60 text-sm mt-1">홈</p>
                </motion.div>

                {/* 스코어 또는 시간 */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="text-center"
                >
                  <div className="relative">
                    {/* 경기 상태에 따라 다른 표시 */}
                    {currentMatch.fixture.status.short === 'FT' || 
                     currentMatch.fixture.status.short === '2H' || 
                     currentMatch.fixture.status.short === '1H' ||
                     currentMatch.fixture.status.short === 'HT' ? (
                      // 진행중이거나 종료된 경기 - 스코어 표시
                      <div className="flex items-center justify-center gap-6">
                        <div className="px-6 py-3 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20">
                          <span className="block text-5xl font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {currentMatch.goals?.home ?? 
                             currentMatch.score?.fulltime?.home ?? 
                             currentMatch.score?.halftime?.home ?? 
                             0}
                          </span>
                        </div>
                        <span className="text-3xl font-bold text-white/80">:</span>
                        <div className="px-6 py-3 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20">
                          <span className="block text-5xl font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {currentMatch.goals?.away ?? 
                             currentMatch.score?.fulltime?.away ?? 
                             currentMatch.score?.halftime?.away ?? 
                             0}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // 예정된 경기 - VS 표시
                      <>
                        <div className="text-6xl font-black text-white/20">VS</div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {currentMatch.fixture.status.short === 'FT' ? (
                      <div className="text-white/80 text-lg font-medium">경기 종료</div>
                    ) : currentMatch.fixture.status.short === '1H' || currentMatch.fixture.status.short === '2H' ? (
                      <div className="text-green-400 text-lg font-medium animate-pulse">
                        {currentMatch.fixture.status.elapsed}'
                      </div>
                    ) : currentMatch.fixture.status.short === 'HT' ? (
                      <div className="text-yellow-400 text-lg font-medium">하프타임</div>
                    ) : (
                      <div className="text-white text-2xl font-bold">
                        {format(new Date(currentMatch.fixture.date), 'HH:mm')}
                      </div>
                    )}
                    <div className="text-white/60 text-sm">
                      {format(new Date(currentMatch.fixture.date), 'M월 d일', { locale: ko })}
                    </div>
                  </div>
                </motion.div>

                {/* 원정팀 */}
                <motion.div 
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-full blur-2xl scale-150" />
                    <div className="relative w-32 h-32 mx-auto p-4 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                      <Image
                        src={currentMatch.teams.away.logo}
                        alt={currentMatch.teams.away.name}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold">{currentMatch.teams.away.name}</h3>
                  <p className="text-white/60 text-sm mt-1">원정</p>
                </motion.div>
              </div>

              {/* 경기장 정보 */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center mt-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                  <MapPin className="w-4 h-4 text-white/60" />
                  <span className="text-white/80 text-sm">{currentMatch.fixture.venue.name}</span>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 네비게이션 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {displayMatches.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-12 bg-white" 
                  : "bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>

        {/* 좌우 화살표 */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev - 1 + displayMatches.length) % displayMatches.length)}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % displayMatches.length)}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* 하단 작은 카드들 */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {displayMatches.slice(0, 3).map((match, index) => (
          <motion.div
            key={match.fixture.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "p-4 rounded-2xl cursor-pointer transition-all",
              "bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl",
              "border hover:border-white/30",
              index === currentIndex ? "border-white/50 shadow-lg" : "border-white/10"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Image
                  src={match.league.logo}
                  alt={match.league.name}
                  width={16}
                  height={16}
                  className="opacity-70"
                />
                <span className="text-xs text-gray-400">{match.league.name}</span>
              </div>
              <span className="text-xs text-gray-400">
                {format(new Date(match.fixture.date), 'HH:mm')}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={match.teams.home.logo}
                  alt={match.teams.home.name}
                  width={20}
                  height={20}
                />
                {/* 스코어 또는 vs 표시 */}
                {match.fixture.status.short === 'FT' || 
                 match.fixture.status.short === '2H' || 
                 match.fixture.status.short === '1H' ||
                 match.fixture.status.short === 'HT' ? (
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-black/60 rounded text-white font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {match.goals?.home ?? 
                       match.score?.fulltime?.home ?? 
                       match.score?.halftime?.home ?? 
                       0}
                    </span>
                    <span className="text-xs text-gray-300 font-semibold">:</span>
                    <span className="px-2 py-0.5 bg-black/60 rounded text-white font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {match.goals?.away ?? 
                       match.score?.fulltime?.away ?? 
                       match.score?.halftime?.away ?? 
                       0}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-white/80">vs</span>
                )}
                <Image
                  src={match.teams.away.logo}
                  alt={match.teams.away.name}
                  width={20}
                  height={20}
                />
              </div>
              {index === currentIndex && (
                <Zap className="w-4 h-4 text-yellow-400" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}