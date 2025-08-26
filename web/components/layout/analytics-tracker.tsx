'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getAnalytics } from '@/lib/supabase/analytics'

export function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const analytics = getAnalytics()
    
    // 페이지 뷰 추적
    analytics.trackPageView(pathname)
  }, [pathname])

  return null
}