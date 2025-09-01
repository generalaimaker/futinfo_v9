'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FootballAPIService } from '@/lib/supabase/football'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, Clock, Activity, Star, Trash2, 
  Zap, Eye, EyeOff, ChevronRight, Timer,
  Trophy, Shield, Users, TrendingUp
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// 주요 팀 정의
const MAJOR_TEAMS = {
  '프리미어리그': [
    { id: 33, name: 'Manchester United' },
    { id: 40, name: 'Liverpool' },
    { id: 50, name: 'Manchester City' },
    { id: 49, name: 'Chelsea' },
    { id: 42, name: 'Arsenal' },
    { id: 47, name: 'Tottenham' }
  ],
  '라리가': [
    { id: 541, name: 'Real Madrid' },
    { id: 529, name: 'Barcelona' },
    { id: 530, name: 'Atletico Madrid' }
  ],
  '세리에A': [
    { id: 496, name: 'Juventus' },
    { id: 505, name: 'Inter Milan' },
    { id: 489, name: 'AC Milan' },
    { id: 492, name: 'Napoli' }
  ],
  '분데스리가': [
    { id: 157, name: 'Bayern Munich' },
    { id: 165, name: 'Borussia Dortmund' },
    { id: 168, name: 'Bayer Leverkusen' }
  ],
  '리그1': [
    { id: 85, name: 'PSG' },
    { id: 81, name: 'Marseille' },
    { id: 91, name: 'Monaco' }
  ]
}

const MAJOR_TEAM_IDS = Object.values(MAJOR_TEAMS).flat().map(t => t.id)

// 경기 우선순위 판단
function getMatchPriority(match: any): { priority: number; reason: string } {
  const homeId = match.teams.home.id
  const awayId = match.teams.away.id
  
  // 라이벌전
  const rivalries = [
    { teams: [33, 40], name: '맨유 vs 리버풀' },
    { teams: [541, 529], name: '엘 클라시코' },
    { teams: [505, 489], name: '밀라노 더비' },
    { teams: [157, 165], name: '데어 클래시커' },
    { teams: [42, 47], name: '북런던 더비' }
  ]
  
  for (const rivalry of rivalries) {
    if (rivalry.teams.includes(homeId) && rivalry.teams.includes(awayId)) {
      return { priority: 1, reason: rivalry.name }
    }
  }
  
  // 빅매치
  const homeMajor = MAJOR_TEAM_IDS.includes(homeId)
  const awayMajor = MAJOR_TEAM_IDS.includes(awayId)
  
  if (homeMajor && awayMajor) {
    return { priority: 1, reason: '빅매치' }
  }
  
  // 챔피언스리그
  if (match.league.id === 2) {
    if (homeMajor || awayMajor) {
      return { priority: 2, reason: '챔피언스리그' }
    }
  }
  
  // 주요팀 경기
  if (homeMajor || awayMajor) {
    return { priority: 3, reason: '주요팀 경기' }
  }
  
  return { priority: 99, reason: '일반 경기' }
}

