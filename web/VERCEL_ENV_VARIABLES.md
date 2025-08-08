# Vercel 환경 변수 설정 가이드

## 필수 환경 변수

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 1. Supabase 설정
```
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM
```

### 2. 사이트 설정
```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```
(프로덕션에서는 실제 도메인으로 변경)

### 3. RapidAPI 설정
```
NEXT_PUBLIC_RAPIDAPI_KEY=bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4
```

## 설정 방법

1. Vercel 대시보드로 이동
2. 프로젝트 선택
3. Settings → Environment Variables
4. 각 변수를 추가:
   - Key: 변수명
   - Value: 값
   - Environment: Production, Preview, Development 모두 체크
5. Save 버튼 클릭

## 중요 사항

- 모든 환경 변수는 `NEXT_PUBLIC_` 접두사가 필요합니다 (클라이언트에서 사용하기 위해)
- 환경 변수 추가 후 반드시 Redeploy를 해야 적용됩니다
- Build Cache를 Clear하고 재배포하는 것을 권장합니다