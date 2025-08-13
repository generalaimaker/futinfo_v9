# DeepL 번역 기능 설정 가이드

## 개요
뉴스 콘텐츠를 영어에서 한국어로 자동 번역하는 기능입니다. DeepL API를 사용하여 높은 품질의 번역을 제공합니다.

## 설정 방법

### 1. DeepL API 키 발급
1. [DeepL API](https://www.deepl.com/pro-api) 웹사이트 방문
2. 무료 계정 가입 (Free 플랜: 월 500,000자 무료)
3. API 키 발급

### 2. 환경 변수 설정
`.env.local` 파일에 API 키 추가:
```env
NEXT_PUBLIC_DEEPL_API_KEY=your-actual-deepl-api-key
```

### 3. 서버 재시작
```bash
npm run dev
```

## 기능 특징

### 자동 번역
- RSS 피드로 받은 영어 뉴스 제목과 설명을 자동으로 한국어로 번역
- 번역된 콘텐츠는 24시간 동안 캐싱되어 API 호출 최적화

### UI 표시
- 번역된 콘텐츠는 "번역됨" 배지로 표시
- 원문 보기 옵션 제공 (향후 구현 예정)

### 적용 범위
- 홈페이지 히어로 캐러셀의 뉴스 슬라이드
- 뉴스 목록 페이지
- 뉴스 상세 페이지

## 코드 구조

### 번역 서비스
`/lib/services/translation.ts`
- DeepL API 통합
- 캐싱 시스템
- 배치 번역 지원

### 뉴스 데이터 페칭
`/lib/supabase/news.ts`
- 번역 옵션 포함된 뉴스 페칭
- 자동 번역 적용 (기본값: 활성화)

## 사용 예시

```typescript
// 번역이 적용된 뉴스 가져오기 (기본)
const { data: newsData } = useNews({ category: 'all' })

// 번역 비활성화
const { data: newsData } = fetchNews({ 
  category: 'all', 
  translate: false 
})
```

## 주의사항

1. **API 한도**: DeepL Free 플랜은 월 500,000자 제한
2. **캐싱**: 24시간 캐시로 API 호출 최적화
3. **에러 처리**: 번역 실패 시 원문 표시

## 문제 해결

### API 키가 작동하지 않는 경우
1. `.env.local` 파일 확인
2. 서버 재시작
3. 브라우저 개발자 콘솔에서 경고 메시지 확인

### 번역이 표시되지 않는 경우
- 브라우저 콘솔에서 "DeepL API key not configured" 메시지 확인
- API 키가 올바르게 설정되었는지 확인

## 테스트 방법

### API 키 테스트
```bash
# 테스트 스크립트 실행
node scripts/test-translation.js
```

테스트 스크립트를 실행하기 전에 `scripts/test-translation.js` 파일의 API 키를 실제 키로 교체하세요.

## 향후 개선 사항
- [ ] 원문/번역 토글 버튼
- [ ] 사용자별 번역 언어 설정
- [ ] 더 많은 콘텐츠 타입 번역 지원