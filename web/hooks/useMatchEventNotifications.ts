import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useToast } from '@/hooks/use-toast'

interface MatchEvent {
  fixture_id: number
  time_elapsed: number
  time_extra: number | null
  team_id: number
  team_name: string
  player_id: number | null
  player_name: string | null
  assist_id: number | null
  assist_name: string | null
  type: string
  detail: string | null
  comments: string | null
}

interface UseMatchEventNotificationsOptions {
  enabled?: boolean
  followingTeamIds?: number[]
  soundEnabled?: boolean
}

export function useMatchEventNotifications({
  enabled = true,
  followingTeamIds = [],
  soundEnabled = true
}: UseMatchEventNotificationsOptions = {}) {
  const { toast } = useToast()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    // 알림음 준비
    if (soundEnabled && typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.volume = 0.5
    }

    // 이벤트 채널 구독
    const channel = supabase.channel('match-events-notifications')
      
    // 모든 새로운 이벤트 감지
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_match_events'
      }, async (payload) => {
        const event = payload.new as MatchEvent
        
        // 팔로잉한 팀의 이벤트만 알림 (설정된 경우)
        if (followingTeamIds.length > 0 && !followingTeamIds.includes(event.team_id)) {
          return
        }

        // 이벤트 타입별 알림 처리
        handleEventNotification(event)
      })

    // 구독 시작
    channel.subscribe((status) => {
      console.log('Match events notification channel status:', status)
    })

    channelRef.current = channel

    // 클린업
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, followingTeamIds.join(','), soundEnabled])

  const handleEventNotification = async (event: MatchEvent) => {
    let title = ''
    let description = ''
    let icon = ''

    switch (event.type) {
      case 'Goal':
        icon = '⚽'
        title = '골!'
        description = `${event.player_name} (${event.team_name})`
        if (event.assist_name) {
          description += ` - 어시스트: ${event.assist_name}`
        }
        break
        
      case 'Card':
        if (event.detail === 'Yellow Card') {
          icon = '🟨'
          title = '경고'
        } else if (event.detail === 'Red Card') {
          icon = '🟥'
          title = '퇴장'
        }
        description = `${event.player_name} (${event.team_name})`
        break
        
      case 'Subst':
        icon = '🔄'
        title = '교체'
        description = `${event.team_name}`
        break
        
      case 'Var':
        icon = '📺'
        title = 'VAR 판정'
        description = event.detail || 'VAR 확인 중'
        break
        
      default:
        return // 다른 이벤트는 무시
    }

    // 토스트 알림 표시
    toast({
      title: `${icon} ${title}`,
      description: `${event.time_elapsed}' - ${description}`,
    })

    // 알림음 재생
    if (soundEnabled && audioRef.current) {
      try {
        await audioRef.current.play()
      } catch (error) {
        console.error('Failed to play notification sound:', error)
      }
    }
  }

  return {
    channel: channelRef.current
  }
}