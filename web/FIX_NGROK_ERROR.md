# ngrok 에러 해결 방법

## 문제
Google OAuth 로그인 시 `f11ca29dabc3.ngrok-free.app`로 리다이렉트되는 문제

## 원인
Supabase Dashboard의 Site URL이 아직 ngrok URL로 설정되어 있음

## 해결 방법

### 1. Supabase Dashboard 접속
https://supabase.com/dashboard/project/uutmymaxkkytibuiiaax

### 2. Authentication → URL Configuration

#### Site URL 변경 (가장 중요!)
현재: `https://f11ca29dabc3.ngrok-free.app` (잘못된 설정)
변경: `https://buildup-football.com`

#### Redirect URLs (허용된 URL들)
```
https://buildup-football.com/auth/callback
https://buildup-football.com
http://localhost:3000/auth/callback
http://localhost:3000
```

⚠️ ngrok 관련 URL들은 모두 제거!

### 3. 저장
"Save" 버튼 클릭

### 4. 테스트
1. 브라우저 캐시 삭제 (중요!)
2. https://buildup-football.com/auth/login 접속
3. "Google로 계속하기" 클릭
4. 정상적으로 buildup-football.com으로 리다이렉트 확인

## 추가 확인 사항

### Google Cloud Console
APIs & Services → Credentials → OAuth 2.0 Client IDs에서:

**Authorized JavaScript origins**:
```
https://buildup-football.com
http://localhost:3000
```
(ngrok URL 제거)

**Authorized redirect URIs**:
```
https://uutmymaxkkytibuiiaax.supabase.co/auth/v1/callback
```

## 로컬 개발 시
로컬에서 테스트할 때는:
- Site URL을 임시로 `http://localhost:3000`으로 변경
- 테스트 후 다시 `https://buildup-football.com`으로 복원

## 주의사항
- Site URL 변경 후 즉시 적용되지 않을 수 있음 (최대 5분 소요)
- 브라우저 캐시/쿠키 삭제 권장
- 시크릿 창에서 테스트 권장