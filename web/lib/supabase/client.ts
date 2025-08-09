'use client'

// Re-export from singleton to prevent multiple client instances
import { getSupabaseClient } from './client-singleton'

// Create a getter function that returns the singleton client
function getSingletonClient() {
  if (typeof window === 'undefined') {
    // Server-side: return a dummy object that will throw if used
    return new Proxy({} as any, {
      get() {
        throw new Error('Cannot use Supabase client on server side. Use server.ts instead.')
      }
    })
  }
  return getSupabaseClient()
}

// Export supabase client
export const supabase = getSingletonClient()

// Export functions
export { getSupabaseClient, getSupabaseClient as createClient } from './client-singleton'

// Type-safe client
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js'
export type SupabaseClient = SupabaseClientType