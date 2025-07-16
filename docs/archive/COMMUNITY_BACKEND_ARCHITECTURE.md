# 커뮤니티 백엔드 아키텍처 설계

## 1. 개요
웹, iOS, Android 모든 플랫폼에서 동일한 커뮤니티 경험을 제공하기 위한 백엔드 시스템 설계

## 2. 기술 스택 제안

### 옵션 1: Supabase (추천)
- **장점**: 
  - 실시간 동기화 지원
  - 인증 시스템 내장
  - PostgreSQL 기반
  - 파일 스토리지 제공
  - 무료 티어 제공
- **구현 용이성**: 높음

### 옵션 2: Firebase
- **장점**: 
  - 실시간 데이터베이스
  - 쉬운 인증 시스템
  - 파일 스토리지
- **단점**: NoSQL (복잡한 쿼리 어려움)

### 옵션 3: Custom Backend (Node.js/Python)
- **장점**: 완전한 커스터마이징
- **단점**: 구현 시간 많이 소요

## 3. 데이터베이스 스키마 (PostgreSQL)

```sql
-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    profile_image_url TEXT,
    fan_team_id INTEGER REFERENCES teams(id),
    is_team_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 팀 정보 테이블 (Football API와 동기화)
CREATE TABLE teams (
    id INTEGER PRIMARY KEY, -- Football API의 team ID
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    league_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 게시판 테이블
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL, -- 'all', 'team'
    name VARCHAR(100) NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    description TEXT,
    post_count INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 게시글 테이블
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_notice BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 게시글 이미지 테이블
CREATE TABLE post_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id)
);

-- 북마크 테이블
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 알림 테이블
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 팀 멤버십 (팀 게시판 권한 관리)
CREATE TABLE team_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);
```

## 4. API 엔드포인트 설계

### 인증
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `GET /auth/me` - 현재 사용자 정보

### 사용자
- `GET /users/:id` - 사용자 프로필
- `PUT /users/:id` - 프로필 수정
- `PUT /users/:id/fan-team` - 팬 팀 설정

### 게시판
- `GET /boards` - 게시판 목록
- `GET /boards/:id` - 게시판 상세
- `GET /boards/:id/permissions` - 게시판 권한 확인

### 게시글
- `GET /posts` - 게시글 목록 (페이지네이션)
- `GET /posts/:id` - 게시글 상세
- `POST /posts` - 게시글 작성
- `PUT /posts/:id` - 게시글 수정
- `DELETE /posts/:id` - 게시글 삭제
- `POST /posts/:id/like` - 좋아요
- `DELETE /posts/:id/like` - 좋아요 취소
- `POST /posts/:id/bookmark` - 북마크

### 댓글
- `GET /posts/:id/comments` - 댓글 목록
- `POST /comments` - 댓글 작성
- `PUT /comments/:id` - 댓글 수정
- `DELETE /comments/:id` - 댓글 삭제
- `POST /comments/:id/like` - 댓글 좋아요

### 파일 업로드
- `POST /upload/image` - 이미지 업로드

### 알림
- `GET /notifications` - 알림 목록
- `PUT /notifications/:id/read` - 알림 읽음 처리

## 5. 실시간 기능 (WebSocket/Supabase Realtime)

- 새 게시글 알림
- 댓글 알림
- 좋아요 알림
- 실시간 조회수 업데이트

## 6. 클라이언트 통합 방안

### iOS (Swift)
```swift
// Supabase 클라이언트 설정
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
    supabaseKey: "YOUR_SUPABASE_ANON_KEY"
)

// API 서비스 수정
class CommunityAPIService {
    func fetchPosts(boardId: String, page: Int) async throws -> [Post] {
        let response = try await supabase
            .from("posts")
            .select("*, author:users(*), images:post_images(*)")
            .eq("board_id", value: boardId)
            .order("created_at", ascending: false)
            .range(from: (page - 1) * 20, to: page * 20 - 1)
            .execute()
        
        return try JSONDecoder().decode([Post].self, from: response.data)
    }
}
```

### Android (Kotlin)
```kotlin
// Supabase 클라이언트 설정
val supabase = createSupabaseClient(
    supabaseUrl = "YOUR_SUPABASE_URL",
    supabaseKey = "YOUR_SUPABASE_ANON_KEY"
) {
    install(Postgrest)
    install(Auth)
    install(Storage)
}

// API 서비스
class CommunityRepository {
    suspend fun fetchPosts(boardId: String, page: Int): List<Post> {
        return supabase.from("posts")
            .select(Columns.raw("*, author:users(*), images:post_images(*)"))
            .filter {
                eq("board_id", boardId)
            }
            .order("created_at", Order.DESCENDING)
            .limit(20, offset = (page - 1) * 20)
            .decodeList<Post>()
    }
}
```

### Web (React/Next.js)
```javascript
// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// API 서비스
export const communityApi = {
    async fetchPosts(boardId, page = 1) {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:users(*),
                images:post_images(*)
            `)
            .eq('board_id', boardId)
            .order('created_at', { ascending: false })
            .range((page - 1) * 20, page * 20 - 1)
        
        if (error) throw error
        return data
    }
}
```

## 7. 보안 고려사항

### Row Level Security (RLS) 정책
```sql
-- 게시글 읽기: 모두 가능
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

-- 게시글 작성: 인증된 사용자만
CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 팀 게시판 작성: 해당 팀 팬만
CREATE POLICY "Team board posts require membership" ON posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM boards b
            JOIN team_memberships tm ON tm.team_id = b.team_id
            WHERE b.id = board_id 
            AND tm.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM boards WHERE id = board_id AND type = 'all'
        )
    );
```

## 8. 구현 우선순위

1. **Phase 1**: 기본 커뮤니티 기능
   - 사용자 인증
   - 게시글 CRUD
   - 댓글 기능

2. **Phase 2**: 고급 기능
   - 실시간 알림
   - 이미지 업로드
   - 좋아요/북마크

3. **Phase 3**: 최적화
   - 캐싱
   - 무한 스크롤
   - 검색 기능

## 9. 모니터링 및 관리

- 부적절한 콘텐츠 신고 시스템
- 관리자 대시보드
- 사용자 제재 시스템
- 통계 및 분석