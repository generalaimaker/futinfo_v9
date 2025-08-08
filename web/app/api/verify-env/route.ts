import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = headers()
  const host = headersList.get('host')
  
  // 환경 변수 직접 확인
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
  
  // 하드코딩된 값과 비교
  const expectedUrl = 'https://uutmymaxkkytibuiiaax.supabase.co'
  const expectedKeyStart = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
  
  const verification = {
    host,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    
    supabaseUrl: {
      exists: !!env.NEXT_PUBLIC_SUPABASE_URL,
      correct: env.NEXT_PUBLIC_SUPABASE_URL === expectedUrl,
      value: env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      expected: expectedUrl
    },
    
    supabaseAnonKey: {
      exists: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      startsCorrectly: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith(expectedKeyStart),
      length: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      first50: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) || 'NOT SET',
      expectedStart: expectedKeyStart
    },
    
    // Vercel에서 환경 변수가 제대로 로드되었는지 확인
    vercelCheck: {
      isVercel: !!process.env.VERCEL,
      hasAllEnvVars: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    },
    
    recommendation: ''
  }
  
  // 추천사항 생성
  if (!verification.supabaseUrl.exists || !verification.supabaseAnonKey.exists) {
    verification.recommendation = 'Vercel Dashboard에서 환경 변수를 설정해주세요: Settings → Environment Variables'
  } else if (!verification.supabaseUrl.correct) {
    verification.recommendation = 'NEXT_PUBLIC_SUPABASE_URL이 잘못 설정되었습니다. 올바른 값으로 수정해주세요.'
  } else if (!verification.supabaseAnonKey.startsCorrectly) {
    verification.recommendation = 'NEXT_PUBLIC_SUPABASE_ANON_KEY가 잘못 설정되었습니다. Supabase Dashboard에서 다시 복사해주세요.'
  } else {
    verification.recommendation = '환경 변수가 올바르게 설정되어 있습니다.'
  }
  
  return NextResponse.json(verification, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}