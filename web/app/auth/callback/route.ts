import { createClient } from '@/lib/supabase/server'
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
    const supabase = createClient()
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
        return NextResponse.redirect(`${origin}/profile/setup`)
      }
    }
    
    console.log('[Auth Callback] Redirecting to:', next)
    return NextResponse.redirect(`${origin}${next}`)
    
  } catch (err) {
    console.error('[Auth Callback] Unexpected error:', err)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다')}`
    )
  }
}