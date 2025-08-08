import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Default configuration (fallback values)
const DEFAULT_CONFIG = {
  supabaseUrl: 'https://uutmymaxkkytibuiiaax.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM'
}

// Try to get from environment variables first
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_CONFIG.supabaseUrl
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_CONFIG.supabaseAnonKey

// Log configuration status
if (typeof window !== 'undefined') {
  console.log('[Supabase Client] Environment check:', {
    hasEnvUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasEnvKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    usingDefaults: !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
}

// Create the Supabase client
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
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
export { createSupabaseClient as createClient }