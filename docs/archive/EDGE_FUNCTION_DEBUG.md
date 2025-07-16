# Edge Function 디버깅 가이드

## 현재 문제
1. **HTTP 500 에러** - Edge Function이 제대로 작동하지 않음
2. **0개 경기 반환** - API는 호출되지만 데이터가 없음

## 문제 해결 단계

### 1. Edge Function 배포 확인
```bash
cd /Users/hyunwoopark/Desktop/futinfo_v6

# 로그인 확인
supabase login

# 프로젝트 연결
supabase link --project-ref uutmymaxkkytibuiiaax

# Edge Functions 목록 확인
supabase functions list
```

### 2. Edge Functions 배포
```bash
# fixtures-api 배포
supabase functions deploy fixtures-api

# teams-api 배포  
supabase functions deploy teams-api

# players-api 배포
supabase functions deploy players-api
```

### 3. 환경 변수 설정
```bash
# API 키 설정 (본인의 Rapid API 키로 교체)
supabase secrets set FOOTBALL_API_KEY="your-rapid-api-key"

# 설정 확인
supabase secrets list
```

### 4. Edge Function 로그 확인
```bash
# 실시간 로그 확인
supabase functions logs fixtures-api --tail

# 특정 시간대 로그 확인
supabase functions logs fixtures-api --since 1h
```

### 5. 테스트
```bash
# fixtures-api 테스트 (오늘 날짜의 프리미어리그)
curl -i "https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/fixtures-api/fixtures?date=2025-07-15&league=39&season=2024"

# 응답 확인
# - HTTP 200: 성공
# - HTTP 429: Rate limit
# - HTTP 500: 서버 에러 (API 키 미설정 등)
```

### 6. iOS 앱에서 확인할 사항
1. 앱을 완전히 종료하고 재시작
2. 콘솔 로그에서 다음 확인:
   - "❌ Edge Function 오류:" 메시지
   - "❌ 오류 상세:" 메시지
   - "❌ 전체 응답:" 메시지

### 7. 일반적인 문제와 해결법

#### API 키가 설정되지 않음
```
❌ Edge Function 오류: API key not configured
```
→ `supabase secrets set FOOTBALL_API_KEY="your-key"` 실행

#### Rate Limit 초과
```
❌ Edge Function 오류: Rate limit exceeded
```
→ 잠시 기다린 후 재시도

#### Edge Function이 배포되지 않음
```
HTTP 500 Internal Server Error
```
→ Edge Function 재배포 필요

### 8. 시즌 확인
2025년 7월 기준 올바른 시즌:
- 유럽 리그 (EPL, 라리가 등): 2024-25 시즌 → `season=2024`
- K리그, MLS: 2025 시즌 → `season=2025`
- FIFA 클럽 월드컵: 2025 시즌 → `season=2025`

### 9. 빠른 해결책
Edge Function 배포가 어렵다면, 임시로 직접 API 호출 사용:
1. `FootballAPIService.swift`에서 `config.useSupabaseEdgeFunctions = false` 설정
2. API 키를 앱에 직접 설정 (보안상 권장하지 않음)