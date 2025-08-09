# Supabase 데이터베이스 마이그레이션 가이드

## 문제
현재 Supabase 데이터베이스에 필요한 테이블들이 없어서 다음과 같은 에러가 발생합니다:
- `relation "public.user_profiles" does not exist`
- `column boards.display_order does not exist`
- `Could not find a relationship between 'posts' and 'user_profiles'`

## 해결 방법

### 1. Supabase Dashboard에서 직접 실행

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. `/supabase/migrations/20250209_community_tables.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

### 2. Supabase CLI 사용 (선택사항)

```bash
# Supabase CLI 설치 (이미 설치되어 있다면 생략)
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref uutmymaxkkytibuiiaax

# 마이그레이션 실행
supabase db push
```

## 마이그레이션 내용

이 마이그레이션은 다음 테이블들을 생성합니다:

1. **user_profiles**: 사용자 프로필 정보
   - id, user_id, email, nickname, avatar_url, favorite_team_id, favorite_team_name

2. **boards**: 게시판 정보
   - id, name, description, category, display_order

3. **posts**: 게시글
   - id, board_id, author_id, title, content, category, tags, view_count, like_count, comment_count

4. **comments**: 댓글
   - id, post_id, author_id, content

5. **post_likes**: 좋아요
   - id, post_id, user_id

## RLS (Row Level Security) 정책

- 모든 사용자가 프로필, 게시글, 댓글을 볼 수 있음
- 인증된 사용자만 게시글, 댓글 작성 가능
- 본인이 작성한 글/댓글만 수정/삭제 가능
- 본인 프로필만 수정 가능

## 자동 기능

- 새 사용자 가입 시 자동으로 user_profiles 레코드 생성
- 게시글 조회수 증가 함수
- 기본 게시판 자동 생성 (전체, 뉴스, 경기토론, 이적시장, 팀별 게시판)

## 확인 방법

마이그레이션 실행 후:
1. SQL Editor에서 다음 쿼리 실행:
```sql
SELECT * FROM user_profiles;
SELECT * FROM boards;
```

2. 테이블이 정상적으로 생성되었는지 확인

## 주의사항

- 이미 존재하는 테이블은 건드리지 않습니다 (IF NOT EXISTS)
- 기존 데이터는 유지됩니다
- RLS 정책이 활성화되므로 auth 토큰이 필요합니다