import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug logging
console.log('[Supabase Client] Initializing with URL:', supabaseUrl)
console.log('[Supabase Client] Anon key present:', !!supabaseAnonKey)
console.log('[Supabase Client] Anon key length:', supabaseAnonKey.length)
console.log('[Supabase Client] First 20 chars:', supabaseAnonKey.substring(0, 20))

// Create a dummy client if keys are missing (for build time)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    }
  })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    }
  })

// Type-safe client
export type SupabaseClient = typeof supabase

// Export createClient function for other uses
export { createClient }