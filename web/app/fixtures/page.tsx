'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, ChevronRight, Calendar, Clock, Trophy, 
  Filter, Star, TrendingUp, AlertCircle, Loader2,
  Search, Globe, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFixturesByDate } from '@/lib/supabase/football'
import { formatDate, getStatusDisplay, isLiveMatch, isFinishedMatch, FixturesResponse } from '@/lib/types/football'
import { useFixturesRealtime } from '@/hooks/useFixturesRealtime'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import LiveMatchesSection from '@/components/LiveMatchesSection'
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ko } from 'date-fns/locale'

// 주요 리그 ID
const MAJOR_LEAGUES = {
  39: { name: 'Premier League', country: 'England', priority: 1 },
  140: { name: 'La Liga', country: 'Spain', priority: 2 },
  135: { name: 'Serie A', country: 'Italy', priority: 3 },
  78: { name: 'Bundesliga', country: 'Germany', priority: 4 },
  61: { name: 'Ligue 1', country: 'France', priority: 5 },
  2: { name: 'Champions League', country: 'Europe', priority: 6 },
  848: { name: 'K League 1', country: 'South Korea', priority: 7 },
  667: { name: 'Friendlies Clubs', country: 'World', priority: 8 }
}

// 날짜 표시 헬퍼
const getDateLabel = (date: Date): string => {
  if (isToday(date)) return '오늘'
  if (isTomorrow(date)) return '내일'
  if (isYesterday(date)) return '어제'
  return format(date, 'M월 d일 (EEE)', { locale: ko })
}

// 경기 카드 컴포넌트
function FixtureCard({ fixture, isFavorite }: { fixture: any, isFavorite: boolean }) {
  const isLive = isLiveMatch(fixture.fixture.status.short)
  const isFinished = isFinishedMatch(fixture.fixture.status.short)
  const fixtureDate = new Date(fixture.fixture.date)
  const timeString = format(fixtureDate, 'HH:mm')
  
  return (
    <Link
      href={`/fixtures/${fixture.fixture.id}`}
      className="block"
    >
      <Card className={cn(
        "p-4 hover:shadow-lg transition-all cursor-pointer",
        isLive && "border-green-500/50 bg-green-500/5",
        isFavorite && "border-yellow-500/30 bg-yellow-500/5"
      )}>
        {/* 리그 및 시간 정보 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {fixture.league.logo && (
              <Image
                src={fixture.league.logo}
                alt={fixture.league.name}
                width={16}
                height={16}
                className="object-contain"
              />
            )}
            <span className="text-xs text-muted-foreground">
              {fixture.league.name}
            </span>
            {fixture.league.round && (
              <Badge variant="outline" className="text-xs">
                {fixture.league.round}
              </Badge>
            )}
          </div>
          
          {isLive ? (
            <Badge className="bg-green-500 text-white animate-pulse">
              LIVE {fixture.fixture.status.elapsed}'
            </Badge>
          ) : isFinished ? (
            <Badge variant="secondary">종료</Badge>
          ) : (
            <span className="text-sm font-medium">{timeString}</span>
          )}
        </div>
        
        {/* 팀 정보 */}
        <div className="space-y-2">
          {/* 홈팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                width={24}
                height={24}
                className="object-contain"
              />
              <span className={cn(
                "font-medium text-sm",
                fixture.teams.home.winner && "text-primary font-bold"
              )}>
                {fixture.teams.home.name}
              </span>
              {isFavorite && fixture.teams.home.id && (
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            {(isLive || isFinished) && (
              <span className="text-xl font-bold">
                {fixture.goals.home ?? 0}
              </span>
            )}
          </div>
          
          {/* 원정팀 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Image
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                width={24}
                height={24}
                className="object-contain"
              />
              <span className={cn(
                "font-medium text-sm",
                fixture.teams.away.winner && "text-primary font-bold"
              )}>
                {fixture.teams.away.name}
              </span>
              {isFavorite && fixture.teams.away.id && (
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            {(isLive || isFinished) && (
              <span className="text-xl font-bold">
                {fixture.goals.away ?? 0}
              </span>
            )}
          </div>
        </div>
        
        {/* 경기장 정보 */}
        {fixture.fixture.venue && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            📍 {fixture.fixture.venue.name}
            {fixture.fixture.venue.city && `, ${fixture.fixture.venue.city}`}
          </div>
        )}
      </Card>
    </Link>
  )
}

