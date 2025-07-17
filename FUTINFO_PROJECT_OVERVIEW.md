# FUTINFO - 축구 정보 애플리케이션 프로젝트 개요

## 📌 프로젝트 소개

**FUTINFO**는 전 세계 축구 팬들을 위한 종합 축구 정보 플랫폼입니다. 실시간 경기 일정, 결과, 팀/선수 정보, 커뮤니티 기능을 제공하는 크로스 플랫폼 애플리케이션입니다.

### 주요 목표
- 축구 팬들이 필요로 하는 모든 정보를 한 곳에서 제공
- 실시간 경기 정보와 통계 제공
- 팀별 커뮤니티를 통한 팬들 간의 소통 활성화
- 다국어 지원으로 글로벌 사용자 확보

## 🏗️ 기술 스택

### 백엔드 (Supabase)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (이메일, 소셜 로그인)
- **Storage**: Supabase Storage (이미지, 미디어 파일)
- **Real-time**: Supabase Realtime (실시간 채팅, 라이브 스코어)
- **Edge Functions**: Deno runtime (API 프록시, 서버리스 함수)

### 프론트엔드

#### iOS (Swift/SwiftUI)
- **Language**: Swift 5.9+
- **UI Framework**: SwiftUI
- **Architecture**: MVVM
- **Dependencies**: 
  - Supabase Swift SDK
  - Kingfisher (이미지 캐싱)
  - Charts (통계 시각화)

#### Android (Kotlin)
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM + Clean Architecture
- **Dependencies**:
  - Supabase Kotlin SDK
  - Coil (이미지 로딩)
  - Retrofit (네트워킹)
  - Hilt (의존성 주입)

#### Web (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: 
  - React Query (서버 상태)
  - Zustand (클라이언트 상태)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (커스터마이징)
- **Dependencies**:
  - @supabase/supabase-js
  - @tanstack/react-query
  - date-fns
  - lucide-react

### External APIs
- **Football Data**: API-Sports (RapidAPI)
  - 실시간 경기 정보
  - 팀/선수 통계
  - 리그 순위표
- **News**: RSS feeds, News API
- **Translation**: OpenAI API (다국어 번역)

## 📁 프로젝트 구조

```
futinfo_v6/
├── iOS/                    # iOS 앱 (Swift/SwiftUI)
│   ├── football/
│   │   ├── Models/        # 데이터 모델
│   │   ├── Views/         # SwiftUI 뷰
│   │   ├── ViewModels/    # MVVM 뷰모델
│   │   ├── Services/      # API, 데이터 서비스
│   │   └── Utils/         # 유틸리티
│   └── football.xcodeproj
│
├── Android/               # Android 앱 (Kotlin)
│   ├── app/
│   │   └── src/main/java/com/futinfo/
│   │       ├── data/      # 데이터 레이어
│   │       ├── domain/    # 도메인 레이어
│   │       ├── presentation/ # UI 레이어
│   │       └── di/        # 의존성 주입
│   └── build.gradle.kts
│
├── web/                   # 웹 앱 (Next.js)
│   ├── app/              # Next.js 14 App Router
│   ├── components/       # React 컴포넌트
│   ├── lib/             # 유틸리티, 타입, 서비스
│   │   ├── supabase/    # Supabase 클라이언트
│   │   └── types/       # TypeScript 타입
│   └── styles/          # 전역 스타일
│
└── supabase/             # Supabase 설정
    ├── functions/        # Edge Functions
    ├── migrations/       # DB 마이그레이션
    └── seed.sql         # 초기 데이터

```

## 🗄️ 데이터베이스 스키마

### 주요 테이블

#### users (Supabase Auth 연동)
```sql
- id: uuid (PK)
- email: text
- created_at: timestamp
```

#### profiles
```sql
- id: uuid (PK)
- user_id: uuid (FK -> auth.users)
- username: text
- avatar_url: text
- favorite_teams: jsonb
- created_at: timestamp
```

#### posts (커뮤니티 게시글)
```sql
- id: uuid (PK)
- board_id: uuid (FK -> boards)
- author_id: uuid (FK -> profiles)
- title: text
- content: text
- tags: text[]
- image_urls: text[]
- view_count: integer
- like_count: integer
- comment_count: integer
- created_at: timestamp
```

#### boards (게시판)
```sql
- id: uuid (PK)
- type: text ('general', 'team')
- team_id: integer (nullable)
- name: text
- description: text
- post_count: integer
- member_count: integer
```

