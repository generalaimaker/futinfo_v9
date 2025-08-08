import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseFixturesRealtimeOptions {
  fixtureIds: number[]
  onUpdate: (fixtureId: number) => void
}

export function useFixturesRealtime({ 
  fixtureIds, 
  onUpdate 
}: UseFixturesRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!fixtureIds || fixtureIds.length === 0) return

    // 현재 표시 중인 경기들의 업데이트 감지
    const channel = supabase.channel('fixtures-list')
      
    // live_matches 테이블에서 현재 경기들의 변경 감지
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `fixture_id=in.(${fixtureIds.join(',')})`
      }, (payload) => {
        console.log('Fixture update in list:', payload)
        const fixtureId = payload.new?.fixture_id || payload.old?.fixture_id
        if (fixtureId) {
          onUpdate(fixtureId)
        }
      })

    // 구독 시작
    channel.subscribe((status) => {
      console.log('Fixtures list realtime status:', status)
    })

    channelRef.current = channel

    // 클린업
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fixtureIds.join(','), onUpdate])

  return channelRef.current
}