export default function RealtimePollingManager() {
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [realtimeFixtures, setRealtimeFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [selectedDays, setSelectedDays] = useState(3)
  const [showAllMatches, setShowAllMatches] = useState(false)
  const [matchType, setMatchType] = useState<'upcoming' | 'live' | 'both'>('both')

  // 실시간 진행 중인 경기 가져오기
  const loadLiveMatches = useCallback(async () => {
    try {
      const service = new FootballAPIService()
      const response = await service.getLiveFixtures()
      
      if (response?.response) {
        // 모든 경기 또는 주요팀 경기만 필터링
        const filteredMatches = showAllMatches 
          ? response.response 
          : response.response.filter((match: any) => {
              const homeId = match.teams.home.id
              const awayId = match.teams.away.id
              return MAJOR_TEAM_IDS.includes(homeId) || MAJOR_TEAM_IDS.includes(awayId)
            })
        
        const matchesWithPriority = filteredMatches
          .map((match: any) => ({
            ...match,
            ...getMatchPriority(match)
          }))
          .sort((a: any, b: any) => a.priority - b.priority)
        
        setLiveMatches(matchesWithPriority)
      }
    } catch (error) {
      console.error('Error loading live matches:', error)
      toast.error('라이브 경기를 불러오는데 실패했습니다')
    }
  }, [showAllMatches]);

  // 다가오는 경기 가져오기
  const loadUpcomingMatches = useCallback(async () => {
    try {
      const service = new FootballAPIService()
      const today = new Date()
      const matches: any[] = []
      
      // 선택된 일수만큼 경기 가져오기
      for (let i = 0; i < selectedDays; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        
        const response = await service.getFixturesByDate(date)
        if (response?.response) {
          matches.push(...response.response)
        }
      }
      
      // 모든 경기 또는 주요팀 경기만 필터링
      const filteredMatches = showAllMatches
        ? matches
        : matches.filter(match => {
            const homeId = match.teams.home.id
            const awayId = match.teams.away.id
            return MAJOR_TEAM_IDS.includes(homeId) || MAJOR_TEAM_IDS.includes(awayId)
          })
      
      const matchesWithPriority = filteredMatches
        .map(match => ({
          ...match,
          ...getMatchPriority(match)
        }))
        .sort((a, b) => {
          // 우선순위로 정렬
          if (a.priority !== b.priority) return a.priority - b.priority
          // 같은 우선순위면 날짜순
          return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
        })
      
      setUpcomingMatches(matchesWithPriority)
    } catch (error) {
      console.error('Error loading matches:', error)
      toast.error('경기 데이터를 불러오는데 실패했습니다')
    }
  }, [selectedDays, showAllMatches]);

  // 현재 실시간 폴링 중인 경기 가져오기
  const loadRealtimeFixtures = async () => {
    try {
      const { data, error } = await supabase
        .from('realtime_fixtures')
        .select('*')
        .order('match_date', { ascending: true })
      
      if (error) throw error
      setRealtimeFixtures(data || [])
    } catch (error) {
      console.error('Error loading realtime fixtures:', error)
      toast.error('실시간 폴링 목록을 불러오는데 실패했습니다')
    }
  }

  // 실시간 폴링 추가/제거
  const toggleRealtimePolling = async (match: any, enable: boolean) => {
    setSaving(match.fixture.id)
    
    try {
      if (enable) {
        const { priority, reason } = getMatchPriority(match)
        
        // 폴링 간격 설정 (우선순위에 따라)
        const pollingInterval = priority === 1 ? 10 : priority === 2 ? 20 : 30
        
        const { error } = await supabase
          .from('realtime_fixtures')
          .upsert({
            fixture_id: match.fixture.id,
            match_date: match.fixture.date,
            home_team_id: match.teams.home.id,
            home_team_name: match.teams.home.name,
            away_team_id: match.teams.away.id,
            away_team_name: match.teams.away.name,
            league_id: match.league.id,
            league_name: match.league.name,
            priority,
            polling_interval: pollingInterval,
            reason,
            is_active: true
          })
        
        if (error) throw error
        toast.success(`실시간 폴링 활성화: ${match.teams.home.name} vs ${match.teams.away.name}`)
      } else {
        const { error } = await supabase
          .from('realtime_fixtures')
          .delete()
          .eq('fixture_id', match.fixture.id)
        
        if (error) throw error
        toast.success('실시간 폴링 비활성화')
      }
      
      await loadRealtimeFixtures()
    } catch (error) {
      console.error('Error toggling realtime polling:', error)
      toast.error('설정 변경에 실패했습니다')
    } finally {
      setSaving(null)
    }
  }

  // 폴링 간격 변경
  const updatePollingInterval = async (fixtureId: number, interval: number) => {
    try {
      const { error } = await supabase
        .from('realtime_fixtures')
        .update({ polling_interval: interval })
        .eq('fixture_id', fixtureId)
      
      if (error) throw error
      toast.success(`폴링 간격이 ${interval}초로 변경되었습니다`)
      await loadRealtimeFixtures()
    } catch (error) {
      console.error('Error updating interval:', error)
      toast.error('폴링 간격 변경에 실패했습니다')
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const promises = [loadRealtimeFixtures()]
      
      if (matchType === 'upcoming' || matchType === 'both') {
        promises.push(loadUpcomingMatches())
      }
      if (matchType === 'live' || matchType === 'both') {
        promises.push(loadLiveMatches())
      }
      
      await Promise.all(promises)
      setLoading(false)
    }
    init()
  }, [selectedDays, showAllMatches, matchType, loadUpcomingMatches, loadLiveMatches])

  // 30초마다 라이브 경기 새로고침
  useEffect(() => {
    if (matchType === 'live' || matchType === 'both') {
      const interval = setInterval(() => {
        loadLiveMatches()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [matchType, loadLiveMatches])

  const isRealtimeEnabled = (fixtureId: number) => {
    return realtimeFixtures.some(f => f.fixture_id === fixtureId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            실시간 폴링 관리
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            중요 경기를 선택하여 실시간 업데이트를 활성화하세요
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value as any)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="both">전체 경기</option>
            <option value="live">🔴 라이브</option>
            <option value="upcoming">📅 예정</option>
          </select>
          
          {matchType !== 'live' && (
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
            >
              <option value={1}>오늘</option>
              <option value={3}>3일간</option>
              <option value={7}>일주일</option>
            </select>
          )}
          
          <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={showAllMatches}
              onChange={(e) => setShowAllMatches(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">모든 경기 보기</span>
          </label>
          
          <Button onClick={() => {
            loadRealtimeFixtures()
            if (matchType === 'upcoming' || matchType === 'both') loadUpcomingMatches()
            if (matchType === 'live' || matchType === 'both') loadLiveMatches()
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 현재 실시간 폴링 중인 경기 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            실시간 폴링 활성화된 경기
            <Badge variant="secondary">{realtimeFixtures.length}</Badge>
          </h3>
        </div>
        
        {realtimeFixtures.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>실시간 폴링이 활성화된 경기가 없습니다</p>
            <p className="text-sm mt-1">아래에서 경기를 선택해주세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {realtimeFixtures.map(fixture => (
                <motion.div
                  key={fixture.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "shadow-sm",
                        fixture.priority === 1 ? 'bg-red-500' :
                        fixture.priority === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      )}>
                        P{fixture.priority}
                      </Badge>
                      
                      <Badge variant="outline" className="bg-white/50">
                        {fixture.reason}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{fixture.home_team_name}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="font-semibold">{fixture.away_team_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(fixture.match_date), 'M/d HH:mm', { locale: ko })}
                    </div>
                    
                    <Badge variant="secondary" className="bg-white/50">
                      {fixture.league_name}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-lg">
                      <Timer className="w-4 h-4 text-gray-500" />
                      <select
                        value={fixture.polling_interval}
                        onChange={(e) => updatePollingInterval(fixture.fixture_id, parseInt(e.target.value))}
                        className="bg-transparent text-sm font-medium"
                      >
                        <option value={10}>10초</option>
                        <option value={20}>20초</option>
                        <option value={30}>30초</option>
                        <option value={60}>60초</option>
                      </select>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleRealtimePolling({ 
                        fixture: { id: fixture.fixture_id }, 
                        teams: { home: {}, away: {} } 
                      }, false)}
                      className="hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>

      {/* 라이브 경기 섹션 */}
      {(matchType === 'live' || matchType === 'both') && liveMatches.length > 0 && (
        <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500 animate-pulse" />
              🔴 실시간 진행 중
              <Badge variant="destructive">{liveMatches.length}</Badge>
            </h3>
          </div>
          
          <div className="space-y-2">
            {liveMatches.map(match => {
              const isEnabled = isRealtimeEnabled(match.fixture.id)
              const isSaving = saving === match.fixture.id
              
              return (
                <motion.div 
                  key={match.fixture.id}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    isEnabled 
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800" 
                      : "bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge className="bg-red-500 animate-pulse">
                      {match.fixture.status.elapsed}'
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "shadow-sm",
                        match.priority === 1 ? 'bg-red-500' :
                        match.priority === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      )}>
                        {match.priority === 1 ? '최고' :
                         match.priority === 2 ? '높음' : '보통'}
                      </Badge>
                      
                      <Badge variant="outline">{match.reason}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Image
                          src={match.teams.home.logo}
                          alt=""
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                        <span className="font-medium">{match.teams.home.name}</span>
                        <Badge variant="secondary">{match.goals?.home || 0}</Badge>
                      </div>
                      
                      <span className="text-gray-400">vs</span>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{match.goals?.away || 0}</Badge>
                        <span className="font-medium">{match.teams.away.name}</span>
                        <Image
                          src={match.teams.away.logo}
                          alt=""
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                    </div>
                    
                    <Badge variant="secondary">{match.league.name}</Badge>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={isEnabled ? "destructive" : "default"}
                    onClick={() => toggleRealtimePolling(match, !isEnabled)}
                    disabled={isSaving}
                    className={cn(
                      "min-w-[100px]",
                      !isEnabled && "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    )}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : isEnabled ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        비활성화
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        활성화
                      </>
                    )}
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 예정 경기 섹션 */}
      {(matchType === 'upcoming' || matchType === 'both') && upcomingMatches.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {matchType === 'both' ? '예정된 경기' : '다가오는 주요 경기'}
              <Badge variant="secondary">{upcomingMatches.length}</Badge>
            </h3>
          </div>
          
          <div className="space-y-2">
            {upcomingMatches.map(match => {
            const isEnabled = isRealtimeEnabled(match.fixture.id)
            const isSaving = saving === match.fixture.id
            
            return (
              <motion.div 
                key={match.fixture.id}
                whileHover={{ scale: 1.01 }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  isEnabled 
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "shadow-sm",
                      match.priority === 1 ? 'bg-red-500' :
                      match.priority === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    )}>
                      {match.priority === 1 ? '최고' :
                       match.priority === 2 ? '높음' : '보통'}
                    </Badge>
                    
                    <Badge variant="outline">{match.reason}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Image
                        src={match.teams.home.logo}
                        alt=""
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span className="font-medium">{match.teams.home.name}</span>
                    </div>
                    
                    <span className="text-gray-400">vs</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.teams.away.name}</span>
                      <Image
                        src={match.teams.away.logo}
                        alt=""
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    {format(new Date(match.fixture.date), 'M/d HH:mm', { locale: ko })}
                  </div>
                  
                  <Badge variant="secondary">{match.league.name}</Badge>
                </div>
                
                <Button
                  size="sm"
                  variant={isEnabled ? "destructive" : "default"}
                  onClick={() => toggleRealtimePolling(match, !isEnabled)}
                  disabled={isSaving}
                  className={cn(
                    "min-w-[100px]",
                    !isEnabled && "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  )}
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isEnabled ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      비활성화
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      활성화
                    </>
                  )}
                </Button>
              </motion.div>
            )
          })}
        </div>
      </Card>
      )}

      {/* 설명 */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          실시간 폴링 우선순위
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Badge className="bg-red-500 mt-1">P1</Badge>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">최고 (10초)</p>
              <p className="text-sm text-blue-700 dark:text-blue-200">라이벌전, 빅매치</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-orange-500 mt-1">P2</Badge>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">높음 (20초)</p>
              <p className="text-sm text-blue-700 dark:text-blue-200">챔피언스리그 주요팀</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Badge className="bg-blue-500 mt-1">P3</Badge>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">보통 (30초)</p>
              <p className="text-sm text-blue-700 dark:text-blue-200">일반 주요팀 경기</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-700 dark:text-blue-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            실시간 폴링이 활성화된 경기는 설정된 간격으로 자동 업데이트됩니다
          </p>
        </div>
      </Card>
    </div>
  )
}