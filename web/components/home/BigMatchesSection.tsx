'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Star, Trophy, Zap, Clock, Activity, 
  ChevronRight, Calendar, MapPin, Bell,
  TrendingUp, Users, Shield, AlertCircle
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTodayFixtures, useLiveMatches } from '@/lib/hooks/useFootballData'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'

// 주요 대회 정의 (그라데이션 추가)
const MAJOR_COMPETITIONS = {
  2: { 
    name: 'Champions League', 
    icon: '⭐', 
    priority: 1, 
    gradient: 'from-indigo-600 via-purple-600 to-purple-700',
    bgPattern: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]'
  },
  3: { 
    name: 'Europa League', 
    icon: '🔥', 
    priority: 2, 
    gradient: 'from-orange-500 via-orange-600 to-red-600',
    bgPattern: 'bg-[conic-gradient(at_left,_var(--tw-gradient-stops))]'
  },
  848: { 
    name: 'Conference League', 
    icon: '🟢', 
    priority: 3, 
    gradient: 'from-green-500 via-emerald-600 to-teal-600',
    bgPattern: 'bg-gradient-to-br'
  },
  39: { // Premier League
    name: 'Premier League', 
    icon: '🦁', 
    priority: 4, 
    gradient: 'from-purple-600 via-pink-600 to-purple-700',
    bgPattern: 'bg-gradient-to-r'
  },
  140: { // La Liga
    name: 'La Liga', 
    icon: '🇪🇸', 
    priority: 4, 
    gradient: 'from-red-600 via-orange-600 to-yellow-600',
    bgPattern: 'bg-gradient-to-br'
  },
  135: { // Serie A
    name: 'Serie A', 
    icon: '🇮🇹', 
    priority: 4, 
    gradient: 'from-blue-600 via-green-600 to-red-600',
    bgPattern: 'bg-gradient-to-r'
  }
}

// 빅클럽 정의 (팀 컬러 추가)
const BIG_CLUBS = {
  // Premier League
  33: { name: 'Manchester United', rivalry: [40], color: '#DA020E', gradient: 'from-red-600 to-red-800' },
  40: { name: 'Liverpool', rivalry: [33, 47], color: '#C8102E', gradient: 'from-red-500 to-red-700' },
  50: { name: 'Manchester City', rivalry: [33], color: '#6CABDD', gradient: 'from-sky-400 to-blue-600' },
  49: { name: 'Chelsea', rivalry: [42, 47], color: '#034694', gradient: 'from-blue-600 to-blue-800' },
  42: { name: 'Arsenal', rivalry: [47, 49], color: '#EF0107', gradient: 'from-red-500 to-red-600' },
  47: { name: 'Tottenham', rivalry: [42, 49], color: '#132257', gradient: 'from-slate-700 to-slate-900' },
  
  // La Liga
  541: { name: 'Real Madrid', rivalry: [529, 530], color: '#FFFFFF', gradient: 'from-gray-100 to-gray-300' },
  529: { name: 'Barcelona', rivalry: [541, 532], color: '#A50044', gradient: 'from-red-600 to-blue-700' },
  530: { name: 'Atletico Madrid', rivalry: [541, 529], color: '#CE3524', gradient: 'from-red-600 to-red-800' },
  
  // Serie A
  489: { name: 'AC Milan', rivalry: [505, 496], color: '#FB090B', gradient: 'from-red-600 to-black' },
  505: { name: 'Inter Milan', rivalry: [489, 496], color: '#0068A8', gradient: 'from-blue-600 to-black' },
  496: { name: 'Juventus', rivalry: [489, 505], color: '#000000', gradient: 'from-gray-800 to-black' },
  
  // Bundesliga
  157: { name: 'Bayern Munich', rivalry: [165], color: '#DC052D', gradient: 'from-red-600 to-red-800' },
  165: { name: 'Borussia Dortmund', rivalry: [157], color: '#FDE100', gradient: 'from-yellow-400 to-yellow-600' },
  
  // Ligue 1
  85: { name: 'PSG', rivalry: [81], color: '#004170', gradient: 'from-blue-700 to-red-600' },
  81: { name: 'Marseille', rivalry: [85], color: '#2FAEE0', gradient: 'from-sky-400 to-sky-600' },
}

// 라이벌전 매칭
const RIVALRY_MATCHES = [
  { teams: [33, 40], name: 'North West Derby', intensity: 'MAX' },
  { teams: [529, 541], name: 'El Clásico', intensity: 'MAX' },
  { teams: [42, 47], name: 'North London Derby', intensity: 'HIGH' },
  { teams: [489, 505], name: 'Derby della Madonnina', intensity: 'HIGH' },
  { teams: [85, 81], name: 'Le Classique', intensity: 'HIGH' },
  { teams: [157, 165], name: 'Der Klassiker', intensity: 'HIGH' },
]

