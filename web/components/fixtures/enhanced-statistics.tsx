'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, Area, AreaChart
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Activity, Target, Shield, TrendingUp, Percent } from 'lucide-react'

interface EnhancedStatisticsProps {
  statistics: any
  homeTeam: any
  awayTeam: any
}

// 색상 팔레트
const COLORS = {
  home: '#3B82F6', // blue-500
  away: '#EF4444', // red-500
  neutral: '#9CA3AF', // gray-400
  success: '#10B981', // green-500
  warning: '#F59E0B', // yellow-500
}

// 통계 비교 바 차트 컴포넌트
function StatComparisonBar({ 
  label, 
  homeValue, 
  awayValue, 
  homeLabel, 
  awayLabel,
  showPercentage = false 
}: any) {
  const total = homeValue + awayValue || 1
  const homePercent = (homeValue / total) * 100
  const awayPercent = (awayValue / total) * 100

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-medium">
        <span>{homeLabel}</span>
        <span className="text-muted-foreground">{label}</span>
        <span>{awayLabel}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-blue-500 w-12 text-right">
          {showPercentage ? `${Math.round(homePercent)}%` : homeValue}
        </span>
        
        <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div 
            className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
            style={{ width: `${homePercent}%` }}
          />
          <div 
            className="bg-gradient-to-l from-red-400 to-red-500 transition-all duration-500"
            style={{ width: `${awayPercent}%` }}
          />
        </div>
        
        <span className="text-lg font-bold text-red-500 w-12">
          {showPercentage ? `${Math.round(awayPercent)}%` : awayValue}
        </span>
      </div>
    </div>
  )
}

