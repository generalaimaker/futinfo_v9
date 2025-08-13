# Vercel 배포 환경 변수 설정 가이드

## 개요
FutInfo v6를 Vercel에 배포할 때 필요한 환경 변수 설정 가이드입니다.

## Vercel 환경 변수 설정

### 1. Vercel 대시보드 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 로그인
2. 해당 프로젝트 선택
3. Settings 탭 클릭
4. Environment Variables 메뉴 선택

### 2. 필수 환경 변수 추가

다음 환경 변수들을 추가하세요:

```env
# Supabase Configuration (필수)
NEXT_PUBLIC_SUPABASE_URL=https://uutmymaxkkytibuiiaax.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dG15bWF4a2t5dGlidWlpYWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzUsImV4cCI6MjA2NzQ3MjMzNX0.-sR7UF1Lj1cZ3fy6ScWaLViV_d5aU2PoT7UCpf3XlBM

# Site Configuration (필수)
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app

# RapidAPI Configuration (필수)
NEXT_PUBLIC_RAPIDAPI_KEY=bd09a1efecmshf47e95710709f44p1dcafdjsn072eabc66aa4

# DeepL API Configuration (필수 - 번역 기능)
NEXT_PUBLIC_DEEPL_API_KEY=75869dbd-a539-4026-95f6-997bdce5d232:fx
```

### 3. 환경별 설정
Vercel에서는 환경별로 다른 값을 설정할 수 있습니다:
- **Production**: 실제 서비스 환경
- **Preview**: PR 및 브랜치 배포 환경
- **Development**: 개발 환경

모든 환경에 동일한 값을 사용하려면 모든 체크박스를 선택하세요.

### 4. 배포 트리거
환경 변수를 추가/수정한 후:
1. Save 버튼 클릭
2. 자동으로 재배포가 트리거됩니다
3. 또는 Deployments 탭에서 수동으로 Redeploy 클릭

## 번역 기능 설정

### DeepL API 키 발급 (이미 설정됨)
현재 프로젝트에 DeepL API 키가 설정되어 있습니다.
추가 키가 필요한 경우:
1. [DeepL API](https://www.deepl.com/pro-api) 접속
2. 무료 계정 가입 (월 500,000자 무료)
3. API 키 발급

### 지원 언어
- 한국어 (ko) - 기본값
- 영어 (en)
- 일본어 (ja)
- 중국어 (zh)
- 스페인어 (es)

## 데이터베이스 설정

### Supabase 테이블 구조
```sql
-- user_preferences 테이블 (언어 설정 저장)
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  language VARCHAR(5) DEFAULT 'ko',
  auto_translate BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);
```

## 기능 확인사항

### 번역 기능
1. 사용자가 로그인하지 않아도 언어 설정 가능 (로컬 스토리지 사용)
2. 로그인 시 Supabase에 설정 저장
3. 뉴스 자동 번역 (영어 → 선택 언어)
4. 캐싱으로 API 호출 최적화 (24시간)

### 사용자 경험
- 설정 페이지에서 언어 변경 가능
- 번역된 콘텐츠는 "번역됨" 배지로 표시
- 자동 번역 on/off 토글 가능

## 배포 체크리스트

- [ ] Vercel 환경 변수 설정 완료
- [ ] DeepL API 키 확인
- [ ] Supabase URL 및 키 확인
- [ ] RapidAPI 키 확인
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 번역 기능 테스트
- [ ] 언어 설정 UI 테스트

## 문제 해결

### 번역이 작동하지 않는 경우
1. Vercel 환경 변수 확인
2. DeepL API 키 유효성 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 환경 변수가 적용되지 않는 경우
1. Vercel 대시보드에서 재배포
2. 브라우저 캐시 삭제
3. 환경 변수 이름이 `NEXT_PUBLIC_`로 시작하는지 확인

## 모니터링

### Vercel Analytics
- 실시간 트래픽 모니터링
- 에러 로그 확인
- 성능 메트릭 분석

### DeepL API 사용량
- DeepL 대시보드에서 사용량 확인
- 무료 플랜: 월 500,000자
- 초과 시 유료 플랜 업그레이드 필요