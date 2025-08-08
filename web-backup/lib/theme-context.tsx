'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 로컬 스토리지에서 테마 설정 불러오기
    const savedTheme = localStorage.getItem('futinfo-theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(savedTheme)
    } else {
      // 기본값은 다크 모드
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    console.log('Toggling theme from', theme, 'to', newTheme)
    setTheme(newTheme)
    
    // DOM 클래스 업데이트
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
    console.log('Document classes:', document.documentElement.className)
    
    // 로컬 스토리지에 저장
    localStorage.setItem('futinfo-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}