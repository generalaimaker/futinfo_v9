'use client'

import { useState, useEffect } from 'react'

export default function ManualTestPage() {
  const [cookies, setCookies] = useState<string>('')
  const [sessionData, setSessionData] = useState<any>(null)
  
  useEffect(() => {
    // 현재 쿠키 읽기
    setCookies(document.cookie)
    
    // Supabase 세션 쿠키 확인
    const cookieObj: Record<string, string> = {}
    document.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.trim().split('=')
      if (key && key.includes('sb-') || key.includes('supabase')) {
        cookieObj[key] = value
      }
    })
    
    // 세션 토큰 파싱 시도
    const authToken = cookieObj['sb-uutmymaxkkytibuiiaax-auth-token']
    if (authToken) {
      try {
        const decoded = JSON.parse(decodeURIComponent(authToken))
        setSessionData(decoded)
      } catch (e) {
        console.error('Failed to parse auth token:', e)
      }
    }
  }, [])
  
  const testDirectOAuth = () => {
    const supabaseUrl = 'https://uutmymaxkkytibuiiaax.supabase.co'
    const redirectTo = encodeURIComponent('https://buildup-football.com/auth/callback')
    const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`
    window.location.href = oauthUrl
  }
  
  const clearAllCookies = () => {
    document.cookie.split(';').forEach(cookie => {
      const [key] = cookie.trim().split('=')
      if (key) {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.buildup-football.com`
      }
    })
    window.location.reload()
  }
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Manual OAuth Test</h1>
        
        <div className="bg-card p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Test Actions</h2>
          
          <div className="space-y-2">
            <button
              onClick={testDirectOAuth}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
            >
              Direct OAuth Login (Bypass Supabase Client)
            </button>
            
            <button
              onClick={clearAllCookies}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Cookies
            </button>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Current Cookies</h2>
          <div className="text-xs font-mono bg-gray-100 p-3 rounded overflow-x-auto">
            {cookies ? (
              cookies.split(';').map((cookie, i) => (
                <div key={i} className={cookie.includes('sb-') || cookie.includes('supabase') ? 'text-green-600 font-bold' : ''}>
                  {cookie.trim()}
                </div>
              ))
            ) : (
              <p>No cookies found</p>
            )}
          </div>
        </div>
        
        {sessionData && (
          <div className="bg-card p-6 rounded-lg space-y-4">
            <h2 className="text-lg font-semibold">Session Data</h2>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="bg-card p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Debug Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Clear All Cookies" to start fresh</li>
            <li>Click "Direct OAuth Login" to bypass Supabase client</li>
            <li>Complete Google login</li>
            <li>Check if cookies are set after redirect</li>
            <li>If cookies are present but login still fails, the issue is in cookie reading</li>
            <li>If no cookies after OAuth, the issue is in the callback handler</li>
          </ol>
        </div>
        
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Note:</strong> This page directly manipulates cookies and OAuth flow to diagnose the issue.
        </div>
      </div>
    </div>
  )
}