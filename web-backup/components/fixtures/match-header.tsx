import Image from 'next/image'
import Link from 'next/link'
import { Trophy, MapPin, Users, AlertCircle } from 'lucide-react'
import { getStatusDisplay, isLiveMatch } from '@/lib/types/football'
import { cn } from '@/lib/utils'

interface MatchHeaderProps {
  fixture: any // TODO: Add proper type
}

export default function MatchHeader({ fixture }: MatchHeaderProps) {
  const isLive = isLiveMatch(fixture.fixture.status.short)
  const fixtureDate = new Date(fixture.fixture.date)
  
  // 골 득점자 정보 가져오기
  const getGoalScorers = (teamType: 'home' | 'away') => {
    if (!fixture.events) return []
    
    return fixture.events
      .filter((event: any) => 
        event.type === 'Goal' && 
        event.team.id === fixture.teams[teamType].id
      )
      .map((event: any) => ({
        player: event.player.name,
        time: event.time.elapsed,
        isPenalty: event.detail === 'Penalty',
        isOwnGoal: event.detail === 'Own Goal'
      }))
  }
  
  const homeScorers = getGoalScorers('home')
  const awayScorers = getGoalScorers('away')
  
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 리그 정보 */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {fixture.league.logo && (
            <Image
              src={fixture.league.logo}
              alt={fixture.league.name}
              width={20}
              height={20}
              className="object-contain"
            />
          )}
          <span>{fixture.league.name}</span>
          {fixture.league.round && (
            <>
              <span>•</span>
              <span>{fixture.league.round}</span>
            </>
          )}
        </div>
      </div>
      
      {/* 팀 정보 및 스코어 */}
      <div className="flex items-center justify-between">
        {/* 홈팀 */}
        <Link 
          href={`/teams/${fixture.teams.home.id}`}
          className="flex-1 text-center group"
        >
          <div className="flex flex-col items-center space-y-2">
            <Image
              src={fixture.teams.home.logo}
              alt={fixture.teams.home.name}
              width={80}
              height={80}
              className="object-contain group-hover:scale-110 transition-transform"
            />
            <h2 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
              {fixture.teams.home.name}
            </h2>
          </div>
        </Link>
        
        {/* 스코어 */}
        <div className="flex-none px-8 text-center">
          {fixture.fixture.status.short === 'NS' ? (
            <div>
              <div className="text-2xl font-medium text-gray-600">
                {fixtureDate.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {fixtureDate.toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-4xl font-bold">
                {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
              </div>
              {/* 연장전/승부차기 점수 */}
              {fixture.score.extratime.home !== null && (
                <div className="text-sm text-gray-600 mt-1">
                  연장 ({fixture.score.extratime.home} - {fixture.score.extratime.away})
                </div>
              )}
              {fixture.score.penalty.home !== null && (
                <div className="text-sm text-gray-600">
                  승부차기 ({fixture.score.penalty.home} - {fixture.score.penalty.away})
                </div>
              )}
            </div>
          )}
          
          {/* 상태 표시 */}
          <div className={cn(
            "text-sm mt-2 font-semibold",
            isLive ? "text-red-600" : "text-gray-600"
          )}>
            {isLive && (
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-1" />
                {getStatusDisplay(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
              </span>
            )}
            {!isLive && getStatusDisplay(fixture.fixture.status.short, fixture.fixture.status.elapsed)}
          </div>
        </div>
        
        {/* 원정팀 */}
        <Link 
          href={`/teams/${fixture.teams.away.id}`}
          className="flex-1 text-center group"
        >
          <div className="flex flex-col items-center space-y-2">
            <Image
              src={fixture.teams.away.logo}
              alt={fixture.teams.away.name}
              width={80}
              height={80}
              className="object-contain group-hover:scale-110 transition-transform"
            />
            <h2 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
              {fixture.teams.away.name}
            </h2>
          </div>
        </Link>
      </div>
      
      {/* 골 득점자 */}
      {(homeScorers.length > 0 || awayScorers.length > 0) && (
        <div className="mt-4 flex justify-between text-sm">
          {/* 홈팀 득점자 */}
          <div className="flex-1 text-left">
            {homeScorers.map((scorer, idx) => (
              <div key={idx} className="text-gray-600">
                {scorer.player} {scorer.time}'
                {scorer.isPenalty && ' 🎯'}
                {scorer.isOwnGoal && ' 🔄⚽'}
              </div>
            ))}
          </div>
          
          {/* 원정팀 득점자 */}
          <div className="flex-1 text-right">
            {awayScorers.map((scorer, idx) => (
              <div key={idx} className="text-gray-600">
                {scorer.isOwnGoal && '🔄⚽ '}
                {scorer.isPenalty && '🎯 '}
                {scorer.time}' {scorer.player}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 경기장 정보 */}
      {fixture.fixture.venue && (
        <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{fixture.fixture.venue.name}</span>
          {fixture.fixture.venue.city && (
            <span className="ml-1">• {fixture.fixture.venue.city}</span>
          )}
        </div>
      )}
    </div>
  )
}