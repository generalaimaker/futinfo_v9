import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseFixtureRealtimeOptions {
  fixtureId: number
  isLive: boolean
  onUpdate: () => void
}

export function useFixtureRealtime({ 
  fixtureId, 
  isLive, 
  onUpdate 
}: UseFixtureRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!isLive || !fixtureId) return

    // 채널 구독
    const channel = supabase.channel(`fixture-${fixtureId}`)
      
    // live_matches 테이블 변경 감지
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `fixture_id=eq.${fixtureId}`
      }, (payload) => {
        console.log('Live match update:', payload)
        onUpdate()
      })
      
    // live_match_events 테이블 변경 감지
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_match_events',
        filter: `fixture_id=eq.${fixtureId}`
      }, (payload) => {
        console.log('New match event:', payload)
        onUpdate()
      })
      
    // live_match_statistics 테이블 변경 감지
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_match_statistics',
        filter: `fixture_id=eq.${fixtureId}`
      }, (payload) => {
        console.log('Statistics update:', payload)
        onUpdate()
      })

    // 구독 시작
    channel.subscribe((status) => {
      console.log(`Fixture ${fixtureId} realtime status:`, status)
    })

    channelRef.current = channel

    // 클린업
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fixtureId, isLive, onUpdate])

  return channelRef.current
}