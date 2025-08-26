'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Trophy, TrendingUp, TrendingDown, Minus, Activity, Target, Shield, Star, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import footballAPIService from '@/lib/supabase/football'
import { motion, AnimatePresence } from 'framer-motion'

// 주요 리그 설정
const MAJOR_LEAGUES = [
  { 
    id: 39, 
    name: 'Premier League', 
    shortName: 'Premier League',
    country: 'England',
    logo: 'https://media.api-sports.io/football/leagues/39.png',
    gradient: 'from-purple-500 to-indigo-600',
    bgGradient: 'from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20',
    season: 2025
  },
  { 
    id: 140, 
    name: 'La Liga', 
    shortName: 'LaLiga',
    country: 'Spain',
    logo: 'https://media.api-sports.io/football/leagues/140.png',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20',
    season: 2025
  },
  { 
    id: 135, 
    name: 'Serie A', 
    shortName: 'Serie A',
    country: 'Italy',
    logo: 'https://media.api-sports.io/football/leagues/135.png',
    gradient: 'from-blue-500 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20',
    season: 2025
  },
  { 
    id: 78, 
    name: 'Bundesliga', 
    shortName: 'Bundes',
    country: 'Germany',
    logo: 'https://media.api-sports.io/football/leagues/78.png',
    gradient: 'from-red-500 to-gray-700',
    bgGradient: 'from-red-50 to-gray-50 dark:from-red-950/20 dark:to-gray-950/20',
    season: 2025
  },
  { 
    id: 61, 
    name: 'Ligue 1', 
    shortName: 'Ligue 1',
    country: 'France',
    logo: 'https://media.api-sports.io/football/leagues/61.png',
    gradient: 'from-blue-600 to-red-500',
    bgGradient: 'from-blue-50 to-red-50 dark:from-blue-950/20 dark:to-red-950/20',
    season: 2025
  },
  { 
    id: 2, 
    name: 'Champions League', 
    shortName: 'Champions League',
    country: 'Europe',
    logo: 'https://media.api-sports.io/football/leagues/2.png',
    gradient: 'from-indigo-600 to-purple-700',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20',
    season: 2025
  }
]

