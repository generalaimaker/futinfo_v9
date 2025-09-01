'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, Sparkles, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// 더미 데이터로 먼저 테스트
const MOCK_MATCHES = [
  {
    fixture: {
      id: 1,
      date: '2024-08-31T15:00:00+00:00',
      venue: { name: 'Anfield' },
      status: { short: 'NS' }
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
      round: 'Regular Season - 3'
    },
    goals: { home: null, away: null }
  },
  {
    fixture: {
      id: 2,
      date: '2024-08-30T20:00:00+00:00',
      venue: { name: 'Old Trafford' },
      status: { short: 'NS' }
    },
    teams: {
      home: {
        id: 33,
        name: 'Manchester United',
        logo: 'https://media.api-sports.io/football/teams/33.png'
      },
      away: {
        id: 49,
        name: 'Chelsea',
        logo: 'https://media.api-sports.io/football/teams/49.png'
      }
    },
    league: {
      id: 39,
      name: 'Premier League',
      logo: 'https://media.api-sports.io/football/leagues/39.png',
      round: 'Regular Season - 3'
    },
    goals: { home: null, away: null }
  },
  {
    fixture: {
      id: 3,
      date: '2024-08-30T21:00:00+00:00',
      venue: { name: 'Santiago Bernabéu' },
      status: { short: 'NS' }
    },
    teams: {
      home: {
        id: 541,
        name: 'Real Madrid',
        logo: 'https://media.api-sports.io/football/teams/541.png'
      },
      away: {
        id: 529,
        name: 'Barcelona',
        logo: 'https://media.api-sports.io/football/teams/529.png'
      }
    },
    league: {
      id: 140,
      name: 'La Liga',
      logo: 'https://media.api-sports.io/football/leagues/140.png',
      round: 'Regular Season - 3'
    },
    goals: { home: null, away: null }
  }
]

export function UltraModernBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const matches = MOCK_MATCHES

  // 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % matches.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [matches.length])

  const currentMatch = matches[currentIndex]

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

                {/* VS */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="text-center"
                >
                  <div className="relative">
                    <div className="text-6xl font-black text-white/20">VS</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="text-white text-2xl font-bold">
                      {format(new Date(currentMatch.fixture.date), 'HH:mm')}
                    </div>
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
          {matches.map((_, index) => (
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
          onClick={() => setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length)}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % matches.length)}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* 하단 작은 카드들 */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {matches.map((match, index) => (
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
                <span className="text-sm text-white">vs</span>
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