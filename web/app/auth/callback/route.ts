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

  // OAuth 에러 처리
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    try {
      const supabase = createClient()
      console.log('[OAuth Callback] Exchanging code for session')
      
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('[OAuth Callback] Session exchange error:', sessionError)
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent(sessionError.message)}`
        )
      }
      
      // 세션 교환 성공
      console.log('[OAuth Callback] Session exchange successful')
      
      // Check if user has profile
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('[OAuth Callback] Get user error:', userError)
      }
      
      if (user) {
        console.log('[OAuth Callback] User authenticated:', user.id)
        
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[OAuth Callback] Profile fetch error:', profileError)
        }
        
        // Redirect to profile setup if no profile
        if (!profile || !profile.nickname) {
          console.log('[OAuth Callback] Redirecting to profile setup')
          return NextResponse.redirect(`${origin}/profile/setup`)
        }
        
        console.log('[OAuth Callback] Profile exists, redirecting to:', next)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } catch (err) {
      console.error('[OAuth Callback] Unexpected error:', err)
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다')}`
      )
    }
  }

  // No code provided
  console.log('[OAuth Callback] No code provided, redirecting to login')
  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('인증 코드가 없습니다')}`)
}