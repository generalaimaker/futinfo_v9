# FutInfo v6 - 프로젝트 현황 (2025년 1월 최신)

## 📌 프로젝트 개요
**FutInfo v6**는 축구 팬들을 위한 종합 정보 플랫폼으로, 실시간 경기 정보, 커뮤니티, 이적 시장 정보를 제공하는 크로스 플랫폼 서비스입니다.

### 기술 스택
- **Frontend**: Next.js 14.2.30 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **API**: Football-API (api-football-v3)
- **Deployment**: Vercel (웹), 추후 iOS/Android 앱
- **URL**: https://futinfo-v6.vercel.app (구 buildup-football.com)

## 🚀 최근 작업 내역 (2025년 1월 최신)

### 1. 커뮤니티 2.0 완전 개편 ✅
#### 메인 구조 변경
- **3단 탭 구조**: 
  - 전체 게시판: 모든 사용자가 소통하는 공간
  - 내 팀 게시판: Chelsea 팬 전용 (기본값)
  - 매치데이: 실시간 경기 정보 및 라이브 소통

#### 팀 라커룸 (구 리그&팀 게시판) ✅
- **이름 변경**: "리그 & 팀 게시판" → "팀 라커룸"
- **5대 리그 50개 팀 게시판**:
  ```
  Premier League (10팀): Chelsea, Man United, Liverpool, Man City, Arsenal, 
                         Tottenham, Newcastle, Brighton, Wolves, West Ham
  La Liga (10팀): Real Madrid, Barcelona, Atletico Madrid, Valencia, Villarreal,
                   Athletic Bilbao, Real Betis, Sevilla, Real Sociedad, Osasuna
  Bundesliga (10팀): Bayern Munich, Dortmund, RB Leipzig, Leverkusen, Wolfsburg,
                      Frankfurt, SC Freiburg, Hertha, Union Berlin, Stuttgart
  Serie A (10팀): AC Milan, Inter, Juventus, Napoli, Roma, 
                   Lazio, Atalanta, Fiorentina, Torino, Sassuolo
  Ligue 1 (10팀): PSG, Monaco, Marseille, Nice, Lyon,
                   Lille, Rennes, Nantes, Montpellier, Reims
  ```

### 2. 매치데이 페이지 전면 UI 개편 ✅
#### 메인 경기 카드 디자인
- **그라데이션 배경**: 
  - 경기 예정: 인디고→퍼플→핑크 그라데이션
  - LIVE 경기: 그린→에메랄드→틸 그라데이션
- **팀 정보 강화**:
  - 로고 크기 100x100으로 확대
  - "⭐ OUR TEAM" 배지로 우리팀 강조
  - HOME/AWAY 명확한 표시
- **시간 정보 개선**:
  - 큰 폰트로 경기 시간 표시 (5xl)
  - 킥오프까지 남은 시간 실시간 계산
  - 날짜와 요일 명확히 표시

#### 경기 정보 탭 구성
1. **예상 라인업** (블루 그라데이션):
   - 팀별 포메이션 표시 (4-3-3, 4-2-3-1 등)
   - 전술 예상 정보
   - 팀 로고 포함
   - 경기 1시간 전 공개 안내

2. **상대 전적 (H2H)** (퍼플 그라데이션):
   - 최근 5경기 맞대결 기록
   - 승/무/패 색상 코딩 (초록/회색/빨강)
   - 팀 로고 표시
   - 날짜별 상세 스코어

3. **최근 5경기 폼** (그린 그라데이션):
   - W/D/L 결과 시각적 박스
   - 팀별 승률 퍼센티지
   - HOME/AWAY 배지 구분
   - 그라데이션 박스 디자인

4. **경기 정보** (오렌지 그라데이션):
   - 심판 정보 (⚑ 아이콘)
   - 경기장 정보 (Trophy 아이콘)
   - 리그 정보 (Star 아이콘)
   - 라운드 정보 (R 배지)

### 3. 성능 및 UX 개선 ✅
#### 로딩 최적화
- **스켈레톤 UI 추가**: 데이터 로딩 중 깜빡임 방지
- **데이터 프리로드**: 페이지 진입 시 매치데이 데이터 미리 로드
- **최소 로딩 시간**: 300ms 보장으로 안정적인 전환

#### 404 에러 해결
- `/profile/[id]` 링크 제거 (페이지 미구현)
- `/community/tags/[tag]` 링크 제거 (페이지 미구현)
- 클릭 가능한 스타일은 유지하되 실제 라우팅 제거

