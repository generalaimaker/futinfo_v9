'use client'

import { useState } from 'react'
import { useSupabase } from '@/lib/supabase/provider'

export default function TestLoginPage() {
  const { supabase } = useSupabase()
  const [status, setStatus] = useState<string>('')
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const testGoogleLogin = async () => {
    try {
      setStatus('Starting Google OAuth...')
      setError('')
      
      const redirectTo = `${window.location.origin}/auth/callback`
      console.log('Redirect URL:', redirectTo)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        setError(error.message)
        console.error('OAuth Error:', error)
      } else {
        setStatus('OAuth initiated successfully')
        console.log('OAuth Response:', data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Test error:', err)
    }
  }

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setError(error.message)
        setSessionInfo(null)
      } else {
        setSessionInfo(session ? {
          userId: session.user.id,
          email: session.user.email,
          expiresAt: session.expires_at,
          provider: session.user.app_metadata?.provider
        } : null)
        setStatus(session ? 'Session found' : 'No session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const clearSession = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(error.message)
      } else {
        setStatus('Signed out successfully')
        setSessionInfo(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Authentication Test Page</h1>
        
        <div className="bg-card p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Test Actions</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={testGoogleLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Google Login
            </button>
            
            <button
              onClick={checkSession}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Check Session
            </button>
            
            <button
              onClick={clearSession}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Session
            </button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Status</h2>
          <p className="text-sm text-muted-foreground">{status || 'Ready'}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {sessionInfo && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Session Info:</strong>
            <pre className="text-xs mt-2">{JSON.stringify(sessionInfo, null, 2)}</pre>
          </div>
        )}

        <div className="bg-card p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Check Supabase Dashboard</h2>
          <div className="text-sm space-y-2">
            <p>Please verify the following in your Supabase Dashboard:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <strong>Authentication → URL Configuration:</strong>
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• Site URL: <code className="bg-gray-100 px-1">https://buildup-football.com</code></li>
                  <li>• Redirect URLs: Must include <code className="bg-gray-100 px-1">https://buildup-football.com/auth/callback</code></li>
                </ul>
              </li>
              <li className="mt-2">
                <strong>Authentication → Providers → Google:</strong>
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• Enabled: Yes</li>
                  <li>• Client ID: Set correctly</li>
                  <li>• Client Secret: Set correctly</li>
                  <li>• Authorized redirect URIs in Google Console:</li>
                  <li className="ml-4">- <code className="bg-gray-100 px-1">https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback</code></li>
                </ul>
              </li>
              <li className="mt-2">
                <strong>Google Cloud Console:</strong>
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• Authorized JavaScript origins:</li>
                  <li className="ml-4">- <code className="bg-gray-100 px-1">https://buildup-football.com</code></li>
                  <li className="ml-4">- <code className="bg-gray-100 px-1">https://uutmymaxkkytibuiiaax.supabase.co</code></li>
                  <li>• Authorized redirect URIs:</li>
                  <li className="ml-4">- <code className="bg-gray-100 px-1">https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback</code></li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Environment Info</h2>
          <div className="text-xs font-mono">
            <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          </div>
        </div>
      </div>
    </div>
  )
}