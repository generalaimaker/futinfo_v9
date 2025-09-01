import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'

interface UseSelectiveRealtimeOptions {
  fixtureId: number
  onUpdate: () => void
  onGoal?: (data: any) => void
  onCard?: (data: any) => void
  onStatusChange?: (data: any) => void
}

export function useSelectiveRealtime({ 
  fixtureId, 
  onUpdate,
  onGoal,
  onCard,
  onStatusChange
}: UseSelectiveRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [pollingConfig, setPollingConfig] = useState<{
    enabled: boolean
    interval: number
  }>({ enabled: false, interval: 30000 })
  const [isConnected, setIsConnected] = useState(false)

  // 경기가 실시간 폴링 대상인지 확인
  useEffect(() => {
    const checkRealtimeConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('realtime_fixtures')
          .select('is_active, polling_interval, priority')
          .eq('fixture_id', fixtureId)
          .single()

        if (!error && data) {
          setPollingConfig({
            enabled: data.is_active,
            interval: data.polling_interval * 1000 // 초를 밀리초로 변환
          })
          
          // 우선순위가 높은 경기는 실시간 알림
          if (data.is_active && data.priority === 1) {
            console.log(`🎯 최우선 경기 ${fixtureId} 실시간 모니터링 시작`)
          }
        } else {
          // 실시간 폴링 대상이 아닌 경우
          setPollingConfig({ enabled: false, interval: 30000 })
        }
      } catch (error) {
        console.error('Error checking realtime config:', error)
      }
    }

    checkRealtimeConfig()

    // 설정 변경 감지를 위한 Realtime 구독
    const configChannel = supabase
      .channel(`realtime-config-${fixtureId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'realtime_fixtures',
        filter: `fixture_id=eq.${fixtureId}`
      }, () => {
        checkRealtimeConfig()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(configChannel)
    }
  }, [fixtureId])

  // 선택적 폴링 구현
  useEffect(() => {
    if (!pollingConfig.enabled || !fixtureId) {
      // 폴링 중지
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    console.log(`[Selective Realtime] Starting polling for fixture ${fixtureId} with ${pollingConfig.interval}ms interval`)

    // 즉시 한 번 실행
    onUpdate()

    // 설정된 간격으로 폴링
    intervalRef.current = setInterval(() => {
      console.log(`[Selective Realtime] Polling fixture ${fixtureId}`)
      onUpdate()
    }, pollingConfig.interval)

    // Realtime 브로드캐스트 구독 (득점, 카드 등 중요 이벤트 즉시 수신)
    const channel = supabase
      .channel('match-updates')
      .on('broadcast', { event: 'goal' }, (payload) => {
        if (payload.payload.fixture_id === fixtureId) {
          console.log('⚽ 득점 이벤트:', payload.payload)
          
          // 득점 알림 표시
          toast.success(`⚽ 득점! ${payload.payload.scorer} (${payload.payload.minute}')`, {
            description: `${payload.payload.home_team} ${payload.payload.home_score} - ${payload.payload.away_score} ${payload.payload.away_team}`
          })
          
          // 콜백 실행
          if (onGoal) onGoal(payload.payload)
          onUpdate()
        }
      })
      .on('broadcast', { event: 'card' }, (payload) => {
        if (payload.payload.fixture_id === fixtureId) {
          console.log('🟨 카드 이벤트:', payload.payload)
          
          // 카드 알림 표시
          const cardIcon = payload.payload.card_type === 'Red Card' ? '🟥' : '🟨'
          toast.warning(`${cardIcon} ${payload.payload.card_type}`, {
            description: `${payload.payload.player} (${payload.payload.minute}')`
          })
          
          // 콜백 실행
          if (onCard) onCard(payload.payload)
          onUpdate()
        }
      })
      .on('broadcast', { event: 'status_change' }, (payload) => {
        if (payload.payload.fixture_id === fixtureId) {
          console.log('📢 상태 변경:', payload.payload)
          
          // 상태 변경 알림
          if (payload.payload.new_status === 'HT') {
            toast.info('⏸️ 하프타임', {
              description: `${payload.payload.home_team} vs ${payload.payload.away_team}`
            })
          } else if (payload.payload.new_status === 'FT') {
            toast.info('🏁 경기 종료', {
              description: `${payload.payload.home_team} vs ${payload.payload.away_team}`
            })
          }
          
          // 콜백 실행
          if (onStatusChange) onStatusChange(payload.payload)
          onUpdate()
        }
      })
      
    // live_matches 테이블 변경 감지
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `fixture_id=eq.${fixtureId}`
      }, (payload) => {
        console.log('[Selective Realtime] Live match update:', payload)
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
        console.log('[Selective Realtime] New match event:', payload)
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
        console.log('[Selective Realtime] Statistics update:', payload)
        onUpdate()
      })

    // 구독 시작
    channel.subscribe((status) => {
      console.log(`[Selective Realtime] Fixture ${fixtureId} realtime status:`, status)
    })

    channelRef.current = channel

    // 클린업
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fixtureId, pollingConfig.enabled, pollingConfig.interval, onUpdate])

  return {
    isRealtimeEnabled: pollingConfig.enabled,
    pollingInterval: pollingConfig.interval,
    channel: channelRef.current
  }
}

// 여러 경기를 동시에 실시간 폴링하는 훅
export function useMultipleSelectiveRealtime(fixtureIds: number[]) {
  const [realtimeFixtures, setRealtimeFixtures] = useState<number[]>([])
  
  useEffect(() => {
    const loadRealtimeFixtures = async () => {
      try {
        const { data, error } = await supabase
          .from('realtime_fixtures')
          .select('fixture_id')
          .eq('is_active', true)
          .in('fixture_id', fixtureIds)

        if (!error && data) {
          setRealtimeFixtures(data.map(d => d.fixture_id))
        }
      } catch (error) {
        console.error('Error loading realtime fixtures:', error)
      }
    }

    if (fixtureIds.length > 0) {
      loadRealtimeFixtures()
    }
  }, [fixtureIds])

  return realtimeFixtures
}