export default function EnhancedFixturesPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { preferences } = useUserPreferences()
  
  const { data, isLoading, error, refetch } = useFixturesByDate(selectedDate) as { 
    data: FixturesResponse | undefined; 
    isLoading: boolean; 
    error: Error | null;
    refetch: () => void
  }
  
  // 주별 데이터 로드 (추가 구현 필요)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  
  // 날짜 변경 핸들러
  const changeDate = (days: number) => {
    setSelectedDate(prev => days > 0 ? addDays(prev, days) : subDays(prev, Math.abs(days)))
  }
  
  const goToToday = () => setSelectedDate(new Date())
  
  // 빠른 날짜 선택
  const quickDateButtons = [
    { label: '어제', action: () => setSelectedDate(subDays(new Date(), 1)) },
    { label: '오늘', action: goToToday, highlight: true },
    { label: '내일', action: () => setSelectedDate(addDays(new Date(), 1)) },
    { label: '주말', action: () => {
      const saturday = new Date()
      saturday.setDate(saturday.getDate() + (6 - saturday.getDay()))
      setSelectedDate(saturday)
    }}
  ]
  
  // 경기 필터링
  const filteredFixtures = data?.response?.filter(fixture => {
    // 리그 필터
    if (selectedLeague !== 'all' && fixture.league.id.toString() !== selectedLeague) {
      return false
    }
    
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        fixture.teams.home.name.toLowerCase().includes(query) ||
        fixture.teams.away.name.toLowerCase().includes(query) ||
        fixture.league.name.toLowerCase().includes(query)
      )
    }
    
    return true
  }) || []
  
  // 즐겨찾기 팀 경기 분리
  const favoriteFixtures = filteredFixtures.filter(f => 
    preferences.favoriteTeamIds.includes(f.teams.home.id) || 
    preferences.favoriteTeamIds.includes(f.teams.away.id)
  )
  
  const otherFixtures = filteredFixtures.filter(f => 
    !preferences.favoriteTeamIds.includes(f.teams.home.id) && 
    !preferences.favoriteTeamIds.includes(f.teams.away.id)
  )
  
  // 리그별 그룹화
  const groupFixturesByLeague = (fixtures: any[]) => {
    const grouped: Record<string, any[]> = {}
    
    fixtures.forEach(fixture => {
      const leagueKey = `${fixture.league.id}-${fixture.league.name}`
      if (!grouped[leagueKey]) {
        grouped[leagueKey] = []
      }
      grouped[leagueKey].push(fixture)
    })
    
    return Object.entries(grouped).sort(([aKey], [bKey]) => {
      const aId = parseInt(aKey.split('-')[0])
      const bId = parseInt(bKey.split('-')[0])
      const aPriority = MAJOR_LEAGUES[aId]?.priority || 999
      const bPriority = MAJOR_LEAGUES[bId]?.priority || 999
      return aPriority - bPriority
    })
  }
  
  // 라이브 경기 ID 목록
  const liveFixtureIds = filteredFixtures
    .filter(fixture => isLiveMatch(fixture.fixture.status.short))
    .map(fixture => fixture.fixture.id)
  
  // 실시간 업데이트
  const handleFixtureUpdate = useCallback((fixtureId: number) => {
    console.log(`Fixture ${fixtureId} updated`)
    refetch()
  }, [refetch])
  
  useFixturesRealtime({
    fixtureIds: liveFixtureIds,
    onUpdate: handleFixtureUpdate
  })
  
  // 통계 계산
  const stats = {
    total: filteredFixtures.length,
    live: filteredFixtures.filter(f => isLiveMatch(f.fixture.status.short)).length,
    finished: filteredFixtures.filter(f => isFinishedMatch(f.fixture.status.short)).length,
    upcoming: filteredFixtures.filter(f => !isLiveMatch(f.fixture.status.short) && !isFinishedMatch(f.fixture.status.short)).length
  }
  
  return (
    <div className="min-h-screen lg:ml-64 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold mb-2">경기 일정</h1>
          <p className="text-muted-foreground">
            전 세계 축구 경기 일정을 한눈에 확인하세요
          </p>
        </div>
        
        {/* 날짜 선택 및 필터 */}
        <Card className="dark-card p-4 space-y-4">
          {/* 빠른 날짜 선택 */}
          <div className="flex items-center gap-2 flex-wrap">
            {quickDateButtons.map((btn) => (
              <Button
                key={btn.label}
                variant={btn.highlight && isToday(selectedDate) ? "default" : "outline"}
                size="sm"
                onClick={btn.action}
              >
                {btn.label}
              </Button>
            ))}
          </div>
          
          {/* 날짜 네비게이션 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center min-w-[200px]">
                <div className="text-xl font-bold">
                  {getDateLabel(selectedDate)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(selectedDate, 'yyyy년')}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 뷰 모드 전환 */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                일별
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                주별
              </Button>
            </div>
          </div>
          
          {/* 검색 및 필터 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="팀, 리그 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLeague} onValueChange={setSelectedLeague}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="리그 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 리그</SelectItem>
                {Object.entries(MAJOR_LEAGUES).map(([id, league]) => (
                  <SelectItem key={id} value={id}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Trophy className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">라이브</p>
                <p className="text-2xl font-bold text-green-500">{stats.live}</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">종료</p>
                <p className="text-2xl font-bold">{stats.finished}</p>
              </div>
              <Clock className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="dark-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">예정</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>
        </div>
        
        {/* 라이브 경기 섹션 */}
        {stats.live > 0 && <LiveMatchesSection />}
        
        {/* 경기 목록 */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="dark-card p-4">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="dark-card p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium mb-2">경기 정보를 불러올 수 없습니다</p>
            <Button onClick={() => refetch()}>다시 시도</Button>
          </Card>
        ) : filteredFixtures.length === 0 ? (
          <Card className="dark-card p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">경기가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다' : '다른 날짜를 선택해주세요'}
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                전체 ({filteredFixtures.length})
              </TabsTrigger>
              <TabsTrigger value="favorite" disabled={favoriteFixtures.length === 0}>
                내 팀 ({favoriteFixtures.length})
              </TabsTrigger>
              <TabsTrigger value="leagues">
                리그별
              </TabsTrigger>
            </TabsList>
            
            {/* 전체 경기 */}
            <TabsContent value="all" className="space-y-4">
              {favoriteFixtures.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    내 팀 경기
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteFixtures.map((fixture) => (
                      <FixtureCard
                        key={fixture.fixture.id}
                        fixture={fixture}
                        isFavorite={true}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {otherFixtures.length > 0 && (
                <div className="space-y-4">
                  {favoriteFixtures.length > 0 && (
                    <h3 className="text-lg font-semibold">다른 경기</h3>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otherFixtures.map((fixture) => (
                      <FixtureCard
                        key={fixture.fixture.id}
                        fixture={fixture}
                        isFavorite={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* 내 팀 경기 */}
            <TabsContent value="favorite" className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteFixtures.map((fixture) => (
                  <FixtureCard
                    key={fixture.fixture.id}
                    fixture={fixture}
                    isFavorite={true}
                  />
                ))}
              </div>
            </TabsContent>
            
            {/* 리그별 */}
            <TabsContent value="leagues" className="space-y-6">
              {groupFixturesByLeague(filteredFixtures).map(([leagueKey, fixtures]) => {
                const [leagueId, ...nameParts] = leagueKey.split('-')
                const leagueName = nameParts.join('-')
                const firstFixture = fixtures[0]
                
                return (
                  <div key={leagueKey} className="space-y-4">
                    <div className="flex items-center gap-3">
                      {firstFixture.league.logo && (
                        <Image
                          src={firstFixture.league.logo}
                          alt={leagueName}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      )}
                      <h3 className="text-lg font-semibold">{leagueName}</h3>
                      <Badge variant="secondary">{fixtures.length}</Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fixtures.map((fixture) => {
                        const isFavorite = 
                          preferences.favoriteTeamIds.includes(fixture.teams.home.id) ||
                          preferences.favoriteTeamIds.includes(fixture.teams.away.id)
                        
                        return (
                          <FixtureCard
                            key={fixture.fixture.id}
                            fixture={fixture}
                            isFavorite={isFavorite}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}