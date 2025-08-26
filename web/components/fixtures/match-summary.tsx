import Image from 'next/image'
import { Clock, AlertCircle, Trophy, TrendingUp, Shield, Activity, Table } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { LeagueStandingsMini } from './league-standings-mini'

interface MatchSummaryProps {
  fixture: any // TODO: Add proper type
}

export default function MatchSummary({ fixture }: MatchSummaryProps) {
  // 주요 통계 가져오기
  const getKeyStats = () => {
    if (!fixture.statistics || fixture.statistics.length === 0) return null
    
    const homeStats = fixture.statistics[0].statistics
    const awayStats = fixture.statistics[1].statistics
    
    const getStatValue = (stats: any[], type: string) => {
      const stat = stats.find(s => s.type === type)
      return stat?.value || 0
    }
    
    return {
      home: {
        possession: getStatValue(homeStats, 'Ball Possession'),
        shots: getStatValue(homeStats, 'Total Shots'),
        shotsOnTarget: getStatValue(homeStats, 'Shots on Goal'),
        expectedGoals: getStatValue(homeStats, 'expected_goals')
      },
      away: {
        possession: getStatValue(awayStats, 'Ball Possession'),
        shots: getStatValue(awayStats, 'Total Shots'),
        shotsOnTarget: getStatValue(awayStats, 'Shots on Goal'),
        expectedGoals: getStatValue(awayStats, 'expected_goals')
      }
    }
  }
  
  const keyStats = getKeyStats()
  
  // 이벤트 아이콘 가져오기
  const getEventIcon = (type: string, detail: string) => {
    if (type === 'Goal') {
      if (detail === 'Penalty') return '🎯'
      if (detail === 'Own Goal') return '🔄⚽'
      return '⚽'
    }
    if (type === 'Card') {
      if (detail === 'Yellow Card') return '🟨'
      if (detail === 'Red Card') return '🟥'
    }
    if (type === 'subst') return '🔄'
    if (type === 'Var') return '📺'
    return ''
  }
  
  // 최근 폼 가져오기
  const getTeamForm = (teamId: number) => {
    // 실제 구현에서는 팀의 최근 경기 결과를 가져와야 함
    // 지금은 예시 데이터 반환
    return ['W', 'W', 'D', 'L', 'W']
  }
  
  return (
    <div className="space-y-6">
      {/* Man of the Match (구현 시 추가) */}
      
      {/* 주요 통계 */}
      {keyStats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              경기 요약
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 점유율 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{keyStats.home.possession}%</span>
                <span className="text-gray-600">점유율</span>
                <span className="font-medium">{keyStats.away.possession}%</span>
              </div>
              <div className="flex space-x-2 h-2">
                <div 
                  className="bg-blue-500 rounded-l"
                  style={{ width: `${keyStats.home.possession}%` }}
                />
                <div 
                  className="bg-red-500 rounded-r"
                  style={{ width: `${keyStats.away.possession}%` }}
                />
              </div>
            </div>
            
            {/* 슈팅 */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-2xl font-bold">{keyStats.home.shots}</div>
              <div className="text-sm text-gray-600">전체 슈팅</div>
              <div className="text-2xl font-bold">{keyStats.away.shots}</div>
            </div>
            
            {/* 유효 슈팅 */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-2xl font-bold text-green-600">{keyStats.home.shotsOnTarget}</div>
              <div className="text-sm text-gray-600">유효 슈팅</div>
              <div className="text-2xl font-bold text-green-600">{keyStats.away.shotsOnTarget}</div>
            </div>
            
            {/* 기대 득점 */}
            {keyStats.home.expectedGoals && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="text-xl font-semibold">{keyStats.home.expectedGoals}</div>
                <div className="text-sm text-gray-600">기대 득점 (xG)</div>
                <div className="text-xl font-semibold">{keyStats.away.expectedGoals}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* 주요 이벤트 */}
      {fixture.events && fixture.events.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              주요 이벤트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fixture.events
                .filter((event: any) => ['Goal', 'Card', 'subst', 'Var'].includes(event.type))
                .map((event: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 py-2 border-b last:border-0">
                    <div className="text-sm font-medium w-12 text-center">
                      {event.time.elapsed}'
                      {event.time.extra && <span className="text-xs">+{event.time.extra}</span>}
                    </div>
                    <div className="text-xl">
                      {getEventIcon(event.type, event.detail)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {event.player.name}
                        {event.assist?.name && (
                          <span className="text-sm text-gray-600 ml-1">
                            ({event.assist.name})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {event.team.name}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 최근 폼 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            최근 경기 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 홈팀 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Image
                  src={fixture.teams.home.logo}
                  alt={fixture.teams.home.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="font-medium">{fixture.teams.home.name}</span>
              </div>
              <div className="flex space-x-1">
                {getTeamForm(fixture.teams.home.id).map((result, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-6 h-6 rounded text-xs font-bold flex items-center justify-center",
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
          
          {/* 원정팀 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Image
                  src={fixture.teams.away.logo}
                  alt={fixture.teams.away.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="font-medium">{fixture.teams.away.name}</span>
              </div>
              <div className="flex space-x-1">
                {getTeamForm(fixture.teams.away.id).map((result, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-6 h-6 rounded text-xs font-bold flex items-center justify-center",
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
        </CardContent>
      </Card>
      
      {/* 기본 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            경기 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {fixture.fixture.referee && (
              <div className="flex justify-between">
                <span className="text-gray-600">주심</span>
                <span className="font-medium">{fixture.fixture.referee}</span>
              </div>
            )}
            {fixture.fixture.venue && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">경기장</span>
                  <span className="font-medium">{fixture.fixture.venue.name}</span>
                </div>
                {fixture.fixture.venue.city && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">도시</span>
                    <span className="font-medium">{fixture.fixture.venue.city}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">킥오프</span>
              <span className="font-medium">
                {new Date(fixture.fixture.date).toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 리그 순위 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Table className="w-5 h-5 mr-2" />
            경기 후 리그 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeagueStandingsMini
            leagueId={fixture.league.id}
            season={fixture.league.season || new Date().getFullYear()}
            homeTeamId={fixture.teams.home.id}
            awayTeamId={fixture.teams.away.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}