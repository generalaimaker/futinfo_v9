'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  useEffect(() => {
    // admin 페이지에서는 사이드바 숨기기
    if (pathname?.startsWith('/admin')) {
      // 사이드바를 숨기기 위한 클래스 추가
      const sidebar = document.querySelector('aside')
      const main = document.querySelector('main')
      
      if (sidebar) {
        sidebar.style.display = 'none'
      }
      if (main) {
        main.style.paddingLeft = '0'
      }
      
      // cleanup function
      return () => {
        if (sidebar) {
          sidebar.style.display = ''
        }
        if (main) {
          main.style.paddingLeft = ''
        }
      }
    }
  }, [pathname])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="lg:pl-0">
        {children}
      </div>
    </div>
  )
}