'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Globe, Heart, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSupabase } from '@/lib/supabase/provider'
import { Badge } from '@/components/ui/badge'

export default function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useSupabase()
  
  // 모바일에서만 표시
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    return null
  }

  const tabs = [
    {
      id: 'home',
      label: '홈',
      icon: Home,
      href: '/',
      color: 'text-gray-600'
    },
    {
      id: 'all',
      label: '전체',
      icon: Globe,
      href: '/community',
      color: 'text-blue-600'
    },
    {
      id: 'myteam',
      label: '내팀',
      icon: Heart,
      href: '/community?tab=myteam',
      color: 'text-purple-600',
      badge: 'Chelsea' // 동적으로 변경
    },
    {
      id: 'notifications',
      label: '알림',
      icon: Bell,
      href: '/notifications',
      color: 'text-red-600',
      badge: '3' // 알림 수
    },
    {
      id: 'profile',
      label: '내정보',
      icon: User,
      href: user ? '/profile' : '/auth/login',
      color: 'text-gray-600'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 md:hidden z-50">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href || 
                          (tab.id === 'all' && pathname.startsWith('/community'))
          
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative transition-colors",
                isActive ? tab.color : "text-gray-400 hover:text-gray-600"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "scale-110"
                )} />
                {tab.badge && tab.id === 'notifications' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">
                {tab.label}
              </span>
              {tab.badge && tab.id === 'myteam' && (
                <span className="absolute -top-1 right-1 text-[8px] bg-blue-100 text-blue-600 px-1 rounded">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}