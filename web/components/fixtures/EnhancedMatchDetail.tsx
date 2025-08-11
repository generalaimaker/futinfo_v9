'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Trophy, Users, Clock, MapPin, AlertCircle, 
  TrendingUp, Target, Shield, Activity, BarChart3,
  ChevronRight, Star, Zap, ArrowUp, ArrowDown
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface EnhancedMatchDetailProps {
  fixture: any
  isLive?: boolean
  onRefresh?: () => void
}

// 통계 비교 컴포넌트
function StatComparison({ label, home, away, homePercentage, awayPercentage }: any) {
  const homeWidth = homePercentage || (home / (home + away)) * 100
  const awayWidth = awayPercentage || (away / (home + away)) * 100
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{home}</span>
        <span className="font-medium">{label}</span>
        <span>{away}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
        <div 
          className="bg-primary transition-all duration-500"
          style={{ width: `${homeWidth}%` }}
        />
        <div 
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${awayWidth}%` }}
        />
      </div>
    </div>
  )
}

// 실시간 이벤트 타임라인
function EventTimeline({ events }: { events: any[] }) {
  if (!events || events.length === 0) return null
  
  return (
    <div className="space-y-3">
      {events.slice(0, 10).map((event, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
              event.type === 'Goal' ? "bg-green-500 text-white" : 
              event.type === 'Card' && event.detail === 'Yellow Card' ? "bg-yellow-500 text-white" :
              event.type === 'Card' && event.detail === 'Red Card' ? "bg-red-500 text-white" :
              event.type === 'subst' ? "bg-blue-500 text-white" : "bg-secondary"
            )}>
              {event.time.elapsed}'
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-12 bg-border mt-2" />
            )}
          </div>
          
          <div className="flex-1 pt-2">
            <div className="flex items-center gap-2">
              {event.team.logo && (
                <Image
                  src={event.team.logo}
                  alt={event.team.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              )}
              <span className="font-medium text-sm">{event.team.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {event.type === 'Goal' && `⚽ ${event.player.name} ${event.assist.name ? `(${event.assist.name})` : ''}`}
              {event.type === 'Card' && `${event.detail === 'Yellow Card' ? '🟨' : '🟥'} ${event.player.name}`}
              {event.type === 'subst' && `🔄 ${event.player.name} ➜ ${event.assist.name}`}
              {event.type === 'Var' && `📺 VAR: ${event.detail}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// 선수 평점 카드
function PlayerRatingCard({ player, team }: { player: any, team: 'home' | 'away' }) {
  const rating = player.statistics?.[0]?.games?.rating
  const ratingColor = rating >= 8 ? 'text-green-500' : 
                      rating >= 7 ? 'text-blue-500' : 
                      rating >= 6 ? 'text-yellow-500' : 'text-red-500'
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold text-muted-foreground">
          {player.statistics?.[0]?.games?.number || '-'}
        </div>
        <div>
          <p className="font-medium text-sm">{player.player.name}</p>
          <p className="text-xs text-muted-foreground">{player.statistics?.[0]?.games?.position}</p>
        </div>
      </div>
      
      {rating && (
        <div className={cn("text-xl font-bold", ratingColor)}>
          {parseFloat(rating).toFixed(1)}
        </div>
      )}
      
      {player.statistics?.[0]?.goals?.total > 0 && (
        <Badge className="bg-green-500 text-white">
          ⚽ {player.statistics?.[0]?.goals?.total}
        </Badge>
      )}
      
      {player.statistics?.[0]?.cards?.yellow > 0 && (
        <Badge className="bg-yellow-500 text-white">🟨</Badge>
      )}
      
      {player.statistics?.[0]?.cards?.red > 0 && (
        <Badge className="bg-red-500 text-white">🟥</Badge>
      )}
    </div>
  )
}

