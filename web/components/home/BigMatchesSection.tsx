'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Star, Trophy, Zap, Clock, Activity, 
  ChevronRight, Calendar, MapPin 
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTodayFixtures, useLiveMatches } from '@/lib/hooks/useFootballData'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'

// 주요 대회 정의
const MAJOR_COMPETITIONS = {
  2: { name: 'Champions League', icon: '⭐', priority: 1, color: 'from-indigo-600 to-purple-700' },
  3: { name: 'Europa League', icon: '🟡', priority: 2, color: 'from-orange-500 to-orange-600' },
  848: { name: 'Conference League', icon: '🟢', priority: 3, color: 'from-green-500 to-green-600' },
  1: { name: 'World Cup', icon: '🏆', priority: 0, color: 'from-yellow-500 to-yellow-600' },
  4: { name: 'Euro Championship', icon: '🇪🇺', priority: 0, color: 'from-blue-500 to-blue-600' },
}

// 빅클럽 정의 (팀 ID)
const BIG_CLUBS = {
  // Premier League
  33: { name: 'Manchester United', rivalry: [40] }, // vs Liverpool
  40: { name: 'Liverpool', rivalry: [33, 47] }, // vs Man United, Everton
  50: { name: 'Manchester City', rivalry: [33] },
  49: { name: 'Chelsea', rivalry: [42, 47] },
  42: { name: 'Arsenal', rivalry: [47, 49] }, // vs Tottenham, Chelsea
  47: { name: 'Tottenham', rivalry: [42, 49] }, // vs Arsenal, Chelsea
  
  // La Liga
  541: { name: 'Real Madrid', rivalry: [529, 530] }, // vs Barcelona, Atletico
  529: { name: 'Barcelona', rivalry: [541, 532] }, // vs Real Madrid, Valencia
  530: { name: 'Atletico Madrid', rivalry: [541, 529] },
  
  // Serie A
  489: { name: 'AC Milan', rivalry: [505, 496] }, // vs Inter, Juventus
  505: { name: 'Inter Milan', rivalry: [489, 496] },
  496: { name: 'Juventus', rivalry: [489, 505] },
  492: { name: 'Napoli', rivalry: [497] },
  497: { name: 'AS Roma', rivalry: [487] },
  487: { name: 'Lazio', rivalry: [497] },
  
  // Bundesliga
  157: { name: 'Bayern Munich', rivalry: [165] },
  165: { name: 'Borussia Dortmund', rivalry: [157] },
  
  // Ligue 1
  85: { name: 'PSG', rivalry: [81] },
  81: { name: 'Marseille', rivalry: [85] },
}

// 라이벌전 매칭
const RIVALRY_MATCHES = [
  [33, 40], // Man United vs Liverpool (클래시코)
  [529, 541], // Barcelona vs Real Madrid (엘 클래시코)
  [42, 47], // Arsenal vs Tottenham (노스 런던 더비)
  [489, 505], // AC Milan vs Inter (밀라노 더비)
  [85, 81], // PSG vs Marseille (클래시크)
  [157, 165], // Bayern vs Dortmund (데어 클래시커)
]

interface BigMatchCardProps {
  fixture: any
  type: 'rivalry' | 'big_club' | 'major_competition'
  priority: number
}

