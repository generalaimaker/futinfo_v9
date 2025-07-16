# Supabase Edge Functions 마이그레이션 계획

## 현재 Firebase Functions
1. `getFixtures` - 경기 일정 캐싱
2. `getFixtureStatistics` - 경기 통계
3. `getFixtureEvents` - 경기 이벤트
4. `getHeadToHead` - 상대 전적
5. `getStandings` - 순위
6. `getInjuries` - 부상 정보
7. `getCacheStats` - 캐시 통계
8. `cleanupCache` - 캐시 정리

## Supabase Edge Functions로 마이그레이션

### 1. 새로운 Edge Function 생성
```typescript
// supabase/functions/football-api/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const endpoint = url.pathname.split('/').pop()
  
  // Supabase 클라이언트
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  try {
    switch (endpoint) {
      case 'fixtures':
        return await getFixtures(url.searchParams, supabaseClient)
      case 'standings':
        return await getStandings(url.searchParams, supabaseClient)
      // ... 다른 엔드포인트들
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### 2. 캐싱 로직을 Supabase로 이전
- Firebase Firestore → Supabase Database
- `api_cache` 테이블 생성
- TTL 관리 및 자동 정리

### 3. FirebaseFunctionsService.swift 수정
- Firebase 의존성 제거
- Supabase Edge Functions 직접 호출
- 기존 인터페이스 유지

## 장점
1. 단일 백엔드 시스템
2. 더 나은 성능 (같은 인프라)
3. 간단한 배포 및 관리
4. 비용 절감