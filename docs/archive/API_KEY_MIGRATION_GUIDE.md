# API Key 보안 마이그레이션 가이드

## 🚨 긴급 조치 사항

### 1. 노출된 API 키 무효화
다음 API 키들이 Info.plist에 노출되어 있어 즉시 재발급이 필요합니다:

- [ ] **OpenAI API Key** - https://platform.openai.com/api-keys
- [ ] **Perplexity API Key** - Perplexity 대시보드에서 재발급
- [ ] **News API Key** - https://newsapi.org/account
- [ ] **Brave Search API Key** - Brave 개발자 포털에서 재발급

### 2. Supabase Secrets 설정

```bash
# Supabase CLI로 secrets 추가
supabase secrets set OPENAI_API_KEY="새로운-키"
supabase secrets set PERPLEXITY_API_KEY="새로운-키"
supabase secrets set NEWS_API_KEY="새로운-키"
supabase secrets set BRAVE_SEARCH_API_KEY="새로운-키"
```

### 3. Edge Functions 생성

#### ai-proxy Edge Function
```typescript
// AI 서비스 프록시 (OpenAI, Perplexity)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

Deno.serve(async (req) => {
  const { service, ...params } = await req.json();
  
  switch(service) {
    case 'openai':
      // OpenAI API 프록시
      return await proxyOpenAI(params);
    case 'perplexity':
      // Perplexity API 프록시
      return await proxyPerplexity(params);
  }
});
```

#### news-proxy Edge Function
```typescript
// 뉴스 서비스 프록시
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY');
const BRAVE_API_KEY = Deno.env.get('BRAVE_SEARCH_API_KEY');

Deno.serve(async (req) => {
  const { source, query } = await req.json();
  
  switch(source) {
    case 'newsapi':
      // News API 프록시
      return await fetchNewsAPI(query);
    case 'brave':
      // Brave Search 프록시
      return await fetchBraveSearch(query);
  }
});
```

### 4. iOS 앱 코드 수정

#### 기존 코드:
```swift
// 직접 API 호출 ❌
let apiKey = Bundle.main.object(forInfoDictionaryKey: "OpenAIAPIKey") as? String
```

#### 새로운 코드:
```swift
// Supabase Edge Function 호출 ✅
let response = try await supabaseService.invokeFunction(
    "ai-proxy",
    body: ["service": "openai", "prompt": prompt]
)
```

## 보안 이점

1. **API 키 보호**: 서버에만 저장되어 클라이언트에 노출되지 않음
2. **사용량 제어**: Edge Function에서 rate limiting 구현 가능
3. **감사 로그**: 모든 API 호출 추적 가능
4. **쉬운 키 관리**: Supabase 대시보드에서 중앙 관리

## 구현 우선순위

1. **높음**: OpenAI API (비용이 많이 발생할 수 있음)
2. **중간**: News API, Perplexity API
3. **낮음**: Brave Search API

## 참고사항

- Git 히스토리에 이미 노출된 키들은 반드시 재발급 필요
- `.gitignore`에 `Info.plist` 추가 고려
- 환경별 설정 파일 분리 권장