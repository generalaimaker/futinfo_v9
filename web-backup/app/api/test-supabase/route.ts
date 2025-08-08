import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Test 1: Check if Supabase client is initialized
    const clientStatus = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    // Test 2: Try to fetch some public data
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, created_at')
      .limit(5)
      .order('created_at', { ascending: false })

    // Test 3: Check realtime connection
    const channel = supabase.channel('test-channel')
    const realtimeStatus = channel.state

    // Test 4: Check auth status
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      tests: {
        client: {
          status: 'connected',
          ...clientStatus
        },
        database: {
          status: postsError ? 'error' : 'connected',
          error: postsError?.message || null,
          postsCount: posts?.length || 0
        },
        realtime: {
          status: realtimeStatus,
        },
        auth: {
          status: authError ? 'error' : 'ok',
          hasSession: !!session,
          error: authError?.message || null
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}