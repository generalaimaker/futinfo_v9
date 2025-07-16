# Supabase Edge Functions 배포 가이드

## 문제 해결
iOS 앱이 존재하지 않는 Edge Functions를 호출하고 있어서 500 에러가 발생했습니다.

## 생성된 Edge Functions
1. **fixtures-api** - 경기 일정 API
2. **teams-api** - 팀 정보 API  
3. **players-api** - 선수 정보 API

## 배포 방법

### 1. Supabase CLI 설치 (아직 안했다면)
```bash
brew install supabase/tap/supabase
```

### 2. 프로젝트 디렉토리로 이동
```bash
cd /Users/hyunwoopark/Desktop/futinfo_v6
```

### 3. Edge Functions 배포
```bash
# fixtures-api 배포
supabase functions deploy fixtures-api --project-ref uutmymaxkkytibuiiaax

# teams-api 배포  
supabase functions deploy teams-api --project-ref uutmymaxkkytibuiiaax

# players-api 배포
supabase functions deploy players-api --project-ref uutmymaxkkytibuiiaax
```

### 4. 환경 변수 설정
Supabase 대시보드에서 다음 환경 변수를 설정해야 합니다:
- `FOOTBALL_API_KEY`: Rapid API 키
- `FOOTBALL_API_HOST`: api-football-v1.p.rapidapi.com

또는 CLI로 설정:
```bash
supabase secrets set FOOTBALL_API_KEY="your-rapid-api-key" --project-ref uutmymaxkkytibuiiaax
```

## Rate Limit 설정
- 모든 Edge Functions는 분당 400개 요청으로 제한
- Rapid API의 분당 450개 제한보다 낮게 설정하여 안전 마진 확보

## 확인 방법
배포 후 다음 URL로 테스트:
```
https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/fixtures-api/fixtures?date=2025-07-15&league=39&season=2024
```