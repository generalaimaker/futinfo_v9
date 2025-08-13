# 🚀 Vercel 배포 가이드

## 환경변수 설정 (Vercel Dashboard)

Vercel 프로젝트 Settings > Environment Variables에 추가:

### 필수 환경변수
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM

# API Keys
NEXT_PUBLIC_RAPIDAPI_KEY=bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4
NEXT_PUBLIC_DEEPL_API_KEY=75869dbd-a539-4026-95f6-997bdce5d232:fx
NEXT_PUBLIC_BRAVE_SEARCH_API_KEY=BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

## Supabase Edge Functions 설정

### 1. Supabase Dashboard에서:
1. Functions 탭으로 이동
2. 환경변수 추가:
   - `BRAVE_SEARCH_API_KEY=BSAuVeLxuIcPZLNrftU6XXkXRzj7QXT`
   - `DEEPL_API_KEY=75869dbd-a539-4026-95f6-997bdce5d232:fx`

### 2. Cron Jobs 설정:
SQL Editor에서 실행:
```sql
-- 5분마다 뉴스 수집
SELECT cron.schedule(
  'collect-news',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-collector-enhanced',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- 30분마다 번역
SELECT cron.schedule(
  'translate-news',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://uutmymaxkkytibuiiaax.supabase.co/functions/v1/news-translator',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{"languages": ["ko", "es", "de", "fr", "it", "pt"]}'::jsonb
  ) AS request_id;
  $$
);

-- 매일 자정 오래된 뉴스 정리
SELECT cron.schedule(
  'cleanup-old-news',
  '0 0 * * *',
  $$
  SELECT cleanup_old_news();
  $$
);
```

## 배포 체크리스트

### ✅ 배포 전 확인
- [ ] 환경변수 설정 완료
- [ ] Supabase Edge Functions 배포
- [ ] RLS 정책 활성화
- [ ] 데이터베이스 마이그레이션 완료

### ✅ 배포 후 확인
- [ ] 뉴스 페이지 로딩 확인
- [ ] 검색 기능 테스트
- [ ] 번역 기능 확인
- [ ] 5분 후 자동 수집 확인

## 주요 기능

### 🔥 새로운 기능들
1. **5분마다 자동 뉴스 수집**
   - RSS + Brave Search 하이브리드
   - 60개 이상 팀 커버리지
   - 중복 자동 제거

2. **실시간 뉴스 검색**
   - Brave Search API 통합
   - 팀/선수/이벤트 검색
   - 신뢰도 점수 표시

3. **자동 번역**
   - DeepL API 통합
   - 6개 언어 지원
   - 캐싱으로 비용 절감

4. **개인화**
   - 사용자 선호 팀/리그
   - 맞춤 뉴스 피드
   - 언어 설정

## 문제 해결

### API 키 관련
- Vercel 환경변수에 정확히 입력
- `NEXT_PUBLIC_` 접두사 확인

### Supabase 연결
- Service Role Key는 서버사이드만
- Anon Key는 클라이언트용

### 빌드 에러
- `npm run build` 로컬 테스트
- TypeScript 에러 확인