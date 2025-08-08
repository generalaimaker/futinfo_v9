import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') ?? '/'
  
  console.log('[Auth Callback] Starting:', {
    hasCode: !!code,
    hasError: !!error,
    codeLength: code?.length,
    origin,
    next,
    fullUrl: request.url
  })

  // OAuth 에러 처리
  if (error) {
    console.error('[Auth Callback] OAuth Error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code) {
    console.error('[Auth Callback] No code in URL params')
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('인증 코드가 없습니다')}`
    )
  }

  try {
    const cookieStore = cookies()
    
    // Supabase 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uutmymaxkkytibuiiaax.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM',
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`[Auth Callback] Getting cookie ${name}:`, cookie?.value?.substring(0, 20))
            return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`[Auth Callback] Setting cookie ${name}`)
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error(`[Auth Callback] Error setting cookie ${name}:`, error)
            }
          },
          remove(name: string, options: CookieOptions) {
            console.log(`[Auth Callback] Removing cookie ${name}`)
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error(`[Auth Callback] Error removing cookie ${name}:`, error)
            }
          },
        },
      }
    )
    
    console.log('[Auth Callback] Exchanging code for session...')
    
    // 코드를 세션으로 교환
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('[Auth Callback] Session exchange failed:', sessionError)
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(sessionError.message)}`
      )
    }
    
    if (!data?.session) {
      console.error('[Auth Callback] No session returned from exchange')
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent('세션 생성 실패')}`
      )
    }
    
    console.log('[Auth Callback] Session created successfully:', {
      userId: data.user?.id,
      email: data.user?.email,
      hasAccessToken: !!data.session?.access_token,
      hasRefreshToken: !!data.session?.refresh_token
    })
    
    // 프로필 체크
    let redirectUrl = `${origin}${next}`
    
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[Auth Callback] Profile error:', profileError)
      }
      
      if (!profile || !profile.nickname) {
        console.log('[Auth Callback] No profile found, redirecting to setup')
        redirectUrl = `${origin}/profile/setup`
      }
    }
    
    console.log('[Auth Callback] Final redirect to:', redirectUrl)
    
    // 리다이렉트 응답 생성
    return NextResponse.redirect(redirectUrl)
    
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다')}`
    )
  }
}