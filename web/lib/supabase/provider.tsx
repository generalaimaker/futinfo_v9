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
    const supabaseClient = getSupabaseClient()
    const routerRef = router
    // 초기 세션 체크
    const initSession = async () => {
      try {
        console.log('[SupabaseProvider] Checking for existing session...')
        
        // 먼저 User를 가져와서 세션 새로고침
        const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser()
        
        if (userError) {
          console.error('[SupabaseProvider] Error getting user:', userError)
          // 에러가 있으면 세션이 없는 것
          setSession(null)
          setUser(null)
          setIsLoading(false)
          return
        }
        
        if (currentUser) {
          console.log('[SupabaseProvider] User found via getUser:', currentUser.id)
          // getUser가 성공하면 세션도 가져오기
          const { data: { session: currentSession } } = await supabaseClient.auth.getSession()
          
          if (currentSession) {
            console.log('[SupabaseProvider] Session found:', currentSession.user.id)
            setSession(currentSession)
            setUser(currentSession.user)
            setIsLoading(false)
          } else {
            // User는 있지만 세션이 없는 경우 - 세션 새로고침 시도
            console.log('[SupabaseProvider] User exists but no session, refreshing...')
            const { data: { session: refreshedSession } } = await supabaseClient.auth.refreshSession()
            if (refreshedSession) {
              setSession(refreshedSession)
              setUser(refreshedSession.user)
            } else {
              setSession(null)
              setUser(null)
            }
            setIsLoading(false)
          }
        } else {
          console.log('[SupabaseProvider] No user found')
          setSession(null)
          setUser(null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('[SupabaseProvider] Error in initSession:', error)
        setSession(null)
        setUser(null)
        setIsLoading(false)
      }
    }

    initSession()

    // Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[SupabaseProvider] Auth state changed:', event, currentSession?.user?.id)
      
      // 세션이 변경되면 강제로 상태 업데이트
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
        
        // 로그인 성공 시 프로필 체크
        if (event === 'SIGNED_IN' && currentSession) {
          console.log('[SupabaseProvider] User signed in, checking profile...')
          
          // 프로필 체크
          const { data: profile, error: profileError } = await supabaseClient
            .from('user_profiles')
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
            console.log('[SupabaseProvider] Profile exists, refreshing UI')
            // 페이지 새로고침으로 UI 업데이트
            routerRef.refresh()
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[SupabaseProvider] User signed out')
        setSession(null)
        setUser(null)
        setIsLoading(false)
        routerRef.refresh()
      } else {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)
      }
    })

    return () => {
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