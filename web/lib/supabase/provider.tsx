'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { User, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
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
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  // 싱글톤 패턴 사용으로 useMemo 불필요
  const supabase = createClient()

  useEffect(() => {
    // 현재 세션 확인
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    // Auth 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      // 로그아웃 시 홈으로 리다이렉트
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

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
    // 프로덕션에서는 buildup-football.com 사용
    const redirectTo = typeof window !== 'undefined' 
      ? window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth/callback`
        : 'https://buildup-football.com/auth/callback'
      : 'https://buildup-football.com/auth/callback'
    
    console.log('[OAuth] Google redirect URL:', redirectTo)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false
      },
    })
    
    if (error) {
      console.error('[OAuth] Google sign in error:', error)
      throw error
    }
    
    // OAuth URL 확인
    console.log('[OAuth] Google OAuth initiated:', data)
  }

  const signInWithApple = async () => {
    // 프로덕션에서는 buildup-football.com 사용
    const redirectTo = typeof window !== 'undefined' 
      ? window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth/callback`
        : 'https://buildup-football.com/auth/callback'
      : 'https://buildup-football.com/auth/callback'
    
    console.log('Apple OAuth redirect URL:', redirectTo)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    })
    
    if (error) throw error
    
    // OAuth URL 확인
    console.log('OAuth initiated:', data)
  }

  return (
    <Context.Provider value={{ supabase, user, isLoading, signIn, signUp, signOut, signInWithGoogle, signInWithApple }}>
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