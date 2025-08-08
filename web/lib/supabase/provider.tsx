'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseClient } from './client-singleton'
import { User, SupabaseClient, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // 초기 세션 체크
    const initSession = async () => {
      try {
        // 세션 가져오기
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[SupabaseProvider] Error getting session:', error)
        }
        
        if (currentSession) {
          console.log('[SupabaseProvider] Initial session found:', currentSession.user.id)
          setSession(currentSession)
          setUser(currentSession.user)
        } else {
          console.log('[SupabaseProvider] No initial session found')
        }
      } catch (error) {
        console.error('[SupabaseProvider] Error in initSession:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()

    // Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[SupabaseProvider] Auth state changed:', event, currentSession?.user?.id)
      
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setIsLoading(false)
      
      // 로그인 성공 시 홈으로 리다이렉트
      if (event === 'SIGNED_IN' && currentSession) {
        console.log('[SupabaseProvider] User signed in, redirecting...')
        
        // 프로필 체크
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()
        
        if (!profile || !profile.nickname) {
          router.push('/profile/setup')
        } else {
          router.push('/')
        }
      }
      
      // 로그아웃 시 홈으로 리다이렉트
      if (event === 'SIGNED_OUT') {
        console.log('[SupabaseProvider] User signed out')
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    
    console.log('[OAuth] Starting Google sign in with redirect:', redirectTo)
    console.log('[OAuth] Current origin:', window.location.origin)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false
      }
    })
    
    if (error) {
      console.error('[OAuth] Google sign in error:', error)
      throw error
    }
    
    console.log('[OAuth] Google sign in initiated:', data)
    console.log('[OAuth] OAuth URL:', data?.url)
  }

  const signInWithApple = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`
    
    console.log('[OAuth] Starting Apple sign in with redirect:', redirectTo)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo
      }
    })
    
    if (error) {
      console.error('[OAuth] Apple sign in error:', error)
      throw error
    }
    
    console.log('[OAuth] Apple sign in initiated:', data)
  }

  return (
    <Context.Provider 
      value={{ 
        supabase, 
        user, 
        session,
        isLoading, 
        signIn, 
        signUp, 
        signOut, 
        signInWithGoogle, 
        signInWithApple 
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}