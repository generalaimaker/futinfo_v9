# Futinfo v6 - 프로젝트 진행 상황

## 프로젝트 개요
- **목표**: Fotmob과 유사한 축구 정보 서비스 구축
- **도메인**: buildup-football.com (Vercel 배포)
- **플랫폼**: Web, iOS, Android 크로스플랫폼 지원
- **기술 스택**:
  - Frontend: Next.js 14.2.30 (App Router)
  - Backend: Supabase (PostgreSQL, Auth, Realtime)
  - Deployment: Vercel
  - Mobile: iOS (Swift), Android (Kotlin)

## 현재 작업 상황

### 1. 인증 시스템 (✅ 완료)
- **Supabase OAuth 구현**
  - Google, Apple 소셜 로그인
  - PKCE flow 사용
  - 싱글톤 패턴으로 클라이언트 인스턴스 관리
- **해결된 이슈들**:
  - Multiple GoTrueClient instances 경고 해결
  - PKCE "auth code and code verifier" 오류 수정
  - 세션 관리 안정화

### 2. 데이터베이스 구조 (✅ 완료)
```sql
-- 주요 테이블들
- profiles (user_id, nickname, favorite_team_id, created_at, updated_at)
- posts (id, user_id, board_id, title, content, created_at, updated_at, view_count)
- comments (id, post_id, user_id, content, created_at, updated_at)
- post_likes (id, post_id, user_id, created_at)
- boards (id, name, slug, description, created_at)
- team_posts (팀별 커뮤니티 게시판)
```

### 3. 팀별 커뮤니티 기능 (🔄 진행중)
- **구현된 기능**:
  - 팀별 게시판 생성/조회
  - 게시글 작성/수정/삭제
  - 카테고리별 필터링 (일반, 경기, 이적, 뉴스, 토론)
  - 좋아요, 조회수, 댓글 기능
- **파일 위치**:
  - `/web/app/teams/[id]/page.tsx` - 팀 상세 페이지
  - `/web/lib/supabase/teams.ts` - 팀 커뮤니티 서비스
  - `/web/lib/supabase/community.ts` - 일반 커뮤니티 서비스

### 4. 해결된 주요 이슈들

#### a. 프로필 설정 실패
- **문제**: "favoriteTeamId" 컬럼 찾을 수 없음
- **원인**: snake_case(DB) vs camelCase(JS) 불일치
- **해결**: community.ts에서 필드 매핑 추가
```typescript
const dbUpdates: any = {}
if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname
if (updates.favoriteTeamId !== undefined) dbUpdates.favorite_team_id = updates.favoriteTeamId
```

#### b. 게시판 로드 실패
- **문제**: "relation public.user_profiles does not exist"
- **원인**: posts 테이블이 존재하지 않는 user_profiles 테이블 참조
- **해결**: 기존 profiles 테이블 사용하도록 수정

#### c. 팀 페이지 TypeError
- **문제**: "Cannot read properties of undefined (reading 'toLocaleString')"
- **원인**: venue.capacity, fixture.date 등이 undefined일 때 에러
- **해결**: 옵셔널 체이닝과 기본값 처리
```typescript
{venue.capacity ? venue.capacity.toLocaleString() : '-'}
{fixture.date ? new Date(fixture.date).toLocaleDateString('ko-KR') : '날짜 미정'}
```

## 환경 변수 설정

### Vercel 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=https://buildup-football.com
```

### Supabase 설정
- **OAuth Providers**: Google, Apple 활성화
- **Redirect URLs**: 
  - https://buildup-football.com/auth/callback
  - http://localhost:3000/auth/callback
- **RLS Policies**: 모든 테이블에 적용

## 파일 구조
```
/web
├── app/
│   ├── auth/
│   │   ├── callback/route.ts    # OAuth 콜백 처리
│   │   └── login/page.tsx       # 로그인 페이지
│   ├── teams/
│   │   └── [id]/page.tsx        # 팀 상세 & 커뮤니티
│   └── community/                # 일반 커뮤니티
├── lib/
│   └── supabase/
│       ├── client-singleton.ts   # Supabase 클라이언트 싱글톤
│       ├── client.ts             # 클라이언트 export
│       ├── server.ts             # 서버 사이드 클라이언트
│       ├── provider.tsx          # Auth Provider
│       ├── community.ts          # 커뮤니티 서비스
│       ├── teams.ts              # 팀 커뮤니티 서비스
│       └── football.ts           # 축구 데이터 API
└── middleware.ts                 # 세션 관리 미들웨어
```

## 다음 작업 계획

### 1. 모바일 앱 연동
- [ ] iOS 앱 Supabase 인증 연동
- [ ] Android 앱 Supabase 인증 연동
- [ ] 실시간 동기화 구현

### 2. 커뮤니티 기능 강화
- [ ] 댓글 기능 완성
- [ ] 이미지 업로드
- [ ] 알림 시스템
- [ ] 팀별 랭킹/통계

### 3. 성능 최적화
- [ ] 캐싱 전략 구현
- [ ] 이미지 최적화
- [ ] API 요청 최적화

## 테스트 방법

### 로컬 개발
```bash
cd web
npm install
npm run dev
# http://localhost:3000
```

### 배포
```bash
git add -A
git commit -m "커밋 메시지"
git push origin main
# Vercel이 자동 배포
```

### 디버깅 팁
1. **Multiple GoTrueClient 경고**: client-singleton.ts 확인
2. **PKCE 오류**: OAuth 설정 및 redirect URL 확인
3. **DB 오류**: Supabase Dashboard에서 테이블 구조 확인
4. **TypeError**: undefined 값 처리 확인

## 주요 커밋 히스토리
- `af33605`: 팀 페이지 toLocaleString 에러 수정
- `b1fbf72`: Supabase 인증 싱글톤 패턴 완전 수정
- `3335b6b`: 커뮤니티 서비스 snake_case/camelCase 변환 수정
- `6583b4c`: 클럽 친선경기(667) 시즌 계산 오류 수정
- `1dfdaa0`: Android 앱 Supabase 커뮤니티 기능 연결

## 연락처 및 리소스
- **GitHub**: https://github.com/generalaimaker/futinfo_v9
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/uutmymaxkkytibuiiaax
- **배포 URL**: https://buildup-football.com

---

*마지막 업데이트: 2025년 1월 11일*
*작업자: Claude Code Assistant*