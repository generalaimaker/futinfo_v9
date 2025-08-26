'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Mail, Lock, ArrowRight, Shield, Sparkles, 
  Trophy, Users, Eye, EyeOff, Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useSupabase } from '@/lib/supabase/provider'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithGoogle, signInWithApple, user, isLoading: authLoading } = useSupabase()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 이미 로그인한 경우 리다이렉트
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/community')
    }
  }, [user, authLoading, router])
  
  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await signIn(email, password)
      router.push('/community')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.')
      setIsLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    setError(null)
    setIsLoading(true)
    
    try {
      await signInWithApple()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apple 로그인에 실패했습니다.')
      setIsLoading(false)
    }
  }

  // 인증 상태 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    )
  }

  // 이미 로그인한 경우
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">커뮤니티로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* 왼쪽: 로그인 폼 */}
        <div className="order-2 lg:order-1">
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-6 lg:p-8">
              <div className="mb-8">
                <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">B</span>
                  </div>
                  <span className="text-xl font-bold">Build-UP</span>
                </Link>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  다시 만나서 반가워요!
                </h1>
                <p className="text-gray-600">
                  이메일과 비밀번호로 로그인하세요
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-600">로그인 상태 유지</span>
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                    비밀번호 찾기
                  </Link>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <span>로그인</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>

              </form>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">또는</span>
                </div>
              </div>

              {/* 소셜 로그인 버튼들 */}
              <div className="space-y-2">
                  {/* Google 로그인 */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base font-medium flex items-center justify-center hover:bg-gray-50"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google로 계속하기
                  </Button>

                  {/* Apple 로그인 */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base font-medium bg-black text-white hover:bg-gray-900 border-black flex items-center justify-center"
                    onClick={handleAppleSignIn}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.42-1.09-.48-2.1-.51-3.23 0-1.44.64-2.19.46-3.06-.42C2.79 15.26 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.1zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple로 계속하기
                  </Button>
                </div>

              <div className="text-center mt-4 pt-4">
                <p className="text-gray-600 text-sm">
                  아직 계정이 없으신가요?{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                    회원가입
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 일러스트레이션 */}
        <div className="order-1 lg:order-2 text-center lg:text-left">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              축구 팬들의<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                특별한 커뮤니티
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              전 세계 축구 팬들과 함께 경기를 분석하고,<br />
              팀을 응원하며, 열정을 나누세요
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">전문가 수준의 분석</h3>
                <p className="text-gray-600">깊이 있는 전술 분석과 통계로 경기를 이해하세요</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">팀별 전용 커뮤니티</h3>
                <p className="text-gray-600">좋아하는 팀의 팬들과 특별한 공간에서 소통하세요</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">실시간 매치 토론</h3>
                <p className="text-gray-600">경기 중 다른 팬들과 실시간으로 소통하세요</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">12,500+</span> 명의 축구 팬들이<br />
              매일 Build-UP에서 열정을 나누고 있습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}