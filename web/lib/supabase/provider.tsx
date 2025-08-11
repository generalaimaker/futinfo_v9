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
    let mounted = true
    const supabaseClient = getSupabaseClient()
    const routerRef = router
    
    // 초기 세션 체크
    const initSession = async () => {
      if (!mounted) return
      
      try {
        console.log('[SupabaseProvider] Checking for existing session...')
        
        // getSession을 먼저 호출 (더 빠르고 안정적)
        const { data: { session: currentSession }, error: sessionError } = await supabaseClient.auth.getSession()
        
        if (sessionError) {
          console.error('[SupabaseProvider] Error getting session:', sessionError)
          if (mounted) {
            setSession(null)
            setUser(null)
            setIsLoading(false)
          }
          return
        }
        
        if (currentSession) {
          console.log('[SupabaseProvider] Initial session found:', currentSession.user.id)
          if (mounted) {
            setSession(currentSession)
            setUser(currentSession.user)
            setIsLoading(false)
          }
        } else {
          console.log('[SupabaseProvider] No initial session found')
          if (mounted) {
            setSession(null)
            setUser(null)
            setIsLoading(false)
          }
        }
      } catch (error: any) {
        console.error('[SupabaseProvider] Error in initSession:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setIsLoading(false)
        }
      }
    }

    // 초기 세션 체크를 약간 지연시켜 auth 상태가 안정화되도록 함
    setTimeout(() => {
      initSession()
    }, 100)

    // Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[SupabaseProvider] Auth state changed:', event, currentSession?.user?.id)
      
      // SIGNED_IN 이벤트일 때만 특별 처리
      if (event === 'SIGNED_IN' && currentSession) {
        console.log('[SupabaseProvider] SIGNED_IN detected, updating state immediately')
        setSession(currentSession)
        setUser(currentSession.user)
        setIsLoading(false)
        
        // 강제로 리렌더링 트리거
        setTimeout(() => {
          console.log('[SupabaseProvider] Forcing re-render after sign in')
          setUser(currentSession.user)
        }, 100)
      } else {
        // 다른 이벤트는 일반 처리
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
      }
      
      console.log('[SupabaseProvider] State updated - user:', currentSession?.user?.id, 'isLoading:', false)
      
      // 세션이 변경되면 프로필 체크
      if (event === 'SIGNED_IN' && currentSession) {
        console.log('[SupabaseProvider] User signed in, checking profile...')
        
        // 약간의 지연 후 프로필 체크 (API가 준비될 시간을 줌)
        setTimeout(async () => {
          try {
            // 프로필 체크
            const { data: profile, error: profileError } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('user_id', currentSession.user.id)
              .single()
            
            // PGRST116 = no rows returned (프로필이 없음)
            if (profileError && profileError.code !== 'PGRST116') {
              console.error('[SupabaseProvider] Profile fetch error:', profileError)
            }
            
            // 프로필이 없거나 닉네임이 없으면 설정 페이지로
            if (!profile || !profile.nickname) {
              console.log('[SupabaseProvider] No profile/nickname, redirecting to setup')
              // /profile/setup 페이지가 아닐 때만 리다이렉트
              if (!window.location.pathname.includes('/profile/setup')) {
                routerRef.push('/profile/setup')
              }
            } else {
              console.log('[SupabaseProvider] Profile exists, user ready')
            }
          } catch (error) {
            console.error('[SupabaseProvider] Error checking profile:', error)
          }
        }, 500)
      } else if (event === 'SIGNED_OUT') {
        console.log('[SupabaseProvider] User signed out')
        if (mounted) {
          setSession(null)
          setUser(null)
          setIsLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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