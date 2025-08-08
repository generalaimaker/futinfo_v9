import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  
  if (action === 'login') {
    // OAuth 로그인 시작
    const redirectTo = `${url.origin}/api/test-oauth?action=callback`
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uutmymaxkkytibuiiaax.supabase.co'
    
    const googleOAuthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`
    
    return NextResponse.json({
      message: 'Redirect to this URL for Google OAuth',
      url: googleOAuthUrl,
      redirectTo
    })
  }
  
  if (action === 'callback') {
    // OAuth 콜백 처리
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    
    if (error) {
      return NextResponse.json({
        error: 'OAuth Error',
        description: url.searchParams.get('error_description')
      })
    }
    
    if (!code) {
      return NextResponse.json({
        error: 'No authorization code received'
      })
    }
    
    // 수동으로 코드를 세션으로 교환
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uutmymaxkkytibuiiaax.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    try {
      const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: request.cookies.get('supabase.auth.token-code-verifier')?.value || ''
        })
      })
      
      const tokenData = await tokenResponse.json()
      
      if (!tokenResponse.ok) {
        return NextResponse.json({
          error: 'Token exchange failed',
          status: tokenResponse.status,
          data: tokenData
        })
      }
      
      // 세션 쿠키 수동 설정
      const response = NextResponse.json({
        success: true,
        session: {
          access_token: tokenData.access_token ? 'present' : 'missing',
          refresh_token: tokenData.refresh_token ? 'present' : 'missing',
          user: tokenData.user
        }
      })
      
      // Supabase 세션 쿠키 설정
      if (tokenData.access_token && tokenData.refresh_token) {
        const sessionData = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          user: tokenData.user
        }
        
        response.cookies.set(
          'sb-uutmymaxkkytibuiiaax-auth-token',
          JSON.stringify(sessionData),
          {
            path: '/',
            sameSite: 'lax',
            secure: true,
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 7 // 7 days
          }
        )
      }
      
      return response
      
    } catch (err) {
      return NextResponse.json({
        error: 'Failed to exchange code',
        message: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }
  
  // 기본 응답
  return NextResponse.json({
    message: 'OAuth Test Endpoint',
    usage: {
      login: '/api/test-oauth?action=login',
      callback: '/api/test-oauth?action=callback&code=...'
    }
  })
}