# ⚽ FutInfo 유럽축구 뉴스 수집 시스템 아키텍처

## 📊 시스템 개요

월 3000개 무료 쿼리를 활용한 스마트 뉴스 수집 시스템
- **Brave Search API**: 월 2000회 (실시간 속보)
- **News API**: 월 1000회 (24시간 지연, 분석 기사)
- **번역**: OpenAI GPT-4o mini (고품질 한국어 번역)

## 🔄 전체 플로우

```
[Brave Search API] ──┐
   (실시간 뉴스)      │
                     ├──> [news_articles DB] ──> [GPT-4o 번역] ──> [관리자 선택] ──> [홈페이지 표시]
[News API] ─────────┘         │                      │                 │
   (분석 기사)                 │                      │                 ├─> 배너 뉴스 (1개)
                              │                      │                 └─> 주요 뉴스 (5개)
                              │                      │
                              └─> 중복 제거         └─> 한국어 번역
                                  우선순위 설정          (제목/설명만)
```

## 📡 1. 데이터 수집 (Edge Functions)

### Brave Search Collector (`/supabase/functions/brave-news-collector`)
- **쿼터**: 일 53회, 월 2000회
- **특징**: 실시간성 강점, 최신 이적/경기/루머
- **키워드 전략**:
  ```typescript
  - 리그: Premier League, La Liga, Champions League, Serie A, Bundesliga
  - 빅클럽: Man United, Liverpool, Real Madrid, Barcelona, Bayern, PSG
  - 한국선수: 손흥민, 이강인, 김민재
  - 시간대별: 경기중(live score), 경기후(highlights), 오전(analysis)
  ```

### News API Collector (`/supabase/functions/newsapi-collector`)
- **쿼터**: 일 30회, 월 1000회
- **특징**: 24시간 지연, 심층 분석/리뷰
- **키워드 전략**:
  ```typescript
  - 어제 경기: "Manchester United vs Liverpool"
  - 전술 분석: "Guardiola tactics", "Klopp strategy"
  - 선수 특집: "Haaland goal record", "Bellingham impact"
  ```

## 🗄️ 2. 데이터베이스 구조

### news_articles 테이블
```sql
- id: UUID
- title: 제목
- description: 설명
- url: 기사 URL
- image_url: 이미지
- source: 출처
- source_tier: 신뢰도 등급 (1-3)
- category: 카테고리 (transfer/match/injury/analysis)
- tags: 태그 배열
- published_at: 발행일
- trust_score: 신뢰도 점수 (0-100)
- importance_score: 중요도 점수 (0-100)
- display_type: 표시 유형 (null/banner/featured)
- priority: 우선순위 (1-5, featured용)
- translations: JSONB (한국어 번역)
  {
    "ko": {
      "title": "번역된 제목",
      "description": "번역된 설명",
      "translated_at": "2025-09-03T..."
    }
  }
```

### api_usage_tracking 테이블
```sql
- api_name: API 이름 (brave_search/newsapi)
- date: 날짜
- requests_count: 사용 횟수
- daily_limit: 일일 제한
- monthly_limit: 월 제한
- keywords_searched: 검색한 키워드 배열
- last_search_time: 마지막 검색 시간
```

## 🌐 3. 번역 시스템

### Simple Translator (`/supabase/functions/simple-translator`)
- **엔진**: OpenAI GPT-4o mini
- **특징**: 
  - 축구 전문 용어 정확 번역
  - 한국 미디어 표준 용어 사용 (프리미어리그, 챔피언스리그 등)
  - Google Translate 폴백 지원
- **프롬프트**:
  ```
  "You are a professional sports journalist translator. 
   Translate the following English football news text to Korean. 
   Keep player names, team names in their commonly used form in Korean media."
  ```

## 👨‍💼 4. 관리자 페이지 (`/web/app/admin/news`)

### 뉴스 선택 시스템
- **배너 뉴스**: 홈페이지 상단 캐러셀에 표시 (1개)
- **주요 뉴스**: 홈페이지 뉴스 섹션에 표시 (5개, 순서 조정 가능)
- **기능**:
  - 실시간 뉴스 수집 (Brave/NewsAPI 버튼)
  - 선택한 뉴스 한국어 번역
  - 주요 뉴스 순서 변경 (위/아래 화살표)
  - API 사용량 모니터링

## 🏠 5. 홈페이지 표시

### EnhancedHeroCarousel (`/web/components/home/EnhancedHeroCarousel.tsx`)
- 배너 뉴스를 Breaking News 슬라이드로 표시
- 전체 화면 배경 이미지
- 한국어 번역 제목/설명 표시

### NewsSection (`/web/components/home/NewsSection.tsx`)
- 주요 뉴스 5개 표시 (priority 순서)
- 한국어 번역 우선 표시
- 번역됨 배지 표시

## 📈 6. 스마트 수집 전략

### 시간대별 최적화 (KST 기준)
```
오전 9-12시: 전날 경기 리뷰 (News API)
오후 1-6시: 이적 루머, 팀 소식 (Brave)
저녁 7-11시: 한국 선수 소식 우선 (Brave)
새벽 12-4시: 실시간 경기 (Brave 집중)
```

### 신뢰도 기반 우선순위
```
Tier 1 (95점): BBC, Guardian, Athletic, Sky Sports
Tier 2 (85점): ESPN, Goal.com, Transfermarkt
Tier 3 (60점): Mirror, Sun, Daily Mail
```

### 중요도 스코어링
```
90점: 이적 확정 (transfer, signs, deal)
85점: 경기 결과 (goal, win, defeat)
75점: 부상 소식 (injury, sidelined)
70점: 전술 분석 (analysis, tactics)
```

## 🔧 7. 개선 가능 영역

### 현재 구현 완료
- ✅ Brave Search + News API 통합
- ✅ GPT-4o mini 번역
- ✅ 관리자 선택 시스템
- ✅ 홈페이지 표시
- ✅ API 사용량 추적

### 추가 가능 기능
- ⏳ 자동 스케줄링 (Cron)
- ⏳ 팀별 구독 시스템
- ⏳ 푸시 알림
- ⏳ 뉴스 요약 생성
- ⏳ 사용자 선호도 학습

## 📝 월간 쿼리 분배 계획

```
총 3000 쿼리/월

Brave Search (2000/월):
- 평일: 40회/일 × 22일 = 880회
- 주말: 60회/일 × 8일 = 480회
- 경기일 추가: 640회
- 여유분: ~100회

News API (1000/월):
- 일 30회 × 30일 = 900회
- 여유분: 100회
```

## 🚀 실행 명령어

```bash
# Edge Functions 배포
supabase functions deploy brave-news-collector
supabase functions deploy newsapi-collector
supabase functions deploy simple-translator

# 환경 변수 설정
supabase secrets set BRAVE_API_KEY=your_key
supabase secrets set NEWS_API_KEY=your_key
supabase secrets set OPENAI_API_KEY=your_key

# 로컬 개발
npm run dev
```

## 📊 모니터링

관리자 페이지에서 실시간 확인:
- API 사용량: "Brave: 23/53" 형태로 표시
- 수집 결과: "29개 뉴스 수집, 15개 신규 저장"
- 번역 상태: "5개 기사 번역 완료"