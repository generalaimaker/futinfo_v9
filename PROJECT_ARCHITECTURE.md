# Futinfo v6 - 프로젝트 아키텍처 분석

## 📌 프로젝트 개요
- **서비스명**: Futinfo (빌드업 풋볼)
- **도메인**: buildup-football.com
- **목표**: Fotmob과 유사한 축구 정보 제공 서비스
- **지원 플랫폼**: Web, iOS, Android

## 🏗️ 기술 스택

### Frontend
- **Web**: Next.js 14.2.30 (App Router), TypeScript, Tailwind CSS
- **iOS**: SwiftUI, Combine, Kingfisher (이미지 캐싱)
- **Android**: Kotlin, Jetpack Compose, Hilt (DI), Retrofit

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Edge Functions**: Deno (TypeScript)
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel (Web), Supabase (Backend)

### External APIs
- **축구 데이터**: API-Football (RapidAPI)
  - 플랜: 유료 (75,000 requests/day, 450 requests/minute)
- **이적시장 데이터**: Free API Live Football Data (RapidAPI)
  - 플랜: 무료 (테스트 중)

## 📁 프로젝트 구조

```
futinfo_v6/
├── web/                    # Next.js 웹 애플리케이션
│   ├── app/               # App Router 페이지
│   ├── components/        # UI 컴포넌트
│   ├── lib/              # 유틸리티 및 서비스
│   └── public/           # 정적 자산
├── football/              # iOS 앱 (SwiftUI)
│   ├── Models/           # 데이터 모델
│   ├── Services/         # API 서비스
│   ├── ViewModels/       # MVVM 뷰모델
│   └── Views/            # UI 뷰
├── Android/               # Android 앱 (Kotlin)
│   └── app/src/main/java/com/hyunwoopark/futinfo/
│       ├── data/         # 데이터 레이어
│       ├── domain/       # 비즈니스 로직
│       └── presentation/ # UI 레이어
└── supabase/              # Supabase 설정
    ├── functions/         # Edge Functions
    └── migrations/        # DB 마이그레이션
```

## 🔄 데이터 플로우

### API 호출 체계
1. **클라이언트** → **Supabase Edge Function** → **RapidAPI (API-Football)** → **클라이언트**
2. Edge Function을 통한 API 키 보호 및 캐싱 처리
3. Rate Limit 관리 (450 req/min)

### 주요 Edge Functions
- `unified-football-api`: 모든 축구 데이터 API 통합 엔드포인트
- `live-matches-updater`: 실시간 경기 업데이트
- `schedule-live-updates`: 라이브 경기 스케줄링

## 🎯 주요 기능

### 1. 경기 정보
- 실시간 스코어 업데이트
- 경기 일정 및 결과
- 라인업, 통계, 이벤트
- H2H (상대전적)

### 2. 리그/팀 정보
- 리그 순위표
- 팀 프로필 및 선수단
- 팀별 커뮤니티 게시판

### 3. 커뮤니티
- 팀별 게시판
- 게시글 작성/댓글
- 좋아요 시스템

### 4. 뉴스
- RSS 피드 수집
- 다국어 번역
- 이적시장 소식

### 5. 개인화
- 팀/리그 팔로우
- 경기 알림
- 언어 설정

## 🔐 인증 시스템
- Supabase Auth 사용
- 소셜 로그인 지원 (Google, Apple)
- RLS (Row Level Security) 적용

## 🚀 배포 구조
- **Web**: Vercel (자동 배포)
- **iOS**: App Store
- **Android**: Google Play Store
- **Backend**: Supabase Cloud (서울 리전)

## 📊 데이터베이스 주요 테이블
- `profiles`: 사용자 프로필
- `posts`: 커뮤니티 게시글
- `comments`: 댓글
- `cached_news`: 뉴스 캐시
- `api_cache`: API 응답 캐시
- `user_preferences`: 사용자 설정
- `live_matches`: 실시간 경기 데이터

## 🔧 성능 최적화
1. **캐싱 전략**
   - API 응답 캐싱 (5-60분)
   - 이미지 캐싱 (Kingfisher, Next.js Image)
   - Supabase 레벨 캐싱

2. **Rate Limit 관리**
   - 클라이언트별 요청 제한
   - Exponential backoff
   - Request batching

3. **실시간 업데이트**
   - Supabase Realtime 채널
   - WebSocket 연결 관리
   - 선택적 구독

## 📝 특이사항
- 클럽 친선경기(667) 시즌 계산 로직 특별 처리
- 한국어/영어 다국어 지원
- 팀명 매핑 및 검색 최적화
- iOS 404 에러 대응 폴백 처리