import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase/client-singleton'

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    // Test API key validity
    const { data, error } = await supabase.auth.getSession()
    
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uutmymaxkkytibuiiaax.supabase.co',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM',
      envCheck: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      authStatus: error ? 'error' : 'ok',
      authError: error?.message || null,
      hasSession: !!data?.session
    }
    
    return NextResponse.json(config)
  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : null
    }, { status: 500 })
  }
}