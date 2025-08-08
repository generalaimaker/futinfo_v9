# Vercel 환경 변수 올바른 설정 방법

## ⚠️ 중요: 환경 변수 설정 시 주의사항

**각 환경 변수는 개별적으로 추가해야 합니다!**

## Vercel 대시보드에서 환경 변수 설정하기

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 로그인
   - 프로젝트 선택

2. **Settings → Environment Variables 이동**

3. **각 변수를 개별적으로 추가** (총 4개)

### 변수 1: Supabase URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://uutmymaxkkytibuiiaax.supabase.co`
- **Environment:** Production, Preview, Development 모두 체크
- **Add** 버튼 클릭

### 변수 2: Supabase Anon Key
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM`
- **Environment:** Production, Preview, Development 모두 체크
- **Add** 버튼 클릭

### 변수 3: RapidAPI Key
- **Key:** `NEXT_PUBLIC_RAPIDAPI_KEY`
- **Value:** `bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4`
- **Environment:** Production, Preview, Development 모두 체크
- **Add** 버튼 클릭

### 변수 4: Site URL
- **Key:** `NEXT_PUBLIC_SITE_URL`
- **Value:** `https://buildup-football.com`
- **Environment:** Production, Preview, Development 모두 체크
- **Add** 버튼 클릭

## ❌ 잘못된 예시 (이렇게 하지 마세요!)

```
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```
위처럼 여러 줄을 한 번에 붙여넣으면 안 됩니다!

## ✅ 올바른 방법

1. 하나의 변수씩 추가
2. Key 필드에 변수명만 입력
3. Value 필드에 값만 입력
4. 공백이나 줄바꿈이 포함되지 않도록 주의

## 재배포 방법

1. 모든 환경 변수 추가 완료 후
2. Deployments 탭으로 이동
3. 최신 배포 옆의 점 3개 메뉴 클릭
4. **Redeploy** 선택
5. **"Use existing Build Cache"** 체크 해제
6. **Redeploy** 버튼 클릭

## 확인 방법

Settings → Environment Variables에서 다음과 같이 4개의 개별 변수가 보여야 합니다:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- NEXT_PUBLIC_RAPIDAPI_KEY
- NEXT_PUBLIC_SITE_URL

## 도메인 설정 (buildup-football.com)

배포 성공 후:

1. **Vercel 대시보드 → Settings → Domains**
2. **Add Domain** 클릭
3. `buildup-football.com` 입력
4. GoDaddy DNS 설정:
   - Type: A
   - Name: @
   - Value: 76.76.21.21
   - TTL: 600

또는 CNAME 설정:
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com
   - TTL: 600