### 4. 샘플 데이터 추가 ✅
- **전체 게시판**: 20+ 실제 축구 관련 게시글
- **Chelsea 팀 게시판**: 20+ 팀 관련 게시글
- **컨텐츠 예시**:
  - 손흥민 챔스 복귀전 2골
  - 엔조 페르난데스 이적설
  - 첼시 새 감독 전술 분석
  - 토트넘전 프리뷰

## 📂 주요 파일 구조
```
/web
├── app/
│   ├── community/
│   │   ├── page.tsx              # ⭐ 메인 커뮤니티 (3단 탭, 매치데이)
│   │   └── boards/
│   │       └── [boardId]/
│   │           └── write/page.tsx # 글쓰기 페이지
│   ├── fixtures/
│   │   ├── page.tsx              # 경기 일정 목록
│   │   └── [fixtureId]/page.tsx  # 경기 상세
│   ├── transfermarket/page.tsx   # 이적시장
│   └── layout.tsx                 # 공통 레이아웃
├── lib/
│   ├── supabase/
│   │   ├── football.ts           # 축구 API 서비스
│   │   ├── community.ts          # 커뮤니티 서비스
│   │   └── client-singleton.ts   # Supabase 클라이언트
│   └── types/
│       ├── football.ts           # 축구 데이터 타입
│       └── community.ts          # 커뮤니티 타입
└── components/
    └── layout/
        └── navbar-simple.tsx      # 네비게이션 바
```

## 🐛 최근 해결된 이슈들

### 1. 매치데이 로딩 지연 (2025.01.11)
- **문제**: "경기가 없습니다" 메시지가 잠깐 표시 후 실제 데이터 로드
- **해결**: 
  - 스켈레톤 UI 추가
  - isMatchdayLoading 상태 관리
  - 데이터 프리로드 구현

### 2. 배포 타입 에러 (2025.01.11)
- **문제**: `setMainTab` is not defined in MatchdayContent
- **해결**: props로 setMainTab 전달

### 3. 팀 게시판 분리 (2025.01.11)
- **문제**: 전체 게시판과 팀 게시판이 같은 데이터 표시
- **해결**: boardId 기반 필터링 구현

## 🔄 현재 상태

### ✅ 완료된 기능
- 커뮤니티 2.0 (3단 탭 구조)
- 팀 라커룸 (50개 팀 게시판)
- 매치데이 UI 대폭 개선
- 글쓰기/읽기 기능
- 실시간 경기 정보 표시
- 이적시장 페이지
- 경기 일정/상세 페이지
- Supabase 인증 시스템
- 샘플 데이터 세트

### 🔄 진행 중
- 실시간 채팅 백엔드 연결
- 좋아요/댓글 기능 완성
- 푸시 알림 시스템

### 📋 계획
- 프로필 페이지 구현
- 태그 검색 기능
- 모바일 앱 (iOS/Android)
- 팀별 테마 색상 적용

## 🚀 로컬 실행 방법

```bash
# 1. 프로젝트 클론
git clone https://github.com/generalaimaker/futinfo_v9.git
cd futinfo_v6/web

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 4. 개발 서버 실행
npm run dev

# 5. 브라우저에서 확인
http://localhost:3000
```

## 📊 데이터베이스 구조

### 주요 테이블
```sql
-- 사용자 프로필
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  nickname TEXT,
  favorite_team_id INTEGER,
  favorite_team_name TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 게시글
posts (
  id UUID PRIMARY KEY,
  board_id TEXT,        -- 'all', 'team_49' (Chelsea) 등
  author_id UUID REFERENCES profiles,
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 댓글
comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts,
  author_id UUID REFERENCES profiles,
  content TEXT,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🎯 다음 스프린트 목표

### Sprint 1 (1월 3주)
1. 실시간 채팅 구현
2. 좋아요/댓글 완성
3. 프로필 페이지 생성

### Sprint 2 (1월 4주)
1. 태그 검색 기능
2. 알림 시스템
3. 팀별 테마 적용

### Sprint 3 (2월 1주)
1. 모바일 앱 개발 시작
2. PWA 설정
3. 성능 최적화

## 📝 커밋 컨벤션
- `feat:` 새로운 기능
- `fix:` 버그 수정
- `style:` UI/UX 개선
- `refactor:` 코드 리팩토링
- `docs:` 문서 업데이트
- `chore:` 기타 작업

## 📞 리소스 & 링크
- **GitHub**: https://github.com/generalaimaker/futinfo_v9
- **배포 URL**: https://futinfo-v6.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase**: https://supabase.com/dashboard/project/uutmymaxkkytibuiiaax
- **API Docs**: https://www.api-football.com/documentation-v3

---
*Last Updated: 2025년 1월 11일 15:40*
*Updated by: Claude Assistant*
*Next Review: 채팅창 재시작 시 이 문서 확인*