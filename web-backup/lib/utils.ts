import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"
import { ko } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: ko 
  })
}

export function formatDate(date: Date, pattern = 'yyyy.MM.dd HH:mm'): string {
  return format(date, pattern, { locale: ko })
}

// Team utilities
export function getTeamColorClass(teamId?: number): string {
  const teamColors: Record<number, string> = {
    33: 'team-badge-manu',      // Manchester United
    40: 'team-badge-liverpool',  // Liverpool
    42: 'team-badge-arsenal',    // Arsenal
    47: 'team-badge-tottenham',  // Tottenham
    49: 'team-badge-chelsea',    // Chelsea
    50: 'team-badge-mancity',    // Manchester City
    529: 'team-badge-barcelona', // Barcelona
    541: 'team-badge-realmadrid', // Real Madrid
    530: 'team-badge-atletico',  // Atletico Madrid
    157: 'team-badge-bayern',    // Bayern Munich
    165: 'team-badge-dortmund',  // Borussia Dortmund
    85: 'team-badge-psg',        // PSG
  }
  
  return teamColors[teamId || 0] || 'team-badge'
}

// Post category utilities
export function getCategoryDisplayName(category?: string): string {
  const categories: Record<string, string> = {
    match: '경기',
    transfer: '이적',
    news: '뉴스',
    talk: '잡담',
    media: '미디어'
  }
  
  return categories[category || ''] || '일반'
}

export function getCategoryColorClass(category?: string): string {
  const categoryColors: Record<string, string> = {
    match: 'category-match',
    transfer: 'category-transfer',
    news: 'category-news',
    talk: 'category-talk',
    media: 'category-media'
  }
  
  return categoryColors[category || ''] || 'bg-gray-100 text-gray-800'
}

// Text utilities
export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

// URL utilities
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Number formatting
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K'
  return (num / 1000000).toFixed(1) + 'M'
}

// Validation utilities
export function validateNickname(nickname: string): boolean {
  const pattern = /^[가-힣a-zA-Z0-9]+$/
  return pattern.test(nickname) && nickname.length >= 2 && nickname.length <= 20
}

export function validatePostTitle(title: string): boolean {
  const trimmed = title.trim()
  return trimmed.length >= 3 && trimmed.length <= 100
}

export function validatePostContent(content: string): boolean {
  const trimmed = content.trim()
  return trimmed.length >= 5 && trimmed.length <= 10000
}

// Error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '알 수 없는 오류가 발생했습니다'
}

// Local storage utilities (client-side only)
export function setLocalStorage(key: string, value: any): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error setting localStorage:', error)
    }
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error getting localStorage:', error)
      return defaultValue
    }
  }
  return defaultValue
}

export function removeLocalStorage(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing localStorage:', error)
    }
  }
}