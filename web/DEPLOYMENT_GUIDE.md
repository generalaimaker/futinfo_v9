# 🚀 FutInfo 웹 배포 가이드

## 📋 필요사항
- GoDaddy 도메인 (구매 완료 ✅)
- Vercel 계정 (무료 플랜 가능)
- GitHub 계정
- Supabase 프로젝트

## 1️⃣ Vercel 배포 설정

### 1.1 Vercel 계정 생성
1. [vercel.com](https://vercel.com) 접속
2. GitHub으로 로그인
3. "Import Project" 클릭

### 1.2 프로젝트 연결
```bash
# 프로젝트 루트에서
cd web
npx vercel
```

또는 Vercel 대시보드에서:
1. "Import Git Repository" 선택
2. GitHub 저장소 선택
3. Root Directory: `web` 설정
4. Framework Preset: Next.js 선택

## 2️⃣ 환경 변수 설정

Vercel 대시보드 > Settings > Environment Variables에서 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys (Supabase Edge Function에서 관리)
# 클라이언트에는 설정 불필요
```

## 3️⃣ 빌드 설정

### 3.1 vercel.json 생성
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["icn1"],
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  }
}
```

### 3.2 next.config.js 확인
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-4.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'uutmymaxkkytibuiiaax.supabase.co',
      }
    ],
  },
  // 프로덕션 최적화
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
```

## 4️⃣ GoDaddy DNS 설정

### 4.1 Vercel에서 도메인 추가
1. Vercel 대시보드 > Domains
2. "Add Domain" 클릭
3. 구매한 도메인 입력 (예: futinfo.com)
4. Vercel이 제공하는 DNS 레코드 확인

### 4.2 GoDaddy DNS 관리
1. [GoDaddy 계정](https://my.godaddy.com) 로그인
2. "내 제품" > 도메인 선택
3. "DNS 관리" 클릭
4. 다음 레코드 추가:

#### A 레코드 (루트 도메인)
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600초
```

#### CNAME 레코드 (www)
```
Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: 600초
```

## 5️⃣ Supabase 설정 업데이트

### 5.1 Authentication > URL Configuration
```
Site URL: https://your-domain.com
Redirect URLs:
- https://your-domain.com/auth/callback
- https://www.your-domain.com/auth/callback
- http://localhost:3000/auth/callback (개발용)
```

### 5.2 Edge Functions CORS 업데이트
각 Edge Function의 corsHeaders 수정:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

## 6️⃣ 배포 명령어

### 로컬 테스트
```bash
npm run build
npm run start
```

### Vercel 배포
```bash
# 자동 배포 (main 브랜치 push)
git add .
git commit -m "Deploy to production"
git push origin main

# 수동 배포
vercel --prod
```

## 7️⃣ 배포 후 확인사항

### 체크리스트
- [ ] 홈페이지 로드 확인
- [ ] API 호출 정상 작동 (fixtures, leagues)
- [ ] 이미지 로드 확인
- [ ] 로그인/회원가입 기능
- [ ] 커뮤니티 기능
- [ ] SSL 인증서 활성화 (Vercel 자동)

### 디버깅
```bash
# Vercel 로그 확인
vercel logs

# 빌드 로그
vercel logs --build

# 함수 로그
vercel logs --function
```

## 8️⃣ 성능 최적화

### 8.1 이미지 최적화
```tsx
import Image from 'next/image'

<Image
  src={teamLogo}
  alt="Team"
  width={40}
  height={40}
  loading="lazy"
  placeholder="blur"
/>
```

### 8.2 정적 생성 (ISR)
```tsx
// app/page.tsx
export const revalidate = 3600 // 1시간마다 재생성
```

### 8.3 캐싱 전략
- API 응답: 5분
- 이미지: 7일
- 정적 자산: 1년

## 9️⃣ 모니터링

### Vercel Analytics
```bash
npm install @vercel/analytics
```

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🔒 보안 고려사항

1. **API 키 보호**: 클라이언트에 노출 금지
2. **Rate Limiting**: Supabase Edge Function에서 처리
3. **CORS 설정**: 프로덕션 도메인만 허용
4. **환경 변수**: Vercel 대시보드에서만 관리

## 📞 문제 해결

### DNS 전파 시간
- 최대 48시간 소요 가능
- [DNS Checker](https://dnschecker.org)로 확인

### 빌드 실패
```bash
# 로컬에서 빌드 테스트
npm run build

# TypeScript 에러 확인
npm run type-check
```

### API 호출 실패
- Supabase 대시보드에서 Edge Function 로그 확인
- CORS 설정 재확인
- Rate Limit 상태 확인

## 🎉 배포 완료!

도메인이 활성화되면:
- https://your-domain.com
- https://www.your-domain.com

두 주소 모두 접속 가능합니다.