'use client'

import { useEffect, useState } from 'react'
import { liveMatchService, LiveMatch, LiveMatchEvent } from '@/lib/supabase/live-matches'
import { useMatchEventNotifications } from '@/hooks/useMatchEventNotifications'
import Link from 'next/link'
import Image from 'next/image'

export default function LiveMatchesSection() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [matchEvents, setMatchEvents] = useState<{ [key: number]: LiveMatchEvent[] }>({})
  
  // 이벤트 알림 활성화
  useMatchEventNotifications({
    enabled: true,
    soundEnabled: true
  })

  useEffect(() => {
    // 초기 데이터 로드
    const handleMatchesLoaded = (matches: LiveMatch[]) => {
      setLiveMatches(matches)
      // 각 경기의 이벤트 로드
      matches.forEach(async (match) => {
        const events = await liveMatchService.loadMatchEvents(match.fixture_id)
        setMatchEvents(prev => ({ ...prev, [match.fixture_id]: events }))
      })
    }

    // 새 경기 추가
    const handleMatchInsert = (match: LiveMatch) => {
      setLiveMatches(prev => [...prev, match].sort((a, b) => 
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      ))
    }

    // 경기 업데이트
    const handleMatchUpdate = (match: LiveMatch) => {
      setLiveMatches(prev => prev.map(m => 
        m.fixture_id === match.fixture_id ? match : m
      ))
    }

    // 경기 종료
    const handleMatchDelete = (match: any) => {
      setLiveMatches(prev => prev.filter(m => m.fixture_id !== match.fixture_id))
      setMatchEvents(prev => {
        const newEvents = { ...prev }
        delete newEvents[match.fixture_id]
        return newEvents
      })
    }

    // 새 이벤트
    const handleEventInsert = (event: LiveMatchEvent) => {
      setMatchEvents(prev => ({
        ...prev,
        [event.fixture_id]: [...(prev[event.fixture_id] || []), event]
          .sort((a, b) => a.time_elapsed - b.time_elapsed)
      }))
    }

    // 이벤트 리스너 등록
    liveMatchService.on('matches:loaded', handleMatchesLoaded)
    liveMatchService.on('match:insert', handleMatchInsert)
    liveMatchService.on('match:update', handleMatchUpdate)
    liveMatchService.on('match:delete', handleMatchDelete)
    liveMatchService.on('event:insert', handleEventInsert)

    // Realtime 구독
    liveMatchService.subscribe()

    // 클린업
    return () => {
      liveMatchService.off('matches:loaded', handleMatchesLoaded)
      liveMatchService.off('match:insert', handleMatchInsert)
      liveMatchService.off('match:update', handleMatchUpdate)
      liveMatchService.off('match:delete', handleMatchDelete)
      liveMatchService.off('event:insert', handleEventInsert)
    }
  }, [])

  if (liveMatches.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          실시간 경기
        </h2>
        <span className="text-sm text-gray-500">
          {liveMatches.length}개 경기 진행 중
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {liveMatches.map((match) => (
          <Link
            key={match.fixture_id}
            href={`/fixtures/${match.fixture_id}`}
            className="block"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition-shadow">
              {/* 리그 정보 */}
              <div className="text-xs text-gray-500 mb-2">
                {match.league_name} · {match.round}
              </div>

              {/* 팀 정보 및 스코어 */}
              <div className="flex items-center justify-between mb-3">
                {/* 홈팀 */}
                <div className="flex items-center gap-2 flex-1">
                  {match.home_team_logo && (
                    <Image
                      src={match.home_team_logo}
                      alt={match.home_team_name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  )}
                  <span className="text-sm truncate">{match.home_team_name}</span>
                </div>

                {/* 스코어 */}
                <div className="px-4 text-center">
                  <div className="text-xl font-bold">
                    {match.home_score} - {match.away_score}
                  </div>
                  <div className="text-xs text-red-500 font-medium">
                    {match.elapsed ? `${match.elapsed}'` : match.status_short}
                  </div>
                </div>

                {/* 원정팀 */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm truncate">{match.away_team_name}</span>
                  {match.away_team_logo && (
                    <Image
                      src={match.away_team_logo}
                      alt={match.away_team_name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  )}
                </div>
              </div>

              {/* 최근 이벤트 */}
              {matchEvents[match.fixture_id]?.slice(-2).map((event, idx) => (
                <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="text-gray-500">{event.time_elapsed}'</span>
                  <span>
                    {event.type === 'Goal' && '⚽'}
                    {event.type === 'Card' && (event.detail === 'Yellow Card' ? '🟨' : '🟥')}
                    {event.type === 'Subst' && '🔄'}
                  </span>
                  <span className="truncate">
                    {event.player_name} ({event.team_name})
                  </span>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}