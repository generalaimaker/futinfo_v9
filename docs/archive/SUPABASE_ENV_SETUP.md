# Supabase Edge Functions 환경 변수 설정 가이드

## 필수 환경 변수

Supabase Edge Functions가 정상적으로 작동하려면 다음 환경 변수들이 설정되어야 합니다:

### 1. FOOTBALL_API_KEY (필수)
- **설명**: Rapid API의 API-Football 접근 키
- **획득 방법**: 
  1. https://rapidapi.com/api-sports/api/api-football 접속
  2. 유료 플랜 구독 (75,000 req/day)
  3. Dashboard에서 API Key 복사

### 2. OPENAI_API_KEY (선택)
- **설명**: 뉴스 및 콘텐츠 번역을 위한 OpenAI API 키
- **획득 방법**: https://platform.openai.com/api-keys

### 3. NEWS_API_KEY (선택)
- **설명**: 뉴스 수집을 위한 NewsAPI 키
- **획득 방법**: https://newsapi.org/register

### 4. BRAVE_SEARCH_API_KEY (선택)
- **설명**: Brave Search API 키 (뉴스 검색용)
- **획득 방법**: https://brave.com/search/api/

### 5. TRANSFERMARKT_API_KEY (필수)
- **설명**: TransferMarkt 이적 정보 API 키
- **획득 방법**: 
  1. https://rapidapi.com/transfermarkt-data-api/api/transfermarket 접속
  2. 무료 플랜 구독 (500 req/month)
  3. Dashboard에서 API Key 복사
- **중요**: iOS 앱에 하드코딩된 키를 제거하고 Edge Function 사용

## 환경 변수 설정 방법

### 방법 1: Supabase Dashboard 사용 (권장)
```bash
1. https://app.supabase.com 접속
2. 프로젝트(futinfo) 선택
3. Edge Functions > Functions 탭으로 이동
4. 각 Function 선택 > Settings
5. Environment Variables 섹션에서 추가
```

### 방법 2: Supabase CLI 사용
```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref uutmymaxkkytibuiiaax

# 환경 변수 설정
supabase secrets set FOOTBALL_API_KEY=your_rapid_api_key
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set NEWS_API_KEY=your_news_api_key
supabase secrets set BRAVE_SEARCH_API_KEY=your_brave_key
supabase secrets set TRANSFERMARKT_API_KEY=your_transfermarkt_key
```

## 환경 변수 확인

설정된 환경 변수 목록 확인:
```bash
supabase secrets list
```

## Edge Function별 필요 환경 변수

### fixtures-api
- FOOTBALL_API_KEY (필수)

### ai-proxy
- OPENAI_API_KEY (필수)
- PERPLEXITY_API_KEY (선택)

### news-proxy
- NEWS_API_KEY (필수)
- BRAVE_SEARCH_API_KEY (필수)

### teams-api, players-api, search-api
- FOOTBALL_API_KEY (필수)

### transfermarkt-api
- TRANSFERMARKT_API_KEY (필수)

> **중요**: iOS 앱의 TransfermarktAPIService가 이제 Supabase Edge Function을 사용하도록 수정되었습니다. 
> 하드코딩된 API 키가 제거되었으므로 반드시 Edge Function에 환경 변수를 설정해야 합니다.

## 문제 해결

### "You are not subscribed to this API" 오류
- FOOTBALL_API_KEY가 올바르게 설정되었는지 확인
- Rapid API 구독이 활성화되어 있는지 확인

### 환경 변수가 작동하지 않을 때
1. Edge Function 재배포:
   ```bash
   supabase functions deploy fixtures-api
   ```

2. 로그 확인:
   ```bash
   supabase functions logs fixtures-api
   ```

## 보안 주의사항
- 환경 변수는 절대 코드에 하드코딩하지 마세요
- .env 파일을 git에 커밋하지 마세요
- API 키는 정기적으로 교체하세요