// 메인 히어로 배너 컴포넌트
function MainMatchHero({ fixture, matchInfo }: any) {
  const [timeLeft, setTimeLeft] = useState('')
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)
  const isFinished = fixture.fixture?.status?.short === 'FT'
  const fixtureDate = new Date(fixture.fixture.date)
  
  // 남은 시간 업데이트
  useEffect(() => {
    if (!isLive && !isFinished) {
      const timer = setInterval(() => {
        const now = new Date()
        const diff = fixtureDate.getTime() - now.getTime()
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setTimeLeft(`${hours}시간 ${minutes}분 후`)
        } else {
          setTimeLeft('곧 시작')
        }
      }, 60000)
      return () => clearInterval(timer)
    }
  }, [fixtureDate, isLive, isFinished])

  // 팀 컬러 가져오기
  const homeTeam = BIG_CLUBS[fixture.teams.home.id as keyof typeof BIG_CLUBS]
  const awayTeam = BIG_CLUBS[fixture.teams.away.id as keyof typeof BIG_CLUBS]
  
  // 대회 정보
  const competition = MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS]
  
  // 배경 그라데이션 결정
  const getBackgroundGradient = () => {
    if (matchInfo.type === 'rivalry') {
      return 'from-red-600 via-orange-600 to-red-700'
    }
    if (competition) {
      return competition.gradient
    }
    if (homeTeam && awayTeam) {
      return `${homeTeam.gradient.split(' ')[0]} via-gray-700 ${awayTeam.gradient.split(' ')[1]}`
    }
    return 'from-green-600 via-green-700 to-green-800'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl"
    >
      {/* 배경 그라데이션과 패턴 */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        getBackgroundGradient(),
        "opacity-90"
      )} />
      
      {/* 애니메이션 배경 효과 */}
      {isLive && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-red-500 opacity-10 animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
        </div>
      )}
      
      {/* 노이즈 텍스처 */}
      <div className="absolute inset-0 opacity-5 bg-noise" />
      
      <div className="relative p-8 md:p-10 text-white">
        {/* 상단 정보 */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            {/* 대회/매치 타입 배지 */}
            <div className="flex flex-wrap gap-2">
              {matchInfo.type === 'rivalry' && (
                <Badge className="bg-red-500/20 backdrop-blur-sm border-red-400/50 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  {RIVALRY_MATCHES.find(r => 
                    r.teams.includes(fixture.teams.home.id) && 
                    r.teams.includes(fixture.teams.away.id)
                  )?.name || '라이벌전'}
                </Badge>
              )}
              {competition && (
                <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                  {competition.icon} {competition.name}
                </Badge>
              )}
              <Badge className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <MapPin className="w-3 h-3 mr-1" />
                {fixture.fixture.venue?.name || fixture.league.name}
              </Badge>
            </div>
            
            {/* 리그 정보 */}
            <div className="flex items-center gap-2">
              <Image
                src={fixture.league.logo}
                alt={fixture.league.name}
                width={24}
                height={24}
                className="object-contain opacity-80"
              />
              <span className="text-white/80 text-sm">{fixture.league.name}</span>
            </div>
          </div>
          
          {/* 라이브/시간 상태 */}
          <div className="text-right">
            {isLive ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{fixture.fixture.status.elapsed}'</span>
                <div className="flex items-center gap-1 px-3 py-1 bg-red-500 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">LIVE</span>
                </div>
              </div>
            ) : isFinished ? (
              <Badge className="bg-gray-500/20 backdrop-blur-sm border-gray-400/50 text-white">
                종료
              </Badge>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {format(fixtureDate, 'HH:mm')}
                </div>
                <div className="text-sm text-white/70">{timeLeft}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* 팀 정보 - 중앙 정렬 */}
        <div className="flex items-center justify-center gap-8 md:gap-16 my-12">
          {/* 홈팀 */}
          <motion.div 
            className="flex flex-col items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={100}
                height={100}
                className="relative object-contain drop-shadow-2xl"
              />
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{fixture.teams.home.name}</div>
              {(isLive || isFinished) && (
                <div className="text-4xl font-bold mt-2">{fixture.goals.home ?? 0}</div>
              )}
            </div>
          </motion.div>
          
          {/* VS 또는 스코어 */}
          <div className="text-center">
            {isLive || isFinished ? (
              <div className="text-3xl font-bold text-white/80">-</div>
            ) : (
              <div className="text-2xl font-bold text-white/60">VS</div>
            )}
          </div>
          
          {/* 원정팀 */}
          <motion.div 
            className="flex flex-col items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={100}
                height={100}
                className="relative object-contain drop-shadow-2xl"
              />
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{fixture.teams.away.name}</div>
              {(isLive || isFinished) && (
                <div className="text-4xl font-bold mt-2">{fixture.goals.away ?? 0}</div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* 하단 액션 버튼들 */}
        <div className="flex items-center justify-center gap-3">
          <Link href={`/fixtures/${fixture.fixture.id}`}>
            <Button 
              size="lg"
              className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              경기 상세보기
            </Button>
          </Link>
          <Button 
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <Bell className="w-4 h-4 mr-2" />
            알림 설정
          </Button>
          <Button 
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            통계
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// 서브 매치 카드
function SubMatchCard({ fixture, type }: any) {
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)
  const isFinished = fixture.fixture?.status?.short === 'FT'
  const fixtureDate = new Date(fixture.fixture.date)
  
  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className={cn(
          "relative p-4 rounded-xl border-2 backdrop-blur-sm transition-all",
          "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
          isLive && "border-red-400 shadow-lg shadow-red-500/20",
          !isLive && "border-gray-200 dark:border-gray-700 hover:border-green-400"
        )}
      >
        {/* 라이브 인디케이터 */}
        {isLive && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium">LIVE</span>
            </div>
          </div>
        )}
        
        {/* 팀 정보 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="text-sm font-medium truncate max-w-[100px]">
                {fixture.teams.home.name}
              </span>
            </div>
            {(isLive || isFinished) && (
              <span className="font-bold">{fixture.goals.home ?? 0}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="text-sm font-medium truncate max-w-[100px]">
                {fixture.teams.away.name}
              </span>
            </div>
            {(isLive || isFinished) && (
              <span className="font-bold">{fixture.goals.away ?? 0}</span>
            )}
          </div>
        </div>
        
        {/* 시간/상태 */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{fixture.league.name}</span>
            {isLive ? (
              <span className="text-red-500 font-medium">{fixture.fixture.status.elapsed}'</span>
            ) : isFinished ? (
              <span>종료</span>
            ) : (
              <span>{format(fixtureDate, 'HH:mm')}</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export function BigMatchesSection() {
  const { matches: liveMatches } = useLiveMatches()
  const { fixtures: todayFixtures } = useTodayFixtures()
  const [selectedTab, setSelectedTab] = useState<'all' | 'live' | 'upcoming'>('all')

  // 빅매치 분류 및 우선순위 계산
  const bigMatches = useMemo(() => {
    const allMatches = [...liveMatches, ...todayFixtures]
    const uniqueMatches = allMatches.filter((match, index, self) =>
      index === self.findIndex((m) => m.fixture.id === match.fixture.id)
    )

    const bigMatchesData = uniqueMatches
      .map(fixture => {
        let type: 'rivalry' | 'big_club' | 'major_competition' = 'big_club'
        let priority = 50

        const homeId = fixture.teams.home.id
        const awayId = fixture.teams.away.id

        // 1. 라이벌전 확인 (최우선)
        const rivalry = RIVALRY_MATCHES.find(r => 
          (r.teams.includes(homeId) && r.teams.includes(awayId))
        )
        if (rivalry) {
          type = 'rivalry'
          priority = rivalry.intensity === 'MAX' ? 100 : 90
        }

        // 2. 주요 대회 확인
        if (MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS]) {
          type = 'major_competition'
          priority = Math.max(priority, 80)
        }

        // 3. 빅클럽 참여 확인
        const isBigClub = BIG_CLUBS[homeId as keyof typeof BIG_CLUBS] || 
                          BIG_CLUBS[awayId as keyof typeof BIG_CLUBS]
        if (isBigClub && type === 'big_club') {
          priority = 60
        }

        // 4. 실시간 경기에 보너스
        if (['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)) {
          priority += 20
        }

        // 빅매치 조건을 만족하는지 확인
        const isBigMatch = rivalry || 
          MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS] || 
          isBigClub

        return isBigMatch ? { fixture, type, priority } : null
      })
      .filter(Boolean)
      .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))

    return bigMatchesData as { fixture: any; type: string; priority: number }[]
  }, [liveMatches, todayFixtures])

  // 탭 필터링
  const filteredMatches = useMemo(() => {
    if (selectedTab === 'live') {
      return bigMatches.filter(m => 
        ['LIVE', '1H', '2H', 'HT'].includes(m.fixture.fixture?.status?.short)
      )
    }
    if (selectedTab === 'upcoming') {
      return bigMatches.filter(m => 
        m.fixture.fixture?.status?.short === 'NS'
      )
    }
    return bigMatches
  }, [bigMatches, selectedTab])

  if (bigMatches.length === 0) {
    return null
  }

  const mainMatch = filteredMatches[0]
  const subMatches = filteredMatches.slice(1, 5)

  return (
    <div className="space-y-6">
      {/* 메인 히어로 배너 */}
      {mainMatch && (
        <MainMatchHero 
          fixture={mainMatch.fixture} 
          matchInfo={mainMatch}
        />
      )}
      
      {/* 서브 매치들 */}
      {subMatches.length > 0 && (
        <div className="space-y-4">
          {/* 탭 필터 */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              다른 주요 경기
            </h3>
            <div className="flex gap-2">
              {['all', 'live', 'upcoming'].map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={selectedTab === tab ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab(tab as any)}
                  className="text-xs"
                >
                  {tab === 'all' && '전체'}
                  {tab === 'live' && '라이브'}
                  {tab === 'upcoming' && '예정'}
                </Button>
              ))}
            </div>
          </div>
          
          {/* 서브 매치 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {subMatches.map(({ fixture, type }) => (
                <SubMatchCard
                  key={fixture.fixture.id}
                  fixture={fixture}
                  type={type}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* 모든 경기 보기 링크 */}
      <div className="text-center">
        <Link href="/fixtures">
          <Button variant="outline" className="group">
            모든 경기 보기
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  )
}