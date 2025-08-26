/**
 * Timezone and localization utilities
 */

/**
 * Get user's timezone
 * Returns the browser's timezone or falls back to UTC
 */
export function getUserTimezone(): string {
  if (typeof window !== 'undefined') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }
  return 'UTC'
}

/**
 * Get user's locale
 * Returns the browser's locale or falls back to ko-KR
 */
export function getUserLocale(): string {
  if (typeof window !== 'undefined') {
    // Check navigator language
    const browserLang = navigator.language || navigator.languages?.[0]
    if (browserLang) {
      return browserLang
    }
  }
  return 'ko-KR'
}

/**
 * Format match time based on user's location
 * @param date - The UTC date string from API
 * @param options - Additional formatting options
 */
export function formatMatchTime(
  date: string | Date,
  options?: {
    showDate?: boolean
    showWeekday?: boolean
    use24Hour?: boolean
  }
): string {
  const userTimezone = getUserTimezone()
  const userLocale = getUserLocale()
  const matchDate = new Date(date)
  
  // Determine if we should use 24-hour format based on locale
  const use24Hour = options?.use24Hour ?? 
    ['ko-KR', 'ja-JP', 'zh-CN', 'de-DE', 'fr-FR'].some(locale => 
      userLocale.startsWith(locale.split('-')[0])
    )
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: userTimezone,
    hour12: !use24Hour
  }
  
  if (options?.showDate) {
    timeOptions.month = 'short'
    timeOptions.day = 'numeric'
  }
  
  if (options?.showWeekday) {
    timeOptions.weekday = 'short'
  }
  
  return matchDate.toLocaleString(userLocale, timeOptions)
}

/**
 * Format relative time based on user's locale
 * @param date - The date to format
 */
export function formatRelativeTime(date: string | Date): string {
  const userLocale = getUserLocale()
  const matchDate = new Date(date)
  const now = new Date()
  const diffInMs = matchDate.getTime() - now.getTime()
  const diffInHours = Math.abs(diffInMs) / (1000 * 60 * 60)
  const diffInDays = Math.abs(diffInMs) / (1000 * 60 * 60 * 24)
  
  // Use Intl.RelativeTimeFormat if available
  if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(userLocale, { numeric: 'auto' })
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.round(diffInMs / (1000 * 60))
      return rtf.format(diffInMinutes, 'minute')
    } else if (diffInHours < 24) {
      const hours = Math.round(diffInMs / (1000 * 60 * 60))
      return rtf.format(hours, 'hour')
    } else if (diffInDays < 7) {
      const days = Math.round(diffInMs / (1000 * 60 * 60 * 24))
      return rtf.format(days, 'day')
    } else if (diffInDays < 30) {
      const weeks = Math.round(diffInMs / (1000 * 60 * 60 * 24 * 7))
      return rtf.format(weeks, 'week')
    } else {
      const months = Math.round(diffInMs / (1000 * 60 * 60 * 24 * 30))
      return rtf.format(months, 'month')
    }
  }
  
  // Fallback for older browsers
  if (diffInMs > 0) {
    if (diffInHours < 1) {
      return `${Math.round(diffInMs / (1000 * 60))}분 후`
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)}시간 후`
    } else {
      return `${Math.round(diffInDays)}일 후`
    }
  } else {
    if (diffInHours < 1) {
      return `${Math.round(Math.abs(diffInMs) / (1000 * 60))}분 전`
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)}시간 전`
    } else {
      return `${Math.round(diffInDays)}일 전`
    }
  }
}

/**
 * Format venue information based on user's locale
 * @param venue - The venue object from API
 */
export function formatVenue(venue?: { name?: string; city?: string } | null): string {
  if (!venue || !venue.name) {
    const userLocale = getUserLocale()
    // Return TBD in user's language
    if (userLocale.startsWith('ko')) return '경기장 미정'
    if (userLocale.startsWith('ja')) return '会場未定'
    if (userLocale.startsWith('zh')) return '场地待定'
    if (userLocale.startsWith('es')) return 'Por definir'
    if (userLocale.startsWith('fr')) return 'À déterminer'
    if (userLocale.startsWith('de')) return 'Noch offen'
    return 'TBD'
  }
  
  if (venue.city) {
    return `${venue.name}, ${venue.city}`
  }
  
  return venue.name
}

/**
 * Get timezone abbreviation (e.g., KST, PST, GMT)
 */
export function getTimezoneAbbreviation(): string {
  const userTimezone = getUserTimezone()
  const date = new Date()
  
  // Get the timezone offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    timeZoneName: 'short'
  })
  
  const parts = formatter.formatToParts(date)
  const timeZoneName = parts.find(part => part.type === 'timeZoneName')
  
  return timeZoneName?.value || 'UTC'
}