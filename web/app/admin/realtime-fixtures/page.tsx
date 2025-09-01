'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { FootballAPIService } from '@/lib/supabase/football'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, RefreshCw, Clock, Activity, 
  Star, Trash2, Plus, Zap, Timer, CheckCircle,
  XCircle, Eye, EyeOff
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  
  // 빅매치 (주요팀 간 경기)
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

export default function RealtimeFixturesAdmin() {
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [realtimeFixtures, setRealtimeFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)

  // 오늘부터 3일간의 주요 경기 가져오기
  const loadUpcomingMatches = async () => {
    try {
      const service = new FootballAPIService()
      const today = new Date()
      const matches: any[] = []
      
      // 3일간의 경기 가져오기
      for (let i = 0; i < 3; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        
        const response = await service.getFixturesByDate(date)
        if (response?.response) {
          matches.push(...response.response)
        }
      }
      
      // 주요팀 경기만 필터링하고 우선순위 계산
      const majorMatches = matches
        .filter(match => {
          const homeId = match.teams.home.id
          const awayId = match.teams.away.id
          return MAJOR_TEAM_IDS.includes(homeId) || MAJOR_TEAM_IDS.includes(awayId)
        })
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
      
      setUpcomingMatches(majorMatches)
    } catch (error) {
      console.error('Error loading matches:', error)
      toast.error('경기 데이터를 불러오는데 실패했습니다')
    }
  }

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
        toast.success(`${match.teams.home.name} vs ${match.teams.away.name} 실시간 폴링 활성화`)
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
      await Promise.all([loadUpcomingMatches(), loadRealtimeFixtures()])
      setLoading(false)
    }
    init()
  }, [])

  const isRealtimeEnabled = (fixtureId: number) => {
    return realtimeFixtures.some(f => f.fixture_id === fixtureId)
  }

  if (loading) {
    return (
      <div className="min-h-screen lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:ml-64 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">실시간 폴링 관리</h1>
              <p className="text-sm text-gray-500 mt-1">
                중요 경기를 선택하여 실시간 업데이트를 활성화하세요
              </p>
            </div>
          </div>
          
          <Button onClick={() => {
            loadUpcomingMatches()
            loadRealtimeFixtures()
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 현재 실시간 폴링 중인 경기 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">실시간 폴링 활성화된 경기</h2>
            <Badge variant="secondary">{realtimeFixtures.length}</Badge>
          </div>
          
          {realtimeFixtures.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              실시간 폴링이 활성화된 경기가 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {realtimeFixtures.map(fixture => (
                <div 
                  key={fixture.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge className={cn(
                      fixture.priority === 1 ? 'bg-red-500' :
                      fixture.priority === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    )}>
                      P{fixture.priority}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fixture.home_team_name}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="font-medium">{fixture.away_team_name}</span>
                    </div>
                    
                    <Badge variant="outline">{fixture.reason}</Badge>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(fixture.match_date), 'M/d HH:mm', { locale: ko })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={fixture.polling_interval}
                      onChange={(e) => updatePollingInterval(fixture.fixture_id, parseInt(e.target.value))}
                      className="px-3 py-1 text-sm border rounded-lg"
                    >
                      <option value={10}>10초</option>
                      <option value={20}>20초</option>
                      <option value={30}>30초</option>
                      <option value={60}>60초</option>
                    </select>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleRealtimePolling({ 
                        fixture: { id: fixture.fixture_id }, 
                        teams: { home: {}, away: {} } 
                      }, false)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 다가오는 주요 경기 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">다가오는 주요 경기</h2>
            <Badge variant="secondary">{upcomingMatches.length}</Badge>
          </div>
          
          <div className="space-y-2">
            {upcomingMatches.map(match => {
              const isEnabled = isRealtimeEnabled(match.fixture.id)
              const isSaving = saving === match.fixture.id
              
              return (
                <div 
                  key={match.fixture.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                    isEnabled ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge className={cn(
                      match.priority === 1 ? 'bg-red-500' :
                      match.priority === 2 ? 'bg-orange-500' :
                      'bg-blue-500'
                    )}>
                      {match.priority === 1 ? '최고' :
                       match.priority === 2 ? '높음' : '보통'}
                    </Badge>
                    
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
                    
                    <Badge variant="outline">{match.reason}</Badge>
                    
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
                </div>
              )
            })}
          </div>
        </Card>

        {/* 설명 */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            실시간 폴링 우선순위
          </h3>
          <div className="space-y-1 text-sm text-blue-700 dark:text-blue-200">
            <p>• <Badge className="bg-red-500 scale-75 inline">P1</Badge> 최고 (10초): 라이벌전, 빅매치</p>
            <p>• <Badge className="bg-orange-500 scale-75 inline">P2</Badge> 높음 (20초): 챔피언스리그 주요팀</p>
            <p>• <Badge className="bg-blue-500 scale-75 inline">P3</Badge> 보통 (30초): 일반 주요팀 경기</p>
          </div>
        </Card>
      </div>
    </div>
  )
}