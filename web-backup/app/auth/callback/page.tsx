'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL 파라미터 확인
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('OAuth callback:', { code, error, errorDescription })

        if (error) {
          setError(errorDescription || 'OAuth 인증에 실패했습니다.')
          setTimeout(() => {
            router.push('/auth/login?error=' + encodeURIComponent(error))
          }, 3000)
          return
        }

        if (code) {
          // OAuth 코드로 세션 교환
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setError('인증 코드 처리에 실패했습니다.')
            setTimeout(() => {
              router.push('/auth/login?error=exchange_failed')
            }, 3000)
            return
          }

          if (data.session) {
            // 프로필 확인
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single()

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116은 레코드 없음 에러
              console.error('Profile check error:', profileError)
            }

            if (!profile?.nickname) {
              // 프로필 설정이 필요한 경우
              router.push('/profile/setup')
            } else {
              // 커뮤니티로 이동
              router.push('/community')
            }
          }
        } else {
          // code가 없는 경우 세션 확인
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session check error:', sessionError)
            setError('세션 확인에 실패했습니다.')
            setTimeout(() => {
              router.push('/auth/login?error=session_failed')
            }, 3000)
            return
          }

          if (session) {
            router.push('/community')
          } else {
            router.push('/auth/login')
          }
        }
      } catch (error) {
        console.error('Callback processing error:', error)
        setError('인증 처리 중 오류가 발생했습니다.')
        setTimeout(() => {
          router.push('/auth/login?error=processing_failed')
        }, 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              인증 오류
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <p className="text-sm text-gray-500">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로그인 처리 중...
            </h2>
            <p className="text-gray-600">
              잠시만 기다려주세요
            </p>
          </>
        )}
      </div>
    </div>
  )
}