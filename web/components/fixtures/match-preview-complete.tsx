'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Calendar, MapPin, Users, Clock, TrendingUp, 
  AlertTriangle, Shield, Target, Activity, Info,
  ChevronRight, Star, Zap, ArrowUp, ArrowDown, BarChart3,
  Heart, Brain, Percent, Award, Flag, Timer, 
  ChevronDown, Eye, Flame, Wind, Droplets, ThermometerSun,
  UserCheck, UserX, AlertCircle, CheckCircle2, XCircle,
  TrendingDown, Minus, BarChart2, PieChart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { FootballAPIService } from '@/lib/supabase/football'
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

// 예측 데이터 컴포넌트
function PredictionsSection({ fixtureId }: { fixtureId: number }) {
  const [predictions, setPredictions] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const api = new FootballAPIService()
        const data = await api.getPredictions(fixtureId)
        setPredictions(data?.response?.[0])
      } catch (error) {
        console.error('Error fetching predictions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPredictions()
  }, [fixtureId])
  
  if (loading) {
    return (
      <GlassCard className="p-6">
        <Skeleton className="h-32 w-full" />
      </GlassCard>
    )
  }
  
  if (!predictions) return null
  
  const pred = predictions.predictions
  const homeWinPercent = parseInt(pred?.percent?.home?.replace('%', '') || '0')
  const drawPercent = parseInt(pred?.percent?.draw?.replace('%', '') || '0')
  const awayWinPercent = parseInt(pred?.percent?.away?.replace('%', '') || '0')
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-bold">AI 경기 예측</h3>
      </div>
      
      {/* 승률 예측 */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{homeWinPercent}%</div>
            <div className="text-sm text-gray-500">홈 승리</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{drawPercent}%</div>
            <div className="text-sm text-gray-500">무승부</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{awayWinPercent}%</div>
            <div className="text-sm text-gray-500">원정 승리</div>
          </div>
        </div>
        
        {/* 예측 점수 */}
        {pred?.goals && (
          <div className="bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-950/20 dark:to-red-950/20 rounded-xl p-4">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">예상 스코어</div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl font-bold">{pred.goals.home}</span>
                <span className="text-xl text-gray-400">:</span>
                <span className="text-3xl font-bold">{pred.goals.away}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 조언 */}
        {pred?.advice && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 dark:text-gray-300">{pred.advice}</p>
            </div>
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
        const data = await api.getH2H(fixture.teams.home.id, fixture.teams.away.id)
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
          
          return (
            <motion.div
              key={match.fixture.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <Image
                  src={homeTeam.logo}
                  alt={homeTeam.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span className={cn(
                  "text-sm",
                  isHomeWin && "font-bold"
                )}>
                  {homeTeam.name}
                </span>
              </div>
              
              <div className="px-3">
                <span className="font-bold">
                  {match.goals.home} - {match.goals.away}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className={cn(
                  "text-sm",
                  isAwayWin && "font-bold"
                )}>
                  {awayTeam.name}
                </span>
                <Image
                  src={awayTeam.logo}
                  alt={awayTeam.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </GlassCard>
  )
}

// 팀 통계 비교
function TeamStatisticsComparison({ fixture }: { fixture: any }) {
  const [homeStats, setHomeStats] = useState<any>(null)
  const [awayStats, setAwayStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const api = new FootballAPIService()
        const season = new Date().getFullYear()
        const leagueId = fixture.league.id
        
        const [homeData, awayData] = await Promise.all([
          api.getTeamStatistics(fixture.teams.home.id, season, leagueId),
          api.getTeamStatistics(fixture.teams.away.id, season, leagueId)
        ])
        
        setHomeStats(homeData)
        setAwayStats(awayData)
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
            <div className="flex gap-1">
              {homeForm.map((result: string, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    result === 'W' && "bg-green-500 text-white",
                    result === 'D' && "bg-gray-400 text-white",
                    result === 'L' && "bg-red-500 text-white"
                  )}
                >
                  {result}
                </div>
              ))}
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
            <div className="flex gap-1">
              {awayForm.map((result: string, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    result === 'W' && "bg-green-500 text-white",
                    result === 'D' && "bg-gray-400 text-white",
                    result === 'L' && "bg-red-500 text-white"
                  )}
                >
                  {result}
                </div>
              ))}
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
function InjuriesSection({ teamId, teamName, teamLogo }: any) {
  const [injuries, setInjuries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchInjuries = async () => {
      try {
        const api = new FootballAPIService()
        const data = await api.getInjuries(teamId)
        setInjuries(data?.response || [])
      } catch (error) {
        console.error('Error fetching injuries:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInjuries()
  }, [teamId])
  
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
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Image src={teamLogo} alt={teamName} width={20} height={20} className="object-contain" />
        <span className="text-sm font-medium">{teamName}</span>
        <Badge variant="destructive" className="text-xs">{injuries.length}명</Badge>
      </div>
      {injuries.slice(0, 3).map((injury: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">{injury.player.name}</span>
          </div>
          <span className="text-xs text-gray-500">{injury.player.reason}</span>
        </div>
      ))}
    </div>
  )
}

// 경기장 날씨 정보 (Mock)
function WeatherInfo({ venue }: { venue: any }) {
  // 실제로는 날씨 API를 호출해야 함
  const mockWeather = {
    temp: 18,
    condition: 'partly_cloudy',
    wind: 12,
    humidity: 65
  }
  
  return (
    <div className="flex items-center justify-around p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl">
      <div className="text-center">
        <ThermometerSun className="w-5 h-5 mx-auto mb-1 text-orange-500" />
        <div className="text-sm font-medium">{mockWeather.temp}°C</div>
      </div>
      <div className="text-center">
        <Wind className="w-5 h-5 mx-auto mb-1 text-blue-500" />
        <div className="text-sm font-medium">{mockWeather.wind} km/h</div>
      </div>
      <div className="text-center">
        <Droplets className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
        <div className="text-sm font-medium">{mockWeather.humidity}%</div>
      </div>
    </div>
  )
}

export function MatchPreviewComplete({ fixture }: MatchPreviewCompleteProps) {
  const fixtureDate = new Date(fixture.fixture.date)
  
  return (
    <div className="space-y-6">
      {/* 메인 정보 카드 */}
      <GlassCard className="p-6">
        <div className="space-y-6">
          {/* 경기 시간 및 장소 */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-full mb-4">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">
                {format(fixtureDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
              </span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {format(fixtureDate, 'HH:mm')}
            </div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(fixtureDate, { addSuffix: true, locale: ko })}
            </div>
          </div>
          
          {/* 경기장 정보 */}
          {fixture.fixture.venue && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">{fixture.fixture.venue.name}</div>
                  <div className="text-sm text-gray-500">{fixture.fixture.venue.city}</div>
                </div>
              </div>
              
              {/* 날씨 정보 */}
              <WeatherInfo venue={fixture.fixture.venue} />
            </div>
          )}
          
          {/* 주심 정보 */}
          {fixture.fixture.referee && (
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">주심: <span className="font-medium">{fixture.fixture.referee}</span></span>
            </div>
          )}
        </div>
      </GlassCard>
      
      {/* AI 예측 */}
      <PredictionsSection fixtureId={fixture.fixture.id} />
      
      {/* 상대전적 */}
      <H2HSection fixture={fixture} />
      
      {/* 팀 통계 비교 */}
      <TeamStatisticsComparison fixture={fixture} />
      
      {/* 부상자 명단 */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold">부상 및 출전 의심</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <InjuriesSection 
            teamId={fixture.teams.home.id}
            teamName={fixture.teams.home.name}
            teamLogo={fixture.teams.home.logo}
          />
          <InjuriesSection 
            teamId={fixture.teams.away.id}
            teamName={fixture.teams.away.name}
            teamLogo={fixture.teams.away.logo}
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