function StandingsContent() {
  const searchParams = useSearchParams()
  const defaultLeagueId = searchParams.get('league') || '39'
  const currentYear = new Date().getFullYear()
  const season = searchParams.get('season') || currentYear.toString()
  
  const [selectedLeague, setSelectedLeague] = useState(
    MAJOR_LEAGUES.find(l => l.id.toString() === defaultLeagueId) || MAJOR_LEAGUES[0]
  )
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStandings()
  }, [selectedLeague, season])

  const loadStandings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await footballAPIService.getStandings({
        league: selectedLeague.id,
        season: parseInt(season)
      })
      
      if (data?.response?.[0]?.league?.standings?.[0]) {
        setStandings(data.response[0].league.standings[0])
      } else {
        setStandings([])
      }
    } catch (err) {
      setError('순위표를 불러오는데 실패했습니다.')
      console.error('Error loading standings:', err)
    } finally {
      setLoading(false)
    }
  }

  // 순위별 색상 구분
  const getPositionStyle = (position: number) => {
    if (selectedLeague.id === 2) { // Champions League
      if (position <= 8) return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: '16강' }
      if (position <= 16) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: '플레이오프' }
      return { color: 'text-gray-600 dark:text-gray-400', bg: '', label: '' }
    }
    
    // 일반 리그
    if (position <= 4) return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', label: 'UCL' }
    if (position <= 5) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'UEL' }
    if (position <= 6) return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'UECL' }
    if (position >= 18) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', label: '강등' }
    return { color: 'text-gray-700 dark:text-gray-300', bg: '', label: '' }
  }

  // 폼 아이콘
  const getFormIcon = (result: string) => {
    const baseClass = "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
    switch(result) {
      case 'W': return <div className={`${baseClass} bg-green-500`}>W</div>
      case 'D': return <div className={`${baseClass} bg-gray-400`}>D</div>
      case 'L': return <div className={`${baseClass} bg-red-500`}>L</div>
      default: return null
    }
  }

  return (
    <div className="min-h-screen lg:ml-64 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                리그 순위
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">2025 시즌 최신 순위표</p>
            </div>
          </div>
        </motion.div>

        {/* 리그 선택 - 세그먼트 컨트롤 스타일 */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-3 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
            <div className="flex gap-2 justify-center items-center overflow-x-auto scrollbar-hide">
              {MAJOR_LEAGUES.map((league) => (
                <motion.button
                  key={league.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLeague(league)}
                  className={cn(
                    "relative px-4 py-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-2 min-w-[100px]",
                    selectedLeague.id === league.id 
                      ? "shadow-lg" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {selectedLeague.id === league.id && (
                    <motion.div
                      layoutId="activeLeague"
                      className={cn(
                        "absolute inset-0 rounded-xl bg-gradient-to-r opacity-90",
                        league.gradient
                      )}
                      transition={{ type: "spring", duration: 0.3 }}
                    />
                  )}
                  <div className={cn(
                    "relative flex items-center justify-center rounded-lg w-20 h-14 p-2",
                    selectedLeague.id === league.id 
                      ? "bg-white/95 shadow-sm" 
                      : "bg-gray-50 dark:bg-gray-800"
                  )}>
                    <Image
                      src={league.logo}
                      alt={league.name}
                      width={64}
                      height={48}
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const textFallback = document.createElement('div')
                        textFallback.className = 'text-xs font-bold text-gray-700 dark:text-gray-300'
                        textFallback.textContent = league.shortName.substring(0, 3)
                        target.parentNode?.appendChild(textFallback)
                      }}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* 순위 테이블 */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">순위 데이터를 불러오는 중...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          ) : standings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">순위 데이터가 없습니다.</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedLeague.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={cn(
                "overflow-hidden backdrop-blur-sm border-0 shadow-2xl",
                "bg-gradient-to-br", selectedLeague.bgGradient
              )}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">순위</th>
                        <th className="text-left py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">팀</th>
                        <th className="text-center py-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">경기</th>
                        <th className="text-center py-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">승</th>
                        <th className="text-center py-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">무</th>
                        <th className="text-center py-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">패</th>
                        <th className="text-center py-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">득실</th>
                        <th className="text-center py-4 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">승점</th>
                        <th className="text-center py-4 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">최근 5경기</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team: any, index: number) => {
                        const positionStyle = getPositionStyle(team.rank)
                        return (
                          <motion.tr
                            key={team.team.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                              "border-b border-gray-100 dark:border-gray-800 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors",
                              positionStyle.bg && "relative"
                            )}
                          >
                            {/* 순위 */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                  positionStyle.bg,
                                  positionStyle.color
                                )}>
                                  {team.rank}
                                </div>
                                {team.status && (
                                  <div className="flex items-center">
                                    {team.status === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                                    {team.status === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                                  </div>
                                )}
                              </div>
                            </td>
                            
                            {/* 팀 */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Image
                                    src={team.team.logo}
                                    alt={team.team.name}
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {team.team.name}
                                  </p>
                                  {positionStyle.label && (
                                    <p className={cn("text-xs", positionStyle.color)}>
                                      {positionStyle.label}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            
                            {/* 통계 */}
                            <td className="text-center py-4 px-2 font-medium">{team.all?.played || 0}</td>
                            <td className="text-center py-4 px-2 text-green-600 dark:text-green-400 font-medium">{team.all?.win || 0}</td>
                            <td className="text-center py-4 px-2 text-gray-600 dark:text-gray-400">{team.all?.draw || 0}</td>
                            <td className="text-center py-4 px-2 text-red-600 dark:text-red-400">{team.all?.lose || 0}</td>
                            <td className="text-center py-4 px-2">
                              <span className={cn(
                                "font-medium",
                                team.goalsDiff > 0 ? "text-green-600 dark:text-green-400" : 
                                team.goalsDiff < 0 ? "text-red-600 dark:text-red-400" : 
                                "text-gray-600 dark:text-gray-400"
                              )}>
                                {team.goalsDiff > 0 && '+'}{team.goalsDiff || 0}
                              </span>
                            </td>
                            <td className="text-center py-4 px-2">
                              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                                {team.points || 0}
                              </Badge>
                            </td>
                            
                            {/* 최근 폼 */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1 justify-center">
                                {team.form ? 
                                  team.form.split('').slice(-5).map((result: string, idx: number) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: (index * 0.02) + (idx * 0.05) }}
                                    >
                                      {getFormIcon(result)}
                                    </motion.div>
                                  )) : (
                                    <span className="text-gray-400 text-sm">-</span>
                                  )
                                }
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 범례 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-4 text-xs">
                    {selectedLeague.id !== 2 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">챔피언스리그</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">유로파리그</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          <span className="text-gray-600 dark:text-gray-400">컨퍼런스리그</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-gray-600 dark:text-gray-400">강등</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-gray-600 dark:text-gray-400">16강 진출</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-gray-600 dark:text-gray-400">플레이오프</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 추가 정보 카드들 */}
        {!loading && !error && standings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* 득점왕 */}
            <Card className="p-4 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold">최다 득점</h3>
              </div>
              <div className="space-y-2">
                {standings.slice(0, 3).sort((a: any, b: any) => 
                  (b.all?.goals?.for || 0) - (a.all?.goals?.for || 0)
                ).map((team: any, idx: number) => (
                  <div key={team.team.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">#{idx + 1}</span>
                      <Image
                        src={team.team.logo}
                        alt={team.team.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      <span className="text-sm">{team.team.name}</span>
                    </div>
                    <Badge variant="secondary">{team.all?.goals?.for || 0}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* 최소 실점 */}
            <Card className="p-4 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold">최소 실점</h3>
              </div>
              <div className="space-y-2">
                {standings.slice(0, 20).sort((a: any, b: any) => 
                  (a.all?.goals?.against || 0) - (b.all?.goals?.against || 0)
                ).slice(0, 3).map((team: any, idx: number) => (
                  <div key={team.team.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">#{idx + 1}</span>
                      <Image
                        src={team.team.logo}
                        alt={team.team.name}
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      <span className="text-sm">{team.team.name}</span>
                    </div>
                    <Badge variant="secondary">{team.all?.goals?.against || 0}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* 최근 폼 */}
            <Card className="p-4 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold">최고 폼</h3>
              </div>
              <div className="space-y-2">
                {standings.filter((team: any) => team.form)
                  .sort((a: any, b: any) => {
                    const aWins = (a.form.match(/W/g) || []).length
                    const bWins = (b.form.match(/W/g) || []).length
                    return bWins - aWins
                  })
                  .slice(0, 3)
                  .map((team: any, idx: number) => (
                    <div key={team.team.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">#{idx + 1}</span>
                        <Image
                          src={team.team.logo}
                          alt={team.team.name}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span className="text-sm">{team.team.name}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {team.form.slice(-3).split('').map((r: string, i: number) => (
                          <div key={i} className="scale-75">
                            {getFormIcon(r)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function StandingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <StandingsContent />
    </Suspense>
  )
}