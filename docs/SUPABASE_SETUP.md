# Supabase Setup Guide for FutInfo

## Overview
이 가이드는 FutInfo 앱에서 Supabase를 사용하기 위한 설정 방법을 설명합니다.

## Supabase 프로젝트 정보
- **Project URL**: https://uutmymaxkkytibuiiaax.supabase.co
- **Project ID**: uutmymaxkkytibuiiaax
- **Region**: ap-northeast-2 (Seoul)

## 구현된 기능들

### 1. 데이터베이스 테이블
- **profiles**: 사용자 프로필 정보
- **boards**: 게시판 정보 (전체, 팀별)
- **posts**: 게시글
- **comments**: 댓글
- **likes**: 좋아요
- **follows**: 팔로우 (팀, 선수, 리그)
- **fixtures_cache**: 경기 일정 캐시
- **fixture_details_cache**: 경기 상세 정보 캐시
- **standings_cache**: 순위표 캐시
- **news_cache**: 뉴스 캐시
- **transfer_cache**: 이적 정보 캐시
- **api_usage**: API 사용량 추적

### 2. Edge Functions
- **fixtures-api**: 경기 일정 API 캐싱
  - `/fixtures`: 날짜별 경기 일정
  - `/standings`: 리그 순위표
  - `/fixture-details`: 경기 상세 정보 (통계, 이벤트, 라인업)
  
- **community-api**: 커뮤니티 기능
  - `/create-post`: 게시글 작성
  - `/create-comment`: 댓글 작성
  - `/toggle-like`: 좋아요 토글
  - `/increment-view`: 조회수 증가
  - `/get-board-stats`: 게시판 통계

### 3. RLS (Row Level Security) 정책
- 모든 테이블에 적절한 보안 정책 적용
- 인증된 사용자만 게시글/댓글 작성 가능
- 본인 게시글/댓글만 수정/삭제 가능
- 캐시 데이터는 모두 읽기 가능

## 환경 변수 설정

### Edge Functions 환경 변수
Supabase 대시보드에서 다음 환경 변수를 설정해야 합니다:

1. **Edge Functions > Settings**로 이동
2. 다음 변수들을 추가:
   ```
   FOOTBALL_API_KEY=your_football_api_key_here
   ```

### iOS 앱 설정
1. `football/Services/SupabaseService.swift` 파일이 생성되어 있습니다.
2. Supabase Swift 패키지 추가:
   ```swift
   // Xcode에서 File > Add Package Dependencies
   // https://github.com/supabase-community/supabase-swift
   ```

### Android 앱 설정
1. `Android/app/src/main/java/com/hyunwoopark/futinfo/data/remote/SupabaseService.kt` 파일이 생성되어 있습니다.
2. build.gradle에 의존성 추가:
   ```gradle
   implementation 'io.github.jan-tennert.supabase:postgrest-kt:2.0.0'
   implementation 'io.github.jan-tennert.supabase:auth-kt:2.0.0'
   implementation 'io.github.jan-tennert.supabase:functions-kt:2.0.0'
   ```

## 사용 방법

### 1. 인증 (iOS)
```swift
// 회원가입
try await SupabaseService.shared.signUp(
    email: "user@example.com",
    password: "password123",
    nickname: "닉네임"
)

// 로그인
try await SupabaseService.shared.signIn(
    email: "user@example.com",
    password: "password123"
)

// 로그아웃
try await SupabaseService.shared.signOut()
```

### 2. 경기 일정 캐싱 (iOS)
```swift
// Supabase Edge Function 사용
let fixtures = try await SupabaseFootballAPIService.shared.fetchFixtures(
    date: "2025-01-07"
)

// 특정 리그 경기만
let fixtures = try await SupabaseFootballAPIService.shared.fetchFixtures(
    date: "2025-01-07",
    leagueId: 39 // Premier League
)
```

### 3. 커뮤니티 기능 (iOS)
```swift
// 게시글 작성
try await SupabaseCommunityService.shared.createPost(
    boardId: "team_33",
    title: "맨유 경기 후기",
    content: "오늘 경기 정말 좋았습니다!",
    category: "general"
)

// 게시글 목록
await SupabaseCommunityService.shared.loadPosts(
    boardId: "team_33",
    category: "discussion"
)

// 좋아요
try await SupabaseCommunityService.shared.toggleLike(post: post)
```

## 캐싱 전략

### 경기 일정 캐싱
- **과거 경기**: 3시간 캐싱
- **오늘 경기**: 1시간 캐싱
- **미래 경기**: 30분 캐싱
- **라이브 경기**: 15분 캐싱

### 장점
1. **API 비용 절감**: Football API 호출 횟수 대폭 감소
2. **성능 향상**: 캐시된 데이터로 빠른 응답
3. **안정성**: API 장애 시에도 캐시 데이터 제공
4. **확장성**: Supabase Edge Functions로 쉽게 확장 가능

## 마이그레이션 가이드

### Firebase에서 Supabase로 전환
1. **인증**: FirebaseAuth → Supabase Auth
2. **데이터베이스**: Firestore → Supabase PostgreSQL
3. **서버리스 함수**: Firebase Functions → Supabase Edge Functions
4. **실시간 기능**: Firestore 실시간 → Supabase Realtime (필요시)

### 점진적 마이그레이션
1. 먼저 캐싱 기능만 Supabase로 전환
2. 커뮤니티 기능 전환
3. 인증 시스템 전환
4. 기타 기능 순차적 전환

## 모니터링

### API 사용량 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT 
    endpoint,
    COUNT(*) as call_count,
    AVG(response_time) as avg_response_time,
    DATE_TRUNC('hour', created_at) as hour
FROM api_usage
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, hour
ORDER BY hour DESC;
```

### 캐시 히트율 확인
```sql
-- 캐시 상태 확인
SELECT 
    'fixtures_cache' as cache_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_entries
FROM fixtures_cache
UNION ALL
SELECT 
    'standings_cache',
    COUNT(*),
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END)
FROM standings_cache;
```

## 문제 해결

### Edge Function 디버깅
1. Supabase 대시보드 > Functions > Logs 확인
2. 에러 발생 시 로그에서 상세 정보 확인

### 캐시 초기화
```sql
-- 모든 캐시 삭제
TRUNCATE fixtures_cache, fixture_details_cache, standings_cache, news_cache, transfer_cache;
```

### RLS 정책 테스트
```sql
-- RLS 정책이 제대로 작동하는지 테스트
SET SESSION ROLE anon;
SELECT * FROM posts LIMIT 10; -- 읽기 가능
INSERT INTO posts (...) VALUES (...); -- 실패해야 함
```

## 추가 개발 예정

1. **실시간 기능**: 라이브 경기 업데이트, 실시간 댓글
2. **푸시 알림**: 팔로우 팀 경기 알림
3. **통계 대시보드**: 사용자 활동 분석
4. **이미지 업로드**: Supabase Storage 활용