// 도넛 차트 컴포넌트 (볼 점유율)
function PossessionChart({ homePossession, awayPossession }: any) {
  const data = [
    { name: '홈', value: homePossession, color: COLORS.home },
    { name: '원정', value: awayPossession, color: COLORS.away }
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

// 슈팅 정확도 차트
function ShotsChart({ homeStats, awayStats }: any) {
  const data = [
    {
      category: '전체 슈팅',
      홈: parseInt(homeStats.shotstotal) || parseInt(homeStats.totalshots) || 0,
      원정: parseInt(awayStats.shotstotal) || parseInt(awayStats.totalshots) || 0
    },
    {
      category: '유효 슈팅',
      홈: parseInt(homeStats.shotsontarget) || parseInt(homeStats.shotsongoal) || 0,
      원정: parseInt(awayStats.shotsontarget) || parseInt(awayStats.shotsongoal) || 0
    },
    {
      category: '골대 벗어남',
      홈: parseInt(homeStats.shotsofftarget) || parseInt(homeStats.shotsoffgoal) || 0,
      원정: parseInt(awayStats.shotsofftarget) || parseInt(awayStats.shotsoffgoal) || 0
    },
    {
      category: '차단됨',
      홈: parseInt(homeStats.shotsblocked) || parseInt(homeStats.blockedshots) || 0,
      원정: parseInt(awayStats.shotsblocked) || parseInt(awayStats.blockedshots) || 0
    }
  ]

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: 'none', 
            borderRadius: '8px' 
          }} 
        />
        <Legend />
        <Bar dataKey="홈" fill={COLORS.home} radius={[4, 4, 0, 0]} />
        <Bar dataKey="원정" fill={COLORS.away} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// 레이더 차트 (팀 성과 지표)
function PerformanceRadar({ homeStats, awayStats }: any) {
  const data = [
    {
      metric: '공격력',
      홈: parseInt(homeStats.shotstotal) || parseInt(homeStats.totalshots) || 0,
      원정: parseInt(awayStats.shotstotal) || parseInt(awayStats.totalshots) || 0,
      fullMark: 20
    },
    {
      metric: '정확도',
      홈: parseInt(homeStats.shotsontarget) || parseInt(homeStats.shotsongoal) || 0,
      원정: parseInt(awayStats.shotsontarget) || parseInt(awayStats.shotsongoal) || 0,
      fullMark: 10
    },
    {
      metric: '패스',
      홈: parseInt(homeStats.passespercent) || parseInt(homeStats.passaccuracy) || 0,
      원정: parseInt(awayStats.passespercent) || parseInt(awayStats.passaccuracy) || 0,
      fullMark: 100
    },
    {
      metric: '코너킥',
      홈: parseInt(homeStats.cornerkicks) || parseInt(homeStats.corners) || 0,
      원정: parseInt(awayStats.cornerkicks) || parseInt(awayStats.corners) || 0,
      fullMark: 15
    },
    {
      metric: '점유율',
      홈: parseInt(homeStats.ballpossession) || parseInt(homeStats.possession) || 0,
      원정: parseInt(awayStats.ballpossession) || parseInt(awayStats.possession) || 0,
      fullMark: 100
    }
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
        <Radar name="홈" dataKey="홈" stroke={COLORS.home} fill={COLORS.home} fillOpacity={0.3} />
        <Radar name="원정" dataKey="원정" stroke={COLORS.away} fill={COLORS.away} fillOpacity={0.3} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function EnhancedStatistics({ statistics, homeTeam, awayTeam }: EnhancedStatisticsProps) {
  // 통계 데이터 추출 - statistics가 배열로 직접 전달됨
  console.log('[EnhancedStatistics] Raw statistics:', statistics)
  console.log('[EnhancedStatistics] Type of statistics:', typeof statistics)
  console.log('[EnhancedStatistics] Is Array?:', Array.isArray(statistics))
  console.log('[EnhancedStatistics] First element:', statistics?.[0])
  
  const homeStats = statistics?.[0]?.statistics || []
  const awayStats = statistics?.[1]?.statistics || []
  
  console.log('[EnhancedStatistics] Home stats:', homeStats)
  console.log('[EnhancedStatistics] Away stats:', awayStats)

  // 통계를 객체로 변환
  const getStatObject = (stats: any[]) => {
    const obj: any = {}
    stats.forEach((stat: any) => {
      // 원본 타입도 저장
      const key = stat.type.toLowerCase().replace(/ /g, '').replace('%', 'percent')
      obj[key] = stat.value
      
      // 특별한 케이스 처리
      if (stat.type === 'Ball Possession') {
        obj.ballpossession = stat.value
        obj.possession = parseInt(stat.value) || 0
      }
      if (stat.type === 'Total Shots') {
        obj.shotstotal = stat.value
        obj.totalshots = stat.value
      }
      if (stat.type === 'Shots on Goal') {
        obj.shotsontarget = stat.value
        obj.shotsongoal = stat.value
      }
      if (stat.type === 'Shots off Goal') {
        obj.shotsofftarget = stat.value
        obj.shotsoffgoal = stat.value
      }
      if (stat.type === 'Blocked Shots') {
        obj.shotsblocked = stat.value
        obj.blockedshots = stat.value
      }
      if (stat.type === 'Corner Kicks') {
        obj.cornerkicks = stat.value
        obj.corners = stat.value
      }
      if (stat.type === 'Offsides') {
        obj.offsides = stat.value
        obj.offside = stat.value
      }
      if (stat.type === 'Goalkeeper Saves') {
        obj.goalkeepersaves = stat.value
        obj.saves = stat.value
      }
      if (stat.type === 'Fouls') {
        obj.fouls = stat.value
      }
      if (stat.type === 'Yellow Cards') {
        obj.yellowcards = stat.value
      }
      if (stat.type === 'Red Cards') {
        obj.redcards = stat.value
      }
      if (stat.type === 'Total passes') {
        obj.totalpasses = stat.value
        obj.passestotal = stat.value
      }
      if (stat.type === 'Passes accurate') {
        obj.passesaccurate = stat.value
        obj.passesaccuracy = stat.value
      }
      if (stat.type === 'Passes %') {
        obj.passespercent = stat.value
        obj.passaccuracy = stat.value
      }
    })
    
    console.log('[EnhancedStatistics] Converted stat object:', obj)
    return obj
  }

  const homeStatObj = getStatObject(homeStats)
  const awayStatObj = getStatObject(awayStats)

  if (!homeStats.length || !awayStats.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">통계 데이터가 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">홈 점유율</p>
                <p className="text-2xl font-bold text-blue-500">
                  {homeStatObj.ballpossession || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">유효 슈팅</p>
                <p className="text-xl font-bold">
                  {homeStatObj.shotsontarget || 0} - {awayStatObj.shotsontarget || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">패스 정확도</p>
                <p className="text-xl font-bold">
                  {homeStatObj.passespercent || homeStatObj.passaccuracy || 0} - {awayStatObj.passespercent || awayStatObj.passaccuracy || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">파울</p>
                <p className="text-xl font-bold">
                  {homeStatObj.fouls || 0} - {awayStatObj.fouls || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 볼 점유율 도넛 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">볼 점유율</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">
                {homeStatObj.ballpossession || 0}%
              </p>
              <p className="text-sm text-muted-foreground">{homeTeam.name}</p>
            </div>
            
            <PossessionChart 
              homePossession={parseInt(homeStatObj.ballpossession) || 0}
              awayPossession={parseInt(awayStatObj.ballpossession) || 0}
            />
            
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">
                {awayStatObj.ballpossession || 0}%
              </p>
              <p className="text-sm text-muted-foreground">{awayTeam.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 슈팅 통계 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">슈팅 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <ShotsChart homeStats={homeStatObj} awayStats={awayStatObj} />
        </CardContent>
      </Card>

      {/* 상세 통계 비교 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">상세 통계</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StatComparisonBar
            label="전체 슈팅"
            homeValue={parseInt(homeStatObj.shotstotal) || 0}
            awayValue={parseInt(awayStatObj.shotstotal) || 0}
            homeLabel={homeTeam.name}
            awayLabel={awayTeam.name}
          />
          
          <StatComparisonBar
            label="코너킥"
            homeValue={parseInt(homeStatObj.cornerkicks) || 0}
            awayValue={parseInt(awayStatObj.cornerkicks) || 0}
            homeLabel={homeTeam.name}
            awayLabel={awayTeam.name}
          />
          
          <StatComparisonBar
            label="오프사이드"
            homeValue={parseInt(homeStatObj.offsides) || 0}
            awayValue={parseInt(awayStatObj.offsides) || 0}
            homeLabel={homeTeam.name}
            awayLabel={awayTeam.name}
          />
          
          <StatComparisonBar
            label="선방"
            homeValue={parseInt(homeStatObj.goalkeepersaves) || 0}
            awayValue={parseInt(awayStatObj.goalkeepersaves) || 0}
            homeLabel={homeTeam.name}
            awayLabel={awayTeam.name}
          />
        </CardContent>
      </Card>

      {/* 팀 성과 레이더 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">팀 성과 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceRadar homeStats={homeStatObj} awayStats={awayStatObj} />
        </CardContent>
      </Card>
    </div>
  )
}