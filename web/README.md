# FutInfo Web - 축구 정보 & 커뮤니티 웹 플랫폼

FutInfo의 웹 버전으로, iOS/Android 앱과 완벽하게 동기화되는 축구 정보 및 커뮤니티 플랫폼입니다.

## 🌟 주요 기능

### 축구 정보
- **📅 경기 일정**: 실시간 경기 일정 및 결과 (20개 주요 리그)
- **🏆 리그 순위**: 각 리그별 실시간 순위표
- **👥 팀 프로필**: 팀 정보, 스쿼드, 통계, 경기장 정보
- **⚽ 선수 프로필**: 선수 통계, 경력, 시즌별 기록
- **🔍 검색 기능**: 팀과 선수 통합 검색

### 커뮤니티
- **💬 팀별 게시판**: 좋아하는 축구팀별 전용 커뮤니티 공간
- **🔄 실시간 동기화**: iOS/Android 앱과 실시간으로 동기화
- **🔔 실시간 알림**: Supabase Realtime을 통한 즉시 업데이트

### 지원 리그 (MLS, K리그 포함)
- 🏴󐁧󐁢󐁥󐁮󐁧󐁿 Premier League
- 🇪🇸 La Liga
- 🇮🇹 Serie A
- 🇩🇪 Bundesliga
- 🇫🇷 Ligue 1
- 🇰🇷 K League 1
- 🇺🇸 MLS
- 🇯🇵 J1 League
- 🏆 Champions League
- 🏆 Europa League
- 외 10개 주요 리그

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI, Lucide React

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일이 이미 설정되어 있습니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. API 설정 (중요!)

축구 데이터를 표시하려면 Edge Functions 배포가 필요합니다:

#### Supabase CLI 설치
```bash
brew install supabase/tap/supabase
```

#### 프로젝트 연결 및 Edge Function 배포
```bash
supabase login
supabase link --project-ref uutmymaxkkytibuiiaax
supabase functions deploy unified-football-api
```

#### API 키 설정 (Supabase Dashboard)
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. Edge Functions > Settings
3. 환경 변수 추가:
   - `FOOTBALL_API_KEY`: [RapidAPI](https://rapidapi.com/api-sports/api/api-football)에서 발급
   - `FOOTBALL_API_HOST`: `api-football-v1.p.rapidapi.com`

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

> ⚠️ **참고**: API 키가 설정되지 않으면 개발 환경에서는 자동으로 mock 데이터가 표시됩니다.

## 📁 프로젝트 구조

```
web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── community/         # 커뮤니티 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   └── providers.tsx      # 전역 Provider
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── community/        # 커뮤니티 전용 컴포넌트
│   └── shared/           # 공통 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── supabase/         # Supabase 클라이언트
│   ├── types/            # TypeScript 타입 정의
│   └── utils.ts          # 유틸리티 함수
└── styles/               # 스타일 파일
    └── globals.css       # 전역 CSS
```

## 🔄 iOS/Android 앱과의 동기화

이 웹 플랫폼은 다음과 같은 방식으로 모바일 앱과 완벽하게 동기화됩니다:

### 공통 데이터 모델
- iOS의 `CommunityModels.swift`와 동일한 TypeScript 타입 정의
- 동일한 Supabase 데이터베이스 스키마 사용

### 실시간 동기화
```typescript
// 게시글 실시간 구독
supabase
  .channel('community_posts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'community_posts' },
    handlePostChanges
  )
  .subscribe()
```

### 통합 인증
- 동일한 Supabase Auth 시스템
- 크로스 플랫폼 사용자 세션 관리

## 🎨 디자인 시스템

iOS 앱과 일관된 디자인 언어를 위해:

- **iOS-style 컴포넌트**: 둥근 모서리, 부드러운 그림자
- **팀 컬러 시스템**: 각 축구팀의 고유 브랜드 컬러
- **반응형 디자인**: 모바일-퍼스트 접근법

## 🚀 배포

### Vercel 배포 (권장)

```bash
npm run build
```

Vercel과 GitHub 연동으로 자동 배포 설정 가능

### 기타 플랫폼

- **Netlify**: `npm run build && npm run export`
- **자체 서버**: `npm run build && npm run start`

## 📊 성능 최적화

- **Server Components**: Next.js 14의 최신 기능 활용
- **이미지 최적화**: Next.js Image 컴포넌트
- **코드 분할**: 자동 번들 분할
- **캐싱**: React Query를 통한 지능적 캐싱

## 🔒 보안

- **RLS (Row Level Security)**: Supabase 데이터베이스 레벨 보안
- **CSRF 보호**: Next.js 내장 보안 기능
- **XSS 방지**: 사용자 입력 검증 및 새니타이제이션

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🔗 관련 링크

- [iOS 앱 소스코드](../football/)
- [Android 앱 소스코드](../Android/)
- [Supabase 설정](../supabase/)
- [API 문서](../docs/api.md)