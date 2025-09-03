'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Users, Newspaper, TrendingUp } from 'lucide-react'
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
      color: 'text-blue-600'
    },
    {
      id: 'fixtures',
      label: '일정',
      icon: Calendar,
      href: '/fixtures',
      color: 'text-green-600'
    },
    {
      id: 'community',
      label: '락커룸',
      icon: Users,
      href: '/community',
      color: 'text-purple-600'
    },
    {
      id: 'news',
      label: '뉴스',
      icon: Newspaper,
      href: '/news',
      color: 'text-red-600'
    },
    {
      id: 'standings',
      label: '순위',
      icon: TrendingUp,
      href: '/standings',
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 md:hidden z-[100]" style={{ position: 'fixed !important', bottom: '0 !important' }}>
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href || 
                          (tab.id === 'community' && pathname.startsWith('/community')) ||
                          (tab.id === 'fixtures' && pathname.startsWith('/fixtures')) ||
                          (tab.id === 'news' && pathname.startsWith('/news')) ||
                          (tab.id === 'standings' && pathname.startsWith('/standings'))
          
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative transition-colors",
                isActive ? tab.color : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}