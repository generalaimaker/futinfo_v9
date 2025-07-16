# 🚀 Zero-API 뉴스 시스템 구현 가이드

## 📋 개요
API 호출 비용을 완전히 제거한 RSS 기반 뉴스 시스템입니다.

### 핵심 특징
- **월 비용**: $0 (Supabase 무료 티어)
- **API 호출**: 0회
- **응답 속도**: < 1초 (캐시 활용)
- **오프라인 지원**: ✅

## 🏗️ 아키텍처

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  RSS Feeds  │────▶│   Supabase   │────▶│   iOS App   │
│  (무료)     │     │ Edge Function │     │             │
└─────────────┘     │  (30분마다)   │     └─────────────┘
                    └──────────────┘            │
                            │                   ▼
                    ┌──────────────┐     ┌─────────────┐
                    │   Database   │     │ Local Cache │
                    │  (캐시 저장)  │     │ (오프라인)  │
                    └──────────────┘     └─────────────┘
```

## 📦 구현된 컴포넌트

### 1. **RSSNewsService.swift**
- RSS 피드 파싱
- Supabase 캐시 읽기
- 오프라인 폴백

### 2. **rss-news-collector (Edge Function)**
- 30분마다 RSS 수집
- 중복 제거 및 필터링
- DB에 자동 저장

### 3. **ZeroAPINewsViewModel.swift**
- API 호출 없는 뷰모델
- 오프라인 캐싱
- 실시간 검색

### 4. **cached_news 테이블**
- 뉴스 저장소
- 전문 검색 지원
- 다국어 번역 필드

## 🔧 설치 가이드

### 1단계: Supabase 데이터베이스 설정

```sql
-- Supabase SQL Editor에서 실행
-- /supabase/migrations/create_cached_news_table.sql 내용 복사하여 실행
```

### 2단계: Edge Function 배포

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# Edge Function 배포
supabase functions deploy rss-news-collector

# 환경 변수 설정 (필요한 경우)
supabase secrets set NEWS_API_KEY=your_backup_key
```

### 3단계: 크론 작업 설정

Supabase Dashboard에서:
1. Database → Extensions → pg_cron 활성화
2. SQL Editor에서 실행:

```sql
-- 30분마다 RSS 수집 실행
SELECT cron.schedule(
  'collect-rss-news',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/rss-news-collector',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || 'your-anon-key',
      'x-scheduled', 'true'
    )
  );
  $$
);
```

### 4단계: iOS 앱 통합

```swift
// ContentView.swift
struct NewsView: View {
    // 기존 NewsViewModel 대신 사용
    @StateObject private var viewModel = ZeroAPINewsViewModel()
    
    var body: some View {
        // 기존 UI 그대로 사용 가능
    }
}
```

## 📱 사용 방법

### 뉴스 로드
```swift
// API 호출 없이 캐시에서 로드
await viewModel.loadNews()
```

### 검색
```swift
// Supabase 전문 검색 활용
await viewModel.searchNews(query: "transfer")
```

### 오프라인 모드
```swift
// 자동으로 오프라인 감지 및 로컬 캐시 사용
if viewModel.isOfflineMode {
    Text("오프라인 모드")
}
```

## 🎯 성능 최적화

### 1. **인덱싱**
- published_at, source, url에 인덱스
- 전문 검색을 위한 GIN 인덱스

### 2. **뷰 활용**
- popular_news: 인기 뉴스
- latest_news: 최신 뉴스

### 3. **캐싱 전략**
- 메모리: 30분
- 로컬 DB: 7일
- Supabase: 30일

## 🌐 RSS 피드 추가

`RSSNewsService.swift`에서 피드 추가:
```swift
private let rssFeeds = [
    // 기존 피드...
    RSSFeed(name: "New Source", url: "https://example.com/rss", language: "en")
]
```

## 📊 모니터링

### 수집 상태 확인
```sql
SELECT * FROM news_statistics 
ORDER BY date DESC 
LIMIT 7;
```

### 인기 뉴스 확인
```sql
SELECT * FROM popular_news;
```

## 🔒 보안

- Row Level Security 활성화
- 읽기 전용 공개 접근
- 쓰기는 서비스 역할만

## 🚨 문제 해결

### RSS 수집 실패
1. Edge Function 로그 확인
2. RSS 피드 URL 유효성 확인
3. 네트워크 연결 확인

### 검색 안됨
1. search_vector 업데이트 확인
2. 언어 설정 확인
3. 인덱스 재구축

## 💡 향후 개선 사항

### 1. 스마트 번역
- DeepL API 무료 티어 활용
- 서버에서 미리 번역

### 2. 이미지 최적화
- Cloudinary 무료 티어
- 썸네일 자동 생성

### 3. 푸시 알림
- 중요 뉴스만 선별
- FCM 무료 사용

## 📈 예상 효과

| 항목 | 이전 | 이후 |
|------|------|------|
| 월 비용 | $200+ | $0 |
| API 호출 | 20,000+/월 | 0 |
| 응답 시간 | 2-5초 | <1초 |
| 오프라인 | ❌ | ✅ |

## 🎉 결론

이 시스템으로 API 비용 없이 고품질 축구 뉴스 서비스를 제공할 수 있습니다. RSS 피드는 안정적이고 무료이며, Supabase의 무료 티어로 충분히 운영 가능합니다.