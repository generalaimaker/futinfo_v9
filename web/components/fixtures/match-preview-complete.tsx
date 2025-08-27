'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Calendar, MapPin, Users, Clock, TrendingUp, 
  AlertTriangle, Shield, Target, Activity, Info,
  ChevronRight, Star, Zap, ArrowUp, ArrowDown, BarChart3,
  Heart, Brain, Percent, Award, Flag, Timer, 
  ChevronDown, ChevronUp, Eye, Flame,
  UserCheck, UserX, AlertCircle, CheckCircle2, XCircle,
  TrendingDown, Minus, BarChart2, PieChart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FootballAPIService } from '@/lib/supabase/football'
import { getTeamColor } from '@/lib/data/team-colors'
import { advancedModel, type AdvancedPrediction } from '@/lib/prediction/advanced-model'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LeagueStandingsMini } from './league-standings-mini'

interface MatchPreviewCompleteProps {
  fixture: any
}

// Glass 카드 컴포넌트
function GlassCard({ children, className, ...props }: any) {
  return (
    <motion.div 
      className={cn(
        "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
        "border border-white/20 dark:border-gray-800/20",
        "rounded-2xl shadow-lg hover:shadow-xl transition-all",
        className
      )}
      whileHover={{ y: -2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 통계 비교 바
function StatBar({ label, home, away, homeColor = "bg-blue-500", awayColor = "bg-red-500", showPercentage = false }: any) {
  const total = home + away || 1
  const homePercent = (home / total) * 100
  const awayPercent = (away / total) * 100
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span>{home}</span>
        <span className="text-gray-500">{label}</span>
        <span>{away}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div 
          className={cn(homeColor, "transition-all duration-500")}
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className={cn(awayColor, "transition-all duration-500")}
          style={{ width: `${awayPercent}%` }}
        />
      </div>
      {showPercentage && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(homePercent)}%</span>
          <span>{Math.round(awayPercent)}%</span>
        </div>
      )}
    </div>
  )
}

// 정교한 AI 예측 모델 컴포넌트
function PredictionsSection({ fixtureId, fixture }: { fixtureId: number, fixture?: any }) {
  const [predictions, setPredictions] = useState<any>(null)
  const [teamStats, setTeamStats] = useState<any>({ home: null, away: null })
  const [h2hData, setH2HData] = useState<any>(null)
  const [advancedPred, setAdvancedPred] = useState<AdvancedPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [confidence, setConfidence] = useState<number>(0)
  
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const api = new FootballAPIService()
        
        // 병렬로 데이터 수집 (H2H + 최근 경기 추가)
        const [predData, homeStatsData, awayStatsData, h2hDataRaw, homeRecentFixtures, awayRecentFixtures] = await Promise.all([
          api.getPredictions(fixtureId),
          fixture ? api.getTeamStatistics(
            fixture.teams.home.id, 
            fixture.league.season || new Date().getFullYear(),
            fixture.league.id
          ) : null,
          fixture ? api.getTeamStatistics(
            fixture.teams.away.id,
            fixture.league.season || new Date().getFullYear(),
            fixture.league.id
          ) : null,
          fixture ? api.getH2H({
            h2h: `${fixture.teams.home.id}-${fixture.teams.away.id}`
          }) : null,
          // 최근 경기 데이터 추가
          fixture ? api.getTeamFixtures(fixture.teams.home.id, 10) : null,
          fixture ? api.getTeamFixtures(fixture.teams.away.id, 10) : null
        ])
        
        // 최근 경기 통계 계산
        const calculateRecentStats = (fixtures: any[], teamId: number, isHome: boolean) => {
          if (!fixtures || fixtures.length === 0) return null
          
          // 홈/원정 경기만 필터링
          const relevantFixtures = fixtures.filter((f: any) => {
            const isHomeGame = f.teams.home.id === teamId
            return isHome ? isHomeGame : !isHomeGame
          }).slice(0, 5) // 최근 5경기
          
          if (relevantFixtures.length === 0) return null
          
          let totalGoalsFor = 0
          let totalGoalsAgainst = 0
          let wins = 0
          
          relevantFixtures.forEach((f: any) => {
            const homeGoals = f.goals.home || 0
            const awayGoals = f.goals.away || 0
            
            if (f.teams.home.id === teamId) {
              totalGoalsFor += homeGoals
              totalGoalsAgainst += awayGoals
              if (homeGoals > awayGoals) wins++
            } else {
              totalGoalsFor += awayGoals
              totalGoalsAgainst += homeGoals
              if (awayGoals > homeGoals) wins++
            }
          })
          
          const gamesCount = relevantFixtures.length
          return {
            avgGoalsFor: totalGoalsFor / gamesCount,
            avgGoalsAgainst: totalGoalsAgainst / gamesCount,
            winRate: (wins / gamesCount) * 100,
            gamesAnalyzed: gamesCount
          }
        }
        
        const homeRecentStats = calculateRecentStats(homeRecentFixtures, fixture?.teams.home.id, true)
        const awayRecentStats = calculateRecentStats(awayRecentFixtures, fixture?.teams.away.id, false)
        
        setPredictions(predData?.response?.[0])
        setTeamStats({
          home: homeStatsData?.response || homeStatsData,
          away: awayStatsData?.response || awayStatsData,
          homeRecent: homeRecentStats,
          awayRecent: awayRecentStats
        })
        setH2HData(h2hDataRaw?.response)
        
        // H2H 통계 계산
        const h2hStats = {
          homeWins: 0,
          draws: 0,
          awayWins: 0,
          totalGames: 0,
          avgHomeGoals: 0,
          avgAwayGoals: 0,
          recentForm: [] as string[]
        }
        
        if (h2hDataRaw?.response) {
          h2hDataRaw.response.forEach((match: any) => {
            h2hStats.totalGames++
            const homeGoals = match.goals.home
            const awayGoals = match.goals.away
            h2hStats.avgHomeGoals += homeGoals
            h2hStats.avgAwayGoals += awayGoals
            
            if (match.teams.home.id === fixture.teams.home.id) {
              if (homeGoals > awayGoals) h2hStats.homeWins++
              else if (homeGoals < awayGoals) h2hStats.awayWins++
              else h2hStats.draws++
            } else {
              if (awayGoals > homeGoals) h2hStats.homeWins++
              else if (awayGoals < homeGoals) h2hStats.awayWins++
              else h2hStats.draws++
            }
          })
          
          if (h2hStats.totalGames > 0) {
            h2hStats.avgHomeGoals /= h2hStats.totalGames
            h2hStats.avgAwayGoals /= h2hStats.totalGames
          }
        }
        
        // 고급 모델 실행
        if (homeStatsData?.response && awayStatsData?.response) {
          const advanced = advancedModel.predict(
            homeStatsData.response,
            awayStatsData.response,
            h2hStats,
            predData?.response?.[0]?.predictions?.percent,
            fixture
          )
          
          setAdvancedPred(advanced)
          setConfidence(advanced.confidence)
        } else {
          // 폴백: 기존 신뢰도 계산
          calculateConfidence(predData?.response?.[0], homeStatsData?.response, awayStatsData?.response)
        }
      } catch (error) {
        console.error('Error fetching predictions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPredictions()
  }, [fixtureId, fixture])
  
  const calculateConfidence = (pred: any, homeStats: any, awayStats: any) => {
    if (!pred || !homeStats || !awayStats) {
      setConfidence(50)
      return
    }
    
    // 다양한 요소를 고려한 신뢰도 계산
    let confidenceScore = 50 // 기본값
    
    // 최근 폼 고려 (최근 5경기)
    const homeForm = homeStats?.form?.split('').slice(-5).filter((r: string) => r === 'W').length || 0
    const awayForm = awayStats?.form?.split('').slice(-5).filter((r: string) => r === 'W').length || 0
    confidenceScore += (homeForm - awayForm) * 3
    
    // 홈/원정 성적 고려
    if (homeStats?.fixtures?.wins?.home && awayStats?.fixtures?.wins?.away) {
      const homeWinRate = homeStats.fixtures.wins.home / (homeStats.fixtures.played.home || 1)
      const awayWinRate = awayStats.fixtures.wins.away / (awayStats.fixtures.played.away || 1)
      confidenceScore += (homeWinRate - awayWinRate) * 20
    }
    
    // 득실차 고려
    if (homeStats?.goals?.for && awayStats?.goals?.against) {
      const homeAttack = homeStats.goals.for.total.home / (homeStats.fixtures.played.home || 1)
      const awayDefense = awayStats.goals.against.total.away / (awayStats.fixtures.played.away || 1)
      confidenceScore += (homeAttack - awayDefense) * 5
    }
    
    // 0-100 범위로 제한
    setConfidence(Math.max(0, Math.min(100, confidenceScore)))
  }
  
  if (loading) {
    return (
      <GlassCard className="p-6">
        <Skeleton className="h-48 w-full" />
      </GlassCard>
    )
  }
  
  if (!predictions && !advancedPred) return null
  
  // 고급 모델 결과 사용, 없으면 기본 API 예측 사용
  const pred = predictions?.predictions
  const homeWinPercent = advancedPred 
    ? Math.round(advancedPred.homeWin * 100)
    : parseInt(pred?.percent?.home?.replace('%', '') || '0')
  const drawPercent = advancedPred 
    ? Math.round(advancedPred.draw * 100)
    : parseInt(pred?.percent?.draw?.replace('%', '') || '0')
  const awayWinPercent = advancedPred 
    ? Math.round(advancedPred.awayWin * 100)
    : parseInt(pred?.percent?.away?.replace('%', '') || '0')
  
  // 가장 높은 확률 찾기
  const maxPercent = Math.max(homeWinPercent, drawPercent, awayWinPercent)
  const isHomeHighest = homeWinPercent === maxPercent
  const isDrawHighest = drawPercent === maxPercent
  const isAwayHighest = awayWinPercent === maxPercent
  
  // 팀 컬러 가져오기
  const homeTeamColor = getTeamColor(fixture?.teams?.home?.id, fixture?.teams?.home?.name)
  const awayTeamColor = getTeamColor(fixture?.teams?.away?.id, fixture?.teams?.away?.name)
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold">AI 승부 예측</h3>
          {advancedPred && (
            <Badge variant="outline" className="text-xs">
              고급 모델
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          {advancedPred && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-gray-500">불확실성</span>
                    <span className="text-xs font-bold text-amber-600">
                      {Math.round(advancedPred.uncertainty * 100)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">데이터 품질과 샘플 크기 기반 불확실성</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">예측 신뢰도</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i < Math.floor(confidence / 20) 
                      ? "bg-purple-500" 
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-purple-600">
              {Math.round(confidence)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* 승률 예측 - 통합 바 형태 */}
      <div className="space-y-6">
        {/* 팀 이름과 확률 표시 */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">
              {fixture?.teams.home.name || '홈팀'}
            </div>
            <div 
              className="text-2xl font-bold mt-1"
              style={{
                color: isHomeHighest ? homeTeamColor.primary : '#9CA3AF'
              }}
            >
              {homeWinPercent}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="font-medium text-gray-600 dark:text-gray-400">
              무승부
            </div>
            <div className={cn(
              "text-2xl font-bold mt-1",
              isDrawHighest ? "text-gray-700" : "text-gray-500"
            )}>
              {drawPercent}%
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-medium text-gray-900 dark:text-white">
              {fixture?.teams.away.name || '원정팀'}
            </div>
            <div 
              className="text-2xl font-bold mt-1"
              style={{
                color: isAwayHighest ? awayTeamColor.primary : '#9CA3AF'
              }}
            >
              {awayWinPercent}%
            </div>
          </div>
        </div>
        
        {/* 통합 확률 바 */}
        <div className="relative">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
            {/* 홈팀 승리 영역 */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${homeWinPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full relative flex items-center justify-center"
              style={{ 
                minWidth: homeWinPercent > 10 ? 'auto' : '0',
                background: isHomeHighest 
                  ? `linear-gradient(135deg, ${homeTeamColor.primary}, ${homeTeamColor.primary}dd)`
                  : `linear-gradient(135deg, ${homeTeamColor.primary}aa, ${homeTeamColor.primary}88)`
              }}
            >
              {homeWinPercent > 10 && (
                <span className={cn(
                  "font-bold text-sm",
                  homeTeamColor.text === 'white' ? 'text-white' : 'text-black'
                )}>
                  {homeWinPercent}%
                </span>
              )}
            </motion.div>
            
            {/* 무승부 영역 */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${drawPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
              className={cn(
                "h-full relative flex items-center justify-center",
                isDrawHighest 
                  ? "bg-gradient-to-r from-gray-500 to-gray-600" 
                  : "bg-gray-400"
              )}
              style={{ minWidth: drawPercent > 10 ? 'auto' : '0' }}
            >
              {drawPercent > 10 && (
                <span className="text-white font-bold text-sm">
                  {drawPercent}%
                </span>
              )}
            </motion.div>
            
            {/* 원정팀 승리 영역 */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${awayWinPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full relative flex items-center justify-center"
              style={{ 
                minWidth: awayWinPercent > 10 ? 'auto' : '0',
                background: isAwayHighest 
                  ? `linear-gradient(135deg, ${awayTeamColor.primary}, ${awayTeamColor.primary}dd)`
                  : `linear-gradient(135deg, ${awayTeamColor.primary}aa, ${awayTeamColor.primary}88)`
              }}
            >
              {awayWinPercent > 10 && (
                <span className={cn(
                  "font-bold text-sm",
                  awayTeamColor.text === 'white' ? 'text-white' : 'text-black'
                )}>
                  {awayWinPercent}%
                </span>
              )}
            </motion.div>
          </div>
          
          {/* 구분선 표시 */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div 
              className="border-r-2 border-white/30"
              style={{ width: `${homeWinPercent}%` }}
            />
            <div 
              className="border-r-2 border-white/30"
              style={{ width: `${drawPercent}%` }}
            />
          </div>
        </div>
        
        {/* 레이블 */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>홈 승리</span>
          <span>무승부</span>
          <span>원정 승리</span>
        </div>
        
        {/* 주요 지표 */}
        {teamStats.home && teamStats.away && (
          <div className="space-y-3">
            {/* 통계 탭 */}
            <Tabs defaultValue="combined" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="combined" className="text-xs">종합</TabsTrigger>
                <TabsTrigger value="recent" className="text-xs">최근 5경기</TabsTrigger>
                <TabsTrigger value="season" className="text-xs">시즌 전체</TabsTrigger>
              </TabsList>
              
              <TabsContent value="combined" className="mt-4">
                <div className="grid grid-cols-3 gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">평균 득점</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-lg" style={{ color: homeTeamColor.primary }}>
                        {/* 가중 평균: 시즌 40% + 최근 60% */}
                        {(
                          (parseFloat(teamStats.home.goals?.for?.average?.home) || 0) * 0.4 +
                          (teamStats.homeRecent?.avgGoalsFor || parseFloat(teamStats.home.goals?.for?.average?.home) || 0) * 0.6
                        ).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="font-bold text-lg" style={{ color: awayTeamColor.primary }}>
                        {(
                          (parseFloat(teamStats.away.goals?.for?.average?.away) || 0) * 0.4 +
                          (teamStats.awayRecent?.avgGoalsFor || parseFloat(teamStats.away.goals?.for?.average?.away) || 0) * 0.6
                        ).toFixed(1)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">가중평균</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">평균 실점</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-lg" style={{ color: homeTeamColor.primary }}>
                        {(
                          (parseFloat(teamStats.home.goals?.against?.average?.home) || 0) * 0.4 +
                          (teamStats.homeRecent?.avgGoalsAgainst || parseFloat(teamStats.home.goals?.against?.average?.home) || 0) * 0.6
                        ).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="font-bold text-lg" style={{ color: awayTeamColor.primary }}>
                        {(
                          (parseFloat(teamStats.away.goals?.against?.average?.away) || 0) * 0.4 +
                          (teamStats.awayRecent?.avgGoalsAgainst || parseFloat(teamStats.away.goals?.against?.average?.away) || 0) * 0.6
                        ).toFixed(1)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">가중평균</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">승률</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-lg" style={{ color: homeTeamColor.primary }}>
                        {Math.round(
                          ((teamStats.home.fixtures?.wins?.home || 0) / Math.max(1, teamStats.home.fixtures?.played?.home || 1)) * 40 +
                          (teamStats.homeRecent?.winRate || 0) * 0.6
                        )}%
                      </span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="font-bold text-lg" style={{ color: awayTeamColor.primary }}>
                        {Math.round(
                          ((teamStats.away.fixtures?.wins?.away || 0) / Math.max(1, teamStats.away.fixtures?.played?.away || 1)) * 40 +
                          (teamStats.awayRecent?.winRate || 0) * 0.6
                        )}%
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">가중평균</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-4">
                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">평균 득점</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="font-bold" style={{ color: homeTeamColor.primary }}>
                          {teamStats.homeRecent?.avgGoalsFor?.toFixed(1) || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          홈 {teamStats.homeRecent?.gamesAnalyzed || 0}경기
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">vs</span>
                      <div className="flex flex-col items-center">
                        <span className="font-bold" style={{ color: awayTeamColor.primary }}>
                          {teamStats.awayRecent?.avgGoalsFor?.toFixed(1) || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          원정 {teamStats.awayRecent?.gamesAnalyzed || 0}경기
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">평균 실점</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold" style={{ color: homeTeamColor.primary }}>
                        {teamStats.homeRecent?.avgGoalsAgainst?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="font-bold" style={{ color: awayTeamColor.primary }}>
                        {teamStats.awayRecent?.avgGoalsAgainst?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">승률</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold" style={{ color: homeTeamColor.primary }}>
                        {teamStats.homeRecent?.winRate?.toFixed(0) || 'N/A'}%
                      </span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="font-bold" style={{ color: awayTeamColor.primary }}>
                        {teamStats.awayRecent?.winRate?.toFixed(0) || 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="season" className="mt-4">
                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">홈 평균 득점</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="font-bold" style={{ color: homeTeamColor.primary }}>
                          {(parseFloat(teamStats.home.goals?.for?.average?.home) || 0).toFixed(1)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          홈 {teamStats.home.fixtures?.played?.home || 0}경기
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">vs</span>
                      <div className="flex flex-col items-center">
                        <span className="font-bold" style={{ color: awayTeamColor.primary }}>
                          {(parseFloat(teamStats.away.goals?.for?.average?.away) || 0).toFixed(1)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          원정 {teamStats.away.fixtures?.played?.away || 0}경기
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">홈/원정 실점</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold" style={{ color: homeTeamColor.primary }}>
                        {(parseFloat(teamStats.home.goals?.against?.average?.home) || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="font-bold" style={{ color: awayTeamColor.primary }}>
                        {(parseFloat(teamStats.away.goals?.against?.average?.away) || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">최근 폼</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="font-bold" style={{ color: homeTeamColor.primary }}>
                          {teamStats.home.form?.slice(-5).split('').filter((r: string) => r === 'W').length || 0}W
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {teamStats.home.form?.slice(-5) || 'N/A'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">vs</span>
                      <div className="flex flex-col items-center">
                        <span className="font-bold" style={{ color: awayTeamColor.primary }}>
                          {teamStats.away.form?.slice(-5).split('').filter((r: string) => r === 'W').length || 0}W
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {teamStats.away.form?.slice(-5) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* 고급 모델 Factor 분석 */}
        {advancedPred && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-gray-600">폼</span>
                    <span className="text-xs font-bold">
                      {Math.round(advancedPred.factors.formFactor * 100)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">최근 5경기 폼 차이</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-gray-600">홈</span>
                    <span className="text-xs font-bold">
                      {Math.round(advancedPred.factors.homeFactor * 100)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">홈 어드밴티지 요소</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-gray-600">득점</span>
                    <span className="text-xs font-bold">
                      {Math.round(advancedPred.factors.goalsFactor * 100)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">득점력 차이</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-gray-600">상대</span>
                    <span className="text-xs font-bold">
                      {Math.round(advancedPred.factors.h2hFactor * 100)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">상대전적 우위</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-gray-600">체력</span>
                    <span className="text-xs font-bold">
                      {Math.round(advancedPred.factors.fatigueFactor * 100)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">피로도 요소</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-gray-600">동기</span>
                    <span className="text-xs font-bold">
                      {Math.round(advancedPred.factors.motivationFactor * 100)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">경기 중요도</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
      </div>
    </GlassCard>
  )
}

// H2H (상대전적) 컴포넌트
function H2HSection({ fixture }: { fixture: any }) {
  const [h2h, setH2H] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchH2H = async () => {
      try {
        const api = new FootballAPIService()
        const data = await api.getH2H({ team1Id: fixture.teams.home.id, team2Id: fixture.teams.away.id })
        console.log('[H2HSection] H2H data received:', data)
        console.log('[H2HSection] Response array:', data?.response)
        setH2H(data?.response || [])
      } catch (error) {
        console.error('Error fetching H2H:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchH2H()
  }, [fixture])
  
  if (loading) {
    return (
      <GlassCard className="p-6">
        <Skeleton className="h-48 w-full" />
      </GlassCard>
    )
  }
  
  // 데이터가 없거나 비어있을 때 처리
  if (!h2h || h2h.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold">최근 상대전적</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>상대전적 데이터가 없습니다</p>
        </div>
      </GlassCard>
    )
  }
  
  const recentH2H = h2h.slice(0, 5)
  const homeWins = recentH2H.filter(m => 
    (m.teams.home.id === fixture.teams.home.id && m.teams.home.winner) ||
    (m.teams.away.id === fixture.teams.home.id && m.teams.away.winner)
  ).length
  const awayWins = recentH2H.filter(m => 
    (m.teams.home.id === fixture.teams.away.id && m.teams.home.winner) ||
    (m.teams.away.id === fixture.teams.away.id && m.teams.away.winner)
  ).length
  const draws = recentH2H.length - homeWins - awayWins
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold">최근 상대전적</h3>
        <Badge variant="secondary">{recentH2H.length}경기</Badge>
      </div>
      
      {/* 전적 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">{homeWins}</div>
          <div className="text-xs text-gray-500">{fixture.teams.home.name} 승</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="text-2xl font-bold text-gray-600">{draws}</div>
          <div className="text-xs text-gray-500">무승부</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-xl">
          <div className="text-2xl font-bold text-red-600">{awayWins}</div>
          <div className="text-xs text-gray-500">{fixture.teams.away.name} 승</div>
        </div>
      </div>
      
      {/* 최근 경기 목록 */}
      <div className="space-y-2">
        {recentH2H.map((match: any, idx: number) => {
          const homeTeam = match.teams.home
          const awayTeam = match.teams.away
          const isHomeWin = homeTeam.winner
          const isAwayWin = awayTeam.winner
          const matchDate = new Date(match.fixture.date)
          
          return (
            <Link href={`/fixtures/${match.fixture.id}`} key={match.fixture.id}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {/* 날짜와 리그 정보 */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{format(matchDate, 'yyyy.MM.dd')}</span>
                  <div className="flex items-center gap-1">
                    {match.league.logo && (
                      <Image
                        src={match.league.logo}
                        alt={match.league.name}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    )}
                    <span>{match.league.name}</span>
                  </div>
                </div>
                
                {/* 경기 정보 */}
                <div className="flex items-center justify-center gap-3">
                  {/* 홈팀 */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className={cn(
                      "text-sm",
                      isHomeWin && "font-bold"
                    )}>
                      {homeTeam.name}
                    </span>
                    <Image
                      src={homeTeam.logo}
                      alt={homeTeam.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* 스코어 */}
                  <div className="px-4 py-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <span className="font-bold text-lg">
                      {match.goals.home} - {match.goals.away}
                    </span>
                  </div>
                  
                  {/* 어웨이팀 */}
                  <div className="flex items-center gap-2 flex-1">
                    <Image
                      src={awayTeam.logo}
                      alt={awayTeam.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className={cn(
                      "text-sm",
                      isAwayWin && "font-bold"
                    )}>
                      {awayTeam.name}
                    </span>
                  </div>
                </div>
                
                {/* 경기장 정보 (있을 경우) */}
                {match.fixture.venue?.name && (
                  <div className="flex items-center justify-center mt-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{match.fixture.venue.name}</span>
                  </div>
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </GlassCard>
  )
}

// 팀 통계 비교
function TeamStatisticsComparison({ fixture }: { fixture: any }) {
  const router = useRouter()
  const [homeStats, setHomeStats] = useState<any>(null)
  const [awayStats, setAwayStats] = useState<any>(null)
  const [homeRecentFixtures, setHomeRecentFixtures] = useState<any[]>([])
  const [awayRecentFixtures, setAwayRecentFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const api = new FootballAPIService()
        const season = new Date().getFullYear()
        const leagueId = fixture.league.id
        
        const [homeData, awayData, homeRecent, awayRecent] = await Promise.all([
          api.getTeamStatistics(fixture.teams.home.id, season, leagueId),
          api.getTeamStatistics(fixture.teams.away.id, season, leagueId),
          api.getTeamLastFixtures(fixture.teams.home.id, 5),
          api.getTeamLastFixtures(fixture.teams.away.id, 5)
        ])
        
        console.log('Team stats data:', { homeData, awayData })
        setHomeStats(homeData?.response || homeData)
        setAwayStats(awayData?.response || awayData)
        setHomeRecentFixtures(homeRecent?.response || [])
        setAwayRecentFixtures(awayRecent?.response || [])
      } catch (error) {
        console.error('Error fetching team statistics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [fixture])
  
  if (loading) {
    return (
      <GlassCard className="p-6">
        <Skeleton className="h-64 w-full" />
      </GlassCard>
    )
  }
  
  if (!homeStats || !awayStats) return null
  
  const homeForm = homeStats.form?.split('').slice(-5) || []
  const awayForm = awayStats.form?.split('').slice(-5) || []
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-bold">팀 통계 비교</h3>
      </div>
      
      {/* 최근 폼 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3">최근 5경기</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src={fixture.teams.home.logo}
                  alt={fixture.teams.home.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="text-sm font-medium">{fixture.teams.home.name}</span>
              </div>
              <div className="flex gap-1 relative">
                {homeForm.map((result: string, idx: number) => {
                  const match = homeRecentFixtures[idx]
                  const isHome = match?.teams?.home?.id === fixture.teams.home.id
                  const opponent = isHome ? match?.teams?.away : match?.teams?.home
                  const score = match ? `${match.goals.home}-${match.goals.away}` : ''
                  const date = match ? format(new Date(match.fixture.date), 'MM.dd') : ''
                  const matchKey = `home-${idx}`
                  
                  const handleClick = () => {
                    if (match) {
                      window.scrollTo({ top: 0, behavior: 'instant' })
                      router.push(`/fixtures/${match.fixture.id}`)
                    }
                  }
                  
                  return (
                    <div key={idx} className="relative">
                      <div
                        onClick={handleClick}
                        onMouseEnter={() => match && setHoveredMatch(matchKey)}
                        onMouseLeave={() => setHoveredMatch(null)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110",
                          result === 'W' && "bg-green-500 text-white",
                          result === 'D' && "bg-gray-400 text-white",
                          result === 'L' && "bg-red-500 text-white"
                        )}
                      >
                        {result}
                      </div>
                      {match && hoveredMatch === matchKey && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                          <div className="bg-gray-900 text-white rounded-md px-2 py-1 text-xs whitespace-nowrap">
                            <div className="font-medium">{date}</div>
                            <div>{isHome ? 'vs' : '@'} {opponent?.name}</div>
                            <div className="font-bold">{score}</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src={fixture.teams.away.logo}
                  alt={fixture.teams.away.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="text-sm font-medium">{fixture.teams.away.name}</span>
              </div>
              <div className="flex gap-1 relative">
                {awayForm.map((result: string, idx: number) => {
                  const match = awayRecentFixtures[idx]
                  const isHome = match?.teams?.home?.id === fixture.teams.away.id
                  const opponent = isHome ? match?.teams?.away : match?.teams?.home
                  const score = match ? `${match.goals.home}-${match.goals.away}` : ''
                  const date = match ? format(new Date(match.fixture.date), 'MM.dd') : ''
                  const matchKey = `away-${idx}`
                  
                  const handleClick = () => {
                    if (match) {
                      window.scrollTo({ top: 0, behavior: 'instant' })
                      router.push(`/fixtures/${match.fixture.id}`)
                    }
                  }
                  
                  return (
                    <div key={idx} className="relative">
                      <div
                        onClick={handleClick}
                        onMouseEnter={() => match && setHoveredMatch(matchKey)}
                        onMouseLeave={() => setHoveredMatch(null)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110",
                          result === 'W' && "bg-green-500 text-white",
                          result === 'D' && "bg-gray-400 text-white",
                          result === 'L' && "bg-red-500 text-white"
                        )}
                      >
                        {result}
                      </div>
                      {match && hoveredMatch === matchKey && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                          <div className="bg-gray-900 text-white rounded-md px-2 py-1 text-xs whitespace-nowrap">
                            <div className="font-medium">{date}</div>
                            <div>{isHome ? 'vs' : '@'} {opponent?.name}</div>
                            <div className="font-bold">{score}</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
      </div>
      
      {/* 주요 통계 */}
      <div className="space-y-4">
        <StatBar 
          label="평균 득점"
          home={homeStats.goals?.for?.average?.total || 0}
          away={awayStats.goals?.for?.average?.total || 0}
        />
        <StatBar 
          label="평균 실점"
          home={homeStats.goals?.against?.average?.total || 0}
          away={awayStats.goals?.against?.average?.total || 0}
          homeColor="bg-red-500"
          awayColor="bg-blue-500"
        />
        <StatBar 
          label="승률"
          home={homeStats.fixtures?.wins?.total || 0}
          away={awayStats.fixtures?.wins?.total || 0}
          showPercentage
        />
        <StatBar 
          label="클린시트"
          home={homeStats.clean_sheet?.total || 0}
          away={awayStats.clean_sheet?.total || 0}
        />
      </div>
    </GlassCard>
  )
}

// 부상자 명단
function InjuriesSection({ teamId, teamName, teamLogo, fixtureId }: any) {
  const [injuries, setInjuries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  
  useEffect(() => {
    const fetchInjuries = async () => {
      try {
        const api = new FootballAPIService()
        const data = await api.getInjuries(teamId, fixtureId)
        console.log(`[InjuriesSection] Raw injuries data for team ${teamId}:`, data)
        
        // API 응답 구조 확인
        if (data) {
          console.log(`[InjuriesSection] Response structure:`, {
            hasResponse: !!data.response,
            responseLength: data.response?.length,
            firstItem: data.response?.[0]
          })
        }
        
        // 부상자 데이터 설정 - 빈 배열이라도 상태 업데이트
        const injuriesList = data?.response || []
        console.log(`[InjuriesSection] Setting injuries list:`, injuriesList.length, 'injuries')
        setInjuries(injuriesList)
      } catch (error) {
        console.error('Error fetching injuries:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInjuries()
  }, [teamId, fixtureId])
  
  if (loading) {
    return <Skeleton className="h-24 w-full" />
  }
  
  if (injuries.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-700 dark:text-green-400">부상자 없음</span>
      </div>
    )
  }
  
  const displayedInjuries = expanded ? injuries : injuries.slice(0, 6)
  const hasMore = injuries.length > 6
  
  // 리버풀(팀 ID 40)의 경우 로고 크기 조정
  const isLiverpool = teamId === 40
  const logoSize = isLiverpool ? 19 : 20
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex-shrink-0", isLiverpool ? "w-[19px] h-[19px]" : "w-5 h-5")}>
          <Image 
            src={teamLogo} 
            alt={teamName} 
            width={logoSize} 
            height={logoSize} 
            className="object-contain w-full h-full" 
          />
        </div>
        <span className="text-sm font-medium">{teamName}</span>
        <Badge variant="destructive" className="text-xs">{injuries.length}명</Badge>
      </div>
      <div className="space-y-2">
        {displayedInjuries.map((injury: any, idx: number) => {
          // API 응답 구조에 따라 다를 수 있음
          const playerName = injury.player?.name || 'Unknown Player'
          const reason = injury.player?.reason || injury.reason || 'Injured'
          
          return (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">{playerName}</span>
              </div>
              <span className="text-xs text-gray-500">{reason}</span>
            </motion.div>
          )
        })}
      </div>
      
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-2 text-xs"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              접기
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              전체 {injuries.length}명 보기
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export function MatchPreviewComplete({ fixture }: MatchPreviewCompleteProps) {
  const fixtureDate = new Date(fixture.fixture.date)
  
  return (
    <div className="space-y-6">
      {/* AI 예측 */}
      <PredictionsSection fixtureId={fixture.fixture.id} fixture={fixture} />
      
      {/* 상대전적 */}
      <H2HSection fixture={fixture} />
      
      {/* 팀 통계 비교 */}
      <TeamStatisticsComparison fixture={fixture} />
      
      {/* 부상자 명단 */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">Injured and Suspended</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <InjuriesSection 
            teamId={fixture.teams.home.id}
            teamName={fixture.teams.home.name}
            teamLogo={fixture.teams.home.logo}
            fixtureId={fixture.fixture.id}
          />
          <InjuriesSection 
            teamId={fixture.teams.away.id}
            teamName={fixture.teams.away.name}
            teamLogo={fixture.teams.away.logo}
            fixtureId={fixture.fixture.id}
          />
        </div>
      </GlassCard>
      
      {/* 리그 순위 테이블 */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold">현재 리그 순위</h3>
        </div>
        <LeagueStandingsMini
          leagueId={fixture.league.id}
          season={fixture.league.season || new Date().getFullYear()}
          homeTeamId={fixture.teams.home.id}
          awayTeamId={fixture.teams.away.id}
        />
      </GlassCard>
    </div>
  )
}