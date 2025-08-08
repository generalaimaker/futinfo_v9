import { supabase } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface LiveMatch {
  fixture_id: number
  league_id: number
  league_name: string
  home_team_id: number
  home_team_name: string
  home_team_logo: string | null
  away_team_id: number
  away_team_name: string
  away_team_logo: string | null
  status: string
  status_short: string
  elapsed: number | null
  home_score: number
  away_score: number
  match_date: string
  venue_name: string | null
  venue_city: string | null
  referee: string | null
  round: string
  last_updated: string
  created_at: string
}

export interface LiveMatchEvent {
  id: number
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
  created_at: string
}

export interface LiveMatchStatistics {
  id: number
  fixture_id: number
  team_id: number
  team_name: string
  statistics: any
  updated_at: string
}

class LiveMatchService {
  private channel: RealtimeChannel | null = null
  private listeners: Map<string, Function[]> = new Map()

  // 싱글톤 인스턴스
  private static instance: LiveMatchService
  static getInstance() {
    if (!LiveMatchService.instance) {
      LiveMatchService.instance = new LiveMatchService()
    }
    return LiveMatchService.instance
  }

  // 이벤트 리스너 등록
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  // 이벤트 리스너 제거
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 이벤트 발생
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // Realtime 구독 시작
  async subscribe() {
    if (this.channel) {
      console.log('Already subscribed to live matches')
      return
    }

    console.log('Subscribing to live matches...')

    // 채널 생성
    this.channel = supabase.channel('live-matches-channel')

    // live_matches 테이블 변경 감지
    this.channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_matches'
      }, (payload) => {
        console.log('New live match:', payload.new)
        this.emit('match:insert', payload.new)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_matches'
      }, (payload) => {
        console.log('Live match updated:', payload.new)
        this.emit('match:update', payload.new)
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'live_matches'
      }, (payload) => {
        console.log('Live match ended:', payload.old)
        this.emit('match:delete', payload.old)
      })

    // live_match_events 테이블 변경 감지
    this.channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_match_events'
      }, (payload) => {
        console.log('New match event:', payload.new)
        this.emit('event:insert', payload.new)
      })

    // 구독 시작
    await this.channel.subscribe()
    console.log('Subscribed to live matches')

    // 초기 데이터 로드
    await this.loadInitialData()
  }

  // 구독 해제
  async unsubscribe() {
    if (this.channel) {
      await supabase.removeChannel(this.channel)
      this.channel = null
      console.log('Unsubscribed from live matches')
    }
  }

  // 초기 라이브 경기 데이터 로드
  async loadInitialData() {
    const { data: matches, error } = await supabase
      .from('live_matches')
      .select('*')
      .order('match_date', { ascending: true })

    if (error) {
      console.error('Error loading live matches:', error)
      return
    }

    this.emit('matches:loaded', matches || [])
  }

  // 특정 경기의 이벤트 로드
  async loadMatchEvents(fixtureId: number) {
    const { data: events, error } = await supabase
      .from('live_match_events')
      .select('*')
      .eq('fixture_id', fixtureId)
      .order('time_elapsed', { ascending: true })

    if (error) {
      console.error('Error loading match events:', error)
      return []
    }

    return events || []
  }

  // 특정 경기의 통계 로드
  async loadMatchStatistics(fixtureId: number) {
    const { data: stats, error } = await supabase
      .from('live_match_statistics')
      .select('*')
      .eq('fixture_id', fixtureId)

    if (error) {
      console.error('Error loading match statistics:', error)
      return []
    }

    return stats || []
  }
}

export const liveMatchService = LiveMatchService.getInstance()