#### comments
```sql
- id: uuid (PK)
- post_id: uuid (FK -> posts)
- author_id: uuid (FK -> profiles)
- parent_id: uuid (nullable, FK -> comments)
- content: text
- like_count: integer
- created_at: timestamp
```

#### api_cache (API 응답 캐싱)
```sql
- cache_key: text (PK)
- endpoint: text
- parameters: jsonb
- response: jsonb
- has_data: boolean
- is_error: boolean
- ttl: integer
- expires_at: timestamp
```

## 🔌 Supabase Edge Functions

### 배포된 Functions

1. **unified-football-api**
   - 모든 축구 API 호출을 통합 관리
   - Rate limiting 및 캐싱 구현
   - 엔드포인트: fixtures, leagues, teams, players, standings 등

2. **community-api**
   - 커뮤니티 기능 (게시글, 댓글, 좋아요)
   - 인증된 사용자만 접근 가능

3. **teams-api**
   - 팀 정보 및 통계
   - Head-to-head 데이터

4. **players-api**
   - 선수 프로필 및 통계

5. **search-api**
   - 통합 검색 (팀, 선수, 리그)

6. **news-proxy**
   - 뉴스 API 프록시

7. **ai-proxy**
   - OpenAI API 프록시 (번역, 요약)

## 🔑 환경 변수 및 API 키

### Supabase Functions Secrets
```
FOOTBALL_API_KEY        # API-Sports 키
FOOTBALL_API_HOST       # api-football-v1.p.rapidapi.com
OPENAI_API_KEY         # OpenAI API 키
NEWS_API_KEY           # News API 키
BRAVE_SEARCH_API_KEY   # Brave Search API 키
TRANSFERMARKT_API_KEY  # Transfermarkt API 키
```

### 클라이언트 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL     # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase 공개 키
```

## 🌟 주요 기능

### 1. 경기 일정 및 결과
- 날짜별 경기 일정 조회
- 실시간 스코어 업데이트
- 리그별 필터링
- 경기 상세 정보 (라인업, 통계, 이벤트)

### 2. 리그 정보
- 주요 리그 순위표
- 득점왕, 도움왕 순위
- 시즌별 통계

### 3. 팀 프로필
- 팀 정보 및 역사
- 선수 명단
- 최근 경기 결과
- 팀 통계

### 4. 선수 프로필
- 선수 상세 정보
- 시즌별 통계
- 경력 정보

### 5. 커뮤니티
- 전체 게시판
- 팀별 게시판
- 게시글 작성/수정/삭제
- 댓글 및 대댓글
- 좋아요 기능
- 이미지 업로드

### 6. 검색
- 통합 검색 (팀, 선수, 리그)
- 자동완성
- 최근 검색어

### 7. 사용자 기능
- 이메일/소셜 로그인
- 프로필 관리
- 좋아하는 팀 설정
- 알림 설정

## 🚀 배포 및 운영

### iOS
- App Store 배포 준비
- TestFlight 베타 테스트

### Android
- Google Play Store 배포 준비
- 내부 테스트 트랙 운영

### Web
- Vercel 배포 (Next.js)
- 커스텀 도메인 설정
- CDN 최적화

## 📈 향후 계획

1. **기능 확장**
   - 판타지 리그
   - 경기 예측 게임
   - 실시간 채팅
   - 비디오 하이라이트

2. **성능 최적화**
   - 이미지 최적화
   - 캐싱 전략 개선
   - 번들 사이즈 축소

3. **수익화**
   - 프리미엄 구독 (광고 제거, 고급 통계)
   - 인앱 구매
   - 파트너십

## 🐛 알려진 이슈

1. **Web (Next.js)**
   - 일부 환경에서 정적 파일 서빙 문제
   - MIME type 오류 발생
   - 공용 WiFi에서 localhost 접근 제한

2. **API Rate Limiting**
   - API-Sports 일일 요청 제한
   - 캐싱 전략으로 최소화

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 아래로 연락해주세요:
- GitHub: [프로젝트 저장소]
- Email: [개발자 이메일]

---

이 문서는 FUTINFO 프로젝트의 전체적인 구조와 현황을 설명합니다. 
새로운 개발자나 AI 어시스턴트가 프로젝트를 이해하고 작업할 수 있도록 작성되었습니다.