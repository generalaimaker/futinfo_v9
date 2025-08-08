import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('[Auth Callback] Processing:', {
    hasCode: !!code,
    hasError: !!error,
    origin,
    next
  })

  // OAuth 에러 처리
  if (error) {
    console.error('[Auth Callback] OAuth Error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code) {
    console.log('[Auth Callback] No code provided')
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('인증 코드가 없습니다')}`
    )
  }

  try {
    // Response 객체 생성 - 쿠키를 설정할 수 있도록
    let response = NextResponse.redirect(`${origin}${next}`)
    
    // Supabase 클라이언트 생성 with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uutmymaxkkytibuiiaax.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM',
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // 요청과 응답 모두에 쿠키 설정
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )
    
    console.log('[Auth Callback] Exchanging code for session...')
    
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('[Auth Callback] Session exchange error:', sessionError)
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(sessionError.message)}`
      )
    }
    
    console.log('[Auth Callback] Session exchange successful')
    console.log('[Auth Callback] Session data:', {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      userId: data?.user?.id,
      userEmail: data?.user?.email
    })
    
    // 프로필 체크
    if (data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[Auth Callback] Profile fetch error:', profileError)
      }
      
      // 프로필이 없으면 프로필 설정 페이지로
      if (!profile || !profile.nickname) {
        console.log('[Auth Callback] No profile, redirecting to setup')
        response = NextResponse.redirect(`${origin}/profile/setup`)
        // 쿠키 다시 설정 (리다이렉션 대상이 변경되었으므로)
        const cookiesToSet = request.cookies.getAll()
        cookiesToSet.forEach(cookie => {
          if (cookie.name.includes('sb-') || cookie.name.includes('supabase')) {
            response.cookies.set(cookie)
          }
        })
        return response
      }
    }
    
    console.log('[Auth Callback] Redirecting to:', next)
    return response
    
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다')}`
    )
  }
}