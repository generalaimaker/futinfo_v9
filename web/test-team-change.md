# 팀 변경 기능 테스트 가이드

## 구현된 기능
프로필 설정에서 응원하는 팀을 변경하면 커뮤니티 탭에서도 변경된 팀으로 표시되도록 수정했습니다.

## 주요 변경 사항

### 1. 커뮤니티 페이지 (`/web/app/community/page.tsx`)
- **동적 팀 표시**: 하드코딩된 "Chelsea" 대신 사용자의 실제 팬 팀 표시
  - 라인 388: `{userTeamName || '내 팀'} 팬 게시판`
  - 라인 1053: `{userTeamName || '내 팀'} 게시판이 활발해요`

- **자동 새로고침**: 페이지 포커스 시 프로필 자동 새로고침
  ```typescript
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadUserProfile()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])
  ```

- **팀 변경 시 게시글 자동 갱신**
  ```typescript
  useEffect(() => {
    if (userTeamId) {
      // 내 팀 탭이 선택되어 있으면 게시글도 다시 로드
      if (mainTab === 'myteam') {
        loadCommunityData(`team_${userTeamId}`)
      }
    }
  }, [userTeamId])
  ```

## 테스트 시나리오

### 1. 팀 변경 테스트
1. 프로필 설정(`/profile/edit`)으로 이동
2. 현재 팬 팀 확인 (예: Chelsea)
3. 다른 팀으로 변경 (예: Tottenham)
4. 저장 버튼 클릭
5. 커뮤니티 페이지(`/community`)로 이동
6. "내 팀" 탭 확인
   - 탭 레이블에 새 팀 이름 표시 확인
   - 헤더 섹션에 새 팀 이름과 로고 표시 확인
   - 글쓰기 버튼이 새 팀 게시판으로 연결되는지 확인

### 2. 게시판 권한 테스트
1. 자신의 팬 팀 게시판 접속
   - 글쓰기 버튼이 활성화되어 있는지 확인
   - 글 작성 가능한지 확인

2. 다른 팀 게시판 접속
   - 글쓰기 버튼이 "팬 전용"으로 비활성화되어 있는지 확인
   - 글쓰기 페이지 직접 접근 시 권한 없음 메시지 표시 확인

### 3. 실시간 동기화 테스트
1. 두 개의 브라우저 탭 열기
2. 탭 1: 커뮤니티 페이지 열기
3. 탭 2: 프로필 설정에서 팀 변경
4. 탭 1로 다시 포커스 시 자동으로 새 팀 정보 반영되는지 확인

## 확인 사항
- [x] 하드코딩된 팀 ID/이름 제거
- [x] 동적 팀 정보 로딩
- [x] 페이지 포커스 시 자동 새로고침
- [x] 팀 변경 시 게시글 자동 갱신
- [x] 게시판 권한 체크 로직

## 영향받는 파일
- `/web/app/community/page.tsx` - 커뮤니티 메인 페이지
- `/web/app/community/boards/[boardId]/page.tsx` - 게시판 상세 페이지
- `/web/app/community/boards/[boardId]/write/page.tsx` - 글쓰기 페이지
- `/web/lib/supabase/community.ts` - 커뮤니티 서비스 로직