function BigMatchCard({ fixture, type, priority }: BigMatchCardProps) {
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)
  const isFinished = fixture.fixture?.status?.short === 'FT'
  const fixtureDate = new Date(fixture.fixture.date)
  
  const getMatchTypeInfo = () => {
    switch (type) {
      case 'rivalry':
        return { 
          badge: '🔥 라이벌전', 
          bgColor: 'bg-red-500/10 border-red-300',
          textColor: 'text-red-700'
        }
      case 'major_competition':
        const comp = MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS]
        return { 
          badge: `${comp?.icon} ${comp?.name}`, 
          bgColor: 'bg-purple-500/10 border-purple-300',
          textColor: 'text-purple-700'
        }
      case 'big_club':
      default:
        return { 
          badge: '⭐ 빅매치', 
          bgColor: 'bg-yellow-500/10 border-yellow-300',
          textColor: 'text-yellow-700'
        }
    }
  }

  const matchTypeInfo = getMatchTypeInfo()

  return (
    <Link href={`/fixtures/${fixture.fixture.id}`}>
      <Card className={cn(
        "p-4 hover:shadow-lg transition-all border-2",
        matchTypeInfo.bgColor,
        isLive && "ring-2 ring-red-500 ring-opacity-50"
      )}>
        {/* 매치 타입 배지 */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className={cn("text-xs", matchTypeInfo.textColor)}>
            {matchTypeInfo.badge}
          </Badge>
          {isLive && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-600 font-medium">LIVE</span>
            </div>
          )}
        </div>

        {/* 팀 정보 */}
        <div className="space-y-3">
          {/* 홈팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-medium">{fixture.teams.home.name}</span>
            </div>
            <span className="text-xl font-bold">
              {isLive || isFinished ? fixture.goals.home ?? 0 : ''}
            </span>
          </div>

          {/* VS 또는 시간 */}
          <div className="text-center">
            {isLive || isFinished ? (
              <div className="text-sm text-gray-500">
                {isLive ? `${fixture.fixture.status.elapsed}'` : '종료'}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                {format(fixtureDate, 'HH:mm')}
              </div>
            )}
          </div>

          {/* 원정팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-medium">{fixture.teams.away.name}</span>
            </div>
            <span className="text-xl font-bold">
              {isLive || isFinished ? fixture.goals.away ?? 0 : ''}
            </span>
          </div>
        </div>

        {/* 리그 정보 */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{fixture.league.name}</span>
            {fixture.fixture.venue?.name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {fixture.fixture.venue.name}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

export function BigMatchesSection() {
  const { matches: liveMatches } = useLiveMatches()
  const { fixtures: todayFixtures } = useTodayFixtures()

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
        const isRivalry = RIVALRY_MATCHES.some(([t1, t2]) => 
          (homeId === t1 && awayId === t2) || (homeId === t2 && awayId === t1)
        )
        if (isRivalry) {
          type = 'rivalry'
          priority = 100
        }

        // 2. 주요 대회 확인
        if (MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS]) {
          type = 'major_competition'
          priority = Math.max(priority, 80)
        }

        // 3. 빅클럽 참여 확인
        const isBigClub = BIG_CLUBS[homeId as keyof typeof BIG_CLUBS] || BIG_CLUBS[awayId as keyof typeof BIG_CLUBS]
        if (isBigClub && type === 'big_club') {
          priority = 60
        }

        // 4. 실시간 경기에 보너스
        if (['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)) {
          priority += 20
        }

        // 빅매치 조건을 만족하는지 확인
        const isBigMatch = isRivalry || 
          MAJOR_COMPETITIONS[fixture.league.id as keyof typeof MAJOR_COMPETITIONS] || 
          isBigClub

        return isBigMatch ? { fixture, type, priority } : null
      })
      .filter(Boolean)
      .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))
      .slice(0, 6) // 상위 6개만

    return bigMatchesData as { fixture: any; type: 'rivalry' | 'big_club' | 'major_competition'; priority: number }[]
  }, [liveMatches, todayFixtures])

  if (bigMatches.length === 0) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          오늘의 빅매치
        </h3>
        <Link href="/fixtures" className="text-sm text-primary hover:underline flex items-center gap-1">
          더보기 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bigMatches.map(({ fixture, type, priority }) => (
          <BigMatchCard
            key={fixture.fixture.id}
            fixture={fixture}
            type={type}
            priority={priority}
          />
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500/20 border border-red-300 rounded" />
          <span>라이벌전</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500/20 border border-purple-300 rounded" />
          <span>주요대회</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-300 rounded" />
          <span>빅클럽</span>
        </div>
      </div>
    </Card>
  )
}