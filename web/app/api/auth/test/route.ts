import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test API key validity
    const { data, error } = await supabase.auth.getSession()
    
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uutmymaxkkytibuiiaax.supabase.co',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'key_loaded' : 'using_default',
      envCheck: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      authStatus: error ? 'error' : 'ok',
      authError: error?.message || null,
      hasSession: !!data?.session,
      sessionUser: data?.session?.user?.email || null
    }
    
    return NextResponse.json(config)
  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : null
    }, { status: 500 })
  }
}