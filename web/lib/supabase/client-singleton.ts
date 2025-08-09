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
      auth: {
        persistSession: true,
        storageKey: 'sb-futinfo-auth-token',
        detectSessionInUrl: true,
        autoRefreshToken: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'x-application-name': 'futinfo-web'
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