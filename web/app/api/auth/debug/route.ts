import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createClient()
    
    // Get all auth-related cookies
    const authCookies: Record<string, any> = {}
    cookieStore.getAll().forEach(cookie => {
      if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
        authCookies[cookie.name] = {
          value: cookie.value.substring(0, 20) + '...',
          name: cookie.name
        }
      }
    })
    
    // Get session from Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    // Get user from Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    // Test direct API call
    let apiTestResult = null
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${sessionData?.session?.access_token || 'no-token'}`
          }
        }
      )
      apiTestResult = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      }
    } catch (e) {
      apiTestResult = { error: e instanceof Error ? e.message : 'Unknown error' }
    }
    
    const debugInfo = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      cookies: {
        count: Object.keys(authCookies).length,
        cookies: authCookies
      },
      session: {
        hasSession: !!sessionData?.session,
        sessionError: sessionError?.message || null,
        accessToken: sessionData?.session?.access_token ? 'present' : 'missing',
        refreshToken: sessionData?.session?.refresh_token ? 'present' : 'missing',
        expiresAt: sessionData?.session?.expires_at,
        expiresIn: sessionData?.session?.expires_in,
        tokenType: sessionData?.session?.token_type
      },
      user: {
        hasUser: !!userData?.user,
        userError: userError?.message || null,
        userId: userData?.user?.id || null,
        userEmail: userData?.user?.email || null,
        userRole: userData?.user?.role || null,
        lastSignInAt: userData?.user?.last_sign_in_at || null
      },
      directApiTest: apiTestResult,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (err) {
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : null
    }, { status: 500 })
  }
}