'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Global singleton instance
let client: SupabaseClient | undefined

// Store instance in window to ensure true singleton across all imports
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient
  }
}

export function getSupabaseClient() {
  // Check if we already have a client in window (true singleton)
  if (typeof window !== 'undefined' && window.__supabaseClient) {
    return window.__supabaseClient
  }
  
  // Check module-level variable
  if (client) {
    if (typeof window !== 'undefined') {
      window.__supabaseClient = client
    }
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  console.log('[Supabase Client] Creating singleton client with URL:', supabaseUrl)

  client = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          if (typeof document !== 'undefined') {
            const cookies = document.cookie.split('; ')
            const cookie = cookies.find(c => c.startsWith(`${name}=`))
            return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
          }
          return undefined
        },
        set(name: string, value: string, options?: any) {
          if (typeof document !== 'undefined') {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`
            }
            document.cookie = cookieString
          }
        },
        remove(name: string, options?: any) {
          if (typeof document !== 'undefined') {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${options?.path || '/'}`
          }
        }
      }
    }
  )

  // Store in window for true singleton
  if (typeof window !== 'undefined') {
    window.__supabaseClient = client
  }

  return client
}