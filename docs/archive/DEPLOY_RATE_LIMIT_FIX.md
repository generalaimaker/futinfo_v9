# 🚀 Rate Limit 수정 배포 가이드

## 서버 수정 내용

### 1. Supabase Edge Functions (수정 완료)
- 파일: `supabase/functions/football-api/index.ts`
- 변경: `MAX_REQUESTS_PER_MINUTE = 30` → `500`

### 2. 클라이언트 RateLimitManager (수정 완료)
- 파일: `football/Services/RateLimitManager.swift`
- 변경: `maxRequestsPerMinute = 180` → `480`

## 배포 단계

### Supabase Edge Functions 배포
```bash
# Supabase CLI가 설치되어 있어야 함
supabase functions deploy football-api
```

### 배포 확인
1. Supabase Dashboard에서 Edge Function 상태 확인
2. Edge Function 로그 확인:
   ```bash
   supabase functions logs football-api
   ```

## 배포 후 테스트

### 1. 캐시 정리
앱에서 캐시를 정리하여 새로운 데이터를 받아옵니다:
- 설정 → 캐시 정리
- 또는 앱 재시작

### 2. 경기 목록 새로고침
- 일정 탭에서 Pull-to-refresh
- 라이브 경기가 제대로 업데이트되는지 확인

### 3. Rate Limit 모니터링
로그에서 429 오류가 더 이상 발생하지 않는지 확인

## 추가 최적화 (선택사항)

### 클라이언트 측 개선
1. **LiveMatchService.swift** 폴링 간격 조정:
   ```swift
   private let pollingInterval: TimeInterval = 15.0  // 10초 → 15초
   ```

2. **순차적 리그 로딩** 구현:
   - 동시에 모든 리그를 로드하지 않고 순차적으로 로드
   - 우선순위가 높은 리그(라이브 경기 있는 리그)부터 로드

## 문제 해결

### 배포 실패 시
1. Firebase/Supabase 인증 확인
2. 프로젝트 ID 확인
3. 환경 변수 설정 확인

### 여전히 429 오류 발생 시
1. API 제공자(RapidAPI) 대시보드에서 실제 사용량 확인
2. 클라이언트 앱에서 불필요한 요청 제거
3. 캐시 정책 강화

## 완료 체크리스트
- [ ] Firebase Functions 코드 수정
- [ ] Firebase Functions 배포
- [ ] Supabase Edge Functions 확인 (이미 수정됨)
- [ ] Supabase Edge Functions 배포
- [ ] 앱에서 테스트
- [ ] 429 오류 해결 확인