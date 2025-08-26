import { supabase } from '@/lib/supabase/client'

class AnalyticsService {
  private sessionId: string | null = null
  private lastActivityTime: number = Date.now()
  private activityInterval: NodeJS.Timeout | null = null

  constructor() {
    // 세션 ID 생성 또는 복구
    if (typeof window !== 'undefined') {
      this.sessionId = sessionStorage.getItem('session_id') || this.generateSessionId()
      sessionStorage.setItem('session_id', this.sessionId)
      
      // 활동 추적 시작
      this.startActivityTracking()
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private startActivityTracking() {
    // 5분마다 활동 업데이트
    this.activityInterval = setInterval(() => {
      this.updateSessionActivity()
    }, 5 * 60 * 1000)

    // 페이지 언로드 시 세션 종료
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.endSession()
      })
    }
  }

  async trackPageView(pagePath: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('page_views').insert({
        page_path: pagePath,
        user_id: user?.id || null,
        session_id: this.sessionId,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      })

      // 세션 생성 또는 업데이트
      if (this.sessionId) {
        await this.createOrUpdateSession(user?.id || null)
      }
    } catch (error) {
      console.error('Error tracking page view:', error)
    }
  }

  private async createOrUpdateSession(userId: string | null) {
    try {
      const { data: existingSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_id', this.sessionId)
        .single()

      if (!existingSession) {
        // 새 세션 생성
        await supabase.from('user_sessions').insert({
          session_id: this.sessionId,
          user_id: userId,
          last_activity: new Date().toISOString()
        })
      } else {
        // 기존 세션 업데이트
        await supabase
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString(),
            is_active: true
          })
          .eq('session_id', this.sessionId)
      }
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  private async updateSessionActivity() {
    if (!this.sessionId) return

    try {
      await supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('session_id', this.sessionId)
    } catch (error) {
      console.error('Error updating session activity:', error)
    }
  }

  private async endSession() {
    if (!this.sessionId) return

    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false
        })
        .eq('session_id', this.sessionId)
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }

  // 통계 가져오기 (관리자용)
  async getStats() {
    try {
      // 총 조회수 (최근 30일)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { count: totalViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())

      // 활성 사용자 (최근 15분 이내 활동)
      const fifteenMinutesAgo = new Date()
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)
      
      const { count: activeUsers } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .gte('last_activity', fifteenMinutesAgo.toISOString())

      // 오늘 조회수
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { count: todayViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact' })
        .gte('created_at', today.toISOString())

      // 참여율 계산 (페이지뷰가 3개 이상인 세션의 비율)
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('session_id')
        .gte('created_at', thirtyDaysAgo.toISOString())

      let engagementRate = 0
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.session_id)
        
        // 각 세션의 페이지뷰 수 계산
        const { data: engagedSessions } = await supabase
          .from('page_views')
          .select('session_id')
          .in('session_id', sessionIds)
          .limit(1000)

        // 3개 이상 페이지뷰를 가진 세션 수 계산
        const sessionViewCounts = new Map<string, number>()
        engagedSessions?.forEach(view => {
          const count = sessionViewCounts.get(view.session_id) || 0
          sessionViewCounts.set(view.session_id, count + 1)
        })

        const engagedCount = Array.from(sessionViewCounts.values()).filter(count => count >= 3).length
        engagementRate = Math.round((engagedCount / sessions.length) * 100)
      }

      return {
        totalViews: totalViews || 0,
        activeUsers: activeUsers || 0,
        todayViews: todayViews || 0,
        engagement: engagementRate
      }
    } catch (error) {
      console.error('Error getting stats:', error)
      return {
        totalViews: 0,
        activeUsers: 0,
        todayViews: 0,
        engagement: 0
      }
    }
  }

  cleanup() {
    if (this.activityInterval) {
      clearInterval(this.activityInterval)
    }
  }
}

// 싱글톤 인스턴스
let analyticsInstance: AnalyticsService | null = null

export function getAnalytics(): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService()
  }
  return analyticsInstance
}

export default AnalyticsService