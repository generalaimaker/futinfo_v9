# 커뮤니티 웹-앱 동기화 아키텍처

## 🎯 목표
웹과 모바일 앱 사용자들이 실시간으로 동기화된 커뮤니티 경험을 제공

## 🏗️ 전체 아키텍처

### 1. 중앙화된 백엔드 (Supabase)
```
Supabase Backend
├── Database (PostgreSQL)
├── Realtime (실시간 동기화)
├── Auth (통합 인증)
├── Edge Functions (API 서버)
└── Storage (이미지/파일)
```

### 2. 클라이언트 아키텍처
```
Cross-Platform Community System
├── iOS App (SwiftUI)
├── Android App (Kotlin Compose)
├── Web App (Next.js)
└── Shared Backend (Supabase)
```

## 📱 현재 iOS 구조 분석

### 커뮤니티 데이터 모델
```swift
// 이미 구현된 모델들
- CommunityBoard: 게시판 정보
- CommunityPost: 게시글
- CommunityComment: 댓글
- UserProfile: 사용자 프로필
- TeamBoardView: 팀별 게시판
```

### 현재 서비스들
```swift
- SupabaseCommunityService: 커뮤니티 메인 서비스
- CommunityValidator: 입력 검증 및 보안
- SupabaseService: 데이터베이스 연결
- TeamBoardCacheService: 팀 게시판 캐싱
```

## 🌐 웹 플랫폼 설계

### 기술 스택 선택
```typescript
Frontend Framework: Next.js 14 (App Router)
├── React 18 (Server Components)
├── TypeScript
├── Tailwind CSS
├── Framer Motion (애니메이션)
└── React Query (상태 관리)

Backend Integration:
├── Supabase Client
├── Realtime Subscriptions
└── Auth Integration
```

### 폴더 구조
```
web/
├── app/                 # Next.js App Router
│   ├── (auth)/         # 인증 페이지
│   ├── community/      # 커뮤니티 메인
│   ├── teams/          # 팀별 게시판
│   └── layout.tsx      # 루트 레이아웃
├── components/         # 재사용 컴포넌트
│   ├── ui/            # 기본 UI 컴포넌트
│   ├── community/     # 커뮤니티 전용
│   └── shared/        # 공통 컴포넌트
├── lib/               # 유틸리티
│   ├── supabase/      # Supabase 클라이언트
│   ├── types/         # TypeScript 타입
│   └── hooks/         # 커스텀 훅
└── styles/            # 스타일
```

## 🔄 실시간 동기화 시스템

### Supabase Realtime 활용
```sql
-- 실시간 구독할 테이블들
1. community_posts      (게시글 CRUD)
2. community_comments   (댓글 CRUD)
3. post_likes          (좋아요)
4. post_views          (조회수)
5. board_members       (게시판 멤버십)
```

### 실시간 이벤트 처리
```typescript
// 웹에서의 실시간 구독
const supabase = createClient()

// 게시글 실시간 구독
supabase
  .channel('community_posts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'community_posts' },
    handlePostChanges
  )
  .subscribe()

// iOS에서의 실시간 구독 (기존)
private func setupRealtimeSubscription() {
    // 이미 구현된 코드 활용
}
```

## 📊 공통 데이터 모델

### TypeScript 타입 정의
```typescript
// iOS CommunityModels.swift와 동일한 구조
interface CommunityBoard {
  id: string
  type: 'all' | 'team'
  name: string
  teamId?: number
  description?: string
  iconUrl?: string
  postCount: number
  memberCount: number
}

interface CommunityPost {
  id: string
  boardId: string
  authorId: string
  author?: UserProfile
  title: string
  content: string
  category?: string
  tags?: string[]
  imageUrls?: string[]
  createdAt: Date
  updatedAt?: Date
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  isNotice: boolean
  isLiked?: boolean
  isBookmarked?: boolean
}
```

## 🔐 통합 인증 시스템

### 멀티플랫폼 Auth Flow
```
Authentication Strategy:
├── Supabase Auth (중앙 인증)
├── Apple Sign-In (iOS)
├── Google OAuth (Android/Web)
├── Email/Password (All platforms)
└── Anonymous browsing (읽기 전용)
```

### 사용자 세션 동기화
```typescript
// 웹에서 iOS와 동일한 프로필 구조
interface UserProfile {
  id: string
  userId?: string
  nickname: string
  avatarUrl?: string
  favoriteTeamId?: number
  favoriteTeamName?: string
  language?: string
  createdAt?: Date
}
```

## 🎨 UI/UX 일관성

### 디자인 시스템 공유
```
Design Tokens:
├── Colors (팀 컬러, 브랜드 컬러)
├── Typography (폰트 크기, 가중치)
├── Spacing (마진, 패딩)
├── Shadows (iOS 스타일 그림자)
└── Animations (페이드, 슬라이드)
```

### 컴포넌트 매핑
```
iOS SwiftUI -> Web React
├── TeamBoardView -> TeamBoardComponent
├── PostListView -> PostListComponent
├── FixtureCell -> FixtureCard
└── UserProfile -> UserProfileCard
```

## 🚀 개발 우선순위

### Phase 1: 기본 웹 구조 (1주)
1. Next.js 프로젝트 셋업
2. Supabase 클라이언트 설정
3. 기본 라우팅 구조
4. 인증 시스템 연동

### Phase 2: 커뮤니티 코어 (2주)
1. 게시판 목록 뷰
2. 게시글 CRUD
3. 댓글 시스템
4. 실시간 동기화

### Phase 3: 고급 기능 (1주)
1. 팀별 게시판
2. 이미지 업로드
3. 알림 시스템
4. 반응형 디자인

### Phase 4: 최적화 (1주)
1. 성능 최적화
2. SEO 최적화
3. PWA 기능
4. 크로스 플랫폼 테스트

## 🔧 기술적 고려사항

### 성능 최적화
```
Performance Strategy:
├── Server Components (Next.js)
├── Incremental Static Regeneration
├── React Query 캐싱
├── Image optimization
└── Bundle splitting
```

### 보안
```
Security Measures:
├── RLS (Row Level Security)
├── CSRF Protection
├── XSS Prevention
├── Rate Limiting
└── Content Validation
```

## 📈 모니터링 및 분석

### 실시간 메트릭
```sql
-- 성능 메트릭 테이블 (이미 존재)
CREATE TABLE performance_metrics (
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  news_load_time REAL,
  cache_hit_rate REAL,
  error_rate REAL
);
```

### 사용자 행동 분석
```
Analytics Points:
├── 게시글 작성/읽기 패턴
├── 팀별 활동도
├── 플랫폼별 사용률
└── 실시간 동기화 효율성
```

## 🌟 핵심 장점

1. **일관된 경험**: 웹-앱 간 동일한 데이터와 UI
2. **실시간 동기화**: 즉시 반영되는 커뮤니티 활동
3. **확장성**: 새로운 플랫폼 추가 용이
4. **성능**: 캐싱과 최적화된 쿼리
5. **보안**: 중앙화된 인증과 검증

이 아키텍처로 웹 사용자들도 모바일 앱과 완전히 동기화된 커뮤니티 경험을 누릴 수 있습니다!