export function EnhancedMatchDetail({ fixture, isLive = false, onRefresh }: EnhancedMatchDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [autoRefresh, setAutoRefresh] = useState(isLive)
  
  // 실시간 자동 새로고침
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return
    
    const interval = setInterval(() => {
      onRefresh()
    }, 30000) // 30초마다
    
    return () => clearInterval(interval)
  }, [autoRefresh, onRefresh])
  
  const matchDate = new Date(fixture.fixture.date)
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.fixture.status.short)
  const isUpcoming = ['TBD', 'NS'].includes(fixture.fixture.status.short)
  
  return (
    <div className="space-y-6">
      {/* 경기 헤더 카드 */}
      <Card className={cn(
        "p-6",
        isLive && "border-green-500/50 bg-gradient-to-r from-green-500/10 to-transparent"
      )}>
        <div className="space-y-4">
          {/* 리그 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fixture.league.logo && (
                <Image
                  src={fixture.league.logo}
                  alt={fixture.league.name}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              )}
              <div>
                <p className="font-semibold">{fixture.league.name}</p>
                <p className="text-sm text-muted-foreground">
                  {fixture.league.round} • {fixture.league.season}
                </p>
              </div>
            </div>
            
            {isLive && (
              <Badge className="bg-green-500 text-white animate-pulse text-lg px-3 py-1">
                <Zap className="w-4 h-4 mr-1" />
                LIVE {fixture.fixture.status.elapsed}'
              </Badge>
            )}
          </div>
          
          {/* 팀 & 스코어 */}
          <div className="grid grid-cols-3 items-center">
            {/* 홈팀 */}
            <div className="text-center space-y-3">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={80}
                height={80}
                className="mx-auto object-contain"
              />
              <div>
                <p className="font-bold text-lg">{fixture.teams.home.name}</p>
                {fixture.teams.home.winner && (
                  <Badge className="mt-1 bg-green-500 text-white">승리</Badge>
                )}
              </div>
            </div>
            
            {/* 스코어 */}
            <div className="text-center">
              {isUpcoming ? (
                <div>
                  <p className="text-3xl font-bold">
                    {format(matchDate, 'HH:mm')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {format(matchDate, 'M월 d일 (EEE)', { locale: ko })}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-5xl font-bold">
                    {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
                  </p>
                  {fixture.score.penalty.home !== null && (
                    <p className="text-sm text-muted-foreground mt-2">
                      (PK {fixture.score.penalty.home} - {fixture.score.penalty.away})
                    </p>
                  )}
                  {!isLive && (
                    <Badge variant="secondary" className="mt-2">
                      {isFinished ? '경기 종료' : fixture.fixture.status.long}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            {/* 원정팀 */}
            <div className="text-center space-y-3">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={80}
                height={80}
                className="mx-auto object-contain"
              />
              <div>
                <p className="font-bold text-lg">{fixture.teams.away.name}</p>
                {fixture.teams.away.winner && (
                  <Badge className="mt-1 bg-green-500 text-white">승리</Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* 경기장 정보 */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{fixture.fixture.venue.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{fixture.fixture.referee || '심판 미정'}</span>
            </div>
            {isLive && autoRefresh && (
              <div className="flex items-center gap-2 text-green-500">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>실시간 업데이트 중</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* 상세 정보 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="statistics" disabled={isUpcoming}>통계</TabsTrigger>
          <TabsTrigger value="lineups" disabled={isUpcoming}>라인업</TabsTrigger>
          <TabsTrigger value="events" disabled={isUpcoming}>이벤트</TabsTrigger>
          <TabsTrigger value="h2h">상대전적</TabsTrigger>
        </TabsList>
        
        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 최근 폼 */}
          <Card className="dark-card p-6">
            <h3 className="text-lg font-semibold mb-4">최근 5경기 폼</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* 홈팀 폼 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={fixture.teams.home.logo}
                    alt={fixture.teams.home.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.home.name}</span>
                </div>
                <div className="flex gap-1">
                  {fixture.teams.home.league?.form?.split('').slice(-5).map((result: string, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm",
                        result === 'W' ? "bg-green-500" :
                        result === 'D' ? "bg-gray-500" :
                        result === 'L' ? "bg-red-500" : "bg-secondary"
                      )}
                    >
                      {result}
                    </div>
                  )) || <span className="text-muted-foreground">폼 데이터 없음</span>}
                </div>
              </div>
              
              {/* 원정팀 폼 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={fixture.teams.away.logo}
                    alt={fixture.teams.away.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="font-medium">{fixture.teams.away.name}</span>
                </div>
                <div className="flex gap-1">
                  {fixture.teams.away.league?.form?.split('').slice(-5).map((result: string, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm",
                        result === 'W' ? "bg-green-500" :
                        result === 'D' ? "bg-gray-500" :
                        result === 'L' ? "bg-red-500" : "bg-secondary"
                      )}
                    >
                      {result}
                    </div>
                  )) || <span className="text-muted-foreground">폼 데이터 없음</span>}
                </div>
              </div>
            </div>
          </Card>
          
          {/* 주요 통계 미리보기 */}
          {fixture.statistics && fixture.statistics.length > 0 && (
            <Card className="dark-card p-6">
              <h3 className="text-lg font-semibold mb-4">주요 통계</h3>
              <div className="space-y-4">
                <StatComparison
                  label="볼 점유율"
                  home={fixture.statistics[0].statistics.find((s: any) => s.type === 'Ball Possession')?.value || 50}
                  away={fixture.statistics[1].statistics.find((s: any) => s.type === 'Ball Possession')?.value || 50}
                  homePercentage={parseInt(fixture.statistics[0].statistics.find((s: any) => s.type === 'Ball Possession')?.value || 50)}
                  awayPercentage={parseInt(fixture.statistics[1].statistics.find((s: any) => s.type === 'Ball Possession')?.value || 50)}
                />
                <StatComparison
                  label="슈팅"
                  home={fixture.statistics[0].statistics.find((s: any) => s.type === 'Total Shots')?.value || 0}
                  away={fixture.statistics[1].statistics.find((s: any) => s.type === 'Total Shots')?.value || 0}
                />
                <StatComparison
                  label="유효 슈팅"
                  home={fixture.statistics[0].statistics.find((s: any) => s.type === 'Shots on Goal')?.value || 0}
                  away={fixture.statistics[1].statistics.find((s: any) => s.type === 'Shots on Goal')?.value || 0}
                />
              </div>
            </Card>
          )}
        </TabsContent>
        
        {/* 통계 탭 */}
        <TabsContent value="statistics" className="space-y-6">
          {fixture.statistics && fixture.statistics.length > 0 ? (
            <Card className="dark-card p-6">
              <h3 className="text-lg font-semibold mb-4">경기 통계</h3>
              <div className="space-y-4">
                {fixture.statistics[0].statistics.map((stat: any, index: number) => {
                  const awayStat = fixture.statistics[1].statistics.find((s: any) => s.type === stat.type)
                  return (
                    <StatComparison
                      key={index}
                      label={stat.type}
                      home={stat.value || 0}
                      away={awayStat?.value || 0}
                    />
                  )
                })}
              </div>
            </Card>
          ) : (
            <Card className="dark-card p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">통계 데이터가 없습니다</p>
            </Card>
          )}
        </TabsContent>
        
        {/* 라인업 탭 */}
        <TabsContent value="lineups" className="space-y-6">
          {fixture.lineups && fixture.lineups.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 홈팀 라인업 */}
              <Card className="dark-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src={fixture.teams.home.logo}
                    alt={fixture.teams.home.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <h3 className="font-semibold">{fixture.teams.home.name}</h3>
                  <Badge variant="outline">{fixture.lineups[0].formation}</Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">선발 라인업</p>
                    <div className="space-y-1">
                      {fixture.lineups[0].startXI.map((player: any, index: number) => (
                        <PlayerRatingCard key={index} player={player} team="home" />
                      ))}
                    </div>
                  </div>
                  
                  {fixture.lineups[0].substitutes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">교체 선수</p>
                      <div className="space-y-1">
                        {fixture.lineups[0].substitutes.map((player: any, index: number) => (
                          <PlayerRatingCard key={index} player={player} team="home" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              
              {/* 원정팀 라인업 */}
              <Card className="dark-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Image
                    src={fixture.teams.away.logo}
                    alt={fixture.teams.away.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <h3 className="font-semibold">{fixture.teams.away.name}</h3>
                  <Badge variant="outline">{fixture.lineups[1].formation}</Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">선발 라인업</p>
                    <div className="space-y-1">
                      {fixture.lineups[1].startXI.map((player: any, index: number) => (
                        <PlayerRatingCard key={index} player={player} team="away" />
                      ))}
                    </div>
                  </div>
                  
                  {fixture.lineups[1].substitutes.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">교체 선수</p>
                      <div className="space-y-1">
                        {fixture.lineups[1].substitutes.map((player: any, index: number) => (
                          <PlayerRatingCard key={index} player={player} team="away" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="dark-card p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">라인업이 아직 발표되지 않았습니다</p>
            </Card>
          )}
        </TabsContent>
        
        {/* 이벤트 탭 */}
        <TabsContent value="events" className="space-y-6">
          {fixture.events && fixture.events.length > 0 ? (
            <Card className="dark-card p-6">
              <h3 className="text-lg font-semibold mb-4">경기 이벤트</h3>
              <EventTimeline events={fixture.events} />
            </Card>
          ) : (
            <Card className="dark-card p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">경기 이벤트가 없습니다</p>
            </Card>
          )}
        </TabsContent>
        
        {/* 상대전적 탭 */}
        <TabsContent value="h2h" className="space-y-6">
          <Card className="dark-card p-6">
            <h3 className="text-lg font-semibold mb-4">상대전적</h3>
            <p className="text-muted-foreground text-center py-8">
              상대전적 데이터를 준비 중입니다
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}