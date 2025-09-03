# 뉴스 시스템 설정 가이드

## 🎯 시스템 개요
- **RSS 피드 기반** 뉴스 수집 (무료)
- **Azure Translator** 번역 (Free Tier 사용 가능)
- **수동 번역 트리거** (선택한 기사만 번역)

## 📦 Edge Functions

### 1. news-collector-rss
RSS 피드에서 뉴스를 수집합니다.

**주요 기능:**
- 10개+ 주요 축구 미디어 RSS 피드 수집
- 중복 제거
- 카테고리 자동 분류 (general, transfer, injury, match)
- 신뢰도 점수 계산

**RSS 피드 소스 (무료):**
- BBC Sport, Sky Sports, The Guardian
- ESPN, Goal.com
- Premier League, UEFA 공식
- 주요 팀 공식 피드

### 2. news-translator
선택한 기사를 Azure Translator로 번역합니다.

**주요 기능:**
- 수동 번역 (자동 아님)
- 선택한 기사 ID만 번역
- 한국어 기본, 다국어 지원
- 배치 처리 최적화

## 🔧 환경 변수 설정

### Supabase Dashboard에서 설정

1. **프로젝트 설정** → **Edge Functions** → **Secrets** 이동

2. 다음 환경 변수 추가:

```bash
# Azure Translator (필수)
AZURE_TRANSLATOR_KEY=your-azure-key-here
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
AZURE_TRANSLATOR_REGION=koreacentral

# Supabase (자동 설정됨)
SUPABASE_URL=자동
SUPABASE_SERVICE_ROLE_KEY=자동
```

### Azure Portal에서 키 가져오기

1. Azure Portal 로그인
2. **Build-UP** 리소스 그룹 → Translator 리소스 선택
3. **Keys and Endpoint** 메뉴에서:
   - `KEY 1` 또는 `KEY 2` 복사 → `AZURE_TRANSLATOR_KEY`
   - `Text Translation` 엔드포인트 확인

## 🚀 배포 명령어

```bash
# RSS 뉴스 수집기 배포
supabase functions deploy news-collector-rss

# Azure 번역기 배포
supabase functions deploy news-translator
```

## 📱 사용 방법

### 1. RSS 뉴스 수집 (수동 실행)

```javascript
// 클라이언트에서 호출
const { data, error } = await supabase.functions.invoke('news-collector-rss')
```

### 2. 선택한 기사 번역

```javascript
// 특정 기사들만 한국어로 번역
const { data, error } = await supabase.functions.invoke('news-translator', {
  body: {
    articleIds: ['article-id-1', 'article-id-2'],  // 필수: 번역할 기사 ID들
    languages: ['ko']  // 옵션: 기본값은 한국어만
  }
})
```

## 📊 데이터베이스 구조

```sql
-- news_articles 테이블
CREATE TABLE news_articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT,
  source_tier INTEGER,  -- 1: 최고 신뢰도, 2: 중간, 3: 일반
  trust_score DECIMAL,   -- 0.0 ~ 1.0
  category TEXT,         -- general, transfer, injury, match
  tags TEXT[],
  translations JSONB,    -- {"ko": {"title": "...", "description": "..."}}
  image_url TEXT,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_breaking BOOLEAN DEFAULT false
);
```

## 💰 비용 관리

### RSS 피드 (무료)
- 모든 RSS 피드는 무료 공개 피드
- 제한 없음

### Azure Translator (Free Tier)
- **무료 한도**: 월 2백만 문자
- **예상 사용량**: 
  - 기사당 평균 500자
  - 월 4,000개 기사 번역 가능
- **비용 절감 팁**:
  - 중요한 기사만 선택적 번역
  - 제목만 번역 옵션 추가 가능

## 🔍 모니터링

### Supabase Dashboard
1. **Functions** → 실행 로그 확인
2. **Database** → news_articles 테이블 확인

### 에러 처리
- RSS 피드 접근 실패 시 다음 피드로 진행
- 번역 실패 시 원문 유지
- 모든 에러는 로그에 기록

## 📝 주의사항

1. **번역은 수동 트리거만 지원** (자동 번역 없음)
2. **RSS 피드 추가/제거**는 `news-collector-rss/index.ts`에서 수정
3. **Azure 키는 절대 공개하지 마세요**
4. **Free Tier 한도 모니터링 필요**

## 🆘 문제 해결

### RSS 수집 안됨
- RSS 피드 URL 확인
- CORS 정책 확인
- 피드 형식 호환성 확인

### 번역 안됨
- Azure 키 확인
- 리전 설정 확인 (koreacentral)
- 월 한도 초과 여부 확인

### DB 저장 실패
- 테이블 스키마 확인
- RLS 정책 확인
- Service Role Key 권한 확인